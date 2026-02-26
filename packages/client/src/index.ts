/**
 * @intentions/client
 *
 * Headless AI UI client for browser environments.
 * Uses Vercel AI SDK with pluggable providers.
 */

export type {
  FormatParams,
  GenerateParams,
  OperationType,
  PromptStrategy,
} from "@intentions/prompt-strategies";
export {
  getAvailableModels,
  getStrategy,
  llama3Strategy,
  qwen3Strategy,
  registerStrategy,
} from "@intentions/prompt-strategies";

export type { ClientOptions } from "./client";
export { createClient } from "./client";

export type { IntentionsProvider, ProviderConfig, ProviderType } from "./provider";
export { createProvider } from "./provider";

export type {
  Client,
  CompletionOptions,
  ExplainOptions,
  HighlightedSegment,
  LoadProgress,
  LoadProgressHandler,
  ModelId,
  RankedItem,
  RewriteOptions,
  SearchInTextOptions,
  SearchItem,
  StreamChunk,
  StreamHandler,
  SummarizeOptions,
  TextChunk,
  TextResult,
} from "./types";
