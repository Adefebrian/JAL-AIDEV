# Render paths for JAL: which way to turn a composition into a file

Written against `remotion` 4.0.532 (docs read 2026-10-01). Read this first. Every other file in this folder is the detail behind one row of the table below.

From:
- https://www.remotion.dev/docs/bundler
- https://www.remotion.dev/docs/cloudrun
- https://www.remotion.dev/docs/cloudrun/status
- https://www.remotion.dev/docs/config
- https://www.remotion.dev/docs/docker
- https://www.remotion.dev/docs/lambda
- https://www.remotion.dev/docs/license
- https://www.remotion.dev/docs/license/faq
- https://www.remotion.dev/docs/license/pricing
- https://www.remotion.dev/docs/licensing/
- https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell
- https://www.remotion.dev/docs/miscellaneous/linux-dependencies
- https://www.remotion.dev/docs/miscellaneous/linux-single-process
- https://www.remotion.dev/docs/miscellaneous/nextjs
- https://www.remotion.dev/docs/miscellaneous/render-in-browser
- https://www.remotion.dev/docs/miscellaneous/render-on-edge
- https://www.remotion.dev/docs/ssr
- https://www.remotion.dev/docs/ssr-node
- https://www.remotion.dev/docs/vercel
- https://www.remotion.dev/docs/compare-ssr
- https://www.remotion.dev/docs/client-side-rendering
- https://www.remotion.dev/docs/client-side-rendering/limitations
- https://www.remotion.dev/docs/telemetry
- https://www.remotion.dev/docs/bun

## What it is

A Remotion composition can become a video, audio file, still or GIF in six ways. They differ in what runs the browser, what encodes the frames, who pays for compute, and how much setup they need. JAL rule from Brian (2026-10-01): headless rendering must not default to Chrome. Prefer the lightest path that fits the content. Anything that starts a server-side Chrome, or an outside cloud, needs Brian's confirmation as tech lead before it is built or paid for.

## The recommended default for JAL

1. **Preview**: the `<Player>` on a page, or Remotion Studio inside the separate video workspace (never in a website package). No render happens, nothing to confirm.
2. **Render, default**: in-browser rendering with `@remotion/web-renderer` (`renderMediaOnWeb()`, `renderStillOnWeb()`, or the "Render in browser" button in Studio). No Chrome headless, no server, no FFmpeg. Frames are drawn to a canvas and encoded with WebCodecs through Mediabunny. Use it whenever the composition fits its CSS and element limits (see the fit check below).
3. **Render, fallback when the content does not fit in-browser**: the Remotion CLI or `renderMedia()` on the developer's own machine (`bunx remotionb render`, or the Studio Render button). This starts Chrome Headless Shell locally, so it needs Brian's confirmation per project (Brian, 2026-10-01). Ask first, then say in the task report that headless Chrome was used. Never wire it into CI or a server without a separate yes.
4. **Server, batch or API-triggered renders**: a Coolify render service. This is Chrome Headless Shell on JAL's own server. Needs Brian's confirmation. Design in the "Coolify render service" section below.
5. **Scale-out**: Remotion Lambda. Needs Brian's confirmation (AWS account, cost, license counting).
6. **Not recommended**: Cloud Run (alpha, not actively developed) and Vercel Sandbox (JAL deploys on Coolify). Both need Brian's confirmation and the agent should argue against them unless Brian asks.

Why this default: it is the only path with no headless Chrome, no FFmpeg, no server to feed and no cloud bill. It also keeps the cost of a render on the person who asks for it. Its price is a smaller CSS surface, a modern browser requirement, and a telemetry ping to Remotion (see license.md).

## Decision table

| Path | What runs the browser | Encoder | Weight on JAL | Money | Hard limits | Needs Brian's confirmation |
| --- | --- | --- | --- | --- | --- | --- |
| In-browser (`@remotion/web-renderer`) | The viewer's own browser tab | WebCodecs via Mediabunny | None on servers; uses the viewer's CPU while rendering | None | Subset of CSS and elements (fit check below), single-threaded, needs WebCodecs (Chrome 94+, Firefox 130+, Safari 26+), always sends a telemetry event | No. Default path |
| Local CLI / `renderMedia()` on a dev machine | Chrome Headless Shell downloaded into `node_modules/.remotion` | Bundled FFmpeg (GPLv2+ build) | One laptop, no infra | None | Single machine; no distributed rendering | Yes, per project; report that headless Chrome was used |
| Coolify render service (Docker + Bun) | Chrome Headless Shell inside a container | Bundled FFmpeg | One container per concurrent render, 2 vCPU and 4 GB RAM as a starting point, plus temp disk | JAL's own server cost | One machine per render, no distributed rendering, JAL must build queue, progress, retries, logging | Yes |
| Remotion Lambda | Chrome inside AWS Lambda (Amazon Linux) | Bundled FFmpeg, chunks joined in the main function | None on JAL servers; AWS account, S3 bucket, IAM user and role | AWS compute, S3, CloudWatch; about $0.001 for a hello-world still-length render and about $0.02 for a one-minute video (docs example, us-east-1, 2048 MB) | 15 min per function, 10 GB disk and RAM max, 1000 default concurrency per region, no AV1, max 200 functions per render | Yes |
| Cloud Run (`@remotion/cloudrun`) | Chrome in a Google Cloud container | Bundled FFmpeg | None on JAL servers; GCP project and service account | GCP compute and Cloud Storage | Alpha, not actively developed, no distributed rendering, 60 min, 32 GB, 8 vCPU | Yes, and advise against |
| Vercel Sandbox (`@remotion/vercel`) | Chrome in an ephemeral Vercel VM | Bundled FFmpeg | None on JAL servers; Vercel account and Blob store | Sandbox time plus Blob storage | Experimental package, slow cold start, one machine per render | Yes, and advise against (JAL is not on Vercel) |

Other options the docs list and JAL does not plan to use: GitHub Actions runner (a CI render, same as a server Chrome, needs Brian's yes), Azure Container Apps and Cloudflare Containers (same as the Coolify design, on someone else's cloud), a GPU EC2 box (Chrome for Testing, only for GPU-heavy content, see server-runtime.md).

## Fit check: can this composition use in-browser rendering

Use in-browser rendering when all of these are true. Otherwise first try to change the composition so it fits (drop the unsupported property, order layers back to front); if it still does not fit, ask Brian for the local CLI fallback (`video.render_path`).

- Elements are plain HTML and SVG: text, divs, images (`<Img>`), canvas, borders, border radius, transforms (except perspective), opacity, overflow, object-fit, basic box-shadow, linear gradients, filters (not in Safari), clip-path shapes. Supported Remotion components: `<Video>` and `<Audio>` from `@remotion/media`, `<Img>`, `<Gif>`, `<Rive>`, `<Lottie>`, `<ThreeCanvas>`, `<SkiaCanvas>`.
- Not supported: `<OffthreadVideo>`, `<Html5Video>`, `<Html5Audio>`, `<AnimatedEmoji>` (use `<Video>`, `<Audio>`, `<Lottie>`), `perspective`, `perspective-origin`, `transform-style`, `object-position`, `backdrop-filter`, `mix-blend-mode`, `z-index` (order elements back to front), inset shadows, shadow spread, `writing-mode`, SVG-referenced clip paths, masks and filters, `background-image` other than a linear gradient. Anything not listed in the limitations page counts as unsupported. The optional HTML-in-canvas capture mode lifts the CSS limits.
- No server-only features are needed: no `chromiumOptions` or `--gl` flags, no FFmpeg-only codecs. Rendering is single-threaded (no concurrency option) but has less overhead and can use the viewer's GPU.
- Output formats are among the browser encoders: MP4, WebM, MKV, MOV video; WAV, MP3, AAC, OGG, FLAC audio; H.264, H.265, VP8, VP9, AV1 depending on the browser. Check with `canRenderMediaOnWeb()` before offering a button.
- A person is present at a screen. In-browser rendering cannot run from a scheduler or an API call without a browser, and putting a headless browser behind it brings Chrome back.
- The page passes `licenseKey: 'free-license'` (JAL is 3 people, every project internal) and follows the privacy rule for the telemetry event (origin and the user's IP): free in internal tools and dev pages; on a public page only when the feature is needed, with an inline notice before export and a privacy-policy line.

Three.js and Skia scenes render in the browser through `<ThreeCanvas>` and `<SkiaCanvas>`. The server paths need `--gl=angle` for WebGL (see troubleshooting.md), and a GPU only helps with Chrome for Testing. Test a heavy scene on a phone before promising an in-browser export.

## Pick by case

| Case | Path |
| --- | --- |
| Designer or developer wants a clip while building a scene | Studio in the video workspace, then "Render in browser" (the Studio Render button is the local CLI path) |
| Product feature where a signed-in user exports their own video | In-browser |
| Marketing clip, one-off, uses CSS the web renderer lacks (3D transforms, complex backgrounds) | Rework to fit in-browser first; else local CLI on the developer machine (confirm first) |
| Nightly or webhook-triggered video, nobody at a screen | Coolify render service (confirm first) |
| Hundreds of renders per hour, or minutes-long videos that must finish fast | Lambda (confirm first), after measuring a Coolify service first |
| Per-request thumbnails or stills from data | In-browser if the user is present; otherwise `renderStill()` in the Coolify service |
| Audio only (silence cut, extract audio) | `extractAudio()` and `getSilentParts()` locally or in the service; no Chrome needed for these two |

## Remotion's own bundler

Server paths (CLI, `renderMedia()`, Lambda, Cloud Run, Vercel, Coolify service) need a Remotion bundle: `bundle()` or `bunx remotionb bundle` turn the project into a static folder served as the Serve URL. The default bundler is Webpack. Rspack is available with `--rspack` or `Config.setRspack()` (since 4.0.502, replaces the experimental flag). The bundler is allowed where it fits and is separate from the JAL `Bun.build()` rule for the app: the Remotion bundle only builds the video project. In-browser rendering has no bundling step, because the components are imported by the app and built by `Bun.build()`. For a browser editor that compiles a virtual project, `@remotion/browser-bundler` uses the Rspack Browser API (see renderer-api.md#browser-bundler).

## Coolify render service (design, needs confirmation)

How it would run on deploy.jalgroup.id with Docker and Bun:

- **Image**: Debian base (`bookworm-slim`), not Alpine (Alpine is not supported for Chrome Headless Shell and slows the Rust parts by over 10 seconds a render). Install the shared libraries listed in server-runtime.md, then run `bunx remotionb browser ensure` at build time so Chrome Headless Shell is baked in. Do not install a distro `chromium`, and do not pass `browserExecutable` to a full Chrome.
- **Shape**: a Hono API container accepts a job (composition id, input props, output kind), puts it on the existing Redis queue, and returns a job id. A worker container pulls one job at a time, runs the render in a child process (`remotionb render` or a small `render.ts` that calls `selectComposition()` then `renderMedia()`), writes the file to the S3 bucket JAL already uses, and updates job state in Redis. The child process matters on Bun: a Bun SSR script may not exit by itself after the render (known issue), so exit it explicitly and let the worker kill it on a timeout.
- **Resources (starting values, measure with `remotionb benchmark`)**: the docs say Remotion works best with 2 GB RAM or more, and use 2 vCPU with 4 GB for a Studio on Fly.io and 2 GB on Render.com as references. Start the worker at 2 vCPU, 4 GB RAM, and a temp disk of 5 to 10 GB (frames and uncompressed audio land in the system temp dir; point `TMPDIR` at a volume). Set Coolify memory limits above that, because the OS kills the process with SIGKILL when memory runs out. Default concurrency is half the CPU threads, so on 2 vCPU expect low parallelism. One render per worker container; scale by adding workers, not by raising concurrency.
- **Image weight**: Chrome plus FFmpeg add about 150 MB to the image (docs figure for the edge-size comparison). Build time grows by the browser download. Cache the layer.
- **Memory knobs**: `offthreadVideoCacheSizeInBytes` and `mediaCacheSizeInBytes` cap the frame cache (default is about 50 percent of free memory at render start). `--disallow-parallel-encoding` trades speed for lower memory. Lower `--concurrency` first when you see "Timed out evaluating page function".
- **Linux**: multi-process Chrome is on by default since 4.0.137 and the docs confirm the Debian recipe works with it. Keep `enableMultiProcessOnLinux` at its default.
- **Safety**: never let a caller submit their own Remotion code or arbitrary bundle (the license forbids offering a rendering service for user-uploaded Remotion code, and it is also a remote code execution hole). Only render JAL-owned compositions with validated props. Rate limit the API. Set a hard timeout per job.
- **Health**: run `ensureBrowser()` at startup and expose it in the health check so Coolify only routes to a worker that has Chrome. Roll back the image the way jal-release describes if a Remotion upgrade breaks it.
- **License**: a self-run render service is an automation in Remotion's terms. Free for 3 people or fewer; see license.md.

## What each row costs to set up

| Path | First setup | Ongoing care |
| --- | --- | --- |
| In-browser | Add `@remotion/web-renderer`, call `renderMediaOnWeb()` | Browser support matrix, telemetry privacy note |
| Local CLI | Nothing beyond `@remotion/cli` and `remotionb` | None |
| Coolify service | Dockerfile, Hono API, Redis queue, S3, health check, timeouts | Chrome and Remotion upgrades, disk and RAM watching |
| Lambda | IAM policy, role, user, bucket, `functions deploy`, `sites create` | A new function per Remotion version, quota requests, S3 lifecycle, CloudWatch cost |
| Cloud Run | GCP project, service account, service and site deploy | Alpha software, frozen feature set |
| Vercel Sandbox | Vercel project, Blob store, rate limits | Experimental API changes |

## Confirmation wording for Brian

When a task needs a row that is not the default, stop and ask in plain words: which path, why the default does not fit (name the missing CSS or the missing person at a screen), what it will cost (use the table), and what it adds to the license count. Do not start the build until Brian says yes. JEV `video.render_path` (jal-jev catalog) may judge the pick first; JEV advises, Brian decides on these paths.

## See also

- renderer-api.md, cli.md, config.md for the options used by every server path.
- license.md before any render path is used in a product.
- server-runtime.md for the Dockerfile, Linux libraries, Chrome modes and GPU notes.
- lambda.md, cloudrun.md, vercel.md for the three cloud paths.
