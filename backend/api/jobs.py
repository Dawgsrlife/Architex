"""
Jobs Routes
Job creation and status polling endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from api.deps import get_current_user, get_user_id
from repos import projects_repo, jobs_repo
from database.mongo import get_db
from services.job_worker import job_worker

router = APIRouter(prefix="/api/jobs", tags=["jobs"])
logger = logging.getLogger(__name__)


# ============================================================================
# Request/Response Models
# ============================================================================

class ArchitectureSpec(BaseModel):
    """Architecture specification from the visual editor"""
    name: str = "New Architecture"
    description: str = "Generated via Visual Editor"
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    prompt: str = ""  # The user's text prompt
    metadata: Dict[str, Any] = Field(default_factory=dict)


class JobCreate(BaseModel):
    """Create job request"""
    project_id: str
    architecture_spec: ArchitectureSpec


# ============================================================================
# Helper Functions
# ============================================================================

def serialize_job(j: dict, include_spec: bool = False) -> dict:
    """Serialize job document for API response"""
    def format_dt(dt):
        if isinstance(dt, datetime):
            return dt.isoformat()
        return str(dt) if dt else None
    
    result = {
        "jobId": j.get("jobId"),
        "projectId": j.get("projectId"),
        "status": j.get("status"),
        "createdAt": format_dt(j.get("createdAt")),
        "updatedAt": format_dt(j.get("updatedAt")),
    }
    
    if j.get("completedAt"):
        result["completedAt"] = format_dt(j.get("completedAt"))
    if j.get("result"):
        result["result"] = j.get("result")
    if j.get("error"):
        result["error"] = j.get("error")
    if j.get("logs"):
        result["logs"] = j.get("logs")
    if j.get("warnings"):
        result["warnings"] = j.get("warnings")
    if j.get("prompt"):
        result["prompt"] = j.get("prompt")
    if include_spec and j.get("architecture_spec"):
        result["architecture_spec"] = j.get("architecture_spec")
    
    return result


# ============================================================================
# Routes
# ============================================================================

@router.post("")
async def create_job(
    job_request: JobCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Create a new architecture generation job.
    
    Flow:
    1. Validate project exists
    2. Append prompt to project's prompts_history
    3. Update project's current_nodes
    4. Create job document
    5. Queue background job processing
    """
    user_id = get_user_id(user)
    project_id = job_request.project_id
    spec = job_request.architecture_spec
    
    # Verify project exists
    project = await projects_repo.get_project(user_id, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Append prompt to project history
    if spec.prompt:
        await projects_repo.append_prompt_to_history(
            user_id, project_id, spec.prompt, {"source": "job_create"}
        )
    
    # Update project's current nodes
    if spec.nodes:
        await projects_repo.update_current_nodes(user_id, project_id, spec.nodes)
    
    # Create job
    job_doc = await jobs_repo.create_job(
        userId=user_id,
        projectId=project_id,
        architecture_spec=spec.model_dump()
    )
    
    job_id = job_doc["jobId"]
    db = get_db()
    
    # Queue background processing
    background_tasks.add_task(job_worker.process_job, job_id, db)
    
    logger.info(f"Job {job_id} created for project {project_id}")
    
    return {
        "jobId": job_id,
        "projectId": project_id,
        "status": "pending",
        "message": f"Job queued ({len(spec.nodes)} nodes, {len(spec.edges)} edges)"
    }


@router.get("/{job_id}")
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    """
    Get job status.
    Frontend should poll this every 2-5 seconds during job execution.
    """
    user_id = get_user_id(user)
    job = await jobs_repo.get_job(user_id, job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return serialize_job(job, include_spec=False)


@router.get("")
async def list_jobs(
    user: dict = Depends(get_current_user),
    project_id: Optional[str] = None
):
    """Get all jobs for current user, optionally filtered by project"""
    user_id = get_user_id(user)
    
    if project_id:
        jobs = await jobs_repo.list_jobs_for_project(user_id, project_id)
    else:
        db = get_db()
        jobs = []
        async for job in db.jobs.find({"userId": user_id}).sort("createdAt", -1):
            jobs.append(job)
    
    return [serialize_job(j) for j in jobs]


@router.get("/project/{project_id}")
async def list_project_jobs(project_id: str, user: dict = Depends(get_current_user)):
    """Get all jobs for a specific project"""
    user_id = get_user_id(user)
    jobs = await jobs_repo.list_jobs_for_project(user_id, project_id)
    return [serialize_job(j) for j in jobs]
