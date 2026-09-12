import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.model_service import ModelService
from app.api.routes_health import router as health_router
from app.api.routes_predict import router as predict_router
from app.api.routes_feedback import router as feedback_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Civic Guard AI Service lifespan...")
    # Initialize YOLO model weights in background thread / CPU cache
    ModelService.initialize()
    logger.info(f"AI Service ready. YOLO status: {'LOADED' if ModelService.is_ready() else 'HEURISTIC_FALLBACK'}")
    yield
    logger.info("AI Service shutting down gracefully.")

app = FastAPI(
    title="Civic Guard AI Vision & Risk Service",
    description="Multimodal Computer Vision, Location Authenticity, and Risk Urgency Engine",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health_router)
app.include_router(predict_router)
app.include_router(feedback_router)
