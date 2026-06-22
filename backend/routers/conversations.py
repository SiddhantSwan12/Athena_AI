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
