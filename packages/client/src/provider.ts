/**
 * @intentions/client - Provider Factory
 *
 * Creates AI providers from browser-ai.
 */

import type { EmbeddingModel, LanguageModel } from "ai";

export type ProviderType = "webllm";

export interface ProviderConfig {
  type: ProviderType;
  modelId: string;
  worker?: Worker;
  onProgress?: (progress: number) => void;
}

export interface EmbeddingProviderConfig {
  type: "transformers";
  modelId: string;
  worker?: Worker;
  onProgress?: (progress: number) => void;
}

export interface IntentionsProvider {
  model: LanguageModel;
  initialize?: (onProgress?: (progress: number) => void) => Promise<void>;
}

export interface IntentionsEmbeddingProvider {
  model: EmbeddingModel;
  initialize?: (onProgress?: (progress: number) => void) => Promise<void>;
}

export async function createProvider(config: ProviderConfig): Promise<IntentionsProvider> {
  if (config.type === "webllm") {
    const { webLLM } = await import("@browser-ai/web-llm");
    const model = webLLM(config.modelId, {
      worker: config.worker,
    });

    return {
      model: model as unknown as LanguageModel,
      initialize: async (onProgress?: (progress: number) => void) => {
        await model.createSessionWithProgress((p: number) => {
          onProgress?.(p);
        });
      },
    };
  }

  throw new Error(`Unknown provider type: ${config.type}`);
}

export async function createEmbeddingProvider(
  config: EmbeddingProviderConfig,
): Promise<IntentionsEmbeddingProvider> {
  if (config.type === "transformers") {
    const { transformersJS } = await import("@browser-ai/transformers-js");
    let model = transformersJS.embedding(config.modelId);

    return {
      get model() {
        return model as unknown as EmbeddingModel;
      },
      initialize: async (onProgress?: (progress: number) => void) => {
        const embeddingModel = model as unknown as {
          createSessionWithProgress?: (cb: (p: number) => void) => Promise<typeof model>;
        };

        if (typeof embeddingModel.createSessionWithProgress === "function") {
          const initializedModel = await embeddingModel.createSessionWithProgress((p: number) => {
            onProgress?.(p);
          });
          model = initializedModel as typeof model;
        } else {
          console.warn("[embedding] createSessionWithProgress not available");
        }
      },
    };
  }

  throw new Error(`Unknown embedding provider type: ${config.type}`);
}
