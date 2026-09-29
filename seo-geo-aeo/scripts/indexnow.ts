#!/usr/bin/env bun
// indexnow.ts --site <url> --urls a,b [--urls-file list.txt] [--key-location url] [--send]
// Submits the site's own URLs to IndexNow in chunks of 10,000 (instruction
// 7.1). Dry run unless --send; only config sites; the key comes from env and
// never appears in output (it is public by design, but it is kept out of logs).

import { parseArgs } from "node:util";
import { assertUrlsOnSite, chunk, emitError, emitJson, readUrlList, resolveDeps, type Deps } from "./lib/cli.ts";
import { findSite, loadConfig } from "./lib/config.ts";
import { allowlistFromConfig, httpRequest } from "./lib/http.ts";
import { Redactor } from "./lib/redact.ts";

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_HOST = "api.indexnow.org";
export const INDEXNOW_CHUNK = 10000;

// VERIFY the meaning of each 4xx status in the docs (indexnow.org/documentation)
// before code depends on it. The readings below are the commonly documented ones.
// VERIFY the participating engines at indexnow.org/searchengines (Bing, Yandex and
// others share submissions; Google does not use IndexNow).
export const STATUS_MEANING: Record<number, string> = {
  200: "OK, URLs received",
  202: "accepted, key validation pending",
  400: "bad request (invalid format)",
  403: "forbidden (key not valid: key file missing or not matching)",
  422: "unprocessable (URLs not on the host, or the key does not match the schema)",
  429: "too many requests",
};

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = new Redactor(deps.env);
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        site: { type: "string" },
        urls: { type: "string", multiple: true },
        "urls-file": { type: "string" },
        "key-location": { type: "string" },
        send: { type: "boolean" },
        config: { type: "string" },
      },
      allowPositionals: false,
    });
    const { config } = await loadConfig(deps.cwd, values.config);
    const site = findSite(config, values.site);
    const urls = assertUrlsOnSite(await readUrlList(values.urls, values["urls-file"], deps.cwd), site.url);
    if (urls.length === 0) throw new Error("no URLs: pass --urls or --urls-file");
    const origin = new URL(site.url).origin;
    const host = new URL(site.url).host;
    const keyEnv = site.indexNowKeyEnv ?? "INDEXNOW_KEY";
    const key = deps.env[keyEnv];
    redactor.add(key);
    const keyLocation = values["key-location"] ?? (key ? `${origin}/${key}.txt` : `${origin}/{key}.txt`);
    if (values["key-location"]) assertUrlsOnSite([keyLocation], site.url);
    const chunks = chunk(urls, INDEXNOW_CHUNK);
    const plan = {
      tool: "indexnow",
      mode: values.send ? "send" : "dry-run",
      endpoint: INDEXNOW_ENDPOINT,
      host,
      keyEnv,
      keyPresent: !!key,
      keyLocation,
      total: urls.length,
      chunks: chunks.map((c, i) => ({ index: i + 1, size: c.length, first: c[0], last: c[c.length - 1] })),
    };
    if (!values.send) {
      emitJson(deps, redactor, { ...plan, note: "dry run: nothing was sent. Rerun with --send after a yes in chat." });
      return 0;
    }
    if (!key) throw new Error(`${keyEnv} is not set in env`);
    const allow = allowlistFromConfig(config, [INDEXNOW_HOST]);
    const results: Array<{ index: number; size: number; status: number; meaning: string }> = [];
    let failed = false;
    for (const [i, list] of chunks.entries()) {
      const { res } = await httpRequest(
        INDEXNOW_ENDPOINT,
        {
          method: "POST",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: JSON.stringify({ host, key, keyLocation, urlList: list }),
        },
        { allow, fetchImpl: deps.fetchImpl, redactor, sleep: deps.sleep, timeoutMs: 10000 },
      );
      await res.body?.cancel().catch(() => {});
      results.push({ index: i + 1, size: list.length, status: res.status, meaning: STATUS_MEANING[res.status] ?? `status ${res.status}` });
      if (res.status !== 200 && res.status !== 202) {
        failed = true;
        break;
      }
    }
    const sent = results.filter((r) => r.status === 200 || r.status === 202).reduce((n, r) => n + r.size, 0);
    emitJson(deps, redactor, { ...plan, results, submitted: sent, notSubmitted: urls.length - sent });
    return failed ? 1 : 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
