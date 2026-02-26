/**
 * @intentions/client - Client Factory
 *
 * Creates a high-level client for AI-powered text operations.
 * Uses Vercel AI SDK with pluggable prompt strategies.
 */

import { getStrategy, type PromptStrategy } from "@intentions/prompt-strategies";
import { embedMany, generateText } from "ai";
import {
  createEmbeddingProvider,
  createProvider,
  type IntentionsEmbeddingProvider,
  type IntentionsProvider,
  type ProviderType,
} from "./provider";
import type {
  Client,
  LoadProgressHandler,
  RankedItem,
  SearchInTextOptions,
  SearchItem,
  TextChunk,
} from "./types";

function chunkBySentences(
  text: string,
): { text: string; startOffset: number; endOffset: number }[] {
  const chunks: { text: string; startOffset: number; endOffset: number }[] = [];
  const regex = /[^.!?]*[.!?]+/g;

  for (const match of text.matchAll(regex)) {
    const sentence = match[0].trim();
    if (sentence.length > 0) {
      chunks.push({
        text: sentence,
        startOffset: match.index ?? 0,
        endOffset: (match.index ?? 0) + match[0].length,
      });
    }
  }

  // Handle trailing text without sentence-ending punctuation
  const lastMatch = chunks[chunks.length - 1];
  const lastEnd = lastMatch?.endOffset ?? 0;
  if (lastEnd < text.length) {
    const remaining = text.slice(lastEnd).trim();
    if (remaining.length > 0) {
      chunks.push({
        text: remaining,
        startOffset: lastEnd,
        endOffset: text.length,
      });
    }
  }

  return chunks;
}

function chunkByParagraphs(
  text: string,
): { text: string; startOffset: number; endOffset: number }[] {
  const chunks: { text: string; startOffset: number; endOffset: number }[] = [];
  const paragraphs = text.split(/\n\n+/);
  let offset = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length > 0) {
      const startOffset = text.indexOf(para, offset);
      chunks.push({
        text: trimmed,
        startOffset,
        endOffset: startOffset + para.length,
      });
      offset = startOffset + para.length;
    }
  }

  return chunks;
}

export interface ClientOptions {
  provider: ProviderType;
  modelId: string;
  strategyId?: string;
  worker?: Worker;
  onLoadProgress?: LoadProgressHandler;
  promptStrategy?: PromptStrategy;
  embeddingModelId?: string;
}

export function createClient(options: ClientOptions): Client & {
  initialize(onProgress?: LoadProgressHandler): Promise<void>;
  isReady(): boolean;
  dispose(): Promise<void>;
  getStrategy(): PromptStrategy;
  setStrategy(strategyIdOrStrategy: string | PromptStrategy): void;
} {
  let provider: IntentionsProvider | null = null;
  let embeddingProvider: IntentionsEmbeddingProvider | null = null;
  let initialized = false;

  const strategyId = options.strategyId ?? "qwen3-0.6b";
  let strategy: PromptStrategy = options.promptStrategy ?? getStrategy(strategyId);

  async function initialize(onProgress?: LoadProgressHandler): Promise<void> {
    const progressHandler = onProgress ?? options.onLoadProgress;

    progressHandler?.({
      stage: "init",
      progress: 0,
      message: "Creating provider...",
    });

    provider = await createProvider({
      type: options.provider,
      modelId: options.modelId,
      worker: options.worker,
      onProgress: (p) => {
        progressHandler?.({
          stage: p < 1 ? "download" : "ready",
          progress: Math.round(p * 100),
          message: p < 1 ? "Loading model..." : "Ready",
        });
      },
    });

    if (provider.initialize) {
      await provider.initialize((p) => {
        progressHandler?.({
          stage: p < 1 ? "download" : "ready",
          progress: Math.round(p * 100),
          message: p < 1 ? "Loading model..." : "Ready",
        });
      });
    }

    if (options.embeddingModelId) {
      progressHandler?.({
        stage: "init",
        progress: 50,
        message: "Loading embedding model...",
      });

      embeddingProvider = await createEmbeddingProvider({
        type: "transformers",
        modelId: options.embeddingModelId,
      });

      if (embeddingProvider.initialize) {
        await embeddingProvider.initialize((p) => {
          progressHandler?.({
            stage: p < 1 ? "download" : "ready",
            progress: Math.round(50 + p * 50),
            message: p < 1 ? "Loading embedding model..." : "Ready",
          });
        });
      }
    }

    initialized = true;
    progressHandler?.({ stage: "ready", progress: 100, message: "Ready" });
  }

  async function generate(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    thinking?: boolean,
  ): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
    if (!provider) throw new Error("Client not initialized");

    const params = strategy.getDefaultParams?.() ?? {};
    const enableThinking = thinking ?? params.think ?? false;

    const result = await generateText({
      model: provider.model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: maxTokens ?? params.maxTokens ?? 256,
      temperature: params.temperature ?? 0.0,
      providerOptions: {
        extra_body: {
          enable_thinking: enableThinking,
        },
      },
    });

    const parsedText = strategy.parseResponse(result.text);

    return {
      text: parsedText,
      tokensIn: result.usage?.inputTokens ?? 0,
      tokensOut: result.usage?.outputTokens ?? 0,
    };
  }

  function tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);
  }

  function cosineSimilarity(a: number[], b: number[]): number {
    if (!a?.length || !b?.length || a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i] ?? 0;
      const bi = b[i] ?? 0;
      dotProduct += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  return {
    getActiveModel: () => options.modelId,
    setActiveModel: () => {},

    initialize,
    isReady: () => initialized,
    dispose: async () => {
      provider = null;
      initialized = false;
    },
    getStrategy: () => strategy,
    setStrategy: (s) => {
      strategy = typeof s === "string" ? getStrategy(s) : s;
    },

    async rewriteFriendly(text, opts = {}) {
      const promptBuilder = strategy.getPromptContent?.("rewrite_friendly");
      const promptContent = promptBuilder?.({ text }) ?? {
        system:
          "Add 'please' or 'please note that' to make polite. Keep exact meaning. Output only result.",
        user: `Make friendly: ${text}`,
      };

      const result = await generate(
        promptContent.system,
        promptContent.user,
        opts.maxTokens ?? 256,
        promptContent.thinking,
      );
      return {
        output: result.text,
        modelId: options.modelId,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      };
    },

    async rewriteConcise(text, opts = {}) {
      const promptBuilder = strategy.getPromptContent?.("rewrite_concise");
      const promptContent = promptBuilder?.({ text }) ?? {
        system: "Remove filler words. Shorten without losing meaning. Output only result.",
        user: `Make concise: ${text}`,
      };

      const result = await generate(
        promptContent.system,
        promptContent.user,
        opts.maxTokens ?? 256,
        promptContent.thinking,
      );
      return {
        output: result.text,
        modelId: options.modelId,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      };
    },

    async complete(prefix, opts = {}) {
      const promptBuilder = strategy.getPromptContent?.("complete");
      const promptContent = promptBuilder?.({ text: prefix }) ?? {
        system: "Continue text naturally.",
        user: prefix,
      };

      const result = await generate(
        promptContent.system,
        promptContent.user,
        opts.maxTokens ?? 128,
        promptContent.thinking,
      );
      const completion = result.text;
      const output = completion.startsWith(prefix) ? completion : prefix + completion;

      return {
        output,
        modelId: options.modelId,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      };
    },

    async summarize(text, opts = {}) {
      const promptBuilder = strategy.getPromptContent?.("summarize");
      const promptContent = promptBuilder?.({ text }) ?? {
        system: "Summarize briefly.",
        user: `Summarize:\n${text}`,
      };

      const result = await generate(
        promptContent.system,
        promptContent.user,
        opts.maxTokens ?? 100,
        promptContent.thinking,
      );
      return {
        output: result.text,
        modelId: options.modelId,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      };
    },

    async explain(text, opts = {}) {
      const promptBuilder = strategy.getPromptContent?.("explain");
      const promptContent = promptBuilder?.({ text }) ?? {
        system: "Explain in 1-2 sentences.",
        user: `Explain: ${text}`,
      };

      const result = await generate(
        promptContent.system,
        promptContent.user,
        opts.maxTokens ?? 100,
        promptContent.thinking,
      );
      return {
        output: result.text,
        modelId: options.modelId,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
      };
    },

    async searchItems<T extends SearchItem>(
      query: string,
      items: T[],
      signal?: AbortSignal,
    ): Promise<RankedItem<T>[]> {
      if (items.length === 0) return [];
      if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");

      if (embeddingProvider && initialized) {
        try {
          const itemTexts = items.map((item) =>
            [item.label, item.description ?? "", ...(item.keywords ?? [])]
              .filter(Boolean)
              .join(" "),
          );

          const values = [query, ...itemTexts];

          const { embeddings } = await embedMany({
            model: embeddingProvider.model,
            values,
          });

          if (!embeddings || embeddings.length !== items.length + 1) {
            throw new Error("Invalid embeddings");
          }

          const queryEmbedding = embeddings[0];
          if (!queryEmbedding || queryEmbedding.length === 0) {
            throw new Error("Empty query embedding");
          }

          const queryLower = query.toLowerCase();
          const queryTokens = tokenize(query);

          const scored = items.map((item, i) => {
            const itemEmbedding = embeddings[i + 1];
            const embeddingScore = itemEmbedding
              ? cosineSimilarity(queryEmbedding, itemEmbedding)
              : 0;

            const searchText = itemTexts[i]?.toLowerCase() ?? "";
            let keywordBoost = 0;

            if (item.label.toLowerCase().includes(queryLower)) {
              keywordBoost = 0.3;
            } else if (item.keywords?.some((k) => k.toLowerCase().includes(queryLower))) {
              keywordBoost = 0.25;
            } else if (queryTokens.some((qt) => searchText.includes(qt))) {
              keywordBoost = 0.15;
            }

            const score = Math.min(embeddingScore + keywordBoost, 1);
            return { item, score };
          });

          scored.sort((a, b) => b.score - a.score);
          return scored;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") throw err;
        }
      }

      const queryWords = new Set(tokenize(query));
      if (queryWords.size === 0) {
        return items.map((item) => ({ item, score: 0 }));
      }

      const scored = items.map((item) => {
        const searchText = [item.label, item.description ?? "", ...(item.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        const itemWords = new Set(tokenize(searchText));

        let matchScore = 0;
        for (const qWord of queryWords) {
          if (itemWords.has(qWord)) matchScore += 1.0;
          else if (searchText.includes(qWord)) matchScore += 0.7;
          else {
            for (const itemWord of itemWords) {
              if (itemWord.startsWith(qWord) || qWord.startsWith(itemWord)) {
                matchScore += 0.5;
                break;
              }
            }
          }
        }

        return { item, score: Math.min(matchScore / queryWords.size, 1) };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored;
    },

    async embedChunks(chunks: string[], signal?: AbortSignal): Promise<number[][]> {
      if (!embeddingProvider || !initialized) {
        throw new Error("Embedding provider not initialized");
      }
      if (signal?.aborted) throw new DOMException("Embedding aborted", "AbortError");
      if (chunks.length === 0) return [];

      const { embeddings } = await embedMany({
        model: embeddingProvider.model,
        values: chunks,
      });

      return embeddings;
    },

    async searchInText(
      query: string,
      text: string,
      opts: SearchInTextOptions = {},
      signal?: AbortSignal,
    ): Promise<TextChunk[]> {
      if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");

      const { chunkStrategy = "sentences", maxResults = 5, minScore = 0.3 } = opts;

      const rawChunks =
        chunkStrategy === "paragraphs" ? chunkByParagraphs(text) : chunkBySentences(text);

      if (rawChunks.length === 0) return [];

      if (!embeddingProvider || !initialized) {
        throw new Error("Embedding provider not initialized for text search");
      }

      const chunkTexts = rawChunks.map((c) => c.text);
      const values = [query, ...chunkTexts];

      const { embeddings } = await embedMany({
        model: embeddingProvider.model,
        values,
      });

      if (!embeddings || embeddings.length !== values.length) {
        throw new Error("Invalid embeddings response");
      }

      const queryEmbedding = embeddings[0];
      if (!queryEmbedding || queryEmbedding.length === 0) {
        throw new Error("Empty query embedding");
      }

      const scored: TextChunk[] = rawChunks.map((chunk, i) => {
        const chunkEmbedding = embeddings[i + 1];
        const score = chunkEmbedding ? cosineSimilarity(queryEmbedding, chunkEmbedding) : 0;
        return {
          text: chunk.text,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          score,
        };
      });

      return scored
        .filter((c) => c.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
    },
  };
}
