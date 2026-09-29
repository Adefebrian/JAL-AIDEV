#!/usr/bin/env bun
// polyhaven.ts search <query> [--type hdris|models|textures] [--limit 20]
// polyhaven.ts info <id>
// polyhaven.ts get <id> --type models|hdris|textures --res 1k|2k|4k --format gltf|hdr|exr|jpg [--out <dir>] [--maps a,b] [--max-mb 200]
//
// Fetches CC0 assets from Poly Haven (https://polyhaven.com, public API at
// https://api.polyhaven.com) straight into the client project at build time,
// approved by Brian 2026-09-29. Zero dependencies: fetch, node:fs, node:path.
//
// Rules this script enforces:
//   - Only api.polyhaven.com and dl.polyhaven.org are contacted.
//   - The license is checked before anything is written: a license field that
//     is not CC0 is refused; with no field, Poly Haven's site-wide CC0 license
//     applies (https://polyhaven.com/license) and is recorded as the basis.
//   - The output directory must resolve inside the current working directory.
//   - glTF: the .gltf plus every .bin and texture it references, at the chosen
//     resolution, keeping relative paths, into <out>/<id>/. Each file's size
//     and md5 are checked against the API before it is kept.
//   - Every download appends one row to <out>/ASSETS.md.
//   - Timeouts on every request; at most one retry on 429, 5xx, or a network
//     error, never a retry storm.
//
// Never run this inside the JAL-AIDEV plugin or template: assets live only in
// the client project that uses them.

import { parseArgs } from "node:util";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile, appendFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";

export const API = "https://api.polyhaven.com";
export const ALLOWED_HOSTS = new Set(["api.polyhaven.com", "dl.polyhaven.org"]);
export const USER_AGENT = "JAL-AIDEV-asset-fetcher/1.0 (+https://polyhaven.com/our-api)";
export const LICENSE_URL = "https://polyhaven.com/license";
export const DEFAULT_OUT = "assets/polyhaven";
export const API_TIMEOUT_MS = 15_000;
export const FILE_TIMEOUT_MS = 120_000;
export const RETRY_DELAY_MS = 1_000;
export const MAX_RETRY_AFTER_MS = 5_000;
export const PARALLEL = 4;

export type AssetType = "hdris" | "models" | "textures";
export const TYPES: AssetType[] = ["hdris", "models", "textures"];
export const TYPE_CODE: Record<AssetType, number> = { hdris: 0, textures: 1, models: 2 };
export const RESOLUTIONS = ["1k", "2k", "4k"] as const;
export const FORMATS: Record<AssetType, string[]> = { models: ["gltf"], hdris: ["hdr", "exr"], textures: ["jpg"] };
// Texture map keys skipped by default: DirectX normals (three wants GL), and
// displacement (no tessellation in real time). --maps overrides.
export const TEXTURE_SKIP = new Set(["nor_dx", "displacement", "blend", "gltf", "mtlx", "usd", "fbx"]);

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

export class PolyHavenError extends Error {}

// ---------- HTTP ----------

function assertHost(url: string): URL {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new PolyHavenError(`not a URL: ${url}`);
  }
  if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) {
    throw new PolyHavenError(`refused host ${u.hostname}: only ${[...ALLOWED_HOSTS].join(", ")} over https`);
  }
  return u;
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

// One attempt plus at most one retry. The retry waits Retry-After (capped at
// 5 s) or 1 s. Returns the Response; the caller reads the body.
export async function request(url: string, deps: Resolved, timeoutMs: number): Promise<Response> {
  assertHost(url);
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Response | undefined;
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
    if (res.url) {
      // A redirect must stay on an allowed host.
      assertHost(res.url);
    }
    if (res.ok) return res;
    lastError = `HTTP ${res.status}`;
    if (res.status === 404) throw new PolyHavenError(`not found (404): ${url}`);
    if (attempt === 0 && isRetryable(res.status)) {
      const ra = Number(res.headers.get("retry-after"));
      await deps.sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, MAX_RETRY_AFTER_MS) : RETRY_DELAY_MS);
      continue;
    }
    break;
  }
  throw new PolyHavenError(`${url} failed: ${lastError}`);
}

async function getJson<T = any>(path: string, deps: Resolved): Promise<T> {
  const url = `${API}${path}`;
  const res = await request(url, deps, API_TIMEOUT_MS);
  try {
    return (await res.json()) as T;
  } catch {
    throw new PolyHavenError(`${url} returned invalid JSON`);
  }
}

// ---------- validation ----------

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
export function assertId(id: string | undefined): string {
  if (!id || !ID_RE.test(id) || id.includes("..")) throw new PolyHavenError(`invalid asset id: ${JSON.stringify(id)}`);
  return id;
}

export function assertType(t: string | undefined, required: boolean): AssetType | undefined {
  if (t === undefined) {
    if (required) throw new PolyHavenError("--type is required: hdris, models, or textures");
    return undefined;
  }
  if (!TYPES.includes(t as AssetType)) throw new PolyHavenError(`--type must be hdris, models, or textures, got ${t}`);
  return t as AssetType;
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
    throw new PolyHavenError(`--out must be a directory inside the current working directory (${realCwd}), got ${out}`);
  }
  return realAbs;
}

// A path taken from the API or a glTF file, kept relative under the asset dir.
export function safeRelative(p: string): string {
  const decoded = decodeURIComponent(p);
  const n = normalize(decoded).split(sep).join("/");
  if (!n || isAbsolute(decoded) || n.startsWith("../") || n === ".." || n.includes("/../") || /^[a-zA-Z]:/.test(decoded)) {
    throw new PolyHavenError(`unsafe relative path in asset: ${p}`);
  }
  return n;
}

export interface LicenseCheck {
  license: "CC0";
  basis: string;
}

// Poly Haven publishes every asset under CC0 and the API carries no license
// field today. If a field ever appears, it must say CC0 or the asset is refused.
export function checkLicense(info: any, id: string): LicenseCheck {
  if (!info || typeof info !== "object" || typeof info.name !== "string" || typeof info.type !== "number" || !info.authors) {
    throw new PolyHavenError(`refused ${id}: the info payload is not a recognisable Poly Haven asset, license cannot be confirmed`);
  }
  for (const key of ["license", "licence", "license_id"]) {
    if (key in info) {
      const v = String(info[key] ?? "");
      if (!/^\s*cc0/i.test(v) && !/creativecommons\.org\/publicdomain\/zero/i.test(v)) {
        throw new PolyHavenError(`refused ${id}: license is ${JSON.stringify(v)}, only CC0 is allowed`);
      }
      return { license: "CC0", basis: `info.${key} = ${v}` };
    }
  }
  return { license: "CC0", basis: `Poly Haven site-wide CC0 license (${LICENSE_URL}); no per-asset license field` };
}

// ---------- search and info ----------

export interface SearchHit {
  id: string;
  name: string;
  type: AssetType;
  categories: string[];
  tags: string[];
  polycount?: number;
  dimensionsM?: [number, number, number];
  maxResolution?: [number, number];
  downloads?: number;
  page: string;
}

function typeName(code: number): AssetType {
  return code === 0 ? "hdris" : code === 1 ? "textures" : "models";
}

function toHit(id: string, v: any): SearchHit {
  const hit: SearchHit = {
    id,
    name: String(v.name ?? id),
    type: typeName(Number(v.type)),
    categories: Array.isArray(v.categories) ? v.categories : [],
    tags: Array.isArray(v.tags) ? v.tags : [],
    page: `https://polyhaven.com/a/${id}`,
  };
  if (typeof v.polycount === "number") hit.polycount = v.polycount;
  if (Array.isArray(v.dimensions) && v.dimensions.length === 3) {
    // Poly Haven dimensions are millimetres.
    hit.dimensionsM = v.dimensions.map((d: number) => Math.round(d) / 1000) as [number, number, number];
  }
  if (Array.isArray(v.max_resolution)) hit.maxResolution = v.max_resolution as [number, number];
  if (typeof v.download_count === "number") hit.downloads = v.download_count;
  return hit;
}

export function filterAssets(all: Record<string, any>, query: string): SearchHit[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];
  for (const [id, v] of Object.entries(all)) {
    const hay = [id, v.name, ...(v.tags ?? []), ...(v.categories ?? [])].join(" ").toLowerCase();
    if (tokens.every((t) => hay.includes(t))) hits.push(toHit(id, v));
  }
  return hits.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0) || a.id.localeCompare(b.id));
}

export async function search(query: string, type: AssetType | undefined, limit: number, deps: Resolved) {
  const all = await getJson<Record<string, any>>(`/assets?t=${type ?? "all"}`, deps);
  const hits = filterAssets(all, query);
  return { tool: "polyhaven", command: "search", query, type: type ?? "all", count: hits.length, results: hits.slice(0, limit) };
}

function summariseFiles(files: any): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, byRes] of Object.entries<any>(files ?? {})) {
    if (!byRes || typeof byRes !== "object") continue;
    const res = Object.keys(byRes).filter((r) => /^\d+k$/.test(r));
    if (res.length) out[key] = res.sort((a, b) => parseInt(a) - parseInt(b));
  }
  return out;
}

export async function info(id: string, deps: Resolved) {
  const data = await getJson(`/info/${id}`, deps);
  const license = checkLicense(data, id);
  const files = await getJson(`/files/${id}`, deps);
  return { tool: "polyhaven", command: "info", ...toHit(id, data), authors: data.authors ?? {}, license, available: summariseFiles(files) };
}

// ---------- download planning ----------

export interface PlannedFile {
  url: string;
  rel: string;
  size?: number;
  md5?: string;
}

export function planFiles(type: AssetType, files: any, res: string, format: string, maps?: string[]): PlannedFile[] {
  const plan: PlannedFile[] = [];
  const add = (url: string, rel: string, size?: number, md5?: string) => {
    assertHost(url);
    plan.push({ url, rel: safeRelative(rel), size, md5 });
  };
  if (type === "models") {
    const entry = files?.gltf?.[res]?.gltf;
    if (!entry?.url) throw new PolyHavenError(`no glTF at ${res}; available: ${Object.keys(files?.gltf ?? {}).join(", ") || "none"}`);
    add(entry.url, basename(new URL(entry.url).pathname), entry.size, entry.md5);
    for (const [rel, f] of Object.entries<any>(entry.include ?? {})) add(f.url, rel, f.size, f.md5);
    return plan;
  }
  if (type === "hdris") {
    const entry = files?.hdri?.[res]?.[format];
    if (!entry?.url) throw new PolyHavenError(`no ${format} HDRI at ${res}; available: ${Object.keys(files?.hdri ?? {}).join(", ") || "none"}`);
    add(entry.url, basename(new URL(entry.url).pathname), entry.size, entry.md5);
    return plan;
  }
  const wanted = maps?.map((m) => m.toLowerCase());
  for (const [key, byRes] of Object.entries<any>(files ?? {})) {
    const k = key.toLowerCase();
    if (wanted ? !wanted.includes(k) : TEXTURE_SKIP.has(k)) continue;
    const entry = byRes?.[res]?.[format];
    if (!entry?.url) continue;
    add(entry.url, basename(new URL(entry.url).pathname), entry.size, entry.md5);
  }
  if (plan.length === 0) throw new PolyHavenError(`no ${format} texture maps at ${res}${wanted ? ` for maps ${wanted.join(",")}` : ""}`);
  return plan;
}

// Every non-data URI a glTF references (buffers and images) must be in the plan.
export function gltfReferences(gltf: any): string[] {
  const uris: string[] = [];
  for (const b of gltf?.buffers ?? []) if (typeof b.uri === "string" && !b.uri.startsWith("data:")) uris.push(safeRelative(b.uri));
  for (const i of gltf?.images ?? []) if (typeof i.uri === "string" && !i.uri.startsWith("data:")) uris.push(safeRelative(i.uri));
  return [...new Set(uris)];
}

function md5(bytes: Uint8Array): string {
  const h = new Bun.CryptoHasher("md5");
  h.update(bytes);
  return h.digest("hex");
}

async function download(f: PlannedFile, stageDir: string, deps: Resolved): Promise<number> {
  const res = await request(f.url, deps, FILE_TIMEOUT_MS);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (f.size !== undefined && bytes.byteLength !== f.size) {
    throw new PolyHavenError(`${f.rel}: size ${bytes.byteLength} does not match the API's ${f.size}`);
  }
  if (f.md5 && md5(bytes) !== f.md5.toLowerCase()) throw new PolyHavenError(`${f.rel}: md5 does not match the API`);
  const dest = join(stageDir, f.rel);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  return bytes.byteLength;
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  let failed: unknown;
  const worker = async () => {
    while (next < items.length && failed === undefined) {
      const item = items[next++];
      try {
        await fn(item);
      } catch (e) {
        failed ??= e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  if (failed !== undefined) throw failed;
}

const LEDGER_HEADER = [
  "# Third-party assets",
  "",
  "Downloaded by scripts/assets/polyhaven.ts. Poly Haven assets are CC0 (public domain, no attribution required); authors are listed as a courtesy.",
  "",
  "| id | type | resolution | format | source | license | authors | date |",
  "|---|---|---|---|---|---|---|---|",
  "",
].join("\n");

export async function appendLedger(outDir: string, row: { id: string; type: AssetType; res: string; format: string; source: string; authors: string; date: string }) {
  const path = join(outDir, "ASSETS.md");
  if (!existsSync(path)) await writeFile(path, LEDGER_HEADER);
  const cell = (s: string) => s.replace(/\|/g, "/").replace(/\n/g, " ");
  await appendFile(path, `| ${cell(row.id)} | ${row.type} | ${row.res} | ${row.format} | ${cell(row.source)} | CC0 | ${cell(row.authors)} | ${row.date} |\n`);
}

export async function get(
  id: string,
  opts: { type: AssetType; res: string; format: string; out?: string; maps?: string[]; maxMb: number },
  deps: Resolved,
) {
  if (!RESOLUTIONS.includes(opts.res as any)) throw new PolyHavenError(`--res must be ${RESOLUTIONS.join(", ")}, got ${opts.res}`);
  if (!FORMATS[opts.type].includes(opts.format)) {
    throw new PolyHavenError(`--format for ${opts.type} must be ${FORMATS[opts.type].join(" or ")}, got ${opts.format}`);
  }
  const outDir = resolveOutDir(deps.cwd, opts.out);

  const data = await getJson(`/info/${id}`, deps);
  const license = checkLicense(data, id);
  if (Number(data.type) !== TYPE_CODE[opts.type]) {
    throw new PolyHavenError(`${id} is a ${typeName(Number(data.type))} asset, not ${opts.type}`);
  }
  const files = await getJson(`/files/${id}`, deps);
  const plan = planFiles(opts.type, files, opts.res, opts.format, opts.maps);
  const planned = plan.reduce((s, f) => s + (f.size ?? 0), 0);
  if (planned > opts.maxMb * 1024 * 1024) {
    throw new PolyHavenError(`${id} at ${opts.res} is ${(planned / 1048576).toFixed(1)} MB, over --max-mb ${opts.maxMb}; pick a lower --res or raise the cap`);
  }

  const finalDir = join(outDir, id);
  const stageDir = join(outDir, `.${id}.partial-${process.pid}-${deps.now().getTime()}`);
  await mkdir(stageDir, { recursive: true });
  let bytes = 0;
  try {
    await pool(plan, PARALLEL, async (f) => {
      bytes += await download(f, stageDir, deps);
    });
    if (opts.type === "models") {
      const gltfRel = plan[0].rel;
      let gltf: any;
      try {
        gltf = JSON.parse(await readFile(join(stageDir, gltfRel), "utf8"));
      } catch {
        throw new PolyHavenError(`${gltfRel} is not valid glTF JSON`);
      }
      const have = new Set(plan.map((f) => f.rel));
      const missing = gltfReferences(gltf).filter((u) => !have.has(u));
      if (missing.length) throw new PolyHavenError(`${gltfRel} references files the API did not list: ${missing.join(", ")}`);
    }
    await mkdir(finalDir, { recursive: true });
    for (const f of plan) {
      const dest = join(finalDir, f.rel);
      await mkdir(dirname(dest), { recursive: true });
      await rename(join(stageDir, f.rel), dest);
    }
  } finally {
    await rm(stageDir, { recursive: true, force: true });
  }

  const date = deps.now().toISOString().slice(0, 10);
  const authors = Object.keys(data.authors ?? {}).join(", ");
  const source = `https://polyhaven.com/a/${id}`;
  await appendLedger(outDir, { id, type: opts.type, res: opts.res, format: opts.format, source, authors, date });

  const rel = (p: string) => relative(realpathSync(deps.cwd), p).split(sep).join("/");
  return {
    tool: "polyhaven",
    command: "get",
    id,
    type: opts.type,
    res: opts.res,
    format: opts.format,
    license,
    dir: rel(finalDir),
    entry: `${rel(finalDir)}/${plan[0].rel}`,
    files: plan.map((f) => ({ path: `${rel(finalDir)}/${f.rel}`, bytes: f.size })),
    totalBytes: bytes,
    ledger: rel(join(outDir, "ASSETS.md")),
  };
}

// ---------- CLI ----------

const USAGE = [
  "usage:",
  "  polyhaven.ts search <query> [--type hdris|models|textures] [--limit 20]",
  "  polyhaven.ts info <id>",
  "  polyhaven.ts get <id> --type models|hdris|textures --res 1k|2k|4k --format gltf|hdr|exr|jpg [--out assets/polyhaven] [--maps Diffuse,nor_gl,Rough] [--max-mb 200]",
].join("\n");

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        type: { type: "string" },
        res: { type: "string" },
        format: { type: "string" },
        out: { type: "string" },
        maps: { type: "string" },
        limit: { type: "string" },
        "max-mb": { type: "string" },
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
    if (command === "search") {
      const query = rest.join(" ").trim();
      if (!query) throw new PolyHavenError("search needs a query");
      const limit = values.limit ? Math.max(1, Math.min(200, Number(values.limit) || 20)) : 20;
      result = await search(query, assertType(values.type, false), limit, deps);
    } else if (command === "info") {
      result = await info(assertId(rest[0]), deps);
    } else if (command === "get") {
      const type = assertType(values.type, true)!;
      const res = values.res ?? "1k";
      const format = values.format ?? FORMATS[type][0];
      const maxMb = values["max-mb"] ? Number(values["max-mb"]) : 200;
      if (!Number.isFinite(maxMb) || maxMb <= 0) throw new PolyHavenError("--max-mb must be a positive number");
      const maps = values.maps ? values.maps.split(",").map((m) => m.trim()).filter(Boolean) : undefined;
      result = await get(assertId(rest[0]), { type, res, format, out: values.out, maps, maxMb }, deps);
    } else {
      throw new PolyHavenError(`unknown command ${command}\n${USAGE}`);
    }
    deps.stdout(JSON.stringify(result, null, 2));
    return 0;
  } catch (e: any) {
    deps.stderr(`polyhaven: ${e instanceof PolyHavenError ? e.message : e?.message ?? String(e)}`);
    return e instanceof PolyHavenError ? 2 : 1;
  }
}

if (import.meta.main) {
  process.exit(await main(Bun.argv.slice(2)));
}
