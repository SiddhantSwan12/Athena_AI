"""Vertical classifier: routes a query into finance / health / education."""
import asyncio
import logging

import google.generativeai as genai

from config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
logger = logging.getLogger(__name__)

_CLASSIFIER_PROMPT = """You are a query router for Athena.ai. Classify the user's query into \
exactly ONE of these three verticals:
- finance   (investments, tax, budgeting, markets, banking, crypto, economics)
- health    (medical, symptoms, fitness, nutrition, mental health, drugs, wellness)
- education (learning, courses, concepts, history, science, math, skills)

Respond with EXACTLY ONE WORD: finance, health, or education. No punctuation, no quotes.

Query: {query}
Vertical:"""

_KEYWORD_FALLBACK = {
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


def _classify_sync(query: str) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash")
    resp = model.generate_content(_CLASSIFIER_PROMPT.format(query=query))
    return (resp.text or "").strip().lower()


async def classify_vertical(query: str) -> str:
    try:
        result = await asyncio.to_thread(_classify_sync, query)
        for v in ("finance", "health", "education"):
            if v in result:
                return v
    except Exception as e:  # pragma: no cover
        logger.warning("Classifier LLM failed, using keyword fallback: %s", e)

    q = query.lower()
    scores = {v: sum(1 for kw in kws if kw in q) for v, kws in _KEYWORD_FALLBACK.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "education"
