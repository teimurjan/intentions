import type { CompletionOptions } from "@intentions/client";
import { useCallback } from "react";
import { useClient } from "../context";

export function useComplete(): (text: string, options?: CompletionOptions) => Promise<string> {
  const client = useClient();

  return useCallback(
    async (text: string, options?: CompletionOptions) => {
      if (!client) throw new Error("Client not ready");
      return (await client.complete(text, options)).output;
    },
    [client],
  );
}
