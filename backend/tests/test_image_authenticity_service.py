import asyncio
import io
import json
from unittest.mock import MagicMock, patch

from PIL import Image

from services import image_authenticity


def _jpeg_bytes_with_exif() -> bytes:
    image = Image.new("RGB", (64, 32), color=(30, 80, 120))
    exif = Image.Exif()
    exif[271] = "Example Camera Co."
    exif[272] = "Model One"
    exif[305] = "Example Editor"
    exif[36867] = "2026:06:25 12:30:00"
    output = io.BytesIO()
    image.save(output, format="JPEG", exif=exif)
    return output.getvalue()


def test_extract_image_metadata_reads_bounded_exif():
    metadata = image_authenticity.extract_image_metadata(
        _jpeg_bytes_with_exif(),
        "image/jpeg",
    )

    assert metadata["format"] == "JPEG"
    assert metadata["width"] == 64
    assert metadata["height"] == 32
    assert metadata["camera_make"] == "Example Camera Co."
    assert metadata["camera_model"] == "Model One"
    assert metadata["software"] == "Example Editor"
    assert metadata["exif_present"] is True


def test_extract_image_metadata_treats_missing_exif_as_inconclusive():
    image = Image.new("RGB", (20, 20), color="white")
    output = io.BytesIO()
    image.save(output, format="PNG")

    metadata = image_authenticity.extract_image_metadata(
        output.getvalue(),
        "image/png",
    )

    assert metadata["metadata_readable"] is True
    assert metadata["exif_present"] is False
    assert any("platforms remove EXIF" in note for note in metadata["notes"])


def test_authenticity_assessment_caps_detector_style_confidence():
    response = MagicMock()
    response.text = json.dumps(
        {
            "label": "likely_ai_generated",
            "confidence": 0.99,
            "summary": "Several localized visual inconsistencies are present.",
            "visual_signals": ["Irregular repeated texture."],
            "provenance_signals": [],
            "source_evidence_urls": [],
            "limitations": ["Compression may create similar artifacts."],
        }
    )
    metadata = {
        "camera_make": None,
        "camera_model": None,
        "captured_at": None,
        "content_credentials_present": False,
    }

    with patch.object(
        image_authenticity._client.models,
        "generate_content",
        return_value=response,
    ):
        result = asyncio.run(
            image_authenticity.assess_image_authenticity(
                b"image-bytes",
                "image/jpeg",
                metadata,
                [],
            )
        )

    assert result["label"] == "likely_ai_generated"
    assert result["confidence"] == 0.82
    assert result["reverse_search_performed"] is False
    assert any("cannot prove" in item for item in result["limitations"])


def test_likely_authentic_requires_positive_provenance_for_high_confidence():
    assessment = {
        "label": "likely_authentic",
        "confidence": 0.94,
        "summary": "Signals are consistent.",
        "visual_signals": [],
        "provenance_signals": [],
        "source_evidence_urls": [],
        "limitations": [],
    }

    result = image_authenticity._calibrate(
        assessment,
        {
            "camera_make": None,
            "camera_model": None,
            "captured_at": None,
            "content_credentials_present": False,
        },
        [],
    )

    assert result["confidence"] == 0.7


def test_likely_authentic_with_metadata_still_has_confidence_cap():
    result = image_authenticity._calibrate(
        {
            "label": "likely_authentic",
            "confidence": 0.99,
            "summary": "Signals are consistent.",
            "visual_signals": [],
            "provenance_signals": [],
            "source_evidence_urls": [],
            "limitations": [],
        },
        {
            "camera_make": "Example",
            "camera_model": "Camera",
            "captured_at": "2026:06:25 12:30:00",
            "content_credentials_present": False,
        },
        [],
    )

    assert result["confidence"] == 0.85


def test_content_credentials_marker_is_not_reported_as_verified():
    result = image_authenticity._calibrate(
        {
            "label": "likely_authentic",
            "confidence": 0.95,
            "summary": "Signals are consistent.",
            "visual_signals": [],
            "provenance_signals": [],
            "source_evidence_urls": [],
            "limitations": [],
        },
        {"content_credentials_present": True},
        [],
    )

    assert result["confidence"] == 0.85
    assert any(
        "not cryptographically verified" in limitation
        for limitation in result["limitations"]
    )


def test_authenticity_context_preserves_calibrated_language():
    context = image_authenticity.format_authenticity_context(
        {
            "label": "possibly_manipulated",
            "confidence": 0.68,
            "summary": "Editing indicators are visible.",
            "visual_signals": ["Lighting changes around one object."],
            "provenance_signals": [],
            "source_matches": [],
            "limitations": ["This is not definitive."],
        }
    )

    assert "Outcome: Possibly Manipulated" in context
    assert "Confidence: 68%" in context
    assert "Do not strengthen" in context


def test_parse_json_accepts_small_model_preamble():
    result = image_authenticity._parse_json(
        'Assessment follows:\\n{"label":"insufficient_evidence",'
        '"confidence":0.2,"summary":"Mixed signals.",'
        '"visual_signals":[],"provenance_signals":[],'
        '"source_evidence_urls":[],"limitations":[]}'
    )

    assert result["label"] == "insufficient_evidence"
    assert result["confidence"] == 0.2


def test_calibration_keeps_only_model_selected_direct_sources():
    direct_url = "https://example.com/original"
    result = image_authenticity._calibrate(
        {
            "label": "insufficient_evidence",
            "confidence": 0.3,
            "summary": "Mixed signals.",
            "visual_signals": [],
            "provenance_signals": [],
            "source_evidence_urls": [direct_url],
            "limitations": [],
        },
        {},
        [
            {
                "title": "Generic methodology",
                "url": "https://example.com/method",
                "content": "How detectors work.",
                "score": 0.9,
            },
            {
                "title": "Original publication",
                "url": direct_url,
                "content": "The original image publication.",
                "score": 0.7,
            },
        ],
    )

    assert [source["url"] for source in result["source_matches"]] == [
        direct_url
    ]


def test_selected_source_results_excludes_generic_search_results():
    selected = image_authenticity.selected_source_results(
        {
            "source_matches": [
                {"url": "https://example.com/original"},
            ]
        },
        [
            {"url": "https://example.com/method"},
            {"url": "https://example.com/original"},
        ],
    )

    assert selected == [{"url": "https://example.com/original"}]


def test_observation_fallback_provides_cautious_useful_judgment():
    response = MagicMock()
    response.content = [
        MagicMock(
            text=json.dumps(
                {
                    "label": "likely_authentic",
                    "confidence": 0.74,
                    "summary": (
                        "The portrait shows several mutually consistent "
                        "photographic details."
                    ),
                    "visual_signals": [
                        "Natural depth of field and consistent glasses reflections."
                    ],
                    "provenance_signals": [],
                    "source_evidence_urls": [],
                    "limitations": ["No original camera file was available."],
                }
            )
        )
    ]

    with patch.object(
        image_authenticity._fallback_client.messages,
        "create",
        return_value=response,
    ):
        result = asyncio.run(
            image_authenticity.assess_authenticity_from_observation(
                (
                    "A professional headshot with natural depth of field, "
                    "fine hair strands, fabric texture, and consistent "
                    "reflections in the glasses."
                ),
                {"content_credentials_present": False},
                [],
            )
        )

    assert result["label"] == "likely_authentic"
    assert result["confidence"] == 0.62
    assert "fallback review" in result["method"]
    assert any(
        "direct pixel-level" in limitation
        for limitation in result["limitations"]
    )
