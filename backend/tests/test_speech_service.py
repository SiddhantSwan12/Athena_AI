import asyncio
import io
import json
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from services import speech


class FakeResponse:
    def __init__(self, payload: dict):
        self._body = io.BytesIO(json.dumps(payload).encode("utf-8"))

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def read(self) -> bytes:
        return self._body.read()


def test_create_realtime_token_requires_configuration(monkeypatch):
    monkeypatch.setattr(speech.settings, "ELEVENLABS_API_KEY", "")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(speech.create_realtime_token())

    assert exc.value.status_code == 503


def test_create_realtime_token_returns_single_use_token(monkeypatch):
    monkeypatch.setattr(speech.settings, "ELEVENLABS_API_KEY", "test-key")

    with patch.object(
        speech, "urlopen", return_value=FakeResponse({"token": "sutkn_test"})
    ):
        token = asyncio.run(speech.create_realtime_token())

    assert token == "sutkn_test"


def test_transcribe_audio_uses_scribe_v2_without_filler_words(monkeypatch):
    monkeypatch.setattr(speech.settings, "ELEVENLABS_API_KEY", "test-key")
    payload = {
        "text": "Athena can analyze this recording.",
        "language_code": "en",
        "language_probability": 0.99,
        "words": [
            {"text": "Athena", "start": 0.1, "end": 0.5},
            {"text": "recording", "start": 1.2, "end": 1.8},
        ],
    }

    with patch.object(
        speech, "urlopen", return_value=FakeResponse(payload)
    ) as request_call:
        result = asyncio.run(
            speech.transcribe_audio(
                b"ID3audio-bytes",
                "sample.mp3",
                "audio/mpeg",
            )
        )

    request = request_call.call_args.args[0]
    request_body = request.data
    assert b'name="model_id"\r\n\r\nscribe_v2' in request_body
    assert b'name="no_verbatim"\r\n\r\ntrue' in request_body
    assert b'filename="sample.mp3"' in request_body
    assert result == {
        "text": "Athena can analyze this recording.",
        "language_code": "en",
        "language_probability": 0.99,
        "duration_seconds": 1.8,
    }


def test_transcribe_audio_rejects_empty_transcript(monkeypatch):
    monkeypatch.setattr(speech.settings, "ELEVENLABS_API_KEY", "test-key")

    with patch.object(
        speech, "urlopen", return_value=FakeResponse({"text": "", "words": []})
    ):
        with pytest.raises(speech.SpeechTranscriptionError) as exc:
            asyncio.run(
                speech.transcribe_audio(
                    b"RIFFxxxxWAVEaudio",
                    "silence.wav",
                    "audio/wav",
                )
            )

    assert "No speech" in str(exc.value)
