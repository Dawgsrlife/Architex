"""
Projects Routes
CRUD operations for user projects
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from api.deps import get_current_user, get_user_id
from repos import projects_repo
from services.github import GitHubService, slugify_repo_name

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger(__name__)


# ============================================================================
# Request/Response Models
# ============================================================================

class ProjectCreate(BaseModel):
    """Create project request"""
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Update project request"""
    name: Optional[str] = None
    description: Optional[str] = None
    current_nodes: Optional[List[Dict[str, Any]]] = None


class NodesUpdate(BaseModel):
    """Update nodes request"""
    nodes: List[Dict[str, Any]]


# ============================================================================
# Helper Functions
# ============================================================================

def serialize_project(p: dict) -> dict:
    """Serialize project document for API response"""
    def format_dt(dt):
        if isinstance(dt, datetime):
            return dt.isoformat()
        return str(dt) if dt else None
    
    # Compute nodes_count from current_nodes array
    current_nodes = p.get("current_nodes", [])
    nodes_count = len(current_nodes) if current_nodes else 0
    
    # Determine status based on project state
    # - "completed" if has successful job
    # - "active" if has nodes
    # - "draft" otherwise
    if p.get("latest_successful_job_id"):
        status = "completed"
    elif nodes_count > 0:
        status = "active"
    else:
        status = "draft"
    
    return {
        "projectId": p.get("projectId"),
        "name": p.get("project_name"),
        "description": p.get("description"),
        "github_repo_url": p.get("github_repo_url"),
        "current_nodes": current_nodes,
        "nodes_count": nodes_count,
        "status": status,
        "prompts_history": p.get("prompts_history", []),
        "latest_successful_job_id": p.get("latest_successful_job_id"),
        "last_updated": format_dt(p.get("last_updated")),
        "createdAt": format_dt(p.get("createdAt")),
        "updatedAt": format_dt(p.get("updatedAt")),
    }


# ============================================================================
# Routes
# ============================================================================

@router.get("")
async def list_projects(user: dict = Depends(get_current_user)):
    """Get all projects for current user"""
    user_id = get_user_id(user)
    projects = await projects_repo.list_projects(user_id)
    return [serialize_project(p) for p in projects]


@router.post("")
async def create_project(
    project: ProjectCreate, 
    user: dict = Depends(get_current_user)
):
    """
    Create a new project with GitHub repository.
    
    Steps:
    1. Get user's GitHub access token
    2. Slugify project name to valid repo name
    3. Check if repo already exists
    4. Create GitHub repo if it doesn't exist
    5. Store project with repo URL in database
    """
    user_id = get_user_id(user)
    github_token = user.get("github_access_token")
    
    if not github_token:
        raise HTTPException(
            status_code=400, 
            detail="GitHub access token not found. Please re-authenticate."
        )
    
    # Initialize GitHub service
    github_service = GitHubService(access_token=github_token)
    
    # Convert project name to valid GitHub repo name
    repo_name = slugify_repo_name(project.name)
    description = project.description or f"Project created via Architex"
    
    # Check if repo already exists
    try:
        if github_service.repo_exists(repo_name):
            # Append a suffix to make the name unique
            import uuid
            suffix = str(uuid.uuid4())[:6]
            repo_name = f"{repo_name}-{suffix}"
            logger.info(f"Repo name conflict, using: {repo_name}")
    except Exception as e:
        logger.error(f"Error checking if repo exists: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check GitHub repository: {str(e)}"
        )
    
    # Create GitHub repository
    try:
        result = await github_service.create_repository(
            name=repo_name,
            description=description,
            private=False  # Public by default for hackathon/demo
        )
        github_repo_url = result["repository"]["url"]
        logger.info(f"Created GitHub repo: {github_repo_url}")
    except Exception as e:
        logger.error(f"Failed to create GitHub repo: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create GitHub repository: {str(e)}"
        )
    
    # Create project in database with GitHub URL
    project_doc = await projects_repo.create_project(
        userId=user_id,
        project_name=project.name,
        description=project.description,
        repository_url=github_repo_url
    )
    
    logger.info(f"Created project {project_doc['projectId']} with repo {github_repo_url}")
    return serialize_project(project_doc)


@router.get("/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    """Get a specific project by ID"""
    user_id = get_user_id(user)
    project = await projects_repo.get_project(user_id, project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return serialize_project(project)


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    update: ProjectUpdate,
    user: dict = Depends(get_current_user)
):
    """Update a project"""
    user_id = get_user_id(user)
    
    updated = await projects_repo.update_project(
        userId=user_id,
        projectId=project_id,
        name=update.name,
        description=update.description,
        current_nodes=update.current_nodes
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    
    logger.info(f"Updated project {project_id}")
    return {"message": "Project updated", "projectId": project_id}


@router.put("/{project_id}/nodes")
async def update_project_nodes(
    project_id: str,
    update: NodesUpdate,
    user: dict = Depends(get_current_user)
):
    """Update only the current_nodes of a project (React Flow state)"""
    user_id = get_user_id(user)
    success = await projects_repo.update_current_nodes(user_id, project_id, update.nodes)
    
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Nodes updated", "projectId": project_id}


@router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    """Delete a project"""
    user_id = get_user_id(user)
    success = await projects_repo.delete_project(user_id, project_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    
    logger.info(f"Deleted project {project_id}")
    return {"message": "Project deleted", "projectId": project_id}
