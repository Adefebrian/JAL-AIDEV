# JAL-AIDEV upgrade instruction: one command, `/jal-seo-geo-aeo`

**SEO, GEO and AEO: audit, integrate and boost.**

> Paste this whole file into the Claude session running the JAL-AIDEV major upgrade. It
> replaces any earlier "GEO layer" prompt. Everything here comes from work shipped and
> measured on padelparty.id (repo `JAL-Group/PadelParty-Web`, 2026-09-22 to 2026-09-27),
> or was checked against official documentation on 2026-09-29. Anything not verified is
> marked **VERIFY** and must be checked against the official source before code depends
> on it.

---

## 0. What to build

**One user-facing command:** `/jal-seo-geo-aeo`, "SEO, GEO and AEO integration".

It has five modes, and every mode covers all three pillars (SEO, AEO and GEO) equally.

| Mode | What it does | Output |
|---|---|---|
| `audit [url]` | Measures a site against the standard | A scored report: SEO, AEO and GEO each scored 0 to 100, every item PASS, WARN or FAIL with evidence, and the gaps sorted into "code can fix", "needs owner facts", "offsite or human only" |
| `integrate` | Installs the full search layer into the current project | Code, tests, discovery files, structured data, the crawler log and IndexNow, verified locally and on production |
| `boost [url]` | Raises the scores of a site that already has the layer (or is being integrated) | A prioritised backlog, the fixes shipped, the human and offsite packs prepared, then a re-audit showing scores before and after |
| `submit [urls]` | Pushes URLs to search engines | IndexNow, Bing, Yandex (dry run first, then a yes in chat), plus the Search Console manual list |
| `monitor [url]` | Tracks what the engines actually did | Crawler-log summary, index coverage, search performance, and a delta against the last run |

With no argument, the command runs `audit` and then asks which mode to continue with.

**Scope of the upgrade:**
- Add `commands/jal-seo-geo-aeo.md`, the only new entry point.
- Add a support directory `seo-geo-aeo/` with the standard, the playbooks, templates and scripts (section 10). It is not registered as skills or agents, and does not add a new agent. The command dispatches the existing crew where useful: `jal-frontend` and `jal-ux` for UI, `jal-qa` for the QA gate, `jal-devops` for deploys, `jal-researcher` for source verification.
- Integrate with the major upgrade in progress: if directories or conventions changed, follow the new ones.

**Non-negotiables:**
- JAL law holds: Bun only, TypeScript, and QA with `bun test` + happy-dom + puppeteer-core (Playwright is banned).
- Secrets live only in env. No emdash in any frontend copy. White-first UI for any admin view.
- Hard law (section 3) is never sent to JEV. Soft calls go to `jev_decide`: prioritising the boost backlog, choosing which intents get a page, FAQ tone.
- Unit tests never touch the real network.
- A new dependency, for example a Google auth library, is flagged to Brian first and recorded with `jal-adr`.

---

## 1. The three pillars

All three are scored, integrated and boosted. None is a sub-part of another.

| | **SEO**: Search Engine Optimization | **AEO**: Answer Engine Optimization | **GEO**: Generative Engine Optimization |
|---|---|---|---|
| Goal | Be crawled, indexed and ranked in classic search results | Be the direct answer: featured snippets, People Also Ask, voice answers, AI Overviews, FAQ-style answers | Be named, recommended and cited by generative assistants |
| Surfaces | Google, Bing, Yandex, Baidu, local packs and Maps | Google snippets and AI Overviews, Bing answers, voice assistants, in-page answers of assistants | ChatGPT (search and browse), Claude, Perplexity, Gemini, Copilot, DeepSeek, Kimi, Qwen, Meta AI |
| What wins | Technical health, crawlable text, correct status codes and canonicals, sitemaps, hreflang, speed, structured data, internal links, local profile | Questions answered in their own words and first sentence, a URL per intent, FAQ, HowTo and key facts marked up exactly as shown | Verified entity facts everywhere, AI crawler access, llms.txt files, statistics, inline citations and quotes, clean rendered text, presence on the third-party pages assistants read |
| Measured by | Search Console and Bing Webmaster coverage and performance; Lighthouse | Intent coverage; FAQ and markup parity; question queries in Search Console | Crawler log (AI bots per page); prompt panel (optional); citations in assistant answers |

**Shared foundation:** verified facts in shared modules, one text for people and machines, and language as a URL. Every pillar fails without it (section 5.1).

---

## 2. Evidence from padelparty.id

**Before (2026-09-22):** a Bun + Hono + React SPA with an empty `#root` for crawlers without JavaScript. Indexed placeholder pages, including a cloaked membership body. Brave Search, reported to be Claude's web search provider, knew only `/free-trial`.

**Six days later:**
- **SEO:** Lighthouse SEO 100 and accessibility 100 on every page. Public JS fell from 285 to 234 KB gzipped (admin bundle split out). 25 sitemap URLs with hreflang. IndexNow returned 202 on every deploy.
- **AEO:** a conversational FAQ with FAQPage markup on every content page (24 questions per language on the home page), a guide page per beginner intent, and key-facts blocks.
- **GEO:** verified entity data across JSON-LD and llms files, inline press citations, verbatim press quotes, and rendered-text fixes.

**What the crawler log showed in its first 4 days:**
- `ChatGPT-User` fetched the home page 18 times. That user agent only fetches while ChatGPT is answering someone.
- Other hits: bingbot 117, ClaudeBot 70, Googlebot 67, OAI-SearchBot 58, GPTBot 21, PerplexityBot 15.
- ChatGPT began naming Padel Party for "padel di depok".

**Not moved by on-site work alone:**
1. **List-intent prompts** ("tempat padel di depok") are answered from third-party listicles and directories.
2. **Crawl coverage lagged:** after four days, OAI-SearchBot and PerplexityBot had not yet read the rates, about or academy pages. Those pages had the densest statistics.

This is why `boost` includes offsite work and discovery pushes, not only content.

**Measured statistic density** (numbers per 100 words of rendered body): rates 18, guide 9, home 6 to 7. A typical article runs 1 to 3.

---

## 3. Hard law (never sent to JEV)

1. **Verified facts only.**
   - Every fact on a page comes from one shared module (business, rates, press, positioning, pageDates, ...), with the owner's confirmation date in a comment.
   - Each rejected claim becomes a regex in a forbidden-claims test that scans every served body, every JSON-LD block, llms.txt and every discovery file.
   - The command asks the owner for missing facts; it never infers them.
2. **One text for people and machines.**
   - The prerendered body is the page's own first paint inside `#root`.
   - Markup (FAQ, HowTo, offers) describes only what the page shows. Anything else is cloaking and banned.
3. **One source per fact.** Name, address, phone, hours, prices and dates are defined once. Server route-table copy and client copy are tested to match byte for byte.
4. **Language is a URL.**
   - EN default, `/id/...`, paired with hreflang plus x-default, and only for paths that are really translated.
   - Never switch language by cookie.
5. **No self-serving review markup** (`aggregateRating` or `Review` about the business on its own site).
6. **Verbatim quotes only.**
   - Whole sentences, 15 words or fewer, attributed to speaker, role, outlet and date, and checked against the article on the day they are added.
   - Never quote a source's known error.
7. **Measured metadata.** Indexable titles are 50 to 60 characters and name the place. Descriptions are 120 to 158. No title anywhere is under 15. Tests enforce all three.
8. **Secrets in env.** Webmaster keys, service-account JSON and OAuth tokens never appear in files, chat or logs. The IndexNow key is public by design.
9. **No SERP scraping and no CAPTCHA bypass.** Read indexation and rankings from the consoles and their APIs.
10. **Outward actions are confirmed.**
    - Submitting URLs through an API, editing Wikidata, or changing a Business Profile needs a yes in chat.
    - The exception: IndexNow submitting the project's own indexable URLs on production boot is standing authorisation.
    - Submissions go only to hosts listed in `.jal/seo-geo-aeo.json`.

---

## 4. Command spec: `commands/jal-seo-geo-aeo.md`

**Frontmatter description:**

> SEO, GEO and AEO in one command: audit a site and score SEO, AEO and GEO 0 to 100 with evidence, integrate the full JAL search layer into a project, boost an existing site's scores and prove the delta, submit URLs to IndexNow, Bing and Yandex, and monitor crawlers, index coverage and search performance. Modes: audit, integrate, boost, submit, monitor.

### 4.1 Common start (every mode)

1. Read `.jal/seo-geo-aeo.json`. If it is missing, create it with the owner (section 7.4).
2. Resolve the plugin support directory: `${CLAUDE_PLUGIN_ROOT}/seo-geo-aeo`. **VERIFY** that the variable is available in command context. Otherwise fall back to locating the installed plugin path. The `jal-design` MCP server already handles this case.
3. Load `seo-geo-aeo/standard.md` (the law, and the checklists with IDs and weights).

### 4.2 `audit`

1. **Fetch.** Run `scripts/audit.ts` on every indexable URL: HTML, head, JSON-LD, discovery files, status codes and redirects.
2. **Render.** Run `scripts/render.ts` (puppeteer-core) on each URL for rendered-text hygiene.
3. **Measure.** Run `scripts/density.ts`: statistic density, inline citations and quotes per page.
4. **Crawler evidence.** If the project has the crawler log, query it: which bot read which page, and when.
5. **Console evidence** (if configured): `scripts/gsc.ts inspect` for key URLs, `scripts/gsc.ts performance` for the last 28 days, `scripts/bing.ts quota` and `scripts/yandex.ts quota`.
6. **Intent map.** Build or update `.jal/intent-map.md` (clusters, prompts per language, the answer required, the URL, status, gap cause).
7. **Score** each checklist item PASS, WARN, FAIL or N/A with evidence, then compute the three pillar scores (section 4.5).
8. **Report** (section 4.6) and save it to `.jal/seo-geo-aeo/audit-YYYY-MM-DD.md` so the next run can show a delta.

### 4.3 `integrate`

1. **Intake.** Collect the owner's facts per the intake list in `standard.md`: name, alternate names, NAP, geo pin and maps link, hours, prices, programmes, people and credentials, differentiators, press, socials, booking, languages. Ask for anything missing.
2. **Baseline audit.** Run `audit` first.
3. **Implement** the runtime module (section 8): shared fact modules, copy modules in each language, the build-time generator, the route table and head injection, discovery routes, redirects, the IndexNow key and boot submission, and the crawler log with its migration and admin view.
4. **Content.** For each strong intent, write the pages and FAQs from the intent map.
5. **Tests.** Meta, content, SEO and language tests (section 8.3), plus the forbidden-claims test.
6. **Verify:** `bun test`, the build, `render.ts` against a local production build, and local Lighthouse (`bunx lighthouse@12` with Chrome for Testing).
7. **Deploy** through the project's normal path (`jal-devops`, Coolify). Confirm the deploy is live by repeated probes: Coolify rolls deploys with two containers, so check the chunk hash and a string only the new build contains.
8. **Submit.** IndexNow runs automatically on boot. Everything else goes through `submit`.
9. **Human steps.** Output the console setup checklist (section 7.2).
10. **Re-audit** and report the delta against the baseline.

### 4.4 `boost`

1. **Audit** (or load today's audit) as the baseline.
2. **Build the backlog.**
   - Score every FAIL and WARN as `impact = weight × (1 − status)`, where PASS = 1, WARN = 0.5 and FAIL = 0.
   - Add the data-driven opportunities from the pillar playbooks (section 6).
   - Estimate effort (S, M or L). JEV orders ties.
3. **Split the backlog:**
   - **Code:** the command implements these now.
   - **Owner facts:** the command asks for these.
   - **Human or offsite:** the command writes ready-to-use packs.
4. **Implement** the code items, then verify and deploy as in `integrate` steps 6 and 7.
5. **Discovery push.** Run `submit` for changed and new URLs, and output the Search Console request-indexing list.
6. **Re-audit** and report scores before and after per pillar, per item and per intent. Schedule a `monitor` check at 3, 7 and 14 days.

### 4.5 Scoring model

- Each item in `standard.md` has an ID (SEO-xx, AEO-xx, GEO-xx), a weight from 1 to 3, a check method (automatic, evidence, or human), and a fix method (code, owner, or human).
- Item status is worth: PASS 1, WARN 0.5, FAIL 0. N/A is excluded from the total.
- `pillar score = round(100 × Σ(weight × status) / Σ(weight of applicable items))`.
- Items that only a human can verify (console setup, Business Profile) count toward the score only when the owner confirms them. Otherwise they are listed as "unverified" and excluded, never guessed as PASS.
- Bands: 90 to 100 strong; 70 to 89 needs work; below 70 weak.

### 4.6 Report format

1. **Scores:** SEO, AEO and GEO (with the delta against the previous audit when one exists).
2. **One table per pillar:** ID, item, status, evidence (URL, value, or file and line), fix, and who fixes it (code, owner, or human).
3. **Why it may not be showing up yet:** crawl coverage from the crawler log, index state from the consoles, and how much the list-intent prompts depend on third-party pages. Content quality is never assumed to be the cause without this evidence.
4. **Questions for the owner.**
5. **Human steps:** the consoles, Business Profile, and offsite packs.
6. **Backlog** (boost only), with impact, effort and status.

---

## 5. The standard: `seo-geo-aeo/standard.md`

### 5.1 Shared foundation (counted in every pillar)

| ID | Item | W | Check | Fix |
|---|---|---|---|---|
| F-01 | Facts live in shared modules with confirmation dates; nothing on a page restates a fact as a literal | 3 | evidence (code) | code |
| F-02 | A forbidden-claims test covers every rejected claim and scans all served text | 3 | auto (tests exist and pass) | code |
| F-03 | The prerendered or SSR body equals the visible content; markup equals what is shown | 3 | auto | code |
| F-04 | Language per URL, hreflang only for translated paths, and `/id` links never point at untranslated `/id` paths | 2 | auto | code |

F-01 to F-04 are included in each pillar's score.

### 5.2 SEO checklist

| ID | Item | W | Check | Fix |
|---|---|---|---|---|
| SEO-01 | robots.txt: wildcard group, named group of documented crawler tokens, admin and API disallowed, Sitemap line, no non-standard directives (Lighthouse rejects `Content-Signal` there) | 3 | auto | code |
| SEO-02 | sitemap.xml lists every indexable URL (dynamic ones included), with lastmod from the page-dates record and xhtml hreflang pairs | 3 | auto | code |
| SEO-03 | Status codes: real 404 with noindex; retired URLs 301 to the live page answering the same question; trailing slash 301; one host (www or apex); http to https | 3 | auto | code |
| SEO-04 | A canonical on every indexable page, equal to og:url; none on noindex pages | 3 | auto | code |
| SEO-05 | Titles 50 to 60 characters, naming the place, unique; descriptions 120 to 158, unique | 3 | auto | code |
| SEO-06 | `<html lang>` per URL; og:locale plus alternate | 2 | auto | code |
| SEO-07 | Structured data valid: WebSite, Organization (with industry subtype), place as `LocalBusiness` plus specific subtypes with address, geo, hasMap (share link and `?cid=` URL), openingHoursSpecification (midnight is 23:59), priceRange, amenityFeature, sameAs; BreadcrumbList on every page | 3 | auto | code |
| SEO-08 | Open Graph and Twitter complete; og:image is a 1200x630 PNG, never SVG | 1 | auto | code |
| SEO-09 | Every meaningful image has alt text; the hero is preloaded at the right size; LCP is within budget on mobile | 2 | auto (Lighthouse) | code |
| SEO-10 | Local Lighthouse: SEO and accessibility at 100 (WARN 90 to 99, FAIL below 90) | 2 | auto | code |
| SEO-11 | The public bundle excludes admin and staff consoles; JS size is tracked between audits | 1 | auto | code |
| SEO-12 | Favicons and manifest are unhashed and injected server-side; manifest is served as `application/manifest+json` (`display: "browser"` when a separate installable app exists) | 1 | auto | code |
| SEO-13 | Admin and private routes carry noindex; hashed assets carry `X-Robots-Tag: noindex` | 1 | auto | code |
| SEO-14 | Internal links: every indexable page is within 2 clicks of home; the footer links contact, privacy and terms in the reader's language | 2 | auto | code |
| SEO-15 | IndexNow key file served; all indexable URLs submitted on production boot | 2 | auto | code |
| SEO-16 | Search Console, Bing Webmaster and Yandex Webmaster verified, with the sitemap submitted | 2 | human | human |
| SEO-17 | Google Business Profile: specific category, hours and NAP identical to the site, description consistent with the positioning, real photos, reviews answered | 2 | human | human |
| SEO-18 | Trust pages: contact page (ContactPage markup), a privacy policy that matches what the code collects, and terms | 1 | auto + evidence | code |

### 5.3 AEO checklist

| ID | Item | W | Check | Fix |
|---|---|---|---|---|
| AEO-01 | An intent map exists: clusters, prompts per language, required answer, URL, status, gap cause | 3 | evidence | code + owner |
| AEO-02 | Intent coverage: share of clusters rated strong (report the number; WARN below 70%, FAIL below 50%) | 3 | auto (from the map) | code + owner |
| AEO-03 | A URL per high-value intent (for example: guide, rates, contact, programme) | 2 | auto | code |
| AEO-04 | An FAQ on every content page: the question as it is typed into an assistant, the answer in the first sentence, then the next detail; both languages | 3 | auto | code |
| AEO-05 | FAQPage markup equals the rendered FAQ exactly | 3 | auto | code |
| AEO-06 | A key-facts TL;DR near the top of money, about and programme pages: numbers first, sources beside third-party claims | 2 | auto | code |
| AEO-07 | HowTo on guides, Course with CourseInstance on programmes, OfferCatalog on prices | 2 | auto | code |
| AEO-08 | Answer-first leads; headings phrased as the question or the topic | 1 | auto (heuristic) + review | code |
| AEO-09 | Tables and grids also have a sentence equivalent (merged cells flatten badly) | 1 | auto | code |
| AEO-10 | Owner-confirmed superlatives answered plainly ("Ya." followed by the facts); unconfirmed ones are never claimed | 1 | evidence | owner |
| AEO-11 | Editorial pages show a byline, a reviewer (only if the owner approves) and a visible `<time>`; JSON-LD carries author, publisher, datePublished (from git), dateModified, reviewedBy and lastReviewed from one dates record | 2 | auto | code |
| AEO-12 | Question queries from Search Console (who, what, where, how much, berapa, di mana, bagaimana) each map to an FAQ entry or a page | 2 | console data | code |

### 5.4 GEO checklist

| ID | Item | W | Check | Fix |
|---|---|---|---|---|
| GEO-01 | AI crawlers allowed: named groups present, and no WAF, CDN or bot-protection rule blocking the documented tokens (test with each token's user agent) | 3 | auto | code + human |
| GEO-02 | `/llms.txt` and `/.well-known/llms.txt` and `/llms-full.txt`, generated from the fact modules, linked from every page head | 2 | auto | code |
| GEO-03 | `/.well-known/ai.txt` (with Content-Signal), `/ai/summary.json`, `/ai/faq.json`, `/feed.xml` | 1 | auto | code |
| GEO-04 | Entity consistency: the same name, NAP, hours and category across the site, JSON-LD, llms files, Business Profile, Bing Places, Apple Business Connect, Wikidata and OSM | 3 | auto (site) + human | code + human |
| GEO-05 | `sameAs` complete (socials, booking, community, maps cid); topic linked through `sport` or `knowsAbout` to Wikidata and Wikipedia; alternateName lists the names people use | 2 | auto | code |
| GEO-06 | Statistic density on money pages (report the number; WARN below 5 per 100 words, which is the JAL threshold set from Padel Party's measured 9 to 18) | 2 | auto | code + owner |
| GEO-07 | Inline citations beside third-party claims, not only a press list at the bottom | 2 | auto | code |
| GEO-08 | At least one verified verbatim quote from independent coverage on about and programme pages (N/A when there is no coverage) | 1 | auto | code |
| GEO-09 | Rendered-text hygiene: no joined words in split headings or flex siblings, no marquee noise, no mid-animation numbers for bots, no copy contradicting facts | 3 | auto (render) | code |
| GEO-10 | Crawler log live, with an admin view per bot, page and day | 2 | auto | code |
| GEO-11 | Crawl coverage: key URLs read by bingbot, OAI-SearchBot or ChatGPT-User, PerplexityBot and ClaudeBot within the last 14 days | 2 | crawler log | code + submit |
| GEO-12 | Press records fetched, read and live; dead links removed | 1 | auto | code |
| GEO-13 | Offsite list-intent presence: for each list-intent cluster, the brand appears on the top third-party pages that answer it | 2 | human (manual search) | human |
| GEO-14 | Programmatic pages from real data where the business produces data (for example a monthly leaderboard archive) | 1 | evidence | code |

### 5.5 Owner intake list (used by `integrate` and `boost`)

- **Identity:** official name, the other names people use, category, opening date, positioning claims the owner confirms.
- **Where:** street address, district, city, region, postcode, the map share link (resolve it to coordinates and cid), landmark or directions, parking.
- **When and how much:** hours per day, price list, time bands and their clock hours, packages, rentals and extras.
- **Who:** people who may be named, with their roles and credentials; who may be credited as a content reviewer.
- **What:** programmes and classes (ages, levels, coaches, duration, fees), facilities, differentiators with a URL each.
- **Channels:** booking platform, WhatsApp, email, socials, community platform, app.
- **Proof:** press articles (URLs), awards.
- **Languages** to publish.

Record each fact with its confirmation date. Record each rejected claim as a forbidden regex.

---

## 6. Boost playbooks

### 6.1 SEO boost

- **Fix technical items first:** every automatic FAIL (status codes, canonical, sitemap, robots, titles, markup errors).
- **Search Console performance mining** (`scripts/gsc.ts performance`, 28 days):
  - Queries with high impressions and CTR below the site median: rewrite the title and description with the section 12.3 formulas. Keep the length law.
  - Pages averaging position 4 to 15 for a target query: strengthen the page with an FAQ entry for that query, a key fact, internal links from stronger pages, and fresher dates. Then resubmit.
  - Pages with impressions but not indexed, or indexed but excluded (from URL Inspection): fix the cause, then add them to the request-indexing list.
- **Internal links:** a hub from home and footer to every money page; related-page links on guides.
- **Speed:** split bundles, preload the hero, and set cache lifetimes for fonts and media. Track LCP between audits.
- **Local:** the Business Profile category and description, and review replies (human pack).

### 6.2 AEO boost

- **Close intent gaps:** for every weak or empty cluster, add an FAQ entry, a key fact or a page. Ask the owner when the gap is a missing fact.
- **Turn every question-shaped Search Console query into an FAQ entry** in the language it was typed.
- **Rewrite FAQ answers** so the first sentence answers alone and the rest adds the next detail. Answers should read conversationally in each language.
- **Add HowTo, Course and OfferCatalog** where the page already shows the steps, the classes or the prices.
- **Give every table a sentence equivalent**, and every page a key-facts block where the owner allows it.

### 6.3 GEO boost

- **Discovery push:**
  - Find the pages the crawler log shows AI bots have not read.
  - For those pages: IndexNow (automatic on the next deploy), then `submit` to Bing and Yandex after a yes in chat.
  - Add them to the Search Console request-indexing list, and strengthen their internal links.
- **Entity:** complete `sameAs`, `alternateName`, and the Wikidata and Wikipedia topic links. Prepare the offsite packs (section 9).
- **Evidence density:**
  - Raise statistic density on money pages with verified numbers only.
  - Move third-party claims next to their sources.
  - Add one verified quote per about or programme page.
- **Rendered text:** run `render.ts` on production and fix every flag.
- **List-intent:**
  - Find the third-party pages that rank for each list-intent cluster (search manually or through the console data; never scrape).
  - Prepare an update pitch per page with the verified facts pack.
- **Prompt panel (optional, needs Brian's approval for keys and cost):**
  - Run the intent-map prompts against each engine's API with web search on.
  - Record: brand named (yes or no), brand cited (yes or no), and the cited sources.
  - Note clearly that API answers differ from the consumer apps.

---

## 7. Webmaster integration

### 7.1 Verified API facts (official docs, checked 2026-09-29)

**IndexNow** (`indexnow.org/documentation`)
- Request: POST JSON `{ host, key, keyLocation, urlList }` to `https://api.indexnow.org/indexnow` with content type `application/json; charset=utf-8`.
- Up to 10,000 URLs per POST.
- Ownership: a UTF-8 key file `{key}.txt` at the host root, or at `keyLocation`.
- Participating engines share submissions (Bing, Yandex and others). **VERIFY** the list at `indexnow.org/searchengines`.
- Google does not use IndexNow.
- Padel Party received 202 on every submission.
- **VERIFY** the meaning of each 4xx status in the docs.

**Bing Webmaster API** (`learn.microsoft.com/bingwebmaster/getting-access`)
- OAuth 2.0 is recommended. The alternative is an API key from Settings, API Access. The key is per user, not per site: one key per user, valid for all of that user's verified sites.
- `SubmitUrlBatch`: `POST /webmaster/api.svc/json/SubmitUrlbatch?apikey=KEY` with body `{ siteUrl, urlList }`. At most 500 URLs per batch, within quota. A POX (XML) variant exists.
- `GetUrlSubmissionQuota(siteUrl)` returns the remaining quota.
- **VERIFY** the host (`ssl.bing.com`) and the stats endpoints.

**Google Search Console API** (`developers.google.com/webmaster-tools`)
- URL Inspection: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `{ inspectionUrl, siteUrl, languageCode }`. The URL must be under the `siteUrl` property.
- Scopes: `.../auth/webmasters` or `.../auth/webmasters.readonly`.
- Quotas:
  - URL Inspection: per-site and per-project QPM and QPD, plus an index inspection quota.
  - Search Analytics: 10-minute and daily load quotas, plus QPS, QPM and QPD.
  - **VERIFY** the exact numbers on the limits page.
- **VERIFY** the request shapes of Sitemaps (submit and list) and Search Analytics `query`, and the service-account flow (the service account is added as a user of the property).
- **The Indexing API is only for pages with JobPosting or BroadcastEvent (livestream) markup.** Never use it for other pages.
- "Request indexing" has no API. The command outputs the URL list, and a human clicks it in Search Console.

**Yandex Webmaster API v4** (`yandex.com/dev/webmaster`)
- OAuth token.
- Find the ids first: `GET /v4/user` (user id), then `GET /v4/user/{user-id}/hosts` (host id).
- Recrawl: `POST https://api.webmaster.yandex.net/v4/user/{user-id}/hosts/{host-id}/recrawl/queue` with the URL in the body.
- A daily quota endpoint exists, plus distinct errors for "already added" and "quota exceeded".
- Yandex also consumes IndexNow.

**Baidu** (China only, optional): **VERIFY** everything first.

### 7.2 Human setup per site (the command prints this; it never signs in to anything)

1. **Search Console:** a Domain property (DNS TXT) or URL-prefix property. Submit the sitemap. Add the automation service account as a user if the scripts will be used.
2. **Bing Webmaster Tools:** import from Search Console or verify. Submit the sitemap. Create the API key. Use the IndexNow key issued there, so submissions show in the account.
3. **Yandex Webmaster:** add and verify the site, submit the sitemap, create an OAuth token.
4. **Business Profile, Bing Places, Apple Business Connect:** per section 9.
5. **Credentials** go in the project env or Coolify (7.4), never in chat.

### 7.3 After every deploy

- **Automatic:** the app submits all indexable URLs, dynamic ones included, to IndexNow on production boot. It is fire-and-forget with a 10-second timeout and never blocks boot.
- **Command, after a yes in chat:** Bing and Yandex submissions for new or changed pages, within quota, and URL Inspection for the key URLs.
- **Human:** request indexing in Search Console for the listed new pages.
- **Verify live:** repeated probes (rolling deploys serve old and new builds for a minute), checking the chunk hash and a string unique to the new build. If the Coolify webhook did not fire, queue the deploy through its API.

### 7.4 Config and scripts

`.jal/seo-geo-aeo.json`:

```json
{
  "sites": [
    {
      "url": "https://padelparty.id",
      "gscProperty": "sc-domain:padelparty.id",
      "bingSiteUrl": "https://padelparty.id/",
      "yandexHostId": "https:padelparty.id:443",
      "indexNowKeyEnv": "INDEXNOW_KEY"
    }
  ],
  "languages": ["en", "id"],
  "defaultLanguage": "en",
  "keyUrls": ["/", "/rates", "/about", "/contact"]
}
```

The `yandexHostId` format is **VERIFY** (the value above is an example).

Env vars (never logged, never echoed): `INDEXNOW_KEY`, `BING_WEBMASTER_API_KEY` (or OAuth), `GSC_SERVICE_ACCOUNT_JSON` (a path or base64), `YANDEX_WEBMASTER_TOKEN`, `YANDEX_USER_ID` (optional), and `CHROME_PATH` for puppeteer-core.

Scripts in `seo-geo-aeo/scripts/` (Bun, TypeScript). Each script has a `*.test.ts` with mocked fetch.

| Script | Does | Safety |
|---|---|---|
| `audit.ts <url> [--pages ...]` | Fetches HTML and discovery files; checks every automatic item in 5.2 to 5.4; outputs JSON findings | Read-only |
| `render.ts <url...>` | puppeteer-core with reduced motion and a realistic wait for intro animations; reports joined words in h1 and h2, marquee noise, forbidden phrases, numbers disagreeing with the API | Read-only |
| `density.ts <url or seo.json>` | Words, numbers per 100 words, outbound citations, quotes per page | Read-only |
| `indexnow.ts --site --urls [--send]` | Chunks at 10,000 | Dry run unless `--send`; allowlist only |
| `bing.ts submit or quota` | Chunks at 500; checks quota first | Dry run unless `--send`; key redacted |
| `gsc.ts inspect, sitemap or performance` | URL Inspection, sitemap submit and list, Search Analytics | Quota-aware; submitting a sitemap needs `--send` |
| `yandex.ts recrawl or quota` | Resolves user id and host id, queues recrawl | Dry run unless `--send` |

**Every script:**
- refuses hosts outside the config;
- redacts keys from every output and error;
- retries with backoff only on 429 and 5xx;
- uses timeouts on every request.

---

## 8. Runtime module installed by `integrate`

### 8.1 Reference architecture (Bun + Hono + React SPA, as shipped on Padel Party)

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

### 8.2 Rules that make it hold

- The runtime image carries no `client/` source. Nothing under `server/` imports `client/`; the build resolves everything into `dist/seo.json`. Breaking this rule once caused a 20-minute outage on Padel Party.
- The Bun HTML bundler cannot resolve `public/` paths (fonts, favicons, manifest) written in `client/index.html`. Inject those links from the server's head builder.
- The route-table copy and the client copy match byte for byte, enforced by a test.
- Tests that import db, env or meta can break tests that set env before import. Keep pure logic in import-free modules.
- Dynamic pages (such as a monthly archive) set `dynamic: true` so the shell cache skips them. They are appended to the sitemap, llms.txt and IndexNow at request time.
- When a page's facts change, bump its date in `pageDates.ts`. The sitemap, JSON-LD and the visible `<time>` follow.
- **Rendered-text rules:**
  - A real `{" "}` inside each split word or line span. In JSX, never as a second sibling in a `.map` return; that is a syntax error.
  - Spaces between flex and grid siblings.
  - Marquee words drawn with CSS `content: attr(data-text)`.
  - Count-ups skip animation when `navigator.webdriver` is true or the user agent matches a bot pattern.
  - A sentence equivalent under every merged-cell table.
- **Legal pages** describe what the code collects: name each form, the analytics, the processors, and the local law (Indonesia: UU PDP No. 27/2022; health data is specific personal data).

### 8.3 Tests installed with the module

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

### 8.4 Next.js adaptation (only for existing sites; JAL law bans Next.js for new projects)

- Metadata API for titles, descriptions, canonicals and `alternates.languages`.
- `app/sitemap.ts`, `app/robots.ts`, and route handlers for llms, ai, feed and the IndexNow key.
- JSON-LD in a `<script type="application/ld+json">` from server components. SSR already gives crawlers text.
- IndexNow in a post-deploy script or at server start, never at build time.
- The same fact modules and tests.

---

## 9. Offsite and entity packs (prepared by `boost` and `integrate`; the owner submits them)

- **Google Business Profile:** the most specific primary category (for example "Padel club"), a description of up to 750 characters consistent with the positioning, services, attributes, real photos, and review replies. NAP and hours must be identical to the site. Leave the service area empty for a storefront business.
- **Bing Places:** import from the Business Profile after the category is fixed.
- **Apple Business Connect:** claim the place with the same NAP, hours and website.
- **Wikidata** (the owner's account; search the items in the UI, never guess a Q-id):
  - labels, descriptions and aliases per language;
  - statements: P31 instance of, P17 country, P131 located in, P625 coordinates, P571 inception, P856 official website, P2003 Instagram username, P7085 TikTok username, P641 sport, P6375 street address;
  - P854 references to the verified press URLs.
- **OpenStreetMap:** the owner's own data only, never copied from Google Maps (licence). For example: `leisure=sports_centre`, `sport=padel`, `name`, the `addr:*` tags, `opening_hours=Mo-Su 06:00-24:00`, `website`, `phone`.
- **Press:** add an article to the record only after fetching and reading it; remove dead URLs.
- **Listicles and directories:** a pitch per third-party page that ranks for a list-intent cluster, with the facts pack.

---

## 10. Plugin file layout

```text
commands/
  jal-seo-geo-aeo.md            the command: modes, flow, report format (section 4)
seo-geo-aeo/                    support files the command reads (not skills, not agents)
  standard.md                   law, pillar definitions, checklists with IDs and weights,
                                scoring, owner intake list (sections 1, 3, 5)
  boost.md                      pillar playbooks (section 6)
  webmaster.md                  consoles, APIs, verified facts, VERIFY list, human setup,
                                post-deploy routine (section 7)
  integrate.md                  runtime module, rules, tests, Next.js (section 8)
  offsite.md                    entity and offsite packs (section 9)
  templates/                    robots.txt, llms.txt skeleton, sitemap.ts, indexnow.ts,
                                crawlerIdentity.ts, crawlers.ts plus migration, pageDates.ts,
                                meta.test.ts, content.test.ts (forbidden claims) patterns,
                                intent-map.md, report.md
  scripts/                      audit.ts, render.ts, density.ts, indexnow.ts, bing.ts,
                                gsc.ts, yandex.ts, lib/config.ts, lib/redact.ts,
                                lib/http.ts, and a *.test.ts for each
```

**Light wiring into the existing crew:**
- `jal-lead` suggests `/jal-seo-geo-aeo audit` on any public-website task.
- The scaffold template ships the runtime module (section 8) behind a flag that is on for public sites.
- `jal-standards` gains a short pointer to the command.
- `jal-qa` runs the installed meta, content and seo tests and `render.ts` in the QA gate for public sites.
- The docs site gets one page in Indonesian.

---

## 11. Acceptance criteria

1. `/jal-seo-geo-aeo` appears in Claude Code and runs all five modes. It is the only new user-facing entry point: no new skill or agent is registered.
2. `audit` produces the three pillar scores and the report format of 4.6, and saves the report for the delta.
3. `boost` produces a backlog ordered by impact, ships the code items, prepares the human and offsite packs, re-audits, and reports scores before and after.
4. `integrate` in a fresh scaffolded project gives a site whose installed tests pass. The forbidden-claims test fails if a placeholder fact reaches a served body.
5. Script unit tests (mocked fetch) cover:
   - dry-run default;
   - allowlist refusal;
   - key redaction (a test asserts the key string never appears in output or errors);
   - chunking (10,000 and 500);
   - quota handling;
   - backoff on 429.
6. `audit.ts` passes against two fixtures: a good site that scores all PASS, and a bad one that returns the expected FAILs (short title, missing canonical, invalid JSON-LD, FAQ markup without a visible FAQ, missing hreflang pair, missing key file, invalid robots directive).
7. `render.ts` flags each of the following on a fixture page: split-span headings, a marquee, and a count-up.
8. **Manual smoke test** (documented, not a unit test): `/jal-seo-geo-aeo audit https://padelparty.id` scores SEO and AEO at 90 or above. It lists GEO-13 (offsite list-intent) and the unverified human items as the open work.
9. No new dependency lands without Brian's approval in the ADR log.

---

## 12. Appendix

### 12.1 robots.txt template

```text
# <Brand>, <domain>. Every crawler is welcome on the public pages; the named groups
# exist so a reader can see the answer without inferring it.

User-agent: *
Allow: /
Disallow: /<admin-path>
Disallow: /api

User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-User
User-agent: Claude-SearchBot
User-agent: anthropic-ai
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Googlebot
User-agent: Google-Extended
User-agent: GoogleOther
User-agent: bingbot
User-agent: Applebot
User-agent: Applebot-Extended
User-agent: meta-externalagent
User-agent: meta-externalfetcher
User-agent: FacebookBot
User-agent: Amazonbot
User-agent: Bytespider
User-agent: DuckAssistBot
User-agent: YouBot
User-agent: cohere-ai
User-agent: MistralAI-User
User-agent: CCBot
User-agent: Baiduspider
User-agent: YandexBot
User-agent: PetalBot
Allow: /
Disallow: /<admin-path>
Disallow: /api

# AI use policy: /.well-known/ai.txt (not a robots directive; parsers reject unknown ones)
Sitemap: https://<domain>/sitemap.xml
# For assistants: /llms.txt, /llms-full.txt, /ai/summary.json, /ai/faq.json, /feed.xml
```

### 12.2 llms.txt skeleton

```text
# <Brand>

> <Owner-confirmed positioning>. At <address>, <landmark>. Open <hours>. <Price from>.
> Officially opened <date>.

Also known as: <alternate names>.
Languages: English (default, <site>/) and Indonesian (<site>/id).

## Why <Brand>
## Quick facts
## Facilities
## What makes it different
## Rates (with the clock hours of each band)
## Programmes
## Community
## In the press (independent coverage, verified)
## Pages (English) / Halaman berbahasa Indonesia
## Machine-readable
## How to cite
```

### 12.3 Title and description formulas

- **Home:** `<Brand>, <owner-confirmed superlative> <Category> in <City>, <Area>`.
- **Prices:** `<Category> Prices in <City>, Rates at <Brand> <Area>`.
- **Guide:** `Play <Category> in <City>: Beginner Guide at <Brand> <Area>`.
- **Contact:** `Contact <Brand> <City>: WhatsApp, Address and Hours`.
- **Description:** the answer first, with 2 or 3 numbers (price, hours, a count), then what the page lists.
- **Length:** 50 to 60 characters for titles, 120 to 158 for descriptions, in every language.

### 12.4 Intent map template

| Cluster | Prompts (ID / EN) | Required answer | URL | Status | Gap cause |
|---|---|---|---|---|---|
| Location list-intent | tempat X di <kota> / where to X in <city> | name, address, landmark, hours | home FAQ, guide | strong on site, offsite-dependent | listicles |
| Cheapest time | jam berapa X paling murah | band hours | rates table and FAQ | empty | owner fact |

### 12.5 Statistic density (core of `density.ts`)

```ts
const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const words = text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const numbers = (text.match(/\bRp\s?[\d.,]+|\b\d+([.,]\d+)?\b/g) ?? []).length;
const outbound = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !u.includes(host));
const quotes = (text.match(/[“"][^”"]{12,}[”"]/g) ?? []).length;
```

### 12.6 Headless render check (core of `render.ts`)

```ts
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await page.goto(url, { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 3000));
const r = await page.evaluate(() => ({
  h1: document.querySelector("h1")?.textContent ?? "",
  h2: [...document.querySelectorAll("h2")].map((h) => h.textContent ?? ""),
  body: document.body.textContent ?? "",
}));
// flag /[a-z][A-Z]/ joins in headings, marquee words in body, forbidden phrases,
// numbers that disagree with the API
await browser.close();
```

### 12.7 Pitfalls met on Padel Party

- The Coolify webhook sometimes does not fire after a push or merge. Queue the deploy through the API, then confirm by the chunk hash.
- Rolling deploys serve two builds for about a minute. Probe several times.
- Never chain `git commit` after a `grep` of test output: the commit runs even when the tests fail.
- The PageSpeed API anonymous quota runs out. Use local Lighthouse.
- A test that looks up a node with `@type ===` breaks when the type becomes an array.
- Titles grow past 60 characters when a language adds words. Test both languages.
- The old privacy policy denied collecting children's data while a form collected a child's date of birth and medical history.
- A merged PR from another developer can reach production silently, or fail to. After any merge, check the public bundle hash and rerun `audit`.
- A crawl-generated llms-full.txt from a third-party tool is an audit input, never a file to host.
