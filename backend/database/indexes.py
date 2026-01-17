"""
MongoDB index creation
Ensures all required indexes exist idempotently
"""
import logging
from database.mongo import get_db

logger = logging.getLogger(__name__)


async def ensure_indexes():
    """Create all required indexes idempotently"""
    db = get_db()
    
    try:
        # Users collection indexes
        users_collection = db.users
        await users_collection.create_index("userId", unique=True)
        await users_collection.create_index("email", unique=True, sparse=True)
        logger.info("Users indexes created")
        
        # Projects collection indexes
        projects_collection = db.projects
        await projects_collection.create_index([("userId", 1), ("projectId", 1)], unique=True)
        await projects_collection.create_index("userId")
        await projects_collection.create_index([("last_updated", -1)])
        logger.info("Projects indexes created")
        
        # Jobs collection indexes
        jobs_collection = db.jobs
        await jobs_collection.create_index([("userId", 1), ("jobId", 1)], unique=True)
        await jobs_collection.create_index([("userId", 1), ("projectId", 1), ("createdAt", -1)])
        logger.info("Jobs indexes created")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        # Don't raise - indexes may already exist, which is fine
        pass

