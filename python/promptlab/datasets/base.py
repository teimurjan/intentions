"""Base protocol and mixin for dataset loaders."""

import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from promptlab.schemas import DatasetExample
from promptlab.types import TaskType


class DatasetLoader(ABC):
    """Base class for dataset loaders."""

    task_type: TaskType

    def __init__(self, cache_dir: str | None = None):
        self.cache_dir = cache_dir

    @abstractmethod
    def _load_from_hf(self, split: str, size: int) -> list[DatasetExample]:
        """Load examples from HuggingFace datasets."""
        ...

    @abstractmethod
    def _convert_example(self, raw: dict[str, Any]) -> DatasetExample | None:
        """Convert raw HF example to DatasetExample."""
        ...

    def load(self, split: str = "train", size: int = 50) -> list[DatasetExample]:
        """Load dataset examples."""
        return self._load_from_hf(split, size)


class CachingMixin:
    """Mixin for caching downloaded datasets."""

    def _get_cache_path(self, name: str, split: str) -> Path:
        """Get cache file path."""
        cache_dir = getattr(self, "cache_dir", None) or ".cache/datasets"
        path = Path(cache_dir) / f"{name}_{split}.jsonl"
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    def _load_from_cache(self, name: str, split: str, size: int) -> list[DatasetExample] | None:
        """Try loading from cache."""
        cache_path = self._get_cache_path(name, split)
        if not cache_path.exists():
            return None

        examples = []
        with open(cache_path) as f:
            for line in f:
                if len(examples) >= size:
                    break
                examples.append(DatasetExample.model_validate(json.loads(line)))

        return examples if examples else None

    def _save_to_cache(self, name: str, split: str, examples: list[DatasetExample]) -> None:
        """Save examples to cache."""
        cache_path = self._get_cache_path(name, split)
        with open(cache_path, "w") as f:
            for ex in examples:
                f.write(ex.model_dump_json() + "\n")
