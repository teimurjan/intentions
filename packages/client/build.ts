/**
 * Build script for @intentions/client
 */

import { $ } from "bun";

// Clean dist
await $`rm -rf dist`;

// Build with Bun
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "browser",
  minify: false,
  sourcemap: "external",
  external: [
    "@browser-ai/web-llm",
    "@browser-ai/transformers-js",
    "@ai-sdk/openai",
    "@ai-sdk/anthropic",
    "ai",
  ],
});

// Generate type declarations
await $`bunx tsc --emitDeclarationOnly --declaration --declarationDir dist --noEmit false`;

console.log("@intentions/client build complete");
