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
    "Classify the user query into EXACTLY ONE of: "
    "finance, health, education, technology, geopolitics, law, environment, business, sports, entertainment. "
    "Respond with ONE WORD only — no punctuation, no explanation."
)

_USER_PROMPT = """Domains:
- finance      (investments, tax, budgeting, banking, markets, crypto, economics, stock, funds)
- health       (medicine, symptoms, disease, fitness, nutrition, mental health, drugs, therapy, wellness)
- education    (learning, courses, science, math, history, concepts, exams, university, skills)
- technology   (AI, software, hardware, cybersecurity, programming, gadgets, internet, robotics, cloud)
- geopolitics  (war, diplomacy, sanctions, elections, international relations, treaties, conflict, NATO, UN)
- law          (legislation, court, rights, contracts, criminal, compliance, regulations, lawsuit, attorney)
- environment  (climate change, sustainability, pollution, biodiversity, energy, emissions, ecology, deforestation)
- business     (startups, entrepreneurship, strategy, marketing, supply chain, merger, acquisition, revenue)
- sports       (game, athlete, tournament, championship, team, score, Olympics, league, match)
- entertainment (movie, music, celebrity, award, pop culture, TV show, streaming, gaming, concert)

Query: {query}
Domain:"""

# Keyword fallback — used when the LLM call fails or key is not set.
# Keywords are intentionally distinct per domain to minimise cross-domain matches.
_KEYWORD_FALLBACK: dict[str, list[str]] = {
    "finance": [
        "stock", "invest", "tax", "bank", "market", "budget", "money", "crypto",
        "loan", "fund", "etf", "ipo", "interest", "mortgage", "portfolio", "trading",
        "dividend", "bond", "forex", "inflation", "gdp", "recession",
    ],
    "health": [
        "symptom", "disease", "doctor", "medicine", "diet", "exercise", "mental",
        "vitamin", "hospital", "drug", "therapy", "nutrition", "sleep", "anxiety",
        "cancer", "diabetes", "vaccine", "surgery", "prescription", "pandemic",
    ],
    "education": [
        "learn", "study", "course", "university", "concept", "explain", "history",
        "science", "math", "physics", "biology", "chemistry", "theorem", "essay",
        "exam", "degree", "school", "lecture", "curriculum", "scholarship",
    ],
    "technology": [
        "ai", "software", "hardware", "code", "programming", "cyber", "hack",
        "algorithm", "machine learning", "neural", "cloud", "blockchain", "robot",
        "app", "startup tech", "gpu", "processor", "database", "api", "devops",
    ],
    "geopolitics": [
        "war", "conflict", "sanction", "treaty", "diplomat", "nato", "un", "election",
        "president", "government", "military", "invasion", "ceasefire", "refugee",
        "foreign policy", "geopolit", "alliance", "coup", "protest", "sovereignty",
    ],
    "law": [
        "law", "legal", "court", "judge", "lawyer", "attorney", "lawsuit", "rights",
        "constitution", "verdict", "regulation", "compliance", "contract", "crime",
        "arrest", "legislation", "statute", "tribunal", "appeal", "jury",
    ],
    "environment": [
        "climate", "carbon", "emission", "pollution", "renewable", "solar", "wind",
        "biodiversity", "deforestation", "ocean", "plastic", "recycle", "ecology",
        "glacier", "drought", "flood", "species", "conservation", "greenhouse",
    ],
    "business": [
        "startup", "entrepreneur", "revenue", "profit", "marketing", "brand", "ceo",
        "acquisition", "merger", "supply chain", "b2b", "saas", "venture", "pitch",
        "product launch", "customer", "sales", "strategy", "franchise", "business model",
    ],
    "sports": [
        "sport", "game", "team", "player", "match", "tournament", "champion", "score",
        "athlete", "olympic", "league", "fifa", "nba", "cricket", "football", "tennis",
        "coach", "stadium", "transfer", "goal", "wicket", "race",
    ],
    "entertainment": [
        "movie", "film", "music", "album", "celebrity", "actor", "singer", "award",
        "netflix", "streaming", "concert", "tv show", "gaming", "trailer", "box office",
        "oscars", "grammy", "pop culture", "series", "episode", "director",
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
            for vertical in (
                "finance", "health", "education",
                "technology", "geopolitics", "law",
                "environment", "business", "sports", "entertainment",
            ):
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

