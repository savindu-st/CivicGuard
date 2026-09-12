import time
import asyncio
import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from PIL import Image
from app.schemas.prediction import (
    HazardPredictionRequest,
    HazardPredictionResponse,
    PhotoScanRequest,
    PhotoScanResponse,
    YoloDetectionItem,
)
from app.services.image_service import ImageService
from app.services.model_service import ModelService
from app.checks.image_check import ImageCheck
from app.checks.location_check import LocationCheck
from app.checks.risk_check import RiskCheck

router = APIRouter(tags=["Prediction"])

@router.post("/predict/hazard", response_model=HazardPredictionResponse)
async def predict_hazard(payload: HazardPredictionRequest) -> HazardPredictionResponse:
    try:
        # 1. Fetch / Decode Image within strict 1500ms SLA
        image, raw_bytes = await ImageService.load_image(payload.photo_url)

        # 2. Concurrently execute Image AI (Gemini 2.5 + background YOLO) and Location AI checks
        image_result, location_result = await asyncio.gather(
            ImageCheck.evaluate(image, payload.incident_type),
            LocationCheck.evaluate(payload.latitude, payload.longitude, raw_bytes),
        )

        # 3. Execute Risk AI evaluation factoring visual depth and road context
        risk_result = await RiskCheck.evaluate(
            image_result=image_result,
            incident_type=payload.incident_type,
            road_type=payload.road_type,
            rainfall_rate_mm_hr=payload.rainfall_rate_mm_hr,
        )

        # 4. Return strictly formatted response matching incident-service contract
        return HazardPredictionResponse(
            image_classification=image_result.classification,
            image_score=image_result.score,
            confidence=image_result.confidence,
            image_reason=image_result.reason,
            location_score=location_result.score,
            location_reason=location_result.reason,
            risk_urgency=risk_result.urgency,
            risk_score=risk_result.score,
            risk_reason=risk_result.reason,
            detected_objects=image_result.detected_objects,
            detections=image_result.detections,
            depth_benchmark=image_result.depth_benchmark,
            verification_engine=image_result.verification_engine,
            background_detector=image_result.background_detector,
            gemini_status=image_result.gemini_status,
        )
    except Exception as e:
        # Failsafe fallback: return formatted fallback response rather than unhandled 500
        return HazardPredictionResponse(
            image_classification="Unverified (Processing Error)",
            image_score=0.50,
            confidence=0.50,
            image_reason=f"AI inference encountered unexpected condition ({str(e)}). Fallback active.",
            location_score=0.85 if (5.8 <= payload.latitude <= 9.9 and 79.5 <= payload.longitude <= 82.0) else 0.35,
            location_reason="Municipal boundary validated via fallback coordinates check",
            risk_urgency="MEDIUM",
            risk_score=0.60,
            risk_reason="Heuristic corridor risk applied due to processing fallback",
            detected_objects=[],
            detections=[],
            depth_benchmark=None,
            verification_engine="heuristic_fallback",
            background_detector="none",
            gemini_status="FALLBACK",
        )

@router.post("/predict/detect", response_model=PhotoScanResponse)
async def detect_hazard_from_url(payload: PhotoScanRequest) -> PhotoScanResponse:
    """
    Multimodal hazard verification endpoint from Base64 Data URI, CDN URL, or local path.
    - Verification verdict, depth benchmark, and confidence are SOLELY based on Gemini 2.5 Flash.
    - Object bounding boxes and geometry are detected by background YOLOv8 for UI display.
    """
    t0 = time.perf_counter()
    image, _ = await ImageService.load_image(payload.photo_url)
    hazard_type = payload.hazard_type or "FLOOD"

    check_result = await ImageCheck.evaluate(image, hazard_type)
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    return PhotoScanResponse(
        status="success",
        overall_confidence=check_result.confidence,
        hazard_classification=check_result.classification,
        image_score=check_result.score,
        depth_benchmark=check_result.depth_benchmark,
        is_spam=check_result.is_spam,
        reason=check_result.reason,
        detected_objects=check_result.detected_objects,
        detections=check_result.detections,
        yolo_model_status="LOADED" if ModelService.is_ready() else "NOT_LOADED",
        verification_engine=check_result.verification_engine,
        background_detector=check_result.background_detector,
        gemini_status=check_result.gemini_status,
        inference_time_ms=elapsed_ms,
    )

@router.post("/predict/scan-upload", response_model=PhotoScanResponse)
async def scan_uploaded_photo(
    photo: UploadFile = File(...),
    hazard_type: Optional[str] = Form("AUTO")
) -> PhotoScanResponse:
    """
    Direct multipart file upload endpoint for Gemini 2.5 multimodal verification
    with background YOLOv8 spatial object telemetry.
    """
    t0 = time.perf_counter()
    try:
        content = await photo.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    check_result = await ImageCheck.evaluate(image, hazard_type or "AUTO")
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

    return PhotoScanResponse(
        status="success",
        overall_confidence=check_result.confidence,
        hazard_classification=check_result.classification,
        image_score=check_result.score,
        depth_benchmark=check_result.depth_benchmark,
        is_spam=check_result.is_spam,
        reason=check_result.reason,
        detected_objects=check_result.detected_objects,
        detections=check_result.detections,
        yolo_model_status="LOADED" if ModelService.is_ready() else "NOT_LOADED",
        verification_engine=check_result.verification_engine,
        background_detector=check_result.background_detector,
        gemini_status=check_result.gemini_status,
        inference_time_ms=elapsed_ms,
    )

