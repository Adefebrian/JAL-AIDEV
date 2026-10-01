# Rendering and output basics (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01). The dedicated rendering reference (client-side renderer, Lambda, Cloud Run, Vercel) is owned by another folder under `skills/jal-remotion/references/`; this file records what the core pages in this slice say, plus the JAL gate.

## What it is

How a composition becomes a file: Studio render dialog, `remotion render` / `still` CLI, Node/Bun APIs (`@remotion/renderer`), cloud renderers, and client-side rendering in the browser (`@remotion/web-renderer`, WebCodecs through Mediabunny, no FFmpeg). Plus codecs, quality, scaling, GPU and bundler settings.

## When a JAL agent uses it

Whenever the deliverable is a file (MP4, WebM, GIF, PNG/JPEG/WebP/PDF still, ProRes overlay, audio) or a bundle for a cloud render. For a website integration there is nothing to render: the Player runs the comp live.

## JAL gate (Brian, 2026-10-01)

1. Prefer the lighter path when it fits: client-side rendering (`renderMediaOnWeb()` / `renderStillOnWeb()`) with WebCodecs, or a live `<Player>` on the page. It needs no Chrome download and no server.
2. **Everything that runs headless Chrome is optional and needs Brian's confirmation as tech lead**: `bunx remotionb render`, `still`, the Studio Render button (it renders on the dev server), `renderMedia()` / `renderStill()` / `renderFrames()` / `selectComposition()` / `getCompositions()` from `@remotion/renderer`, `bundle()`, Lambda, Cloud Run, Vercel Sandbox, GitHub Actions render, Azure Container Apps, Cloudflare Containers, Electron main-process render, any Docker render server. The first such render downloads Chrome Headless Shell.
3. Any complex extra stack (cloud account, queue, S3 + render server) needs Brian's confirmation before it is proposed as the plan.
4. Never expose a render API publicly without auth and rate limits (each render is CPU or money heavy; a public `renderMedia` endpoint is a DoS surface). Never call `@remotion/lambda` from the browser (AWS credentials would leak).
5. See also: `../rendering/render-paths.md` (the path table, the fit check, the confirmation wording), JEV `video.render_path`, and `../web/web-renderer.md` for the default path.

## Ways to render (summary)

| Way | Engine | Notes |
|---|---|---|
| Studio "Render" button | headless Chrome on the dev machine | choose codec, quality, audio, advanced timeout/GL/hardware acceleration |
| `bunx remotionb render [entry] [id] [out]` | headless Chrome + bundled FFmpeg | omit id for a picker; `--props`, `--frames`, `--sequence`, `--image-format`, `--scale`, `--codec`, ... |
| `bunx remotionb still` | headless Chrome | `--frame`, `--image-format png|jpeg|webp|pdf` |
| Node/Bun API | headless Chrome | `bundle()` once, then `selectComposition()` + `renderMedia()` per video; do not call `bundle()` per render or inside serverless code |
| Remotion Lambda | AWS Lambda, distributed | fastest, recommended by Remotion for scale; costs; needs AWS |
| Vercel Sandbox (`@remotion/vercel`) | ephemeral VM per render, one machine | easiest cloud setup; slower start; 45 min Hobby / 5 h Pro; 800 s function limit, use `detached: true` + `getRenderProgress()` |
| Cloud Run | Docker | alpha; stills and media; no artifacts |
| Azure Container Apps, Cloudflare Containers | Node APIs in Docker | community or proof of concept |
| GitHub Actions | runner | only when asked |
| Client-side `renderMediaOnWeb` | browser, WebCodecs | subset of tags/CSS; encoder via Mediabunny; `scale`, `sampleRate`, `metadata`, `onArtifact` supported; always sends telemetry |
| Audio only | | codec `mp3`, `wav`, `aac` |
| Image sequence | | `--sequence` |

Comparison page verdict: Lambda is best overall for speed, maturity, scale and ease; Vercel Sandbox is simplest if already on Vercel; Cloud Run is cheaper but alpha, no distributed rendering; a long-running Node/Bun server has the cheapest compute but you build queueing, progress, errors, logging, scaling. No GPU on Lambda or Sandbox. AV1 is unavailable on Lambda and Linux ARM64 GNU. Distributed rendering requires equal-size chunks (except last), same options per chunk, `enforceAudioTrack: true`, `numberOfGifLoops: null` per chunk, same `inputProps` as `selectComposition`.

## Server API pattern (Bun, only after Brian says yes)

```ts
// render.ts  (bun render.ts)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const serveUrl = await bundle({entryPoint: './src/index.ts'});   // once per code change; options object form (the positional form is removed in 5.0)
const inputProps = {title: 'Hello'};
const composition = await selectComposition({serveUrl, id: 'HelloWorld', inputProps});   // inputProps becomes required in 5.0
await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: 'out/hello.mp4', inputProps, onProgress: ({progress}) => {}});
process.exit(0);   // Bun: the script may not exit by itself
```
`bundle()` options: `entryPoint` (absolute path), `onProgress(0..100)`, `outDir`, `publicDir`, `rootDir`, `publicPath` (default `./` since 4.0.497), `rspack`, `webpackOverride` / `rspackOverride` / `bundlerOverride` (4.0.498+), `enableCaching`, `onPublicDirCopyProgress`, `onSymlinkDetected`, `ignoreRegisterRootWarning`. The config file `remotion.config.ts` is NOT read by the Node APIs: pass overrides directly. `renderMedia` also takes `envVariables`, `chromiumOptions`, `licenseKey`, `onArtifact`, `metadata`, `sampleRate`, `hardwareAcceleration`, `timeoutInMilliseconds`, `scale`.

Legacy note: the archived v1/v2 server-side flow (`getCompositions` positional, `renderFrames` then `stitchFramesToVideo`) is superseded by `bundle` + `selectComposition` + `renderMedia`; `stitchFramesToVideo` remains for custom frame pipelines. Electron: render in the main process over IPC, build the bundle at package time (never `bundle()` in a packaged app), pass `binariesDirectory` pointing into `app.asar.unpacked`, optionally pre-download the browser with `ensureBrowser()`.

Render all compositions: `bunx remotionb compositions src/index.ts -q` in a loop, or `getCompositions({serveUrl, inputProps: {}})` then `renderMedia` for each (UNIX shells only for the loop script).

## Codecs, quality and audio

| Codec | Container | Size | Speed | Browser support | HW accel |
|---|---|---|---|---|---|
| `h264` (default) | mp4, mov, mkv | medium | very fast | very good | macOS, Linux/Windows with NVIDIA |
| `h265` | mp4, hevc | medium | fast | very poor | same |
| `vp8` | webm | small | slow | ok | no |
| `vp9` | webm | very small | very slow | ok | no |
| `av1` | mp4, webm, mkv | very small | very slow | ok | no (not on Lambda/ARM64 GNU) |
| `prores` | mov | large | fast | none (editors only) | macOS |
| `gif` | gif | | | | |

- CRF (lower = better): h264 1-51 default 18; h265 0-51 default 23; vp8 4-63 default 9; vp9 0-63 default 28; av1 0-63 default 30. `--video-bitrate` / `--audio-bitrate` are exclusive with CRF (also required with hardware acceleration; `8M` approximates software H.264 Full HD size). `--x264-preset`, `--jpeg-quality` (default 80), `--image-format=png` (slower, needed for alpha), colour space `bt709` becomes the default in 5.0.
- Audio codec via `--audio-codec`; default sample rate 48000 (see `media.md`). ProRes default audio is `pcm-16` since 4.0.
- File extension chooses the default codec. In-comp default via `calculateMetadata` (`defaultCodec`, `defaultOutName`, `defaultVideoImageFormat`, `defaultPixelFormat`, `defaultProResProfile`, `defaultSampleRate`).
- ProRes profiles: proxy 45, light 102, standard 147, hq 220 (default), 4444 330 (alpha), 4444-xq 500 (alpha) Mbps. Alpha needs PNG frames + `yuva444p10le`. No `crf`, `videoBitrate` ignored. ProRes is for editors, not the web.
- GIF: `--codec=gif`; `--every-nth-frame=2` halves fps (first frame always included); `--number-of-gif-loops` (`null`/omit = infinite, `0` = no loop, 1 = plays twice); transparent GIF needs PNG image format; 256 colours; no audio; `crf` not allowed.
- HDR is not supported (SDR sRGB only). Output scaling beats pixel density loss: render a Full HD comp at `--scale=2` for 4K text/SVG sharpness (max 16, below 1 allowed, rounded automatically since 4.0.328; videos, canvas and WebGL bitmaps do not upscale; use `usePixelDensity()` with `<Solid pixelDensity>` / `<HtmlInCanvas pixelDensity>`). Unsharp text on retina pages: render 2x.
- Metadata and extra files: see `media.md` (metadata) and `data-and-delayrender.md` (artifacts).

## Hardware acceleration and GPU

- `hardwareAcceleration: 'disabled' (default) | 'if-possible' | 'required'`; macOS VideoToolbox (ProRes 4.0.228+, H.264/H.265 4.0.236+), Linux/Windows NVENC with NVIDIA GPU + driver 525+ (4.0.484+; H.264 and H.265 only; bundled ffmpeg has the encoders on x64, not Linux ARM64). CLI `--hardware-acceleration`, `Config.setHardwareAcceleration()`. Not on Lambda or Cloud Run. Use `--log=verbose` to confirm ("Encoder: h264_videotoolbox, hardware accelerated: true").
- GPU helps WebGL (Three.js, Skia, p5, maps), video decode, `box-shadow`, `text-shadow`, gradients, `filter: blur()/drop-shadow()`, `transform`, most 2D canvas. Headless Chrome disables the GPU by default, so pass `--gl`.
- `--gl` values: `null` (4.0 default, Chrome decides; no WebGL), `angle` (5.0 default; use on desktops), `egl`, `swiftshader`, `vulkan` (4.0.41+), `angle-egl` (cloud GPU instances, 4.0.52+), `swangle` (software, default on Lambda/Cloud Run, use on GPU-less machines). Set with `chromiumOptions.gl`, `Config.setChromiumOpenGlRenderer()`, `--gl=`. `angle` has known memory leaks: split long renders; GitHub Actions has no GPU. `bunx remotionb gpu` inspects support. In 5.0 WebGL/WebGPU just work with automatic SwiftShader fallback.
- Chromium flags: `--disable-web-security` (disables CORS: security implication, see `security` below), `--ignore-certificate-errors`, `--disable-headless` (needs `--chrome-mode=chrome-for-testing` and a display; not on Lambda/Cloud Run/Vercel), `--gl`, `--user-agent` (3.3.83+), `--dark-mode` (4.0.381+).

## Performance (render speed)

Use `<Video>` from `@remotion/media`; tune `--concurrency` with `bunx remotionb benchmark` (too high or too low both hurt; too high can drop `<Html5Video>` loading); replace GPU-heavy CSS with pre-computed images for cloud renders; memoise heavy JS; cache fetched data (local storage) and avoid overfetch; PNG slower than JPEG; VP8/VP9 slow; lower resolution with `--scale`. `--log=verbose` lists the slowest frames. Lambda: tune memory (people over-provision).

## Bundlers

Webpack is the default; Rspack (4.0.426+, `Config.setRspack(true)` or `--rspack`) will become the default for new projects and Webpack will be removed in a later major. Overrides in `remotion.config.ts`: `Config.overrideBundlerConfig` (shared, runs first), `Config.overrideWebpackConfig`, `Config.overrideRspackConfig` (4.0.498+); call multiple times; do not mix Webpack and Rspack plugins. Curry or chain overrides (`enableScss`, tailwind, svgr, mdx, postcss snippets exist in the docs). Default transpilers: esbuild-loader (Webpack), SWC (Rspack); `@remotion/babel-loader` `replaceLoadersWithBabel()` restores Babel. JAL does not use Vite or Next for the video project; the bundler here is Remotion's own.

## Security

Env vars with `REMOTION_` prefix and `.env` content are exposed to the headless browser/bundle: never put secrets in them. Do not call Lambda APIs from the frontend. `disableWebSecurity` removes same-origin protection. Rate-limit and authenticate `renderMedia`/`renderMediaOnLambda` endpoints. Scan dependencies (Socket); `npm audit` equivalent: `bun audit`. Remotion has no SOC2/ISO; it runs on your infrastructure and talks to no Remotion server except the telemetry call.

## Combining with the JAL kit

- Product demo reel for a page: author in Remotion, ship as a Player (live) or as a short MP4 rendered once and committed/stored in S3; poster-first, reduced-motion shows a still.
- GSAP/Lenis page choreography is separate from rendered files; do not render page scroll effects through Remotion.

From:
- https://www.remotion.dev/docs/render
- https://www.remotion.dev/docs/render-all
- https://www.remotion.dev/docs/render-as-gif
- https://www.remotion.dev/docs/encoding
- https://www.remotion.dev/docs/quality
- https://www.remotion.dev/docs/prores
- https://www.remotion.dev/docs/hardware-acceleration
- https://www.remotion.dev/docs/gpu
- https://www.remotion.dev/docs/gl-options
- https://www.remotion.dev/docs/webgl
- https://www.remotion.dev/docs/chromium-flags
- https://www.remotion.dev/docs/scaling
- https://www.remotion.dev/docs/performance
- https://www.remotion.dev/docs/bundle
- https://www.remotion.dev/docs/bundlers
- https://www.remotion.dev/docs/compare-ssr
- https://www.remotion.dev/docs/distributed-rendering
- https://www.remotion.dev/docs/ssr-legacy
- https://www.remotion.dev/docs/vercel-sandbox
- https://www.remotion.dev/docs/azure-container-apps
- https://www.remotion.dev/docs/cloudflare-containers
- https://www.remotion.dev/docs/security
- https://www.remotion.dev/docs/dataset-render
- https://www.remotion.dev/docs/electron
