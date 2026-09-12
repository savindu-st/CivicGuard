import pytest
import os
from unittest.mock import patch, AsyncMock
from PIL import Image
from app.services.gemini_service import GeminiVisionService, GeminiHazardVerification
from app.checks.image_check import ImageCheck

def test_gemini_placeholder_detection():
    assert GeminiVisionService.is_placeholder_key("AIzaSy_YOUR_GEMINI_API_KEY_HERE") is True
    assert GeminiVisionService.is_placeholder_key("your_gemini_api_key_here") is True
    assert GeminiVisionService.is_placeholder_key("placeholder_key") is True
    assert GeminiVisionService.is_placeholder_key("") is True
    assert GeminiVisionService.is_placeholder_key(None) is True
    # Valid length key should not be a placeholder
    assert GeminiVisionService.is_placeholder_key("AIzaSyD59a8c2f10928340192840192830") is False

def test_gemini_schema_validation():
    verif = GeminiHazardVerification(
        is_valid_hazard=True,
        is_spam=False,
        hazard_classification="Verified Flood (Bumper Level)",
        confidence=0.94,
        image_score=0.91,
        depth_benchmark="BUMPER_LEVEL",
        reason="Water level measured up to wheel arches and bumper of parked transit van.",
        detected_hazards=["floodwater", "submerged roadway"],
    )
    assert verif.is_valid_hazard is True
    assert verif.is_spam is False
    assert verif.depth_benchmark == "BUMPER_LEVEL"
    assert verif.confidence == 0.94

@pytest.mark.asyncio
async def test_image_check_with_gemini_priority():
    """
    Verifies that when Gemini 2.5 returns a result:
    - Verification metrics (classification, score, confidence, depth) are SOLELY based on Gemini.
    - YOLO results are present in detections for UI display only with zero calculation impact.
    """
    mock_gemini_verif = GeminiHazardVerification(
        is_valid_hazard=True,
        is_spam=False,
        hazard_classification="Verified Flood (Bumper Level - Gemini 2.5)",
        confidence=0.96,
        image_score=0.92,
        depth_benchmark="BUMPER_LEVEL",
        reason="Gemini 2.5 detected 55cm water depth covering urban roadway.",
        detected_hazards=["floodwater"],
    )

    img = Image.new("RGB", (200, 200), color=(100, 80, 50))

    with patch.object(GeminiVisionService, "verify_hazard_image", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = mock_gemini_verif

        result = await ImageCheck.evaluate(img, "FLOOD")

        # Must strictly reflect Gemini 2.5 verdict
        assert result.classification == "Verified Flood (Bumper Level - Gemini 2.5)"
        assert result.confidence == 0.96
        assert result.score == 0.92
        assert result.depth_benchmark == "BUMPER_LEVEL"
        assert result.is_spam is False
        assert result.verification_engine == "gemini-3.5-flash-lite"
        assert result.gemini_status == "ACTIVE"
        assert result.background_detector == "yolov8n"
        # Background detections are still present
        assert isinstance(result.detections, list)

@pytest.mark.asyncio
async def test_image_check_spam_rejection_with_gemini():
    """
    Verifies that when Gemini flags an image as spam:
    - is_spam is True
    - classification is IRRELEVANT_OR_SPAM
    - score is 0.10
    """
    mock_gemini_verif = GeminiHazardVerification(
        is_valid_hazard=False,
        is_spam=True,
        hazard_classification="IRRELEVANT_OR_SPAM",
        confidence=0.99,
        image_score=0.10,
        depth_benchmark=None,
        reason="Image is an indoor meme graphic with overlay text.",
        detected_hazards=[],
    )

    img = Image.new("RGB", (200, 200), color=(255, 100, 200))

    with patch.object(GeminiVisionService, "verify_hazard_image", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = mock_gemini_verif

        result = await ImageCheck.evaluate(img, "FLOOD")

        assert result.is_spam is True
        assert result.classification == "IRRELEVANT_OR_SPAM"
        assert result.score == 0.10
        assert result.confidence == 0.99
        assert result.verification_engine == "gemini-3.5-flash-lite"

@pytest.mark.asyncio
async def test_image_check_fallback_when_gemini_none():
    """
    Verifies that when Gemini returns None (placeholder key or offline):
    - Heuristic fallback takes over smoothly.
    - verification_engine is set to 'heuristic_fallback'.
    - gemini_status is set to 'FALLBACK'.
    """
    img = Image.new("RGB", (200, 200), color=(100, 80, 50))

    with patch.object(GeminiVisionService, "verify_hazard_image", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = None

        result = await ImageCheck.evaluate(img, "FLOOD")

        assert result.verification_engine == "heuristic_fallback"
        assert result.gemini_status == "FALLBACK"
        assert result.score > 0.0
        assert result.confidence > 0.0
