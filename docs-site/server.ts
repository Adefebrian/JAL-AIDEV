// docs-site/server.ts - serves the site built by build.ts. Plain Hono +
// hono/bun static serving, no Vite dev server, no Next.js.
import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const app = new Hono();

// hono/bun's serveStatic resolves `root`/`path` relative to process.cwd(),
// not relative to this file. Use an absolute path (import.meta.dir) so the
// server behaves the same whether it is started from docs-site/, from the
// repo root, or from a Docker image's WORKDIR, matching the fix documented
// in templates/monorepo/apps/web/server.ts.
const distDir = `${import.meta.dir}/dist`;

app.use("/*", serveStatic({ root: distDir }));
// SPA fallback: any path not matched by a static file resolves to
// index.html instead of a 404. This site has no client-side router today,
// every real link is a same-page anchor, but the fallback keeps a direct
// deep link (e.g. a bookmarked #install) working the same way if that
// ever changes.
//
// `path` must be a filename relative to `root`, not `distDir`'s own
// absolute path. hono's serve-static join() strips the leading slash off
// an absolute `path` when `root` defaults to "./" (verified against
// hono@4.13.3's src/middleware/serve-static/path.js), which quietly turns
// this into a request for a relative path that never exists and this
// fallback into a silent 404 instead of index.html. Passing the same
// absolute `root` here sidesteps that join() edge case entirely.
app.get("*", serveStatic({ root: distDir, path: "index.html" }));

const port = Number(process.env.DOCS_PORT ?? 4000);

if (import.meta.main) {
  Bun.serve({ fetch: app.fetch, port });
  // eslint-disable-next-line no-console
  console.log(`docs-site listening on :${port}`);
}

export default app;
