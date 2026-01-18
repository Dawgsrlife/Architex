"""
Comprehensive Database Layer Test Suite
Run: python tests/test_database.py

This tests REAL MongoDB Atlas connectivity and all repository operations.
"""
import asyncio
import sys
import os
from datetime import datetime, timezone

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from database.mongo import init_mongo, close_mongo, get_db, is_connected
from database.indexes import ensure_indexes
from repos import users_repo, projects_repo, jobs_repo


class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def ok(self, name: str):
        self.passed += 1
        print(f"  ✓ {name}")
    
    def fail(self, name: str, error: str):
        self.failed += 1
        self.errors.append((name, error))
        print(f"  ✗ {name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"Results: {self.passed}/{total} passed")
        if self.errors:
            print(f"\nFailures:")
            for name, error in self.errors:
                print(f"  - {name}: {error}")
        print(f"{'='*50}")
        return self.failed == 0


async def test_connection(results: TestResults):
    """Test 1: MongoDB Atlas Connection"""
    print("\n[1] Testing MongoDB Connection...")
    
    # Check env var exists
    if not settings.mongodb_uri:
        results.fail("MONGODB_URI set", "Environment variable not found")
        return False
    results.ok("MONGODB_URI set")
    
    # Check URI format
    if not settings.mongodb_uri.startswith("mongodb"):
        results.fail("URI format", f"Invalid format: {settings.mongodb_uri[:20]}...")
        return False
    results.ok("URI format valid")
    
    # Attempt connection
    try:
        await init_mongo(max_retries=1, retry_delay=1.0)
        results.ok("Connection established")
    except Exception as e:
        results.fail("Connection established", str(e))
        return False
    
    # Verify is_connected works
    connected = await is_connected()
    if connected:
        results.ok("is_connected() returns True")
    else:
        results.fail("is_connected()", "Returns False after init")
        return False
    
    # Get database
    try:
        db = get_db()
        if db is not None:
            results.ok("get_db() returns database")
        else:
            results.fail("get_db()", "Returns None")
            return False
    except Exception as e:
        results.fail("get_db()", str(e))
        return False
    
    # List collections
    try:
        collections = await db.list_collection_names()
        results.ok(f"list_collection_names() works ({len(collections)} collections)")
    except Exception as e:
        results.fail("list_collection_names()", str(e))
    
    return True


async def test_indexes(results: TestResults):
    """Test 2: Index Creation"""
    print("\n[2] Testing Index Creation...")
    
    try:
        await ensure_indexes()
        results.ok("ensure_indexes() completed")
    except Exception as e:
        results.fail("ensure_indexes()", str(e))
        return
    
    # Verify indexes exist
    db = get_db()
    
    # Check users indexes
    user_indexes = await db.users.index_information()
    if "userId_1" in user_indexes:
        results.ok("users.userId index exists")
    else:
        results.fail("users.userId index", f"Not found. Indexes: {list(user_indexes.keys())}")
    
    # Check projects indexes
    proj_indexes = await db.projects.index_information()
    if any("userId" in idx and "projectId" in idx for idx in proj_indexes.keys()):
        results.ok("projects compound index exists")
    else:
        results.fail("projects compound index", f"Not found. Indexes: {list(proj_indexes.keys())}")
    
    # Check jobs indexes
    job_indexes = await db.jobs.index_information()
    if any("userId" in idx and "jobId" in idx for idx in job_indexes.keys()):
        results.ok("jobs compound index exists")
    else:
        results.fail("jobs compound index", f"Not found. Indexes: {list(job_indexes.keys())}")


async def test_users_repo(results: TestResults):
    """Test 3: Users Repository"""
    print("\n[3] Testing Users Repository...")
    
    test_user_id = "test_user_12345"
    
    try:
        # Cleanup first - delete by both userId AND email to avoid unique constraint issues
        db = get_db()
        await db.users.delete_many({"$or": [
            {"userId": test_user_id},
            {"email": {"$in": ["test@example.com", "updated@example.com"]}}
        ]})
        
        # Test upsert (create)
        user = await users_repo.upsert_user(
            userId=test_user_id,
            github_access_token="test_token_abc",
            email="test@example.com",
            name="Test User"
        )
        if user and user.get("userId") == test_user_id:
            results.ok("upsert_user() creates new user")
        else:
            results.fail("upsert_user() create", f"Returned: {user}")
            return
        
        # Test get
        fetched = await users_repo.get_user(test_user_id)
        if fetched and fetched.get("email") == "test@example.com":
            results.ok("get_user() retrieves user")
        else:
            results.fail("get_user()", f"Returned: {fetched}")
        
        # Test upsert (update)
        updated = await users_repo.upsert_user(
            userId=test_user_id,
            github_access_token="updated_token",
            email="updated@example.com",
            name="Updated User"
        )
        if updated and updated.get("email") == "updated@example.com":
            results.ok("upsert_user() updates existing user")
        else:
            results.fail("upsert_user() update", f"Returned: {updated}")
        
        # Test token update
        success = await users_repo.update_github_token(test_user_id, "new_token_xyz")
        if success:
            results.ok("update_github_token() works")
        else:
            results.fail("update_github_token()", "Returned False")
        
        # Verify token was updated
        final = await users_repo.get_user(test_user_id)
        if final and final.get("github_access_token") == "new_token_xyz":
            results.ok("Token actually updated in DB")
        else:
            results.fail("Token update verification", f"Token: {final.get('github_access_token')}")
        
        # Cleanup
        await db.users.delete_one({"userId": test_user_id})
        results.ok("Cleanup completed")
        
    except Exception as e:
        results.fail("Users repo test", str(e))
        import traceback
        traceback.print_exc()


async def test_projects_repo(results: TestResults):
    """Test 4: Projects Repository"""
    print("\n[4] Testing Projects Repository...")
    
    test_user_id = "test_user_proj_12345"
    test_project_id = None
    
    try:
        db = get_db()
        # Cleanup
        await db.projects.delete_many({"userId": test_user_id})
        
        # Create project
        project = await projects_repo.create_project(
            userId=test_user_id,
            project_name="Test Project",
            description="A test project",
            repository_url=None
        )
        if project and project.get("projectId"):
            test_project_id = project["projectId"]
            results.ok(f"create_project() works (id: {test_project_id[:8]}...)")
        else:
            results.fail("create_project()", f"Returned: {project}")
            return
        
        # Verify fields
        if project.get("current_nodes") == []:
            results.ok("current_nodes initialized as empty list")
        else:
            results.fail("current_nodes init", f"Got: {project.get('current_nodes')}")
        
        if project.get("prompts_history") == []:
            results.ok("prompts_history initialized as empty list")
        else:
            results.fail("prompts_history init", f"Got: {project.get('prompts_history')}")
        
        # Get project
        fetched = await projects_repo.get_project(test_user_id, test_project_id)
        if fetched and fetched.get("project_name") == "Test Project":
            results.ok("get_project() retrieves project")
        else:
            results.fail("get_project()", f"Returned: {fetched}")
        
        # Update nodes
        test_nodes = [{"id": "node1", "type": "frontend", "data": {"label": "React"}}]
        success = await projects_repo.update_current_nodes(test_user_id, test_project_id, test_nodes)
        if success:
            results.ok("update_current_nodes() works")
        else:
            results.fail("update_current_nodes()", "Returned False")
        
        # Verify nodes updated
        updated = await projects_repo.get_project(test_user_id, test_project_id)
        if updated and len(updated.get("current_nodes", [])) == 1:
            results.ok("Nodes actually updated in DB")
        else:
            results.fail("Nodes update verification", f"Nodes: {updated.get('current_nodes')}")
        
        # Append prompt
        success = await projects_repo.append_prompt_to_history(
            test_user_id, test_project_id, 
            "Build a React app", 
            {"source": "test"}
        )
        if success:
            results.ok("append_prompt_to_history() works")
        else:
            results.fail("append_prompt_to_history()", "Returned False")
        
        # Verify prompt appended
        with_prompt = await projects_repo.get_project(test_user_id, test_project_id)
        if with_prompt and len(with_prompt.get("prompts_history", [])) == 1:
            results.ok("Prompt actually appended in DB")
        else:
            results.fail("Prompt append verification", f"History: {with_prompt.get('prompts_history')}")
        
        # Set GitHub URL
        success = await projects_repo.set_github_repo_url(
            test_user_id, test_project_id,
            "https://github.com/test/repo"
        )
        if success:
            results.ok("set_github_repo_url() works")
        else:
            results.fail("set_github_repo_url()", "Returned False")
        
        # List projects
        projects = await projects_repo.list_projects(test_user_id)
        if len(projects) >= 1:
            results.ok(f"list_projects() works ({len(projects)} projects)")
        else:
            results.fail("list_projects()", f"Returned {len(projects)} projects")
        
        # Delete project
        success = await projects_repo.delete_project(test_user_id, test_project_id)
        if success:
            results.ok("delete_project() works")
        else:
            results.fail("delete_project()", "Returned False")
        
        # Verify deleted
        gone = await projects_repo.get_project(test_user_id, test_project_id)
        if gone is None:
            results.ok("Project actually deleted from DB")
        else:
            results.fail("Delete verification", "Project still exists")
        
    except Exception as e:
        results.fail("Projects repo test", str(e))
        import traceback
        traceback.print_exc()


async def test_jobs_repo(results: TestResults):
    """Test 5: Jobs Repository"""
    print("\n[5] Testing Jobs Repository...")
    
    test_user_id = "test_user_jobs_12345"
    test_project_id = "test_project_jobs_12345"
    test_job_id = None
    
    try:
        db = get_db()
        # Cleanup
        await db.jobs.delete_many({"userId": test_user_id})
        
        # Create job
        job = await jobs_repo.create_job(
            userId=test_user_id,
            projectId=test_project_id,
            architecture_spec={"nodes": [], "edges": [], "prompt": "test"}
        )
        if job and job.get("jobId"):
            test_job_id = job["jobId"]
            results.ok(f"create_job() works (id: {test_job_id[:8]}...)")
        else:
            results.fail("create_job()", f"Returned: {job}")
            return
        
        # Verify status
        if job.get("status") == "pending":
            results.ok("Initial status is 'pending'")
        else:
            results.fail("Initial status", f"Got: {job.get('status')}")
        
        # Get job
        fetched = await jobs_repo.get_job(test_user_id, test_job_id)
        if fetched and fetched.get("jobId") == test_job_id:
            results.ok("get_job() retrieves job")
        else:
            results.fail("get_job()", f"Returned: {fetched}")
        
        # Update status
        success = await jobs_repo.update_job_status(test_user_id, test_job_id, "generating")
        if success:
            results.ok("update_job_status() works")
        else:
            results.fail("update_job_status()", "Returned False")
        
        # Verify status updated
        updated = await jobs_repo.get_job(test_user_id, test_job_id)
        if updated and updated.get("status") == "generating":
            results.ok("Status actually updated in DB")
        else:
            results.fail("Status update verification", f"Status: {updated.get('status')}")
        
        # Update to completed (should set completedAt)
        success = await jobs_repo.update_job_status(test_user_id, test_job_id, "completed")
        done_job = await jobs_repo.get_job(test_user_id, test_job_id)
        if done_job and done_job.get("completedAt"):
            results.ok("completedAt set when status=completed")
        else:
            results.fail("completedAt", "Not set when done")
        
        # Append logs
        success = await jobs_repo.append_job_logs(
            test_user_id, test_job_id,
            [{"ts": datetime.now(timezone.utc), "level": "info", "message": "Test log"}]
        )
        if success:
            results.ok("append_job_logs() works")
        else:
            results.fail("append_job_logs()", "Returned False")
        
        # Verify logs
        with_logs = await jobs_repo.get_job(test_user_id, test_job_id)
        if with_logs and len(with_logs.get("logs", [])) == 1:
            results.ok("Logs actually appended in DB")
        else:
            results.fail("Logs append verification", f"Logs: {with_logs.get('logs')}")
        
        # List jobs for project
        jobs = await jobs_repo.list_jobs_for_project(test_user_id, test_project_id)
        if len(jobs) >= 1:
            results.ok(f"list_jobs_for_project() works ({len(jobs)} jobs)")
        else:
            results.fail("list_jobs_for_project()", f"Returned {len(jobs)} jobs")
        
        # Cleanup
        await db.jobs.delete_many({"userId": test_user_id})
        results.ok("Cleanup completed")
        
    except Exception as e:
        results.fail("Jobs repo test", str(e))
        import traceback
        traceback.print_exc()


async def test_close_connection(results: TestResults):
    """Test 6: Connection Cleanup"""
    print("\n[6] Testing Connection Cleanup...")
    
    try:
        await close_mongo()
        results.ok("close_mongo() completed")
        
        # Verify disconnected
        connected = await is_connected()
        if not connected:
            results.ok("is_connected() returns False after close")
        else:
            results.fail("is_connected() after close", "Still returns True")
    except Exception as e:
        results.fail("Connection cleanup", str(e))


async def main():
    print("="*50)
    print("DATABASE LAYER TEST SUITE")
    print("="*50)
    print(f"MongoDB URI: {settings.mongodb_uri[:30]}..." if settings.mongodb_uri else "MONGODB_URI NOT SET")
    print(f"Database: {settings.mongodb_db_name}")
    
    results = TestResults()
    
    # Run all tests
    connected = await test_connection(results)
    
    if connected:
        await test_indexes(results)
        await test_users_repo(results)
        await test_projects_repo(results)
        await test_jobs_repo(results)
        await test_close_connection(results)
    else:
        print("\n⚠️ Skipping remaining tests due to connection failure")
    
    # Summary
    success = results.summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
