"""
MongoDB Atlas connection management using Motor (async)
Provides FastAPI lifecycle integration
"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
import asyncio
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


async def init_mongo(max_retries: int = 3, retry_delay: float = 1.0):
    """
    Initialize MongoDB connection with retry logic.
    
    Args:
        max_retries: Number of connection attempts
        retry_delay: Seconds between retries (doubles each attempt)
    """
    global _client, _db
    
    if not settings.mongodb_uri:
        raise ValueError("MONGODB_URI environment variable not set")
    
    last_error = None
    delay = retry_delay
    
    for attempt in range(1, max_retries + 1):
        try:
            _client = AsyncIOMotorClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
            )
            _db = _client[settings.mongodb_db_name]
            
            # Test connection
            await _client.admin.command('ping')
            logger.info(f"MongoDB connected to database: {settings.mongodb_db_name}")
            return
            
        except Exception as e:
            last_error = e
            logger.warning(f"MongoDB connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                await asyncio.sleep(delay)
                delay *= 2  # Exponential backoff
    
    logger.error(f"Failed to connect to MongoDB after {max_retries} attempts")
    raise last_error


async def close_mongo():
    """Close MongoDB connection"""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")


async def is_connected() -> bool:
    """
    Health check for MongoDB connection.
    
    Returns:
        True if connected and responsive, False otherwise
    """
    global _client
    if _client is None:
        return False
    
    try:
        await _client.admin.command('ping')
        return True
    except Exception:
        return False


@asynccontextmanager
async def lifespan(app):
    """FastAPI lifespan context manager"""
    # Startup
    await init_mongo()
    yield
    # Shutdown
    await close_mongo()


