#!/usr/bin/env bun
// gsc.ts inspect     --site <url> [--urls a,b] [--language en] [--qpm n] [--qpd n]
// gsc.ts sitemap list   --site <url>
// gsc.ts sitemap submit --site <url> --sitemap <url> [--send]
// gsc.ts performance --site <url> [--days 28] [--row-limit 1000]
// Google Search Console API with a service account. The JWT is signed with
// WebCrypto RS256 from GSC_SERVICE_ACCOUNT_JSON (a path, raw JSON, or base64).
// Quota-aware; submitting a sitemap needs --send. The Indexing API is never
// used (it is only for JobPosting and BroadcastEvent pages), and "request
// indexing" has no API: a human clicks it in Search Console.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";
import { assertUrlsOnSite, emitError, emitJson, readUrlList, resolveDeps, today, type Deps } from "./lib/cli.ts";
import { findSite, loadConfig } from "./lib/config.ts";
import { allowlistFromConfig, HttpError, httpJson, type HttpOptions } from "./lib/http.ts";
import { Redactor } from "./lib/redact.ts";

export const GSC_ENV = "GSC_SERVICE_ACCOUNT_JSON";
export const INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
// VERIFY the request shapes of Sitemaps (submit and list) and Search Analytics
// query against developers.google.com/webmaster-tools before code depends on them.
export const WEBMASTERS_BASE = "https://www.googleapis.com/webmasters/v3";
// VERIFY the service-account flow (JWT bearer grant at the token URI; the
// service account is added as a user of the property).
export const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GSC_HOSTS = ["searchconsole.googleapis.com", "www.googleapis.com", "oauth2.googleapis.com"];
export const SCOPE_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";
export const SCOPE_WRITE = "https://www.googleapis.com/auth/webmasters";
// VERIFY the exact URL Inspection quota numbers on the limits page (per-site and
// per-project QPM and QPD). These defaults are placeholders; override them.
export const DEFAULT_INSPECT_QPM = 600;
export const DEFAULT_INSPECT_QPD = 2000;

export type ServiceAccount = { client_email: string; private_key: string; token_uri: string };

export async function loadServiceAccount(value: string | undefined, cwd: string, redactor: Redactor): Promise<ServiceAccount> {
  if (!value) throw new Error(`${GSC_ENV} is not set in env (a path to the service-account JSON, or its base64)`);
  const v = value.trim();
  let text: string;
  if (v.startsWith("{")) text = v;
  else {
    const path = isAbsolute(v) ? v : join(cwd, v);
    if (existsSync(path)) text = await readFile(path, "utf8");
    else {
      try {
        text = new TextDecoder().decode(Uint8Array.from(atob(v.replace(/\s+/g, "")), (c) => c.charCodeAt(0)));
      } catch {
        throw new Error(`${GSC_ENV} is neither a readable path nor base64`);
      }
    }
  }
  let sa: any;
  try {
    sa = JSON.parse(text);
  } catch {
    throw new Error(`${GSC_ENV} does not decode to JSON`);
  }
  if (typeof sa?.client_email !== "string" || typeof sa?.private_key !== "string") {
    throw new Error(`${GSC_ENV} lacks client_email or private_key`);
  }
  redactor.add(sa.private_key);
  redactor.add(sa.private_key_id);
  return { client_email: sa.client_email, private_key: sa.private_key, token_uri: typeof sa.token_uri === "string" ? sa.token_uri : TOKEN_URL };
}

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----|-----END [^-]+-----|\\n|\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

/** RS256 JWT for the JWT bearer grant, signed with WebCrypto. */
export async function signJwt(sa: ServiceAccount, scope: string, nowSeconds: number): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri, iat: nowSeconds, exp: nowSeconds + 3600 }));
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`)));
  return `${header}.${claims}.${b64url(sig)}`;
}

export async function accessToken(sa: ServiceAccount, scope: string, http: HttpOptions, redactor: Redactor, nowSeconds: number): Promise<string> {
  const jwt = await signJwt(sa, scope, nowSeconds);
  redactor.add(jwt);
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }).toString();
  const { data } = await httpJson<any>(sa.token_uri, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body }, http);
  const token = data?.access_token;
  if (typeof token !== "string") throw new Error("token endpoint returned no access_token");
  redactor.add(token);
  return token;
}

const QUESTION = /^(who|what|where|when|why|which|how|how much|how many|can|do|does|is|are|berapa|di mana|dimana|bagaimana|kapan|apa|apakah|siapa|mengapa|kenapa)\b/i;

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = new Redactor(deps.env);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        site: { type: "string" },
        urls: { type: "string", multiple: true },
        "urls-file": { type: "string" },
        language: { type: "string" },
        qpm: { type: "string" },
        qpd: { type: "string" },
        sitemap: { type: "string" },
        days: { type: "string" },
        "row-limit": { type: "string" },
        send: { type: "boolean" },
        config: { type: "string" },
      },
      allowPositionals: true,
    });
    const [command, sub] = positionals;
    if (!["inspect", "sitemap", "performance"].includes(command ?? "")) throw new Error("usage: gsc.ts inspect|sitemap|performance --site <url>");
    if (command === "sitemap" && sub !== "list" && sub !== "submit") throw new Error("usage: gsc.ts sitemap list|submit --site <url>");
    const { config } = await loadConfig(deps.cwd, values.config);
    const site = findSite(config, values.site);
    const property = site.gscProperty ?? site.url;
    const http: HttpOptions = { allow: allowlistFromConfig(config, GSC_HOSTS), fetchImpl: deps.fetchImpl, redactor, sleep: deps.sleep };
    const nowSeconds = Math.floor(deps.now().getTime() / 1000);
    const siteBase = `${WEBMASTERS_BASE}/sites/${encodeURIComponent(property)}`;

    if (command === "sitemap" && sub === "submit") {
      if (!values.sitemap) throw new Error("pass --sitemap <url>");
      const [sitemapUrl] = assertUrlsOnSite([values.sitemap], site.url);
      const plan = { tool: "gsc", command: "sitemap submit", mode: values.send ? "send" : "dry-run", property, sitemap: sitemapUrl };
      if (!values.send) {
        emitJson(deps, redactor, { ...plan, note: "dry run: nothing was submitted. Rerun with --send after a yes in chat." });
        return 0;
      }
      const sa = await loadServiceAccount(deps.env[GSC_ENV], deps.cwd, redactor);
      const token = await accessToken(sa, SCOPE_WRITE, http, redactor, nowSeconds);
      // VERIFY: PUT sites/{siteUrl}/sitemaps/{feedpath} with an empty body.
      await httpJson(`${siteBase}/sitemaps/${encodeURIComponent(sitemapUrl)}`, { method: "PUT", headers: { authorization: `Bearer ${token}` } }, http);
      emitJson(deps, redactor, { ...plan, status: "submitted" });
      return 0;
    }

    // Validate inspection input before any request is made.
    const listed = command === "inspect" ? await readUrlList(values.urls, values["urls-file"], deps.cwd) : [];
    const urls = command === "inspect" ? assertUrlsOnSite(listed.length ? listed : config.keyUrls, site.url) : [];
    const qpm = values.qpm ? Number(values.qpm) : DEFAULT_INSPECT_QPM;
    const qpd = values.qpd ? Number(values.qpd) : DEFAULT_INSPECT_QPD;
    if (!(qpm > 0) || !(qpd > 0)) throw new Error("--qpm and --qpd must be positive");

    const sa = await loadServiceAccount(deps.env[GSC_ENV], deps.cwd, redactor);
    const token = await accessToken(sa, SCOPE_READONLY, http, redactor, nowSeconds);
    const auth = { authorization: `Bearer ${token}` };

    if (command === "sitemap") {
      // VERIFY: GET sites/{siteUrl}/sitemaps returns { sitemap: [...] }.
      const { data } = await httpJson<any>(`${siteBase}/sitemaps`, { method: "GET", headers: auth }, http);
      emitJson(deps, redactor, { tool: "gsc", command: "sitemap list", property, sitemaps: data?.sitemap ?? [] });
      return 0;
    }

    if (command === "performance") {
      const days = values.days ? Number(values.days) : 28;
      const end = deps.now();
      const start = new Date(end.getTime() - days * 86400000);
      const body = { startDate: today(start), endDate: today(end), dimensions: ["query", "page"], rowLimit: values["row-limit"] ? Number(values["row-limit"]) : 1000 };
      try {
        // VERIFY: POST sites/{siteUrl}/searchAnalytics/query and its row shape { keys, clicks, impressions, ctr, position }.
        const { data } = await httpJson<any>(`${siteBase}/searchAnalytics/query`, { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify(body) }, http);
        const rows = Array.isArray(data?.rows) ? data.rows : [];
        const questionQueries = [...new Set(rows.map((r: any) => String(r.keys?.[0] ?? "")).filter((q: string) => QUESTION.test(q)))];
        emitJson(deps, redactor, { tool: "gsc", command: "performance", property, startDate: body.startDate, endDate: body.endDate, rows, questionQueries });
        return 0;
      } catch (err) {
        if (err instanceof HttpError && err.status === 429) {
          emitJson(deps, redactor, { tool: "gsc", command: "performance", property, status: "quota-exceeded", error: redactor.error(err) });
          return 2;
        }
        throw err;
      }
    }

    // inspect
    const interval = Math.ceil(60000 / qpm);
    const languageCode = values.language ?? config.defaultLanguage;
    const todo = urls.slice(0, qpd);
    const deferred = urls.slice(qpd);
    const results: any[] = [];
    let status = deferred.length ? "partial-quota" : "done";
    for (const [i, url] of todo.entries()) {
      if (i > 0) await deps.sleep(interval);
      try {
        const { data } = await httpJson<any>(INSPECT_URL, {
          method: "POST",
          headers: { ...auth, "content-type": "application/json" },
          body: JSON.stringify({ inspectionUrl: url, siteUrl: property, languageCode }),
        }, http);
        // VERIFY the inspectionResult field names against the API reference.
        const r = data?.inspectionResult?.indexStatusResult ?? {};
        results.push({
          url,
          verdict: r.verdict ?? null,
          coverageState: r.coverageState ?? null,
          indexingState: r.indexingState ?? null,
          robotsTxtState: r.robotsTxtState ?? null,
          pageFetchState: r.pageFetchState ?? null,
          lastCrawlTime: r.lastCrawlTime ?? null,
          googleCanonical: r.googleCanonical ?? null,
          userCanonical: r.userCanonical ?? null,
        });
      } catch (err) {
        if (err instanceof HttpError && err.status === 429) {
          status = "quota-exceeded";
          deferred.unshift(...todo.slice(i));
          break;
        }
        throw err;
      }
    }
    emitJson(deps, redactor, {
      tool: "gsc",
      command: "inspect",
      property,
      quota: { qpm, qpd, intervalMs: interval },
      status,
      results,
      deferred,
      requestIndexing: results.filter((r) => r.verdict !== "PASS").map((r) => r.url),
      note: "request indexing has no API: open each URL in requestIndexing in Search Console URL Inspection and click Request indexing.",
    });
    return status === "done" ? 0 : 2;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
