"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ModelType = "qwen" | "llama";

interface ProviderContextValue {
  provider: ModelType;
  setProvider: (provider: ModelType) => void;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderContextProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ModelType>("qwen");

  return (
    <ProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderContext() {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProviderContext must be used within ProviderContextProvider");
  }
  return context;
}
