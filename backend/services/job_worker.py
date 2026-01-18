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
import traceback
from typing import Dict, Any, Optional, List
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
from database.mongo import get_db, get_db_raw, init_mongo
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
        # =====================================================================
        # AGGRESSIVE LOGGING - See exactly what happens
        # =====================================================================
        print(f"\n{'='*60}")
        print(f"🚀 [JOB WORKER] STARTING JOB: {job_id}")
        print(f"{'='*60}\n")
        logger.info(f"[JOB {job_id}] ========== STARTING JOB PROCESSING ==========")
        
        # Absorb any extra args (Starlette compatibility)
        if args or kwargs:
            logger.debug(f"process_job received extra args: {args}, {kwargs}")
        
        try:
            # Initialize variables expected by except/finally blocks
            workspace_path: Optional[Path] = None
            user_id: Optional[str] = None
            warnings: list = []
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 1b: Ensure database connection (required for background tasks)
            # ─────────────────────────────────────────────────────────────
            # In background tasks, the global DB may not be initialized.
            # Use get_db_raw() to check, and init_mongo() if needed.
            print(f"📊 [JOB {job_id}] Ensuring database connection...")
            
            db_instance = get_db_raw()
            if db_instance is None:
                print(f"🔄 [JOB {job_id}] DB not initialized in background task, initializing...")
                logger.info(f"[JOB {job_id}] Initializing MongoDB in background task context")
                try:
                    await init_mongo()
                    db_instance = get_db()
                    print(f"✅ [JOB {job_id}] MongoDB initialized successfully")
                except Exception as db_err:
                    print(f"❌ [JOB {job_id}] FAILED to initialize MongoDB: {db_err}")
                    logger.error(f"[JOB {job_id}] MongoDB initialization failed: {db_err}")
                    # Cannot continue without DB - job will fail
                    return
            else:
                print(f"✅ [JOB {job_id}] Database already connected")
            
            print(f"🔍 [JOB {job_id}] Fetching job from database...")
            job = await db_instance.jobs.find_one({"_id": job_id})
            if not job:
                # Try alternate key
                job = await db_instance.jobs.find_one({"jobId": job_id})
            
            if not job:
                print(f"❌ [JOB {job_id}] JOB NOT FOUND IN DATABASE!")
                logger.warning(f"[DEMO] Job {job_id} not found, using fallback")
                return
            
            print(f"✅ [JOB {job_id}] Job found in database")
            
            user_id = job.get("userId")
            # Check both field names for compatibility (API uses snake_case, some code uses camelCase)
            project_id = job.get("projectId") or job.get("project_id")
            
            print(f"📋 [JOB {job_id}] User ID: {user_id}")
            print(f"📋 [JOB {job_id}] Project ID: {project_id}")
            
            if not user_id:
                print(f"❌ [JOB {job_id}] MISSING USER ID - ABORTING")
                logger.error(f"Job {job_id} missing userId")
                return
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 2: Transition to RUNNING
            # ─────────────────────────────────────────────────────────────
            print(f"\n📍 [JOB {job_id}] PHASE 2: Setting status to RUNNING...")
            await self._update_status(user_id, job_id, JobStatus.RUNNING)
            await self._log(user_id, job_id, "Job started")
            print(f"✅ [JOB {job_id}] Status updated to RUNNING")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 3: Create isolated workspace (MUST BE FRESH)
            # ─────────────────────────────────────────────────────────────
            print(f"\n📍 [JOB {job_id}] PHASE 3: Creating workspace...")
            workspace_path = self.WORKSPACE_BASE / job_id
            
            if workspace_path.exists():
                # Stale workspace from previous failed run - clean it
                print(f"🧹 [JOB {job_id}] Cleaning stale workspace...")
                shutil.rmtree(workspace_path, ignore_errors=True)
                warnings.append("Cleaned stale workspace from previous run")
            
            workspace_path.mkdir(parents=True, exist_ok=True)
            await self._log(user_id, job_id, f"Workspace created: {workspace_path}")
            print(f"✅ [JOB {job_id}] Workspace created: {workspace_path}")
            
            # Initialize git repo in workspace
            self._init_git_repo(workspace_path)
            await self._log(user_id, job_id, "Git repository initialized")
            print(f"✅ [JOB {job_id}] Git initialized")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 4: Generate code based on mode
            # ─────────────────────────────────────────────────────────────
            # Modes:
            # - CONSTRAINED=true → NEW: Critic + constrained generation (DEFAULT)
            # - USE_LLM=true     → Legacy intelligent code generation 
            # - FAKE_LLM=true    → Mock templates (instant, zero quota, for demos)
            # - Default          → Constrained mode (new default!)
            architecture_spec = job.get("architecture_spec", {})
            
            # ─────────────────────────────────────────────────────────────
            # CRITICAL: Extract user prompt (the meaning behind the nodes)
            # ─────────────────────────────────────────────────────────────
            user_prompt = architecture_spec.get("prompt", "").strip()
            if not user_prompt:
                # Fallback to description if prompt not provided
                user_prompt = architecture_spec.get("description", "").strip()
            if not user_prompt:
                # Default prompt if nothing provided
                user_prompt = "A standard software system"
                await self._log(user_id, job_id, "⚠️ No prompt provided, using default")
            else:
                await self._log(user_id, job_id, f"📝 User Prompt: {user_prompt[:100]}{'...' if len(user_prompt) > 100 else ''}")
            
            # Ensure prompt is in architecture_spec for downstream functions
            architecture_spec["prompt"] = user_prompt
            
            logger.info(f"[JOB {job_id}] User Prompt: {user_prompt}")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 4: Determine generation mode & check environment
            # ─────────────────────────────────────────────────────────────
            print(f"\n📍 [JOB {job_id}] PHASE 4: Determining generation mode...")
            
            # Determine generation mode
            constrained_mode = os.getenv("CONSTRAINED", "true").lower() in ("true", "1", "yes")
            use_llm = os.getenv("USE_LLM", "").lower() in ("true", "1", "yes")
            fake_llm = os.getenv("FAKE_LLM", "").lower() in ("true", "1", "yes")
            skip_critic = os.getenv("SKIP_CRITIC", "").lower() in ("true", "1", "yes")
            
            # Check for LLM API keys
            has_gemini_key = bool(os.getenv("GOOGLE_GEMINI_API_KEY"))
            has_groq_key = bool(os.getenv("GROQ_API_KEY"))
            
            print(f"📋 [JOB {job_id}] Generation Mode:")
            print(f"   - CONSTRAINED: {constrained_mode}")
            print(f"   - USE_LLM: {use_llm}")
            print(f"   - FAKE_LLM: {fake_llm}")
            print(f"   - SKIP_CRITIC: {skip_critic}")
            print(f"   - GOOGLE_GEMINI_API_KEY: {'✅ SET' if has_gemini_key else '❌ NOT SET'}")
            print(f"   - GROQ_API_KEY: {'✅ SET' if has_groq_key else '❌ NOT SET'}")
            
            # SAFETY: If no LLM key and not in fake mode, force FAKE_LLM
            if not has_gemini_key and not has_groq_key and not fake_llm:
                print(f"⚠️ [JOB {job_id}] NO LLM API KEY FOUND! Forcing FAKE_LLM mode...")
                await self._log(user_id, job_id, "⚠️ No LLM API key - using template generation")
                fake_llm = True
                warnings.append("No LLM API key available - using template generation")
            
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
                print(f"\n🏗️ [JOB {job_id}] ENTERING CONSTRAINED MODE (LLM-based)")
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
                        # TRULY BLOCKED - structural issues like no nodes/edges
                        await self._log(user_id, job_id, "❌ BLOCKED: Architecture has critical structural issues")
                        await jobs_repo.update_job_status(
                            userId=user_id,
                            jobId=job_id,
                            status=JobStatus.FAILED.value,
                            error=f"Architecture blocked: {critic_result.summary}",
                            warnings=warnings + [i.problem for i in critic_result.issues]
                        )
                        return
                    elif len(critic_result.issues) > 0:
                        # DEMO MODE: Has issues but not blocking - proceed with warnings
                        high_issues = [i for i in critic_result.issues if i.severity.value in ["high", "critical"]]
                        if high_issues:
                            print(f"⚠️ [JOB {job_id}] CRITIC: Found {len(high_issues)} high-severity issues, proceeding anyway...")
                            await self._log(user_id, job_id, f"⚠️ Critic found {len(high_issues)} issues, proceeding for demo...")
                            for issue in high_issues[:3]:
                                warnings.append(f"[{issue.category.value}] {issue.problem}")
                        await self._log(user_id, job_id, f"✅ Critic passed: {critic_result.summary}")
                    else:
                        await self._log(user_id, job_id, f"✅ Critic passed: {critic_result.summary}")
                else:
                    await self._log(user_id, job_id, "⚠️ Skipping architecture critic (SKIP_CRITIC=true)")
                
                # STEP 2: Build Constrained Generation Plan
                await self._log(user_id, job_id, "📋 Building constrained generation plan...")
                logger.info(f"[JOB {job_id}] Building plan with prompt: {user_prompt[:80]}...")
                
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
                print(f"\n🚀 [JOB {job_id}] STEP 3: Executing constrained generation via Cline...")
                await self._log(user_id, job_id, "🚀 Executing constrained generation via Cline...")
                
                try:
                    print(f"📞 [JOB {job_id}] Calling cline_service.run_agent_constrained()...")
                    success, critic_result, files_written = await cline_service.run_agent_constrained(
                        job_id=job_id,
                        workspace_path=workspace_path,
                        architecture_spec=architecture_spec,
                        progress_callback=progress_callback,
                        skip_critic=True,  # Already ran critic above
                    )
                    print(f"✅ [JOB {job_id}] Cline returned: success={success}, files={len(files_written)}")
                    
                    if success:
                        await self._log(user_id, job_id, f"✅ Constrained generation complete: {len(files_written)} files")
                    else:
                        await self._log(user_id, job_id, f"⚠️ Constrained generation partial: {len(files_written)} files")
                        warnings.append("Constrained generation did not complete fully")
                    
                except Exception as e:
                    print(f"❌ [JOB {job_id}] CLINE EXCEPTION: {e}")
                    print(f"❌ [JOB {job_id}] Traceback:\n{traceback.format_exc()}")
                    logger.error(f"Constrained generation failed: {e}")
                    await self._log(user_id, job_id, f"⚠️ Constrained generation failed: {e}")
                    warnings.append(f"Constrained generation failed: {e}")
                    
                    # Fallback to templates
                    print(f"📦 [JOB {job_id}] Falling back to template generation...")
                    await self._log(user_id, job_id, "📦 Falling back to template generation...")
                    files_written = generate_mock_app(architecture_spec, workspace_path)
                    print(f"✅ [JOB {job_id}] Template generation complete: {len(files_written)} files")
            
            elif fake_llm:
                # DEMO MODE: Use templates (instant, zero quota)
                print(f"\n🎭 [JOB {job_id}] ENTERING FAKE_LLM MODE (Template generation)")
                await self._log(user_id, job_id, "🎭 Demo mode: Generating from templates...")
                
                print(f"📦 [JOB {job_id}] Generating mock app from templates...")
                files_written = generate_mock_app(architecture_spec, workspace_path)
                print(f"✅ [JOB {job_id}] Template generation complete: {len(files_written)} files")
                
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
            print(f"✅ [JOB {job_id}] Code generation phase complete")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 5: Validate & Commit changes
            # ─────────────────────────────────────────────────────────────
            print(f"\n📍 [JOB {job_id}] PHASE 5: Validating & Committing changes...")
            files_generated = self._count_files(workspace_path)
            await self._log(user_id, job_id, f"Generated {files_generated} files")
            print(f"📊 [JOB {job_id}] Files generated: {files_generated}")
            
            # MINIMUM VIABLE GENERATION CHECK
            # If we have < 4 files, generation was too small - fallback to templates
            MIN_FILES_THRESHOLD = 4
            if files_generated < MIN_FILES_THRESHOLD:
                print(f"⚠️ [JOB {job_id}] Only {files_generated} files generated (min: {MIN_FILES_THRESHOLD})")
                await self._log(user_id, job_id, f"⚠️ Only {files_generated} files - falling back to template generation...")
                warnings.append(f"LLM generation produced only {files_generated} files, using templates instead")
                
                # Fallback to template generation
                print(f"📦 [JOB {job_id}] Falling back to template generation...")
                files_written = generate_mock_app(architecture_spec, workspace_path)
                files_generated = self._count_files(workspace_path)
                print(f"✅ [JOB {job_id}] Template fallback generated {files_generated} files")
                await self._log(user_id, job_id, f"✅ Template fallback: {files_generated} files")
                
                # If STILL too few files, FAIL the job
                if files_generated < MIN_FILES_THRESHOLD:
                    error_msg = f"Generation failed: Only {files_generated} files created (minimum: {MIN_FILES_THRESHOLD}). Please check your architecture."
                    print(f"❌ [JOB {job_id}] {error_msg}")
                    await self._log(user_id, job_id, f"❌ {error_msg}")
                    await jobs_repo.update_job_status(
                        userId=user_id,
                        jobId=job_id,
                        status=JobStatus.FAILED.value,
                        error=error_msg,
                        warnings=warnings
                    )
                    return
            
            if files_generated > 0:
                commit_msg = f"Architex: Generated architecture ({files_generated} files)"
                committed = self._commit_changes(workspace_path, commit_msg)
                if committed:
                    await self._log(user_id, job_id, "Changes committed to git")
                    print(f"✅ [JOB {job_id}] Git commit successful")
                else:
                    warnings.append("No changes to commit (files may be empty)")
                    print(f"⚠️ [JOB {job_id}] No changes to commit")
            else:
                print(f"⚠️ [JOB {job_id}] No files generated - skipping commit")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 6: Push to GitHub (repo on PROJECT, not job)
            # ─────────────────────────────────────────────────────────────
            print(f"\n📍 [JOB {job_id}] PHASE 6: Pushing to GitHub...")
            if project_id and files_generated > 0:
                await self._handle_github_push(
                    user_id, project_id, job_id, workspace_path, warnings
                )
            else:
                if not project_id:
                    print(f"⚠️ [JOB {job_id}] No project_id - skipping GitHub push")
                if files_generated == 0:
                    print(f"⚠️ [JOB {job_id}] No files generated - skipping GitHub push")
            
            # ─────────────────────────────────────────────────────────────
            # PHASE 7: Mark completed
            # ─────────────────────────────────────────────────────────────
            print(f"\n📍 [JOB {job_id}] PHASE 7: Marking job complete...")
            final_status = JobStatus.COMPLETED_WITH_WARNINGS if warnings else JobStatus.COMPLETED
            await self._update_status(
                user_id, job_id, final_status,
                result={"files_generated": files_generated},
                warnings=warnings
            )
            await self._log(user_id, job_id, f"Job completed: {final_status.value}")
            
            print(f"\n{'='*60}")
            print(f"🎉 [JOB {job_id}] JOB COMPLETE: {final_status.value}")
            print(f"   Files generated: {files_generated}")
            if warnings:
                print(f"   Warnings: {len(warnings)}")
                for w in warnings[:3]:
                    print(f"      - {w[:80]}")
            print(f"{'='*60}\n")
            
        except Exception as e:
            # ─────────────────────────────────────────────────────────────
            # CRITICAL ERROR HANDLING - Log EVERYTHING
            # ─────────────────────────────────────────────────────────────
            error_msg = str(e)
            full_traceback = traceback.format_exc()
            
            print(f"\n{'='*60}")
            print(f"❌ [JOB {job_id}] JOB FAILED WITH EXCEPTION")
            print(f"{'='*60}")
            print(f"Error: {error_msg}")
            print(f"\nFull Traceback:")
            print(full_traceback)
            print(f"{'='*60}\n")
            
            logger.error(f"Job {job_id} failed: {error_msg}")
            logger.error(f"Full traceback:\n{full_traceback}")
            
            if user_id:
                await self._log(user_id, job_id, f"❌ Job failed: {error_msg}", level="error")
                await self._update_status(user_id, job_id, JobStatus.FAILED, error=error_msg)
            
        finally:
            # ─────────────────────────────────────────────────────────────
            # PHASE 8: Cleanup workspace (ALWAYS, NO EXCEPTIONS)
            # ─────────────────────────────────────────────────────────────
            print(f"🧹 [JOB {job_id}] Cleaning up workspace...")
            if workspace_path and workspace_path.exists():
                try:
                    shutil.rmtree(workspace_path, ignore_errors=True)
                    logger.info(f"Cleaned up workspace: {workspace_path}")
                    print(f"✅ [JOB {job_id}] Workspace cleaned up")
                except Exception as cleanup_error:
                    # Log but don't fail - cleanup failure is not job failure
                    logger.warning(f"Workspace cleanup failed: {cleanup_error}")
                    print(f"⚠️ [JOB {job_id}] Cleanup warning: {cleanup_error}")
    
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
        print(f"🔄 [JOB {job_id}] Starting GitHub push handler...")
        
        try:
            # Get user's GitHub token
            print(f"🔑 [JOB {job_id}] Fetching user GitHub token...")
            user = await users_repo.get_user(user_id)
            if not user or not user.get("github_access_token"):
                print(f"❌ [JOB {job_id}] NO GITHUB TOKEN - Cannot push!")
                warnings.append("No GitHub token available - skipping push")
                await self._log(user_id, job_id, "⚠️ No GitHub token - skipping push")
                return
            
            github_token = user["github_access_token"]
            print(f"✅ [JOB {job_id}] GitHub token found (length: {len(github_token)})")
            
            # Get project
            print(f"📦 [JOB {job_id}] Fetching project {project_id}...")
            project = await projects_repo.get_project(user_id, project_id)
            if not project:
                print(f"❌ [JOB {job_id}] PROJECT NOT FOUND!")
                warnings.append("Project not found - skipping push")
                return
            
            print(f"✅ [JOB {job_id}] Project found: {project.get('name', 'unnamed')}")
            
            repo_url = project.get("github_repo_url") or project.get("repository_url")
            
            # Log the repo URL being used
            if repo_url:
                print(f"🔗 [JOB {job_id}] Target Repo URL: {repo_url}")
                logger.info(f"[JOB {job_id}] Using Repo URL: {repo_url}")
                await self._log(user_id, job_id, f"🔗 Target Repo: {repo_url}")
            else:
                print(f"⚠️ [JOB {job_id}] NO GITHUB REPO URL on project!")
                logger.warning(f"[JOB {job_id}] No GitHub repo URL found on project")
                await self._log(user_id, job_id, "⚠️ No GitHub repo URL found on project")
            
            # Create repo if needed (ONCE per project)
            if not repo_url:
                print(f"🔨 [JOB {job_id}] Creating new GitHub repository...")
                await self._log(user_id, job_id, "Creating GitHub repository...")
                repo_url = await self._create_github_repo(
                    user_id, project_id, project.get("name", project.get("project_name", "untitled")),
                    github_token
                )
                
                if not repo_url:
                    print(f"❌ [JOB {job_id}] FAILED TO CREATE REPO!")
                    warnings.append("Failed to create GitHub repo - skipping push")
                    return
                
                print(f"✅ [JOB {job_id}] Repository created: {repo_url}")
                await self._log(user_id, job_id, f"Repository created: {repo_url}")
            
            # Push to repo
            print(f"📤 [JOB {job_id}] Pushing code to {repo_url}...")
            await self._log(user_id, job_id, f"Pushing to {repo_url}...")
            push_success = self._push_to_github(workspace_path, repo_url, github_token)
            
            if push_success:
                print(f"✅ [JOB {job_id}] PUSH SUCCESSFUL!")
                await self._log(user_id, job_id, "✅ Push successful")
                await projects_repo.touch_project_last_updated(user_id, project_id)
                
                # === VERCEL DEPLOYMENT ===
                # Deploy to Vercel if configured
                try:
                    from services.vercel import deploy_to_vercel, get_vercel_service
                    
                    vercel_service = get_vercel_service()
                    if vercel_service.is_configured:
                        print(f"🚀 [JOB {job_id}] Triggering Vercel deployment...")
                        await self._log(user_id, job_id, "🚀 Deploying to Vercel...")
                        
                        deploy_result = await deploy_to_vercel(
                            github_repo_url=repo_url,
                            project_name=project_name or "architex-app",
                        )
                        
                        if deploy_result.get("success"):
                            vercel_url = deploy_result.get("deployment_url")
                            print(f"✅ [JOB {job_id}] DEPLOYMENT TRIGGERED: {vercel_url}")
                            await self._log(user_id, job_id, f"🚀 Deployed to: {vercel_url}")
                            
                            # Store Vercel URL in project
                            await projects_repo.set_vercel_url(user_id, project_id, vercel_url)
                        else:
                            error_msg = deploy_result.get("error", "Unknown error")
                            print(f"⚠️ [JOB {job_id}] Vercel deployment failed: {error_msg}")
                            warnings.append(f"Vercel deployment failed: {error_msg}")
                    else:
                        print(f"ℹ️ [JOB {job_id}] Vercel not configured - skipping deployment")
                except Exception as vercel_error:
                    print(f"⚠️ [JOB {job_id}] Vercel error: {vercel_error}")
                    warnings.append(f"Vercel deployment skipped: {str(vercel_error)}")
            else:
                print(f"❌ [JOB {job_id}] PUSH FAILED!")
                warnings.append("Push failed - repo may already have conflicting content")
                await self._log(user_id, job_id, "❌ Push failed")
                
        except Exception as e:
            # GitHub failures are warnings, not job failures
            print(f"❌ [JOB {job_id}] GITHUB EXCEPTION: {e}")
            print(f"   Traceback: {traceback.format_exc()}")
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
        print(f"   🔧 _push_to_github: Starting...")
        print(f"   🔧 Workspace: {workspace_path}")
        print(f"   🔧 Repo URL: {repo_url}")
        
        try:
            # Construct authenticated URL
            if repo_url.startswith("https://github.com/"):
                auth_url = repo_url.replace(
                    "https://github.com/",
                    f"https://{token}@github.com/"
                )
                print(f"   🔧 Auth URL constructed (token embedded)")
            else:
                auth_url = repo_url
                print(f"   🔧 Using original URL")
            
            # Remove existing remote if any
            print(f"   🔧 Removing existing 'origin' remote (if any)...")
            result = subprocess.run(
                ["git", "remote", "remove", "origin"],
                cwd=workspace_path,
                capture_output=True,
                text=True
            )
            
            # Add remote
            print(f"   🔧 Adding remote 'origin'...")
            result = subprocess.run(
                ["git", "remote", "add", "origin", auth_url],
                cwd=workspace_path,
                check=True,
                capture_output=True,
                text=True
            )
            print(f"   ✅ Remote added")
            
            # Push (force to handle empty repos)
            print(f"   🔧 Pushing to origin/main (force)...")
            result = subprocess.run(
                ["git", "push", "-u", "origin", "main", "--force"],
                cwd=workspace_path,
                check=True,
                capture_output=True,
                text=True
            )
            print(f"   ✅ Push complete!")
            if result.stdout:
                print(f"   stdout: {result.stdout[:200]}")
            if result.stderr:
                print(f"   stderr: {result.stderr[:200]}")
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Git push FAILED: {e}")
            print(f"   stdout: {e.stdout if hasattr(e, 'stdout') else 'N/A'}")
            print(f"   stderr: {e.stderr if hasattr(e, 'stderr') else 'N/A'}")
            logger.error(f"Git push failed: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            logger.error(f"Git push unexpected error: {e}")
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
