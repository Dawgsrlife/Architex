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
        Initial job processing: Generate architecture plan but wait for approval
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
            await self._emit_log(job_id, "Analyzing architecture requirements...", db)
            
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
            await self._emit_log(job_id, "Translating graph to prompt...", db)
            await self._emit_log(job_id, "Consulting Gemini AI...", db)
            
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
            await db.jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": "waiting_review",
                        "updated_at": datetime.utcnow(),
                        "generation_result": plan # Store the plan here
                    }
                }
            )
            
            await socket_manager.emit_status("waiting_review", job_id)
            await self._emit_log(job_id, "Architecture generated. Waiting for approval.", db)
            await self._emit_log(job_id, "REVIEW_REQUIRED", db) # Signal for frontend
            
        except Exception as e:
            logger.error(f"Job {job_id} generation failed: {str(e)}")
            await socket_manager.emit_status("failed", job_id)
            await self._emit_log(job_id, f"Generation failed: {str(e)}", db)
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "failed", "error": str(e)}}
            )

    async def execute_plan(self, job_id: str, db: MongoDB):
        """
        Execute the approved plan: Write files and push to Git
        """
        try:
            job = await db.jobs.find_one({"_id": job_id})
            if not job or not job.get("generation_result"):
                raise Exception("Job plan not found")

            # Update status
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "executing", "updated_at": datetime.utcnow()}}
            )
            await socket_manager.emit_status("executing", job_id)
            await self._emit_log(job_id, "Plan approved. Starting execution...", db)

            # Get user
            user = await db.users.find_one({"_id": job["user_id"]})
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
            await self._emit_log(job_id, "Code committed to local git", db)
            
            # Push
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

            # Complete
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "done", "completed_at": datetime.utcnow()}}
            )
            await socket_manager.emit_status("done", job_id)
            await self._emit_log(job_id, "Deployment complete!", db)

        except Exception as e:
            logger.error(f"Job {job_id} execution failed: {str(e)}")
            await socket_manager.emit_status("failed", job_id)
            await self._emit_log(job_id, f"Execution failed: {str(e)}", db)
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": "failed", "error": str(e)}}
            )
            
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
    
    async def _emit_log(self, job_id: str, message: str, db: MongoDB):
        """Emit log to socket and persist to database"""
        try:
            timestamp = datetime.utcnow().isoformat()
            log_entry = {"timestamp": timestamp, "message": message}
            
            # Emit via socket
            await socket_manager.emit_log(message, job_id)
            
            # Persist to DB
            await db.jobs.update_one(
                {"_id": job_id},
                {"$push": {"logs": log_entry}}
            )
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
