// Loads and validates .jal/seo-geo-aeo.json (instruction section 7.4).
// The config names the sites the scripts may touch; it never holds secrets.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { PAGE_KINDS } from "./pages.ts";

export const CONFIG_RELATIVE_PATH = ".jal/seo-geo-aeo.json";
export const FORBIDDEN_CANDIDATES = [".jal/forbidden-claims.json", ".jal/forbidden-claims.txt"];

export type SiteConfig = {
  url: string;
  gscProperty?: string;
  bingSiteUrl?: string;
  // VERIFY: the yandexHostId format (the instruction's example is "https:padelparty.id:443").
  yandexHostId?: string;
  indexNowKeyEnv?: string;
};

export type SeoConfig = {
  sites: SiteConfig[];
  languages: string[];
  defaultLanguage: string;
  keyUrls: string[];
  /** Extra hosts the scripts may read (press outlets for GEO-08 and GEO-12). */
  allowHosts?: string[];
  /** The place every indexable title must name (SEO-05). */
  place?: string | string[];
  adminPaths?: string[];
  adminMarkers?: string[];
  forbiddenPhrases?: string[];
  forbiddenClaimsFile?: string;
  pageKinds?: Record<string, string>;
  requiredIntents?: string[];
  editorialPaths?: string[];
  retiredPaths?: Record<string, string>;
  separateApp?: boolean;
};

export class ConfigError extends Error {
  problems: string[];
  constructor(message: string, problems: string[] = []) {
    super(problems.length ? `${message}:\n- ${problems.join("\n- ")}` : message);
    this.name = "ConfigError";
    this.problems = problems;
  }
}

const SECRET_FIELD = /^(api_?key|apikey|key|token|secret|password|private_?key|access_?token|client_?secret|indexnowkey)$/i;
const LANG_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;
const ENV_NAME_RE = /^[A-Z][A-Z0-9_]*$/;

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function findSecretFields(value: unknown, path: string, out: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => findSecretFields(v, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_FIELD.test(k)) out.push(`${path}.${k} looks like a secret; secrets live only in env (name the env var instead)`);
      findSecretFields(v, `${path}.${k}`, out);
    }
  }
}

export function validateConfig(raw: unknown): SeoConfig {
  const problems: string[] = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ConfigError("config must be a JSON object", ["expected { sites, languages, defaultLanguage, keyUrls }"]);
  }
  const c = raw as Record<string, unknown>;
  findSecretFields(c, "config", problems);

  if (!Array.isArray(c.sites) || c.sites.length === 0) {
    problems.push("sites must be a non-empty array");
  } else {
    c.sites.forEach((s, i) => {
      if (!s || typeof s !== "object") {
        problems.push(`sites[${i}] must be an object`);
        return;
      }
      const site = s as Record<string, unknown>;
      if (!isHttpUrl(site.url)) problems.push(`sites[${i}].url must be an absolute http(s) URL`);
      if (site.gscProperty !== undefined) {
        const g = site.gscProperty;
        if (typeof g !== "string" || !(g.startsWith("sc-domain:") || isHttpUrl(g))) {
          problems.push(`sites[${i}].gscProperty must be "sc-domain:<domain>" or a URL-prefix property`);
        }
      }
      if (site.bingSiteUrl !== undefined && !isHttpUrl(site.bingSiteUrl)) problems.push(`sites[${i}].bingSiteUrl must be a URL`);
      if (site.yandexHostId !== undefined && (typeof site.yandexHostId !== "string" || !site.yandexHostId)) {
        problems.push(`sites[${i}].yandexHostId must be a non-empty string`);
      }
      if (site.indexNowKeyEnv !== undefined && (typeof site.indexNowKeyEnv !== "string" || !ENV_NAME_RE.test(site.indexNowKeyEnv))) {
        problems.push(`sites[${i}].indexNowKeyEnv must be an env var name such as INDEXNOW_KEY`);
      }
    });
  }

  if (!Array.isArray(c.languages) || c.languages.length === 0 || !c.languages.every((l) => typeof l === "string" && LANG_RE.test(l))) {
    problems.push('languages must be a non-empty array of language codes such as ["en", "id"]');
  }
  if (typeof c.defaultLanguage !== "string") {
    problems.push("defaultLanguage must be a string");
  } else if (Array.isArray(c.languages) && !c.languages.includes(c.defaultLanguage)) {
    problems.push("defaultLanguage must be one of languages");
  }
  if (!Array.isArray(c.keyUrls) || !c.keyUrls.every((u) => typeof u === "string" && (u.startsWith("/") || isHttpUrl(u)))) {
    problems.push('keyUrls must be an array of paths ("/rates") or absolute URLs');
  }

  const stringArray = (name: string) => {
    const v = c[name];
    if (v !== undefined && (!Array.isArray(v) || !v.every((x) => typeof x === "string" && x.length > 0))) {
      problems.push(`${name} must be an array of non-empty strings`);
    }
  };
  for (const name of ["allowHosts", "adminPaths", "adminMarkers", "forbiddenPhrases", "requiredIntents", "editorialPaths"]) stringArray(name);

  if (c.place !== undefined && typeof c.place !== "string" && !(Array.isArray(c.place) && c.place.every((p) => typeof p === "string"))) {
    problems.push("place must be a string or an array of strings");
  }
  if (c.forbiddenClaimsFile !== undefined && typeof c.forbiddenClaimsFile !== "string") problems.push("forbiddenClaimsFile must be a path");
  if (c.pageKinds !== undefined) {
    if (!c.pageKinds || typeof c.pageKinds !== "object") problems.push("pageKinds must map paths to kinds");
    else {
      for (const [p, k] of Object.entries(c.pageKinds as Record<string, unknown>)) {
        if (typeof k !== "string" || !(PAGE_KINDS as string[]).includes(k)) problems.push(`pageKinds["${p}"] must be one of ${PAGE_KINDS.join(", ")}`);
      }
    }
  }
  if (c.retiredPaths !== undefined) {
    if (!c.retiredPaths || typeof c.retiredPaths !== "object") problems.push("retiredPaths must map old paths to live paths");
    else {
      for (const [from, to] of Object.entries(c.retiredPaths as Record<string, unknown>)) {
        if (!from.startsWith("/") || typeof to !== "string" || !to.startsWith("/")) problems.push(`retiredPaths["${from}"] must map a path to a path`);
      }
    }
  }
  if (Array.isArray(c.forbiddenPhrases)) {
    for (const p of c.forbiddenPhrases) {
      if (typeof p !== "string") continue;
      try {
        compilePattern(p);
      } catch {
        problems.push(`forbiddenPhrases entry is not a valid pattern: ${p}`);
      }
    }
  }

  if (problems.length) throw new ConfigError(`invalid ${CONFIG_RELATIVE_PATH}`, problems);
  return c as unknown as SeoConfig;
}

export async function loadConfig(cwd: string = process.cwd(), explicitPath?: string): Promise<{ config: SeoConfig; path: string }> {
  const path = explicitPath ? (isAbsolute(explicitPath) ? explicitPath : join(cwd, explicitPath)) : join(cwd, CONFIG_RELATIVE_PATH);
  if (!existsSync(path)) {
    throw new ConfigError(`missing ${path}`, [
      "create it with the owner (instruction section 7.4): sites[].url, gscProperty, bingSiteUrl, yandexHostId, indexNowKeyEnv, languages, defaultLanguage, keyUrls",
    ]);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    throw new ConfigError(`${path} is not valid JSON`, [err instanceof Error ? err.message : String(err)]);
  }
  return { config: validateConfig(raw), path };
}

export function originOf(url: string): string {
  return new URL(url).origin;
}

/** The config site matching a URL or origin. With no argument and one site, that site. */
export function findSite(config: SeoConfig, urlOrOrigin?: string): SiteConfig {
  if (!urlOrOrigin) {
    if (config.sites.length === 1) return config.sites[0];
    throw new ConfigError("more than one site in the config; pass --site", config.sites.map((s) => s.url));
  }
  let origin: string;
  try {
    origin = originOf(urlOrOrigin);
  } catch {
    throw new ConfigError(`not a URL: ${urlOrOrigin}`);
  }
  const site = config.sites.find((s) => originOf(s.url) === origin || (s.bingSiteUrl && originOf(s.bingSiteUrl) === origin));
  if (!site) throw new ConfigError(`refused: ${origin} is not a site in ${CONFIG_RELATIVE_PATH}`, config.sites.map((s) => s.url));
  return site;
}

function hostVariants(host: string): string[] {
  const hostname = host.replace(/:\d+$/, "");
  const port = host.slice(hostname.length);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname === "localhost" || hostname.startsWith("[") || !hostname.includes(".")) return [host];
  const other = hostname.startsWith("www.") ? hostname.slice(4) : `www.${hostname}`;
  return [host, other + port];
}

/** Hosts (host[:port]) of the configured sites, with their www or apex twin. */
export function siteHosts(config: SeoConfig): string[] {
  const out = new Set<string>();
  for (const s of config.sites) {
    for (const u of [s.url, s.bingSiteUrl]) {
      if (!u) continue;
      for (const h of hostVariants(new URL(u).host.toLowerCase())) out.add(h);
    }
  }
  return [...out];
}

export function normaliseHost(entry: string): string {
  const e = entry.trim().toLowerCase();
  if (e.includes("://")) return new URL(e).host;
  return e.replace(/\/.*$/, "");
}

export type ForbiddenPattern = { source: string; regex: RegExp };

/** "/regex/flags" compiles as a regex; anything else is a case-insensitive literal. */
export function compilePattern(p: string): RegExp {
  const m = p.match(/^\/(.+)\/([a-z]*)$/s);
  if (m) {
    const flags = m[2].includes("g") ? m[2] : m[2] + "g";
    return new RegExp(m[1], flags);
  }
  return new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
}

async function readForbiddenFile(path: string): Promise<string[]> {
  const text = await readFile(path, "utf8");
  if (path.endsWith(".json")) {
    const data = JSON.parse(text);
    const list = Array.isArray(data) ? data : Array.isArray(data?.patterns) ? data.patterns : Array.isArray(data?.forbidden) ? data.forbidden : [];
    return list
      .map((x: unknown) => (typeof x === "string" ? x : x && typeof x === "object" && typeof (x as any).pattern === "string" ? (x as any).pattern : null))
      .filter((x: string | null): x is string => !!x);
  }
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/** Forbidden phrases from the config plus the project's forbidden-claims file, if any. */
export async function loadForbidden(config: SeoConfig | undefined, cwd: string = process.cwd()): Promise<ForbiddenPattern[]> {
  const sources: string[] = [...(config?.forbiddenPhrases ?? [])];
  const candidates = config?.forbiddenClaimsFile ? [config.forbiddenClaimsFile] : FORBIDDEN_CANDIDATES;
  for (const rel of candidates) {
    const path = isAbsolute(rel) ? rel : join(cwd, rel);
    if (existsSync(path)) {
      sources.push(...(await readForbiddenFile(path)));
      break;
    }
  }
  const seen = new Set<string>();
  const out: ForbiddenPattern[] = [];
  for (const s of sources) {
    if (seen.has(s)) continue;
    seen.add(s);
    out.push({ source: s, regex: compilePattern(s) });
  }
  return out;
}

export function matchForbidden(text: string, patterns: ForbiddenPattern[]): Array<{ source: string; match: string }> {
  const hits: Array<{ source: string; match: string }> = [];
  for (const p of patterns) {
    p.regex.lastIndex = 0;
    const m = p.regex.exec(text);
    if (m) hits.push({ source: p.source, match: m[0] });
    p.regex.lastIndex = 0;
  }
  return hits;
}
