import asyncio
import json
from unittest.mock import MagicMock, patch

from services import fact_check


def test_verify_claim_returns_evidence_bounded_verdict(monkeypatch):
    async def fake_chunks(*_args, **_kwargs):
        return [
            {
                "id": "chunk-1",
                "title": "Official report",
                "content": "The measured value was 42.",
                "similarity": 0.91,
            }
        ]

    async def fake_web(*_args, **_kwargs):
        return [
            {
                "title": "Agency data",
                "url": "https://agency.gov/data",
                "content": "The published value is 42.",
                "score": 0.94,
            }
        ]

    monkeypatch.setattr(fact_check, "retrieve_chunks", fake_chunks)
    monkeypatch.setattr(fact_check, "web_search", fake_web)
    response = MagicMock()
    response.content = [
        MagicMock(
            text=json.dumps(
                {
                    "verdict": "supported",
                    "confidence": 0.92,
                    "explanation": "Both sources report the same value.",
                    "evidence_ids": ["kb-1", "web-1"],
                }
            )
        )
    ]

    with patch.object(
        fact_check._client.messages,
        "create",
        return_value=response,
    ):
        result = asyncio.run(
            fact_check.verify_claim(
                {
                    "claim": "The measured value was 42.",
                    "timestamp": "00:15",
                    "timestamp_seconds": 15,
                },
                "technology",
            )
        )

    assert result["verdict"] == "supported"
    assert result["confidence"] == 0.92
    assert len(result["evidence"]) == 2
    assert result["evidence"][0]["quality_score"] >= result["evidence"][1]["quality_score"]
    assert result["independent_sources"] == 2


def test_verdict_without_selected_evidence_becomes_unverified():
    result = fact_check._parse_verdict(
        json.dumps(
            {
                "verdict": "supported",
                "confidence": 0.9,
                "explanation": "Supported.",
                "evidence_ids": [],
            }
        ),
        {"web-1"},
    )

    assert result["verdict"] == "unverified"
    assert result["confidence"] == 0.35


def test_verify_claims_is_bounded_to_five(monkeypatch):
    calls = []

    async def fake_verify(claim, _vertical):
        calls.append(claim["claim"])
        return {"claim": claim["claim"], "verdict": "unverified"}

    monkeypatch.setattr(fact_check, "verify_claim", fake_verify)
    claims = [{"claim": f"claim {index}"} for index in range(8)]

    result = asyncio.run(fact_check.verify_claims(claims, "education"))

    assert len(result) == 5
    assert len(calls) == 5


def test_source_quality_prefers_official_sources():
    official, official_label = fact_check.source_quality(
        kind="web",
        url="https://data.gov/report",
        relevance=0.7,
    )
    social, social_label = fact_check.source_quality(
        kind="web",
        url="https://www.reddit.com/r/news/post",
        relevance=0.95,
    )

    assert official > social
    assert "official" in official_label
    assert "user-generated" in social_label


def test_evidence_payload_sorts_by_quality_then_relevance():
    evidence = fact_check._evidence_payload(
        [],
        [
            {
                "title": "Social repost",
                "url": "https://x.com/example/status/1",
                "content": "A reposted claim.",
                "score": 0.99,
            },
            {
                "title": "Official data",
                "url": "https://agency.gov/data",
                "content": "Primary statistics.",
                "score": 0.7,
            },
        ],
    )

    assert evidence[0]["domain"] == "agency.gov"
    assert evidence[0]["quality_score"] > evidence[1]["quality_score"]


def test_credibility_summary_reports_mixed_alignment():
    summary = fact_check.summarize_video_credibility(
        [
            {"verdict": "supported", "confidence": 0.9},
            {"verdict": "contradicted", "confidence": 0.85},
            {"verdict": "misleading", "confidence": 0.7},
            {"verdict": "unverified", "confidence": 0.2},
        ],
        total_claims=5,
    )

    assert summary["label"] == "Mixed evidence alignment"
    assert summary["alignment_score"] == 45
    assert summary["coverage"] == 0.8
    assert summary["counts"]["unverified"] == 1


def test_credibility_summary_refuses_score_with_little_evidence():
    summary = fact_check.summarize_video_credibility(
        [{"verdict": "unverified", "confidence": 0}],
        total_claims=3,
    )

    assert summary["label"] == "Insufficient evidence"
    assert summary["alignment_score"] is None
