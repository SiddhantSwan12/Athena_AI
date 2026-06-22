from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

_client = AsyncIOMotorClient(settings.MONGO_URL)
db = _client[settings.DB_NAME]

users_col = db["users"]
documents_col = db["documents"]
chunks_col = db["chunks"]
conversations_col = db["conversations"]


async def ensure_indexes() -> None:
    await users_col.create_index("email", unique=True)
    await documents_col.create_index([("user_id", 1), ("created_at", -1)])
    await chunks_col.create_index([("vertical", 1)])
    await chunks_col.create_index([("document_id", 1)])
