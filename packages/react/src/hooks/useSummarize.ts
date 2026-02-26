import type { SummarizeOptions } from "@intentions/client";
import { useCallback } from "react";
import { useClient } from "../context";

export function useSummarize(): (text: string, options?: SummarizeOptions) => Promise<string> {
  const client = useClient();

  return useCallback(
    async (text: string, options?: SummarizeOptions) => {
      if (!client) throw new Error("Client not ready");
      return (await client.summarize(text, options)).output;
    },
    [client],
  );
}
