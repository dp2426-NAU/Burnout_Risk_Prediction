"""Baseline models for burnout risk classification."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


@dataclass
class BaselineModelSuite:
    """Container managing baseline classifiers and their persistence."""

    random_state: int = 42
    logistic_params: Optional[Dict[str, float]] = None
    forest_params: Optional[Dict[str, float]] = None
    models: Dict[str, Pipeline] = field(default_factory=dict)
    fitted_: bool = False

    def fit(self, X: pd.DataFrame, y: Iterable[int]) -> "BaselineModelSuite":
        features = pd.DataFrame(X)
        labels = np.asarray(list(y))

        numeric_features = features.columns.tolist()

        preprocessor = ColumnTransformer([
            ("numeric", StandardScaler(), numeric_features),
        ])

        # Detect number of classes to determine if multiclass
        unique_labels = np.unique(labels)
        num_classes = len(unique_labels)
        
        # For sklearn 1.5+, multi_class is deprecated for binary problems
        # Only set it for multiclass (>2 classes) if needed
        logistic_params = {
            "max_iter": 500,
            "solver": "lbfgs",
            **(self.logistic_params or {}),
        }
        # Only set multi_class for multiclass problems (if not overridden by user params)
        if num_classes > 2 and "multi_class" not in (self.logistic_params or {}):
            logistic_params["multi_class"] = "multinomial"
        
        logistic = Pipeline([
            ("preprocess", preprocessor),
            ("model", LogisticRegression(**logistic_params)),
        ])

        forest = Pipeline([
            ("preprocess", preprocessor),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=300,
                    max_depth=None,
                    class_weight="balanced",
                    random_state=self.random_state,
                    **(self.forest_params or {}),
                ),
            ),
        ])

        logistic.fit(features, labels)
        forest.fit(features, labels)

        self.models = {
            "logistic_regression": logistic,
            "random_forest": forest,
        }
        self.fitted_ = True
        return self

    def evaluate(self, X: pd.DataFrame, y: Iterable[int]) -> Dict[str, Dict[str, float]]:
        if not self.fitted_:
            raise RuntimeError("Models must be fitted before evaluation")

        features = pd.DataFrame(X)
        labels = np.asarray(list(y))

        metrics: Dict[str, Dict[str, float]] = {}
        for name, model in self.models.items():
            preds = model.predict(features)
            proba = model.predict_proba(features)
            unique_classes = np.unique(labels)
            if proba.ndim == 1:
                auc_score = roc_auc_score(labels, proba)
            elif len(unique_classes) <= 2:
                positive_probs = proba[:, 1] if proba.shape[1] > 1 else proba.squeeze()
                auc_score = roc_auc_score(labels, positive_probs)
            else:
                # For multiclass, use default multi_class handling (deprecated param removed)
                auc_score = roc_auc_score(labels, proba, multi_class="ovo")
            metrics[name] = {
                "accuracy": accuracy_score(labels, preds),
                "macro_f1": f1_score(labels, preds, average="macro"),
                "roc_auc": auc_score,
            }
        return metrics

    def train_eval_split(
        self,
        X: pd.DataFrame,
        y: Iterable[int],
        test_size: float = 0.2,
    ) -> Dict[str, Dict[str, float]]:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            list(y),
            test_size=test_size,
            random_state=self.random_state,
            stratify=list(y),
        )
        self.fit(X_train, y_train)
        return self.evaluate(X_test, y_test)

    def predict_probabilities(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        if not self.fitted_:
            raise RuntimeError("Models must be fitted before prediction")

        features = pd.DataFrame(X)
        return {
            name: model.predict_proba(features)
            for name, model in self.models.items()
        }

    def save(self, directory: Path) -> None:
        if not self.fitted_:
            raise RuntimeError("Models must be fitted before saving")

        directory.mkdir(parents=True, exist_ok=True)
        for name, model in self.models.items():
            joblib.dump(model, directory / f"{name}.joblib")

    @classmethod
    def load(cls, directory: Path) -> "BaselineModelSuite":
        suite = cls()
        models = {}
        for name in ("logistic_regression", "random_forest"):
            path = directory / f"{name}.joblib"
            if path.exists():
                models[name] = joblib.load(path)

        if not models:
            raise FileNotFoundError(f"No models were found under {directory!s}")

        suite.models = models
        suite.fitted_ = True
        return suite


