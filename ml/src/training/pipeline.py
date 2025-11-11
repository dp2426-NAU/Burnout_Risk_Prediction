"""High-level training pipeline coordinating feature generation and models."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, roc_auc_score

from ..data_collection.schemas import EmployeeSnapshot
from ..models import BaselineModelSuite, BertTextClassifier, LSTMSentimentClassifier
from ..preprocessing import SentimentAnalyzer, build_feature_matrix
from .config import TrainingConfig


@dataclass
class TrainingSummary:
  baseline_metrics: Dict[str, Dict[str, float]]
  advanced_trained: bool
  confusion_matrix: Dict[str, Dict[str, int]]
  classification_report: Dict[str, Dict[str, float]]
  metric_file: Optional[Path]

  def to_dict(self) -> Dict[str, Any]:
    return {
      "baseline_metrics": self.baseline_metrics,
      "advanced_trained": self.advanced_trained,
      "confusion_matrix": self.confusion_matrix,
      "classification_report": self.classification_report,
      "metric_file": str(self.metric_file) if self.metric_file else None,
    }


class TrainingPipeline:
  def __init__(self, config: TrainingConfig, sentiment_analyzer: SentimentAnalyzer | None = None) -> None:
    self.config = config
    self.sentiment_analyzer = sentiment_analyzer or SentimentAnalyzer()

  def run(self, snapshots: Iterable[EmployeeSnapshot]) -> TrainingSummary:
    snapshots = list(snapshots)
    feature_frame, labels = build_feature_matrix(snapshots, self.sentiment_analyzer)

    if labels is None:
      raise ValueError("Supervised training requires labeled snapshots")

    suite = BaselineModelSuite()
    metrics = suite.train_eval_split(feature_frame, labels)
    suite.save(self.config.baseline_dir)

    evaluation_metrics = self._evaluate_models(suite, feature_frame, labels)
    metric_file = self._persist_metrics(evaluation_metrics)

    advanced_trained = self._train_advanced_models(snapshots)

    return TrainingSummary(
      baseline_metrics=metrics,
      advanced_trained=advanced_trained,
      confusion_matrix=evaluation_metrics['confusion_matrix'],
      classification_report=evaluation_metrics['classification_report'],
      metric_file=metric_file,
    )

  def _train_advanced_models(self, snapshots: List[EmployeeSnapshot]) -> bool:
    texts: List[str] = []
    labels: List[int] = []
    for snapshot in snapshots:
      if snapshot.label is None:
        continue
      text = " ".join(record.body for record in snapshot.communications)
      if not text.strip():
        continue
      texts.append(text)
      labels.append(snapshot.label)

    if len(texts) < 5:
      return False

    label_set = sorted(set(labels))
    num_labels = len(label_set)

    bert = BertTextClassifier(num_labels=num_labels)
    bert.fine_tune(texts, labels)
    bert.save(self.config.bert_dir)

    lstm = LSTMSentimentClassifier(num_labels=num_labels)
    lstm.fit(texts, labels)
    lstm.save(self.config.lstm_dir)

    return True

  def _evaluate_models(self, suite: BaselineModelSuite, features: pd.DataFrame, labels: Iterable[int]):
    labels_array = np.asarray(list(labels))
    probabilities = suite.predict_probabilities(features)

    aggregated_probs = np.mean(list(probabilities.values()), axis=0)
    predictions = np.argmax(aggregated_probs, axis=1)
    class_labels = sorted(set(labels_array))

    accuracy = accuracy_score(labels_array, predictions)
    f1 = f1_score(labels_array, predictions, average="macro")
    unique_classes = np.unique(labels_array)
    if aggregated_probs.ndim == 1 or aggregated_probs.shape[1] == 1:
      auc = roc_auc_score(labels_array, aggregated_probs if aggregated_probs.ndim == 1 else aggregated_probs.squeeze())
    elif len(unique_classes) <= 2:
      auc = roc_auc_score(labels_array, aggregated_probs[:, 1])
    else:
      # For multiclass, multi_class parameter is still needed for sklearn < 1.8
      # This will be deprecated in sklearn 1.8, but needed for now
      auc = roc_auc_score(labels_array, aggregated_probs, multi_class="ovo")

    conf_matrix = confusion_matrix(labels_array, predictions)
    report = classification_report(labels_array, predictions, output_dict=True)

    return {
      "summary": {
        "accuracy": float(accuracy),
        "macro_f1": float(f1),
        "roc_auc": float(auc),
      },
      "confusion_matrix": self._serialize_matrix(conf_matrix, class_labels),
      "classification_report": report,
    }

  def _serialize_matrix(self, matrix: np.ndarray, labels: List[int]) -> Dict[str, Dict[str, int]]:
    matrix_dict: Dict[str, Dict[str, int]] = {}
    for i, row_label in enumerate(labels):
      matrix_dict[str(row_label)] = {}
      for j, col_label in enumerate(labels):
        matrix_dict[str(row_label)][str(col_label)] = int(matrix[i, j])
    return matrix_dict

  def _persist_metrics(self, metrics: Dict[str, object]) -> Optional[Path]:
    metrics_dir = self.config.metrics_dir
    metrics_dir.mkdir(parents=True, exist_ok=True)
    metrics_file = metrics_dir / "baseline_metrics.joblib"
    joblib.dump(metrics, metrics_file)
    return metrics_file


