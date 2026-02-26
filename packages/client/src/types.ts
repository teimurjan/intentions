/**
 * @intentions/client - Type definitions
 *
 * Core types for the headless UI system.
 */

export type ModelId = string;

/**
 * Options for text rewriting operations.
 */
export interface RewriteOptions {
  maxTokens?: number;
}

/**
 * Options for text completion operations.
 */
export interface CompletionOptions {
  maxTokens?: number;
}

/**
 * Options for text summarization operations.
 */
export interface SummarizeOptions {
  maxTokens?: number;
}

/**
 * Options for text explanation/tooltip generation.
 */
export interface ExplainOptions {
  context?: string;
  maxTokens?: number;
}

/**
 * Result from a text generation operation.
 */
export interface TextResult {
  output: string;
  modelId: ModelId;
  tokensIn?: number;
  tokensOut?: number;
}

/**
 * Single chunk from a streaming response.
 */
export interface StreamChunk {
  delta: string;
  done: boolean;
}

/**
 * Callback for handling stream chunks.
 */
export type StreamHandler = (chunk: StreamChunk) => void;

/**
 * Item that can be semantically searched/ranked.
 */
export interface SearchItem {
  id: string;
  label: string;
  keywords?: string[];
  description?: string;
}

/**
 * Search result with relevance score.
 */
export interface RankedItem<T = SearchItem> {
  item: T;
  score: number;
}

/**
 * A chunk of text with position and relevance score.
 */
export interface TextChunk {
  text: string;
  startOffset: number;
  endOffset: number;
  score: number;
}

/**
 * A segment of text for rendering with highlighting.
 */
export interface HighlightedSegment {
  text: string;
  isHighlight: boolean;
  score?: number;
}

/**
 * Progress callback for model loading.
 */
export interface LoadProgress {
  stage: "download" | "cache" | "init" | "compile" | "ready";
  progress: number;
  message: string;
  bytesLoaded?: number;
  bytesTotal?: number;
}

export type LoadProgressHandler = (progress: LoadProgress) => void;

/**
 * Options for text search.
 */
export interface SearchInTextOptions {
  chunkStrategy?: "sentences" | "paragraphs";
  maxResults?: number;
  minScore?: number;
}

/**
 * Main client interface.
 */
export interface Client {
  getActiveModel(): ModelId;
  setActiveModel(id: ModelId): void;

  rewriteFriendly(text: string, options?: RewriteOptions): Promise<TextResult>;
  rewriteConcise(text: string, options?: RewriteOptions): Promise<TextResult>;
  complete(prefix: string, options?: CompletionOptions): Promise<TextResult>;
  summarize(text: string, options?: SummarizeOptions): Promise<TextResult>;
  explain(text: string, options?: ExplainOptions): Promise<TextResult>;

  searchItems<T extends SearchItem = SearchItem>(
    query: string,
    items: T[],
    signal?: AbortSignal,
  ): Promise<RankedItem<T>[]>;

  searchInText(
    query: string,
    text: string,
    options?: SearchInTextOptions,
    signal?: AbortSignal,
  ): Promise<TextChunk[]>;

  embedChunks(chunks: string[], signal?: AbortSignal): Promise<number[][]>;
}
