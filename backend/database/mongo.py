"""
MongoDB Atlas connection management using Motor (async)
Provides FastAPI lifecycle integration
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
from contextlib import asynccontextmanager

from config import settings

logger = logging.getLogger(__name__)

# Global client instance
_client: Optional[AsyncIOMotorClient] = None
_db = None


def get_client() -> AsyncIOMotorClient:
    """Get MongoDB client instance"""
    global _client
    if _client is None:
        raise RuntimeError("MongoDB client not initialized. Call init_mongo() first.")
    return _client


def get_db():
    """Get database instance"""
    global _db
    if _db is None:
        raise RuntimeError("MongoDB database not initialized. Call init_mongo() first.")
    return _db


async def init_mongo():
    """Initialize MongoDB connection"""
    global _client, _db
    
    if not settings.mongodb_uri:
        raise ValueError("MONGODB_URI environment variable not set")
    
    try:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
        _db = _client[settings.mongodb_db_name]
        
        # Test connection
        await _client.admin.command('ping')
        logger.info(f"MongoDB connected to database: {settings.mongodb_db_name}")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


@asynccontextmanager
async def lifespan(app):
    """FastAPI lifespan context manager"""
    # Startup
    await init_mongo()
    yield
    # Shutdown
    await close_mongo()

