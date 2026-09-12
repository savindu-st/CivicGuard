from .routes_health import router as health_router
from .routes_predict import router as predict_router
from .routes_feedback import router as feedback_router

__all__ = [
    "health_router",
    "predict_router",
    "feedback_router",
]
