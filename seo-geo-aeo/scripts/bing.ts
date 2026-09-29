#!/usr/bin/env bun
// bing.ts quota  --site <url>
// bing.ts submit --site <url> --urls a,b [--urls-file list.txt] [--send]
// Bing Webmaster API with the per-user API key (instruction 7.1). Submit
// checks the quota first and sends chunks of 500. Dry run unless --send. The
// key comes from BING_WEBMASTER_API_KEY and is redacted from every output.
// OAuth 2.0 is the recommended alternative; it is not wired here.

import { parseArgs } from "node:util";
import { assertUrlsOnSite, chunk, emitError, emitJson, readUrlList, resolveDeps, type Deps } from "./lib/cli.ts";
import { findSite, loadConfig, type SiteConfig } from "./lib/config.ts";
import { allowlistFromConfig, httpJson, type HttpOptions } from "./lib/http.ts";
import { Redactor } from "./lib/redact.ts";

// VERIFY the host (ssl.bing.com) and the stats endpoints before code depends on them.
export const BING_HOST = "ssl.bing.com";
export const BING_BASE = `https://${BING_HOST}/webmaster/api.svc/json`;
export const BING_CHUNK = 500;
export const BING_KEY_ENV = "BING_WEBMASTER_API_KEY";

export function bingSiteUrl(site: SiteConfig): string {
  const u = site.bingSiteUrl ?? site.url;
  return u.endsWith("/") ? u : `${u}/`;
}

// VERIFY the response shape of GetUrlSubmissionQuota. The JSON endpoint wraps
// results in "d"; DailyQuota and MonthlyQuota are the documented fields.
export async function getQuota(siteUrl: string, key: string, http: HttpOptions): Promise<{ daily: number; monthly: number | null }> {
  const url = `${BING_BASE}/GetUrlSubmissionQuota?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${encodeURIComponent(key)}`;
  const { data } = await httpJson<any>(url, { method: "GET" }, http);
  const d = data?.d ?? data;
  const daily = Number(d?.DailyQuota);
  if (!Number.isFinite(daily)) throw new Error("GetUrlSubmissionQuota returned no DailyQuota");
  const monthly = Number(d?.MonthlyQuota);
  return { daily, monthly: Number.isFinite(monthly) ? monthly : null };
}

export async function submitBatch(siteUrl: string, urls: string[], key: string, http: HttpOptions): Promise<void> {
  if (urls.length > BING_CHUNK) throw new Error(`SubmitUrlbatch takes at most ${BING_CHUNK} URLs`);
  const url = `${BING_BASE}/SubmitUrlbatch?apikey=${encodeURIComponent(key)}`;
  await httpJson(url, { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body: JSON.stringify({ siteUrl, urlList: urls }) }, http);
}

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
        send: { type: "boolean" },
        config: { type: "string" },
      },
      allowPositionals: true,
    });
    const command = positionals[0];
    if (command !== "submit" && command !== "quota") throw new Error("usage: bing.ts submit|quota --site <url> [--urls ...] [--send]");
    const { config } = await loadConfig(deps.cwd, values.config);
    const site = findSite(config, values.site);
    const siteUrl = bingSiteUrl(site);
    const key = deps.env[BING_KEY_ENV];
    redactor.add(key);
    const http: HttpOptions = { allow: allowlistFromConfig(config, [BING_HOST]), fetchImpl: deps.fetchImpl, redactor, sleep: deps.sleep };

    if (command === "quota") {
      if (!key) throw new Error(`${BING_KEY_ENV} is not set in env`);
      const quota = await getQuota(siteUrl, key, http);
      emitJson(deps, redactor, { tool: "bing", command, siteUrl, quota });
      return 0;
    }

    const urls = assertUrlsOnSite(await readUrlList(values.urls, values["urls-file"], deps.cwd), site.url);
    if (urls.length === 0) throw new Error("no URLs: pass --urls or --urls-file");
    const chunks = chunk(urls, BING_CHUNK);
    const plan = {
      tool: "bing",
      command,
      mode: values.send ? "send" : "dry-run",
      siteUrl,
      keyEnv: BING_KEY_ENV,
      keyPresent: !!key,
      total: urls.length,
      chunks: chunks.map((c, i) => ({ index: i + 1, size: c.length })),
    };
    if (!values.send) {
      emitJson(deps, redactor, { ...plan, note: "dry run: nothing was sent; the quota is checked first on --send. Rerun with --send after a yes in chat." });
      return 0;
    }
    if (!key) throw new Error(`${BING_KEY_ENV} is not set in env`);

    const quota = await getQuota(siteUrl, key, http);
    if (quota.daily <= 0) {
      emitJson(deps, redactor, { ...plan, quota, status: "quota-exhausted", submitted: 0, deferred: urls });
      return 2;
    }
    const allowed = urls.slice(0, quota.daily);
    const deferred = urls.slice(quota.daily);
    const results: Array<{ index: number; size: number; ok: boolean; error?: string }> = [];
    let submitted = 0;
    let stopped: string[] = [];
    const sendChunks = chunk(allowed, BING_CHUNK);
    for (const [i, list] of sendChunks.entries()) {
      try {
        await submitBatch(siteUrl, list, key, http);
        results.push({ index: i + 1, size: list.length, ok: true });
        submitted += list.length;
      } catch (err) {
        results.push({ index: i + 1, size: list.length, ok: false, error: redactor.error(err) });
        stopped = sendChunks.slice(i).flat();
        break;
      }
    }
    const status = stopped.length ? "error" : deferred.length ? "partial-quota" : "submitted";
    emitJson(deps, redactor, { ...plan, quota, status, results, submitted, deferred: [...stopped, ...deferred] });
    return stopped.length ? 1 : deferred.length ? 2 : 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
