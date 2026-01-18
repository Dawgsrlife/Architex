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
    from github import GithubException
    import traceback
    import uuid
    
    # =========================================================================
    # AGGRESSIVE DEBUGGING - Print to terminal so we see EXACTLY where it fails
    # =========================================================================
    
    print("\n" + "=" * 70)
    print(f"🚀 STARTING PROJECT CREATION for '{project.name}'")
    print("=" * 70)
    
    user_id = get_user_id(user)
    print(f"📋 User ID: {user_id}")
    print(f"📋 User dict keys: {list(user.keys())}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 1: Check user token
    # ─────────────────────────────────────────────────────────────────────────
    print("\n🔍 Checking user token...")
    
    github_token = user.get("github_access_token")
    
    if not github_token:
        print("❌ ERROR: No GitHub token found for user!")
        print(f"   User document has these keys: {list(user.keys())}")
        logger.error(f"[CREATE_PROJECT] No GitHub token for user {user_id}")
        raise HTTPException(
            status_code=400, 
            detail="No GitHub Token found for user. Please re-login via GitHub OAuth at /login."
        )
    
    print(f"✅ Token found (length: {len(github_token)})")
    print(f"   Token preview: {github_token[:8]}...{github_token[-4:]}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 2: Initialize GitHub Service
    # ─────────────────────────────────────────────────────────────────────────
    print("\n🔧 Initializing GitHubService...")
    
    try:
        github_service = GitHubService(access_token=github_token)
        print("✅ GitHubService initialized")
    except Exception as e:
        print(f"❌ Failed to initialize GitHubService: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize GitHub: {e}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 3: Slugify repo name
    # ─────────────────────────────────────────────────────────────────────────
    repo_name = slugify_repo_name(project.name)
    description = project.description or f"Project created via Architex"
    print(f"\n📝 Repo name: '{project.name}' → '{repo_name}'")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 4: Check if repo exists
    # ─────────────────────────────────────────────────────────────────────────
    print(f"\n🔍 Checking if repo '{repo_name}' already exists...")
    
    try:
        repo_exists = github_service.repo_exists(repo_name)
        print(f"   Repo exists check returned: {repo_exists}")
        
        if repo_exists:
            suffix = str(uuid.uuid4())[:6]
            repo_name = f"{repo_name}-{suffix}"
            print(f"⚠️  Repo exists! Using unique name: '{repo_name}'")
        else:
            print(f"✅ Repo name '{repo_name}' is available")
            
    except GithubException as e:
        print(f"❌ GITHUB API ERROR checking repo: Status {e.status}")
        print(f"   Message: {e.data}")
        logger.error(f"[CREATE_PROJECT] GitHub API error: {e.status} - {e.data}")
        raise HTTPException(
            status_code=500,
            detail=f"GitHub API error ({e.status}): {e.data.get('message', str(e))}"
        )
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR checking repo: {type(e).__name__}: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error checking repo: {e}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 5: Create GitHub repository
    # ─────────────────────────────────────────────────────────────────────────
    print(f"\n🌐 Calling GitHub API to create repo '{repo_name}'...")
    
    try:
        result = await github_service.create_repository(
            name=repo_name,
            description=description,
            private=False
        )
        github_repo_url = result["repository"]["url"]
        print(f"✅ GitHub Repo Created: {github_repo_url}")
        
    except GithubException as e:
        print(f"\n❌ GITHUB API FAILED!")
        print(f"   Status Code: {e.status}")
        print(f"   Error Data: {e.data}")
        print(f"   Message: {e.data.get('message', 'No message')}")
        if 'errors' in e.data:
            print(f"   Errors: {e.data['errors']}")
        logger.error(f"[CREATE_PROJECT] GitHub create repo failed: {e.status} - {e.data}")
        raise HTTPException(
            status_code=500,
            detail=f"GitHub API error ({e.status}): {e.data.get('message', str(e))}"
        )
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR creating repo!")
        print(f"   Exception Type: {type(e).__name__}")
        print(f"   Exception: {e}")
        print(f"   Traceback:\n{traceback.format_exc()}")
        logger.error(f"[CREATE_PROJECT] Unexpected error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create GitHub repository: {type(e).__name__}: {str(e)}"
        )
    
    # ─────────────────────────────────────────────────────────────────────────
    # STEP 6: Store project in database
    # ─────────────────────────────────────────────────────────────────────────
    print(f"\n💾 Storing project in database...")
    
    try:
        project_doc = await projects_repo.create_project(
            userId=user_id,
            project_name=project.name,
            description=project.description,
            repository_url=github_repo_url
        )
        print(f"✅ Project stored! ID: {project_doc['projectId']}")
        
    except Exception as e:
        print(f"❌ DATABASE ERROR: {type(e).__name__}: {e}")
        print(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
    # ─────────────────────────────────────────────────────────────────────────
    # SUCCESS!
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f"🎉 SUCCESS! Project '{project.name}' created")
    print(f"   Project ID: {project_doc['projectId']}")
    print(f"   GitHub URL: {github_repo_url}")
    print("=" * 70 + "\n")
    
    logger.info(f"[CREATE_PROJECT] Success: {project_doc['projectId']} → {github_repo_url}")
    
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
