"""Pydantic models for all data types."""

from datetime import datetime

from pydantic import BaseModel, Field

from promptlab.types import TaskType


class PromptCandidate(BaseModel):
    """A prompt candidate with system and user templates."""

    system_prompt: str
    user_prompt: str

    def format_user(self, **kwargs: str) -> str:
        """Format user prompt with provided values."""
        return self.user_prompt.format(**kwargs)

    def get_placeholders(self) -> set[str]:
        """Extract placeholder names from user prompt."""
        import re

        return set(re.findall(r"\{(\w+)\}", self.user_prompt))


class CompletionRequest(BaseModel):
    """Request for LLM completion."""

    model: str
    system_prompt: str
    user_prompt: str
    max_tokens: int = 512
    temperature: float = 0.7
    thinking: bool = False


class CompletionResponse(BaseModel):
    """Response from LLM completion."""

    text: str
    tokens_used: int = 0
    model: str = ""


class DatasetExample(BaseModel):
    """Single example from a dataset."""

    task_type: TaskType
    input_text: str
    reference: str | None = None


class EvaluationResult(BaseModel):
    """Result of evaluating a single example."""

    score: float = Field(ge=0.0, le=1.0)
    format_passed: bool = True
    feedback: str = ""
    metrics: dict[str, float] = Field(default_factory=dict)


class TaskScores(BaseModel):
    """Scores for a single task."""

    val_score: float
    format_pass_rate: float
    metric_details: dict[str, float] = Field(default_factory=dict)


class TonePrompts(BaseModel):
    """Tone-specific prompts for rewrite task."""

    system: str
    user: str


class TaskPrompts(BaseModel):
    """Prompts for a single task type."""

    system: str
    user: str
    thinking: bool | None = None
    tones: dict[str, TonePrompts] | None = None


class OptimizationResult(BaseModel):
    """Result of optimizing prompts for a task."""

    task_type: TaskType
    model_id: str
    best_candidate: PromptCandidate
    val_score: float
    format_pass_rate: float
    total_metric_calls: int


class OutputMeta(BaseModel):
    """Metadata in output JSON."""

    seed: int
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    scores: dict[str, TaskScores]
    format_pass_rate: dict[str, float]


class OutputJSON(BaseModel):
    """Full output JSON structure."""

    model: str
    prompts: dict[str, TaskPrompts]
    meta: OutputMeta

    def save(self, path: str) -> None:
        """Save to JSON file."""
        import json
        from pathlib import Path

        Path(path).write_text(json.dumps(self.model_dump(exclude_none=True), indent=2))

    @classmethod
    def load(cls, path: str) -> "OutputJSON":
        """Load from JSON file."""
        import json
        from pathlib import Path

        return cls.model_validate(json.loads(Path(path).read_text()))
