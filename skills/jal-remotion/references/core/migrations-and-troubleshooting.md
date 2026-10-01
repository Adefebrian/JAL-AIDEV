# Migrations and troubleshooting (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01). Remotion 5.0 is not released yet; the 5.0 list is "planned, incomplete". Write code today that is already 5.0-safe (items marked 5.0-safe).

## What it is

The breaking-change history (2.0, 3.0, 4.0, planned 5.0), the upgrade procedure, and the error pages (timeouts, crashed tabs, CORS, ENAMETOOLONG, wrong mounts).

## When a JAL agent uses it

Before bumping Remotion, when a copied snippet from an older tutorial looks wrong, and when a render fails.

## Upgrade procedure

`bunx remotion upgrade` (needs `@remotion/cli`; also updates local skills). Manual: set every `remotion` and `@remotion/*` to one exact version (no `^`), `bun install`, `bunx remotion versions`. Align `zod`, `mediabunny`, `@mediabunny/*` and `@huggingface/transformers` with the versions `@remotion/studio` lists. Within 4.x there are no breaking changes (semver) except APIs marked experimental. Stable-version repo is for customers via remotion.pro. Lambda functions are bound to the Remotion version: redeploy after upgrading.

## Remotion 5.0 planned changes (make code 5.0-safe now)

| Change | 5.0-safe action |
|---|---|
| Min Node/Bun/ESLint raised | check release notes |
| Telemetry mandatory for Company License customers; license key to rendering APIs + config; free eligible pass `"free-license"` | set `licenseKey` |
| WebGL/WebGPU on by default (`--gl` default `angle`, auto fallback `swangle`; Lambda/Cloud Run keep `swangle`) | `--gl=angle` flag can go |
| `selectComposition()` / `getCompositions()` require `inputProps` | pass `{}` |
| `bundle()` and `getCompositions()` take options objects only | `bundle({entryPoint, ...})`, `getCompositions({serveUrl, ...})` |
| `visualizeAudio()` default `optimizeFor: 'speed'` | set explicitly |
| `TransitionSeries` drops `layout="none"` | do not pass `layout` |
| `measureSpring()` loses `from`/`to` | drop them |
| `getPointAtLength()` / `getTangentAtLength()` return `null` past path end | handle null |
| Lambda: `overwrite` default true; x264 `veryfast` default; `diskSizeInMb` 10240; client APIs from `@remotion/lambda/client` | set explicitly if you rely on old behaviour |
| Cloud Run `maxInstances` default 5 | set explicitly |
| Default colour space `bt709` (no `default`) | set `bt601` to keep old |
| `@remotion/google-fonts` requires `weights` and `subsets` | `loadFont('normal', {weights: ['400','700'], subsets: ['latin']})` |
| `validateFontIsLoaded` default true in layout-utils | load fonts first |
| Sequences premount for `fps` frames by default | `premountFor={0}` to opt out (and set `premountFor={fps}` now) |
| `<Player numberOfSharedAudioTags>` default 0 | set 5 if needed for autoplay audio |
| `pauseWhenBuffering` / `pauseWhenLoading` default true | set false to keep old |
| `getVideoMetadata()` removed from `@remotion/renderer` | use Mediabunny |
| `@remotion/light-leaks`, `starburst`, `media-parser`, `webcodecs` unpublished after 4.x | use `lightLeak()` / `starburst()` from `@remotion/effects`, Mediabunny |
| New licence text: contractors count toward team size; tied to new terms | see `license-and-policy.md` |

## Older migrations (only needed for old tutorials)

- **2.0**: sequences are 1 frame shorter (consistent durations); `userProps` -> `inputProps`; pass `assetsInfo` to `stitchFramesToVideo` for sound; `--overwrite` default; Webpack uses esbuild; `react-dom` is a peer dependency.
- **3.0**: Node 14+; React 18 types; `renderFrames/renderStill`: `compositionId` removed, `config` -> `composition`, `webpackBundle` -> `serveUrl`, errors reject; `useVideoConfig()` adds `id`, `defaultProps`; `browserInstance` -> `puppeteerInstance`; config-file `overrideWebpackConfig` import removed (use `Config.overrideWebpackConfig`).
- **4.0** (the current baseline): Node 16+, Windows x64/macOS/Linux glibc 2.35; config moved to `@remotion/cli/config` and flattened; image format split (`setVideoImageFormat`, `setStillImageFormat`); `logLevel` replaces `verbose`; Lambda arm64 only; no rich timeline; ProRes audio `pcm_s16le`; `quality` -> `jpegQuality`; FFmpeg bundled (`remotion ffmpeg|ffprobe` commands, no `ffmpegExecutable`); `onSlowestFrames` moved to the return value; `<OffthreadVideo imageFormat>` -> `transparent`; `<Img>` failures cancel the render unless `onError`; `crf` not allowed for GIF; `staticFile()` encodes with `encodeURIComponent`; `WebpackOverrideFn` in `@remotion/bundler`; props must be an object and a `type` not an `interface`; `defaultProps` required when the component has props; Zod `schema` and `calculateMetadata` introduced; `getCanExtractFramesFast` removed.
- The 4.0 alpha page is archived.

## Error guide

| Symptom | Cause | Fix |
|---|---|---|
| "A delayRender() was called but not cleared after 28000ms" | handle never cleared, network blocked, memory pressure, big `OffthreadVideo` download | `continueRender`, label handles, raise timeout, lower `--concurrency`, use `<Video>` |
| "Target closed" | Chrome tab crashed: missing Linux deps, out of memory/CPU, corrupt Chrome | lower concurrency, install deps, reinstall browser, `--log=verbose` shows the executable |
| Flicker / choppy render | animation not driven by `useCurrentFrame`, randomness, assets not awaited | see timing file; `--concurrency=1` is a workaround only |
| CORS error | missing `Access-Control-Allow-Origin` (and for preflight `Allow-Methods`, `Allow-Headers`, `Allow-Private-Network`) | read Chrome's console text; return headers on `OPTIONS` too; `--disable-web-security` is a last resort |
| "Could not play video/audio with src" | unsupported codec, 404 without `staticFile`, bad headers, too many video tags | see `media.md` |
| "media cannot be seeked" | no `Content-Range`/`Content-Length`, no faststart, blocking `X-Frame-Options`/CSP/CORP headers, or source swapped before load | serve with Range, download locally, `prefetch`, use `<Video>` |
| `staticFile() does not support relative paths / remote URLs` | `../`, `./`, absolute path, `public/` prefix, or URL | pass `'file.png'`; pass URLs directly |
| `<Composition> mounted inside another composition` | nested composition or in Player component | render the component directly, `<Sequence>` |
| ENAMETOOLONG (Windows, FFmpeg command > 8192 chars) | too many audio layers | `muted` silent videos, render on macOS/Linux/WSL, render partial ranges and concat |
| Version mismatch | mixed `remotion` package versions or `^` | exact pins, `remotion versions`, libs list `remotion` as peer |
| Webpack "Cannot find module './image0.png'" | dynamic path outside `require()` | `staticFile()` |
| Loading `<Img>` src `.../proxy` timeout | image failed | add `onError`, retries, correct CORS |
| Slow-frame warning (pre-4.0) | corrupt timestamps / VP8 PNG | upgrade (not needed in 4.x) |
| Missing `useCurrentScale` etc. outside Remotion | context missing | `{dontThrowIfOutsideOfRemotion: true}` |

Debug aids: `--log=verbose` (slowest frames, browser path, HW accel), `bunx remotionb benchmark`, `bunx remotionb gpu`, `bunx remotionb versions`.

## Combining with the JAL kit

Add `bunx remotion versions` and a package-pin check to the JAL release/check gate for projects that include Remotion. Treat any "works only with `--concurrency=1`" result as a bug to fix, not a setting to ship.

From:
- https://www.remotion.dev/docs/2-0-migration
- https://www.remotion.dev/docs/3-0-migration
- https://www.remotion.dev/docs/4-0-alpha
- https://www.remotion.dev/docs/4-0-migration
- https://www.remotion.dev/docs/5-0-migration
- https://www.remotion.dev/docs/upgrading
- https://www.remotion.dev/docs/timeout
- https://www.remotion.dev/docs/target-closed
- https://www.remotion.dev/docs/cors-issues
- https://www.remotion.dev/docs/enametoolong
- https://www.remotion.dev/docs/wrong-composition-mount
- https://www.remotion.dev/docs/version-mismatch
- https://www.remotion.dev/docs/media-playback-error
- https://www.remotion.dev/docs/non-seekable-media
- https://www.remotion.dev/docs/flickering
- https://www.remotion.dev/docs/slow-method-to-extract-frame
