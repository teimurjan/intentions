/**
 * @intentions/react - useTooltip Hook
 *
 * Hook for AI-powered tooltip/explanation generation.
 */

import type { ExplainOptions, TextResult } from "@intentions/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useClient } from "../context";

/**
 * Options for useTooltip hook.
 */
export interface UseTooltipOptions {
  /** Text to explain (can be updated dynamically) */
  text?: string;
  /** Context to guide the explanation (e.g., "technical", "beginner-friendly") */
  context?: string;
  /** Maximum tokens for explanation */
  maxTokens?: number;
  /** Whether to fetch explanation immediately when text changes */
  fetchOnChange?: boolean;
  /** Debounce delay in ms before fetching (when fetchOnChange is true) */
  debounceMs?: number;
  /** Callback when explanation is generated */
  onExplain?: (result: TextResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Return value from useTooltip hook.
 */
export interface UseTooltipReturn {
  /** The generated explanation/tooltip content */
  explanation: string | null;
  /** Whether explanation is being fetched */
  isLoading: boolean;
  /** Last error from fetching */
  error: Error | null;
  /** Manually fetch explanation for given text (or current text) */
  explain: (text?: string) => Promise<TextResult | null>;
  /** Clear the current explanation */
  clear: () => void;
}

export function useTooltip(options: UseTooltipOptions = {}): UseTooltipReturn {
  const {
    text: initialText,
    context,
    maxTokens = 100,
    fetchOnChange = false,
    debounceMs = 300,
    onExplain,
    onError,
  } = options;

  const client = useClient();

  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string | null>(null);

  const clear = useCallback(() => {
    setExplanation(null);
    setError(null);
  }, []);

  const explain = useCallback(
    async (textToExplain?: string): Promise<TextResult | null> => {
      const text = textToExplain ?? initialText;

      if (!client || !text?.trim()) return null;

      // Skip if we already have an explanation for this exact text
      if (text === lastTextRef.current && explanation) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      const explainOptions: ExplainOptions = {
        context,
        maxTokens,
      };

      try {
        const result = await client.explain(text, explainOptions);
        setExplanation(result.output);
        lastTextRef.current = text;
        onExplain?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, initialText, context, maxTokens, explanation, onExplain, onError],
  );

  // Auto-fetch on text change if enabled
  useEffect(() => {
    if (!fetchOnChange || !initialText?.trim()) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up debounced fetch
    debounceTimerRef.current = setTimeout(() => {
      explain(initialText);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [initialText, fetchOnChange, debounceMs, explain]);

  return {
    explanation,
    isLoading,
    error,
    explain,
    clear,
  };
}
