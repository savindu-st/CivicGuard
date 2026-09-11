from fastapi import APIRouter
from typing import List, Dict, Any
from app.schemas.feedback import FeedbackSubmission, FeedbackRecord, RetuneMetricsResponse
from app.services.feedback_service import FeedbackService

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackRecord)
def submit_feedback(payload: FeedbackSubmission) -> FeedbackRecord:
    return FeedbackService.record_feedback(payload)

@router.get("/metrics", response_model=RetuneMetricsResponse)
def get_metrics() -> RetuneMetricsResponse:
    return FeedbackService.get_metrics()

@router.get("/export", response_model=List[Dict[str, Any]])
def export_feedback() -> List[Dict[str, Any]]:
    return FeedbackService.export_records()
