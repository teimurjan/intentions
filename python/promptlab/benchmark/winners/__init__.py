"""Winner prompt loading from JSON files."""

import json
from pathlib import Path
from dataclasses import dataclass

from promptlab.types import TaskType


def _get_repo_root() -> Path:
    """Find the repo root by looking for CLAUDE.md and prompts/ directory."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "CLAUDE.md").exists() and (parent / "prompts").is_dir():
            return parent
    raise RuntimeError("Could not find repo root (no CLAUDE.md + prompts/ found)")


WINNERS_DIR = _get_repo_root() / "prompts"


@dataclass
class WinnerPrompt:
    system: str
    user: str
    score: float
    format_pass_rate: float
    benchmarked_at: str
    thinking: bool = False


@dataclass
class ModelWinners:
    model: str
    tasks: dict[TaskType, WinnerPrompt]


def normalize_model_id(model_id: str) -> str:
    """Normalize model ID to filename-safe format."""
    return model_id.replace(":", "-").replace("/", "-").lower()


def get_winners_path(model_id: str) -> Path:
    """Get path to winners JSON file for a model."""
    return WINNERS_DIR / f"{normalize_model_id(model_id)}.json"


def load_winners(model_id: str) -> ModelWinners | None:
    """Load winners for a specific model from JSON file."""
    path = get_winners_path(model_id)
    if not path.exists():
        return None

    with open(path) as f:
        data = json.load(f)

    tasks = {}
    for task_name, task_data in data.get("tasks", {}).items():
        try:
            task_type = TaskType(task_name)
        except ValueError:
            continue

        meta = task_data.get("meta", {})
        tasks[task_type] = WinnerPrompt(
            system=task_data["system"],
            user=task_data["user"],
            score=meta.get("score", 0.0),
            format_pass_rate=meta.get("format_pass_rate", 0.0),
            benchmarked_at=meta.get("benchmarked_at", ""),
            thinking=task_data.get("thinking", False),
        )

    return ModelWinners(model=data["model"], tasks=tasks)


def save_winner(
    model_id: str,
    task_type: TaskType,
    system: str,
    user: str,
    score: float,
    format_pass_rate: float,
    thinking: bool = False,
) -> None:
    """Save or update a winner for a specific task."""
    from datetime import date

    path = get_winners_path(model_id)

    if path.exists():
        with open(path) as f:
            data = json.load(f)
    else:
        data = {"model": model_id, "tasks": {}}

    task_data: dict = {
        "system": system,
        "user": user,
        "meta": {
            "score": score,
            "format_pass_rate": format_pass_rate,
            "benchmarked_at": date.today().isoformat(),
        },
    }
    if thinking:
        task_data["thinking"] = True

    data["tasks"][task_type.value] = task_data

    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_winner(model_id: str, task_type: TaskType) -> WinnerPrompt | None:
    """Get winner prompt for a specific model and task."""
    winners = load_winners(model_id)
    if winners is None:
        return None
    return winners.tasks.get(task_type)


def list_models() -> list[str]:
    """List all models with saved winners."""
    return [p.stem for p in WINNERS_DIR.glob("*.json") if p.stem != "competitors"]
