"use client";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { useSummarize } from "@intentions/react";
import { useState } from "react";
import { DemoShell } from "./demo-shell";

const CODE = {
  vanilla: `import { createClient } from "@intentions/client"

const client = createClient({ model: "qwen3:0.6b" })
const result = await client.summarize(text)`,
  react: `import { useSummarize } from "@intentions/react"

const summarize = useSummarize()
const result = await summarize(text)`,
};

const sampleText = `Artificial intelligence (AI) is transforming industries across the globe. From healthcare to finance, AI systems are being deployed to automate complex tasks, analyze vast amounts of data, and make predictions that were previously impossible. Machine learning, a subset of AI, enables computers to learn from experience without being explicitly programmed. Deep learning, which uses neural networks with many layers, has achieved remarkable success in areas such as image recognition, natural language processing, and game playing. However, the rapid advancement of AI also raises important ethical questions about privacy, job displacement, and the potential for bias in automated decision-making systems.`;

export default function SummarizeDemo() {
  const [input, setInput] = useState(sampleText);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const summarize = useSummarize();

  const handleSummarize = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      setSummary(await summarize(input));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DemoShell
      title="Summarize"
      description="Distill long content into key points. Perfect for quickly understanding articles, documents, or any lengthy text."
      code={CODE}
      gradient="bg-gradient-to-br from-emerald-500/20 via-teal-400/10 to-cyan-500/20"
    >
      <div className="space-y-4 bg-zinc-950/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
        <Textarea
          label="Text to summarize"
          placeholder="Paste your text here..."
          value={input}
          size="lg"
          onValueChange={setInput}
          minRows={4}
          isDisabled={isLoading}
          classNames={{
            inputWrapper: "bg-zinc-900/50 border-zinc-700/50",
          }}
        />

        {error && <p className="text-danger text-sm">{error.message}</p>}

        <Button
          className="w-full"
          variant="flat"
          size="sm"
          color="primary"
          isLoading={isLoading}
          onPress={handleSummarize}
          isDisabled={!input.trim()}
        >
          Summarize
        </Button>

        {summary && (
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700/50">
            <p className="text-sm text-zinc-200">{summary}</p>
          </div>
        )}
      </div>
    </DemoShell>
  );
}
