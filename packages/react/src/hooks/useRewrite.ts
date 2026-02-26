import type { RewriteOptions } from "@intentions/client";
import { useMemo } from "react";
import { useClient } from "../context";

export interface UseRewriteReturn {
  friendly: (text: string, options?: RewriteOptions) => Promise<string>;
  concise: (text: string, options?: RewriteOptions) => Promise<string>;
}

export function useRewrite(): UseRewriteReturn {
  const client = useClient();

  return useMemo(
    () => ({
      friendly: async (text: string, options?: RewriteOptions) => {
        if (!client) throw new Error("Client not ready");
        return (await client.rewriteFriendly(text, options)).output;
      },
      concise: async (text: string, options?: RewriteOptions) => {
        if (!client) throw new Error("Client not ready");
        return (await client.rewriteConcise(text, options)).output;
      },
    }),
    [client],
  );
}
