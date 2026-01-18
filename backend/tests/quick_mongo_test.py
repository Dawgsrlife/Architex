#!/usr/bin/env python3
"""Quick MongoDB test"""
import asyncio
import os
import sys
import traceback

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

async def test():
    from database.mongo import init_mongo, close_mongo, get_db
    from repos import projects_repo, jobs_repo
    import uuid
    
    await init_mongo()
    db = get_db()
    
    user_id = f'test_verify_{uuid.uuid4().hex[:8]}'
    
    try:
        project_id = await projects_repo.create_project(user_id, 'Test')
        print(f'Created project: {project_id}')
        
        job_doc = await jobs_repo.create_job(
            userId=user_id,
            projectId=project_id,
            architecture_spec={'prompt': 'Test', 'test': True}
        )
        print(f'Created job: {job_doc["jobId"]}')
        job_id = job_doc["jobId"]
        
        # Test status update
        await jobs_repo.update_job_status(user_id, job_id, "running")
        print('Updated status to running')
        
        await jobs_repo.update_job_status(user_id, job_id, "completed", result={"test": True})
        print('Updated status to completed')
        
        # Verify
        job = await jobs_repo.get_job(user_id, job_id)
        print(f'Final status: {job.get("status")}')
        
        print('SUCCESS!')
        
    except Exception as e:
        traceback.print_exc()
    finally:
        await db.projects.delete_many({'userId': user_id})
        await db.jobs.delete_many({'userId': user_id})
        await close_mongo()

if __name__ == "__main__":
    asyncio.run(test())
