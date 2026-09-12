import time
import os
from fastapi import APIRouter
from app.schemas.health import HealthResponse, ModelDiagnostic
from app.services.model_service import ModelService
from app.services.gemini_service import GeminiVisionService

router = APIRouter(tags=["Health"])

START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
def health_check():
    yolo_ready = ModelService.is_ready()
    gemini_ready = GeminiVisionService.is_available()
    uptime = round(time.time() - START_TIME, 2)

    return HealthResponse(
        status="ok",
        service="ai-service",
        uptime_seconds=uptime,
        models_loaded=yolo_ready or gemini_ready,
        diagnostics=ModelDiagnostic(
            yolo_loaded=yolo_ready,
            weights_path=ModelService.WEIGHTS_PATH,
            inference_device="cpu",
            fallback_available=True,
            gemini_ready=gemini_ready,
            gemini_model=GeminiVisionService.MODEL_NAME,
        ),
        supported_hazards=["FLOOD", "FALLEN_TREE", "ROAD_DAMAGE", "LANDSLIDE"],
    )
