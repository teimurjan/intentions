import { $ } from "bun";

await $`rm -rf dist`;

// Run bundling and type generation in parallel
await Promise.all([
  Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    format: "esm",
    target: "browser",
    external: ["react", "react/jsx-runtime", "@intentions/client"],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  }),
  $`bunx tsc --emitDeclarationOnly --declaration --declarationDir dist --noEmit false`,
]);
