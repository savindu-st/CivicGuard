import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.schemas.feedback import FeedbackSubmission, FeedbackRecord, RetuneMetricsResponse

class FeedbackService:
    """
    Continuous retuning and model drift monitoring ledger.
    Stores ground-truth outcomes to an append-only JSONL file.
    """
    DATA_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    DATA_FILE = os.path.join(DATA_DIR, "feedback_records.jsonl")

    @classmethod
    def _ensure_storage(cls):
        os.makedirs(cls.DATA_DIR, exist_ok=True)
        if not os.path.exists(cls.DATA_FILE):
            with open(cls.DATA_FILE, "w", encoding="utf-8") as f:
                pass

    @classmethod
    def record_feedback(cls, submission: FeedbackSubmission) -> FeedbackRecord:
        cls._ensure_storage()

        record = FeedbackRecord(
            id=str(uuid.uuid4()),
            incident_id=submission.incident_id,
            ticket_id=submission.ticket_id,
            actual_hazard_type=submission.actual_hazard_type,
            officer_action=submission.officer_action.upper(),
            resolution_photo_url=submission.resolution_photo_url,
            notes=submission.notes,
            logged_at=datetime.now(timezone.utc),
        )

        with open(cls.DATA_FILE, "a", encoding="utf-8") as f:
            f.write(record.model_dump_json() + "\n")

        return record

    @classmethod
    def get_metrics(cls) -> RetuneMetricsResponse:
        cls._ensure_storage()

        records: List[Dict[str, Any]] = []
        if os.path.exists(cls.DATA_FILE):
            with open(cls.DATA_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            records.append(json.loads(line))
                        except Exception:
                            continue

        total = len(records)
        if total == 0:
            return RetuneMetricsResponse(
                total_feedback_samples=0,
                confirmed_count=0,
                overridden_count=0,
                false_alarm_count=0,
                accuracy_rate=1.0,
                model_drift_detected=False,
                recommended_threshold_adjustment=0.0,
            )

        confirmed = sum(1 for r in records if r.get("officer_action") in ["CONFIRMED", "RESOLVED"])
        overridden = sum(1 for r in records if r.get("officer_action") == "OVERRIDDEN")
        false_alarms = sum(1 for r in records if r.get("officer_action") == "FALSE_ALARM")

        accuracy = round(float(confirmed) / float(total), 4)
        drift = accuracy < 0.80

        # If false alarms are higher than 15%, suggest tightening confirmation threshold
        adjustment = 0.05 if (false_alarms / total) > 0.15 else 0.0

        return RetuneMetricsResponse(
            total_feedback_samples=total,
            confirmed_count=confirmed,
            overridden_count=overridden,
            false_alarm_count=false_alarms,
            accuracy_rate=accuracy,
            model_drift_detected=drift,
            recommended_threshold_adjustment=adjustment,
        )

    @classmethod
    def export_records(cls) -> List[Dict[str, Any]]:
        cls._ensure_storage()
        records = []
        if os.path.exists(cls.DATA_FILE):
            with open(cls.DATA_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            records.append(json.loads(line))
                        except Exception:
                            continue
        return records
