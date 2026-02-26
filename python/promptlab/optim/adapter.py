"""Custom GEPA adapter for promptlab task evaluation."""

from dataclasses import dataclass
from typing import Any

from gepa.core.adapter import EvaluationBatch, GEPAAdapter

from promptlab.adapters import LLMClient, get_client
from promptlab.config import PromptConstraints
from promptlab.eval import get_evaluator
from promptlab.eval.base import BaseEvaluator
from promptlab.optim.candidates import (
    dict_to_candidate,
    validate_placeholders,
)
from promptlab.schemas import CompletionRequest, DatasetExample
from promptlab.types import TaskType


@dataclass
class PromptTrace:
    """Trace data for a single evaluation."""
    input_text: str
    formatted_prompt: str
    output: str
    score: float
    feedback: str
    metrics: dict[str, float]


THINKING_TASKS = {
    TaskType.REWRITE_FRIENDLY,
    TaskType.REWRITE_CONCISE,
    TaskType.SUMMARIZE,
}

THINKING_MODELS = {"qwen"}


def model_supports_thinking(model: str) -> bool:
    """Check if model supports thinking mode."""
    model_lower = model.lower()
    return any(pattern in model_lower for pattern in THINKING_MODELS)


class PromptlabAdapter(GEPAAdapter):
    """GEPA adapter for promptlab task evaluation."""

    def __init__(
        self,
        task_type: TaskType,
        evaluator: BaseEvaluator | None = None,
        client: LLMClient | None = None,
        model: str = "gpt-4.1-mini",
        constraints: PromptConstraints | None = None,
        thinking: bool | None = None,
    ):
        self.task_type = task_type
        self.evaluator = evaluator or get_evaluator(task_type)
        self.client = client or get_client("mock")
        self.model = model
        self.constraints = constraints or PromptConstraints()
        if thinking is not None:
            self.thinking = thinking
        else:
            self.thinking = task_type in THINKING_TASKS and model_supports_thinking(model)

    def evaluate(
        self,
        batch: list[dict[str, Any]],
        candidate: dict[str, str],
        capture_traces: bool = False,
    ) -> EvaluationBatch:
        """Evaluate a prompt candidate on a batch of examples."""
        prompt_candidate = dict_to_candidate(candidate)

        valid, error = validate_placeholders(prompt_candidate, self.task_type)
        if not valid:
            n = len(batch)
            return EvaluationBatch(
                outputs=["" for _ in range(n)],
                scores=[0.0 for _ in range(n)],
                trajectories=[PromptTrace("", "", "", 0.0, error, {}) for _ in range(n)] if capture_traces else None,
            )

        length_penalty = self.compute_length_penalty(
            candidate.get("system_prompt", ""),
            candidate.get("user_prompt", ""),
        )

        outputs = []
        scores = []
        trajectories = []

        for ex_dict in batch:
            example = DatasetExample.model_validate(ex_dict)
            output, score, trace = self._evaluate_single(prompt_candidate, example, candidate)
            penalized_score = max(0.0, score - length_penalty)
            outputs.append(output)
            scores.append(penalized_score)
            if capture_traces:
                trace.score = penalized_score
                trajectories.append(trace)

        return EvaluationBatch(
            outputs=outputs,
            scores=scores,
            trajectories=trajectories if capture_traces else None,
        )

    def _evaluate_single(
        self,
        prompt_candidate: Any,
        example: DatasetExample,
        original_candidate: dict[str, str],
    ) -> tuple[str, float, PromptTrace]:
        """Evaluate single example."""
        try:
            user_prompt = self._format_user_prompt(prompt_candidate, example)

            request = CompletionRequest(
                model=self.model,
                system_prompt=original_candidate["system_prompt"],
                user_prompt=user_prompt,
                max_tokens=512,
                temperature=0.0,
                thinking=self.thinking,
            )

            response = self.client.complete_sync(request)
            output = response.text

            eval_result = self.evaluator.evaluate(output, example)

            trace = PromptTrace(
                input_text=example.input_text,
                formatted_prompt=user_prompt,
                output=output,
                score=eval_result.score,
                feedback=eval_result.feedback,
                metrics=eval_result.metrics,
            )

            return output, eval_result.score, trace

        except Exception as e:
            trace = PromptTrace(
                input_text=example.input_text,
                formatted_prompt="",
                output="",
                score=0.0,
                feedback=str(e),
                metrics={},
            )
            return "", 0.0, trace

    def _format_user_prompt(self, prompt_candidate: Any, example: DatasetExample) -> str:
        """Format user prompt with example data."""
        return prompt_candidate.user_prompt.format(text=example.input_text)

    def compute_length_penalty(self, system_prompt: str, user_prompt: str) -> float:
        """Compute penalty for prompts outside word limits (too short or too long)."""
        sys_words = len(system_prompt.split())
        user_words = len(user_prompt.split())

        penalty = 0.0

        # Penalize too long
        if sys_words > self.constraints.max_system_words:
            penalty += (sys_words - self.constraints.max_system_words) * self.constraints.length_penalty
        if user_words > self.constraints.max_user_words:
            penalty += (user_words - self.constraints.max_user_words) * self.constraints.length_penalty

        # Penalize too short
        if sys_words < self.constraints.min_system_words:
            penalty += (self.constraints.min_system_words - sys_words) * self.constraints.brevity_penalty
        if user_words < self.constraints.min_user_words:
            penalty += (self.constraints.min_user_words - user_words) * self.constraints.brevity_penalty

        return penalty

    def make_reflective_dataset(
        self,
        candidate: dict[str, str],
        eval_batch: EvaluationBatch,
        components_to_update: list[str],
    ) -> dict[str, list[dict[str, Any]]]:
        """Create dataset for reflection LLM to analyze."""
        result = {}
        trajectories = eval_batch.trajectories or []

        for component in components_to_update:
            dataset = []
            for i, trace in enumerate(trajectories):
                score = eval_batch.scores[i] if i < len(eval_batch.scores) else 0.0
                output = eval_batch.outputs[i] if i < len(eval_batch.outputs) else ""

                dataset.append({
                    "input": trace.input_text if isinstance(trace, PromptTrace) else str(trace),
                    "prompt": trace.formatted_prompt if isinstance(trace, PromptTrace) else "",
                    "output": output,
                    "score": score,
                    "feedback": trace.feedback if isinstance(trace, PromptTrace) else "",
                })
            result[component] = dataset

        return result
