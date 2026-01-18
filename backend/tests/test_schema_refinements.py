"""
Tests for Schema Refinements
- warnings in jobs
- latest_successful_job_id in projects
- prompt denormalization
- status transitions
"""
import asyncio
import sys
import os
import uuid
from datetime import datetime, timezone

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from database.mongo import init_mongo, close_mongo, get_db
from repos import projects_repo, jobs_repo
from services.job_worker import job_worker, JobStatus

async def test_schema_refinements():
    print("=" * 50)
    print("TESTING SCHEMA REFINEMENTS")
    print("=" * 50)
    
    # Init DB
    await init_mongo()
    db = get_db()
    
    user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    project_id = None
    job_id = None
    
    try:
        # 1. Create Project
        print("\n[1] Testing Project Creation...")
        project = await projects_repo.create_project(
            userId=user_id,
            project_name="Schema Test Project"
        )
        project_id = project["projectId"]
        
        # Verify latest_successful_job_id is None
        assert project.get("latest_successful_job_id") is None
        print("✓ latest_successful_job_id is initially None")
        
        # 2. Create Job
        print("\n[2] Testing Job Creation...")
        spec = {
            "prompt": "Build a test app",
            "nodes": [],
            "edges": []
        }
        job = await jobs_repo.create_job(
            userId=user_id,
            projectId=project_id,
            architecture_spec=spec
        )
        job_id = job["jobId"]
        
        # Verify prompt denormalization
        assert job.get("prompt") == "Build a test app"
        print("✓ Prompt denormalized correctly")
        
        # Verify warnings list exists
        assert job.get("warnings") == []
        print("✓ Warnings list initialized empty")
        
        # 3. Test Status Transitions & Warnings
        print("\n[3] Testing Transitions & Warnings...")
        
        # Pending -> Running
        success = await jobs_repo.update_job_status(user_id, job_id, JobStatus.RUNNING.value)
        assert success
        print("✓ Transition Pending -> Running allowed")
        
        # Running -> Completed with warnings
        warnings = ["Warning 1", "Warning 2"]
        # Use _update_status from worker to test full integration including project update
        await job_worker._update_status(
            user_id, job_id, 
            JobStatus.COMPLETED_WITH_WARNINGS, 
            warnings=warnings
        )
        
        # Verify job state
        updated_job = await jobs_repo.get_job(user_id, job_id)
        assert updated_job["status"] == JobStatus.COMPLETED_WITH_WARNINGS.value
        assert len(updated_job["warnings"]) == 2
        assert updated_job["warnings"][0] == "Warning 1"
        print("✓ Job completed with warnings")
        
        # 4. Verify Project Update
        print("\n[4] Verify Project Update...")
        updated_project = await projects_repo.get_project(user_id, project_id)
        assert updated_project["latest_successful_job_id"] == job_id
        print("✓ Project latest_successful_job_id updated")
        
        # 5. Test Invalid Transition
        print("\n[5] Testing Invalid Transition...")
        # Completed -> Running should fail
        success = await jobs_repo.update_job_status(user_id, job_id, JobStatus.RUNNING.value)
        assert not success
        print("✓ Invalid transition prevented")

        print("\nAll schema refinement tests passed! ✓")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        if project_id:
            await projects_repo.delete_project(user_id, project_id)
        if user_id:
            await db.jobs.delete_many({"userId": user_id})
        
        await close_mongo()

if __name__ == "__main__":
    asyncio.run(test_schema_refinements())
