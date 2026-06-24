import asyncio
import json
import logging
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from config import settings

TOKEN_URL = "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe"
TRANSCRIPTION_URL = "https://api.elevenlabs.io/v1/speech-to-text"
logger = logging.getLogger(__name__)


class SpeechTranscriptionError(RuntimeError):
    pass


def _request_realtime_token() -> str:
    request = Request(
        TOKEN_URL,
        data=b"",
        method="POST",
        headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
    )

    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = "ElevenLabs rejected the speech request"
        if exc.code == 401:
            detail = "ElevenLabs API key is invalid"
        elif exc.code == 429:
            detail = "ElevenLabs speech quota or rate limit was reached"
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not connect to ElevenLabs speech service",
        ) from exc

    token = payload.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ElevenLabs returned an invalid speech token",
        )
    return token


async def create_realtime_token() -> str:
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Speech-to-text is not configured",
        )
    return await asyncio.to_thread(_request_realtime_token)


def _multipart_body(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
) -> tuple[bytes, str]:
    boundary = f"----AthenaAudio{uuid.uuid4().hex}"
    chunks: list[bytes] = []

    def add_field(name: str, value: str) -> None:
        chunks.extend(
            [
                f"--{boundary}\r\n".encode(),
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode(),
                value.encode(),
                b"\r\n",
            ]
        )

    add_field("model_id", "scribe_v2")
    add_field("tag_audio_events", "false")
    add_field("timestamps_granularity", "word")
    add_field("no_verbatim", "true")

    safe_filename = filename.replace('"', "") or "audio"
    chunks.extend(
        [
            f"--{boundary}\r\n".encode(),
            (
                f'Content-Disposition: form-data; name="file"; '
                f'filename="{safe_filename}"\r\n'
            ).encode(),
            f"Content-Type: {mime_type}\r\n\r\n".encode(),
            audio_bytes,
            b"\r\n",
            f"--{boundary}--\r\n".encode(),
        ]
    )
    return b"".join(chunks), boundary


def _transcribe_sync(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
) -> dict:
    body, boundary = _multipart_body(audio_bytes, filename, mime_type)
    request = Request(
        TRANSCRIPTION_URL,
        data=body,
        method="POST",
        headers={
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )

    try:
        with urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = "ElevenLabs rejected the audio transcription request"
        try:
            error_payload = json.loads(exc.read().decode("utf-8"))
            provider_detail = error_payload.get("detail") or {}
            if provider_detail.get("code") == "invalid_audio":
                detail = "The audio file is corrupted or cannot be decoded"
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass
        if exc.code == 401:
            detail = "ElevenLabs API key is invalid"
        elif exc.code == 413:
            detail = "The audio file is too large for transcription"
        elif exc.code == 429:
            detail = "ElevenLabs transcription quota or rate limit was reached"
        logger.warning("ElevenLabs transcription failed with HTTP %s", exc.code)
        raise SpeechTranscriptionError(detail) from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise SpeechTranscriptionError(
            "Could not connect to ElevenLabs transcription service"
        ) from exc

    text = (payload.get("text") or "").strip()
    if not text:
        raise SpeechTranscriptionError(
            "No speech could be detected in that audio file"
        )

    words = payload.get("words") or []
    duration_seconds = max(
        (
            float(word.get("end") or 0)
            for word in words
            if isinstance(word, dict)
        ),
        default=0,
    )
    return {
        "text": text,
        "language_code": payload.get("language_code"),
        "language_probability": payload.get("language_probability"),
        "duration_seconds": round(duration_seconds, 2),
    }


async def transcribe_audio(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
) -> dict:
    if not settings.ELEVENLABS_API_KEY:
        raise SpeechTranscriptionError("Speech-to-text is not configured")
    return await asyncio.to_thread(
        _transcribe_sync,
        audio_bytes,
        filename,
        mime_type,
    )
