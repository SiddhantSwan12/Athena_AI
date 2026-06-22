import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from db import conversations_col
from models.schemas import ChatRequest, ChatResponse, SourceItem
from services.auth_service import get_current_user
from services.classifier import classify_vertical
from services.generator import generate_answer
from services.retriever import retrieve_chunks

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    classified = await classify_vertical(req.query)
    active = req.vertical or classified

    chunks = await retrieve_chunks(req.query, active)
    result = await generate_answer(req.query, chunks, active)

    now_iso = datetime.now(timezone.utc).isoformat()
    convo_id = req.conversation_id or str(uuid.uuid4())

    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": req.query,
        "vertical": active,
        "timestamp": now_iso,
    }
    assistant_msg = {
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": result["answer"],
        "vertical": active,
        "classified_vertical": classified,
        "sources": result["sources"],
        "timestamp": now_iso,
    }

    if req.conversation_id:
        await conversations_col.update_one(
            {"id": convo_id, "user_id": current_user["id"]},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": now_iso, "vertical": active},
            },
            upsert=False,
        )
    else:
        title = req.query[:60] + ("…" if len(req.query) > 60 else "")
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

    return ChatResponse(
        answer=result["answer"],
        vertical=active,
        classified_vertical=classified,
        sources=[SourceItem(**s) for s in result["sources"]],
        conversation_id=convo_id,
    )
