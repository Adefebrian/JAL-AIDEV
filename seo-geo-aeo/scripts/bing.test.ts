import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BING_BASE, BING_CHUNK, main } from "./bing.ts";
import { capture, json, mockFetch, tempProject, urlsOn, type Call } from "./fixtures/testkit.ts";

const KEY = "bingwebmasterkey0123456789abcdef";
let project: { dir: string; cleanup: () => Promise<void> };
let urlsFile: string;

beforeEach(async () => {
  project = await tempProject();
  urlsFile = join(project.dir, "urls.txt");
  await writeFile(urlsFile, urlsOn(1200).join("\n"));
});
afterEach(async () => {
  await project.cleanup();
});

function bingMock(daily: number, onSubmit: (call: Call) => Response = () => json({ d: null })) {
  return mockFetch((call) => {
    if (call.url.startsWith(`${BING_BASE}/GetUrlSubmissionQuota`)) return json({ d: { __type: "UrlSubmissionQuota", DailyQuota: daily, MonthlyQuota: 9000 } });
    if (call.url.startsWith(`${BING_BASE}/SubmitUrlbatch`)) return onSubmit(call);
    return new Response("unexpected", { status: 599 });
  });
}

describe("bing.ts submit", () => {
  test("dry run is the default: no quota call, no submission", async () => {
    const { fetchImpl, calls } = bingMock(5000);
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--urls-file", urlsFile], c.deps)).toBe(0);
    expect(calls).toHaveLength(0);
    const out = JSON.parse(c.out());
    expect(out.mode).toBe("dry-run");
    expect(out.chunks.map((x: any) => x.size)).toEqual([500, 500, 200]);
  });

  test("checks the quota first, then sends chunks of 500", async () => {
    const { fetchImpl, calls } = bingMock(5000);
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--urls-file", urlsFile, "--send"], c.deps)).toBe(0);
    expect(calls[0].url).toContain("GetUrlSubmissionQuota");
    expect(calls[0].url).toContain(`siteUrl=${encodeURIComponent("https://padel.example/")}`);
    const posts = calls.slice(1);
    expect(posts.every((p) => p.method === "POST" && p.url.startsWith(`${BING_BASE}/SubmitUrlbatch?apikey=`))).toBe(true);
    const bodies = posts.map((p) => JSON.parse(p.body));
    expect(bodies.map((b) => b.urlList.length)).toEqual([BING_CHUNK, BING_CHUNK, 200]);
    expect(bodies[0].siteUrl).toBe("https://padel.example/");
    expect(JSON.parse(c.out()).submitted).toBe(1200);
  });

  test("submits only what the daily quota allows and defers the rest", async () => {
    const { fetchImpl, calls } = bingMock(600);
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--urls-file", urlsFile, "--send"], c.deps)).toBe(2);
    const bodies = calls.slice(1).map((p) => JSON.parse(p.body));
    expect(bodies.map((b) => b.urlList.length)).toEqual([500, 100]);
    const out = JSON.parse(c.out());
    expect(out.status).toBe("partial-quota");
    expect(out.submitted).toBe(600);
    expect(out.deferred).toHaveLength(600);
  });

  test("an exhausted quota sends nothing", async () => {
    const { fetchImpl, calls } = bingMock(0);
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--urls-file", urlsFile, "--send"], c.deps)).toBe(2);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(c.out()).status).toBe("quota-exhausted");
  });

  test("the key never appears in output or errors, even when the API echoes it", async () => {
    const { fetchImpl } = bingMock(5000, (call) => new Response(`{"ErrorCode":3,"Message":"InvalidApiKey ${call.url}"}`, { status: 400 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--urls-file", urlsFile, "--send"], c.deps)).toBe(1);
    expect(c.all()).not.toContain(KEY);
    const out = JSON.parse(c.out());
    expect(out.status).toBe("error");
    expect(out.results[0].error).toContain("400");
    expect(out.deferred).toHaveLength(1200);
  });

  test("backs off on 429 from the quota endpoint", async () => {
    let n = 0;
    const { fetchImpl } = mockFetch((call) => {
      if (call.url.includes("GetUrlSubmissionQuota")) return ++n === 1 ? new Response("", { status: 429 }) : json({ d: { DailyQuota: 10 } });
      return json({ d: null });
    });
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--urls", urlsOn(3).join(","), "--send"], c.deps)).toBe(0);
    expect(c.sleeps).toHaveLength(1);
  });

  test("refuses a site that is not in the config", async () => {
    const { fetchImpl, calls } = bingMock(5000);
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["submit", "--site", "https://other.example", "--urls", "https://other.example/a", "--send"], c.deps)).toBe(1);
    expect(c.err()).toContain("refused");
    expect(calls).toHaveLength(0);
  });
});

describe("bing.ts quota", () => {
  test("reads the quota and redacts the key", async () => {
    const { fetchImpl, calls } = bingMock(321);
    const c = capture({ fetchImpl, cwd: project.dir, env: { BING_WEBMASTER_API_KEY: KEY } });
    expect(await main(["quota"], c.deps)).toBe(0);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(c.out()).quota).toEqual({ daily: 321, monthly: 9000 });
    expect(c.all()).not.toContain(KEY);
  });

  test("fails clearly without the key", async () => {
    const { fetchImpl, calls } = bingMock(1);
    const c = capture({ fetchImpl, cwd: project.dir, env: {} });
    expect(await main(["quota"], c.deps)).toBe(1);
    expect(c.err()).toContain("BING_WEBMASTER_API_KEY is not set");
    expect(calls).toHaveLength(0);
  });
});
