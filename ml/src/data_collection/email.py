"""Email and communication metadata ingestion helpers."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Iterable, Iterator, List, Mapping

import pandas as pd

from .schemas import CommunicationRecord


class CommunicationCollector:
    """Transforms raw email/chat data into structured communication records."""

    def __init__(self, communications: Iterable[CommunicationRecord]):
        self._records: List[CommunicationRecord] = list(communications)

    def __iter__(self) -> Iterator[CommunicationRecord]:
        return iter(self._records)

    def __len__(self) -> int:  # pragma: no cover - trivial
        return len(self._records)

    @classmethod
    def from_records(cls, records: Iterable[Mapping[str, Any]]) -> "CommunicationCollector":
        items = [cls._record_to_communication(record) for record in records]
        return cls(items)

    @classmethod
    def from_dataframe(cls, df: pd.DataFrame) -> "CommunicationCollector":
        return cls.from_records(df.to_dict("records"))

    @classmethod
    def from_json(cls, payload: Iterable[Mapping[str, Any]]) -> "CommunicationCollector":
        return cls.from_records(payload)

    @staticmethod
    def _record_to_communication(record: Mapping[str, Any]) -> CommunicationRecord:
        def ensure_datetime(value: Any) -> datetime:
            if isinstance(value, datetime):
                return value
            if isinstance(value, (int, float)):
                return datetime.fromtimestamp(value)
            return datetime.fromisoformat(str(value))

        recipients = record.get("recipients") or record.get("to") or []
        if isinstance(recipients, str):
            recipients = [item.strip() for item in recipients.split(",") if item.strip()]

        return CommunicationRecord(
            message_id=str(record.get("id") or record.get("message_id") or "unknown"),
            timestamp=ensure_datetime(record.get("timestamp")),
            sender=str(record.get("sender", "unknown")),
            recipients=list(recipients),
            subject=record.get("subject"),
            body=str(record.get("body", "")),
            channel=str(record.get("channel", "email")),
            sentiment=record.get("sentiment"),
            metadata={k: v for k, v in record.items() if k not in {"id", "message_id", "timestamp", "sender", "recipients", "to", "subject", "body", "channel", "sentiment"}},
        )

    def summarize(self) -> Dict[str, Any]:
        length = sum(len(record.body.split()) for record in self._records)
        avg_sentiment = (
            sum(record.sentiment for record in self._records if record.sentiment is not None)
            / sum(1 for record in self._records if record.sentiment is not None)
            if self._records
            else 0.0
        )
        return {
            "message_count": len(self._records),
            "avg_tokens": length / len(self._records) if self._records else 0.0,
            "avg_sentiment": avg_sentiment,
        }


