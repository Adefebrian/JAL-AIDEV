// docs-site/src/server.test.ts
//
// Regression test for a real bug found while building this site: hono's
// serve-static join() silently drops the leading slash off an absolute
// `path` option when `root` is left at its "./" default, turning the SPA
// fallback route into a request for a path that never exists, so it
// falls through to a plain 404 instead of index.html (verified directly
// against hono@4.13.3's src/middleware/serve-static/path.js, and present
// in the very similar reference server.ts this file follows). server.ts
// works around it by passing the same `root` to both serveStatic calls
// instead of an absolute `path`. This test exercises the built server
// through real fetches so that fix cannot regress unnoticed.
import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

describe("docs-site server", () => {
  let server: ReturnType<typeof Bun.serve>;

  beforeAll(async () => {
    const distIndex = new URL("../dist/index.html", import.meta.url);
    if (!existsSync(distIndex)) {
      await import("../build");
    }
    const { default: app } = await import("../server");
    server = Bun.serve({ fetch: app.fetch, port: 0 });
  });

  afterAll(() => {
    server?.stop();
  });

  test("serves the built index.html at /", async () => {
    const res = await fetch(`http://localhost:${server.port}/`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("<title>JAL-AIDEV");
  });

  test("serves styles.css with a css content type", async () => {
    const res = await fetch(`http://localhost:${server.port}/styles.css`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") ?? "").toContain("css");
  });

  test("falls back to index.html for an unknown deep link, not a 404", async () => {
    const res = await fetch(`http://localhost:${server.port}/some/unknown/deep-link`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("<title>JAL-AIDEV");
  });
});
