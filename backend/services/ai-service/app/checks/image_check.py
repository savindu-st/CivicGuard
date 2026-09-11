from PIL import Image
from typing import Optional
from app.services.model_service import ModelService
from app.schemas.prediction import ImageCheckResult

class ImageCheck:
    """
    Image AI Verification Module:
    Confirms hazard type, benchmarks water depth, and rejects spam/memes/indoor graphics.
    """

    @classmethod
    async def evaluate(
        cls,
        image: Optional[Image.Image],
        incident_type: str
    ) -> ImageCheckResult:
        analysis = ModelService.analyze_hazard_image(image, incident_type)

        return ImageCheckResult(
            classification=analysis["classification"],
            score=round(analysis["score"], 4),
            confidence=round(analysis["confidence"], 4),
            reason=analysis["reason"],
            detected_objects=analysis.get("detected_objects", []),
            depth_benchmark=analysis.get("depth_benchmark"),
            is_spam=analysis.get("is_spam", False),
        )
