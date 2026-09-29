// Test helpers: a mocked fetch that never reaches the network, a temporary
// project with .jal/seo-geo-aeo.json, and captured stdout and stderr.

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Deps } from "../lib/cli.ts";
import type { SeoConfig } from "../lib/config.ts";

export type Call = { url: string; method: string; headers: Record<string, string>; body: string };
export type Handler = (call: Call) => Response | Promise<Response>;

export function mockFetch(handler: Handler): { fetchImpl: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((v, k) => (headers[k] = v));
    const call: Call = { url: String(input), method: (init.method ?? "GET").toUpperCase(), headers, body: typeof init.body === "string" ? init.body : "" };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });

export const SITE = "https://padel.example";

export function baseConfig(overrides: Partial<SeoConfig> = {}): SeoConfig {
  return {
    sites: [{ url: SITE, gscProperty: "sc-domain:padel.example", bingSiteUrl: `${SITE}/`, yandexHostId: "https:padel.example:443", indexNowKeyEnv: "INDEXNOW_KEY" }],
    languages: ["en", "id"],
    defaultLanguage: "en",
    keyUrls: ["/", "/rates", "/about", "/contact"],
    ...overrides,
  };
}

export async function tempProject(config: SeoConfig | object = baseConfig()): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), "jal-seo-test-"));
  await mkdir(join(dir, ".jal"), { recursive: true });
  await writeFile(join(dir, ".jal/seo-geo-aeo.json"), JSON.stringify(config, null, 2));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

export function capture(extra: Partial<Deps> = {}): { deps: Deps; out: () => string; err: () => string; all: () => string; sleeps: number[] } {
  let out = "";
  let err = "";
  const sleeps: number[] = [];
  const deps: Deps = {
    out: (s) => (out += s + "\n"),
    err: (s) => (err += s + "\n"),
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    now: () => new Date("2026-09-29T08:00:00Z"),
    ...extra,
  };
  return { deps, out: () => out, err: () => err, all: () => out + err, sleeps };
}

export function urlsOn(count: number, base = SITE): string[] {
  return Array.from({ length: count }, (_, i) => `${base}/p/${i + 1}`);
}
