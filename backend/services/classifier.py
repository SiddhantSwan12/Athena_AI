"""Vertical classifier: routes a query into finance / health / education.

Uses the google-genai SDK (the current, actively maintained SDK).
The deprecated google-generativeai package has been removed.

Model choice: gemini-2.0-flash-lite is used deliberately over gemini-2.5-flash.
  - This is a single-word classification task; 2.5-flash is overkill.
  - 2.0-flash-lite has a much higher free-tier quota and lower latency.
  - Classification is on the hot path of every chat request.
"""
import logging

from google import genai
from google.genai import types

from config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)
logger = logging.getLogger(__name__)

# Single-word classification — concise system instruction keeps tokens low.
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

# Keyword fallback — used when the LLM call fails (quota, network, etc.)
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

# Model used for classification. gemini-2.0-flash-lite is intentional:
# - Lowest cost and highest quota of all available models on this API key.
# - Single-word classification does not need a reasoning-heavy model.
# - Lower latency on every chat request (classification is on the hot path).
_CLASSIFIER_MODEL = "gemini-2.0-flash-lite"


async def classify_vertical(query: str) -> str:
    """Classify a user query into one of: finance, health, education.

    Falls back to keyword matching if the LLM call fails for any reason
    (quota exhausted, network error, unexpected response).
    """
    try:
        response = await _client.aio.models.generate_content(
            model=_CLASSIFIER_MODEL,
            contents=_USER_PROMPT.format(query=query),
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                temperature=0.0,   # deterministic — classification should not be random
                max_output_tokens=10,  # one word; cap tokens to avoid runaway responses
            ),
        )
        result = (response.text or "").strip().lower()
        for vertical in ("finance", "health", "education"):
            if vertical in result:
                return vertical
        logger.warning("Classifier returned unexpected output %r — falling back", result)
    except Exception as exc:
        logger.warning("Classifier LLM failed, using keyword fallback: %s", exc)

    # Keyword fallback
    q = query.lower()
    scores = {v: sum(1 for kw in kws if kw in q) for v, kws in _KEYWORD_FALLBACK.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "education"
