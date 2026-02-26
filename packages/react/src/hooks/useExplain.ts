import type { ExplainOptions } from "@intentions/client";
import { useCallback } from "react";
import { useClient } from "../context";

export function useExplain(): (term: string, options?: ExplainOptions) => Promise<string> {
  const client = useClient();

  return useCallback(
    async (term: string, options?: ExplainOptions) => {
      if (!client) throw new Error("Client not ready");
      return (await client.explain(term, options)).output;
    },
    [client],
  );
}
