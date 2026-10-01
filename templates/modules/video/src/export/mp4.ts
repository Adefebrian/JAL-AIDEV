// In-browser MP4 export: the default MP4 path for JAL video. The
// composition renders in this tab with @remotion/web-renderer and encodes
// with WebCodecs (through Mediabunny), so no server, no Chrome Headless
// Shell, and no cloud function is involved. The renderer chunk (about the
// size of the Player again) loads only when an export starts.
//
//   const res = await exportMp4(socialCut, { frameRange: [0, 89], onProgress, signal });
//   if (res.ok) downloadBlob(res.blob, res.fileName); else show(res.reason);
//
// Licensing: JAL renders under Remotion's Free License (3 people; a
// Company License is required from 4 people on). The renderer is told so
// with licenseKey "free-license"; pass a real key when JAL holds one.
// After every render the renderer posts a usage event to
// https://www.remotion.pro: the page origin, success or failure, and the
// visitor's IP address (the request carries it), no video data. A public
// page that ships the export adds that origin to connect-src and one line to
// its privacy policy (skill jal-remotion section 6), with no UI text. A page
// whose CSP blocks it logs the failed ping; the export itself is unaffected.
//
// Fonts: every family the compositions draw with (Geist, Geist Mono) is
// loaded with document.fonts.load before the first frame, not just awaited
// with fonts.ready (which skips a face the page itself has not used yet).
//
// Long exports: above EXPORT_FRAME_WARN frames the export warns in the
// console, and where showSaveFilePicker exists it streams straight into the
// file the viewer picks instead of holding the whole MP4 in memory.
import type { RenderMediaOnWebProgress } from "@remotion/web-renderer";
import type { ComponentType } from "react";
import { loadVideo, resolveProps, type VideoEntry } from "../compositions/registry";
import { framesIn, hasWebCodecs, MP4_CODECS, mp4FileName, NO_WEBCODECS, noEncoderMessage, type CodecGlobals, type Mp4Codec } from "./support";

type RendererLib = Pick<typeof import("@remotion/web-renderer"), "renderMediaOnWeb" | "canRenderMediaOnWeb">;
let rendererLib: Promise<RendererLib> | null = null;
/** The renderer chunk, loaded on the first export. */
export function loadRenderer(): Promise<RendererLib> {
  rendererLib ??= import("@remotion/web-renderer");
  return rendererLib;
}

export type FrameRange = number | [number, number] | [number, null];

/** The font families the compositions use (compositions/tokens.ts font.sans and font.mono). */
export const EXPORT_FONT_FAMILIES = ["Geist", "Geist Mono"] as const;

/** Above this many frames (60 s at 30 fps) an export warns and prefers streaming to a file. */
export const EXPORT_FRAME_WARN = 1800;

/** The parts of a FontFaceSet the export uses. */
export interface FontLoader {
  load(font: string): Promise<unknown>;
  ready: Promise<unknown>;
}

/** Load every family (a variable face covers every weight), then wait for the set to settle. */
export async function loadExportFonts(fonts: FontLoader, families: readonly string[] = EXPORT_FONT_FAMILIES): Promise<void> {
  await Promise.all(families.map((f) => fonts.load(`1em "${f}"`).catch(() => undefined)));
  await fonts.ready;
}

/** The writable part of a FileSystemFileHandle. */
export interface SaveFileHandle {
  createWritable(): Promise<WritableStream>;
}
export type SaveFilePicker = (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<SaveFileHandle>;

function defaultPicker(): SaveFilePicker | null {
  const w = globalThis as { showSaveFilePicker?: SaveFilePicker };
  return typeof w.showSaveFilePicker === "function" ? w.showSaveFilePicker.bind(globalThis) : null;
}

export type Mp4Support = { ok: true; codec: Mp4Codec } | { ok: false; reason: string; issues: string[] };

export interface SupportOptions {
  scale?: number;
  /** Injected in tests; defaults to the real renderer chunk. */
  renderer?: () => Promise<RendererLib>;
  env?: CodecGlobals;
}

/** Can this browser encode this composition as MP4, and with which codec. */
export async function checkMp4Support(
  video: Pick<VideoEntry, "width" | "height">,
  { scale = 1, renderer = loadRenderer, env }: SupportOptions = {},
): Promise<Mp4Support> {
  if (!hasWebCodecs(env)) return { ok: false, reason: NO_WEBCODECS, issues: ["webcodecs-unavailable"] };
  const lib = await renderer();
  const issues: string[] = [];
  for (const codec of MP4_CODECS) {
    const res = await lib.canRenderMediaOnWeb({ container: "mp4", videoCodec: codec, width: video.width, height: video.height, scale, muted: true });
    if (res.canRender) return { ok: true, codec };
    for (const i of res.issues) if (i.severity === "error" && !issues.includes(i.message)) issues.push(i.message);
  }
  return { ok: false, reason: noEncoderMessage(Math.round(video.width * scale), Math.round(video.height * scale), issues), issues };
}

export interface ExportProgress {
  /** 0 to 1, overall. */
  progress: number;
  encodedFrames: number;
  totalFrames: number;
}

export interface Mp4ExportOptions<P extends Record<string, unknown>> extends SupportOptions {
  inputProps?: Partial<P>;
  frameRange?: FrameRange;
  onProgress?: (p: ExportProgress) => void;
  signal?: AbortSignal;
  /** Default "free-license" (JAL is 3 people). Pass the Company License key at 4 people or more. */
  licenseKey?: string;
  fileName?: string;
  /** Load Geist and Geist Mono (document.fonts.load) before the first frame. Default true. */
  waitForFonts?: boolean;
  /** Injected in tests; defaults to document.fonts. */
  fonts?: FontLoader | null;
  /** Default EXPORT_FRAME_WARN. */
  frameWarnLimit?: number;
  /** Injected in tests; defaults to window.showSaveFilePicker where it exists. null turns streaming off. */
  savePicker?: SaveFilePicker | null;
}

export type Mp4ExportResult =
  /** blob is null when the MP4 streamed straight into the file the viewer picked (savedToFile). */
  | { ok: true; blob: Blob | null; savedToFile: boolean; fileName: string; codec: Mp4Codec; frames: number; seconds: number; bytes: number }
  | { ok: false; cancelled: boolean; reason: string };

const CANCELLED: Mp4ExportResult = { ok: false, cancelled: true, reason: "Export cancelled." };

export async function exportMp4<P extends Record<string, unknown>>(video: VideoEntry<P>, opts: Mp4ExportOptions<P> = {}): Promise<Mp4ExportResult> {
  const { inputProps, frameRange, onProgress, signal, licenseKey = "free-license", fileName, waitForFonts = true, scale = 1, renderer = loadRenderer, env } = opts;
  const name = fileName ?? mp4FileName(video.id, frameRange === undefined ? undefined : "excerpt");
  const totalFrames = framesIn(frameRange, video.durationInFrames);
  const limit = opts.frameWarnLimit ?? EXPORT_FRAME_WARN;

  // A long export: warn, and stream into a file where the browser can. The
  // picker runs first, while the click's user activation is still fresh.
  let writable: WritableStream | null = null;
  if (totalFrames > limit) {
    const picker = opts.savePicker === undefined ? defaultPicker() : opts.savePicker;
    console.warn(`[video] ${video.id}: exporting ${totalFrames} frames (above ${limit}); ${picker ? "streaming into a file" : "the whole MP4 is held in memory, which a phone may not have"}`);
    if (picker && hasWebCodecs(env)) {
      try {
        const handle = await picker({ suggestedName: name, types: [{ description: "MP4 video", accept: { "video/mp4": [".mp4"] } }] });
        writable = await handle.createWritable();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return CANCELLED; // the viewer closed the picker
        writable = null; // no file access: fall back to memory
      }
    }
  }
  const drop = async () => {
    await writable?.abort().catch(() => undefined);
  };

  const support = await checkMp4Support(video, { scale, renderer, env });
  if (!support.ok) {
    await drop();
    return { ok: false, cancelled: false, reason: support.reason };
  }
  if (signal?.aborted) {
    await drop();
    return CANCELLED;
  }

  const [lib, { mod, schema }] = await Promise.all([renderer(), loadVideo(video, inputProps)]);
  const { props, error } = resolveProps(mod.defaultProps, inputProps, schema);
  if (error) {
    await drop();
    return { ok: false, cancelled: false, reason: `The composition props are not valid: ${error}` };
  }
  const fonts = opts.fonts === undefined ? (typeof document !== "undefined" ? (document.fonts as unknown as FontLoader | undefined) ?? null : null) : opts.fonts;
  if (waitForFonts && fonts) await loadExportFonts(fonts);
  if (signal?.aborted) {
    await drop();
    return CANCELLED;
  }

  try {
    const result = await lib.renderMediaOnWeb({
      composition: {
        id: video.id,
        component: mod.component as ComponentType<Record<string, unknown>>,
        width: video.width,
        height: video.height,
        fps: video.fps,
        durationInFrames: video.durationInFrames,
        defaultProps: props,
        calculateMetadata: null,
      },
      inputProps: props,
      container: "mp4",
      videoCodec: support.codec,
      muted: true,
      scale,
      frameRange: frameRange ?? null,
      signal: signal ?? null,
      licenseKey,
      // Mediabunny writes { type: "write", data, position } chunks, which a
      // FileSystemWritableFileStream takes as is, and closes it when done.
      ...(writable ? { outputWritable: writable as never } : {}),
      onProgress: (p: RenderMediaOnWebProgress) => onProgress?.({ progress: p.progress, encodedFrames: p.encodedFrames, totalFrames }),
    });
    const blob = writable ? null : await result.getBlob();
    return {
      ok: true,
      blob,
      savedToFile: writable !== null,
      fileName: name,
      codec: support.codec,
      frames: totalFrames,
      seconds: totalFrames / video.fps,
      bytes: blob?.size ?? 0,
    };
  } catch (err) {
    await drop();
    if (signal?.aborted) return CANCELLED;
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, cancelled: false, reason: `The browser could not finish the export: ${message}` };
  }
}

/** Save a Blob through a temporary object URL. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
