from typing import Optional
from app.services.exif_service import ExifService
from app.schemas.prediction import LocationCheckResult

class LocationCheck:
    """
    Location AI Verification Module:
    Validates territorial geofencing and compares photo EXIF GPS against reported coordinates.
    """
    # Sri Lanka territorial envelope
    MIN_LAT = 5.8
    MAX_LAT = 9.9
    MIN_LON = 79.5
    MAX_LON = 82.0

    @classmethod
    async def evaluate(
        cls,
        latitude: float,
        longitude: float,
        raw_image_bytes: Optional[bytes]
    ) -> LocationCheckResult:
        # 1. Territorial boundary check
        in_bounds = (cls.MIN_LAT <= latitude <= cls.MAX_LAT) and (cls.MIN_LON <= longitude <= cls.MAX_LON)
        if not in_bounds:
            return LocationCheckResult(
                score=0.25,
                confidence=0.95,
                reason=f"Coordinates [{latitude}, {longitude}] fall outside Sri Lankan municipal jurisdiction",
                exif_found=False,
                in_national_bounds=False,
            )

        # 2. EXIF metadata extraction
        exif_data = ExifService.extract_metadata(raw_image_bytes)
        exif_lat = exif_data.get("latitude")
        exif_lon = exif_data.get("longitude")

        # 3. Discrepancy analysis
        if exif_lat is not None and exif_lon is not None:
            delta_m = ExifService.haversine_distance_meters(latitude, longitude, exif_lat, exif_lon)

            if delta_m <= 500.0:
                score = 0.96
                conf = 0.95
                reason = f"EXIF geotag verified: Camera location matches report within {int(delta_m)}m"
            elif delta_m <= 2000.0:
                score = 0.78
                conf = 0.85
                reason = f"EXIF geotag detected with acceptable spatial drift ({int(delta_m)}m from pin)"
            else:
                score = 0.20
                conf = 0.92
                reason = f"EXIF geotag contradiction: Photo was captured {round(delta_m / 1000.0, 1)}km away from claimed incident location"

            return LocationCheckResult(
                score=round(score, 4),
                confidence=round(conf, 4),
                reason=reason,
                exif_found=True,
                exif_lat=exif_lat,
                exif_lon=exif_lon,
                distance_delta_meters=round(delta_m, 1),
                in_national_bounds=True,
            )

        # 4. EXIF stripped baseline (standard for mobile / messaging uploads)
        return LocationCheckResult(
            score=0.85,
            confidence=0.80,
            reason=f"GPS [{latitude:.4f}, {longitude:.4f}] verified within active municipal geofence (EXIF metadata stripped)",
            exif_found=False,
            exif_lat=None,
            exif_lon=None,
            distance_delta_meters=None,
            in_national_bounds=True,
        )
