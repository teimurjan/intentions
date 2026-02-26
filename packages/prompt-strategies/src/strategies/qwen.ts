/**
 * Qwen 3 0.6B prompt strategy.
 * Loads prompts from central JSON source, optimized via GEPA benchmarking.
 */

import { getTaskPrompt } from "../prompts/loader";
import type { PromptContentMap, PromptStrategy } from "../types";

const MODEL_ID = "qwen3-0.6b";

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export const qwen3Strategy: PromptStrategy = {
  id: MODEL_ID,
  modelPattern: /qwen/i,

  parseResponse(raw: string): string {
    return (
      raw
        // Remove thinking blocks
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/<think>[\s\S]*/g, "")
        // Remove Qwen special tokens
        .replace(/<\|im_end\|>/g, "")
        .replace(/<\|im_start\|>assistant\n?/g, "")
        .replace(/<\|im_start\|>user\n?/g, "")
        .replace(/<\|im_start\|>system\n?/g, "")
        .replace(/<\|endoftext\|>/g, "")
        // Remove ALL XML-like tags (garbage from small model)
        .replace(/<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g, "")
        .trim()
    );
  },

  getDefaultParams() {
    return {
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9,
      stopSequences: ["<|im_end|>", "<|im_start|>", "<|endoftext|>"],
      think: false,
    };
  },

  getPromptContent(operation) {
    const taskPrompt = getTaskPrompt(MODEL_ID, operation);
    if (!taskPrompt) return undefined;

    const content: PromptContentMap = {
      rewrite_friendly: ({ text }) => ({
        system: taskPrompt.system,
        user: interpolate(taskPrompt.user, { text }),
        thinking: taskPrompt.thinking,
      }),
      rewrite_concise: ({ text }) => ({
        system: taskPrompt.system,
        user: interpolate(taskPrompt.user, { text }),
        thinking: taskPrompt.thinking,
      }),
      complete: ({ text }) => ({
        system: taskPrompt.system,
        user: interpolate(taskPrompt.user, { text }),
        thinking: taskPrompt.thinking,
      }),
      summarize: ({ text }) => ({
        system: taskPrompt.system,
        user: interpolate(taskPrompt.user, { text }),
        thinking: taskPrompt.thinking,
      }),
      explain: ({ text }) => ({
        system: taskPrompt.system,
        user: interpolate(taskPrompt.user, { text }),
        thinking: taskPrompt.thinking,
      }),
    };

    return content[operation];
  },
};
