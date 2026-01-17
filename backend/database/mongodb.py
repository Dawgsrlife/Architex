from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict, Any, List
import os
import logging

logger = logging.getLogger(__name__)


class MockCollection:
    """In-memory mock collection for testing without MongoDB"""
    
    def __init__(self, name: str):
        self.name = name
        self._data: Dict[str, dict] = {}
    
    async def find_one(self, query: dict) -> Optional[dict]:
        """Find a single document"""
        _id = query.get("_id")
        if _id and _id in self._data:
            return self._data[_id]
        # Simple query matching
        for doc in self._data.values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None
    
    async def insert_one(self, doc: dict):
        """Insert a document"""
        _id = doc.get("_id")
        if not _id:
            import uuid
            _id = str(uuid.uuid4())
            doc["_id"] = _id
        self._data[_id] = doc
        logger.debug(f"[Mock] Inserted into {self.name}: {_id}")
        return type("InsertResult", (), {"inserted_id": _id})()
    
    async def update_one(self, query: dict, update: dict):
        """Update a document"""
        doc = await self.find_one(query)
        if doc:
            _id = doc["_id"]
            if "$set" in update:
                self._data[_id].update(update["$set"])
            if "$push" in update:
                for key, value in update["$push"].items():
                    if key not in self._data[_id]:
                        self._data[_id][key] = []
                    self._data[_id][key].append(value)
            logger.debug(f"[Mock] Updated in {self.name}: {_id}")
    
    def find(self, query: dict = None):
        """Find multiple documents (returns async iterator)"""
        return MockCursor(self._data.values(), query)
    
    async def delete_one(self, query: dict):
        """Delete a document"""
        doc = await self.find_one(query)
        if doc:
            del self._data[doc["_id"]]


class MockCursor:
    """Mock cursor for find() results"""
    
    def __init__(self, data, query=None):
        self._data = list(data)
        self._query = query or {}
    
    def sort(self, field, direction):
        return self
    
    def __aiter__(self):
        return self
    
    async def __anext__(self):
        if not self._data:
            raise StopAsyncIteration
        return self._data.pop(0)


class MockDatabase:
    """In-memory mock database for testing"""
    
    def __init__(self, name: str):
        self.name = name
        self._collections: Dict[str, MockCollection] = {}
    
    def __getattr__(self, name: str) -> MockCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]


class MongoDB:
    """MongoDB database connection (with mock fallback for testing)"""
    
    client: Optional[AsyncIOMotorClient] = None
    _connected: bool = False
    _mock_db: Optional[MockDatabase] = None
    _use_mock: bool = False
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB or use mock for testing"""
        mongodb_uri = os.getenv("MONGODB_URI")
        
        if not mongodb_uri:
            logger.warning("MONGODB_URI not set - using IN-MEMORY mock database (data will be lost on restart)")
            cls._use_mock = True
            cls._mock_db = MockDatabase("architex")
            cls._connected = True
            return
        
        try:
            cls.client = AsyncIOMotorClient(mongodb_uri)
            await cls.client.admin.command('ping')
            cls._connected = True
            cls._use_mock = False
            logger.info("MongoDB connected successfully")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            logger.warning("Falling back to IN-MEMORY mock database")
            cls._use_mock = True
            cls._mock_db = MockDatabase("architex")
            cls._connected = True
        
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
        cls._connected = False
        cls._mock_db = None
    
    @classmethod
    def is_connected(cls) -> bool:
        """Check if database is connected"""
        return cls._connected
    
    @classmethod
    def is_mock(cls) -> bool:
        """Check if using mock database"""
        return cls._use_mock
    
    @classmethod
    def get_database(cls):
        """Get database instance"""
        if not cls._connected:
            raise RuntimeError("Database not connected")
        
        if cls._use_mock:
            return cls._mock_db
        
        return cls.client.architex
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection from database"""
        db = cls.get_database()
        return db[collection_name]


async def init_db():
    """Initialize database connection"""
    await MongoDB.connect_db()


async def close_db():
    """Close database connection"""
    await MongoDB.close_db()
