// Zero-dependency Chrome DevTools Protocol UI audit driver.
// Bun built-ins only: Bun.spawn, native WebSocket, fetch, node:fs/os/path compat.
// No puppeteer, no playwright, no npm deps.

import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Violation = { rule: string; width: number; selector: string; detail: string };
export type AuditReport = {
  status: "PASS" | "FAIL" | "SKIPPED";
  reason?: string;
  widths: number[];
  violations: Violation[];
};

const DEFAULT_WIDTHS = [320, 375, 414, 768, 1280];
const DEFAULT_TIMEOUT_MS = 60000;

const STANDARD_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

function resolveChromePath(explicit?: string): string | null {
  const configured = explicit ?? process.env.CHROME_PATH;
  if (configured) return configured;
  for (const candidate of STANDARD_CHROME_PATHS) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function withTimeout<T>(ms: number, run: () => Promise<T>): Promise<T> {
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

type ChromeHandle = { proc: ReturnType<typeof Bun.spawn>; port: number };

async function launchChrome(chromePath: string, userDataDir: string): Promise<ChromeHandle> {
  const proc = Bun.spawn({
    cmd: [
      chromePath,
      "--headless=new",
      "--disable-gpu",
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

async function createPageTarget(port: number): Promise<{ id: string; webSocketDebuggerUrl: string }> {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!res.ok) throw new Error(`failed to create page target: ${res.status}`);
  return (await res.json()) as { id: string; webSocketDebuggerUrl: string };
}

async function closePageTarget(port: number, id: string): Promise<void> {
  try {
    await fetch(`http://127.0.0.1:${port}/json/close/${id}`);
  } catch {
    // best effort
  }
}

type PendingEntry = { resolve: (v: unknown) => void; reject: (e: unknown) => void };
type EventWaiter = { method: string; resolve: (v: unknown) => void };

class CdpClient {
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

// Injected into the page via Runtime.evaluate. Plain ES5-ish JS, no backticks,
// no external references: it must stand alone inside the browser context.
const AUDIT_SCRIPT = `
(function () {
  var violations = [];

  function pushV(rule, selector, detail) {
    violations.push({ rule: rule, selector: selector, detail: detail });
  }

  function cssPath(el) {
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

  function isOverlayExcluded(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var role = node.getAttribute ? node.getAttribute("role") : null;
      if (role === "dialog" || role === "alertdialog" || role === "menu" || role === "listbox" || role === "tooltip") return true;
      if (node.hasAttribute && (node.hasAttribute("popover") || node.hasAttribute("data-overlay"))) return true;
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
  return result.result.value ?? [];
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
