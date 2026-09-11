import asyncio
from fastapi import APIRouter, HTTPException
from app.schemas.prediction import HazardPredictionRequest, HazardPredictionResponse
from app.services.image_service import ImageService
from app.checks.image_check import ImageCheck
from app.checks.location_check import LocationCheck
from app.checks.risk_check import RiskCheck

router = APIRouter(tags=["Prediction"])

@router.post("/predict/hazard", response_model=HazardPredictionResponse)
async def predict_hazard(payload: HazardPredictionRequest) -> HazardPredictionResponse:
    try:
        # 1. Fetch / Decode Image within strict 1500ms SLA
        image, raw_bytes = await ImageService.load_image(payload.photo_url)

        # 2. Concurrently execute Image AI and Location AI checks
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
        )
