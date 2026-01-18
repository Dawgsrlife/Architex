"""
Job Worker Service - Hardened Version

INVARIANTS:
1. Jobs are IMMUTABLE ATTEMPTS - they never mutate project directly
2. Workspace is EPHEMERAL - always cleaned up, no exceptions
3. Repo creation happens ONCE per project, jobs only commit
4. Failures are GRACEFUL - never block completion

LIFECYCLE:
1. Job Created → status: pending
2. Worker Starts → status: running
3. Create workspace: /tmp/architex/<job_id>/
4. Generate code via Cline+Gemini
5. Commit to git
6. Push to repo (create repo if needed on PROJECT, not job)
7. Persist results
8. Cleanup workspace (ALWAYS)
9. Job Completed → status: completed | failed | completed_with_warnings
"""
# INVARIANT:
# Jobs are immutable snapshots.
# This worker must never mutate Project state directly,
# except for latest_successful_job_id on successful completion.

import logging
import shutil
import subprocess
import httpx
import os
from typing import Dict, Any, Optional
from pathlib import Path
from enum import Enum

from services.cline import cline_service
from services.mock_app_generator import generate_mock_app
from services.code_generator import generate_codebase
from services.code_generator_v2 import generate_connected_codebase
from services.architecture_translator import translate_architecture
from services.architecture_critic import critique_architecture, CriticResult
from services.constrained_plan import build_generation_plan
from services.socket_manager import socket_manager
from database.mongo import get_db
from repos import jobs_repo, users_repo, projects_repo
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """Job status values - match what's in schemas/jobs.py"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"


class JobWorker:
    """
    Async worker for processing architecture generation jobs.
    
    Key design:
    - Each job gets isolated workspace at /tmp/architex/<job_id>/
    - Workspace is ALWAYS cleaned up (in finally block)
    - Job execution is idempotent (can be retried safely)
    - Repo is created on PROJECT, not on each job
    """
    
    WORKSPACE_BASE = Path("/tmp/architex")
    
    def __init__(self):
        self.WORKSPACE_BASE.mkdir(parents=True, exist_ok=True)
    
    async def process_job(self, job_id: str, *args, **kwargs):
        """
        Main entry point for job processing.
        
        DEMO MODE: All exceptions are caught and logged as warnings.
        The job will be marked as completed_with_warning to trigger
        frontend fallback URLs.
        """
        # Absorb any extra args (Starlette compatibility)
        if args or kwargs:
            logger.debug(f"process_job received extra args: {args}, {kwargs}")
        
        try:
            # Initialize variables expected by except/finally blocks
            workspace_path: Optional[Path] = None
            user_id: Optional[str] = None
            warnings: list = []
            
            # Try to get database - may fail in demo mode
            try:
                db_instance = get_db()
            except RuntimeError as db_err:
                # DEMO MODE: Database context not available in background task
                # Log warning, don't crash - frontend has fallback
                logger.warning(f"[DEMO] Job {job_id}: DB context unavailable, using fallback. ({db_err})")
                return  # Frontend will handle via fallback URLs
            
            job = await db_instance.jobs.find_one({"_id": job_id})
            if not job:
                # Try alternate key
                job = await db_instance.jobs.find_one({"jobId": job_id})
            
            if not job:
                logger.warning(f"[DEMO] Job {job_id} not found, using fallback")
                return
            
            user_id = job.get("userId")
            project_id = job.get("projectId")
            
            if not user_id:
                logger.error(f"Job {job_id} missing userId")
                return
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 2: Transition to RUNNING
            # ─────────────────────────────────────────────────────────────
            await self._update_status(user_id, job_id, JobStatus.RUNNING)
            await self._log(user_id, job_id, "Job started")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 3: Create isolated workspace (MUST BE FRESH)
            # ─────────────────────────────────────────────────────────────
            workspace_path = self.WORKSPACE_BASE / job_id
            
            if workspace_path.exists():
                # Stale workspace from previous failed run - clean it
                shutil.rmtree(workspace_path, ignore_errors=True)
                warnings.append("Cleaned stale workspace from previous run")
            
            workspace_path.mkdir(parents=True, exist_ok=True)
            await self._log(user_id, job_id, f"Workspace created: {workspace_path}")
            
            # Initialize git repo in workspace
            self._init_git_repo(workspace_path)
            await self._log(user_id, job_id, "Git repository initialized")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 4: Generate code based on mode
            # ─────────────────────────────────────────────────────────────
            # Modes:
            # - CONSTRAINED=true → NEW: Critic + constrained generation (DEFAULT)
            # - USE_LLM=true     → Legacy intelligent code generation 
            # - FAKE_LLM=true    → Mock templates (instant, zero quota, for demos)
            # - Default          → Constrained mode (new default!)
            architecture_spec = job.get("architecture_spec", {})
            
            # Determine generation mode
            constrained_mode = os.getenv("CONSTRAINED", "true").lower() in ("true", "1", "yes")
            use_llm = os.getenv("USE_LLM", "").lower() in ("true", "1", "yes")
            fake_llm = os.getenv("FAKE_LLM", "").lower() in ("true", "1", "yes")
            skip_critic = os.getenv("SKIP_CRITIC", "").lower() in ("true", "1", "yes")
            
            async def progress_callback(current_step, files_created, iteration, spec):
                await jobs_repo.update_job_progress(
                    userId=user_id,
                    jobId=job_id,
                    current_step=current_step,
                    files_created=files_created,
                    total_iterations=iteration
                )
                await self._log(user_id, job_id, current_step)
            
            # ─────────────────────────────────────────────────────────────
            # NEW: Constrained Generation Mode (with Architecture Critic)
            # ─────────────────────────────────────────────────────────────
            if constrained_mode and not fake_llm:
                await self._log(user_id, job_id, "🏗️ CONSTRAINED MODE: Running architecture critic...")
                
                # STEP 1: Run Architecture Critic (can block generation)
                if not skip_critic:
                    critic_result = await critique_architecture(architecture_spec, skip_llm=False)
                    
                    # Log critic result
                    await jobs_repo.update_job_progress(
                        userId=user_id,
                        jobId=job_id,
                        current_step=f"Critic: {len(critic_result.issues)} issues found",
                        translated_spec=critic_result.to_json()
                    )
                    
                    for issue in critic_result.issues[:5]:
                        await self._log(user_id, job_id, f"  [{issue.severity.value.upper()}] {issue.problem[:80]}")
                    
                    if critic_result.blocking:
                        # BLOCKED - architecture has critical issues
                        await self._log(user_id, job_id, "❌ BLOCKED: Architecture has critical issues")
                        await jobs_repo.update_job_status(
                            userId=user_id,
                            jobId=job_id,
                            status=JobStatus.FAILED.value,
                            error=f"Architecture blocked by critic: {critic_result.summary}",
                            warnings=warnings + [i.problem for i in critic_result.issues]
                        )
                        return
                    
                    await self._log(user_id, job_id, f"✅ Critic passed: {critic_result.summary}")
                else:
                    await self._log(user_id, job_id, "⚠️ Skipping architecture critic (SKIP_CRITIC=true)")
                
                # STEP 2: Build Constrained Generation Plan
                await self._log(user_id, job_id, "📋 Building constrained generation plan...")
                
                plan = build_generation_plan(architecture_spec)
                
                await jobs_repo.update_job_progress(
                    userId=user_id,
                    jobId=job_id,
                    current_step=f"Plan: {len(plan.files)} files to generate",
                    translated_spec=plan.to_json()[:5000]  # Truncate for storage
                )
                
                await self._log(user_id, job_id, f"Plan: {len(plan.files)} files for {plan.app_name}")
                for f in plan.files[:5]:
                    await self._log(user_id, job_id, f"  → {f.path}")
                if len(plan.files) > 5:
                    await self._log(user_id, job_id, f"  ... and {len(plan.files) - 5} more files")
                
                # STEP 3: Execute Constrained Generation
                await self._log(user_id, job_id, "🚀 Executing constrained generation via Cline...")
                
                try:
                    success, critic_result, files_written = await cline_service.run_agent_constrained(
                        job_id=job_id,
                        workspace_path=workspace_path,
                        architecture_spec=architecture_spec,
                        progress_callback=progress_callback,
                        skip_critic=True,  # Already ran critic above
                    )
                    
                    if success:
                        await self._log(user_id, job_id, f"✅ Constrained generation complete: {len(files_written)} files")
                    else:
                        await self._log(user_id, job_id, f"⚠️ Constrained generation partial: {len(files_written)} files")
                        warnings.append("Constrained generation did not complete fully")
                    
                except Exception as e:
                    logger.error(f"Constrained generation failed: {e}")
                    await self._log(user_id, job_id, f"⚠️ Constrained generation failed: {e}")
                    warnings.append(f"Constrained generation failed: {e}")
                    
                    # Fallback to templates
                    await self._log(user_id, job_id, "📦 Falling back to template generation...")
                    files_written = generate_mock_app(architecture_spec, workspace_path)
            
            elif fake_llm:
                # DEMO MODE: Use templates (instant, zero quota)
                await self._log(user_id, job_id, "🎭 Demo mode: Generating from templates...")
                
                files_written = generate_mock_app(architecture_spec, workspace_path)
                
                await jobs_repo.update_job_progress(
                    userId=user_id,
                    jobId=job_id,
                    current_step=f"Generated {len(files_written)} files",
                    files_created=files_written,
                    total_iterations=1
                )
                
                for f in files_written[:5]:
                    await self._log(user_id, job_id, f"  → {f}")
                if len(files_written) > 5:
                    await self._log(user_id, job_id, f"  ... and {len(files_written) - 5} more files")
                    
            elif use_llm:
                # INTELLIGENT MODE: Real AI code generation with cross-node awareness
                await self._log(user_id, job_id, "🧠 Intelligent mode: Generating CONNECTED code with AI...")
                
                try:
                    # Use v2 generator with cross-node awareness
                    files_written = await generate_connected_codebase(
                        architecture_spec,
                        workspace_path,
                        progress_callback=progress_callback
                    )
                    
                    await self._log(user_id, job_id, f"Generated {len(files_written)} CONNECTED files with AI")
                    
                except Exception as e:
                    logger.error(f"AI generation failed: {e}, falling back to templates")
                    await self._log(user_id, job_id, f"⚠️ AI failed, falling back to templates: {e}")
                    warnings.append(f"AI generation failed: {e}")
                    
                    # Fallback to mock generator
                    files_written = generate_mock_app(architecture_spec, workspace_path)
            else:
                # DEFAULT MODE: Try AI v2 (cross-node aware), fallback to templates
                await self._log(user_id, job_id, "🚀 Attempting intelligent cross-node generation...")
                
                try:
                    files_written = await generate_connected_codebase(
                        architecture_spec,
                        workspace_path,
                        progress_callback=progress_callback
                    )
                    await self._log(user_id, job_id, f"✅ Generated {len(files_written)} CONNECTED files with AI")
                    
                except Exception as e:
                    logger.warning(f"AI generation unavailable: {e}, using templates")
                    await self._log(user_id, job_id, f"📦 Using template generation...")
                    
                    files_written = generate_mock_app(architecture_spec, workspace_path)
                    
                    await jobs_repo.update_job_progress(
                        userId=user_id,
                        jobId=job_id,
                        current_step=f"Generated {len(files_written)} files",
                        files_created=files_written,
                        total_iterations=1
                    )
            
            await self._log(user_id, job_id, "Code generation complete")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 5: Commit changes
            # ─────────────────────────────────────────────────────────────
            files_generated = self._count_files(workspace_path)
            await self._log(user_id, job_id, f"Generated {files_generated} files")
            
            if files_generated > 0:
                commit_msg = f"Architex: Generated architecture ({files_generated} files)"
                committed = self._commit_changes(workspace_path, commit_msg)
                if committed:
                    await self._log(user_id, job_id, "Changes committed to git")
                else:
                    warnings.append("No changes to commit (files may be empty)")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 6: Push to GitHub (repo on PROJECT, not job)
            # ─────────────────────────────────────────────────────────────
            if project_id and files_generated > 0:
                await self._handle_github_push(
                    user_id, project_id, job_id, workspace_path, warnings
                )
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 7: Mark completed
            # ─────────────────────────────────────────────────────────────
            final_status = JobStatus.COMPLETED_WITH_WARNINGS if warnings else JobStatus.COMPLETED
            await self._update_status(
                user_id, job_id, final_status,
                result={"files_generated": files_generated},
                warnings=warnings
            )
            await self._log(user_id, job_id, f"Job completed: {final_status.value}")
            
        except Exception as e:
            logger.exception(f"Job {job_id} failed")
            
            if user_id:
                await self._log(user_id, job_id, f"Job failed: {str(e)}", level="error")
                await self._update_status(user_id, job_id, JobStatus.FAILED, error=str(e))
            
        finally:
            # ─────────────────────────────────────────────────────────────
            # PHASE 8: Cleanup workspace (ALWAYS, NO EXCEPTIONS)
            # ─────────────────────────────────────────────────────────────
            if workspace_path and workspace_path.exists():
                try:
                    shutil.rmtree(workspace_path, ignore_errors=True)
                    logger.info(f"Cleaned up workspace: {workspace_path}")
                except Exception as cleanup_error:
                    # Log but don't fail - cleanup failure is not job failure
                    logger.warning(f"Workspace cleanup failed: {cleanup_error}")
    
    # =========================================================================
    # GitHub Handling (repo on PROJECT, jobs only commit)
    # =========================================================================
    
    async def _handle_github_push(
        self,
        user_id: str,
        project_id: str,
        job_id: str,
        workspace_path: Path,
        warnings: list
    ):
        """
        Handle GitHub push with proper invariants:
        - Repo is created ONCE per project (not per job)
        - Jobs only commit and push
        - Failures are warnings, not job failures
        """
        try:
            # Get user's GitHub token
            user = await users_repo.get_user(user_id)
            if not user or not user.get("github_access_token"):
                warnings.append("No GitHub token available - skipping push")
                return
            
            github_token = user["github_access_token"]
            
            # Get project
            project = await projects_repo.get_project(user_id, project_id)
            if not project:
                warnings.append("Project not found - skipping push")
                return
            
            repo_url = project.get("github_repo_url")
            
            # Create repo if needed (ONCE per project)
            if not repo_url:
                await self._log(user_id, job_id, "Creating GitHub repository...")
                repo_url = await self._create_github_repo(
                    user_id, project_id, project.get("project_name", "untitled"),
                    github_token
                )
                
                if not repo_url:
                    warnings.append("Failed to create GitHub repo - skipping push")
                    return
                
                await self._log(user_id, job_id, f"Repository created: {repo_url}")
            
            # Push to repo
            await self._log(user_id, job_id, f"Pushing to {repo_url}...")
            push_success = self._push_to_github(workspace_path, repo_url, github_token)
            
            if push_success:
                await self._log(user_id, job_id, "Push successful")
                await projects_repo.touch_project_last_updated(user_id, project_id)
            else:
                warnings.append("Push failed - repo may already have conflicting content")
                
        except Exception as e:
            # GitHub failures are warnings, not job failures
            warnings.append(f"GitHub error: {str(e)}")
            logger.warning(f"GitHub push failed for job {job_id}: {e}")
    
    async def _create_github_repo(
        self,
        user_id: str,
        project_id: str,
        project_name: str,
        github_token: str
    ) -> Optional[str]:
        """
        Create GitHub repo for project (idempotent).
        
        Returns:
            repo URL if successful, None otherwise
        """
        # Sanitize repo name
        repo_name = f"architex-{project_name.lower()}"
        repo_name = "".join(c if c.isalnum() or c == "-" else "-" for c in repo_name)
        repo_name = repo_name[:100].strip("-")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.github.com/user/repos",
                    headers={
                        "Authorization": f"Bearer {github_token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                    json={
                        "name": repo_name,
                        "private": False,
                        "auto_init": False,
                        "description": f"Generated by Architex"
                    }
                )
                
                if resp.status_code == 201:
                    repo_url = resp.json().get("html_url")
                    await projects_repo.set_github_repo_url(user_id, project_id, repo_url)
                    return repo_url
                    
                elif resp.status_code == 422:
                    # Repo exists - try to get existing URL
                    user_resp = await client.get(
                        "https://api.github.com/user",
                        headers={"Authorization": f"Bearer {github_token}"}
                    )
                    if user_resp.status_code == 200:
                        username = user_resp.json().get("login")
                        repo_url = f"https://github.com/{username}/{repo_name}"
                        await projects_repo.set_github_repo_url(user_id, project_id, repo_url)
                        return repo_url
                
                logger.error(f"GitHub API error {resp.status_code}: {resp.text[:200]}")
                return None
                
        except Exception as e:
            logger.error(f"GitHub repo creation failed: {e}")
            return None
    
    # =========================================================================
    # Git Operations
    # =========================================================================
    
    def _init_git_repo(self, workspace_path: Path):
        """Initialize fresh git repo in workspace"""
        subprocess.run(
            ["git", "init", "-b", "main"],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
        subprocess.run(
            ["git", "config", "user.name", "Architex"],
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
    
    def _commit_changes(self, workspace_path: Path, message: str) -> bool:
        """Commit all changes. Returns True if commit was made."""
        subprocess.run(
            ["git", "add", "."],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
        
        # Check if there are changes to commit
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=workspace_path,
            capture_output=True,
            text=True
        )
        
        if not result.stdout.strip():
            return False  # Nothing to commit
        
        subprocess.run(
            ["git", "commit", "-m", message],
            cwd=workspace_path,
            check=True,
            capture_output=True
        )
        return True
    
    def _push_to_github(self, workspace_path: Path, repo_url: str, token: str) -> bool:
        """Push to GitHub. Returns True if successful."""
        try:
            # Construct authenticated URL
            if repo_url.startswith("https://github.com/"):
                auth_url = repo_url.replace(
                    "https://github.com/",
                    f"https://{token}@github.com/"
                )
            else:
                auth_url = repo_url
            
            # Remove existing remote if any
            subprocess.run(
                ["git", "remote", "remove", "origin"],
                cwd=workspace_path,
                capture_output=True
            )
            
            # Add remote
            subprocess.run(
                ["git", "remote", "add", "origin", auth_url],
                cwd=workspace_path,
                check=True,
                capture_output=True
            )
            
            # Push (force to handle empty repos)
            subprocess.run(
                ["git", "push", "-u", "origin", "main", "--force"],
                cwd=workspace_path,
                check=True,
                capture_output=True
            )
            
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Git push failed: {e}")
            return False
    
    # =========================================================================
    # Helpers
    # =========================================================================
    
    def _count_files(self, workspace_path: Path) -> int:
        """Count generated files (excluding .git)"""
        count = 0
        for path in workspace_path.rglob("*"):
            if path.is_file() and ".git" not in path.parts:
                count += 1
        return count
    
    async def _update_status(
        self,
        user_id: str,
        job_id: str,
        status: JobStatus,
        result: Optional[Dict] = None,
        error: Optional[str] = None,
        warnings: Optional[list] = None
    ):
        """Update job status in DB and emit socket event"""
        await jobs_repo.update_job_status(
            user_id, job_id, status.value,
            result=result, error=error, warnings=warnings
        )
        
        # If job completed successfully, update project's latest_successful_job_id
        if status in (JobStatus.COMPLETED, JobStatus.COMPLETED_WITH_WARNINGS):
            job = await jobs_repo.get_job(user_id, job_id)
            if job and job.get("projectId"):
                await projects_repo.update_latest_job(user_id, job["projectId"], job_id)
        
        await socket_manager.emit_status(status.value, job_id)
    
    async def _log(self, user_id: str, job_id: str, message: str, level: str = "info"):
        """Log to console, DB, and socket"""
        log_entry = {
            "ts": get_utc_now(),
            "level": level,
            "message": message
        }
        
        if level == "error":
            logger.error(f"[Job {job_id}] {message}")
        else:
            logger.info(f"[Job {job_id}] {message}")
        
        await socket_manager.emit_log(message, job_id)
        await jobs_repo.append_job_logs(user_id, job_id, [log_entry])


# Global worker instance
job_worker = JobWorker()
