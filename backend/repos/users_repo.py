"""
Users repository - data access layer for users collection
"""
import logging
from typing import Optional
from datetime import datetime, timezone
from database.mongo import get_db
from schemas.users import UserInDB
from schemas.common import get_utc_now

logger = logging.getLogger(__name__)


async def upsert_user(
    userId: str,
    github_access_token: str,
    email: Optional[str] = None,
    name: Optional[str] = None
) -> dict:
    """
    Upsert user document
    userId: GitHub numeric ID as string
    Returns: user document dict
    """
    db = get_db()
    collection = db.users
    
    now = get_utc_now()
    
    user_doc = {
        "userId": userId,
        "github_access_token": github_access_token,
        "updatedAt": now,
    }
    
    if email:
        user_doc["email"] = email
    if name:
        user_doc["name"] = name
    
    # Check if user exists
    existing = await collection.find_one({"userId": userId})
    
    if existing:
        # Update existing user
        user_doc["createdAt"] = existing.get("createdAt", now)
        await collection.update_one(
            {"userId": userId},
            {"$set": user_doc}
        )
        logger.info(f"Updated user: {userId}")
    else:
        # Create new user
        user_doc["createdAt"] = now
        await collection.insert_one(user_doc)
        logger.info(f"Created user: {userId}")
    
    # Return updated document
    return await collection.find_one({"userId": userId})


async def get_user(userId: str) -> Optional[dict]:
    """Get user by userId"""
    db = get_db()
    collection = db.users
    return await collection.find_one({"userId": userId})


async def update_github_token(userId: str, github_access_token: str) -> bool:
    """Update GitHub access token for user"""
    db = get_db()
    collection = db.users
    
    result = await collection.update_one(
        {"userId": userId},
        {
            "$set": {
                "github_access_token": github_access_token,
                "updatedAt": get_utc_now()
            }
        }
    )
    
    return result.modified_count > 0

