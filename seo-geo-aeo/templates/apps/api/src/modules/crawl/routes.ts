// Hono router for the crawler log. Two routes, chained so their schema
// reaches AppType (see modules/example/routes.ts for why):
//   POST /internal/crawl/hits    apps/web's flush, Bearer $CRAWL_INGEST_TOKEN
//   GET  /admin/crawl/summary    the admin view, behind the project's admin auth
// Tokens are compared in constant time. Both answers are noindex, no-store.
import { createHash, timingSafeEqual } from "node:crypto";
import { Hono, type Context } from "hono";
import { validator } from "hono/validator";
import type { CrawlService } from "./service";

/** Constant-time bearer check; an unset expected token always fails. */
export function bearerMatches(header: string | undefined, expected: string | undefined): boolean {
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const a = createHash("sha256").update(header.slice(7)).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export interface CrawlAuth {
  /** Read per request, so a rotated env value applies without a code change. */
  ingestToken: () => string | undefined;
  authorizeAdmin: (c: Context) => boolean | Promise<boolean>;
}

export function createCrawlRoutes(service: CrawlService, auth: CrawlAuth) {
  return new Hono()
    .post("/internal/crawl/hits", async (c) => {
      c.header("X-Robots-Tag", "noindex");
      c.header("Cache-Control", "no-store");
      if (!bearerMatches(c.req.header("authorization"), auth.ingestToken())) return c.json({ error: "unauthorized" }, 401);
      const body = await c.req.json().catch(() => null);
      const parsed = service.validate(body);
      if (!parsed.ok) return c.json({ error: parsed.error }, 400);
      await service.ingest(parsed.rows);
      return c.json({ accepted: parsed.rows.length }, 202);
    })
    .get(
      "/admin/crawl/summary",
      validator("query", (value) => ({ days: typeof value.days === "string" ? value.days : "14" })),
      async (c) => {
        c.header("X-Robots-Tag", "noindex");
        c.header("Cache-Control", "no-store");
        if (!(await auth.authorizeAdmin(c))) return c.json({ error: "unauthorized" }, 401);
        return c.json(await service.summary(Number(c.req.valid("query").days)), 200);
      },
    );
}
