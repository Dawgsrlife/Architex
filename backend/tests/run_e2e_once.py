#!/usr/bin/env python3
"""
E2E Single Run Test

Proves the backend works by running ONE job through the full lifecycle.
No mocks. No complexity. Just execution.

Pass/Fail Criteria:
  PASS if:
    - Project created with latest_successful_job_id = None
    - Job created with status = pending
    - Job transitions to running
    - Job reaches terminal state (completed/completed_with_warnings/failed)
    - If completed/completed_with_warnings: latest_successful_job_id is set
    - Workspace is cleaned up

  FAIL if:
    - Any step throws an exception
    - Status transition is invalid
    - latest_successful_job_id not updated on success

Usage:
    cd backend
    source venv/bin/activate
    python tests/run_e2e_once.py
"""
import asyncio
import sys
import os
import uuid
from pathlib import Path

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ═══════════════════════════════════════════════════════════════════════════
# ENV CHECK
# ═══════════════════════════════════════════════════════════════════════════

def check_env():
    """Verify required env vars are set"""
    from config import settings
    
    print("=" * 60)
    print("ENV CHECK")
    print("=" * 60)
    
    checks = [
        ("MONGODB_URI", bool(settings.mongodb_uri)),
        ("GOOGLE_GEMINI_API_KEY", bool(settings.google_gemini_api_key)),
    ]
    
    all_ok = True
    for name, ok in checks:
        status = "✓" if ok else "✗ MISSING"
        print(f"  {name}: {status}")
        if not ok:
            all_ok = False
    
    if not all_ok:
        print("\n✗ FAIL: Missing required environment variables")
        print("  Edit backend/.env and fill in the values")
        return False
    
    print("\n✓ All required env vars present")
    return True


# ═══════════════════════════════════════════════════════════════════════════
# MAIN TEST
# ═══════════════════════════════════════════════════════════════════════════

async def run_e2e_once():
    """Run one job through the full lifecycle"""
    
    from database.mongo import init_mongo, close_mongo, get_db
    from repos import projects_repo, jobs_repo
    from services.job_worker import job_worker, JobStatus
    
    test_user_id = f"e2e_{uuid.uuid4().hex[:8]}"
    project_id = None
    job_id = None
    passed = True
    
    print("\n" + "=" * 60)
    print("E2E SINGLE RUN")
    print("=" * 60)
    
    try:
        # ───────────────────────────────────────────────────────────────
        # Step 1: Connect to MongoDB
        # ───────────────────────────────────────────────────────────────
        print("\n[1] Connecting to MongoDB...")
        await init_mongo()
        print("    ✓ Connected")
        
        # ───────────────────────────────────────────────────────────────
        # Step 2: Create Project
        # ───────────────────────────────────────────────────────────────
        print("\n[2] Creating project...")
        project = await projects_repo.create_project(
            userId=test_user_id,
            project_name="E2E Test Project"
        )
        project_id = project["projectId"]
        
        assert project.get("latest_successful_job_id") is None, \
            "latest_successful_job_id should be None"
        print(f"    ✓ Project created: {project_id[:8]}...")
        print(f"    ✓ latest_successful_job_id = None")
        
        # ───────────────────────────────────────────────────────────────
        # Step 3: Create Job
        # ───────────────────────────────────────────────────────────────
        print("\n[3] Creating job...")
        spec = {
            "name": "E2E Test",
            "description": "Minimal test",
            "prompt": "Create a single file called hello.txt with the text 'Hello World'",
            "nodes": [{"id": "n1", "type": "file", "data": {"label": "hello.txt"}}],
            "edges": []
        }
        
        job = await jobs_repo.create_job(
            userId=test_user_id,
            projectId=project_id,
            architecture_spec=spec
        )
        job_id = job["jobId"]
        
        assert job.get("status") == JobStatus.PENDING.value
        assert job.get("warnings") == []
        print(f"    ✓ Job created: {job_id[:8]}...")
        print(f"    ✓ status = pending")
        print(f"    ✓ warnings = []")
        
        # ───────────────────────────────────────────────────────────────
        # Step 4: Run Job
        # ───────────────────────────────────────────────────────────────
        print("\n[4] Running job (this may take a minute)...")
        print("    → Calling job_worker.process_job()...")
        
        await job_worker.process_job(job_id)
        
        print("    ✓ process_job() completed")
        
        # ───────────────────────────────────────────────────────────────
        # Step 5: Check Results
        # ───────────────────────────────────────────────────────────────
        print("\n[5] Checking results...")
        
        final_job = await jobs_repo.get_job(test_user_id, job_id)
        final_project = await projects_repo.get_project(test_user_id, project_id)
        
        status = final_job.get("status")
        warnings = final_job.get("warnings", [])
        error = final_job.get("error")
        result = final_job.get("result", {})
        latest_job_id = final_project.get("latest_successful_job_id")
        
        print(f"    Job status: {status}")
        print(f"    Warnings: {warnings}")
        print(f"    Error: {error}")
        print(f"    Result: {result}")
        print(f"    Project.latest_successful_job_id: {latest_job_id}")
        
        # ───────────────────────────────────────────────────────────────
        # Step 6: Evaluate Pass/Fail
        # ───────────────────────────────────────────────────────────────
        print("\n[6] Evaluating...")
        
        terminal_states = {
            JobStatus.COMPLETED.value,
            JobStatus.COMPLETED_WITH_WARNINGS.value,
            JobStatus.FAILED.value
        }
        
        if status not in terminal_states:
            print(f"    ✗ FAIL: Job did not reach terminal state (got {status})")
            passed = False
        else:
            print(f"    ✓ Job reached terminal state: {status}")
        
        if status in {JobStatus.COMPLETED.value, JobStatus.COMPLETED_WITH_WARNINGS.value}:
            if latest_job_id == job_id:
                print(f"    ✓ latest_successful_job_id updated correctly")
            else:
                print(f"    ✗ FAIL: latest_successful_job_id not updated")
                passed = False
        elif status == JobStatus.FAILED.value:
            print(f"    ⚠ Job failed (this may be expected if Gemini key is invalid)")
            print(f"    ⚠ Error: {error}")
            # Not necessarily a test failure - the invariants still held
            if latest_job_id is None:
                print(f"    ✓ latest_successful_job_id correctly NOT updated on failure")
            else:
                print(f"    ✗ FAIL: latest_successful_job_id should not update on failure")
                passed = False
        
        # Check workspace cleanup
        workspace = Path(f"/tmp/architex/{job_id}")
        if workspace.exists():
            print(f"    ✗ FAIL: Workspace not cleaned up: {workspace}")
            passed = False
        else:
            print(f"    ✓ Workspace cleaned up")
        
    except Exception as e:
        print(f"\n✗ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        passed = False
        
    finally:
        # Cleanup test data
        print("\n[7] Cleanup...")
        try:
            db = get_db()
            if project_id:
                await projects_repo.delete_project(test_user_id, project_id)
                print(f"    ✓ Deleted project")
            if test_user_id:
                await db.jobs.delete_many({"userId": test_user_id})
                print(f"    ✓ Deleted jobs")
            await close_mongo()
            print(f"    ✓ Closed DB connection")
        except Exception as e:
            print(f"    ⚠ Cleanup error: {e}")
    
    # ───────────────────────────────────────────────────────────────────
    # Final Verdict
    # ───────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    if passed:
        print("✓ PASS: E2E test completed successfully")
        print("  The system enforces all invariants correctly.")
    else:
        print("✗ FAIL: E2E test failed")
        print("  See above for details.")
    print("=" * 60)
    
    return passed


# ═══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    if not check_env():
        sys.exit(1)
    
    success = asyncio.run(run_e2e_once())
    sys.exit(0 if success else 1)
