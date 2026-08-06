import { Hono } from "hono";
import { loadEnv } from "@__APP_NAME__/config";
import { applyHardening } from "./middleware/hardening";

const app = new Hono();

applyHardening(app);

app.get("/health", (c) => c.json({ ok: true }));

export { app };
export default app;

// Fail-fast env validation and the actual listen call only happen when this
// file is executed directly (the real runtime entrypoint), never when it is
// imported (e.g. by index.test.ts via `app.request(...)`). This keeps
// `bun test` fully independent of live Postgres/Redis/S3/OpenAI.
if (import.meta.main) {
  const env = loadEnv();
  Bun.serve({ fetch: app.fetch, port: env.PORT });
  // eslint-disable-next-line no-console
  console.log(`api listening on :${env.PORT}`);
}
