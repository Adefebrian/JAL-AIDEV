// Zero-dependency Chrome DevTools Protocol UI audit driver.
// Bun built-ins only: Bun.spawn, native WebSocket, fetch, node:fs/os/path compat.
// No puppeteer, no playwright, no npm deps.
//
// 33 rules. 29 static rules run once per width on the loaded page, reduced-motion
// runs once at the widest width, and three come from a scroll walk through the
// page's real scroller (document or an app-shell inner scroller).
// Static: light-background (an explicit data-theme="dark" root is exempt),
// gradient-background, blurred-shadow, side-stripe, emoji-text, em-dash-text,
// purple-color, form-row-mismatch, form-control-min-height, card-row-mismatch,
// card-empty-band, horizontal-overflow, overlap, overflow-parent, clipped-text,
// icon-text-collision, form-width-cap, mobile-app-shell, eyebrow-label, and
// the ten tidiness rules:
//   spacing-scale       gap, padding, or margin on a layout container off the token scale
//   gap-consistency     siblings of one kind at uneven gaps along their axis
//   proximity           padded cards further apart than their own inner padding
//   radius-scale        a bordered or filled box rounded past a third of its height
//   section-rhythm      a top-level band off the page's one vertical rhythm
//   band-padding        a tone band whose content hugs an edge or sits off-centre
//   gap-seam            a strip of page ground under 24px beside a tone band
//   composition-repeat  adjacent same composition and variant, or one used over twice
//   display-measure     a headline over its line budget or too big for its measure
//   hero-card           the page heading boxed in a rounded bordered or tonal panel
// Walk:
//   stuck-reveal    content still invisible after it was scrolled into view
//   blank-viewport  a whole screen where under 10% of a 6x8 grid hits content
//                   (a sample in a small text cell or row counts as content)
//   dead-space      an empty region over 35% of the screen beside a column with content
// runShots (ui_shots) reuses the same walk to save one JPEG per screen.
// Pages render with software WebGL (SwiftShader) unless webgl: false.

import { existsSync, realpathSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export type Violation = { rule: string; width: number; selector: string; detail: string };
export type AuditReport = {
  status: "PASS" | "FAIL" | "SKIPPED";
  reason?: string;
  widths: number[];
  violations: Violation[];
  // Caveats: a scroll walk cut short by its time budget, a partial result, no WebGL.
  notes?: string[];
};

const DEFAULT_WIDTHS = [320, 375, 414, 768, 1280];
const DEFAULT_TIMEOUT_MS = 180000; // five widths; each walk gets a fair share of what is left (at most 45s)

const STANDARD_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export function resolveChromePath(explicit?: string): string | null {
  const configured = explicit ?? process.env.CHROME_PATH;
  if (configured) return configured;
  for (const candidate of STANDARD_CHROME_PATHS) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export class TimeoutError extends Error {}

// Runs `run` with an abort signal that fires when `ms` elapses. The returned
// promise rejects with TimeoutError at the deadline; the run itself is expected
// to stop at its next checkpoint (throwIfAborted) or when its CDP socket closes.
export function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(`audit timed out after ${ms}ms`));
    }, ms);
    run(controller.signal).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function readDevtoolsPort(stream: ReadableStream<Uint8Array>): Promise<number> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const match = buf.match(/ws:\/\/127\.0\.0\.1:(\d+)\/devtools\/browser\//);
      if (match) return parseInt(match[1], 10);
    }
  } finally {
    reader.releaseLock();
  }
  throw new Error("could not read chrome devtools port from stderr");
}

export type ChromeHandle = { proc: ReturnType<typeof Bun.spawn>; port: number };

export async function launchChrome(
  chromePath: string,
  userDataDir: string,
  opts: { webgl?: boolean } = {},
): Promise<ChromeHandle> {
  // webgl: software WebGL via SwiftShader for pages that need a GL context.
  const gpuArgs = opts.webgl ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] : ["--disable-gpu"];
  const proc = Bun.spawn({
    cmd: [
      chromePath,
      "--headless=new",
      ...gpuArgs,
      "--no-sandbox",
      "--hide-scrollbars",
      "--mute-audio",
      "--disable-extensions",
      `--user-data-dir=${userDataDir}`,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    stdout: "ignore",
    stderr: "pipe",
  });
  const port = await readDevtoolsPort(proc.stderr as ReadableStream<Uint8Array>);
  return { proc, port };
}

export async function createPageTarget(port: number): Promise<{ id: string; webSocketDebuggerUrl: string }> {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!res.ok) throw new Error(`failed to create page target: ${res.status}`);
  return (await res.json()) as { id: string; webSocketDebuggerUrl: string };
}

export async function closePageTarget(port: number, id: string): Promise<void> {
  try {
    await fetch(`http://127.0.0.1:${port}/json/close/${id}`, { signal: AbortSignal.timeout(2000) });
  } catch {
    // best effort
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("audit cancelled");
}

type PendingEntry = { resolve: (v: unknown) => void; reject: (e: unknown) => void };
type EventWaiter = { method: string; resolve: (v: unknown) => void; reject: (e: unknown) => void };

export class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, PendingEntry>();
  private eventWaiters: EventWaiter[] = [];
  private closedReason: string | null = null;

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.addEventListener("close", () => this.failAll("devtools websocket closed"));
    this.ws.addEventListener("error", () => this.failAll("devtools websocket error"));
    this.ws.addEventListener("message", (ev: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(typeof ev.data === "string" ? ev.data : String(ev.data));
      } catch {
        return;
      }
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const entry = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(msg.error.message ?? "CDP error"));
        else entry.resolve(msg.result);
        return;
      }
      if (msg.method) {
        const idx = this.eventWaiters.findIndex((w) => w.method === msg.method);
        if (idx !== -1) {
          const [waiter] = this.eventWaiters.splice(idx, 1);
          waiter.resolve(msg.params);
        }
      }
    });
  }

  static async connect(url: string): Promise<CdpClient> {
    const ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("error", () => reject(new Error("devtools websocket error")), { once: true });
    });
    return new CdpClient(ws);
  }

  // Reject every in-flight send and event wait, so nothing hangs once the
  // socket is gone (Chrome killed on timeout, crash, or close()).
  private failAll(reason: string): void {
    if (!this.closedReason) this.closedReason = reason;
    const err = new Error(this.closedReason);
    const pending = [...this.pending.values()];
    this.pending.clear();
    for (const p of pending) p.reject(err);
    const waiters = this.eventWaiters.splice(0);
    for (const w of waiters) w.reject(err);
  }

  get pendingCount(): number {
    return this.pending.size + this.eventWaiters.length;
  }

  send<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (this.closedReason) return Promise.reject(new Error(this.closedReason));
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  waitForEvent<T = any>(method: string, timeoutMs = 20000): Promise<T> {
    if (this.closedReason) return Promise.reject(new Error(this.closedReason));
    const p = new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.eventWaiters.findIndex((w) => w.resolve === wrapped);
        if (idx !== -1) this.eventWaiters.splice(idx, 1);
        reject(new Error(`timeout waiting for ${method}`));
      }, timeoutMs);
      const wrapped = (params: unknown) => {
        clearTimeout(timer);
        resolve(params as T);
      };
      const failed = (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      };
      this.eventWaiters.push({ method, resolve: wrapped, reject: failed });
    });
    // Callers create the wait before the action that triggers it; if that
    // action throws first, the wait must not surface as an unhandled rejection.
    p.catch(() => {});
    return p;
  }

  close(): void {
    this.failAll("devtools client closed");
    try {
      this.ws.close();
    } catch {
      // ignore
    }
  }
}

// Shared by the audit and walk scripts: a short, stable CSS path for an element.
const CSS_PATH_FN = `
  function cssPathRaw(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + el.id;
    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      if (node.id) { parts.unshift("#" + node.id); break; }
      var part = node.tagName.toLowerCase();
      if (node.classList && node.classList.length) {
        part += "." + node.classList[0];
      }
      var parent = node.parentElement;
      if (parent) {
        var siblings = Array.prototype.filter.call(parent.children, function (c) {
          return c.tagName === node.tagName;
        });
        if (siblings.length > 1) {
          part += ":nth-of-type(" + (siblings.indexOf(node) + 1) + ")";
        }
      }
      parts.unshift(part);
      node = parent;
      depth++;
    }
    return parts.join(" > ");
  }
`;

// Injected into the page via Runtime.evaluate. Plain ES5-ish JS, no backticks,
// no external references: it must stand alone inside the browser context.
const AUDIT_SCRIPT = `
(function () {
  var violations = [];
  var pathEls = {};

  // Visual-law rules that do not apply inside a noyzzi-derived section
  // (data-jal-exempt="noyzzi", Brian's ruling). Mechanical rules (control
  // height, overflow, clipped text, emoji, em-dash, form cap, app-shell,
  // reduced motion) still apply there.
  var NOYZZI_EXEMPT = {
    "light-background": 1, "gradient-background": 1, "blurred-shadow": 1, "side-stripe": 1,
    "purple-color": 1, "eyebrow-label": 1, "overlap": 1, "overflow-parent": 1,
    "card-row-mismatch": 1, "card-empty-band": 1, "spacing-scale": 1, "gap-consistency": 1,
    "band-padding": 1, "display-measure": 1, "hero-card": 1, "gap-seam": 1, "proximity": 1, "radius-scale": 1
  };
  function isExempt(el) {
    return !!(el && el.closest && el.closest("[data-jal-exempt~=noyzzi]"));
  }

  function pushV(rule, selector, detail) {
    if (NOYZZI_EXEMPT[rule] && isExempt(pathEls[selector])) return;
    violations.push({ rule: rule, selector: selector, detail: detail });
  }

  function cssPath(el) {
    var p = cssPathRaw(el);
    if (p) pathEls[p] = el;
    return p;
  }

  ${CSS_PATH_FN}

  function isOverlayExcluded(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var role = node.getAttribute ? node.getAttribute("role") : null;
      if (role === "dialog" || role === "alertdialog" || role === "menu" || role === "listbox" || role === "tooltip") return true;
      if (node.hasAttribute && (node.hasAttribute("popover") || node.hasAttribute("data-overlay"))) return true;
      // A decorative backdrop layer (a fixed or absolute full-bleed canvas
      // behind content) is not a sibling in the reading flow: it must be
      // aria-hidden and pointer-events: none to count as one.
      if (node.getAttribute && node.getAttribute("aria-hidden") === "true") {
        var ncs = getComputedStyle(node);
        if (ncs.pointerEvents === "none" && (ncs.position === "fixed" || ncs.position === "absolute")) return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function isVisible(el) {
    if (!(el instanceof Element)) return false;
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function parseColor(str) {
    if (!str) return null;
    var m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var parts = m[1].split(",").map(function (s) { return parseFloat(s.trim()); });
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function relLuminance(c) {
    function f(v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }

  function splitShadows(str) {
    var result = [];
    var depth = 0, current = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  }

  // light-background. Dark is lawful only as an explicit dark theme:
  // data-theme="dark" on html, body, main, or the page root (.kit-page or
  // the [data-direction] element holding main, e.g. D13 precision_dark).
  // prefers-color-scheme alone never exempts a page.
  (function checkBackground() {
    var body = document.body;
    var main = document.querySelector("main") || document.querySelector("[role=main]") || body;
    var roots = [document.documentElement, body, main];
    var pageRoot = main.closest(".kit-page, [data-direction]") || document.querySelector(".kit-page");
    if (pageRoot) roots.push(pageRoot);
    for (var i = 0; i < roots.length; i++) {
      if (roots[i] && roots[i].getAttribute && roots[i].getAttribute("data-theme") === "dark") return;
    }
    var targets = [{ el: body, label: "body" }];
    if (main !== body) targets.push({ el: main, label: "main" });
    targets.forEach(function (target) {
      var cs = getComputedStyle(target.el);
      var c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.05) {
        var lum = relLuminance(c);
        if (lum < 0.85) {
          pushV("light-background", cssPath(target.el), target.label + " backgroundColor=" + cs.backgroundColor + " luminance=" + lum.toFixed(3));
        }
      }
    });
  })();

  // gradient-background
  Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
    if (!isVisible(el)) return;
    var cs = getComputedStyle(el);
    var bi = cs.backgroundImage || "";
    if (/(linear|radial|conic)-gradient\\(/.test(bi)) {
      pushV("gradient-background", cssPath(el), "backgroundImage=" + bi);
    }
  });

  // blurred-shadow + side-stripe (inset shadow stripes)
  Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
    if (!isVisible(el)) return;
    var cs = getComputedStyle(el);
    var bs = cs.boxShadow;
    if (!bs || bs === "none") return;
    var shadows = splitShadows(bs);
    shadows.forEach(function (entry) {
      var isInset = /inset/.test(entry);
      var lengths = entry.match(/-?\\d+(\\.\\d+)?px/g) || [];
      var nums = lengths.map(function (s) { return parseFloat(s); });
      var hoff = nums.length > 0 ? nums[0] : 0;
      var blur = nums.length > 2 ? Math.abs(nums[2]) : 0;
      if (blur > 0) {
        pushV("blurred-shadow", cssPath(el), "boxShadow entry='" + entry + "' blur=" + blur + "px");
      }
      if (isInset && blur === 0 && Math.abs(hoff) > 0) {
        pushV("side-stripe", cssPath(el), "inset boxShadow stripe entry='" + entry + "' hOffset=" + hoff + "px");
      }
    });
  });

  // side-stripe (borders)
  Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
    if (!isVisible(el)) return;
    var cs = getComputedStyle(el);
    var lw = parseFloat(cs.borderLeftWidth) || 0;
    var rw = parseFloat(cs.borderRightWidth) || 0;
    var tc = cs.borderTopColor, bc = cs.borderBottomColor;
    var lc = cs.borderLeftColor, rc = cs.borderRightColor;
    if (lw > 1 || rw > 1) {
      pushV("side-stripe", cssPath(el), "border width left=" + lw + "px right=" + rw + "px");
      return;
    }
    if (lw > 0 && lc !== tc && lc !== bc) {
      pushV("side-stripe", cssPath(el), "border color left=" + lc + " differs top=" + tc + " bottom=" + bc);
      return;
    }
    if (rw > 0 && rc !== tc && rc !== bc) {
      pushV("side-stripe", cssPath(el), "border color right=" + rc + " differs top=" + tc + " bottom=" + bc);
    }
  });

  // emoji-text + em-dash-text
  (function checkText() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var emojiRe = /\\p{Extended_Pictographic}/u;
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue;
      if (!text || !text.trim()) continue;
      var parent = node.parentElement;
      if (!parent || !isVisible(parent)) continue;
      if (emojiRe.test(text)) {
        pushV("emoji-text", cssPath(parent), "text contains emoji: '" + text.trim().slice(0, 40) + "'");
      }
      if (text.indexOf("\\u2014") !== -1) {
        pushV("em-dash-text", cssPath(parent), "text contains em dash: '" + text.trim().slice(0, 40) + "'");
      }
    }
  })();

  // purple-color
  Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
    if (!isVisible(el)) return;
    var cs = getComputedStyle(el);
    ["color", "backgroundColor", "borderTopColor", "borderLeftColor", "borderRightColor", "borderBottomColor"].forEach(function (prop) {
      var c = parseColor(cs[prop]);
      if (!c || c.a < 0.3) return;
      var hsl = rgbToHsl(c);
      if (hsl.s > 0.2 && hsl.h >= 250 && hsl.h <= 320) {
        pushV("purple-color", cssPath(el), prop + "=" + cs[prop] + " hue=" + hsl.h.toFixed(1) + " sat=" + hsl.s.toFixed(2));
      }
    });
  });

  // form rows: min height + row alignment
  (function checkFormRows() {
    function isControl(el) {
      if (!el) return false;
      var tag = el.tagName;
      if (tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA" && tag !== "BUTTON") return false;
      if (tag === "INPUT" && el.type === "hidden") return false;
      return isVisible(el);
    }
    Array.prototype.forEach.call(document.querySelectorAll("input, select, textarea, button"), function (el) {
      if (!isControl(el)) return;
      var rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.height < 44) {
        pushV("form-control-min-height", cssPath(el), "height=" + rect.height.toFixed(1) + "px");
      }
    });
    var seen = {};
    Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
      var cs = getComputedStyle(el);
      var isRowDisplay = cs.display === "flex" || cs.display === "inline-flex" || cs.display === "grid" || cs.display === "inline-grid";
      if (!isRowDisplay) return;
      var controls = [];
      Array.prototype.forEach.call(el.children, function (child) {
        if (isControl(child)) {
          controls.push(child);
        } else {
          var nested = child.querySelectorAll("input, select, textarea, button");
          if (nested.length === 1 && isControl(nested[0])) controls.push(nested[0]);
        }
      });
      if (controls.length < 2) return;
      var key = cssPath(el);
      if (seen[key]) return;
      seen[key] = true;
      // A row is a set of controls that sit side by side. A flex column, a
      // one-column grid, or a stacked mobile form has no row, so only
      // controls whose boxes share a band of the vertical axis are compared.
      var rects = controls.map(function (c) { return c.getBoundingClientRect(); });
      var rows = [];
      rects.forEach(function (r) {
        var row = rows.find(function (g) {
          var o = Math.min(g.bottom, r.bottom) - Math.max(g.top, r.top);
          return o > 0.5 * Math.min(g.bottom - g.top, r.height);
        });
        if (row) { row.rects.push(r); row.top = Math.min(row.top, r.top); row.bottom = Math.max(row.bottom, r.bottom); }
        else rows.push({ top: r.top, bottom: r.bottom, rects: [r] });
      });
      rows.forEach(function (row) {
        if (row.rects.length < 2) return;
        var heights = row.rects.map(function (r) { return r.height; });
        var tops = row.rects.map(function (r) { return r.top; });
        var maxH = Math.max.apply(null, heights), minH = Math.min.apply(null, heights);
        var maxT = Math.max.apply(null, tops), minT = Math.min.apply(null, tops);
        if (maxH - minH > 0.5 || maxT - minT > 0.5) {
          pushV("form-row-mismatch", key, "heights=[" + heights.map(function (h) { return h.toFixed(1); }).join(",") + "] tops=[" + tops.map(function (t) { return t.toFixed(1); }).join(",") + "]");
        }
      });
    });
  })();

  // cards: row height + empty band
  // Cards are grouped into visual rows by top-edge proximity (<=2px) before
  // comparing heights or empty-band, because a wrapping/stacking grid (e.g.
  // a single-column layout at narrow widths) puts each card in its own row,
  // where differing heights are legitimate. Only cards that actually share a
  // visual row are compared against each other.
  (function checkCards() {
    function isCardLike(el) {
      var cs = getComputedStyle(el);
      var hasBorder = (parseFloat(cs.borderTopWidth) || 0) > 0 || (parseFloat(cs.borderLeftWidth) || 0) > 0;
      var hasShadow = cs.boxShadow && cs.boxShadow !== "none";
      var bg = parseColor(cs.backgroundColor);
      var hasBg = bg && bg.a > 0.05;
      var hasPadding = (parseFloat(cs.paddingTop) || 0) > 0;
      return (hasBorder || hasShadow || hasBg) && hasPadding;
    }
    function groupIntoVisualRows(cards) {
      var rows = [];
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var rect = card.getBoundingClientRect();
        var placed = false;
        for (var j = 0; j < rows.length; j++) {
          if (Math.abs(rows[j].top - rect.top) <= 2) {
            rows[j].items.push({ el: card, rect: rect });
            placed = true;
            break;
          }
        }
        if (!placed) rows.push({ top: rect.top, items: [{ el: card, rect: rect }] });
      }
      return rows;
    }
    var seen = {};
    Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
      var cs = getComputedStyle(el);
      var isRowDisplay = cs.display === "flex" || cs.display === "grid" || cs.display === "inline-flex" || cs.display === "inline-grid";
      if (!isRowDisplay) return;
      var cards = Array.prototype.filter.call(el.children, function (child) {
        return isVisible(child) && isCardLike(child);
      });
      if (cards.length < 2) return;
      var key = cssPath(el);
      if (seen[key]) return;
      seen[key] = true;
      var visualRows = groupIntoVisualRows(cards);
      visualRows.forEach(function (row) {
        if (row.items.length < 2) return;
        var heights = row.items.map(function (item) { return item.rect.height; });
        var maxH = Math.max.apply(null, heights), minH = Math.min.apply(null, heights);
        if (maxH - minH > 1) {
          pushV("card-row-mismatch", key, "heights=[" + heights.map(function (h) { return h.toFixed(1); }).join(",") + "]");
        }
      });
      visualRows.forEach(function (row) {
        // Measure each card's empty band against its own rendered box, which
        // is scoped to this visual row (a card alone in its row is measured
        // against itself; a card stretched by its row siblings already has
        // that stretched height reflected in its own rect). This never pulls
        // in height from a card in a different visual row.
        row.items.forEach(function (item) {
          var card = item.el;
          var cardRect = item.rect;
          var cardCs = getComputedStyle(card);
          var padBottom = parseFloat(cardCs.paddingBottom) || 0;
          var contentBottom = cardRect.top;
          Array.prototype.forEach.call(card.querySelectorAll("*"), function (desc) {
            if (!isVisible(desc)) return;
            var r = desc.getBoundingClientRect();
            if (r.bottom > contentBottom) contentBottom = r.bottom;
          });
          var gap = (cardRect.bottom - padBottom) - contentBottom;
          if (gap > 40) {
            pushV("card-empty-band", cssPath(card), "emptyBand=" + gap.toFixed(1) + "px cardHeight=" + cardRect.height.toFixed(1) + "px");
          }
        });
      });
    });
  })();

  // horizontal-overflow
  // Use visualViewport width, not window.innerWidth: under mobile emulation
  // Chrome auto-zooms the layout viewport out to fit overly wide content,
  // which makes window.innerWidth track scrollWidth instead of the
  // requested device width. visualViewport.width stays pinned to the
  // requested viewport regardless of that auto-zoom quirk.
  (function checkOverflow() {
    var sw = document.documentElement.scrollWidth;
    var vv = window.visualViewport;
    var iw = vv ? vv.width : window.innerWidth;
    if (sw > iw + 1) {
      pushV("horizontal-overflow", "html", "scrollWidth=" + sw + " innerWidth=" + iw);
    }
  })();

  // overlap: sibling elements whose border boxes intersect
  (function checkOverlap() {
    Array.prototype.forEach.call(document.querySelectorAll("*"), function (parent) {
      if (isOverlayExcluded(parent)) return;
      var kids = Array.prototype.filter.call(parent.children, function (c) {
        return isVisible(c) && !isOverlayExcluded(c);
      });
      if (kids.length < 2) return;
      // A bar pinned to the top or bottom edge of the viewport (the app-shell
      // header or bottom tab bar in document-scroll mode) sits over the
      // scrolling content by design; the shell reserves its height. Only a
      // real edge bar qualifies: a short strip glued to the top edge, or one
      // glued to the bottom edge within the bottom quarter. A sticky element
      // must also be pinned at 0px on that edge, so a tall sticky stage in
      // the content flow that merely reaches past the fold is not exempt.
      var pinnedBar = function (el) {
        var cs = getComputedStyle(el);
        var p = cs.position;
        if (p !== "fixed" && p !== "sticky") return false;
        var r = el.getBoundingClientRect();
        var vh = window.innerHeight;
        var topBar = r.top <= 1 && r.height <= 0.25 * vh;
        var bottomBar = Math.abs(r.bottom - vh) <= 1 && r.top >= 0.75 * vh;
        if (p === "sticky") {
          topBar = topBar && cs.top === "0px";
          bottomBar = bottomBar && cs.bottom === "0px";
        }
        return topBar || bottomBar;
      };
      for (var i = 0; i < kids.length; i++) {
        for (var j = i + 1; j < kids.length; j++) {
          if (pinnedBar(kids[i]) || pinnedBar(kids[j])) continue;
          var a = kids[i].getBoundingClientRect();
          var b = kids[j].getBoundingClientRect();
          var overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          var overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (overlapX > 0.5 && overlapY > 0.5) {
            pushV("overlap", cssPath(parent), cssPath(kids[i]) + " overlaps " + cssPath(kids[j]) + " by " + overlapX.toFixed(1) + "x" + overlapY.toFixed(1) + "px");
          }
        }
      }
    });
  })();

  // overflow-parent: a child whose border box extends past its parent's content box
  (function checkOverflowParent() {
    Array.prototype.forEach.call(document.querySelectorAll("*"), function (parent) {
      if (isOverlayExcluded(parent)) return;
      var pcs = getComputedStyle(parent);
      var prect = parent.getBoundingClientRect();
      var blw = parseFloat(pcs.borderLeftWidth) || 0;
      var brw = parseFloat(pcs.borderRightWidth) || 0;
      var btw = parseFloat(pcs.borderTopWidth) || 0;
      var bbw = parseFloat(pcs.borderBottomWidth) || 0;
      var plp = parseFloat(pcs.paddingLeft) || 0;
      var prp = parseFloat(pcs.paddingRight) || 0;
      var ptp = parseFloat(pcs.paddingTop) || 0;
      var pbp = parseFloat(pcs.paddingBottom) || 0;
      var contentLeft = prect.left + blw + plp;
      var contentRight = prect.right - brw - prp;
      var contentTop = prect.top + btw + ptp;
      var contentBottom = prect.bottom - bbw - pbp;
      var skipX = pcs.overflowX === "auto" || pcs.overflowX === "scroll";
      var skipY = pcs.overflowY === "auto" || pcs.overflowY === "scroll";
      if (skipX && skipY) return;
      Array.prototype.forEach.call(parent.children, function (child) {
        if (!isVisible(child)) return;
        if (isOverlayExcluded(child)) return;
        var ccs = getComputedStyle(child);
        if (ccs.position === "fixed") return;
        // An element mid-entrance (a running animation or transition) is not
        // at its resting box yet; measure it once it settles.
        if (child.getAnimations && child.getAnimations().some(function (an) { return an.playState === "running"; })) return;
        var crect = child.getBoundingClientRect();
        if (!skipX && (crect.left < contentLeft - 0.5 || crect.right > contentRight + 0.5)) {
          pushV("overflow-parent", cssPath(child), "child x[" + crect.left.toFixed(1) + "," + crect.right.toFixed(1) + "] exceeds parent content x[" + contentLeft.toFixed(1) + "," + contentRight.toFixed(1) + "]");
          return;
        }
        if (!skipY && (crect.top < contentTop - 0.5 || crect.bottom > contentBottom + 0.5)) {
          pushV("overflow-parent", cssPath(child), "child y[" + crect.top.toFixed(1) + "," + crect.bottom.toFixed(1) + "] exceeds parent content y[" + contentTop.toFixed(1) + "," + contentBottom.toFixed(1) + "]");
        }
      });
    });
  })();

  // clipped-text: hidden overflow cutting off text with no ellipsis
  (function checkClippedText() {
    Array.prototype.forEach.call(document.querySelectorAll("*"), function (el) {
      if (!isVisible(el)) return;
      if (isOverlayExcluded(el)) return;
      var text = el.textContent ? el.textContent.trim() : "";
      if (!text) return;
      var cs = getComputedStyle(el);
      if (cs.textOverflow === "ellipsis") return;
      var hiddenX = cs.overflowX === "hidden" || cs.overflowX === "clip";
      var hiddenY = cs.overflowY === "hidden" || cs.overflowY === "clip";
      if (hiddenX && el.scrollWidth > el.clientWidth + 1) {
        pushV("clipped-text", cssPath(el), "scrollWidth=" + el.scrollWidth + " clientWidth=" + el.clientWidth);
        return;
      }
      if (hiddenY && el.scrollHeight > el.clientHeight + 1) {
        pushV("clipped-text", cssPath(el), "scrollHeight=" + el.scrollHeight + " clientHeight=" + el.clientHeight);
      }
    });
  })();

  // icon-text-collision: measurable icon overlapping adjacent text, or a
  // select/input whose padding leaves no room for its chevron/icon
  (function checkIconTextCollision() {
    function isIconEl(el) {
      var tag = el.tagName;
      return tag === "svg" || tag === "SVG" || tag === "IMG" || (el.hasAttribute && el.hasAttribute("data-icon"));
    }
    Array.prototype.forEach.call(document.querySelectorAll("svg, img, [data-icon]"), function (icon) {
      if (!isVisible(icon)) return;
      if (isOverlayExcluded(icon)) return;
      var parent = icon.parentElement;
      if (!parent) return;
      var iconRect = icon.getBoundingClientRect();
      Array.prototype.forEach.call(parent.children, function (sib) {
        if (sib === icon || !isVisible(sib) || isIconEl(sib)) return;
        var text = sib.textContent ? sib.textContent.trim() : "";
        if (!text) return;
        var sibRect = sib.getBoundingClientRect();
        var overlapX = Math.min(iconRect.right, sibRect.right) - Math.max(iconRect.left, sibRect.left);
        var overlapY = Math.min(iconRect.bottom, sibRect.bottom) - Math.max(iconRect.top, sibRect.top);
        if (overlapX > 0.5 && overlapY > 0.5) {
          pushV("icon-text-collision", cssPath(icon), "icon overlaps text of " + cssPath(sib) + " by " + overlapX.toFixed(1) + "x" + overlapY.toFixed(1) + "px");
        }
      });
      Array.prototype.forEach.call(parent.childNodes, function (node) {
        if (node.nodeType !== 3) return;
        var t = node.nodeValue ? node.nodeValue.trim() : "";
        if (!t) return;
        var range = document.createRange();
        range.selectNodeContents(node);
        var textRect = range.getBoundingClientRect();
        var overlapX = Math.min(iconRect.right, textRect.right) - Math.max(iconRect.left, textRect.left);
        var overlapY = Math.min(iconRect.bottom, textRect.bottom) - Math.max(iconRect.top, textRect.top);
        if (overlapX > 0.5 && overlapY > 0.5) {
          pushV("icon-text-collision", cssPath(icon), "icon overlaps adjacent text by " + overlapX.toFixed(1) + "x" + overlapY.toFixed(1) + "px");
        }
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll("select"), function (sel) {
      if (!isVisible(sel)) return;
      var cs = getComputedStyle(sel);
      var padRight = parseFloat(cs.paddingRight) || 0;
      if (padRight < 24) {
        pushV("icon-text-collision", cssPath(sel), "select paddingRight=" + padRight + "px leaves insufficient room for native chevron (need >=24px)");
      }
    });
  })();

  // form-width-cap: from 1024px a text-entry control never runs wider than
  // the JAL form cap (640px). A wider field means the frame skipped region
  // width budgets and stretched a form across the page. Controls inside a
  // table, grid, or toolbar are exempt (they live in a fill region).
  (function checkFormWidthCap() {
    var vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    if (vw < 1024) return;
    var skipTypes = ["checkbox", "radio", "hidden", "range", "color", "submit", "button", "reset", "image", "file"];
    Array.prototype.forEach.call(document.querySelectorAll("input, select, textarea"), function (el) {
      if (!isVisible(el)) return;
      var type = (el.getAttribute("type") || "").toLowerCase();
      if (skipTypes.indexOf(type) >= 0) return;
      if (el.closest("table, [role=grid], [role=toolbar]")) return;
      var w = el.getBoundingClientRect().width;
      if (w > 640.5) {
        pushV("form-width-cap", cssPath(el), "width=" + w.toFixed(1) + "px exceeds the 640px form cap at viewport " + vw + "px");
      }
    });
  })();

  // mobile-app-shell: below 640px every screen is an app-shell, a pinned
  // top header plus a bottom tab bar of 3 to 5 destinations, each at least
  // 44x44. "Pinned" means position fixed or sticky, or the document itself
  // does not scroll (a grid shell whose content region scrolls on its own).
  (function checkAppShell() {
    var vv = window.visualViewport;
    var vw = vv ? vv.width : window.innerWidth;
    if (vw >= 640) return;
    // Screens with nothing to navigate to yet (sign in, sign up, a fatal error
    // page) opt out with data-jal-shell="none" on the body or main element.
    if (document.querySelector("body[data-jal-shell=none], main[data-jal-shell=none]")) return;
    var vh = vv ? vv.height : window.innerHeight;
    var docScrolls = document.documentElement.scrollHeight > vh + 1;
    function pinned(el) {
      var p = getComputedStyle(el).position;
      return p === "fixed" || p === "sticky" || !docScrolls;
    }
    var header = Array.prototype.filter.call(document.querySelectorAll("header, [role=banner]"), function (el) {
      if (!isVisible(el)) return false;
      return el.getBoundingClientRect().top <= 1 && pinned(el);
    })[0];
    if (!header) {
      pushV("mobile-app-shell", "body", "no pinned top header (header or [role=banner] at top 0, sticky, fixed, or inside a non-scrolling shell)");
    }
    var nav = Array.prototype.filter.call(document.querySelectorAll("nav, [role=navigation]"), function (el) {
      if (!isVisible(el)) return false;
      var r = el.getBoundingClientRect();
      return r.bottom >= vh - 1 && r.top >= vh * 0.75 && pinned(el);
    })[0];
    if (!nav) {
      pushV("mobile-app-shell", "body", "no bottom tab bar (nav pinned to the bottom edge of the viewport)");
      return;
    }
    var items = Array.prototype.filter.call(nav.querySelectorAll("a[href], button"), isVisible);
    if (items.length < 3 || items.length > 5) {
      pushV("mobile-app-shell", cssPath(nav), "bottom tab bar has " + items.length + " destinations, needs 3 to 5");
    }
    items.forEach(function (item) {
      var r = item.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) {
        pushV("mobile-app-shell", cssPath(item), "tab bar target " + r.width.toFixed(1) + "x" + r.height.toFixed(1) + "px is under 44x44");
      }
    });
  })();

  // eyebrow-label
  (function checkEyebrows() {
    Array.prototype.forEach.call(document.querySelectorAll("h1, h2, h3"), function (h) {
      var prev = h.previousElementSibling;
      while (prev && prev.textContent.trim() === "") prev = prev.previousElementSibling;
      if (!prev) return;
      var cs = getComputedStyle(prev);
      var fontSize = parseFloat(cs.fontSize) || 0;
      var letterSpacing = cs.letterSpacing === "normal" ? 0 : (parseFloat(cs.letterSpacing) || 0);
      var text = prev.textContent.trim();
      var isUpper = text.length > 0 && text === text.toUpperCase() && /[A-Z]/.test(text);
      if (isUpper && fontSize > 0 && fontSize <= 13 && letterSpacing > 0.3) {
        pushV("eyebrow-label", cssPath(prev), "text='" + text + "' fontSize=" + fontSize + "px letterSpacing=" + letterSpacing + "px");
      }
    });
  })();

  // ---- Tidiness: spacing-scale, gap-consistency, section-rhythm, composition-repeat.

  // The JAL spacing scale (tokens.css --space-*), plus the 1px hairline.
  var SPACE_SCALE = [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];
  // Kit and shell tokens built from that scale (a rhythm knob plus 32, the
  // shell's reserve for its pinned bars). Resolved per scope at this width.
  var SPACE_TOKENS = ["--kit-space", "--kit-space-tight", "--kit-space-loose", "--kit-space-lg", "--kit-gap-section", "--kit-gap-group",
    "--kit-gap-related", "--kit-gap-inside", "--kit-inset", "--kit-rise", "--kit-margin", "--kit-margin-lg", "--kit-gutter", "--kit-gutter-lg",
    "--kit-stack", "--shell-nav-h", "--shell-header-h"];
  var TIDY_SKIP = "canvas, svg, iframe, video, [aria-hidden=true], [data-jal-canvas], [data-jal-exempt~=noyzzi]";
  var TEXT_TAGS = { P: 1, SPAN: 1, A: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, LABEL: 1, STRONG: 1, EM: 1, B: 1, I: 1, U: 1, S: 1,
    SMALL: 1, CODE: 1, KBD: 1, SAMP: 1, SUP: 1, SUB: 1, MARK: 1, ABBR: 1, TIME: 1, CITE: 1, Q: 1, DFN: 1, VAR: 1, BR: 1, WBR: 1,
    FIGCAPTION: 1, LEGEND: 1, SUMMARY: 1, DT: 1, DD: 1, PRE: 1, BLOCKQUOTE: 1 };
  var NON_LAYOUT_TAGS = { INPUT: 1, SELECT: 1, TEXTAREA: 1, BUTTON: 1, OPTION: 1, OPTGROUP: 1, IMG: 1, PICTURE: 1, SOURCE: 1,
    TD: 1, TH: 1, TR: 1, THEAD: 1, TBODY: 1, TFOOT: 1, CAPTION: 1, COL: 1, COLGROUP: 1, SCRIPT: 1, STYLE: 1, TEMPLATE: 1,
    NOSCRIPT: 1, HTML: 1, BODY: 1, HEAD: 1, META: 1, LINK: 1, HR: 1 };

  var tokenCache = new Map();
  function spaceTokens(el) {
    var scope = el.closest("[data-direction], .kit-page") || document.body;
    if (tokenCache.has(scope)) return tokenCache.get(scope);
    var out = {};
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;border:0;margin:0";
    scope.appendChild(probe);
    try {
      SPACE_TOKENS.forEach(function (name) {
        probe.style.paddingTop = "var(" + name + ", 0px)";
        var v = parseFloat(getComputedStyle(probe).paddingTop) || 0;
        if (v > 0) out[name] = v;
      });
    } finally {
      probe.remove();
    }
    tokenCache.set(scope, out);
    return out;
  }

  // Heights of pinned bars: padding that reserves room for a fixed or sticky
  // header or tab bar equals that bar's height.
  var pinnedHeights = [];
  Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
    var p = getComputedStyle(el).position;
    if (p !== "fixed" && p !== "sticky") return;
    var h = el.getBoundingClientRect().height;
    if (h > 0) pinnedHeights.push(h);
  });

  function onScale(v, el) {
    var a = Math.abs(v);
    for (var i = 0; i < SPACE_SCALE.length; i++) if (Math.abs(a - SPACE_SCALE[i]) <= 0.5) return true;
    var toks = spaceTokens(el);
    for (var k in toks) if (Math.abs(a - toks[k]) <= 0.5) return true;
    for (var j = 0; j < pinnedHeights.length; j++) if (Math.abs(a - pinnedHeights[j]) <= 0.5) return true;
    return false;
  }

  // Typed OM: an auto margin (centering, push-right) or a percentage
  // padding (aspect-ratio box) is not a spacing token decision.
  function typedSkip(el, prop) {
    try {
      var v = el.computedStyleMap().get(prop);
      if (!v) return false;
      var s = String(v);
      return s === "auto" || s.indexOf("%") !== -1;
    } catch (e) {
      return false;
    }
  }

  function isFlexOrGrid(d) {
    return d === "flex" || d === "inline-flex" || d === "grid" || d === "inline-grid";
  }

  // spacing-scale: flex and grid gaps, and padding and margin on layout
  // containers (sections, compositions, cards, lists, wrappers), sit on the
  // spacing scale. Text elements, controls, tables, canvas and decorative
  // aria-hidden layers are skipped.
  (function checkSpacingScale() {
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
      if (el.namespaceURI !== "http://www.w3.org/1999/xhtml") return;
      if (TEXT_TAGS[el.tagName] || NON_LAYOUT_TAGS[el.tagName]) return;
      if (el.closest(TIDY_SKIP) || isOverlayExcluded(el)) return;
      if (!isVisible(el)) return;
      var cs = getComputedStyle(el);
      if (cs.display === "inline" || cs.display === "contents") return;
      var flexGrid = isFlexOrGrid(cs.display);
      var bad = [];
      if (flexGrid) {
        [["rowGap", "row-gap"], ["columnGap", "column-gap"]].forEach(function (p) {
          if (cs[p[0]] === "normal") return;
          var v = parseFloat(cs[p[0]]);
          if (!isNaN(v) && !onScale(v, el)) bad.push(p[1] + " " + +v.toFixed(2) + "px");
        });
      }
      var container = flexGrid || el.firstElementChild || /^(SECTION|ARTICLE|ASIDE|HEADER|FOOTER|MAIN|NAV|UL|OL|DL|LI|FORM|FIELDSET|FIGURE)$/.test(el.tagName) || el.hasAttribute("data-kit-composition");
      if (container) {
        // A control row centres its control from the 44px control height.
        var controlRow = Array.prototype.some.call(el.children, function (c) { return c.tagName === "INPUT" || c.tagName === "SELECT" || c.tagName === "TEXTAREA"; });
        var props = controlRow ? [] : [["paddingTop", "padding-top"], ["paddingRight", "padding-right"], ["paddingBottom", "padding-bottom"], ["paddingLeft", "padding-left"]];
        props = props.concat([["marginTop", "margin-top"], ["marginRight", "margin-right"], ["marginBottom", "margin-bottom"], ["marginLeft", "margin-left"]]);
        props.forEach(function (p) {
          var v = parseFloat(cs[p[0]]);
          if (isNaN(v) || onScale(v, el)) return;
          if (typedSkip(el, p[1])) return;
          bad.push(p[1] + " " + +v.toFixed(2) + "px");
        });
      }
      if (bad.length) {
        pushV("spacing-scale", cssPath(el), "off the spacing scale (0, 1px hairline, 2 to 96px tokens, kit rhythm): " + bad.join(", "));
      }
    });
  })();

  // gap-consistency: consecutive siblings of one kind (tag plus classes)
  // sit at one gap along their axis, within 1px. Wrapped rows are compared
  // row to row; a mid-reveal (transformed) or out-of-flow item is skipped.
  // A card or panel: a border (all four sides when boxed), or a background
  // of its own.
  function panelish(el, boxed) {
    var cs = getComputedStyle(el);
    var drawn = ["Top", "Right", "Bottom", "Left"].map(function (side) {
      return (parseFloat(cs["border" + side + "Width"]) || 0) > 0 && cs["border" + side + "Style"] !== "none";
    });
    var border = boxed ? drawn.every(Boolean) : drawn.some(Boolean);
    if (border) return true;
    var c = parseColor(cs.backgroundColor);
    if (!c || c.a <= 0.05) return false;
    var g = el.parentElement;
    for (; g; g = g.parentElement) {
      var gc = parseColor(getComputedStyle(g).backgroundColor);
      if (gc && gc.a > 0.05) return gc.r !== c.r || gc.g !== c.g || gc.b !== c.b;
    }
    return !(c.r === 255 && c.g === 255 && c.b === 255);
  }
  function blockPad(el) {
    var cs = getComputedStyle(el);
    return Math.min(parseFloat(cs.paddingTop) || 0, parseFloat(cs.paddingBottom) || 0);
  }
  var GENERIC_TAGS = { DIV: 1, SPAN: 1, SECTION: 1, MAIN: 1, HEADER: 1, FOOTER: 1, ASIDE: 1, NAV: 1, FORM: 1 };
  (function checkGapConsistency() {
    function sig(el) {
      return el.tagName.toLowerCase() + Array.prototype.slice.call(el.classList).sort().map(function (c) { return "." + c; }).join("");
    }
    function measurable(el) {
      if (!isVisible(el) || isOverlayExcluded(el)) return false;
      var cs = getComputedStyle(el);
      if (cs.position === "absolute" || cs.position === "fixed" || cs.position === "sticky") return false;
      if (cs.display === "inline" || cs.display === "contents" || cs.cssFloat !== "none") return false;
      if (cs.transform && cs.transform !== "none" && cs.transform !== "matrix(1, 0, 0, 1, 0, 0)") return false;
      return true;
    }
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (parent) {
      if (parent.namespaceURI !== "http://www.w3.org/1999/xhtml") return;
      if (TEXT_TAGS[parent.tagName] || NON_LAYOUT_TAGS[parent.tagName]) return;
      if (parent.children.length < 3) return;
      if (parent.closest(TIDY_SKIP) || isOverlayExcluded(parent) || !isVisible(parent)) return;
      var pd = getComputedStyle(parent).display;
      if (pd === "inline" || pd === "contents") return;
      // A grid whose items span different tracks (a bento) keeps one gap by
      // construction; the space between spanned tiles is not a gap to compare.
      if (pd === "grid" || pd === "inline-grid") {
        var sizes = Array.prototype.map.call(parent.children, function (c) { var r = c.getBoundingClientRect(); return [r.width, r.height]; });
        if (sizes.some(function (s) { return Math.abs(s[0] - sizes[0][0]) > 1 || Math.abs(s[1] - sizes[0][1]) > 1; })) return;
      }
      var seq = Array.prototype.filter.call(parent.children, function (c) {
        return !NON_LAYOUT_TAGS[c.tagName] || c.tagName === "BUTTON" || c.tagName === "IMG" || c.tagName === "INPUT" || c.tagName === "SELECT";
      }).filter(function (c) { return getComputedStyle(c).display !== "none"; });
      var groups = {};
      var prox = null;
      function add(key, v) { (groups[key] = groups[key] || []).push(v); }
      function note(a, b, gap) {
        if (/^(INPUT|SELECT|TEXTAREA|BUTTON|IMG)$/.test(a.tagName) || !panelish(a, true) || !panelish(b, true)) return;
        var pad = Math.min(blockPad(a), blockPad(b));
        if (pad <= 0) return; // a flush media tile or a ruled stat, not a padded card
        if (gap > pad + 0.5 && (!prox || gap - pad > prox.gap - prox.pad)) prox = { gap: gap, pad: pad, kind: sig(a) };
      }
      for (var i = 0; i + 1 < seq.length; i++) {
        var a = seq[i], b = seq[i + 1];
        // A kind is a tag plus classes; bare wrappers (div, section) are not one.
        if (!a.classList.length && GENERIC_TAGS[a.tagName]) continue;
        if (sig(a) !== sig(b) || !measurable(a) || !measurable(b)) continue;
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        var vov = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        var hov = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        var key = sig(a);
        if (vov >= 0.5 * Math.min(ra.height, rb.height) && hov <= 1) {
          var gx = rb.left >= ra.right - 1 ? rb.left - ra.right : ra.left - rb.right;
          add(key + "|x", gx);
          note(a, b, gx);
        } else if (hov >= 0.5 * Math.min(ra.width, rb.width) && vov <= 1) {
          var gy = rb.top >= ra.bottom - 1 ? rb.top - ra.bottom : ra.top - rb.bottom;
          add(key + "|y", gy);
          note(a, b, gy);
        } else if (rb.top >= ra.bottom - 1) {
          // A wrapped row break: measure b against the nearest earlier item above it.
          var above = -Infinity;
          for (var j = 0; j <= i; j++) {
            if (!measurable(seq[j])) continue;
            var rj = seq[j].getBoundingClientRect();
            var ov = Math.min(rj.right, rb.right) - Math.max(rj.left, rb.left);
            if (ov > 1 && rj.bottom <= rb.top + 1 && rj.bottom > above) above = rj.bottom;
          }
          if (above > -Infinity) { add(key + "|rows", rb.top - above); note(a, b, rb.top - above); }
        }
      }
      if (prox) {
        pushV("proximity", cssPath(parent), prox.kind + " cards sit " + +prox.gap.toFixed(1) + "px apart, more than their " + +prox.pad.toFixed(1) + "px inner padding; the gap between cards stays at or under the padding inside them");
      }
      Object.keys(groups).forEach(function (k) {
        var gaps = groups[k];
        if (gaps.length < 2) return;
        var max = Math.max.apply(null, gaps), min = Math.min.apply(null, gaps);
        if (max - min <= 1.01) return;
        var parts = k.split("|");
        var axis = parts[1] === "x" ? "across the row" : parts[1] === "y" ? "down the stack" : "between wrapped rows";
        pushV("gap-consistency", cssPath(parent), parts[0] + " items sit at uneven gaps " + axis + ": [" + gaps.map(function (g) { return +g.toFixed(1); }).join(", ") + "]px");
      });
    });
  })();

  // Top-level sections: full-width bands that are children of main or
  // .kit-page and are a section or carry data-kit-composition, in document
  // order. Cells of a board (sections side by side in a grid) are not bands.
  function topSections() {
    var out = [];
    var seen = new Set();
    Array.prototype.forEach.call(document.querySelectorAll("main, [role=main], .kit-page"), function (host) {
      var hw = host.clientWidth;
      Array.prototype.forEach.call(host.children, function (c) {
        if (seen.has(c) || !c.matches("section, [data-kit-composition]") || !isVisible(c)) return;
        if (c.getBoundingClientRect().width < hw * 0.9) return;
        seen.add(c);
        out.push(c);
      });
    });
    out.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    return out;
  }
  var SECTIONS = topSections();

  // A band that follows the page rhythm: not the Masthead, footer, header,
  // or a noyzzi section, which keep their own frame.
  function isBand(s) {
    if (s.closest("[data-jal-exempt~=noyzzi]")) return false;
    var comp = s.getAttribute("data-kit-composition");
    if (comp === "masthead" || comp === "footer" || s.classList.contains("kit-masthead")) return false;
    return s.tagName !== "FOOTER" && s.tagName !== "HEADER";
  }

  // The first painted background at or above el, as "r,g,b" (white if none).
  function groundOf(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.05) return c.r + "," + c.g + "," + c.b;
    }
    return "255,255,255";
  }
  // A tone band paints its own background, unlike the ground behind it.
  function isToneBand(s) {
    var c = parseColor(getComputedStyle(s).backgroundColor);
    return !!(c && c.a > 0.05 && c.r + "," + c.g + "," + c.b !== groundOf(s.parentElement));
  }

  // section-rhythm: every band uses the page's one vertical rhythm.
  // Kit pages: the rhythm is --kit-gap-section (the page's data-rhythm on
  // .kit-page picks tight, default, or generous), or on older kit CSS the
  // --kit-space, --kit-space-tight, --kit-space-loose token a section's own
  // data-rhythm names. An attached band (data-attached: LogoRow, a short
  // proof band) uses --kit-gap-group. A band's full edge must equal its
  // rhythm; the other edge may collapse only against a neighbour on the same
  // ground (one section gap between them, never two). Without kit tokens,
  // bands sharing a rhythm share one padding. The Masthead and the footer
  // keep their own frame; at most one section is generous.
  (function checkSectionRhythm() {
    var TOKEN = { tight: "--kit-space-tight", "default": "--kit-space", generous: "--kit-space-loose" };
    var pageRhythm = null;
    [document.documentElement, document.body, document.querySelector(".kit-page"), document.querySelector("main, [role=main]")].forEach(function (el) {
      if (!pageRhythm && el && el.getAttribute("data-rhythm")) pageRhythm = el.getAttribute("data-rhythm");
    });
    function pads(s) {
      var cs = getComputedStyle(s);
      var t = parseFloat(cs.paddingTop) || 0, b = parseFloat(cs.paddingBottom) || 0;
      var kids = Array.prototype.filter.call(s.children, function (c) {
        var p = getComputedStyle(c).position;
        return isVisible(c) && p !== "absolute" && p !== "fixed";
      });
      if (kids.length === 1) {
        var k = getComputedStyle(kids[0]);
        if (t <= 0.5) t = parseFloat(k.paddingTop) || 0;
        if (b <= 0.5) b = parseFloat(k.paddingBottom) || 0;
      }
      return { t: t, b: b };
    }
    function ground(s) {
      var c = parseColor(getComputedStyle(s).backgroundColor);
      return c && c.a > 0.05 ? c.r + "," + c.g + "," + c.b : "none";
    }
    function px(v) { return +v.toFixed(1) + "px"; }
    var groups = {};
    var generous = 0;
    SECTIONS.forEach(function (s, i) {
      if (!isBand(s)) return;
      var own = s.getAttribute("data-rhythm");
      var attached = s.hasAttribute("data-attached");
      var key = attached ? "attached" : own === "tight" || own === "generous" ? own : (own && own !== "default" ? own : (pageRhythm || "default"));
      var p = pads(s);
      if (own === "generous" && pageRhythm !== "generous" && ++generous > 1) {
        pushV("section-rhythm", cssPath(s), "a second generous section; generous is for the one signature section, the rest use the page rhythm");
      }
      var toks = spaceTokens(s);
      var name = attached ? (toks["--kit-gap-group"] ? "--kit-gap-group" : "--kit-space-tight") : (toks["--kit-gap-section"] && !(own === "tight" || own === "generous") ? "--kit-gap-section" : TOKEN[key]);
      var expect = name ? toks[name] : undefined;
      if (!expect) {
        (groups[key] = groups[key] || []).push({ s: s, p: p });
        return;
      }
      var full = Math.max(p.t, p.b);
      if (Math.abs(full - expect) > 1) {
        pushV("section-rhythm", cssPath(s), "padding-block " + px(p.t) + "/" + px(p.b) + " is off the " + key + " rhythm (" + name + " = " + expect + "px at this width)");
        return;
      }
      [["t", SECTIONS[i - 1], "top"], ["b", SECTIONS[i + 1], "bottom"]].forEach(function (edge) {
        var v = p[edge[0]];
        if (Math.abs(v - full) <= 1) return;
        if (edge[1] && ground(edge[1]) === ground(s)) return; // collapsed against the same ground
        pushV("section-rhythm", cssPath(s), edge[2] + " padding " + px(v) + " is short of the " + key + " rhythm (" + name + " = " + expect + "px) where it meets " + (edge[1] ? "a different ground" : "the page edge"));
      });
    });
    // No kit tokens: the most common padding in each rhythm is the page's value.
    Object.keys(groups).forEach(function (key) {
      var list = groups[key];
      if (list.length < 2) return;
      function mode(side) {
        var counts = {}, best = null, bestN = 0;
        list.forEach(function (x) {
          var v = Math.round(x.p[side]);
          counts[v] = (counts[v] || 0) + 1;
          if (counts[v] > bestN) { best = v; bestN = counts[v]; }
        });
        return best;
      }
      var mt = mode("t"), mb = mode("b");
      list.forEach(function (x) {
        if (Math.abs(x.p.t - mt) > 1 || Math.abs(x.p.b - mb) > 1) {
          pushV("section-rhythm", cssPath(x.s), "padding-block " + px(x.p.t) + "/" + px(x.p.b) + " breaks the page's " + key + " rhythm of " + mt + "px/" + mb + "px");
        }
      });
    });
  })();

  // Rhythm value for a band: its kit token at this width, else its own
  // largest block padding.
  function bandRhythm(s, fallback) {
    var toks = spaceTokens(s);
    if (s.hasAttribute("data-attached")) return toks["--kit-gap-group"] || toks["--kit-space-tight"] || fallback;
    var own = s.getAttribute("data-rhythm");
    if (own === "tight" && toks["--kit-space-tight"]) return toks["--kit-space-tight"];
    if (own === "generous" && toks["--kit-space-loose"]) return toks["--kit-space-loose"];
    return toks["--kit-gap-section"] || toks["--kit-space"] || fallback;
  }

  // Vertical translate from el up to stop, so a reveal mid-flight is
  // measured where it will land.
  function liftOf(el, stop) {
    var ty = 0;
    for (var n = el; n && n !== stop && n.nodeType === 1; n = n.parentElement) {
      var t = getComputedStyle(n).transform;
      if (t && t !== "none") { try { ty += new DOMMatrixReadOnly(t).m42; } catch (e) {} }
    }
    return ty;
  }

  // Top and bottom of a band's drawn content: block boxes of its text and
  // the boxes of its media and controls.
  function contentExtent(band) {
    var top = Infinity, bottom = -Infinity;
    function take(el) {
      if (!isVisible(el) || el.closest("[aria-hidden=true]")) return;
      var r = el.getBoundingClientRect();
      var ty = liftOf(el, band);
      if (r.top - ty < top) top = r.top - ty;
      if (r.bottom - ty > bottom) bottom = r.bottom - ty;
    }
    var walker = document.createTreeWalker(band, NodeFilter.SHOW_TEXT, null);
    var node, seenEl = new Set();
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      var el = node.parentElement;
      while (el && el !== band && getComputedStyle(el).display === "inline") el = el.parentElement;
      if (!el || el === band || seenEl.has(el)) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName)) continue;
      seenEl.add(el);
      take(el);
    }
    Array.prototype.forEach.call(band.querySelectorAll("*"), function (el) {
      if (el.namespaceURI !== "http://www.w3.org/1999/xhtml") {
        if (el.tagName.toLowerCase() === "svg" && !(el.parentElement && el.parentElement.closest("svg"))) take(el);
        return;
      }
      // Media, controls, and drawn panels or hairline rules are content too.
      if (/^(IMG|VIDEO|CANVAS|IFRAME|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.getAttribute("role") === "img" || panelish(el)) take(el);
    });
    return top === Infinity ? null : { top: top, bottom: bottom };
  }

  // band-padding: a tone band (its own background, unlike the page ground)
  // frames its content evenly. Its first and last content sit at least the
  // rhythm's padding (less 8px of type leading) from the band's edges, and
  // the two insets match within 8px. An edge merged into a neighbour band of
  // the same tone is skipped.
  (function checkBandPadding() {
    SECTIONS.forEach(function (s, i) {
      if (!isBand(s) || !isToneBand(s)) return;
      var ext = contentExtent(s);
      if (!ext) return;
      var r = s.getBoundingClientRect();
      var cs = getComputedStyle(s);
      function merged(n, side) {
        if (!n || groundOf(n) !== groundOf(s)) return false;
        var nr = n.getBoundingClientRect();
        return side === "top" ? Math.abs(nr.bottom - r.top) <= 1 : Math.abs(nr.top - r.bottom) <= 1;
      }
      var mTop = merged(SECTIONS[i - 1], "top"), mBottom = merged(SECTIONS[i + 1], "bottom");
      var inTop = ext.top - r.top, inBottom = r.bottom - ext.bottom;
      var kid = s.children.length === 1 ? getComputedStyle(s.children[0]) : null;
      var padMax = Math.max(parseFloat(cs.paddingTop) || 0, parseFloat(cs.paddingBottom) || 0,
        kid ? parseFloat(kid.paddingTop) || 0 : 0, kid ? parseFloat(kid.paddingBottom) || 0 : 0);
      var rhythm = bandRhythm(s, padMax);
      var bad = [];
      if (!mTop && inTop < rhythm - 8) bad.push("first content " + Math.round(inTop) + "px from the top edge");
      if (!mBottom && inBottom < rhythm - 8) bad.push("last content " + Math.round(inBottom) + "px from the bottom edge");
      if (!mTop && !mBottom && Math.abs(inTop - inBottom) > 8) bad.push("insets " + Math.round(inTop) + "px top and " + Math.round(inBottom) + "px bottom differ by more than 8px");
      if (bad.length) pushV("band-padding", cssPath(s), "tone band frames its content unevenly (rhythm " + rhythm + "px): " + bad.join("; "));
    });
  })();

  // display-measure: a page heading or display-size text (48px and up)
  // wraps to at most 2 lines from 1024px, 3 from 375px, 4 below; and a
  // display line of several words is never set larger than its measure
  // allows (font-size over a sixth of its box width). A one-word wordmark
  // is the layout and skips the size check.
  (function checkDisplayMeasure() {
    var vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var maxLines = vw >= 1024 ? 2 : vw >= 375 ? 3 : 4;
    var cands = [];
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
      if (el.namespaceURI !== "http://www.w3.org/1999/xhtml" || el.closest(TIDY_SKIP) || isOverlayExcluded(el)) return;
      var isH1 = el.tagName === "H1";
      if (!isH1) {
        if ((parseFloat(getComputedStyle(el).fontSize) || 0) < 48) return;
        var direct = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
        if (!direct) return;
      }
      if (!isVisible(el)) return;
      cands.push(el);
    });
    cands = cands.filter(function (el) { return !cands.some(function (o) { return o !== el && o.contains(el); }); });
    cands.forEach(function (el) {
      var text = (el.textContent || "").trim();
      if (!text) return;
      var size = 0, rects = [];
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim() || !node.parentElement) continue;
        size = Math.max(size, parseFloat(getComputedStyle(node.parentElement).fontSize) || 0);
        var range = document.createRange();
        range.selectNodeContents(node);
        Array.prototype.forEach.call(range.getClientRects(), function (r) { if (r.width > 0.5 && r.height > 0) rects.push(r); });
      }
      if (!rects.length) return;
      var centers = [];
      rects.forEach(function (r) {
        var c = (r.top + r.bottom) / 2;
        if (!centers.some(function (x) { return Math.abs(x - c) < size * 0.5; })) centers.push(c);
      });
      var bad = [];
      if (centers.length > maxLines) bad.push("wraps to " + centers.length + " lines (at most " + maxLines + " at " + Math.round(vw) + "px)");
      var cs = getComputedStyle(el);
      var box = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      if (/\\s/.test(text) && box > 0 && size > box / 6 + 0.5) bad.push("font-size " + size + "px over a sixth of its " + Math.round(box) + "px measure");
      if (bad.length) pushV("display-measure", cssPath(el), "'" + text.slice(0, 40) + "' " + bad.join("; "));
    });
  })();

  // hero-card: the page heading is set on the page, never boxed. The h1
  // (or the first section's heading) must not sit in a rounded panel with a
  // border or its own tone inside its section, unless that panel is one of
  // a card grid, or it sits over the section's media (the Masthead overlay).
  (function checkHeroCard() {
    var h = Array.prototype.filter.call(document.querySelectorAll("h1"), isVisible)[0];
    if (!h && SECTIONS[0]) h = Array.prototype.filter.call(SECTIONS[0].querySelectorAll("h1, h2"), isVisible)[0];
    if (!h) return;
    var sec = SECTIONS.filter(function (s) { return s.contains(h); })[0] || h.closest("section, header, main") || document.body;
    function mediaUnder(panel) {
      var pr = panel.getBoundingClientRect();
      var area = pr.width * pr.height;
      var pool = [sec].concat(Array.prototype.slice.call(sec.querySelectorAll("*")));
      return pool.some(function (m) {
        if (panel.contains(m) || m.contains(panel) && m !== sec) return false;
        var cs = getComputedStyle(m);
        var isMedia = /^(IMG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(m.tagName) || m.tagName.toLowerCase() === "svg" ||
          m.hasAttribute("data-jal-canvas") || m.getAttribute("role") === "img" || (cs.backgroundImage || "").indexOf("url(") !== -1;
        if (!isMedia || !isVisible(m)) return false;
        var r = m.getBoundingClientRect();
        var ix = Math.min(r.right, pr.right) - Math.max(r.left, pr.left);
        var iy = Math.min(r.bottom, pr.bottom) - Math.max(r.top, pr.top);
        return ix > 0 && iy > 0 && ix * iy >= area * 0.5;
      });
    }
    function panelLike(n) {
      var cs = getComputedStyle(n);
      var radius = Math.max(parseFloat(cs.borderTopLeftRadius) || 0, parseFloat(cs.borderTopRightRadius) || 0,
        parseFloat(cs.borderBottomLeftRadius) || 0, parseFloat(cs.borderBottomRightRadius) || 0);
      if (radius <= 0) return null;
      var border = ["Top", "Right", "Bottom", "Left"].some(function (side) {
        return (parseFloat(cs["border" + side + "Width"]) || 0) > 0 && cs["border" + side + "Style"] !== "none";
      });
      var c = parseColor(cs.backgroundColor);
      var tonal = !!(c && c.a > 0.05 && c.r + "," + c.g + "," + c.b !== groundOf(n.parentElement));
      return border || tonal ? { radius: radius, how: border ? "bordered" : "tonal" } : null;
    }
    for (var n = h.parentElement; n && n !== sec && sec.contains(n); n = n.parentElement) {
      var p = panelLike(n);
      if (!p) continue;
      var peers = Array.prototype.filter.call(n.parentElement.children, function (c) { return c !== n && isVisible(c) && panelLike(c); });
      if (peers.length) continue; // one card of a card grid
      if (mediaUnder(n)) continue; // a legibility panel over media
      pushV("hero-card", cssPath(n), "the page heading sits in a " + p.how + " rounded panel (radius " + p.radius + "px); set the hero on the page, not boxed in a card");
      return;
    }
  })();

  // gap-seam: two adjacent bands, at least one a tone band, leave a strip
  // of page ground under 24px between them (a stray margin, a white line
  // above a tone CTA band).
  (function checkGapSeam() {
    for (var i = 1; i < SECTIONS.length; i++) {
      var a = SECTIONS[i - 1], b = SECTIONS[i];
      if (!isToneBand(a) && !isToneBand(b)) continue;
      var seam = b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
      if (seam > 0.5 && seam < 24) {
        pushV("gap-seam", cssPath(b), "a " + +seam.toFixed(1) + "px strip of page ground between " + cssPath(a) + " and this band; tone bands meet edge to edge or sit a full rhythm apart");
      }
    }
  })();

  // radius-scale: a bordered or filled box rounds at most a third of its
  // height, so a one-line card never turns into a pill. Controls and chips
  // under 56px tall, small circles (avatars, dots), and media frames taller
  // than 240px keep their own radius tier.
  (function checkRadiusScale() {
    var CONTROL = /^(BUTTON|INPUT|SELECT|TEXTAREA|A|LABEL|SUMMARY)$/;
    var MEDIA = "img, video, picture, canvas, figure, iframe, [role=img], [data-jal-canvas], .kit-media, .kit-media-frame";
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
      if (el.namespaceURI !== "http://www.w3.org/1999/xhtml" || el.closest(TIDY_SKIP) || isOverlayExcluded(el)) return;
      var cs = getComputedStyle(el);
      var raw = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius];
      if (raw.every(function (v) { return !parseFloat(v); })) return;
      if (!isVisible(el) || !panelish(el)) return;
      var r = el.getBoundingClientRect();
      var h = r.height, w = r.width;
      var radius = Math.max.apply(null, raw.map(function (v) {
        var n = parseFloat(v) || 0;
        return v.indexOf("%") !== -1 ? (n / 100) * Math.min(w, h) : n;
      }));
      radius = Math.min(radius, Math.min(w, h) / 2);
      if (radius <= h / 3 + 0.5) return;
      if (h < 56) {
        var role = el.getAttribute("role") || "";
        if (CONTROL.test(el.tagName) || /^(button|tab|switch|checkbox|radio|link|option|menuitem)$/.test(role)) return;
        if (cs.display.indexOf("inline") === 0 || w < 320) return; // a chip or badge
        if (Math.abs(w - h) <= 1) return; // a circle
      }
      if (h > 240 && (el.matches(MEDIA) || el.querySelector("img, video, canvas, picture, svg, [role=img], [data-jal-canvas]"))) return;
      pushV("radius-scale", cssPath(el), "border-radius " + +radius.toFixed(1) + "px on a " + Math.round(w) + "x" + Math.round(h) + "px box is over a third of its height (" + +(h / 3).toFixed(1) + "px)");
    });
  })();

  // composition-repeat: the anti-repetition law on the rendered page.
  // With kit markers: two adjacent sections of one composition and variant,
  // or one composition and variant more than twice (Masthead and Footer
  // once), fail. Without markers: two adjacent sections with one grid
  // template and one child tag signature fail.
  (function checkCompositionRepeat() {
    var marked = SECTIONS.some(function (s) { return s.hasAttribute("data-kit-composition"); });
    if (marked) {
      var prev = null, byKey = {}, byComp = {};
      SECTIONS.forEach(function (s) {
        var comp = s.getAttribute("data-kit-composition");
        if (!comp) { prev = null; return; }
        var variant = s.getAttribute("data-variant");
        var key = comp + (variant ? " (" + variant + ")" : "");
        if (comp !== "custom") {
          if (key === prev) pushV("composition-repeat", cssPath(s), "two adjacent sections are both " + key + "; neighbours change composition or variant");
          byKey[key] = (byKey[key] || 0) + 1;
          byComp[comp] = (byComp[comp] || 0) + 1;
          if ((comp === "masthead" || comp === "footer") && byComp[comp] > 1) {
            pushV("composition-repeat", cssPath(s), comp + " appears " + byComp[comp] + " times; at most once per page");
          } else if (byKey[key] > 2) {
            pushV("composition-repeat", cssPath(s), key + " appears " + byKey[key] + " times; at most twice per page");
          }
        }
        prev = key;
      });
      return;
    }
    function layoutNode(s) {
      var n = s;
      for (var d = 0; d < 4; d++) {
        var kids = Array.prototype.filter.call(n.children, isVisible);
        if (kids.length !== 1) break;
        n = kids[0];
      }
      return n;
    }
    function structure(s) {
      var n = layoutNode(s);
      var cs = getComputedStyle(n);
      if (!isFlexOrGrid(cs.display)) return null;
      var kids = Array.prototype.filter.call(n.children, isVisible);
      if (kids.length < 2) return null;
      var tpl = cs.display.indexOf("grid") !== -1 ? "grid " + cs.gridTemplateColumns : "flex " + cs.flexDirection + " " + cs.flexWrap;
      return tpl + " | " + kids.map(function (k) { return k.tagName.toLowerCase() + (k.classList.length ? "." + k.classList[0] : ""); }).join(",");
    }
    for (var i = 1; i < SECTIONS.length; i++) {
      var a = structure(SECTIONS[i - 1]), b = structure(SECTIONS[i]);
      if (a && a === b) {
        pushV("composition-repeat", cssPath(SECTIONS[i]), "adjacent sections share one structure (" + b + "); vary the composition");
      }
    }
  })();

  return violations;
})()
`;

type RawViolation = { rule: string; selector: string; detail: string };

// Scroll walk: finds the element that really scrolls ([data-jal-scroller], the
// document, or an app-shell inner scroller such as main.shell-main) and steps
// through it with real scroll events, so scroll-triggered reveals get the same
// chance to fire they would get from a person scrolling. At each step it can
// probe for content still hidden in the middle 60% of the screen (stuck-reveal;
// probed walks step 60% of a screen so the bands meet) and for screens with
// almost nothing on them (blank-viewport). Installed once per page as
// window.__jalWalk.
const WALK_SCRIPT = `
(function () {
  if (window.__jalWalk) return true;
  ${CSS_PATH_FN}

  var MEDIA_SEL = "img, video, canvas, svg, iframe, embed, object, button, input, select, textarea";
  var SKIP_SEL = "[aria-hidden=true], [data-jal-exempt~=noyzzi], [inert], [hidden], [popover], [data-overlay], [role=dialog], [role=alertdialog], [role=menu], [role=listbox], [role=tooltip]";
  var SECTION_SEL = "section, article, [role=region], header, footer, aside";
  var LANDMARK_SEL = SECTION_SEL + ", main, [role=main]";
  var doc = document.scrollingElement || document.documentElement;
  var scroller = null;
  var reported = new Set(); // sections already confirmed stuck on this walk

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function vp() {
    var vv = window.visualViewport;
    return { w: vv ? vv.width : window.innerWidth, h: vv ? vv.height : window.innerHeight };
  }
  function isDoc() { return scroller === doc; }

  // The element a person actually scrolls. [data-jal-scroller] wins outright.
  // Otherwise the document, whenever it scrolls at all, unless an inner
  // scroller nearly fills the screen (an app shell). A sidebar, code block, or
  // overflow-x table wrapper never wins over a scrolling document.
  function findScroller() {
    var v = vp();
    var marked = document.querySelector("[data-jal-scroller]");
    if (marked) return marked === document.documentElement || marked === document.body ? doc : marked;
    var docMax = doc.scrollHeight - doc.clientHeight;
    if (docMax > v.h * 0.5) return doc;
    var best = null, bestArea = 0;
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el === doc || el === document.body) continue;
      // Under 2px of vertical overflow is rounding, e.g. an overflow-x: auto
      // table wrapper whose overflow-y computes to auto.
      if (el.scrollHeight - el.clientHeight < 2) continue;
      var oy = getComputedStyle(el).overflowY;
      if (oy !== "auto" && oy !== "scroll") continue;
      var area = el.clientWidth * el.clientHeight;
      if (area > bestArea) { best = el; bestArea = area; }
    }
    if (docMax > 1) return best && best.clientHeight >= v.h * 0.8 ? best : doc;
    if (best && best.clientHeight >= v.h * 0.3) return best;
    return doc;
  }

  function info() {
    return {
      scroller: isDoc() ? "document" : cssPathRaw(scroller),
      scrollHeight: scroller.scrollHeight,
      clientHeight: isDoc() ? doc.clientHeight : scroller.clientHeight,
      max: Math.max(0, scroller.scrollHeight - (isDoc() ? doc.clientHeight : scroller.clientHeight)),
      scrollY: isDoc() ? window.scrollY : scroller.scrollTop
    };
  }

  function go(y) {
    if (isDoc()) window.scrollTo({ top: y, left: 0, behavior: "instant" });
    else scroller.scrollTo({ top: y, left: scroller.scrollLeft, behavior: "instant" });
    (isDoc() ? document : scroller).dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    return info();
  }

  function region() {
    var v = vp();
    if (isDoc()) return { left: 0, top: 0, right: v.w, bottom: v.h };
    var r = scroller.getBoundingClientRect();
    var left = Math.max(0, r.left + scroller.clientLeft);
    var top = Math.max(0, r.top + scroller.clientTop);
    return {
      left: left,
      top: top,
      right: Math.min(v.w, r.left + scroller.clientLeft + scroller.clientWidth),
      bottom: Math.min(v.h, r.top + scroller.clientTop + scroller.clientHeight)
    };
  }

  // Region minus pinned bands: fixed or sticky bars touching its top or bottom.
  function sampleRegion(reg) {
    var out = { left: reg.left, top: reg.top, right: reg.right, bottom: reg.bottom };
    var w = reg.right - reg.left, h = reg.bottom - reg.top;
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var pos = getComputedStyle(el).position;
      if (pos !== "fixed" && pos !== "sticky") continue;
      var r = el.getBoundingClientRect();
      if (r.width < w * 0.5 || r.height <= 0 || r.height > h * 0.4) continue;
      if (r.top <= reg.top + 2 && r.bottom > out.top) out.top = Math.min(reg.bottom, r.bottom);
      else if (r.bottom >= reg.bottom - 2 && r.top < out.bottom) out.bottom = Math.max(reg.top, r.top);
    }
    return out;
  }

  function effOpacity(el) {
    var o = 1;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      o *= parseFloat(getComputedStyle(n).opacity);
      if (o < 0.001) return 0;
    }
    return o;
  }

  // The outermost ancestor doing the hiding: its own opacity is low, or it is
  // where visibility: hidden starts.
  function hidingNode(el) {
    var found = null;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n);
      var pv = n.parentElement ? getComputedStyle(n.parentElement).visibility : "visible";
      if (parseFloat(cs.opacity) < 0.5 || (cs.visibility !== "visible" && pv === "visible")) found = n;
    }
    return found;
  }

  function hiddenState(el) {
    var op = effOpacity(el);
    var vis = getComputedStyle(el).visibility !== "visible";
    return { op: op, vis: vis, hidden: op < 0.1 || vis };
  }

  function collect() {
    var texts = [];
    var els = [];
    var seen = new Set();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      var p = node.parentElement;
      if (!p) continue;
      var tag = p.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE" || tag === "OPTION") continue;
      texts.push({ node: node, p: p });
      if (!seen.has(p)) { seen.add(p); els.push(p); }
    }
    var media = [];
    Array.prototype.forEach.call(document.querySelectorAll(MEDIA_SEL), function (el) {
      if (el.tagName.toLowerCase() === "svg" && el.parentElement && el.parentElement.closest("svg")) return;
      if (el.tagName === "INPUT" && el.type === "hidden") return;
      media.push(el);
      if (!seen.has(el)) { seen.add(el); els.push(el); }
    });
    // A CSS background image (full-bleed hero, photo band) is drawn content too.
    // The same pass lists the grid and row-flex containers for dead-space.
    var containers = [];
    Array.prototype.forEach.call(document.body.querySelectorAll("*"), function (el) {
      var cs = getComputedStyle(el);
      var d = cs.display;
      if (d === "grid" || d === "inline-grid" || ((d === "flex" || d === "inline-flex") && cs.flexDirection.indexOf("row") === 0)) {
        if (el.children.length) containers.push(el);
      }
      if (seen.has(el)) return;
      var bg = cs.backgroundImage;
      if (bg && bg.indexOf("url(") !== -1) media.push(el);
    });
    return { texts: texts, media: media, els: els, containers: containers };
  }

  // Visible drawn content in a sample region: media boxes and text line boxes.
  function visibleContent(s, c) {
    var media = [];
    c.media.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      if (r.bottom <= s.top || r.top >= s.bottom || r.right <= s.left || r.left >= s.right) return;
      if (hiddenState(el).hidden) return;
      media.push({ r: r, el: el });
    });
    var text = [];
    var opCache = new Map();
    c.texts.forEach(function (t) {
      var pr = t.p.getBoundingClientRect();
      if (pr.width <= 0 || pr.height <= 0) return;
      if (pr.bottom < s.top - 24 || pr.top > s.bottom + 24) return;
      var st = opCache.get(t.p);
      if (!st) { st = hiddenState(t.p); opCache.set(t.p, st); }
      if (st.hidden) return;
      var range = document.createRange();
      range.selectNodeContents(t.node);
      Array.prototype.forEach.call(range.getClientRects(), function (r) {
        if (r.width > 0 && r.height > 0) text.push({ r: r, p: t.p });
      });
    });
    return { media: media, text: text };
  }

  // Stacked alternates: a fade carousel slide, Swiper fade slide, or rotating
  // word waiting its turn in the same spot as a visible sibling. Walks from el
  // up to the node doing the hiding and asks, at each level, whether a visible
  // sibling covers at least 80% of that node's box.
  function coveredByVisibleSibling(el, hider) {
    for (var node = el; node && node.nodeType === 1; node = node.parentElement) {
      var parent = node.parentElement;
      if (parent) {
        var r = node.getBoundingClientRect();
        var area = r.width * r.height;
        if (area > 0) {
          for (var s = parent.firstElementChild; s; s = s.nextElementSibling) {
            if (s === node) continue;
            var sr = s.getBoundingClientRect();
            var ix = Math.min(r.right, sr.right) - Math.max(r.left, sr.left);
            var iy = Math.min(r.bottom, sr.bottom) - Math.max(r.top, sr.top);
            if (ix <= 0 || iy <= 0 || ix * iy < area * 0.8) continue;
            if (!hiddenState(s).hidden) return true;
          }
        }
      }
      if (!hider || node === hider) break;
    }
    return false;
  }

  function sectionKey(el) {
    return cssPathRaw(el.closest(LANDMARK_SEL) || hidingNode(el) || el);
  }

  // Probe band: the middle 60% of the region. The walk steps 60% of a screen,
  // so consecutive bands meet with no seam. The first screen also covers its
  // top 20% and the last screen its bottom 20% (minus pinned bars), since no
  // later or earlier step will.
  function probeBand(reg, first, last) {
    var h = reg.bottom - reg.top;
    var s = (first || last) ? sampleRegion(reg) : reg;
    return {
      left: reg.left,
      right: reg.right,
      top: first ? s.top : reg.top + h * 0.2,
      bottom: last ? s.bottom : reg.bottom - h * 0.2
    };
  }

  function stuckCandidates(band, c) {
    var out = [];
    c.els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      if (r.bottom <= band.top || r.top >= band.bottom) return;
      if (r.right <= band.left || r.left >= band.right) return;
      if (el.closest(SKIP_SEL) || el.closest("dialog:not([open])")) return;
      if (!hiddenState(el).hidden) return;
      var hider = hidingNode(el);
      if (hider) {
        var pos = getComputedStyle(hider).position;
        // An absolutely placed layer at opacity 0 is a hover or focus overlay, not a reveal.
        if (pos === "absolute" || pos === "fixed") return;
      }
      if (coveredByVisibleSibling(el, hider)) return;
      var key = sectionKey(el);
      if (reported.has(key)) return; // already confirmed; no second recheck wait
      out.push(el);
    });
    return out;
  }

  function inside(r, x, y, pad) {
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  // A sample that lands in a cell's padding or beside its short text (a
  // dense spec table, a list row) still hits content: the hit element, or its
  // nearest cell or row, holds visible text and is under a quarter of the screen.
  var CELL_SEL = "td, th, li, dt, dd, tr, [role=row], [role=cell], [role=gridcell], [role=rowheader], [role=columnheader], [role=listitem]";
  function cellHit(hit, textRects, quarter) {
    var cell = hit.closest(CELL_SEL) || hit;
    var r = cell.getBoundingClientRect();
    if (r.width * r.height >= quarter) return false;
    for (var k = 0; k < textRects.length; k++) {
      var p = textRects[k].p;
      if (cell === p || cell.contains(p)) return true;
    }
    return false;
  }

  function blankProbe(reg, s, vis) {
    var w = s.right - s.left, h = s.bottom - s.top;
    if (w < 100 || h < 100) return null;
    var mediaRects = vis.media;
    var textRects = vis.text;
    var quarter = (reg.right - reg.left) * (reg.bottom - reg.top) / 4;
    var cols = 6, rows = 8, hits = 0;
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var x = s.left + (i + 0.5) * (w / cols);
        var y = s.top + (j + 0.5) * (h / rows);
        var ok = false;
        for (var m = 0; m < mediaRects.length && !ok; m++) if (inside(mediaRects[m].r, x, y, 0)) ok = true;
        if (!ok) {
          var hit = document.elementFromPoint(x, y);
          if (hit) {
            for (var k = 0; k < textRects.length && !ok; k++) {
              var t = textRects[k];
              if (inside(t.r, x, y, 24) && (hit === t.p || hit.contains(t.p) || t.p.contains(hit))) ok = true;
            }
            if (!ok) ok = cellHit(hit, textRects, quarter);
          }
        }
        if (ok) hits++;
      }
    }
    // Name the landmark that fills most of the screen.
    var landmark = null, bestOverlap = 0, bestHeight = Infinity;
    Array.prototype.forEach.call(document.querySelectorAll(SECTION_SEL), function (el) {
      var r = el.getBoundingClientRect();
      if (r.right <= s.left || r.left >= s.right) return;
      var ov = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
      if (ov <= 0) return;
      if (ov > bestOverlap + 1 || (Math.abs(ov - bestOverlap) <= 1 && r.height < bestHeight)) {
        landmark = el; bestOverlap = ov; bestHeight = r.height;
      }
    });
    return {
      hits: hits,
      samples: cols * rows,
      landmark: landmark && bestOverlap >= h * 0.5 ? cssPathRaw(landmark) : (isDoc() ? "html" : cssPathRaw(scroller))
    };
  }

  // dead-space: inside a grid or row of columns, a region over 35% of the
  // screen with nothing drawn while a sibling column beside it has content
  // (an empty text column next to a tall or sticky media column, a card with
  // a hollow lower half), or a grid track no item occupies. A Masthead's
  // negative space, a MediaFrame, and a StickyStory step column that holds
  // its step text somewhere are intentional and skipped.
  var DEAD_SKIP = ".kit-masthead, [data-kit-composition=masthead]";
  var MEDIA_FRAME = ".kit-media, [data-kit-composition=media]";
  var STORY = ".kit-story, [data-kit-composition=sticky-story]";

  function spansIn(spans, y0, y1) {
    for (var i = 0; i < spans.length; i++) if (spans[i].bottom > y0 && spans[i].top < y1) return true;
    return false;
  }

  // The tallest vertical stretch of [top, bottom] holding none of spans
  // while other has content in it.
  function emptyStretch(spans, top, bottom, other) {
    var iv = [];
    spans.forEach(function (r) {
      var a = Math.max(r.top, top), b = Math.min(r.bottom, bottom);
      if (b > a) iv.push([a, b]);
    });
    iv.sort(function (p, q) { return p[0] - q[0]; });
    var best = null, cursor = top;
    function consider(a, b) {
      if (b - a <= 0 || !spansIn(other, a, b)) return;
      if (!best || b - a > best.h) best = { top: a, h: b - a };
    }
    iv.forEach(function (p) {
      if (p[0] > cursor) consider(cursor, p[0]);
      cursor = Math.max(cursor, p[1]);
    });
    consider(cursor, bottom);
    return best;
  }

  // Text still hidden (a reveal mid-flight or stuck) belongs to stuck-reveal.
  function hiddenTextIn(el, c, y0, y1) {
    for (var i = 0; i < c.texts.length; i++) {
      var p = c.texts[i].p;
      if (!el.contains(p)) continue;
      var r = p.getBoundingClientRect();
      if (r.bottom > y0 && r.top < y1 && hiddenState(p).hidden) return true;
    }
    return false;
  }

  function deadProbe(reg, s, c, vis) {
    if (s.bottom - s.top < 100 || s.right - s.left < 100) return [];
    var screen = (reg.right - reg.left) * (reg.bottom - reg.top);
    var limit = screen * 0.35;
    var items = [];
    vis.media.forEach(function (m) { items.push({ r: m.r, el: m.el }); });
    vis.text.forEach(function (t) { items.push({ r: t.r, el: t.p }); });
    var out = [];
    function pct(a) { return Math.round((a / screen) * 100); }
    c.containers.forEach(function (box) {
      var br = box.getBoundingClientRect();
      if (br.bottom <= s.top || br.top >= s.bottom || br.right <= s.left || br.left >= s.right) return;
      if (br.width * (Math.min(br.bottom, s.bottom) - Math.max(br.top, s.top)) <= limit) return;
      if (box.closest(SKIP_SEL) || box.closest(DEAD_SKIP)) return;
      var kids = [];
      Array.prototype.forEach.call(box.children, function (k) {
        var r = k.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        var pos = getComputedStyle(k).position;
        if (pos === "absolute" || pos === "fixed" || k.matches(SKIP_SEL)) return;
        var spans = [];
        items.forEach(function (it) { if (k === it.el || k.contains(it.el)) spans.push(it.r); });
        kids.push({ el: k, r: r, spans: spans });
      });
      kids.forEach(function (a) {
        if (a.el.closest(MEDIA_FRAME) || a.el.querySelector(MEDIA_FRAME)) return;
        if (a.el.closest(STORY) && (a.el.innerText || "").trim()) return;
        for (var i = 0; i < kids.length; i++) {
          var b = kids[i];
          if (b === a || !b.spans.length) continue;
          var hov = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
          if (hov > 1) continue;
          var top = Math.max(a.r.top, b.r.top, s.top), bottom = Math.min(a.r.bottom, b.r.bottom, s.bottom);
          if ((bottom - top) * a.r.width <= limit) continue;
          var gap = emptyStretch(a.spans, top, bottom, b.spans);
          if (!gap || gap.h * a.r.width <= limit) continue;
          if (hiddenTextIn(a.el, c, gap.top, gap.top + gap.h)) continue;
          out.push({
            selector: cssPathRaw(a.el),
            detail: "column is empty over " + Math.round(a.r.width) + "x" + Math.round(gap.h) + "px (" + pct(a.r.width * gap.h) + "% of the screen) while its sibling " + cssPathRaw(b.el) + " has content"
          });
          return;
        }
      });
      // Grid tracks with no item.
      var cs = getComputedStyle(box);
      if (cs.display.indexOf("grid") === -1 || cs.direction === "rtl") return;
      var tpl = cs.gridTemplateColumns.replace(/\\[[^\\]]*\\]/g, " ").trim().split(/\\s+/);
      if (tpl.length < 2 || tpl.some(function (t) { return !/^[\\d.]+px$/.test(t); })) return;
      var widths = tpl.map(parseFloat);
      var gapX = parseFloat(cs.columnGap) || 0;
      var bl = parseFloat(cs.borderLeftWidth) || 0, pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
      var bt = parseFloat(cs.borderTopWidth) || 0, pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
      var cw = box.clientWidth - pl - pr;
      var total = widths.reduce(function (x, y) { return x + y; }, 0) + gapX * (widths.length - 1);
      var jc = cs.justifyContent;
      var x = br.left + bl + pl;
      if (/center/.test(jc)) x += (cw - total) / 2;
      else if (/end|right/.test(jc)) x += cw - total;
      else if (/space/.test(jc) && cw - total > 1) return;
      var tracks = widths.map(function (wd) { var t = { l: x, r: x + wd }; x += wd + gapX; return t; });
      var covered = tracks.map(function (t) {
        return kids.some(function (k) { return Math.min(k.r.right, t.r) - Math.max(k.r.left, t.l) > 1; });
      });
      var y0 = Math.max(br.top + bt + pt, s.top), y1 = Math.min(br.top + bt + box.clientHeight - pb, s.bottom);
      if (y1 <= y0) return;
      var hasContent = kids.some(function (k) { return spansIn(k.spans, y0, y1); });
      if (!hasContent) return;
      for (var i = 0; i < tracks.length; i++) {
        if (covered[i]) continue;
        var j = i;
        while (j + 1 < tracks.length && !covered[j + 1]) j++;
        var w = tracks[j].r - tracks[i].l;
        if (w * (y1 - y0) > limit) {
          out.push({
            selector: cssPathRaw(box),
            detail: "grid track" + (j > i ? "s " + (i + 1) + " to " + (j + 1) + " of " + tracks.length + " hold" : " " + (i + 1) + " of " + tracks.length + " holds") + " no item: an empty " + Math.round(w) + "x" + Math.round(y1 - y0) + "px region (" + pct(w * (y1 - y0)) + "% of the screen)"
          });
        }
        i = j;
      }
    });
    return out;
  }

  window.__jalWalk = {
    init: function () { scroller = findScroller(); reported = new Set(); return info(); },
    top: function () { return go(0); },
    step: async function (y, settleMs, recheckMs, probe) {
      var at = go(y);
      await sleep(settleMs);
      at = info();
      if (!probe) return { at: at };
      var reg = region();
      var band = probeBand(reg, at.scrollY <= 1, at.scrollY >= at.max - 1);
      var suspects = stuckCandidates(band, collect());
      if (suspects.length) await sleep(recheckMs);
      var hidden = [];
      suspects.forEach(function (el) {
        var st = hiddenState(el);
        if (!st.hidden) return;
        var key = sectionKey(el);
        if (reported.has(key)) return;
        reported.add(key);
        hidden.push({ section: key, el: cssPathRaw(el), opacity: st.op, visibility: st.vis });
      });
      var c = collect();
      var s = sampleRegion(reg);
      var vis = visibleContent(s, c);
      return { at: info(), hidden: hidden, blank: blankProbe(reg, s, vis), dead: deadProbe(reg, s, c, vis) };
    }
  };
  return true;
})()
`;

export type WalkHidden = { section: string; el: string; opacity: number; visibility: boolean };
export type WalkStep = {
  index: number;
  scrollY: number;
  partial: boolean;
  hidden?: WalkHidden[];
  blank?: { hits: number; samples: number; landmark: string } | null;
  dead?: WalkDead[];
};
export type WalkDead = { selector: string; detail: string };
export type WalkResult = {
  scroller: string;
  totalHeight: number;
  viewportHeight: number;
  maxScroll: number;
  stepSize: number;
  // The walk stopped (step cap or time budget) before reaching the bottom.
  truncated: boolean;
  steps: WalkStep[];
};
type WalkInfo = { scroller: string; scrollHeight: number; clientHeight: number; max: number; scrollY: number };

export const WALK_SETTLE_MS = 700;
export const WALK_MAX_STEPS = 30;
// A probed walk steps 60% of a screen so its middle-band probes meet with no seam.
export const PROBE_STEP_FRACTION = 0.6;
const PROBE_MAX_STEPS = 60;
const WALK_RECHECK_MS = 800;
export const WALK_BUDGET_MS = 45000;

async function evalValue<T>(client: CdpClient, expression: string): Promise<T> {
  const res = await client.send<{ result: { value?: T }; exceptionDetails?: { text: string; exception?: { description?: string } } }>(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
  );
  if (res.exceptionDetails) {
    throw new Error(`walk script error: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text}`);
  }
  return res.result.value as T;
}

// Walk the page's real scroller top to bottom, then return to the top. A
// probed walk (the audit) steps 60% of a screen; an unprobed one (ui_shots)
// steps a full screen. onStep runs after each step settles (screenshots).
// live.walk is filled as the walk goes, so a caller cut off by a timeout still
// has the steps taken so far.
export async function walkScroller(
  client: CdpClient,
  opts: {
    probe?: boolean;
    settleMs?: number;
    maxSteps?: number;
    budgetMs?: number;
    stepFraction?: number;
    signal?: AbortSignal;
    live?: { walk?: WalkResult };
    onStep?: (step: WalkStep) => Promise<void>;
  } = {},
): Promise<WalkResult> {
  const probe = opts.probe ?? true;
  const settleMs = opts.settleMs ?? WALK_SETTLE_MS;
  const maxSteps = opts.maxSteps ?? (probe ? PROBE_MAX_STEPS : WALK_MAX_STEPS);
  const budgetMs = opts.budgetMs ?? WALK_BUDGET_MS;
  const stepFraction = opts.stepFraction ?? (probe ? PROBE_STEP_FRACTION : 1);
  throwIfAborted(opts.signal);
  await evalValue<boolean>(client, WALK_SCRIPT);
  const start = await evalValue<WalkInfo>(client, "window.__jalWalk.init()");
  const walk: WalkResult = {
    scroller: start.scroller,
    totalHeight: start.scrollHeight,
    viewportHeight: start.clientHeight,
    maxScroll: start.max,
    stepSize: Math.max(1, Math.round(start.clientHeight * stepFraction)),
    truncated: false,
    steps: [],
  };
  if (opts.live) opts.live.walk = walk;
  const steps = walk.steps;
  const began = Date.now();
  let target = 0;
  let prev = -1;
  let reachedEnd = false;
  while (steps.length < maxSteps) {
    throwIfAborted(opts.signal);
    const res = await evalValue<{ at: WalkInfo; hidden?: WalkHidden[]; blank?: WalkStep["blank"]; dead?: WalkDead[] }>(
      client,
      `window.__jalWalk.step(${target}, ${settleMs}, ${WALK_RECHECK_MS}, ${probe})`,
    );
    const info = res.at;
    walk.totalHeight = info.scrollHeight;
    walk.viewportHeight = info.clientHeight;
    walk.maxScroll = info.max;
    walk.stepSize = Math.max(1, Math.round(info.clientHeight * stepFraction));
    const y = info.scrollY;
    if (steps.length > 0 && y <= prev + 1) {
      reachedEnd = true; // the scroller will not move further
      break;
    }
    const step: WalkStep = {
      index: steps.length,
      scrollY: Math.round(y),
      partial: steps.length > 0 && y - prev < walk.stepSize - 1,
      hidden: res.hidden,
      blank: res.blank,
      dead: res.dead,
    };
    steps.push(step);
    if (opts.onStep) await opts.onStep(step);
    prev = y;
    if (y >= info.max - 1) {
      reachedEnd = true;
      break;
    }
    if (Date.now() - began > budgetMs) break;
    target = Math.min(y + walk.stepSize, info.max);
  }
  walk.truncated = !reachedEnd;
  throwIfAborted(opts.signal);
  await evalValue<WalkInfo>(client, "window.__jalWalk.top()");
  return walk;
}

export const NO_WEBGL_NOTE = " (rendered without WebGL)";

// stuck-reveal, blank-viewport, and dead-space, derived from one probed walk.
export function walkViolations(walk: WalkResult, opts: { webgl?: boolean } = {}): RawViolation[] {
  const out: RawViolation[] = [];
  const note = opts.webgl === false ? NO_WEBGL_NOTE : "";
  const seen = new Set<string>();
  // A page that does not scroll (a centred 404 or sign-in card) is one
  // deliberate screen, never a blank one.
  const scrolls = walk.maxScroll >= walk.viewportHeight * 0.1;
  let lastBlank = -Infinity;
  const deadSeen = new Set<string>();
  for (const s of walk.steps) {
    for (const d of s.dead ?? []) {
      if (deadSeen.has(d.selector)) continue;
      deadSeen.add(d.selector);
      out.push({ rule: "dead-space", selector: d.selector, detail: `${d.detail} at scrollY ${s.scrollY}${note}` });
    }
    for (const h of s.hidden ?? []) {
      if (seen.has(h.section)) continue;
      seen.add(h.section);
      const why = `opacity ${h.opacity.toFixed(2)}${h.visibility ? ", visibility hidden" : ""}`;
      out.push({
        rule: "stuck-reveal",
        selector: h.section,
        detail: `content still hidden after scrolling into view (${why}): a scroll-triggered reveal likely watches the wrong scroller (page scrolls in ${walk.scroller}); first hidden element ${h.el} at scrollY ${s.scrollY}${note}`,
      });
    }
    const b = s.blank;
    if (!scrolls || !b || b.hits / b.samples >= 0.1) continue;
    // Steps overlap, so one empty stretch shows up on several steps: report
    // the next empty screen only once it no longer overlaps the last reported one.
    if (s.scrollY < lastBlank + walk.viewportHeight) continue;
    lastBlank = s.scrollY;
    out.push({
      rule: "blank-viewport",
      selector: b.landmark,
      detail: `screen at scrollY ${s.scrollY} is empty (${b.hits} of ${b.samples} samples hit content) in scroller ${walk.scroller}${note}`,
    });
  }
  return out;
}

type WidthRun = {
  budgetMs: number;
  webgl: boolean;
  signal?: AbortSignal;
  sink: (v: RawViolation) => void;
  live: { walk?: WalkResult };
};

async function auditAtWidth(client: CdpClient, url: string, width: number, run: WidthRun): Promise<WalkResult> {
  throwIfAborted(run.signal);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  const loaded = client.waitForEvent("Page.loadEventFired", 25000);
  await client.send("Page.navigate", { url });
  await loaded;
  // let layout/fonts settle
  await client.send("Runtime.evaluate", {
    expression: "new Promise(function (r) { setTimeout(r, 60); })",
    awaitPromise: true,
  });
  const result = await client.send<{ result: { value?: RawViolation[] }; exceptionDetails?: { text: string } }>(
    "Runtime.evaluate",
    { expression: AUDIT_SCRIPT, returnByValue: true },
  );
  if (result.exceptionDetails) {
    throw new Error(`audit script error: ${result.exceptionDetails.text}`);
  }
  for (const v of result.result.value ?? []) run.sink(v);
  // Walk the real scroller last so reveals it triggers never touch the static rules.
  const walk = await walkScroller(client, { probe: true, budgetMs: run.budgetMs, signal: run.signal, live: run.live });
  for (const v of walkViolations(walk, { webgl: run.webgl })) run.sink(v);
  return walk;
}

// reduced-motion: with prefers-reduced-motion: reduce emulated, nothing may
// keep moving on its own. Counts requestAnimationFrame calls per second after
// the page settles and lists infinite CSS/WAAPI animations still running.
// Applies everywhere, noyzzi sections included (mechanical rule).
const RAF_COUNTER = `
(function () {
  window.__jalRaf = 0;
  var raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) { window.__jalRaf++; return raf(cb); };
})();
`;

const REDUCED_MOTION_PROBE = `
(async function () {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  await sleep(1500);
  var start = window.__jalRaf || 0;
  await sleep(1000);
  var perSecond = (window.__jalRaf || 0) - start;
  var infinite = [];
  if (document.getAnimations) {
    document.getAnimations().forEach(function (a) {
      try {
        var timing = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
        if (a.playState === "running" && timing && timing.iterations === Infinity) {
          var t = a.effect.target;
          infinite.push((t && t.tagName ? t.tagName.toLowerCase() + (t.id ? "#" + t.id : t.classList && t.classList[0] ? "." + t.classList[0] : "") : "?") + " " + (a.animationName || a.id || "animation"));
        }
      } catch (e) {}
    });
  }
  return { perSecond: perSecond, infinite: infinite.slice(0, 5) };
})()
`;

export const RAF_LIMIT_PER_SECOND = 10;

async function auditReducedMotion(client: CdpClient, url: string, width: number): Promise<RawViolation[]> {
  await client.send("Emulation.setDeviceMetricsOverride", { width, height: 1024, deviceScaleFactor: 1, mobile: width < 768 });
  await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const { identifier } = await client.send<{ identifier: string }>("Page.addScriptToEvaluateOnNewDocument", { source: RAF_COUNTER });
  try {
    const loaded = client.waitForEvent("Page.loadEventFired", 25000);
    await client.send("Page.navigate", { url });
    await loaded;
    const res = await client.send<{ result: { value?: { perSecond: number; infinite: string[] } } }>("Runtime.evaluate", {
      expression: REDUCED_MOTION_PROBE,
      awaitPromise: true,
      returnByValue: true,
    });
    const v = res.result.value;
    const out: RawViolation[] = [];
    if (v && v.perSecond > RAF_LIMIT_PER_SECOND) {
      out.push({
        rule: "reduced-motion",
        selector: "window",
        detail: `requestAnimationFrame loop still runs ${v.perSecond}/s under prefers-reduced-motion: reduce (limit ${RAF_LIMIT_PER_SECOND}); stop render and smooth-scroll loops, render a poster or on-demand frames`,
      });
    }
    for (const a of v?.infinite ?? []) {
      out.push({ rule: "reduced-motion", selector: a.split(" ")[0], detail: `infinite animation still running under prefers-reduced-motion: ${a}` });
    }
    return out;
  } finally {
    await client.send("Page.removeScriptToEvaluateOnNewDocument", { identifier }).catch(() => {});
    await client.send("Emulation.setEmulatedMedia", { features: [] }).catch(() => {});
  }
}

function dedupe(violations: Violation[]): Violation[] {
  const seen = new Set<string>();
  const out: Violation[] = [];
  for (const v of violations) {
    const key = `${v.rule}|${v.selector}|${v.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export const MIN_WIDTH = 200;
export const MAX_WIDTH = 3840;
export const MAX_SCREENS_LIMIT = 40;

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value.trim());
  return NaN;
}

// Viewport widths for CDP, which only takes integers: rounded, clamped to
// 200..3840, deduplicated. Anything that is not a finite number is an error,
// never silently passed on. undefined or [] means "use the default".
export function normalizeWidths(value: unknown): number[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error(`widths must be an array of numbers, e.g. [375, 1280]; got ${JSON.stringify(value)}`);
  const out: number[] = [];
  for (const v of value) {
    const n = toNumber(v);
    if (!Number.isFinite(n)) {
      throw new Error(`invalid width ${JSON.stringify(v)}: widths must be finite numbers (clamped to ${MIN_WIDTH}..${MAX_WIDTH})`);
    }
    const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(n)));
    if (!out.includes(w)) out.push(w);
  }
  return out.length ? out : undefined;
}

export function normalizeMaxScreens(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = toNumber(value);
  if (!Number.isFinite(n)) throw new Error(`invalid max_screens ${JSON.stringify(value)}: must be a number from 1 to ${MAX_SCREENS_LIMIT}`);
  return Math.min(MAX_SCREENS_LIMIT, Math.max(1, Math.round(n)));
}

// ui_shots writes and deletes files, so its output directory must resolve
// inside the working directory: no absolute paths elsewhere, no ../ escapes,
// and no symlink (on the deepest existing ancestor, e.g. a linked .jal/shots)
// that points outside it. The returned path is the real one, so the later
// unlink and writes act on the checked location.
function realPathOfDeepestAncestor(p: string): string {
  let probe = p;
  while (!existsSync(probe)) {
    const up = dirname(probe);
    if (up === probe) break;
    probe = up;
  }
  const realProbe = existsSync(probe) ? realpathSync(probe) : probe;
  return join(realProbe, relative(probe, p));
}

export function resolveOutDir(outDir: string | undefined, cwd: string = process.cwd()): string {
  const base = realPathOfDeepestAncestor(resolve(cwd));
  const target = resolve(base, outDir ?? join(".jal", "shots"));
  const fail = () => new Error(`out_dir must be a directory inside the working directory ${base}; got ${outDir}`);
  const inside = (p: string) => {
    const rel = relative(base, p);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  };
  // Compare real paths only: an absolute out_dir spelled through an
  // unresolved cwd (macOS /var vs /private/var) still matches.
  const real = realPathOfDeepestAncestor(target);
  if (!inside(real)) throw fail();
  return real;
}

// One headless Chrome with one page. close() is idempotent and also cleans up
// anything open() acquires after close() ran (a timeout mid-launch), so Chrome
// never outlives its run.
class BrowserSession {
  private tmpDir?: string;
  private handle?: ChromeHandle;
  private pageId?: string;
  client?: CdpClient;
  private closed = false;

  async open(chromePath: string, prefix: string, webgl: boolean): Promise<CdpClient> {
    this.tmpDir = await mkdtemp(join(tmpdir(), prefix));
    await this.bailIfClosed();
    this.handle = await launchChrome(chromePath, this.tmpDir, { webgl });
    await this.bailIfClosed();
    const page = await createPageTarget(this.handle.port);
    this.pageId = page.id;
    await this.bailIfClosed();
    this.client = await CdpClient.connect(page.webSocketDebuggerUrl);
    await this.bailIfClosed();
    await this.client.send("Page.enable");
    await this.client.send("Runtime.enable");
    return this.client;
  }

  private async bailIfClosed(): Promise<void> {
    if (!this.closed) return;
    await this.close();
    throw new Error("audit cancelled");
  }

  async close(): Promise<void> {
    this.closed = true;
    const { client, handle, pageId, tmpDir } = this;
    this.client = undefined;
    this.handle = undefined;
    this.pageId = undefined;
    this.tmpDir = undefined;
    client?.close();
    if (handle && pageId) await closePageTarget(handle.port, pageId);
    if (handle) {
      try {
        handle.proc.kill();
      } catch {
        // ignore
      }
      // Chrome flushes its profile while shutting down; removing the profile
      // before it exits leaves a half-written temp dir behind on every run.
      await Promise.race([handle.proc.exited, new Promise((r) => setTimeout(r, 3000))]);
    }
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Time kept back from the per-width walk budgets for the reduced-motion pass
// and teardown, and the rough cost of loading a width plus its static rules.
const AUDIT_RESERVE_MS = 8000;
const WIDTH_OVERHEAD_MS = 2500;
const MIN_WALK_BUDGET_MS = 1500;

export async function runAudit(
  url: string,
  opts: { widths?: number[]; chromePath?: string; timeoutMs?: number; webgl?: boolean } = {},
): Promise<AuditReport> {
  const widths = normalizeWidths(opts.widths) ?? DEFAULT_WIDTHS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const webgl = opts.webgl ?? true;

  const chromePath = resolveChromePath(opts.chromePath);
  if (!chromePath) {
    return { status: "SKIPPED", reason: "no Chrome found", widths, violations: [] };
  }

  const began = Date.now();
  const session = new BrowserSession();
  const violations: Violation[] = [];
  const notes: string[] = [];
  let current: { width: number; live: { walk?: WalkResult } } | undefined;

  try {
    return await withTimeout(timeoutMs, async (signal) => {
      const client = await session.open(chromePath, "jal-audit-", webgl);
      for (let i = 0; i < widths.length; i++) {
        const width = widths[i];
        // Share what is left of the timeout fairly between the widths still to go.
        const left = timeoutMs - (Date.now() - began) - AUDIT_RESERVE_MS;
        const budgetMs = Math.max(MIN_WALK_BUDGET_MS, Math.min(WALK_BUDGET_MS, left / (widths.length - i) - WIDTH_OVERHEAD_MS));
        current = { width, live: {} };
        const walk = await auditAtWidth(client, url, width, {
          budgetMs,
          webgl,
          signal,
          live: current.live,
          sink: (v) => violations.push({ ...v, width }),
        });
        current = undefined;
        if (walk.truncated) {
          const last = walk.steps.at(-1)?.scrollY ?? 0;
          notes.push(`scroll walk at ${width}px stopped at scrollY ${last} of ${walk.maxScroll} (time budget ${Math.round(budgetMs / 1000)}s); content below was not checked for stuck-reveal, blank-viewport, or dead-space`);
        }
      }
      // One reduced-motion pass at the widest requested width.
      throwIfAborted(signal);
      const rmWidth = Math.max(...widths);
      for (const v of await auditReducedMotion(client, url, rmWidth)) violations.push({ ...v, width: rmWidth });
      if (!webgl) notes.push("rendered without WebGL: a 3D page may render differently than in a real browser");

      const deduped = dedupe(violations);
      const report: AuditReport = { status: deduped.length > 0 ? "FAIL" : "PASS", widths, violations: deduped };
      if (notes.length) report.notes = notes;
      return report;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Keep what the walk of the interrupted width had already seen.
    if (current?.live.walk) {
      const width = current.width;
      for (const v of walkViolations(current.live.walk, { webgl })) violations.push({ ...v, width });
    }
    const deduped = dedupe(violations);
    if (deduped.length === 0) return { status: "SKIPPED", reason: message, widths, violations: [] };
    const where = current ? `during the ${current.width}px pass; the scroll walk was cut short` : "before every check finished";
    return {
      status: "FAIL",
      reason: `${message} ${where}; returning the ${deduped.length} violations found so far`,
      widths,
      violations: deduped,
      notes: [...notes, "partial result: audit did not finish"],
    };
  } finally {
    await session.close();
  }
}

// ui_shots: real screenshots through the real scroller, one JPEG per screen
// per width, so an agent can Read what a person would actually see.
export type ShotFile = { width: number; index: number; scrollY: number; path: string };
export type ShotsReport = {
  // PARTIAL: the run failed or timed out after writing some screens; files lists them.
  status: "OK" | "PARTIAL" | "SKIPPED";
  reason?: string;
  out_dir: string;
  scroller: string;
  totalHeight: number;
  files: ShotFile[];
  perWidth: Array<{ width: number; height: number; scroller: string; totalHeight: number; screens: number }>;
};

const DEFAULT_SHOT_WIDTHS = [375, 1280];
const DEFAULT_MAX_SCREENS = 12;
const SHOT_LOAD_WAIT_MS = 4000;
const SHOT_FILE_RE = /^\d+-\d+\.jpg$/;

// A phone is taller than it is wide; desktop screens are shorter.
export function shotHeight(width: number): number {
  if (width < 768) return 812;
  if (width < 1024) return 1024;
  return 800;
}

// SwiftShader reads as a software GPU, so the scene module's tier probe
// (templates/modules/scene) would serve the poster. Critic evidence needs the
// live scene, so WebGL shots ask for the full tier unless the caller set one.
export function shotUrl(url: string, webgl: boolean): string {
  if (!webgl) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("scene-tier")) u.searchParams.set("scene-tier", "full");
    return u.toString();
  } catch {
    return url;
  }
}

export async function runShots(
  url: string,
  opts: {
    widths?: number[];
    outDir?: string;
    webgl?: boolean;
    maxScreens?: number;
    chromePath?: string;
    timeoutMs?: number;
    loadWaitMs?: number;
  } = {},
): Promise<ShotsReport> {
  const widths = normalizeWidths(opts.widths) ?? DEFAULT_SHOT_WIDTHS;
  const outDir = resolveOutDir(opts.outDir);
  const maxScreens = normalizeMaxScreens(opts.maxScreens) ?? DEFAULT_MAX_SCREENS;
  const loadWaitMs = opts.loadWaitMs ?? SHOT_LOAD_WAIT_MS;
  const report: ShotsReport = { status: "OK", out_dir: outDir, scroller: "", totalHeight: 0, files: [], perWidth: [] };

  const chromePath = resolveChromePath(opts.chromePath);
  if (!chromePath) return { ...report, status: "SKIPPED", reason: "no Chrome found" };

  const session = new BrowserSession();
  try {
    return await withTimeout(opts.timeoutMs ?? 180000, async (signal) => {
      await mkdir(outDir, { recursive: true });
      // Drop every earlier run's shots, any width, so stale screens never mislead.
      for (const name of await readdir(outDir)) {
        if (SHOT_FILE_RE.test(name)) await unlink(join(outDir, name)).catch(() => {});
      }
      const c = await session.open(chromePath, "jal-shots-", opts.webgl ?? true);
      for (const width of widths) {
        throwIfAborted(signal);
        const height = shotHeight(width);
        await c.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
        const loaded = c.waitForEvent("Page.loadEventFired", 25000);
        await c.send("Page.navigate", { url: shotUrl(url, opts.webgl ?? true) });
        await loaded;
        await new Promise((r) => setTimeout(r, loadWaitMs)); // 3D scenes and canvases need a moment to draw
        let count = 0;
        const walk = await walkScroller(c, {
          probe: false,
          maxSteps: maxScreens,
          signal,
          onStep: async (step) => {
            const shot = await c.send<{ data: string }>("Page.captureScreenshot", { format: "jpeg", quality: 75 });
            throwIfAborted(signal);
            const index = step.index + 1;
            const path = join(outDir, `${width}-${String(index).padStart(2, "0")}.jpg`);
            await writeFile(path, Buffer.from(shot.data, "base64"));
            report.files.push({ width, index, scrollY: step.scrollY, path });
            count++;
          },
        });
        report.perWidth.push({ width, height, scroller: walk.scroller, totalHeight: walk.totalHeight, screens: count });
        if (!report.scroller) {
          report.scroller = walk.scroller;
          report.totalHeight = walk.totalHeight;
        }
      }
      return report;
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // The JPEGs already written are real; list them rather than claim none.
    return { ...report, files: [...report.files], status: report.files.length ? "PARTIAL" : "SKIPPED", reason };
  } finally {
    await session.close();
  }
}
