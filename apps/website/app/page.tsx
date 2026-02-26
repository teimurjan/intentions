"use client";

import { Skeleton } from "@heroui/skeleton";
import { IconBolt, IconBrain, IconLock } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useProviderContext } from "@/contexts/provider-context";

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

function LoadingSkeleton() {
  return (
    <>
      <DemoSkeleton />
      <DemoSkeleton />
      <DemoSkeleton />
      <DemoSkeleton />
    </>
  );
}

const IntentionsWrapper = dynamic(() => import("@/components/intentions-wrapper"), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});

const RewriteDemo = dynamic(() => import("@/components/demos/rewrite-demo"), {
  ssr: false,
});
const CompleteDemo = dynamic(() => import("@/components/demos/complete-demo"), {
  ssr: false,
});
const SummarizeDemo = dynamic(() => import("@/components/demos/summarize-demo"), {
  ssr: false,
});
const ExplainDemo = dynamic(() => import("@/components/demos/explain-demo"), {
  ssr: false,
});

export default function Home() {
  const { provider } = useProviderContext();

  return (
    <>
      <section
        className="flex flex-col items-center justify-center min-h-[calc(70vh-64px)] overflow-hidden"
        style={{
          backgroundColor: "#010101",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%237c7981' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="relative z-10 text-center max-w-4xl container mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative animate-float">
              <div className="absolute inset-0 blur-2xl bg-red-500/40 rounded-full scale-110" />
              <Image
                src="/logo.png"
                alt="Intentions logo"
                width={192}
                height={192}
                className="relative w-32 h-32 md:w-48 md:h-48"
              />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Enhance your UI with</span>
            <br />
            <span className="bg-gradient-to-r from-red-600 via-rose-500 to-red-500 bg-clip-text text-transparent">
              intentions
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-default-600 max-w-2xl mx-auto">
            Text rewriting, autocomplete, summarization, and explanations. Runs entirely in the
            browser.
          </p>
        </div>
      </section>

      <section className="py-16 border-t border-zinc-800/50">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">How Does It Work?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <IconBrain className="mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Local LLM</h3>
              <p className="text-zinc-400">
                Small language models run directly in your browser via WebLLM.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <IconLock className="mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-zinc-400">
                No data leaves your device. All processing happens locally.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <IconBolt className="mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Zero Latency</h3>
              <p className="text-zinc-400">
                No network round-trips. Instant responses after model loads.
              </p>
            </div>
          </div>
        </div>
      </section>

      <IntentionsWrapper provider={provider}>
        <RewriteDemo />
        <CompleteDemo />
        <SummarizeDemo />
        <ExplainDemo />
      </IntentionsWrapper>
    </>
  );
}
