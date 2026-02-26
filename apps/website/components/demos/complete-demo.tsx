"use client";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Kbd } from "@heroui/kbd";
import { useComplete } from "@intentions/react";
import { useCallback, useState } from "react";
import { DemoShell } from "./demo-shell";

const CODE = {
  vanilla: `import { createClient } from "@intentions/client"

const client = createClient({ model: "qwen3:0.6b" })
const result = await client.complete(text)`,
  react: `import { useComplete } from "@intentions/react"

const complete = useComplete()
const result = await complete(text)`,
};

export default function CompleteDemo() {
  const [text, setText] = useState("The future of artificial intelligence will");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const complete = useComplete();

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await complete(text, { maxTokens: 50 });
      const completion = result.slice(text.length);
      setSuggestion(completion);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const acceptSuggestion = useCallback(() => {
    if (suggestion) {
      setText(text + suggestion);
      setSuggestion(null);
    }
  }, [suggestion, text]);

  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestion) {
        if (e.key === "Tab") {
          e.preventDefault();
          acceptSuggestion();
        } else if (e.key === "Escape") {
          dismissSuggestion();
        }
      }
    },
    [suggestion, acceptSuggestion, dismissSuggestion],
  );

  const displayValue = suggestion ? text + suggestion : text;

  return (
    <DemoShell
      title="Complete"
      description="AI-powered text completion that continues your thoughts. Start typing and let the model suggest how to finish your sentence."
      code={CODE}
      gradient="bg-gradient-to-br from-blue-600/40 via-indigo-500/10 to-violet-500/20"
    >
      <div className="space-y-4 bg-zinc-950/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-800/50">
        <p className="text-sm text-zinc-400">
          <Kbd keys={["tab"]}>Tab</Kbd> to accept, <Kbd keys={["escape"]}>Esc</Kbd> to dismiss
        </p>

        <Textarea
          label="Your text"
          placeholder="Start typing..."
          size="lg"
          value={displayValue}
          onValueChange={(newValue) => {
            if (suggestion) dismissSuggestion();
            setText(newValue);
          }}
          onKeyDown={handleKeyDown}
          minRows={4}
          isDisabled={isLoading}
          classNames={{
            input: suggestion ? "text-default-400" : undefined,
            inputWrapper: "bg-zinc-900/50 border-zinc-700/50",
          }}
        />

        {error && <p className="text-danger text-sm">{error.message}</p>}

        <Button
          className="w-full"
          size="sm"
          variant="flat"
          color="primary"
          isLoading={isLoading}
          onPress={handleComplete}
        >
          Complete
        </Button>
      </div>
    </DemoShell>
  );
}
