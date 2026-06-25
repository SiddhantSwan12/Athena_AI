import asyncio

import pytest
from fastapi import HTTPException

from routers import conversations


class FakeCursor:
    def __init__(self, documents):
        self.documents = documents

    def sort(self, *_args):
        return self

    def limit(self, count):
        self.documents = self.documents[:count]
        return self

    def __aiter__(self):
        self.iterator = iter(self.documents)
        return self

    async def __anext__(self):
        try:
            return next(self.iterator)
        except StopIteration as exc:
            raise StopAsyncIteration from exc


class FakeConversationsCollection:
    def __init__(self, documents):
        self.documents = documents
        self.last_query = None

    def find(self, query, _projection):
        self.last_query = query
        matches = [
            document
            for document in self.documents
            if document["user_id"] == query["user_id"]
        ]
        return FakeCursor(matches)

    async def find_one(self, query, _projection):
        self.last_query = query
        investigation_id = query["messages.investigation.id"]
        for document in self.documents:
            if document["user_id"] != query["user_id"]:
                continue
            if any(
                message.get("investigation", {}).get("id") == investigation_id
                for message in document.get("messages", [])
            ):
                return document
        return None


def investigation_document(user_id="user-1", investigation_id="report-1"):
    return {
        "id": "conversation-1",
        "user_id": user_id,
        "messages": [
            {
                "role": "assistant",
                "content": "Checked answer",
                "investigation": {
                    "id": investigation_id,
                    "title": "Claim review",
                    "overall_label": "mixed",
                },
            }
        ],
    }


def test_list_investigations_only_returns_current_users_reports(monkeypatch):
    collection = FakeConversationsCollection(
        [
            investigation_document(),
            investigation_document("user-2", "report-2"),
        ]
    )
    monkeypatch.setattr(conversations, "conversations_col", collection)

    result = asyncio.run(
        conversations.list_investigations(current_user={"id": "user-1"})
    )

    assert [item["id"] for item in result] == ["report-1"]
    assert collection.last_query["user_id"] == "user-1"


def test_get_investigation_is_scoped_to_current_user(monkeypatch):
    collection = FakeConversationsCollection(
        [investigation_document("user-2", "private-report")]
    )
    monkeypatch.setattr(conversations, "conversations_col", collection)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            conversations.get_investigation(
                "private-report",
                current_user={"id": "user-1"},
            )
        )

    assert error.value.status_code == 404
    assert collection.last_query["user_id"] == "user-1"


def test_get_investigation_returns_saved_answer(monkeypatch):
    collection = FakeConversationsCollection([investigation_document()])
    monkeypatch.setattr(conversations, "conversations_col", collection)

    result = asyncio.run(
        conversations.get_investigation(
            "report-1",
            current_user={"id": "user-1"},
        )
    )

    assert result["conversation_id"] == "conversation-1"
    assert result["answer"] == "Checked answer"
