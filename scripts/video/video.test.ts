// scripts/video: the Remotion rules check and the MP4 probe.
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkManifests, findManifests, readTeam, type Manifest } from "./check";
import { probeMp4 } from "./probe-mp4";

const V = "4.0.532";
const video = (deps: Record<string, string>, dev: Record<string, string> = {}): Manifest => ({ path: "packages/video/package.json", json: { dependencies: deps, devDependencies: dev } });
const web = (deps: Record<string, string>): Manifest => ({ path: "apps/web/package.json", json: { dependencies: deps } });

describe("video check", () => {
  test("one exact Remotion version across the workspace passes", () => {
    const r = checkManifests([video({ remotion: V, "@remotion/player": V, "@remotion/web-renderer": V }), web({ react: "~19.3.0" })]);
    expect(r).toEqual({ errors: [], confirm: [], warnings: [], remotionVersion: V });
  });

  test("a range or a second version is an error", () => {
    const r = checkManifests([video({ remotion: V, "@remotion/player": `^${V}` }), web({ "@remotion/transitions": "4.0.531" })]);
    expect(r.errors.some((e) => e.includes('@remotion/player is "^4.0.532"'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith("Remotion packages disagree"))).toBe(true);
  });

  test("bundler and Studio only in packages/video; no Vite, Next, or webpack in a website", () => {
    const r = checkManifests([web({ "@remotion/bundler": V, vite: "7.0.0", "@vitejs/plugin-react": "5.0.0" })]);
    expect(r.errors.length).toBe(3);
    const ok = checkManifests([video({ remotion: V }, { "@remotion/cli": V })]);
    expect(ok.errors).toEqual([]);
    expect(ok.confirm[0]).toContain("Studio is installed");
  });

  test("server and cloud render paths need Brian's confirmation", () => {
    const r = checkManifests([video({ remotion: V, "@remotion/renderer": V, "@remotion/lambda": V })]);
    expect(r.errors).toEqual([]);
    expect(r.confirm.length).toBe(2);
    expect(r.confirm.join(" ")).toContain("Brian's confirmation");
  });

  test("license: free up to 3 people, a warning from 4", () => {
    expect(checkManifests([video({ remotion: V })], 3).warnings).toEqual([]);
    const four = checkManifests([video({ remotion: V })], 4).warnings;
    expect(four.length).toBe(1);
    expect(four[0]).toContain("Company License");
    expect(checkManifests([web({ react: "19.3.0" })], 9).warnings).toEqual([]);
  });

  test("reads manifests and the team size from a project tree", () => {
    const root = mkdtempSync(join(tmpdir(), "video-check-"));
    mkdirSync(join(root, "packages", "video"), { recursive: true });
    mkdirSync(join(root, "apps", "web", "node_modules", "x"), { recursive: true });
    mkdirSync(join(root, ".jal"));
    writeFileSync(join(root, "packages", "video", "package.json"), JSON.stringify({ dependencies: { remotion: V } }));
    writeFileSync(join(root, "apps", "web", "package.json"), JSON.stringify({ dependencies: { react: "19.3.0" } }));
    writeFileSync(join(root, "apps", "web", "node_modules", "x", "package.json"), JSON.stringify({ dependencies: { remotion: "^1.0.0" } }));
    writeFileSync(join(root, ".jal", "video.json"), JSON.stringify({ team: 5 }));
    const found = findManifests(root).map((m) => m.path).sort();
    expect(found).toEqual(["apps/web/package.json", "packages/video/package.json"]);
    expect(readTeam(root)).toBe(5);
    expect(readTeam(root, "2")).toBe(2);
  });
});

// A minimal non-fragmented MP4: ftyp, moov (mvhd, one video trak), mdat.
function box(type: string, ...parts: Uint8Array[]): Uint8Array {
  const size = 8 + parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(size);
  const v = new DataView(out.buffer);
  v.setUint32(0, size);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  let at = 8;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
const u32 = (...ns: number[]) => {
  const b = new Uint8Array(ns.length * 4);
  const v = new DataView(b.buffer);
  ns.forEach((n, i) => v.setUint32(i * 4, n));
  return b;
};
const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const zeros = (n: number) => new Uint8Array(n);

function fakeMp4(frames: number, fps: number, w: number, h: number, moovFirst = true): Uint8Array {
  const mvhd = box("mvhd", u32(0, 0, 0, 1000, Math.round((frames / fps) * 1000)), zeros(80));
  const tkhd = box("tkhd", u32(0), zeros(72), u32(w * 65536, h * 65536));
  const mdhd = box("mdhd", u32(0, 0, 0, fps * 1000, frames * 1000), zeros(4));
  const hdlr = box("hdlr", u32(0, 0), ascii("vide"), zeros(12));
  const stsd = box("stsd", u32(0, 1), box("avc1", zeros(78)));
  const stsz = box("stsz", u32(0, 0, frames));
  const trak = box("trak", tkhd, box("mdia", mdhd, hdlr, box("minf", box("stbl", stsd, stsz))));
  const moov = box("moov", mvhd, trak);
  const ftyp = box("ftyp", ascii("isom"), u32(512), ascii("avc1mp41"));
  const mdat = box("mdat", zeros(16));
  const parts = moovFirst ? [ftyp, moov, mdat] : [ftyp, mdat, moov];
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

describe("probe-mp4", () => {
  test("reads duration, size, codec, frames, fps", () => {
    const p = probeMp4(fakeMp4(90, 30, 1080, 1920));
    expect(p).toMatchObject({ durationSeconds: 3, width: 1080, height: 1920, codec: "avc1", frames: 90, fps: 30, fastStart: true });
    expect(p.brands).toEqual(["isom", "avc1", "mp41"]);
  });
  test("moov after mdat is still playable, just not fast start", () => {
    expect(probeMp4(fakeMp4(30, 30, 1920, 1080, false)).fastStart).toBe(false);
  });
  test("not an MP4: a clear error", () => {
    expect(() => probeMp4(new Uint8Array(32))).toThrow("not a playable MP4");
    expect(() => probeMp4(fakeMp4(0, 30, 2, 2))).toThrow("no samples");
  });
});
