// apps/web/server/lib/indexnow.test.ts - the boot submission. Mocked fetch
// only: fires only in production, 10-second timeout, never throws into boot,
// submits only the site's own host, chunks at 10,000.
import { describe, expect, test } from "bun:test";
import { INDEXNOW_ENDPOINT, INDEXNOW_MAX_URLS, INDEXNOW_TIMEOUT_MS, indexNowKeyPath, submitIndexNow, submitOnBoot } from "./indexnow";

const KEY = "0123456789abcdef0123456789abcdef";
const ORIGIN = "https://site.test";
const URLS = [`${ORIGIN}/`, `${ORIGIN}/rates`];

function recorder(status = 202) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    return new Response("", { status });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const base = { key: KEY, origin: ORIGIN, urls: URLS, allowedHosts: ["site.test"], log: () => {} };

describe("IndexNow", () => {
  test("posts host, key, keyLocation and urlList as JSON to the documented endpoint", async () => {
    const { calls, fetchImpl } = recorder();
    const res = await submitIndexNow({ ...base, fetchImpl });
    expect(res).toEqual({ submitted: 2, statuses: [202] });
    expect(calls[0]!.url).toBe(INDEXNOW_ENDPOINT);
    expect((calls[0]!.init.headers as Record<string, string>)["content-type"]).toBe("application/json; charset=utf-8");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ host: "site.test", key: KEY, keyLocation: `${ORIGIN}${indexNowKeyPath(KEY)}`, urlList: URLS });
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
  });

  test("the timeout is 10 seconds and an aborted request is reported, not thrown", async () => {
    expect(INDEXNOW_TIMEOUT_MS).toBe(10_000);
    const hang = ((_: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)))) as unknown as typeof fetch;
    const res = await submitIndexNow({ ...base, fetchImpl: hang, timeoutMs: 20 });
    expect(res).toEqual({ submitted: 2, statuses: [0] });
  });

  test("refuses a host that is not in .jal/seo-geo-aeo.json", async () => {
    const { calls, fetchImpl } = recorder();
    const res = await submitIndexNow({ ...base, allowedHosts: ["other.test"], fetchImpl });
    expect("skipped" in res).toBe(true);
    expect(calls).toHaveLength(0);
  });

  test("drops URLs on any other host", async () => {
    const { calls, fetchImpl } = recorder();
    await submitIndexNow({ ...base, urls: [...URLS, "https://evil.test/x"], fetchImpl });
    expect(JSON.parse(String(calls[0]!.init.body)).urlList).toEqual(URLS);
  });

  test("skips without a valid key", async () => {
    const { calls, fetchImpl } = recorder();
    expect("skipped" in (await submitIndexNow({ ...base, key: undefined, fetchImpl }))).toBe(true);
    expect("skipped" in (await submitIndexNow({ ...base, key: "short", fetchImpl }))).toBe(true);
    expect(calls).toHaveLength(0);
  });

  test("chunks at 10,000 URLs per POST", async () => {
    const { calls, fetchImpl } = recorder();
    const urls = Array.from({ length: INDEXNOW_MAX_URLS + 1 }, (_, i) => `${ORIGIN}/p${i}`);
    await submitIndexNow({ ...base, urls, fetchImpl });
    expect(calls).toHaveLength(2);
    expect(JSON.parse(String(calls[0]!.init.body)).urlList).toHaveLength(INDEXNOW_MAX_URLS);
    expect(JSON.parse(String(calls[1]!.init.body)).urlList).toHaveLength(1);
  });

  test("submitOnBoot fires only in production", async () => {
    const { calls, fetchImpl } = recorder();
    submitOnBoot({ ...base, fetchImpl, nodeEnv: "development" });
    submitOnBoot({ ...base, fetchImpl, nodeEnv: undefined });
    await new Promise((r) => setTimeout(r, 5));
    expect(calls).toHaveLength(0);
    submitOnBoot({ ...base, fetchImpl, nodeEnv: "production" });
    await new Promise((r) => setTimeout(r, 5));
    expect(calls).toHaveLength(1);
  });

  test("submitOnBoot returns at once and never throws, even when fetch hangs or throws", () => {
    const hang = (() => new Promise(() => {})) as unknown as typeof fetch;
    const boom = (() => {
      throw new Error("boom");
    }) as unknown as typeof fetch;
    const t0 = performance.now();
    expect(submitOnBoot({ ...base, fetchImpl: hang, nodeEnv: "production" })).toBeUndefined();
    expect(() => submitOnBoot({ ...base, fetchImpl: boom, nodeEnv: "production" })).not.toThrow();
    expect(performance.now() - t0).toBeLessThan(50);
  });
});
