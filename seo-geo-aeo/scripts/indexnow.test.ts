import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { capture, mockFetch, tempProject, urlsOn } from "./fixtures/testkit.ts";
import { INDEXNOW_CHUNK, INDEXNOW_ENDPOINT, main } from "./indexnow.ts";

const KEY = "indexnowtestkey0123456789abcdef";
let project: { dir: string; cleanup: () => Promise<void> };

beforeEach(async () => {
  project = await tempProject();
});
afterEach(async () => {
  await project.cleanup();
});

async function writeUrls(count: number): Promise<string> {
  const file = join(project.dir, "urls.txt");
  await writeFile(file, urlsOn(count).join("\n"));
  return file;
}

describe("indexnow.ts", () => {
  test("dry run is the default: nothing is sent", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 200 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const code = await main(["--urls", urlsOn(3).join(",")], c.deps);
    expect(code).toBe(0);
    expect(calls).toHaveLength(0);
    const out = JSON.parse(c.out());
    expect(out.mode).toBe("dry-run");
    expect(out.keyPresent).toBe(true);
    expect(out.note).toContain("dry run");
  });

  test("chunks at 10,000 URLs per POST", async () => {
    const file = await writeUrls(25000);
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 202 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const dry = await main(["--urls-file", file], c.deps);
    expect(dry).toBe(0);
    expect(JSON.parse(c.out()).chunks.map((x: any) => x.size)).toEqual([10000, 10000, 5000]);
    expect(calls).toHaveLength(0);

    const c2 = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const code = await main(["--urls-file", file, "--send"], c2.deps);
    expect(code).toBe(0);
    expect(calls).toHaveLength(3);
    expect(calls.every((x) => x.url === INDEXNOW_ENDPOINT && x.method === "POST")).toBe(true);
    expect(calls[0].headers["content-type"]).toBe("application/json; charset=utf-8");
    const bodies = calls.map((x) => JSON.parse(x.body));
    expect(bodies.map((b) => b.urlList.length)).toEqual([INDEXNOW_CHUNK, INDEXNOW_CHUNK, 5000]);
    expect(bodies[0]).toMatchObject({ host: "padel.example", key: KEY, keyLocation: `https://padel.example/${KEY}.txt` });
    expect(JSON.parse(c2.out()).submitted).toBe(25000);
  });

  test("the key never appears in output or errors", async () => {
    const { fetchImpl } = mockFetch((call) => new Response(`bad key ${JSON.parse(call.body).key}`, { status: 403 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const code = await main(["--urls", urlsOn(2).join(","), "--send"], c.deps);
    expect(code).toBe(1);
    expect(c.all()).not.toContain(KEY);
    expect(JSON.parse(c.out()).results[0].meaning).toContain("key not valid");

    const c2 = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    await main(["--urls", urlsOn(2).join(",")], c2.deps);
    expect(c2.all()).not.toContain(KEY);
    expect(c2.out()).toContain("[REDACTED].txt");
  });

  test("refuses a site that is not in the config", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 200 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const code = await main(["--site", "https://other.example", "--urls", "https://other.example/a", "--send"], c.deps);
    expect(code).toBe(1);
    expect(c.err()).toContain("refused");
    expect(calls).toHaveLength(0);
  });

  test("refuses URLs that are not on the site's host", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 200 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const code = await main(["--urls", "https://padel.example/a,https://evil.example/b", "--send"], c.deps);
    expect(code).toBe(1);
    expect(c.err()).toMatch(/refused: 1 URL\(s\) are not on padel\.example/);
    expect(calls).toHaveLength(0);
  });

  test("backs off on 429 and then succeeds", async () => {
    let n = 0;
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: ++n === 1 ? 429 : 200 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: { INDEXNOW_KEY: KEY } });
    const code = await main(["--urls", urlsOn(2).join(","), "--send"], c.deps);
    expect(code).toBe(0);
    expect(calls).toHaveLength(2);
    expect(c.sleeps.length).toBe(1);
  });

  test("send without the key in env fails before any request", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 200 }));
    const c = capture({ fetchImpl, cwd: project.dir, env: {} });
    const code = await main(["--urls", urlsOn(1).join(","), "--send"], c.deps);
    expect(code).toBe(1);
    expect(c.err()).toContain("INDEXNOW_KEY is not set");
    expect(calls).toHaveLength(0);
  });
});
