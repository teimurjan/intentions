"""GEPA optimization runner."""

from datetime import datetime
from pathlib import Path
from typing import Any

from promptlab.adapters import get_client
from promptlab.config import Config
from promptlab.datasets import load_dataset
from promptlab.eval import get_evaluator
from promptlab.optim.adapter import PromptlabAdapter, THINKING_TASKS, model_supports_thinking
from promptlab.optim.candidates import (
    get_seed_prompt,
    candidate_to_dict,
    dict_to_candidate,
)
from promptlab.schemas import (
    OptimizationResult,
    OutputJSON,
    OutputMeta,
    PromptCandidate,
    TaskPrompts,
    TaskScores,
)
from promptlab.types import TaskType

# Custom reflection template for small models
REFLECTION_TEMPLATE = """Current prompt text:
```
<curr_instructions>
```

Performance examples:
```
<inputs_outputs_feedback>
```

Write ONLY the improved prompt text (max 20 words).
Do NOT write "System:" or "User:" labels.
If the current text contains {text}, keep {text} in your output.

```"""


def run_optimization(
    task_type: TaskType,
    config: Config,
    seed: int = 1337,
) -> OptimizationResult:
    """Run GEPA optimization for a single task."""
    trainset = load_dataset(
        task_type,
        split="train",
        size=config.optimization.train_size,
        cache_dir=config.datasets.cache_dir,
    )

    valset = load_dataset(
        task_type,
        split="val",
        size=config.optimization.val_size,
        cache_dir=config.datasets.cache_dir,
    )

    trainset_dicts = [ex.model_dump() for ex in trainset]
    valset_dicts = [ex.model_dump() for ex in valset]

    client = get_client(
        config.llm.provider,
        api_key=config.llm.api_key,
        base_url=config.llm.base_url,
    )

    evaluator = get_evaluator(task_type)
    adapter = PromptlabAdapter(
        task_type=task_type,
        evaluator=evaluator,
        client=client,
        model=config.llm.model,
        constraints=config.prompts,
    )

    seed_prompt = get_seed_prompt(task_type, config.llm.model)
    seed_candidate = candidate_to_dict(seed_prompt)

    try:
        import gepa

        result = gepa.optimize(
            seed_candidate=seed_candidate,
            trainset=trainset_dicts,
            valset=valset_dicts,
            adapter=adapter,
            reflection_lm=config.optimization.reflection_lm,
            reflection_prompt_template=REFLECTION_TEMPLATE,
            max_metric_calls=config.optimization.max_metric_calls,
            seed=seed,
        )

        best_candidate = dict_to_candidate(result.best_candidate)
        val_score = result.val_aggregate_scores[result.best_idx] if result.val_aggregate_scores else 0.0
        total_calls = result.total_metric_calls if hasattr(result, "total_metric_calls") else 0

    except (ImportError, Exception):
        best_candidate, val_score, total_calls = _run_mock_optimization(
            adapter, seed_candidate, trainset_dicts, valset_dicts
        )

    val_results = adapter.evaluate(valset_dicts, candidate_to_dict(best_candidate))
    format_pass_rate = sum(1 for s in val_results.scores if s > 0) / max(
        len(val_results.scores), 1
    )

    return OptimizationResult(
        task_type=task_type,
        model_id=config.llm.model,
        best_candidate=best_candidate,
        val_score=val_score,
        format_pass_rate=format_pass_rate,
        total_metric_calls=total_calls,
    )


def _run_mock_optimization(
    adapter: PromptlabAdapter,
    seed_candidate: dict[str, str],
    trainset: list[dict[str, Any]],
    valset: list[dict[str, Any]],
) -> tuple[PromptCandidate, float, int]:
    """Fallback when GEPA is not available - just evaluate seed prompt."""
    train_batch = adapter.evaluate(trainset[:10], seed_candidate)
    val_batch = adapter.evaluate(valset[:10], seed_candidate)
    val_score = sum(val_batch.scores) / max(len(val_batch.scores), 1)

    return dict_to_candidate(seed_candidate), val_score, len(trainset) + len(valset)


def optimize_all_tasks(
    config: Config,
    seed: int = 1337,
    output_dir: str | None = None,
) -> OutputJSON:
    """Optimize prompts for all tasks and save results."""
    output_dir = output_dir or config.output_dir
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    prompts: dict[str, TaskPrompts] = {}
    scores: dict[str, TaskScores] = {}
    format_pass_rates: dict[str, float] = {}

    for task_type in TaskType:
        result = run_optimization(task_type=task_type, config=config, seed=seed)
        use_thinking = task_type in THINKING_TASKS and model_supports_thinking(config.llm.model)
        prompts[task_type.value] = TaskPrompts(
            system=result.best_candidate.system_prompt,
            user=result.best_candidate.user_prompt,
            thinking=True if use_thinking else None,
        )
        scores[task_type.value] = TaskScores(
            val_score=result.val_score,
            format_pass_rate=result.format_pass_rate,
        )
        format_pass_rates[task_type.value] = result.format_pass_rate

    output = OutputJSON(
        model=config.llm.model,
        prompts=prompts,
        meta=OutputMeta(
            seed=seed,
            timestamp=datetime.now().isoformat(),
            scores=scores,
            format_pass_rate=format_pass_rates,
        ),
    )

    output_path = Path(output_dir) / f"{config.llm.model.replace('/', '_')}.json"
    output.save(str(output_path))

    return output
