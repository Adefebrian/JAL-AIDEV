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
  "form-width-cap",
  "mobile-app-shell",
  "reduced-motion",
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

  test(
    "single-column stacked cards at 320px do not emit card-row-mismatch or card-empty-band",
    async () => {
      const report = await runAudit(`${baseUrl}/cards-stacked.html`, { widths: [320] });
      const rulesFound = new Set(report.violations.map((v) => v.rule));
      expect(rulesFound.has("card-row-mismatch")).toBe(false);
      expect(rulesFound.has("card-empty-band")).toBe(false);
    },
    30000,
  );

  test(
    "same cards side by side at 1280px with unequal, unstretched heights emit card-row-mismatch",
    async () => {
      const report = await runAudit(`${baseUrl}/cards-stacked.html`, { widths: [1280] });
      const rulesFound = new Set(report.violations.map((v) => v.rule));
      expect(rulesFound.has("card-row-mismatch")).toBe(true);
    },
    30000,
  );

  test(
    "a row stretched to match a taller card with an empty band emits card-empty-band, not card-row-mismatch",
    async () => {
      const report = await runAudit(`${baseUrl}/cards-empty-band.html`, { widths: [1280] });
      const rulesFound = new Set(report.violations.map((v) => v.rule));
      expect(rulesFound.has("card-empty-band")).toBe(true);
      expect(rulesFound.has("card-row-mismatch")).toBe(false);
    },
    30000,
  );

  test(
    "a bottom tab bar with only two destinations emits mobile-app-shell below 640px, not at 1280px",
    async () => {
      const small = await runAudit(`${baseUrl}/shell-two-tabs.html`, { widths: [375] });
      expect(small.violations.map((v) => v.rule)).toContain("mobile-app-shell");
      const wide = await runAudit(`${baseUrl}/shell-two-tabs.html`, { widths: [1280] });
      expect(wide.violations.map((v) => v.rule)).not.toContain("mobile-app-shell");
    },
    30000,
  );

  test(
    "a data-jal-exempt=noyzzi section skips visual rules but keeps mechanical ones",
    async () => {
      const report = await runAudit(`${baseUrl}/noyzzi-exempt.html`, { widths: [1280] });
      const inExempt = report.violations.filter((v) => v.selector.includes("exempt") || v.detail.includes("#exempt"));
      const visual = ["gradient-background", "blurred-shadow", "purple-color"];
      for (const rule of visual) {
        expect(report.violations.some((v) => v.rule === rule)).toBe(true); // the lawful twin still fails
        expect(inExempt.some((v) => v.rule === rule)).toBe(false);
      }
      expect(report.violations.some((v) => v.rule === "form-control-min-height" && v.selector === "#tiny-exempt")).toBe(true);
    },
    60000,
  );

  test(
    "reduced-motion fails a page that keeps animating under prefers-reduced-motion",
    async () => {
      const report = await runAudit(`${baseUrl}/motion-loop.html`, { widths: [1280] });
      const rm = report.violations.filter((v) => v.rule === "reduced-motion");
      expect(rm.some((v) => v.detail.includes("requestAnimationFrame"))).toBe(true);
      expect(rm.some((v) => v.detail.includes("infinite animation"))).toBe(true);
    },
    60000,
  );

  test(
    "reduced-motion passes a page that stops its loops under prefers-reduced-motion",
    async () => {
      const report = await runAudit(`${baseUrl}/motion-calm.html`, { widths: [1280] });
      expect(report.violations.filter((v) => v.rule === "reduced-motion")).toEqual([]);
    },
    60000,
  );

  test(
    "an aria-hidden, pointer-events:none backdrop canvas is not an overlap; an interactive layer over content is",
    async () => {
      const report = await runAudit(`${baseUrl}/backdrop-canvas.html`, { widths: [1280] });
      const overlaps = report.violations.filter((v) => v.rule === "overlap");
      expect(overlaps.some((v) => v.selector.includes("ok-stage"))).toBe(false);
      expect(overlaps.some((v) => v.selector.includes("bad-stage"))).toBe(true);
    },
    60000,
  );
});
