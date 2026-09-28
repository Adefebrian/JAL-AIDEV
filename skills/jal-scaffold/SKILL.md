---
name: jal-scaffold
description: How /jal-new builds a JAL monorepo, the no-Vite Bun.build() React recipe, Hono static serving, bun --watch dev loop, and the post-scaffold checklist. Use when scaffolding a new JAL project, setting up Bun.build() for React, or wiring a Hono static server.
---

# JAL Scaffold

Detail layer behind `/jal-new <name>`. Defers to `jal-standards` for the approved stack (Bun, Hono, React, TypeScript, Docker, Redis; no Vite, no Next.js).

## What /jal-new does

1. Copies `templates/monorepo` into a new directory named `<name>`.
2. Renames the root `package.json` name field and any placeholder tokens to `<name>`.
3. Runs `bun install` at the repo root (Bun workspaces resolve `apps/*` and `packages/*` in one pass).
4. Runs `git init`, stages everything, and makes the first commit (`chore: scaffold <name> from jal-aidev template`).
5. Prints the post-scaffold checklist (below) so the next steps are never guessed.

Output layout:

```
apps/web/     React + TS SPA, built with Bun.build(), served by Hono static server.
apps/api/     Hono on Bun: Postgres + Redis + S3 clients, security middleware, gpt-4o-mini client.
packages/ui/  Shared React components: bento primitives, tokens, icon wrapper (no gradient presets, no decorative-line helpers).
packages/config/ shared tsconfig, eslint config, env schema.
infra/        Per-app Dockerfile (multi-stage, slim), docker-compose for local PG + Redis.
.github/workflows/ci.yml
.jal/memory/
turbo.json, package.json (workspaces), .gitignore, README.md
```

## The no-Vite Bun.build() React recipe

Vite is forbidden. Bun is both the package manager and the build tool. This is the exact recipe that makes React work correctly under `Bun.build()`.

**Entrypoint** (`apps/web/src/main.tsx`):

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
```

**Build script** (`apps/web/build.ts`):

```ts
import { readdir } from "node:fs/promises";

await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV === "production" ? "none" : "linked",
  splitting: true,
  naming: "[dir]/[name]-[hash].[ext]",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
});
```

Key config points, each one is a real gotcha Bun.build() will trip on if skipped:

- **JSX runtime**: set `"jsx": "react-jsx"` and `"jsxImportSource": "react"` in `tsconfig.json` (`compilerOptions`). Bun's transpiler reads this and emits the automatic runtime (`jsx()` calls from `react/jsx-runtime`), so `main.tsx` never needs `import React from "react"`.
- **Target**: always `target: "browser"`, never `"bun"` or `"node"`, for anything that ships to a browser. Getting this wrong pulls in Node-only globals and breaks in the browser.
- **CSS handling**: Bun.build() supports CSS as a first-class entrypoint. Add a second entrypoint `./src/styles.css` and Bun emits a hashed `.css` file into `outdir` alongside the JS. Import CSS directly in components (`import "./Card.css"`) and Bun's bundler inlines the reference automatically when CSS is listed as an entrypoint or imported from an entrypoint's dependency graph.
- **Static assets** (images, fonts): reference them with `import logo from "./logo.svg"` and Bun copies+hashes them into `outdir`, rewriting the import to the final URL string.
- **Code splitting**: `splitting: true` is required for a multi-route SPA to avoid one giant bundle; Bun handles dynamic `import()` boundaries automatically.
- **Env vars**: never read `process.env` directly in browser code beyond what is explicitly passed through `define`. Secrets never belong in `apps/web`.

## Static serve via Hono

`apps/api` (or a dedicated small server) serves the built SPA with `hono/bun`'s `serveStatic`:

```ts
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.use("/*", serveStatic({ root: "./apps/web/dist" }));
app.get("*", serveStatic({ path: "./apps/web/dist/index.html" })); // SPA fallback

export default app;
```

The SPA fallback route must come after all API routes are mounted, so client-side routes (e.g. `/dashboard`) resolve to `index.html` instead of a 404, while `/api/*` still hits real handlers.

## bun --watch dev loop

No Vite dev server, no HMR framework. The dev loop is a watch-and-rebuild-and-serve loop:

```json
{
  "scripts": {
    "dev:web": "bun --watch build.ts",
    "dev:api": "bun --watch src/index.ts",
    "dev": "concurrently \"bun run dev:web\" \"bun run dev:api\""
  }
}
```

- `bun --watch build.ts` reruns the build script on every source file save inside `apps/web/src`, regenerating `dist/`.
- `bun --watch src/index.ts` restarts the Hono server on API source changes; it serves whatever is currently in `dist/`, so a browser refresh (not HMR) picks up frontend changes after the rebuild completes.
- This is slower than Vite HMR by design (a full rebuild, not a module swap) but stays inside the approved Bun-only stack and keeps the dev and prod build paths identical, no dev/prod drift bugs.

## Post-scaffold checklist

Run in order immediately after `/jal-new <name>` finishes:

1. `cd <name> && bun install` (idempotent if scaffold already ran it, safe to rerun after any manual `package.json` edit).
2. `bun run build` across all workspaces (`turbo run build`), confirm `apps/web/dist` and any `apps/api` build output are produced with no errors.
3. `bun test` (root), confirm the template's placeholder tests pass, this is also the no-Vite-React proof obligation.
4. Copy `.env.example` to `.env`, fill in real values: `DATABASE_URL` (self-hosted PG), `REDIS_URL`, S3 credentials for `s3.datacenter.jalgroup.id`, `OPENAI_API_KEY`. Never commit `.env`.
5. Confirm `.gitignore` excludes `.env`, `dist/`, `node_modules/`.
6. Push the repo, connect it to Coolify at deploy.jalgroup.id, point the build command at the Dockerfiles in `infra/`.
7. Confirm GitHub Actions CI (`.github/workflows/ci.yml`) runs on the self-hosted `gh` runner with Turborepo caching enabled.
8. Write the first entry to `.jal/memory/` if anything about this scaffold run deviated from the template (see `jal-memory`).
