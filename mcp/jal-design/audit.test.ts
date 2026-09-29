import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  CdpClient,
  createPageTarget,
  launchChrome,
  normalizeMaxScreens,
  normalizeWidths,
  resolveChromePath,
  resolveOutDir,
  runAudit,
  runShots,
  walkScroller,
  withTimeout,
} from "./audit";

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
    "a tall sticky stage below the fold covering copy is an overlap, not an exempt edge bar",
    async () => {
      const report = await runAudit(`${baseUrl}/sticky-stage-overlap.html`, { widths: [375, 1280] });
      const overlaps = report.violations.filter((v) => v.rule === "overlap");
      expect(overlaps.some((v) => v.detail.includes("sticky-stage") && v.detail.includes("covered-copy"))).toBe(true);
    },
    60000,
  );

  test(
    "the document-mode app-shell (sticky header, fixed bottom tab bar over main) is not an overlap",
    async () => {
      const report = await runAudit(`${baseUrl}/shell-document-mode.html`, { widths: [375, 1280] });
      expect(report.violations.filter((v) => v.rule === "overlap")).toEqual([]);
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
    "a long broken page at 5 widths shares the timeout across widths and still FAILs, never SKIPPED",
    async () => {
      const report = await runAudit(`${baseUrl}/long-broken.html`, { widths: [320, 375, 414, 768, 1280], timeoutMs: 30000 });
      expect(report.status).toBe("FAIL");
      expect(report.reason).toBeUndefined();
      expect(report.violations.some((v) => v.rule === "stuck-reveal" && v.selector === "#stuck")).toBe(true);
      const cut = (report.notes ?? []).filter((n) => n.includes("stopped at scrollY"));
      expect(cut.length).toBe(5);
    },
    60000,
  );

  test(
    "a timeout keeps the violations already found and reports FAIL with a cut-short note",
    async () => {
      const report = await runAudit(`${baseUrl}/scroll-hang.html`, { widths: [1280], timeoutMs: 10000 });
      expect(report.status).toBe("FAIL");
      expect(report.reason).toContain("timed out after 10000ms");
      expect(report.reason).toContain("scroll walk was cut short");
      expect(report.violations.map((v) => v.rule)).toContain("em-dash-text");
      expect(report.notes).toContain("partial result: audit did not finish");
    },
    30000,
  );

  for (const [file, what] of [
    ["walk-notfound.html", "a centred 404 page that does not scroll"],
    ["walk-bg-hero.html", "a full-bleed CSS background-image hero with one headline"],
    ["walk-embed.html", "a section holding a map iframe"],
  ]) {
    test(
      `no blank-viewport on ${what}`,
      async () => {
        const report = await runAudit(`${baseUrl}/${file}`, { widths: [375, 1280] });
        expect(report.status).not.toBe("SKIPPED");
        expect(report.violations.map((v) => v.rule)).not.toContain("blank-viewport");
      },
      30000,
    );
  }

  test(
    "stacked alternates (fade carousel, Swiper fade slides, word rotator) are not stuck; a real stuck section still is",
    async () => {
      const report = await runAudit(`${baseUrl}/stacked-alternates.html`, { widths: [375, 1280] });
      const stuck = report.violations.filter((v) => v.rule === "stuck-reveal");
      expect([...new Set(stuck.map((v) => v.selector))]).toEqual(["#real"]);
    },
    30000,
  );

  test(
    "stuck-reveal catches a heading that sits on the seam between two full-screen steps",
    async () => {
      const report = await runAudit(`${baseUrl}/seam-reveal.html`, { widths: [1280] });
      const stuck = report.violations.filter((v) => v.rule === "stuck-reveal");
      expect(stuck.map((v) => v.selector)).toEqual(["#edge"]);
    },
    30000,
  );

  test(
    "ui_audit renders with WebGL by default; without it, walk messages say so",
    async () => {
      const withGl = await runAudit(`${baseUrl}/webgl-gate.html`, { widths: [1280] });
      expect(withGl.violations.map((v) => v.rule)).not.toContain("stuck-reveal");
      const noGl = await runAudit(`${baseUrl}/webgl-gate.html`, { widths: [1280], webgl: false });
      const stuck = noGl.violations.filter((v) => v.rule === "stuck-reveal");
      expect(stuck.map((v) => v.selector)).toEqual(["#scene"]);
      expect(stuck[0].detail.endsWith("(rendered without WebGL)")).toBe(true);
      expect(noGl.notes?.some((n) => n.includes("without WebGL"))).toBe(true);
    },
    40000,
  );

  test(
    "scroller detection prefers a scrolling document over a sidebar, and honours data-jal-scroller",
    async () => {
      const chrome = resolveChromePath();
      expect(chrome).toBeTruthy();
      const dir = mkdtempSync(path.join(tmpdir(), "jal-scroller-test-"));
      const handle = await launchChrome(chrome!, dir);
      try {
        const target = await createPageTarget(handle.port);
        const client = await CdpClient.connect(target.webSocketDebuggerUrl);
        await client.send("Page.enable");
        await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1024, deviceScaleFactor: 1, mobile: false });
        const scrollerOf = async (url: string) => {
          const loaded = client.waitForEvent("Page.loadEventFired", 25000);
          await client.send("Page.navigate", { url });
          await loaded;
          const walk = await walkScroller(client, { probe: false, maxSteps: 1, settleMs: 50 });
          return walk.scroller;
        };
        expect(await scrollerOf(`${baseUrl}/scroller-pick.html`)).toBe("document");
        expect(await scrollerOf(`${baseUrl}/scroller-pick.html?m#mark`)).toBe("#side");
        client.close();
      } finally {
        handle.proc.kill();
        await handle.proc.exited;
        rmSync(dir, { recursive: true, force: true });
      }
    },
    30000,
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

// ui_shots only writes inside the working directory, so shot tests run from a
// scratch working directory and restore the real one afterwards.
async function inScratchCwd<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const prev = process.cwd();
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "jal-shots-test-")));
  process.chdir(dir);
  try {
    return await fn(dir);
  } finally {
    process.chdir(prev);
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("runShots", () => {
  test(
    "writes one JPEG per screen per width, capped by maxScreens, and clears stale shots of every width",
    async () => {
      await inScratchCwd(async (cwd) => {
        const outDir = path.join(cwd, "shots");
        mkdirSync(outDir);
        writeFileSync(path.join(outDir, "375-09.jpg"), "stale");
        writeFileSync(path.join(outDir, "640-01.jpg"), "stale, a width not requested this run");
        writeFileSync(path.join(outDir, "hero.jpg"), "not a shot, kept");
        const report = await runShots(`${baseUrl}/blank-band.html`, {
          widths: [375, 1280],
          outDir: "shots",
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
        const left = readdirSync(outDir);
        expect(left).not.toContain("375-09.jpg");
        expect(left).not.toContain("640-01.jpg");
        expect(left).toContain("hero.jpg");
      });
    },
    60000,
  );

  test("rejects an out_dir outside the working directory before touching disk or Chrome", async () => {
    await inScratchCwd(async (cwd) => {
      const outside = mkdtempSync(path.join(tmpdir(), "jal-shots-outside-"));
      try {
        writeFileSync(path.join(outside, "375-01.jpg"), "must survive");
        for (const bad of [outside, "../escape", path.join(cwd, "..", "x")]) {
          await expect(runShots(`${baseUrl}/good.html`, { outDir: bad, chromePath: "/no/such/chrome" })).rejects.toThrow(
            "out_dir must be a directory inside the working directory",
          );
        }
        expect(readdirSync(outside)).toContain("375-01.jpg");
        expect(existsSync(path.join(cwd, "..", "escape"))).toBe(false);
      } finally {
        rmSync(outside, { recursive: true, force: true });
      }
    });
  });

  test(
    "returns the screens already written as PARTIAL when the run times out",
    async () => {
      await inScratchCwd(async (cwd) => {
        const report = await runShots(`${baseUrl}/scroll-hang.html`, {
          widths: [1280],
          outDir: "shots",
          maxScreens: 3,
          webgl: false,
          loadWaitMs: 100,
          timeoutMs: 8000,
        });
        expect(report.status).toBe("PARTIAL");
        expect(report.reason).toContain("timed out");
        expect(report.files.length).toBe(1);
        expect(path.basename(report.files[0].path)).toBe("1280-01.jpg");
        expect(existsSync(report.files[0].path)).toBe(true);
        expect(report.out_dir).toBe(path.join(cwd, "shots"));
      });
    },
    30000,
  );
});

describe("input normalisation", () => {
  test("widths are rounded, clamped to 200..3840, deduplicated; non-numbers are an error", () => {
    expect(normalizeWidths([375.5, 100, 99999, "414", 376])).toEqual([376, 200, 3840, 414]);
    expect(normalizeWidths(undefined)).toBeUndefined();
    expect(normalizeWidths([])).toBeUndefined();
    expect(() => normalizeWidths(["abc"])).toThrow("invalid width");
    expect(() => normalizeWidths([375, NaN])).toThrow("invalid width");
    expect(() => normalizeWidths([Infinity])).toThrow("invalid width");
    expect(() => normalizeWidths("375")).toThrow("widths must be an array");
  });

  test("max_screens is finite and clamped to 1..40", () => {
    expect(normalizeMaxScreens(3.6)).toBe(4);
    expect(normalizeMaxScreens(0)).toBe(1);
    expect(normalizeMaxScreens(500)).toBe(40);
    expect(normalizeMaxScreens("7")).toBe(7);
    expect(normalizeMaxScreens(undefined)).toBeUndefined();
    expect(() => normalizeMaxScreens("abc")).toThrow("invalid max_screens");
    expect(() => normalizeMaxScreens(NaN)).toThrow("invalid max_screens");
  });

  test("resolveOutDir confines output to the working directory", () => {
    const cwd = path.join(realpathSync(tmpdir()), "jal-cwd");
    expect(resolveOutDir(undefined, cwd)).toBe(path.join(cwd, ".jal", "shots"));
    expect(resolveOutDir("out/a", cwd)).toBe(path.join(cwd, "out", "a"));
    expect(resolveOutDir(path.join(cwd, "abs"), cwd)).toBe(path.join(cwd, "abs"));
    expect(() => resolveOutDir("../x", cwd)).toThrow("out_dir must be");
    expect(() => resolveOutDir("/etc", cwd)).toThrow("out_dir must be");
    expect(() => resolveOutDir(".", cwd)).toThrow("out_dir must be");
  });

  test("resolveOutDir refuses a symlinked .jal/shots that points outside the working directory", () => {
    const root = realpathSync(mkdtempSync(path.join(tmpdir(), "jal-outdir-")));
    try {
      const cwd = path.join(root, "project");
      const outside = path.join(root, "outside");
      mkdirSync(path.join(cwd, ".jal"), { recursive: true });
      mkdirSync(outside, { recursive: true });
      symlinkSync(outside, path.join(cwd, ".jal", "shots"));
      expect(() => resolveOutDir(undefined, cwd)).toThrow("out_dir must be");
      expect(() => resolveOutDir(".jal/shots/nested", cwd)).toThrow("out_dir must be");
      // A link that stays inside the project resolves to its real target.
      mkdirSync(path.join(cwd, "real-shots"));
      symlinkSync(path.join(cwd, "real-shots"), path.join(cwd, "linked"));
      expect(resolveOutDir("linked", cwd)).toBe(path.join(cwd, "real-shots"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("timeouts and the CDP client", () => {
  test("withTimeout rejects at the deadline and aborts the run's signal", async () => {
    let seen: AbortSignal | undefined;
    const started = Date.now();
    await expect(
      withTimeout(50, async (signal) => {
        seen = signal;
        await new Promise((r) => setTimeout(r, 300));
        return "late";
      }),
    ).rejects.toThrow("timed out after 50ms");
    expect(Date.now() - started).toBeLessThan(250);
    expect(seen?.aborted).toBe(true);
  });

  test("CdpClient rejects every pending send when the socket closes, and sends after close fail fast", async () => {
    let serverSocket: any;
    const ws = Bun.serve({
      port: 0,
      fetch(req, srv) {
        if (srv.upgrade(req)) return;
        return new Response("no", { status: 400 });
      },
      websocket: {
        open(s) {
          serverSocket = s;
        },
        message() {
          // never answer
        },
      },
    });
    try {
      const client = await CdpClient.connect(`ws://127.0.0.1:${ws.port}/`);
      const a = client.send("Runtime.evaluate", { expression: "1" });
      const b = client.waitForEvent("Page.loadEventFired", 60000);
      await new Promise((r) => setTimeout(r, 50));
      expect(client.pendingCount).toBe(2);
      serverSocket.close();
      await expect(a).rejects.toThrow("devtools websocket");
      await expect(b).rejects.toThrow("devtools websocket");
      expect(client.pendingCount).toBe(0);
      await expect(client.send("Page.enable")).rejects.toThrow("devtools websocket");

      const client2 = await CdpClient.connect(`ws://127.0.0.1:${ws.port}/`);
      const c = client2.send("Page.enable");
      client2.close();
      await expect(c).rejects.toThrow("devtools client closed");
    } finally {
      ws.stop(true);
    }
  });
});

describe("shotUrl", () => {
  test("WebGL shots ask the scene module for the full tier", async () => {
    const { shotUrl } = await import("./audit");
    expect(shotUrl("http://localhost:4000/", true)).toBe("http://localhost:4000/?scene-tier=full");
    expect(shotUrl("http://localhost:4000/?a=1", true)).toBe("http://localhost:4000/?a=1&scene-tier=full");
    expect(shotUrl("http://localhost:4000/?scene-tier=static", true)).toBe("http://localhost:4000/?scene-tier=static");
    expect(shotUrl("http://localhost:4000/", false)).toBe("http://localhost:4000/");
  });
});
