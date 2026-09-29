import { describe, expect, test } from "bun:test";
import { json, mockFetch } from "../fixtures/testkit.ts";
import { Redactor } from "./redact.ts";
import { Allowlist, allowlistFromConfig, backoffDelay, HostNotAllowedError, HttpError, httpJson, httpRequest } from "./http.ts";

const allow = new Allowlist(["api.example.test", "site.example.test"]);

describe("allowlist", () => {
  test("refuses every host outside the list and never calls fetch", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response("ok"));
    await expect(httpRequest("https://evil.example/steal", {}, { allow, fetchImpl })).rejects.toBeInstanceOf(HostNotAllowedError);
    expect(calls).toHaveLength(0);
  });

  test("refuses non-http schemes", () => {
    expect(allow.allows("file:///etc/passwd")).toBe(false);
    expect(allow.allows("ftp://api.example.test/x")).toBe(false);
  });

  test("refuses a redirect to a host outside the list", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 302, headers: { location: "https://evil.example/" } }));
    await expect(httpRequest("https://site.example.test/", {}, { allow, fetchImpl })).rejects.toBeInstanceOf(HostNotAllowedError);
    expect(calls).toHaveLength(1);
  });

  test("follows allowed redirects and records each hop", async () => {
    const { fetchImpl } = mockFetch((c) => (c.url.endsWith("/a") ? new Response(null, { status: 301, headers: { location: "/b" } }) : new Response("done")));
    const r = await httpRequest("https://site.example.test/a", {}, { allow, fetchImpl });
    expect(r.url).toBe("https://site.example.test/b");
    expect(r.redirects).toEqual([{ url: "https://site.example.test/a", status: 301, location: "https://site.example.test/b" }]);
  });

  test("built from the config: sites, their www twin, allowHosts and service hosts", () => {
    const a = allowlistFromConfig({ sites: [{ url: "https://padel.example" }], languages: ["en"], defaultLanguage: "en", keyUrls: [], allowHosts: ["news.example"] }, ["api.indexnow.org"]);
    expect(a.allows("https://padel.example/x")).toBe(true);
    expect(a.allows("https://www.padel.example/x")).toBe(true);
    expect(a.allows("https://news.example/a")).toBe(true);
    expect(a.allows("https://api.indexnow.org/indexnow")).toBe(true);
    expect(a.allows("https://other.example/")).toBe(false);
  });
});

describe("retries", () => {
  test("backs off on 429, doubling the delay, then succeeds", async () => {
    let n = 0;
    const { fetchImpl, calls } = mockFetch(() => (++n <= 2 ? new Response("slow down", { status: 429 }) : json({ ok: true })));
    const sleeps: number[] = [];
    const r = await httpJson("https://api.example.test/x", {}, { allow, fetchImpl, baseDelayMs: 100, sleep: async (ms) => void sleeps.push(ms) });
    expect(r.data).toEqual({ ok: true });
    expect(calls).toHaveLength(3);
    expect(sleeps).toEqual([100, 200]);
  });

  test("honours Retry-After seconds", async () => {
    let n = 0;
    const { fetchImpl } = mockFetch(() => (++n === 1 ? new Response("", { status: 429, headers: { "retry-after": "2" } }) : new Response("ok")));
    const sleeps: number[] = [];
    await httpRequest("https://api.example.test/x", {}, { allow, fetchImpl, sleep: async (ms) => void sleeps.push(ms) });
    expect(sleeps).toEqual([2000]);
  });

  test("retries 5xx", async () => {
    let n = 0;
    const { fetchImpl, calls } = mockFetch(() => (++n === 1 ? new Response("", { status: 503 }) : new Response("ok")));
    const r = await httpRequest("https://api.example.test/x", {}, { allow, fetchImpl, sleep: async () => {} });
    expect(r.res.status).toBe(200);
    expect(calls).toHaveLength(2);
  });

  test("never retries other 4xx", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response("bad", { status: 400 }));
    const r = await httpRequest("https://api.example.test/x", {}, { allow, fetchImpl, sleep: async () => {} });
    expect(r.res.status).toBe(400);
    expect(calls).toHaveLength(1);
  });

  test("never retries a network error", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      throw new TypeError("connection refused");
    }) as unknown as typeof fetch;
    await expect(httpRequest("https://api.example.test/x", {}, { allow, fetchImpl, sleep: async () => {} })).rejects.toBeInstanceOf(HttpError);
    expect(n).toBe(1);
  });

  test("stops after the retry budget and returns the last 429", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response("", { status: 429 }));
    const r = await httpRequest("https://api.example.test/x", {}, { allow, fetchImpl, retries: 2, sleep: async () => {} });
    expect(r.res.status).toBe(429);
    expect(calls).toHaveLength(3);
  });

  test("shouldRetry can veto a retry (a daily quota error)", async () => {
    const { fetchImpl, calls } = mockFetch(() => json({ error_code: "QUOTA_EXCEEDED" }, 429));
    const r = await httpRequest("https://api.example.test/x", {}, { allow, fetchImpl, sleep: async () => {}, shouldRetry: async (res) => !(await res.text()).includes("QUOTA") });
    expect(r.res.status).toBe(429);
    expect(calls).toHaveLength(1);
  });

  test("backoffDelay caps at the maximum", () => {
    expect(backoffDelay(10, null, 500, 30000)).toBe(30000);
    expect(backoffDelay(0, "999", 500, 30000)).toBe(30000);
  });
});

describe("timeouts and errors", () => {
  test("every request has a timeout", async () => {
    const fetchImpl = ((_: unknown, init: RequestInit) =>
      new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))) as unknown as typeof fetch;
    const err = await httpRequest("https://api.example.test/slow", {}, { allow, fetchImpl, timeoutMs: 30 }).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).kind).toBe("timeout");
  });

  test("error messages never carry the key from the URL or the body", async () => {
    const key = "secret-api-key-1234567890";
    const { fetchImpl } = mockFetch((c) => new Response(`invalid request ${c.url}`, { status: 400 }));
    const redactor = new Redactor({ BING_WEBMASTER_API_KEY: key });
    const err = await httpJson(`https://api.example.test/x?apikey=${key}`, {}, { allow, fetchImpl, redactor }).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(String(err.message)).not.toContain(key);
    expect(String(err.body)).not.toContain(key);
  });
});
