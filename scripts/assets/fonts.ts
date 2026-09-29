#!/usr/bin/env bun
// fonts.ts list [--role text|display|mono|figures]
// fonts.ts get <family> [--weights 400,500,600] [--subsets latin,latin-ext] [--axes wght] [--styles normal] [--static] [--out assets/fonts]
//
// Fetches a font from the JAL curated pool (SIL OFL 1.1 only) straight into
// the client project, approved by Brian 2026-09-29 (typography is not locked
// to one family; Geist Sans and Geist Mono stay the vendored default).
// Zero dependencies: fetch, node:fs, node:path, node:zlib.
//
// Rules this script enforces:
//   - Only registry.npmjs.org is contacted: the package document, then the
//     tarball it names. The source is the Fontsource build of the family,
//     @fontsource-variable/<id> when a variable build exists, else
//     @fontsource/<id>.
//   - The license is checked three times before anything is written: the
//     npm `license` field, `license.type` in the package's metadata.json,
//     and the LICENSE text itself must all say OFL 1.1. Anything else is
//     refused.
//   - The tarball must match the registry's sha512 integrity.
//   - Only pool families are fetched (POOL below, mirrored in
//     skills/jal-design-system/references/typography.md). Geist and Geist
//     Mono are vendored in the template and never fetched.
//   - Only woff2 files for the chosen subsets, styles, and weights (static)
//     or axes (variable) are copied, plus the license as OFL.txt and a
//     generated <id>.css with @font-face rules (font-display: swap,
//     unicode-range per subset). Static weights are JAL weights only (400,
//     500, 600).
//   - The output directory must resolve inside the current working
//     directory. Every fetch appends one row to <out>/FONTS.md.
//   - Timeouts on every request; at most one retry on 429, 5xx, or a network
//     error, never a retry storm.
//
// Never run this inside the JAL-AIDEV plugin or template: pool fonts live
// only in the client project that uses them.

import { parseArgs } from "node:util";
import { existsSync, realpathSync } from "node:fs";
import { appendFile, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { gunzipSync } from "node:zlib";

export const REGISTRY = "https://registry.npmjs.org";
export const ALLOWED_HOSTS = new Set(["registry.npmjs.org"]);
export const USER_AGENT = "JAL-AIDEV-font-fetcher/1.0";
export const LICENSE_ID = "OFL-1.1";
export const DEFAULT_OUT = "assets/fonts";
export const DEFAULT_SUBSETS = ["latin", "latin-ext"];
export const DEFAULT_STYLES = ["normal"];
export const DEFAULT_AXES = "wght";
export const JAL_WEIGHTS = [400, 500, 600];
export const META_TIMEOUT_MS = 15_000;
export const TARBALL_TIMEOUT_MS = 60_000;
export const MAX_TARBALL_BYTES = 25 * 1024 * 1024;
export const RETRY_DELAY_MS = 1_000;
export const MAX_RETRY_AFTER_MS = 5_000;

export type Role = "text" | "display" | "mono" | "figures";
export const ROLES: Role[] = ["text", "display", "mono", "figures"];

export interface PoolFont {
  id: string;
  family: string;
  category: "sans" | "serif" | "mono";
  // A @fontsource-variable build exists (checked on npm 2026-09-29).
  variable: boolean;
  roles: Role[];
  // How numerals go tabular: the tnum feature, tabular by default, or not at
  // all (then the figures role goes to the page's mono).
  figures: "tnum" | "default" | "none";
  contexts: string[];
  character: string;
  pairs: string[];
  vendored?: boolean;
  note?: string;
}

// The curated pool. Every entry was checked on npm on 2026-09-29: license
// OFL-1.1 in the package document, in metadata.json, and in the LICENSE
// text. Keep in step with typography.md section 3.
export const POOL: PoolFont[] = [
  { id: "geist", family: "Geist", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "tnum", contexts: ["product UI", "data", "docs", "finance", "luxury hardware"], character: "Swiss-leaning neutral grotesque, tight and exact, the JAL Core default.", pairs: ["Geist Mono", "Newsreader", "Instrument Serif"], vendored: true },
  { id: "geist-mono", family: "Geist Mono", category: "mono", variable: true, roles: ["mono", "figures"], figures: "default", contexts: ["product UI", "data", "docs", "finance"], character: "Geist's monospace, slashed zero by default, the JAL Core default mono.", pairs: ["Geist", "Inter", "Instrument Sans"], vendored: true },
  { id: "ibm-plex-sans", family: "IBM Plex Sans", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "default", contexts: ["product UI", "data", "docs", "finance"], character: "Engineered grotesque with a humanist hand, corporate-industrial, tabular digits by default.", pairs: ["IBM Plex Mono", "IBM Plex Serif"] },
  { id: "ibm-plex-mono", family: "IBM Plex Mono", category: "mono", variable: false, roles: ["mono", "figures"], figures: "default", contexts: ["data", "docs", "finance"], character: "Plex's monospace, warmer than most code faces, a dotted zero.", pairs: ["IBM Plex Sans", "IBM Plex Serif", "Inter"] },
  { id: "ibm-plex-serif", family: "IBM Plex Serif", category: "serif", variable: false, roles: ["display", "text", "figures"], figures: "default", contexts: ["editorial", "docs", "finance"], character: "Sturdy slab-leaning serif, sober rather than literary.", pairs: ["IBM Plex Sans", "IBM Plex Mono"] },
  { id: "inter", family: "Inter", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "tnum", contexts: ["product UI", "data", "docs"], character: "Screen-first neo-grotesque with an optical size axis, maximum legibility at small sizes.", pairs: ["JetBrains Mono", "Geist Mono", "Source Serif 4"] },
  { id: "inter-tight", family: "Inter Tight", category: "sans", variable: true, roles: ["display", "figures"], figures: "tnum", contexts: ["product UI", "luxury hardware", "finance"], character: "Inter spaced for display sizes; a tighter headline voice over Inter or Geist text.", pairs: ["Inter", "Geist", "Geist Mono"], note: "Display only: its spacing is too tight for body text." },
  { id: "jetbrains-mono", family: "JetBrains Mono", category: "mono", variable: true, roles: ["mono", "figures"], figures: "default", contexts: ["docs", "data", "product UI"], character: "Tall x-height code face built for reading code, open and unambiguous, a dotted zero.", pairs: ["Inter", "Geist", "Manrope"] },
  { id: "instrument-sans", family: "Instrument Sans", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "tnum", contexts: ["product UI", "luxury hardware", "editorial"], character: "Crisp contemporary grotesque with a width axis, precise and slightly warm.", pairs: ["Instrument Serif", "Geist Mono", "Newsreader"] },
  { id: "instrument-serif", family: "Instrument Serif", category: "serif", variable: false, roles: ["display"], figures: "none", contexts: ["editorial", "luxury hardware"], character: "Condensed high-contrast display serif, one weight (400).", pairs: ["Instrument Sans", "Geist"], note: "Display switch only (an editorial quote or a manifesto line): one weight, so that section sets its display and heading weight to 400. Never a page display face, never italic." },
  { id: "newsreader", family: "Newsreader", category: "serif", variable: true, roles: ["display", "text", "figures"], figures: "tnum", contexts: ["editorial", "docs"], character: "Transitional text serif with an optical size axis, made for long reading on screen.", pairs: ["Geist", "Instrument Sans", "Geist Mono"] },
  { id: "fraunces", family: "Fraunces", category: "serif", variable: true, roles: ["display"], figures: "none", contexts: ["editorial", "playful consumer"], character: "Soft old-style display serif with optical size, softness, and wonk axes.", pairs: ["Geist", "DM Sans", "Figtree"], note: "Display only, SOFT and WONK at 0 by default; the warm serif reflex in craft.md section 14 still applies." },
  { id: "source-serif-4", family: "Source Serif 4", category: "serif", variable: true, roles: ["display", "text", "figures"], figures: "tnum", contexts: ["editorial", "docs", "finance"], character: "Clear transitional serif with optical sizes, calm and bookish without costume.", pairs: ["Inter", "Geist", "JetBrains Mono"] },
  { id: "space-grotesk", family: "Space Grotesk", category: "sans", variable: true, roles: ["display", "figures"], figures: "tnum", contexts: ["product UI", "playful consumer", "luxury hardware"], character: "Grotesque with mono-derived quirks, technical and characterful.", pairs: ["Geist", "Inter", "JetBrains Mono"], note: "Display only: its quirks tire at body sizes." },
  { id: "manrope", family: "Manrope", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "tnum", contexts: ["product UI", "finance", "playful consumer"], character: "Semi-condensed modern grotesque with geometric curves, clean and a little soft.", pairs: ["JetBrains Mono", "Geist Mono"] },
  { id: "dm-sans", family: "DM Sans", category: "sans", variable: true, roles: ["text", "display"], figures: "none", contexts: ["product UI", "playful consumer"], character: "Low-contrast geometric sans with an optical size axis, friendly and even.", pairs: ["Geist Mono", "Fraunces"], note: "No tabular figures in its Fontsource build: figures go to the mono." },
  { id: "figtree", family: "Figtree", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "tnum", contexts: ["playful consumer", "product UI"], character: "Clean friendly geometric sans, open and approachable.", pairs: ["Geist Mono", "Fraunces", "Newsreader"] },
  { id: "onest", family: "Onest", category: "sans", variable: true, roles: ["text", "display", "figures"], figures: "tnum", contexts: ["product UI", "playful consumer", "docs"], character: "Humanist-leaning grotesque, soft terminals, good Latin and Cyrillic coverage.", pairs: ["Geist Mono", "JetBrains Mono"] },
  { id: "bricolage-grotesque", family: "Bricolage Grotesque", category: "sans", variable: true, roles: ["display", "figures"], figures: "tnum", contexts: ["playful consumer", "editorial"], character: "Expressive grotesque with optical size and width axes, ink-trap personality at large sizes.", pairs: ["Geist", "Inter", "Geist Mono"], note: "Display only: its character is meant for large sizes." },
  { id: "nunito", family: "Nunito", category: "sans", variable: true, roles: ["display", "text", "figures"], figures: "default", contexts: ["playful consumer"], character: "Rounded-terminal sans, warm and cheerful; the pool's rounded face.", pairs: ["Geist", "Geist Mono"] },
];

export interface Deps {
  fetchImpl?: typeof fetch;
  cwd?: string;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  stdout?: (s: string) => void;
  stderr?: (s: string) => void;
}
interface Resolved {
  fetchImpl: typeof fetch;
  cwd: string;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}
function resolveDeps(d: Deps): Resolved {
  return {
    fetchImpl: d.fetchImpl ?? fetch,
    cwd: d.cwd ?? process.cwd(),
    now: d.now ?? (() => new Date()),
    sleep: d.sleep ?? ((ms) => Bun.sleep(ms)),
    stdout: d.stdout ?? ((s) => process.stdout.write(s + "\n")),
    stderr: d.stderr ?? ((s) => process.stderr.write(s + "\n")),
  };
}

export class FontsError extends Error {}

// ---------- HTTP ----------

function assertHost(url: string): URL {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new FontsError(`not a URL: ${url}`);
  }
  if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) {
    throw new FontsError(`refused host ${u.hostname}: only ${[...ALLOWED_HOSTS].join(", ")} over https`);
  }
  return u;
}

// One attempt plus at most one retry on 429, 5xx, or a network error. The
// retry waits Retry-After (capped at 5 s) or 1 s.
async function request(url: string, deps: Resolved, timeoutMs: number): Promise<Response> {
  assertHost(url);
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response;
    try {
      res = await deps.fetchImpl(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
    } catch (e: any) {
      const name = e?.name ?? "";
      lastError = name === "TimeoutError" || name === "AbortError" ? `timed out after ${timeoutMs} ms` : `network error: ${e?.message ?? e}`;
      if (attempt === 0) {
        await deps.sleep(RETRY_DELAY_MS);
        continue;
      }
      break;
    }
    // A redirect must stay on an allowed host.
    if (res.url) assertHost(res.url);
    if (res.ok) return res;
    lastError = `HTTP ${res.status}`;
    if (res.status === 404) throw new FontsError(`not found (404): ${url}`);
    if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
      const ra = Number(res.headers.get("retry-after"));
      await deps.sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, MAX_RETRY_AFTER_MS) : RETRY_DELAY_MS);
      continue;
    }
    break;
  }
  throw new FontsError(`${url} failed: ${lastError}`);
}

// ---------- validation ----------

export function findFont(name: string | undefined): PoolFont {
  const key = (name ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  const hit = POOL.find((f) => f.id === key || f.family.toLowerCase().replace(/\s+/g, "-") === key);
  if (!hit) {
    throw new FontsError(`${JSON.stringify(name ?? "")} is not in the curated pool (${POOL.map((f) => f.id).join(", ")}). Add a family to POOL in scripts/assets/fonts.ts and to typography.md only after checking it is OFL-1.1.`);
  }
  return hit;
}

// The output directory must resolve inside cwd (symlinks followed on the
// deepest existing ancestor, so a link cannot point it outside).
export function resolveOutDir(cwd: string, out: string | undefined): string {
  const realCwd = realpathSync(cwd);
  const abs = resolve(realCwd, out ?? DEFAULT_OUT);
  let probe = abs;
  while (!existsSync(probe)) {
    const up = dirname(probe);
    if (up === probe) break;
    probe = up;
  }
  const realProbe = existsSync(probe) ? realpathSync(probe) : probe;
  const realAbs = join(realProbe, relative(probe, abs));
  const rel = relative(realCwd, realAbs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new FontsError(`--out must be a directory inside the current working directory (${realCwd}), got ${out}`);
  }
  return realAbs;
}

function list(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const items = value.split(",").map((s) => s.trim()).filter(Boolean);
  if (items.length === 0) throw new FontsError("an empty list was given");
  return items;
}

export function parseWeights(value: string | undefined): number[] | undefined {
  const items = list(value);
  if (!items) return undefined;
  return items.map((w) => {
    const n = Number(w);
    if (!JAL_WEIGHTS.includes(n)) throw new FontsError(`--weights takes JAL weights only (${JAL_WEIGHTS.join(", ")}), got ${w}`);
    return n;
  });
}

// ---------- license ----------

const OFL_TEXT = /SIL Open Font License,?\s+Version 1\.1/i;

export function checkRegistryLicense(doc: any, pkg: string): void {
  if (!doc || doc.name !== pkg || typeof doc.version !== "string") throw new FontsError(`refused ${pkg}: the registry document is not that package`);
  if (doc.license !== LICENSE_ID) throw new FontsError(`refused ${pkg}: npm license is ${JSON.stringify(doc.license)}, only ${LICENSE_ID} is allowed`);
}

export function checkPackageLicense(meta: any, licenseText: string | undefined, pkg: string, id: string): void {
  if (!meta || meta.id !== id) throw new FontsError(`refused ${pkg}: metadata.json is missing or names another font`);
  if (meta.license?.type !== LICENSE_ID) throw new FontsError(`refused ${pkg}: metadata.json license is ${JSON.stringify(meta.license?.type)}, only ${LICENSE_ID} is allowed`);
  if (!licenseText || !OFL_TEXT.test(licenseText)) throw new FontsError(`refused ${pkg}: the LICENSE file is missing or is not the SIL Open Font License 1.1`);
}

// ---------- tar ----------

// Minimal ustar reader for npm tarballs: regular files only, pax and GNU long
// names honoured, everything else skipped. Paths are returned as written;
// callers only ever look up exact names they built themselves.
export function untar(buf: Uint8Array): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  const text = (b: Uint8Array) => new TextDecoder().decode(b).replace(/\0[\s\S]*$/, "");
  let longName: string | undefined;
  let o = 0;
  while (o + 512 <= buf.length) {
    const h = buf.subarray(o, o + 512);
    if (h.every((b) => b === 0)) break;
    const size = parseInt(text(h.subarray(124, 136)).trim() || "0", 8);
    if (!Number.isFinite(size) || size < 0) throw new FontsError("the tarball has a corrupt header");
    const type = String.fromCharCode(h[156] || 48);
    const body = buf.subarray(o + 512, o + 512 + size);
    if (body.length !== size) throw new FontsError("the tarball is truncated");
    let name = text(h.subarray(0, 100));
    if (text(h.subarray(257, 263)).startsWith("ustar")) {
      const prefix = text(h.subarray(345, 500));
      if (prefix) name = `${prefix}/${name}`;
    }
    if (type === "x") {
      const m = new TextDecoder().decode(body).match(/\d+ path=([^\n]*)\n/);
      longName = m?.[1];
    } else if (type === "L") {
      longName = text(body);
    } else {
      if (type === "0") out.set(longName ?? name, body);
      longName = undefined;
    }
    o += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

function sha512(bytes: Uint8Array): string {
  const h = new Bun.CryptoHasher("sha512");
  h.update(bytes);
  return h.digest("base64");
}

// ---------- planning ----------

export interface Plan {
  axes?: string;
  weights: number[];
  weightRange: string;
  subsets: string[];
  styles: string[];
  files: { name: string; subset: string; style: string; weight: string }[];
}

export interface GetOptions {
  weights?: number[];
  subsets?: string[];
  axes?: string;
  styles?: string[];
  static?: boolean;
  out?: string;
}

export function planFiles(font: PoolFont, meta: any, tar: Map<string, Uint8Array>, variable: boolean, opts: GetOptions): Plan {
  const available: string[] = Array.isArray(meta.subsets) ? meta.subsets : [];
  let subsets: string[];
  if (opts.subsets) {
    for (const s of opts.subsets) if (!available.includes(s)) throw new FontsError(`${font.family} has no ${s} subset; available: ${available.join(", ")}`);
    subsets = opts.subsets;
  } else {
    subsets = DEFAULT_SUBSETS.filter((s) => available.includes(s));
    if (subsets.length === 0) throw new FontsError(`${font.family} has neither latin nor latin-ext; pass --subsets from: ${available.join(", ")}`);
  }
  const styles = opts.styles ?? DEFAULT_STYLES;
  for (const s of styles) if (!(meta.styles ?? []).includes(s)) throw new FontsError(`${font.family} has no ${s} style; available: ${(meta.styles ?? []).join(", ")}`);

  const files: Plan["files"] = [];
  const need = (name: string, subset: string, style: string, weight: string) => {
    if (!/^[a-z0-9-]+\.woff2$/.test(name)) throw new FontsError(`unsafe file name ${name}`);
    if (!tar.has(`package/files/${name}`)) throw new FontsError(`${font.family} ships no files/${name} in this package`);
    files.push({ name, subset, style, weight });
  };

  if (variable) {
    const wght = meta.variable?.wght;
    if (!wght) throw new FontsError(`${font.family} has no wght axis in its variable build; use --static`);
    const min = Number(wght.min);
    const max = Number(wght.max);
    const weights = opts.weights ?? JAL_WEIGHTS.filter((w) => w >= min && w <= max);
    for (const w of weights) if (w < min || w > max) throw new FontsError(`${font.family} runs wght ${min} to ${max}, so ${w} is out of range`);
    const axes = opts.axes ?? DEFAULT_AXES;
    if (!/^[a-z]+$/.test(axes)) throw new FontsError(`--axes must be one axis key such as wght, opsz, wdth, standard, or full, got ${axes}`);
    const keys = new Set([...tar.keys()].map((k) => k.match(new RegExp(`^package/files/${font.id}-.+-([a-z]+)-(normal|italic)\\.woff2$`))?.[1]).filter(Boolean) as string[]);
    if (!keys.has(axes)) throw new FontsError(`${font.family} has no "${axes}" axis files; available: ${[...keys].sort().join(", ")}`);
    const range = `${min} ${max}`;
    for (const subset of subsets) for (const style of styles) need(`${font.id}-${subset}-${axes}-${style}.woff2`, subset, style, range);
    return { axes, weights, weightRange: range, subsets, styles, files };
  }

  const have: number[] = (meta.weights ?? []).map(Number);
  const weights = opts.weights ?? JAL_WEIGHTS.filter((w) => have.includes(w));
  if (weights.length === 0) throw new FontsError(`${font.family} has none of the JAL weights (${JAL_WEIGHTS.join(", ")}); available: ${have.join(", ")}`);
  for (const w of weights) if (!have.includes(w)) throw new FontsError(`${font.family} has no weight ${w}; available: ${have.join(", ")}`);
  for (const subset of subsets) for (const style of styles) for (const w of weights) need(`${font.id}-${subset}-${w}-${style}.woff2`, subset, style, String(w));
  return { weights, weightRange: weights.join(", "), subsets, styles, files };
}

export function fontFaceCss(font: PoolFont, version: string, pkg: string, plan: Plan, ranges: Record<string, string>): string {
  const head = `/* ${font.family} ${version} (${pkg}), SIL Open Font License 1.1, license in ./OFL.txt.\n   Generated by scripts/assets/fonts.ts. Import this file once, then name\n   "${font.family}" first in a --kit-font-* stack that ends in the Geist stack. */\n`;
  const rules = plan.files.map((f) => {
    const range = ranges[f.subset];
    return [
      "@font-face {",
      `  font-family: "${font.family}";`,
      `  src: url("./${f.name}") format("woff2");`,
      `  font-weight: ${f.weight};`,
      `  font-style: ${f.style};`,
      "  font-display: swap;",
      ...(range && /^[U+0-9A-Fa-f,\-?\s]+$/.test(range) ? [`  unicode-range: ${range};`] : []),
      "}",
    ].join("\n");
  });
  return head + "\n" + rules.join("\n\n") + "\n";
}

const LEDGER_HEAD = [
  "# Fonts",
  "",
  "Fetched by JAL-AIDEV `scripts/assets/fonts.ts` from the npm registry (Fontsource builds). Every row is SIL Open Font License 1.1; each family's license text sits beside its files as OFL.txt.",
  "",
  "| Family | Version | License | Source | Files | Fetched |",
  "|---|---|---|---|---|---|",
  "",
].join("\n");

async function appendLedger(outDir: string, row: string[]) {
  const path = join(outDir, "FONTS.md");
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  if (!existsSync(path)) await writeFile(path, LEDGER_HEAD);
  await appendFile(path, `| ${row.map(cell).join(" | ")} |\n`);
}

// ---------- commands ----------

export function listPool(role?: Role) {
  const pool = role ? POOL.filter((f) => f.roles.includes(role)) : POOL;
  return { tool: "fonts", command: "list", license: LICENSE_ID, count: pool.length, pool };
}

export async function get(name: string, opts: GetOptions, deps: Resolved) {
  const font = findFont(name);
  if (font.vendored) {
    throw new FontsError(`${font.family} is the JAL Core default and is already vendored in packages/ui/src/fonts (official Geist release); nothing to fetch`);
  }
  const variable = font.variable && !opts.static;
  const pkg = `${variable ? "@fontsource-variable" : "@fontsource"}/${font.id}`;
  const outDir = resolveOutDir(deps.cwd, opts.out);

  const docRes = await request(`${REGISTRY}/${pkg.replace("/", "%2f")}/latest`, deps, META_TIMEOUT_MS);
  let doc: any;
  try {
    doc = await docRes.json();
  } catch {
    throw new FontsError(`the registry document for ${pkg} is not JSON`);
  }
  checkRegistryLicense(doc, pkg);
  const tarballUrl = String(doc.dist?.tarball ?? "");
  assertHost(tarballUrl);
  const integrity = String(doc.dist?.integrity ?? "");
  if (!integrity.startsWith("sha512-")) throw new FontsError(`refused ${pkg}: the registry gives no sha512 integrity`);

  const tarRes = await request(tarballUrl, deps, TARBALL_TIMEOUT_MS);
  const declared = Number(tarRes.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_TARBALL_BYTES) throw new FontsError(`${pkg} tarball is ${declared} bytes, over the ${MAX_TARBALL_BYTES} byte cap`);
  const tgz = new Uint8Array(await tarRes.arrayBuffer());
  if (tgz.length > MAX_TARBALL_BYTES) throw new FontsError(`${pkg} tarball is ${tgz.length} bytes, over the ${MAX_TARBALL_BYTES} byte cap`);
  if (`sha512-${sha512(tgz)}` !== integrity) throw new FontsError(`refused ${pkg}: the tarball does not match the registry integrity`);

  let tar: Map<string, Uint8Array>;
  try {
    tar = untar(new Uint8Array(gunzipSync(tgz)));
  } catch (e: any) {
    throw e instanceof FontsError ? e : new FontsError(`${pkg} tarball could not be unpacked: ${e?.message ?? e}`);
  }
  const readText = (p: string) => {
    const b = tar.get(`package/${p}`);
    return b ? new TextDecoder().decode(b) : undefined;
  };
  let meta: any;
  let ranges: Record<string, string> = {};
  try {
    meta = JSON.parse(readText("metadata.json") ?? "null");
    ranges = JSON.parse(readText("unicode.json") ?? "{}");
  } catch {
    throw new FontsError(`refused ${pkg}: metadata.json or unicode.json is not valid JSON`);
  }
  const licenseText = readText("LICENSE");
  checkPackageLicense(meta, licenseText, pkg, font.id);

  const plan = planFiles(font, meta, tar, variable, opts);
  const css = fontFaceCss(font, doc.version, pkg, plan, ranges);

  const finalDir = join(outDir, font.id);
  const stageDir = join(outDir, `.${font.id}.partial-${process.pid}-${deps.now().getTime()}`);
  await mkdir(stageDir, { recursive: true });
  const written: { name: string; bytes: number }[] = [];
  try {
    for (const f of plan.files) {
      const bytes = tar.get(`package/files/${f.name}`)!;
      await writeFile(join(stageDir, f.name), bytes);
      written.push({ name: f.name, bytes: bytes.length });
    }
    await writeFile(join(stageDir, "OFL.txt"), licenseText!);
    await writeFile(join(stageDir, `${font.id}.css`), css);
    await mkdir(finalDir, { recursive: true });
    for (const name of [...written.map((w) => w.name), "OFL.txt", `${font.id}.css`]) {
      await rename(join(stageDir, name), join(finalDir, name));
    }
  } finally {
    await rm(stageDir, { recursive: true, force: true });
  }

  const rel = (p: string) => relative(realpathSync(deps.cwd), p).split(sep).join("/");
  const shape = variable ? `${plan.axes} axis, wght ${plan.weightRange}` : `weights ${plan.weightRange}`;
  const totalBytes = written.reduce((s, w) => s + w.bytes, 0);
  await appendLedger(outDir, [
    font.family,
    `${doc.version} (${pkg})`,
    LICENSE_ID,
    `https://www.npmjs.com/package/${pkg}; upstream ${String(meta.source ?? "unknown")}`,
    `${rel(finalDir)}/: ${written.length} woff2 (${shape}; ${plan.subsets.join(", ")}; ${plan.styles.join(", ")}), ${totalBytes} bytes`,
    deps.now().toISOString().slice(0, 10),
  ]);

  const role = font.roles.includes("display") && !font.roles.includes("text") ? "--kit-font-display" : font.category === "mono" ? "--kit-font-mono" : "--kit-font-sans or --kit-font-display";
  const fallback = font.category === "mono" ? "var(--font-mono)" : "var(--font-sans)";
  return {
    tool: "fonts",
    command: "get",
    family: font.family,
    package: pkg,
    version: doc.version,
    license: LICENSE_ID,
    variable,
    axes: plan.axes,
    weights: plan.weights,
    subsets: plan.subsets,
    styles: plan.styles,
    dir: rel(finalDir),
    css: `${rel(finalDir)}/${font.id}.css`,
    files: written.map((w) => ({ path: `${rel(finalDir)}/${w.name}`, bytes: w.bytes })),
    totalBytes,
    ledger: rel(join(outDir, "FONTS.md")),
    use: {
      import: `@import "<path from your entry css>/${rel(finalDir)}/${font.id}.css";`,
      variable: `${role}: "${font.family}", ${fallback};`,
    },
  };
}

// ---------- CLI ----------

const USAGE = [
  "usage:",
  "  fonts.ts list [--role text|display|mono|figures]",
  "  fonts.ts get <family> [--weights 400,500,600] [--subsets latin,latin-ext] [--axes wght|opsz|wdth|standard|full] [--styles normal,italic] [--static] [--out assets/fonts]",
].join("\n");

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        role: { type: "string" },
        weights: { type: "string" },
        subsets: { type: "string" },
        axes: { type: "string" },
        styles: { type: "string" },
        static: { type: "boolean" },
        out: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    });
    const [command, ...rest] = positionals;
    if (values.help || !command) {
      deps.stdout(USAGE);
      return values.help ? 0 : 1;
    }
    let result: unknown;
    if (command === "list") {
      const role = values.role as Role | undefined;
      if (role !== undefined && !ROLES.includes(role)) throw new FontsError(`--role must be one of ${ROLES.join(", ")}, got ${role}`);
      result = listPool(role);
    } else if (command === "get") {
      const name = rest.join(" ").trim();
      if (!name) throw new FontsError(`get needs a family\n${USAGE}`);
      result = await get(
        name,
        {
          weights: parseWeights(values.weights),
          subsets: list(values.subsets),
          axes: values.axes,
          styles: list(values.styles),
          static: values.static,
          out: values.out,
        },
        deps,
      );
    } else {
      throw new FontsError(`unknown command ${command}\n${USAGE}`);
    }
    deps.stdout(JSON.stringify(result, null, 2));
    return 0;
  } catch (e: any) {
    deps.stderr(`fonts: ${e instanceof FontsError ? e.message : e?.message ?? String(e)}`);
    return e instanceof FontsError ? 2 : 1;
  }
}

if (import.meta.main) {
  process.exit(await main(Bun.argv.slice(2)));
}
