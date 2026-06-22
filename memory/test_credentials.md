# Athena.ai · Test Credentials

## Demo user (created during build)
- email: `demo@athena.ai`
- password: `demo1234`
- name: Demo User

## Notes
- All routes under `/api/auth/*`, `/api/chat`, `/api/ingest/*`, `/api/conversations/*` require Bearer token (JWT).
- Use `/api/auth/signup` or `/api/auth/login` to obtain a token, then send `Authorization: Bearer <token>`.
- Knowledge base is pre-seeded with 6 documents (2 per vertical: finance, health, education) via `backend/seed_kb.py`. Chunks are searchable by ANY authenticated user (retrieval filters by vertical only, not user_id, so seeded data is globally readable).
