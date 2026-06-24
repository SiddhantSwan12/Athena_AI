import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from db import conversations_col
from models.schemas import (
    ChatRequest,
    ChatResponse,
    SourceItem,
    Vertical,
    WebSourceItem,
)
from services.auth_service import get_current_user
from services.classifier import classify_vertical
from services.generator import (
    format_rag_sources,
    format_web_sources,
    generate_answer,
    stream_answer_text,
)
from services.retriever import retrieve_chunks
from services.web_search import web_search
from services.vision import VisionAnalysisError, analyze_image

router = APIRouter(prefix="/api/chat", tags=["chat"])
MAX_IMAGE_BYTES = 8 * 1024 * 1024
_HISTORY_LIMIT = 20  # last N messages (~10 turns) sent to Claude
_VISUAL_CONTEXT_HISTORY_LIMIT = 3000


async def _load_history(conversation_id: str | None, user_id: str) -> list[dict]:
    """Return prior messages from a conversation as Claude-compatible {role, content} dicts.

    For user messages that had an image attachment, the stored visual_context is
    injected into the content so Claude knows what the image contained on follow-up turns.
    """
    if not conversation_id:
        return []
    convo = await conversations_col.find_one(
        {"id": conversation_id, "user_id": user_id},
        {"messages": 1},
    )
    if not convo:
        return []

    raw: list[dict] = (convo.get("messages") or [])[-_HISTORY_LIMIT:]
    history: list[dict] = []
    for m in raw:
        role = m.get("role")
        if role not in ("user", "assistant"):
            continue
        content = m.get("content", "")
        if role == "user":
            for att in m.get("attachments", []):
                if att.get("type") == "image" and att.get("visual_context"):
                    visual_context = att["visual_context"][
                        :_VISUAL_CONTEXT_HISTORY_LIMIT
                    ]
                    content = (
                        f"{content}\n\n"
                        f"[Image attached: {att.get('name', 'image')}]\n"
                        f"[Image analysis: {visual_context}]"
                    )
        history.append({"role": role, "content": content})

    # Anthropic requires alternating turns starting with "user"
    cleaned: list[dict] = []
    for msg in history:
        if cleaned and cleaned[-1]["role"] == msg["role"]:
            cleaned[-1]["content"] += "\n\n" + msg["content"]
        else:
            cleaned.append({"role": msg["role"], "content": msg["content"]})
    while cleaned and cleaned[0]["role"] != "user":
        cleaned.pop(0)

    return cleaned


SUPPORTED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
}


def _matches_image_signature(image_bytes: bytes, image_type: str) -> bool:
    if image_type == "image/png":
        return image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    if image_type == "image/jpeg":
        return image_bytes.startswith(b"\xff\xd8\xff")
    if image_type == "image/webp":
        return (
            len(image_bytes) >= 12
            and image_bytes[:4] == b"RIFF"
            and image_bytes[8:12] == b"WEBP"
        )
    if image_type in {"image/heic", "image/heif"}:
        if len(image_bytes) < 12 or image_bytes[4:8] != b"ftyp":
            return False
        brand = image_bytes[8:12]
        heic_brands = {b"heic", b"heix", b"hevc", b"hevx"}
        heif_brands = {b"mif1", b"msf1", b"heif"}
        return brand in (
            heic_brands if image_type == "image/heic" else heif_brands
        )
    return False


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _save_conversation(
    *,
    current_user: dict,
    query: str,
    answer: str,
    active: str,
    classified: str,
    sources: list[dict],
    web_sources: list[dict],
    conversation_id: str | None,
    attachment: dict | None = None,
) -> str:
    now_iso = datetime.now(timezone.utc).isoformat()
    convo_id = conversation_id or str(uuid.uuid4())

    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": query,
        "vertical": active,
        "timestamp": now_iso,
    }
    if attachment:
        user_msg["attachments"] = [attachment]
    assistant_msg = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": answer,
        "vertical": active,
        "classified_vertical": classified,
        "sources": sources,
        "web_sources": web_sources,
        "timestamp": now_iso,
    }

    if conversation_id:
        await conversations_col.update_one(
            {"id": convo_id, "user_id": current_user["id"]},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": now_iso, "vertical": active},
            },
            upsert=False,
        )
    else:
        title = query[:60] + ("…" if len(query) > 60 else "")
        await conversations_col.insert_one(
            {
                "id": convo_id,
                "user_id": current_user["id"],
                "title": title,
                "vertical": active,
                "messages": [user_msg, assistant_msg],
                "created_at": now_iso,
                "updated_at": now_iso,
            }
        )

    return convo_id


async def _image_events(
    *,
    query: str,
    visual_context: str,
    image_name: str,
    image_type: str,
    vertical: str | None,
    conversation_id: str | None,
    current_user: dict,
    history: list[dict],
):
    evidence_query = f"{query}\nImage context: {visual_context[:700]}"
    classified = await classify_vertical(evidence_query)
    active = vertical or classified
    chunks, web_results = await asyncio.gather(
        retrieve_chunks(evidence_query, active),
        web_search(query, active)
        if query != "Analyze this image."
        else asyncio.sleep(0, result=[]),
    )

    sources = format_rag_sources(chunks)
    web_sources = format_web_sources(web_results)
    yield _sse(
        "meta",
        {
            "vertical": active,
            "classified_vertical": classified,
            "sources": sources,
            "web_sources": web_sources,
        },
    )

    answer_parts: list[str] = []
    async for text in stream_answer_text(
        query,
        chunks,
        active,
        web_results,
        visual_context=visual_context,
        history=history,
    ):
        answer_parts.append(text)
        yield _sse("token", {"text": text})

    answer = "".join(answer_parts)
    attachment = {
        "type": "image",
        "name": image_name,
        "mime_type": image_type,
        "visual_context": visual_context,
    }
    convo_id = await _save_conversation(
        current_user=current_user,
        query=query,
        answer=answer,
        active=active,
        classified=classified,
        sources=sources,
        web_sources=web_sources,
        conversation_id=conversation_id,
        attachment=attachment,
    )
    yield _sse(
        "done",
        {
            "answer": answer,
            "vertical": active,
            "classified_vertical": classified,
            "sources": sources,
            "web_sources": web_sources,
            "conversation_id": convo_id,
        },
    )


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    history = await _load_history(req.conversation_id, current_user["id"])
    classified = await classify_vertical(req.query)
    active = req.vertical or classified

    # Run RAG retrieval + live web search in parallel — no added latency.
    chunks, web_results = await asyncio.gather(
        retrieve_chunks(req.query, active),
        web_search(req.query, active),
    )

    result = await generate_answer(
        req.query,
        chunks,
        active,
        web_results,
        history=history,
    )

    convo_id = await _save_conversation(
        current_user=current_user,
        query=req.query,
        answer=result["answer"],
        active=active,
        classified=classified,
        sources=result["sources"],
        web_sources=result["web_sources"],
        conversation_id=req.conversation_id,
    )

    return ChatResponse(
        answer=result["answer"],
        vertical=active,
        classified_vertical=classified,
        sources=[SourceItem(**s) for s in result["sources"]],
        web_sources=[WebSourceItem(**s) for s in result["web_sources"]],
        conversation_id=convo_id,
    )


@router.post("/stream")
async def chat_stream(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    async def events():
        history = await _load_history(req.conversation_id, current_user["id"])
        classified = await classify_vertical(req.query)
        active = req.vertical or classified
        chunks, web_results = await asyncio.gather(
            retrieve_chunks(req.query, active),
            web_search(req.query, active),
        )

        sources = format_rag_sources(chunks)
        web_sources = format_web_sources(web_results)
        yield _sse(
            "meta",
            {
                "vertical": active,
                "classified_vertical": classified,
                "sources": sources,
                "web_sources": web_sources,
            },
        )

        answer_parts: list[str] = []
        async for text in stream_answer_text(req.query, chunks, active, web_results, history=history):
            answer_parts.append(text)
            yield _sse("token", {"text": text})

        answer = "".join(answer_parts)
        convo_id = await _save_conversation(
            current_user=current_user,
            query=req.query,
            answer=answer,
            active=active,
            classified=classified,
            sources=sources,
            web_sources=web_sources,
            conversation_id=req.conversation_id,
        )
        yield _sse(
            "done",
            {
                "answer": answer,
                "vertical": active,
                "classified_vertical": classified,
                "sources": sources,
                "web_sources": web_sources,
                "conversation_id": convo_id,
            },
        )

    return StreamingResponse(events(), media_type="text/event-stream")


@router.post("/stream-image")
async def chat_stream_image(
    query: str = Form(""),
    vertical: Vertical | None = Form(None),
    conversation_id: str | None = Form(None),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    clean_query = query.strip() or "Analyze this image."
    if len(clean_query) > 4000:
        raise HTTPException(status_code=400, detail="Query is too long")

    image_type = (image.content_type or "").lower()
    if image_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use PNG, JPEG, WebP, HEIC, or HEIF.",
        )

    image_bytes = await image.read(MAX_IMAGE_BYTES + 1)
    await image.close()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 8 MB or smaller")
    if not _matches_image_signature(image_bytes, image_type):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file does not match its declared image type",
        )

    try:
        visual_context = await analyze_image(image_bytes, image_type, clean_query)
    except VisionAnalysisError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    history = await _load_history(conversation_id, current_user["id"])

    return StreamingResponse(
        _image_events(
            query=clean_query,
            visual_context=visual_context,
            image_name=(image.filename or "image")[:200],
            image_type=image_type,
            vertical=vertical,
            conversation_id=conversation_id,
            current_user=current_user,
            history=history,
        ),
        media_type="text/event-stream",
    )
