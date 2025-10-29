"""Utilities for collecting employee metadata."""

from .calendar import CalendarCollector
from .email import CommunicationCollector
from .schemas import CalendarEvent, CommunicationRecord, EmployeeSnapshot, TaskRecord

__all__ = [
    "CalendarCollector",
    "CommunicationCollector",
    "CalendarEvent",
    "CommunicationRecord",
    "EmployeeSnapshot",
    "TaskRecord",
]

