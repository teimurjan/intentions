"""Sentence compression dataset loader for concise rewrite task."""

from typing import Any

from promptlab.datasets.base import CachingMixin, DatasetLoader
from promptlab.schemas import DatasetExample
from promptlab.types import TaskType


class SentenceCompressionLoader(DatasetLoader, CachingMixin):
    """Loader for Google's sentence compression dataset."""

    task_type = TaskType.REWRITE_CONCISE

    def _load_from_hf(self, split: str, size: int) -> list[DatasetExample]:
        """Load from HuggingFace datasets."""
        cached = self._load_from_cache("sentence_compression", split, size)
        if cached:
            return cached

        from datasets import load_dataset

        ds = load_dataset("embedding-data/sentence-compression", split="train")

        offset = 0 if split == "train" else len(ds) // 2
        examples = []

        for i, row in enumerate(ds):
            if i < offset:
                continue
            if len(examples) >= size:
                break

            example = self._convert_example(row)
            if example:
                examples.append(example)

        self._save_to_cache("sentence_compression", split, examples)
        return examples

    def _convert_example(self, raw: dict[str, Any]) -> DatasetExample | None:
        """Convert raw HF example to DatasetExample."""
        pair = raw.get("set", [])
        if not pair or len(pair) < 2:
            return None

        original = pair[0]
        compressed = pair[1]

        if not original or not compressed:
            return None

        if len(original) < 30 or len(compressed) < 10:
            return None

        if len(compressed) >= len(original):
            return None

        return DatasetExample(
            task_type=TaskType.REWRITE_CONCISE,
            input_text=original,
            reference=compressed,
        )
