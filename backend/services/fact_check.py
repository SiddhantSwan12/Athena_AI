"""Evidence-bounded claim verification for media analysis."""
import asyncio
import json
import logging
import re
from typing import Any
from urllib.parse import urlparse

import anthropic

from config import settings
from services.retriever import retrieve_chunks
from services.web_search import web_search

logger = logging.getLogger(__name__)

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
_MODEL_CANDIDATES = [
    "claude-sonnet-4-5",
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20241022",
]
_ALLOWED_VERDICTS = {
    "supported",
    "contradicted",
    "misleading",
    "unverified",
}
_MAX_CLAIMS = 5
_PRIMARY_DOMAINS = {
    "who.int",
    "un.org",
    "worldbank.org",
    "imf.org",
    "oecd.org",
    "europa.eu",
}
_LOW_SIGNAL_DOMAINS = {
    "facebook.com",
    "instagram.com",
    "medium.com",
    "pinterest.com",
    "quora.com",
    "reddit.com",
    "tiktok.com",
    "x.com",
    "youtube.com",
}

_SYSTEM_PROMPT = """You verify one factual claim using only the supplied evidence.

Allowed verdicts:
- supported: reliable evidence directly supports the material claim
- contradicted: reliable evidence directly conflicts with the material claim
- misleading: the claim contains some truth but omits context, exaggerates, or creates a materially wrong impression
- unverified: evidence is insufficient, irrelevant, ambiguous, or only repeats the claim

Rules:
1. Do not use prior knowledge.
2. A source repeating the claim is not independent verification.
3. Prefer recent evidence for time-sensitive claims.
4. Prefer higher quality_score evidence and independent domains.
5. Never convert uncertainty into certainty.
6. Confidence measures confidence in the verdict, not probability that the claim is true.
7. Return ONLY JSON:
{
  "verdict": "supported|contradicted|misleading|unverified",
  "confidence": 0.0,
  "explanation": "brief evidence-bounded explanation",
  "evidence_ids": ["web-1", "kb-1"]
}
"""


class FactCheckError(RuntimeError):
    pass


def _domain(url: str) -> str:
    return (urlparse(url).hostname or "").lower().removeprefix("www.")


def source_quality(
    *,
    kind: str,
    url: str | None,
    relevance: float,
) -> tuple[float, str]:
    relevance = max(0.0, min(1.0, relevance))
    if kind == "knowledge_base":
        base = 0.72
        label = "user-provided document"
    else:
        domain = _domain(url or "")
        if domain.endswith(".gov") or domain in _PRIMARY_DOMAINS:
            base = 0.95
            label = "primary or official source"
        elif domain.endswith(".edu"):
            base = 0.88
            label = "academic source"
        elif domain.endswith(".org"):
            base = 0.72
            label = "institutional source"
        elif domain in _LOW_SIGNAL_DOMAINS:
            base = 0.28
            label = "user-generated or secondary platform"
        else:
            base = 0.58
            label = "general web source"

    quality = round(base * 0.72 + relevance * 0.28, 3)
    return quality, label


def _evidence_payload(
    chunks: list[dict[str, Any]],
    web_results: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks):
        relevance = round(float(chunk.get("similarity", 0)), 3)
        quality, quality_label = source_quality(
            kind="knowledge_base",
            url=None,
            relevance=relevance,
        )
        evidence.append(
            {
                "id": f"kb-{index + 1}",
                "kind": "knowledge_base",
                "title": chunk.get("title") or "Uploaded document",
                "url": None,
                "domain": None,
                "content": chunk.get("content", ""),
                "relevance": relevance,
                "quality_score": quality,
                "quality_label": quality_label,
            }
        )
    for index, result in enumerate(web_results):
        relevance = round(float(result.get("score", 0)), 3)
        url = result.get("url") or ""
        quality, quality_label = source_quality(
            kind="web",
            url=url,
            relevance=relevance,
        )
        evidence.append(
            {
                "id": f"web-{index + 1}",
                "kind": "web",
                "title": result.get("title") or "Web result",
                "url": url,
                "domain": _domain(url),
                "content": result.get("content", ""),
                "relevance": relevance,
                "quality_score": quality,
                "quality_label": quality_label,
            }
        )
    return sorted(
        evidence,
        key=lambda item: (item["quality_score"], item["relevance"]),
        reverse=True,
    )


def _parse_verdict(text: str, valid_evidence_ids: set[str]) -> dict[str, Any]:
    clean = text.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\s*", "", clean, flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$", "", clean)
    try:
        payload = json.loads(clean)
    except json.JSONDecodeError as exc:
        raise FactCheckError("Verifier returned invalid JSON") from exc

    verdict = str(payload.get("verdict") or "").lower()
    if verdict not in _ALLOWED_VERDICTS:
        verdict = "unverified"
    try:
        confidence = max(0.0, min(1.0, float(payload.get("confidence", 0))))
    except (TypeError, ValueError):
        confidence = 0.0
    evidence_ids = [
        evidence_id
        for evidence_id in payload.get("evidence_ids") or []
        if evidence_id in valid_evidence_ids
    ]
    if not evidence_ids and verdict != "unverified":
        verdict = "unverified"
        confidence = min(confidence, 0.35)

    return {
        "verdict": verdict,
        "confidence": round(confidence, 2),
        "explanation": str(payload.get("explanation") or "").strip()
        or "The available evidence was insufficient for a reliable verdict.",
        "evidence_ids": evidence_ids,
    }


def _verify_sync(claim: str, evidence: list[dict[str, Any]]) -> dict[str, Any]:
    if not evidence:
        return {
            "verdict": "unverified",
            "confidence": 0.0,
            "explanation": "No independent evidence was available for this claim.",
            "evidence_ids": [],
        }

    prompt = (
        f"CLAIM:\n{claim}\n\n"
        f"EVIDENCE:\n{json.dumps(evidence, ensure_ascii=True)}"
    )
    last_error: Exception | None = None
    for model in _MODEL_CANDIDATES:
        try:
            response = _client.messages.create(
                model=model,
                max_tokens=500,
                temperature=0,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            return _parse_verdict(
                response.content[0].text,
                {item["id"] for item in evidence},
            )
        except anthropic.NotFoundError as exc:
            last_error = exc
            continue
        except Exception as exc:
            last_error = exc
            break
    raise FactCheckError("Claim verification is temporarily unavailable") from last_error


async def verify_claim(
    claim: dict[str, Any],
    vertical: str,
) -> dict[str, Any]:
    claim_text = str(claim.get("claim") or "").strip()
    if not claim_text:
        raise FactCheckError("Claim text is missing")

    chunks, web_results = await asyncio.gather(
        retrieve_chunks(claim_text, vertical, top_k=3, threshold=0.45),
        web_search(claim_text, vertical, max_results=4),
    )
    evidence = _evidence_payload(chunks, web_results)
    verdict = await asyncio.to_thread(_verify_sync, claim_text, evidence)
    selected_ids = set(verdict["evidence_ids"])
    selected_evidence = [
        item for item in evidence if item["id"] in selected_ids
    ]
    independent_domains = {
        item["domain"] or item["id"] for item in selected_evidence
    }
    evidence_quality = (
        round(
            sum(item["quality_score"] for item in selected_evidence)
            / len(selected_evidence),
            2,
        )
        if selected_evidence
        else 0.0
    )
    return {
        "id": f"claim-{claim.get('timestamp_seconds', 0)}",
        "claim": claim_text,
        "timestamp": claim.get("timestamp") or "00:00",
        "timestamp_seconds": max(
            0,
            float(claim.get("timestamp_seconds") or 0),
        ),
        **verdict,
        "evidence": selected_evidence,
        "evidence_quality": evidence_quality,
        "independent_sources": len(independent_domains),
    }


async def verify_claims(
    claims: list[dict[str, Any]],
    vertical: str,
) -> list[dict[str, Any]]:
    bounded = claims[:_MAX_CLAIMS]
    if not bounded:
        return []
    results = await asyncio.gather(
        *(verify_claim(claim, vertical) for claim in bounded),
        return_exceptions=True,
    )
    verified: list[dict[str, Any]] = []
    for claim, result in zip(bounded, results):
        if isinstance(result, Exception):
            logger.warning("Claim verification failed: %s", result)
            verified.append(
                {
                    "id": f"claim-{claim.get('timestamp_seconds', 0)}",
                    "claim": str(claim.get("claim") or ""),
                    "timestamp": claim.get("timestamp") or "00:00",
                    "timestamp_seconds": max(
                        0,
                        float(claim.get("timestamp_seconds") or 0),
                    ),
                    "verdict": "unverified",
                    "confidence": 0.0,
                    "explanation": (
                        "Athena could not gather enough independent evidence "
                        "to verify this claim."
                    ),
                    "evidence_ids": [],
                    "evidence": [],
                    "evidence_quality": 0.0,
                    "independent_sources": 0,
                }
            )
        else:
            verified.append(result)
    return verified


def summarize_video_credibility(
    fact_checks: list[dict[str, Any]],
    total_claims: int,
) -> dict[str, Any]:
    counts = {verdict: 0 for verdict in _ALLOWED_VERDICTS}
    for check in fact_checks:
        verdict = check.get("verdict", "unverified")
        counts[verdict if verdict in counts else "unverified"] += 1

    assessed = (
        counts["supported"]
        + counts["contradicted"]
        + counts["misleading"]
    )
    checked = len(fact_checks)
    coverage = round(checked / max(1, total_claims), 2)
    average_confidence = (
        round(
            sum(float(check.get("confidence", 0)) for check in fact_checks)
            / checked,
            2,
        )
        if checked
        else 0.0
    )

    if assessed < 2:
        label = "Insufficient evidence"
        alignment_score = None
        summary = (
            "Too few claims had enough independent evidence for a reliable "
            "whole-video assessment."
        )
    else:
        alignment_score = round(
            (
                counts["supported"]
                + counts["misleading"] * 0.35
            )
            / assessed
            * 100
        )
        if alignment_score >= 75:
            label = "High evidence alignment"
            summary = (
                "Most assessed claims aligned with the available evidence, "
                "though individual caveats still matter."
            )
        elif alignment_score >= 40:
            label = "Mixed evidence alignment"
            summary = (
                "The assessed claims had mixed support, contradiction, or "
                "missing context."
            )
        else:
            label = "Low evidence alignment"
            summary = (
                "Most assessed claims conflicted with evidence or omitted "
                "material context."
            )

    return {
        "label": label,
        "alignment_score": alignment_score,
        "summary": summary,
        "counts": counts,
        "checked_claims": checked,
        "total_claims": total_claims,
        "coverage": coverage,
        "average_confidence": average_confidence,
        "disclaimer": (
            "This is an evidence-alignment summary, not proof that the video "
            "or its creator is trustworthy."
        ),
    }
