from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from db import chunks_col, documents_col
from models.schemas import IngestTextRequest
from services.auth_service import get_current_user
from services.ingestion import extract_text_from_file, ingest_document

router = APIRouter(prefix="/api/ingest", tags=["ingest"])

ALLOWED_VERTICALS = {
    "finance", "health", "education",
    "technology", "geopolitics", "law",
    "environment", "business", "sports", "entertainment",
}


@router.post("/file")
async def ingest_file(
    file: UploadFile = File(...),
    vertical: str = Form(...),
    title: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    if vertical not in ALLOWED_VERTICALS:
        raise HTTPException(status_code=400, detail=f"vertical must be one of {sorted(ALLOWED_VERTICALS)}")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    raw = await file.read()
    try:
        text = extract_text_from_file(file.filename, raw)
    except ValueError as e:
        raise HTTPException(status_code=415, detail=str(e))

    if len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Document appears empty or unreadable")

    return await ingest_document(
        content=text, title=title.strip(), vertical=vertical, user_id=current_user["id"]
    )


@router.post("/text")
async def ingest_text(
    req: IngestTextRequest, current_user: dict = Depends(get_current_user)
):
    if req.vertical not in ALLOWED_VERTICALS:
        raise HTTPException(status_code=400, detail="invalid vertical")
    return await ingest_document(
        content=req.content,
        title=req.title.strip(),
        vertical=req.vertical,
        user_id=current_user["id"],
    )


@router.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)):
    cursor = documents_col.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("created_at", -1)
    return [doc async for doc in cursor]


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    doc = await documents_col.find_one({"id": document_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await chunks_col.delete_many({"document_id": document_id})
    await documents_col.delete_one({"id": document_id})
    return {"deleted": True, "document_id": document_id}
