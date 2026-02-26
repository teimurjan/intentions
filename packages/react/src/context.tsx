/**
 * @intentions/react - Context
 *
 * React context for providing client to components.
 */

import type { Client, LoadProgress } from "@intentions/client";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

/**
 * Context value.
 */
export interface IntentionsContextValue {
  /** The client instance */
  client: Client | null;
  /** Whether the client is initialized and ready */
  isReady: boolean;
  /** Whether the client is currently initializing */
  isLoading: boolean;
  /** Initialization error, if any */
  error: Error | null;
  /** Current load progress */
  progress: LoadProgress | null;
  /** Manually trigger initialization */
  initialize: () => Promise<void>;
}

const IntentionsContext = createContext<IntentionsContextValue | null>(null);

/**
 * Props for Provider.
 */
export interface IntentionsProviderProps {
  /** Client instance (from createClient) */
  client: Client & {
    initialize(): Promise<void>;
    isReady(): boolean;
    dispose(): Promise<void>;
  };
  /** Whether to auto-initialize on mount */
  autoInitialize?: boolean;
  /** Callback when initialization completes */
  onReady?: () => void;
  /** Callback when initialization fails */
  onError?: (error: Error) => void;
  /** External load progress (from client's onLoadProgress callback) */
  loadProgress?: LoadProgress | null;
  /** Children */
  children: ReactNode;
}

export function IntentionsProvider({
  client,
  autoInitialize = true,
  onReady,
  onError,
  loadProgress: externalProgress,
  children,
}: IntentionsProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<LoadProgress | null>(null);

  // Use external progress if provided, otherwise use internal state
  const effectiveProgress = externalProgress ?? progress;

  const initialize = useCallback(async () => {
    if (isReady || isLoading) return;

    setIsLoading(true);
    setError(null);
    setProgress({
      stage: "init",
      progress: 0,
      message: "Starting initialization...",
    });

    try {
      await client.initialize();
      setProgress({ stage: "ready", progress: 100, message: "Ready" });
      setIsReady(true);
      onReady?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [client, isReady, isLoading, onReady, onError]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize && !isReady && !isLoading && !error) {
      initialize();
    }
  }, [autoInitialize, isReady, isLoading, error, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      client.dispose().catch(() => {
        // Ignore dispose errors
      });
    };
  }, [client]);

  const value: IntentionsContextValue = {
    client: isReady ? client : null,
    isReady,
    isLoading,
    error,
    progress: effectiveProgress,
    initialize,
  };

  return <IntentionsContext.Provider value={value}>{children}</IntentionsContext.Provider>;
}

/**
 * Hook to access the context.
 *
 * @throws Error if used outside Provider
 */
export function useIntentionsContext(): IntentionsContextValue {
  const context = useContext(IntentionsContext);
  if (!context) {
    throw new Error("useContext must be used within an Provider");
  }
  return context;
}

/** Returns null if client is not ready. */
export function useClient(): Client | null {
  const { client } = useIntentionsContext();
  return client;
}

/**
 * Hook to check if client is ready.
 */
export function useReady(): boolean {
  const { isReady } = useIntentionsContext();
  return isReady;
}
