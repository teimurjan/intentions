"""Evaluator for completion task."""

from promptlab.eval.base import BaseEvaluator
from promptlab.eval.gates import CompleteGates
from promptlab.eval.metrics import repetition_score, rouge_l, token_overlap
from promptlab.schemas import DatasetExample, EvaluationResult


class CompleteEvaluator(BaseEvaluator):
    """Evaluator for completion task: anti-repetition + coherence."""

    def evaluate(self, output: str, example: DatasetExample) -> EvaluationResult:
        output = output.strip()

        format_passed, format_msg = CompleteGates.check(output, example.input_text)
        if not format_passed:
            return EvaluationResult(
                score=0.0,
                format_passed=False,
                feedback=f"Format violation: {format_msg}",
                metrics={"format_error": 1.0},
            )

        metrics: dict[str, float] = {}

        metrics["repetition"] = repetition_score(output)

        metrics["input_coherence"] = token_overlap(output, example.input_text)

        if example.reference:
            metrics["rouge_l"] = rouge_l(output, example.reference)
        else:
            metrics["rouge_l"] = 0.5

        word_count = len(output.split())
        if word_count < 5:
            metrics["length_penalty"] = word_count / 5
        elif word_count > 100:
            metrics["length_penalty"] = max(0.5, 1.0 - (word_count - 100) / 200)
        else:
            metrics["length_penalty"] = 1.0

        if example.reference:
            score = (
                0.3 * metrics["rouge_l"]
                + 0.3 * metrics["repetition"]
                + 0.2 * metrics["input_coherence"]
                + 0.2 * metrics["length_penalty"]
            )
        else:
            score = (
                0.4 * metrics["repetition"]
                + 0.3 * metrics["input_coherence"]
                + 0.3 * metrics["length_penalty"]
            )

        feedback_parts = []
        if metrics["repetition"] < 0.7:
            feedback_parts.append("High repetition detected")
        if metrics["input_coherence"] < 0.1:
            feedback_parts.append("Low coherence with input")
        if metrics["length_penalty"] < 0.5:
            feedback_parts.append("Output length is problematic")

        return EvaluationResult(
            score=score,
            format_passed=True,
            feedback="; ".join(feedback_parts) if feedback_parts else "Good completion",
            metrics=metrics,
        )
