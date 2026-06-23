"""Grounded answer generation using Claude Sonnet (Anthropic).

Accepts both RAG chunks (from MongoDB) and real-time web results (from Tavily).
Claude is instructed to clearly distinguish between the two source types and
prefer live web results for time-sensitive facts.
"""
import asyncio
import logging
from typing import Any

import anthropic

from config import settings

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
_async_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
# Fall back to a widely available Sonnet model if the alias isn't enabled
_MODEL_CANDIDATES = ["claude-sonnet-4-5", "claude-3-5-sonnet-latest", "claude-3-5-sonnet-20241022"]

_SYSTEM_PROMPT = """You are Athena, a precise and trustworthy AI assistant specialising in {vertical}.
You have access to two types of information:
  📚 KNOWLEDGE BASE — curated documents uploaded by the user (may not be up to date)
  🌐 LIVE WEB — real-time search results fetched right now

RULES:
1. Answer using BOTH sources when available. Prefer 🌐 LIVE WEB for recent events and facts.
2. If the answer is not in either source, say:
   "I don't have enough information to answer this accurately."
3. After your answer, always list the sources you used:
   - For knowledge base chunks: [KB Source N]: <one-line description>
   - For web results: [Web Source N]: <title> — <url>
4. Be concise and factual. Do NOT invent information not present in the context.
5. If sources conflict, state the conflict explicitly and note which is more recent.

{context}"""


def _build_context(chunks: list[dict], web_results: list[dict]) -> str:
    """Build a single context string from RAG chunks + live web results."""
    parts: list[str] = []

    if chunks:
        parts.append("📚 KNOWLEDGE BASE CHUNKS:")
        for i, c in enumerate(chunks):
            sim = c.get("similarity", 0)
            title = c.get("title") or "document"
            parts.append(
                f"[KB Source {i + 1}] (relevance {sim:.2f}) from \"{title}\":\n{c['content']}"
            )

    if web_results:
        parts.append("\n🌐 LIVE WEB RESULTS (fetched in real-time):")
        for i, r in enumerate(web_results):
            parts.append(
                f"[Web Source {i + 1}] {r.get('title', 'Web result')} ({r.get('url', '')})\n"
                f"{r['content']}"
            )

    if not parts:
        return "No context available."

    return "\n\n".join(parts)


def format_rag_sources(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": c["id"],
            "title": c.get("title"),
            "content": (c["content"][:240] + "…") if len(c["content"]) > 240 else c["content"],
            "similarity": round(float(c.get("similarity", 0)), 3),
        }
        for c in chunks
    ]


def format_web_sources(web_results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "title": r.get("title", "Web result"),
            "url": r.get("url", ""),
            "content": (r["content"][:240] + "…") if len(r["content"]) > 240 else r["content"],
            "score": r.get("score", 0),
        }
        for r in web_results
    ]


def _call_claude_sync(system: str, user: str) -> str:
    last_err: Exception | None = None
    for model in _MODEL_CANDIDATES:
        try:
            resp = _client.messages.create(
                model=model,
                max_tokens=1024,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return resp.content[0].text
        except anthropic.NotFoundError as e:
            last_err = e
            continue
        except Exception as e:
            last_err = e
            break
    raise last_err or RuntimeError("Claude call failed")


async def generate_answer(
    query: str,
    chunks: list[dict[str, Any]],
    vertical: str,
    web_results: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Generate a grounded answer using RAG chunks + optional live web results.

    Args:
        query:       The user's question.
        chunks:      RAG chunks retrieved from MongoDB.
        vertical:    The classified domain (e.g. 'geopolitics').
        web_results: Live web results from Tavily (optional).
    """
    web_results = web_results or []

    if not chunks and not web_results:
        return {
            "answer": (
                "I couldn't find relevant information for this query. "
                "Try uploading related documents or rephrasing your question."
            ),
            "sources": [],
            "web_sources": [],
            "vertical": vertical,
        }

    context_block = _build_context(chunks, web_results)
    system_prompt = _SYSTEM_PROMPT.format(vertical=vertical, context=context_block)

    try:
        answer_text = await asyncio.to_thread(_call_claude_sync, system_prompt, query)
    except Exception as e:
        logger.exception("Claude generation failed")
        answer_text = (
            f"Sorry, I couldn't generate an answer right now. ({type(e).__name__})"
        )

    return {
        "answer": answer_text,
        "sources": format_rag_sources(chunks),
        "web_sources": format_web_sources(web_results),
        "vertical": vertical,
    }


async def stream_answer_text(
    query: str,
    chunks: list[dict[str, Any]],
    vertical: str,
    web_results: list[dict[str, Any]] | None = None,
):
    """Yield Claude text deltas for a grounded answer."""
    web_results = web_results or []

    if not chunks and not web_results:
        yield (
            "I couldn't find relevant information for this query. "
            "Try uploading related documents or rephrasing your question."
        )
        return

    context_block = _build_context(chunks, web_results)
    system_prompt = _SYSTEM_PROMPT.format(vertical=vertical, context=context_block)

    last_err: Exception | None = None
    for model in _MODEL_CANDIDATES:
        try:
            async with _async_client.messages.stream(
                model=model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": query}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
            return
        except anthropic.NotFoundError as e:
            last_err = e
            continue
        except Exception as e:
            logger.exception("Claude streaming failed")
            yield f"Sorry, I couldn't generate an answer right now. ({type(e).__name__})"
            return

    logger.warning("All Claude streaming model candidates failed: %s", last_err)
    yield "Sorry, I couldn't generate an answer right now. (ModelNotFound)"
