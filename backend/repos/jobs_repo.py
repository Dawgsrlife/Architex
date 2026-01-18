"""
Jobs repository - data access layer for jobs collection

INVARIANTS:
- Jobs are IMMUTABLE SNAPSHOTS of execution attempts
- Jobs never mutate projects directly
- Status transitions are strictly enforced: pending → running → terminal
- Warnings are stored separately from logs for easy UI access
"""
import logging
import uuid
from typing import List, Optional, Dict, Any
from database.mongo import get_db
from schemas.jobs import JobStatus
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)

# Valid status transitions (from → allowed targets)
VALID_TRANSITIONS: Dict[str, set] = {
    JobStatus.PENDING.value: {JobStatus.RUNNING.value, JobStatus.FAILED.value},
    JobStatus.RUNNING.value: {
        JobStatus.COMPLETED.value, 
        JobStatus.COMPLETED_WITH_WARNINGS.value, 
        JobStatus.FAILED.value
    },
    # Terminal states - no transitions allowed
    JobStatus.COMPLETED.value: set(),
    JobStatus.COMPLETED_WITH_WARNINGS.value: set(),
    JobStatus.FAILED.value: set(),
}


def is_valid_transition(from_status: str, to_status: str) -> bool:
    """Check if status transition is valid"""
    allowed = VALID_TRANSITIONS.get(from_status, set())
    return to_status in allowed


async def create_job(
    userId: str,
    projectId: Optional[str],
    architecture_spec: Dict[str, Any]
) -> dict:
    """
    Create a new job.
    
    Job stores:
    - Full architecture_spec snapshot (immutable)
    - prompt from architecture_spec (for easy querying)
    - warnings[] for explicit warning tracking
    
    Returns: job document dict
    """
    db = get_db()
    collection = db.jobs
    
    jobId = str(uuid.uuid4())
    now = get_utc_now()
    
    # Extract prompt from architecture_spec for easy access
    prompt = architecture_spec.get("prompt", "")
    
    job_doc = {
        "jobId": jobId,
        "userId": userId,
        "projectId": projectId,
        "status": JobStatus.PENDING.value,
        "architecture_spec": architecture_spec,
        "prompt": prompt,  # Denormalized for easy querying
        "logs": [],
        "warnings": [],  # Explicit warnings list for UI
        "createdAt": now,
        "updatedAt": now,
    }
    
    await collection.insert_one(job_doc)
    logger.info(f"Created job {jobId} for user {userId}")
    
    return await collection.find_one({"jobId": jobId, "userId": userId})


async def get_job(userId: str, jobId: str) -> Optional[dict]:
    """Get job by userId and jobId"""
    db = get_db()
    collection = db.jobs
    return await collection.find_one({"userId": userId, "jobId": jobId})


async def list_jobs_for_project(userId: str, projectId: str) -> List[dict]:
    """List all jobs for a project, newest first"""
    db = get_db()
    collection = db.jobs
    
    jobs = []
    async for job in collection.find({"userId": userId, "projectId": projectId}).sort("createdAt", -1):
        jobs.append(job)
    
    return jobs


async def update_job_status(
    userId: str,
    jobId: str,
    status: str,
    result: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    warnings: Optional[List[str]] = None
) -> bool:
    """
    Update job status with transition validation.
    
    INVARIANT: Status transitions are strictly enforced.
    """
    db = get_db()
    collection = db.jobs
    
    # Get current status
    current_job = await collection.find_one({"userId": userId, "jobId": jobId})
    if not current_job:
        logger.warning(f"Job {jobId} not found")
        return False
    
    current_status = current_job.get("status", JobStatus.PENDING.value)
    
    # Validate transition
    if not is_valid_transition(current_status, status):
        logger.error(f"Invalid status transition: {current_status} → {status}")
        return False
    
    update_doc = {
        "status": status,
        "updatedAt": get_utc_now()
    }
    
    if result is not None:
        update_doc["result"] = result
    
    if error is not None:
        update_doc["error"] = error
    
    # Set completedAt for terminal states
    if status in (JobStatus.COMPLETED.value, JobStatus.COMPLETED_WITH_WARNINGS.value, JobStatus.FAILED.value):
        update_doc["completedAt"] = get_utc_now()
    
    update_ops = {"$set": update_doc}
    
    # Append warnings if provided
    if warnings:
        update_ops["$push"] = {"warnings": {"$each": warnings}}
    
    result_obj = await collection.update_one(
        {"userId": userId, "jobId": jobId},
        update_ops
    )
    
    logger.info(f"Job {jobId} status: {current_status} → {status}")
    return result_obj.modified_count > 0


async def append_job_logs(userId: str, jobId: str, logs: List[Dict[str, Any]]) -> bool:
    """
    Append log entries to job logs array.
    logs: List of log entry dicts with ts, level, message
    """
    db = get_db()
    collection = db.jobs
    
    if logs:
        result = await collection.update_one(
            {"userId": userId, "jobId": jobId},
            {
                "$push": {"logs": {"$each": logs}},
                "$set": {"updatedAt": get_utc_now()}
            }
        )
        return result.modified_count > 0
    
    return False


async def append_job_warnings(userId: str, jobId: str, warnings: List[str]) -> bool:
    """
    Append warnings to job warnings array.
    Warnings are surfaced in UI separately from logs.
    """
    db = get_db()
    collection = db.jobs
    
    if warnings:
        result = await collection.update_one(
            {"userId": userId, "jobId": jobId},
            {
                "$push": {"warnings": {"$each": warnings}},
                "$set": {"updatedAt": get_utc_now()}
            }
        )
        return result.modified_count > 0
    
    return False


async def update_job_progress(
    userId: str,
    jobId: str,
    current_step: Optional[str] = None,
    files_created: Optional[List[str]] = None,
    total_iterations: Optional[int] = None,
    translated_spec: Optional[str] = None
) -> bool:
    """
    Update job progress for observability (Layer 4).
    
    This allows the frontend to show:
    - Current step (e.g., "Writing main.py")
    - Files created so far
    - Total LLM iterations
    - The translated architecture spec (for debugging)
    """
    db = get_db()
    collection = db.jobs
    
    update_doc = {"updatedAt": get_utc_now()}
    
    if current_step is not None:
        update_doc["current_step"] = current_step
    
    if total_iterations is not None:
        update_doc["total_iterations"] = total_iterations
    
    if translated_spec is not None:
        update_doc["translated_spec"] = translated_spec
    
    update_ops = {"$set": update_doc}
    
    if files_created:
        update_ops["$addToSet"] = {"files_created": {"$each": files_created}}
    
    result = await collection.update_one(
        {"userId": userId, "jobId": jobId},
        update_ops
    )
    
    return result.modified_count > 0


async def get_job_by_id(jobId: str) -> Optional[dict]:
    """
    Get job by jobId only (used by background worker).
    Note: This bypasses userId check - use only for internal operations.
    """
    db = get_db()
    collection = db.jobs
    return await collection.find_one({"jobId": jobId})
