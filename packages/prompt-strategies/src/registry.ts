/**
 * @intentions/prompt-strategies - Strategy Registry
 *
 * Registry for prompt strategies. Users select strategy by model ID.
 */

import { llama3Strategy } from "./strategies/llama";
import { qwen3Strategy } from "./strategies/qwen";
import type { PromptStrategy } from "./types";

/**
 * Available strategies by model ID.
 */
const strategies: Record<string, PromptStrategy> = {
  "llama3-1b": llama3Strategy,
  "qwen3-0.6b": qwen3Strategy,
};

/**
 * Get a strategy by model ID.
 * @throws Error if strategy not found
 */
export function getStrategy(modelId: string): PromptStrategy {
  const strategy = strategies[modelId];
  if (!strategy) {
    const available = Object.keys(strategies).join(", ");
    throw new Error(`Unknown model "${modelId}". Available: ${available}`);
  }
  return strategy;
}

/**
 * Get all available model IDs.
 */
export function getAvailableModels(): string[] {
  return Object.keys(strategies);
}

/**
 * Register a custom strategy.
 */
export function registerStrategy(modelId: string, strategy: PromptStrategy): void {
  strategies[modelId] = strategy;
}
