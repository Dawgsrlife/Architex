"""
Async Job Worker Service
Handles background processing of architecture generation jobs
"""

import logging
import os
import shutil
import subprocess
from typing import Dict, Any
from datetime import datetime
from pathlib import Path

from services.gemini import gemini_service
from services.github import get_github_service
from services.cline import cline_service
from services.socket_manager import socket_manager
from database.mongodb import MongoDB

logger = logging.getLogger(__name__)

class JobWorker:
    """Async worker for processing architecture generation jobs"""
    
    def __init__(self):
        self.workspace_base = Path("/tmp/architex_jobs")
        self.workspace_base.mkdir(exist_ok=True)
    
    async def process_job(self, job_id: str, db: MongoDB):
        """
        Process the job using the Agent Runner (Cline)
        """
        try:
            logger.info(f"Processing job {job_id}")
            
            # Fetch job
            job = await db.jobs.find_one({"_id": job_id})
            if not job:
                logger.error(f"Job {job_id} not found")
                return
            
            # Update status to running
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "generating", "updated_at": datetime.utcnow()}}
            )
            await socket_manager.emit_status("generating", job_id)
            await self._emit_log(job_id, "Starting Agent Runner...", db)
            
            # Create workspace
            workspace_path = self.workspace_base / job_id
            if workspace_path.exists():
                shutil.rmtree(workspace_path)
            workspace_path.mkdir(parents=True, exist_ok=True)
            
            # Initialize git repo immediately
            self._init_git_repo(workspace_path)
            
            # Run Agent Loop
            architecture_spec = job.get("architecture_spec", {})
            success = await cline_service.run_agent(job_id, workspace_path, architecture_spec)
            
            if not success:
                raise Exception("Agent failed to complete the task.")
                
            await self._emit_log(job_id, "Agent completed coding task.", db)
            
            # Execution / Push Phase
            await self._emit_log(job_id, "Committing code...", db)
            
            # Get user for git auth
            user = await db.users.find_one({"_id": job["user_id"]})
            if not user:
                raise Exception("User not found")
                
            # Commit
            self._commit_changes(workspace_path, "Initial generation by Architex Agent")
            
            # Push if repo url exists
            project_id = job.get("project_id")
            if project_id:
                project = await db.projects.find_one({"_id": project_id})
                if project and project.get("repository_url"):
                    await self._emit_log(job_id, f"Pushing to {project['repository_url']}...", db)
                    self._push_to_github(
                        workspace_path,
                        project["repository_url"],
                        user["github_access_token"]
                    )
                    
                    await db.projects.update_one(
                        {"_id": project_id},
                        {"$set": {"status": "done", "last_updated": datetime.utcnow()}}
                    )

            # Mark Job as Done
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "done", "completed_at": datetime.utcnow()}}
            )
            await socket_manager.emit_status("done", job_id)
            await self._emit_log(job_id, "Job finished successfully!", db)
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {str(e)}")
            await socket_manager.emit_status("failed", job_id)
            await self._emit_log(job_id, f"Job failed: {str(e)}", db)
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "failed", "error": str(e)}}
            )

    # execute_plan method is no longer needed in this flow, but keeping a stub or removing it would be cleaner. 
    # For now, I'm removing it to avoid confusion as I'm replacing the file content block.

    
    def _init_git_repo(self, workspace_path: Path):
        """Initialize a fresh git repository"""
        subprocess.run(
            ["git", "init"],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
        subprocess.run(
            ["git", "config", "user.name", "Architex Bot"],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
        subprocess.run(
            ["git", "config", "user.email", "bot@architex.dev"],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
    
    async def _emit_log(self, job_id: str, message: str, db):
        """Emit log to socket and persist to database"""
        try:
            timestamp = datetime.utcnow().isoformat()
            log_entry = {"timestamp": timestamp, "message": message}
            
            logger.info(f"[Job {job_id}] {message}")
            
            # Emit via socket
            await socket_manager.emit_log(message, job_id)
            
            # Persist to DB
            await db.jobs.update_one(
                {"_id": job_id},
                {"$push": {"logs": log_entry}}
            )
        except Exception as e:
            logger.error(f"Failed to emit/persist log: {e}")
    

    
    def _commit_changes(self, workspace_path: Path, message: str):
        """Commit all changes in the workspace"""
        subprocess.run(
            ["git", "add", "."],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
    
    def _push_to_github(self, workspace_path: Path, repository_url: str, access_token: str):
        """Push generated code to GitHub repository"""
        
        # Add authentication to repository URL
        if repository_url.startswith("https://github.com/"):
            auth_url = repository_url.replace(
                "https://github.com/",
                f"https://{access_token}@github.com/"
            )
        else:
            auth_url = repository_url
        
        # Add remote
        subprocess.run(
            ["git", "remote", "add", "origin", auth_url],
            cwd=workspace_path,
            capture_output=True
        )
        
        # Push to main branch
        subprocess.run(
            ["git", "push", "-u", "origin", "main"],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
    
    def _count_files(self, workspace_path: Path) -> int:
        """Count generated files in workspace"""
        return sum(1 for _ in workspace_path.rglob("*") if _.is_file())

# Global worker instance
job_worker = JobWorker()
