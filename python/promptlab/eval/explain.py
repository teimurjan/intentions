"""Evaluator for explanation task."""

from promptlab.eval.base import BaseEvaluator
from promptlab.eval.gates import ExplainGates
from promptlab.eval.metrics import key_term_overlap, rouge_l
from promptlab.schemas import DatasetExample, EvaluationResult


class ExplainEvaluator(BaseEvaluator):
    """Evaluator for explanation task: length + key-term overlap."""

    def evaluate(self, output: str, example: DatasetExample) -> EvaluationResult:
        output = output.strip()

        format_passed, format_msg = ExplainGates.check(output, example.input_text)
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
            metrics["key_term_overlap"] = key_term_overlap(output, example.reference)
        else:
            metrics["rouge_l"] = 0.5
            metrics["key_term_overlap"] = 0.5

        word_count = len(output.split())
        if word_count < 10:
            metrics["length_score"] = word_count / 10
        elif word_count > 50:
            metrics["length_score"] = max(0.3, 1.0 - (word_count - 50) / 100)
        else:
            metrics["length_score"] = 1.0

        input_term = example.input_text.lower().strip()
        if input_term in output.lower():
            metrics["term_mentioned"] = 1.0
        else:
            input_words = input_term.split()
            mentioned = sum(1 for w in input_words if w in output.lower())
            metrics["term_mentioned"] = mentioned / max(len(input_words), 1)

        if example.reference:
            score = (
                0.35 * metrics["rouge_l"]
                + 0.25 * metrics["key_term_overlap"]
                + 0.2 * metrics["length_score"]
                + 0.2 * metrics["term_mentioned"]
            )
        else:
            score = (
                0.4 * metrics["length_score"]
                + 0.4 * metrics["term_mentioned"]
                + 0.2 * metrics.get("key_term_overlap", 0.5)
            )

        feedback_parts = []
        if metrics.get("rouge_l", 0) < 0.3 and example.reference:
            feedback_parts.append("Low similarity to reference explanation")
        if metrics["length_score"] < 0.5:
            feedback_parts.append("Explanation length is problematic")
        if metrics["term_mentioned"] < 0.5:
            feedback_parts.append("Input term not clearly addressed")

        return EvaluationResult(
            score=score,
            format_passed=True,
            feedback="; ".join(feedback_parts) if feedback_parts else "Good explanation",
            metrics=metrics,
        )
