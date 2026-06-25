import asyncio
import json

from routers import chat


class FakeConversationsCollection:
    def __init__(self):
        self.document = None

    async def insert_one(self, document):
        self.document = document


def event_payload(events, event_name):
    prefix = f"event: {event_name}\n"
    event = next(item for item in events if item.startswith(prefix))
    return json.loads(event.split("data: ", 1)[1])


def test_image_events_emit_and_persist_authenticity(monkeypatch):
    fake_collection = FakeConversationsCollection()
    assessment = {
        "label": "insufficient_evidence",
        "confidence": 0.35,
        "summary": "The available signals are mixed.",
        "visual_signals": [],
        "provenance_signals": [],
        "metadata": {"format": "PNG"},
        "source_matches": [],
        "reverse_search_performed": False,
        "limitations": ["No definitive provenance was available."],
        "method": "metadata + visual screening",
    }
    streamed_web_results = []

    async def fake_classify(_query):
        return "technology"

    async def fake_retrieve(*_args, **_kwargs):
        return []

    async def fake_web(*_args, **_kwargs):
        return [
            {
                "title": "Generic methodology article",
                "url": "https://example.com/method",
                "content": "How image detection works.",
                "score": 0.9,
            }
        ]

    async def fake_assess(*_args, **_kwargs):
        return assessment

    async def fake_stream(_query, _chunks, _vertical, web_results, **kwargs):
        streamed_web_results.extend(web_results)
        assert "IMAGE AUTHENTICITY SCREENING" in kwargs["authenticity_context"]
        yield "The image has insufficient authenticity evidence."

    monkeypatch.setattr(chat, "conversations_col", fake_collection)
    monkeypatch.setattr(chat, "classify_vertical", fake_classify)
    monkeypatch.setattr(chat, "retrieve_chunks", fake_retrieve)
    monkeypatch.setattr(chat, "web_search", fake_web)
    monkeypatch.setattr(
        chat,
        "extract_image_metadata",
        lambda *_args: {"format": "PNG"},
    )
    monkeypatch.setattr(chat, "assess_image_authenticity", fake_assess)
    monkeypatch.setattr(chat, "stream_answer_text", fake_stream)

    async def collect():
        events = []
        async for event in chat._image_events(
            query="Is this image real?",
            visual_context="A person stands beside a vehicle.",
            image_bytes=b"image",
            image_name="photo.png",
            image_type="image/png",
            vertical=None,
            conversation_id=None,
            current_user={"id": "user-1"},
            history=[],
        ):
            events.append(event)
        return events

    events = asyncio.run(collect())
    meta = event_payload(events, "meta")
    done = event_payload(events, "done")

    assert meta["authenticity"]["label"] == "insufficient_evidence"
    assert done["authenticity"]["confidence"] == 0.35
    assert meta["web_sources"] == []
    assert streamed_web_results == []
    assistant = fake_collection.document["messages"][1]
    assert assistant["authenticity"]["label"] == "insufficient_evidence"
    attachment = fake_collection.document["messages"][0]["attachments"][0]
    assert attachment["authenticity"]["method"] == "metadata + visual screening"


def test_image_events_use_observation_fallback_when_direct_screening_fails(
    monkeypatch,
):
    fake_collection = FakeConversationsCollection()
    fallback = {
        "label": "likely_authentic",
        "confidence": 0.61,
        "summary": "Several photographic details are mutually consistent.",
        "visual_signals": ["Natural depth of field."],
        "provenance_signals": [],
        "metadata": {"format": "JPEG"},
        "source_matches": [],
        "reverse_search_performed": False,
        "limitations": ["Fallback review used."],
        "method": "metadata + fallback review of the image observation",
    }

    async def fake_classify(_query):
        return "technology"

    async def fake_empty(*_args, **_kwargs):
        return []

    async def fail_direct(*_args, **_kwargs):
        raise chat.ImageAuthenticityError("Direct review failed")

    async def fake_fallback(*_args, **_kwargs):
        return fallback

    async def fake_stream(*_args, **_kwargs):
        yield "The image is likely authentic, with limitations."

    monkeypatch.setattr(chat, "conversations_col", fake_collection)
    monkeypatch.setattr(chat, "classify_vertical", fake_classify)
    monkeypatch.setattr(chat, "retrieve_chunks", fake_empty)
    monkeypatch.setattr(chat, "web_search", fake_empty)
    monkeypatch.setattr(
        chat,
        "extract_image_metadata",
        lambda *_args: {"format": "JPEG"},
    )
    monkeypatch.setattr(chat, "assess_image_authenticity", fail_direct)
    monkeypatch.setattr(
        chat,
        "assess_authenticity_from_observation",
        fake_fallback,
    )
    monkeypatch.setattr(chat, "stream_answer_text", fake_stream)

    async def collect():
        return [
            event
            async for event in chat._image_events(
                query="Is this real?",
                visual_context="A detailed professional headshot.",
                image_bytes=b"image",
                image_name="portrait.jpg",
                image_type="image/jpeg",
                vertical=None,
                conversation_id=None,
                current_user={"id": "user-1"},
                history=[],
            )
        ]

    events = asyncio.run(collect())
    meta = event_payload(events, "meta")

    assert meta["authenticity"]["label"] == "likely_authentic"
    assert meta["authenticity"]["confidence"] == 0.61
