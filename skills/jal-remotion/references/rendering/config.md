# Configuration file: `remotion.config.ts`

Written against `remotion` 4.0.532 (docs read 2026-10-01).

From:
- https://www.remotion.dev/docs/config

## What it is

A `remotion.config.ts` file in the project root sets defaults for the CLI and the Studio (`remotion studio`, `render`, `still`, `compositions`, `bundle`, `benchmark`, `lambda ...`). It does not affect the Node/Bun SSR APIs, `@remotion/web-renderer`, or Lambda calls made through the API: pass those options in code. A CLI flag always overrides the same config setting.

```ts
import {Config} from '@remotion/cli/config';

Config.setConcurrency(2);
Config.setCodec('h264');
Config.setEntryPoint('./src/index.ts');
```

## When a JAL agent uses it

Once at scaffold time (entry point, Studio port, public dir, concurrency for the dev machine) and when a bundler override is needed (Tailwind, SCSS, aliases). Per-render choices belong on the command line or in code, not here.

## Rules from the docs

- The file runs in a CommonJS environment. To import an ES module (for example to enable Sass), pass an async function to `Config.overrideWebpackConfig()` and use `await import(...)` inside it.
- Old two-level form `Config.Bundling.setCachingEnabled(false)` is deprecated since 3.3.39; use `Config.setCachingEnabled(false)`.
- Renamed: `setTimeoutInMilliseconds` is now `setDelayRenderTimeoutInMilliseconds`; `setLevel` is `setLogLevel`; `setQuality` is `setJpegQuality`; `setPort` is split into `setStudioPort` and `setRendererPort`; `setExperimentalRspackEnabled` is an alias of `setRspack`; `setOutputFormat`, `setImageFormat`, `setFfmpegExecutable`, `setFfprobeExecutable` are removed in 4.0.

## Setter reference

### Bundler and project

| Setter | Since | Meaning |
| --- | --- | --- |
| `overrideBundlerConfig(fn)` | 4.0.498 | Change config shared by Webpack and Rspack; callback gets `(config, {bundler})`; runs before the bundler-specific override |
| `overrideWebpackConfig(fn)` | 1.1.0 | Webpack override (may be async); ignored when Rspack is on |
| `overrideRspackConfig(fn)` | 4.0.498 | Rspack override; only called when Rspack is enabled |
| `setRspack(bool)` | 4.0.502 | Use Rspack; `--rspack` wins |
| `setCachingEnabled(bool)` | 2.0.0 | Webpack bundle cache |
| `setWebpackPollingInMilliseconds(ms)` | 3.3.11 | Poll for file changes (network drives) |
| `setEntryPoint(path)` | 3.2.40 | Entry point for CLI commands |
| `setPublicDir(path)` | 3.2.13 | The `public/` folder |
| `setBundleOutDir(path)` | 4.0.426 | Output of `remotion bundle` |
| `setBinariesDirectory(path)` | 4.0.120 | Where Remotion finds its compositor binaries |
| `setDotEnvLocation(path)` | | Env file for `process.env` in the project |
| `setLogLevel(level)` | 2.0.1 | `error`, `warn`, `info` (default), `verbose` |

### Studio

| Setter | Since | Meaning |
| --- | --- | --- |
| `setStudioPort(port)` | 4.0.61 | Studio HTTP port (default 3000) |
| `setRendererPort(port)` | 4.0.61 | Port serving the bundle during render |
| `setShouldOpenBrowser(bool)` | 3.3.19 | Open the browser on start |
| `setIPv4(bool)` | 4.0.125 | Bind IPv4 (needed on Fly.io) |
| `setMaxTimelineTracks(n)` | 2.1.10 | Timeline rows shown |
| `setKeyboardShortcutsEnabled(bool)` | 3.2.11 | Disable all shortcuts |
| `setKeyboardShortcuts(map)` | 4.0.523 | Rebind shortcuts; omitted ones keep defaults |
| `setInteractivityEnabled(bool)` | 4.0.487 | Turn visual editing on or off |
| `setCanvasTabsEnabled(bool)` | 4.0.530 | Tabs above the canvas |
| `setDefaultEditor(id or custom)` | 4.0.503 | Code editor for "open in editor"; ids `vscode`, `cursor`, `windsurf`, `zed`, `vscodium`, `webstorm`, `sublime-text`, or a custom object |
| `setDefaultCodingAgent(...)` | 4.0.506 | Agent used by the Studio |
| `setAllowHtmlInCanvasEnabled(bool)` | 4.0.447 | HTML-in-canvas capture |
| `setAskAIEnabled(bool)` | 4.0.407 | Turn the Ask AI modal on or off |
| `setForceNewStudioEnabled(bool)` | 4.0.421 | Always start a new Studio |
| `setEnableCrossSiteIsolation(bool)` | 4.0.306 | Send the isolation headers (see server-runtime.md) |
| `setNumberOfSharedAudioTags(n)` | 3.3.2 | Shared `<audio>` tags for preview |
| `setBufferStateDelayInMilliseconds(ms)` | 4.0.111 | Delay before the buffering UI shows |
| `setAudioLatencyHint(hint)` | 4.0.303 | Preview audio latency hint |
| `setExperimentalKeepAudioContextAlive(bool)` | 4.0.508 | Keep the AudioContext alive |
| `setPreviewSampleRate(hz)` | 4.0.470 | Preview audio sample rate |
| `addElementLibrary({url, displayName?})` | 4.0.517 | Add a third-party Element Library to Browse Elements |
| `setPublicLicenseKey(key)` | 4.0.398 | License key shown to the Studio |
| `setBeepOnFinish(bool)` | 4.0.84 | Beep when a render ends |

### Render output

| Setter | Since | Meaning |
| --- | --- | --- |
| `setCodec(codec)` | 1.4.0 | `h264` (default), `h265`, `vp8`, `vp9`, `av1`, `prores`, `h264-mkv`, `gif`, `mp3`, `aac`, `wav` |
| `setAudioCodec`, `setAudioBitrate`, `setVideoBitrate`, `setCrf`, `setEncodingBufferSize`, `setEncodingMaxRate`, `setX264Preset`, `setGopSize`, `setProResProfile`, `setPixelFormat`, `setNumberOfGifLoops` | various | Encoding controls |
| `setVideoImageFormat`, `setStillImageFormat`, `setJpegQuality`, `setScale`, `setImageSequence`, `setImageSequencePattern` | various | Frame capture and sequence output; `jpeg` is fastest, `png` for transparency |
| `setFrameRange`, `setEveryNthFrame` | 2.0.0 / | Subset of frames |
| `setMuted`, `setEnforceAudioTrack`, `setSampleRate`, `setForSeamlessAacConcatenation`, `setPreferLosslessAudio` | various | Audio |
| `setOutputLocation`, `setOverwriteOutput` | 3.1.6 / | Where and whether to overwrite |
| `setConcurrency(n or "50%")` | | Tabs in parallel; `os.cpus().length` is fastest and can starve the machine |
| `setDisallowParallelEncoding(bool)` | 4.0.315 | Lower memory, slower |
| `setHardwareAcceleration(mode)` | 4.0.228 | Hardware encoders |
| `overrideHeight`, `overrideWidth` (3.2.40), `overrideFps`, `overrideDuration` (4.0.424) | | Force composition size, rate, length |
| `overrideFfmpegCommand(fn)` | 3.2.22 | Reducer over the FFmpeg arguments |
| `setDelayRenderTimeoutInMilliseconds(ms)` | 2.6.3 | Per-frame `delayRender()` budget |
| `setBenchmarkRuns`, `setBenchmarkConcurrencies` (4.0.430) | | Defaults for `remotion benchmark` |

### Browser

| Setter | Since | Meaning |
| --- | --- | --- |
| `setBrowserExecutable(path)` | 1.5.0 | Use your own Chromium; the pinned Chrome Headless Shell is recommended |
| `setChromeMode('headless-shell' or 'chrome-for-testing')` | 4.0.248 | Browser flavor, see server-runtime.md |
| `setChromiumOpenGlRenderer(gl)` | | OpenGL backend such as `angle` or `vulkan`; try values with `remotion gpu` and `--gl` |
| `setChromiumHeadlessMode(bool)` | 2.6.5 | `false` shows the window |
| `setChromiumDisableWebSecurity`, `setChromiumIgnoreCertificateErrors`, `setChromiumDarkMode` | 2.6.5 / 4.0.381 | Chromium flags |
| `setChromiumMultiProcessOnLinux(bool)` | 4.0.42 | Multi-process Chrome on Linux (default true) |

### Lambda and Cloud Run defaults

| Setter | Since | Meaning |
| --- | --- | --- |
| `setEnableFolderExpiry(bool)` | 4.0.32 | S3 lifecycle rule for auto-delete (see lambda-ops.md) |
| `setDeleteAfter(duration)` | 4.0.32 | Expiry for renders |
| `setEnableCancellation(bool)` | 4.0.515 | Allow `cancelRenderOnLambda()` |
| `setLambdaInsights(bool)` | 4.0.115 | Enable Lambda Insights on deploy |

## Notes on exact signatures

The cache-size options (`offthreadVideoCacheSizeInBytes`, `mediaCacheSizeInBytes`, `offthreadVideoThreads`) have no config setters on this page: use the CLI flags or pass them in SSR code. The shared option text that describes many setters is not part of the fetched pages, so setter names and versions here come from the config page. For allowed values read the type in the installed `@remotion/cli/config`.
