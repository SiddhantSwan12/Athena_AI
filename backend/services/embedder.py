"""Convert text to a 768-dim vector using Gemini text-embedding-004."""
import asyncio
import google.generativeai as genai

from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

_EMBED_MODEL = "models/gemini-embedding-001"


def _embed_sync(text: str, task_type: str) -> list[float]:
    result = genai.embed_content(
        model=_EMBED_MODEL,
        content=text,
        task_type=task_type,
    )
    return result["embedding"]


async def embed_query(text: str) -> list[float]:
    return await asyncio.to_thread(_embed_sync, text, "retrieval_query")


async def embed_document(text: str) -> list[float]:
    return await asyncio.to_thread(_embed_sync, text, "retrieval_document")
