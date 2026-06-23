import logging

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError

from config import settings

logger = logging.getLogger(__name__)

# Motor client — no TLS bypasses. Atlas uses valid certs; if this fails it
# means network access (IP whitelist) or credentials are wrong, not the code.
_client = AsyncIOMotorClient(settings.MONGO_URL, serverSelectionTimeoutMS=10_000)
db = _client[settings.DB_NAME]

users_col = db["users"]
documents_col = db["documents"]
chunks_col = db["chunks"]
conversations_col = db["conversations"]


async def ensure_indexes() -> None:
    """Create required indexes and verify DB connectivity on startup.

    Raises a RuntimeError with a clear, actionable message if the database
    cannot be reached — so logs/monitoring show the real cause immediately
    instead of a deep SSL traceback.
    """
    try:
        # Lightweight ping — confirms real connectivity before touching indexes.
        await _client.admin.command("ping")
        logger.info("MongoDB connection verified ✓")
    except ServerSelectionTimeoutError as exc:
        raise RuntimeError(
            "Cannot reach MongoDB Atlas. Most likely causes:\n"
            "  1. Your IP is not whitelisted in Atlas → Network Access.\n"
            "  2. Wrong MONGO_URL / credentials in .env.\n"
            "  3. Atlas cluster is paused (free-tier auto-pause).\n"
            f"Original error: {exc}"
        ) from exc

    await users_col.create_index("email", unique=True)
    await documents_col.create_index([("user_id", 1), ("created_at", -1)])
    await chunks_col.create_index([("vertical", 1)])
    await chunks_col.create_index([("document_id", 1)])
    logger.info("MongoDB indexes ensured ✓")
