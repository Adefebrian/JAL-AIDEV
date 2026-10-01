// Mp4Export: the export control for a RemotionFrame's bar (its `actions`).
// Export, a progress bar with a live status line, Cancel, then a
// download link. A browser without WebCodecs gets the reason as text up
// front, and the renderer chunk is never fetched.
import { useEffect, useRef, useState } from "react";
import type { VideoEntry } from "../compositions/registry";
import { exportMp4, type FrameRange, type Mp4ExportResult } from "./mp4";
import { settleExport, type ExportState } from "./state";
import { formatBytes, hasWebCodecs, NO_WEBCODECS } from "./support";

export type { ExportState } from "./state";

export function useMp4Export<P extends Record<string, unknown>>(
  video: VideoEntry<P>,
  opts: { inputProps?: Partial<P>; frameRange?: FrameRange; licenseKey?: string } = {},
) {
  const [state, setState] = useState<ExportState>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);
  const url = useRef<string | null>(null);

  useEffect(() => {
    if (!hasWebCodecs()) setState({ kind: "unsupported", reason: NO_WEBCODECS });
    return () => {
      abort.current?.abort();
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);

  const start = async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setState({ kind: "rendering", progress: 0 });
    const res: Mp4ExportResult = await exportMp4(video, {
      inputProps: opts.inputProps,
      frameRange: opts.frameRange,
      licenseKey: opts.licenseKey,
      signal: controller.signal,
      onProgress: (p) => setState({ kind: "rendering", progress: p.progress }),
    });
    if (abort.current !== controller) return;
    abort.current = null;
    // Cancelled or unmounted while the render finished: no object URL (settleExport checks the signal).
    setState(
      settleExport(res, controller.signal.aborted, {
        createUrl: (blob) => (url.current = URL.createObjectURL(blob)),
        webCodecs: hasWebCodecs(),
      }),
    );
  };

  const cancel = () => abort.current?.abort();
  return { state, start, cancel };
}

export interface Mp4ExportProps<P extends Record<string, unknown>> {
  video: VideoEntry<P>;
  inputProps?: Partial<P>;
  frameRange?: FrameRange;
  licenseKey?: string;
  /** The export button's text. Default "Export MP4". */
  label?: string;
}

export function Mp4Export<P extends Record<string, unknown>>({ video, inputProps, frameRange, licenseKey, label = "Export MP4" }: Mp4ExportProps<P>) {
  const { state, start, cancel } = useMp4Export(video, { inputProps, frameRange, licenseKey });
  let status = "";
  if (state.kind === "rendering") status = `Rendering in this browser, ${Math.round(state.progress * 100)}%`;
  else if (state.kind === "done") status = `Ready: ${state.seconds.toFixed(1)} s, ${formatBytes(state.bytes)}`;
  else if (state.kind === "saved") status = `Saved to ${state.fileName}: ${state.seconds.toFixed(1)} s`;
  else if (state.kind === "failed" || state.kind === "unsupported") status = state.reason;
  else if (state.kind === "cancelled") status = "Export cancelled.";
  return (
    <div className="video-bar" data-video-export={state.kind}>
      {state.kind === "rendering" ? (
        <>
          <button type="button" className="btn btn-secondary" onClick={cancel}>
            Cancel
          </button>
          <progress className="video-progress" max={1} value={state.progress} aria-label={`Export progress for ${video.title}`} />
        </>
      ) : (
        <button type="button" className="btn btn-secondary" onClick={start} disabled={state.kind === "unsupported"}>
          {state.kind === "done" || state.kind === "saved" ? "Export again" : label}
        </button>
      )}
      {state.kind === "done" ? (
        <a className="btn btn-secondary" href={state.url} download={state.fileName}>
          Download {state.fileName}
        </a>
      ) : null}
      <span className="kit-meta" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
