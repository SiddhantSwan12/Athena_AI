import json
from unittest.mock import MagicMock, patch

from services import investigation


def test_detect_investigation_intent_is_selective():
    assert investigation.detect_investigation_intent(
        "Fact-check this claim"
    )[0]
    assert investigation.detect_investigation_intent(
        "Is this image AI-generated?"
    )[0]
    assert not investigation.detect_investigation_intent(
        "Explain compound interest"
    )[0]


def test_extract_claims_is_bounded_and_structured():
    response = MagicMock()
    response.content = [
        MagicMock(
            text=json.dumps(
                {
                    "claims": [
                        {
                            "claim": f"Specific factual claim number {index}.",
                            "timestamp": "00:10",
                            "timestamp_seconds": 10,
                        }
                        for index in range(8)
                    ]
                }
            )
        )
    ]
    with patch.object(
        investigation._client.messages,
        "create",
        return_value=response,
    ):
        claims = investigation._extract_claims_sync("Material")

    assert len(claims) == 5
    assert claims[0]["timestamp_seconds"] == 10


def test_build_investigation_prioritizes_contradicted_claims():
    result = investigation.build_investigation(
        input_type="youtube",
        query="Check this video",
        vertical="technology",
        claims=[
            {
                "claim": "A product does not exist.",
                "verdict": "contradicted",
                "confidence": 0.95,
                "explanation": "Official evidence confirms it exists.",
                "evidence": [
                    {
                        "title": "Official announcement",
                        "url": "https://example.com/official",
                    }
                ],
            }
        ],
    )

    assert result["version"] == 1
    assert result["overall_label"] == "claims_contradicted"
    assert result["confidence"] == 0.95
    assert result["evidence"][0]["url"] == "https://example.com/official"


def test_clean_untrusted_content_removes_control_bytes_and_bounds_size():
    cleaned = investigation.clean_untrusted_content(
        "claim\x00\x01\n" + ("x" * 20_000)
    )

    assert "\x00" not in cleaned
    assert "\x01" not in cleaned
    assert len(cleaned) == investigation._MAX_CONTEXT_CHARS
