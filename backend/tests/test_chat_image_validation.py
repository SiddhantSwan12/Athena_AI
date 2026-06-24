from routers.chat import _matches_audio_signature, _matches_image_signature


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


def test_audio_signatures_match_supported_types():
    assert _matches_audio_signature(b"ID3audio", "audio/mpeg")
    assert _matches_audio_signature(b"\xff\xf3audio", "audio/mp3")
    assert _matches_audio_signature(b"RIFFxxxxWAVEaudio", "audio/wav")
    assert _matches_audio_signature(b"\x00\x00\x00\x18ftypM4A ", "audio/x-m4a")
    assert _matches_audio_signature(b"\x1a\x45\xdf\xa3audio", "audio/webm")
    assert _matches_audio_signature(b"OggSaudio", "audio/ogg")


def test_audio_signatures_reject_spoofed_content():
    assert not _matches_audio_signature(b"not audio", "audio/mpeg")
    assert not _matches_audio_signature(b"RIFFxxxxAVI audio", "audio/wav")
    assert not _matches_audio_signature(b"OggSaudio", "audio/webm")
