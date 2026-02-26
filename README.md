<p align="center">
  <img src="apps/website/public/logo.png" alt="intentions" width="120" height="120" />
</p>

<h1 align="center">intentions</h1>

<p align="center">
  LLM-powered headless UI primitives that run entirely in the browser.
</p>

<p align="center">
  Text rewriting, autocomplete, summarization, and explanations powered by local inference.
</p>

---

## Features

- **Privacy First** - All processing happens locally. No data leaves your device.
- **Zero Latency** - No network round-trips after model loads.
- **Headless** - Bring your own UI. We provide the logic.
- **React Hooks** - Simple, composable API for React applications.
- **Vanilla JS** - Framework-agnostic client for any JavaScript environment.
- **Optimized Prompts** - GEPA-tuned prompts for small language models.

## Packages

| Package | Description |
|---------|-------------|
| `@intentions/client` | Core client with Vercel AI SDK integration |
| `@intentions/react` | React hooks and context provider |
| `@intentions/prompt-strategies` | Model-specific prompt templates |

## Installation

```bash
# React
bun add @intentions/react @intentions/client @browser-ai/web-llm

# Vanilla JS
bun add @intentions/client @browser-ai/web-llm
```

## Quick Start

### React

```tsx
import { IntentionsProvider, useRewrite } from "@intentions/react";
import { createClient } from "@intentions/client";

const client = createClient({
  provider: "webllm",
  modelId: "Qwen3-0.6B-q4f16_1-MLC",
});

function App() {
  return (
    <IntentionsProvider client={client}>
      <TextEditor />
    </IntentionsProvider>
  );
}

function TextEditor() {
  const { friendly, concise } = useRewrite();

  const handleMakeFriendly = async () => {
    const result = await friendly("Send the report by Friday.");
    console.log(result); // "Could you please send the report by Friday?"
  };

  return <button onClick={handleMakeFriendly}>Make Friendly</button>;
}
```

### Vanilla JS

```ts
import { createClient } from "@intentions/client";

const client = createClient({
  provider: "webllm",
  modelId: "Qwen3-0.6B-q4f16_1-MLC",
});

await client.initialize();

const result = await client.rewrite("Send the report.", { tone: "friendly" });
console.log(result.text);
```

## API Reference

### Client Methods

```ts
// Text rewriting
client.rewrite(text, { tone: "friendly" | "concise" })

// Text completion
client.complete(text)

// Summarization
client.summarize(text)

// Explanation
client.explain(term)

// Semantic search
client.searchItems(query, items)
```

### React Hooks

```ts
// Rewriting with tone variants
const { friendly, concise } = useRewrite();

// Text completion
const complete = useComplete();

// Summarization
const summarize = useSummarize();

// Term explanation
const explain = useExplain();

// Semantic search over items
const { results, search } = useSearch(items);

// Selection with semantic matching
const { selected, onSelect } = useSelect(items);

// Tooltip explanations
const { content, show, hide } = useTooltip();
```

## Supported Models

The library works with WebLLM-compatible models. Tested and optimized for:

| Model | Size | Best For |
|-------|------|----------|
| Qwen3-0.6B | 522 MB | Fast responses, good quality |
| Llama-3.2-1B | 1.3 GB | Better reasoning, slightly slower |

## Prompt Optimization

Prompts are optimized using GEPA (Gradient-free Evolutionary Prompt Adaptation) to maximize quality on small models while staying within length constraints.

```bash
cd python
uv run promptlab optimize --models qwen3:0.6b --tasks explain
```

Optimized prompts are stored in `prompts/` and automatically loaded by the TypeScript runtime.

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Type check
bun run typecheck

# Format
bun run format
```

## Project Structure

```
intentions/
├── packages/
│   ├── client/           # Core client
│   ├── react/            # React bindings
│   └── prompt-strategies/ # Prompt templates
├── prompts/              # Optimized prompts (JSON)
├── python/               # GEPA optimization CLI
└── apps/
    └── website/          # Demo site
```

## License

MIT
