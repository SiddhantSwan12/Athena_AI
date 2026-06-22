"""Chunk a document, embed each chunk, and persist in MongoDB."""
import io
import uuid
from datetime import datetime, timezone

import pdfplumber

from config import settings
from db import chunks_col, documents_col
from services.embedder import embed_document


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    text = " ".join(text.split())  # normalise whitespace
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    step = max(1, chunk_size - overlap)
    while start < len(text):
        end = min(len(text), start + chunk_size)
        # Try to end at a sentence boundary for cleaner chunks
        if end < len(text):
            window = text.rfind(". ", start, end)
            if window != -1 and window > start + chunk_size // 2:
                end = window + 1
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start += step
    return [c for c in chunks if c]


def extract_text_from_file(filename: str, content_bytes: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(content_bytes)) as pdf:
            return "\n".join((page.extract_text() or "") for page in pdf.pages)
    if name.endswith(".txt") or name.endswith(".md"):
        return content_bytes.decode("utf-8", errors="ignore")
    raise ValueError("Unsupported file type. Use .pdf, .txt or .md")


async def ingest_document(
    *, content: str, title: str, vertical: str, user_id: str
) -> dict:
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    chunk_texts = _split_text(content, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
    if not chunk_texts:
        raise ValueError("Document produced no chunks (content too short or unreadable)")

    chunk_records: list[dict] = []
    for i, ctext in enumerate(chunk_texts):
        embedding = await embed_document(ctext)
        chunk_records.append(
            {
                "id": str(uuid.uuid4()),
                "document_id": doc_id,
                "user_id": user_id,
                "vertical": vertical,
                "content": ctext,
                "embedding": embedding,
                "chunk_index": i,
                "title": title,
                "created_at": now.isoformat(),
            }
        )

    await documents_col.insert_one(
        {
            "id": doc_id,
            "user_id": user_id,
            "title": title,
            "vertical": vertical,
            "chunks_count": len(chunk_records),
            "created_at": now.isoformat(),
        }
    )
    if chunk_records:
        await chunks_col.insert_many(chunk_records)

    return {
        "document_id": doc_id,
        "chunks_inserted": len(chunk_records),
        "title": title,
        "vertical": vertical,
    }
