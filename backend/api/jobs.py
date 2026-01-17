"""
Jobs Routes
Architecture generation job endpoints
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import logging

from database.mongodb import MongoDB
from services.job_worker import job_worker
from api.deps import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["jobs"])
logger = logging.getLogger(__name__)


class ArchitectureSpec(BaseModel):
    """
    Architecture specification from the visual editor.
    
    This is the massive JSON containing all nodes, edges, and instructions.
    - nodes: List of components (frontend, backend, database, etc.)
    - edges: Connections between components
    - metadata: Additional configuration
    """
    name: str = "New Architecture"
    description: str = "Generated via Visual Editor"
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    components: List[str] = []
    frameworks: List[str] = []
    metadata: Dict[str, Any] = {}


class JobCreate(BaseModel):
    """Create job request"""
    architecture_spec: ArchitectureSpec
    project_id: Optional[str] = None


def _serialize_datetime(dt) -> Optional[str]:
    """Safely serialize datetime"""
    if dt is None:
        return None
    if hasattr(dt, 'isoformat'):
        return dt.isoformat()
    return str(dt)


def _serialize_job(job: dict) -> dict:
    """Serialize job document for API response"""
    response = {
        "job_id": job["_id"],
        "status": job.get("status", "pending"),
        "project_id": job.get("project_id"),
        "created_at": _serialize_datetime(job.get("created_at")),
        "updated_at": _serialize_datetime(job.get("updated_at")),
    }
    
    if job.get("completed_at"):
        response["completed_at"] = _serialize_datetime(job["completed_at"])
    if job.get("result"):
        response["result"] = job["result"]
    if job.get("error"):
        response["error"] = job["error"]
    if job.get("logs"):
        response["logs"] = job["logs"]
    
    return response


@router.post("")
async def create_job(
    job_request: JobCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Create a new architecture generation job.
    
    The architecture_spec contains the full node graph from React Flow.
    Job runs asynchronously - frontend should poll GET /jobs/{id} for status.
    """
    db = MongoDB.get_database()
    job_id = str(uuid.uuid4())
    
    spec_dict = job_request.architecture_spec.dict()
    node_count = len(spec_dict.get("nodes", []))
    edge_count = len(spec_dict.get("edges", []))
    
    logger.info(f"Creating job {job_id} with {node_count} nodes, {edge_count} edges")
    
    doc = {
        "_id": job_id,
        "user_id": user["_id"],
        "project_id": job_request.project_id,
        "architecture_spec": spec_dict,
        "status": "pending",
        "logs": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    await db.jobs.insert_one(doc)
    
    # Queue background processing
    background_tasks.add_task(job_worker.process_job, job_id, db)
    
    return {
        "job_id": job_id,
        "status": "pending",
        "message": f"Job queued for processing ({node_count} nodes, {edge_count} edges)"
    }


@router.get("/{job_id}")
async def get_job_status(job_id: str, user: dict = Depends(get_current_user)):
    """
    Get job status.
    
    Frontend should poll this every 2-5 seconds while status is 'pending' or 'generating'.
    Status values: pending, generating, done, failed
    """
    db = MongoDB.get_database()
    job = await db.jobs.find_one({"_id": job_id, "user_id": user["_id"]})
    
    if not job:
        raise HTTPException(404, "Job not found")
    
    return _serialize_job(job)


@router.get("")
async def get_jobs(
    user: dict = Depends(get_current_user),
    project_id: Optional[str] = None
):
    """Get all jobs for current user, optionally filtered by project"""
    db = MongoDB.get_database()
    
    query = {"user_id": user["_id"]}
    if project_id:
        query["project_id"] = project_id
    
    jobs = []
    async for job in db.jobs.find(query).sort("created_at", -1):
        jobs.append(_serialize_job(job))
    
    logger.info(f"User {user['_id']} fetched {len(jobs)} jobs")
    return jobs

