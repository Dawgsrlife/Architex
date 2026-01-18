"""
Job schemas for MongoDB

INVARIANTS:
- Job is an IMMUTABLE SNAPSHOT of an execution attempt
- Job stores full architecture_spec at creation time
- Job never mutates project directly
- Job has clear lifecycle: pending → running → completed|failed|completed_with_warnings
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from schemas.common import get_utc_now


class JobStatus(str, Enum):
    """
    Job status lifecycle.
    
    pending → running → completed|failed|completed_with_warnings
    """
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"


class LogEntry(BaseModel):
    """Log entry for job logs"""
    ts: datetime = Field(default_factory=get_utc_now)
    level: str = "info"  # info, warning, error
    message: str


class JobCreateRequest(BaseModel):
    """Request to create a job"""
    project_id: str
    architecture_spec: Dict[str, Any]


class JobInDB(BaseModel):
    """
    Job document in MongoDB.
    
    Key design:
    - jobId: UUID (unique)
    - projectId: reference to parent project
    - architecture_spec: FULL SNAPSHOT at creation time
    - prompt: denormalized from architecture_spec for easy querying
    - status: lifecycle state
    - logs: execution log entries
    - warnings: explicit warnings for UI (separate from logs)
    - result: outcome data on completion
    - error: error message on failure
    """
    _id: Optional[str] = None
    jobId: str
    userId: str
    projectId: Optional[str] = None
    status: str = JobStatus.PENDING.value
    architecture_spec: Dict[str, Any]
    prompt: str = ""  # Denormalized from architecture_spec
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)  # Explicit warnings for UI
    createdAt: datetime = Field(default_factory=get_utc_now)
    updatedAt: datetime = Field(default_factory=get_utc_now)
    completedAt: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class JobResponse(BaseModel):
    """Job response model for API"""
    jobId: str
    projectId: Optional[str] = None
    status: str
    prompt: str = ""  # Denormalized from architecture_spec
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)  # Explicit warnings for UI
    createdAt: datetime
    updatedAt: datetime
    completedAt: Optional[datetime] = None
