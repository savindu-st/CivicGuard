import io
import os
import base64
import logging
import httpx
from PIL import Image
from typing import Optional, Tuple

logger = logging.getLogger("ai-service.image")

class ImageService:
    """
    Asynchronous image fetching, caching, and validation service.
    Enforces a strict 1500ms network timeout and 5MB size cap.
    """
    MAX_BYTES = 5 * 1024 * 1024  # 5MB
    TIMEOUT_SECONDS = 1.5         # 1500ms SLA

    _cache: dict[str, Tuple[Image.Image, bytes]] = {}
    _cache_limit: int = 100

    @classmethod
    async def load_image(cls, photo_url: Optional[str]) -> Tuple[Optional[Image.Image], Optional[bytes]]:
        if not photo_url or len(photo_url.strip()) < 4:
            return None, None

        url = photo_url.strip()

        # 1. Check in-memory cache
        if url in cls._cache:
            img, raw = cls._cache[url]
            return img.copy(), raw

        # 2. Handle Base64 Data URI
        if url.startswith("data:image"):
            try:
                header, encoded = url.split(",", 1)
                raw = base64.b64decode(encoded)
                if len(raw) > cls.MAX_BYTES:
                    logger.warning("Base64 payload exceeds 5MB size limit")
                    return None, None
                img = Image.open(io.BytesIO(raw)).convert("RGB")
                cls._store_cache(url, img, raw)
                return img, raw
            except Exception as e:
                logger.error(f"Failed to decode base64 image: {e}")
                return None, None

        # 3. Handle Local Files (e.g. test_assets or local paths)
        if not url.startswith("http://") and not url.startswith("https://"):
            local_paths = [
                url,
                os.path.join(os.getcwd(), url),
                os.path.join(os.path.dirname(__file__), "..", "..", url),
                os.path.join("/app", url),
            ]
            for p in local_paths:
                clean_p = os.path.normpath(p)
                if os.path.exists(clean_p) and os.path.isfile(clean_p):
                    try:
                        with open(clean_p, "rb") as f:
                            raw = f.read()
                        if len(raw) > cls.MAX_BYTES:
                            return None, None
                        img = Image.open(io.BytesIO(raw)).convert("RGB")
                        cls._store_cache(url, img, raw)
                        return img, raw
                    except Exception as e:
                        logger.error(f"Failed to open local image file {clean_p}: {e}")
                        return None, None

        # 4. Handle Remote HTTP / HTTPS URL with strict 1500ms timeout
        try:
            async with httpx.AsyncClient(timeout=cls.TIMEOUT_SECONDS, follow_redirects=True) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"Remote image returned HTTP {response.status_code}: {url}")
                    return None, None

                raw = response.content
                if len(raw) > cls.MAX_BYTES:
                    logger.warning(f"Remote image exceeded 5MB cap ({len(raw)} bytes): {url}")
                    return None, None

                img = Image.open(io.BytesIO(raw)).convert("RGB")
                cls._store_cache(url, img, raw)
                return img, raw
        except httpx.TimeoutException:
            logger.warning(f"Image fetch timed out (> 1500ms) for {url}")
            return None, None
        except Exception as e:
            logger.warning(f"Failed to fetch remote image ({e}): {url}")
            return None, None

    @classmethod
    def _store_cache(cls, key: str, img: Image.Image, raw: bytes):
        if len(cls._cache) >= cls._cache_limit:
            # Remove oldest key
            oldest = next(iter(cls._cache))
            del cls._cache[oldest]
        cls._cache[key] = (img, raw)
