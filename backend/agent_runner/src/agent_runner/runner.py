"""Main runner logic for processing jobs"""
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from .config import Config
from .db import Database
from .job_claim import claim_pending_job
from .workspace import Workspace
from .spec_builder import build_spec, write_spec
from .instructions_builder import build_instructions, write_instructions
from .cline_client import run_cline, ClineNotFoundError
from .gemini_fallback import GeminiFallback
from .git_client import GitClient
from .utils import LogBuffer, truncate_logs, format_exception, sanitize_log_line

logger = logging.getLogger(__name__)


class JobRunner:
    """Main runner for processing jobs"""
    
    def __init__(self):
        self.db = Database
        self.gemini_fallback = GeminiFallback()
        self.running = False
    
    async def initialize(self) -> None:
        """Initialize runner (connect to database)"""
        await self.db.connect()
        logger.info("JobRunner initialized")
    
    async def shutdown(self) -> None:
        """Shutdown runner (disconnect from database)"""
        self.running = False
        await self.db.disconnect()
        logger.info("JobRunner shutdown")
    
    async def run_loop(self) -> None:
        """Main polling loop"""
        self.running = True
        logger.info("Starting job runner loop")
        
        while self.running:
            try:
                # Claim a pending job
                job = await claim_pending_job()
                
                if job:
                    # Process the job
                    await self.process_job(job)
                else:
                    # No pending jobs, sleep
                    await asyncio.sleep(Config.RUNNER_POLL_SECONDS)
                    
            except KeyboardInterrupt:
                logger.info("Received interrupt, shutting down...")
                self.running = False
                break
            except Exception as e:
                logger.error(f"Error in run loop: {e}")
                await asyncio.sleep(Config.RUNNER_POLL_SECONDS)
    
    async def process_job(self, job: Dict[str, Any]) -> None:
        """Process a single job"""
        job_id = job["_id"]
        workspace = Workspace(job_id)
        log_buffer = LogBuffer()
        
        # Set up log flushing - create task synchronously
        def flush_logs_sync(log_lines: list[str]) -> None:
            asyncio.create_task(self.append_logs(job_id, log_lines))
        
        log_buffer.set_flush_callback(flush_logs_sync)
        
        try:
            log_buffer.append(f"Processing job {job_id}")
            
            # Create workspace
            workspace.create()
            log_buffer.append("Created workspace")
            
            # Write architecture_spec.json
            architecture_spec = job.get("architecture_spec", {})
            spec_path = workspace.get_architecture_spec_path()
            with open(spec_path, "w", encoding="utf-8") as f:
                json.dump(architecture_spec, f, indent=2)
            
            # Get project for repo URL
            project = await self.get_project(job.get("projectId"))
            if not project:
                raise ValueError(f"Project not found for job {job_id}")
            
            project_name = project.get("name", "Generated Project")
            repo_url = project.get("githubRepoUrl") or project.get("repository_url")
            
            # Build spec.json
            log_buffer.append("Building spec.json")
            spec = build_spec(architecture_spec, project_name)
            write_spec(spec, workspace.get_spec_path())
            
            # Build instructions.md
            log_buffer.append("Building instructions.md")
            instructions = build_instructions(spec, repo_dir="repo")
            write_instructions(instructions, workspace.get_instructions_path())
            
            # Run code generation
            log_buffer.append("Starting code generation")
            await self.generate_code(
                workspace,
                log_buffer
            )
            
            # Validate output
            log_buffer.append("Validating generated code")
            if not self.validate_output(workspace.repo_dir):
                raise ValueError("Generated code validation failed")
            
            # Initialize Git and commit
            log_buffer.append("Initializing Git repository")
            git_client = GitClient(workspace.repo_dir)
            git_client.init_repo()
            
            commit_message = f"Generated code for {project_name} via Architex"
            commit_sha = git_client.commit_all(commit_message)
            log_buffer.append(f"Committed changes: {commit_sha[:8]}")
            
            # Push to GitHub if configured
            push_skipped = False
            if repo_url and Config.GITHUB_TOKEN:
                log_buffer.append(f"Pushing to GitHub: {sanitize_log_line(repo_url)}")
                git_client.set_remote(repo_url, Config.GITHUB_TOKEN)
                
                if git_client.push():
                    log_buffer.append("Successfully pushed to GitHub")
                else:
                    log_buffer.append("Git push failed, but commit was created")
                    push_skipped = True
            else:
                log_buffer.append("Skipping push (no repo URL or token)")
                push_skipped = True
            
            # Mark job as done
            log_buffer.flush()  # Ensure all logs are flushed
            await self.mark_job_done(
                job_id,
                commit_sha=commit_sha,
                repo_url=repo_url or "",
                push_skipped=push_skipped
            )
            
            log_buffer.append("Job completed successfully")
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            error_message = format_exception(e, include_traceback=True)
            log_buffer.append(f"Error: {error_message}")
            log_buffer.flush()
            
            await self.mark_job_failed(job_id, str(e))
        finally:
            # Cleanup workspace (optional - may want to keep for debugging)
            # workspace.cleanup()
            pass
    
    async def generate_code(self, workspace: Workspace, log_buffer: LogBuffer) -> None:
        """Generate code using Cline or fallback"""
        repo_dir = workspace.repo_dir
        instructions_path = workspace.get_instructions_path()
        
        def on_line(line: str) -> None:
            log_buffer.append(f"[codegen] {sanitize_log_line(line)}")
        
        # Try Cline first
        if Config.CLINE_ENABLED:
            try:
                env = {}
                if Config.GOOGLE_GEMINI_API_KEY:
                    env["GOOGLE_GEMINI_API_KEY"] = Config.GOOGLE_GEMINI_API_KEY
                
                exit_code = run_cline(repo_dir, instructions_path, env=env, on_line=on_line)
                
                if exit_code == 0:
                    log_buffer.append("Cline code generation completed successfully")
                    return
                else:
                    log_buffer.append(f"Cline exited with code {exit_code}, using fallback")
                    
            except ClineNotFoundError:
                log_buffer.append("Cline not available, using Gemini fallback")
            except Exception as e:
                log_buffer.append(f"Cline error: {str(e)}, using fallback")
        
        # Fallback to Gemini
        await self.gemini_fallback.generate_code(
            repo_dir,
            workspace.get_spec_path(),
            instructions_path,
            on_line
        )
    
    def validate_output(self, repo_dir: Path) -> bool:
        """Validate generated code output"""
        if not repo_dir.exists():
            logger.error("Repository directory does not exist")
            return False
        
        # Check for README.md
        readme_path = repo_dir / "README.md"
        if not readme_path.exists():
            logger.error("README.md not found")
            return False
        
        # Check for at least one other file (excluding .git)
        files = [
            f for f in repo_dir.rglob("*")
            if f.is_file() and ".git" not in str(f)
        ]
        
        if len(files) < 2:  # README.md + at least one other file
            logger.error(f"Insufficient files generated: {len(files)}")
            return False
        
        return True
    
    async def get_project(self, project_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Get project by ID"""
        if not project_id:
            return None
        
        db = Database.get_database()
        projects_collection = db.projects
        project = await projects_collection.find_one({"_id": project_id})
        return project
    
    async def append_logs(self, job_id: str, log_lines: list[str]) -> None:
        """Append logs to job in MongoDB"""
        try:
            db = Database.get_database()
            jobs_collection = db.jobs
            
            # Get current logs
            job = await jobs_collection.find_one({"_id": job_id})
            current_logs = job.get("logs", []) if job else []
            
            # Append new logs
            new_logs = current_logs + log_lines
            
            # Truncate to max lines
            new_logs = truncate_logs(new_logs, max_lines=500)
            
            # Update job
            await jobs_collection.update_one(
                {"_id": job_id},
                {"$set": {"logs": new_logs, "updated_at": datetime.utcnow()}}
            )
        except Exception as e:
            logger.error(f"Failed to append logs for job {job_id}: {e}")
    
    async def mark_job_done(
        self,
        job_id: str,
        commit_sha: str = "",
        repo_url: str = "",
        push_skipped: bool = False
    ) -> None:
        """Mark job as done in MongoDB"""
        db = Database.get_database()
        jobs_collection = db.jobs
        
        metadata = {
            "commitSha": commit_sha,
            "repoUrl": repo_url,
        }
        
        if push_skipped:
            metadata["pushSkipped"] = True
        
        await jobs_collection.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "done",
                    "finishedAt": datetime.utcnow(),
                    "metadata": metadata,
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        
        logger.info(f"Job {job_id} marked as done")
    
    async def mark_job_failed(self, job_id: str, error: str) -> None:
        """Mark job as failed in MongoDB"""
        db = Database.get_database()
        jobs_collection = db.jobs
        
        await jobs_collection.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "finishedAt": datetime.utcnow(),
                    "error": sanitize_log_line(error),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        
        logger.info(f"Job {job_id} marked as failed: {error}")
