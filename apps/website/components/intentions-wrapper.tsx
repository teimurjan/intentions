"use client";

import { Alert } from "@heroui/alert";
import { Skeleton } from "@heroui/skeleton";
import { addToast, closeToast } from "@heroui/toast";
import { createClient, type LoadProgress } from "@intentions/client";
import { IntentionsProvider, useIntentionsContext } from "@intentions/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { ModelType } from "@/contexts/provider-context";

interface IntentionsWrapperProps {
  provider: ModelType;
  children: ReactNode;
}

function DemoSkeleton() {
  return (
    <section className="py-24 border-t border-zinc-800/50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <Skeleton className="h-12 w-48 rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-8 w-64 rounded-lg mt-4" />
          </div>
          <div className="rounded-2xl bg-zinc-900/50 p-8 min-h-[320px]">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingSkeletons() {
  return (
    <>
      <DemoSkeleton />
      <DemoSkeleton />
      <DemoSkeleton />
      <DemoSkeleton />
    </>
  );
}

function ContentWrapper({ children }: { children: ReactNode }) {
  const { isReady, isLoading, error, progress } = useIntentionsContext();
  const lastMessageRef = useRef<string | null>(null);
  const lastToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (progress?.message && progress.message !== lastMessageRef.current) {
      lastMessageRef.current = progress.message;
      if (lastToastKeyRef.current) {
        closeToast(lastToastKeyRef.current);
      }
      lastToastKeyRef.current = addToast({
        title: "Loading model",
        description: progress.message,
        timeout: 3000,
      });
    }
  }, [progress?.message]);

  useEffect(() => {
    if (isReady) {
      if (lastToastKeyRef.current) {
        closeToast(lastToastKeyRef.current);
      }
      lastToastKeyRef.current = addToast({
        title: "Ready",
        description: "Model loaded successfully",
        color: "success",
        timeout: 2000,
      });
    }
  }, [isReady]);

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <Alert color="danger" title="Initialization Error">
          {error.message}
        </Alert>
      </div>
    );
  }

  const ready = isReady && !isLoading;

  return (
    <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
      <div
        className={`transition-opacity duration-300 ${ready ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <LoadingSkeletons />
      </div>
      <div
        className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {children}
      </div>
    </div>
  );
}

const modelIds: Record<ModelType, string> = {
  qwen: "Qwen3-0.6B-q4f16_1-MLC",
  llama: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
};

export default function IntentionsWrapper({ provider, children }: IntentionsWrapperProps) {
  const modelId = modelIds[provider];
  const [loadProgress, setLoadProgress] = useState<LoadProgress | null>(null);

  useEffect(() => {
    setLoadProgress(null);
  }, [provider]);

  const client = useMemo(() => {
    return createClient({
      provider: "webllm",
      modelId,
      onLoadProgress: setLoadProgress,
    });
  }, [modelId]);

  return (
    <IntentionsProvider key={provider} client={client} loadProgress={loadProgress}>
      <ContentWrapper>{children}</ContentWrapper>
    </IntentionsProvider>
  );
}
