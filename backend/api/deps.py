"""
API Dependencies
Shared auth and database dependencies
"""
from fastapi import Header, HTTPException
from jose import JWTError, jwt
import logging

from database.mongodb import MongoDB
from config import config

logger = logging.getLogger(__name__)


def verify_token(token: str) -> dict:
    """Verify JWT and return payload"""
    try:
        return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(401, "Invalid or expired token")


async def get_current_user(authorization: str = Header(None)) -> dict:
    """
    Get current authenticated user from JWT.
    
    Usage: user = Depends(get_current_user)
    
    Expects: Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(401, "Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization format. Use: Bearer <token>")
    
    token = authorization[7:]  # Remove "Bearer "
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(401, "Invalid token: missing user ID")
    
    db = MongoDB.get_database()
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        logger.warning(f"User not found for ID: {user_id}")
        raise HTTPException(404, "User not found")
    
    return user
