import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { resolveChromePath } from "../../mcp/jal-design/audit.ts";
import { compilePattern } from "./lib/config.ts";
import { Allowlist } from "./lib/http.ts";
import { analyse, runRender, type RenderReport } from "./render.ts";

const FIXTURES = join(import.meta.dir, "fixtures", "render");
const FORBIDDEN = [{ source: "cheapest in Indonesia", regex: compilePattern("cheapest in Indonesia") }];

let server: ReturnType<typeof Bun.serve>;
let base: string;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(req) {
      const file = Bun.file(join(FIXTURES, new URL(req.url).pathname.replace(/^\//, "") || "good.html"));
      if (!(await file.exists())) return new Response("not found", { status: 404 });
      return new Response(file, { headers: { "content-type": "text/html; charset=utf-8" } });
    },
  });
  base = `http://127.0.0.1:${server.port}`;
});

afterAll(() => server.stop(true));

describe("runRender", () => {
  test("SKIPPED when the Chrome path does not exist, like ui_audit", async () => {
    const r = await runRender([`${base}/good.html`], { chromePath: "/no/such/chrome-binary", waitMs: 10, sampleMs: 10 });
    expect(r.status).toBe("SKIPPED");
    expect(r.reason).toBeTruthy();
    expect(r.findings).toEqual([]);
  });

  test("refuses a URL outside the allowlist before launching Chrome", async () => {
    await expect(runRender(["https://elsewhere.example/"], { allow: new Allowlist([new URL(base).host]) })).rejects.toThrow(/refused/);
  });

  test(
    "flags split-span headings, a marquee, a count-up and a forbidden phrase; the clean page passes",
    async () => {
      const report: RenderReport = await runRender([`${base}/bad.html`, `${base}/good.html`], {
        waitMs: 1200,
        sampleMs: 800,
        forbidden: FORBIDDEN,
        allow: new Allowlist([new URL(base).host]),
      });
      if (!resolveChromePath()) {
        expect(report.status).toBe("SKIPPED");
        return;
      }
      expect(report.status).toBe("FAIL");
      const [bad, good] = report.pages;
      const rules = bad.flags.map((f) => f.rule);
      expect(rules).toContain("joined-heading");
      expect(rules).toContain("marquee");
      expect(rules).toContain("count-up");
      expect(rules).toContain("forbidden-phrase");
      expect(rules).toContain("flex-join");
      const heading = bad.flags.filter((f) => f.rule === "joined-heading").map((f) => f.detail).join(" ");
      expect(heading).toContain("PlayPadel");
      expect(heading).toContain("BookCourts");
      expect(bad.flags.find((f) => f.rule === "count-up")!.detail).toMatch(/1200/);
      expect(good.flags).toEqual([]);
      expect(report.findings).toHaveLength(1);
      expect(report.findings[0].id).toBe("GEO-09");
      expect(report.findings[0].status).toBe("FAIL");
    },
    60000,
  );
});

describe("analyse", () => {
  const empty = { joins: [], flexJoins: [], marquees: [], counters: [], h1: "", h2: [], body: "", ld: [], title: "" };

  test("a number that changes between samples is a count-up caught mid-animation", () => {
    const first = { ...empty, counters: [{ selector: "#n", text: "120", target: null }] };
    const second = { ...empty, counters: [{ selector: "#n", text: "260", target: null }] };
    expect(analyse(first, second, []).map((f) => f.rule)).toEqual(["count-up"]);
  });

  test("a counter showing something other than its target is flagged once", () => {
    const s = { ...empty, counters: [{ selector: "#n", text: "0", target: "1200" }] };
    const flags = analyse(s, s, []);
    expect(flags).toHaveLength(1);
    expect(flags[0].detail).toContain("instead of 1200");
  });

  test("a steady number at its target passes", () => {
    const s = { ...empty, counters: [{ selector: "#n", text: "1,200", target: "1200" }] };
    expect(analyse(s, s, [])).toEqual([]);
  });

  test("forbidden phrases are found in the body, title and JSON-LD", () => {
    const s = { ...empty, ld: ['{"description":"the cheapest in Indonesia"}'] };
    expect(analyse(s, s, FORBIDDEN).map((f) => f.rule)).toEqual(["forbidden-phrase"]);
  });
});
