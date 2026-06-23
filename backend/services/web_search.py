"""Real-time web search using the Tavily API.

Tavily is purpose-built for LLM applications — it returns pre-processed,
clean text results rather than raw HTML, making it ideal for feeding directly
into Claude alongside RAG chunks.

Free tier: 1,000 searches / month.
Sign up at: https://tavily.com

If TAVILY_API_KEY is not set in .env, all calls return an empty list and
the system falls back gracefully to RAG-only answers.
"""
import logging
from typing import Any

from tavily import AsyncTavilyClient

from config import settings

logger = logging.getLogger(__name__)

# Client is None when key is not configured — callers check before using.
_client: AsyncTavilyClient | None = (
    AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
    if settings.TAVILY_API_KEY
    else None
)

# Domain-specific search depth hints — geopolitics/law need more context.
_DEEP_SEARCH_DOMAINS = {"geopolitics", "law", "environment"}


async def web_search(query: str, vertical: str, max_results: int = 5) -> list[dict[str, Any]]:
    """Search the live web for the query and return structured results.

    Returns a list of dicts, each containing:
        url      : str   — source URL
        title    : str   — page title
        content  : str   — LLM-ready snippet (pre-processed by Tavily)
        score    : float — Tavily relevance score (0–1)
        source   : "web" — marker so the frontend can differentiate from RAG

    Returns [] if TAVILY_API_KEY is not set or if the search fails.
    """
    if _client is None:
        logger.debug("TAVILY_API_KEY not set — skipping web search")
        return []

    search_depth = "advanced" if vertical in _DEEP_SEARCH_DOMAINS else "basic"

    try:
        response = await _client.search(
            query=query,
            search_depth=search_depth,
            max_results=max_results,
            include_answer=False,   # We want Claude to synthesise, not Tavily
            include_raw_content=False,
        )

        results = []
        for r in response.get("results", []):
            content = (r.get("content") or "").strip()
            if not content:
                continue
            results.append({
                "url": r.get("url", ""),
                "title": r.get("title", "Web result"),
                "content": content,
                "score": round(float(r.get("score", 0)), 3),
                "source": "web",
            })

        logger.info("Tavily returned %d results for query=%r vertical=%s", len(results), query[:60], vertical)
        return results

    except Exception as exc:
        logger.warning("Web search failed (non-fatal): %s", exc)
        return []
