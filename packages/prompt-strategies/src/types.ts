/**
 * @intentions/prompt-strategies - Types
 *
 * Core types for pluggable prompt formatting and content generation.
 */

/**
 * Operation types that the client supports.
 * - rewrite_friendly: Make text more polite/friendly
 * - rewrite_concise: Make text shorter/more concise
 * - complete: Continue/autocomplete text
 * - summarize: Summarize text
 * - explain: Explain a term or concept
 */
export type OperationType =
  | "rewrite_friendly"
  | "rewrite_concise"
  | "complete"
  | "summarize"
  | "explain";

/**
 * Parameters for prompt formatting.
 */
export interface FormatParams {
  /** System prompt (instructions for the model) */
  systemPrompt?: string;
  /** User prompt (the actual task/question) */
  userPrompt: string;
  /** Optional prefix for assistant response (for guided generation) */
  assistantPrefix?: string;
}

/**
 * Generation parameters that strategies can customize.
 */
export interface GenerateParams {
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences?: string[];
  think?: boolean;
}

/**
 * Prompt content returned by prompt builders.
 */
export interface PromptContent {
  system: string;
  user: string;
  assistantPrefix?: string;
  thinking?: boolean;
}

/**
 * Input types for each operation.
 */
export interface RewriteFriendlyInput {
  text: string;
}

export interface RewriteConciseInput {
  text: string;
}

export interface CompleteInput {
  text: string;
}

export interface SummarizeInput {
  text: string;
}

export interface ExplainInput {
  text: string;
}

/**
 * Maps operation types to their input types.
 */
export type OperationInputMap = {
  rewrite_friendly: RewriteFriendlyInput;
  rewrite_concise: RewriteConciseInput;
  complete: CompleteInput;
  summarize: SummarizeInput;
  explain: ExplainInput;
};

/**
 * Map of operation types to their prompt builder functions.
 */
export type PromptContentMap = {
  [K in OperationType]?: (input: OperationInputMap[K]) => PromptContent;
};

/**
 * A prompt strategy defines how to format prompts for a specific model family.
 * Combines chat template formatting with model-appropriate prompt content.
 */
export interface PromptStrategy {
  /** Unique identifier for this strategy */
  readonly id: string;

  /** Regex pattern to match model IDs this strategy handles */
  readonly modelPattern: RegExp;

  /**
   * Format system + user prompts into model-specific chat template.
   * @deprecated AI SDK handles formatting - this is kept for backwards compatibility.
   */
  formatPrompt?(params: FormatParams): string;

  /**
   * Parse the raw model response.
   * Only removes model-specific tokens (e.g., <|end|>, </s>).
   * Does NOT strip content prefixes - that's controlled via prompt content.
   */
  parseResponse(raw: string): string;

  /**
   * Get default generation parameters for this model family.
   * Includes model-specific stop sequences.
   */
  getDefaultParams?(): Partial<GenerateParams>;

  /**
   * Get prompt builder for the specified operation.
   * Returns undefined to use default content.
   */
  getPromptContent?<K extends OperationType>(
    operation: K,
  ): ((input: OperationInputMap[K]) => PromptContent) | undefined;
}
