# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Overview

intentions is a monorepo for LLM-powered headless UI primitives that run entirely in the browser. It provides a vanilla JS client and React hooks for text rewriting, autocomplete, summarization, and explanations using local LLM inference via WebLLM.

## Commands

```bash
bun install              # Install dependencies
bun run build            # Build all packages in order
bun run typecheck        # Type-check all packages
bun run format           # Format code with Biome

# Python (promptlab)
cd python && uv run promptlab --help
uv run promptlab optimize --models qwen3:0.6b --tasks explain
uv run promptlab benchmark --model llama3.2:1b --tasks explain --num 20
```

## Architecture

### Package Dependency Graph

```
@intentions/prompt-strategies  (prompt templates per model family)
           |
@intentions/client  (Vercel AI SDK + WebLLM provider)
           |
@intentions/react  (React hooks)
```

### Key Abstractions

**Prompts** (`prompts/`): Single source of truth for model-specific prompts. Both Python (GEPA optimization) and TypeScript (runtime) read from these JSON files.

```
prompts/
├── qwen3-0.6b.json     # Optimized prompts for Qwen 0.6B
├── llama3-1b.json      # Optimized prompts for Llama 3.2 1B
└── competitors.json    # Benchmark competitor variants
```

**Prompt Strategy** (`packages/prompt-strategies/`): Loads prompts from JSON, handles model-specific response parsing (removing thinking tags, special tokens), provides default generation parameters.

**Client** (`packages/client/`): High-level API built on Vercel AI SDK. Methods: `rewrite()`, `complete()`, `summarize()`, `explain()`, `searchItems()`. Uses `@browser-ai/web-llm` for browser LLM inference.

**React Bindings** (`packages/react/`): `IntentionsProvider` wraps app with client context. Hooks: `useRewrite`, `useComplete`, `useSummarize`, `useExplain`, `useSearch`, `useSelect`, `useTooltip`.

**PromptLab** (`python/promptlab/`): CLI for GEPA-based prompt optimization. Benchmarks prompt variants, saves winners to `prompts/`.

### Task Types

Five supported operations:
- `rewrite_friendly` - Make text warm and polite
- `rewrite_concise` - Remove filler words, shorten
- `complete` - Continue text naturally
- `summarize` - Extract main point in 1-2 sentences
- `explain` - Define or explain a term

### Supported Models

WebLLM (browser):
- `Qwen3-0.6B-q4f16_1-MLC`
- `Llama-3.2-1B-Instruct-q4f16_1-MLC`

Ollama (local server, for optimization):
- `qwen3:0.6b`
- `llama3.2:1b`

## Prompts

### Winner Schema (`prompts/<model>.json`)

```json
{
  "model": "qwen3:0.6b",
  "tasks": {
    "rewrite_friendly": {
      "system": "Make the text warm and polite...",
      "user": "Make friendly: {text}",
      "thinking": true,
      "meta": { "score": 0.61, "format_pass_rate": 1.0 }
    }
  }
}
```

### Prompt Constraints

GEPA optimization enforces medium-length prompts optimal for small models:
- System prompt: 8-40 words
- User prompt: 2-15 words
- Penalties for prompts too short (lacks guidance) or too long (confuses model)

### Adding/Optimizing Prompts

1. Add competitor variants to `prompts/competitors.json`
2. Run optimization: `uv run promptlab optimize --models <model> --tasks <task>`
3. Winners auto-saved to `prompts/<model>.json`
4. Rebuild TypeScript: `bun run build`

## Development

- Use Bun exclusively for TypeScript
- Use uv for Python
- Prompts JSON is the single source of truth
- Both runtimes load from `prompts/` directory
