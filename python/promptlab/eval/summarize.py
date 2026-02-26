"""Evaluator for summarization task."""

from promptlab.eval.base import BaseEvaluator
from promptlab.eval.gates import SummarizeGates
from promptlab.eval.metrics import brevity_score, key_term_overlap, rouge_l
from promptlab.schemas import DatasetExample, EvaluationResult


class SummarizeEvaluator(BaseEvaluator):
    """Evaluator for summarization task: ROUGE-L + brevity + no hallucination."""

    TARGET_WORDS = 30

    def evaluate(self, output: str, example: DatasetExample) -> EvaluationResult:
        output = output.strip()

        format_passed, format_msg = SummarizeGates.check(output, example.input_text)
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
        else:
            metrics["rouge_l"] = 0.5

        metrics["brevity"] = brevity_score(output, self.TARGET_WORDS, tolerance=0.5)

        metrics["key_term_coverage"] = key_term_overlap(output, example.input_text)

        output_terms = {w.lower() for w in output.split() if len(w) >= 4}
        input_terms = {w.lower() for w in example.input_text.split() if len(w) >= 4}
        novel_terms = output_terms - input_terms
        if output_terms:
            novel_ratio = len(novel_terms) / len(output_terms)
            metrics["hallucination_risk"] = novel_ratio
        else:
            metrics["hallucination_risk"] = 0.0

        hallucination_penalty = max(0.0, metrics["hallucination_risk"] - 0.3)

        if example.reference:
            score = (
                0.4 * metrics["rouge_l"]
                + 0.25 * metrics["brevity"]
                + 0.25 * metrics["key_term_coverage"]
                - 0.1 * hallucination_penalty
            )
        else:
            score = (
                0.4 * metrics["key_term_coverage"]
                + 0.4 * metrics["brevity"]
                - 0.2 * hallucination_penalty
            )

        score = max(0.0, min(1.0, score))

        feedback_parts = []
        if metrics.get("rouge_l", 0) < 0.3 and example.reference:
            feedback_parts.append("Low similarity to reference summary")
        if metrics["brevity"] < 0.5:
            feedback_parts.append("Summary length is not optimal")
        if metrics["hallucination_risk"] > 0.5:
            feedback_parts.append("Possible hallucination (novel terms)")
        if metrics["key_term_coverage"] < 0.2:
            feedback_parts.append("Missing key terms from input")

        return EvaluationResult(
            score=score,
            format_passed=True,
            feedback="; ".join(feedback_parts) if feedback_parts else "Good summary",
            metrics=metrics,
        )
