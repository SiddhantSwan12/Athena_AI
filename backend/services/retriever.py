"""Cosine-similarity retrieval over MongoDB chunks (in-process)."""
import logging
from typing import Any

import numpy as np

from config import settings
from db import chunks_col
from services.embedder import embed_query

logger = logging.getLogger(__name__)


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b)) or 1e-9
    return float(np.dot(a, b) / denom)


async def retrieve_chunks(
    query: str,
    vertical: str,
    top_k: int | None = None,
    threshold: float | None = None,
) -> list[dict[str, Any]]:
    top_k = top_k or settings.TOP_K_CHUNKS
    threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD

    try:
        q_vec = np.array(await embed_query(query), dtype=np.float32)
    except Exception as exc:
        logger.warning("Embedding failed, skipping RAG retrieval: %s", exc)
        return []

    cursor = chunks_col.find(
        {"vertical": vertical},
        {"_id": 0, "id": 1, "document_id": 1, "content": 1, "embedding": 1, "title": 1},
    )

    scored: list[dict[str, Any]] = []
    async for doc in cursor:
        emb = doc.get("embedding")
        if not emb:
            continue
        sim = _cosine(q_vec, np.array(emb, dtype=np.float32))
        if sim >= threshold:
            scored.append(
                {
                    "id": doc["id"],
                    "document_id": doc["document_id"],
                    "content": doc["content"],
                    "title": doc.get("title"),
                    "similarity": sim,
                }
            )

    scored.sort(key=lambda d: d["similarity"], reverse=True)
    return scored[:top_k]
