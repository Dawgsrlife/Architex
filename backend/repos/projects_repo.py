"""
Projects repository - data access layer for projects collection
Supports: current_nodes (state), prompts_history (list), github_repo_url
One project -> many jobs relationship
"""
# latest_successful_job_id is updated ONLY when a job reaches
# completed or completed_with_warnings.

import logging
import uuid
from typing import List, Optional, Dict, Any
from database.mongo import get_db
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)


async def list_projects(userId: str) -> List[dict]:
    """List all projects for a user, sorted by last_updated desc"""
    db = get_db()
    projects = []
    async for project in db.projects.find({"userId": userId}).sort("last_updated", -1):
        projects.append(project)
    return projects


async def create_project(
    userId: str, 
    project_name: str, 
    description: Optional[str] = None,
    repository_url: Optional[str] = None,
    current_nodes: Optional[List[Dict[str, Any]]] = None
) -> dict:
    """
    Create a new project
    Returns: project document dict
    """
    db = get_db()
    projectId = str(uuid.uuid4())
    now = get_utc_now()
    
    project_doc = {
        "projectId": projectId,
        "userId": userId,
        "project_name": project_name,
        "description": description,
        "github_repo_url": repository_url,
        "current_nodes": current_nodes or [],
        "prompts_history": [],
        "latest_successful_job_id": None,
        "last_updated": now,
        "createdAt": now,
        "updatedAt": now,
    }
    
    await db.projects.insert_one(project_doc)
    logger.info(f"Created project {projectId} for user {userId}")
    
    return await db.projects.find_one({"projectId": projectId, "userId": userId})


async def get_project(userId: str, projectId: str) -> Optional[dict]:
    """Get project by userId and projectId"""
    db = get_db()
    return await db.projects.find_one({"userId": userId, "projectId": projectId})


async def update_project(
    userId: str, 
    projectId: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    github_repo_url: Optional[str] = None,
    current_nodes: Optional[List[Dict[str, Any]]] = None
) -> Optional[dict]:
    """Update project fields"""
    db = get_db()
    
    update_data = {"updatedAt": get_utc_now(), "last_updated": get_utc_now()}
    if name is not None:
        update_data["project_name"] = name
    if description is not None:
        update_data["description"] = description
    if github_repo_url is not None:
        update_data["github_repo_url"] = github_repo_url
    if current_nodes is not None:
        update_data["current_nodes"] = current_nodes
    
    await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {"$set": update_data}
    )
    
    return await get_project(userId, projectId)


async def update_current_nodes(userId: str, projectId: str, nodes: List[Dict[str, Any]]) -> bool:
    """
    Update the current_nodes state for a project.
    Called when user modifies the architecture in React Flow.
    """
    db = get_db()
    result = await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$set": {
                "current_nodes": nodes,
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    return result.modified_count > 0


async def update_latest_job(userId: str, projectId: str, jobId: str) -> bool:
    """
    Update the latest_successful_job_id for a project.
    Called when a job completes successfully.
    """
    db = get_db()
    result = await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$set": {
                "latest_successful_job_id": jobId,
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    return result.modified_count > 0


async def append_prompt_to_history(userId: str, projectId: str, prompt: str, metadata: Optional[Dict] = None) -> bool:
    """
    Add a prompt to the project's prompts_history.
    Called when user submits a new architecture generation request.
    """
    db = get_db()
    prompt_entry = {
        "prompt": prompt,
        "timestamp": get_utc_now(),
        "metadata": metadata or {}
    }
    
    result = await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$push": {"prompts_history": prompt_entry},
            "$set": {
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    return result.modified_count > 0


async def set_github_repo_url(userId: str, projectId: str, github_repo_url: str) -> bool:
    """Set the GitHub repo URL once the repo is created"""
    db = get_db()
    result = await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$set": {
                "github_repo_url": github_repo_url,
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    return result.modified_count > 0


async def set_vercel_url(userId: str, projectId: str, vercel_url: str) -> bool:
    """Set the Vercel deployment URL for a project"""
    db = get_db()
    result = await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$set": {
                "vercel_url": vercel_url,
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    logger.info(f"Set Vercel URL for project {projectId}: {vercel_url}")
    return result.modified_count > 0


async def touch_project_last_updated(userId: str, projectId: str) -> bool:
    """Update last_updated timestamp for a project"""
    db = get_db()
    result = await db.projects.update_one(
        {"userId": userId, "projectId": projectId},
        {
            "$set": {
                "last_updated": get_utc_now(),
                "updatedAt": get_utc_now()
            }
        }
    )
    return result.modified_count > 0


async def delete_project(userId: str, projectId: str) -> bool:
    """Delete a project"""
    db = get_db()
    result = await db.projects.delete_one({"userId": userId, "projectId": projectId})
    return result.deleted_count > 0

