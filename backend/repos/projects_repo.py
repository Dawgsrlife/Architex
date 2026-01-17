"""
Projects repository - data access layer for projects collection
"""
import logging
import uuid
from typing import List, Optional
from database.mongo import get_db
from schemas.projects import ProjectCreateRequest
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)


async def list_projects(userId: str) -> List[dict]:
    """List all projects for a user"""
    db = get_db()
    collection = db.projects
    
    projects = []
    async for project in collection.find({"userId": userId}).sort("last_updated", -1):
        projects.append(project)
    
    return projects


async def create_project(userId: str, project_name: str, description: Optional[str] = None, repository_url: Optional[str] = None) -> dict:
    """
    Create a new project
    Returns: project document dict
    """
    db = get_db()
    collection = db.projects
    
    projectId = str(uuid.uuid4())
    now = get_utc_now()
    
    project_doc = {
        "projectId": projectId,
        "userId": userId,
        "project_name": project_name,
        "description": description,
        "repository_url": repository_url,
        "last_updated": now,
        "createdAt": now,
        "updatedAt": now,
    }
    
    await collection.insert_one(project_doc)
    logger.info(f"Created project {projectId} for user {userId}")
    
    return await collection.find_one({"projectId": projectId, "userId": userId})


async def get_project(userId: str, projectId: str) -> Optional[dict]:
    """Get project by userId and projectId"""
    db = get_db()
    collection = db.projects
    return await collection.find_one({"userId": userId, "projectId": projectId})


async def touch_project_last_updated(userId: str, projectId: str) -> bool:
    """Update last_updated timestamp for a project"""
    db = get_db()
    collection = db.projects
    
    result = await collection.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$set": {
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    
    return result.modified_count > 0

