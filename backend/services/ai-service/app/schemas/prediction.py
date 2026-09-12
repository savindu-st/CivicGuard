from pydantic import BaseModel, Field
from typing import Optional, List

class YoloDetectionItem(BaseModel):
    class_name: str
    class_id: int
    confidence: float
    box: List[float] = Field(..., description="Normalized [x1, y1, x2, y2] bounding box coordinates (0.0 - 1.0)")

class HazardPredictionRequest(BaseModel):
    incident_id: str = Field(..., description="Unique incident UUID")
    incident_type: str = Field(..., description="Reported hazard type: FLOOD, FALLEN_TREE, ROAD_DAMAGE, LANDSLIDE")
    latitude: float = Field(..., description="Claimed latitude")
    longitude: float = Field(..., description="Claimed longitude")
    photo_url: Optional[str] = Field(None, description="Public CDN, Supabase Storage, or local asset URL")
    road_type: Optional[str] = Field("SECONDARY", description="Road hierarchy: HIGHWAY, PRIMARY, SECONDARY, RESIDENTIAL")
    rainfall_rate_mm_hr: Optional[float] = Field(0.0, description="Local rainfall gauge intensity in mm/hr")

class ImageCheckResult(BaseModel):
    classification: str
    score: float
    confidence: float
    reason: str
    detected_objects: list[str] = Field(default_factory=list)
    detections: list[YoloDetectionItem] = Field(default_factory=list)
    depth_benchmark: Optional[str] = None
    is_spam: bool = False
    verification_engine: str = "gemini-3.5-flash-lite"
    background_detector: str = "yolov8n"
    gemini_status: str = "ACTIVE"

class LocationCheckResult(BaseModel):
    score: float
    confidence: float
    reason: str
    exif_found: bool = False
    exif_lat: Optional[float] = None
    exif_lon: Optional[float] = None
    distance_delta_meters: Optional[float] = None
    in_national_bounds: bool = True

class RiskCheckResult(BaseModel):
    urgency: str
    score: float
    confidence: float
    reason: str

class HazardPredictionResponse(BaseModel):
    image_classification: str
    image_score: float
    confidence: float
    image_reason: str
    location_score: float
    location_reason: str
    risk_urgency: str
    risk_score: float
    risk_reason: str
    detected_objects: list[str] = Field(default_factory=list)
    detections: list[YoloDetectionItem] = Field(default_factory=list)
    depth_benchmark: Optional[str] = None
    verification_engine: str = "gemini-3.5-flash-lite"
    background_detector: str = "yolov8n"
    gemini_status: str = "ACTIVE"

class PhotoScanRequest(BaseModel):
    photo_url: Optional[str] = Field(None, description="Base64 Data URI or image URL")
    hazard_type: Optional[str] = Field("FLOOD", description="Target hazard category: FLOOD, FALLEN_TREE, ROAD_DAMAGE, LANDSLIDE, AUTO")

class PhotoScanResponse(BaseModel):
    status: str = "success"
    overall_confidence: float
    hazard_classification: str
    image_score: float
    depth_benchmark: Optional[str] = None
    is_spam: bool = False
    reason: str
    detected_objects: list[str] = Field(default_factory=list)
    detections: list[YoloDetectionItem] = Field(default_factory=list)
    yolo_model_status: str = "LOADED"
    verification_engine: str = "gemini-3.5-flash-lite"
    background_detector: str = "yolov8n"
    gemini_status: str = "ACTIVE"
    inference_time_ms: float = 0.0

