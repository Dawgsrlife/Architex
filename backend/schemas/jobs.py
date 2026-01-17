"""
Job schemas for MongoDB
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from schemas.common import get_utc_now


class JobStatus(str, Enum):
    """Job status enum"""
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    GENERATING = "generating"
    WAITING_REVIEW = "waiting_review"
    EXECUTING = "executing"


class LogEntry(BaseModel):
    """Log entry for job logs"""
    ts: datetime = Field(default_factory=get_utc_now)
    level: str = "info"  # info, warning, error
    message: str


class JobCreateRequest(BaseModel):
    """Request to create a job"""
    architecture_spec: Dict[str, Any]
    projectId: Optional[str] = None


class JobInDB(BaseModel):
    """Job document in MongoDB"""
    _id: Optional[str] = None  # ObjectId as string
    jobId: str  # UUID string (unique per user)
    userId: str
    projectId: Optional[str] = None
    status: str = JobStatus.PENDING.value
    architecture_spec: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=get_utc_now)
    updatedAt: datetime = Field(default_factory=get_utc_now)
    completedAt: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class JobResponse(BaseModel):
    """Job response model"""
    jobId: str
    userId: str
    projectId: Optional[str] = None
    status: str
    architecture_spec: Optional[Dict[str, Any]] = None  # May be large, optional in response
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime
    completedAt: Optional[datetime] = None

