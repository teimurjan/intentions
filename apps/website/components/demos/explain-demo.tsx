"use client";

import { Tooltip } from "@heroui/tooltip";
import { useExplain } from "@intentions/react";
import { useCallback, useState } from "react";
import { DemoShell } from "./demo-shell";

const CODE = {
  vanilla: `import { createClient } from "@intentions/client"

const client = createClient({ model: "qwen3:0.6b" })
const result = await client.explain(term)`,
  react: `import { useExplain } from "@intentions/react"

const explain = useExplain()
const result = await explain(term)`,
};

interface Term {
  text: string;
  start: number;
}

const sampleText = `Modern web applications often use microservices architecture with REST APIs for communication. Machine learning models can be deployed as serverless functions, while blockchain technology ensures data integrity. Understanding concepts like idempotency and eventual consistency is crucial for building scalable systems.`;

const terms: Term[] = [
  { text: "microservices", start: 34 },
  { text: "REST APIs", start: 66 },
  { text: "Machine learning", start: 95 },
  { text: "serverless functions", start: 138 },
  { text: "blockchain", start: 166 },
  { text: "idempotency", start: 240 },
  { text: "eventual consistency", start: 256 },
];

export default function ExplainDemo() {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const explain = useExplain();

  const fetchExplanation = useCallback(
    async (term: string) => {
      if (explanations[term]) return;

      setLoading(term);
      try {
        const result = await explain(term);
        setExplanations((prev) => ({ ...prev, [term]: result }));
      } catch {
        setExplanations((prev) => ({ ...prev, [term]: "Failed to load explanation" }));
      } finally {
        setLoading(null);
      }
    },
    [explain, explanations],
  );

  const renderText = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const term of terms) {
      if (term.start > lastIndex) {
        parts.push(sampleText.slice(lastIndex, term.start));
      }

      parts.push(
        <Tooltip
          key={term.text}
          content={
            loading === term.text ? (
              <span className="text-sm">Loading...</span>
            ) : explanations[term.text] ? (
              <span className="text-sm max-w-xs">{explanations[term.text]}</span>
            ) : (
              <span className="text-sm text-zinc-400">Hover to explain</span>
            )
          }
          delay={0}
          closeDelay={0}
          onOpenChange={(isOpen) => {
            if (isOpen) fetchExplanation(term.text);
          }}
        >
          <span className="underline decoration-dotted decoration-primary cursor-help text-primary font-medium">
            {term.text}
          </span>
        </Tooltip>,
      );

      lastIndex = term.start + term.text.length;
    }

    if (lastIndex < sampleText.length) {
      parts.push(sampleText.slice(lastIndex));
    }

    return parts;
  };

  return (
    <DemoShell
      title="Explain"
      description="Instant definitions on hover. Add contextual explanations to technical terms, jargon, or any concept your users might not understand."
      code={CODE}
      gradient="bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-rose-500/20"
    >
      <div className="space-y-4 bg-zinc-950/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
        <div className="leading-relaxed text-md text-zinc-300">{renderText()}</div>
        <p className="text-xs text-zinc-500">
          Hover over highlighted terms. Explanations are cached after first hover.
        </p>
      </div>
    </DemoShell>
  );
}
