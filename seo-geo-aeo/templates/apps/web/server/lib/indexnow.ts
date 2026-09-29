// apps/web/server/lib/indexnow.ts - the IndexNow key file and the boot
// submission (standard.md SEO-15, webmaster.md 7.1 and 7.3).
//
// - The key lives in env (INDEXNOW_KEY by default, the name comes from
//   .jal/seo-geo-aeo.json through dist/seo.json). It is public by design:
//   the key file at /<key>.txt proves ownership.
// - submitOnBoot() is fire-and-forget: it returns synchronously, never
//   throws, never blocks boot, and aborts the request after 10 seconds.
// - It runs only when NODE_ENV is "production", and only for a site origin
//   whose host is listed in .jal/seo-geo-aeo.json (hard law 10: this is the
//   one standing authorisation; everything else goes through `submit`).
// - Up to 10,000 URLs per POST. Google does not use IndexNow.

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_MAX_URLS = 10_000;
export const INDEXNOW_TIMEOUT_MS = 10_000;

export function isValidIndexNowKey(key: string | undefined): key is string {
  return typeof key === "string" && /^[A-Za-z0-9-]{8,128}$/.test(key);
}

export function indexNowKeyPath(key: string): string {
  return `/${key}.txt`;
}

export interface IndexNowOptions {
  key: string | undefined;
  /** The site origin, e.g. https://example.com (no trailing slash). */
  origin: string;
  urls: string[];
  /** Hosts from .jal/seo-geo-aeo.json; anything else is refused. */
  allowedHosts: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  log?: (msg: string) => void;
}

export type IndexNowResult = { submitted: number; statuses: number[] } | { skipped: string };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Awaitable core, for tests and scripts. Never throws. */
export async function submitIndexNow(opts: IndexNowOptions): Promise<IndexNowResult> {
  const log = opts.log ?? console.log;
  if (!isValidIndexNowKey(opts.key)) return { skipped: "no valid IndexNow key in env" };
  let host: string;
  try {
    host = new URL(opts.origin).host;
  } catch {
    return { skipped: `invalid origin ${opts.origin}` };
  }
  if (!opts.allowedHosts.includes(host)) return { skipped: `host ${host} is not in .jal/seo-geo-aeo.json` };
  const urls = opts.urls.filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
  if (urls.length === 0) return { skipped: "no URLs on the site host" };
  const fetchImpl = opts.fetchImpl ?? fetch;
  const statuses: number[] = [];
  for (const urlList of chunk(urls, INDEXNOW_MAX_URLS)) {
    try {
      const res = await fetchImpl(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host, key: opts.key, keyLocation: `${opts.origin}${indexNowKeyPath(opts.key)}`, urlList }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? INDEXNOW_TIMEOUT_MS),
      });
      statuses.push(res.status);
    } catch (err) {
      statuses.push(0);
      log(`indexnow: request failed (${err instanceof Error ? err.name : "error"})`);
    }
  }
  log(`indexnow: ${urls.length} URL(s), status ${statuses.join(",")}`);
  return { submitted: urls.length, statuses };
}

/** Production boot hook. Returns at once; the request runs in the background. */
export function submitOnBoot(opts: IndexNowOptions & { nodeEnv: string | undefined }): void {
  if (opts.nodeEnv !== "production") return;
  const log = opts.log ?? console.log;
  void submitIndexNow(opts)
    .then((r) => {
      if ("skipped" in r) log(`indexnow: skipped, ${r.skipped}`);
    })
    .catch(() => undefined);
}
