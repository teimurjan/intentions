"""Evaluator for rewrite task."""

from promptlab.eval.base import BaseEvaluator
from promptlab.eval.gates import RewriteGates
from promptlab.eval.metrics import rouge_l, semantic_preservation, token_f1
from promptlab.schemas import DatasetExample, EvaluationResult


class RewriteEvaluator(BaseEvaluator):
    """Evaluator for rewrite task: style adherence + meaning preservation."""

    def evaluate(self, output: str, example: DatasetExample) -> EvaluationResult:
        output = output.strip()

        format_passed, format_msg = RewriteGates.check(output, example.input_text)
        if not format_passed:
            return EvaluationResult(
                score=0.0,
                format_passed=False,
                feedback=f"Format violation: {format_msg}",
                metrics={"format_error": 1.0},
            )

        metrics: dict[str, float] = {}

        if example.reference:
            metrics["rouge_l"] = rouge_l(output, example.reference)
            metrics["token_f1"] = token_f1(output, example.reference)
        else:
            metrics["rouge_l"] = 0.5
            metrics["token_f1"] = 0.5

        metrics["meaning_preservation"] = semantic_preservation(output, example.input_text)

        length_ratio = len(output.split()) / max(len(example.input_text.split()), 1)
        metrics["length_ratio"] = min(length_ratio, 2.0) / 2.0

        if output.lower() == example.input_text.lower():
            metrics["unchanged_penalty"] = 1.0
            score = 0.1
        else:
            metrics["unchanged_penalty"] = 0.0
            if example.reference:
                score = (
                    0.4 * metrics["rouge_l"]
                    + 0.3 * metrics["meaning_preservation"]
                    + 0.2 * metrics["token_f1"]
                    + 0.1 * metrics["length_ratio"]
                )
            else:
                score = (
                    0.5 * metrics["meaning_preservation"]
                    + 0.3 * (1.0 - metrics["unchanged_penalty"])
                    + 0.2 * metrics["length_ratio"]
                )

        feedback_parts = []
        if metrics.get("rouge_l", 0) < 0.3:
            feedback_parts.append("Low similarity to reference")
        if metrics["meaning_preservation"] < 0.3:
            feedback_parts.append("Meaning may not be preserved")
        if metrics.get("unchanged_penalty", 0) > 0:
            feedback_parts.append("Output is identical to input")

        return EvaluationResult(
            score=score,
            format_passed=True,
            feedback="; ".join(feedback_parts) if feedback_parts else "Good rewrite",
            metrics=metrics,
        )
