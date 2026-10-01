# The `remotion` package API (index) and package map

Written against `remotion` 4.0.532 (public export list read from the package typings and the docs, 2026-10-01).

## What it is

An index of everything exported by `import ... from 'remotion'`, with the file that documents each export, plus a map of the `@remotion/*` satellite packages and which JAL reference owns them. The docs "API overview" page (`/docs/api`) and the package page (`/docs/remotion`) are table-of-contents pages rendered by the site; this file replaces them.

## When a JAL agent uses it

Before writing any comp: confirm that the symbol exists, find its reference file, and check whether it is core (`remotion`) or a separate package that needs `bunx remotion add`.

## `remotion` exports

Install: `bun add remotion` (pin the exact version with the rest). Pure helpers `interpolate()`, `interpolateColors()`, `random()`, `spring()`, `Easing` also work outside Remotion (Node, workers).

| Export | Kind | Documented in |
|---|---|---|
| `registerRoot` | fn | compositions.md |
| `Composition`, `Still`, `Folder`, `CalculateMetadataFunction`, `CompositionProps`, `StillProps` | components, types | compositions.md, props-and-schemas.md |
| `Sequence`, `SequenceProps`, `Series`, `Loop` (+`Loop.useLoop`), `Freeze`, `AbsoluteFill`, `AbsoluteFillLayout` | components | compositions.md |
| `useCurrentFrame`, `useVideoConfig`, `useCurrentScale`, `usePixelDensity` | hooks | timing-and-animation.md |
| `interpolate`, `interpolateColors`, `spring`, `measureSpring`, `Easing`, `random` and types (`ExtrapolateType`, `InterpolateOptions`, `InterpolateOutputType`, `EasingFunction`, `RandomSeed`, `SpringConfig`, `InterpolateColorsOptions`) | functions, types | timing-and-animation.md |
| `Interactive` (`.Div`, `.Svg`, ..., `.withSchema`, schema fragments), `InteractivitySchema`, `InteractiveProps`, `InteractiveBaseProps`, `InteractiveTransformProps`, `InteractiveCropProps`, `InteractivePremountProps` | namespace, types | props-and-schemas.md |
| `getInputProps` | fn | props-and-schemas.md |
| `delayRender`, `continueRender`, `cancelRender`, `useDelayRender`, `useBufferState`, `DelayRenderScope` | fns, hooks | data-and-delayrender.md |
| `getRemotionEnvironment`, `useRemotionEnvironment`, `VERSION` (from `remotion/version`) | fn, hook, const | data-and-delayrender.md |
| `Artifact` (+`Artifact.Thumbnail`), `DownloadBehavior` | component, type | data-and-delayrender.md |
| `staticFile`, `getStaticFiles`, `StaticFile`, `watchStaticFile`, `prefetch`, `PrefetchOnProgress` | fns, types | assets-and-fonts.md |
| `Img`, `ImgProps`, `CanvasImage`, `CanvasImageProps`, `AnimatedImage`, `IFrame` | components | assets-and-fonts.md |
| `Video` (re-export), `Html5Video`, `OffthreadVideo`, `Audio`, `Html5Audio`, `RemotionAudioProps`, `RemotionVideoProps`, `RemotionMainVideoProps`, `RemotionOffthreadVideoProps`, `OffthreadVideoProps`, `OnVideoFrame`, `VolumeProp`, `LoopVolumeCurveBehavior`, `MediaPlaybackError` | components, types | media.md |
| `Solid`, `SolidProps`, `HtmlInCanvas` (+`isHtmlInCanvasSupported`, `getHtmlInCanvasUnsupportedMessage`, `HTML_IN_CANVAS_UNSUPPORTED_MESSAGE`, types `HtmlInCanvasOnPaint`, `HtmlInCanvasOnInit`, `HtmlInCanvasOnInitCleanup`, `HtmlInCanvasPixelDensity`, `HtmlInCanvasProps`, `HtmlInCanvasOnPaintParams`), `createEffect`, `Backend`, `EffectApplyParams`, `EffectDefinition`, `EffectDescriptor`, `EffectFactory`, `EffectsProp` | components, fn, types | visuals-and-3d.md |
| `Codec`, `PixelFormat`, `VideoImageFormat`, `LogLevel`, `VideoConfig` (via video-config), `AnyZodObject` | types | rendering-and-output.md |
| `Experimental` (`Clipper` removed 4.0.228, `Null` removed 4.0.228, `useIsPlayer`), `Config` (empty stub), `_InternalTypes`, `internals` | internal | do not use |

Notes:
- `getStaticFiles` and `watchStaticFile` are moving to `@remotion/studio`.
- `Experimental.Clipper` and `Experimental.Null` are documented as removed in v4.0.228 (they slowed renders).
- Browser globals Remotion sets (for debugging only): `window.remotion_imported`, `window.remotion_version`, `window.remotion_isPlayer`, `window.remotion_isStudio`, `window.remotion_inputProps`, `window.remotion_renderReady`.

## The @remotion/* package map

| Package | Purpose | License note | Where in JAL refs |
|---|---|---|---|
| `@remotion/cli` | `remotion studio / render / still / compositions / versions / upgrade / add / ffprobe` and `Config` | Remotion License | rendering-and-output.md |
| `@remotion/player` | embed a composition in a React page; `Thumbnail` for stills | Remotion License | compositions.md, integrations.md |
| `@remotion/web-renderer` | client-side `renderMediaOnWeb` / `renderStillOnWeb` (WebCodecs, Mediabunny, no server) | Remotion License, telemetry on every render | rendering reference (other worker) |
| `@remotion/renderer`, `@remotion/bundler` | Node/Bun server rendering (headless Chrome, FFmpeg): `bundle`, `selectComposition`, `renderMedia`, `renderStill`, `renderFrames`, `getCompositions` | Remotion License | rendering-and-output.md (needs Brian) |
| `@remotion/lambda`, `@remotion/cloudrun`, `@remotion/vercel` | cloud render | Remotion License | rendering reference (needs Brian) |
| `@remotion/media` | `<Video>`, `<Audio>` (Mediabunny + WebCodecs) | n/a | media.md |
| `@remotion/media-utils` | `getAudioData`, `useAudioData`, `useWindowedAudioData`, `visualizeAudio`, `getWaveformPortion`, `getImageDimensions`, `audioBufferToDataUrl` | MIT | media.md |
| `@remotion/transitions` | `TransitionSeries`, presentations (e.g. `slide()`, imported from `@remotion/transitions/slide`), timings (`linearTiming`, `springTiming`) | Remotion License | compositions.md |
| `@remotion/effects` | WebGL2/2D effects for the `effects` prop (blur, glow, colorKey, colorCorrection, lut, halftone, fisheye, light leak, starburst...) | Remotion License | visuals-and-3d.md |
| `@remotion/fonts`, `@remotion/google-fonts` | font loading | Remotion License / n/a | assets-and-fonts.md |
| `@remotion/zod-types` | `zColor`, `zTextarea`, `zMatrix` | Remotion License | props-and-schemas.md |
| `@remotion/animation-utils` | `makeTransform`, `interpolateStyles` | MIT | timing-and-animation.md |
| `@remotion/gsap` | `useGsapTimeline` (4.0.517+) | MIT | timing-and-animation.md |
| `@remotion/shapes`, `@remotion/paths`, `@remotion/noise`, `@remotion/layout-utils`, `@remotion/preload`, `@remotion/rough-notation` | shapes, SVG path math, noise, text measuring/fitting, preloading, hand-drawn annotations | MIT (rough-notation check) | visuals-and-3d.md |
| `@remotion/three` | `ThreeCanvas`, `ThreeWebGPUCanvas` (`/webgpu`, 4.0.503+, needs three 0.167+, R3F 9, React 19) | Remotion License | visuals-and-3d.md |
| `@remotion/lottie`, `@remotion/rive`, `@remotion/skia`, `@remotion/gif` | Lottie, Rive, Skia (React 18 only), GIF | Remotion License | visuals-and-3d.md |
| `@remotion/captions`, `@remotion/install-whisper-cpp` | `Caption` type, transcription | n/a | official-skills.md |
| `@remotion/mac-cursors` | `<MacOSCursor>` (4.0.513+) | Remotion License | visuals-and-3d.md |
| `@remotion/enable-scss`, `@remotion/tailwind-v4`, `@remotion/babel-loader` | bundler overrides | n/a | integrations.md |
| `@remotion/eslint-plugin`, `@remotion/eslint-config`, `@remotion/eslint-config-flat` | lint rules | n/a | fundamentals.md |
| `@remotion/studio` | Studio APIs (`getStaticFiles`, `watchStaticFile` moving here) | n/a | assets-and-fonts.md |
| `@remotion/licensing` | telemetry and license key | n/a | license-and-policy.md |
| `@remotion/light-leaks`, `@remotion/starburst`, `@remotion/media-parser`, `@remotion/webcodecs` | stop receiving releases after 4.x; use `lightLeak()` / `starburst()` from `@remotion/effects` and Mediabunny | n/a | migrations-and-troubleshooting.md |
| Mediabunny (`mediabunny`, `@mediabunny/*`) | browser multimedia: metadata, duration, dimensions, decode, trim | MPL-2.0 (Remotion acknowledgements) | official-skills.md |

## CLI quick reference (Bun)

```bash
bunx remotionb studio [entry] [--port=3000] [--no-open] [--force-new] [--log=verbose]
bunx remotionb render [entry] [CompId] [out.mp4] [--props='{}' | --props=file.json] [--codec=h264] [--crf] [--scale=2] [--concurrency] [--frames=0-90 | 0,30,90] [--image-format=png] [--sequence] [--gl=angle] [--timeout=ms] [--sample-rate=44100] [--metadata] [--hardware-acceleration=if-possible]
bunx remotionb still [entry] [CompId] [out.png] [--frame=0] [--image-format=png|jpeg|webp|pdf]
bunx remotionb compositions [entry] [-q]
bunx remotionb versions | upgrade | add <pkg> | benchmark | gpu | ffprobe file | ffmpeg ...
```

## Combining with the JAL kit

Only import from `remotion` and the packages listed as allowed in the reference for the task; any package that pulls Chrome (`@remotion/renderer`, `@remotion/bundler`, `@remotion/lambda`, `@remotion/cloudrun`, `@remotion/vercel`) is optional and needs Brian's confirmation as tech lead. A complex extra stack (Lambda, Cloud Run, Vercel Sandbox, Skia, Electron, Spline pipelines) needs the same yes.

From:
- https://www.remotion.dev/docs/api
- https://www.remotion.dev/docs/remotion
- https://www.remotion.dev/docs/standalone
- https://www.remotion.dev/docs/null
- https://www.remotion.dev/docs/clipper
- https://www.remotion.dev/docs/version
- https://www.remotion.dev/docs/detect-remotion
