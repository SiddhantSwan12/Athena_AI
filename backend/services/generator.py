"""Grounded answer generation using Claude Sonnet (Anthropic)."""
import asyncio
import logging

import anthropic

from config import settings

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
# Fall back to a widely available Sonnet model if the alias isn't enabled
_MODEL_CANDIDATES = ["claude-sonnet-4-5", "claude-3-5-sonnet-latest", "claude-3-5-sonnet-20241022"]

_SYSTEM_PROMPT = """You are Athena, a precise and trustworthy AI assistant specialising in {vertical}.

RULES:
1. Answer ONLY using the context chunks provided below.
2. If the answer cannot be found in the context, say exactly:
   "I don't have enough information in my knowledge base to answer this accurately."
3. After the answer, list the sources you used in this exact format:
   [Source 1]: <one-line description of what that chunk covers>
   [Source 2]: ...
4. Be concise, factual, and cite specific chunks when making claims.
5. Do NOT invent information that isn't in the context.

CONTEXT:
{context}"""


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


async def generate_answer(query: str, chunks: list[dict], vertical: str) -> dict:
    if not chunks:
        return {
            "answer": (
                "I couldn't find relevant information in the knowledge base for this query. "
                "Try uploading related documents (PDF/TXT) for this vertical, or rephrase your question."
            ),
            "sources": [],
            "vertical": vertical,
        }

    context = "\n\n".join(
        f"[Chunk {i + 1}] (similarity {c.get('similarity', 0):.2f}) "
        f"from \"{c.get('title') or 'document'}\":\n{c['content']}"
        for i, c in enumerate(chunks)
    )
    system_prompt = _SYSTEM_PROMPT.format(vertical=vertical, context=context)

    try:
        answer_text = await asyncio.to_thread(_call_claude_sync, system_prompt, query)
    except Exception as e:
        logger.exception("Claude generation failed")
        answer_text = (
            "Sorry, I couldn't generate an answer right now due to an upstream LLM error. "
            f"({type(e).__name__})"
        )

    sources = [
        {
            "id": c["id"],
            "title": c.get("title"),
            "content": (c["content"][:240] + "…") if len(c["content"]) > 240 else c["content"],
            "similarity": round(float(c.get("similarity", 0)), 3),
        }
        for c in chunks
    ]
    return {"answer": answer_text, "sources": sources, "vertical": vertical}
