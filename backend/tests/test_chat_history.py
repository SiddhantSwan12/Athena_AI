import asyncio

from routers import chat


class FakeConversationsCollection:
    def __init__(self, conversation):
        self.conversation = conversation
        self.query = None
        self.projection = None

    async def find_one(self, query, projection):
        self.query = query
        self.projection = projection
        return self.conversation


def test_load_history_includes_prior_image_context(monkeypatch):
    fake = FakeConversationsCollection(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "What does this chart show?",
                    "attachments": [
                        {
                            "type": "image",
                            "name": "chart.png",
                            "visual_context": "Revenue rises from Q1 to Q4.",
                        }
                    ],
                },
                {
                    "role": "assistant",
                    "content": "It shows steady quarterly growth.",
                },
            ]
        }
    )
    monkeypatch.setattr(chat, "conversations_col", fake)

    history = asyncio.run(chat._load_history("conversation-1", "user-1"))

    assert history == [
        {
            "role": "user",
            "content": (
                "What does this chart show?\n\n"
                "[Image attached: chart.png]\n"
                "[Image analysis: Revenue rises from Q1 to Q4.]"
            ),
        },
        {
            "role": "assistant",
            "content": "It shows steady quarterly growth.",
        },
    ]
    assert fake.query == {"id": "conversation-1", "user_id": "user-1"}


def test_load_history_merges_consecutive_roles_and_starts_with_user(monkeypatch):
    fake = FakeConversationsCollection(
        {
            "messages": [
                {"role": "assistant", "content": "orphan"},
                {"role": "user", "content": "first"},
                {"role": "user", "content": "second"},
                {"role": "assistant", "content": "answer"},
            ]
        }
    )
    monkeypatch.setattr(chat, "conversations_col", fake)

    history = asyncio.run(chat._load_history("conversation-2", "user-1"))

    assert history == [
        {"role": "user", "content": "first\n\nsecond"},
        {"role": "assistant", "content": "answer"},
    ]


def test_load_history_includes_prior_audio_transcript(monkeypatch):
    fake = FakeConversationsCollection(
        {
            "messages": [
                {
                    "role": "user",
                    "content": "Summarize this recording.",
                    "attachments": [
                        {
                            "type": "audio",
                            "name": "interview.mp3",
                            "transcript": "The speaker discusses renewable energy.",
                        }
                    ],
                },
                {
                    "role": "assistant",
                    "content": "The recording discusses renewable energy.",
                },
            ]
        }
    )
    monkeypatch.setattr(chat, "conversations_col", fake)

    history = asyncio.run(chat._load_history("conversation-3", "user-1"))

    assert history[0]["content"] == (
        "Summarize this recording.\n\n"
        "[Audio attached: interview.mp3]\n"
        "[Audio transcript: The speaker discusses renewable energy.]"
    )
