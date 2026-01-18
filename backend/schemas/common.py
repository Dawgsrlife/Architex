"""
Common utilities for MongoDB ObjectId serialization
"""
from bson import ObjectId
from typing import Any
from datetime import datetime, timezone


def objectid_to_str(value: Any) -> str:
    """Convert ObjectId to string if needed"""
    if isinstance(value, ObjectId):
        return str(value)
    return value


def get_utc_now() -> datetime:
    """Get current UTC datetime with timezone awareness"""
    return datetime.now(timezone.utc)

