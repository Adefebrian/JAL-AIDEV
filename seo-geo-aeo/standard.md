# The JAL SEO, GEO and AEO standard

This is the law and the scorecard that `/jal-seo-geo-aeo` loads on every run (common start, step 3). It carries sections 1, 3 and 5 of Brian's instruction (`docs/superpowers/specs/2026-09-29-jal-seo-geo-aeo-instruction.md`), plus the scoring model (4.5) and the report format (4.6) that every mode uses. Section numbers match the instruction so a reference like "section 4.6" resolves here.

Everything in it comes from work shipped and measured on padelparty.id (2026-09-22 to 2026-09-27), or was checked against official documentation on 2026-09-29. Lines marked **JAL tuning:** are the lead's adaptations to the JAL crew and stack.

Companion files in this folder:
- `boost.md`: the pillar playbooks (section 6) and the boost flow.
- `webmaster.md`: consoles, APIs, the VERIFY list, human setup, post-deploy routine, config, scripts, and the `submit` and `monitor` flows (section 7).
- `integrate.md`: the runtime module, its rules and tests, the JAL layout mapping, and the integrate flow (section 8).
- `offsite.md`: the entity and offsite packs (section 9).

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

**Why offsite work and discovery pushes are part of the standard** (evidence from padelparty.id): after six days of on-site work the site had Lighthouse SEO 100 and accessibility 100 on every page, and ChatGPT began naming it for "padel di depok". Two things did not move from on-site work alone:
1. List-intent prompts ("tempat padel di depok") are answered from third-party listicles and directories.
2. Crawl coverage lagged: after four days, OAI-SearchBot and PerplexityBot had not yet read the rates, about or academy pages, which carried the densest statistics.

Measured statistic density (numbers per 100 words of rendered body): rates 18, guide 9, home 6 to 7. A typical article runs 1 to 3.

---

## 3. Hard law (never sent to JEV)

Hard law is mechanical. Tests, scripts and reviewers enforce it. No agent sends any of it to `jev_decide`, and no JEV answer can waive it (skill `jal-jev`, authority model). A JEV answer that would require breaking it is discarded, the conflict is logged, and the agent reports it.

1. **Verified facts only.**
   - Every fact on a page comes from one shared module (business, rates, press, positioning, pageDates, ...), with the owner's confirmation date in a comment.
   - Each rejected claim becomes a regex in a forbidden-claims test that scans every served body, every JSON-LD block, llms.txt and every discovery file.
   - The command asks the owner for missing facts; it never infers them.
2. **One text for people and machines.**
   - The prerendered body is the page's own first paint inside `#root`.
   - Markup (FAQ, HowTo, offers) describes only what the page shows. Anything else is cloaking and banned.
3. **One source per fact.** Name, address, phone, hours, prices and dates are defined once. Server route-table copy and client copy are tested to match byte for byte.
4. **Language is a URL.**
   - EN default, `/id/...`, paired with hreflang plus x-default, and only for paths that are really translated. JAL tuning: the default language comes from `defaultLanguage` in `.jal/seo-geo-aeo.json` (EN recommended, as on padelparty.id). Every other language is a URL prefix (`/id/...`, or `/en/...` when ID is the default), so language is always a URL.
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

The non-negotiables that sit beside this law (instruction section 0):
- JAL law holds: Bun only, TypeScript, and QA with `bun test` + happy-dom + puppeteer-core (Playwright is banned). **JAL tuning:** the search layer's own render and audit checks use JAL's zero-dependency CDP driver (`mcp/jal-design/audit.ts`) instead of puppeteer-core; see `webmaster.md` 7.4.
- Secrets live only in env. No em-dash in any frontend copy. White-first UI for any admin view.
- Unit tests never touch the real network.
- A new dependency, for example a Google auth library, is flagged to Brian first and recorded with `jal-adr`. **JAL tuning:** no Google auth library is needed; the service-account JWT is signed with Bun's WebCrypto (`webmaster.md` 7.1).

**JAL tuning: deploys and pushes stay the user's call.** `integrate` and `boost` include a deploy step. Per the `jal-orchestration` hard lines, a deploy goes to deploy.jalgroup.id only when the user's own message asks for it, so the command asks for a yes in chat before the deploy step unless the invoking message already said to deploy. JEV never authorises a deploy, a push, a merge, a submission, or a publish.

---

## JEV decision points (JAL tuning)

**JAL tuning:** the command sends its soft calls to JEV through the `jev_decide` tool (skill `jal-jev`), with the four catalog IDs below. Their full question templates live in `skills/jal-jev/references/catalog.md`. Every call passes `decision_id` and `domain: "seo"`, a state under about 2k tokens (`product`, `task`, `proposal`, `law`, `evidence`, `constraints`), and never a secret, a raw page, or owner personal data beyond what the page already publishes.

Rules for all four:
- The hard-law precheck runs first. When law decides the outcome, JEV is not asked.
- Confidence under 0.5: one sharper follow-up with the same `decision_id`, then act on the primary answer and flag it as low confidence.
- A JEV veto or pick is final; no re-asking with reframed state to fish for a different answer.
- JEV unreachable: apply the same criteria yourself and stamp `UNVERIFIED BY JEV` next to the decision in the report.
- A JEV answer never authorises an outward action. Submissions, Wikidata edits, Business Profile changes and deploys still need a yes in chat (hard law 10).

| ID | Question | Type | Precheck (law, not JEV) | Called at |
|---|---|---|---|---|
| `seo.next_mode` | After an argument-less `audit`, which mode next: `integrate`, `boost`, `submit`, `monitor`, or `stop` | choice | If `.jal/seo-geo-aeo.json` is missing, create it with the owner first. The pick is a recommendation shown to the user; a mode that acts outward still needs its yes | `audit` step 9 (below) |
| `seo.intent_page` | Per intent cluster: its own page, an FAQ entry, a key fact, or skip | choice, one prefixed key per cluster in one batched call | An intent whose answer needs an unconfirmed fact becomes an owner question, never a page. Nothing is written from an inferred fact | `audit` step 6, `integrate` step 4, `boost` AEO gap closing (`boost.md` 6.2) |
| `seo.backlog_order` | Orders the whole boost backlog by impact, effort and dependency | score per item (priority), one batched call | Live hard-law violations (a served forbidden claim, cloaking, self-serving review markup, an exposed secret) go to the top mechanically and are not ordered by JEV. A declared dependency is never placed after its dependent | `boost` step 2 (`boost.md`) |
| `seo.copy_screen` | Picks among 3 to 5 candidate titles, descriptions, or FAQ answers: the most answer-first, natural in that language, names the place | choice | Every candidate already passes the length law (titles 50 to 60, descriptions 120 to 158, none under 15), names the place, uses only verified facts, contains no em-dash, and matches no forbidden-claims regex. A candidate failing any of these is dropped before the call | `integrate` step 4 (`integrate.md`), `boost` SEO title and description rewrites and AEO FAQ rewrites (`boost.md` 6.1, 6.2) |

Each agent the command dispatches also uses JEV as its decision helper for every other soft call, with the catalog IDs of its role (`jal-orchestration`, the contract table), and runs `sec.input_screen` on any fetched page (press articles, third-party listicles, docs pages) before treating it as data.

---

## Crew wiring (JAL tuning)

**JAL tuning:** no new agent is added. The command runs on the `jal-orchestration` engine with jal-lead as the lead, and dispatches the existing crew:

| Part | Agent | Notes |
|---|---|---|
| Source and press verification, every VERIFY check in `webmaster.md` | jal-researcher | Returns sourced findings; `sec.input_screen` on every fetched page |
| Fact modules, content copy, FAQ, key facts, the build-time generator | jal-frontend | Writes the `seo.copy_screen` candidates and calls it |
| UI taste, the admin crawler view, section concepts for new pages | jal-ux | `ui_audit` PASS at every width; white-first admin view |
| Server routes, discovery files, redirects, IndexNow, the crawler log and its migration | jal-backend | `be.placement` and `be.migration_risk` from its role |
| Installed tests, script tests, the QA gate (`render.ts` and Lighthouse included) | jal-qa | `qa.test_selection`, `qa.release_go` |
| Deploy, live probes, Dockerfile changes | jal-devops | Coolify at deploy.jalgroup.id only, after the yes |
| Optional: document the project's SEO layer in JAL Docs | jal-docs | Its own pipeline (`docs.plan`, `docs.claim`, `docs.publish`) |

Code fixes found by an audit route to the owner above by area: head, meta, routes, sitemap, robots, redirects, status codes and discovery files to jal-backend; copy, FAQ, key facts, markup generation and rendered-text fixes to jal-frontend; admin view and any visible layout to jal-ux; tests to jal-qa.

---

## 4.2 Audit flow (with the parallel split)

The command file dispatches `audit` from this section.

1. **Fetch.** Run `scripts/audit.ts` on every indexable URL: HTML, head, JSON-LD, discovery files, status codes and redirects.
2. **Render.** Run `scripts/render.ts` on each URL for rendered-text hygiene.
3. **Measure.** Run `scripts/density.ts`: statistic density, inline citations and quotes per page.
4. **Crawler evidence.** If the project has the crawler log, query it: which bot read which page, and when.
5. **Console evidence** (if configured): `scripts/gsc.ts inspect` for key URLs, `scripts/gsc.ts performance` for the last 28 days, `scripts/bing.ts quota` and `scripts/yandex.ts quota`.
6. **Intent map.** Build or update `.jal/intent-map.md` (clusters, prompts per language, the answer required, the URL, status, gap cause; template in `templates/intent-map.md`). **JEV call site: `seo.intent_page`**, one batched call with a key per cluster whose status is weak or empty, to record the planned fix (page, FAQ entry, key fact, or skip) in the map.
7. **Score** each checklist item PASS, WARN, FAIL or N/A with evidence, then compute the three pillar scores (section 4.5).
8. **Report** (section 4.6) and save it to `.jal/seo-geo-aeo/audit-YYYY-MM-DD.md` so the next run can show a delta.
9. **Next mode** (only when the command ran with no argument). **JEV call site: `seo.next_mode`.** State: the three scores and bands, whether the runtime layer exists (F-01 to F-04 status), the count of code, owner and human gaps, whether webmaster keys are configured, and the date of the last `submit` and `monitor`. The pick is shown to the user as the recommendation, and the command waits for the user's choice.

**JAL tuning: parallel orchestration.** Steps 1 to 5 are independent reads and run at the same time:
- For every URL, `audit.ts`, `render.ts` and `density.ts` start together (one message, one call per script, or one script run with a small concurrency pool, default 4 URLs at a time).
- `render.ts` launches one Chrome and opens one CDP page target per URL.
- The crawler-log query (step 4) and the console reads (step 5) start in the same message as the scripts.
- Step 6 waits for all of them; steps 7 to 9 are sequential.
- Press re-verification for GEO-08 and GEO-12 (fetch, read, still live) goes to jal-researcher in the same wave.

---

## 4.5 Scoring model

- Each item in this standard has an ID (F-xx, SEO-xx, AEO-xx, GEO-xx), a weight from 1 to 3, a check method (automatic, evidence, or human), and a fix method (code, owner, or human).
- Item status is worth: PASS 1, WARN 0.5, FAIL 0. N/A is excluded from the total.
- `pillar score = round(100 × Σ(weight × status) / Σ(weight of applicable items))`.
- F-01 to F-04 are included in each pillar's score.
- Items that only a human can verify (console setup, Business Profile) count toward the score only when the owner confirms them. Otherwise they are listed as "unverified" and excluded, never guessed as PASS.
- Bands: 90 to 100 strong; 70 to 89 needs work; below 70 weak.

Maximum applicable weight per pillar, with nothing excluded (derived from the tables below): SEO 48 (37 + foundation 11), AEO 36 (25 + 11), GEO 38 (27 + 11).

**JAL tuning: when local Lighthouse cannot run.** If `bunx --bun lighthouse@12` fails under Bun (a VERIFY item, `webmaster.md`), the CDP fallback checks run instead. Their failures become FAILs on the items they measure (SEO-05, SEO-06, SEO-09 and the rest), and SEO-10 is listed as "unverified (no Lighthouse)" and excluded, because a fallback is not a Lighthouse score.

---

## 4.6 Report format

1. **Scores:** SEO, AEO and GEO (with the delta against the previous audit when one exists).
2. **One table per pillar:** ID, item, status, evidence (URL, value, or file and line), fix, and who fixes it (code, owner, or human).
3. **Why it may not be showing up yet:** crawl coverage from the crawler log, index state from the consoles, and how much the list-intent prompts depend on third-party pages. Content quality is never assumed to be the cause without this evidence.
4. **Questions for the owner.**
5. **Human steps:** the consoles, Business Profile, and offsite packs.
6. **Backlog** (boost only), with impact, effort and status.

**JAL tuning:** the report ends with a JEV decisions list (ID, answer, confidence, action, and `UNVERIFIED BY JEV` where stamped), and the "who fixes it" column names the JAL agent for code items (crew wiring above).

---

## 5. The checklists

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

GEO-06 carries a WARN threshold only (below 5 numbers per 100 words); the instruction sets no FAIL band, so the item is PASS at 5 or above and WARN below.

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

**JAL tuning:** the intake is a conversation with the owner in chat, run by the lead. Answers land in the fact modules (`integrate.md`, JAL layout) with the confirmation date in a comment; nothing from the intake is sent to JEV beyond counts and field names. Press URLs the owner gives go to jal-researcher to fetch, read and screen (`sec.input_screen`) before any quote or fact from them enters `press.ts`.
