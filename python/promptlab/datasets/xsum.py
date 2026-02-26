"""XSum dataset loader for summarization task."""

from typing import Any

from promptlab.datasets.base import CachingMixin, DatasetLoader
from promptlab.schemas import DatasetExample
from promptlab.types import TaskType


class XSumLoader(DatasetLoader, CachingMixin):
    """Loader for XSum (Extreme Summarization) dataset."""

    task_type = TaskType.SUMMARIZE

    def _load_from_hf(self, split: str, size: int) -> list[DatasetExample]:
        """Load from HuggingFace datasets."""
        cached = self._load_from_cache("xsum", split, size)
        if cached:
            return cached

        from datasets import load_dataset

        hf_split = "train" if split == "train" else "validation"
        ds = load_dataset("xsum", split=hf_split)

        examples = []
        for i, row in enumerate(ds):
            if i >= size:
                break
            examples.append(self._convert_example(row))

        self._save_to_cache("xsum", split, examples)
        return examples

    def _convert_example(self, raw: dict[str, Any]) -> DatasetExample:
        """Convert raw HF example to DatasetExample."""
        return DatasetExample(
            task_type=TaskType.SUMMARIZE,
            input_text=raw["document"],
            reference=raw["summary"],
        )
