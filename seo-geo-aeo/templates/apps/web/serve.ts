// apps/web/serve.ts - the process entrypoint that actually listens.
//
// Deliberately separate from ./server.ts (see the scaffold notes there: Bun
// auto-serves a default export with `fetch`, so the listen lives here and
// this file has no default export). Boot-time side effects live here too, so
// importing server.ts from a test never starts a timer or a request:
//   - the crawler-log flush every 60 s, and a final flush on SIGTERM;
//   - IndexNow on production boot, fire-and-forget, after Bun.serve listens.
import { business } from "@__APP_NAME__/facts";
import app, { crawlers, indexableUrls, seo } from "./server";
import { submitOnBoot } from "./server/lib/indexnow";

const port = Number(process.env.WEB_PORT ?? 3000);

Bun.serve({ fetch: app.fetch, port });
// eslint-disable-next-line no-console
console.log(`web listening on :${port}`);

crawlers.start();
process.on("SIGTERM", crawlers.onSigterm());

// Standing authorisation (hard law 10): the site's own indexable URLs, only
// for a host listed in .jal/seo-geo-aeo.json, only in production. Never
// awaited, never throws, 10-second timeout.
submitOnBoot({
  nodeEnv: process.env.NODE_ENV,
  key: process.env[seo?.indexNowKeyEnv ?? "INDEXNOW_KEY"],
  origin: business.website.replace(/\/+$/, ""),
  urls: indexableUrls(),
  allowedHosts: seo?.indexNowHosts ?? [],
});
