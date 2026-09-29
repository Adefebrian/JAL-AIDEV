# Webmaster integration: consoles, APIs, submit and monitor

This file carries section 7 of Brian's instruction: the verified API facts, the VERIFY list, the human setup, the post-deploy routine, the config and env, and the script table. The `submit` and `monitor` modes follow it. Load `standard.md` first: hard law 8 (secrets in env), 9 (no SERP scraping) and 10 (outward actions are confirmed) bind everything here and are never sent to JEV.

Lines marked **JAL tuning:** are the lead's adaptations to the JAL crew and stack. Items marked **VERIFY** must be checked against the official source before code depends on them.

---

## 7.1 Verified API facts (official docs, checked 2026-09-29)

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

**JAL tuning: the service-account JWT is signed with Bun's WebCrypto, so no Google auth library is needed** (no new dependency, nothing to flag in `jal-adr`). The flow in `scripts/gsc.ts` (`lib/google-jwt.ts` or inline):

```ts
// sa = parsed GSC_SERVICE_ACCOUNT_JSON (a path or base64). Never logged, never echoed.
const der = Buffer.from(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""), "base64");
const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
const b64u = (b: string | ArrayBuffer) => Buffer.from(b as any).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const claims = b64u(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri, iat: now, exp: now + 3600 }));
const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claims}`));
// POST sa.token_uri, form body: grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<head>.<claims>.<b64u(sig)>
```

- `scope` is `https://www.googleapis.com/auth/webmasters.readonly` for `inspect` and `performance`, and `https://www.googleapis.com/auth/webmasters` only for `sitemap --send`.
- The access token is cached in memory for its lifetime and redacted from every output and error, like the private key.
- **VERIFY** (JAL tuning) against `developers.google.com/identity/protocols/oauth2/service-account`: the token endpoint, the claim set (`iss`, `scope`, `aud`, `iat`, `exp`), and the one-hour maximum lifetime.
- A unit test signs with a throwaway key generated in the test (`crypto.subtle.generateKey`), verifies the signature, and mocks the token endpoint. No real key and no network.

**Yandex Webmaster API v4** (`yandex.com/dev/webmaster`)
- OAuth token.
- Find the ids first: `GET /v4/user` (user id), then `GET /v4/user/{user-id}/hosts` (host id).
- Recrawl: `POST https://api.webmaster.yandex.net/v4/user/{user-id}/hosts/{host-id}/recrawl/queue` with the URL in the body.
- A daily quota endpoint exists, plus distinct errors for "already added" and "quota exceeded".
- Yandex also consumes IndexNow.

**Baidu** (China only, optional): **VERIFY** everything first.

---

## The VERIFY list

**JAL tuning:** jal-researcher runs every VERIFY check, in one wave, one finding per item, before any code path that depends on the item is written or run. For each item it opens the official source, runs `sec.input_screen` on the fetched page, and returns the source URL, the date checked, and the verified value. The lead records the result in this file through a plugin pull request (`learn` playbook, `mem.promote`). Until an item is verified, the script path that depends on it stops with a clear "VERIFY pending" error instead of guessing.

| # | Item | Official source | What waits on it |
|---|---|---|---|
| V-01 | `${CLAUDE_PLUGIN_ROOT}` is available in command context (instruction 4.1); otherwise locate the installed plugin path, as the `jal-design` MCP server already does | Claude Code plugin docs | Support-folder resolution (a fallback exists) |
| V-02 | The IndexNow participating engines | `indexnow.org/searchengines` | The `submit` report wording |
| V-03 | The meaning of each IndexNow 4xx status | `indexnow.org/documentation` | `indexnow.ts` error handling |
| V-04 | The Bing API host (`ssl.bing.com`) and the stats endpoints | `learn.microsoft.com/bingwebmaster` | `bing.ts` base URL and any stats read |
| V-05 | The exact Search Console quota numbers | The Search Console API limits page | `gsc.ts` pacing |
| V-06 | The request shapes of Sitemaps submit and list, and Search Analytics `query` | `developers.google.com/webmaster-tools` | `gsc.ts sitemap` and `gsc.ts performance` |
| V-07 | The service-account flow (the service account added as a user of the property) | `developers.google.com/webmaster-tools` | `gsc.ts` auth, the human setup step |
| V-08 | The `yandexHostId` format (`https:padelparty.id:443` in the config is an example) | `yandex.com/dev/webmaster` | Config validation (the script resolves the host id from `/v4/user/{user-id}/hosts` anyway) |
| V-09 | Baidu: everything | Baidu's official webmaster docs | Any Baidu support |
| V-10 | **JAL tuning:** `bunx --bun lighthouse@12` runs under the Bun runtime | Run it once against a local build and read the output | SEO-09, SEO-10; the fallback below applies if it does not |
| V-11 | **JAL tuning:** the Google service-account token endpoint, claim set and token lifetime used by the WebCrypto signer | `developers.google.com/identity/protocols/oauth2/service-account` | `gsc.ts` auth |

---

## 7.2 Human setup per site (the command prints this; it never signs in to anything)

1. **Search Console:** a Domain property (DNS TXT) or URL-prefix property. Submit the sitemap. Add the automation service account as a user if the scripts will be used.
2. **Bing Webmaster Tools:** import from Search Console or verify. Submit the sitemap. Create the API key. Use the IndexNow key issued there, so submissions show in the account.
3. **Yandex Webmaster:** add and verify the site, submit the sitemap, create an OAuth token.
4. **Business Profile, Bing Places, Apple Business Connect:** per `offsite.md` (section 9).
5. **Credentials** go in the project env or Coolify (7.4), never in chat.

SEO-16 and SEO-17 count toward the score only after the owner confirms these steps; until then they are listed as "unverified" and excluded (`standard.md` 4.5).

---

## 7.3 After every deploy

- **Automatic:** the app submits all indexable URLs, dynamic ones included, to IndexNow on production boot. It is fire-and-forget with a 10-second timeout and never blocks boot.
- **Command, after a yes in chat:** Bing and Yandex submissions for new or changed pages, within quota, and URL Inspection for the key URLs.
- **Human:** request indexing in Search Console for the listed new pages.
- **Verify live:** repeated probes (rolling deploys serve old and new builds for a minute), checking the chunk hash and a string unique to the new build. If the Coolify webhook did not fire, queue the deploy through its API.

**JAL tuning:** jal-devops owns the deploy and the live probes, and the deploy itself waits for the user's yes (`standard.md`, under section 3). A merged PR from another developer can reach production silently, or fail to: after any merge, check the public bundle hash and rerun `audit`.

---

## 7.4 Config and scripts

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

**JAL tuning:** `CHROME_PATH` feeds JAL's CDP driver (`resolveChromePath` in `mcp/jal-design/audit.ts`, which falls back to the standard Chrome and Chromium paths) and Lighthouse's own Chrome launcher. No puppeteer-core is needed by the scripts.

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
| `score.ts` (JAL addition) | Computes the SEO, AEO, and GEO scores per section 4.5 from the findings, the machine-readable checklist `scripts/checklist.json`, and owner confirmations; delta against the previous report | Read-only |
| `report.ts` (JAL addition) | Renders the section 4.6 report and saves `.jal/seo-geo-aeo/audit-YYYY-MM-DD.md` plus `.json` | Writes only under `.jal/seo-geo-aeo/` |

Shared helpers: `lib/config.ts` (reads and validates `.jal/seo-geo-aeo.json`, the host allowlist), `lib/redact.ts` (strips every configured secret value from strings, errors and JSON), `lib/http.ts` (timeouts, backoff, redaction on every request).

**Every script:**
- refuses hosts outside the config;
- redacts keys from every output and error;
- retries with backoff only on 429 and 5xx;
- uses timeouts on every request.

**JAL tuning: `render.ts` on JAL's zero-dependency CDP driver.** Same checks as the puppeteer-core core in appendix 12.6, on the driver in `mcp/jal-design/audit.ts` (Bun built-ins only: `Bun.spawn`, native WebSocket, fetch):

```ts
import { resolveChromePath, launchChrome, createPageTarget, closePageTarget, CdpClient } from "../../mcp/jal-design/audit.ts";
const { proc, port } = await launchChrome(resolveChromePath()!, userDataDir); // a mkdtemp dir, removed after
const target = await createPageTarget(port);                                 // one target per URL, one Chrome per run
const client = await CdpClient.connect(target.webSocketDebuggerUrl);
await client.send("Page.enable");
await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const loaded = client.waitForEvent("Page.loadEventFired", 25000);
await client.send("Page.navigate", { url });
await loaded;
await Bun.sleep(3000); // the realistic wait for intro animations
const { result } = await client.send("Runtime.evaluate", {
  returnByValue: true,
  expression: `({ h1: document.querySelector("h1")?.textContent ?? "",
    h2: [...document.querySelectorAll("h2")].map((h) => h.textContent ?? ""),
    body: document.body.textContent ?? "" })`,
});
// flag /[a-z][A-Z]/ joins in headings, marquee words in body, forbidden phrases,
// numbers that disagree with the API
client.close(); await closePageTarget(port, target.id); proc.kill();
```

- puppeteer's `networkidle2` becomes the load event plus the 3-second wait. Where a page needs it, `Page.setLifecycleEventsEnabled` and a loop over `Page.lifecycleEvent` until `networkAlmostIdle` gives the same signal.
- A second pass per URL sets a documented crawler user agent (`Network.setUserAgentOverride`), so the "count-ups skip animation for bots" rule is checked the way a bot sees the page. A count-up is flagged when the same number node reads differently in two samples taken apart.
- The script test runs the checks on fixture pages (split-span headings, a marquee, a count-up; acceptance criterion 7) and reports `SKIPPED`, not PASS, when no Chrome is found.

**JAL tuning: local Lighthouse through `bunx --bun lighthouse@12`.**
- Command: `bunx --bun lighthouse@12 <url> --output=json --output-path=stdout --only-categories=seo,accessibility,performance --form-factor=mobile --chrome-flags="--headless=new"`, with `CHROME_PATH` pointing at Chrome for Testing (instruction 4.3, step 6).
- `--bun` matters: without it, bunx honours the package's node shebang and can start node, which JAL law forbids.
- **VERIFY** (V-10) that it runs under Bun. Chrome for Testing is installed by a person or after a yes in chat; the command never downloads a browser on its own.
- The PageSpeed API anonymous quota runs out, so local Lighthouse is the source for SEO-09 and SEO-10.

**JAL tuning: the fallback when Lighthouse does not run under Bun.** The same CDP driver runs the Lighthouse-less checks JAL can do itself:
- **SEO-equivalent:** document status 2xx (`Network.responseReceived`), `<title>` and meta description present, no noindex in meta robots or `X-Robots-Tag`, robots.txt parses with no unknown directives, links have descriptive text and crawlable `href`, images have alt, valid `hreflang` and absolute `canonical`, valid `<html lang>`, legible font sizes.
- **Accessibility subset:** accessible names for buttons and links and labels for form controls (`Accessibility.getFullAXTree`), image alt, `<html lang>`, document title, heading order, duplicate ids, and text contrast from computed styles.
- **Performance:** mobile emulation with CPU throttling (`Emulation.setCPUThrottlingRate`) and network throttling (`Network.emulateNetworkConditions`); LCP from a buffered `largest-contentful-paint` PerformanceObserver; script transfer bytes from `Network.loadingFinished` (feeds the SEO-11 JS size tracking).
- These checks feed the items they measure. SEO-10 is listed as "unverified (no Lighthouse)" and excluded from the score (`standard.md` 4.5).

---

## `submit [urls]`

The flow for the mode in the instruction's section 0: IndexNow, Bing, Yandex (dry run first, then a yes in chat), plus the Search Console manual list.

1. **Common start** (`standard.md`). Resolve the URL set: the URLs given, or the changed and new URLs from the last `boost` or deploy, or every indexable URL from the sitemap.
2. **Allowlist.** Every URL's host must match a site in `.jal/seo-geo-aeo.json`. Any other host is refused and reported.
3. **Dry runs, in parallel** (JAL tuning: independent reads go out in one message):
   - `indexnow.ts --site <site> --urls ...` (chunks at 10,000);
   - `bing.ts quota`, then `bing.ts submit` (chunks at 500, within quota);
   - `yandex.ts quota`, then `yandex.ts recrawl` (resolves user id and host id).
4. **Ask for a yes in chat**, showing per engine: the URL count, the chunks, and the remaining quota. Only the engines the user says yes to are sent, by rerunning with `--send`. The IndexNow standing authorisation covers only the app's own boot submission, not a manual send from the command.
5. **URL Inspection** for the key URLs, after the same yes (7.3). A sitemap submit through `gsc.ts sitemap --send` also needs its own yes.
6. **Output the Search Console request-indexing list** for a human to click.
7. **Record** the result (status per engine and chunk, never a key) in `.jal/seo-geo-aeo/submit-YYYY-MM-DD.md` (JAL tuning: the same folder as the audits, so `monitor` can show the delta).

No JEV call decides whether to submit: hard law 10 makes it a yes in chat.

---

## `monitor [url]`

Tracks what the engines actually did: crawler-log summary, index coverage, search performance, and a delta against the last run.

1. **Common start** (`standard.md`).
2. **Evidence, in parallel** (JAL tuning: one message, independent reads):
   - **Crawler log:** hits per bot, page and day, and GEO-11 coverage (key URLs read by bingbot, OAI-SearchBot or ChatGPT-User, PerplexityBot and ClaudeBot within the last 14 days). JAL tuning: the agent reads it with a read-only SQL query through the project's `DATABASE_URL` (env, never echoed), or, without database access, asks a human to read the admin view. The agent never signs in to the admin view.
   - **Index coverage:** `gsc.ts inspect` for the key URLs (quota-aware; asked once per run, 7.3).
   - **Search performance:** `gsc.ts performance` for the last 28 days.
   - **Quotas:** `bing.ts quota` and `yandex.ts quota`.
3. **Read the crawler log honestly.** User agents are claimed, not verified. A burst of many "bots" in the same second probing paths that do not exist is one scanner. `ChatGPT-User` fetches only while ChatGPT is answering someone, so its hits on a page are the strongest GEO signal the log has.
4. **Delta** against the last `monitor`, `submit` and `audit` in `.jal/seo-geo-aeo/`.
5. **Report:** the evidence above, the pages AI bots have not read yet (input to the `boost` discovery push, `boost.md` 6.3), and the "why it may not be showing up yet" section of `standard.md` 4.6. Save it as `.jal/seo-geo-aeo/monitor-YYYY-MM-DD.md` (JAL tuning).

---

## Pitfalls met on Padel Party (appendix 12.7, the webmaster ones)

- The Coolify webhook sometimes does not fire after a push or merge. Queue the deploy through the API, then confirm by the chunk hash.
- Rolling deploys serve two builds for about a minute. Probe several times.
- The PageSpeed API anonymous quota runs out. Use local Lighthouse.
- A merged PR from another developer can reach production silently, or fail to. After any merge, check the public bundle hash and rerun `audit`.
