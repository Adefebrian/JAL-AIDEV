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
// After every render the renderer posts a usage event (the page origin,
// success, no video data) to https://www.remotion.pro. A page whose CSP
// does not allow that origin in connect-src logs the failed ping in the
// console; the export itself is unaffected.
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
  /** Wait for document.fonts.ready first, so Geist is in every frame. Default true. */
  waitForFonts?: boolean;
}

export type Mp4ExportResult =
  | { ok: true; blob: Blob; fileName: string; codec: Mp4Codec; frames: number; seconds: number; bytes: number }
  | { ok: false; cancelled: boolean; reason: string };

const CANCELLED: Mp4ExportResult = { ok: false, cancelled: true, reason: "Export cancelled." };

export async function exportMp4<P extends Record<string, unknown>>(video: VideoEntry<P>, opts: Mp4ExportOptions<P> = {}): Promise<Mp4ExportResult> {
  const { inputProps, frameRange, onProgress, signal, licenseKey = "free-license", fileName, waitForFonts = true, scale = 1, renderer = loadRenderer, env } = opts;
  const support = await checkMp4Support(video, { scale, renderer, env });
  if (!support.ok) return { ok: false, cancelled: false, reason: support.reason };
  if (signal?.aborted) return CANCELLED;

  const [lib, { mod, schema }] = await Promise.all([renderer(), loadVideo(video, inputProps)]);
  const { props, error } = resolveProps(mod.defaultProps, inputProps, schema);
  if (error) return { ok: false, cancelled: false, reason: `The composition props are not valid: ${error}` };
  if (waitForFonts && typeof document !== "undefined" && document.fonts) await document.fonts.ready;
  if (signal?.aborted) return CANCELLED;

  const totalFrames = framesIn(frameRange, video.durationInFrames);
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
      onProgress: (p: RenderMediaOnWebProgress) => onProgress?.({ progress: p.progress, encodedFrames: p.encodedFrames, totalFrames }),
    });
    const blob = await result.getBlob();
    return {
      ok: true,
      blob,
      fileName: fileName ?? mp4FileName(video.id, frameRange === undefined ? undefined : "excerpt"),
      codec: support.codec,
      frames: totalFrames,
      seconds: totalFrames / video.fps,
      bytes: blob.size,
    };
  } catch (err) {
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
