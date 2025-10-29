"""Data schemas for employee metadata collection."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, time
from typing import Any, Dict, Iterable, List, Optional


@dataclass(slots=True)
class CalendarEvent:
    """Represents a single calendar event for an employee."""

    event_id: str
    start: datetime
    end: datetime
    attendees: int = 1
    organizer: Optional[str] = None
    location: Optional[str] = None
    is_virtual: bool = True
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def duration_hours(self) -> float:
        """Return the duration in hours."""

        duration = (self.end - self.start).total_seconds() / 3600.0
        return max(duration, 0.0)

    @property
    def is_after_hours(self) -> bool:
        """Whether the meeting is outside of typical working hours."""

        workday_start = time(hour=8)
        workday_end = time(hour=18)
        start_time = self.start.time()
        end_time = self.end.time()
        return start_time < workday_start or end_time > workday_end


@dataclass(slots=True)
class CommunicationRecord:
    """Represents an email or chat message."""

    message_id: str
    timestamp: datetime
    sender: str
    recipients: List[str]
    subject: Optional[str]
    body: str
    channel: str = "email"
    sentiment: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class TaskRecord:
    """Represents a task or workload item."""

    task_id: str
    timestamp: datetime
    estimated_hours: float
    completed: bool
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class EmployeeSnapshot:
    """Collection of raw signals for a single observation window."""

    employee_id: str
    calendar_events: Iterable[CalendarEvent]
    communications: Iterable[CommunicationRecord]
    tasks: Iterable[TaskRecord] = field(default_factory=list)
    label: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


