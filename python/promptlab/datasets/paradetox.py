"""ParaDetox dataset loader for friendly rewrite task."""

from typing import Any

from promptlab.datasets.base import CachingMixin, DatasetLoader
from promptlab.schemas import DatasetExample
from promptlab.types import TaskType

PROFANITY_WORDS = frozenset({
    "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "damn", "damned",
    "ass", "asses", "asshole", "bitch", "bitches", "crap", "crappy", "dick",
    "dicks", "bastard", "bastards", "whore", "slut", "piss", "retard", "retarded",
})


class ParaDetoxLoader(DatasetLoader, CachingMixin):
    """Loader for ParaDetox dataset filtered for clean polite rewrites."""

    task_type = TaskType.REWRITE_FRIENDLY

    def _load_from_hf(self, split: str, size: int) -> list[DatasetExample]:
        """Load from HuggingFace datasets with profanity filtering."""
        cached = self._load_from_cache("paradetox_friendly", split, size)
        if cached:
            return cached

        from datasets import load_dataset

        ds = load_dataset("s-nlp/paradetox", split="train")

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

        self._save_to_cache("paradetox_friendly", split, examples)
        return examples

    def _convert_example(self, raw: dict[str, Any]) -> DatasetExample | None:
        """Convert raw HF example to DatasetExample, filtering profanity."""
        toxic = raw.get("en_toxic_comment", "")
        neutral = raw.get("en_neutral_comment", "")

        if not toxic or not neutral:
            return None

        toxic_lower = toxic.lower()
        neutral_lower = neutral.lower()

        for word in PROFANITY_WORDS:
            if word in toxic_lower or word in neutral_lower:
                return None

        if len(neutral) < 10 or len(toxic) < 10:
            return None

        if len(neutral) > 300 or len(toxic) > 300:
            return None

        return DatasetExample(
            task_type=TaskType.REWRITE_FRIENDLY,
            input_text=toxic,
            reference=neutral,
        )
