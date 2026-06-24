import asyncio
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from config import settings

TOKEN_URL = "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe"


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
