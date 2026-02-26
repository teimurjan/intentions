"use client";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { useRewrite } from "@intentions/react";
import { useState } from "react";
import { DemoShell } from "./demo-shell";

const CODE = {
  vanilla: `import { createClient } from "@intentions/client"

const client = createClient({ model: "qwen3:0.6b" })
const result = await client.rewrite(text, { tone: "friendly" })`,
  react: `import { useRewrite } from "@intentions/react"

const { friendly, concise } = useRewrite()
const result = await friendly(text)`,
};

export default function RewriteDemo() {
  const [text, setText] = useState(
    "I wanted to reach out regarding the project status. It seems like we might need to adjust some timelines due to recent changes in requirements.",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const rewrite = useRewrite();

  const handleRewrite = async (mode: "friendly" | "concise") => {
    setIsLoading(true);
    setError(null);
    try {
      setText(await rewrite[mode](text));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DemoShell
      title="Rewrite"
      description="Transform text tone while preserving meaning. Make messages more friendly and approachable, or trim them down to be concise and direct."
      code={CODE}
      gradient="bg-gradient-to-br from-rose-500/20 via-orange-400/10 to-amber-500/20"
    >
      <div className="space-y-4 bg-zinc-950/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
        <Textarea
          label="Your text"
          placeholder="Enter text to rewrite..."
          value={text}
          size="lg"
          onValueChange={setText}
          minRows={4}
          isDisabled={isLoading}
          classNames={{
            inputWrapper: "bg-zinc-900/50 border-zinc-700/50",
          }}
        />

        {error && <p className="text-danger text-sm">{error.message}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            isLoading={isLoading}
            onPress={() => handleRewrite("friendly")}
          >
            Friendly
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            isLoading={isLoading}
            onPress={() => handleRewrite("concise")}
          >
            Concise
          </Button>
        </div>
      </div>
    </DemoShell>
  );
}
