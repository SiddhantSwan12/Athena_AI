from fastapi import APIRouter, Depends, HTTPException

from db import conversations_col
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    cursor = conversations_col.find(
        {"user_id": current_user["id"]},
        {"_id": 0, "id": 1, "title": 1, "vertical": 1, "updated_at": 1, "created_at": 1},
    ).sort("updated_at", -1).limit(50)
    return [c async for c in cursor]


@router.get("/investigations")
async def list_investigations(
    current_user: dict = Depends(get_current_user),
):
    cursor = conversations_col.find(
        {
            "user_id": current_user["id"],
            "messages.investigation": {"$exists": True},
        },
        {"_id": 0, "id": 1, "messages": 1},
    ).sort("updated_at", -1).limit(50)
    results = []
    async for conversation in cursor:
        for message in reversed(conversation.get("messages", [])):
            investigation = message.get("investigation")
            if not investigation:
                continue
            results.append(
                {
                    **investigation,
                    "conversation_id": conversation["id"],
                }
            )
            if len(results) >= 50:
                return results
    return results


@router.get("/investigations/{investigation_id}")
async def get_investigation(
    investigation_id: str,
    current_user: dict = Depends(get_current_user),
):
    convo = await conversations_col.find_one(
        {
            "user_id": current_user["id"],
            "messages.investigation.id": investigation_id,
        },
        {"_id": 0, "id": 1, "messages": 1},
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Investigation not found")
    for message in convo.get("messages", []):
        investigation = message.get("investigation")
        if investigation and investigation.get("id") == investigation_id:
            return {
                **investigation,
                "conversation_id": convo["id"],
                "answer": message.get("content", ""),
            }
    raise HTTPException(status_code=404, detail="Investigation not found")


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    convo = await conversations_col.find_one(
        {"id": conversation_id, "user_id": current_user["id"]}, {"_id": 0}
    )
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return convo


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    result = await conversations_col.delete_one(
        {"id": conversation_id, "user_id": current_user["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"deleted": True}
