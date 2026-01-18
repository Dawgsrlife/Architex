"""Seed script for creating test job in MongoDB"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime
from bson import ObjectId

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from agent_runner.db import Database
from agent_runner.config import Config
from dotenv import load_dotenv

load_dotenv()


async def seed_job():
    """Create a test project and job"""
    await Database.connect()
    
    db = Database.get_database()
    projects_collection = db.projects
    jobs_collection = db.jobs
    
    # Sample architecture spec (React Flow format)
    sample_architecture_spec = {
        "name": "Sample E-Commerce App",
        "description": "A modern e-commerce application with Next.js frontend and FastAPI backend",
        "nodes": [
            {
                "id": "1",
                "type": "frontend",
                "data": {
                    "label": "Next.js Frontend",
                    "framework": "nextjs",
                    "description": "React-based frontend application"
                },
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "2",
                "type": "backend",
                "data": {
                    "label": "FastAPI Backend",
                    "framework": "fastapi",
                    "description": "RESTful API server"
                },
                "position": {"x": 300, "y": 100}
            },
            {
                "id": "3",
                "type": "database",
                "data": {
                    "label": "MongoDB Database",
                    "framework": "mongodb",
                    "description": "NoSQL database for data storage"
                },
                "position": {"x": 500, "y": 100}
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "1",
                "target": "2",
                "type": "http"
            },
            {
                "id": "e2-3",
                "source": "2",
                "target": "3",
                "type": "database"
            }
        ],
        "components": ["Next.js Frontend", "FastAPI Backend", "MongoDB Database"],
        "frameworks": ["nextjs", "fastapi", "mongodb"],
        "metadata": {
            "version": "1.0.0",
            "created": datetime.utcnow().isoformat()
        }
    }
    
    # Create or get project
    project_id = str(ObjectId())
    project_name = "Test E-Commerce Project"
    repo_url = "https://github.com/username/test-ecommerce.git"  # Placeholder
    
    project_doc = {
        "_id": project_id,
        "ownerId": "test-user-id",
        "name": project_name,
        "description": "Test project for agent runner",
        "githubRepoUrl": repo_url,
        "lastUpdated": datetime.utcnow(),
        "jobIds": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Insert project
    await projects_collection.insert_one(project_doc)
    print(f"Created project: {project_id} - {project_name}")
    
    # Create job
    job_id = str(ObjectId())
    job_doc = {
        "_id": job_id,
        "projectId": project_id,
        "status": "pending",
        "architecture_spec": sample_architecture_spec,
        "logs": [],
        "metadata": {},
        "createdAt": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Insert job
    await jobs_collection.insert_one(job_doc)
    print(f"Created job: {job_id} - status: pending")
    
    # Update project with job ID
    await projects_collection.update_one(
        {"_id": project_id},
        {"$push": {"jobIds": job_id}}
    )
    
    print("\nSeed data created successfully!")
    print(f"Project ID: {project_id}")
    print(f"Job ID: {job_id}")
    print(f"Job status: pending")
    print("\nThe agent runner will pick up this job automatically.")
    
    await Database.disconnect()


if __name__ == "__main__":
    asyncio.run(seed_job())
