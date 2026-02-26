/**
 * @intentions/prompt-strategies
 *
 * Pluggable prompt formatting strategies for different LLM families.
 * Handles model-specific prompt templates and response parsing.
 */

export type {
  ModelPrompts,
  PromptMeta,
  TaskPrompt,
} from "./prompts/loader";
// Prompt loader
export {
  getModelPrompts,
  getTaskPrompt,
  modelPrompts,
} from "./prompts/loader";
// Registry
export {
  getAvailableModels,
  getStrategy,
  registerStrategy,
} from "./registry";
// Built-in strategies
export { llama3Strategy } from "./strategies/llama";
export { qwen3Strategy } from "./strategies/qwen";

// Types
export type {
  CompleteInput,
  ExplainInput,
  FormatParams,
  GenerateParams,
  OperationInputMap,
  OperationType,
  PromptContent,
  PromptContentMap,
  PromptStrategy,
  RewriteConciseInput,
  RewriteFriendlyInput,
  SummarizeInput,
} from "./types";
