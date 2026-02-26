"""Dataset loaders for each task type."""

from promptlab.datasets.base import DatasetLoader
from promptlab.schemas import DatasetExample
from promptlab.types import TaskType


def load_dataset(
    task_type: TaskType,
    split: str = "train",
    size: int = 50,
    cache_dir: str | None = None,
) -> list[DatasetExample]:
    """Load dataset for a specific task type."""
    loader = _get_loader(task_type, cache_dir)
    return loader.load(split, size)


def _get_loader(task_type: TaskType, cache_dir: str | None) -> DatasetLoader:
    """Get the appropriate loader for a task type."""
    if task_type == TaskType.REWRITE_FRIENDLY:
        from promptlab.datasets.paradetox import ParaDetoxLoader

        return ParaDetoxLoader(cache_dir=cache_dir)

    if task_type == TaskType.REWRITE_CONCISE:
        from promptlab.datasets.sentence_compression import SentenceCompressionLoader

        return SentenceCompressionLoader(cache_dir=cache_dir)

    if task_type == TaskType.COMPLETE:
        from promptlab.datasets.wikitext import WikiTextLoader

        return WikiTextLoader(cache_dir=cache_dir)

    if task_type == TaskType.SUMMARIZE:
        from promptlab.datasets.xsum import XSumLoader

        return XSumLoader(cache_dir=cache_dir)

    if task_type == TaskType.EXPLAIN:
        from promptlab.datasets.wordnet import WordNetLoader

        return WordNetLoader(cache_dir=cache_dir)

    raise ValueError(f"Unknown task type: {task_type}")


__all__ = ["load_dataset", "DatasetLoader"]
