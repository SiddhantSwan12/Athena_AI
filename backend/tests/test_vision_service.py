import asyncio
from unittest.mock import MagicMock, patch

import pytest

from services import vision


def test_analyze_image_returns_gemini_observation():
    response = MagicMock()
    response.text = "A chart shows quarterly revenue increasing."

    with patch.object(
        vision._client.models,
        "generate_content",
        return_value=response,
    ) as generate:
        result = asyncio.run(
            vision.analyze_image(b"image-bytes", "image/png", "Explain this chart")
        )

    assert result == "A chart shows quarterly revenue increasing."
    generate.assert_called_once()


def test_analyze_image_falls_back_to_next_model():
    response = MagicMock()
    response.text = "The image contains a labeled circuit diagram."

    with patch.object(
        vision._client.models,
        "generate_content",
        side_effect=[RuntimeError("model unavailable"), response],
    ) as generate:
        result = asyncio.run(
            vision.analyze_image(b"image-bytes", "image/jpeg", "What is shown?")
        )

    assert result == "The image contains a labeled circuit diagram."
    assert generate.call_count == 2


def test_analyze_image_returns_safe_quota_error():
    with patch.object(
        vision._client.models,
        "generate_content",
        side_effect=RuntimeError("429 RESOURCE_EXHAUSTED"),
    ):
        with pytest.raises(vision.VisionAnalysisError) as exc:
            asyncio.run(
                vision.analyze_image(
                    b"image-bytes",
                    "image/png",
                    "What is shown?",
                )
            )

    assert "free-tier limit" in str(exc.value)
