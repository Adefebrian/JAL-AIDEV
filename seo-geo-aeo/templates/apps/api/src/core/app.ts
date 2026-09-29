// Assembles the Hono app: hardening middleware, health check, and every
// domain module, each wired with the core port adapters it needs. This is
// the one place in the codebase that is allowed to know both "modules" and
// "adapters" at once; a module itself never reaches for an adapter or a raw
// infra client directly (see ../modules/example and tools/check-boundaries.ts).
//
// The route registrations below are chained (`.get(...).route(...)`) rather
// than called as separate statements, so AppType (hc<AppType> in
// apps/web/src/client.ts) describes every route.
//
// `/jal-seo-geo-aeo integrate` adds the crawl module: the ingest route for
// apps/web's crawler-log flush and the admin summary. Replace the default
// authorizeAdmin with the project's real admin auth when it has one.
import { Hono } from "hono";
import { createDbAdapter } from "./adapters/db";
import { createRedisCacheAdapter } from "./adapters/redis";
import { applyHardening } from "./hardening";
import { createExampleModule } from "../modules/example";
import { bearerMatches, createCrawlModule } from "../modules/crawl";

const base = new Hono();

applyHardening(base);

const app = base
  .get("/health", (c) => c.json({ ok: true }))
  .route("/example", createExampleModule({ cache: createRedisCacheAdapter() }))
  .route(
    "/",
    createCrawlModule({
      db: createDbAdapter(),
      ingestToken: () => process.env.CRAWL_INGEST_TOKEN,
      authorizeAdmin: (c) => bearerMatches(c.req.header("authorization"), process.env.CRAWL_ADMIN_TOKEN),
    }),
  );

export { app };
export type AppType = typeof app;
