"""Command-line interface for training burnout risk models."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from ..data_collection.schemas import EmployeeSnapshot
from ..preprocessing.sentiment import SentimentAnalyzer
from ..service import BurnoutRiskService
from .config import TrainingConfig


def load_snapshots(json_path: Path) -> list[EmployeeSnapshot]:
  with json_path.open('r', encoding='utf-8') as file:
    data = json.load(file)

  snapshots = []
  for item in data:
    snapshot = EmployeeSnapshot(
      employee_id=item['employeeId'],
      calendar_events=[],
      communications=[],
      tasks=[],
      label=item.get('label'),
      metadata=item.get('metadata', {}),
    )
    snapshots.append(snapshot)
  return snapshots


def main():
  parser = argparse.ArgumentParser(description='Train burnout risk models')
  parser.add_argument('--data', type=Path, required=True, help='Path to snapshot JSON file')
  parser.add_argument('--model-dir', type=Path, default=Path('models/baseline'))
  parser.add_argument('--advanced-dir', type=Path, default=Path('models/advanced'))
  parser.add_argument('--data-dir', type=Path, default=Path('data'))
  args = parser.parse_args()

  config = TrainingConfig(
    data_dir=args.data_dir,
    model_dir=args.model_dir,
    advanced_dir=args.advanced_dir,
  )

  service = BurnoutRiskService(config, auto_load=False)
  snapshots = load_snapshots(args.data)

  summary = service.train(snapshots)
  print('Training complete')
  print('Baseline metrics:', summary.baseline_metrics)
  print('Advanced models trained:', summary.advanced_trained)
  print('Metrics stored at:', summary.metric_file)


if __name__ == '__main__':
  main()
