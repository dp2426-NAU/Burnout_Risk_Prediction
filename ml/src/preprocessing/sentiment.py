"""Sentiment utilities for communication metadata."""

from __future__ import annotations

import logging
from typing import Iterable, List, Sequence

from nltk import download as nltk_download
from nltk.sentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Thin wrapper around VADER sentiment to support batch scoring."""

    def __init__(self) -> None:
        try:
            nltk_download("vader_lexicon", quiet=True)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to download VADER lexicon: %s", exc)
        self._analyzer = SentimentIntensityAnalyzer()

    def score_text(self, text: str) -> float:
        if not text.strip():
            return 0.0
        return self._analyzer.polarity_scores(text)["compound"]

    def score_batch(self, texts: Sequence[str]) -> List[float]:
        return [self.score_text(text) for text in texts]

    def annotate(self, records: Iterable["CommunicationRecord"]) -> None:
        """Mutate the provided communication records with sentiment scores."""

        from ..data_collection.schemas import CommunicationRecord

        for record in records:
            if isinstance(record, CommunicationRecord):
                record.sentiment = self.score_text(record.body)


