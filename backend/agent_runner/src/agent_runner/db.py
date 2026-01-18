"""Database connection and utilities"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from .config import Config
import logging

logger = logging.getLogger(__name__)


class Database:
    """MongoDB database connection for agent runner"""
    
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect(cls) -> None:
        """Connect to MongoDB"""
        if cls.client is None:
            if not Config.MONGODB_URI:
                raise ValueError("MONGODB_URI not configured")
            
            cls.client = AsyncIOMotorClient(Config.MONGODB_URI)
            logger.info(f"Connected to MongoDB database: {Config.MONGO_DB_NAME}")
    
    @classmethod
    async def disconnect(cls) -> None:
        """Disconnect from MongoDB"""
        if cls.client:
            cls.client.close()
            cls.client = None
            logger.info("Disconnected from MongoDB")
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        if cls.client is None:
            raise RuntimeError("Database not connected. Call Database.connect() first.")
        return cls.client[Config.MONGO_DB_NAME]
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection from database"""
        db = cls.get_database()
        return db[collection_name]
