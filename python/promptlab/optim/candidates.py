"""Seed prompts and placeholder validation for optimization."""

import re

from promptlab.benchmark.winners import get_winner, WinnerPrompt
from promptlab.schemas import PromptCandidate
from promptlab.types import TaskType

REQUIRED_PLACEHOLDERS: dict[TaskType, set[str]] = {
    TaskType.REWRITE_FRIENDLY: {"text"},
    TaskType.REWRITE_CONCISE: {"text"},
    TaskType.COMPLETE: {"text"},
    TaskType.SUMMARIZE: {"text"},
    TaskType.EXPLAIN: {"text"},
}

FALLBACK_PROMPTS: dict[TaskType, PromptCandidate] = {
    TaskType.REWRITE_FRIENDLY: PromptCandidate(
        system_prompt="Make the text more polite and neutral. Output only the result.",
        user_prompt="Make friendly: {text}",
    ),
    TaskType.REWRITE_CONCISE: PromptCandidate(
        system_prompt="Shorten the text. Remove filler words. Output only the result.",
        user_prompt="Make concise: {text}",
    ),
    TaskType.COMPLETE: PromptCandidate(
        system_prompt="Continue the text naturally. Output only the continuation.",
        user_prompt="{text}",
    ),
    TaskType.SUMMARIZE: PromptCandidate(
        system_prompt="Summarize in 1-2 sentences. Be direct and factual.",
        user_prompt="Summarize:\n{text}",
    ),
    TaskType.EXPLAIN: PromptCandidate(
        system_prompt="Explain in 1-2 sentences. No preamble.",
        user_prompt="{text} means:",
    ),
}

DEFAULT_MODEL = "qwen3:0.6b"


def validate_placeholders(
    candidate: PromptCandidate, task_type: TaskType
) -> tuple[bool, str]:
    """Validate that a prompt candidate has correct placeholder structure."""
    required = REQUIRED_PLACEHOLDERS.get(task_type, set())
    if not required:
        return True, ""

    placeholder_pattern = r"\{(\w+)\}"

    # Check user_prompt has required placeholders
    found_in_user = set(re.findall(placeholder_pattern, candidate.user_prompt))
    missing = required - found_in_user
    if missing:
        return False, f"Missing required placeholders in user_prompt: {missing}"

    # Check system_prompt does NOT have {text} - that's only for user_prompt
    found_in_system = set(re.findall(placeholder_pattern, candidate.system_prompt))
    if "text" in found_in_system:
        return False, "system_prompt should not contain {text} placeholder"

    return True, ""


def get_seed_prompt(task_type: TaskType, model_id: str = DEFAULT_MODEL) -> PromptCandidate:
    """Get seed prompt for a task type, loading from JSON winners if available."""
    winner = get_winner(model_id, task_type)
    if winner:
        return winner_to_candidate(winner)

    if task_type in FALLBACK_PROMPTS:
        return FALLBACK_PROMPTS[task_type]

    raise ValueError(f"No seed prompt for task type: {task_type}")


def winner_to_candidate(winner: WinnerPrompt) -> PromptCandidate:
    """Convert a WinnerPrompt to PromptCandidate."""
    return PromptCandidate(
        system_prompt=winner.system,
        user_prompt=winner.user,
    )


def candidate_to_dict(candidate: PromptCandidate) -> dict[str, str]:
    """Convert PromptCandidate to dict for GEPA."""
    return {
        "system_prompt": candidate.system_prompt,
        "user_prompt": candidate.user_prompt,
    }


def _strip_labels(text: str) -> str:
    """Strip System:/User: labels that reflection LLM sometimes adds."""
    lines = text.strip().split("\n")
    cleaned = []
    for line in lines:
        # Remove leading System: or User: labels
        stripped = re.sub(r"^\s*(system|user)\s*:\s*", "", line, flags=re.IGNORECASE)
        if stripped:
            cleaned.append(stripped)
    return "\n".join(cleaned).strip()


def dict_to_candidate(d: dict[str, str]) -> PromptCandidate:
    """Convert dict from GEPA to PromptCandidate."""
    return PromptCandidate(
        system_prompt=_strip_labels(d.get("system_prompt", "")),
        user_prompt=_strip_labels(d.get("user_prompt", "")),
    )
