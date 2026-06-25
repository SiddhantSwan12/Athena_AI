import asyncio
import json

from routers import chat


class FakeConversationsCollection:
    def __init__(self):
        self.document = None

    async def insert_one(self, document):
        self.document = document


def test_youtube_events_include_and_persist_fact_checks(monkeypatch):
    fake_collection = FakeConversationsCollection()
    streamed_context = {}

    async def fake_classify(_query):
        return "technology"

    async def fake_retrieve(*_args, **_kwargs):
        return []

    async def fake_web(*_args, **_kwargs):
        return []

    async def fake_verify(_claims, _vertical):
        return [
            {
                "id": "claim-15",
                "claim": "The value is 42.",
                "timestamp": "00:15",
                "timestamp_seconds": 15,
                "verdict": "supported",
                "confidence": 0.9,
                "explanation": "Official evidence reports the same value.",
                "evidence_ids": ["web-1"],
                "evidence": [
                    {
                        "title": "Official announcement",
                        "url": "https://example.com/official",
                    }
                ],
                "evidence_quality": 0.9,
                "independent_sources": 1,
            },
            {
                "id": "claim-30",
                "claim": "The second value is 7.",
                "timestamp": "00:30",
                "timestamp_seconds": 30,
                "verdict": "supported",
                "confidence": 0.8,
                "explanation": "Independent evidence agrees.",
                "evidence_ids": ["web-1"],
                "evidence": [],
                "evidence_quality": 0.8,
                "independent_sources": 1,
            },
        ]

    async def fake_stream(*_args, **kwargs):
        streamed_context["video_context"] = kwargs["video_context"]
        yield "Verified answer."

    monkeypatch.setattr(chat, "conversations_col", fake_collection)
    monkeypatch.setattr(chat, "classify_vertical", fake_classify)
    monkeypatch.setattr(chat, "retrieve_chunks", fake_retrieve)
    monkeypatch.setattr(chat, "web_search", fake_web)
    monkeypatch.setattr(chat, "verify_claims", fake_verify)
    monkeypatch.setattr(chat, "stream_answer_text", fake_stream)

    async def collect():
        events = []
        async for event in chat._youtube_events(
            query="Check this video.",
            youtube={
                "video_id": "dQw4w9WgXcQ",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            },
            analysis={
                "overview": "A test video.",
                "language": "English",
                "moments": [],
                "claims": [
                    {
                        "claim": "The value is 42.",
                        "timestamp": "00:15",
                        "timestamp_seconds": 15,
                    },
                    {
                        "claim": "The second value is 7.",
                        "timestamp": "00:30",
                        "timestamp_seconds": 30,
                    },
                ],
            },
            vertical=None,
            conversation_id=None,
            current_user={"id": "user-1"},
            history=[],
        ):
            events.append(event)
        return events

    events = asyncio.run(collect())
    meta = json.loads(events[0].split("data: ", 1)[1])
    done = json.loads(events[-1].split("data: ", 1)[1])

    assert len(meta["video"]["fact_checks"]) == 2
    assert meta["video"]["credibility"]["label"] == "High evidence alignment"
    assert done["video"]["credibility"]["alignment_score"] == 100
    assert "UNVERIFIED VIDEO OBSERVATIONS" in streamed_context["video_context"]
    assert "VERIFIED VIDEO CLAIMS" in streamed_context["video_context"]
    assert "SUPPORTED (90% confidence)" in streamed_context["video_context"]
    assert "https://example.com/official" in streamed_context["video_context"]
    assistant = fake_collection.document["messages"][1]
    assert assistant["video"]["fact_checks"][0]["verdict"] == "supported"
