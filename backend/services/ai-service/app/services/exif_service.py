import io
import math
import exifread
from typing import Optional, Tuple, Dict, Any

class ExifService:
    """
    Extracts embedded EXIF GPS tags and capture metadata from raw image bytes.
    Computes spatial distance deltas against reported citizen GPS coordinates.
    """

    @classmethod
    def extract_metadata(cls, raw_bytes: Optional[bytes]) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "has_exif": False,
            "latitude": None,
            "longitude": None,
            "capture_time": None,
            "camera_make": None,
            "camera_model": None,
        }

        if not raw_bytes or len(raw_bytes) < 64:
            return result

        try:
            tags = exifread.process_file(io.BytesIO(raw_bytes), details=False)
            if not tags:
                return result

            result["has_exif"] = True

            # Camera metadata
            if "Image Make" in tags:
                result["camera_make"] = str(tags["Image Make"])
            if "Image Model" in tags:
                result["camera_model"] = str(tags["Image Model"])
            if "EXIF DateTimeOriginal" in tags:
                result["capture_time"] = str(tags["EXIF DateTimeOriginal"])

            # GPS extraction
            lat = cls._extract_coordinate(tags.get("GPS GPSLatitude"), tags.get("GPS GPSLatitudeRef"))
            lon = cls._extract_coordinate(tags.get("GPS GPSLongitude"), tags.get("GPS GPSLongitudeRef"))

            if lat is not None and lon is not None:
                result["latitude"] = lat
                result["longitude"] = lon

        except Exception:
            # Non-blocking: standard images without EXIF or corrupt tags
            pass

        return result

    @classmethod
    def haversine_distance_meters(cls, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculates great-circle distance between two GPS coordinates in meters.
        """
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @classmethod
    def _extract_coordinate(cls, tag_val, ref_val) -> Optional[float]:
        if not tag_val or not ref_val:
            return None

        try:
            values = tag_val.values
            d = float(values[0].num) / float(values[0].den)
            m = float(values[1].num) / float(values[1].den)
            s = float(values[2].num) / float(values[2].den)

            deg = d + (m / 60.0) + (s / 3600.0)
            ref = str(ref_val.values).upper()
            if ref in ["S", "W"]:
                deg = -deg
            return round(deg, 6)
        except Exception:
            return None
