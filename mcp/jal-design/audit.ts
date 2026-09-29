// Zero-dependency Chrome DevTools Protocol UI audit driver.
// Bun built-ins only: Bun.spawn, native WebSocket, fetch, node:fs/os/path compat.
// No puppeteer, no playwright, no npm deps.
//
// 22 rules. 19 static rules run once per width on the loaded page, reduced-motion
// runs once at the widest width, and two come from a scroll walk through the
// page's real scroller (document or an app-shell inner scroller):
//   stuck-reveal    content still invisible after it was scrolled into view
//   blank-viewport  a whole screen where under 10% of a 6x8 grid hits content
// runShots (ui_shots) reuses the same walk to save one JPEG per screen.

import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export type Violation = { rule: string; width: number; selector: string; detail: string };
export type AuditReport = {
  status: "PASS" | "FAIL" | "SKIPPED";
  reason?: string;
  widths: number[];
  violations: Violation[];
};

const DEFAULT_WIDTHS = [320, 375, 414, 768, 1280];
const DEFAULT_TIMEOUT_MS = 180000; // five widths, each with a scroll walk of up to 30 settled steps

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

export function withTimeout<T>(ms: number, run: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`audit timed out after ${ms}ms`)), ms);
    run().then(
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
    await fetch(`http://127.0.0.1:${port}/json/close/${id}`);
  } catch {
    // best effort
  }
}

type PendingEntry = { resolve: (v: unknown) => void; reject: (e: unknown) => void };
type EventWaiter = { method: string; resolve: (v: unknown) => void };

export class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, PendingEntry>();
  private eventWaiters: EventWaiter[] = [];

  private constructor(ws: WebSocket) {
    this.ws = ws;
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

  send<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  waitForEvent<T = any>(method: string, timeoutMs = 20000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.eventWaiters.findIndex((w) => w.resolve === wrapped);
        if (idx !== -1) this.eventWaiters.splice(idx, 1);
        reject(new Error(`timeout waiting for ${method}`));
      }, timeoutMs);
      const wrapped = (params: unknown) => {
        clearTimeout(timer);
        resolve(params as T);
      };
      this.eventWaiters.push({ method, resolve: wrapped });
    });
  }

  close(): void {
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
    "card-row-mismatch": 1, "card-empty-band": 1
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

  // light-background
  (function checkBackground() {
    var body = document.body;
    var main = document.querySelector("main") || document.querySelector("[role=main]") || body;
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
      var rects = controls.map(function (c) { return c.getBoundingClientRect(); });
      var heights = rects.map(function (r) { return r.height; });
      var tops = rects.map(function (r) { return r.top; });
      var maxH = Math.max.apply(null, heights), minH = Math.min.apply(null, heights);
      var maxT = Math.max.apply(null, tops), minT = Math.min.apply(null, tops);
      if (maxH - minH > 0.5 || maxT - minT > 0.5) {
        pushV("form-row-mismatch", key, "heights=[" + heights.map(function (h) { return h.toFixed(1); }).join(",") + "] tops=[" + tops.map(function (t) { return t.toFixed(1); }).join(",") + "]");
      }
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
      for (var i = 0; i < kids.length; i++) {
        for (var j = i + 1; j < kids.length; j++) {
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

  return violations;
})()
`;

type RawViolation = { rule: string; selector: string; detail: string };

// Scroll walk: finds the element that really scrolls (the document, or an
// app-shell inner scroller such as main.shell-main) and steps through it one
// viewport at a time with real scroll events, so scroll-triggered reveals get
// the same chance to fire they would get from a person scrolling. At each
// step it can probe for content still hidden in the middle of the screen
// (stuck-reveal) and for screens with almost nothing on them (blank-viewport).
// Installed once per page as window.__jalWalk.
const WALK_SCRIPT = `
(function () {
  if (window.__jalWalk) return true;
  ${CSS_PATH_FN}

  var MEDIA_SEL = "img, video, canvas, svg, button, input, select, textarea";
  var SKIP_SEL = "[aria-hidden=true], [data-jal-exempt~=noyzzi], [inert], [hidden], [popover], [data-overlay], [role=dialog], [role=alertdialog], [role=menu], [role=listbox], [role=tooltip]";
  var SECTION_SEL = "section, article, [role=region], header, footer, aside";
  var LANDMARK_SEL = SECTION_SEL + ", main, [role=main]";
  var doc = document.scrollingElement || document.documentElement;
  var scroller = null;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function vp() {
    var vv = window.visualViewport;
    return { w: vv ? vv.width : window.innerWidth, h: vv ? vv.height : window.innerHeight };
  }
  function isDoc() { return scroller === doc; }

  function findScroller() {
    var v = vp();
    if (doc.scrollHeight - doc.clientHeight > v.h * 0.5) return doc;
    var best = null, bestArea = 0;
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el === doc) continue;
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      var oy = getComputedStyle(el).overflowY;
      if (oy !== "auto" && oy !== "scroll") continue;
      var area = el.clientWidth * el.clientHeight;
      if (area > bestArea) { best = el; bestArea = area; }
    }
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
    return { texts: texts, media: media, els: els };
  }

  function stuckCandidates(reg, c) {
    var h = reg.bottom - reg.top;
    var bandTop = reg.top + h * 0.2, bandBottom = reg.bottom - h * 0.2;
    var out = [];
    c.els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      if (r.bottom <= bandTop || r.top >= bandBottom) return;
      if (r.right <= reg.left || r.left >= reg.right) return;
      if (el.closest(SKIP_SEL) || el.closest("dialog:not([open])")) return;
      if (!hiddenState(el).hidden) return;
      var hider = hidingNode(el);
      if (hider) {
        var pos = getComputedStyle(hider).position;
        // An absolutely placed layer at opacity 0 is a hover or focus overlay, not a reveal.
        if (pos === "absolute" || pos === "fixed") return;
      }
      out.push(el);
    });
    return out;
  }

  function inside(r, x, y, pad) {
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  function blankProbe(reg, c) {
    var s = sampleRegion(reg);
    var w = s.right - s.left, h = s.bottom - s.top;
    if (w < 100 || h < 100) return null;
    var mediaRects = [];
    c.media.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      if (r.bottom <= s.top || r.top >= s.bottom || r.right <= s.left || r.left >= s.right) return;
      var st = hiddenState(el);
      if (st.hidden) return;
      mediaRects.push(r);
    });
    var textRects = [];
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
        if (r.width > 0 && r.height > 0) textRects.push({ r: r, p: t.p });
      });
    });
    var cols = 6, rows = 8, hits = 0;
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var x = s.left + (i + 0.5) * (w / cols);
        var y = s.top + (j + 0.5) * (h / rows);
        var ok = false;
        for (var m = 0; m < mediaRects.length && !ok; m++) if (inside(mediaRects[m], x, y, 0)) ok = true;
        if (!ok) {
          var hit = document.elementFromPoint(x, y);
          if (hit) {
            for (var k = 0; k < textRects.length && !ok; k++) {
              var t = textRects[k];
              if (inside(t.r, x, y, 24) && (hit === t.p || hit.contains(t.p) || t.p.contains(hit))) ok = true;
            }
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

  window.__jalWalk = {
    init: function () { scroller = findScroller(); return info(); },
    top: function () { return go(0); },
    step: async function (y, settleMs, recheckMs, probe) {
      var at = go(y);
      await sleep(settleMs);
      at = info();
      if (!probe) return { at: at };
      var reg = region();
      var c = collect();
      var suspects = stuckCandidates(reg, c);
      if (suspects.length) await sleep(recheckMs);
      var hidden = [];
      var sections = new Set();
      suspects.forEach(function (el) {
        var st = hiddenState(el);
        if (!st.hidden) return;
        var sec = el.closest(LANDMARK_SEL) || hidingNode(el) || el;
        var key = cssPathRaw(sec);
        if (sections.has(key)) return;
        sections.add(key);
        hidden.push({ section: key, el: cssPathRaw(el), opacity: st.op, visibility: st.vis });
      });
      return { at: info(), hidden: hidden, blank: blankProbe(reg, collect()) };
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
};
export type WalkResult = { scroller: string; totalHeight: number; viewportHeight: number; steps: WalkStep[] };
type WalkInfo = { scroller: string; scrollHeight: number; clientHeight: number; max: number; scrollY: number };

export const WALK_SETTLE_MS = 700;
export const WALK_MAX_STEPS = 30;
const WALK_RECHECK_MS = 800;
const WALK_BUDGET_MS = 45000;

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

// Walk the page's real scroller top to bottom, one viewport per step, then
// return to the top. onStep runs after each step settles (screenshots).
export async function walkScroller(
  client: CdpClient,
  opts: { probe?: boolean; settleMs?: number; maxSteps?: number; budgetMs?: number; onStep?: (step: WalkStep) => Promise<void> } = {},
): Promise<WalkResult> {
  const settleMs = opts.settleMs ?? WALK_SETTLE_MS;
  const maxSteps = opts.maxSteps ?? WALK_MAX_STEPS;
  const budgetMs = opts.budgetMs ?? WALK_BUDGET_MS;
  const probe = opts.probe ?? true;
  await evalValue<boolean>(client, WALK_SCRIPT);
  const start = await evalValue<WalkInfo>(client, "window.__jalWalk.init()");
  const steps: WalkStep[] = [];
  const began = Date.now();
  let target = 0;
  let prev = -1;
  let info = start;
  while (steps.length < maxSteps) {
    const res = await evalValue<{ at: WalkInfo; hidden?: WalkHidden[]; blank?: WalkStep["blank"] }>(
      client,
      `window.__jalWalk.step(${target}, ${settleMs}, ${WALK_RECHECK_MS}, ${probe})`,
    );
    info = res.at;
    const y = info.scrollY;
    if (steps.length > 0 && y <= prev + 1) break; // the scroller will not move further
    const step: WalkStep = {
      index: steps.length,
      scrollY: Math.round(y),
      partial: steps.length > 0 && y - prev < info.clientHeight - 1,
      hidden: res.hidden,
      blank: res.blank,
    };
    steps.push(step);
    if (opts.onStep) await opts.onStep(step);
    prev = y;
    if (y >= info.max - 1 || Date.now() - began > budgetMs) break;
    target = Math.min(y + info.clientHeight, info.max);
  }
  await evalValue<WalkInfo>(client, "window.__jalWalk.top()");
  return { scroller: start.scroller, totalHeight: info.scrollHeight, viewportHeight: info.clientHeight, steps };
}

// stuck-reveal + blank-viewport, derived from one probed walk.
export function walkViolations(walk: WalkResult): RawViolation[] {
  const out: RawViolation[] = [];
  const seen = new Set<string>();
  for (const s of walk.steps) {
    for (const h of s.hidden ?? []) {
      if (seen.has(h.section)) continue;
      seen.add(h.section);
      const why = `opacity ${h.opacity.toFixed(2)}${h.visibility ? ", visibility hidden" : ""}`;
      out.push({
        rule: "stuck-reveal",
        selector: h.section,
        detail: `content still hidden after scrolling into view (${why}): a scroll-triggered reveal likely watches the wrong scroller (page scrolls in ${walk.scroller}); first hidden element ${h.el} at scrollY ${s.scrollY}`,
      });
    }
    const b = s.blank;
    if (b && !s.partial && b.hits / b.samples < 0.1) {
      out.push({
        rule: "blank-viewport",
        selector: b.landmark,
        detail: `screen at scrollY ${s.scrollY} is empty (${b.hits} of ${b.samples} samples hit content) in scroller ${walk.scroller}`,
      });
    }
  }
  return out;
}

async function auditAtWidth(client: CdpClient, url: string, width: number): Promise<RawViolation[]> {
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
  const violations = result.result.value ?? [];
  // Walk the real scroller last so reveals it triggers never touch the static rules.
  const walk = await walkScroller(client, { probe: true });
  return violations.concat(walkViolations(walk));
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

export async function runAudit(
  url: string,
  opts: { widths?: number[]; chromePath?: string; timeoutMs?: number } = {},
): Promise<AuditReport> {
  const widths = opts.widths ?? DEFAULT_WIDTHS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const chromePath = resolveChromePath(opts.chromePath);
  if (!chromePath) {
    return { status: "SKIPPED", reason: "no Chrome found", widths, violations: [] };
  }

  let tmpDir: string | undefined;
  let handle: ChromeHandle | undefined;
  let client: CdpClient | undefined;
  let pageId: string | undefined;

  try {
    return await withTimeout(timeoutMs, async () => {
      const dir = await mkdtemp(join(tmpdir(), "jal-audit-"));
      tmpDir = dir;
      handle = await launchChrome(chromePath, dir);
      const page = await createPageTarget(handle.port);
      pageId = page.id;
      client = await CdpClient.connect(page.webSocketDebuggerUrl);
      await client.send("Page.enable");
      await client.send("Runtime.enable");

      const violations: Violation[] = [];
      for (const width of widths) {
        const raw = await auditAtWidth(client, url, width);
        for (const v of raw) violations.push({ ...v, width });
      }
      // One reduced-motion pass at the widest requested width.
      const rmWidth = Math.max(...widths);
      for (const v of await auditReducedMotion(client, url, rmWidth)) violations.push({ ...v, width: rmWidth });

      const deduped = dedupe(violations);
      return {
        status: deduped.length > 0 ? "FAIL" : "PASS",
        widths,
        violations: deduped,
      } satisfies AuditReport;
    });
  } catch (err) {
    return {
      status: "SKIPPED",
      reason: err instanceof Error ? err.message : String(err),
      widths,
      violations: [],
    };
  } finally {
    client?.close();
    if (handle && pageId) {
      await closePageTarget(handle.port, pageId);
    }
    try {
      handle?.proc.kill();
    } catch {
      // ignore
    }
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

// ui_shots: real screenshots through the real scroller, one JPEG per screen
// per width, so an agent can Read what a person would actually see.
export type ShotFile = { width: number; index: number; scrollY: number; path: string };
export type ShotsReport = {
  status: "OK" | "SKIPPED";
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

// A phone is taller than it is wide; desktop screens are shorter.
export function shotHeight(width: number): number {
  if (width < 768) return 812;
  if (width < 1024) return 1024;
  return 800;
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
  const widths = opts.widths && opts.widths.length ? opts.widths : DEFAULT_SHOT_WIDTHS;
  const outDir = resolve(process.cwd(), opts.outDir ?? join(".jal", "shots"));
  const maxScreens = Math.max(1, Math.min(WALK_MAX_STEPS, Math.floor(opts.maxScreens ?? DEFAULT_MAX_SCREENS)));
  const loadWaitMs = opts.loadWaitMs ?? SHOT_LOAD_WAIT_MS;
  const empty: ShotsReport = { status: "SKIPPED", out_dir: outDir, scroller: "", totalHeight: 0, files: [], perWidth: [] };

  const chromePath = resolveChromePath(opts.chromePath);
  if (!chromePath) return { ...empty, reason: "no Chrome found" };

  let tmpDir: string | undefined;
  let handle: ChromeHandle | undefined;
  let client: CdpClient | undefined;
  let pageId: string | undefined;

  try {
    return await withTimeout(opts.timeoutMs ?? 180000, async () => {
      await mkdir(outDir, { recursive: true });
      const dir = await mkdtemp(join(tmpdir(), "jal-shots-"));
      tmpDir = dir;
      handle = await launchChrome(chromePath, dir, { webgl: opts.webgl ?? true });
      const page = await createPageTarget(handle.port);
      pageId = page.id;
      client = await CdpClient.connect(page.webSocketDebuggerUrl);
      await client.send("Page.enable");
      await client.send("Runtime.enable");

      const report: ShotsReport = { status: "OK", out_dir: outDir, scroller: "", totalHeight: 0, files: [], perWidth: [] };
      for (const width of widths) {
        // Drop this width's shots from an earlier run so stale screens never mislead.
        for (const name of await readdir(outDir)) {
          if (new RegExp(`^${width}-\\d+\\.jpg$`).test(name)) await unlink(join(outDir, name)).catch(() => {});
        }
        const height = shotHeight(width);
        const c = client!;
        await c.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
        const loaded = c.waitForEvent("Page.loadEventFired", 25000);
        await c.send("Page.navigate", { url });
        await loaded;
        await new Promise((r) => setTimeout(r, loadWaitMs)); // 3D scenes and canvases need a moment to draw
        let count = 0;
        const walk = await walkScroller(c, {
          probe: false,
          maxSteps: maxScreens,
          onStep: async (step) => {
            const shot = await c.send<{ data: string }>("Page.captureScreenshot", { format: "jpeg", quality: 75 });
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
    return { ...empty, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    client?.close();
    if (handle && pageId) await closePageTarget(handle.port, pageId);
    try {
      handle?.proc.kill();
    } catch {
      // ignore
    }
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
