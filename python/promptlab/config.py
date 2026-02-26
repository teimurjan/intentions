"""Configuration loading from TOML and environment variables."""

import os
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

try:
    import tomli
except ImportError:
    import tomllib as tomli  # type: ignore[import-not-found,no-redef]

import tomli_w


class LLMConfig(BaseModel):
    """LLM provider configuration."""

    provider: str = "openai"
    api_key: str | None = None
    base_url: str | None = None
    model: str = "gpt-5.1-mini"


class OptimizationConfig(BaseModel):
    """Optimization settings."""

    max_metric_calls: int = 150
    seed: int = 1337
    train_size: int = 50
    val_size: int = 20
    task_lm: str = "openai/gpt-5.1-mini"
    reflection_lm: str = "openai/gpt-5.2"


class DatasetConfig(BaseModel):
    """Dataset loading configuration."""

    cache_dir: str = ".cache/datasets"


class PromptConstraints(BaseModel):
    """Prompt generation constraints for GEPA optimization."""

    min_system_words: int = 10
    max_system_words: int = 35
    min_user_words: int = 2
    max_user_words: int = 10
    length_penalty: float = 0.04
    brevity_penalty: float = 0.01


class Config(BaseModel):
    """Root configuration."""

    llm: LLMConfig = Field(default_factory=LLMConfig)
    optimization: OptimizationConfig = Field(default_factory=OptimizationConfig)
    datasets: DatasetConfig = Field(default_factory=DatasetConfig)
    prompts: PromptConstraints = Field(default_factory=PromptConstraints)
    output_dir: str = "out"


def load_config(config_path: str | Path | None = None) -> Config:
    """Load configuration from TOML file and environment variables."""
    config_dict: dict[str, Any] = {}

    paths_to_try = [
        config_path,
        Path("promptlab.toml"),
        Path.home() / ".config" / "promptlab" / "config.toml",
    ]

    for path in paths_to_try:
        if path and Path(path).exists():
            with open(path, "rb") as f:
                config_dict = tomli.load(f)
            break

    if "llm" not in config_dict:
        config_dict["llm"] = {}

    env_mappings = {
        "OPENAI_API_KEY": ("llm", "api_key"),
        "ANTHROPIC_API_KEY": ("llm", "api_key"),
        "PROMPTLAB_PROVIDER": ("llm", "provider"),
        "PROMPTLAB_MODEL": ("llm", "model"),
        "PROMPTLAB_BASE_URL": ("llm", "base_url"),
        "PROMPTLAB_SEED": ("optimization", "seed"),
        "PROMPTLAB_MAX_METRIC_CALLS": ("optimization", "max_metric_calls"),
        "PROMPTLAB_TASK_LM": ("optimization", "task_lm"),
        "PROMPTLAB_REFLECTION_LM": ("optimization", "reflection_lm"),
    }

    for env_var, (section, key) in env_mappings.items():
        value = os.environ.get(env_var)
        if value:
            if section not in config_dict:
                config_dict[section] = {}
            if key in ("seed", "max_metric_calls", "train_size", "val_size"):
                config_dict[section][key] = int(value)
            else:
                config_dict[section][key] = value

    return Config.model_validate(config_dict)


def save_config_template(path: str | Path) -> None:
    """Save a configuration template to a file."""
    template = {
        "llm": {
            "provider": "openai",
            "model": "gpt-5.1-mini",
            "base_url": None,
        },
        "optimization": {
            "max_metric_calls": 150,
            "seed": 1337,
            "train_size": 50,
            "val_size": 20,
            "task_lm": "openai/gpt-5.1-mini",
            "reflection_lm": "openai/gpt-5.2",
        },
        "datasets": {
            "cache_dir": ".cache/datasets",
        },
        "prompts": {
            "min_system_words": 10,
            "max_system_words": 35,
            "min_user_words": 2,
            "max_user_words": 10,
            "length_penalty": 0.04,
            "brevity_penalty": 0.01,
        },
        "output_dir": "promptlab/out",
    }
    with open(path, "wb") as f:
        tomli_w.dump(template, f)
