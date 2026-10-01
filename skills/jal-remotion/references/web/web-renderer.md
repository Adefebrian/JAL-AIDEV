# @remotion/web-renderer

The API for client-side rendering: `renderMediaOnWeb()`, `renderStillOnWeb()`, `canRenderMediaOnWeb()`, `getEncodableVideoCodecs()`, `getEncodableAudioCodecs()` and the types. Concepts and the CSS/tag subset are in `client-side-rendering.md`; read that first.

From: https://www.remotion.dev/docs/web-renderer/ , https://www.remotion.dev/docs/web-renderer/render-media-on-web , https://www.remotion.dev/docs/web-renderer/render-still-on-web , https://www.remotion.dev/docs/web-renderer/can-render-media-on-web , https://www.remotion.dev/docs/web-renderer/get-encodable-video-codecs , https://www.remotion.dev/docs/web-renderer/get-encodable-audio-codecs , https://www.remotion.dev/docs/web-renderer/types

Stable API from 4.0.491. `renderMediaOnWeb` and `renderStillOnWeb` exist since 4.0.397. Install: `bun add --exact @remotion/web-renderer@<v>` (same version as `remotion`).

## 1. The composition object

Both render functions take a `composition` object instead of a bundled composition id:

```ts
composition: {
  id: "hero",
  component: Hero,               // the React component
  width: 1920, height: 1080,
  fps: 30, durationInFrames: 150,
  defaultProps?: {...},
  calculateMetadata?: (...) => ..., // may replace width, height, fps, durationInFrames
}
```

Input props go in `inputProps`. `getInputProps()` does not work in CSR; the component receives its props normally.

## 2. `renderMediaOnWeb(options)`

Returns `{ getBlob() }` (a Promise of a Blob). Do not call `getBlob()` if you passed `outputWritable`.

| Option | Meaning | Default and notes |
|---|---|---|
| `composition` | See section 1 | required |
| `inputProps` | Props for the component | `calculateMetadata` may transform them |
| `container` | `mp4`, `webm`, and also `mkv`, `mov`, `wav`, `mp3`, `aac`, `ogg`, `flac` per the types page | `mp4` |
| `videoCodec` | `h264`, `h265`, `vp8`, `vp9`, `av1` | `h264` for mp4, `vp8` for webm |
| `audioCodec` | `aac`, `opus`, `mp3`, `vorbis`, `pcm-s16`, `flac` | `aac` for mp4, `opus` for webm |
| `frameRange` | A frame, `[start, end]` (inclusive), or `[start, null]` | all frames. The `[start, null]` form is from 4.0.421 |
| `scale` | Multiplies output size (1280x720 with 1.5 gives 1920x1080) | 1. Pass the same value to `canRenderMediaOnWeb` |
| `videoBitrate`, `audioBitrate` | bits per second or `very-low`, `low`, `medium`, `high`, `very-high` | `medium` |
| `hardwareAcceleration` | `no-preference`, `prefer-hardware`, `prefer-software` | `no-preference` |
| `keyframeIntervalInSeconds` | Gap between keyframes. Lower seeks better and files grow | 5 |
| `transparent` | Alpha channel. Only `webm` or `mkv` with `vp8` or `vp9`; others throw | false |
| `muted` | Leave out audio | false |
| `sampleRate` | Audio sample rate (4.0.448) | 48000 |
| `metadata` | Embedded tags (title, artist, comment...) (4.0.517); Remotion appends "Made with Remotion <version>" to the comment | none |
| `onProgress` | `{ encodedFrames, renderEstimatedTime, progress, doneIn }` | |
| `pageResponsiveness` | `disabled`, `low`, `medium`, `high`, or ms (4.0.487) | `medium` |
| `delayRenderTimeoutInMilliseconds` | How long `delayRender()` calls may take | 30000 |
| `signal` | AbortSignal to cancel | |
| `mediaCacheSizeInBytes` | Budget for decoded media; also the per-source read cache. Not a cap on total memory | half of system memory |
| `onFrame` | Receive each `VideoFrame` before encoding; return the same frame or a new one with identical size and timestamp | |
| `onArtifact` | Receive files emitted by the `<Artifact>` component | |
| `outputTarget` | `arraybuffer` (memory) or `web-fs` (Origin Private File System, better for large files) | auto: `web-fs` if available |
| `outputWritable` | A `WritableStream` that receives chunks at byte positions; `FileSystemWritableFileStream` fits. Takes precedence over `outputTarget` (4.0.508) | |
| `schema` | A Zod v4 object schema to validate `inputProps` | |
| `licenseKey`, `isProduction` | License key for this render; `isProduction: false` marks a dev render as not billable (4.0.409). Only with a `licenseKey` | see section 9 |
| `allowHtmlInCanvas` | Experimental Chromium capture path (4.0.447) | false |
| `logLevel` | `trace` to `error` | `info` |

## 3. `renderStillOnWeb(options)`

Draws one frame (zero-indexed). Options: `composition`, `frame`, `inputProps`, `scale`, `delayRenderTimeoutInMilliseconds`, `logLevel`, `signal`, `schema`, `licenseKey`, `isProduction`, `allowHtmlInCanvas`.

It resolves to an object with:

- `canvas()`: a Promise of the `OffscreenCanvas` holding the pixels (draw from it or pass it on),
- `blob(options?)`: encodes to a Blob; `options` is `RenderStillOnWebEncodeOptions` with a `format` (`png`, `jpeg` or `webp`) and `quality` for jpeg and webp,
- `url(options?)`: the same, then `URL.createObjectURL()`; call `URL.revokeObjectURL()` when done,
- `internalState`: bookkeeping for tests.

Use it for posters (`thumbnail-and-preload.md` section 3), share cards ("download as image"), and stills of a configured composition.

## 4. `canRenderMediaOnWeb(options)`

Ask before you show the button. It takes `width` and `height` (required), and optionally `scale` (4.0.530; pass the composition's size and the same `scale`, not the scaled size), `container`, `videoCodec`, `audioCodec`, `transparent`, `muted` (skips audio checks), `videoBitrate`, `audioBitrate`, `outputTarget`.

Result: `{ canRender, issues, resolvedVideoCodec, resolvedAudioCodec, ... }`. (The function page reads `resolvedVideoCodec` and `resolvedAudioCodec`; the types page lists the same fields as `videoCodec`, `audioCodec` and `outputTarget`. **[verify]** the names against the installed types.) Each issue has `type` (for example `video-codec-unsupported`, `webcodecs-unavailable`), `message` and `severity` (`error` or `warning`).

For H.264, H.265 and AV1 the scaled size is adjusted down to an even number, the same way the render does.

```ts
const check = await canRenderMediaOnWeb({ width, height, container: "mp4", videoCodec: "h264" });
if (!check.canRender) {
  show(check.issues.filter(i => i.severity === "error").map(i => i.message));
}
```

`getEncodableVideoCodecs(container, { videoBitrate? })` returns which of `h264`, `h265`, `vp8`, `vp9`, `av1` this browser can encode; `getEncodableAudioCodecs(container, { audioBitrate? })` returns `aac` and/or `opus`. Use them to fill a codec selector or to pick the best default (for example `h264` where present, else `vp9` in `webm`).

## 5. Types you will use

`WebRendererContainer`, `WebRendererVideoCodec`, `WebRendererAudioCodec`, `WebRendererQuality`, `WebRendererOutputTarget`, `WebRendererPageResponsiveness`, `FrameRange`, `RenderStillOnWebImageFormat`, `RenderStillOnWebEncodeOptions`, `CanRenderIssue`, `CanRenderIssueType`, `CanRenderMediaOnWebResult`, `EmittedArtifact`, `WebRendererOnArtifact`, `OnFrameCallback`, `GetEncodableVideoCodecsOptions`, `GetEncodableAudioCodecsOptions`. More container and codec values may be added without a breaking change, so do not exhaustively switch on them.

## 6. Where the pieces come from

Encoding uses Mediabunny and the browser's WebCodecs encoders; decoding of embedded media uses `<Video>` and `<Audio>` from `@remotion/media` (also Mediabunny). So the supported formats follow Mediabunny's list (`mediabunny.md`). Hardware encoding availability depends on the device.

## 7. JAL export component (the recommended pattern)

One small component per site: support check, a codec choice only if needed, progress, cancel, save. The Remotion code loads lazily when the visitor presses Export, so a visitor who never exports downloads none of it beyond the Player chunk.

```tsx
// motion/ExportButton.tsx
import { useRef, useState } from "react";

type Status = "idle" | "checking" | "rendering" | "done" | "unsupported" | "error" | "cancelled";

export function ExportButton({ id, props, width, height, fps, durationInFrames, loadComposition }: ExportProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const abort = useRef<AbortController | null>(null);

  async function start() {
    setStatus("checking");
    const { renderMediaOnWeb, canRenderMediaOnWeb } = await import("@remotion/web-renderer"); // lazy
    const check = await canRenderMediaOnWeb({ width, height, container: "mp4" });
    if (!check.canRender) {
      setMessage(check.issues.map(i => i.message).join(" "));
      return setStatus("unsupported");
    }
    const { component } = await loadComposition();
    abort.current = new AbortController();
    setStatus("rendering");
    try {
      // Chromium: stream straight to the file the visitor picked (no memory spike)
      let outputWritable: WritableStream | undefined;
      if ("showSaveFilePicker" in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${id}.mp4`,
          types: [{ description: "MP4 video", accept: { "video/mp4": [".mp4"] } }],
        });
        outputWritable = await handle.createWritable();
      }
      const result = await renderMediaOnWeb({
        composition: { id, component, width, height, fps, durationInFrames },
        inputProps: props,
        container: "mp4",
        videoBitrate: "medium",
        pageResponsiveness: "high",
        signal: abort.current.signal,
        outputWritable,
        onProgress: (p) => setProgress(p.progress),
      });
      if (!outputWritable) {
        const blob = await result.getBlob();
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), { href: url, download: `${id}.mp4` });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      setStatus("done");
    } catch (e) {
      if (abort.current?.signal.aborted) return setStatus("cancelled");
      setMessage(String((e as Error).message ?? e));
      setStatus("error");
    }
  }
  /* render: a Button (kit), a <progress value={progress}> with an aria-label, a Cancel button
     while rendering (abort.current?.abort()), and role="status" text for each state change */
}
```

Rules for this component:

- The visitor starts the work; nothing exports on its own.
- Show estimated time from `renderEstimatedTime`; a progress element with an accessible name; a Cancel button; a plain error with the issue text; a `role="status"` live region that announces start, done and failure.
- On a phone cap resolution and duration (for example 720p and 30 s) because encoding competes with the page for memory and the tab may be suspended if the user switches apps.
- Revoke object URLs. Abort on unmount.
- Cleanly handle the file picker being dismissed (the `showSaveFilePicker` call throws `AbortError`; treat it as cancel).
- `showSaveFilePicker` is Chromium only; the Blob download path covers Safari and Firefox.
- Respect `exportable` in the schema file; render the button only for exportable compositions.

## 8. Common failures

| Message or symptom | Cause | Fix |
|---|---|---|
| `canRender` false with `webcodecs-unavailable` | Browser too old | Show the minimum versions; offer a poster download |
| Tainted image error | Asset without CORS | Add `Access-Control-Allow-Origin` (`client-side-rendering.md` section 5) |
| Output looks wrong (a shadow or filter missing, layers in the wrong order) | CSS outside the subset, or `z-index` used | Remove the property, order elements back to front |
| Render stalls | A `delayRender()` never resolved, or the 30 s default timed out | Use `useDelayRender()`, raise `delayRenderTimeoutInMilliseconds` only if justified |
| Page janky while rendering | `pageResponsiveness` too low | Use `high` while the visitor can interact |
| Out of memory on long renders | `arraybuffer` target | Use `web-fs` or `outputWritable`, lower `mediaCacheSizeInBytes`, lower resolution |
| Wrong text font in SVG | Font loaded by CSS only | Load through `@remotion/fonts` or `@remotion/google-fonts` and set the family inside the SVG |

## 9. License and telemetry note

The web renderer is under the Remotion License like the rest of the packages. The free license covers JAL at 3 people. `licenseKey` and `isProduction` exist so a company license can count production renders on remotion.pro (the pricing page ties renders to the Automators plan at one cent per render). A free-license JAL site passes `licenseKey: 'free-license'` (Brian, 2026-10-01): it declares free eligibility and silences the console warning. If the team reaches 4 people or an external client appears, stop and ask Brian before adding a company key (`products-and-licensing.md`). Telemetry: every render, success or failure, sends the page origin, the success flag, and the visitor's IP to remotion.pro (`../core/license-and-policy.md`, Telemetry). On a public page in-browser export is used only when the feature is needed, with a privacy-policy line added automatically and no UI text (no notice, banner, or extra copy: Brian, 2026-10-01) (operational telemetry to Remotion as a technical provider); internal tools and dev pages use it freely (Brian, 2026-10-01; `skills/jal-remotion/SKILL.md` section 6). Allow `https://www.remotion.pro` in `connect-src`.
