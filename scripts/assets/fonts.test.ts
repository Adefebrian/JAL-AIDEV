import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, realpathSync } from "node:fs";
import { readFile, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { POOL, findFont, main, parseWeights, resolveOutDir, untar, type Deps } from "./fonts.ts";

// No network in these tests: every request goes through a mocked fetch that
// serves registry documents and in-memory npm tarballs.

const OFL = "Copyright 2020 The Newsreader Project Authors\n\nThis Font Software is licensed under the SIL Open Font License, Version 1.1.\n";
const LATIN = "U+0000-00FF,U+0131,U+2000-206F";
const LATIN_EXT = "U+0100-02BA,U+1E00-1E9F";

// A minimal ustar writer: enough for the reader under test.
function tar(files: Record<string, string | Uint8Array>, opts: { longName?: string } = {}): Uint8Array {
  const enc = new TextEncoder();
  const blocks: Uint8Array[] = [];
  const header = (name: string, size: number, type: string) => {
    const h = new Uint8Array(512);
    const put = (s: string, at: number, len: number) => h.set(enc.encode(s).subarray(0, len), at);
    put(name, 0, 100);
    put("0000644\0", 100, 8);
    put("0000000\0", 108, 8);
    put("0000000\0", 116, 8);
    put(size.toString(8).padStart(11, "0") + "\0", 124, 12);
    put("00000000000\0", 136, 12);
    put("        ", 148, 8);
    put(type, 156, 1);
    put("ustar\0", 257, 6);
    put("00", 263, 2);
    let sum = 0;
    for (const b of h) sum += b;
    put(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8);
    return h;
  };
  const pad = (n: number) => new Uint8Array((512 - (n % 512)) % 512);
  const add = (name: string, body: Uint8Array, type = "0") => {
    blocks.push(header(name, body.length, type), body, pad(body.length));
  };
  for (const [name, content] of Object.entries(files)) add(name, typeof content === "string" ? enc.encode(content) : content);
  if (opts.longName) {
    const rec = ` path=${opts.longName}\n`;
    const line = `${rec.length + String(rec.length + 2).length}${rec}`;
    add("PaxHeader", enc.encode(line), "x");
    add("short-name-ignored", enc.encode("long body"));
  }
  add("package/dir/", new Uint8Array(0), "5");
  blocks.push(new Uint8Array(1024));
  const total = blocks.reduce((s, b) => s + b.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const b of blocks) {
    out.set(b, o);
    o += b.length;
  }
  return out;
}

function integrity(bytes: Uint8Array) {
  const h = new Bun.CryptoHasher("sha512");
  h.update(bytes);
  return `sha512-${h.digest("base64")}`;
}

interface Pkg {
  name: string;
  license: string;
  meta: any;
  licenseText?: string;
  files: Record<string, string>;
}

function newsreader(): Pkg {
  const files: Record<string, string> = {};
  for (const subset of ["latin", "latin-ext", "vietnamese"]) {
    for (const axis of ["wght", "opsz", "standard"]) {
      for (const style of ["normal", "italic"]) files[`newsreader-${subset}-${axis}-${style}.woff2`] = `wOF2 ${subset} ${axis} ${style}`;
    }
    files[`newsreader-${subset}-wght-normal.woff`] = "woff1 is never copied";
  }
  return {
    name: "@fontsource-variable/newsreader",
    license: "OFL-1.1",
    meta: {
      id: "newsreader",
      family: "Newsreader",
      subsets: ["latin", "latin-ext", "vietnamese"],
      weights: [200, 300, 400, 500, 600, 700, 800],
      styles: ["italic", "normal"],
      variable: { ital: { min: "0", max: "1" }, opsz: { min: "6", max: "72" }, wght: { min: "200", max: "800" } },
      license: { type: "OFL-1.1", url: "https://openfontlicense.org" },
      source: "https://github.com/google/fonts",
    },
    licenseText: OFL,
    files,
  };
}

function plexMono(): Pkg {
  const files: Record<string, string> = {};
  for (const subset of ["latin", "latin-ext", "cyrillic"]) for (const w of [100, 400, 500, 600, 700]) files[`ibm-plex-mono-${subset}-${w}-normal.woff2`] = `wOF2 ${subset} ${w}`;
  return {
    name: "@fontsource/ibm-plex-mono",
    license: "OFL-1.1",
    meta: { id: "ibm-plex-mono", family: "IBM Plex Mono", subsets: ["cyrillic", "latin", "latin-ext"], weights: [100, 400, 500, 600, 700], styles: ["italic", "normal"], variable: false, license: { type: "OFL-1.1" }, source: "https://github.com/google/fonts" },
    licenseText: OFL,
    files,
  };
}

let registry: Map<string, { pkg: Pkg; tgz: Uint8Array; integrity: string }>;
function publish(pkg: Pkg, tamper?: (tgz: Uint8Array) => Uint8Array) {
  const entries: Record<string, string> = {
    "package/package.json": JSON.stringify({ name: pkg.name }),
    "package/metadata.json": JSON.stringify(pkg.meta),
    "package/unicode.json": JSON.stringify({ latin: LATIN, "latin-ext": LATIN_EXT, vietnamese: "U+0102-0103", cyrillic: "U+0400-045F" }),
  };
  if (pkg.licenseText !== undefined) entries["package/LICENSE"] = pkg.licenseText;
  for (const [n, c] of Object.entries(pkg.files)) entries[`package/files/${n}`] = c;
  const tgz = new Uint8Array(gzipSync(tar(entries)));
  registry.set(pkg.name, { pkg, tgz: tamper ? tamper(tgz) : tgz, integrity: integrity(tgz) });
}

type Handler = (url: string) => Response | undefined;
function mockFetch(override?: Handler) {
  const calls: string[] = [];
  const fetchImpl = (async (input: any) => {
    const url = String(input);
    calls.push(url);
    const o = override?.(url);
    if (o) return o;
    const u = new URL(url);
    if (u.hostname !== "registry.npmjs.org") return new Response("wrong host", { status: 500 });
    const doc = u.pathname.match(/^\/(@[^/]+)%2f([^/]+)\/latest$/);
    if (doc) {
      const hit = registry.get(`${doc[1]}/${doc[2]}`);
      if (!hit) return new Response("", { status: 404 });
      return Response.json({ name: hit.pkg.name, version: "5.3.0", license: hit.pkg.license, dist: { tarball: `https://registry.npmjs.org/${hit.pkg.name}/-/x-5.3.0.tgz`, integrity: hit.integrity } });
    }
    const tb = u.pathname.match(/^\/(@[^/]+\/[^/]+)\/-\//);
    if (tb && registry.has(tb[1])) return new Response(registry.get(tb[1])!.tgz);
    return new Response("unexpected " + url, { status: 404 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

let dir: string;
beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), "fonts-test-")));
  registry = new Map();
  publish(newsreader());
  publish(plexMono());
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function run(argv: string[], override?: Handler) {
  const out: string[] = [];
  const err: string[] = [];
  const { fetchImpl, calls } = mockFetch(override);
  const deps: Deps = { fetchImpl, cwd: dir, now: () => new Date("2026-09-29T10:00:00Z"), sleep: async () => {}, stdout: (s) => out.push(s), stderr: (s) => err.push(s) };
  return { code: main(argv, deps), out, err, calls };
}

describe("list", () => {
  test("lists the curated pool, OFL only, Geist first, and filters by role", async () => {
    const r = run(["list"]);
    expect(await r.code).toBe(0);
    const j = JSON.parse(r.out[0]);
    expect(j.license).toBe("OFL-1.1");
    expect(j.pool[0].family).toBe("Geist");
    expect(j.count).toBe(POOL.length);
    const mono = JSON.parse((await (async () => { const m = run(["list", "--role", "mono"]); await m.code; return m.out[0]; })()));
    expect(mono.pool.every((f: any) => f.roles.includes("mono"))).toBe(true);
    expect(r.calls).toHaveLength(0);
  });

  test("an unknown role is refused", async () => {
    const r = run(["list", "--role", "ornament"]);
    expect(await r.code).toBe(2);
  });

  test("every pool entry is well formed and figures claims match the role", () => {
    const ids = new Set<string>();
    for (const f of POOL) {
      expect(f.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      expect(f.roles.length).toBeGreaterThan(0);
      expect({ id: f.id, figuresRole: f.roles.includes("figures") }).toEqual({ id: f.id, figuresRole: f.figures !== "none" });
      if (f.category === "mono") expect(f.roles).toContain("mono");
      for (const p of f.pairs) expect({ id: f.id, pair: p, known: POOL.some((x) => x.family === p) }).toEqual({ id: f.id, pair: p, known: true });
    }
    expect(POOL.filter((f) => f.vendored).map((f) => f.id)).toEqual(["geist", "geist-mono"]);
  });

  test("typography.md lists every pool family", () => {
    const md = readFileSync(join(import.meta.dir, "..", "..", "skills", "jal-design-system", "references", "typography.md"), "utf8");
    for (const f of POOL) expect({ family: f.family, listed: md.includes(`| ${f.family} |`) }).toEqual({ family: f.family, listed: true });
  });
});

describe("get", () => {
  test("variable: copies only the chosen axis, subsets, and style as woff2, plus OFL.txt, CSS, and a ledger row", async () => {
    const r = run(["get", "Newsreader", "--axes", "opsz", "--out", "public/fonts"]);
    expect(await r.code).toBe(0);
    const base = join(dir, "public/fonts/newsreader");
    expect((await readdir(base)).sort()).toEqual(["OFL.txt", "newsreader-latin-ext-opsz-normal.woff2", "newsreader-latin-opsz-normal.woff2", "newsreader.css"]);
    expect(await readFile(join(base, "OFL.txt"), "utf8")).toBe(OFL);
    const css = await readFile(join(base, "newsreader.css"), "utf8");
    expect(css.match(/@font-face/g)?.length).toBe(2);
    expect(css).toContain('font-family: "Newsreader";');
    expect(css).toContain("font-weight: 200 800;");
    expect(css).toContain("font-display: swap;");
    expect(css).toContain(`unicode-range: ${LATIN};`);
    expect(css).toContain(`unicode-range: ${LATIN_EXT};`);
    const ledger = await readFile(join(dir, "public/fonts/FONTS.md"), "utf8");
    expect(ledger).toContain("| Newsreader | 5.3.0 (@fontsource-variable/newsreader) | OFL-1.1 | https://www.npmjs.com/package/@fontsource-variable/newsreader; upstream https://github.com/google/fonts |");
    expect(ledger).toContain("2 woff2 (opsz axis, wght 200 800; latin, latin-ext; normal)");
    const j = JSON.parse(r.out[0]);
    expect(j).toMatchObject({ family: "Newsreader", license: "OFL-1.1", variable: true, axes: "opsz", weights: [400, 500, 600], dir: "public/fonts/newsreader" });
    expect(j.use.variable).toBe('--kit-font-sans or --kit-font-display: "Newsreader", var(--font-sans);');
    expect((await readdir(join(dir, "public/fonts"))).filter((n) => n.includes("partial"))).toEqual([]);
    expect(r.calls.every((u) => u.startsWith("https://registry.npmjs.org/"))).toBe(true);
  });

  test("static: one file per JAL weight, subset, and style; a second fetch appends under one header", async () => {
    expect(await run(["get", "ibm-plex-mono", "--weights", "400,600"]).code).toBe(0);
    const names = (await readdir(join(dir, "assets/fonts/ibm-plex-mono"))).sort();
    expect(names).toEqual(["OFL.txt", "ibm-plex-mono-latin-400-normal.woff2", "ibm-plex-mono-latin-600-normal.woff2", "ibm-plex-mono-latin-ext-400-normal.woff2", "ibm-plex-mono-latin-ext-600-normal.woff2", "ibm-plex-mono.css"]);
    const css = await readFile(join(dir, "assets/fonts/ibm-plex-mono/ibm-plex-mono.css"), "utf8");
    expect(css).toContain("font-weight: 600;");
    expect(await run(["get", "newsreader"]).code).toBe(0);
    const ledger = await readFile(join(dir, "assets/fonts/FONTS.md"), "utf8");
    expect(ledger.match(/^# Fonts$/gm)?.length).toBe(1);
    expect(ledger.match(/^\| (IBM Plex Mono|Newsreader) \|/gm)?.length).toBe(2);
  });

  test("static default weights are the JAL weights the family has", async () => {
    const r = run(["get", "IBM Plex Mono", "--subsets", "latin"]);
    expect(await r.code).toBe(0);
    expect(JSON.parse(r.out[0]).weights).toEqual([400, 500, 600]);
  });

  test("refuses a non-OFL npm license before downloading the tarball", async () => {
    publish({ ...newsreader(), license: "Apache-2.0" });
    const r = run(["get", "newsreader"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("only OFL-1.1 is allowed");
    expect(r.calls).toHaveLength(1);
    expect(existsSync(join(dir, "assets/fonts/newsreader"))).toBe(false);
  });

  test("refuses when metadata.json or the LICENSE text is not OFL 1.1", async () => {
    const pkg = newsreader();
    pkg.meta.license.type = "UFL-1.0";
    publish(pkg);
    const a = run(["get", "newsreader"]);
    expect(await a.code).toBe(2);
    expect(a.err[0]).toContain("metadata.json license");
    publish({ ...newsreader(), licenseText: "Ubuntu Font Licence Version 1.0" });
    const b = run(["get", "newsreader"]);
    expect(await b.code).toBe(2);
    expect(b.err[0]).toContain("not the SIL Open Font License 1.1");
    publish({ ...newsreader(), licenseText: undefined });
    expect(await run(["get", "newsreader"]).code).toBe(2);
    expect(existsSync(join(dir, "assets/fonts/newsreader"))).toBe(false);
  });

  test("refuses a tarball that does not match the registry integrity", async () => {
    publish(newsreader(), (tgz) => {
      const t = tgz.slice();
      t[t.length - 20] ^= 0xff;
      return t;
    });
    const r = run(["get", "newsreader"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("does not match the registry integrity");
  });

  test("refuses a tarball URL or redirect off the registry host", async () => {
    const r = run(["get", "newsreader"], (url) =>
      url.endsWith("/latest") ? Response.json({ name: "@fontsource-variable/newsreader", version: "5.3.0", license: "OFL-1.1", dist: { tarball: "https://evil.example/x.tgz", integrity: "sha512-x" } }) : undefined,
    );
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("refused host evil.example");
    expect(r.calls).toHaveLength(1);
  });

  test("refuses families outside the pool and the vendored Geist faces", async () => {
    const a = run(["get", "Comic Neue"]);
    expect(await a.code).toBe(2);
    expect(a.err[0]).toContain("not in the curated pool");
    const b = run(["get", "geist-mono"]);
    expect(await b.code).toBe(2);
    expect(b.err[0]).toContain("already vendored");
    expect(a.calls.length + b.calls.length).toBe(0);
    expect(findFont("source serif 4").id).toBe("source-serif-4");
  });

  test("refuses non-JAL weights, unknown subsets, styles, and axes", async () => {
    expect(() => parseWeights("300")).toThrow("JAL weights only");
    expect(parseWeights("400, 600")).toEqual([400, 600]);
    const sub = run(["get", "newsreader", "--subsets", "greek"]);
    expect(await sub.code).toBe(2);
    expect(sub.err[0]).toContain("no greek subset");
    const ax = run(["get", "newsreader", "--axes", "wdth"]);
    expect(await ax.code).toBe(2);
    expect(ax.err[0]).toContain('no "wdth" axis files; available: opsz, standard, wght');
    const st = run(["get", "ibm-plex-mono", "--styles", "oblique"]);
    expect(await st.code).toBe(2);
    const w = run(["get", "ibm-plex-mono", "--weights", "300"]);
    expect(await w.code).toBe(2);
    expect(existsSync(join(dir, "assets/fonts/newsreader"))).toBe(false);
  });

  test("retries once on a 5xx, then fails cleanly", async () => {
    let hits = 0;
    const r = run(["get", "newsreader"], (url) => (url.endsWith("/latest") ? (hits++, new Response("", { status: 503 })) : undefined));
    expect(await r.code).toBe(2);
    expect(hits).toBe(2);
    expect(r.err[0]).toContain("HTTP 503");
  });

  test("rejects an --out outside the working directory without a request", async () => {
    const r = run(["get", "newsreader", "--out", "../escape"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("inside the current working directory");
    expect(r.calls).toHaveLength(0);
    expect(() => resolveOutDir(dir, "/etc")).toThrow();
    expect(() => resolveOutDir(dir, ".")).toThrow();
  });

  test("rejects an --out that escapes through a symlink", async () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), "fonts-outside-")));
    await symlink(outside, join(dir, "link"));
    try {
      expect(() => resolveOutDir(dir, "link/fonts")).toThrow();
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
});

describe("untar", () => {
  test("reads regular files, honours pax long names, and skips directories", () => {
    const files = untar(tar({ "package/a.txt": "A" }, { longName: "package/files/a-very-long-name.woff2" }));
    expect(new TextDecoder().decode(files.get("package/a.txt"))).toBe("A");
    expect(new TextDecoder().decode(files.get("package/files/a-very-long-name.woff2"))).toBe("long body");
    expect(files.has("short-name-ignored")).toBe(false);
    expect(files.has("package/dir/")).toBe(false);
  });

  test("a truncated archive is an error, not a partial read", () => {
    const t = tar({ "package/a.txt": "A".repeat(2000) });
    expect(() => untar(t.subarray(0, 1024))).toThrow("truncated");
  });
});
