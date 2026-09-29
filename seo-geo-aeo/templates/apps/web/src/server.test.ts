// apps/web/src/server.test.ts - the BUILT server through real fetches.
//
// Replaces the scaffold's version when the search layer is installed: an
// unknown path is now a real 404 with noindex (standard.md SEO-03), not the
// SPA's index.html, and "/" carries the page's own title and body. Also keeps
// the scaffold's regression guard for hono serve-static's absolute-path join.
import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { META_COPY } from "../server/lib/metaCopy";

describe("web server", () => {
  let server: ReturnType<typeof Bun.serve>;
  const url = (p: string) => `http://localhost:${server.port}${p}`;

  beforeAll(async () => {
    // happy-dom's patched fetch cannot talk to a real Bun.serve() listener.
    GlobalRegistrator.unregister();
    if (!existsSync(new URL("../dist/seo.json", import.meta.url))) await import("../build");
    const { default: app } = await import("../server");
    server = Bun.serve({ fetch: app.fetch, port: 0 });
  });

  afterAll(() => {
    server?.stop();
    GlobalRegistrator.register();
  });

  test("serves / with its own title and the prerendered body inside #root", async () => {
    const res = await fetch(url("/"));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("<title>");
    expect(body).toContain(META_COPY.en.home!.title.replace(/&/g, "&amp;"));
    expect(body).toMatch(/<div id="root"><div class="shell">/);
  });

  test("an unknown deep link is a real 404 with noindex", async () => {
    const res = await fetch(url("/some/unknown/deep-link"));
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('<meta name="robots" content="noindex" />');
  });

  test("serves the bundle and the discovery files", async () => {
    for (const p of ["/index.js", "/robots.txt", "/sitemap.xml", "/llms.txt"]) expect((await fetch(url(p))).status).toBe(200);
    expect((await fetch(url("/index.js"))).headers.get("x-robots-tag")).toBe("noindex");
  });

  test("never serves the raw build files", async () => {
    for (const p of ["/seo.json", "/index.html", "/admin.html"]) expect((await fetch(url(p))).status).toBe(404);
  });
});
