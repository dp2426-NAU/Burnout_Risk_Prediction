"""High level service consumed by the NestJS backend."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence

import json
import logging
import joblib
from .data_collection import CalendarCollector, CommunicationCollector, EmployeeSnapshot
from .inference import BurnoutPredictor
from .preprocessing import SentimentAnalyzer
from .training import TrainingConfig, TrainingPipeline
from .training.datasets import TabularDatasetLoader, DatasetSpec, default_dataset_specs
from .training.eda import generate_eda_report, persist_eda_report

logger = logging.getLogger(__name__)


class BurnoutRiskService:
    """Co-ordinates training and inference for burnout risk predictions."""

    def __init__(self, config: TrainingConfig, auto_load: bool = True) -> None:
        self.config = config
        self.sentiment_analyzer = SentimentAnalyzer()
        self._predictor: Optional[BurnoutPredictor] = None
        if auto_load:
            self._try_load_predictor()

    # ------------------------------------------------------------------
    # Training operations
    # ------------------------------------------------------------------
    def train(self, snapshots: Iterable[EmployeeSnapshot]) -> Dict[str, Any]:
        pipeline = TrainingPipeline(self.config, self.sentiment_analyzer)
        summary = pipeline.run(snapshots)
        self._predictor = BurnoutPredictor(
            baseline_dir=self.config.baseline_dir,
            advanced_dir=self.config.advanced_dir,
            sentiment_analyzer=self.sentiment_analyzer,
        )
        return summary.to_dict()

    def train_from_tabular(
        self,
        dataset_specs: Optional[Sequence[DatasetSpec]] = None,
    ) -> Dict[str, Any]:
        base_dir = self.config.data_dir.parent.parent
        specs = list(dataset_specs) if dataset_specs else default_dataset_specs(base_dir)
        if not specs:
            raise RuntimeError("No burnout datasets found under datasets/raw")

        loader = TabularDatasetLoader(specs)
        snapshots, eda_frame = loader.load()

        summary = self.train(snapshots)

        eda_report = generate_eda_report(eda_frame)
        persist_eda_report(eda_report, self.config.eda_report_path)
        self._log_eda_report(eda_report)

        summary["eda"] = eda_report
        summary["trained_samples"] = len(snapshots)
        return summary

    # ------------------------------------------------------------------
    # Prediction operations
    # ------------------------------------------------------------------
    def predict_from_snapshot(self, snapshot: EmployeeSnapshot) -> Dict[str, Any]:
        predictor = self._ensure_predictor()
        prediction = predictor.predict(snapshot)
        return {
            "riskLevel": prediction.risk_level,
            "confidence": prediction.confidence,
            "probabilities": prediction.probabilities,
            "riskScore": prediction.score,
            "features": prediction.feature_vector,
            "recommendations": self._generate_recommendations(prediction),
        }

    def predict_from_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if "features" in payload:
            feature_vector = _transform_feature_payload(payload["features"])
            predictor = self._ensure_predictor()
            prediction = predictor.predict_from_features(feature_vector)
            return {
                "riskLevel": prediction.risk_level,
                "confidence": prediction.confidence,
                "probabilities": prediction.probabilities,
                "riskScore": prediction.score,
                "features": prediction.feature_vector,
                "recommendations": self._generate_recommendations(prediction),
            }

        snapshot = self._snapshot_from_payload(payload)
        return self.predict_from_snapshot(snapshot)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _ensure_predictor(self) -> BurnoutPredictor:
        if self._predictor is None:
            self._try_load_predictor()
        if self._predictor is None:
            raise RuntimeError("Models must be trained or loaded before prediction")
        return self._predictor

    def _try_load_predictor(self) -> None:
        baseline_dir = self.config.baseline_dir
        if baseline_dir.exists():
            self._predictor = BurnoutPredictor(
                baseline_dir=baseline_dir,
                advanced_dir=self.config.advanced_dir,
                sentiment_analyzer=self.sentiment_analyzer,
            )

    def _snapshot_from_payload(self, payload: Dict[str, Any]) -> EmployeeSnapshot:
        calendar = CalendarCollector.from_records(payload.get("calendarEvents", []))
        communications = CommunicationCollector.from_records(payload.get("communications", []))
        tasks_payload = payload.get("tasks", [])
        from .data_collection.schemas import TaskRecord

        task_records: List[TaskRecord] = []
        for item in tasks_payload:
            task_records.append(
                TaskRecord(
                    task_id=str(item.get("taskId", item.get("id", "task"))),
                    timestamp=_ensure_datetime(item.get("timestamp", datetime.utcnow())),
                    estimated_hours=float(item.get("estimatedHours", 0.0)),
                    completed=bool(item.get("completed", False)),
                    metadata={k: v for k, v in item.items() if k not in {"taskId", "id", "timestamp", "estimatedHours", "completed"}},
                )
            )
        label = payload.get("label")
        return EmployeeSnapshot(
            employee_id=str(payload.get("employeeId", "unknown")),
            calendar_events=list(calendar),
            communications=list(communications),
            tasks=task_records,
            label=label,
            metadata=payload.get("metadata", {}),
        )

    def get_metrics(self) -> Dict[str, Any]:
        metrics_file = self.config.metrics_dir / "baseline_metrics.joblib"
        if not metrics_file.exists():
            raise FileNotFoundError("Metrics file not found. Train models first.")
        return joblib.load(metrics_file)

    def get_eda_report(self) -> Dict[str, Any]:
        report_path = self.config.eda_report_path
        if not report_path.exists():
            raise FileNotFoundError("EDA report not available. Run training first.")
        return json.loads(report_path.read_text(encoding="utf-8"))

    def _log_eda_report(self, report: Dict[str, Any]) -> None:
        label_distribution = report.get("label_distribution", {})
        correlations = report.get("top_correlations", {})
        logger.info("EDA label distribution: %s", label_distribution)
        sorted_corr = sorted(correlations.items(), key=lambda item: abs(item[1]), reverse=True)[:5]
        logger.info("Top correlated features: %s", sorted_corr)

    def _generate_recommendations(self, prediction) -> List[Dict[str, Any]]:
        # Simple inline recommendation for features-only payloads
        top_factor = max(prediction.feature_vector.items(), key=lambda item: item[1], default=(None, None))
        if top_factor[0] is None:
            return []
        return [
            {
                "title": f"Focus on {top_factor[0].replace('_', ' ')}",
                "description": "Review this signal to keep your burnout risk under control.",
                "priority": "medium",
                "category": "general",
            }
        ]


def _ensure_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if value is None:
        return datetime.utcnow()
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value)
    return datetime.fromisoformat(str(value))


def _transform_feature_payload(features: Dict[str, Any]) -> Dict[str, float]:
    meeting_count = float(features.get("meetingCount", 0.0))
    meeting_hours = float(features.get("meetingDuration", 0.0))
    meeting_avg_duration = float(features.get("avgEventDuration", 0.0))
    after_hours = float(features.get("lateNightWork", 0.0) + features.get("earlyMorningWork", 0.0) + features.get("weekendWork", 0.0))
    meeting_after_hours_ratio = after_hours / meeting_count if meeting_count else 0.0
    long_ratio = float(features.get("backToBackMeetings", 0.0)) / meeting_count if meeting_count else 0.0

    email_count = float(features.get("emailCount", 0.0))
    avg_email_length = float(features.get("avgEmailLength", 0.0))
    negative_ratio = float(features.get("stressEmailCount", 0.0)) / email_count if email_count else 0.0
    positive_ratio = float(features.get("urgentEmailCount", 0.0)) / email_count if email_count else 0.0

    task_count = float(features.get("totalEvents", 0.0))
    task_completed_ratio = 1.0 - float(features.get("breakTimeRatio", 0.0)) if features.get("breakTimeRatio") is not None else 0.5
    task_estimated_hours = float(features.get("meetingDuration", 0.0))
    task_idle_ratio = float(features.get("focusTimeRatio", 0.0))

    feature_vector = {
        "meeting_count": meeting_count,
        "meeting_hours": meeting_hours,
        "meeting_avg_duration": meeting_avg_duration,
        "meeting_after_hours_ratio": meeting_after_hours_ratio,
        "meeting_long_ratio": long_ratio,
        "comm_volume": email_count,
        "comm_avg_tokens": avg_email_length,
        "comm_negative_ratio": negative_ratio,
        "comm_positive_ratio": positive_ratio,
        "comm_sentiment_trend": 0.0,
        "task_count": task_count,
        "task_completed_ratio": task_completed_ratio,
        "task_estimated_hours": task_estimated_hours,
        "task_idle_ratio": task_idle_ratio,
    }

    # Append original signals as metadata for model enrichment
    for key, value in features.items():
        if isinstance(value, (int, float)):
            feature_vector[f"meta_{key}"] = float(value)

    return feature_vector


