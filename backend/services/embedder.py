"""Convert text to a vector using Gemini embedding (google-genai REST SDK)."""
import asyncio

from google import genai
from google.genai import types

from config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)
_EMBED_MODEL = "models/gemini-embedding-001"


def _embed_sync(text: str, task_type: str) -> list[float]:
    result = _client.models.embed_content(
        model=_EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return list(result.embeddings[0].values)


async def embed_query(text: str) -> list[float]:
    return await asyncio.to_thread(_embed_sync, text, "RETRIEVAL_QUERY")


async def embed_document(text: str) -> list[float]:
    return await asyncio.to_thread(_embed_sync, text, "RETRIEVAL_DOCUMENT")
