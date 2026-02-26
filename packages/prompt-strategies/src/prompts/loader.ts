/**
 * JSON prompt loader.
 * Loads prompts from the central prompts/ directory at repo root.
 */

import llama3 from "../../../../prompts/llama3.2-1b.json";
import qwen3 from "../../../../prompts/qwen3-0.6b.json";

export interface PromptMeta {
  score?: number;
  format_pass_rate?: number;
  benchmarked_at?: string;
}

export interface TaskPrompt {
  system: string;
  user: string;
  thinking?: boolean;
  meta?: PromptMeta;
}

export interface ModelPrompts {
  model: string;
  tasks: Record<string, TaskPrompt>;
}

export const modelPrompts: Record<string, ModelPrompts> = {
  "llama3-1b": llama3 as ModelPrompts,
  "qwen3-0.6b": qwen3 as ModelPrompts,
};

export function getModelPrompts(modelId: string): ModelPrompts | undefined {
  const normalizedId = modelId.replace(":", "-").replace("/", "-").toLowerCase();

  if (modelPrompts[normalizedId]) {
    return modelPrompts[normalizedId];
  }

  for (const [key, prompts] of Object.entries(modelPrompts)) {
    if (normalizedId.includes(key) || key.includes(normalizedId)) {
      return prompts;
    }
  }

  return undefined;
}

export function getTaskPrompt(modelId: string, task: string): TaskPrompt | undefined {
  const prompts = getModelPrompts(modelId);
  return prompts?.tasks[task];
}
