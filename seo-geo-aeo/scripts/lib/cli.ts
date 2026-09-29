// Shared CLI plumbing: injectable dependencies (so tests mock fetch, env and
// output), URL list reading, chunking and redacted output.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import type { FetchLike } from "./http.ts";
import { Redactor, type Env } from "./redact.ts";

export type Deps = {
  fetchImpl?: FetchLike;
  env?: Env;
  cwd?: string;
  out?: (s: string) => void;
  err?: (s: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
};

export type ResolvedDeps = Required<Deps>;

export function resolveDeps(d: Deps = {}): ResolvedDeps {
  return {
    fetchImpl: d.fetchImpl ?? (fetch as FetchLike),
    env: d.env ?? process.env,
    cwd: d.cwd ?? process.cwd(),
    out: d.out ?? ((s) => process.stdout.write(s.endsWith("\n") ? s : s + "\n")),
    err: d.err ?? ((s) => process.stderr.write(s.endsWith("\n") ? s : s + "\n")),
    sleep: d.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms))),
    now: d.now ?? (() => new Date()),
  };
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error("chunk size must be at least 1");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** --urls a,b --urls c and --urls-file list.txt (one per line, # comments). */
export async function readUrlList(values: string[] | undefined, file: string | undefined, cwd: string): Promise<string[]> {
  const out: string[] = [];
  for (const v of values ?? []) out.push(...v.split(",").map((s) => s.trim()).filter(Boolean));
  if (file) {
    const path = isAbsolute(file) ? file : join(cwd, file);
    if (!existsSync(path)) throw new Error(`urls file not found: ${file}`);
    const text = await readFile(path, "utf8");
    out.push(...text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
  }
  return [...new Set(out)];
}

/** Every URL must be on the site's host (the www or apex twin is not accepted here). */
export function assertUrlsOnSite(urls: string[], siteUrl: string): string[] {
  const host = new URL(siteUrl).host;
  const bad: string[] = [];
  const resolved = urls.map((u) => {
    let abs: URL;
    try {
      abs = new URL(u, siteUrl);
    } catch {
      bad.push(u);
      return u;
    }
    if (abs.host !== host) bad.push(u);
    return abs.href;
  });
  if (bad.length) throw new Error(`refused: ${bad.length} URL(s) are not on ${host}: ${bad.slice(0, 5).join(", ")}`);
  return resolved;
}

export function emitJson(deps: ResolvedDeps, redactor: Redactor, value: unknown): void {
  deps.out(redactor.json(value));
}

export function emitError(deps: ResolvedDeps, redactor: Redactor, err: unknown): void {
  deps.err(`error: ${redactor.error(err)}`);
}

export function makeRedactor(deps: ResolvedDeps): Redactor {
  return new Redactor(deps.env);
}

export function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}
