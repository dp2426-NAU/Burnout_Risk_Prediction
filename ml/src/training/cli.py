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
  parser.add_argument('--data', type=Path, help='Path to snapshot JSON file (optional)')
  parser.add_argument('--model-dir', type=Path, default=Path('models'))
  parser.add_argument('--advanced-dir', type=Path, default=Path('models/advanced'))
  parser.add_argument('--data-dir', type=Path, default=Path('data'))
  args = parser.parse_args()

  data_dir = args.data_dir.resolve()
  model_dir = args.model_dir.resolve()
  advanced_dir = args.advanced_dir.resolve()

  config = TrainingConfig(
    data_dir=data_dir,
    model_dir=model_dir,
    advanced_dir=advanced_dir,
  )

  service = BurnoutRiskService(config, auto_load=False)

  if args.data:
    snapshots = load_snapshots(args.data)
    summary = service.train(snapshots)
  else:
    summary = service.train_from_tabular()

  print('Training complete')
  print('Baseline metrics:', summary.get('baseline_metrics'))
  print('Advanced models trained:', summary.get('advanced_trained'))
  print('Confusion matrix:', summary.get('confusion_matrix'))
  print('Classification report:', summary.get('classification_report'))
  if summary.get('eda'):
    print('Label distribution:', summary['eda'].get('label_distribution'))
    print('Top correlations:', summary['eda'].get('top_correlations'))
  if 'eda' in summary:
    print('EDA summary keys:', list(summary['eda'].keys()))
  print('Metrics stored at:', summary.get('metric_file'))


if __name__ == '__main__':
  main()
