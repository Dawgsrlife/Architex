"""
Projects Routes
CRUD operations for projects
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import logging

from database.mongodb import MongoDB
from api.deps import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger(__name__)


class ProjectCreate(BaseModel):
    """Create project request"""
    name: str
    description: str
    repository_url: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Update project request"""
    name: Optional[str] = None
    description: Optional[str] = None
    repository_url: Optional[str] = None


def _serialize_project(p: dict) -> dict:
    """Serialize project document for API response"""
    created_at = p.get("created_at")
    updated_at = p.get("updated_at") or p.get("last_updated")
    
    return {
        "id": p["_id"],
        "name": p["name"],
        "description": p.get("description", ""),
        "repository_url": p.get("repository_url"),
        "status": p.get("status", "pending"),
        "created_at": created_at.isoformat() if hasattr(created_at, 'isoformat') else str(created_at),
        "updated_at": updated_at.isoformat() if hasattr(updated_at, 'isoformat') else str(updated_at),
    }


@router.get("")
async def get_projects(user: dict = Depends(get_current_user)):
    """Get all projects for current user"""
    db = MongoDB.get_database()
    projects = []
    
    async for p in db.projects.find({"user_id": user["_id"]}):
        projects.append(_serialize_project(p))
    
    logger.info(f"User {user['_id']} fetched {len(projects)} projects")
    return projects


@router.get("/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    """Get a single project by ID"""
    db = MongoDB.get_database()
    project = await db.projects.find_one({"_id": project_id, "user_id": user["_id"]})
    
    if not project:
        raise HTTPException(404, "Project not found")
    
    return _serialize_project(project)


@router.post("")
async def create_project(project: ProjectCreate, user: dict = Depends(get_current_user)):
    """Create a new project"""
    db = MongoDB.get_database()
    project_id = str(uuid.uuid4())
    
    doc = {
        "_id": project_id,
        "user_id": user["_id"],
        "name": project.name,
        "description": project.description,
        "repository_url": project.repository_url,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    await db.projects.insert_one(doc)
    logger.info(f"User {user['_id']} created project {project_id}")
    
    return _serialize_project(doc)


@router.put("/{project_id}")
async def update_project(
    project_id: str, 
    update: ProjectUpdate, 
    user: dict = Depends(get_current_user)
):
    """Update a project"""
    db = MongoDB.get_database()
    project = await db.projects.find_one({"_id": project_id, "user_id": user["_id"]})
    
    if not project:
        raise HTTPException(404, "Project not found")
    
    # Build update dict with only provided fields
    update_data = {"updated_at": datetime.utcnow()}
    if update.name is not None:
        update_data["name"] = update.name
    if update.description is not None:
        update_data["description"] = update.description
    if update.repository_url is not None:
        update_data["repository_url"] = update.repository_url
    
    await db.projects.update_one({"_id": project_id}, {"$set": update_data})
    
    # Fetch updated project
    updated = await db.projects.find_one({"_id": project_id})
    logger.info(f"User {user['_id']} updated project {project_id}")
    
    return _serialize_project(updated)


@router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    """Delete a project"""
    db = MongoDB.get_database()
    project = await db.projects.find_one({"_id": project_id, "user_id": user["_id"]})
    
    if not project:
        raise HTTPException(404, "Project not found")
    
    await db.projects.delete_one({"_id": project_id})
    logger.info(f"User {user['_id']} deleted project {project_id}")
    
    return {"message": "Project deleted", "id": project_id}

