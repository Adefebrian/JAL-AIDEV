#!/usr/bin/env bun
// yandex.ts quota   --site <url>
// yandex.ts recrawl --site <url> --urls a,b [--urls-file list.txt] [--send]
// Yandex Webmaster API v4 with an OAuth token (instruction 7.1). Resolves the
// user id (GET /v4/user, or YANDEX_USER_ID) and the host id (GET
// /v4/user/{user-id}/hosts) first, checks the daily quota, then queues each
// URL for recrawl. "Already added" is recorded and skipped; "quota exceeded"
// stops the run and defers the rest. Dry run unless --send. Yandex also
// consumes IndexNow.

import { parseArgs } from "node:util";
import { assertUrlsOnSite, emitError, emitJson, readUrlList, resolveDeps, type Deps } from "./lib/cli.ts";
import { findSite, loadConfig, type SiteConfig } from "./lib/config.ts";
import { allowlistFromConfig, httpJson, httpRequest, type HttpOptions } from "./lib/http.ts";
import { Redactor } from "./lib/redact.ts";

export const YANDEX_HOST = "api.webmaster.yandex.net";
export const YANDEX_BASE = `https://${YANDEX_HOST}/v4`;
export const YANDEX_TOKEN_ENV = "YANDEX_WEBMASTER_TOKEN";
export const YANDEX_USER_ENV = "YANDEX_USER_ID";

// VERIFY the exact error codes in the API reference. The API returns
// { error_code, error_message }; these patterns match the "already added"
// and "quota exceeded" families without depending on one spelling.
export const ALREADY_ADDED = /ALREADY/i;
export const QUOTA_EXCEEDED = /QUOTA/i;

type Ids = { userId: string; hostId: string };

async function errorCode(res: Response): Promise<{ code: string; message: string }> {
  try {
    const data: any = await res.json();
    return { code: String(data?.error_code ?? ""), message: String(data?.error_message ?? "") };
  } catch {
    return { code: "", message: "" };
  }
}

function sameSite(hostUrl: string, site: SiteConfig): boolean {
  try {
    return new URL(hostUrl).origin === new URL(site.url).origin;
  } catch {
    return false;
  }
}

export async function resolveIds(site: SiteConfig, token: string, env: Record<string, string | undefined>, http: HttpOptions): Promise<Ids> {
  const headers = { authorization: `OAuth ${token}` };
  let userId = env[YANDEX_USER_ENV];
  if (!userId) {
    const { data } = await httpJson<any>(`${YANDEX_BASE}/user`, { method: "GET", headers }, http);
    userId = data?.user_id !== undefined ? String(data.user_id) : undefined;
    if (!userId) throw new Error("GET /v4/user returned no user_id");
  }
  const { data } = await httpJson<any>(`${YANDEX_BASE}/user/${encodeURIComponent(userId)}/hosts`, { method: "GET", headers }, http);
  const hosts: any[] = Array.isArray(data?.hosts) ? data.hosts : [];
  // VERIFY the yandexHostId format (the instruction's example is "https:padelparty.id:443").
  const host = site.yandexHostId
    ? hosts.find((h) => h.host_id === site.yandexHostId)
    : hosts.find((h) => sameSite(h.ascii_host_url ?? h.unicode_host_url ?? "", site));
  if (!host) throw new Error(`the site is not among the ${hosts.length} hosts of this Yandex user (check yandexHostId and verification)`);
  return { userId, hostId: String(host.host_id) };
}

// VERIFY the quota path and fields (daily_quota, quota_remainder).
export async function getQuota(ids: Ids, token: string, http: HttpOptions): Promise<{ daily: number | null; remainder: number }> {
  const { data } = await httpJson<any>(`${YANDEX_BASE}/user/${encodeURIComponent(ids.userId)}/hosts/${encodeURIComponent(ids.hostId)}/recrawl/quota`, { method: "GET", headers: { authorization: `OAuth ${token}` } }, http);
  const remainder = Number(data?.quota_remainder);
  if (!Number.isFinite(remainder)) throw new Error("recrawl quota returned no quota_remainder");
  const daily = Number(data?.daily_quota);
  return { daily: Number.isFinite(daily) ? daily : null, remainder };
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
    if (command !== "recrawl" && command !== "quota") throw new Error("usage: yandex.ts recrawl|quota --site <url> [--urls ...] [--send]");
    const { config } = await loadConfig(deps.cwd, values.config);
    const site = findSite(config, values.site);
    const token = deps.env[YANDEX_TOKEN_ENV];
    redactor.add(token);
    // A daily quota error is final for the day: never retry it.
    const http: HttpOptions = {
      allow: allowlistFromConfig(config, [YANDEX_HOST]),
      fetchImpl: deps.fetchImpl,
      redactor,
      sleep: deps.sleep,
      shouldRetry: async (res) => !QUOTA_EXCEEDED.test((await errorCode(res)).code),
    };

    if (command === "quota") {
      if (!token) throw new Error(`${YANDEX_TOKEN_ENV} is not set in env`);
      const ids = await resolveIds(site, token, deps.env, http);
      emitJson(deps, redactor, { tool: "yandex", command, ...ids, quota: await getQuota(ids, token, http) });
      return 0;
    }

    const urls = assertUrlsOnSite(await readUrlList(values.urls, values["urls-file"], deps.cwd), site.url);
    if (urls.length === 0) throw new Error("no URLs: pass --urls or --urls-file");
    const plan = { tool: "yandex", command, mode: values.send ? "send" : "dry-run", site: site.url, tokenEnv: YANDEX_TOKEN_ENV, tokenPresent: !!token, total: urls.length };
    if (!values.send) {
      emitJson(deps, redactor, { ...plan, urls, note: "dry run: nothing was queued; user id, host id and quota are resolved on --send. Rerun with --send after a yes in chat." });
      return 0;
    }
    if (!token) throw new Error(`${YANDEX_TOKEN_ENV} is not set in env`);

    const ids = await resolveIds(site, token, deps.env, http);
    const quota = await getQuota(ids, token, http);
    const queueUrl = `${YANDEX_BASE}/user/${encodeURIComponent(ids.userId)}/hosts/${encodeURIComponent(ids.hostId)}/recrawl/queue`;
    const queued: string[] = [];
    const alreadyAdded: string[] = [];
    const errors: Array<{ url: string; status: number; code: string }> = [];
    let deferred: string[] = [];
    let status = "done";
    if (quota.remainder <= 0) {
      status = "quota-exhausted";
      deferred = urls;
    } else {
      const todo = urls.slice(0, quota.remainder);
      deferred = urls.slice(quota.remainder);
      if (deferred.length) status = "partial-quota";
      for (const [i, url] of todo.entries()) {
        // VERIFY: POST .../recrawl/queue with body { url } answers 202 with a task_id.
        const { res } = await httpRequest(queueUrl, { method: "POST", headers: { authorization: `OAuth ${token}`, "content-type": "application/json" }, body: JSON.stringify({ url }) }, http);
        if (res.ok) {
          await res.body?.cancel().catch(() => {});
          queued.push(url);
          continue;
        }
        const e = await errorCode(res);
        if (ALREADY_ADDED.test(e.code)) {
          alreadyAdded.push(url);
          continue;
        }
        if (QUOTA_EXCEEDED.test(e.code)) {
          status = "quota-exceeded";
          deferred = [...todo.slice(i), ...deferred];
          break;
        }
        errors.push({ url, status: res.status, code: e.code || `status ${res.status}` });
        status = "error";
        deferred = [...todo.slice(i + 1), ...deferred];
        break;
      }
    }
    emitJson(deps, redactor, { ...plan, ...ids, quota, status, queued, alreadyAdded, errors, deferred });
    return status === "done" ? 0 : status === "error" ? 1 : 2;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
