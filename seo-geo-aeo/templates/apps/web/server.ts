// apps/web/server.ts - serves the public site: the HTML shell with its head
// and prerendered body for every route, the discovery files, retired-path
// 301s, the trailing-slash fold, the IndexNow key file, then the static
// bundle. Plain Hono + hono/bun static serving, no Vite, no Next.js.
//
// Installed by `/jal-seo-geo-aeo integrate` over the scaffold's server.ts; the
// secureHeaders block and the Bun auto-serve notes below are the scaffold's,
// unchanged. Nothing here (or under ./server/) imports ./src: everything the
// server needs from the client comes through dist/seo.json (integrate.md 8.2).
import { readFileSync, existsSync } from "node:fs";
import { Hono, type Context } from "hono";
import { serveStatic } from "hono/bun";
import { secureHeaders } from "hono/secure-headers";
import { business } from "@__APP_NAME__/facts";
import { buildRouteTable, indexable, notFoundRoute, renderShellHtml, type Route } from "./server/lib/meta";
import { loadSeo } from "./server/lib/prerender";
import { RETIRED } from "./server/lib/redirects";
import { sitemapXml } from "./server/lib/seo";
import { indexNowKeyPath, isValidIndexNowKey } from "./server/lib/indexnow";
import { createCrawlerLog, type CrawlerLog } from "./server/lib/crawlers";
import type { SeoBundle } from "./server/lib/seoTypes";

// The API origin the SPA talks to. apps/web/src/client.ts reads the same
// API_URL name and falls back to the same http://localhost:3001 (apps/api's
// port), so the CSP and the client cannot drift apart.
const apiOrigin = process.env.API_URL ?? "http://localhost:3001";

export const DISCOVERY_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/.well-known/llms.txt",
  "/llms-full.txt",
  "/.well-known/ai.txt",
  "/ai/summary.json",
  "/ai/faq.json",
  "/feed.xml",
  "/site.webmanifest",
];

/** Built files that must never be served raw (they bypass the head). */
const BLOCKED = new Set(["/seo.json", "/index.html", "/admin.html"]);

export interface WebAppOptions {
  seo: SeoBundle | null;
  /** dist/index.html; the fallback keeps a dist-less dev boot working. */
  shell: string;
  adminShell?: string;
  /** Omit in tests to skip static files. */
  distDir?: string;
  indexNowKey?: string;
  crawlers?: CrawlerLog;
  /** YYYY-MM-DD used as lastmod for a page without a date. */
  today?: string;
  /** Retired path -> live path; defaults to server/lib/redirects.ts. */
  retired?: Record<string, string>;
}

const FALLBACK_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title></title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

export function createWebApp(opts: WebAppOptions): Hono {
  const app = new Hono();
  const routes = buildRouteTable();
  const byPath = new Map(routes.map((r) => [r.path, r]));
  const seo = opts.seo;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  // This is the HTML origin, so it is the only place a CSP or an
  // X-Frame-Options has any effect. Registered first so it covers every
  // route below. (Scaffold comments on each directive: see the template.)
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", apiOrigin],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
      xFrameOptions: "DENY",
      xContentTypeOptions: true,
      referrerPolicy: "strict-origin-when-cross-origin",
    }),
  );

  // Crawler log: after the response, so the status is the real one.
  app.use("*", async (c, next) => {
    await next();
    opts.crawlers?.record(c.req.header("user-agent"), c.req.path, c.res.status);
  });

  // Hashed assets and the admin surface carry X-Robots-Tag: noindex (SEO-13).
  app.use("*", async (c, next) => {
    await next();
    const p = c.req.path;
    if (/\.(js|css|map)$/.test(p) || p === business.adminPath || p.startsWith(`${business.adminPath}/`)) {
      c.header("X-Robots-Tag", "noindex");
    }
  });

  // Trailing-slash fold: /rates/ -> /rates, one URL per page (SEO-03).
  app.use("*", async (c, next) => {
    const p = c.req.path;
    if (p.length > 1 && p.endsWith("/")) {
      const url = new URL(c.req.url);
      return c.redirect(`${p.replace(/\/+$/, "") || "/"}${url.search}`, 301);
    }
    return next();
  });

  // Retired paths: 301 to the live page answering the same question.
  for (const [from, to] of Object.entries(opts.retired ?? RETIRED)) app.get(from, (c) => c.redirect(to, 301));

  // Discovery files. robots.txt has a fallback so a dist-less boot still
  // keeps admin and API out of the index.
  const text = (c: Context, body: string | undefined, type: string) =>
    body === undefined ? c.notFound() : c.body(body, 200, { "content-type": type, "cache-control": "public, max-age=3600" });
  const origin = business.website.replace(/\/+$/, "");
  const fallbackRobots = `User-agent: *\nAllow: /\nDisallow: ${business.adminPath}\nDisallow: /api\n\nSitemap: ${origin}/sitemap.xml\n`;
  app.get("/robots.txt", (c) => text(c, seo?.files.robotsTxt ?? fallbackRobots, "text/plain; charset=utf-8"));
  app.get("/sitemap.xml", (c) =>
    text(
      c,
      sitemapXml(
        indexable(routes).map((r) => ({ loc: r.canonical!, lastmod: r.updated, alternates: r.alternates })),
        today,
      ),
      "application/xml; charset=utf-8",
    ),
  );
  app.get("/llms.txt", (c) => text(c, seo?.files.llmsTxt, "text/plain; charset=utf-8"));
  app.get("/.well-known/llms.txt", (c) => text(c, seo?.files.llmsTxt, "text/plain; charset=utf-8"));
  app.get("/llms-full.txt", (c) => text(c, seo?.files.llmsFullTxt, "text/plain; charset=utf-8"));
  app.get("/.well-known/ai.txt", (c) => text(c, seo?.files.aiTxt, "text/plain; charset=utf-8"));
  app.get("/ai/summary.json", (c) => text(c, seo?.files.summaryJson, "application/json; charset=utf-8"));
  app.get("/ai/faq.json", (c) => text(c, seo?.files.faqJson, "application/json; charset=utf-8"));
  app.get("/feed.xml", (c) => text(c, seo?.files.feedXml, "application/rss+xml; charset=utf-8"));
  app.get("/site.webmanifest", (c) => text(c, seo?.files.manifest, "application/manifest+json"));

  // The IndexNow key file: the one key that is public by design.
  if (isValidIndexNowKey(opts.indexNowKey)) {
    const key = opts.indexNowKey;
    app.get(indexNowKeyPath(key), (c) => c.body(key, 200, { "content-type": "text/plain; charset=utf-8" }));
  }

  const shellFor = (route: Route) => (route.shell === "admin" ? (opts.adminShell ?? opts.shell) : opts.shell);
  const html = (c: Context, route: Route, status: 200 | 404) =>
    c.html(renderShellHtml(shellFor(route), route, seo), status, route.dynamic ? { "cache-control": "no-store" } : { "cache-control": "public, max-age=300" });

  // The shell for every route in the table.
  app.get("*", async (c, next) => {
    if (BLOCKED.has(c.req.path)) return html(c, notFoundRoute(c.req.path), 404);
    const route = byPath.get(c.req.path);
    return route ? html(c, route, 200) : next();
  });

  // The vendored fonts (dist/fonts, copied by build.ts) never change under a
  // name, so they cache for a year; everything else keeps the default.
  app.use("/fonts/*", async (c, next) => {
    await next();
    if (c.res.status === 200 && c.res.headers.get("content-type")?.startsWith("font/")) {
      c.header("Cache-Control", "public, max-age=31536000, immutable");
    }
  });

  if (opts.distDir) app.use("/*", serveStatic({ root: opts.distDir }));
  // A missing font is a 404, never a page shell.
  app.get("/fonts/*", (c) => c.notFound());

  // A real 404 with noindex, in the language of the path (SEO-03).
  app.notFound((c) => html(c, notFoundRoute(c.req.path), 404));
  return app;
}

// hono/bun's serveStatic resolves `root` relative to process.cwd(), so use an
// absolute path (import.meta.dir) as the scaffold does.
const distDir = `${import.meta.dir}/dist`;
const readIf = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : undefined);

export const seo = loadSeo(`${distDir}/seo.json`);
const known = new Set([...buildRouteTable().map((r) => r.path), ...DISCOVERY_PATHS]);

export const crawlers = createCrawlerLog({
  timezone: business.timezone,
  knownPaths: known,
  ingestUrl: process.env.CRAWL_INGEST_URL ?? `${apiOrigin}/internal/crawl/hits`,
  ingestToken: process.env.CRAWL_INGEST_TOKEN,
});

const app = createWebApp({
  seo,
  shell: readIf(`${distDir}/index.html`) ?? FALLBACK_SHELL,
  adminShell: readIf(`${distDir}/admin.html`),
  distDir,
  indexNowKey: process.env[seo?.indexNowKeyEnv ?? "INDEXNOW_KEY"],
  crawlers,
});

/** Absolute URLs IndexNow submits on production boot: every indexable page. */
export function indexableUrls(): string[] {
  return indexable(buildRouteTable()).map((r) => r.canonical!);
}

// This file never calls Bun.serve itself; ./serve.ts does (see the scaffold
// notes: Bun auto-serves a default export with `fetch`, and attaching `port`
// keeps `bun server.ts` a valid server config as well).
const port = Number(process.env.WEB_PORT ?? 3000);

export default Object.assign(app, { port });
