# Promptlab

GEPA-based prompt optimization for LLM tasks.

## Installation

```bash
cd promptlab && uv sync
```

## Quick Start

```bash
# Initialize config
uv run promptlab init-config

# Run optimization with mock model (no API keys needed)
uv run promptlab optimize --models mock-model --seed 1337

# Run optimization with real models
uv run promptlab optimize --models gpt-4.1-mini --seed 1337
```

## Tasks

Promptlab optimizes prompts for 5 task types:

- **rewrite**: Rewrite text in different tones (formal, casual, friendly)
- **complete**: Continue text naturally
- **summarize**: Summarize text briefly (max 60 words)
- **explain**: Explain concepts in 1-2 sentences
- **search**: Rank items by relevance to query

## Output

Optimized prompts are saved to `promptlab/out/<model>.json`:

```json
{
  "model": "gpt-4.1",
  "prompts": {
    "rewrite": {
      "system": "...",
      "user": "Rewrite {tone}:\n{text}",
      "tones": {
        "formal": {"system": "...", "user": "..."},
        "casual": {"system": "...", "user": "..."},
        "friendly": {"system": "...", "user": "..."}
      }
    },
    "complete": {"system": "...", "user": "{text}"},
    "summarize": {"system": "...", "user": "..."},
    "explain": {"system": "...", "user": "..."},
    "search": {"system": "...", "user": "..."}
  },
  "meta": {
    "seed": 1337,
    "timestamp": "...",
    "scores": {...}
  }
}
```

## Configuration

Create `promptlab.toml` from the example:

```bash
cp promptlab.toml.example promptlab.toml
```

Or use environment variables:

- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `PROMPTLAB_PROVIDER`: LLM provider (openai, anthropic, ollama, mock)
- `PROMPTLAB_MODEL`: Model ID
- `PROMPTLAB_SEED`: Random seed

## Development

```bash
# Install dev dependencies
uv sync --all-extras

# Run tests
uv run pytest tests/ -v

# Type check
uv run pyright

# Format
uv run ruff format .
```
