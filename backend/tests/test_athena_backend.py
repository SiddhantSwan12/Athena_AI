"""Athena.ai backend integration tests."""
import io
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    "http://localhost:8001"

DEMO_EMAIL = "demo@athena.ai"
DEMO_PASSWORD = "demo1234"

CHAT_TIMEOUT = 60  # Claude can be slow


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def fresh_user(session):
    email = f"test-{int(time.time())}-{uuid.uuid4().hex[:6]}@athena.ai"
    pwd = "TestPass123!"
    r = session.post(f"{BASE_URL}/api/auth/signup",
                     json={"email": email, "password": pwd, "name": "TEST User"},
                     timeout=15)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    return {"email": email, "password": pwd, "token": data["access_token"], "user": data["user"]}


@pytest.fixture(scope="session")
def demo_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login",
                     json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
                     timeout=15)
    if r.status_code != 200:
        pytest.skip(f"demo login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health ----------
class TestHealth:
    def test_health(self, session):
        r = session.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_signup_creates_user(self, fresh_user):
        assert fresh_user["token"]
        assert fresh_user["user"]["email"] == fresh_user["email"]
        assert fresh_user["user"]["id"]

    def test_signup_duplicate_email_400(self, session, fresh_user):
        r = session.post(f"{BASE_URL}/api/auth/signup",
                         json={"email": fresh_user["email"], "password": "anotherPass1", "name": "Dup"},
                         timeout=10)
        assert r.status_code == 400

    def test_login_valid(self, session, fresh_user):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": fresh_user["email"], "password": fresh_user["password"]},
                         timeout=10)
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_invalid_401(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": "notexist@athena.ai", "password": "wrongpw1"},
                         timeout=10)
        assert r.status_code == 401

    def test_me_with_token(self, session, fresh_user):
        r = session.get(f"{BASE_URL}/api/auth/me",
                        headers=auth_headers(fresh_user["token"]), timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == fresh_user["email"]

    def test_me_without_token_401(self, session):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code in (401, 403)


# ---------- Chat / Classification ----------
class TestChat:
    convo_id = None

    def test_chat_finance_classification(self, session, fresh_user):
        r = session.post(f"{BASE_URL}/api/chat",
                         headers=auth_headers(fresh_user["token"]),
                         json={"query": "How do I diversify a stock portfolio?"},
                         timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["classified_vertical"] == "finance", f"got {data['classified_vertical']}"
        assert data["vertical"] == "finance"
        assert data["conversation_id"]
        assert isinstance(data["sources"], list)
        assert data["answer"]
        TestChat.convo_id = data["conversation_id"]

    def test_chat_health_classification(self, session, fresh_user):
        r = session.post(f"{BASE_URL}/api/chat",
                         headers=auth_headers(fresh_user["token"]),
                         json={"query": "What are tips for better sleep?"},
                         timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json()["classified_vertical"] == "health"

    def test_chat_education_classification(self, session, fresh_user):
        r = session.post(f"{BASE_URL}/api/chat",
                         headers=auth_headers(fresh_user["token"]),
                         json={"query": "Explain Newton's three laws of motion"},
                         timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json()["classified_vertical"] == "education"

    def test_chat_vertical_override(self, session, fresh_user):
        # Force finance vertical on a health-ish phrasing
        r = session.post(f"{BASE_URL}/api/chat",
                         headers=auth_headers(fresh_user["token"]),
                         json={"query": "How can I save more money each month?", "vertical": "finance"},
                         timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["vertical"] == "finance"

    def test_chat_append_to_conversation(self, session, fresh_user):
        assert TestChat.convo_id, "previous test must have created convo"
        r = session.post(f"{BASE_URL}/api/chat",
                         headers=auth_headers(fresh_user["token"]),
                         json={"query": "What about index funds?",
                               "conversation_id": TestChat.convo_id},
                         timeout=CHAT_TIMEOUT)
        assert r.status_code == 200, r.text
        assert r.json()["conversation_id"] == TestChat.convo_id

    def test_chat_unauthorized(self, session):
        r = requests.post(f"{BASE_URL}/api/chat", json={"query": "hi"}, timeout=10)
        assert r.status_code in (401, 403)


# ---------- Conversations ----------
class TestConversations:
    def test_list_conversations(self, session, fresh_user):
        r = session.get(f"{BASE_URL}/api/conversations",
                        headers=auth_headers(fresh_user["token"]), timeout=10)
        assert r.status_code == 200
        convos = r.json()
        assert isinstance(convos, list)
        assert len(convos) >= 1
        assert any(c["id"] == TestChat.convo_id for c in convos)

    def test_get_conversation_messages(self, session, fresh_user):
        r = session.get(f"{BASE_URL}/api/conversations/{TestChat.convo_id}",
                        headers=auth_headers(fresh_user["token"]), timeout=10)
        assert r.status_code == 200
        convo = r.json()
        assert convo["id"] == TestChat.convo_id
        assert len(convo["messages"]) >= 4  # 2 chats * 2 messages

    def test_delete_conversation(self, session, fresh_user):
        # Create a new convo to delete
        cr = session.post(f"{BASE_URL}/api/chat",
                          headers=auth_headers(fresh_user["token"]),
                          json={"query": "Briefly, what is compound interest?"},
                          timeout=CHAT_TIMEOUT)
        assert cr.status_code == 200
        cid = cr.json()["conversation_id"]
        d = session.delete(f"{BASE_URL}/api/conversations/{cid}",
                           headers=auth_headers(fresh_user["token"]), timeout=10)
        assert d.status_code == 200
        g = session.get(f"{BASE_URL}/api/conversations/{cid}",
                        headers=auth_headers(fresh_user["token"]), timeout=10)
        assert g.status_code == 404


# ---------- Ingestion ----------
class TestIngestion:
    created_doc_id = None

    def test_ingest_text(self, session, fresh_user):
        payload = {
            "title": "TEST_Doc_Text",
            "vertical": "finance",
            "content": ("Diversification reduces risk by spreading investments across asset "
                        "classes such as stocks, bonds, real estate, and cash equivalents. "
                        "Rebalancing periodically maintains target allocations."),
        }
        r = session.post(f"{BASE_URL}/api/ingest/text",
                         headers=auth_headers(fresh_user["token"]),
                         json=payload, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("document_id")
        assert body.get("chunks_inserted", 0) >= 1
        TestIngestion.created_doc_id = body["document_id"]

    def test_ingest_text_invalid_vertical(self, session, fresh_user):
        payload = {"title": "x", "vertical": "sports",
                   "content": "x" * 50}
        r = session.post(f"{BASE_URL}/api/ingest/text",
                         headers=auth_headers(fresh_user["token"]),
                         json=payload, timeout=15)
        # Pydantic Literal validation -> 422
        assert r.status_code in (400, 422)

    def test_ingest_text_too_short(self, session, fresh_user):
        payload = {"title": "x", "vertical": "finance", "content": "short"}
        r = session.post(f"{BASE_URL}/api/ingest/text",
                         headers=auth_headers(fresh_user["token"]),
                         json=payload, timeout=15)
        assert r.status_code == 422

    def test_ingest_file_txt(self, session, fresh_user):
        # Use a raw requests post for multipart (no Content-Type json)
        text_body = ("Newton's first law: an object in motion stays in motion. "
                     "Newton's second law: F = m * a. Newton's third law: action and reaction.") * 3
        files = {"file": ("newton.txt", io.BytesIO(text_body.encode("utf-8")), "text/plain")}
        data = {"vertical": "education", "title": "TEST_Newton"}
        r = requests.post(f"{BASE_URL}/api/ingest/file",
                          headers={"Authorization": f"Bearer {fresh_user['token']}"},
                          files=files, data=data, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("document_id")
        assert body.get("chunks_inserted", 0) >= 1

    def test_ingest_file_invalid_vertical(self, session, fresh_user):
        files = {"file": ("x.txt", io.BytesIO(b"hello world " * 20), "text/plain")}
        data = {"vertical": "sports", "title": "x"}
        r = requests.post(f"{BASE_URL}/api/ingest/file",
                          headers={"Authorization": f"Bearer {fresh_user['token']}"},
                          files=files, data=data, timeout=15)
        assert r.status_code == 400

    def test_ingest_file_too_small(self, session, fresh_user):
        files = {"file": ("tiny.txt", io.BytesIO(b"tiny"), "text/plain")}
        data = {"vertical": "finance", "title": "tiny"}
        r = requests.post(f"{BASE_URL}/api/ingest/file",
                          headers={"Authorization": f"Bearer {fresh_user['token']}"},
                          files=files, data=data, timeout=15)
        assert r.status_code == 422

    def test_list_documents(self, session, fresh_user):
        r = session.get(f"{BASE_URL}/api/ingest/documents",
                        headers=auth_headers(fresh_user["token"]), timeout=10)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        assert any(d["id"] == TestIngestion.created_doc_id for d in docs)

    def test_delete_document(self, session, fresh_user):
        assert TestIngestion.created_doc_id
        r = session.delete(f"{BASE_URL}/api/ingest/documents/{TestIngestion.created_doc_id}",
                           headers=auth_headers(fresh_user["token"]), timeout=15)
        assert r.status_code == 200
        assert r.json().get("deleted") is True

    def test_delete_document_not_owner_404(self, session, fresh_user):
        # Random doc id should yield 404 for this user
        r = session.delete(f"{BASE_URL}/api/ingest/documents/{uuid.uuid4().hex}",
                           headers=auth_headers(fresh_user["token"]), timeout=10)
        assert r.status_code == 404
