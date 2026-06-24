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
