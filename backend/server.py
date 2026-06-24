import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import ensure_indexes
from routers import auth as auth_router
from routers import chat as chat_router
from routers import conversations as conversations_router
from routers import health as health_router
from routers import ingest as ingest_router
from routers import speech as speech_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Athena.ai API", version="1.0.0")

origins = (
    ["*"]
    if settings.CORS_ORIGINS.strip() == "*"
    else [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False if origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router.router)
app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(ingest_router.router)
app.include_router(conversations_router.router)
app.include_router(speech_router.router)


@app.on_event("startup")
async def _startup() -> None:
    await ensure_indexes()


@app.get("/")
async def root() -> dict:
    return {"name": "Athena.ai API", "docs": "/docs"}
