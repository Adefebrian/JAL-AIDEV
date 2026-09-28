// noyzzi live fetch. Brian adopted noyzzi.com (effects, sections, 3D
// elements) as the core of JAL immersive builds. Rather than vendoring the
// catalogue, this opens the item's page in headless Chrome at build time and
// returns exactly what the site's own "Get Prompt" / "Open prompt panel" /
// "Copy this element's code" controls hand to a visitor.
// Zero dependencies: reuses the CDP driver from audit.ts.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CdpClient,
  closePageTarget,
  createPageTarget,
  launchChrome,
  resolveChromePath,
  withTimeout,
  type ChromeHandle,
} from "./audit";
import index from "./noyzzi-index.json";

export type NoyzziKind = "effect" | "section" | "element";
export type NoyzziItem = (typeof index.items)[number];
export type NoyzziResult =
  | { status: "OK"; kind: NoyzziKind; slug: string; name: string; url: string; via: "clipboard" | "panel"; text: string }
  | { status: "SKIPPED" | "ERROR"; kind: NoyzziKind; slug: string; url: string; reason: string };

const PATHS: Record<NoyzziKind, string> = { effect: "effects", section: "sections", element: "elements" };
const OPENERS: Record<NoyzziKind, string> = {
  effect: "get prompt",
  section: "open prompt panel",
  element: "copy this element.s code",
};

// True once the item's prompt/code control is in the DOM.
const READY = (kind: NoyzziKind) => `
(function () {
  var rx = new RegExp(${JSON.stringify(OPENERS[kind])}, "i");
  return Array.prototype.some.call(document.querySelectorAll("*"), function (e) {
    var own = e.children.length === 0 ? (e.textContent || "") : "";
    return rx.test((e.getAttribute("aria-label") || "") + " " + own);
  });
})()
`;

export function listNoyzzi(kind?: NoyzziKind): NoyzziItem[] {
  return kind ? index.items.filter((i) => i.kind === kind) : index.items;
}

export function noyzziUrl(kind: NoyzziKind, slug: string, base = "https://noyzzi.com"): string {
  return `${base.replace(/\/$/, "")}/${PATHS[kind]}/${slug}/`;
}

// Runs before any page script: record every clipboard write so "copy"
// controls hand their payload to us instead of the system clipboard.
const CLIPBOARD_HOOK = `
(function () {
  window.__jalClip = [];
  var push = function (t) { try { window.__jalClip.push(String(t)); } catch (e) {} return Promise.resolve(); };
  var fake = {
    writeText: push,
    write: function (items) {
      return Promise.all((items || []).map(function (it) {
        if (!it || !it.types || it.types.indexOf("text/plain") < 0) return null;
        return it.getType("text/plain").then(function (b) { return b.text(); }).then(push);
      }));
    },
    readText: function () { return Promise.resolve(""); }
  };
  try { Object.defineProperty(navigator, "clipboard", { value: fake, configurable: true }); } catch (e) {}
  var exec = document.execCommand ? document.execCommand.bind(document) : null;
  document.execCommand = function (cmd) {
    if (String(cmd).toLowerCase() === "copy") {
      var sel = window.getSelection && window.getSelection();
      var active = document.activeElement;
      var val = active && "value" in active ? active.value : sel ? String(sel) : "";
      if (val) push(val);
      return true;
    }
    return exec ? exec.apply(document, arguments) : false;
  };
})();
`;

// Opens the item's prompt or code in the page and reports what it found.
const EXTRACT = (kind: NoyzziKind) => `
(async function () {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function visible(el) {
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  }
  function label(el) { return ((el.getAttribute("aria-label") || "") + " " + (el.innerText || "")).trim(); }
  function clickFirst(re) {
    // Interactive elements first, then any short-labelled element (some
    // controls are plain divs with a click handler).
    var els = Array.prototype.slice.call(document.querySelectorAll("button, [role=button], a, [tabindex]"));
    var hit = els.filter(function (e) { return re.test(label(e)); });
    if (!hit.length) {
      hit = Array.prototype.slice.call(document.querySelectorAll("div, span, p")).filter(function (e) {
        var txt = (e.innerText || "").trim();
        return txt.length < 40 && re.test(txt) && !Array.prototype.some.call(e.children, function (c) { return re.test((c.innerText || "").trim()); });
      });
    }
    // Several copies of a control can exist (mobile and desktop variants);
    // click the largest visible one, measuring its visible text too.
    function area(e) {
      var r = e.getBoundingClientRect();
      var inner = Array.prototype.reduce.call(e.querySelectorAll("*"), function (m, c) {
        var cr = c.getBoundingClientRect();
        return Math.max(m, cr.width * cr.height);
      }, 0);
      return Math.min(r.width * r.height, inner || r.width * r.height);
    }
    var vis = hit.filter(visible).sort(function (a, b) { return area(b) - area(a); });
    var el = vis[0] || hit[0];
    if (el) { el.click(); return true; }
    return false;
  }
  // decline analytics cookies if the banner is up
  clickFirst(/^reject$/i);
  await sleep(300);
  var kind = ${JSON.stringify(kind)};
  var opener = new RegExp(${JSON.stringify(OPENERS[kind])}, "i");
  var opened = clickFirst(opener);
  function readPanel() {
    var best = "";
    Array.prototype.forEach.call(document.querySelectorAll("div, section, aside, pre, [role=dialog]"), function (el) {
      var cs = getComputedStyle(el);
      if (!(cs.overflowY === "auto" || cs.overflowY === "scroll" || el.tagName === "PRE" || el.getAttribute("role") === "dialog")) return;
      var t = el.innerText || "";
      if (t.length > best.length && /(Create|THREE|shader|Output)/.test(t)) best = t;
    });
    return best;
  }
  // Poll up to 8s: panels animate in and some controls copy asynchronously.
  var panel = "";
  var triedCopy = false;
  for (var i = 0; i < 16; i++) {
    await sleep(500);
    panel = readPanel();
    if (window.__jalClip.length > 0 && i >= 2) break;
    if (panel.length > 400 && i >= 3) {
      if (!triedCopy) { triedCopy = true; clickFirst(/^copy( prompt| code)?$/i) || clickFirst(/copy/i); continue; }
      break;
    }
    if (i === 6 && !panel && window.__jalClip.length === 0) clickFirst(opener);
  }
  var clip = window.__jalClip.slice().sort(function (a, b) { return b.length - a.length; })[0] || "";
  return { opened: opened, clip: clip, panel: panel, title: document.title };
})()
`;

export async function getNoyzzi(
  kind: NoyzziKind,
  slug: string,
  opts: { chromePath?: string; timeoutMs?: number; baseUrl?: string } = {},
): Promise<NoyzziResult> {
  const url = noyzziUrl(kind, slug, opts.baseUrl);
  const item = index.items.find((i) => i.kind === kind && i.slug === slug);
  const chromePath = resolveChromePath(opts.chromePath);
  if (!chromePath) return { status: "SKIPPED", kind, slug, url, reason: "no Chrome found" };

  let tmpDir: string | undefined;
  let handle: ChromeHandle | undefined;
  let client: CdpClient | undefined;
  let pageId: string | undefined;
  try {
    return await withTimeout(opts.timeoutMs ?? 45000, async () => {
      tmpDir = await mkdtemp(join(tmpdir(), "jal-noyzzi-"));
      handle = await launchChrome(chromePath, tmpDir, { webgl: true });
      const page = await createPageTarget(handle.port);
      pageId = page.id;
      client = await CdpClient.connect(page.webSocketDebuggerUrl);
      await client.send("Page.enable");
      await client.send("Runtime.enable");
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await client.send("Page.addScriptToEvaluateOnNewDocument", { source: CLIPBOARD_HOOK });
      // No load-event wait: WebGL pages keep streaming assets. Poll for the
      // item's control instead.
      await client.send("Page.navigate", { url });
      const deadline = Date.now() + 25000;
      for (;;) {
        const r = await client
          .send<{ result: { value?: boolean } }>("Runtime.evaluate", { expression: READY(kind), returnByValue: true })
          .catch(() => ({ result: { value: false } }));
        if (r.result.value) break;
        if (Date.now() > deadline) throw new Error("page never showed its prompt/code control");
        await Bun.sleep(500);
      }
      await Bun.sleep(1000);
      const res = await client.send<{ result: { value?: { opened: boolean; clip: string; panel: string; title: string } }; exceptionDetails?: { text: string } }>(
        "Runtime.evaluate",
        { expression: EXTRACT(kind), awaitPromise: true, returnByValue: true },
      );
      if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
      const v = res.result.value;
      if (!v) throw new Error("no result from page");
      const text = v.clip.length >= v.panel.length ? v.clip : v.panel;
      if (text.trim().length < 200) {
        return { status: "ERROR", kind, slug, url, reason: v.opened ? "control opened but no prompt or code text was found" : "prompt/code control not found on the page" } as NoyzziResult;
      }
      return { status: "OK", kind, slug, name: item?.name ?? v.title, url, via: v.clip.length >= v.panel.length ? "clipboard" : "panel", text: text.trim() } as NoyzziResult;
    });
  } catch (err) {
    return { status: "ERROR", kind, slug, url, reason: err instanceof Error ? err.message : String(err) };
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
