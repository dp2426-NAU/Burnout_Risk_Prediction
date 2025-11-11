"""Utilities for loading tabular burnout datasets into training snapshots."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import pandas as pd

from ..data_collection.schemas import EmployeeSnapshot


@dataclass(frozen=True)
class DatasetSpec:
    """Metadata describing a tabular dataset."""

    name: str
    path: Path
    id_column: Optional[str]
    label_column: str


class TabularDatasetLoader:
    """Loads multiple tabular datasets and converts them into snapshots."""

    def __init__(self, specs: Iterable[DatasetSpec]):
        self.specs = list(specs)
        self._categorical_maps: Dict[str, Dict[str, float]] = {}

    def load(self) -> Tuple[List[EmployeeSnapshot], pd.DataFrame]:
        """Return snapshots for training and a combined dataframe for EDA."""

        snapshots: List[EmployeeSnapshot] = []
        eda_records: List[Dict[str, float | int | str]] = []

        for spec in self.specs:
            if not spec.path.exists():
                raise FileNotFoundError(f"Dataset not found: {spec.path}")

            frame = pd.read_csv(spec.path)
            sanitized_frame = self._sanitize_columns(frame)

            for index, row in sanitized_frame.iterrows():
                label_value = row.get(spec.label_column)
                if pd.isna(label_value):
                    # Skip unlabeled samples for supervised training
                    continue

                label = int(float(label_value))
                metadata = self._row_to_metadata(row, exclude_columns={spec.label_column})

                employee_id = self._resolve_employee_id(spec, row, index)
                snapshots.append(
                    EmployeeSnapshot(
                        employee_id=employee_id,
                        calendar_events=[],
                        communications=[],
                        tasks=[],
                        label=label,
                        metadata=metadata,
                    )
                )

                eda_record: Dict[str, float | int | str] = {
                    **{key: value for key, value in metadata.items()},
                    "label": label,
                    "dataset_source": spec.name,
                }
                eda_records.append(eda_record)

        eda_frame = pd.DataFrame(eda_records)
        if not eda_frame.empty:
            eda_frame.fillna(0.0, inplace=True)
        return snapshots, eda_frame

    @staticmethod
    def _sanitize_columns(frame: pd.DataFrame) -> pd.DataFrame:
        """Normalise column names to snake case to avoid downstream issues."""

        def sanitize(name: str) -> str:
            return (
                name.strip()
                .replace(" ", "_")
                .replace("-", "_")
                .replace("/", "_")
                .replace("%", "pct")
                .lower()
            )

        renamed = {column: sanitize(str(column)) for column in frame.columns}
        return frame.rename(columns=renamed)

    def _row_to_metadata(
        self,
        row: pd.Series,
        exclude_columns: Optional[Iterable[str]] = None,
    ) -> Dict[str, float]:
        """Convert a dataframe row into numeric metadata values."""

        exclude = set(exclude_columns or [])
        metadata: Dict[str, float] = {}

        for column, value in row.items():
            if column in exclude:
                continue
            numeric_value = self._convert_value(column, value)
            if numeric_value is None:
                continue
            metadata[column] = numeric_value

        return metadata

    def _convert_value(self, column: str, value) -> Optional[float]:
        """Attempt to convert a value to float; fall back to categorical encoding."""

        if value is None or (isinstance(value, str) and not value.strip()):
            return None

        if isinstance(value, (int, float)):
            return float(value)

        text = str(value).strip()
        lowered = text.lower()

        boolean_map = {
            "yes": 1.0,
            "true": 1.0,
            "y": 1.0,
            "no": 0.0,
            "false": 0.0,
            "n": 0.0,
        }
        if lowered in boolean_map:
            return boolean_map[lowered]

        remote_map = {
            "hybrid": 0.5,
            "remote": 1.0,
            "onsite": 0.0,
            "office": 0.0,
        }
        if lowered in remote_map:
            return remote_map[lowered]

        # Salary ranges such as "40k-60k"
        if "k" in lowered and "-" in lowered:
            parts = lowered.replace("k", "").split("-")
            try:
                numbers = [float(part) for part in parts if part]
            except ValueError:
                numbers = []
            if numbers:
                average = sum(numbers) / len(numbers)
                return average * 1000.0

        try:
            return float(text)
        except ValueError:
            pass

        mapping = self._categorical_maps.setdefault(column, {})
        if text not in mapping:
            mapping[text] = float(len(mapping) + 1)
        return mapping[text]

    @staticmethod
    def _resolve_employee_id(spec: DatasetSpec, row: pd.Series, index: int) -> str:
        if spec.id_column and spec.id_column in row:
            identifier = str(row[spec.id_column])
        else:
            identifier = f"{spec.name}_{index}"
        return identifier


def default_dataset_specs(base_dir: Path) -> List[DatasetSpec]:
    """Infer dataset specifications for CSV files stored under datasets/raw."""

    datasets_dir = base_dir / "datasets" / "raw"
    specs: List[DatasetSpec] = []

    if not datasets_dir.exists():
        return specs

    for csv_path in sorted(datasets_dir.glob("*.csv")):
        try:
            preview = pd.read_csv(csv_path, nrows=1)
        except Exception as error:  # pragma: no cover - defensive logging
            raise RuntimeError(f"Failed to inspect dataset {csv_path}") from error

        sanitized_preview = TabularDatasetLoader._sanitize_columns(preview)

        label_column = _detect_label_column(sanitized_preview.columns)
        if label_column is None:
            continue

        id_column = _detect_id_column(sanitized_preview.columns)
        specs.append(
            DatasetSpec(
                name=csv_path.stem,
                path=csv_path,
                id_column=id_column,
                label_column=label_column,
            )
        )

    return specs


def _detect_label_column(columns: Iterable[str]) -> Optional[str]:
    preferred_order = [
        lambda c: "burnoutrisk" in c,
        lambda c: c.endswith("risk"),
        lambda c: "burnout_risk" in c,
        lambda c: c == "burnout",
        lambda c: c.startswith("burnout"),
    ]
    column_list = list(columns)
    for predicate in preferred_order:
        for column in column_list:
            if predicate(column.lower()):
                return column
    for column in columns:
        lowered = column.lower()
        if "burnout" in lowered or lowered.endswith("risk"):
            return column
    return None


def _detect_id_column(columns: Iterable[str]) -> Optional[str]:
    for column in columns:
        lowered = column.lower()
        if "employeeid" in lowered or lowered.endswith("_id") or lowered.startswith("id"):
            return column
    for column in columns:
        if "name" in column.lower():
            return column
    return None



