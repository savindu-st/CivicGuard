import pytest
import os
from PIL import Image
from app.services.exif_service import ExifService
from app.checks.location_check import LocationCheck
from app.checks.risk_check import RiskCheck
from app.schemas.prediction import ImageCheckResult

@pytest.mark.asyncio
async def test_location_check_in_bounds_no_exif():
    result = await LocationCheck.evaluate(latitude=6.9271, longitude=79.8612, raw_image_bytes=None)
    assert result.in_national_bounds is True
    assert result.score == 0.85
    assert result.exif_found is False

@pytest.mark.asyncio
async def test_location_check_out_of_bounds():
    # London coordinates
    result = await LocationCheck.evaluate(latitude=51.5074, longitude=-0.1278, raw_image_bytes=None)
    assert result.in_national_bounds is False
    assert result.score == 0.25

@pytest.mark.asyncio
async def test_location_check_with_matching_exif():
    asset_path = os.path.join(os.path.dirname(__file__), "..", "test_assets", "sample_flood_deep.jpg")
    with open(asset_path, "rb") as f:
        raw_bytes = f.read()

    # Image has Colombo 07 EXIF: 6.9123 N, 79.8654 E
    result = await LocationCheck.evaluate(latitude=6.9125, longitude=79.8655, raw_image_bytes=raw_bytes)
    assert result.in_national_bounds is True
    assert result.exif_found is True
    assert result.score >= 0.95
    assert result.distance_delta_meters is not None
    assert result.distance_delta_meters < 50.0

@pytest.mark.asyncio
async def test_location_check_with_mismatched_exif():
    asset_path = os.path.join(os.path.dirname(__file__), "..", "test_assets", "sample_mismatched_exif.jpg")
    with open(asset_path, "rb") as f:
        raw_bytes = f.read()

    # Claim Colombo GPS while image has London EXIF
    result = await LocationCheck.evaluate(latitude=6.9123, longitude=79.8654, raw_image_bytes=raw_bytes)
    assert result.exif_found is True
    assert result.score <= 0.30
    assert result.distance_delta_meters is not None
    assert result.distance_delta_meters > 10000.0

@pytest.mark.asyncio
async def test_risk_check_critical_flood_on_highway():
    img_res = ImageCheckResult(
        classification="Verified Flood (Submerged Vehicles)",
        score=0.95,
        confidence=0.95,
        reason="Submerged vehicles",
        depth_benchmark="SUBMERGED_VEHICLES",
        is_spam=False,
    )
    risk = await RiskCheck.evaluate(
        image_result=img_res,
        incident_type="FLOOD",
        road_type="HIGHWAY",
        rainfall_rate_mm_hr=45.0
    )
    assert risk.urgency == "CRITICAL"
    assert risk.score >= 0.85

@pytest.mark.asyncio
async def test_risk_check_minor_puddle_on_local_road():
    img_res = ImageCheckResult(
        classification="Verified Flood (Surface Puddle)",
        score=0.60,
        confidence=0.75,
        reason="Minor puddle",
        depth_benchmark="SURFACE_PUDDLE",
        is_spam=False,
    )
    risk = await RiskCheck.evaluate(
        image_result=img_res,
        incident_type="FLOOD",
        road_type="RESIDENTIAL",
        rainfall_rate_mm_hr=5.0
    )
    assert risk.urgency in ["LOW", "MEDIUM"]
    assert risk.score < 0.60

@pytest.mark.asyncio
async def test_risk_check_spam_yields_low_risk():
    img_res = ImageCheckResult(
        classification="IRRELEVANT_OR_SPAM",
        score=0.10,
        confidence=0.95,
        reason="Spam rejected",
        depth_benchmark=None,
        is_spam=True,
    )
    risk = await RiskCheck.evaluate(
        image_result=img_res,
        incident_type="FLOOD",
        road_type="HIGHWAY",
        rainfall_rate_mm_hr=10.0
    )
    assert risk.score < 0.50
