"""WikiText-2 dataset loader for completion task."""

import re
from typing import Any

from promptlab.datasets.base import CachingMixin, DatasetLoader
from promptlab.schemas import DatasetExample
from promptlab.types import TaskType


class WikiTextLoader(DatasetLoader, CachingMixin):
    """Loader for WikiText-2 dataset for text completion."""

    task_type = TaskType.COMPLETE

    def _load_from_hf(self, split: str, size: int) -> list[DatasetExample]:
        """Load from HuggingFace datasets."""
        cached = self._load_from_cache("wikitext", split, size)
        if cached:
            return cached

        from datasets import load_dataset

        hf_split = "train" if split == "train" else "validation"
        ds = load_dataset("wikitext", "wikitext-2-raw-v1", split=hf_split)

        examples = []
        current_text = ""

        for row in ds:
            text = row["text"].strip()
            if not text or text.startswith("="):
                continue

            current_text += " " + text
            current_text = current_text.strip()

            if len(current_text) > 200:
                example = self._create_completion_example(current_text)
                if example:
                    examples.append(example)
                    if len(examples) >= size:
                        break
                current_text = ""

        self._save_to_cache("wikitext", split, examples)
        return examples

    def _create_completion_example(self, text: str) -> DatasetExample | None:
        """Create completion example by splitting text."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        if len(sentences) < 2:
            return None

        split_point = len(sentences) // 2
        prefix = " ".join(sentences[:split_point])
        continuation = " ".join(sentences[split_point:])

        if len(prefix) < 50 or len(continuation) < 20:
            return None

        return DatasetExample(
            task_type=TaskType.COMPLETE,
            input_text=prefix,
            reference=continuation,
        )

    def _convert_example(self, raw: dict[str, Any]) -> DatasetExample:
        """Convert raw example."""
        return DatasetExample(
            task_type=TaskType.COMPLETE,
            input_text=raw.get("input_text", raw.get("text", "")),
            reference=raw.get("reference", ""),
        )
