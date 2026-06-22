# Athena.ai — Product Requirements (PRD)

## Original problem statement
Build Athena.ai — a production-ready, multi-domain RAG-powered AI assistant for **Finance · Health · Education**. Documents are uploaded, chunked + embedded, and queries are auto-classified into the correct vertical, retrieved by semantic similarity, and answered by an LLM with citations.

## Stack (chosen by user, 2026-01)
- **Frontend**: React 18 (CRA) + Tailwind + shadcn/ui primitives + sonner toasts + lucide-react icons
- **Backend**: FastAPI 0.115 (Python 3.11) on port 8001 via supervisor
- **Database**: MongoDB (motor) — chunks + cosine similarity computed in-process (numpy)
- **LLM (generation)**: Anthropic **Claude Sonnet 4.6** (`claude-sonnet-4-6`) via `anthropic` SDK (user key)
- **LLM (classifier)**: Google **Gemini 2.5 Flash** (`gemini-2.5-flash`)
- **Embeddings**: Google **gemini-embedding-001** (3072 dim)
- **Auth**: JWT (HS256) + bcrypt password hashing (passlib)

## Architecture
```
React (3000) ──HTTPS──▶ FastAPI (8001) ──▶ MongoDB
                              │
                              ├── Anthropic API  (Claude Sonnet 4.6 generation)
                              └── Gemini API     (gemini-2.5-flash classify + embed-001 vectors)
```

## User personas
- **Knowledge worker / researcher** — uploads PDFs, asks domain-specific questions, expects cited answers.
- **Student** — pastes notes / textbook excerpts, asks conceptual questions across STEM and humanities.
- **Finance/health-curious user** — wants grounded answers with traceable sources, not hallucinations.

## Core requirements (static)
1. Auth: signup / login / me with JWT.
2. Per-vertical chat with auto-classification & manual override.
3. Document ingestion: PDF, TXT, MD upload + raw-text paste.
4. Chunked storage with 3072-dim embeddings; cosine-similarity retrieval with threshold + top-k.
5. Grounded generation with at-most top-5 cited chunks per answer.
6. Conversation history (list, open, delete).
7. Document library (list per vertical, delete).
8. Visual: dark navy + glassmorphism, vertical accent colors (Indigo / Emerald / Amber) bleed into chat input + source cards.

## What's been implemented (2026-01-22) — MVP COMPLETE
- ✅ Backend (`/app/backend`): server.py + routers/auth.py + routers/chat.py + routers/ingest.py + routers/conversations.py + routers/health.py + services (auth, classifier, embedder, generator, retriever, ingestion) + JWT bearer middleware.
- ✅ Knowledge base seeded with 6 documents (2 per vertical) via `seed_kb.py`.
- ✅ Frontend (`/app/frontend`): LandingPage, AuthPage (login + signup), ChatPage (suggestions, vertical picker, source citations, thinking indicator, conversation persistence), UploadPage (drag-drop + paste), LibraryPage (grouped per vertical, delete), Sidebar (conversations + user block + logout).
- ✅ Vertical-aware accent colors switch chat input border, source card border-left, suggestion borders, and ThinkingIndicator pulse.
- ✅ data-testid on every interactive element.
- ✅ Tested: backend 25/25 pytest pass; frontend full E2E flows pass (Iteration 1, see `/app/test_reports/iteration_1.json`).
- ✅ Demo user `demo@athena.ai / demo1234` available.

## Prioritized backlog
**P1 (next session)**
- Streaming chat responses (Server-Sent Events) for instant feedback.
- Pydantic `response_model` for ingest POST routes (consistency w/ GET).
- Migrate similarity search to MongoDB Atlas Vector Search when document count grows past ~1k chunks.

**P2 (later)**
- Conversation rename + share link.
- File-type expansion: .docx, .csv, .epub.
- Per-document chunk preview in Library.
- Vertical-specific system-prompt customization (UI).
- React Router v7 future flags to silence console warnings.

## Next action items
- Try a streaming-style chat composer; let users see Claude's tokens as they arrive.
- Add tests for ingest validation edge cases (corrupt PDF, encrypted PDF).
- Optionally introduce Atlas Vector Search if document count grows.
