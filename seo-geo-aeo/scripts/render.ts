#!/usr/bin/env bun
// render.ts <url...> [--wait ms] [--sample ms] [--config path]
// Rendered-text hygiene (GEO-09) with the JAL zero-dependency CDP driver:
// prefers-reduced-motion emulated, a realistic wait for intro animations, then
// joined words in h1 and h2 (/[a-z][A-Z]/ joins across split spans), joined
// flex or grid siblings, marquee noise, forbidden phrases and count-ups caught
// mid-animation. Read-only. SKIPPED when Chrome is missing, like ui_audit.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  CdpClient, closePageTarget, createPageTarget, launchChrome, resolveChromePath, withTimeout, type ChromeHandle,
} from "../../mcp/jal-design/audit.ts";
import { emitError, emitJson, resolveDeps, type Deps } from "./lib/cli.ts";
import { findSite, loadConfig, loadForbidden, matchForbidden, type ForbiddenPattern } from "./lib/config.ts";
import { finding, type Finding } from "./lib/findings.ts";
import { allowlistFromConfig, type Allowlist } from "./lib/http.ts";
import { Redactor } from "./lib/redact.ts";

export type RenderRule = "joined-heading" | "flex-join" | "marquee" | "forbidden-phrase" | "count-up" | "load-error";
export type RenderFlag = { rule: RenderRule; selector: string; detail: string };
export type RenderPage = { url: string; flags: RenderFlag[]; h1: string; h2: string[] };
export type RenderReport = {
  tool: "render";
  status: "PASS" | "FAIL" | "SKIPPED";
  reason?: string;
  pages: RenderPage[];
  findings: Finding[];
};

export const DEFAULT_WAIT_MS = 3000;
export const DEFAULT_SAMPLE_MS = 800;

// Injected with Runtime.evaluate. Plain ES5, no backticks, stands alone in the page.
const COLLECT_SCRIPT = `
(function () {
  function path(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + el.id;
    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      if (node.id) { parts.unshift("#" + node.id); break; }
      var part = node.tagName.toLowerCase();
      if (node.classList && node.classList.length) part += "." + node.classList[0];
      var parent = node.parentElement;
      if (parent) {
        var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === node.tagName; });
        if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(node) + 1) + ")";
      }
      parts.unshift(part);
      node = parent;
      depth++;
    }
    return parts.join(" > ");
  }
  function hidden(el) {
    while (el && el.nodeType === 1) {
      var cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return true;
      el = el.parentElement;
    }
    return false;
  }
  function textNodes(root) {
    var out = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      var p = n.parentElement;
      if (!p || p.closest("script,style,noscript,template")) continue;
      out.push(n);
    }
    return out;
  }
  var LETTER = /[A-Za-z0-9\\u00C0-\\u024F]/;
  function joins(root) {
    var nodes = textNodes(root);
    var found = [];
    for (var i = 1; i < nodes.length; i++) {
      var a = nodes[i - 1].nodeValue, b = nodes[i].nodeValue;
      if (!a || !b) continue;
      var last = a.charAt(a.length - 1), first = b.charAt(0);
      if (/\\s/.test(last) || /\\s/.test(first)) continue;
      var pa = nodes[i - 1].parentElement, pb = nodes[i].parentElement;
      if (pa === pb) continue;
      var boxed = getComputedStyle(pa).display !== "inline" || getComputedStyle(pb).display !== "inline";
      if ((/[a-z]/.test(last) && /[A-Z]/.test(first)) || (boxed && LETTER.test(last) && LETTER.test(first))) {
        var left = a.trim().split(/\\s+/).pop(), right = b.trim().split(/\\s+/)[0];
        found.push(left + right);
      }
    }
    return found;
  }
  var out = { joins: [], flexJoins: [], marquees: [], counters: [], h1: "", h2: [], body: "", ld: [] };
  var h1 = document.querySelector("h1");
  out.h1 = h1 ? h1.textContent : "";
  Array.prototype.forEach.call(document.querySelectorAll("h1, h2"), function (h) {
    if (h.tagName === "H2") out.h2.push(h.textContent || "");
    if (hidden(h)) return;
    var j = joins(h);
    if (j.length) out.joins.push({ selector: path(h), tag: h.tagName.toLowerCase(), text: (h.textContent || "").slice(0, 80), words: j });
  });
  Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
    if (el.closest("h1, h2")) return;
    var cs = getComputedStyle(el);
    if (!/flex|grid/.test(cs.display) || hidden(el)) return;
    var kids = el.children;
    for (var i = 1; i < kids.length; i++) {
      var prev = kids[i - 1], next = kids[i];
      var between = prev.nextSibling;
      var spaced = false;
      while (between && between !== next) {
        if (between.nodeType === 3 && /\\s/.test(between.nodeValue)) spaced = true;
        between = between.nextSibling;
      }
      if (spaced) continue;
      var a = prev.textContent || "", b = next.textContent || "";
      if (!a || !b || /\\s$/.test(a) || /^\\s/.test(b)) continue;
      if (LETTER.test(a.charAt(a.length - 1)) && LETTER.test(b.charAt(0))) {
        out.flexJoins.push({ selector: path(el), words: a.trim().split(/\\s+/).pop() + b.trim().split(/\\s+/)[0] });
      }
    }
  });
  var seen = [];
  Array.prototype.forEach.call(document.querySelectorAll("marquee, [class*=marquee], [data-marquee], [class*=ticker]"), function (el) {
    for (var i = 0; i < seen.length; i++) if (seen[i].contains(el)) return;
    seen.push(el);
    var t = (el.textContent || "").replace(/\\s+/g, " ").trim();
    if (t) out.marquees.push({ selector: path(el), text: t.slice(0, 120) });
  });
  var ATTRS = ["data-target", "data-count", "data-countup", "data-to", "data-end"];
  Array.prototype.forEach.call(document.querySelectorAll("body *"), function (el) {
    if (el.children.length > 0) return;
    var text = (el.textContent || "").trim();
    var target = null;
    for (var i = 0; i < ATTRS.length; i++) if (el.hasAttribute(ATTRS[i])) { target = el.getAttribute(ATTRS[i]); break; }
    var numeric = /^[+\\-]?[\\d.,]+\\s*[%+kKmM]?$/.test(text) && text.length <= 16;
    if (target === null && !numeric) return;
    out.counters.push({ selector: path(el), text: text, target: target });
  });
  out.body = document.body ? document.body.textContent || "" : "";
  Array.prototype.forEach.call(document.querySelectorAll('script[type="application/ld+json"]'), function (s) { out.ld.push(s.textContent || ""); });
  out.title = document.title;
  return out;
})()
`;

type Collected = {
  joins: Array<{ selector: string; tag: string; text: string; words: string[] }>;
  flexJoins: Array<{ selector: string; words: string }>;
  marquees: Array<{ selector: string; text: string }>;
  counters: Array<{ selector: string; text: string; target: string | null }>;
  h1: string;
  h2: string[];
  body: string;
  ld: string[];
  title: string;
};

const digits = (s: string) => s.replace(/\D+/g, "");

/** Pure analysis of two samples taken sampleMs apart. Exported for tests. */
export function analyse(first: Collected, second: Collected, forbidden: ForbiddenPattern[]): RenderFlag[] {
  const flags: RenderFlag[] = [];
  for (const j of second.joins) flags.push({ rule: "joined-heading", selector: j.selector, detail: `${j.tag} "${j.text}" joins ${j.words.join(", ")} in its text` });
  for (const j of second.flexJoins.slice(0, 20)) flags.push({ rule: "flex-join", selector: j.selector, detail: `flex or grid siblings join "${j.words}" in the text` });
  for (const m of second.marquees) flags.push({ rule: "marquee", selector: m.selector, detail: `marquee words are in the text: "${m.text.slice(0, 80)}"` });
  const before = new Map(first.counters.map((c) => [c.selector, c]));
  const counted = new Set<string>();
  for (const c of second.counters) {
    const prev = before.get(c.selector);
    if (prev && prev.text !== c.text && digits(prev.text) !== digits(c.text)) {
      flags.push({ rule: "count-up", selector: c.selector, detail: `number still animating: "${prev.text}" then "${c.text}"${c.target ? ` (target ${c.target})` : ""}` });
      counted.add(c.selector);
      continue;
    }
    if (c.target !== null && digits(c.target) && digits(c.text) !== digits(c.target) && !counted.has(c.selector)) {
      flags.push({ rule: "count-up", selector: c.selector, detail: `count-up shows "${c.text}" instead of ${c.target}` });
    }
  }
  const text = [second.title, second.body, ...second.ld].join("\n");
  for (const h of matchForbidden(text, forbidden)) flags.push({ rule: "forbidden-phrase", selector: "body", detail: `"${h.match}" matches the forbidden claim ${h.source}` });
  return flags;
}

export type RenderOptions = {
  chromePath?: string;
  waitMs?: number;
  sampleMs?: number;
  timeoutMs?: number;
  forbidden?: ForbiddenPattern[];
  allow?: Allowlist;
  redactor?: Redactor;
};

function geo09(pages: RenderPage[]): Finding {
  const flagged = pages.filter((p) => p.flags.length);
  if (flagged.length === 0) {
    return finding("GEO-09", "PASS", `rendered text of ${pages.length} pages has no joined words, marquee noise, mid-animation numbers or forbidden phrases (reduced motion emulated)`, undefined, "render");
  }
  const lines = flagged.flatMap((p) => p.flags.map((f) => `${new URL(p.url).pathname} ${f.rule}: ${f.detail}`));
  return finding(
    "GEO-09",
    "FAIL",
    lines.slice(0, 8).join("; ") + (lines.length > 8 ? `; and ${lines.length - 8} more` : ""),
    'put a real {" "} in each split span and between flex siblings, draw marquee words with content: attr(data-text), skip count-ups for bots and reduced motion',
    "render",
  );
}

export async function runRender(urls: string[], opts: RenderOptions = {}): Promise<RenderReport> {
  const redactor = opts.redactor ?? new Redactor();
  for (const u of urls) {
    if (opts.allow && !opts.allow.allows(u)) throw new Error(`refused: ${new URL(u).host} is not in the allowlist from .jal/seo-geo-aeo.json`);
  }
  const chromePath = resolveChromePath(opts.chromePath);
  if (!chromePath) return { tool: "render", status: "SKIPPED", reason: "no Chrome found (set CHROME_PATH)", pages: [], findings: [] };
  const waitMs = opts.waitMs ?? DEFAULT_WAIT_MS;
  const sampleMs = opts.sampleMs ?? DEFAULT_SAMPLE_MS;
  const timeoutMs = opts.timeoutMs ?? 30000 + urls.length * (waitMs + sampleMs + 15000);

  let tmp: string | undefined;
  let handle: ChromeHandle | undefined;
  let client: CdpClient | undefined;
  let pageId: string | undefined;
  try {
    return await withTimeout(timeoutMs, async () => {
      tmp = await mkdtemp(join(tmpdir(), "jal-seo-render-"));
      handle = await launchChrome(chromePath, tmp);
      const target = await createPageTarget(handle.port);
      pageId = target.id;
      client = await CdpClient.connect(target.webSocketDebuggerUrl);
      await client.send("Page.enable");
      await client.send("Runtime.enable");
      await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
      const pages: RenderPage[] = [];
      for (const url of urls) {
        const loaded = client.waitForEvent("Page.loadEventFired", 25000);
        const nav = await client.send<{ errorText?: string }>("Page.navigate", { url });
        if (nav.errorText) {
          pages.push({ url, h1: "", h2: [], flags: [{ rule: "load-error", selector: "page", detail: nav.errorText }] });
          continue;
        }
        await loaded;
        await Bun.sleep(waitMs);
        const evaluate = async () => {
          const r = await client!.send<{ result: { value?: Collected }; exceptionDetails?: { text: string } }>("Runtime.evaluate", { expression: COLLECT_SCRIPT, returnByValue: true });
          if (r.exceptionDetails) throw new Error(`render script error: ${r.exceptionDetails.text}`);
          return r.result.value!;
        };
        const first = await evaluate();
        await Bun.sleep(sampleMs);
        const second = await evaluate();
        pages.push({ url, h1: second.h1, h2: second.h2, flags: analyse(first, second, opts.forbidden ?? []) });
      }
      const report: RenderReport = {
        tool: "render",
        status: pages.some((p) => p.flags.length) ? "FAIL" : "PASS",
        pages,
        findings: [geo09(pages)],
      };
      return redactor.value(report);
    });
  } catch (err) {
    return { tool: "render", status: "SKIPPED", reason: redactor.error(err), pages: [], findings: [] };
  } finally {
    client?.close();
    if (handle && pageId) await closePageTarget(handle.port, pageId);
    try {
      handle?.proc.kill();
    } catch {
      // ignore
    }
    if (tmp) await rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = new Redactor(deps.env);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: { wait: { type: "string" }, sample: { type: "string" }, config: { type: "string" }, chrome: { type: "string" } },
      allowPositionals: true,
    });
    if (positionals.length === 0) throw new Error("usage: render.ts <url...> [--wait 3000]");
    const { config } = await loadConfig(deps.cwd, values.config);
    for (const u of positionals) findSite(config, u);
    const report = await runRender(positionals, {
      chromePath: values.chrome ?? deps.env.CHROME_PATH,
      waitMs: values.wait ? Number(values.wait) : undefined,
      sampleMs: values.sample ? Number(values.sample) : undefined,
      forbidden: await loadForbidden(config, deps.cwd),
      allow: allowlistFromConfig(config),
      redactor,
    });
    emitJson(deps, redactor, report);
    return report.status === "FAIL" ? 2 : 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
