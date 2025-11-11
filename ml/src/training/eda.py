"""EDA utilities for burnout datasets."""

from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Optional

import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def generate_eda_report(
    frame: pd.DataFrame,
    label_column: str = "label",
    top_k: int = 10,
) -> Dict[str, Any]:
    """Produce summary statistics and chart payloads for the UI."""

    if frame.empty:
        return {
            "summary": {},
            "label_distribution": {},
            "top_correlations": {},
            "charts": {},
            "sample_rows": [],
        }

    numeric_columns = frame.select_dtypes(include=[np.number]).columns.tolist()
    if label_column not in numeric_columns:
        numeric_columns.append(label_column)

    numeric_frame = frame[numeric_columns].copy()
    numeric_frame.fillna(0.0, inplace=True)

    descriptive_stats = numeric_frame.describe().round(2).to_dict()

    label_counts = (
        frame[label_column].value_counts()
        .sort_index()
        .astype(int)
        .to_dict()
    )

    correlation = numeric_frame.corr(numeric_only=True)
    label_corr = (
        correlation[label_column]
        .drop(label_column, errors="ignore")
        .sort_values(ascending=False)
    )
    top_correlations = label_corr.head(top_k).round(4).to_dict()

    charts = {
        "label_distribution": _plot_to_base64(_plot_label_distribution, frame, label_column),
        "correlation_heatmap": _plot_to_base64(_plot_correlation_heatmap, numeric_frame, top_columns=top_k, label_column=label_column),
    }

    sample_records = frame.head(15).to_dict(orient="records")

    return {
        "summary": descriptive_stats,
        "label_distribution": label_counts,
        "top_correlations": top_correlations,
        "charts": charts,
        "sample_rows": sample_records,
    }


def persist_eda_report(report: Dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    serialisable = json.loads(json.dumps(report, default=_json_default))
    output_path.write_text(json.dumps(serialisable, indent=2), encoding="utf-8")


def _plot_to_base64(plotter, *args, **kwargs) -> Optional[str]:
    try:
        fig = plotter(*args, **kwargs)
        buffer = BytesIO()
        fig.tight_layout()
        fig.savefig(buffer, format="png")
        plt.close(fig)
        buffer.seek(0)
        encoded = base64.b64encode(buffer.read()).decode("utf-8")
        return encoded
    except Exception:
        return None


def _plot_label_distribution(frame: pd.DataFrame, label_column: str):
    counts = frame[label_column].value_counts().sort_index()
    fig, ax = plt.subplots(figsize=(4, 3))
    counts.plot(kind="bar", ax=ax, color="#2563eb")
    ax.set_xlabel("Burnout Label")
    ax.set_ylabel("Count")
    ax.set_title("Burnout Distribution")
    return fig


def _json_default(value):
    if isinstance(value, (set, tuple)):
        return list(value)
    if isinstance(value, (np.integer, np.floating)):
        return float(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    return str(value)


def _plot_correlation_heatmap(frame: pd.DataFrame, top_columns: int, label_column: str):
    corr = frame.corr(numeric_only=True)
    columns = corr[label_column].abs().sort_values(ascending=False).head(top_columns + 1).index
    selected = corr.loc[columns, columns]
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(selected, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(columns)))
    ax.set_yticks(range(len(columns)))
    ax.set_xticklabels(columns, rotation=45, ha="right")
    ax.set_yticklabels(columns)
    ax.set_title("Top Feature Correlations")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    return fig



