#!/usr/bin/env bun
// probe-mp4: read what an MP4 really holds, with no ffprobe and no
// download. Walks the ISO BMFF boxes and reports the duration (mvhd), the
// video track's size (tkhd), its codec (stsd), and its sample count (stsz),
// so an in-browser export can be checked from a test or the shell.
//
//   bun scripts/video/probe-mp4.ts out/social-cut.mp4
//   -> {"bytes":81234,"durationSeconds":3,"width":1080,"height":1920,"codec":"avc1","frames":90,"fps":30,"brands":["isom",...]}
//
// Exit code 1 when the file is not a playable MP4 (no moov, no video track,
// or no samples).

export interface Mp4Probe {
  bytes: number;
  brands: string[];
  durationSeconds: number;
  width: number;
  height: number;
  codec: string | null;
  frames: number;
  fps: number | null;
  /** moov before mdat: playback can start before the whole file arrives. */
  fastStart: boolean;
}

interface Box {
  type: string;
  start: number;
  /** First byte of the payload. */
  body: number;
  end: number;
}

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "udta"]);

function fourcc(v: DataView, at: number): string {
  return String.fromCharCode(v.getUint8(at), v.getUint8(at + 1), v.getUint8(at + 2), v.getUint8(at + 3));
}

function readBoxes(v: DataView, from: number, to: number): Box[] {
  const out: Box[] = [];
  let at = from;
  while (at + 8 <= to) {
    let size = v.getUint32(at);
    const type = fourcc(v, at + 4);
    let body = at + 8;
    if (size === 1) {
      size = Number(v.getBigUint64(at + 8));
      body = at + 16;
    } else if (size === 0) {
      size = to - at;
    }
    if (size < 8 || at + size > to) break;
    out.push({ type, start: at, body, end: at + size });
    at += size;
  }
  return out;
}

function find(v: DataView, boxes: Box[], path: string[]): Box | null {
  let level = boxes;
  let hit: Box | null = null;
  for (const type of path) {
    hit = level.find((b) => b.type === type) ?? null;
    if (!hit) return null;
    level = CONTAINERS.has(type) ? readBoxes(v, hit.body, hit.end) : [];
  }
  return hit;
}

export function probeMp4(buf: ArrayBuffer | Uint8Array): Mp4Probe {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const top = readBoxes(v, 0, bytes.byteLength);
  const ftyp = top.find((b) => b.type === "ftyp");
  const brands: string[] = [];
  if (ftyp) {
    brands.push(fourcc(v, ftyp.body));
    for (let at = ftyp.body + 8; at + 4 <= ftyp.end; at += 4) brands.push(fourcc(v, at));
  }
  const moovIndex = top.findIndex((b) => b.type === "moov");
  const mdatIndex = top.findIndex((b) => b.type === "mdat");
  if (moovIndex === -1) throw new Error("not a playable MP4: no moov box");
  const mvhd = find(v, top, ["moov", "mvhd"]);
  if (!mvhd) throw new Error("not a playable MP4: no mvhd box");
  const mvVersion = v.getUint8(mvhd.body);
  const timescale = v.getUint32(mvhd.body + (mvVersion === 1 ? 20 : 12));
  const duration = mvVersion === 1 ? Number(v.getBigUint64(mvhd.body + 24)) : v.getUint32(mvhd.body + 16);

  const moov = top[moovIndex];
  const traks = readBoxes(v, moov.body, moov.end).filter((b) => b.type === "trak");
  for (const trak of traks) {
    const inner = readBoxes(v, trak.body, trak.end);
    const hdlr = find(v, inner, ["mdia", "hdlr"]);
    if (!hdlr || fourcc(v, hdlr.body + 8) !== "vide") continue;
    const tkhd = find(v, inner, ["tkhd"]);
    let width = 0;
    let height = 0;
    if (tkhd) {
      const tv = v.getUint8(tkhd.body);
      const at = tkhd.body + (tv === 1 ? 88 : 76);
      width = v.getUint32(at) / 65536;
      height = v.getUint32(at + 4) / 65536;
    }
    const stsd = find(v, inner, ["mdia", "minf", "stbl", "stsd"]);
    const codec = stsd && v.getUint32(stsd.body + 4) > 0 ? fourcc(v, stsd.body + 12) : null;
    const stsz = find(v, inner, ["mdia", "minf", "stbl", "stsz"]);
    const frames = stsz ? v.getUint32(stsz.body + 8) : 0;
    const mdhd = find(v, inner, ["mdia", "mdhd"]);
    let trackSeconds = 0;
    if (mdhd) {
      const mv = v.getUint8(mdhd.body);
      const ts = v.getUint32(mdhd.body + (mv === 1 ? 20 : 12));
      const d = mv === 1 ? Number(v.getBigUint64(mdhd.body + 24)) : v.getUint32(mdhd.body + 16);
      trackSeconds = ts ? d / ts : 0;
    }
    if (frames === 0) throw new Error("not a playable MP4: the video track has no samples");
    const durationSeconds = timescale ? duration / timescale : trackSeconds;
    return {
      bytes: bytes.byteLength,
      brands,
      durationSeconds: Math.round(durationSeconds * 1000) / 1000,
      width,
      height,
      codec,
      frames,
      fps: trackSeconds > 0 ? Math.round((frames / trackSeconds) * 100) / 100 : null,
      fastStart: mdatIndex === -1 || moovIndex < mdatIndex,
    };
  }
  throw new Error("not a playable MP4: no video track");
}

if (import.meta.main) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: bun scripts/video/probe-mp4.ts <file.mp4>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(probeMp4(await Bun.file(file).arrayBuffer())));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
