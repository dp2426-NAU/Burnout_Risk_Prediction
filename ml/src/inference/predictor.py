"""Predictor utilities used by the backend service."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable

import numpy as np
import pandas as pd

from ..data_collection.schemas import EmployeeSnapshot
from ..models import BaselineModelSuite, BertTextClassifier, LSTMSentimentClassifier
from ..preprocessing import SentimentAnalyzer, compute_feature_dict

RISK_LEVELS = ["low", "medium", "high", "critical"]


@dataclass
class BurnoutPrediction:
    risk_level: str
    confidence: float
    probabilities: Dict[str, float]
    feature_vector: Dict[str, float]
    score: float


class BurnoutPredictor:
    """Loads trained models and produces burnout predictions."""

    def __init__(
        self,
        baseline_dir: Path,
        advanced_dir: Path | None = None,
        sentiment_analyzer: SentimentAnalyzer | None = None,
    ) -> None:
        self.baseline = BaselineModelSuite.load(baseline_dir)
        self.advanced_dir = advanced_dir
        self.sentiment_analyzer = sentiment_analyzer or SentimentAnalyzer()
        self._bert: BertTextClassifier | None = None
        self._lstm: LSTMSentimentClassifier | None = None

        if advanced_dir and (advanced_dir / "bert").exists():
            self._bert = BertTextClassifier.load(advanced_dir / "bert")
        if advanced_dir and (advanced_dir / "lstm").exists():
            self._lstm = LSTMSentimentClassifier.load(advanced_dir / "lstm")

    def predict(self, snapshot: EmployeeSnapshot) -> BurnoutPrediction:
        features = compute_feature_dict(snapshot, self.sentiment_analyzer)
        feature_frame = pd.DataFrame([features])

        baseline_probs = self._predict_baseline(feature_frame)
        advanced_probs = self._predict_advanced(snapshot)

        combined = self._combine_probabilities([baseline_probs, advanced_probs])

        risk_index = int(np.argmax(combined))
        risk_level = RISK_LEVELS[min(risk_index, len(RISK_LEVELS) - 1)]
        probabilities = {
            RISK_LEVELS[min(idx, len(RISK_LEVELS) - 1)]: float(prob)
            for idx, prob in enumerate(combined)
        }

        score = self._probabilities_to_score(combined)

        return BurnoutPrediction(
            risk_level=risk_level,
            confidence=float(np.max(combined)),
            probabilities=probabilities,
            feature_vector=features,
            score=score,
        )

    def predict_from_features(self, feature_vector: Dict[str, float]) -> BurnoutPrediction:
        feature_frame = pd.DataFrame([feature_vector])
        baseline_probs = self._predict_baseline(feature_frame)
        combined = self._combine_probabilities([baseline_probs])

        risk_index = int(np.argmax(combined))
        risk_level = RISK_LEVELS[min(risk_index, len(RISK_LEVELS) - 1)]
        probabilities = {
            RISK_LEVELS[min(idx, len(RISK_LEVELS) - 1)]: float(prob)
            for idx, prob in enumerate(combined)
        }

        score = self._probabilities_to_score(combined)

        return BurnoutPrediction(
            risk_level=risk_level,
            confidence=float(np.max(combined)),
            probabilities=probabilities,
            feature_vector=feature_vector,
            score=score,
        )

    def _predict_baseline(self, features: pd.DataFrame) -> np.ndarray:
        suite = self.baseline
        predictions = suite.predict_probabilities(features)
        # average probabilities from available baseline models
        prob_arrays = list(predictions.values())
        return np.mean(prob_arrays, axis=0)[0]

    def _predict_advanced(self, snapshot: EmployeeSnapshot) -> np.ndarray | None:
        texts = [record.body for record in snapshot.communications if record.body.strip()]
        if not texts:
            return None

        combined_text = " ".join(texts)
        probabilities: list[np.ndarray] = []

        if self._bert is not None:
            probabilities.append(self._bert.predict_proba([combined_text])[0])
        if self._lstm is not None:
            probabilities.append(self._lstm.predict_proba([combined_text])[0])

        if not probabilities:
            return None

        return np.mean(probabilities, axis=0)

    @staticmethod
    def _combine_probabilities(probability_arrays: Iterable[np.ndarray | None]) -> np.ndarray:
        arrays = [arr for arr in probability_arrays if arr is not None]
        if not arrays:
            raise ValueError("At least one probability array must be provided")
        max_dim = max(array.shape[-1] for array in arrays)
        normalized = []
        for array in arrays:
            if array.shape[-1] == max_dim:
                normalized.append(array)
            else:
                # pad with zeros if model outputs fewer classes
                pad = np.zeros(max_dim)
                pad[: array.shape[-1]] = array
                normalized.append(pad)
        return np.mean(normalized, axis=0)

    @staticmethod
    def _probabilities_to_score(probabilities: np.ndarray) -> float:
        if probabilities.size == 0:
            return 0.0
        weights = np.linspace(0.0, 1.0, probabilities.shape[-1])
        return float(np.dot(probabilities, weights))


