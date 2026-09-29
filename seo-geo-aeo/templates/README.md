# seo-geo-aeo/templates

These are the ready-to-copy files that `/jal-seo-geo-aeo integrate` installs into a JAL project scaffolded from `templates/monorepo`: the runtime search layer from `integrate.md` section 8, adapted to the JAL layout. Every path below is relative to this folder (source) or to the project root (destination).

`__APP_NAME__` in any file is the project's package scope, the `name` in the root `package.json`. Replace it on install, as the scaffold does.

## How it fits together

```text
packages/facts          verified facts, defined once, import-free (placeholders until the owner confirms)
   |            \
apps/web/src             apps/web/server/lib/metaCopy.ts   route-table copy, mirrors the client copy
  content/*.ts            |
  pages/SitePage.tsx      meta.ts  route table + renderShellHtml (head, body inside #root, JSON-LD)
  seo/content.ts ---build---> dist/seo.json ---read once---> server.ts (discovery, 301s, shell, key file)
                                                            serve.ts  (listen, crawler flush, IndexNow on boot)
apps/web/server/lib/crawlers.ts --POST /internal/crawl/hits--> apps/api/src/modules/crawl --> crawl_hits
apps/web/src/admin (separate bundle) --GET /admin/crawl/summary--> apps/api
```

Rules the files enforce (integrate.md 8.2):
- Nothing under `apps/web/server/`, `server.ts` or `serve.ts` imports `apps/web/src/`. The server gets bodies, JSON-LD and discovery files from `dist/seo.json`, and facts from `packages/facts`. `meta.test.ts` scans the imports and fails on a violation.
- A missing `dist/seo.json` is not an error. The shell still carries the full head from `metaCopy.ts`, and `#root` is empty.
- A placeholder fact fails closed. `ownerFact()` and `ownerNumber()` are loud markers. The forbidden-claims test in `content.test.ts` fails while any of them reaches a served body, a JSON-LD block or a discovery file. `bun run build` exits 1 and names each one (`SEO_ALLOW_PLACEHOLDERS=1` gives a local draft only).

## File map

Action: **new** means the file does not exist in the scaffold. **replace** means it replaces a scaffold file; if the project's copy has diverged, merge the listed change instead. **edit** means a small change to an existing file. Owner is the W1 workstream in `integrate.md`.

| Template (this folder) | Destination (project) | Action | Owner |
|---|---|---|---|
| `config/seo-geo-aeo.json` | `.jal/seo-geo-aeo.json` | new, filled with the owner (webmaster.md 7.4) | lead |
| `intent-map.md` | `.jal/intent-map.md` | new | lead |
| `report.md` | `.jal/seo-geo-aeo/audit-YYYY-MM-DD.md` (the command's report format, 4.6) | per run | lead |
| `packages/facts/package.json`, `tsconfig.json` | `packages/facts/` | new workspace package (not a new dependency) | WS-A |
| `packages/facts/src/placeholder.ts` | same | new: `ownerFact`, `ownerNumber`, `PLACEHOLDER_ORIGIN`, `PLACEHOLDER_PATTERNS` | WS-A |
| `packages/facts/src/business.ts`, `rates.ts`, `press.ts`, `positioning.ts`, `differentiators.ts`, `pageDates.ts` | same | new, every value a placeholder until confirmed; write `// confirmed YYYY-MM-DD by <who>` beside each | WS-A |
| `packages/facts/src/lang.ts` | same | new: `TRANSLATED_PATHS`, `pathForLang`, `splitLangPath`, `hasTranslation`; set `DEFAULT_LANG` from the config's `defaultLanguage` | WS-A |
| `packages/facts/src/forbidden.ts` | same | new: one regex per rejected claim, plus placeholders and U+2014 | WS-A |
| `packages/facts/src/derived.ts`, `index.ts` | same | new | WS-A |
| `packages/facts/src/lang.test.ts` | same | new | WS-D |
| `packages/ui/src/seo/index.tsx` | same | new: `FaqList`, `KeyFacts`, `Byline`, `TimeStamp`, `SourceLink`, `InlineSource` | WS-A |
| (none) | `packages/ui/src/index.ts` | edit: append `export * from "./seo";` | WS-A |
| `apps/web/src/content/types.ts`, `en.ts`, `id.ts`, `index.ts` | same | new: page copy per language, facts only from `packages/facts` | WS-A |
| `apps/web/src/pages/SitePage.tsx`, `site.css` | same | new: the content page and the 404, rendered by the build and hydrated by the browser | WS-A |
| `apps/web/src/seo/content.ts`, `jsonld.ts`, `discovery.ts`, `build-hook.ts`, `text.d.ts` | same | new, build time only | WS-A |
| `robots.txt` | `apps/web/src/seo/robots.txt` | new (12.1); `<Brand>`, `<domain>`, `/<admin-path>` are filled by the generator | WS-A |
| `llms.txt` | `apps/web/src/seo/llms.skeleton.txt` | new (12.2); the generator emits llms.txt in this heading order and fails on a heading it has no section for | WS-A |
| `apps/web/src/index.tsx` | same | replace: hydrate the page, `/app` keeps the scaffold App, else the 404 | WS-A |
| `apps/web/build.ts` | same | replace: admin entrypoint, `dist/admin.html`, `public/` copy, `writeSeoArtifacts()` | WS-A |
| `apps/web/server/lib/metaCopy.ts` | same | new: the route-table copy | WS-A |
| `apps/web/server/lib/seoTypes.ts`, `prerender.ts`, `meta.ts`, `seo.ts`, `redirects.ts`, `indexnow.ts`, `crawlerIdentity.ts`, `crawlers.ts` | same | new | WS-B |
| `apps/web/server.ts` | same | replace: `createWebApp()` (scaffold secureHeaders kept), discovery routes, 301s, trailing-slash fold, key file, shell, real 404 | WS-B |
| `apps/web/serve.ts` | same | replace: adds the crawler flush timer, the SIGTERM flush, IndexNow on production boot | WS-B |
| `apps/web/tsconfig.json` | same | replace: `include` adds `server` and `serve.ts` | WS-B |
| (none) | `apps/web/package.json` | edit: add `"@__APP_NAME__/facts": "workspace:*"` to `dependencies`, run `bun install`, commit `bun.lock` | WS-A |
| `apps/web/src/admin/CrawlerLog.tsx`, `admin.css`, `index.tsx` | same | new: the admin crawler view, separate entrypoint | WS-C |
| `apps/api/src/modules/crawl/index.ts`, `routes.ts`, `service.ts`, `repo.ts`, `ports.ts` | same | new domain module on the DbPort | WS-B |
| `apps/api/src/core/app.ts` | same | replace (or add the `.route("/", createCrawlModule(...))` block) | WS-B |
| `migrations/NNNN_crawl_hits.sql` | `migrations/<next free NNNN>_crawl_hits.sql` | new; rename NNNN (tools/migrate.ts orders by name) | WS-B |
| `apps/web/server/lib/meta.test.ts`, `redirects.test.ts`, `seo.test.ts`, `crawlerIdentity.test.ts`, `crawlers.test.ts`, `indexnow.test.ts` | same | new | WS-D |
| `apps/web/src/seo/content.test.ts` | same | new: forbidden claims, JSON-LD, markup parity, quotes, links, discovery files | WS-D |
| `apps/web/src/admin/CrawlerLog.test.tsx` | same | new | WS-D |
| `apps/api/src/modules/crawl/crawl.test.ts` | same | new | WS-D |
| `apps/web/src/server.test.ts`, `smoke.test.ts` | same | replace: unknown paths are now a real 404, and the smoke test proves JS-off text equals the hydrated text | WS-D |
| `infra/Dockerfile.web` | same | replace: deps + `packages/facts/package.json`; build + `.jal/seo-geo-aeo.json`; runner keeps the `/repo` layout and copies `server/` and `packages/facts/`, never `src/` | WS-E (jal-devops) |
| (none) | `.env.example` | edit: add `INDEXNOW_KEY=`, `CRAWL_INGEST_TOKEN=`, `CRAWL_ADMIN_TOKEN=`, optional `CRAWL_INGEST_URL=` | WS-B |

## Install order

1. **Config.** Write `.jal/seo-geo-aeo.json` with the owner: the site URL (the IndexNow allowlist), the languages and `defaultLanguage`.
2. **Facts.** Copy `packages/facts/`, set `DEFAULT_LANG` in `lang.ts` to the config's `defaultLanguage`, add the dependency to `apps/web/package.json`, run `bun install`. Leave every placeholder in place until the owner confirms the value.
3. **UI blocks.** Copy `packages/ui/src/seo/` and add its export line.
4. **Copy and generator.** Copy `apps/web/src/content/`, `pages/` and `seo/`, and place `robots.txt` and `llms.txt` as above. Write the copy from the intent map (`seo.intent_page`, `seo.copy_screen`), then mirror every title and description into `metaCopy.ts`.
5. **Server.** Copy `apps/web/server/lib/`, then replace `server.ts`, `serve.ts`, `build.ts`, `src/index.tsx` and `tsconfig.json`. Put any retired URL into `redirects.ts`.
6. **Crawler log.** Copy `apps/api/src/modules/crawl/`, register it in `core/app.ts` (swap `authorizeAdmin` for the project's admin auth when it has one), add the migration with the next number, and copy `apps/web/src/admin/`.
7. **Tests.** Copy every `*.test.ts` above, and replace `server.test.ts` and `smoke.test.ts`.
8. **Image and env.** Replace `infra/Dockerfile.web` and extend `.env.example`. Secrets go in Coolify env, never in a file.
9. **Owner facts.** Replace each placeholder with the confirmed value and its date. Add every rejected claim to `forbidden.ts`. The suite stays red until the last placeholder is gone.
10. **Verify:** `bun test`, `bun run typecheck`, `bun run check:boundaries`, `bun run build` (writes `apps/web/dist/seo.json`), `bun run migrate up`, then `render.ts` and `audit.ts` against a local production build (integrate.md step 6).

## Env

| Var | Used by | Notes |
|---|---|---|
| `INDEXNOW_KEY` (name set by `indexNowKeyEnv`) | web | 8 to 128 of `[A-Za-z0-9-]`. Public by design: served at `/<key>.txt`. Submission runs only with `NODE_ENV=production`, only for a host in the config. It never blocks boot and times out after 10 s. |
| `CRAWL_INGEST_TOKEN` | web and api | Bearer token for `POST /internal/crawl/hits`, compared in constant time. Unset means the flush keeps counts in memory, and the api rejects everything. |
| `CRAWL_INGEST_URL` | web | Defaults to `$API_URL/internal/crawl/hits`. |
| `CRAWL_ADMIN_TOKEN` | api | The default admin guard for `GET /admin/crawl/summary`, until the project's admin auth replaces it. |

## Adapting beyond the sample pages

- **Pages.** The templates ship `home`, `rates`, `guide` (EN only, to exercise an untranslated path) and `contact`. Add a page in four places: `PAGE_PATHS` (and `TRANSLATED_PATHS` if translated), each language's content module, `metaCopy.ts`, and `pageDates.ts`. The tests catch any place you miss.
- **Default language ID.** Set `DEFAULT_LANG = "id"`, move the full page set into `id.ts` and the translated subset into `en.ts` (which then lives under `/en`). Then set `defaultLanguage` in the config. `lang.test.ts` and the build both fail while the two disagree.
- **Dynamic pages** (for example a monthly archive): add routes with `dynamic: true` in `meta.ts`, and append them to the sitemap, llms.txt and IndexNow at request time.
- **Legal pages:** write them from what the code collects, then add the "legal text matches the code" test where `content.test.ts` marks it.
