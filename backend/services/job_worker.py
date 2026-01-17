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
from database.mongo import get_db
from repos import jobs_repo, users_repo, projects_repo
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)

class JobWorker:
    """Async worker for processing architecture generation jobs"""
    
    def __init__(self):
        self.workspace_base = Path("/tmp/architex_jobs")
        self.workspace_base.mkdir(exist_ok=True)
    
    async def process_job(self, job_id: str, db):
        """
        Initial job processing: Generate architecture plan but wait for approval
        job_id is the jobId field (UUID string)
        """
        try:
            logger.info(f"Processing job {job_id}")
            
            # Fetch job - need userId, so query by jobId
            db_instance = get_db()
            job = await db_instance.jobs.find_one({"jobId": job_id})
            if not job:
                logger.error(f"Job {job_id} not found")
                return
            
            userId = job.get("userId")
            if not userId:
                logger.error(f"Job {job_id} missing userId")
                return
            
            # Update status to generating
            await jobs_repo.update_job_status(userId, job_id, "generating")
            await socket_manager.emit_status("generating", job_id)
            await self._emit_log(userId, job_id, "Analyzing architecture requirements...")
            
            # Run agent to generate code plan
            architecture_spec = job.get("architecture_spec", {})
            
            # Authorize operation via Cline
            authorized = await cline_service.authorize_operation(
                "generate_architecture",
                {"job_id": job_id, "spec": architecture_spec}
            )
            
            if not authorized:
                raise Exception("Operation not authorized by Cline")
            
            # Generate code using Gemini AI
            prompt = self._convert_graph_to_prompt(architecture_spec)
            await self._emit_log(userId, job_id, "Translating graph to prompt...")
            await self._emit_log(userId, job_id, "Consulting Gemini AI...")
            
            generated_content = await gemini_service.generate_architecture(prompt)
            
            # Parse the content to ensure it's valid, but don't write yet
            content_str = generated_content.get("architecture", "{}")
            if "```json" in content_str:
                content_str = content_str.split("```json")[1].split("```")[0]
            elif "```" in content_str:
                content_str = content_str.split("```")[1].split("```")[0]
                
            import json
            plan = json.loads(content_str)
            
            # Save the plan to the job and set status to waiting_review
            db_instance = get_db()
            await db_instance.jobs.update_one(
                {"jobId": job_id},
                {
                    "$set": {
                        "status": "waiting_review",
                        "updatedAt": get_utc_now(),
                        "generation_result": plan # Store the plan here
                    }
                }
            )
            
            await socket_manager.emit_status("waiting_review", job_id)
            await self._emit_log(userId, job_id, "Architecture generated. Waiting for approval.")
            await self._emit_log(userId, job_id, "REVIEW_REQUIRED") # Signal for frontend
            
        except Exception as e:
            logger.error(f"Job {job_id} generation failed: {str(e)}")
            await socket_manager.emit_status("failed", job_id)
            
            # Get userId for logging
            db_instance = get_db()
            job = await db_instance.jobs.find_one({"jobId": job_id})
            userId = job.get("userId") if job else None
            
            if userId:
                await self._emit_log(userId, job_id, f"Generation failed: {str(e)}")
                await jobs_repo.update_job_status(userId, job_id, "failed", error=str(e))

    async def execute_plan(self, job_id: str, db):
        """
        Execute the approved plan: Write files and push to Git
        job_id is the jobId field (UUID string)
        """
        try:
            db_instance = get_db()
            job = await db_instance.jobs.find_one({"jobId": job_id})
            if not job or not job.get("generation_result"):
                raise Exception("Job plan not found")

            userId = job.get("userId")
            if not userId:
                raise Exception("Job missing userId")

            # Update status
            await jobs_repo.update_job_status(userId, job_id, "executing")
            await socket_manager.emit_status("executing", job_id)
            await self._emit_log(userId, job_id, "Plan approved. Starting execution...")

            # Get user
            user = await users_repo.get_user(userId)
            if not user:
                raise Exception("User not found")

            # Create workspace
            workspace_path = self.workspace_base / job_id
            workspace_path.mkdir(exist_ok=True)
            
            # Initialize git
            self._init_git_repo(workspace_path)
            
            # Write files
            files_data = {"architecture": json.dumps(job["generation_result"])} # Wrap to match expected format of _write_generated_files
            self._write_generated_files(workspace_path, files_data, job.get("architecture_spec", {}))
            
            # Commit
            self._commit_changes(workspace_path, "Initial commit from Architex")
            await self._emit_log(userId, job_id, "Code committed to local git")
            
            # Push
            project_id = job.get("projectId")
            if project_id:
                project = await projects_repo.get_project(userId, project_id)
                if project and project.get("repository_url"):
                    await self._emit_log(userId, job_id, f"Pushing to {project['repository_url']}...")
                    self._push_to_github(
                        workspace_path,
                        project["repository_url"],
                        user["github_access_token"]
                    )
                    
                    await projects_repo.touch_project_last_updated(userId, project_id)

            # Complete
            await jobs_repo.update_job_status(userId, job_id, "done")
            await socket_manager.emit_status("done", job_id)
            await self._emit_log(userId, job_id, "Deployment complete!")

        except Exception as e:
            logger.error(f"Job {job_id} execution failed: {str(e)}")
            await socket_manager.emit_status("failed", job_id)
            
            # Get userId for logging
            db_instance = get_db()
            job = await db_instance.jobs.find_one({"jobId": job_id})
            userId = job.get("userId") if job else None
            
            if userId:
                await self._emit_log(userId, job_id, f"Execution failed: {str(e)}")
                await jobs_repo.update_job_status(userId, job_id, "failed", error=str(e))
            
            # Clean up
            if (self.workspace_base / job_id).exists():
                shutil.rmtree(self.workspace_base / job_id, ignore_errors=True)
    
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
    
    async def _run_agent(self, job_id: str, workspace_path: Path, architecture_spec: Dict[str, Any]):
        """
        Run the agentic AI (Cline orchestrated by Gemini) to generate code
        """
        logger.info(f"Running agent for job {job_id}")
        
        # Authorize operation via Cline
        authorized = await cline_service.authorize_operation(
            "generate_architecture",
            {"job_id": job_id, "spec": architecture_spec}
        )
        
        if not authorized:
            raise Exception("Operation not authorized by Cline")
        
        # Generate code using Gemini AI
        prompt = self._build_generation_prompt(architecture_spec)
        generated_content = await gemini_service.generate_architecture(prompt)
        
        # Write generated files to workspace
        self._write_generated_files(workspace_path, generated_content, architecture_spec)
        
        logger.info(f"Agent completed for job {job_id}")
    
    async def _emit_log(self, userId: str, job_id: str, message: str, level: str = "info"):
        """Emit log to socket and persist to database"""
        try:
            log_entry = {
                "ts": get_utc_now(),
                "level": level,
                "message": message
            }
            
            # Emit via socket
            await socket_manager.emit_log(message, job_id)
            
            # Persist to DB using repo
            await jobs_repo.append_job_logs(userId, job_id, [log_entry])
        except Exception as e:
            logger.error(f"Failed to emit/persist log: {e}")

    def _convert_graph_to_prompt(self, architecture_spec: Dict[str, Any]) -> str:
        """
        Convert the graph structure (nodes & edges) into a descriptive prompt for the LLM.
        This represents the 'Translator' logic.
        """
        nodes = architecture_spec.get("nodes", [])
        edges = architecture_spec.get("edges", [])
        
        # Build node descriptions
        node_descriptions = []
        node_map = {} # ID -> Label/Type map for edge resolution
        
        for node in nodes:
            node_id = node.get("id")
            data = node.get("data", {})
            label = data.get("label", "Unknown Component")
            framework = data.get("framework", "")
            node_type = node.get("type", "generic")
            
            desc = f"- Component '{label}' (Type: {node_type})"
            if framework:
                desc += f" using {framework}"
            
            node_descriptions.append(desc)
            node_map[node_id] = label

        # Build edge descriptions
        edge_descriptions = []
        for edge in edges:
            source_id = edge.get("source")
            target_id = edge.get("target")
            source_label = node_map.get(source_id, source_id)
            target_label = node_map.get(target_id, target_id)
            
            edge_descriptions.append(f"- '{source_label}' connects to '{target_label}'")
            
        description = architecture_spec.get("description", "No description provided.")
        
        prompt = f"""Generate a complete codebase for the following architecture based on this visual design:

Description: {description}

Architecture Components (Nodes):
{chr(10).join(node_descriptions)}

Connections (Edges):
{chr(10).join(edge_descriptions) if edge_descriptions else "- No explicit connections defined."}

Instructions:
1. Interpret the connections to understand the data flow (e.g., Frontend calling Backend API).
2. Generate a valid file structure reflecting this architecture.
3. Include all necessary configuration files (package.json, requirements.txt, Dockerfile, etc.).
4. Provide the output as a structured JSON file tree.
"""
        return prompt
    
    def _write_generated_files(self, workspace_path: Path, generated_content: Dict[str, Any], architecture_spec: Dict[str, Any]):
        """Write generated files to workspace"""
        
        try:
            # Extract JSON content
            content_str = generated_content.get("architecture", "{}")
            
            # Clean up markdown code blocks if present
            if "```json" in content_str:
                content_str = content_str.split("```json")[1].split("```")[0]
            elif "```" in content_str:
                content_str = content_str.split("```")[1].split("```")[0]
            
            import json
            data = json.loads(content_str)
            files = data.get("files", {})
            
            # Write each file
            for file_path, content in files.items():
                # Handle directory structure
                full_path = workspace_path / file_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Write content
                full_path.write_text(content, encoding="utf-8")
                
            # Create a basic README if not provided (fallback)
            if "README.md" not in files:
                readme_content = f"# {architecture_spec.get('name', 'Generated Project')}\n\n{architecture_spec.get('description', 'Generated by Architex')}"
                (workspace_path / "README.md").write_text(readme_content)
                
            # Write architecture specification as JSON for reference
            (workspace_path / "architex.json").write_text(
                json.dumps(architecture_spec, indent=2)
            )
            
            logger.info(f"Successfully generated {len(files)} files")
            
        except Exception as e:
            logger.error(f"Failed to parse or write generated files: {str(e)}")
            logger.error(f"Raw content: {generated_content.get('architecture')}")
            # Fallback to writing raw content to a file for debugging
            (workspace_path / "generation_error.log").write_text(str(e))
            (workspace_path / "raw_output.txt").write_text(generated_content.get("architecture", ""))
    
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
