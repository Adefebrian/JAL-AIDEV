import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { capture, json, mockFetch, tempProject, urlsOn, type Call } from "./fixtures/testkit.ts";
import { main, YANDEX_BASE } from "./yandex.ts";

const TOKEN = "y0_AgAAAAyandextesttokenABCDEFGHIJ0123456789";
const HOST_ID = "https:padel.example:443";
let project: { dir: string; cleanup: () => Promise<void> };

beforeEach(async () => {
  project = await tempProject();
});
afterEach(async () => {
  await project.cleanup();
});

function yandexMock(opts: { remainder?: number; queue?: (call: Call, n: number) => Response } = {}) {
  let queued = 0;
  return mockFetch((call) => {
    if (call.headers.authorization !== `OAuth ${TOKEN}`) return json({ error_code: "INVALID_OAUTH_TOKEN" }, 401);
    if (call.url === `${YANDEX_BASE}/user`) return json({ user_id: 4242 });
    if (call.url === `${YANDEX_BASE}/user/4242/hosts`) {
      return json({ hosts: [{ host_id: "https:other.example:443", ascii_host_url: "https://other.example/" }, { host_id: HOST_ID, ascii_host_url: "https://padel.example/", verified: true }] });
    }
    if (call.url === `${YANDEX_BASE}/user/4242/hosts/${encodeURIComponent(HOST_ID)}/recrawl/quota`) return json({ daily_quota: 20, quota_remainder: opts.remainder ?? 20 });
    if (call.url === `${YANDEX_BASE}/user/4242/hosts/${encodeURIComponent(HOST_ID)}/recrawl/queue`) {
      return opts.queue ? opts.queue(call, ++queued) : json({ task_id: `t${++queued}`, quota_remainder: 10 }, 202);
    }
    return new Response("unexpected", { status: 599 });
  });
}

describe("yandex.ts recrawl", () => {
  test("dry run is the default: no request at all", async () => {
    const { fetchImpl, calls } = yandexMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(2).join(",")], c.deps)).toBe(0);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(c.out()).mode).toBe("dry-run");
  });

  test("resolves the user id and host id first, then queues each URL", async () => {
    const { fetchImpl, calls } = yandexMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(3).join(","), "--send"], c.deps)).toBe(0);
    expect(calls.map((x) => x.url.replace(YANDEX_BASE, ""))).toEqual([
      "/user",
      "/user/4242/hosts",
      `/user/4242/hosts/${encodeURIComponent(HOST_ID)}/recrawl/quota`,
      ...Array(3).fill(`/user/4242/hosts/${encodeURIComponent(HOST_ID)}/recrawl/queue`),
    ]);
    expect(JSON.parse(calls[3].body)).toEqual({ url: "https://padel.example/p/1" });
    const out = JSON.parse(c.out());
    expect(out.userId).toBe("4242");
    expect(out.hostId).toBe(HOST_ID);
    expect(out.queued).toHaveLength(3);
  });

  test("uses YANDEX_USER_ID when set and skips GET /v4/user", async () => {
    const { fetchImpl, calls } = yandexMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN, YANDEX_USER_ID: "4242" } });
    expect(await main(["recrawl", "--urls", urlsOn(1).join(","), "--send"], c.deps)).toBe(0);
    expect(calls[0].url).toBe(`${YANDEX_BASE}/user/4242/hosts`);
  });

  test('"already added" is recorded and the run continues', async () => {
    const { fetchImpl } = yandexMock({ queue: (_c, n) => (n === 2 ? json({ error_code: "URL_ALREADY_ADDED", error_message: "already in queue" }, 409) : json({ task_id: "t" }, 202)) });
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(3).join(","), "--send"], c.deps)).toBe(0);
    const out = JSON.parse(c.out());
    expect(out.queued).toEqual(["https://padel.example/p/1", "https://padel.example/p/3"]);
    expect(out.alreadyAdded).toEqual(["https://padel.example/p/2"]);
  });

  test('"quota exceeded" stops the run, is never retried, and defers the rest', async () => {
    let queueCalls = 0;
    const { fetchImpl } = yandexMock({
      queue: (_c, n) => {
        queueCalls++;
        return n >= 2 ? json({ error_code: "QUOTA_EXCEEDED", error_message: "daily quota exceeded" }, 429) : json({ task_id: "t" }, 202);
      },
    });
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(4).join(","), "--send"], c.deps)).toBe(2);
    const out = JSON.parse(c.out());
    expect(out.status).toBe("quota-exceeded");
    expect(out.queued).toEqual(["https://padel.example/p/1"]);
    expect(out.deferred).toEqual(["https://padel.example/p/2", "https://padel.example/p/3", "https://padel.example/p/4"]);
    expect(queueCalls).toBe(2);
    expect(c.sleeps).toHaveLength(0);
  });

  test("a zero quota remainder queues nothing", async () => {
    const { fetchImpl, calls } = yandexMock({ remainder: 0 });
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(2).join(","), "--send"], c.deps)).toBe(2);
    expect(calls.some((x) => x.url.endsWith("/recrawl/queue"))).toBe(false);
    expect(JSON.parse(c.out()).status).toBe("quota-exhausted");
  });

  test("backs off on a plain 429 (not a quota error)", async () => {
    const { fetchImpl } = yandexMock({ queue: (_c, n) => (n === 1 ? json({ error_code: "TOO_MANY_REQUESTS" }, 429) : json({ task_id: "t" }, 202)) });
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(1).join(","), "--send"], c.deps)).toBe(0);
    expect(c.sleeps).toHaveLength(1);
  });

  test("the token never appears in output or errors", async () => {
    const { fetchImpl } = mockFetch((call) => new Response(`{"error_code":"INVALID_OAUTH_TOKEN","error_message":"bad ${call.headers.authorization}"}`, { status: 401 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", urlsOn(1).join(","), "--send"], c.deps)).toBe(1);
    expect(c.err()).toContain("401");
    expect(c.all()).not.toContain(TOKEN);
  });

  test("refuses URLs outside the site", async () => {
    const { fetchImpl, calls } = yandexMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["recrawl", "--urls", "https://evil.example/x", "--send"], c.deps)).toBe(1);
    expect(c.err()).toContain("refused");
    expect(calls).toHaveLength(0);
  });
});

describe("yandex.ts quota", () => {
  test("resolves the ids and reads the daily quota", async () => {
    const { fetchImpl } = yandexMock({ remainder: 7 });
    const c = capture({ fetchImpl, cwd: project.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
    expect(await main(["quota"], c.deps)).toBe(0);
    expect(JSON.parse(c.out()).quota).toEqual({ daily: 20, remainder: 7 });
  });

  test("fails when the configured host id is not among the user's hosts", async () => {
    const other = await tempProject({ sites: [{ url: "https://padel.example", yandexHostId: "https:unknown.example:443" }], languages: ["en"], defaultLanguage: "en", keyUrls: ["/"] });
    try {
      const { fetchImpl } = yandexMock();
      const c = capture({ fetchImpl, cwd: other.dir, env: { YANDEX_WEBMASTER_TOKEN: TOKEN } });
      expect(await main(["quota"], c.deps)).toBe(1);
      expect(c.err()).toContain("not among the 2 hosts");
    } finally {
      await other.cleanup();
    }
  });
});
