#!/usr/bin/env bun
// audit.ts <url> [--pages /a,/b] [--lighthouse report.json ...] [--config path] [--max-pages n]
// Fetches the HTML and discovery files of a configured site and checks every
// automatic item of instruction section 5. Read-only. Output: JSON findings
// { id, status PASS|WARN|FAIL|N/A, evidence, fix, hint }.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";
import { emitError, emitJson, resolveDeps, type Deps } from "./lib/cli.ts";
import { findSite, loadConfig, loadForbidden, matchForbidden, type ForbiddenPattern, type SeoConfig, type SiteConfig } from "./lib/config.ts";
import { measureDensity, DENSITY_WARN_BELOW } from "./density.ts";
import { finding, worst, type Finding, type Status } from "./lib/findings.ts";
import {
  anchors, bodyHtml, collapse, decodeEntities, digitsOnly, findElements, findTags, hasNoindex, headHtml, htmlLang,
  isType, jsonLdBlocks, ldNodes, ldTypes, linkTags, meta, normText, pageTitle, pngSize, relIncludes, removeElements,
  textContent, visibleText, wordCount, type LdBlock, type LdNode,
} from "./lib/html.ts";
import { allowlistFromConfig, HostNotAllowedError, httpRequest, type Allowlist, type FetchLike, type Hop } from "./lib/http.ts";
import { classifyPath, isTrustKind, langOfPath, normPath, type PageKind } from "./lib/pages.ts";
import { Redactor, type Env } from "./lib/redact.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DISCOVERY_PATHS = {
  robots: "/robots.txt",
  sitemap: "/sitemap.xml",
  llms: "/llms.txt",
  llmsWellKnown: "/.well-known/llms.txt",
  llmsFull: "/llms-full.txt",
  aiTxt: "/.well-known/ai.txt",
  summary: "/ai/summary.json",
  faq: "/ai/faq.json",
  feed: "/feed.xml",
} as const;

// Directives Lighthouse's robots-txt audit accepts. Anything else (for
// example Content-Signal) fails that audit, so it fails SEO-01.
export const VALID_ROBOTS_DIRECTIVES = ["user-agent", "allow", "disallow", "sitemap", "crawl-delay", "clean-param", "host", "request-rate", "visit-time", "noindex"];

// Documented crawler user-agent names SEO-01 expects in the named group (section 12.1).
export const NAMED_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Googlebot", "bingbot"];

// Representative user agents for the GEO-01 block test. VERIFY each string
// against the vendor's crawler documentation before relying on an exact match.
export const CRAWLER_USER_AGENTS: Record<string, string> = {
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  "ChatGPT-User": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
  ClaudeBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "Claude-User": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  bingbot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36",
  Googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
};

const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness", "SportsActivityLocation", "SportsClub", "ExerciseGym", "HealthClub", "StadiumOrArena", "PublicSwimmingPool",
  "GolfCourse", "BowlingAlley", "SkiResort", "TennisComplex", "Restaurant", "CafeOrCoffeeShop", "Store", "EntertainmentBusiness",
  "EducationalOrganization", "ProfessionalService", "LodgingBusiness", "MedicalBusiness", "AutomotiveBusiness", "FoodEstablishment",
]);

const SOCIAL_OR_UTILITY = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|linkedin\.com|wa\.me|whatsapp\.com|t\.me|threads\.net|pinterest\.com|google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|wikidata\.org|wikipedia\.org|openstreetmap\.org|apple\.com)$/i;

const DEFAULT_ADMIN_MARKERS = ["AdminDashboard", "AdminLayout", "AdminPanel", "StaffConsole"];
const HASHED_FILE = /[.-](?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{8,}\.[a-z0-9]+$/i;
const CHALLENGE_MARKERS = /cf-chl|challenge-platform|captcha|attention required|access denied|just a moment/i;
const GENERIC_HEADINGS = /^(welcome|introduction|intro|overview|more|learn more|read more|our story|selamat datang|pengantar|lainnya|selengkapnya|home|beranda)$/i;
const NON_PAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|pdf|xml|txt|json|js|mjs|css|map|woff2?|ttf|mp4|webm|zip|webmanifest)$/i;

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export type Fetched = {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  text: string;
  bytes: Uint8Array;
  redirects: Hop[];
  error?: string;
  refused?: boolean;
};

type GetOpts = { ua?: string; manual?: boolean };

class Fetcher {
  private cache = new Map<string, Promise<Fetched>>();
  constructor(
    private allow: Allowlist,
    private fetchImpl: FetchLike | undefined,
    private redactor: Redactor,
    private timeoutMs: number,
    private sleep?: (ms: number) => Promise<void>,
  ) {}

  allows(url: string): boolean {
    return this.allow.allows(url);
  }

  get(url: string, opts: GetOpts = {}): Promise<Fetched> {
    const key = `${opts.manual ? "m" : "f"}|${opts.ua ?? ""}|${url}`;
    let p = this.cache.get(key);
    if (!p) {
      p = this.load(url, opts);
      this.cache.set(key, p);
    }
    return p;
  }

  private async load(url: string, opts: GetOpts): Promise<Fetched> {
    const empty = { url, finalUrl: url, status: 0, headers: {}, text: "", bytes: new Uint8Array(), redirects: [] as Hop[] };
    try {
      const headers: Record<string, string> = { "user-agent": opts.ua ?? "JAL-seo-geo-aeo-audit/1.0 (+https://jalgroup.id)" };
      const { res, url: finalUrl, redirects } = await httpRequest(url, { headers }, {
        allow: this.allow,
        fetchImpl: this.fetchImpl,
        redactor: this.redactor,
        timeoutMs: this.timeoutMs,
        followRedirects: !opts.manual,
        retries: 2,
        baseDelayMs: 300,
        sleep: this.sleep,
      });
      const bytes = new Uint8Array(await res.arrayBuffer());
      const h: Record<string, string> = {};
      res.headers.forEach((v, k) => (h[k.toLowerCase()] = v));
      return { url, finalUrl, status: res.status, headers: h, text: new TextDecoder().decode(bytes), bytes, redirects };
    } catch (err) {
      return { ...empty, error: this.redactor.error(err), refused: err instanceof HostNotAllowedError };
    }
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---------------------------------------------------------------------------
// Parsing: robots.txt and sitemap.xml
// ---------------------------------------------------------------------------

export type RobotsGroup = { agents: string[]; rules: Array<{ directive: string; value: string }> };
export type Robots = { groups: RobotsGroup[]; sitemaps: string[]; invalid: Array<{ line: number; text: string }> };

export function parseRobots(text: string): Robots {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  const invalid: Array<{ line: number; text: string }> = [];
  let current: RobotsGroup | null = null;
  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) return;
    const idx = line.indexOf(":");
    if (idx <= 0) {
      invalid.push({ line: i + 1, text: line });
      return;
    }
    const directive = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!VALID_ROBOTS_DIRECTIVES.includes(directive)) {
      invalid.push({ line: i + 1, text: line });
      return;
    }
    if (directive === "sitemap") {
      sitemaps.push(value);
      return;
    }
    if (directive === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value);
      return;
    }
    if (!current) {
      current = { agents: [], rules: [] };
      groups.push(current);
    }
    current.rules.push({ directive, value });
  });
  return { groups, sitemaps, invalid };
}

function groupFor(robots: Robots, agent: string): RobotsGroup | undefined {
  const a = agent.toLowerCase();
  return robots.groups.find((g) => g.agents.some((x) => x.toLowerCase() === a)) ?? robots.groups.find((g) => g.agents.includes("*"));
}

function blocksRoot(group: RobotsGroup | undefined): boolean {
  if (!group) return false;
  const disallowRoot = group.rules.some((r) => r.directive === "disallow" && r.value === "/");
  const allowRoot = group.rules.some((r) => r.directive === "allow" && r.value === "/");
  return disallowRoot && !allowRoot;
}

function disallows(group: RobotsGroup | undefined, path: string): boolean {
  if (!group) return false;
  return group.rules.some((r) => r.directive === "disallow" && r.value && r.value !== "/" && path.startsWith(r.value.replace(/\*$/, "")));
}

export type SitemapEntry = { loc: string; lastmod?: string; alternates: Array<{ hreflang: string; href: string }> };

export function parseSitemap(xml: string): { entries: SitemapEntry[]; children: string[] } {
  const entries: SitemapEntry[] = [];
  const children: string[] = [];
  const tagText = (block: string, name: string) => {
    const m = block.match(new RegExp(`<${name}>\\s*([\\s\\S]*?)\\s*</${name}>`, "i"));
    return m ? decodeEntities(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()) : undefined;
  };
  if (/<sitemapindex\b/i.test(xml)) {
    for (const m of xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/gi)) {
      const loc = tagText(m[1], "loc");
      if (loc) children.push(loc);
    }
  }
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const block = m[1];
    const loc = tagText(block, "loc");
    if (!loc) continue;
    const alternates = findTags(block, "xhtml:link")
      .map((t) => t.attrs)
      .filter((a) => (a.rel ?? "").toLowerCase() === "alternate" && a.hreflang && a.href)
      .map((a) => ({ hreflang: a.hreflang, href: a.href }));
    entries.push({ loc, lastmod: tagText(block, "lastmod"), alternates });
  }
  return { entries, children };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export type Page = {
  url: string;
  path: string;
  f: Fetched;
  html: string;
  ok: boolean;
  indexable: boolean;
  noindex: boolean;
  pathLang: string;
  kind: PageKind;
  ld: LdBlock[];
  nodes: LdNode[];
  body: string;
};

type Ctx = {
  origin: string;
  host: string;
  site: SiteConfig;
  config: SeoConfig;
  langs: string[];
  defLang: string;
  F: Fetcher;
  pages: Page[];
  byUrl: Map<string, Page>;
  indexable: Page[];
  files: Record<keyof typeof DISCOVERY_PATHS, Fetched>;
  sitemap: SitemapEntry[];
  key?: string;
  keyFile?: Fetched;
  forbidden: ForbiddenPattern[];
  lighthouse: unknown[];
  probe404?: Fetched;
  adminPages: Array<{ path: string; f: Fetched }>;
};

function canonicalKey(url: string): string {
  const u = new URL(url);
  return `${u.origin}${normPath(u.pathname)}`;
}

function sameUrl(a: string, b: string, base?: string): boolean {
  try {
    return canonicalKey(new URL(a, base).href) === canonicalKey(new URL(b, base).href);
  } catch {
    return false;
  }
}

function isHtml(f: Fetched): boolean {
  const ct = f.headers["content-type"] ?? "";
  return ct.includes("html") || (!ct && /<html\b/i.test(f.text));
}

function makePage(ctx: Pick<Ctx, "langs" | "defLang" | "config">, url: string, f: Fetched): Page {
  const html = isHtml(f) ? f.text : "";
  const ok = f.status === 200 && f.redirects.length === 0 && !!html;
  const noindex = !!html && hasNoindex(html, f.headers);
  const path = normPath(new URL(url).pathname);
  const ld = ok ? jsonLdBlocks(html) : [];
  return {
    url,
    path,
    f,
    html,
    ok,
    indexable: ok && !noindex,
    noindex,
    pathLang: langOfPath(path, ctx.langs, ctx.defLang),
    kind: classifyPath(path, { languages: ctx.langs, defaultLanguage: ctx.defLang, overrides: ctx.config.pageKinds }),
    ld,
    nodes: ld.flatMap((b) => (b.data ? ldNodes(b.data) : [])),
    body: html ? bodyHtml(html) : "",
  };
}

function hreflangs(p: Page): Array<{ hreflang: string; href: string }> {
  return linkTags(p.html)
    .filter((a) => relIncludes(a, "alternate") && a.hreflang && a.href)
    .map((a) => ({ hreflang: a.hreflang, href: new URL(a.href, p.url).href }));
}

function internalLinks(p: Page, origin: string): string[] {
  const out = new Set<string>();
  for (const a of anchors(p.body)) {
    const href = a.href.trim();
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript|sms):/i.test(href)) continue;
    try {
      const u = new URL(href, p.url);
      if (u.origin !== origin || NON_PAGE_EXT.test(u.pathname)) continue;
      out.add(`${u.origin}${normPath(u.pathname)}`);
    } catch {
      // skip
    }
  }
  return [...out];
}

function outboundAnchors(fragment: string, base: string, host: string): Array<{ href: string; text: string }> {
  const out: Array<{ href: string; text: string }> = [];
  for (const a of anchors(fragment)) {
    try {
      const u = new URL(a.href, base);
      if ((u.protocol === "http:" || u.protocol === "https:") && u.host !== host && !SOCIAL_OR_UTILITY.test(u.hostname)) out.push({ href: u.href, text: a.text });
    } catch {
      // skip
    }
  }
  return out;
}

function mainContent(p: Page): string {
  return removeElements(p.body, ["header", "nav", "footer", "script", "style", "noscript", "template"]);
}

function short(list: string[], n = 6): string {
  return list.length <= n ? list.join("; ") : `${list.slice(0, n).join("; ")}; and ${list.length - n} more`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function placeNames(config: SeoConfig): string[] {
  if (!config.place) return [];
  return Array.isArray(config.place) ? config.place : [config.place];
}

// ---------------------------------------------------------------------------
// FAQ extraction and parity (AEO-04, AEO-05, F-03)
// ---------------------------------------------------------------------------

export type QA = { q: string; a: string };

export function visibleFaq(body: string): QA[] {
  const out: QA[] = [];
  for (const d of findElements(body, "details")) {
    const sum = findElements(d.inner, "summary")[0];
    if (!sum) continue;
    out.push({ q: normText(sum.inner), a: normText(d.inner.slice(sum.end)) });
  }
  for (const dl of findElements(body, "dl")) {
    for (const m of dl.inner.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)) {
      out.push({ q: normText(m[1]), a: normText(m[2]) });
    }
  }
  for (const m of body.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const q = normText(m[2]);
    if (q.endsWith("?")) out.push({ q, a: normText(m[3]) });
  }
  return out.filter((x) => x.q);
}

export function markupFaq(nodes: LdNode[]): QA[] {
  const out: QA[] = [];
  for (const n of nodes.filter((x) => isType(x, "FAQPage"))) {
    const entities = Array.isArray(n.mainEntity) ? n.mainEntity : n.mainEntity ? [n.mainEntity] : [];
    for (const q of entities) {
      if (!q || typeof q !== "object") continue;
      const ans = Array.isArray(q.acceptedAnswer) ? q.acceptedAnswer[0] : q.acceptedAnswer;
      out.push({ q: normText(q.name ?? ""), a: normText(ans?.text ?? "") });
    }
  }
  return out;
}

function faqParity(p: Page): { visible: QA[]; markup: QA[]; problems: string[] } {
  const visible = visibleFaq(p.body);
  const markup = markupFaq(p.nodes);
  const problems: string[] = [];
  if (markup.length === 0) return { visible, markup, problems };
  if (visible.length === 0) {
    problems.push(`${p.path} has FAQPage markup (${markup.length} questions) but no visible FAQ`);
    return { visible, markup, problems };
  }
  for (const m of markup) {
    const v = visible.find((x) => x.q === m.q);
    if (!v) problems.push(`${p.path} markup question not shown: "${m.q.slice(0, 60)}"`);
    else if (v.a !== m.a) problems.push(`${p.path} answer differs from markup for "${m.q.slice(0, 60)}"`);
  }
  for (const v of visible) if (!markup.some((m) => m.q === v.q)) problems.push(`${p.path} shown question missing from markup: "${v.q.slice(0, 60)}"`);
  return { visible, markup, problems };
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

type Check = (ctx: Ctx) => Finding | Finding[] | null | Promise<Finding | Finding[] | null>;

const checkF02: Check = (ctx) => {
  if (ctx.forbidden.length === 0) {
    return finding("F-02", "WARN", "no forbidden-claims list found (config forbiddenPhrases or .jal/forbidden-claims.json)", "record every rejected claim as a regex and scan every served body, JSON-LD block and discovery file", "audit");
  }
  const hits: string[] = [];
  let scanned = 0;
  for (const p of ctx.pages.filter((x) => x.ok)) {
    scanned++;
    const text = [pageTitle(p.html) ?? "", meta(p.html, "description") ?? "", visibleText(p.html), ...p.ld.map((b) => b.raw)].join("\n");
    for (const h of matchForbidden(text, ctx.forbidden)) hits.push(`${p.path} contains "${h.match}" (${h.source})`);
  }
  for (const [name, f] of Object.entries(ctx.files)) {
    if (f.status !== 200) continue;
    scanned++;
    for (const h of matchForbidden(f.text, ctx.forbidden)) hits.push(`${DISCOVERY_PATHS[name as keyof typeof DISCOVERY_PATHS]} contains "${h.match}" (${h.source})`);
  }
  if (hits.length) return finding("F-02", "FAIL", short(hits), "remove each rejected claim from the fact modules and regenerate", "audit");
  return finding("F-02", "PASS", `${ctx.forbidden.length} forbidden patterns scanned across ${scanned} served bodies and files with no match; the project's forbidden-claims test must also pass in bun test`, undefined, "audit");
};

const checkF03: Check = (ctx) => {
  const problems: string[] = [];
  for (const p of ctx.indexable) {
    const root = findElements(p.body, "div").find((e) => e.attrs.id === "root")?.inner ?? p.body;
    const words = wordCount(visibleText(root));
    if (words < 30) problems.push(`${p.path} serves ${words} words to crawlers without JavaScript`);
    problems.push(...faqParity(p).problems);
    const text = normText(visibleText(p.body));
    for (const how of p.nodes.filter((n) => isType(n, "HowTo"))) {
      const steps = Array.isArray(how.step) ? how.step : how.step ? [how.step] : [];
      for (const s of steps) {
        const label = normText(typeof s === "string" ? s : s?.name ?? s?.text ?? "");
        if (label && !text.includes(label)) problems.push(`${p.path} HowTo step not shown: "${label.slice(0, 60)}"`);
      }
    }
    const digits = digitsOnly(text);
    for (const offer of p.nodes.filter((n) => isType(n, "Offer") && n.price !== undefined)) {
      const num = Number(offer.price);
      const d = Number.isFinite(num) ? String(Math.round(num)) : digitsOnly(String(offer.price));
      if (d && !digits.includes(d)) problems.push(`${p.path} Offer price ${offer.price} is not shown on the page`);
    }
  }
  if (problems.length) return finding("F-03", "FAIL", short(problems), "prerender the page's own first paint inside #root and generate markup only from what the page shows", "audit");
  return finding("F-03", "PASS", `${ctx.indexable.length} indexable pages serve their text without JavaScript; FAQ, HowTo and offer markup match the visible content`, undefined, "audit");
};

const checkF04: Check = (ctx) => {
  const problems: string[] = [];
  for (const p of ctx.indexable) {
    const lang = htmlLang(p.html);
    if (!lang || !lang.toLowerCase().startsWith(p.pathLang.toLowerCase())) problems.push(`${p.path} declares html lang "${lang ?? ""}", its URL says ${p.pathLang}`);
    for (const alt of hreflangs(p)) {
      if (alt.hreflang.toLowerCase() === "x-default" || sameUrl(alt.href, p.url)) continue;
      const target = ctx.byUrl.get(canonicalKey(alt.href));
      if (!target || !target.indexable) {
        problems.push(`${p.path} hreflang ${alt.hreflang} points at ${new URL(alt.href).pathname}, which is not a live indexable page`);
        continue;
      }
      if (!hreflangs(target).some((b) => sameUrl(b.href, p.url))) problems.push(`missing hreflang pair: ${target.path} does not link back to ${p.path}`);
    }
  }
  for (const lang of ctx.langs.filter((l) => l !== ctx.defLang)) {
    const prefix = `/${lang}`;
    for (const p of ctx.pages.filter((x) => x.ok)) {
      for (const link of internalLinks(p, ctx.origin)) {
        const path = new URL(link).pathname;
        if (path !== prefix && !path.startsWith(`${prefix}/`)) continue;
        const target = ctx.byUrl.get(canonicalKey(link));
        if (!target || !target.ok) problems.push(`${p.path} links ${path}, which is not a translated page (status ${target?.f.status ?? "not fetched"})`);
      }
    }
  }
  const unique = [...new Set(problems)];
  if (unique.length) return finding("F-04", "FAIL", short(unique), "pair every translated path both ways with hreflang plus x-default, and link untranslated paths in their default-language URL", "audit");
  return finding("F-04", "PASS", `language per URL holds on ${ctx.indexable.length} pages; every hreflang pair is reciprocal and no link points at an untranslated path`, undefined, "audit");
};

const checkSEO01: Check = (ctx) => {
  const f = ctx.files.robots;
  if (f.status !== 200) return finding("SEO-01", "FAIL", `/robots.txt returned ${f.status || f.error}`, "serve robots.txt from the section 12.1 template", "audit");
  const robots = parseRobots(f.text);
  const fails: string[] = [];
  const warns: string[] = [];
  for (const bad of robots.invalid) fails.push(`line ${bad.line} "${bad.text.slice(0, 60)}" is not a standard robots directive`);
  const wildcard = robots.groups.find((g) => g.agents.includes("*"));
  if (!wildcard) fails.push("no User-agent: * group");
  const named = NAMED_CRAWLERS.filter((t) => robots.groups.some((g) => g.agents.some((a) => a.toLowerCase() === t.toLowerCase())));
  if (named.length === 0) fails.push("no named group of documented crawlers");
  else if (named.length < NAMED_CRAWLERS.length) warns.push(`named group misses ${NAMED_CRAWLERS.filter((t) => !named.includes(t)).join(", ")}`);
  if (robots.sitemaps.length === 0) fails.push("no Sitemap line");
  const admin = ctx.config.adminPaths ?? ["/admin"];
  for (const path of [...admin, "/api"]) if (!disallows(wildcard, path)) warns.push(`the wildcard group does not disallow ${path}`);
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  const evidence = status === "PASS"
    ? `wildcard group, ${named.length} named crawlers, ${[...admin, "/api"].join(" and ")} disallowed, ${robots.sitemaps.length} Sitemap line, only standard directives`
    : short([...fails, ...warns]);
  return finding("SEO-01", status, evidence, "use the section 12.1 template; move Content-Signal to /.well-known/ai.txt", "audit");
};

const checkSEO02: Check = (ctx) => {
  const f = ctx.files.sitemap;
  if (f.status !== 200 || ctx.sitemap.length === 0) return finding("SEO-02", "FAIL", `/sitemap.xml returned ${f.status || f.error} with ${ctx.sitemap.length} URLs`, "serve a sitemap with every indexable URL", "audit");
  const fails: string[] = [];
  const warns: string[] = [];
  const locs = new Map(ctx.sitemap.map((e) => [canonicalKey(e.loc), e]));
  for (const p of ctx.indexable) if (!locs.has(canonicalKey(p.url))) fails.push(`${p.path} is indexable but missing from the sitemap`);
  for (const e of ctx.sitemap) {
    const p = ctx.byUrl.get(canonicalKey(e.loc));
    if (!p || !p.indexable) fails.push(`${e.loc} is listed but ${p ? (p.noindex ? "noindex" : `returns ${p.f.status}`) : "was not fetched"}`);
    if (!e.lastmod || !Number.isFinite(Date.parse(e.lastmod))) warns.push(`${new URL(e.loc).pathname} has no valid lastmod`);
    const alts = e.alternates.filter((a) => a.hreflang.toLowerCase() !== "x-default" && !sameUrl(a.href, e.loc));
    for (const a of alts) {
      const other = locs.get(canonicalKey(a.href));
      if (!other) fails.push(`missing hreflang pair: ${new URL(a.href).pathname} (${a.hreflang}) is not a sitemap entry`);
      else if (!other.alternates.some((b) => sameUrl(b.href, e.loc))) fails.push(`missing hreflang pair: ${new URL(other.loc).pathname} does not list ${new URL(e.loc).pathname}`);
    }
    if (alts.length && !e.alternates.some((a) => a.hreflang.toLowerCase() === "x-default")) warns.push(`${new URL(e.loc).pathname} has no x-default alternate`);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  const paired = ctx.sitemap.filter((e) => e.alternates.length).length;
  return finding("SEO-02", status, status === "PASS" ? `${ctx.sitemap.length} URLs, all live and indexable, each with lastmod; ${paired} with reciprocal hreflang pairs` : short([...fails, ...warns]), "generate the sitemap from the route table with lastmod from pageDates and xhtml:link pairs", "audit");
};

const checkSEO03: Check = async (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const notes: string[] = [];
  const probe = ctx.probe404!;
  if (probe.status !== 404) fails.push(`an unknown path returned ${probe.status || probe.error} instead of 404`);
  else if (!hasNoindex(probe.text, probe.headers)) fails.push("the 404 page has no noindex");
  else notes.push("unknown paths return 404 with noindex");

  const sample = ctx.indexable.find((p) => p.path !== "/");
  if (sample) {
    const slashed = `${ctx.origin}${sample.path}/`;
    const r = await ctx.F.get(slashed, { manual: true });
    const loc = r.headers.location ? new URL(r.headers.location, slashed).href : "";
    if ((r.status === 301 || r.status === 308) && sameUrl(loc, sample.url) && !loc.endsWith("/")) notes.push(`${sample.path}/ returns ${r.status} to ${sample.path}`);
    else if (r.status === 200) fails.push(`${sample.path}/ returns 200, a duplicate of ${sample.path}`);
    else if (r.status >= 300 && r.status < 400) warns.push(`${sample.path}/ returns ${r.status} (use 301)`);
    else warns.push(`${sample.path}/ returns ${r.status || r.error}`);
  }

  for (const p of ctx.pages) {
    for (const hop of p.f.redirects) if (hop.status === 302 || hop.status === 307) warns.push(`${new URL(hop.url).pathname} redirects with ${hop.status} (use 301)`);
  }

  const u = new URL(ctx.origin);
  const isLocal = /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname === "localhost" || !u.hostname.includes(".");
  if (isLocal) notes.push("www and apex check not applicable on a local host");
  else {
    const twin = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
    const twinUrl = `${u.protocol}//${twin}${u.port ? ":" + u.port : ""}/`;
    const r = await ctx.F.get(twinUrl, { manual: true });
    const loc = r.headers.location ? new URL(r.headers.location, twinUrl) : null;
    if ((r.status === 301 || r.status === 308) && loc?.host === u.host) notes.push(`${twin} returns ${r.status} to ${u.host}`);
    else if (r.status === 0) warns.push(`${twin} not reachable (${r.error})`);
    else fails.push(`${twin} returns ${r.status} instead of a 301 to ${u.host}`);
  }
  if (u.protocol === "https:") {
    const httpUrl = `http://${u.host}/`;
    const r = await ctx.F.get(httpUrl, { manual: true });
    const loc = r.headers.location ? new URL(r.headers.location, httpUrl) : null;
    if ((r.status === 301 || r.status === 308) && loc?.protocol === "https:") notes.push(`http returns ${r.status} to https`);
    else if (r.status === 0) warns.push(`http://${u.host}/ not reachable (${r.error})`);
    else fails.push(`http://${u.host}/ returns ${r.status} instead of a 301 to https`);
  } else notes.push("http to https check not applicable on an http origin");

  for (const [from, to] of Object.entries(ctx.config.retiredPaths ?? {})) {
    const r = await ctx.F.get(`${ctx.origin}${from}`, { manual: true });
    const loc = r.headers.location ? new URL(r.headers.location, ctx.origin).href : "";
    if (!(r.status === 301 || r.status === 308) || !sameUrl(loc, `${ctx.origin}${to}`)) fails.push(`retired ${from} returns ${r.status} (expected 301 to ${to})`);
    else {
      const t = await ctx.F.get(`${ctx.origin}${to}`);
      if (t.status !== 200) fails.push(`retired ${from} redirects to ${to}, which returns ${t.status}`);
    }
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-03", status, short(status === "PASS" ? notes : [...fails, ...warns]), "return a real 404 with noindex, 301 the trailing slash, the twin host and http, and retired paths to live pages", "audit");
};

const checkSEO04: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  for (const p of ctx.indexable) {
    const can = linkTags(p.html).filter((a) => relIncludes(a, "canonical"));
    if (can.length === 0) {
      fails.push(`${p.path} has no canonical`);
      continue;
    }
    if (can.length > 1) fails.push(`${p.path} has ${can.length} canonicals`);
    const href = can[0].href ?? "";
    if (!/^https?:\/\//.test(href)) warns.push(`${p.path} canonical is relative`);
    const og = meta(p.html, "og:url");
    if (og !== href) fails.push(`${p.path} canonical ${href} differs from og:url ${og ?? "(none)"}`);
    try {
      if (new URL(href, p.url).href !== new URL(p.url).href) warns.push(`${p.path} canonical points at ${new URL(href, p.url).pathname}`);
    } catch {
      fails.push(`${p.path} canonical is not a URL`);
    }
  }
  const noindexPages = [...ctx.pages.filter((p) => p.ok && p.noindex).map((p) => ({ path: p.path, html: p.html })), ...ctx.adminPages.map((a) => ({ path: a.path, html: a.f.text }))];
  for (const p of noindexPages) if (linkTags(p.html).some((a) => relIncludes(a, "canonical"))) fails.push(`${p.path} is noindex but carries a canonical`);
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-04", status, status === "PASS" ? `${ctx.indexable.length} indexable pages carry one absolute self canonical equal to og:url; noindex pages carry none` : short([...fails, ...warns]), "inject one absolute canonical equal to og:url from the route table; omit it on noindex routes", "audit");
};

const checkSEO05: Check = (ctx) => {
  const fails: string[] = [];
  const places = placeNames(ctx.config);
  const all: Array<{ path: string; html: string }> = [
    ...ctx.pages.filter((p) => p.html).map((p) => ({ path: p.path, html: p.html })),
    ...(ctx.probe404?.text ? [{ path: "(404 page)", html: ctx.probe404.text }] : []),
  ];
  for (const p of all) {
    const t = pageTitle(p.html) ?? "";
    if ([...t].length < 15) fails.push(`${p.path} title "${t}" is ${[...t].length} characters (minimum 15 anywhere)`);
  }
  const titles = new Map<string, string[]>();
  const descs = new Map<string, string[]>();
  for (const p of ctx.indexable) {
    const t = pageTitle(p.html) ?? "";
    const len = [...t].length;
    if (len >= 15 && (len < 50 || len > 60)) fails.push(`${p.path} title is ${len} characters (50 to 60)`);
    if (places.length && !places.some((pl) => t.toLowerCase().includes(pl.toLowerCase()))) fails.push(`${p.path} title does not name ${places.join(" or ")}`);
    titles.set(t, [...(titles.get(t) ?? []), p.path]);
    const d = meta(p.html, "description") ?? "";
    const dl = [...d].length;
    if (dl < 120 || dl > 158) fails.push(`${p.path} description is ${dl} characters (120 to 158)`);
    descs.set(d, [...(descs.get(d) ?? []), p.path]);
  }
  for (const [t, paths] of titles) if (paths.length > 1) fails.push(`duplicate title on ${paths.join(", ")}: "${t.slice(0, 40)}"`);
  for (const [, paths] of descs) if (paths.length > 1) fails.push(`duplicate description on ${paths.join(", ")}`);
  const note = places.length ? `naming ${places.join(" or ")}` : "place check skipped (set place in the config)";
  if (fails.length) return finding("SEO-05", "FAIL", short(fails), "write titles with the section 12.3 formulas (50 to 60 characters, naming the place) and descriptions of 120 to 158", "audit");
  return finding("SEO-05", "PASS", `${ctx.indexable.length} unique titles of 50 to 60 characters ${note}; unique descriptions of 120 to 158; no title under 15`, undefined, "audit");
};

const checkSEO06: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  for (const p of ctx.indexable) {
    const lang = htmlLang(p.html);
    if (!lang) {
      fails.push(`${p.path} has no html lang`);
      continue;
    }
    const locale = meta(p.html, "og:locale");
    if (!locale) warns.push(`${p.path} has no og:locale`);
    else if (!locale.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) warns.push(`${p.path} og:locale ${locale} does not match lang ${lang}`);
    const translated = hreflangs(p).some((a) => a.hreflang.toLowerCase() !== "x-default" && !sameUrl(a.href, p.url));
    if (translated && !meta(p.html, "og:locale:alternate")) warns.push(`${p.path} is translated but has no og:locale:alternate`);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-06", status, status === "PASS" ? `${ctx.indexable.length} pages declare html lang and og:locale; translated pages add og:locale:alternate` : short([...fails, ...warns]), "set html lang per URL and og:locale plus og:locale:alternate from the route table", "audit");
};

function isPlaceNode(n: LdNode): boolean {
  return ldTypes(n).some((t) => LOCAL_BUSINESS_TYPES.has(t));
}

function isOrgNode(n: LdNode): boolean {
  return ldTypes(n).some((t) => t === "Organization" || (/Organization$/.test(t) && t !== "EducationalOrganization"));
}

function findPlace(ctx: Ctx): LdNode | undefined {
  for (const p of ctx.indexable) {
    const n = p.nodes.find(isPlaceNode);
    if (n) return n;
  }
  return undefined;
}

const asArray = (v: unknown): any[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

const checkSEO07: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  for (const p of ctx.pages.filter((x) => x.ok)) {
    p.ld.forEach((b, i) => {
      if (b.error) fails.push(`${p.path} JSON-LD block ${i + 1} is invalid JSON (${b.error.slice(0, 80)})`);
    });
  }
  const nodes = ctx.indexable.flatMap((p) => p.nodes);
  if (!nodes.some((n) => isType(n, "WebSite"))) fails.push("no WebSite node");
  const org = nodes.find(isOrgNode);
  if (!org) fails.push("no Organization node");
  else if (!ldTypes(org).some((t) => t !== "Organization")) warns.push("Organization has no industry subtype (for example SportsOrganization)");
  const place = findPlace(ctx);
  if (!place) fails.push("no LocalBusiness place node");
  else {
    if (ldTypes(place).length < 2) warns.push(`place is only ${ldTypes(place).join(", ")}; add LocalBusiness plus a specific subtype`);
    for (const prop of ["address", "geo", "openingHoursSpecification"]) if (place[prop] === undefined) fails.push(`place has no ${prop}`);
    for (const prop of ["priceRange", "amenityFeature", "sameAs", "hasMap"]) if (place[prop] === undefined) warns.push(`place has no ${prop}`);
    const maps = asArray(place.hasMap).map(String);
    if (maps.length && !maps.some((m) => /[?&]cid=\d+/.test(m))) warns.push("hasMap has no ?cid= URL");
    if (maps.length && !maps.some((m) => !/[?&]cid=\d+/.test(m))) warns.push("hasMap has no share link");
    for (const spec of asArray(place.openingHoursSpecification)) {
      if (spec && (spec.closes === "24:00" || spec.closes === "00:00" || spec.closes === "24:00:00")) warns.push(`openingHoursSpecification closes ${spec.closes}; write midnight as 23:59`);
    }
  }
  for (const p of ctx.indexable) if (!p.nodes.some((n) => isType(n, "BreadcrumbList"))) fails.push(`${p.path} has no BreadcrumbList`);
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  const types = place ? ldTypes(place).join(" + ") : "";
  return finding("SEO-07", status, status === "PASS" ? `valid JSON-LD on ${ctx.indexable.length} pages: WebSite, ${org ? ldTypes(org).join(" + ") : ""}, ${types} with address, geo, hasMap (cid), hours, priceRange, amenityFeature, sameAs; BreadcrumbList everywhere` : short([...new Set([...fails, ...warns])]), "generate the JSON-LD graph from the fact modules and validate it in content.test", "audit");
};

const checkSEO08: Check = async (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const required = ["og:title", "og:description", "og:url", "og:image", "og:type", "twitter:card", "twitter:title", "twitter:description", "twitter:image"];
  const images = new Set<string>();
  for (const p of ctx.indexable) {
    const missing = required.filter((k) => !meta(p.html, k));
    if (missing.length) fails.push(`${p.path} lacks ${missing.join(", ")}`);
    const img = meta(p.html, "og:image");
    if (img) images.add(new URL(img, p.url).href);
  }
  for (const img of images) {
    if (/\.svg(\?|$)/i.test(img)) {
      fails.push(`og:image ${new URL(img).pathname} is an SVG`);
      continue;
    }
    if (!ctx.F.allows(img)) {
      warns.push(`og:image ${img} not checked (host not in the allowlist)`);
      continue;
    }
    const r = await ctx.F.get(img);
    const size = pngSize(r.bytes);
    if (r.status !== 200) fails.push(`og:image ${new URL(img).pathname} returns ${r.status || r.error}`);
    else if (!size) fails.push(`og:image ${new URL(img).pathname} is not a PNG (${r.headers["content-type"] ?? "no content type"})`);
    else if (size.width !== 1200 || size.height !== 630) fails.push(`og:image ${new URL(img).pathname} is ${size.width}x${size.height}, not 1200x630`);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-08", status, status === "PASS" ? `Open Graph and Twitter tags complete on ${ctx.indexable.length} pages; ${images.size} og:image checked as 1200x630 PNG` : short([...fails, ...warns]), "inject the full og and twitter set and a 1200x630 PNG og:image", "audit");
};

const checkSEO09: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  let imgs = 0;
  for (const p of ctx.indexable) {
    for (const t of findTags(p.body, "img")) {
      imgs++;
      if (t.attrs.alt === undefined) fails.push(`${p.path} img ${t.attrs.src ?? ""} has no alt`);
    }
  }
  const home = ctx.byUrl.get(canonicalKey(`${ctx.origin}/`));
  if (home?.ok) {
    const preloads = linkTags(home.html).filter((a) => relIncludes(a, "preload") && (a.as ?? "") === "image");
    const homeImgs = findTags(home.body, "img");
    if (homeImgs.length === 0) warns.push("home shows no hero img to preload");
    else if (preloads.length === 0) warns.push("home does not preload its hero image");
    else {
      const srcs = new Set(homeImgs.flatMap((t) => [t.attrs.src, ...(t.attrs.srcset ?? "").split(",").map((s) => s.trim().split(/\s+/)[0])]).filter(Boolean).map((s) => new URL(s!, home.url).pathname));
      const pre = preloads.flatMap((a) => [a.href, ...(a.imagesrcset ?? "").split(",").map((s) => s.trim().split(/\s+/)[0])]).filter(Boolean).map((s) => new URL(s!, home.url).pathname);
      if (!pre.some((s) => srcs.has(s))) warns.push("the preloaded image is not an img shown on home");
    }
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-09", status, status === "PASS" ? `${plural(imgs, "image")} all carry alt; the home hero is preloaded; LCP is measured by Lighthouse (pass --lighthouse)` : short([...fails, ...warns]), "add alt to every meaningful image and preload the hero at its rendered size", "audit");
};

function lighthouseFindings(reports: unknown[]): Finding[] {
  if (reports.length === 0) return [];
  const out: Finding[] = [];
  const rows: string[] = [];
  let worstScore = 100;
  let worstLcp = 0;
  for (const r of reports as any[]) {
    const seo = Math.round((r?.categories?.seo?.score ?? 0) * 100);
    const a11y = Math.round((r?.categories?.accessibility?.score ?? 0) * 100);
    const lcp = Number(r?.audits?.["largest-contentful-paint"]?.numericValue ?? 0);
    worstScore = Math.min(worstScore, seo, a11y);
    worstLcp = Math.max(worstLcp, lcp);
    rows.push(`${r?.finalUrl ?? r?.requestedUrl ?? "page"} SEO ${seo}, accessibility ${a11y}, LCP ${Math.round(lcp)} ms`);
  }
  const status: Status = worstScore === 100 ? "PASS" : worstScore >= 90 ? "WARN" : "FAIL";
  out.push(finding("SEO-10", status, short(rows), "fix every failing Lighthouse SEO and accessibility audit", "lighthouse"));
  const lcpStatus: Status = worstLcp === 0 ? "N/A" : worstLcp <= 2500 ? "PASS" : worstLcp <= 4000 ? "WARN" : "FAIL";
  out.push(finding("SEO-09", lcpStatus, `worst mobile LCP ${Math.round(worstLcp)} ms (budget 2500 ms)`, "preload the hero at its rendered size and split bundles", "lighthouse"));
  return out;
}

const checkSEO11: Check = async (ctx) => {
  const srcs = new Set<string>();
  for (const p of ctx.pages.filter((x) => x.ok)) {
    for (const t of findTags(p.html, "script")) {
      if (!t.attrs.src) continue;
      const u = new URL(t.attrs.src, p.url);
      if (u.origin === ctx.origin) srcs.add(u.href);
    }
  }
  if (srcs.size === 0) return finding("SEO-11", "PASS", "no script bundles served to public pages", undefined, "audit");
  const markers = [...DEFAULT_ADMIN_MARKERS, ...(ctx.config.adminMarkers ?? [])];
  const fails: string[] = [];
  let raw = 0;
  let gz = 0;
  for (const src of srcs) {
    const path = new URL(src).pathname;
    if (/admin|staff|backoffice|dashboard/i.test(path)) fails.push(`public page loads ${path}`);
    const r = await ctx.F.get(src);
    if (r.status !== 200) {
      fails.push(`${path} returns ${r.status || r.error}`);
      continue;
    }
    raw += r.bytes.length;
    gz += Bun.gzipSync(r.bytes).length;
    const hit = markers.find((m) => r.text.includes(m));
    if (hit) fails.push(`${path} contains the admin marker ${hit}`);
  }
  const size = `${plural(srcs.size, "script")}, ${(raw / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzipped`;
  if (fails.length) return finding("SEO-11", "FAIL", `${short(fails)}; ${size}`, "split admin and staff consoles into their own entrypoint", "audit");
  return finding("SEO-11", "PASS", `public bundle carries no admin or staff console; ${size}`, undefined, "audit");
};

const checkSEO12: Check = async (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const home = ctx.indexable[0];
  if (!home) return finding("SEO-12", "FAIL", "no indexable page to read icons from", "inject icons and the manifest from the server head builder", "audit");
  const links = linkTags(home.html);
  const icons = links.filter((a) => relIncludes(a, "icon") || relIncludes(a, "apple-touch-icon"));
  if (icons.length === 0) fails.push("no icon link in the served head");
  for (const i of icons) {
    const u = new URL(i.href ?? "", home.url);
    if (HASHED_FILE.test(u.pathname)) warns.push(`icon ${u.pathname} is hashed`);
    if (u.origin === ctx.origin) {
      const r = await ctx.F.get(u.href);
      if (r.status !== 200) warns.push(`icon ${u.pathname} returns ${r.status || r.error}`);
    }
  }
  const man = links.find((a) => relIncludes(a, "manifest"));
  if (!man) fails.push("no manifest link in the served head");
  else {
    const u = new URL(man.href ?? "", home.url);
    if (HASHED_FILE.test(u.pathname)) warns.push(`manifest ${u.pathname} is hashed`);
    const r = await ctx.F.get(u.href);
    const ct = r.headers["content-type"] ?? "";
    if (r.status !== 200) fails.push(`manifest ${u.pathname} returns ${r.status || r.error}`);
    else if (!ct.startsWith("application/manifest+json")) fails.push(`manifest is served as ${ct || "no content type"}, not application/manifest+json`);
    else {
      try {
        const m = JSON.parse(r.text);
        if (ctx.config.separateApp && m.display !== "browser") warns.push(`manifest display is ${m.display}; use "browser" when a separate installable app exists`);
      } catch {
        fails.push("manifest is not valid JSON");
      }
    }
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-12", status, status === "PASS" ? `${icons.length} unhashed icon links and the manifest are in the served head; manifest served as application/manifest+json` : short([...fails, ...warns]), "inject unhashed icons and the manifest from the server and serve it as application/manifest+json", "audit");
};

const checkSEO13: Check = async (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  for (const a of ctx.adminPages) {
    if (a.f.status === 0) warns.push(`${a.path} not reachable (${a.f.error})`);
    else if (!hasNoindex(a.f.text, a.f.headers)) fails.push(`${a.path} returns ${a.f.status} without noindex`);
  }
  const hashed = new Set<string>();
  for (const p of ctx.pages.filter((x) => x.ok)) {
    for (const t of [...findTags(p.html, "script"), ...findTags(p.html, "link")]) {
      const ref = t.attrs.src ?? (relIncludes(t.attrs, "stylesheet") || relIncludes(t.attrs, "modulepreload") ? t.attrs.href : undefined);
      if (!ref) continue;
      const u = new URL(ref, p.url);
      if (u.origin === ctx.origin && HASHED_FILE.test(u.pathname)) hashed.add(u.href);
    }
  }
  for (const h of hashed) {
    const r = await ctx.F.get(h);
    if (!/noindex/i.test(r.headers["x-robots-tag"] ?? "")) warns.push(`${new URL(h).pathname} has no X-Robots-Tag: noindex`);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-13", status, status === "PASS" ? `${ctx.adminPages.map((a) => a.path).join(", ")} noindex; ${plural(hashed.size, "hashed asset")} with X-Robots-Tag: noindex` : short([...fails, ...warns]), "send noindex on admin and private routes and X-Robots-Tag: noindex on hashed assets", "audit");
};

const checkSEO14: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const homeKey = canonicalKey(`${ctx.origin}/`);
  const depth = new Map<string, number>([[homeKey, 0]]);
  let frontier = [homeKey];
  for (let d = 1; d <= 2; d++) {
    const next: string[] = [];
    for (const k of frontier) {
      const p = ctx.byUrl.get(k);
      if (!p?.ok) continue;
      for (const l of internalLinks(p, ctx.origin)) {
        const lk = canonicalKey(l);
        if (!depth.has(lk)) {
          depth.set(lk, d);
          next.push(lk);
        }
      }
    }
    frontier = next;
  }
  const indexableKeys = new Set([...ctx.indexable.map((p) => canonicalKey(p.url)), ...ctx.sitemap.map((e) => canonicalKey(e.loc))]);
  for (const k of indexableKeys) if (!depth.has(k)) fails.push(`${new URL(k).pathname} is more than 2 clicks from home`);

  const kindPages = (kind: PageKind) => ctx.indexable.filter((p) => p.kind === kind);
  for (const p of ctx.indexable) {
    const footer = findElements(p.body, "footer")[0];
    if (!footer) {
      fails.push(`${p.path} has no footer`);
      continue;
    }
    const targets = anchors(footer.inner)
      .map((a) => {
        try {
          const u = new URL(a.href, p.url);
          return u.origin === ctx.origin ? ctx.byUrl.get(canonicalKey(u.href)) : undefined;
        } catch {
          return undefined;
        }
      })
      .filter((x): x is Page => !!x);
    for (const kind of ["contact", "privacy", "terms"] as PageKind[]) {
      const linked = targets.filter((t) => t.kind === kind);
      if (linked.length === 0) {
        fails.push(`${p.path} footer does not link ${kind}`);
        continue;
      }
      const inLang = kindPages(kind).some((k) => k.pathLang === p.pathLang);
      if (inLang && !linked.some((t) => t.pathLang === p.pathLang)) warns.push(`${p.path} footer links ${kind} outside the reader's language`);
    }
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("SEO-14", status, status === "PASS" ? `${indexableKeys.size} indexable pages within 2 clicks of home; every footer links contact, privacy and terms in the reader's language` : short([...fails, ...warns]), "link every money page from home or the footer, and link the legal pages in each language", "audit");
};

const checkSEO15: Check = (ctx) => {
  const envName = ctx.site.indexNowKeyEnv ?? "INDEXNOW_KEY";
  if (!ctx.key) return finding("SEO-15", "WARN", `${envName} is not set, so the IndexNow key file could not be located`, `set ${envName} in env and serve /{key}.txt`, "audit");
  const f = ctx.keyFile!;
  if (f.status !== 200) return finding("SEO-15", "FAIL", `the IndexNow key file /${ctx.key}.txt returns ${f.status || f.error}`, "serve the key file at the host root (UTF-8, the key as its only content)", "audit");
  if (f.text.trim() !== ctx.key) return finding("SEO-15", "FAIL", `the IndexNow key file /${ctx.key}.txt does not contain the key`, "serve the key as the file's only content", "audit");
  return finding("SEO-15", "PASS", `the IndexNow key file /${ctx.key}.txt is served with the key; boot submission is confirmed by the app log (IndexNow 202)`, undefined, "audit");
};

const checkSEO18: Check = (ctx) => {
  const fails: string[] = [];
  const contact = ctx.indexable.filter((p) => p.kind === "contact");
  if (contact.length === 0) fails.push("no contact page");
  else if (!contact.some((p) => p.nodes.some((n) => isType(n, "ContactPage")))) fails.push(`${contact[0].path} has no ContactPage markup`);
  if (!ctx.indexable.some((p) => p.kind === "privacy")) fails.push("no privacy policy page");
  if (!ctx.indexable.some((p) => p.kind === "terms")) fails.push("no terms page");
  if (fails.length) return finding("SEO-18", "FAIL", short(fails), "add contact (ContactPage), privacy and terms pages", "audit");
  return finding("SEO-18", "PASS", `contact (ContactPage markup), privacy and terms pages are live; whether the privacy policy matches what the code collects is a code evidence review`, undefined, "audit");
};

const checkAEO03: Check = (ctx) => {
  const required = (ctx.config.requiredIntents ?? ["money", "guide", "contact", "programme"]) as PageKind[];
  const have = required.filter((k) => ctx.indexable.some((p) => p.kind === k));
  const missing = required.filter((k) => !have.includes(k));
  const status: Status = missing.length === 0 ? "PASS" : missing.length === 1 ? "WARN" : "FAIL";
  const show = (k: PageKind) => `${k} ${ctx.indexable.find((p) => p.kind === k)?.path}`;
  return finding("AEO-03", status, missing.length ? `no URL for ${missing.join(", ")}; found ${have.map(show).join(", ") || "none"}` : `a URL per intent: ${have.map(show).join(", ")}`, "give each high-value intent its own page", "audit");
};

function contentPages(ctx: Ctx): Page[] {
  return ctx.indexable.filter((p) => !isTrustKind(p.kind));
}

const checkAEO04: Check = (ctx) => {
  const pages = contentPages(ctx);
  if (pages.length === 0) return finding("AEO-04", "N/A", "no content pages", undefined, "audit");
  const without = pages.filter((p) => visibleFaq(p.body).length < 2);
  const status: Status = without.length === 0 ? "PASS" : without.length <= pages.length / 2 ? "WARN" : "FAIL";
  return finding("AEO-04", status, without.length ? `no visible FAQ (2 or more questions) on ${without.map((p) => p.path).join(", ")}` : `a visible FAQ on all ${pages.length} content pages in ${[...new Set(pages.map((p) => p.pathLang))].join(" and ")}`, "add an FAQ written the way people ask assistants, answer first, in each language", "audit");
};

const checkAEO05: Check = (ctx) => {
  const problems: string[] = [];
  const warns: string[] = [];
  let withMarkup = 0;
  for (const p of ctx.indexable) {
    const r = faqParity(p);
    if (r.markup.length) withMarkup++;
    else if (r.visible.length >= 2) warns.push(`${p.path} shows an FAQ without FAQPage markup`);
    problems.push(...r.problems);
  }
  if (problems.length) return finding("AEO-05", "FAIL", short(problems), "generate FAQPage markup from the same FAQ array the page renders", "audit");
  if (withMarkup === 0 && warns.length === 0) return finding("AEO-05", "N/A", "no FAQ and no FAQPage markup on any page", undefined, "audit");
  if (warns.length) return finding("AEO-05", "WARN", short(warns), "add FAQPage markup generated from the rendered FAQ", "audit");
  return finding("AEO-05", "PASS", `FAQPage markup equals the rendered FAQ on ${withMarkup} pages`, undefined, "audit");
};

function keyFactsBlock(body: string): { found: boolean; early: boolean; numbers: number } {
  const byAttr = body.search(/<[a-z0-9]+\b[^>]*(?:\b(?:class|id)="[^"]*\b(?:key-facts|keyfacts|key_facts|tldr|tl-dr)\b[^"]*"|\bdata-key-facts\b)[^>]*>/i);
  let idx = byAttr;
  if (idx < 0) {
    const m = body.match(/<h[2-4]\b[^>]*>\s*(key facts|at a glance|tl;?dr|fakta (utama|kunci|singkat)|sekilas)[^<]*<\/h[2-4]>/i);
    idx = m?.index ?? -1;
  }
  if (idx < 0) return { found: false, early: false, numbers: 0 };
  const region = visibleText(body.slice(idx, idx + 1500));
  return { found: true, early: idx <= body.length * 0.5, numbers: (region.match(/\d+/g) ?? []).length };
}

const checkAEO06: Check = (ctx) => {
  const pages = ctx.indexable.filter((p) => p.kind === "money" || p.kind === "about" || p.kind === "programme");
  if (pages.length === 0) return finding("AEO-06", "N/A", "no money, about or programme pages", undefined, "audit");
  const bad: string[] = [];
  for (const p of pages) {
    const k = keyFactsBlock(p.body);
    if (!k.found) bad.push(`${p.path} has no key facts block`);
    else if (!k.early) bad.push(`${p.path} key facts block is not near the top`);
    else if (k.numbers < 2) bad.push(`${p.path} key facts block leads with fewer than 2 numbers`);
  }
  const status: Status = bad.length === 0 ? "PASS" : bad.length < pages.length ? "WARN" : "FAIL";
  return finding("AEO-06", status, bad.length ? short(bad) : `key facts block near the top, numbers first, on ${pages.map((p) => p.path).join(", ")}`, "add a key facts TL;DR under the lead with the verified numbers first", "audit");
};

const checkAEO07: Check = (ctx) => {
  const rules: Array<{ kind: PageKind; label: string; ok: (nodes: LdNode[]) => boolean }> = [
    { kind: "guide", label: "HowTo", ok: (n) => n.some((x) => isType(x, "HowTo")) },
    { kind: "programme", label: "Course with CourseInstance", ok: (n) => n.some((x) => isType(x, "Course") && asArray(x.hasCourseInstance).length > 0) },
    { kind: "money", label: "OfferCatalog", ok: (n) => n.some((x) => isType(x, "OfferCatalog") || x.hasOfferCatalog !== undefined) },
  ];
  const applicable = ctx.indexable.filter((p) => rules.some((r) => r.kind === p.kind));
  if (applicable.length === 0) return finding("AEO-07", "N/A", "no guide, programme or money pages", undefined, "audit");
  const bad: string[] = [];
  const good: string[] = [];
  for (const p of applicable) {
    const rule = rules.find((r) => r.kind === p.kind)!;
    if (rule.ok(p.nodes)) good.push(`${p.path} ${rule.label}`);
    else bad.push(`${p.path} lacks ${rule.label}`);
  }
  const status: Status = bad.length === 0 ? "PASS" : good.length ? "WARN" : "FAIL";
  return finding("AEO-07", status, bad.length ? short(bad) : short(good), "add HowTo, Course with hasCourseInstance and OfferCatalog where the page shows the steps, classes and prices", "audit");
};

const checkAEO08: Check = (ctx) => {
  const warns: string[] = [];
  const pages = contentPages(ctx);
  for (const p of pages) {
    const main = findElements(p.body, "main")[0]?.inner ?? p.body;
    const h1End = main.search(/<\/h1\s*>/i);
    if (h1End < 0) {
      warns.push(`${p.path} has no h1`);
      continue;
    }
    const lead = findElements(main.slice(h1End), "p")[0];
    const words = lead ? wordCount(visibleText(lead.inner)) : 0;
    if (!lead) warns.push(`${p.path} has no lead paragraph after the h1`);
    else if (words < 8 || words > 60) warns.push(`${p.path} lead is ${words} words (8 to 60, answer first)`);
    for (const h of findElements(main, "h2")) {
      const t = visibleText(h.inner);
      if (!t || GENERIC_HEADINGS.test(t) || wordCount(t) > 14) warns.push(`${p.path} heading "${t.slice(0, 40)}" is not a question or a topic`);
    }
  }
  if (pages.length === 0) return finding("AEO-08", "N/A", "no content pages", undefined, "audit");
  return finding("AEO-08", warns.length ? "WARN" : "PASS", warns.length ? short(warns) : `answer-first leads and topic or question headings on ${pages.length} pages (heuristic; review the wording)`, "open with the answer in one sentence and phrase headings as the question or the topic", "audit");
};

const checkAEO09: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  let tables = 0;
  for (const p of ctx.indexable) {
    for (const t of findElements(p.body, "table")) {
      tables++;
      const merged = /\b(rowspan|colspan)\s*=\s*"?\s*([2-9]|\d\d)/i.test(t.outer);
      const after = p.body.slice(t.end).replace(/^(\s|<\/[a-z0-9]+\s*>)*/i, "");
      const next = after.match(/^<p\b[^>]*>([\s\S]*?)<\/p>/i);
      const caption = findElements(t.inner, "caption")[0];
      const sentence = (next && wordCount(visibleText(next[1])) >= 8) || (caption && wordCount(visibleText(caption.inner)) >= 8);
      if (!sentence) (merged ? fails : warns).push(`${p.path} table ${tables}${merged ? " with merged cells" : ""} has no sentence equivalent`);
    }
  }
  if (tables === 0) return finding("AEO-09", "N/A", "no tables on indexable pages", undefined, "audit");
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("AEO-09", status, status === "PASS" ? `${tables} tables each followed by a sentence equivalent` : short([...fails, ...warns]), "write a sentence under every table that says what the table says", "audit");
};

const checkAEO11: Check = (ctx) => {
  const extra = new Set((ctx.config.editorialPaths ?? []).map(normPath));
  const pages = ctx.indexable.filter((p) => p.kind === "guide" || extra.has(p.path));
  if (pages.length === 0) return finding("AEO-11", "N/A", "no editorial pages (guides or configured editorialPaths)", undefined, "audit");
  const bad: string[] = [];
  const notes: string[] = [];
  for (const p of pages) {
    const text = visibleText(p.body);
    const byline = /\b([Bb]y|[Oo]leh)\s+\p{Lu}/u.test(text) || /\brel="author"|class="[^"]*\b(byline|author)\b/i.test(p.body);
    if (!byline) bad.push(`${p.path} shows no byline`);
    if (!findTags(p.body, "time").some((t) => t.attrs.datetime)) bad.push(`${p.path} shows no <time datetime>`);
    const node = p.nodes.find((n) => n.author && n.publisher && n.datePublished && n.dateModified);
    if (!node) bad.push(`${p.path} JSON-LD lacks author, publisher, datePublished or dateModified`);
    else if (node.reviewedBy || node.lastReviewed) {
      if (!(node.reviewedBy && node.lastReviewed)) bad.push(`${p.path} has reviewedBy or lastReviewed but not both`);
      else notes.push(`${p.path} reviewed`);
    }
  }
  const status: Status = bad.length === 0 ? "PASS" : bad.some((b) => b.includes("JSON-LD")) ? "FAIL" : "WARN";
  return finding("AEO-11", status, bad.length ? short(bad) : `byline, visible <time> and author, publisher, datePublished, dateModified on ${pages.map((p) => p.path).join(", ")}${notes.length ? "; " + notes.join(", ") : ""}`, "render the byline and <time> from the dates record and mirror them in JSON-LD", "audit");
};

const checkGEO01: Check = async (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const robots = ctx.files.robots.status === 200 ? parseRobots(ctx.files.robots.text) : null;
  const ai = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "PerplexityBot"];
  if (!robots) warns.push("no robots.txt to read");
  else {
    const named = ai.filter((t) => robots.groups.some((g) => g.agents.some((a) => a.toLowerCase() === t.toLowerCase())));
    if (named.length < ai.length) warns.push(`robots names no group for ${ai.filter((t) => !named.includes(t)).join(", ")}`);
    for (const t of Object.keys(CRAWLER_USER_AGENTS)) if (blocksRoot(groupFor(robots, t))) fails.push(`robots.txt disallows / for ${t}`);
  }
  const home = `${ctx.origin}/`;
  const base = await ctx.F.get(home);
  const results: string[] = [];
  for (const [name, ua] of Object.entries(CRAWLER_USER_AGENTS)) {
    const r = await ctx.F.get(home, { ua });
    if (r.status !== 200) fails.push(`${name} user agent gets ${r.status || r.error}`);
    else if (CHALLENGE_MARKERS.test(r.text) && !CHALLENGE_MARKERS.test(base.text)) fails.push(`${name} user agent gets a bot challenge page`);
    else if (base.text.length && r.text.length < base.text.length * 0.5) warns.push(`${name} user agent gets a much shorter page (${r.text.length} vs ${base.text.length} bytes)`);
    else results.push(name);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("GEO-01", status, status === "PASS" ? `named AI groups present; ${results.length} crawler user agents (${results.join(", ")}) get the same 200 page` : short([...fails, ...warns]), "allow the documented crawlers in robots.txt and in every WAF, CDN or bot-protection rule", "audit");
};

const checkGEO02: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const check = (name: "llms" | "llmsWellKnown" | "llmsFull") => {
    const f = ctx.files[name];
    const path = DISCOVERY_PATHS[name];
    if (f.status !== 200) return `${path} returns ${f.status || f.error}`;
    if (!/^\s*#\s+\S/.test(f.text)) return `${path} does not start with a "# Brand" heading`;
    return null;
  };
  const main = check("llms");
  if (main) fails.push(main);
  for (const n of ["llmsWellKnown", "llmsFull"] as const) {
    const p = check(n);
    if (p) warns.push(p);
  }
  const unlinked = ctx.indexable.filter((p) => !linkTags(p.html).some((a) => /llms(-full)?\.txt$/.test(a.href ?? "")));
  if (unlinked.length) warns.push(`no llms.txt link in the head of ${unlinked.map((p) => p.path).join(", ")}`);
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("GEO-02", status, status === "PASS" ? `/llms.txt, /.well-known/llms.txt and /llms-full.txt served; linked from the head of ${ctx.indexable.length} pages` : short([...fails, ...warns]), "generate the llms files from the fact modules and link them from every head", "audit");
};

const checkGEO03: Check = (ctx) => {
  const problems: string[] = [];
  const ai = ctx.files.aiTxt;
  if (ai.status !== 200) problems.push(`/.well-known/ai.txt returns ${ai.status || ai.error}`);
  else if (!/content-signal/i.test(ai.text)) problems.push("/.well-known/ai.txt has no Content-Signal line");
  for (const n of ["summary", "faq"] as const) {
    const f = ctx.files[n];
    if (f.status !== 200) problems.push(`${DISCOVERY_PATHS[n]} returns ${f.status || f.error}`);
    else {
      try {
        JSON.parse(f.text);
      } catch {
        problems.push(`${DISCOVERY_PATHS[n]} is not valid JSON`);
      }
    }
  }
  const feed = ctx.files.feed;
  if (feed.status !== 200) problems.push(`/feed.xml returns ${feed.status || feed.error}`);
  else if (!/<(rss|feed)\b/i.test(feed.text)) problems.push("/feed.xml is not RSS or Atom");
  const status: Status = problems.length === 0 ? "PASS" : problems.length >= 4 ? "FAIL" : "WARN";
  return finding("GEO-03", status, problems.length ? short(problems) : "/.well-known/ai.txt (with Content-Signal), /ai/summary.json, /ai/faq.json and /feed.xml served and valid", "serve the machine-readable files generated at build time", "audit");
};

const checkGEO04: Check = (ctx) => {
  const fails: string[] = [];
  const warns: string[] = [];
  const places = ctx.indexable.map((p) => ({ p, n: p.nodes.find(isPlaceNode) })).filter((x) => x.n);
  if (places.length === 0) return finding("GEO-04", "FAIL", "no place node to compare", "define name, NAP and hours once in business.ts and emit them everywhere", "audit");
  const sig = (n: LdNode) => JSON.stringify([n.name, n.telephone, n.address?.streetAddress, n.openingHoursSpecification ?? n.openingHours]);
  const first = places[0].n!;
  for (const { p, n } of places) if (sig(n!) !== sig(first)) fails.push(`${p.path} place node differs from ${places[0].p.path} (name, telephone, address or hours)`);
  const name = String(first.name ?? "");
  const phone = digitsOnly(String(first.telephone ?? ""));
  const street = String(first.address?.streetAddress ?? "");
  const llms = ctx.files.llms.status === 200 ? ctx.files.llms.text : "";
  if (!llms) warns.push("no llms.txt to compare");
  else {
    if (name && !llms.includes(name)) warns.push(`llms.txt does not name ${name}`);
    if (phone && !digitsOnly(llms).includes(phone)) warns.push("llms.txt does not carry the telephone");
    if (street && !llms.includes(street)) warns.push("llms.txt does not carry the street address");
  }
  if (ctx.files.summary.status === 200 && name && !ctx.files.summary.text.includes(name)) warns.push(`/ai/summary.json does not name ${name}`);
  const contact = ctx.indexable.find((p) => p.kind === "contact");
  if (contact) {
    const text = visibleText(contact.body);
    if (phone && !digitsOnly(text).includes(phone)) warns.push(`${contact.path} does not show the telephone`);
    if (street && !text.includes(street)) warns.push(`${contact.path} does not show the street address`);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("GEO-04", status, status === "PASS" ? `name, telephone, address and hours identical across ${places.length} pages, llms.txt, summary.json and the contact page; Business Profile, Bing Places, Apple Business Connect, Wikidata and OSM need a human check` : short([...fails, ...warns]), "emit NAP and hours from one fact module everywhere", "audit");
};

const checkGEO05: Check = (ctx) => {
  const place = findPlace(ctx);
  const org = ctx.indexable.flatMap((p) => p.nodes).find(isOrgNode);
  const node = place ?? org;
  if (!node) return finding("GEO-05", "FAIL", "no place or organization node", "add sameAs, alternateName and a topic link", "audit");
  const sameAs = [...asArray(node.sameAs), ...asArray(org?.sameAs)].map(String);
  const maps = [...sameAs, ...asArray(node.hasMap).map(String)];
  if (sameAs.length === 0) return finding("GEO-05", "FAIL", "no sameAs on the place or organization node", "list socials, booking, community and the maps cid in sameAs", "audit");
  const warns: string[] = [];
  if (sameAs.length < 3) warns.push(`sameAs lists only ${sameAs.length} profiles`);
  if (!maps.some((m) => /[?&]cid=\d+/.test(m))) warns.push("no maps cid URL in sameAs or hasMap");
  const topic = [...asArray(node.sport), ...asArray(node.knowsAbout), ...asArray(org?.sport), ...asArray(org?.knowsAbout)]
    .flatMap((t) => (typeof t === "string" ? [t] : t && typeof t === "object" ? [t["@id"], t.url, ...asArray(t.sameAs)] : []))
    .filter(Boolean)
    .map(String);
  if (!topic.some((t) => /wikidata\.org|wikipedia\.org/.test(t))) warns.push("sport or knowsAbout does not link Wikidata or Wikipedia");
  if (asArray(node.alternateName).length === 0 && asArray(org?.alternateName).length === 0) warns.push("no alternateName");
  return finding("GEO-05", warns.length ? "WARN" : "PASS", warns.length ? short(warns) : `sameAs lists ${sameAs.length} profiles including a maps cid; topic linked to ${topic.filter((t) => /wiki/.test(t)).length} Wikidata or Wikipedia URLs; alternateName set`, "complete sameAs, alternateName and the sport or knowsAbout topic links", "audit");
};

const checkGEO06: Check = (ctx) => {
  const money = ctx.indexable.filter((p) => p.kind === "money");
  if (money.length === 0) return finding("GEO-06", "N/A", "no money pages", undefined, "audit");
  const rows = money.map((p) => ({ p, d: measureDensity(p.html, ctx.host, p.path) }));
  const low = rows.filter((r) => r.d.per100 < DENSITY_WARN_BELOW);
  const text = rows.map((r) => `${r.p.path} ${r.d.per100} numbers per 100 words (${r.d.numbers} of ${r.d.words})`).join("; ");
  return finding("GEO-06", low.length ? "WARN" : "PASS", text, `raise density on money pages to ${DENSITY_WARN_BELOW} or more per 100 words with verified numbers only`, "audit");
};

function pressLinks(ctx: Ctx): { inline: Array<{ page: string; href: string }>; listOnly: Array<{ page: string; href: string }> } {
  const inline: Array<{ page: string; href: string }> = [];
  const listOnly: Array<{ page: string; href: string }> = [];
  for (const p of ctx.indexable) {
    const main = mainContent(p);
    for (const tag of ["p", "blockquote", "figcaption", "td", "cite"]) {
      for (const el of findElements(main, tag)) for (const a of outboundAnchors(el.inner, p.url, ctx.host)) inline.push({ page: p.path, href: a.href });
    }
    for (const bq of findTags(main, "blockquote")) {
      if (bq.attrs.cite) {
        try {
          const u = new URL(bq.attrs.cite, p.url);
          if (u.host !== ctx.host && !SOCIAL_OR_UTILITY.test(u.hostname)) inline.push({ page: p.path, href: u.href });
        } catch {
          // skip
        }
      }
    }
    for (const el of findElements(main, "li")) for (const a of outboundAnchors(el.inner, p.url, ctx.host)) listOnly.push({ page: p.path, href: a.href });
  }
  return { inline, listOnly };
}

const checkGEO07: Check = (ctx) => {
  const { inline, listOnly } = pressLinks(ctx);
  if (inline.length) {
    const pages = [...new Set(inline.map((x) => x.page))];
    return finding("GEO-07", "PASS", `${inline.length} inline citations beside claims on ${pages.join(", ")}`, undefined, "audit");
  }
  if (listOnly.length) return finding("GEO-07", "WARN", `third-party sources appear only as list links on ${[...new Set(listOnly.map((x) => x.page))].join(", ")}`, "cite each third-party claim inline, beside the sentence it supports", "audit");
  return finding("GEO-07", "N/A", "no third-party citations on any indexable page; if a page makes third-party claims, cite them inline", undefined, "audit");
};

type Quote = { page: string; text: string; cite?: string };

function quotesOn(p: Page): Quote[] {
  const out: Quote[] = [];
  const main = mainContent(p);
  for (const bq of findElements(main, "blockquote")) {
    const text = normText(bq.inner).replace(/^[“"']+|[”"']+$/g, "").trim();
    let cite = bq.attrs.cite;
    if (!cite) {
      const after = main.slice(bq.end, bq.end + 600);
      const a = anchors(bq.inner + after)[0];
      cite = a?.href;
    }
    out.push({ page: p.path, text, cite: cite ? new URL(cite, p.url).href : undefined });
  }
  return out;
}

const checkGEO08: Check = async (ctx) => {
  const { inline, listOnly } = pressLinks(ctx);
  const allQuotes = ctx.indexable.flatMap(quotesOn);
  if (inline.length === 0 && listOnly.length === 0 && allQuotes.length === 0) return finding("GEO-08", "N/A", "no independent coverage cited anywhere on the site", undefined, "audit");
  const pages = ctx.indexable.filter((p) => p.kind === "about" || p.kind === "programme");
  if (pages.length === 0) return finding("GEO-08", "N/A", "no about or programme pages", undefined, "audit");
  const fails: string[] = [];
  const warns: string[] = [];
  const good: string[] = [];
  for (const p of pages) {
    const quotes = quotesOn(p);
    if (quotes.length === 0) {
      fails.push(`${p.path} has no verbatim quote from coverage`);
      continue;
    }
    let verified = false;
    for (const q of quotes) {
      const words = wordCount(q.text);
      if (words > 15) warns.push(`${p.path} quote is ${words} words (15 or fewer)`);
      if (!/[.!?]$/.test(q.text)) warns.push(`${p.path} quote is not a whole sentence`);
      if (!q.cite) {
        warns.push(`${p.path} quote has no source link`);
        continue;
      }
      if (!ctx.F.allows(q.cite)) {
        warns.push(`${p.path} quote source ${new URL(q.cite).host} not checked (add it to allowHosts)`);
        continue;
      }
      const r = await ctx.F.get(q.cite);
      if (r.status !== 200) warns.push(`${p.path} quote source returns ${r.status || r.error}`);
      else if (!normText(visibleText(r.text)).replace(/[“”"]/g, "").includes(q.text)) warns.push(`${p.path} quote not found verbatim in its source`);
      else if (words <= 15 && /[.!?]$/.test(q.text)) verified = true;
    }
    if (verified) good.push(p.path);
    else if (!warns.some((w) => w.startsWith(p.path))) warns.push(`${p.path} quote could not be verified`);
  }
  const status: Status = fails.length ? "FAIL" : warns.length ? "WARN" : "PASS";
  return finding("GEO-08", status, status === "PASS" ? `verified verbatim quotes (15 words or fewer, found in the source) on ${good.join(", ")}` : short([...fails, ...warns]), "add one verified quote of 15 words or fewer, attributed to speaker, role, outlet and date", "audit");
};

/** Static textContent joins at tag boundaries: "<span>Play</span><span>Padel</span>". */
export function headingJoins(inner: string): string[] {
  const segments = inner.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "").split(/<[^>]+>/).map((s) => decodeEntities(s));
  const out: string[] = [];
  let prev = "";
  for (const seg of segments) {
    if (seg === "") continue;
    if (prev && /[a-z]$/.test(prev) && /^[A-Z]/.test(seg)) out.push(`${prev.split(/\s+/).pop()}${seg.split(/\s+/)[0]}`);
    prev = seg;
  }
  return out;
}

const checkGEO09Static: Check = (ctx) => {
  const problems: string[] = [];
  for (const p of ctx.indexable) {
    for (const tag of ["h1", "h2"]) {
      for (const h of findElements(p.body, tag)) {
        const joins = headingJoins(h.inner);
        if (joins.length) problems.push(`${p.path} ${tag} "${textContent(h.inner).slice(0, 50)}" joins ${joins.join(", ")} for bots`);
      }
    }
    const marquee = /<marquee\b/i.test(p.body) || findElements(p.body, "div").some((d) => /\bmarquee\b/i.test(d.attrs.class ?? "") && visibleText(d.inner).length > 0);
    if (marquee) problems.push(`${p.path} marquee words are in the text (draw them with content: attr(data-text))`);
    for (const t of findTags(p.body, "[a-z0-9]+")) {
      const target = t.attrs["data-target"] ?? t.attrs["data-count"] ?? t.attrs["data-countup"] ?? t.attrs["data-to"] ?? t.attrs["data-end"];
      if (target === undefined) continue;
      const rest = p.body.slice(t.index + t.raw.length, t.index + t.raw.length + 80);
      const shown = rest.split("<")[0].trim();
      if (digitsOnly(shown) !== digitsOnly(target)) problems.push(`${p.path} count-up serves "${shown}" instead of ${target}`);
    }
  }
  if (problems.length) return finding("GEO-09", "FAIL", short(problems), "put a real space in every split span, draw marquee words with CSS, and serve final numbers to bots", "audit");
  return finding("GEO-09", "PASS", `served h1 and h2 text has no joined words, no marquee text and no count-up placeholders on ${ctx.indexable.length} pages (render.ts checks the rendered page)`, undefined, "audit");
};

const checkGEO12: Check = async (ctx) => {
  const { inline, listOnly } = pressLinks(ctx);
  const links = [...new Set([...inline, ...listOnly].map((x) => x.href))];
  if (links.length === 0) return finding("GEO-12", "N/A", "no press links on the site", undefined, "audit");
  const dead: string[] = [];
  const unchecked: string[] = [];
  let live = 0;
  for (const l of links) {
    if (!ctx.F.allows(l)) {
      unchecked.push(new URL(l).host);
      continue;
    }
    const r = await ctx.F.get(l);
    if (r.status >= 200 && r.status < 300) live++;
    else dead.push(`${l} returns ${r.status || r.error}`);
  }
  if (dead.length) return finding("GEO-12", "FAIL", short(dead), "remove dead press links from the press record", "audit");
  if (unchecked.length) return finding("GEO-12", "WARN", `${live} press links live; not checked (hosts not in allowHosts): ${[...new Set(unchecked)].join(", ")}`, "add press outlet hosts to allowHosts so the audit can read them", "audit");
  return finding("GEO-12", "PASS", `${live} press links fetched and live`, undefined, "audit");
};

const CHECKS: Check[] = [
  checkF02, checkF03, checkF04,
  checkSEO01, checkSEO02, checkSEO03, checkSEO04, checkSEO05, checkSEO06, checkSEO07, checkSEO08, checkSEO09, checkSEO11, checkSEO12, checkSEO13, checkSEO14, checkSEO15, checkSEO18,
  checkAEO03, checkAEO04, checkAEO05, checkAEO06, checkAEO07, checkAEO08, checkAEO09, checkAEO11,
  checkGEO01, checkGEO02, checkGEO03, checkGEO04, checkGEO05, checkGEO06, checkGEO07, checkGEO08, checkGEO09Static, checkGEO12,
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export type AuditOptions = {
  config: SeoConfig;
  pages?: string[];
  fetchImpl?: FetchLike;
  env?: Env;
  forbidden?: ForbiddenPattern[];
  lighthouse?: unknown[];
  maxPages?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  redactor?: Redactor;
  now?: () => Date;
};

export type AuditOutput = {
  tool: "audit";
  target: string;
  origin: string;
  generatedAt: string;
  pages: Array<{ url: string; status: number; indexable: boolean; kind: PageKind; lang: string; title: string | null }>;
  findings: Finding[];
};

export async function runSeoAudit(target: string, opts: AuditOptions): Promise<AuditOutput> {
  const env = opts.env ?? process.env;
  const redactor = opts.redactor ?? new Redactor(env);
  const config = opts.config;
  const site = findSite(config, target);
  const origin = new URL(site.url).origin;
  const host = new URL(origin).host;
  const F = new Fetcher(allowlistFromConfig(config), opts.fetchImpl, redactor, opts.timeoutMs ?? 15000, opts.sleep);
  const langs = config.languages;
  const defLang = config.defaultLanguage;
  const maxPages = opts.maxPages ?? 60;
  const abs = (p: string) => new URL(p, origin).href;

  const key = env[site.indexNowKeyEnv ?? "INDEXNOW_KEY"];
  if (key) redactor.add(key);

  const entries = Object.entries(DISCOVERY_PATHS) as Array<[keyof typeof DISCOVERY_PATHS, string]>;
  const fetchedFiles = await Promise.all(entries.map(([, p]) => F.get(abs(p))));
  const files = Object.fromEntries(entries.map(([k], i) => [k, fetchedFiles[i]])) as Ctx["files"];
  const keyFile = key ? await F.get(abs(`/${key}.txt`)) : undefined;

  let sitemap: SitemapEntry[] = [];
  if (files.sitemap.status === 200) {
    const parsed = parseSitemap(files.sitemap.text);
    sitemap = parsed.entries;
    for (const child of parsed.children.slice(0, 20)) {
      if (!F.allows(child)) continue;
      const c = await F.get(child);
      if (c.status === 200) sitemap.push(...parseSitemap(c.text).entries);
    }
  }

  const ctxBase = { langs, defLang, config };
  const candidates = new Set<string>();
  const addCandidate = (u: string) => {
    try {
      const x = new URL(u, origin);
      if (x.origin === origin) candidates.add(`${x.origin}${normPath(x.pathname)}`);
    } catch {
      // skip
    }
  };
  addCandidate("/");
  for (const p of opts.pages ?? []) addCandidate(p);
  for (const p of config.keyUrls) addCandidate(p);
  for (const e of sitemap) addCandidate(e.loc);

  const pages: Page[] = [];
  const byUrl = new Map<string, Page>();
  const load = async (urls: string[]) => {
    const fresh = urls.filter((u) => !byUrl.has(canonicalKey(u))).slice(0, Math.max(0, maxPages - pages.length));
    const loaded = await mapLimit(fresh, 6, async (u) => makePage(ctxBase, u, await F.get(u)));
    for (const p of loaded) {
      if (byUrl.has(canonicalKey(p.url))) continue;
      pages.push(p);
      byUrl.set(canonicalKey(p.url), p);
    }
  };
  await load([...candidates]);
  // Follow internal links and hreflang targets once, for click depth and language pairs.
  const discovered = new Set<string>();
  for (const p of pages.filter((x) => x.ok)) {
    for (const l of internalLinks(p, origin)) discovered.add(l);
    for (const a of hreflangs(p)) if (new URL(a.href).origin === origin) discovered.add(`${origin}${normPath(new URL(a.href).pathname)}`);
  }
  await load([...discovered]);

  const probe404 = await F.get(abs(`/__jal-seo-probe-404-${crypto.randomUUID().slice(0, 8)}`));
  const adminPages = await Promise.all((config.adminPaths ?? ["/admin"]).map(async (p) => ({ path: p, f: await F.get(abs(p)) })));

  const ctx: Ctx = {
    origin, host, site, config, langs, defLang, F, pages, byUrl,
    indexable: pages.filter((p) => p.indexable),
    files, sitemap, key, keyFile,
    forbidden: opts.forbidden ?? [],
    lighthouse: opts.lighthouse ?? [],
    probe404, adminPages,
  };

  const findings: Finding[] = [];
  for (const check of CHECKS) {
    try {
      const r = await check(ctx);
      if (r) findings.push(...(Array.isArray(r) ? r : [r]));
    } catch (err) {
      const id = check.name.replace(/^check/, "").replace(/Static$/, "").replace(/^([A-Z]+)(\d+)$/, "$1-$2");
      findings.push(finding(id, "WARN", `check could not run: ${redactor.error(err)}`, "rerun the audit; report the error if it repeats", "audit"));
    }
  }
  findings.push(...lighthouseFindings(ctx.lighthouse));

  return redactor.value({
    tool: "audit" as const,
    target,
    origin,
    generatedAt: (opts.now ?? (() => new Date()))().toISOString(),
    pages: pages.map((p) => ({ url: p.url, status: p.f.status, indexable: p.indexable, kind: p.kind, lang: p.pathLang, title: p.html ? pageTitle(p.html) : null })),
    findings,
  });
}

/** One finding per id: the worst status, evidence joined. */
export function summarise(findings: Finding[]): Record<string, Status> {
  const by = new Map<string, Status[]>();
  for (const f of findings) by.set(f.id, [...(by.get(f.id) ?? []), f.status]);
  return Object.fromEntries([...by].map(([id, s]) => [id, worst(s)]));
}

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = new Redactor(deps.env);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        pages: { type: "string", multiple: true },
        lighthouse: { type: "string", multiple: true },
        config: { type: "string" },
        "max-pages": { type: "string" },
      },
      allowPositionals: true,
    });
    const { config } = await loadConfig(deps.cwd, values.config);
    const target = positionals[0] ?? config.sites[0]?.url;
    if (!target) throw new Error("usage: audit.ts <url> [--pages /a,/b]");
    const pages = (values.pages ?? []).flatMap((v) => v.split(",").map((s) => s.trim()).filter(Boolean));
    const lighthouse: unknown[] = [];
    for (const file of values.lighthouse ?? []) {
      const path = isAbsolute(file) ? file : join(deps.cwd, file);
      if (!existsSync(path)) throw new Error(`lighthouse report not found: ${file}`);
      lighthouse.push(JSON.parse(await readFile(path, "utf8")));
    }
    const forbidden = await loadForbidden(config, deps.cwd);
    const out = await runSeoAudit(target, {
      config,
      pages,
      lighthouse,
      forbidden,
      fetchImpl: deps.fetchImpl,
      env: deps.env,
      redactor,
      sleep: deps.sleep,
      now: deps.now,
      maxPages: values["max-pages"] ? Number(values["max-pages"]) : undefined,
    });
    emitJson(deps, redactor, out);
    return 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
