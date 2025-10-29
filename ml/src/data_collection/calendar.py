"""Calendar metadata ingestion helpers."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Iterable, Iterator, List, Mapping, MutableMapping, Optional

import pandas as pd

from .schemas import CalendarEvent


class CalendarCollector:
    """Factory for turning raw calendar events into structured objects."""

    def __init__(self, events: Iterable[CalendarEvent]):
        self._events: List[CalendarEvent] = list(events)

    def __iter__(self) -> Iterator[CalendarEvent]:
        return iter(self._events)

    def __len__(self) -> int:  # pragma: no cover - trivial
        return len(self._events)

    @property
    def events(self) -> List[CalendarEvent]:
        return list(self._events)

    @classmethod
    def from_records(cls, records: Iterable[Mapping[str, Any]]) -> "CalendarCollector":
        events = [cls._record_to_event(record) for record in records]
        return cls(events)

    @classmethod
    def from_dataframe(cls, df: pd.DataFrame) -> "CalendarCollector":
        return cls.from_records(df.to_dict("records"))

    @classmethod
    def from_json(cls, payload: Iterable[MutableMapping[str, Any]]) -> "CalendarCollector":
        return cls.from_records(payload)

    @staticmethod
    def _record_to_event(record: Mapping[str, Any]) -> CalendarEvent:
        def ensure_datetime(value: Any) -> datetime:
            if isinstance(value, datetime):
                return value
            if isinstance(value, (int, float)):
                return datetime.fromtimestamp(value)
            return datetime.fromisoformat(str(value))

        return CalendarEvent(
            event_id=str(record.get("id") or record.get("event_id") or "unknown"),
            start=ensure_datetime(record.get("start")),
            end=ensure_datetime(record.get("end")),
            attendees=int(record.get("attendees", 1)),
            organizer=record.get("organizer"),
            location=record.get("location"),
            is_virtual=bool(record.get("is_virtual", True)),
            tags=list(record.get("tags", [])),
            metadata={k: v for k, v in record.items() if k not in {"id", "event_id", "start", "end", "attendees", "organizer", "location", "is_virtual", "tags"}},
        )

    def slice_by_date(self, start: datetime, end: datetime) -> "CalendarCollector":
        """Return a new collector filtered to the provided window."""

        filtered = [event for event in self._events if start <= event.start <= end]
        return CalendarCollector(filtered)

    def summarize(self) -> Dict[str, Any]:
        """Summary metrics for quick sanity checks."""

        total_hours = sum(event.duration_hours for event in self._events)
        after_hours = sum(1 for event in self._events if event.is_after_hours)
        return {
            "event_count": len(self._events),
            "total_hours": total_hours,
            "after_hours_ratio": after_hours / len(self._events) if self._events else 0.0,
        }


