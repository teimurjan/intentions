"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    codeToHtml(code, {
      lang: language,
      theme: "github-dark",
    }).then(setHtml);
  }, [code, language]);

  return (
    <div className="relative group">
      <div
        className="p-5 overflow-x-auto text-base [&_pre]:!bg-transparent [&_code]:!bg-transparent"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: There's no risk of XSS here
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        type="button"
        className="absolute top-3 right-3 px-2 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => navigator.clipboard.writeText(code)}
      >
        Copy
      </button>
    </div>
  );
}
