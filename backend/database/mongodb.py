from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

class MongoDB:
    """MongoDB database connection"""
    
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise ValueError("MONGODB_URI environment variable not set")
        
        cls.client = AsyncIOMotorClient(mongodb_uri)
        
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        if not cls.client:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        return cls.client.architex
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection from database"""
        db = cls.get_database()
        return db[collection_name]

# Initialize database on startup
async def init_db():
    """Initialize database connection"""
    await MongoDB.connect_db()

# Close database on shutdown
async def close_db():
    """Close database connection"""
    await MongoDB.close_db()
