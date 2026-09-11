from pydantic import BaseModel
from typing import List, Optional

class ModelDiagnostic(BaseModel):
    yolo_loaded: bool
    weights_path: str
    inference_device: str
    fallback_available: bool

class HealthResponse(BaseModel):
    status: str
    service: str
    uptime_seconds: float
    models_loaded: bool
    diagnostics: ModelDiagnostic
    supported_hazards: List[str]
