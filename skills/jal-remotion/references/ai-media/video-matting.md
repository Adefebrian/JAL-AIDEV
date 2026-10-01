# Video matting (@remotion/video-matting): remove a video background locally

From:
- https://www.remotion.dev/docs/video-matting/
- https://www.remotion.dev/docs/video-matting/can-use-video-matting
- https://www.remotion.dev/docs/video-matting/get-available-models
- https://www.remotion.dev/docs/video-matting/is-video-matting-model-cached
- https://www.remotion.dev/docs/video-matting/download-video-matting-model
- https://www.remotion.dev/docs/video-matting/load-video-matting-model
- https://www.remotion.dev/docs/video-matting/separate-video-layers
- https://www.remotion.dev/docs/video-matting/dispose-video-matting-model
- https://www.remotion.dev/docs/video-matting/remove-video-matting-model
- https://www.remotion.dev/docs/video-matting/node
- https://www.remotion.dev/docs/ai/webmcp (the `remove_video_background` tool)

Remotion version this was written against: `remotion` 4.0.532, `@remotion/video-matting` 4.0.523 (docs read 2026-10-01). Package is MIT; the models keep their own licences.

## What it is

AI background removal for video, running on the user's own GPU through WebGPU in the browser or in Node/Bun. Input: one video. Output: two WebM (VP9) files, both full frame:

- **base**: opaque, the original frames (includes the subject).
- **foreground**: the subject only, with alpha.

Stack them with your own content between the two (text, graphics, a new background) and the subject appears in front of the inserted content. That gives the "title behind the person" look and clean cut-outs without green screen. Nothing is uploaded: all processing is local, which suits client footage with faces.

## When a JAL agent uses it

Text or motion graphics behind a presenter, product/person cut-outs for social video, replacing a background, overlays that float in front of a speaker. Not for server batch work (needs a GPU) and not for stills (use an image tool).

## Install

```
bunx remotion add @remotion/video-matting @huggingface/transformers
```

Docs form: `npx remotion add ...`. In Node/Bun also add `mediabunny @mediabunny/server`. `@huggingface/transformers` brings ONNX Runtime, a heavy dependency: transformers.js and ONNX stay off until Brian approves them per project (decided 2026-10-01). Keep every `@remotion/*` on the exact same version.

## Models

| Name | For | WebGPU download | Licence | Status |
|---|---|---|---|---|
| `modnet` | People | 25.9 MB | Apache-2.0 | Default |
| `ben2-base` | General foreground subjects | 219.1 MB | MIT (BEN2 Base export) | Experimental, higher memory, needs a WebGPU adapter with `shader-f16` |

Files are mirrored from Hugging Face to remotion.media (byte-identical, faster). Note the Studio/WebMCP tool defaults to `ben2-base`, while the API defaults to `modnet`: pass the model explicitly. `getAvailableModels()` returns `{name, modelId, purpose, webGpuDownloadSize}`.

## API

| Function | Does |
|---|---|
| `canUseVideoMatting({model?})` | Checks WebGPU and model needs (not the input file's codecs). Reasons: `window-undefined`, `webgpu-unavailable`, `webgpu-requires-secure-context`, `shader-f16-unavailable`. In Node it runs a tiny inference; failure returns `webgpu-unavailable` with the ONNX error in `detailedReason`. |
| `isVideoMattingModelCached({model})` | All remotion.media files present in the cache. |
| `downloadVideoMattingModel({model, onProgress?, signal?})` | 4.0.528. Returns `{alreadyDownloaded}`. Browser Cache API, Node filesystem cache, or a Transformers.js custom cache must be enabled. |
| `loadVideoMattingModel({model, onProgress?, signal?})` | 4.0.528 options. Result has `alreadyLoaded` and `[Symbol.asyncDispose]`; use `await using`. `separateVideoLayers()` loads automatically. |
| `separateVideoLayers({src, ...})` | The main call (below). |
| `disposeVideoMattingModel({model?})` | Frees memory, keeps cached files; waits for active runs. |
| `removeVideoMattingModel({model})` | Frees memory and deletes cached files; waits for active runs. |

### separateVideoLayers options

- `src`: string, URL or Blob (a `File` is a Blob). In Node also local paths and `file:` URLs.
- `model`: `modnet` (default) or `ben2-base`.
- `audio`: `base` (default, audio only in the base), `foreground`, `both` (do not play both unmuted, the sound doubles), `none`.
- `outputs.base` / `outputs.foreground`: `{outputTarget: 'arraybuffer' | 'web-fs', outputWritable}`. Default picks `web-fs` (browser origin-private file system, streamed to storage) when available, else memory. `outputWritable` is a `WritableStream<StreamTargetChunk>` (Mediabunny): writes may land at arbitrary positions, not append-only; `getBlob()` then rejects. The two are mutually exclusive per layer.
- `videoBitrate`: VP9, a number of bits per second or `very-low | low | medium | high | very-high` (default `very-high`; higher keeps fine alpha edges, larger files).
- `audioBitrate`: Opus; when omitted compatible Opus is copied without re-encoding.
- `keyframeIntervalInSeconds`: default 1.
- `signal`: AbortSignal; the current frame may finish first.
- `onModelLoadProgress`, `onProgress({stage: 'processing' | 'finalizing', progress, processedFrames, processedDurationInSeconds, durationInSeconds})`.

Returns `{base, foreground, model, width, height, durationInSeconds, processedFrames}`; each layer has `getBlob()`, `dispose()` (call after `getBlob()` resolves) and `[Symbol.asyncDispose]`. The returned blobs outlive `dispose()`.

```ts
import {canUseVideoMatting, downloadVideoMattingModel, separateVideoLayers} from '@remotion/video-matting';
const ok = await canUseVideoMatting({model: 'modnet'});
if (!ok.supported) throw new Error(ok.detailedReason);
await downloadVideoMattingModel({model: 'modnet'});
await using layers = await separateVideoLayers({src: file, model: 'modnet', audio: 'base'});
const base = await layers.base.getBlob();
const foreground = await layers.foreground.getBlob();
```

## Requirements and limits

- A GPU is required. The browser must decode the input and encode VP9 with alpha through WebCodecs; `separateVideoLayers()` checks this for the input.
- In Node/Bun call `registerMediabunnyServer()` first (decode, VP9 alpha encode, audio). No canvas polyfill needed. Transformers.js uses ONNX Runtime's native WebGPU provider; not supported on Linux arm64; serverless and a typical Coolify container have no GPU. Choose the cache folder with `env.cacheDir = resolve('.cache/video-matting')` from `@huggingface/transformers` before downloading.
- Output is WebM only. Putting the two layers into a Remotion composition uses the normal video tag; handling of alpha WebM playback and rendering is covered by the video-embedding references of this skill, check there.

## Studio

Select a video in Studio and choose **Remove background**. It replaces the video's source with a transparent WebM, so duplicate the layer first if the original must stay. WebMCP `remove_video_background` does the same as a Jobs-queue job (`assetPath`, `outputPath`, `model`, `audio: 'keep' | 'none'`, `videoBitrate`), output `<asset>-no-background.webm`, and asks to install the package if it is missing.

## JAL workflow

1. Run the matte on a developer machine with a GPU (Mac is fine), in Studio or a small Bun script.
2. Commit the resulting WebM layers to `public/` (or object storage) like any asset; the server render never needs a GPU.
3. Compose: base video at the back, inserted JAL content in the middle, foreground on top, same size and same frame timing; one audio track only.
4. Check edges at 100 percent on hair and motion; raise `videoBitrate` or switch model if edges flicker.
5. Get the subject's consent for client footage; local processing means no upload risk.
