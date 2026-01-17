"""
User schemas for MongoDB
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from schemas.common import get_utc_now


class UserInDB(BaseModel):
    """User document in MongoDB"""
    _id: Optional[str] = None  # ObjectId as string
    userId: str  # GitHub numeric ID as string (unique)
    email: Optional[str] = None
    name: Optional[str] = None
    github_access_token: str  # Never returned in API responses
    createdAt: datetime = Field(default_factory=get_utc_now)
    updatedAt: datetime = Field(default_factory=get_utc_now)
    
    class Config:
        populate_by_name = True


class UserPublic(BaseModel):
    """Public user information (no tokens)"""
    userId: str
    email: Optional[str] = None
    name: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

