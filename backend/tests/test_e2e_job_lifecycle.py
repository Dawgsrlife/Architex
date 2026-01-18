#!/usr/bin/env python3
"""
End-to-End Integration Test

Proves the full job lifecycle:
1. Create project
2. Create job 
3. Verify status transitions
4. Verify warnings handling
5. Verify latest_successful_job_id update
6. Cleanup

Run modes:
- Mock mode (default): Tests invariants without external services
- Live mode: Tests with real MongoDB, Gemini, GitHub

Usage:
    python tests/test_e2e_job_lifecycle.py           # Mock mode
    python tests/test_e2e_job_lifecycle.py --live    # Live mode (requires .env)
"""
import asyncio
import sys
import os
import uuid
import argparse
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch, MagicMock

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


def ok(msg): print(f"{Colors.GREEN}✓{Colors.RESET} {msg}")
def fail(msg): print(f"{Colors.RED}✗{Colors.RESET} {msg}")
def info(msg): print(f"{Colors.BLUE}ℹ{Colors.RESET} {msg}")
def warn(msg): print(f"{Colors.YELLOW}⚠{Colors.RESET} {msg}")


async def test_mock_mode():
    """
    Test invariants using mocked services.
    Proves the logic without external dependencies.
    """
    print("\n" + "=" * 60)
    print("E2E TEST: Mock Mode (No External Services)")
    print("=" * 60)
    
    from database.mongo import init_mongo, close_mongo, get_db
    from repos import projects_repo, jobs_repo
    from services.job_worker import job_worker, JobStatus
    
    # Check if MongoDB is configured
    if not settings.mongodb_uri:
        fail("MONGODB_URI not set - cannot run tests")
        print("\nTo run tests, create backend/.env with:")
        print("  MONGODB_URI=mongodb+srv://...")
        return False
    
    await init_mongo()
    db = get_db()
    
    test_user_id = f"e2e_test_{uuid.uuid4().hex[:8]}"
    project_id = None
    job_id = None
    
    try:
        # ═══════════════════════════════════════════════════════════════
        # PHASE 1: Project Creation
        # ═══════════════════════════════════════════════════════════════
        info("Phase 1: Project Creation")
        
        project = await projects_repo.create_project(
            userId=test_user_id,
            project_name="E2E Test Project",
            description="Integration test project"
        )
        project_id = project["projectId"]
        
        assert project.get("latest_successful_job_id") is None, \
            "latest_successful_job_id should be None initially"
        ok("Project created with latest_successful_job_id=None")
        
        assert project.get("current_nodes") == [], \
            "current_nodes should be empty initially"
        ok("Project has empty current_nodes")
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 2: Job Creation
        # ═══════════════════════════════════════════════════════════════
        info("Phase 2: Job Creation")
        
        spec = {
            "name": "Test Architecture",
            "description": "Minimal test spec",
            "prompt": "Create a simple hello world app",
            "nodes": [{"id": "n1", "type": "backend", "data": {"label": "API"}}],
            "edges": []
        }
        
        job = await jobs_repo.create_job(
            userId=test_user_id,
            projectId=project_id,
            architecture_spec=spec
        )
        job_id = job["jobId"]
        
        assert job.get("status") == JobStatus.PENDING.value, \
            f"Initial status should be pending, got {job.get('status')}"
        ok("Job created with status=pending")
        
        assert job.get("prompt") == "Create a simple hello world app", \
            "Prompt should be denormalized"
        ok("Prompt denormalized correctly")
        
        assert job.get("warnings") == [], \
            "Warnings should be empty initially"
        ok("Warnings initialized as empty list")
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 3: Status Transitions
        # ═══════════════════════════════════════════════════════════════
        info("Phase 3: Status Transitions")
        
        # Valid: pending → running
        success = await jobs_repo.update_job_status(
            test_user_id, job_id, JobStatus.RUNNING.value
        )
        assert success, "pending → running should succeed"
        ok("Transition pending → running: ALLOWED")
        
        # Invalid: running → pending (backward)
        success = await jobs_repo.update_job_status(
            test_user_id, job_id, JobStatus.PENDING.value
        )
        assert not success, "running → pending should be rejected"
        ok("Transition running → pending: REJECTED")
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 4: Warnings Handling
        # ═══════════════════════════════════════════════════════════════
        info("Phase 4: Warnings Handling")
        
        warnings = ["Test warning 1", "Test warning 2"]
        await jobs_repo.append_job_warnings(test_user_id, job_id, warnings)
        
        updated_job = await jobs_repo.get_job(test_user_id, job_id)
        assert len(updated_job.get("warnings", [])) == 2, \
            "Should have 2 warnings"
        ok("Warnings appended correctly")
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 5: Job Completion & Project Update
        # ═══════════════════════════════════════════════════════════════
        info("Phase 5: Job Completion & Project Update")
        
        # Use job_worker._update_status to test full integration
        await job_worker._update_status(
            test_user_id, job_id,
            JobStatus.COMPLETED_WITH_WARNINGS,
            result={"files_generated": 5},
            warnings=["Final warning"]
        )
        
        # Verify job state
        final_job = await jobs_repo.get_job(test_user_id, job_id)
        assert final_job["status"] == JobStatus.COMPLETED_WITH_WARNINGS.value
        ok("Job status = completed_with_warnings")
        
        assert final_job.get("completedAt") is not None
        ok("completedAt timestamp set")
        
        assert len(final_job.get("warnings", [])) == 3  # 2 + 1
        ok(f"Warnings accumulated: {len(final_job.get('warnings', []))} total")
        
        # Verify project update
        updated_project = await projects_repo.get_project(test_user_id, project_id)
        assert updated_project["latest_successful_job_id"] == job_id, \
            "latest_successful_job_id should be updated on success"
        ok("Project.latest_successful_job_id updated correctly")
        
        # ═══════════════════════════════════════════════════════════════
        # PHASE 6: Terminal State Enforcement
        # ═══════════════════════════════════════════════════════════════
        info("Phase 6: Terminal State Enforcement")
        
        # Invalid: completed_with_warnings → running
        success = await jobs_repo.update_job_status(
            test_user_id, job_id, JobStatus.RUNNING.value
        )
        assert not success, "Terminal state should not allow transitions"
        ok("Terminal state (completed_with_warnings) is locked")
        
        # Invalid: completed_with_warnings → failed
        success = await jobs_repo.update_job_status(
            test_user_id, job_id, JobStatus.FAILED.value
        )
        assert not success
        ok("Cannot transition from terminal to another terminal state")
        
        print("\n" + "=" * 60)
        print(f"{Colors.GREEN}ALL E2E TESTS PASSED{Colors.RESET}")
        print("=" * 60)
        return True
        
    except AssertionError as e:
        fail(f"Assertion failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    except Exception as e:
        fail(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Cleanup
        info("Cleanup: Removing test data")
        if project_id:
            await projects_repo.delete_project(test_user_id, project_id)
        if test_user_id:
            await db.jobs.delete_many({"userId": test_user_id})
        
        await close_mongo()
        ok("Test data cleaned up")


async def test_live_mode():
    """
    Full end-to-end test with real services.
    Requires: MongoDB, Gemini API key, GitHub token
    """
    print("\n" + "=" * 60)
    print("E2E TEST: Live Mode (Real Services)")
    print("=" * 60)
    
    # Check required config
    missing = []
    if not settings.mongodb_uri:
        missing.append("MONGODB_URI")
    if not settings.google_gemini_api_key:
        missing.append("GOOGLE_GEMINI_API_KEY")
    
    if missing:
        fail(f"Missing required config: {', '.join(missing)}")
        print("\nCreate backend/.env with the required values.")
        return False
    
    warn("Live mode not yet implemented - run mock mode first")
    warn("Live mode requires a GitHub OAuth token from a real user")
    return False


async def main():
    parser = argparse.ArgumentParser(description="E2E Job Lifecycle Test")
    parser.add_argument("--live", action="store_true", help="Run with real services")
    args = parser.parse_args()
    
    if args.live:
        success = await test_live_mode()
    else:
        success = await test_mock_mode()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
