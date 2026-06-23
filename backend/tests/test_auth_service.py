"""Unit coverage for JWT auth helpers without a live MongoDB server."""
import asyncio

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from services import auth_service


class FakeUsersCollection:
    def __init__(self, user):
        self.user = user
        self.queries = []

    async def find_one(self, query):
        self.queries.append(query)
        return self.user


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _configure_jwt(monkeypatch):
    monkeypatch.setattr(auth_service.settings, "JWT_SECRET", "unit-test-secret")
    monkeypatch.setattr(auth_service.settings, "JWT_ALGORITHM", "HS256")
    monkeypatch.setattr(auth_service.settings, "JWT_EXPIRES_MINUTES", 30)


def test_create_access_token_can_authenticate_user(monkeypatch):
    _configure_jwt(monkeypatch)
    user = {"id": "user-1", "email": "test@athena.ai", "name": "Test"}
    fake_users = FakeUsersCollection(user)
    monkeypatch.setattr(auth_service, "users_col", fake_users)

    token = auth_service.create_access_token(user["id"], user["email"])
    current_user = asyncio.run(auth_service.get_current_user(_creds(token)))

    assert current_user == user
    assert fake_users.queries == [{"id": "user-1"}]


def test_get_current_user_rejects_missing_credentials():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(auth_service.get_current_user(None))

    assert exc.value.status_code == 401
    assert exc.value.headers == {"WWW-Authenticate": "Bearer"}


def test_get_current_user_rejects_malformed_jwt(monkeypatch):
    _configure_jwt(monkeypatch)
    fake_users = FakeUsersCollection({"id": "user-1"})
    monkeypatch.setattr(auth_service, "users_col", fake_users)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(auth_service.get_current_user(_creds("not-a-jwt")))

    assert exc.value.status_code == 401
    assert fake_users.queries == []


def test_get_current_user_rejects_unknown_user(monkeypatch):
    _configure_jwt(monkeypatch)
    fake_users = FakeUsersCollection(None)
    monkeypatch.setattr(auth_service, "users_col", fake_users)

    token = auth_service.create_access_token("missing-user", "missing@athena.ai")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(auth_service.get_current_user(_creds(token)))

    assert exc.value.status_code == 401
    assert fake_users.queries == [{"id": "missing-user"}]
