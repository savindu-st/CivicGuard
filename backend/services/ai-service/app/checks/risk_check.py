from typing import Optional
from app.schemas.prediction import ImageCheckResult, RiskCheckResult

class RiskCheck:
    """
    Risk AI Verification Module:
    Computes multi-factor urgency: 45% visual hazard depth + 35% road hierarchy + 20% weather intensity.
    Maps to standardized P1–P4 operational urgency tiers.
    """
    ROAD_WEIGHTS = {
        "HIGHWAY": 1.0,
        "EXPRESSWAY": 1.0,
        "PRIMARY": 0.85,
        "ARTERIAL": 0.85,
        "SECONDARY": 0.60,
        "COLLECTOR": 0.60,
        "RESIDENTIAL": 0.35,
        "LOCAL": 0.35,
    }

    DEPTH_WEIGHTS = {
        "SUBMERGED_VEHICLES": 1.0,
        "BUMPER_LEVEL": 0.85,
        "TIRE_LEVEL": 0.65,
        "SURFACE_PUDDLE": 0.35,
    }

    @classmethod
    async def evaluate(
        cls,
        image_result: ImageCheckResult,
        incident_type: str,
        road_type: Optional[str] = "SECONDARY",
        rainfall_rate_mm_hr: Optional[float] = 0.0
    ) -> RiskCheckResult:
        # 1. Visual hazard severity factor (45%)
        if image_result.is_spam:
            hazard_factor = 0.10
        elif image_result.depth_benchmark and image_result.depth_benchmark in cls.DEPTH_WEIGHTS:
            hazard_factor = cls.DEPTH_WEIGHTS[image_result.depth_benchmark]
        else:
            hazard_factor = image_result.score

        # 2. Road hierarchy factor (35%)
        road_key = (road_type or "SECONDARY").upper()
        road_factor = cls.ROAD_WEIGHTS.get(road_key, 0.50)

        # 3. Weather intensity factor (20%)
        rain = rainfall_rate_mm_hr or 0.0
        if rain >= 50.0:
            weather_factor = 1.0
        elif rain >= 30.0:
            weather_factor = 0.80
        elif rain >= 15.0:
            weather_factor = 0.55
        elif rain > 0.0:
            weather_factor = 0.35
        else:
            weather_factor = 0.20

        # Multi-factor weighted formula
        raw_risk = (0.45 * hazard_factor) + (0.35 * road_factor) + (0.20 * weather_factor)
        risk_score = round(float(raw_risk), 4)

        # Urgency tier classification
        if risk_score >= 0.85:
            urgency = "CRITICAL"
            reason = f"P1 Critical Hazard: Severe corridor disruption on {road_key} route with high environmental exposure"
        elif risk_score >= 0.70:
            urgency = "HIGH"
            reason = f"P2 High Urgency: Substantial transit impairment on {road_key} road segment"
        elif risk_score >= 0.45:
            urgency = "MEDIUM"
            reason = f"P3 Moderate Risk: Localized hazard requiring routine municipal field dispatch"
        else:
            urgency = "LOW"
            reason = "P4 Minor Advisory: Low-impact disturbance passable with caution"

        return RiskCheckResult(
            urgency=urgency,
            score=risk_score,
            confidence=0.90,
            reason=reason,
        )
