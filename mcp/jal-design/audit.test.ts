import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { runAudit } from "./audit";

const FIXTURES_DIR = path.join(import.meta.dir, "fixtures");

let server: ReturnType<typeof Bun.serve>;
let baseUrl: string;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      const name = url.pathname === "/" ? "good.html" : url.pathname.replace(/^\//, "");
      const file = Bun.file(path.join(FIXTURES_DIR, name));
      if (!(await file.exists())) return new Response("not found", { status: 404 });
      return new Response(file);
    },
  });
  baseUrl = `http://127.0.0.1:${server.port}`;
});

afterAll(() => {
  server.stop(true);
});

const ALL_RULES = [
  "light-background",
  "gradient-background",
  "blurred-shadow",
  "side-stripe",
  "emoji-text",
  "em-dash-text",
  "purple-color",
  "form-row-mismatch",
  "form-control-min-height",
  "card-row-mismatch",
  "card-empty-band",
  "horizontal-overflow",
  "eyebrow-label",
  "overlap",
  "overflow-parent",
  "clipped-text",
  "icon-text-collision",
];

describe("runAudit", () => {
  test(
    "SKIPPED when chromePath points to a nonexistent binary",
    async () => {
      const report = await runAudit(`${baseUrl}/good.html`, {
        chromePath: "/no/such/chrome-binary",
        widths: [375],
      });
      expect(report.status).toBe("SKIPPED");
      expect(report.reason).toBeTruthy();
      expect(report.violations).toEqual([]);
    },
    30000,
  );

  test(
    "FAILs bad.html and reports every implemented rule",
    async () => {
      const report = await runAudit(`${baseUrl}/bad.html`, { widths: [320, 1280] });
      expect(report.status).toBe("FAIL");
      const rulesFound = new Set(report.violations.map((v) => v.rule));
      for (const rule of ALL_RULES) {
        expect(rulesFound.has(rule)).toBe(true);
      }
    },
    60000,
  );

  test(
    "PASSes good.html with zero violations",
    async () => {
      const report = await runAudit(`${baseUrl}/good.html`, {
        widths: [320, 375, 414, 768, 1280],
      });
      expect(report.violations).toEqual([]);
      expect(report.status).toBe("PASS");
    },
    60000,
  );
});
