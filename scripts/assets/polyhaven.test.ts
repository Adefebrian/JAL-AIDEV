import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { readFile, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkLicense, cleanupOnSignal, filterAssets, gltfReferences, main, MAX_REDIRECTS, resolveOutDir, safeRelative, type Deps } from "./polyhaven.ts";

// No network in these tests: every request goes through a mocked fetch.

const md5 = (s: string | Uint8Array) => {
  const h = new Bun.CryptoHasher("md5");
  h.update(s);
  return h.digest("hex");
};

const DL = "https://dl.polyhaven.org/file/ph-assets";
const GLTF = JSON.stringify({
  asset: { version: "2.0" },
  buffers: [{ uri: "lamp.bin", byteLength: 4 }],
  images: [{ uri: "textures/lamp_diff_1k.jpg" }, { uri: "textures/lamp_nor_gl_1k.jpg" }, { uri: "data:image/png;base64,AAAA" }],
});
const BIN = "BIN!";
const DIFF = "diffuse-bytes";
const NOR = "normal-bytes";
const HDR = "#?RADIANCE fake";

const INFO: Record<string, any> = {
  lamp: { name: "Lamp", type: 2, authors: { "Jane Doe": "All" }, polycount: 12000, dimensions: [200, 300, 450], categories: ["lighting"], tags: ["desk", "lamp"] },
  studio: { name: "Studio", type: 0, authors: { "Sam Roe": "All" }, categories: ["studio"], tags: ["softbox", "white"] },
  veneer: { name: "Oak Veneer", type: 1, authors: { "A B": "All" }, categories: ["wood"], tags: ["oak"] },
};

function filesFor(id: string): any {
  if (id === "lamp")
    return {
      gltf: {
        "1k": {
          gltf: {
            url: `${DL}/Models/gltf/1k/lamp/lamp_1k.gltf`,
            size: GLTF.length,
            md5: md5(GLTF),
            include: {
              "lamp.bin": { url: `${DL}/Models/gltf/4k/lamp/lamp.bin`, size: BIN.length, md5: md5(BIN) },
              "textures/lamp_diff_1k.jpg": { url: `${DL}/Models/jpg/1k/lamp/lamp_diff_1k.jpg`, size: DIFF.length, md5: md5(DIFF) },
              "textures/lamp_nor_gl_1k.jpg": { url: `${DL}/Models/jpg/1k/lamp/lamp_nor_gl_1k.jpg`, size: NOR.length, md5: md5(NOR) },
            },
          },
        },
      },
    };
  if (id === "studio") return { hdri: { "1k": { hdr: { url: `${DL}/HDRIs/hdr/1k/studio_1k.hdr`, size: HDR.length, md5: md5(HDR) } } } };
  if (id === "veneer")
    return {
      Diffuse: { "1k": { jpg: { url: `${DL}/Textures/jpg/1k/veneer/veneer_diff_1k.jpg`, size: DIFF.length, md5: md5(DIFF) } } },
      nor_gl: { "1k": { jpg: { url: `${DL}/Textures/jpg/1k/veneer/veneer_nor_gl_1k.jpg`, size: NOR.length, md5: md5(NOR) } } },
      nor_dx: { "1k": { jpg: { url: `${DL}/Textures/jpg/1k/veneer/veneer_nor_dx_1k.jpg`, size: 3, md5: "x" } } },
      Displacement: { "1k": { jpg: { url: `${DL}/Textures/jpg/1k/veneer/veneer_disp_1k.jpg`, size: 3, md5: "x" } } },
    };
  return null;
}

const BODIES: Record<string, string> = {
  [`${DL}/Models/gltf/1k/lamp/lamp_1k.gltf`]: GLTF,
  [`${DL}/Models/gltf/4k/lamp/lamp.bin`]: BIN,
  [`${DL}/Models/jpg/1k/lamp/lamp_diff_1k.jpg`]: DIFF,
  [`${DL}/Models/jpg/1k/lamp/lamp_nor_gl_1k.jpg`]: NOR,
  [`${DL}/HDRIs/hdr/1k/studio_1k.hdr`]: HDR,
  [`${DL}/Textures/jpg/1k/veneer/veneer_diff_1k.jpg`]: DIFF,
  [`${DL}/Textures/jpg/1k/veneer/veneer_nor_gl_1k.jpg`]: NOR,
};

type Handler = (url: string) => Response | Promise<Response>;
function mockFetch(override?: Handler) {
  const calls: string[] = [];
  const fetchImpl = (async (input: any) => {
    const url = String(input);
    calls.push(url);
    if (override) {
      const r = await override(url);
      if (r.status !== 599) return r;
    }
    const u = new URL(url);
    if (u.hostname === "api.polyhaven.com") {
      if (u.pathname === "/assets") return Response.json(Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, { ...v, download_count: id === "lamp" ? 9 : 1 }])));
      const [, kind, id] = u.pathname.split("/");
      if (kind === "info") return INFO[id] ? Response.json(INFO[id]) : new Response("", { status: 404 });
      if (kind === "files") return filesFor(id) ? Response.json(filesFor(id)) : new Response("", { status: 404 });
    }
    if (url in BODIES) return new Response(BODIES[url]);
    return new Response("unexpected " + url, { status: 404 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

let dir: string;
beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), "ph-test-")));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function run(argv: string[], extra: Partial<Deps> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const { fetchImpl, calls } = mockFetch();
  const deps: Deps = { fetchImpl, cwd: dir, now: () => new Date("2026-09-29T10:00:00Z"), sleep: async () => {}, stdout: (s) => out.push(s), stderr: (s) => err.push(s), ...extra };
  return { code: main(argv, deps), out, err, calls };
}

describe("search and info", () => {
  test("search filters by every token over id, name, tags, categories and reports polycount in metres", async () => {
    const r = run(["search", "desk", "lamp", "--type", "models"]);
    expect(await r.code).toBe(0);
    const j = JSON.parse(r.out[0]);
    expect(r.calls[0]).toBe("https://api.polyhaven.com/assets?t=models");
    expect(j.count).toBe(1);
    expect(j.results[0]).toMatchObject({ id: "lamp", polycount: 12000, dimensionsM: [0.2, 0.3, 0.45], page: "https://polyhaven.com/a/lamp" });
  });

  test("filterAssets ranks by downloads", () => {
    const hits = filterAssets({ a: { name: "Oak A", download_count: 1, type: 1 }, b: { name: "Oak B", download_count: 5, type: 1 } }, "oak");
    expect(hits.map((h) => h.id)).toEqual(["b", "a"]);
  });

  test("info returns license basis and available resolutions", async () => {
    const r = run(["info", "lamp"]);
    expect(await r.code).toBe(0);
    const j = JSON.parse(r.out[0]);
    expect(j.license.license).toBe("CC0");
    expect(j.license.basis).toContain("polyhaven.com/license");
    expect(j.available.gltf).toEqual(["1k"]);
  });

  test("unknown id is a clear 404 error", async () => {
    const r = run(["info", "nope"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("not found (404)");
  });
});

describe("get", () => {
  test("glTF: writes the .gltf plus every .bin and texture with relative paths, and a ledger row", async () => {
    const r = run(["get", "lamp", "--type", "models", "--res", "1k", "--format", "gltf", "--out", "public/assets/ph"]);
    expect(await r.code).toBe(0);
    const base = join(dir, "public/assets/ph/lamp");
    expect(await readFile(join(base, "lamp_1k.gltf"), "utf8")).toBe(GLTF);
    expect(await readFile(join(base, "lamp.bin"), "utf8")).toBe(BIN);
    expect(await readFile(join(base, "textures/lamp_diff_1k.jpg"), "utf8")).toBe(DIFF);
    expect(await readFile(join(base, "textures/lamp_nor_gl_1k.jpg"), "utf8")).toBe(NOR);
    const ledger = await readFile(join(dir, "public/assets/ph/ASSETS.md"), "utf8");
    expect(ledger).toContain("| lamp | models | 1k | gltf | https://polyhaven.com/a/lamp | CC0 | Jane Doe | 2026-09-29 |");
    const j = JSON.parse(r.out[0]);
    expect(j.entry).toBe("public/assets/ph/lamp/lamp_1k.gltf");
    const left = await readdir(join(dir, "public/assets/ph"));
    expect(left.filter((n) => n.includes("partial"))).toEqual([]);
  });

  test("a second download appends a second ledger row under one header", async () => {
    expect(await run(["get", "lamp", "--type", "models"]).code).toBe(0);
    expect(await run(["get", "studio", "--type", "hdris", "--format", "hdr"]).code).toBe(0);
    const ledger = await readFile(join(dir, "assets/polyhaven/ASSETS.md"), "utf8");
    expect(ledger.match(/# Third-party assets/g)?.length).toBe(1);
    expect(ledger).toContain("| studio | hdris | 1k | hdr |");
    expect(await readFile(join(dir, "assets/polyhaven/studio/studio_1k.hdr"), "utf8")).toBe(HDR);
  });

  test("textures: default maps skip DirectX normals and displacement", async () => {
    const r = run(["get", "veneer", "--type", "textures", "--format", "jpg"]);
    expect(await r.code).toBe(0);
    const names = (await readdir(join(dir, "assets/polyhaven/veneer"))).sort();
    expect(names).toEqual(["veneer_diff_1k.jpg", "veneer_nor_gl_1k.jpg"]);
  });

  test("rejects an --out outside the working directory", async () => {
    const r = run(["get", "lamp", "--type", "models", "--out", "../escape"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("inside the current working directory");
    expect(r.calls).toHaveLength(0);
    expect(() => resolveOutDir(dir, "/etc")).toThrow();
    expect(() => resolveOutDir(dir, ".")).toThrow();
  });

  test("rejects an --out that escapes through a symlink", async () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), "ph-outside-")));
    await symlink(outside, join(dir, "link"));
    try {
      expect(() => resolveOutDir(dir, "link/assets")).toThrow();
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("refuses a non-CC0 license field before writing anything", async () => {
    INFO.lamp.license = "CC-BY-4.0";
    try {
      const r = run(["get", "lamp", "--type", "models"]);
      expect(await r.code).toBe(2);
      expect(r.err[0]).toContain("only CC0 is allowed");
      expect(existsSync(join(dir, "assets"))).toBe(false);
    } finally {
      delete INFO.lamp.license;
    }
  });

  test("checkLicense accepts an explicit CC0 field and refuses a non-asset payload", () => {
    expect(checkLicense({ name: "x", type: 2, authors: {}, license: "CC0" }, "x").basis).toContain("info.license");
    expect(() => checkLicense({ error: "nope" }, "x")).toThrow("not a recognisable");
  });

  test("refuses a type mismatch", async () => {
    const r = run(["get", "studio", "--type", "models"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("is a hdris asset");
  });

  test("md5 mismatch fails and leaves no asset directory", async () => {
    const { fetchImpl } = mockFetch((url) => (url.endsWith("lamp.bin") ? new Response("XXXX") : new Response("", { status: 599 })));
    const r = run(["get", "lamp", "--type", "models"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("md5 does not match");
    expect(existsSync(join(dir, "assets/polyhaven/lamp"))).toBe(false);
    expect((await readdir(join(dir, "assets/polyhaven"))).filter((n) => n.includes("partial"))).toEqual([]);
  });

  test("a glTF that references a file the API did not list is refused", async () => {
    const bad = JSON.stringify({ buffers: [{ uri: "lamp.bin" }], images: [{ uri: "textures/missing.jpg" }] });
    const files = filesFor("lamp");
    files.gltf["1k"].gltf.size = bad.length;
    files.gltf["1k"].gltf.md5 = md5(bad);
    const { fetchImpl } = mockFetch((url) => {
      if (url.endsWith("/files/lamp")) return Response.json(files);
      if (url.endsWith("lamp_1k.gltf")) return new Response(bad);
      return new Response("", { status: 599 });
    });
    const r = run(["get", "lamp", "--type", "models"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("textures/missing.jpg");
  });

  test("a download URL on another host is refused", async () => {
    const files = filesFor("studio");
    files.hdri["1k"].hdr.url = "https://evil.example/studio.hdr";
    const { fetchImpl, calls } = mockFetch((url) => (url.endsWith("/files/studio") ? Response.json(files) : new Response("", { status: 599 })));
    const r = run(["get", "studio", "--type", "hdris"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("refused host evil.example");
    expect(calls.some((c) => c.includes("evil.example"))).toBe(false);
  });

  test("size cap refuses before downloading", async () => {
    const r = run(["get", "lamp", "--type", "models", "--max-mb", "0.00001"]);
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("over --max-mb");
    expect(r.calls.some((c) => c.startsWith(DL))).toBe(false);
  });

  test("bad flags are clear errors", async () => {
    expect(await run(["get", "lamp", "--type", "models", "--res", "8k"]).code).toBe(2);
    expect(await run(["get", "lamp", "--type", "models", "--format", "hdr"]).code).toBe(2);
    expect(await run(["get", "../x", "--type", "models"]).code).toBe(2);
    expect(await run(["get", "lamp"]).code).toBe(2);
  });
});

describe("timeouts and retries", () => {
  test("one retry on 503, then success", async () => {
    let n = 0;
    const { fetchImpl, calls } = mockFetch((url) => (url.includes("/assets") && n++ === 0 ? new Response("", { status: 503 }) : new Response("", { status: 599 })));
    const r = run(["search", "lamp"], { fetchImpl });
    expect(await r.code).toBe(0);
    expect(calls.filter((c) => c.includes("/assets"))).toHaveLength(2);
  });

  test("two 503s stop after exactly two attempts", async () => {
    const { fetchImpl, calls } = mockFetch((url) => (url.includes("/assets") ? new Response("", { status: 503 }) : new Response("", { status: 599 })));
    const r = run(["search", "lamp"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("HTTP 503");
    expect(calls).toHaveLength(2);
  });

  test("a timeout is reported plainly", async () => {
    const fetchImpl = (async () => {
      const e = new Error("timed out");
      e.name = "TimeoutError";
      throw e;
    }) as unknown as typeof fetch;
    const r = run(["info", "lamp"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("timed out after 15000 ms");
  });
});

describe("path helpers", () => {
  test("safeRelative keeps nested paths and refuses traversal", () => {
    expect(safeRelative("textures/a.jpg")).toBe("textures/a.jpg");
    expect(() => safeRelative("../a.jpg")).toThrow();
    expect(() => safeRelative("/etc/passwd")).toThrow();
    expect(() => safeRelative("textures/%2E%2E/%2E%2E/a")).toThrow();
  });

  test("gltfReferences lists buffers and images, skipping data URIs", () => {
    expect(gltfReferences(JSON.parse(GLTF))).toEqual(["lamp.bin", "textures/lamp_diff_1k.jpg", "textures/lamp_nor_gl_1k.jpg"]);
  });
});

describe("redirects", () => {
  const HDR_URL = `${DL}/HDRIs/hdr/1k/studio_1k.hdr`;

  test("a redirect to a host off the allowlist is refused before it is contacted", async () => {
    const inits: any[] = [];
    const { fetchImpl: base, calls } = mockFetch((url) =>
      url === HDR_URL ? new Response("", { status: 302, headers: { location: "https://evil.example/studio.hdr" } }) : new Response("", { status: 599 }),
    );
    const fetchImpl = (async (u: any, init: any) => {
      inits.push(init);
      return base(u, init);
    }) as unknown as typeof fetch;
    const r = run(["get", "studio", "--type", "hdris"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("refused host evil.example");
    expect(calls.some((c) => c.includes("evil.example"))).toBe(false);
    expect(inits.every((i) => i.redirect === "manual")).toBe(true);
    expect(existsSync(join(dir, "assets/polyhaven/studio"))).toBe(false);
  });

  test("an allowed redirect is followed; more than the hop limit is refused", async () => {
    const moved = `${DL}/moved/studio_1k.hdr`;
    const ok = mockFetch((url) => {
      if (url === HDR_URL) return new Response("", { status: 301, headers: { location: "/file/ph-assets/moved/studio_1k.hdr" } });
      if (url === moved) return new Response(HDR);
      return new Response("", { status: 599 });
    });
    const r = run(["get", "studio", "--type", "hdris"], { fetchImpl: ok.fetchImpl });
    expect(await r.code).toBe(0);
    expect(ok.calls).toContain(moved);
    expect(await readFile(join(dir, "assets/polyhaven/studio/studio_1k.hdr"), "utf8")).toBe(HDR);

    let hops = 0;
    const loop = mockFetch((url) => (url.startsWith(`${DL}/`) ? (hops++, new Response("", { status: 302, headers: { location: `${DL}/hop-${hops}` } })) : new Response("", { status: 599 })));
    const r2 = run(["get", "studio", "--type", "hdris"], { fetchImpl: loop.fetchImpl });
    expect(await r2.code).toBe(2);
    expect(r2.err[0]).toContain(`more than ${MAX_REDIRECTS} redirects`);
    expect(hops).toBe(MAX_REDIRECTS + 1);
  });
});

describe("byte cap", () => {
  const undeclared = () => {
    const files = filesFor("studio");
    delete files.hdri["1k"].hdr.size;
    delete files.hdri["1k"].hdr.md5;
    return files;
  };
  const big = new Uint8Array(3 * 1024 * 1024);

  test("a file with no declared size is cut off at --max-mb while streaming", async () => {
    const files = undeclared();
    let pulled = 0;
    const { fetchImpl } = mockFetch((url) => {
      if (url.endsWith("/files/studio")) return Response.json(files);
      if (url.endsWith("studio_1k.hdr")) {
        // No Content-Length: an endless stream that must be cut off.
        const stream = new ReadableStream<Uint8Array>({
          pull(c) {
            pulled++;
            c.enqueue(new Uint8Array(256 * 1024));
          },
        });
        return new Response(stream);
      }
      return new Response("", { status: 599 });
    });
    const r = run(["get", "studio", "--type", "hdris", "--max-mb", "1"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("exceeds --max-mb 1");
    expect(pulled).toBeLessThan(10);
    expect(existsSync(join(dir, "assets/polyhaven/studio"))).toBe(false);
    expect((await readdir(join(dir, "assets/polyhaven"))).filter((n) => n.includes("partial"))).toEqual([]);
  });

  test("a Content-Length over the cap is refused before the body is read", async () => {
    const files = undeclared();
    const { fetchImpl } = mockFetch((url) => {
      if (url.endsWith("/files/studio")) return Response.json(files);
      if (url.endsWith("studio_1k.hdr")) return new Response(big, { headers: { "content-length": String(big.byteLength) } });
      return new Response("", { status: 599 });
    });
    const r = run(["get", "studio", "--type", "hdris", "--max-mb", "2"], { fetchImpl });
    expect(await r.code).toBe(2);
    expect(r.err[0]).toContain("exceeds --max-mb 2");
  });

  test("an undeclared file under the cap still downloads", async () => {
    const files = undeclared();
    const { fetchImpl } = mockFetch((url) => (url.endsWith("/files/studio") ? Response.json(files) : new Response("", { status: 599 })));
    const r = run(["get", "studio", "--type", "hdris", "--max-mb", "1"], { fetchImpl });
    expect(await r.code).toBe(0);
    expect(await readFile(join(dir, "assets/polyhaven/studio/studio_1k.hdr"), "utf8")).toBe(HDR);
  });
});

describe("placement", () => {
  const out = () => join(dir, "assets/polyhaven");
  const partials = async () => (await readdir(out())).filter((n) => n.includes("partial"));

  test("a symlinked asset directory is refused and nothing lands outside", async () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), "ph-outside-")));
    try {
      mkdirSync(out(), { recursive: true });
      await symlink(outside, join(out(), "lamp"));
      const r = run(["get", "lamp", "--type", "models"]);
      expect(await r.code).toBe(2);
      expect(r.err[0]).toContain("symlink");
      expect(await readdir(outside)).toEqual([]);
      expect(await partials()).toEqual([]);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("a symlink nested in an existing asset directory is refused and nothing lands outside", async () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), "ph-outside-")));
    try {
      mkdirSync(join(out(), "lamp"), { recursive: true });
      await symlink(outside, join(out(), "lamp", "textures"));
      const r = run(["get", "lamp", "--type", "models"]);
      expect(await r.code).toBe(2);
      expect(r.err[0]).toContain("symlink");
      expect(await readdir(outside)).toEqual([]);
      expect(await partials()).toEqual([]);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("a symlinked ledger is refused", async () => {
    const outside = realpathSync(mkdtempSync(join(tmpdir(), "ph-outside-")));
    try {
      mkdirSync(out(), { recursive: true });
      writeFileSync(join(outside, "ASSETS.md"), "untouched");
      await symlink(join(outside, "ASSETS.md"), join(out(), "ASSETS.md"));
      const r = run(["get", "studio", "--type", "hdris"]);
      expect(await r.code).toBe(2);
      expect(r.err[0]).toContain("ledger is a symlink");
      expect(await readFile(join(outside, "ASSETS.md"), "utf8")).toBe("untouched");
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  test("a re-download into an existing asset directory keeps its other files", async () => {
    mkdirSync(join(out(), "lamp", "textures"), { recursive: true });
    writeFileSync(join(out(), "lamp", "lamp_2k.gltf"), "earlier");
    writeFileSync(join(out(), "lamp", "textures", "lamp_diff_1k.jpg"), "stale");
    const r = run(["get", "lamp", "--type", "models"]);
    expect(await r.code).toBe(0);
    expect(await readFile(join(out(), "lamp", "lamp_2k.gltf"), "utf8")).toBe("earlier");
    expect(await readFile(join(out(), "lamp", "textures", "lamp_diff_1k.jpg"), "utf8")).toBe(DIFF);
    expect(await readFile(join(out(), "lamp", "lamp_1k.gltf"), "utf8")).toBe(GLTF);
    expect(await partials()).toEqual([]);
  });

  test("SIGINT and SIGTERM remove the staging dir and exit with the signal code", () => {
    for (const [sig, code] of [["SIGINT", 130], ["SIGTERM", 143]] as const) {
      const stage = join(dir, `.lamp.partial-${sig}`);
      mkdirSync(join(stage, "asset"), { recursive: true });
      const exits: number[] = [];
      const before = process.listenerCount(sig);
      const disarm = cleanupOnSignal([stage], (c) => exits.push(c));
      expect(process.listenerCount(sig)).toBe(before + 1);
      process.emit(sig);
      expect(existsSync(stage)).toBe(false);
      expect(exits).toEqual([code]);
      disarm();
      expect(process.listenerCount(sig)).toBe(before);
    }
  });
});
