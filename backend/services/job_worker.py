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
from database.mongodb import MongoDB

logger = logging.getLogger(__name__)

class JobWorker:
    """Async worker for processing architecture generation jobs"""
    
    def __init__(self):
        self.workspace_base = Path("/tmp/architex_jobs")
        self.workspace_base.mkdir(exist_ok=True)
    
    async def process_job(self, job_id: str, db: MongoDB):
        """
        Main job processing pipeline:
        1. Receive job
        2. Update status to running
        3. Run agent (Cline + Gemini)
        4. Commit and push to GitHub
        5. Update job status to done/failed
        """
        try:
            logger.info(f"Processing job {job_id}")
            
            # Fetch job from database
            job = await db.jobs.find_one({"_id": job_id})
            if not job:
                logger.error(f"Job {job_id} not found")
                return
            
            # Update job status to running
            await db.jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": "running",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Get user information
            user = await db.users.find_one({"_id": job["user_id"]})
            if not user:
                raise Exception("User not found")
            
            # Create workspace for this job
            workspace_path = self.workspace_base / job_id
            workspace_path.mkdir(exist_ok=True)
            
            # Initialize git repository
            self._init_git_repo(workspace_path)
            
            # Run agent to generate code
            architecture_spec = job.get("architecture_spec", {})
            await self._run_agent(job_id, workspace_path, architecture_spec)
            
            # Commit generated code
            self._commit_changes(workspace_path, "Generated architecture code")
            
            # Push to GitHub repository
            project_id = job.get("project_id")
            if project_id:
                project = await db.projects.find_one({"_id": project_id})
                if project and project.get("repository_url"):
                    self._push_to_github(
                        workspace_path,
                        project["repository_url"],
                        user["github_access_token"]
                    )
                    
                    # Update project
                    await db.projects.update_one(
                        {"_id": project_id},
                        {
                            "$set": {
                                "last_updated": datetime.utcnow(),
                                "job_id": job_id,
                                "status": "done"
                            }
                        }
                    )
            
            # Update job status to done
            await db.jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": "done",
                        "updated_at": datetime.utcnow(),
                        "completed_at": datetime.utcnow(),
                        "result": {
                            "workspace_path": str(workspace_path),
                            "files_generated": self._count_files(workspace_path)
                        }
                    }
                }
            )
            
            logger.info(f"Job {job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {str(e)}")
            
            # Update job status to failed
            await db.jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": "failed",
                        "updated_at": datetime.utcnow(),
                        "completed_at": datetime.utcnow(),
                        "error": str(e)
                    }
                }
            )
            
            # Update project if exists
            project_id = job.get("project_id")
            if project_id:
                await db.projects.update_one(
                    {"_id": project_id},
                    {
                        "$set": {
                            "status": "failed",
                            "last_updated": datetime.utcnow()
                        }
                    }
                )
        
        finally:
            # Clean up workspace
            workspace_path = self.workspace_base / job_id
            if workspace_path.exists():
                shutil.rmtree(workspace_path, ignore_errors=True)
    
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
    
    def _build_generation_prompt(self, architecture_spec: Dict[str, Any]) -> str:
        """Build prompt for Gemini AI based on architecture specification"""
        spec_description = architecture_spec.get("description", "")
        components = architecture_spec.get("components", [])
        frameworks = architecture_spec.get("frameworks", [])
        
        prompt = f"""Generate a complete codebase for the following architecture:

Description: {spec_description}

Components:
{chr(10).join(f"- {comp}" for comp in components)}

Frameworks/Technologies:
{chr(10).join(f"- {fw}" for fw in frameworks)}

Generate all necessary files including:
- Project structure
- Configuration files
- Source code
- Documentation

Provide the output as a structured file tree with content."""
        
        return prompt
    
    def _write_generated_files(self, workspace_path: Path, generated_content: str, architecture_spec: Dict[str, Any]):
        """Write generated files to workspace"""
        
        # Create basic project structure
        (workspace_path / "src").mkdir(exist_ok=True)
        (workspace_path / "docs").mkdir(exist_ok=True)
        
        # Write README
        readme_content = f"""# {architecture_spec.get('name', 'Generated Project')}

{architecture_spec.get('description', 'Generated by Architex')}

## Architecture

{generated_content}

## Getting Started

Follow the setup instructions to run this project.
"""
        (workspace_path / "README.md").write_text(readme_content)
        
        # Write architecture specification as JSON
        import json
        (workspace_path / "architex.json").write_text(
            json.dumps(architecture_spec, indent=2)
        )
        
        # Create sample source file
        (workspace_path / "src" / "main.py").write_text(
            "# Generated main file\nprint('Hello from Architex')\n"
        )
    
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
