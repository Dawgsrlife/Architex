"""Job claiming logic for atomic job selection"""
from datetime import datetime
from typing import Optional, Dict, Any
from .db import Database
from .models import JobModel
import logging

logger = logging.getLogger(__name__)


async def claim_pending_job() -> Optional[Dict[str, Any]]:
    """
    Atomically claim a pending job from MongoDB.
    Updates status to 'running' and sets startedAt timestamp.
    
    Returns:
        Job document if claimed, None if no pending jobs available
    """
    db = Database.get_database()
    jobs_collection = db.jobs
    
    # Atomic claim: find and update in one operation
    now = datetime.utcnow()
    result = await jobs_collection.find_one_and_update(
        {"status": "pending"},
        {
            "$set": {
                "status": "running",
                "startedAt": now,
                "updated_at": now,  # Support both updated_at and updatedAt
            }
        },
        return_document=True,  # Return the updated document
    )
    
    if result:
        logger.info(f"Claimed job: {result['_id']}")
        return result
    else:
        return None
