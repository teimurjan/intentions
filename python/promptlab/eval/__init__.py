"""Evaluation system for prompt optimization."""

from promptlab.eval.base import BaseEvaluator
from promptlab.types import TaskType


def get_evaluator(task_type: TaskType) -> BaseEvaluator:
    """Get evaluator for a specific task type."""
    if task_type in {TaskType.REWRITE_FRIENDLY, TaskType.REWRITE_CONCISE}:
        from promptlab.eval.rewrite import RewriteEvaluator

        return RewriteEvaluator()

    if task_type == TaskType.COMPLETE:
        from promptlab.eval.complete import CompleteEvaluator

        return CompleteEvaluator()

    if task_type == TaskType.SUMMARIZE:
        from promptlab.eval.summarize import SummarizeEvaluator

        return SummarizeEvaluator()

    if task_type == TaskType.EXPLAIN:
        from promptlab.eval.explain import ExplainEvaluator

        return ExplainEvaluator()

    raise ValueError(f"Unknown task type: {task_type}")


__all__ = ["BaseEvaluator", "get_evaluator"]
