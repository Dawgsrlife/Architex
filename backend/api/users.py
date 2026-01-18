"""
Users Routes
User profile endpoints
"""
from fastapi import APIRouter, Depends

from api.deps import get_current_user, get_user_id

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user profile"""
    return {
        "id": get_user_id(user),
        "username": user.get("name", ""),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url", ""),
        "createdAt": user.get("createdAt"),
        "updatedAt": user.get("updatedAt"),
    }
