"""WordNet dataset loader for explanation task."""

from typing import Any

from promptlab.datasets.base import CachingMixin, DatasetLoader
from promptlab.schemas import DatasetExample
from promptlab.types import TaskType


class WordNetLoader(DatasetLoader, CachingMixin):
    """Loader for WordNet definitions dataset."""

    task_type = TaskType.EXPLAIN

    def _load_from_hf(self, split: str, size: int) -> list[DatasetExample]:
        """Load from HuggingFace datasets."""
        cached = self._load_from_cache("wordnet", split, size)
        if cached:
            return cached

        from datasets import load_dataset

        hf_split = "train" if split == "train" else "validation"
        ds = load_dataset("marksverdhei/wordnet-definitions-en-2021", split=hf_split)

        examples = []
        for i, row in enumerate(ds):
            if i >= size * 3:
                break
            example = self._convert_example(row)
            if example and len(examples) < size:
                examples.append(example)

        self._save_to_cache("wordnet", split, examples)
        return examples

    def _convert_example(self, raw: dict[str, Any]) -> DatasetExample | None:
        """Convert raw HF example to DatasetExample."""
        word = raw.get("Word", "")
        definition = raw.get("Definition", "")

        if not word or not definition:
            return None

        if len(definition) < 10 or len(definition) > 200:
            return None

        if word == "null" or definition == "null":
            return None

        return DatasetExample(
            task_type=TaskType.EXPLAIN,
            input_text=word,
            reference=definition,
        )
