import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-service"
    assert "diagnostics" in data
    assert "supported_hazards" in data

def test_predict_hazard_deep_flood_with_exif():
    asset_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "test_assets", "sample_flood_deep.jpg")
    )
    payload = {
        "incident_id": "test-inc-001",
        "incident_type": "FLOOD",
        "latitude": 6.9123,
        "longitude": 79.8654,
        "photo_url": asset_path,
        "road_type": "HIGHWAY",
        "rainfall_rate_mm_hr": 40.0,
    }
    res = client.post("/predict/hazard", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Image AI
    assert "Verified Flood" in data["image_classification"]
    assert data["image_score"] >= 0.85
    assert data["confidence"] >= 0.85

    # Location AI (EXIF matched)
    assert data["location_score"] >= 0.90
    assert "EXIF geotag verified" in data["location_reason"]

    # Risk AI
    assert data["risk_urgency"] in ["HIGH", "CRITICAL"]
    assert data["risk_score"] >= 0.75

def test_predict_hazard_spam_rejection():
    asset_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "test_assets", "sample_spam_meme.jpg")
    )
    payload = {
        "incident_id": "test-inc-spam",
        "incident_type": "FLOOD",
        "latitude": 6.9123,
        "longitude": 79.8654,
        "photo_url": asset_path,
        "road_type": "PRIMARY",
        "rainfall_rate_mm_hr": 0.0,
    }
    res = client.post("/predict/hazard", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Confirms grill-me decision: score 0.10, confidence 0.95, IRRELEVANT_OR_SPAM
    assert data["image_classification"] == "IRRELEVANT_OR_SPAM"
    assert data["image_score"] <= 0.20
    assert data["confidence"] >= 0.90

def test_predict_hazard_mismatched_exif_penalty():
    asset_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "test_assets", "sample_mismatched_exif.jpg")
    )
    payload = {
        "incident_id": "test-inc-spoof",
        "incident_type": "FLOOD",
        "latitude": 6.9123,
        "longitude": 79.8654,
        "photo_url": asset_path,
    }
    res = client.post("/predict/hazard", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Confirms grill-me decision: location penalty 0.20 when EXIF contradicts GPS > 2km
    assert data["location_score"] <= 0.30
    assert "EXIF geotag contradiction" in data["location_reason"]

def test_predict_hazard_no_photo():
    payload = {
        "incident_id": "test-inc-nophoto",
        "incident_type": "FLOOD",
        "latitude": 6.9123,
        "longitude": 79.8654,
        "photo_url": None,
    }
    res = client.post("/predict/hazard", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "No Image" in data["image_classification"]
    assert data["image_score"] == 0.50
    assert data["location_score"] >= 0.80

def test_feedback_lifecycle():
    submission = {
        "incident_id": "test-inc-001",
        "ticket_id": "ticket-101",
        "actual_hazard_type": "FLOOD",
        "officer_action": "CONFIRMED",
        "resolution_photo_url": "https://storage.civicguard.lk/proof1.jpg",
        "notes": "Verified by Sri Lanka Red Cross field crew",
    }
    res = client.post("/feedback", json=submission)
    assert res.status_code == 200
    record = res.json()
    assert record["incident_id"] == "test-inc-001"
    assert record["officer_action"] == "CONFIRMED"

    # Verify metrics
    metrics_res = client.get("/feedback/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_feedback_samples"] >= 1
    assert metrics["confirmed_count"] >= 1
    assert metrics["accuracy_rate"] > 0.0

    # Verify export
    export_res = client.get("/feedback/export")
    assert export_res.status_code == 200
    assert len(export_res.json()) >= 1
