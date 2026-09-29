import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { runAudit, runShots } from "./audit";

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
// Scroll-walk rules, proven by their own fixtures below: stuck-reveal, blank-viewport.

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

  test(
    "a sign-in screen marked data-jal-shell=none is exempt from mobile-app-shell",
    async () => {
      const report = await runAudit(`${baseUrl}/auth-no-shell.html`, { widths: [375] });
      expect(report.violations.map((v) => v.rule)).not.toContain("mobile-app-shell");
    },
    30000,
  );
  test(
    "stuck-reveal fires when a reveal listens to window but the page scrolls in an inner scroller",
    async () => {
      const report = await runAudit(`${baseUrl}/reveal-wrong-scroller.html`, { widths: [375] });
      const stuck = report.violations.filter((v) => v.rule === "stuck-reveal");
      expect(stuck.length).toBe(1);
      expect(stuck[0].selector).toBe("#late");
      expect(stuck[0].detail).toContain("content still hidden after scrolling into view");
      expect(stuck[0].detail).toContain("main.shell-main");
    },
    60000,
  );

  test(
    "no stuck-reveal or blank-viewport when the same reveal listens to the real scroller",
    async () => {
      const report = await runAudit(`${baseUrl}/reveal-right-scroller.html`, { widths: [375, 1280] });
      const rules = report.violations.map((v) => v.rule);
      expect(rules).not.toContain("stuck-reveal");
      expect(rules).not.toContain("blank-viewport");
    },
    60000,
  );

  test(
    "blank-viewport fires on a screen filled by a 1500px empty section",
    async () => {
      const report = await runAudit(`${baseUrl}/blank-band.html`, { widths: [1280] });
      const blank = report.violations.filter((v) => v.rule === "blank-viewport");
      expect(blank.length).toBeGreaterThan(0);
      expect(blank[0].selector).toBe("#void");
      expect(blank[0].detail).toMatch(/^screen at scrollY \d+ is empty \(\d+ of 48 samples hit content\)/);
      expect(report.violations.map((v) => v.rule)).not.toContain("stuck-reveal");
    },
    60000,
  );

  test(
    "good.html stays clean on the scroll-walk rules at every width",
    async () => {
      const report = await runAudit(`${baseUrl}/good.html`, { widths: [320, 375, 414, 768, 1280] });
      const rules = report.violations.map((v) => v.rule);
      expect(rules).not.toContain("stuck-reveal");
      expect(rules).not.toContain("blank-viewport");
    },
    60000,
  );
});

describe("runShots", () => {
  test(
    "writes one JPEG per screen per width, capped by maxScreens, and clears stale shots",
    async () => {
      const outDir = mkdtempSync(path.join(tmpdir(), "jal-shots-test-"));
      try {
        writeFileSync(path.join(outDir, "375-09.jpg"), "stale");
        const report = await runShots(`${baseUrl}/blank-band.html`, {
          widths: [375, 1280],
          outDir,
          maxScreens: 3,
          webgl: false,
          loadWaitMs: 100,
        });
        expect(report.status).toBe("OK");
        expect(report.scroller).toBe("document");
        expect(report.totalHeight).toBeGreaterThan(2000);
        expect(report.files.length).toBe(6);
        expect(report.files.map((f) => path.basename(f.path)).sort()).toEqual(
          ["1280-01.jpg", "1280-02.jpg", "1280-03.jpg", "375-01.jpg", "375-02.jpg", "375-03.jpg"],
        );
        for (const f of report.files) {
          expect(existsSync(f.path)).toBe(true);
          const bytes = readFileSync(f.path);
          expect(bytes[0]).toBe(0xff);
          expect(bytes[1]).toBe(0xd8);
        }
        expect(report.files.filter((f) => f.width === 1280).map((f) => f.scrollY)).toEqual([0, 800, 1600]);
        expect(readdirSync(outDir)).not.toContain("375-09.jpg");
      } finally {
        rmSync(outDir, { recursive: true, force: true });
      }
    },
    60000,
  );
});
