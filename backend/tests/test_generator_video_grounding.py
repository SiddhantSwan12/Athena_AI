from datetime import date
from unittest.mock import MagicMock, patch

import asyncio

from services import generator


def test_video_generation_prompt_makes_verified_verdicts_authoritative():
    response = MagicMock()
    response.content = [MagicMock(text="The claim is contradicted.")]

    with patch.object(
        generator._client.messages,
        "create",
        return_value=response,
    ) as create:
        result = asyncio.run(
            generator.generate_answer(
                "Is the product real?",
                [],
                "technology",
                video_context=(
                    "UNVERIFIED VIDEO OBSERVATIONS\n"
                    "The presenter calls the product fictional.\n\n"
                    "VERIFIED VIDEO CLAIMS\n"
                    "[Fact-check at 00:10] CONTRADICTED (95% confidence): "
                    "Official evidence confirms the product exists."
                ),
            )
        )

    assert result["answer"] == "The claim is contradicted."
    system = create.call_args.kwargs["system"]
    assert f"Current date: {date.today().isoformat()}" in system
    assert "Never reverse, reinterpret, or contradict" in system
    assert "particular physical item shown" in system
    assert "VERIFIED VIDEO CLAIMS" in system
