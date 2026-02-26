"""Prompt variants for benchmarking - loaded from JSON."""

import json
from dataclasses import dataclass
from pathlib import Path

from promptlab.types import TaskType


@dataclass
class PromptVariant:
    system: str
    user: str
    thinking: bool = False


def _get_repo_root() -> Path:
    """Find the repo root by looking for CLAUDE.md and prompts/ directory."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "CLAUDE.md").exists() and (parent / "prompts").is_dir():
            return parent
    raise RuntimeError("Could not find repo root (no CLAUDE.md + prompts/ found)")


PROMPTS_DIR = _get_repo_root() / "prompts"


def _load_competitors() -> dict[str, list[PromptVariant]]:
    """Load competitors from JSON file."""
    path = PROMPTS_DIR / "competitors.json"
    if not path.exists():
        return {}

    with open(path) as f:
        data = json.load(f)

    result = {}
    for task_name, variants in data.items():
        result[task_name] = [
            PromptVariant(
                system=v["system"],
                user=v["user"],
                thinking=v.get("thinking", False),
            )
            for v in variants
        ]
    return result


def _load_winner(model_id: str, task_name: str) -> PromptVariant | None:
    """Load winner prompt for a specific model and task."""
    model_file = model_id.replace(":", "-").replace("/", "-").lower()
    path = PROMPTS_DIR / f"{model_file}.json"

    if not path.exists():
        return None

    with open(path) as f:
        data = json.load(f)

    tasks = data.get("tasks", {})
    task_data = tasks.get(task_name)
    if not task_data:
        return None

    return PromptVariant(
        system=task_data["system"],
        user=task_data["user"],
        thinking=task_data.get("thinking", False),
    )


def get_prompts_for_task(
    task_type: TaskType,
    model_id: str = "qwen3:0.6b",
) -> list[PromptVariant]:
    """Get all prompt variants (winner + competitors) for a task."""
    task_name = task_type.value
    competitors = _COMPETITORS.get(task_name, [])
    winner = _load_winner(model_id, task_name)

    if winner:
        return [winner] + competitors
    return competitors


_COMPETITORS = _load_competitors()

PROMPTS_BY_TASK: dict[TaskType, list[PromptVariant]] = {}
for task_type in TaskType:
    PROMPTS_BY_TASK[task_type] = get_prompts_for_task(task_type)


__all__ = [
    "PromptVariant",
    "PROMPTS_BY_TASK",
    "get_prompts_for_task",
]
