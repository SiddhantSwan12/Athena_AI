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
    YouTubeChatRequest,
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
from services.speech import SpeechTranscriptionError, transcribe_audio
from services.web_search import web_search
from services.vision import VisionAnalysisError, analyze_image
from services.youtube import (
    YouTubeAnalysisError,
    analyze_youtube_video,
    parse_youtube_url,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_AUDIO_BYTES = 4 * 1024 * 1024
_HISTORY_LIMIT = 20  # last N messages (~10 turns) sent to Claude
_VISUAL_CONTEXT_HISTORY_LIMIT = 3000
_AUDIO_CONTEXT_HISTORY_LIMIT = 6000


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
                if att.get("type") == "audio" and att.get("transcript"):
                    transcript = att["transcript"][:_AUDIO_CONTEXT_HISTORY_LIMIT]
                    content = (
                        f"{content}\n\n"
                        f"[Audio attached: {att.get('name', 'audio')}]\n"
                        f"[Audio transcript: {transcript}]"
                    )
                if att.get("type") == "youtube" and att.get("video_context"):
                    video_context = att["video_context"][
                        :_AUDIO_CONTEXT_HISTORY_LIMIT
                    ]
                    content = (
                        f"{content}\n\n"
                        f"[YouTube video: {att.get('url', '')}]\n"
                        f"[Video analysis: {video_context}]"
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
SUPPORTED_AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/webm",
    "audio/ogg",
    "audio/aac",
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


def _matches_audio_signature(audio_bytes: bytes, audio_type: str) -> bool:
    if audio_type in {"audio/mpeg", "audio/mp3"}:
        return audio_bytes.startswith(b"ID3") or (
            len(audio_bytes) >= 2
            and audio_bytes[0] == 0xFF
            and audio_bytes[1] & 0xE0 == 0xE0
        )
    if audio_type in {"audio/wav", "audio/x-wav"}:
        return (
            len(audio_bytes) >= 12
            and audio_bytes[:4] == b"RIFF"
            and audio_bytes[8:12] == b"WAVE"
        )
    if audio_type in {"audio/mp4", "audio/m4a", "audio/x-m4a"}:
        return len(audio_bytes) >= 12 and audio_bytes[4:8] == b"ftyp"
    if audio_type == "audio/webm":
        return audio_bytes.startswith(b"\x1a\x45\xdf\xa3")
    if audio_type == "audio/ogg":
        return audio_bytes.startswith(b"OggS")
    if audio_type == "audio/aac":
        return (
            len(audio_bytes) >= 2
            and audio_bytes[0] == 0xFF
            and audio_bytes[1] & 0xF6 in {0xF0, 0xF2}
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
    assistant_metadata: dict | None = None,
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
    if assistant_metadata:
        assistant_msg.update(assistant_metadata)

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


async def _audio_events(
    *,
    query: str,
    transcript: str,
    audio_name: str,
    audio_type: str,
    language_code: str | None,
    duration_seconds: float,
    vertical: str | None,
    conversation_id: str | None,
    current_user: dict,
    history: list[dict],
):
    evidence_query = f"{query}\nAudio transcript: {transcript[:1800]}"
    classified = await classify_vertical(evidence_query)
    active = vertical or classified
    chunks, web_results = await asyncio.gather(
        retrieve_chunks(evidence_query, active),
        web_search(query, active)
        if query != "Analyze this audio recording."
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
            "transcript": transcript,
            "language_code": language_code,
            "duration_seconds": duration_seconds,
        },
    )

    answer_parts: list[str] = []
    async for text in stream_answer_text(
        query,
        chunks,
        active,
        web_results,
        audio_context=transcript,
        history=history,
    ):
        answer_parts.append(text)
        yield _sse("token", {"text": text})

    answer = "".join(answer_parts)
    attachment = {
        "type": "audio",
        "name": audio_name,
        "mime_type": audio_type,
        "transcript": transcript,
        "language_code": language_code,
        "duration_seconds": duration_seconds,
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
            "transcript": transcript,
            "language_code": language_code,
            "duration_seconds": duration_seconds,
        },
    )


def _format_video_context(analysis: dict) -> str:
    lines = [f"Overview: {analysis['overview']}"]
    for moment in analysis.get("moments", []):
        timestamp = moment.get("timestamp") or "00:00"
        lines.append(
            f"[{timestamp}] {moment.get('label', 'Moment')}: "
            f"{moment.get('observation', '')}"
        )
    for claim in analysis.get("claims", []):
        timestamp = claim.get("timestamp") or "00:00"
        lines.append(f"[Claim at {timestamp}] {claim.get('claim', '')}")
    return "\n".join(lines)


async def _youtube_events(
    *,
    query: str,
    youtube: dict[str, str],
    analysis: dict,
    vertical: str | None,
    conversation_id: str | None,
    current_user: dict,
    history: list[dict],
):
    video_context = _format_video_context(analysis)
    evidence_query = f"{query}\nYouTube video analysis: {video_context[:2200]}"
    classified = await classify_vertical(evidence_query)
    active = vertical or classified
    generic_queries = {
        "Analyze this YouTube video.",
        "Summarize this YouTube video.",
    }
    chunks, web_results = await asyncio.gather(
        retrieve_chunks(evidence_query, active),
        web_search(query, active)
        if query not in generic_queries
        else asyncio.sleep(0, result=[]),
    )

    sources = format_rag_sources(chunks)
    web_sources = format_web_sources(web_results)
    video_meta = {
        "video_id": youtube["video_id"],
        "url": youtube["url"],
        "embed_url": youtube["embed_url"],
        "overview": analysis["overview"],
        "language": analysis.get("language", "unknown"),
        "moments": analysis.get("moments", []),
        "claims": analysis.get("claims", []),
    }
    yield _sse(
        "meta",
        {
            "vertical": active,
            "classified_vertical": classified,
            "sources": sources,
            "web_sources": web_sources,
            "video": video_meta,
        },
    )

    answer_parts: list[str] = []
    async for text in stream_answer_text(
        query,
        chunks,
        active,
        web_results,
        video_context=video_context,
        history=history,
    ):
        answer_parts.append(text)
        yield _sse("token", {"text": text})

    answer = "".join(answer_parts)
    attachment = {
        "type": "youtube",
        **video_meta,
        "video_context": video_context,
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
        assistant_metadata={"video": video_meta},
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
            "video": video_meta,
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


@router.post("/stream-audio")
async def chat_stream_audio(
    query: str = Form(""),
    vertical: Vertical | None = Form(None),
    conversation_id: str | None = Form(None),
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    clean_query = query.strip() or "Analyze this audio recording."
    if len(clean_query) > 4000:
        raise HTTPException(status_code=400, detail="Query is too long")

    audio_type = (audio.content_type or "").lower()
    if audio_type not in SUPPORTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio type. Use MP3, WAV, M4A, WebM, OGG, or AAC.",
        )

    audio_bytes = await audio.read(MAX_AUDIO_BYTES + 1)
    await audio.close()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Audio must be 4 MB or smaller for this deployment",
        )
    if not _matches_audio_signature(audio_bytes, audio_type):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file does not match its declared audio type",
        )

    audio_name = (audio.filename or "audio")[:200]
    try:
        transcription = await transcribe_audio(
            audio_bytes,
            audio_name,
            audio_type,
        )
    except SpeechTranscriptionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    history = await _load_history(conversation_id, current_user["id"])
    return StreamingResponse(
        _audio_events(
            query=clean_query,
            transcript=transcription["text"],
            audio_name=audio_name,
            audio_type=audio_type,
            language_code=transcription.get("language_code"),
            duration_seconds=transcription.get("duration_seconds", 0),
            vertical=vertical,
            conversation_id=conversation_id,
            current_user=current_user,
            history=history,
        ),
        media_type="text/event-stream",
    )


@router.post("/stream-youtube")
async def chat_stream_youtube(
    req: YouTubeChatRequest,
    current_user: dict = Depends(get_current_user),
):
    clean_query = req.query.strip() or "Analyze this YouTube video."
    try:
        youtube = parse_youtube_url(req.youtube_url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        analysis = await analyze_youtube_video(youtube["url"], clean_query)
    except YouTubeAnalysisError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    history = await _load_history(req.conversation_id, current_user["id"])
    return StreamingResponse(
        _youtube_events(
            query=clean_query,
            youtube=youtube,
            analysis=analysis,
            vertical=req.vertical,
            conversation_id=req.conversation_id,
            current_user=current_user,
            history=history,
        ),
        media_type="text/event-stream",
    )
