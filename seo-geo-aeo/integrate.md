# Integrate: install the JAL search layer

`/jal-seo-geo-aeo integrate` installs the full search layer into the current project: code, tests, discovery files, structured data, the crawler log and IndexNow, verified locally and on production. This file carries section 8 of Brian's instruction (the runtime module, its rules, its tests, the Next.js adaptation), the integrate flow from section 4.3, and the JAL layout the module lands in. Load `standard.md` first: its hard law (section 3) is enforced by the tests below and is never sent to JEV.

Templates for the files named here are in `templates/` in this folder (robots.txt, the llms.txt skeleton, sitemap, IndexNow, crawler identity and counter plus the migration, pageDates, the meta and content test patterns, the intent map, the report).

Lines marked **JAL tuning:** are the lead's adaptations to the JAL crew and stack.

---

## 4.3 The integrate flow

1. **Intake.** Collect the owner's facts per the intake list in `standard.md` 5.5: name, alternate names, NAP, geo pin and maps link, hours, prices, programmes, people and credentials, differentiators, press, socials, booking, languages. Ask for anything missing.
2. **Baseline audit.** Run `audit` first (`standard.md` 4.2).
3. **Implement** the runtime module (section 8): shared fact modules, copy modules in each language, the build-time generator, the route table and head injection, discovery routes, redirects, the IndexNow key and boot submission, and the crawler log with its migration and admin view.
4. **Content.** For each strong intent, write the pages and FAQs from the intent map.
   - **JEV call site: `seo.intent_page`**, one batched call with a key per cluster, decides whether each intent gets its own page, an FAQ entry, a key fact, or is skipped. Precheck: an intent whose answer needs an unconfirmed fact becomes an owner question and is not sent.
   - **JEV call site: `seo.copy_screen`**, once per title, description and FAQ answer. jal-frontend writes 3 to 5 candidates with the formulas in `boost.md` 12.3, drops every candidate that fails the length law (titles 50 to 60, descriptions 120 to 158, none under 15), does not name the place, uses an unverified fact, contains an em-dash, or matches a forbidden-claims regex, then asks JEV to pick the most answer-first one, natural in that language, naming the place. Candidates for several fields of one page go in one batched call with prefixed keys (`home_en_title`, `home_id_title`, ...).
5. **Tests.** Meta, content, SEO and language tests (section 8.3), plus the forbidden-claims test.
6. **Verify:** `bun test`, the build, `render.ts` against a local production build, and local Lighthouse (`bunx lighthouse@12` with Chrome for Testing). **JAL tuning:** run as `bunx --bun lighthouse@12` (VERIFY that it runs under Bun), with the CDP fallback from `webmaster.md` 7.4 if it does not.
7. **Deploy** through the project's normal path (`jal-devops`, Coolify). Confirm the deploy is live by repeated probes: Coolify rolls deploys with two containers, so check the chunk hash and a string only the new build contains. **JAL tuning:** the deploy waits for a yes in chat unless the invoking message asked to deploy (`jal-orchestration` hard lines).
8. **Submit.** IndexNow runs automatically on boot. Everything else goes through `submit` (`webmaster.md`).
9. **Human steps.** Output the console setup checklist (`webmaster.md` 7.2).
10. **Re-audit** and report the delta against the baseline.

### JAL tuning: the waves and the owned workstreams (skill `jal-orchestration`)

The lead runs the engine. Every independent workstream in a wave goes out in ONE message, one dispatch per worker, each brief carrying the HARD RULES block and the JEV contract. Workers never touch git state; the lead verifies each worker's command output and commits its owned paths.

| Wave | Who, in parallel | Produces |
|---|---|---|
| W0 Facts and design | Lead: owner intake in chat, then the baseline audit (scripts in parallel per URL). jal-researcher: fetch, read and screen every press URL (`sec.input_screen`), check the verbatim quotes, and run the VERIFY items integrate needs (V-01, V-10). jal-ux: section concepts for the new pages (guide, rates, contact, programme as the intent map decides) and for the admin crawler view. jal-backend: `be.placement` for the crawler log (below) | Confirmed facts with dates, the forbidden-claims list, the intent map with the `seo.intent_page` result, the contract: the page and route list, the route-table keys, the fact-module shapes, the `dist/seo.json` shape |
| W1 Build | WS-A jal-frontend, WS-B jal-backend, WS-C jal-ux, WS-D jal-qa (ownership table below) | Code and tests, each in its owned paths, against the W0 contract |
| W2 Verify | jal-qa: `bun test`, the build, `render.ts` and `audit.ts` against a local production build, Lighthouse or its fallback, and a boot test of the web image. jal-reviewer: review and `bun run check:boundaries`. jal-security: the ingest route, the admin route, headers and rate limits. jal-ux: `ui_audit` on every new page and the admin view | Findings |
| W3 Fix | The owner of each failing file, in parallel; then back to W2 for the affected checks | Fixes |
| W4 Deploy | jal-devops, after the gate passes (`qa.release_go`) and the user's yes: the migration (`be.migration_risk`), the Coolify deploy, the live probes, the IndexNow 202 on boot | Live site |
| W5 Close | Lead: the human steps, the optional `submit` (yes in chat), the re-audit and the delta. Optional: jal-docs documents the project's SEO layer in JAL Docs | Report |

FILE OWNERSHIP for W1:

| ID | Owner | Owns (exclusive paths) | Depends on | Acceptance |
|---|---|---|---|---|
| WS-A | jal-frontend | `packages/facts/**`, `apps/web/src/content/**`, `apps/web/src/seo/**`, `apps/web/src/pages/**` (new content pages), `packages/ui/src/seo/**` (FAQ, key facts, byline, `<time>`), `apps/web/server/lib/metaCopy.ts` (the route-table copy), `apps/web/build.ts`, `apps/web/public/**` | W0 contract | Facts only from the modules; both copies written by one author; `seo.copy_screen` on every title, description and FAQ answer |
| WS-B | jal-backend | `apps/web/server/lib/**` except `metaCopy.ts`, `apps/web/server.ts`, `apps/web/serve.ts`, `migrations/NNNN_crawl_hits.sql`, `apps/api/src/modules/crawl/**`, the route registration in `apps/api/src/core/app.ts` | W0 contract | Discovery routes, redirects, head injection, IndexNow, crawler log, all behind the hardening middleware |
| WS-C | jal-ux | `apps/web/src/admin/**` (the admin crawler view, in the separate admin entrypoint) | W0 concept, the WS-B summary route contract | White-first, no shadows, no gradients, records as rows; `ui_audit` PASS at every width |
| WS-D | jal-qa | every `*.test.ts` named in 8.3 and the crawler tests | W0 contract | Tests fail on a placeholder fact reaching a served body (acceptance criterion 4) |

**JAL tuning:** the route-table copy sits in its own file, `apps/web/server/lib/metaCopy.ts`, owned by jal-frontend, so the client copy and the server copy have one author and the byte-for-byte mirror test (hard law 3) guards them. `meta.ts` imports it; nothing under `apps/web/server/` imports `apps/web/src/`.

`infra/Dockerfile.web` changes (below) go to jal-devops in W1 as a small WS-E when the image layout changes, since only jal-devops owns `infra/**`.

---

## 8.1 Reference architecture (Bun + Hono + React SPA, as shipped on Padel Party)

```text
shared/
  business.ts          name, alternate names, NAP, geo, hours (closes 23:59), socials, email,
                       booking, community, amenities, courtCount-like counts, maps cid, openedOn
  rates.ts             prices, time-band schedule with bandHours() and scheduleGrid()
  press.ts             verified articles, verbatim quotes, press facts (each with source URLs)
  positioning.ts       owner-confirmed claims in each language, with their evidence
  differentiators.ts   what is different, each with a URL where it can be seen
  pageDates.ts         published (first commit in git) and updated per content page
  lang.ts              TRANSLATED_PATHS, pathForLang, splitLangPath, hasTranslation
client/content/*.ts    page copy per language: meta, hero, sections, faq, key facts
client/seo/content.ts  BUILD TIME ONLY: bodies, JSON-LD graphs, llms.txt, llms-full, ai.txt,
                       summary.json, faq.json, feed.xml, written to dist/seo.json
build.ts               runs the generator; separate public, admin and report entrypoints
server/lib/prerender.ts  reads dist/seo.json once; a missing file is not an error
server/lib/meta.ts     route table (key, title, description, canonical, lang, updated from
                       pageDates, preloadImage, notFound, dynamic body and JSON-LD);
                       renderShellHtml injects canonical, og, hreflang, geo, author, rss,
                       llms, icons, manifest and preconnects, the body inside #root, JSON-LD
server/lib/seo.ts      sitemapXml(site, pages, fallback) with hreflang alternates
server/lib/redirects.ts  retired-path map; a test proves every target is live
server/lib/indexnow.ts   the key, the key path, submitToIndexNow (fire-and-forget)
server/lib/crawlerIdentity.ts  pure: identifyBot (most specific token first), bucketPath,
                       day in the site timezone
server/lib/crawlers.ts   in-memory counts, a 60 s upsert flush and a flush on SIGTERM, summary
drizzle/00xx_crawl_hits.sql  additive: PK (day, bot, path), hits, last_status, last_seen
server/index.ts        discovery routes, retired 301s, the trailing-slash fold, the key
                       file, the shell for every public route, IndexNow on production boot
```

**Crawler tokens, most specific first:** OAI-SearchBot, ChatGPT-User, GPTBot, Claude-SearchBot, Claude-User, ClaudeBot, anthropic-ai, Perplexity-User, PerplexityBot, Google-InspectionTool, GoogleOther, Googlebot, bingbot, Applebot, meta-externalagent, meta-externalfetcher, Amazonbot, Bytespider, DuckAssistBot, YouBot, MistralAI-User, cohere-ai, CCBot, YandexBot, Baiduspider, PetalBot.

User agents are claimed, not verified. A burst of many "bots" in the same second probing paths that do not exist is one scanner.

### JAL tuning: where each file goes in the JAL template

The JAL template (`templates/monorepo`) is a Turborepo with `apps/web` (Bun.build SPA plus a Hono server that serves the HTML), `apps/api` (the Hono API, domain modules under `src/modules/`, infra behind ports in `src/core/`), `packages/ui`, `migrations/*.sql` and `tools/migrate.ts`.

| Reference | JAL path | Owner |
|---|---|---|
| `shared/business.ts`, `rates.ts`, `press.ts`, `positioning.ts`, `differentiators.ts`, `pageDates.ts`, `lang.ts` | `packages/facts/src/*.ts`, exported from `packages/facts/src/index.ts`; a new workspace package (not a new dependency), pure data and pure functions, no imports of db, env or app code | jal-frontend |
| `client/content/*.ts` | `apps/web/src/content/*.ts` | jal-frontend |
| `client/seo/content.ts` | `apps/web/src/seo/content.ts` (build time only; never in the runtime image) | jal-frontend |
| FAQ, key facts, byline and `<time>` components | `packages/ui/src/seo/*.tsx`, on the JAL Core tokens | jal-frontend (jal-ux taste gate) |
| `build.ts` | `apps/web/build.ts`, extended: runs the generator, writes `dist/seo.json`, builds separate public, admin and report entrypoints, copies `apps/web/public/` into `dist/` | jal-frontend |
| Route-table copy (inside `meta.ts` on Padel Party) | `apps/web/server/lib/metaCopy.ts` | jal-frontend |
| `server/lib/prerender.ts`, `meta.ts`, `seo.ts`, `redirects.ts`, `indexnow.ts` | `apps/web/server/lib/*.ts` | jal-backend |
| `server/lib/crawlerIdentity.ts` | `apps/web/server/lib/crawlerIdentity.ts`, pure and import-free | jal-backend |
| `server/lib/crawlers.ts` | `apps/web/server/lib/crawlers.ts`: in-memory counts, the 60 s flush, the SIGTERM flush | jal-backend |
| Crawler storage and summary | `apps/api/src/modules/crawl/` (`index.ts`, `routes.ts`, `service.ts`, `repo.ts`, `ports.ts`), the repo on the DbPort in `apps/api/src/core/ports/db.ts` | jal-backend |
| `drizzle/00xx_crawl_hits.sql` | `migrations/NNNN_crawl_hits.sql` (next free number), raw SQL run by `bun run migrate up` (`tools/migrate.ts`) | jal-backend |
| Admin crawler view | `apps/web/src/admin/CrawlerLog.tsx` in the admin entrypoint, reading `GET /admin/crawl/summary` | jal-ux |
| `server/index.ts` routes | `apps/web/server.ts` (discovery routes, retired 301s, the trailing-slash fold, the key file, the shell for every public route) | jal-backend |
| `server/index.ts` boot | `apps/web/serve.ts` (after `Bun.serve` is listening: IndexNow on production boot, the crawler flush timers, the SIGTERM flush) | jal-backend |
| Favicons, manifest, og image | `apps/web/public/` (unhashed), linked from the server head builder | jal-frontend (files), jal-backend (injection) |
| Runtime image | `infra/Dockerfile.web` | jal-devops |

**JAL tuning: the crawler log placement.** HTML requests arrive at `apps/web`, but the modular-monolith law puts a domain's table in an `apps/api` module. The default design:
- `apps/web/server/lib/crawlers.ts` counts hits in memory per (day, bot, path) with `crawlerIdentity.ts`, and every 60 s, and on SIGTERM, posts the batch to `POST /internal/crawl/hits` on `apps/api` with a bearer token from `CRAWL_INGEST_TOKEN` (env only), a short timeout, and no retry storm. A failed flush keeps the counts for the next one and never blocks a request.
- `apps/api/src/modules/crawl/` validates the batch (row cap, token compared in constant time), upserts through the DbPort, and serves `GET /admin/crawl/summary?days=14` (per bot, page and day) behind the project's admin auth, with noindex.
- jal-backend confirms this against the alternative (`apps/web` writing to Postgres directly through `pg`, already in the template) with `be.placement` in W0, and records the pick.

**JAL tuning: the crawler-log migration is raw SQL.** JAL uses no ORM, so the drizzle file becomes `migrations/NNNN_crawl_hits.sql` in the `tools/migrate.ts` format. It is additive: it only creates a table.

```sql
-- NNNN_crawl_hits.sql
-- Crawler log: one row per (day in the site timezone, bot token, bucketed path).

-- up
CREATE TABLE IF NOT EXISTS crawl_hits (
  day         DATE        NOT NULL,
  bot         TEXT        NOT NULL,
  path        TEXT        NOT NULL,
  hits        INTEGER     NOT NULL DEFAULT 0,
  last_status SMALLINT    NOT NULL,
  last_seen   TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (day, bot, path)
);

-- down
DROP TABLE IF EXISTS crawl_hits;
```

The flush upsert, parameterized, in `apps/api/src/modules/crawl/repo.ts`:

```sql
INSERT INTO crawl_hits (day, bot, path, hits, last_status, last_seen)
SELECT * FROM unnest($1::date[], $2::text[], $3::text[], $4::int[], $5::smallint[], $6::timestamptz[])
ON CONFLICT (day, bot, path) DO UPDATE SET
  hits        = crawl_hits.hits + EXCLUDED.hits,
  last_status = EXCLUDED.last_status,
  last_seen   = GREATEST(crawl_hits.last_seen, EXCLUDED.last_seen);
```

---

## 8.2 Rules that make it hold

- The runtime image carries no `client/` source. Nothing under `server/` imports `client/`; the build resolves everything into `dist/seo.json`. Breaking this rule once caused a 20-minute outage on Padel Party.
  - **JAL tuning:** in JAL terms, nothing under `apps/web/server/`, `server.ts` or `serve.ts` imports `apps/web/src/`. The runner stage of `infra/Dockerfile.web` copies `dist/`, `server.ts`, `serve.ts`, `server/` and `packages/facts/` (the manifests stage copies every `apps/*` and `packages/*` package.json, `packages/facts` included, so the frozen-lockfile install passes), never `apps/web/src/`. jal-qa boots the built image in W2, so a missing import fails the gate, not production.
- The Bun HTML bundler cannot resolve `public/` paths (fonts, favicons, manifest) written in `client/index.html`. Inject those links from the server's head builder. (**JAL tuning:** `apps/web/src/index.html` stays free of `public/` links; `meta.ts` injects them.)
- The route-table copy and the client copy match byte for byte, enforced by a test.
- Tests that import db, env or meta can break tests that set env before import. Keep pure logic in import-free modules. (**JAL tuning:** `packages/facts`, `crawlerIdentity.ts` and the redirect map stay import-free.)
- Dynamic pages (such as a monthly archive) set `dynamic: true` so the shell cache skips them. They are appended to the sitemap, llms.txt and IndexNow at request time.
- When a page's facts change, bump its date in `pageDates.ts`. The sitemap, JSON-LD and the visible `<time>` follow.
- **Rendered-text rules:**
  - A real `{" "}` inside each split word or line span. In JSX, never as a second sibling in a `.map` return; that is a syntax error.
  - Spaces between flex and grid siblings.
  - Marquee words drawn with CSS `content: attr(data-text)`.
  - Count-ups skip animation when `navigator.webdriver` is true or the user agent matches a bot pattern.
  - A sentence equivalent under every merged-cell table.
- **Legal pages** describe what the code collects: name each form, the analytics, the processors, and the local law (Indonesia: UU PDP No. 27/2022; health data is specific personal data).

**JAL tuning: JAL law on the same surfaces.** No em-dash in any copy, JSON-LD string, llms file or feed. The admin view is white-first with no shadows, gradients, side lines or emoji (`jal-standards` frontend law), and passes `ui_audit`. The discovery and admin routes sit behind the template's hardening middleware (secure headers, rate limiting); the IndexNow key file is the only key that is public by design.

---

## 8.3 Tests installed with the module

- **meta.test:**
  - Indexable paths are exactly the live pages; retired paths return 404 in the table and 301 to live pages.
  - Server and client copy mirror each other.
  - Titles are 50 to 60 characters and name the place; descriptions are 120 to 158; no title is under 15.
  - `/id` routes declare `lang=id`.
  - The head contains hreflang, the locale alternate, geo, feed, llms, manifest and author tags.
  - noindex routes carry only noindex.
  - Dated pages take `lastmod` from `pageDates` in both languages.
- **content.test:**
  - Forbidden claims are scanned across all bodies, JSON-LD and files.
  - Only published experts are named.
  - Press citations equal the record.
  - JSON-LD is valid, with the required nodes (find nodes by an `isType()` helper, because `@type` can be an array).
  - The place node has hours, geo, amenities, offers, `sameAs` and `hasMap` with the cid.
  - FAQ markup equals the rendered FAQ.
  - Key facts, sources, quotes, bylines and the reviewer appear where specified; quotes are 15 words or fewer, whole sentences, and in the record.
  - Legal text matches the code.
  - `/id` internal links never point at untranslated `/id` paths.
- **seo.test:** sitemap hreflang pairs, lastmod fallback.
- **lang.test:** `hasTranslation` is true only for translated paths.

**JAL tuning: where the tests go and how they run** (all `bun test`, happy-dom for components, no network, owned by jal-qa):

| Test | Path | Notes |
|---|---|---|
| meta.test | `apps/web/server/lib/meta.test.ts` | Imports `meta.ts` and `metaCopy.ts` plus the client content modules, compares the copies byte for byte |
| redirects test | `apps/web/server/lib/redirects.test.ts` | Every retired target resolves to a live route in the table |
| content.test | `apps/web/src/seo/content.test.ts` | Reads the generated `dist/seo.json` (built on demand, as `apps/web/src/smoke.test.ts` already does) and the discovery responses from `server.ts` through `app.request`; renders pages in happy-dom to compare the FAQ with its FAQPage markup |
| seo.test | `apps/web/server/lib/seo.test.ts` | Sitemap output from fixture pages |
| lang.test | `packages/facts/src/lang.test.ts` | Pure |
| crawler identity | `apps/web/server/lib/crawlerIdentity.test.ts` | Most specific token first (OAI-SearchBot before GPTBot, Claude-SearchBot before ClaudeBot), path bucketing, the day in the site timezone |
| crawl module | `apps/api/src/modules/crawl/crawl.test.ts` | A fake DbPort, the ingest token check, the row cap, the summary shape |
| IndexNow boot | `apps/web/server/lib/indexnow.test.ts` | Mocked fetch: fires only in production, 10-second timeout, never throws into boot, submits only the site's own host |

The forbidden-claims test must fail when a placeholder fact reaches a served body (acceptance criterion 4); jal-qa proves that once by planting a placeholder in a fixture and watching the test fail.

---

## 8.4 Next.js adaptation (only for existing sites; JAL law bans Next.js for new projects)

- Metadata API for titles, descriptions, canonicals and `alternates.languages`.
- `app/sitemap.ts`, `app/robots.ts`, and route handlers for llms, ai, feed and the IndexNow key.
- JSON-LD in a `<script type="application/ld+json">` from server components. SSR already gives crawlers text.
- IndexNow in a post-deploy script or at server start, never at build time.
- The same fact modules and tests.

**JAL tuning:** the same crew split applies (jal-frontend the fact modules and copy, jal-backend the route handlers and IndexNow, jal-qa the tests under `bun test`, jal-devops the deploy). The integrate run never migrates an existing Next.js site to another stack on its own; that is a scope change for Brian.

---

## Pitfalls met on Padel Party (appendix 12.7, the integrate ones)

- Never chain `git commit` after a `grep` of test output: the commit runs even when the tests fail. (Under JAL, only the lead commits, after reading the real test output.)
- A test that looks up a node with `@type ===` breaks when the type becomes an array.
- Titles grow past 60 characters when a language adds words. Test both languages.
- The old privacy policy denied collecting children's data while a form collected a child's date of birth and medical history.
- A crawl-generated llms-full.txt from a third-party tool is an audit input, never a file to host.

## Install edits beyond copying the templates (found in the proof run)

- `apps/web/tsconfig.json` must include `server/` and `serve.ts`.
- Adding the `packages/facts` dependency changes `bun.lock`. Commit it so CI's `bun install --frozen-lockfile` passes.
- The Docker build stage needs `.jal/seo-geo-aeo.json`, because the IndexNow allowlist is read at build time.
- The scaffold's SPA fallback (unknown paths return 200) is replaced by the real 404 with noindex. The scaffold demo moves to `/app`. `seo-geo-aeo/templates` ships the replacement `server.test.ts` and `smoke.test.ts`.
- The template's root `bunfig.toml` sets `linker = "hoisted"` (v0.4.0), so the Docker runner stages resolve every dependency from `/repo/node_modules`.
