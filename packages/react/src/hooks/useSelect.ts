/**
 * @intentions/react - useSelect Hook
 *
 * Hook for LLM-powered semantic option selection.
 * Includes inline search logic for item ranking.
 */

import type { RankedItem, SearchItem } from "@intentions/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "../context";

/**
 * Options for useSelect hook.
 */
export interface UseSelectOptions<T extends SearchItem> {
  /** Items to search over */
  items: T[];
  /** Initial search query */
  initialQuery?: string;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Maximum results to return (0 = all) */
  maxResults?: number;
  /** Minimum score threshold (0-1) */
  minScore?: number;
  /** Currently selected item */
  selected?: T | null;
  /** Callback when selection changes */
  onSelect?: (item: T | null) => void;
  /** Allow clearing selection */
  allowClear?: boolean;
  /** Close dropdown on select */
  closeOnSelect?: boolean;
  /** Callback on search error */
  onError?: (error: Error) => void;
}

/**
 * Return value from useSelect hook.
 */
export interface UseSelectReturn<T extends SearchItem> {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Filtered/ranked options */
  options: RankedItem<T>[];
  /** Currently selected item */
  selected: T | null;
  /** Select an item */
  select: (item: T | null) => void;
  /** Whether search is in progress */
  isSearching: boolean;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Open dropdown */
  open: () => void;
  /** Close dropdown */
  close: () => void;
  /** Toggle dropdown */
  toggle: () => void;
  /** Last error */
  error: Error | null;
  /** Clear selection and query */
  clear: () => void;
  /** Highlighted option index */
  highlightedIndex: number;
  /** Set highlighted index */
  setHighlightedIndex: (index: number) => void;
  /** Select highlighted option */
  selectHighlighted: () => void;
  /** Move highlight up */
  highlightPrevious: () => void;
  /** Move highlight down */
  highlightNext: () => void;
  /** Get props for input element */
  getInputProps: () => InputProps;
  /** Get props for option element */
  getOptionProps: (option: RankedItem<T>, index: number) => OptionProps;
}

interface InputProps {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: { key: string; preventDefault: () => void }) => void;
  role: "combobox";
  "aria-expanded": boolean;
  "aria-haspopup": "listbox";
  "aria-autocomplete": "list";
}

interface OptionProps {
  role: "option";
  "aria-selected": boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function useSelect<T extends SearchItem = SearchItem>(
  options: UseSelectOptions<T>,
): UseSelectReturn<T> {
  const {
    items,
    initialQuery = "",
    minQueryLength = 1,
    debounceMs = 200,
    maxResults = 0,
    minScore = 0,
    selected: controlledSelected,
    onSelect,
    allowClear = true,
    closeOnSelect = true,
    onError,
  } = options;

  const client = useClient();

  // Search state (inlined from useSearch)
  const [query, setQueryInternal] = useState(initialQuery);
  const [results, setResults] = useState<RankedItem<T>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Selection state
  const [internalSelected, setInternalSelected] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selected = controlledSelected !== undefined ? controlledSelected : internalSelected;

  // Search function (inlined from useSearch)
  const search = useCallback(
    async (searchQuery: string): Promise<RankedItem<T>[]> => {
      if (!client) return [];

      if (searchQuery.length < minQueryLength) {
        setResults([]);
        return [];
      }

      if (searchQuery === lastQueryRef.current) return [];

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      lastQueryRef.current = searchQuery;
      setIsSearching(true);
      setError(null);

      try {
        let ranked = await client.searchItems(searchQuery, items, abortController.signal);

        if (abortControllerRef.current !== abortController) return [];

        if (minScore > 0) {
          ranked = ranked.filter((r) => r.score >= minScore);
        }

        if (maxResults > 0) {
          ranked = ranked.slice(0, maxResults);
        }

        setResults(ranked);
        return ranked;
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
    [client, items, minQueryLength, maxResults, minScore, onError],
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

      if (newQuery && !isOpen) {
        setIsOpen(true);
      }
    },
    [minQueryLength, debounceMs, isOpen],
  );

  const clearSearch = useCallback(() => {
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

  // Re-search when items change
  useEffect(() => {
    if (query.length >= minQueryLength && client) {
      searchRef.current(query);
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show all items when query is empty but dropdown is open
  const displayOptions = useMemo(() => {
    if (!query && isOpen) {
      return items.map((item) => ({ item, score: 1 }));
    }
    return results;
  }, [query, isOpen, items, results]);

  const select = useCallback(
    (item: T | null) => {
      if (controlledSelected === undefined) {
        setInternalSelected(item);
      }
      onSelect?.(item);
      setQueryInternal(item?.label ?? "");

      if (closeOnSelect) {
        setIsOpen(false);
      }
      setHighlightedIndex(-1);
    },
    [controlledSelected, onSelect, closeOnSelect],
  );

  const open = useCallback(() => {
    setIsOpen(true);
    setHighlightedIndex(-1);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const clear = useCallback(() => {
    if (allowClear) {
      select(null);
      clearSearch();
    }
  }, [allowClear, select, clearSearch]);

  const highlightPrevious = useCallback(() => {
    setHighlightedIndex((prev) => (prev <= 0 ? displayOptions.length - 1 : prev - 1));
  }, [displayOptions.length]);

  const highlightNext = useCallback(() => {
    setHighlightedIndex((prev) => (prev >= displayOptions.length - 1 ? 0 : prev + 1));
  }, [displayOptions.length]);

  const selectHighlighted = useCallback(() => {
    if (highlightedIndex >= 0 && highlightedIndex < displayOptions.length) {
      select(displayOptions[highlightedIndex]!.item);
    }
  }, [highlightedIndex, displayOptions, select]);

  const getInputProps = useCallback(
    (): InputProps => ({
      value: query,
      onChange: (e) => setQuery(e.target.value),
      onFocus: open,
      onBlur: () => {
        setTimeout(close, 150);
      },
      onKeyDown: (e) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            if (!isOpen) {
              open();
            } else {
              highlightNext();
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            highlightPrevious();
            break;
          case "Enter":
            e.preventDefault();
            if (isOpen && highlightedIndex >= 0) {
              selectHighlighted();
            }
            break;
          case "Escape":
            e.preventDefault();
            close();
            break;
          case "Backspace":
            if (!query && selected && allowClear) {
              clear();
            }
            break;
        }
      },
      role: "combobox",
      "aria-expanded": isOpen,
      "aria-haspopup": "listbox",
      "aria-autocomplete": "list",
    }),
    [
      query,
      setQuery,
      open,
      close,
      isOpen,
      highlightedIndex,
      highlightNext,
      highlightPrevious,
      selectHighlighted,
      selected,
      allowClear,
      clear,
    ],
  );

  const getOptionProps = useCallback(
    (option: RankedItem<T>, index: number): OptionProps => ({
      role: "option",
      "aria-selected": selected?.id === option.item.id,
      onClick: () => select(option.item),
      onMouseEnter: () => setHighlightedIndex(index),
    }),
    [selected, select],
  );

  return {
    query,
    setQuery,
    options: displayOptions,
    selected,
    select,
    isSearching,
    isOpen,
    open,
    close,
    toggle,
    error,
    clear,
    highlightedIndex,
    setHighlightedIndex,
    selectHighlighted,
    highlightPrevious,
    highlightNext,
    getInputProps,
    getOptionProps,
  };
}
