import { $ } from "bun";

await $`rm -rf dist`;

await Promise.all([
  Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    format: "esm",
    target: "browser",
    external: [],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
  }),
  $`bunx tsc --emitDeclarationOnly --declaration --declarationDir dist --noEmit false`,
]);
