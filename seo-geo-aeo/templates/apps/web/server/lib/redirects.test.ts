// apps/web/server/lib/redirects.test.ts - every retired target is a live
// route, no retired path is still live, and the server answers 301.
import { describe, expect, test } from "bun:test";
import { createWebApp } from "../../server";
import { buildRouteTable, indexable } from "./meta";
import { RETIRED, retiredTarget } from "./redirects";

const live = new Set(indexable(buildRouteTable()).map((r) => r.path));
const SHELL = '<!doctype html><html lang="en"><head><title></title></head><body><div id="root"></div></body></html>';

describe("retired paths", () => {
  test("every target is a live indexable route", () => {
    for (const [from, to] of Object.entries(RETIRED)) expect({ from, to, live: live.has(to) }).toEqual({ from, to, live: true });
  });

  test("no retired path is still a live route", () => {
    for (const from of Object.keys(RETIRED)) expect(live.has(from)).toBe(false);
  });

  test("the server answers each retired path with a 301 to its target", async () => {
    const target = [...live][0]!;
    const map = { ...RETIRED, "/retired-fixture": target };
    const app = createWebApp({ seo: null, shell: SHELL, retired: map });
    for (const [from, to] of Object.entries(map)) {
      const res = await app.request(from);
      expect(res.status).toBe(301);
      expect(res.headers.get("location")).toBe(to);
    }
    expect(retiredTarget("/retired-fixture", map)).toBe(target);
  });

  test("a trailing slash folds with a 301", async () => {
    const app = createWebApp({ seo: null, shell: SHELL });
    const res = await app.request("/rates/?a=1");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("/rates?a=1");
  });
});
