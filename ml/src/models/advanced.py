"""Advanced NLP models for burnout risk assessment."""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)


class _HFDataset(Dataset):
    def __init__(self, tokenizer, texts: Sequence[str], labels: Optional[Sequence[int]] = None):
        self.encodings = tokenizer(list(texts), truncation=True, padding=True)
        self.labels = list(labels) if labels is not None else None

    def __len__(self) -> int:
        return len(self.encodings["input_ids"])

    def __getitem__(self, idx: int):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        if self.labels is not None:
            item["labels"] = torch.tensor(self.labels[idx])
        return item


@dataclass
class BertTextClassifier:
    """Fine-tunable BERT classifier for textual burnout signals."""

    model_name: str = "distilbert-base-uncased"
    num_labels: int = 3
    learning_rate: float = 5e-5
    epochs: int = 2
    batch_size: int = 16
    _tokenizer: AutoTokenizer = field(init=False, repr=False)
    _model: AutoModelForSequenceClassification = field(init=False, repr=False)
    _fitted: bool = field(default=False, init=False)

    def __post_init__(self) -> None:
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self._model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=self.num_labels,
        )

    def fine_tune(self, texts: Sequence[str], labels: Sequence[int]) -> None:
        dataset = _HFDataset(self._tokenizer, texts, labels)
        args = TrainingArguments(
            output_dir="./tmp-trainer",
            evaluation_strategy="no",
            per_device_train_batch_size=self.batch_size,
            num_train_epochs=self.epochs,
            learning_rate=self.learning_rate,
            logging_steps=50,
            save_strategy="no",
        )
        trainer = Trainer(model=self._model, args=args, train_dataset=dataset)
        trainer.train()
        self._fitted = True

    def predict_proba(self, texts: Sequence[str]) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError("Model must be fine-tuned before prediction")

        dataset = _HFDataset(self._tokenizer, texts)
        trainer = Trainer(model=self._model)
        predictions = trainer.predict(dataset)
        logits = predictions.predictions
        return torch.softmax(torch.tensor(logits), dim=1).numpy()

    def save(self, directory: Path) -> None:
        directory.mkdir(parents=True, exist_ok=True)
        self._model.save_pretrained(directory)
        self._tokenizer.save_pretrained(directory)
        metadata = {
            "model_name": self.model_name,
            "num_labels": self.num_labels,
        }
        (directory / "config.json").write_text(json.dumps(metadata))

    @classmethod
    def load(cls, directory: Path) -> "BertTextClassifier":
        metadata = json.loads((directory / "config.json").read_text())
        instance = cls(
            model_name=metadata.get("model_name", "distilbert-base-uncased"),
            num_labels=metadata.get("num_labels", 3),
        )
        instance._model = AutoModelForSequenceClassification.from_pretrained(directory)
        instance._tokenizer = AutoTokenizer.from_pretrained(directory)
        instance._fitted = True
        return instance


def _tokenize(text: str) -> List[str]:
    return [token.lower() for token in text.split() if token]


class _LSTMDataset(Dataset):
    def __init__(self, sequences: List[List[int]], labels: Sequence[int]):
        self.sequences = sequences
        self.labels = list(labels)

    def __len__(self) -> int:
        return len(self.sequences)

    def __getitem__(self, idx: int):
        return torch.tensor(self.sequences[idx]), torch.tensor(self.labels[idx])


class _LSTMModel(nn.Module):
    def __init__(self, vocab_size: int, embedding_dim: int, hidden_dim: int, num_labels: int):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_labels)

    def forward(self, input_ids, lengths):
        embedded = self.embedding(input_ids)
        packed = nn.utils.rnn.pack_padded_sequence(embedded, lengths.cpu(), batch_first=True, enforce_sorted=False)
        _, (hidden, _) = self.lstm(packed)
        logits = self.fc(hidden[-1])
        return logits


@dataclass
class LSTMSentimentClassifier:
    """Lightweight LSTM classifier for sentiment trajectories."""

    embedding_dim: int = 128
    hidden_dim: int = 128
    num_labels: int = 3
    max_vocab: int = 20000
    epochs: int = 5
    batch_size: int = 32
    lr: float = 1e-3
    device: str = field(default_factory=lambda: "cuda" if torch.cuda.is_available() else "cpu")

    _vocab: Dict[str, int] = field(default_factory=dict, init=False, repr=False)
    _model: Optional[_LSTMModel] = field(default=None, init=False, repr=False)
    _fitted: bool = field(default=False, init=False)

    def fit(self, texts: Sequence[str], labels: Sequence[int]) -> None:
        self._build_vocab(texts)
        sequences, lengths = self._texts_to_tensor(texts)
        dataset = _LSTMDataset(sequences, labels)
        dataloader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        self._model = _LSTMModel(len(self._vocab) + 1, self.embedding_dim, self.hidden_dim, self.num_labels)
        self._model.to(self.device)

        optimizer = torch.optim.Adam(self._model.parameters(), lr=self.lr)
        criterion = nn.CrossEntropyLoss()

        for _ in range(self.epochs):
            self._model.train()
            for batch_inputs, batch_labels in dataloader:
                lengths = torch.tensor([len(seq) for seq in batch_inputs])
                batch_inputs = nn.utils.rnn.pad_sequence(batch_inputs, batch_first=True).to(self.device)
                batch_labels = batch_labels.to(self.device)
                lengths = lengths.to(self.device)

                optimizer.zero_grad()
                logits = self._model(batch_inputs, lengths)
                loss = criterion(logits, batch_labels)
                loss.backward()
                optimizer.step()

        self._fitted = True

    def predict_proba(self, texts: Sequence[str]) -> np.ndarray:
        if not self._fitted or self._model is None:
            raise RuntimeError("Model must be trained before prediction")

        sequences, _ = self._texts_to_tensor(texts)
        dataloader = DataLoader(_LSTMDataset(sequences, [0] * len(sequences)), batch_size=self.batch_size)

        self._model.eval()
        outputs: List[np.ndarray] = []
        with torch.no_grad():
            for batch_inputs, _ in dataloader:
                lengths = torch.tensor([len(seq) for seq in batch_inputs]).to(self.device)
                batch_inputs = nn.utils.rnn.pad_sequence(batch_inputs, batch_first=True).to(self.device)
                logits = self._model(batch_inputs, lengths)
                probs = torch.softmax(logits, dim=1).cpu().numpy()
                outputs.append(probs)

        return np.vstack(outputs)

    def save(self, directory: Path) -> None:
        if not self._fitted or self._model is None:
            raise RuntimeError("Model must be trained before saving")

        directory.mkdir(parents=True, exist_ok=True)
        torch.save(self._model.state_dict(), directory / "lstm_model.pt")
        (directory / "vocab.json").write_text(json.dumps(self._vocab))
        metadata = {
            "embedding_dim": self.embedding_dim,
            "hidden_dim": self.hidden_dim,
            "num_labels": self.num_labels,
        }
        (directory / "config.json").write_text(json.dumps(metadata))

    @classmethod
    def load(cls, directory: Path) -> "LSTMSentimentClassifier":
        metadata = json.loads((directory / "config.json").read_text())
        vocab = json.loads((directory / "vocab.json").read_text())
        instance = cls(
            embedding_dim=metadata.get("embedding_dim", 128),
            hidden_dim=metadata.get("hidden_dim", 128),
            num_labels=metadata.get("num_labels", 3),
        )
        instance._vocab = vocab
        instance._model = _LSTMModel(len(vocab) + 1, instance.embedding_dim, instance.hidden_dim, instance.num_labels)
        instance._model.load_state_dict(torch.load(directory / "lstm_model.pt", map_location=instance.device))
        instance._model.to(instance.device)
        instance._fitted = True
        return instance

    def _build_vocab(self, texts: Sequence[str]) -> None:
        counter = Counter()
        for text in texts:
            counter.update(_tokenize(text))
        most_common = counter.most_common(self.max_vocab)
        self._vocab = {token: idx + 1 for idx, (token, _) in enumerate(most_common)}

    def _texts_to_tensor(self, texts: Sequence[str]) -> List[List[int]]:
        sequences: List[List[int]] = []
        lengths: List[int] = []
        for text in texts:
            tokens = _tokenize(text)
            indices = [self._vocab.get(token, 0) for token in tokens]
            sequences.append(indices or [0])
            lengths.append(len(indices) or 1)
        return sequences, lengths


