// The export control's states and how a finished export settles, pure so it
// is tested without React.
import type { Mp4ExportResult } from "./mp4";

export type ExportState =
  | { kind: "idle" }
  | { kind: "unsupported"; reason: string }
  | { kind: "rendering"; progress: number }
  | { kind: "done"; url: string; fileName: string; bytes: number; seconds: number }
  | { kind: "saved"; fileName: string; seconds: number }
  | { kind: "failed"; reason: string }
  | { kind: "cancelled" };

/**
 * The state after an export returns. A cancelled (or unmounted) export never
 * creates an object URL, even when the render had already finished, so no
 * Blob is left pinned in memory. An MP4 streamed into a picked file has no
 * Blob to link.
 */
export function settleExport(
  res: Mp4ExportResult,
  aborted: boolean,
  { createUrl, webCodecs }: { createUrl: (blob: Blob) => string; webCodecs: boolean },
): ExportState {
  if (aborted) return { kind: "cancelled" };
  if (res.ok) {
    if (!res.blob) return { kind: "saved", fileName: res.fileName, seconds: res.seconds };
    return { kind: "done", url: createUrl(res.blob), fileName: res.fileName, bytes: res.bytes, seconds: res.seconds };
  }
  if (res.cancelled) return { kind: "cancelled" };
  return webCodecs ? { kind: "failed", reason: res.reason } : { kind: "unsupported", reason: res.reason };
}
