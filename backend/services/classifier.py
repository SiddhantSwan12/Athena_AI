"""Vertical classifier: routes a query into finance / health / education.

Uses OpenAI gpt-4o-mini for classification.
  - gpt-4o-mini has very high rate limits and is extremely cheap.
  - Single-word classification does not need a heavy model.
  - Native async client — no asyncio.to_thread() needed.

Embeddings (embedder.py) continue to use Gemini — those vectors are already
stored in MongoDB and switching the embedding model would require re-embedding
every document. Classifier and embedder are intentionally kept independent.
"""
import logging

from openai import AsyncOpenAI

from config import settings

logger = logging.getLogger(__name__)

# Initialise once at import time; the async client is safe to share.
_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

_SYSTEM_INSTRUCTION = (
    "You are a query router for Athena.ai. "
    "Classify the user query into EXACTLY ONE of: finance, health, education. "
    "Respond with ONE WORD only — no punctuation, no explanation."
)

_USER_PROMPT = """Verticals:
- finance   (investments, tax, budgeting, markets, banking, crypto, economics)
- health    (medical, symptoms, fitness, nutrition, mental health, drugs, wellness)
- education (learning, courses, concepts, history, science, math, skills)

Query: {query}
Vertical:"""

# Keyword fallback — used when the LLM call fails or key is not set.
_KEYWORD_FALLBACK: dict[str, list[str]] = {
    "finance": [
        "stock", "invest", "tax", "bank", "market", "budget", "money", "crypto",
        "loan", "fund", "etf", "ipo", "interest", "mortgage", "portfolio", "trading",
    ],
    "health": [
        "symptom", "disease", "doctor", "medicine", "diet", "exercise", "mental",
        "vitamin", "hospital", "drug", "therapy", "nutrition", "sleep", "anxiety",
    ],
    "education": [
        "learn", "study", "course", "university", "concept", "explain", "history",
        "science", "math", "physics", "biology", "chemistry", "theorem", "essay",
    ],
}

_CLASSIFIER_MODEL = "gpt-4o-mini"


async def classify_vertical(query: str) -> str:
    """Classify a user query into one of: finance, health, education.

    Falls back to keyword matching if:
      - OPENAI_API_KEY is not set in .env
      - The OpenAI API call fails for any reason (quota, network, etc.)
    """
    if _client is not None:
        try:
            response = await _client.chat.completions.create(
                model=_CLASSIFIER_MODEL,
                messages=[
                    {"role": "system", "content": _SYSTEM_INSTRUCTION},
                    {"role": "user", "content": _USER_PROMPT.format(query=query)},
                ],
                temperature=0.0,       # deterministic — classification must not vary
                max_tokens=10,         # one word; cap to avoid runaway responses
            )
            result = (response.choices[0].message.content or "").strip().lower()
            for vertical in ("finance", "health", "education"):
                if vertical in result:
                    return vertical
            logger.warning("Classifier returned unexpected output %r — falling back", result)
        except Exception as exc:
            logger.warning("OpenAI classifier failed, using keyword fallback: %s", exc)
    else:
        logger.warning("OPENAI_API_KEY not set — using keyword fallback for classification")

    # Keyword fallback
    q = query.lower()
    scores = {v: sum(1 for kw in kws if kw in q) for v, kws in _KEYWORD_FALLBACK.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "education"

