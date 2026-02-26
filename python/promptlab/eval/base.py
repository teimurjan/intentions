"""Base evaluator protocol."""

from abc import ABC, abstractmethod

from promptlab.schemas import DatasetExample, EvaluationResult


class BaseEvaluator(ABC):
    """Base class for task evaluators."""

    @abstractmethod
    def evaluate(self, output: str, example: DatasetExample) -> EvaluationResult:
        """Evaluate model output against example.

        Args:
            output: Model-generated output text
            example: Dataset example with input and optional reference

        Returns:
            EvaluationResult with score, format_passed, feedback, and metrics
        """
        ...

    def evaluate_batch(
        self, outputs: list[str], examples: list[DatasetExample]
    ) -> list[EvaluationResult]:
        """Evaluate batch of outputs."""
        return [self.evaluate(out, ex) for out, ex in zip(outputs, examples)]

    def aggregate_scores(self, results: list[EvaluationResult]) -> dict[str, float]:
        """Aggregate scores from multiple evaluations."""
        if not results:
            return {"mean_score": 0.0, "format_pass_rate": 0.0}

        scores = [r.score for r in results]
        format_passed = [r.format_passed for r in results]

        return {
            "mean_score": sum(scores) / len(scores),
            "format_pass_rate": sum(format_passed) / len(format_passed),
        }
