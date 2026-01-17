"""
Jobs repository - data access layer for jobs collection
"""
import logging
import uuid
from typing import List, Optional, Dict, Any
from database.mongo import get_db
from schemas.jobs import JobStatus, LogEntry
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)


async def create_job(
    userId: str,
    projectId: Optional[str],
    architecture_spec: Dict[str, Any]
) -> dict:
    """
    Create a new job
    Returns: job document dict
    """
    db = get_db()
    collection = db.jobs
    
    jobId = str(uuid.uuid4())
    now = get_utc_now()
    
    job_doc = {
        "jobId": jobId,
        "userId": userId,
        "projectId": projectId,
        "status": JobStatus.PENDING.value,
        "architecture_spec": architecture_spec,
        "logs": [],
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
    """List all jobs for a project"""
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
    error: Optional[str] = None
) -> bool:
    """Update job status and optionally result/error"""
    db = get_db()
    collection = db.jobs
    
    update_doc = {
        "status": status,
        "updatedAt": get_utc_now()
    }
    
    if result is not None:
        update_doc["result"] = result
    
    if error is not None:
        update_doc["error"] = error
    
    if status == JobStatus.DONE.value:
        update_doc["completedAt"] = get_utc_now()
    
    result = await collection.update_one(
        {"userId": userId, "jobId": jobId},
        {"$set": update_doc}
    )
    
    return result.modified_count > 0


async def append_job_logs(userId: str, jobId: str, logs: List[Dict[str, Any]]) -> bool:
    """
    Append log entries to job logs array
    logs: List of log entry dicts with ts, level, message
    """
    db = get_db()
    collection = db.jobs
    
    # Ensure logs have proper format
    formatted_logs = []
    for log in logs:
        if isinstance(log, dict):
            formatted_logs.append(log)
        elif isinstance(log, LogEntry):
            formatted_logs.append(log.dict())
    
    if formatted_logs:
        result = await collection.update_one(
            {"userId": userId, "jobId": jobId},
            {
                "$push": {"logs": {"$each": formatted_logs}},
                "$set": {"updatedAt": get_utc_now()}
            }
        )
        return result.modified_count > 0
    
    return False

