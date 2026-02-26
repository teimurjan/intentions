/**
 * Llama 3.2 1B prompt strategy.
 * Loads prompts from central JSON source.
 */

import { getTaskPrompt } from "../prompts/loader";
import type { PromptContentMap, PromptStrategy } from "../types";

const MODEL_ID = "llama3-1b";

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export const llama3Strategy: PromptStrategy = {
  id: MODEL_ID,
  modelPattern: /llama/i,

  parseResponse(raw: string): string {
    return (
      raw
        // Remove Llama special tokens
        .replace(/<\|eot_id\|>/g, "")
        .replace(/<\|start_header_id\|>.*?<\|end_header_id\|>/g, "")
        .replace(/<\|begin_of_text\|>/g, "")
        .replace(/<\|end_of_text\|>/g, "")
        .trim()
    );
  },

  getDefaultParams() {
    return {
      maxTokens: 512,
      temperature: 0.7,
      topP: 0.9,
      stopSequences: ["<|eot_id|>", "<|end_of_text|>"],
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
