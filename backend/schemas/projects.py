"""
Project schemas for MongoDB
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from schemas.common import get_utc_now


class ProjectCreateRequest(BaseModel):
    """Request to create a project"""
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None


class ProjectInDB(BaseModel):
    """Project document in MongoDB"""
    _id: Optional[str] = None  # ObjectId as string
    projectId: str  # UUID string (unique per user)
    userId: str
    project_name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    last_updated: datetime = Field(default_factory=get_utc_now)
    createdAt: datetime = Field(default_factory=get_utc_now)
    updatedAt: datetime = Field(default_factory=get_utc_now)
    
    class Config:
        populate_by_name = True


class ProjectResponse(BaseModel):
    """Project response model"""
    projectId: str
    userId: str
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    last_updated: datetime
    createdAt: datetime
    updatedAt: datetime

