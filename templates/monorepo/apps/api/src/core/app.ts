// Assembles the Hono app: hardening middleware, health check, and every
// domain module, each wired with the core port adapters it needs. This is
// the one place in the codebase that is allowed to know both "modules" and
// "adapters" at once; a module itself never reaches for an adapter or a raw
// infra client directly (see ../modules/example and tools/check-boundaries.ts).
import { Hono } from "hono";
import { createRedisCacheAdapter } from "./adapters/redis";
import { applyHardening } from "./hardening";
import { createExampleModule } from "../modules/example";

const app = new Hono();

applyHardening(app);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/example", createExampleModule({ cache: createRedisCacheAdapter() }));

export { app };
export type AppType = typeof app;
