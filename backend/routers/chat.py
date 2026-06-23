import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from db import conversations_col
from models.schemas import ChatRequest, ChatResponse, SourceItem, WebSourceItem
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

router = APIRouter(prefix="/api/chat", tags=["chat"])


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


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    classified = await classify_vertical(req.query)
    active = req.vertical or classified

    # Run RAG retrieval + live web search in parallel — no added latency.
    chunks, web_results = await asyncio.gather(
        retrieve_chunks(req.query, active),
        web_search(req.query, active),
    )

    result = await generate_answer(req.query, chunks, active, web_results)

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
        async for text in stream_answer_text(req.query, chunks, active, web_results):
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
