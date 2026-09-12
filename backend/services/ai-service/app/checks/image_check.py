import asyncio
import logging
from PIL import Image
from typing import Optional, List
from app.services.model_service import ModelService
from app.services.gemini_service import GeminiVisionService
from app.schemas.prediction import ImageCheckResult, YoloDetectionItem

logger = logging.getLogger("ai-service.checks.image")

class ImageCheck:
    """
    Image AI Verification Module:
    - Primary Authority: Gemini 2.5 Flash multimodal verification (classification, confidence, depth benchmark, spam filter).
    - Background Spatial Layer: YOLOv8 nano object detection (bounding boxes & object geometry for UI overlay only).
    - Resilience: Automatic graceful fallback to classical CV heuristics when Gemini is offline or key is a placeholder.
    """

    @classmethod
    async def evaluate(
        cls,
        image: Optional[Image.Image],
        incident_type: str
    ) -> ImageCheckResult:
        if image is None:
            return ImageCheckResult(
                classification="Unverified (No Image)",
                score=0.50,
                confidence=0.60,
                reason="No valid image payload supplied with telemetry",
                detected_objects=[],
                detections=[],
                depth_benchmark=None,
                is_spam=False,
                verification_engine="none",
                background_detector="none",
                gemini_status="INACTIVE",
            )

        # 1. Concurrently launch Gemini 2.5 verification and YOLOv8 background spatial detection
        gemini_task = GeminiVisionService.verify_hazard_image(image, incident_type)
        yolo_task = asyncio.to_thread(ModelService.detect_objects_only, image)

        gemini_result, yolo_result = await asyncio.gather(gemini_task, yolo_task)

        # Convert raw YOLO detections to strictly typed schema
        yolo_detections_list: List[YoloDetectionItem] = [
            YoloDetectionItem(
                class_name=d["class_name"],
                class_id=d["class_id"],
                confidence=d["confidence"],
                box=d["box"],
            )
            for d in yolo_result.get("detections", [])
        ]
        detected_objects: List[str] = yolo_result.get("detected_objects", [])

        # 2. If Gemini 2.5 succeeded, verification is SOLELY derived from Gemini 2.5
        if gemini_result is not None:
            logger.info(
                f"Gemini 2.5 verification complete: {gemini_result.hazard_classification} "
                f"(Score: {gemini_result.image_score:.2f}, Conf: {gemini_result.confidence:.2f})"
            )
            return ImageCheckResult(
                classification=gemini_result.hazard_classification,
                score=round(gemini_result.image_score, 4),
                confidence=round(gemini_result.confidence, 4),
                reason=gemini_result.reason,
                detected_objects=detected_objects,
                detections=yolo_detections_list,
                depth_benchmark=gemini_result.depth_benchmark,
                is_spam=gemini_result.is_spam,
                verification_engine=GeminiVisionService.MODEL_NAME,
                background_detector="yolov8n",
                gemini_status="ACTIVE",
            )

        # 3. Fallback: If Gemini is unavailable / placeholder key, engage classical CV heuristics
        logger.debug("Gemini 2.5 inactive or unconfigured; engaging classical CV heuristic fallback.")
        fallback_analysis = ModelService.analyze_hazard_image(image, incident_type)

        fallback_detections = [
            YoloDetectionItem(
                class_name=d["class_name"],
                class_id=d["class_id"],
                confidence=d["confidence"],
                box=d["box"],
            )
            for d in fallback_analysis.get("detections", [])
        ]

        return ImageCheckResult(
            classification=fallback_analysis["classification"],
            score=round(fallback_analysis["score"], 4),
            confidence=round(fallback_analysis["confidence"], 4),
            reason=fallback_analysis["reason"],
            detected_objects=detected_objects or fallback_analysis.get("detected_objects", []),
            detections=yolo_detections_list or fallback_detections,
            depth_benchmark=fallback_analysis.get("depth_benchmark"),
            is_spam=fallback_analysis.get("is_spam", False),
            verification_engine="heuristic_fallback",
            background_detector="yolov8n",
            gemini_status="FALLBACK",
        )
