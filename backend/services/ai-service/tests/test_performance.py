import time
import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_inference_latency_sla():
    asset_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "test_assets", "sample_flood_deep.jpg")
    )
    payload = {
        "incident_id": "perf-test-001",
        "incident_type": "FLOOD",
        "latitude": 6.9123,
        "longitude": 79.8654,
        "photo_url": asset_path,
        "road_type": "PRIMARY",
        "rainfall_rate_mm_hr": 25.0,
    }

    # Warm-up run
    client.post("/predict/hazard", json=payload)

    # Benchmark run
    start = time.perf_counter()
    res = client.post("/predict/hazard", json=payload)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    assert res.status_code == 200
    print(f"\n[PERFORMANCE] End-to-end /predict/hazard latency: {elapsed_ms:.2f} ms")

    # SLA guarantee: Must complete under 1500ms
    assert elapsed_ms < 1500.0, f"Inference took {elapsed_ms:.2f}ms, exceeding 1500ms SLA"
