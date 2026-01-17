#!/usr/bin/env python3
"""
Smoke test for MongoDB Atlas integration
Tests basic CRUD operations for users, projects, and jobs
"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from database.mongo import init_mongo, close_mongo, get_db
from database.indexes import ensure_indexes
from repos import users_repo, projects_repo, jobs_repo
import uuid


async def smoke_test():
    """Run smoke tests"""
    print("🚀 Starting MongoDB Atlas smoke test...\n")
    
    try:
        # Initialize MongoDB connection
        print("1. Connecting to MongoDB Atlas...")
        await init_mongo()
        print("   ✅ Connected successfully\n")
        
        # Ensure indexes
        print("2. Ensuring indexes...")
        await ensure_indexes()
        print("   ✅ Indexes ensured\n")
        
        # Test user operations
        print("3. Testing user operations...")
        test_user_id = f"test_{uuid.uuid4().hex[:8]}"
        test_token = f"test_token_{uuid.uuid4().hex}"
        
        user = await users_repo.upsert_user(
            userId=test_user_id,
            github_access_token=test_token,
            email="test@example.com",
            name="Test User"
        )
        assert user is not None
        assert user["userId"] == test_user_id
        print(f"   ✅ Created user: {test_user_id}")
        
        retrieved_user = await users_repo.get_user(test_user_id)
        assert retrieved_user is not None
        assert retrieved_user["userId"] == test_user_id
        print(f"   ✅ Retrieved user: {test_user_id}\n")
        
        # Test project operations
        print("4. Testing project operations...")
        project = await projects_repo.create_project(
            userId=test_user_id,
            project_name="Test Project",
            description="A test project",
            repository_url="https://github.com/test/repo"
        )
        assert project is not None
        project_id = project["projectId"]
        print(f"   ✅ Created project: {project_id}")
        
        retrieved_project = await projects_repo.get_project(test_user_id, project_id)
        assert retrieved_project is not None
        assert retrieved_project["projectId"] == project_id
        print(f"   ✅ Retrieved project: {project_id}")
        
        projects_list = await projects_repo.list_projects(test_user_id)
        assert len(projects_list) >= 1
        print(f"   ✅ Listed {len(projects_list)} project(s)\n")
        
        # Test job operations
        print("5. Testing job operations...")
        test_spec = {
            "name": "Test Architecture",
            "description": "A test architecture",
            "nodes": [{"id": "1", "type": "api"}],
            "edges": []
        }
        
        job = await jobs_repo.create_job(
            userId=test_user_id,
            projectId=project_id,
            architecture_spec=test_spec
        )
        assert job is not None
        job_id = job["jobId"]
        assert job["status"] == "pending"
        print(f"   ✅ Created job: {job_id}")
        
        retrieved_job = await jobs_repo.get_job(test_user_id, job_id)
        assert retrieved_job is not None
        assert retrieved_job["jobId"] == job_id
        print(f"   ✅ Retrieved job: {job_id}")
        
        # Update job status
        await jobs_repo.update_job_status(test_user_id, job_id, "running")
        updated_job = await jobs_repo.get_job(test_user_id, job_id)
        assert updated_job["status"] == "running"
        print(f"   ✅ Updated job status to: running")
        
        # Append logs
        test_logs = [
            {"ts": "2024-01-01T00:00:00Z", "level": "info", "message": "Test log message"}
        ]
        await jobs_repo.append_job_logs(test_user_id, job_id, test_logs)
        logged_job = await jobs_repo.get_job(test_user_id, job_id)
        assert len(logged_job.get("logs", [])) >= 1
        print(f"   ✅ Appended logs to job")
        
        # Update to done
        await jobs_repo.update_job_status(test_user_id, job_id, "done", result={"success": True})
        final_job = await jobs_repo.get_job(test_user_id, job_id)
        assert final_job["status"] == "done"
        assert final_job.get("result") is not None
        print(f"   ✅ Updated job status to: done\n")
        
        # List jobs for project
        project_jobs = await jobs_repo.list_jobs_for_project(test_user_id, project_id)
        assert len(project_jobs) >= 1
        print(f"   ✅ Listed {len(project_jobs)} job(s) for project\n")
        
        print("✅ All smoke tests passed!\n")
        print("Summary:")
        print(f"  - User ID: {test_user_id}")
        print(f"  - Project ID: {project_id}")
        print(f"  - Job ID: {job_id}")
        print(f"  - Total projects: {len(projects_list)}")
        print(f"  - Total jobs: {len(project_jobs)}")
        
    except Exception as e:
        print(f"\n❌ Smoke test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        # Close connection
        print("\n6. Closing MongoDB connection...")
        await close_mongo()
        print("   ✅ Connection closed")


if __name__ == "__main__":
    asyncio.run(smoke_test())

