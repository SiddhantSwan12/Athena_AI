"""Evidence-bounded claim verification for media analysis."""
import asyncio
import json
import logging
import re
from datetime import date, datetime, timezone
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
_ENTITY_OFFICIAL_DOMAINS = {
    "apple": {"apple.com"},
    "iphone": {"apple.com"},
    "ipad": {"apple.com"},
    "macbook": {"apple.com"},
    "m5": {"apple.com"},
    "microsoft": {"microsoft.com"},
    "windows": {"microsoft.com"},
    "openai": {"openai.com"},
    "chatgpt": {"openai.com"},
    "google": {"google.com", "blog.google"},
    "gemini": {"google.com", "blog.google"},
    "youtube": {"youtube.com", "blog.youtube"},
    "meta": {"about.fb.com", "meta.com"},
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

Current date: {current_date}

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
5. For present-tense claims about whether something exists, is available, or has
   been released, judge the claim against current status on the date above.
6. A newer first-party announcement overrides older speculation or reporting.
7. Never convert uncertainty into certainty.
8. Confidence measures confidence in the verdict, not probability that the claim is true.
9. Return ONLY JSON:
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


def _domain_matches(domain: str, candidates: set[str]) -> bool:
    return any(
        domain == candidate or domain.endswith(f".{candidate}")
        for candidate in candidates
    )


def official_domains_for_claim(claim: str) -> set[str]:
    lowered = claim.lower()
    domains: set[str] = set()
    for keyword, candidates in _ENTITY_OFFICIAL_DOMAINS.items():
        if re.search(rf"\b{re.escape(keyword)}\b", lowered):
            domains.update(candidates)
    return domains


def is_time_sensitive_claim(claim: str) -> bool:
    return bool(
        re.search(
            r"\b("
            r"exist(?:s|ed)?|release[ds]?|available|availability|launched?|"
            r"announced?|current(?:ly)?|latest|today|now|has not|hasn't|"
            r"not yet|ceo|president"
            r")\b",
            claim,
            flags=re.IGNORECASE,
        )
    )


def official_search_query(claim: str, current_date: str) -> str:
    neutral = re.sub(
        r"\b(?:does not|do not|did not|has not|have not|had not|"
        r"is not|are not|was not|were not|doesn't|don't|didn't|"
        r"hasn't|haven't|hadn't|isn't|aren't|wasn't|weren't|not)\b",
        " ",
        claim,
        flags=re.IGNORECASE,
    )
    neutral = re.sub(r"[^\w\s-]", " ", neutral)
    neutral = re.sub(r"\s+", " ", neutral).strip()
    return (
        f"{neutral} official announcement release availability "
        f"as of {current_date}"
    )


def _freshness_score(published_date: str | None) -> float:
    if not published_date:
        return 0.55
    try:
        published = datetime.fromisoformat(
            published_date.replace("Z", "+00:00")
        )
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        age_days = max(
            0,
            (datetime.now(timezone.utc) - published).days,
        )
    except (TypeError, ValueError):
        return 0.55
    if age_days <= 90:
        return 1.0
    if age_days <= 365:
        return 0.85
    if age_days <= 730:
        return 0.55
    return 0.2


def source_quality(
    *,
    kind: str,
    url: str | None,
    relevance: float,
    official_domains: set[str] | None = None,
    published_date: str | None = None,
    time_sensitive: bool = False,
) -> tuple[float, str]:
    relevance = max(0.0, min(1.0, relevance))
    if kind == "knowledge_base":
        base = 0.72
        label = "user-provided document"
    else:
        domain = _domain(url or "")
        if official_domains and _domain_matches(domain, official_domains):
            base = 0.99
            label = "first-party official source"
        elif domain.endswith(".gov") or domain in _PRIMARY_DOMAINS:
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

    freshness = _freshness_score(published_date) if time_sensitive else 0.7
    quality = round(
        base * 0.64 + relevance * 0.22 + freshness * 0.14,
        3,
    )
    return quality, label


def _evidence_payload(
    chunks: list[dict[str, Any]],
    web_results: list[dict[str, Any]],
    *,
    official_domains: set[str] | None = None,
    time_sensitive: bool = False,
) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks):
        relevance = round(float(chunk.get("similarity", 0)), 3)
        quality, quality_label = source_quality(
            kind="knowledge_base",
            url=None,
            relevance=relevance,
            official_domains=official_domains,
            time_sensitive=time_sensitive,
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
            official_domains=official_domains,
            published_date=result.get("published_date"),
            time_sensitive=time_sensitive,
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
                "published_date": result.get("published_date"),
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
                system=_SYSTEM_PROMPT.replace(
                    "{current_date}",
                    date.today().isoformat(),
                ),
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

    temporal = is_time_sensitive_claim(claim_text)
    official_domains = official_domains_for_claim(claim_text)
    today = date.today().strftime("%B %d, %Y")
    evidence_query = claim_text
    if temporal:
        evidence_query = (
            f"{claim_text} current status as of {today} "
            "official announcement availability release"
        )

    search_tasks = [
        web_search(
            evidence_query,
            vertical,
            max_results=6,
            topic="news" if temporal else None,
            time_range="year" if temporal else None,
        )
    ]
    if official_domains:
        search_tasks.append(
            web_search(
                official_search_query(claim_text, today),
                vertical,
                max_results=4,
                include_domains=sorted(official_domains),
            )
        )

    chunks, *web_batches = await asyncio.gather(
        retrieve_chunks(claim_text, vertical, top_k=3, threshold=0.45),
        *search_tasks,
    )
    seen_urls: set[str] = set()
    web_results: list[dict[str, Any]] = []
    for batch in web_batches:
        for result in batch:
            url = result.get("url") or ""
            normalized_url = url.rstrip("/")
            if normalized_url and normalized_url in seen_urls:
                continue
            if normalized_url:
                seen_urls.add(normalized_url)
            web_results.append(result)
    evidence = _evidence_payload(
        chunks,
        web_results,
        official_domains=official_domains,
        time_sensitive=temporal,
    )
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
