/**
 * @intentions/react - useSearch Hook
 *
 * Hook for semantic text search with highlighting.
 * Searches within a text body and returns matching chunks with highlights.
 */

import type { HighlightedSegment, TextChunk } from "@intentions/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "../context";

/**
 * Options for useSearch hook.
 */
export interface UseSearchOptions {
  /** Text body to search within */
  text: string;
  /** Initial search query */
  initialQuery?: string;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Maximum results to return */
  maxResults?: number;
  /** Minimum score threshold (0-1) */
  minScore?: number;
  /** Chunking strategy */
  chunkStrategy?: "sentences" | "paragraphs";
  /** Callback when search completes */
  onResults?: (results: TextChunk[]) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Return value from useSearch hook.
 */
export interface UseSearchReturn {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Matching text chunks with scores */
  results: TextChunk[];
  /** Text segments with highlighting info for rendering */
  highlightedText: HighlightedSegment[];
  /** Whether search is in progress */
  isSearching: boolean;
  /** Last error from search */
  error: Error | null;
  /** Manually trigger search */
  search: (query?: string) => Promise<TextChunk[]>;
  /** Clear results and query */
  clear: () => void;
}

function computeHighlightedSegments(text: string, results: TextChunk[]): HighlightedSegment[] {
  if (results.length === 0 || text.length === 0) {
    return [{ text, isHighlight: false }];
  }

  // Sort results by startOffset
  const sorted = [...results].sort((a, b) => a.startOffset - b.startOffset);

  const segments: HighlightedSegment[] = [];
  let cursor = 0;

  for (const chunk of sorted) {
    // Add non-highlighted text before this chunk
    if (chunk.startOffset > cursor) {
      segments.push({
        text: text.slice(cursor, chunk.startOffset),
        isHighlight: false,
      });
    }

    // Add highlighted chunk
    segments.push({
      text: chunk.text,
      isHighlight: true,
      score: chunk.score,
    });

    cursor = chunk.endOffset;
  }

  // Add remaining non-highlighted text
  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isHighlight: false,
    });
  }

  return segments;
}

export function useSearch(options: UseSearchOptions): UseSearchReturn {
  const {
    text,
    initialQuery = "",
    minQueryLength = 2,
    debounceMs = 300,
    maxResults = 5,
    minScore = 0.3,
    chunkStrategy = "sentences",
    onResults,
    onError,
  } = options;

  const client = useClient();

  const [query, setQueryInternal] = useState(initialQuery);
  const [results, setResults] = useState<TextChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");
  const lastTextRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (searchQuery?: string): Promise<TextChunk[]> => {
      const q = searchQuery ?? query;

      if (!client) return [];

      if (q.length < minQueryLength) {
        setResults([]);
        return [];
      }

      // Skip if same query and text
      if (q === lastQueryRef.current && text === lastTextRef.current) {
        return results;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      lastQueryRef.current = q;
      lastTextRef.current = text;
      setIsSearching(true);
      setError(null);

      try {
        const chunks = await client.searchInText(
          q,
          text,
          { chunkStrategy, maxResults, minScore },
          abortController.signal,
        );

        if (abortControllerRef.current !== abortController) return [];

        setResults(chunks);
        onResults?.(chunks);
        return chunks;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return [];
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return [];
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsSearching(false);
        }
      }
    },
    [
      client,
      query,
      text,
      minQueryLength,
      maxResults,
      minScore,
      chunkStrategy,
      onResults,
      onError,
      results,
    ],
  );

  const searchRef = useRef(search);
  searchRef.current = search;

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryInternal(newQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (newQuery.length < minQueryLength) {
        setResults([]);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        searchRef.current(newQuery);
      }, debounceMs);
    },
    [minQueryLength, debounceMs],
  );

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQueryInternal("");
    setResults([]);
    setError(null);
    lastQueryRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Re-search when text changes (and we have a query)
  useEffect(() => {
    if (query.length >= minQueryLength && client && text !== lastTextRef.current) {
      searchRef.current(query);
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const highlightedText = useMemo(() => computeHighlightedSegments(text, results), [text, results]);

  return {
    query,
    setQuery,
    results,
    highlightedText,
    isSearching,
    error,
    search,
    clear,
  };
}
