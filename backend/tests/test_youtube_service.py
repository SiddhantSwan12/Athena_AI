import asyncio
import json
from unittest.mock import MagicMock, patch

import pytest

from services import youtube


@pytest.mark.parametrize(
    ("url", "video_id"),
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ?t=20", "dQw4w9WgXcQ"),
        ("https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ],
)
def test_parse_youtube_url_accepts_supported_forms(url, video_id):
    parsed = youtube.parse_youtube_url(url)

    assert parsed["video_id"] == video_id
    assert parsed["url"] == f"https://www.youtube.com/watch?v={video_id}"
    assert parsed["embed_url"] == f"https://www.youtube.com/embed/{video_id}"


def test_parse_youtube_url_rejects_non_youtube_url():
    with pytest.raises(ValueError):
        youtube.parse_youtube_url("https://example.com/watch?v=dQw4w9WgXcQ")


def test_analyze_youtube_video_returns_structured_moments():
    response = MagicMock()
    response.output_text = json.dumps(
        {
            "overview": "A concise video overview.",
            "language": "English",
            "moments": [
                {
                    "timestamp_seconds": 15,
                    "timestamp": "00:15",
                    "label": "Main argument",
                    "observation": "The presenter introduces the central claim.",
                }
            ],
            "claims": [
                {
                    "timestamp_seconds": 15,
                    "timestamp": "00:15",
                    "claim": "The presenter makes a factual claim.",
                }
            ],
        }
    )

    with patch.object(
        youtube._client.interactions,
        "create",
        return_value=response,
    ) as create:
        result = asyncio.run(
            youtube.analyze_youtube_video(
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "Summarize this video",
            )
        )

    assert result["overview"] == "A concise video overview."
    assert result["moments"][0]["timestamp_seconds"] == 15
    request = create.call_args.kwargs
    assert request["input"][0] == {
        "type": "video",
        "uri": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }
