from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FeedbackSubmission(BaseModel):
    incident_id: str = Field(..., description="Target incident UUID")
    ticket_id: Optional[str] = Field(None, description="Associated council ticket ID")
    actual_hazard_type: str = Field(..., description="Ground-truth verified hazard type")
    officer_action: str = Field(..., description="Action taken: CONFIRMED, OVERRIDDEN, FALSE_ALARM, RESOLVED")
    resolution_photo_url: Optional[str] = Field(None, description="Proof-of-resolution photo URL")
    notes: Optional[str] = Field(None, description="Operational notes or crew remarks")

class FeedbackRecord(BaseModel):
    id: str
    incident_id: str
    ticket_id: Optional[str] = None
    actual_hazard_type: str
    officer_action: str
    resolution_photo_url: Optional[str] = None
    notes: Optional[str] = None
    logged_at: datetime

class RetuneMetricsResponse(BaseModel):
    total_feedback_samples: int
    confirmed_count: int
    overridden_count: int
    false_alarm_count: int
    accuracy_rate: float
    model_drift_detected: bool
    recommended_threshold_adjustment: float
