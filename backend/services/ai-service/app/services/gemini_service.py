import os
import io
import logging
from typing import Optional, List
from PIL import Image
from pydantic import BaseModel, Field

logger = logging.getLogger("ai-service.gemini")

class GeminiHazardVerification(BaseModel):
    is_valid_hazard: bool = Field(
        ...,
        description="True if the photo contains authentic disaster or municipal road hazard evidence (flood, fallen tree, road damage, landslide)."
    )
    is_spam: bool = Field(
        ...,
        description="True if the photo is a meme, cartoon, indoor screenshot, text graphic, selfie, pet, or irrelevant non-hazard image."
    )
    hazard_classification: str = Field(
        ...,
        description="Authoritative municipal classification. Examples: 'Verified Flood (Submerged Vehicles)', 'Verified Flood (Bumper Level)', 'Verified Flood (Tire Level)', 'Verified Flood (Surface Puddle)', 'Verified Fallen Tree / Road Blockage', 'Verified Road Damage', 'Verified Landslide', 'IRRELEVANT_OR_SPAM', 'Unverified Incident'."
    )
    confidence: float = Field(
        ...,
        description="Statistical visual confidence between 0.0 and 1.0."
    )
    image_score: float = Field(
        ...,
        description="Hazard severity score between 0.0 and 1.0 (0.10 for spam, 0.60 for minor, 0.85-0.95 for severe)."
    )
    depth_benchmark: Optional[str] = Field(
        None,
        description="For flood hazards only: 'SUBMERGED_VEHICLES', 'BUMPER_LEVEL', 'TIRE_LEVEL', 'SURFACE_PUDDLE', or null for other hazards."
    )
    reason: str = Field(
        ...,
        description="Forensic visual justification explaining road obstacles, water level benchmarks, physical damage, or why it was identified as spam/meme."
    )
    detected_hazards: List[str] = Field(
        default_factory=list,
        description="Specific visual disaster markers identified in the image."
    )

class GeminiVisionService:
    """
    Multimodal Computer Vision verification service utilizing Gemini 3.5 Flash-Lite
    as the authoritative hazard judge with strict structured output.
    """
    MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
    _client = None

    @classmethod
    def is_placeholder_key(cls, key: Optional[str]) -> bool:
        if not key:
            return True
        clean_key = key.strip().lower()
        return (
            "your_gemini" in clean_key
            or "placeholder" in clean_key
            or "aizasy_your" in clean_key
            or clean_key == "test"
            or len(clean_key) < 20
        )

    @classmethod
    def is_available(cls) -> bool:
        api_key = os.environ.get("GEMINI_API_KEY")
        return not cls.is_placeholder_key(api_key)

    @classmethod
    def get_client(cls):
        if not cls.is_available():
            return None
        if cls._client is None:
            try:
                from google import genai
                api_key = os.environ.get("GEMINI_API_KEY")
                cls._client = genai.Client(api_key=api_key)
                logger.info(f"Gemini client initialized successfully targeting {cls.MODEL_NAME}.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                cls._client = None
        return cls._client

    @classmethod
    async def verify_hazard_image(
        cls,
        image: Optional[Image.Image],
        reported_hazard: str = "AUTO"
    ) -> Optional[GeminiHazardVerification]:
        """
        Executes multimodal verification with Gemini 2.5 Flash:
        - Evaluates authentic disaster evidence vs spam/memes.
        - Benchmarks flood depth (SUBMERGED_VEHICLES, BUMPER_LEVEL, TIRE_LEVEL, SURFACE_PUDDLE).
        - Produces authoritative hazard classification, confidence, and forensic reasoning.
        Returns None if client is unavailable or an error occurs (engaging fallback).
        """
        if image is None:
            return None

        client = cls.get_client()
        if client is None:
            logger.debug("Gemini 2.5 client unavailable or using placeholder key. Engaging fallback.")
            return None

        try:
            from google.genai import types

            # Convert PIL image to compressed JPEG bytes
            buf = io.BytesIO()
            # Resize if overly large for fast transmission
            img_to_send = image
            if max(image.size) > 1024:
                img_to_send = image.copy()
                img_to_send.thumbnail((1024, 1024))

            img_to_send.convert("RGB").save(buf, format="JPEG", quality=85)
            image_bytes = buf.getvalue()

            image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

            system_instruction = (
                "You are the authoritative Municipal Disaster & Emergency Road Hazard Verifier for Civic Guard. "
                "Carefully inspect the provided image to verify reported road hazards.\n"
                f"Reported hazard context: {reported_hazard.upper()}.\n\n"
                "Tasks:\n"
                "1. SPAM / MEME DETECTION: Flag as is_spam=True if the image is a cartoon, meme, plain background screenshot, "
                "indoor room, selfie, pet photo, or completely irrelevant non-hazard graphic. If spam, set is_valid_hazard=False, "
                "hazard_classification='IRRELEVANT_OR_SPAM', image_score=0.10, and explain in reason.\n"
                "2. HAZARD VERIFICATION: For real incidents, identify whether floodwater, fallen trees, road collapse, or landslides "
                "are blocking the transit corridor.\n"
                "3. FLOOD DEPTH BENCHMARKING: If floodwater is present, strictly benchmark depth to one of:\n"
                "   - 'SUBMERGED_VEHICLES': Water level reaching car windows/roofs, impassable for all vehicles.\n"
                "   - 'BUMPER_LEVEL': Water level reaching car grilles/bumpers (~40-60cm depth).\n"
                "   - 'TIRE_LEVEL': Water covering roadway and reaching wheel rims/tires (~15-30cm depth).\n"
                "   - 'SURFACE_PUDDLE': Shallow surface runoff/puddles without deep roadway submersion.\n"
                "   (For non-flood hazards, set depth_benchmark to null).\n"
                "4. CONFIDENCE & SCORE: Provide statistical confidence (0.0 - 1.0) and severity score (0.0 - 1.0)."
            )

            response = await client.aio.models.generate_content(
                model=cls.MODEL_NAME,
                contents=[
                    image_part,
                    types.Part.from_text(text=system_instruction),
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiHazardVerification,
                    temperature=0.1,
                ),
            )

            # Parse structured output from response
            if hasattr(response, "parsed") and response.parsed:
                return response.parsed
            elif hasattr(response, "text") and response.text:
                return GeminiHazardVerification.model_validate_json(response.text)
            else:
                logger.warning("Gemini 2.5 returned empty response payload. Falling back to classical CV.")
                return None

        except Exception as e:
            logger.warning(f"Gemini 2.5 inference error ({e}). Engaging classical CV fallback.")
            return None
