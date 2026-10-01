// Feature detection for the in-browser MP4 export. Pure, so it is tested
// with fake globals. There is no server fallback: a browser that cannot
// encode gets a clear message, never a hidden upload or a cloud render.

export interface CodecGlobals {
  VideoEncoder?: unknown;
  VideoFrame?: unknown;
}

/** WebCodecs encoding needs both VideoEncoder and VideoFrame. */
export function hasWebCodecs(env: CodecGlobals = globalThis as CodecGlobals): boolean {
  return typeof env.VideoEncoder === "function" && typeof env.VideoFrame === "function";
}

/** MP4 video codecs, in order of preference: H.264 plays everywhere. */
export const MP4_CODECS = ["h264", "vp9", "av1"] as const;
export type Mp4Codec = (typeof MP4_CODECS)[number];

export const NO_WEBCODECS =
  "This browser cannot encode video here (WebCodecs is missing). Open the page in a current Chrome, Edge, or Safari to export the MP4. Nothing is sent to a server.";

export function noEncoderMessage(width: number, height: number, issues: string[]): string {
  const detail = issues.length ? ` (${issues.join("; ")})` : "";
  return `This browser cannot encode a ${width}x${height} MP4${detail}. Try a current Chrome or Edge on a desktop. Nothing is sent to a server.`;
}

/** Frames a frameRange covers (Remotion's FrameRange: one frame, [from, to], or [from, null]). */
export function framesIn(range: number | [number, number] | [number, null] | null | undefined, durationInFrames: number): number {
  if (range === null || range === undefined) return durationInFrames;
  if (typeof range === "number") return 1;
  const [from, to] = range;
  const end = to === null ? durationInFrames - 1 : Math.min(to, durationInFrames - 1);
  return Math.max(0, end - Math.max(0, from) + 1);
}

/** "product-intro.mp4" style names, safe for a download attribute. */
export function mp4FileName(id: string, suffix?: string): string {
  const base = `${id}${suffix ? `-${suffix}` : ""}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "video"}.mp4`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
