"""FastAPI server exposing burnout risk prediction endpoints."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ..data_collection.schemas import EmployeeSnapshot
from ..service import BurnoutRiskService
from ..training import TrainingConfig


BASE_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

CONFIG = TrainingConfig(
    data_dir=BASE_DIR / "data",
    model_dir=ARTIFACT_DIR / "baseline",
    advanced_dir=ARTIFACT_DIR / "advanced",
)

SERVICE = BurnoutRiskService(CONFIG, auto_load=True)


class CalendarEventPayload(BaseModel):
    id: str = Field(default_factory=lambda: f"event_{datetime.utcnow().timestamp()}")
    start: datetime
    end: datetime
    attendees: Optional[int] = 1
    organizer: Optional[str] = None
    location: Optional[str] = None
    is_virtual: Optional[bool] = True
    tags: List[str] = Field(default_factory=list)


class CommunicationPayload(BaseModel):
    id: str = Field(default_factory=lambda: f"message_{datetime.utcnow().timestamp()}")
    timestamp: datetime
    sender: str
    recipients: List[str] = Field(default_factory=list)
    subject: Optional[str] = None
    body: str
    channel: Optional[str] = "email"


class TaskPayload(BaseModel):
    id: str = Field(default_factory=lambda: f"task_{datetime.utcnow().timestamp()}")
    timestamp: datetime
    estimatedHours: float = Field(default=0.0, ge=0.0)
    completed: bool = False
    metadata: Dict[str, float] = Field(default_factory=dict)


class PredictRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)  # Pydantic V2: allows both field name and alias
    
    user_id: Optional[str] = Field(default=None, alias="userId")
    employeeId: Optional[str] = None
    features: Optional[Dict[str, float]] = None
    calendarEvents: List[CalendarEventPayload] = Field(default_factory=list)
    communications: List[CommunicationPayload] = Field(default_factory=list)
    tasks: List[TaskPayload] = Field(default_factory=list)
    metadata: Dict[str, float] = Field(default_factory=dict)

    def to_service_payload(self) -> Dict[str, object]:
        return {
            "employeeId": self.employeeId or self.user_id or "unknown",
            "features": self.features,
            "calendarEvents": [event.model_dump() for event in self.calendarEvents],
            "communications": [message.model_dump() for message in self.communications],
            "tasks": [task.model_dump() for task in self.tasks],
            "metadata": self.metadata,
        }


class TrainSnapshotPayload(BaseModel):
    employeeId: str
    riskLabel: int
    calendarEvents: List[CalendarEventPayload] = Field(default_factory=list)
    communications: List[CommunicationPayload] = Field(default_factory=list)
    tasks: List[TaskPayload] = Field(default_factory=list)
    metadata: Dict[str, float] = Field(default_factory=dict)

    def to_snapshot(self) -> EmployeeSnapshot:
        payload = PredictRequest(
            employeeId=self.employeeId,
            calendarEvents=self.calendarEvents,
            communications=self.communications,
            tasks=self.tasks,
            metadata=self.metadata,
        ).to_service_payload()
        payload["label"] = self.riskLabel
        return SERVICE._snapshot_from_payload(payload)  # type: ignore[attr-defined]


class TrainRequest(BaseModel):
    snapshots: List[TrainSnapshotPayload]


def create_app() -> FastAPI:
    app = FastAPI(title="Burnout Risk ML Service", version="1.0.0")

    @app.get("/")
    async def root() -> Dict[str, Any]:
        """Root endpoint providing API information."""
        return {
            "service": "Burnout Risk ML Service",
            "version": "1.0.0",
            "endpoints": {
                "health": "GET /health",
                "predict": "POST /predict",
                "train": "POST /train",
                "train_tabular": "POST /train/tabular",
                "metrics": "GET /metrics",
                "eda": "GET /eda"
            }
        }

    @app.get("/health")
    @app.head("/health")
    async def health() -> Dict[str, str]:
        return {"status": "ok"}

    @app.post("/predict")
    async def predict(request: PredictRequest):
        payload = request.to_service_payload()
        try:
            result = SERVICE.predict_from_payload(payload)
            return result
        except Exception as exc:  # pragma: no cover - runtime safeguard
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.post("/train")
    async def train(request: TrainRequest):
        snapshots = [snapshot.to_snapshot() for snapshot in request.snapshots]
        try:
            summary = SERVICE.train(snapshots)
            return summary
        except Exception as exc:  # pragma: no cover - runtime safeguard
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.post("/train/tabular")
    async def train_tabular():
        try:
            summary = SERVICE.train_from_tabular()
            return summary
        except Exception as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get('/metrics')
    async def metrics():
      try:
        return SERVICE.get_metrics()
      except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
      except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    @app.get('/eda')
    async def eda():
      try:
        return SERVICE.get_eda_report()
      except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
      except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return app


app = create_app()


