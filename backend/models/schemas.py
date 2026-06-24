from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

Vertical = Literal[
    "finance",
    "health",
    "education",
    "technology",
    "geopolitics",
    "law",
    "environment",
    "business",
    "sports",
    "entertainment",
]


# ---------- Auth ----------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    created_at: datetime


# ---------- Chat ----------
class ChatRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    vertical: Optional[Vertical] = None
    conversation_id: Optional[str] = None


class YouTubeChatRequest(ChatRequest):
    youtube_url: str = Field(min_length=10, max_length=500)


class SourceItem(BaseModel):
    id: str
    content: str
    similarity: float
    title: Optional[str] = None


class WebSourceItem(BaseModel):
    title: str
    url: str
    content: str
    score: float = 0.0


class ChatResponse(BaseModel):
    answer: str
    vertical: Vertical
    classified_vertical: Vertical
    sources: list[SourceItem]
    web_sources: list[WebSourceItem] = []
    conversation_id: str


# ---------- Documents ----------
class DocumentOut(BaseModel):
    id: str
    title: str
    vertical: Vertical
    chunks_count: int
    created_at: datetime


class IngestTextRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    vertical: Vertical
    content: str = Field(min_length=20)


# ---------- Conversations ----------
class ConversationOut(BaseModel):
    id: str
    title: str
    vertical: Optional[Vertical] = None
    updated_at: datetime
    messages: list[dict] = []
