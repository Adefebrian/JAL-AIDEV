# Renderer API: `@remotion/renderer`, `@remotion/bundler`, `@remotion/browser-bundler`, SSR

Written against `remotion` 4.0.532 (docs read 2026-10-01).

From:
- https://www.remotion.dev/docs/browser-bundler/
- https://www.remotion.dev/docs/browser-bundler/create-browser-bundle-runtime
- https://www.remotion.dev/docs/browser-bundler/create-browser-bundler
- https://www.remotion.dev/docs/browser-bundler/create-browser-composition-observer
- https://www.remotion.dev/docs/browser-bundler/get-browser-composition
- https://www.remotion.dev/docs/browser-bundler/load-browser-bundle
- https://www.remotion.dev/docs/bundler
- https://www.remotion.dev/docs/renderer
- https://www.remotion.dev/docs/renderer/combine-chunks
- https://www.remotion.dev/docs/renderer/ensure-browser
- https://www.remotion.dev/docs/renderer/ensure-ffmpeg
- https://www.remotion.dev/docs/renderer/ensure-ffprobe
- https://www.remotion.dev/docs/renderer/extract-audio
- https://www.remotion.dev/docs/renderer/get-can-extract-frames-fast
- https://www.remotion.dev/docs/renderer/get-compositions
- https://www.remotion.dev/docs/renderer/get-silent-parts
- https://www.remotion.dev/docs/renderer/get-video-metadata
- https://www.remotion.dev/docs/renderer/make-cancel-signal
- https://www.remotion.dev/docs/renderer/open-browser
- https://www.remotion.dev/docs/renderer/render-frames
- https://www.remotion.dev/docs/renderer/render-media
- https://www.remotion.dev/docs/renderer/render-still
- https://www.remotion.dev/docs/renderer/select-composition
- https://www.remotion.dev/docs/renderer/stitch-frames-to-video
- https://www.remotion.dev/docs/renderer/types
- https://www.remotion.dev/docs/ssr
- https://www.remotion.dev/docs/ssr-node

## What it is

`@remotion/renderer` is the Node.js and Bun API for server-side rendering (SSR): turn a bundled project into a video, audio file, still or image sequence. The Remotion CLI and Remotion Lambda use it internally. It starts Chrome Headless Shell and FFmpeg, so on JAL it is a fallback or service path, never the default (see render-paths.md). The config file has no effect on these APIs: pass every option in code.

## When a JAL agent uses it

Only after render-paths.md picked local CLI, the Coolify render service, or a cloud path. For the default in-browser path use `@remotion/web-renderer` instead (`../web/web-renderer.md` and `../web/client-side-rendering.md`).

## Install

```
bun add --exact @remotion/renderer@<version> @remotion/bundler@<version>
```

Keep all `remotion` and `@remotion/*` packages on one exact version (`bunx remotionb versions` shows mismatches). `remotion add` does this automatically but lists npm, yarn and pnpm as supported package managers.

## SSR

### The three steps

Rendering takes three steps (Remotion's own framing):

1. Create a bundle once with `bundle()` and reuse it for many renders. If `remotion.config.ts` has a Webpack override, pass the same override to `bundle()`.
2. `selectComposition()` evaluates the composition and runs `calculateMetadata()` with the input props. Use `getCompositions()` only to list everything.
3. Render with `renderMedia()` (video or audio), `renderStill()` (one frame), or `renderFrames()` plus `stitchFramesToVideo()` (image sequence or custom pipeline).

```ts
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const serveUrl = await bundle({entryPoint: require.resolve('./src/index.ts')});
const inputProps = {titleText: 'Hello'};
const composition = await selectComposition({serveUrl, id: 'HelloWorld', inputProps});
await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: 'out/video.mp4', inputProps});
```

From the 4.0.497 options-object signature of `getCompositions()` and `selectComposition()`, `inputProps` is optional in 4.x and required from Remotion 5.0. Pass it always. Reusing an opened browser (`openBrowser()` then `puppeteerInstance`) across calls speeds up repeated renders.

### SSR ways to run (from the SSR overview)

| Way | Note |
| --- | --- |
| Remotion Lambda | Fastest in the cloud; see lambda.md |
| Vercel Sandbox | Easiest on Vercel; see vercel.md |
| Node.js or Bun APIs | This file |
| GitHub Actions | A workflow with `workflow_dispatch`, optionally with input fields mapped to props; the render lands as a downloadable artifact |
| Docker | See server-runtime.md |
| Azure Container Apps, Cloudflare Containers | Deploy guides for the Node/Bun APIs on those clouds; same design as the Coolify service |
| Cloud Run | Alpha, see cloudrun.md |

Server-side rendering sends telemetry only when `licenseKey` is set. The telemetry rules are in license.md. In Next.js, `@remotion/bundler` cannot run in an API route because it contains Webpack; bundle outside the route and pass the folder (see server-runtime.md#edge-runtimes-and-nextjs).

## Function index

| API | Since | What it does | Notes for JAL |
| --- | --- | --- | --- |
| `renderMedia()` | 3.0 | Render video or audio; combines frame rendering and stitching, faster than the two-step flow | Default server call |
| `renderStill()` | 2.3 | Render one frame to an image file or buffer | Thumbnails, posters |
| `renderFrames()` | 3.0 | Render frames as images and compute the audio mix info | Only for custom pipelines |
| `stitchFramesToVideo()` | 1.x | Encode rendered frames and audio info into a video | Pair with `renderFrames()` |
| `selectComposition()` | 4.0 | Resolve one composition and its metadata | Required before render |
| `getCompositions()` | 1.x | List all compositions and resolve each `calculateMetadata()` | Slower than select |
| `openBrowser()` | 3.0 | Open a shared Chrome instance | Reuse it, close with `close()` |
| `ensureBrowser()` | 4.0.137 | Make sure Chrome Headless Shell is downloaded | Call at service start |
| `makeCancelSignal()` | 3.0.15 | Produces `{cancelSignal, cancel}` for the four render functions | Use for job timeouts |
| `combineChunks()` | 4.0.279 | Join separately rendered chunks | Advanced; use Lambda instead |
| `extractAudio()` | 4.0.49 | Copy the audio track of a video to a file, no re-encode | Absolute path only, no URLs |
| `getSilentParts()` | 4.0.18 | Find silent and audible parts of a media file | Returns `silentParts`, `audibleParts`, `durationInSeconds` |
| `getVideoMetadata()` | 4.0.6 | Deprecated; use Mediabunny metadata | Do not use |
| `ensureFfmpeg()`, `ensureFfprobe()`, `getCanExtractFramesFast()` | removed in 4.0 | Historical | Not used |

## `renderMedia()` options

Only the options JAL is likely to touch are described. All are optional unless marked required. Options whose text lives in shared option pages are described by name and meaning.

| Option | Type | Meaning |
| --- | --- | --- |
| `composition` (required) | `VideoConfig` | Result of `selectComposition()`: `id`, `width`, `height`, `fps`, `durationInFrames`, props |
| `serveUrl` (required) | string | Local bundle path or hosted bundle URL |
| `codec` (required) | `Codec` | `h264` (default for MP4), `h265`, `vp8`, `vp9`, `av1`, `prores`, `h264-mkv`, `gif`, audio `mp3`, `aac`, `wav` (AV1 is absent on Lambda and Linux ARM64 GNU) |
| `outputLocation` | string or null | Path to write; null returns a buffer |
| `inputProps` | object | Props for the composition, readable with `getInputProps()` |
| `frameRange` | number, `[a,b]`, `[a,null]` | Render part of the video |
| `everyNthFrame` | number | Skip frames, for GIFs and previews |
| `concurrency` | number, "50%", null | Browser tabs in parallel; default half the CPU threads |
| `crf`, `videoBitrate`, `audioBitrate`, `bufferSize`, `maxRate`, `x264Preset`, `gopSize` | mixed | Quality and rate control; use either `crf` or `videoBitrate`, not both |
| `pixelFormat`, `colorSpace`, `proResProfile`, `numberOfGifLoops` | mixed | Format specifics; ProRes profile only with `prores`; `yuva420p` and PNG for transparency |
| `audioCodec`, `muted`, `enforceAudioTrack`, `sampleRate`, `separateAudioTo`, `forSeamlessAacConcatenation`, `preferLossless` | mixed | Audio handling |
| `imageFormat`, `jpegQuality`, `scale` | mixed | Frame capture format (`jpeg` is fastest; `png` for transparency), scaling factor |
| `hardwareAcceleration` | string | Use hardware encoders when available (4.0.228) |
| `overwrite` | boolean | Default true; false refuses to replace |
| `metadata` | object | Write container metadata (4.0.216) |
| `envVariables` | record | Injected into the project |
| `timeoutInMilliseconds` | number | How long all `delayRender()` calls may block per frame (default 30000) |
| `onProgress`, `onStart`, `onDownload`, `onBrowserLog`, `onArtifact`, `onBrowserDownload` | callbacks | Progress gives `progress`, `renderedFrames`, `encodedFrames`, `stitchStage` (`encoding` or `muxing`) |
| `cancelSignal` | token | From `makeCancelSignal()` |
| `puppeteerInstance` | Browser | An opened browser to reuse |
| `browserExecutable`, `chromeMode`, `chromiumOptions`, `binariesDirectory` | mixed | Browser choice; see server-runtime.md for Chrome modes |
| `chromiumOptions.gl`, `.headless`, `.disableWebSecurity`, `.ignoreCertificateErrors`, `.enableMultiProcessOnLinux`, `.userAgent`, `.darkMode` | mixed | Chromium flags; `gl: "angle"` fixes WebGL2 errors |
| `mediaCacheSizeInBytes`, `offthreadVideoCacheSizeInBytes`, `offthreadVideoThreads` | number | Memory and thread caps for video decoding |
| `disallowParallelEncoding` | boolean | Lower memory use, slower |
| `ffmpegOverride` | function | Reducer that rewrites the FFmpeg command line |
| `repro` | boolean | Produce a reproduction zip for bug reports |
| `licenseKey`, `isProduction` | string, boolean | Telemetry; `licenseKey` replaces the deprecated `apiKey` |
| `compositionStart` | number | Only for distributed rendering |
| `logLevel` | `error`, `warn`, `info`, `verbose` | Replaces `verbose` and `dumpBrowserLogs` |

Renamed or removed: `quality` is `jpegQuality`, `parallelism` is `concurrency`, `ffmpegExecutable` and `ffprobeExecutable` are gone in 4.0, `onSlowestFrames` became the `slowestFrames` return value.

Return value (4.0 and later): `{buffer, slowestFrames, contentType}`. `buffer` is null when `outputLocation` is set. `slowestFrames` lists the 10 slowest frames.

## `renderStill()` options

`composition`, `serveUrl`, `output` (absolute path; omit to get a buffer), `inputProps`, `frame` (default 0, zero-indexed), `imageFormat` (`png`, `jpeg`, `webp`, `pdf`), `jpegQuality`, `scale`, `overwrite` (default true), `envVariables`, `timeoutInMilliseconds`, `cancelSignal`, `puppeteerInstance`, `browserExecutable`, `chromeMode`, `chromiumOptions`, `onBrowserLog`, `onArtifact`, `onBrowserDownload`, `mediaCacheSizeInBytes`, `offthreadVideoCacheSizeInBytes`, `offthreadVideoThreads`, `binariesDirectory`, `logLevel`, `licenseKey`, `isProduction`, `port`. Return `{buffer, contentType}`.

## `renderFrames()` options

Like `renderMedia()` minus encoding, plus: `outputDir` (null with `onFrameBuffer` to receive buffers), `onStart({frameCount})`, `onFrameUpdate`, `onFrameBuffer`, `imageSequencePattern` (4.0.313, naming magic replacements), `frames` (4.0.502, an array of exact frame numbers, rendered in ascending order), `frameRange`. Returns `{frameCount, assetsInfo}`; `assetsInfo` is internal and is only meant to be passed on to `stitchFramesToVideo()`.

## `stitchFramesToVideo()` options

`fps`, `width`, `height`, `assetsInfo`, `outputLocation`, `force` (overwrite, default true), `pixelFormat` (default `yuv420p`), `codec`, `audioCodec` (`pcm-16`, `aac`, `mp3`, `opus`), `audioBitrate`, `videoBitrate`, `bufferSize`, `maxRate`, `crf`, `proResProfile`, `x264Preset`, `gopSize`, `colorSpace`, `numberOfGifLoops`, `muted`, `enforceAudioTrack`, `hardwareAcceleration`, `onProgress`, `onDownload`, `cancelSignal`, `binariesDirectory`, `separateAudioTo`, `forSeamlessAacConcatenation`, `ffmpegOverride`, `metadata`, `verbose`.

## `selectComposition()` and `getCompositions()`

Both take `serveUrl`, `inputProps`, `logLevel`, `port`, `chromiumOptions`, `timeoutInMilliseconds`, `browserExecutable`, `onBrowserLog`, `puppeteerInstance`, `envVariables`, `mediaCacheSizeInBytes`, `offthreadVideoCacheSizeInBytes`, `offthreadVideoThreads`, `binariesDirectory`, `chromeMode`, `onBrowserDownload`. `selectComposition()` also needs `id`. If the serialized default props of the composition are too large for Chrome, you get the "defaultProps too big" error (troubleshooting.md).

## `openBrowser()`, `ensureBrowser()`, `makeCancelSignal()`

- `openBrowser('chrome', options)`: only `"chrome"` is a valid first argument. Options: `logLevel`, `browserExecutable`, `chromiumOptions`, `forceDeviceScaleFactor` (must be set at open time if you scale), `onBrowserDownload`, `chromeMode`. Close with `await browser.close()`.
- `ensureBrowser({chromeMode, browserExecutable, logLevel, onBrowserDownload})`: downloads Chrome Headless Shell if missing. Throws if `browserExecutable` points nowhere. `onBrowserDownload` can pin a version and report `percent`, `downloadedBytes`, `totalSizeInBytes`.
- `makeCancelSignal()`: pass `cancelSignal` to `renderMedia`, `renderStill`, `renderFrames`, `stitchFramesToVideo`; call `cancel()` to stop.

## Media utilities

- `combineChunks({outputLocation, videoFiles, audioFiles, codec, fps, framesPerChunk, compositionDurationInFrames, audioCodec, preferLossless, frameRange, everyNthFrame, ...})` joins chunks rendered with `frameRange` and `compositionStart`. Warned as hard to use; Lambda uses it. Use Lambda or one `renderMedia()` instead.
- `extractAudio({videoSource, audioOutput, logLevel, binariesDirectory})`: extension must match the audio codec; get the codec with Mediabunny metadata.
- `getSilentParts({source, noiseThresholdInDecibels = -20, minDurationInSeconds = 1, ...})`.
- `getVideoMetadata(src)` (deprecated) returned `fps`, `width`, `height`, `durationInSeconds`, `codec`, `supportsSeeking`, `colorSpace`, `audioCodec`, `audioFileExtension`, `pixelFormat`. Use Mediabunny metadata instead.

## Types

`Codec`, `AudioCodec`, `VideoImageFormat`, `StillImageFormat`, `PixelFormat`, `FrameRange` (number, `[start,end]` inclusive, `[start,null]`, or an array of non-overlapping tuples), `Concurrency`, `LogLevel`, `OpenGlRenderer`, `ChromeMode`, `ColorSpace`, `X264Preset`, `Crf`, `Bitrate`, `ChromiumOptions`, `OnStartData`, `RenderMediaOnProgress`, `StitchingState` (`encoding`, `muxing`), `SlowFrame`, `RenderMediaOnDownload`, `BrowserLog`, `FfmpegOverrideFn`, `OnArtifact`, `EmittedArtifact`, `OnBrowserDownload`, `DownloadBrowserProgressFn`, `NumberOfGifLoops`, `RenderMediaOptions`, `RenderStillOptions`, `RenderFramesOptions`, `SelectCompositionOptions`. Import them with `import type {...} from '@remotion/renderer'`.

## Bundler

`@remotion/bundler` provides `bundle()`, which runs Webpack (or Rspack when enabled) over the project and returns a folder path usable as Serve URL. From 4.0.497 bundles made with `remotion bundle` are relocatable (uploadable to Lambda with `deploySiteFromBundle()`). It cannot itself be bundled: calling `bundle()` inside a Next.js route or bundled code breaks with `Can't resolve 'module'` (troubleshooting.md). Do not call `bundle()` at request time; build once in CI or at start-up. See config.md for `overrideBundlerConfig()`, `overrideWebpackConfig()` and `overrideRspackConfig()`.

## Browser bundler

`@remotion/browser-bundler` (since 4.0.527) compiles a virtual Remotion project in the browser (Rspack Browser API) so your own UI can show a registered composition. It does not render files; it feeds a `<Player>`.

| API | Import | Purpose |
| --- | --- | --- |
| `createBrowserBundler()` | `@remotion/browser-bundler` | Build a browser-side compiler for virtual projects (files in memory) |
| `createBrowserBundleRuntime()` | `@remotion/browser-bundler/runtime` | Load a virtual project once, apply later edits through Rspack hot update and React Fast Refresh |
| `loadBrowserBundle()` | runtime | Execute a `BrowserBundle`, return the root component registered with `registerRoot()` |
| `getBrowserComposition()` | runtime | Pick a composition by id, resolve its video config and props |
| `createBrowserCompositionObserver()` | runtime | Keep a root mounted and observe the selected composition's component, props and video config |

Use only for a JAL in-browser editor, and note the license rule against letting end users bring their own Remotion code to a rendering service (license.md).

## Related

- cli.md for the same options as flags, config.md for config-file setters, server-runtime.md for Chrome, Linux and Docker.
