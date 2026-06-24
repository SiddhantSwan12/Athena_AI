from routers.chat import _matches_image_signature


def test_image_signatures_match_supported_types():
    assert _matches_image_signature(b"\x89PNG\r\n\x1a\nrest", "image/png")
    assert _matches_image_signature(b"\xff\xd8\xffrest", "image/jpeg")
    assert _matches_image_signature(b"RIFFxxxxWEBPrest", "image/webp")
    assert _matches_image_signature(b"\x00\x00\x00\x18ftypheic", "image/heic")
    assert _matches_image_signature(b"\x00\x00\x00\x18ftypmif1", "image/heif")


def test_image_signatures_reject_spoofed_content():
    assert not _matches_image_signature(b"not an image", "image/png")
    assert not _matches_image_signature(b"\x89PNG\r\n\x1a\n", "image/jpeg")
    assert not _matches_image_signature(b"\x00\x00\x00\x18ftypmp42", "image/heic")
