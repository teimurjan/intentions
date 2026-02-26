/**
 * @intentions/react
 *
 * React bindings for LLM-powered headless UI components.
 *
 * @packageDocumentation
 */

// Re-export core types for convenience
export type {
  CompletionOptions,
  ExplainOptions,
  HighlightedSegment,
  LoadProgress,
  RankedItem,
  RewriteOptions,
  SearchItem,
  SummarizeOptions,
  TextChunk,
  TextResult,
} from "@intentions/client";
// Context
export {
  type IntentionsContextValue,
  IntentionsProvider,
  type IntentionsProviderProps,
  useClient,
  useIntentionsContext,
  useReady,
} from "./context";
// Hooks
export {
  type UseRewriteReturn,
  type UseSearchOptions,
  type UseSearchReturn,
  type UseSelectOptions,
  type UseSelectReturn,
  type UseTooltipOptions,
  type UseTooltipReturn,
  useComplete,
  useExplain,
  useRewrite,
  useSearch,
  useSelect,
  useSummarize,
  useTooltip,
} from "./hooks/index";
