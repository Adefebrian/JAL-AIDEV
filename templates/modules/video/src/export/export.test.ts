// The in-browser export with fakes: feature detection, codec choice,
// progress, cancel, props validation, and the no-server rule. No install
// needed: the renderer and the composition are injected.
import { describe, expect, test } from "bun:test";
import type { VideoEntry } from "../compositions/registry";
import { join } from "node:path";
import { checkMp4Support, EXPORT_FONT_FAMILIES, EXPORT_FRAME_WARN, exportMp4, loadExportFonts, type Mp4ExportResult } from "./mp4";
import { settleExport } from "./state";
import { formatBytes, framesIn, hasWebCodecs, mp4FileName, NO_WEBCODECS } from "./support";

const withCodecs = { VideoEncoder: function VideoEncoder() {}, VideoFrame: function VideoFrame() {} };

const entry: VideoEntry<{ title: string }> = {
  id: "social-cut",
  title: "Social cut",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 210,
  posterFrame: 50,
  load: async () => ({ component: () => null, defaultProps: { title: "Hello" } }),
  schema: async () =>
    ({
      safeParse: (v: { title: unknown }) =>
        typeof v.title === "string" && v.title.length > 0
          ? { success: true, data: v }
          : { success: false, error: { issues: [{ path: ["title"], message: "Required" }] } },
    }) as never,
};

function fakeRenderer(opts: { encodable?: string[]; failWith?: string } = {}) {
  const calls: { can: unknown[]; render: Record<string, any>[] } = { can: [], render: [] };
  const encodable = opts.encodable ?? ["h264"];
  const lib = {
    canRenderMediaOnWeb: async (o: { videoCodec: string }) => {
      calls.can.push(o);
      const ok = encodable.includes(o.videoCodec);
      return { canRender: ok, issues: ok ? [] : [{ type: "video-codec-unsupported", message: `no ${o.videoCodec}`, severity: "error" }], resolvedVideoCodec: null, resolvedAudioCodec: null, resolvedOutputTarget: "arraybuffer" };
    },
    renderMediaOnWeb: async (o: Record<string, any>) => {
      calls.render.push(o);
      if (opts.failWith) throw new Error(opts.failWith);
      const frames = Array.isArray(o.frameRange) ? o.frameRange[1] - o.frameRange[0] + 1 : 210;
      for (let i = 1; i <= 3; i++) {
        if (o.signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
        o.onProgress?.({ progress: i / 3, encodedFrames: Math.round((frames * i) / 3), renderedFrames: 0, doneIn: null, renderEstimatedTime: 0 });
        await Promise.resolve();
      }
      return { getBlob: async () => new Blob([new Uint8Array(1234)], { type: "video/mp4" }), internalState: {} };
    },
  };
  return { calls, renderer: async () => lib as never };
}

describe("feature detection", () => {
  test("WebCodecs needs VideoEncoder and VideoFrame", () => {
    expect(hasWebCodecs({})).toBe(false);
    expect(hasWebCodecs({ VideoEncoder: function () {} })).toBe(false);
    expect(hasWebCodecs(withCodecs)).toBe(true);
  });

  test("no WebCodecs: a clear message, and the renderer chunk is never loaded", async () => {
    let loaded = false;
    const res = await checkMp4Support(entry, { env: {}, renderer: async () => ((loaded = true), {} as never) });
    expect(res).toEqual({ ok: false, reason: NO_WEBCODECS, issues: ["webcodecs-unavailable"] });
    expect(loaded).toBe(false);
    expect(NO_WEBCODECS).toContain("Nothing is sent to a server");
  });

  test("picks H.264 first, falls back to the next MP4 codec", async () => {
    expect(await checkMp4Support(entry, { env: withCodecs, renderer: fakeRenderer().renderer })).toEqual({ ok: true, codec: "h264" });
    expect(await checkMp4Support(entry, { env: withCodecs, renderer: fakeRenderer({ encodable: ["vp9"] }).renderer })).toEqual({ ok: true, codec: "vp9" });
  });

  test("no encodable codec: the reason names the size and the issues", async () => {
    const res = await checkMp4Support(entry, { env: withCodecs, renderer: fakeRenderer({ encodable: [] }).renderer });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toContain("1080x1920");
      expect(res.issues).toEqual(["no h264", "no vp9", "no av1"]);
    }
  });
});

describe("exportMp4", () => {
  test("renders MP4 in the browser with progress, muted, under the free license", async () => {
    const { calls, renderer } = fakeRenderer();
    const progress: number[] = [];
    const res = await exportMp4(entry, { env: withCodecs, renderer, frameRange: [0, 89], waitForFonts: false, onProgress: (p) => progress.push(p.progress) });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res).toMatchObject({ fileName: "social-cut-excerpt.mp4", codec: "h264", frames: 90, seconds: 3, bytes: 1234 });
    }
    expect(progress).toEqual([1 / 3, 2 / 3, 1]);
    const o = calls.render[0];
    expect(o).toMatchObject({ container: "mp4", videoCodec: "h264", muted: true, licenseKey: "free-license", frameRange: [0, 89], inputProps: { title: "Hello" } });
    expect(o.composition).toMatchObject({ id: "social-cut", width: 1080, height: 1920, fps: 30, durationInFrames: 210 });
  });

  test("cancel: aborting the signal returns cancelled, never an error", async () => {
    const { renderer } = fakeRenderer();
    const controller = new AbortController();
    const res = await exportMp4(entry, {
      env: withCodecs,
      renderer,
      waitForFonts: false,
      signal: controller.signal,
      onProgress: () => controller.abort(),
    });
    expect(res).toEqual({ ok: false, cancelled: true, reason: "Export cancelled." });
  });

  test("an already aborted signal never starts a render", async () => {
    const { calls, renderer } = fakeRenderer();
    const controller = new AbortController();
    controller.abort();
    const res = await exportMp4(entry, { env: withCodecs, renderer, waitForFonts: false, signal: controller.signal });
    expect(res.ok).toBe(false);
    expect(calls.render.length).toBe(0);
  });

  test("invalid props are refused before rendering; valid ones are validated and passed", async () => {
    const bad = fakeRenderer();
    const res = await exportMp4(entry, { env: withCodecs, renderer: bad.renderer, waitForFonts: false, inputProps: { title: "" } });
    expect(res).toEqual({ ok: false, cancelled: false, reason: "The composition props are not valid: title: Required" });
    expect(bad.calls.render.length).toBe(0);
    const good = fakeRenderer();
    await exportMp4(entry, { env: withCodecs, renderer: good.renderer, waitForFonts: false, inputProps: { title: "Hi" } });
    expect(good.calls.render[0].inputProps).toEqual({ title: "Hi" });
  });

  test("no WebCodecs: the reason, no render, and no fallback to any server", async () => {
    const { calls, renderer } = fakeRenderer();
    const fetched: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (u: string) => (fetched.push(String(u)), new Response("{}"))) as typeof fetch;
    try {
      const res = await exportMp4(entry, { env: {}, renderer, waitForFonts: false });
      expect(res).toEqual({ ok: false, cancelled: false, reason: NO_WEBCODECS });
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(calls.render.length).toBe(0);
    expect(fetched).toEqual([]);
  });

  test("a renderer failure comes back as a reason", async () => {
    const res = await exportMp4(entry, { env: withCodecs, renderer: fakeRenderer({ failWith: "encoder closed" }).renderer, waitForFonts: false });
    expect(res).toEqual({ ok: false, cancelled: false, reason: "The browser could not finish the export: encoder closed" });
  });
});

describe("support helpers", () => {
  test("framesIn", () => {
    expect(framesIn(undefined, 210)).toBe(210);
    expect(framesIn(null, 210)).toBe(210);
    expect(framesIn(12, 210)).toBe(1);
    expect(framesIn([0, 89], 210)).toBe(90);
    expect(framesIn([200, null], 210)).toBe(10);
    expect(framesIn([200, 500], 210)).toBe(10);
  });
  test("file names and sizes", () => {
    expect(mp4FileName("Product Intro!")).toBe("product-intro.mp4");
    expect(mp4FileName("social-cut", "excerpt")).toBe("social-cut-excerpt.mp4");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(276509)).toBe("270 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("export fonts", () => {
  test("loads every family the compositions use before the first frame", async () => {
    const order: string[] = [];
    const fonts = {
      load: async (f: string) => void order.push(`load ${f}`),
      get ready() {
        order.push("ready");
        return Promise.resolve();
      },
    };
    const { calls, renderer } = fakeRenderer();
    const wrapped = async () => {
      const lib = (await renderer()) as any;
      return { ...lib, renderMediaOnWeb: async (o: Record<string, any>) => (order.push("render"), lib.renderMediaOnWeb(o)) } as never;
    };
    const res = await exportMp4(entry, { env: withCodecs, renderer: wrapped, fonts, savePicker: null });
    expect(res.ok).toBe(true);
    expect(order).toEqual(['load 1em "Geist"', 'load 1em "Geist Mono"', "ready", "render"]);
    expect(calls.render.length).toBe(1);
  });

  test("a family that fails to load does not block the export", async () => {
    await loadExportFonts({ load: async () => Promise.reject(new Error("no face")), ready: Promise.resolve() });
  });

  test("the families match the composition tokens", async () => {
    const tokens = await Bun.file(join(import.meta.dir, "..", "compositions", "tokens.ts")).text();
    const first = (key: string) => tokens.match(new RegExp(`${key}: '"([^"]+)"`))?.[1];
    expect([first("sans"), first("mono")]).toEqual([...EXPORT_FONT_FAMILIES]);
  });
});

describe("long exports", () => {
  const writable = () => {
    const w = { aborted: false, abort: async () => void (w.aborted = true) };
    return w;
  };
  const quiet = <T>(fn: () => Promise<T>) => {
    const warn = console.warn;
    const seen: string[] = [];
    console.warn = (m: string) => void seen.push(m);
    return fn().finally(() => (console.warn = warn)).then((r) => ({ r, seen }));
  };

  test("above the frame limit: a warning, and the MP4 streams into the picked file", async () => {
    const { calls, renderer } = fakeRenderer();
    const w = writable();
    const picked: unknown[] = [];
    const savePicker = async (o: unknown) => (picked.push(o), { createWritable: async () => w as never });
    const { r, seen } = await quiet(() => exportMp4(entry, { env: withCodecs, renderer, waitForFonts: false, frameWarnLimit: 100, savePicker }));
    expect(seen.length).toBe(1);
    expect(seen[0]).toContain("210 frames (above 100)");
    expect(picked).toEqual([{ suggestedName: "social-cut.mp4", types: [{ description: "MP4 video", accept: { "video/mp4": [".mp4"] } }] }]);
    expect(calls.render[0].outputWritable).toBe(w);
    expect(r).toMatchObject({ ok: true, savedToFile: true, blob: null, fileName: "social-cut.mp4" });
  });

  test("below the limit, or with no picker: memory, as before", async () => {
    const { calls, renderer } = fakeRenderer();
    let asked = false;
    const savePicker = async () => ((asked = true), { createWritable: async () => writable() as never });
    const short = await exportMp4(entry, { env: withCodecs, renderer, waitForFonts: false, savePicker });
    expect(asked).toBe(false);
    expect(short).toMatchObject({ ok: true, savedToFile: false, bytes: 1234 });
    expect(EXPORT_FRAME_WARN).toBe(1800);
    const { r, seen } = await quiet(() => exportMp4(entry, { env: withCodecs, renderer, waitForFonts: false, frameWarnLimit: 100, savePicker: null }));
    expect(seen[0]).toContain("held in memory");
    expect(r).toMatchObject({ ok: true, savedToFile: false });
    expect(calls.render.every((o) => o.outputWritable === undefined)).toBe(true);
  });

  test("closing the picker cancels; a failed render aborts the file", async () => {
    const { renderer } = fakeRenderer();
    const closed = async () => {
      throw Object.assign(new Error("The user aborted a request."), { name: "AbortError" });
    };
    const { r } = await quiet(() => exportMp4(entry, { env: withCodecs, renderer, waitForFonts: false, frameWarnLimit: 100, savePicker: closed }));
    expect(r).toEqual({ ok: false, cancelled: true, reason: "Export cancelled." });
    const failing = fakeRenderer({ failWith: "encoder crashed" });
    const w = writable();
    const { r: r2 } = await quiet(() => exportMp4(entry, { env: withCodecs, renderer: failing.renderer, waitForFonts: false, frameWarnLimit: 100, savePicker: async () => ({ createWritable: async () => w as never }) }));
    expect(r2.ok).toBe(false);
    expect(w.aborted).toBe(true);
  });
});

describe("settleExport", () => {
  const done: Mp4ExportResult = { ok: true, blob: new Blob([new Uint8Array(4)]), savedToFile: false, fileName: "a.mp4", codec: "h264", frames: 30, seconds: 1, bytes: 4 };
  test("an aborted export never creates an object URL, even when the render finished", () => {
    let urls = 0;
    const createUrl = () => (urls++, "blob:x");
    expect(settleExport(done, true, { createUrl, webCodecs: true })).toEqual({ kind: "cancelled" });
    expect(urls).toBe(0);
    expect(settleExport(done, false, { createUrl, webCodecs: true })).toEqual({ kind: "done", url: "blob:x", fileName: "a.mp4", bytes: 4, seconds: 1 });
    expect(urls).toBe(1);
  });
  test("a streamed file, a failure, and a browser without WebCodecs", () => {
    const createUrl = () => "blob:x";
    expect(settleExport({ ...done, blob: null, savedToFile: true }, false, { createUrl, webCodecs: true })).toEqual({ kind: "saved", fileName: "a.mp4", seconds: 1 });
    expect(settleExport({ ok: false, cancelled: false, reason: "r" }, false, { createUrl, webCodecs: true })).toEqual({ kind: "failed", reason: "r" });
    expect(settleExport({ ok: false, cancelled: false, reason: "r" }, false, { createUrl, webCodecs: false })).toEqual({ kind: "unsupported", reason: "r" });
  });
});
