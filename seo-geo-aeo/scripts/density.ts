#!/usr/bin/env bun
// density.ts <url...|seo.json> [--host h] [--config path]
// Words, numbers per 100 words, outbound citations and quotes per page, with
// the core of instruction section 12.5. Read-only.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";
import { findSite, loadConfig, type SeoConfig } from "./lib/config.ts";
import { emitError, emitJson, makeRedactor, resolveDeps, type Deps } from "./lib/cli.ts";
import { finding, type Finding } from "./lib/findings.ts";
import { allowlistFromConfig, httpRequest } from "./lib/http.ts";
import { classifyPath } from "./lib/pages.ts";

export const DENSITY_WARN_BELOW = 5;

export type Density = {
  page: string;
  words: number;
  numbers: number;
  per100: number;
  outbound: number;
  outboundUrls: string[];
  quotes: number;
};

/** Drop what never renders as text and decode the entities that carry quotes and spaces. */
function prepare(html: string): string {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)(<\/body\s*>|$)/i)?.[1] ?? html;
  return body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&ldquo;|&#8220;/gi, "“")
    .replace(/&rdquo;|&#8221;/gi, "”")
    .replace(/&amp;/gi, "&");
}

/** The section 12.5 core, applied to rendered body HTML. */
export function measureDensity(rawHtml: string, host: string, page = ""): Density {
  const html = prepare(rawHtml);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const words = text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const numbers = (text.match(/\bRp\s?[\d.,]+|\b\d+([.,]\d+)?\b/g) ?? []).length;
  const outboundUrls = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.includes(host));
  const quotes = (text.match(/[“"][^”"]{12,}[”"]/g) ?? []).length;
  const per100 = words ? Math.round((numbers / words) * 1000) / 10 : 0;
  return { page, words, numbers, per100, outbound: outboundUrls.length, outboundUrls, quotes };
}

/** GEO-06 findings for money pages. */
export function densityFindings(results: Density[], config?: Pick<SeoConfig, "languages" | "defaultLanguage" | "pageKinds">): Finding[] {
  const money = results.filter((r) => {
    let path = r.page;
    try {
      path = new URL(r.page, "http://x").pathname;
    } catch {
      // keep as is
    }
    return classifyPath(path, { languages: config?.languages, defaultLanguage: config?.defaultLanguage, overrides: config?.pageKinds }) === "money";
  });
  if (money.length === 0) return [finding("GEO-06", "N/A", "no money page (rates, prices) among the measured pages", undefined, "density")];
  const low = money.filter((r) => r.per100 < DENSITY_WARN_BELOW);
  const summary = money.map((r) => `${r.page} ${r.per100} per 100 words (${r.numbers} numbers, ${r.words} words)`).join("; ");
  return [
    finding(
      "GEO-06",
      low.length ? "WARN" : "PASS",
      summary,
      `raise statistic density to ${DENSITY_WARN_BELOW} or more per 100 words with verified numbers only (prices, hours, counts)`,
      "density",
    ),
  ];
}

/** Pages from a build-time seo.json: { pages: [...] } or a map of path to body. */
export function pagesFromSeoJson(data: unknown): Array<{ page: string; html: string }> {
  const out: Array<{ page: string; html: string }> = [];
  const bodyOf = (v: any): string | null => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") for (const k of ["body", "html", "bodyHtml", "content"]) if (typeof v[k] === "string") return v[k];
    return null;
  };
  const container = (data as any)?.pages ?? (data as any)?.routes ?? (data as any)?.bodies ?? data;
  if (Array.isArray(container)) {
    container.forEach((v, i) => {
      const html = bodyOf(v);
      if (html) out.push({ page: String(v?.path ?? v?.url ?? v?.key ?? i), html });
    });
  } else if (container && typeof container === "object") {
    for (const [k, v] of Object.entries(container)) {
      const html = bodyOf(v);
      if (html && (k.startsWith("/") || k.startsWith("http"))) out.push({ page: k, html });
    }
  }
  return out;
}

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = makeRedactor(deps);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: { host: { type: "string" }, config: { type: "string" } },
      allowPositionals: true,
    });
    if (positionals.length === 0) throw new Error("usage: density.ts <url...|seo.json> [--host example.com]");
    const results: Density[] = [];
    let config: SeoConfig | undefined;
    for (const input of positionals) {
      if (/^https?:\/\//.test(input)) {
        config ??= (await loadConfig(deps.cwd, values.config)).config;
        findSite(config, input);
        const allow = allowlistFromConfig(config);
        const { res, url } = await httpRequest(input, {}, { allow, fetchImpl: deps.fetchImpl, redactor, sleep: deps.sleep });
        const html = await res.text();
        results.push(measureDensity(html, values.host ?? new URL(url).host, url));
      } else {
        const path = isAbsolute(input) ? input : join(deps.cwd, input);
        if (!existsSync(path)) throw new Error(`not found: ${input}`);
        const data = JSON.parse(await readFile(path, "utf8"));
        const site = typeof data?.site === "string" ? data.site : typeof data?.origin === "string" ? data.origin : undefined;
        const host = values.host ?? (site ? new URL(site).host : "");
        if (!host) throw new Error("pass --host when seo.json has no site or origin field");
        for (const p of pagesFromSeoJson(data)) results.push(measureDensity(p.html, host, p.page));
      }
    }
    if (!config && existsSync(join(deps.cwd, ".jal/seo-geo-aeo.json"))) config = (await loadConfig(deps.cwd, values.config)).config;
    emitJson(deps, redactor, { tool: "density", generatedAt: deps.now().toISOString(), pages: results, findings: densityFindings(results, config) });
    return 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
