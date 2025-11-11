"""Configuration objects for ML training pipelines."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class TrainingConfig:
    data_dir: Path
    model_dir: Path
    advanced_dir: Path
    holdout_ratio: float = 0.2

    @property
    def baseline_dir(self) -> Path:
        return self.model_dir / "baseline"

    @property
    def bert_dir(self) -> Path:
        return self.advanced_dir / "bert"

    @property
    def lstm_dir(self) -> Path:
        return self.advanced_dir / "lstm"

    @property
    def metrics_dir(self) -> Path:
        return self.model_dir / "metrics"

    @property
    def reports_dir(self) -> Path:
        return self.model_dir / "reports"

    @property
    def eda_report_path(self) -> Path:
        return self.reports_dir / "eda_report.json"


