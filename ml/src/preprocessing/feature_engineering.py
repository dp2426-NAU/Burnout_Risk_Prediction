"""Feature engineering for burnout risk models."""

from __future__ import annotations

from dataclasses import asdict
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd

from ..data_collection.schemas import CalendarEvent, CommunicationRecord, EmployeeSnapshot, TaskRecord
from .sentiment import SentimentAnalyzer


def _safe_divide(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def compute_meeting_features(events: Iterable[CalendarEvent]) -> Dict[str, float]:
    events_list = list(events)
    total_hours = sum(event.duration_hours for event in events_list)
    after_hours = sum(1 for event in events_list if event.is_after_hours)
    long_meetings = sum(1 for event in events_list if event.duration_hours >= 1.5)

    return {
        "meeting_count": float(len(events_list)),
        "meeting_hours": float(total_hours),
        "meeting_avg_duration": _safe_divide(total_hours, len(events_list)),
        "meeting_after_hours_ratio": _safe_divide(after_hours, len(events_list)),
        "meeting_long_ratio": _safe_divide(long_meetings, len(events_list)),
    }


def compute_communication_features(records: Iterable[CommunicationRecord]) -> Dict[str, float]:
    record_list = list(records)
    if not record_list:
        return {
            "comm_volume": 0.0,
            "comm_avg_tokens": 0.0,
            "comm_negative_ratio": 0.0,
            "comm_positive_ratio": 0.0,
            "comm_sentiment_trend": 0.0,
        }

    token_counts = [len(record.body.split()) for record in record_list]
    sentiments = [record.sentiment or 0.0 for record in record_list]
    negatives = sum(1 for score in sentiments if score <= -0.2)
    positives = sum(1 for score in sentiments if score >= 0.2)

    indices = np.arange(len(sentiments))
    if len(sentiments) > 1 and any(sentiments):
        slope, _ = np.polyfit(indices, sentiments, 1)
    else:
        slope = 0.0

    return {
        "comm_volume": float(len(record_list)),
        "comm_avg_tokens": float(np.mean(token_counts)),
        "comm_negative_ratio": _safe_divide(negatives, len(record_list)),
        "comm_positive_ratio": _safe_divide(positives, len(record_list)),
        "comm_sentiment_trend": float(slope),
    }


def compute_workload_features(tasks: Iterable[TaskRecord]) -> Dict[str, float]:
    task_list = list(tasks)
    if not task_list:
        return {
            "task_count": 0.0,
            "task_completed_ratio": 0.0,
            "task_estimated_hours": 0.0,
            "task_idle_ratio": 0.0,
        }

    completed = sum(1 for task in task_list if task.completed)
    estimated_hours = sum(task.estimated_hours for task in task_list)
    idle = sum(1 for task in task_list if task.estimated_hours == 0)

    return {
        "task_count": float(len(task_list)),
        "task_completed_ratio": _safe_divide(completed, len(task_list)),
        "task_estimated_hours": float(estimated_hours),
        "task_idle_ratio": _safe_divide(idle, len(task_list)),
    }


def compute_feature_dict(
    snapshot: EmployeeSnapshot,
    sentiment_analyzer: Optional[SentimentAnalyzer] = None,
) -> Dict[str, float]:
    """Convert an EmployeeSnapshot into a feature dictionary."""

    communications = list(snapshot.communications)
    if sentiment_analyzer is not None:
        sentiment_analyzer.annotate(communications)

    features = {
        **compute_meeting_features(snapshot.calendar_events),
        **compute_communication_features(communications),
        **compute_workload_features(snapshot.tasks),
    }

    for key, value in snapshot.metadata.items():
        if isinstance(value, (int, float)):
            features[f"meta_{key}"] = float(value)

    return features


def build_feature_matrix(
    snapshots: Iterable[EmployeeSnapshot],
    sentiment_analyzer: Optional[SentimentAnalyzer] = None,
) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
    feature_rows: List[Dict[str, float]] = []
    labels: List[Optional[int]] = []

    analyzer = sentiment_analyzer or SentimentAnalyzer()

    for snapshot in snapshots:
        feature_rows.append(compute_feature_dict(snapshot, analyzer))
        labels.append(snapshot.label)

    feature_frame = pd.DataFrame(feature_rows).fillna(0.0)
    label_series = pd.Series(labels) if any(label is not None for label in labels) else None

    return feature_frame, label_series


