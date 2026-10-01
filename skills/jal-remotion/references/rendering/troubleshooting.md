# Remotion troubleshooting: symptom, cause, fix

Written against `remotion` 4.0.532 (docs read 2026-10-01). Lambda-specific errors are in lambda-ops.md#troubleshooting-lambda.

From:
- https://www.remotion.dev/docs/troubleshooting/background-image
- https://www.remotion.dev/docs/troubleshooting/broken-fast-refresh
- https://www.remotion.dev/docs/troubleshooting/browser-launch
- https://www.remotion.dev/docs/troubleshooting/bundling-bundle
- https://www.remotion.dev/docs/troubleshooting/cannot-save-default-props
- https://www.remotion.dev/docs/troubleshooting/could-not-be-parsed-as-a-value-list
- https://www.remotion.dev/docs/troubleshooting/could-not-find-executable-to-run
- https://www.remotion.dev/docs/troubleshooting/css-animations
- https://www.remotion.dev/docs/troubleshooting/debug-failed-render
- https://www.remotion.dev/docs/troubleshooting/defaultprops-too-big
- https://www.remotion.dev/docs/troubleshooting/delay-render-proxy
- https://www.remotion.dev/docs/troubleshooting/font-loading-errors
- https://www.remotion.dev/docs/troubleshooting/loading-root-component
- https://www.remotion.dev/docs/troubleshooting/nextjs-image
- https://www.remotion.dev/docs/troubleshooting/no-frame-found-at-position
- https://www.remotion.dev/docs/troubleshooting/player-flicker
- https://www.remotion.dev/docs/troubleshooting/rosetta
- https://www.remotion.dev/docs/troubleshooting/sigkill
- https://www.remotion.dev/docs/troubleshooting/stuck-render
- https://www.remotion.dev/docs/troubleshooting/subpixel-rendering
- https://www.remotion.dev/docs/troubleshooting/timed-out-page-function
- https://www.remotion.dev/docs/troubleshooting/video-has-no-sound
- https://www.remotion.dev/docs/troubleshooting/webgl2-context

## What it is

One lookup table for the errors and visual glitches Remotion's troubleshooting pages cover, grouped by where they show up. Match the message first, then apply the fix.

## When a JAL agent uses it

When a render fails, hangs, flickers, has no sound, or the Studio misbehaves. First step in every case: add `--log=verbose` (CLI) or `logLevel: 'verbose'` (API) and, to read each log once, `--concurrency=1`.

## Generic debugging recipe

1. Verbose logging; all `console.log` from the project appear (repeated once per tab unless concurrency is 1).
2. Add your own logs to see execution order.
3. Remove components one by one until the render works to find the culprit.
4. Search GitHub issues and the docs; ask on GitHub or Discord with the output of `remotionb versions`.

## Render fails or stalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Failed to launch the browser process" | Missing shared libraries; wrong OS or CPU architecture of the binary; incompatible Linux distro | Install the libraries (server-runtime.md#linux-dependencies); use the matching binary; run with `--log=verbose` |
| "Timed out evaluating page function ... remotion_setFrame" | Chrome is overloaded (CPU or memory); not a `delayRender()` leak. The timeout is 5 s before 4.0.73 and the `--timeout` value (default 30 s) after | Lower `--concurrency`; give more CPU and RAM; raise `--timeout`; remove infinite loops; speed up code |
| "A delayRender() ... was called but not cleared after 28000ms" | A `delayRender()` never reached `continueRender()`, or loading is too slow | Always pair with `continueRender()` and handle failures with `cancelRender()`; raise `--timeout` only if the work is legitimately slow |
| "Loading root component" timeout | Entry point does not call `registerRoot()` (you passed `Root.tsx` or a component file) | Pass the file that calls `registerRoot()`, usually `src/index.ts` |
| Process "quit with signal SIGKILL" (Compositor or FFmpeg) | The OS killed it, almost always out of memory | Lower `offthreadVideoCacheSizeInBytes` (default is up to 50 percent of free memory, halved when memory is short), lower `--concurrency`, add RAM, upgrade (last memory work in 4.0.171) |
| Render stuck with no error | `delayRender()` timeout larger than the function timeout (Lambda dies first); a newer Chrome without headless mode; progress poll ignoring `errors` | Shorten the `delayRender()` timeout; use Chrome Headless Shell (`browser ensure`, never `apt install chrome`, no `--chrome-executable`); on Lambda read `errors` and stop polling when `fatalErrorEncountered` is true |
| `A delayRender() "Loading <Img> with src=http://localhost:3000/proxy?src=..."` | `<OffthreadVideo>` could not extract a frame in time (must download the whole file) | Use `<Video>` from `@remotion/media`; raise the OffthreadVideo `delayRenderTimeoutInMilliseconds`; split a long video into a `<Series>` of parts; host on a faster, closer CDN |
| "No frame found at position ..." (Compositor error) | The `<OffthreadVideo>` frame cache is too small and evicts frames at once; or the video has gaps (screen recordings with idle stretches) | Increase `offthreadVideoCacheSizeInBytes` (below real free memory) or machine memory; report gap videos to Remotion; prefer `<Video>` from `@remotion/media` |
| "Failed to acquire WebGL2 context" | WebGL needs an OpenGL backend | Pass `--gl=angle`, `chromiumOptions: {gl: 'angle'}`, or set "OpenGL render backend" to angle in the Studio Advanced tab; set `Config.setChromiumOpenGlRenderer('angle')` |
| "defaultProps too big - could not serialize" | Default props (or the list of all compositions) is too large for Chrome to serialize | Pass slim props such as a URL and fetch or compute inside the component (e.g. fetch audio data in the component, not as default props) |
| "could not be parsed as a value list" | Old Chrome (104 on Lambda) rejects unquoted `FontFace` `src` syntax | Quote the URL and the format: `url('font.woff2') format('woff2')`, or use `@remotion/fonts` |
| Google Fonts `delayRender()` timeout (e.g. "Fetching Inter font") | `loadFont()` without arguments loads every weight and subset (from 5.0 it throws without them) | Pass only needed `weights` and `subsets`; centralize font loading |
| `bundle()` module errors (`Can't resolve 'module'`, binary parse failure) | `bundle()` is itself being bundled (e.g. inside a Next.js route) | Do not bundle at request time; call `bundle()` once in a plain Node/Bun process (long-running server) or at build time and `deploySiteFromBundle()` (Lambda); parametrize with input props |
| "Could not determine executable to run" | `npx remotion` without `@remotion/cli`, or the project uses Corepack with another package manager | Install `@remotion/cli`; run with the project's runner (`pnpm exec`, `bunx`) |
| Slow or Rosetta warning on Apple Silicon | Node running as x64 under Rosetta | Use native arm64 Node (verify with `node -p process.arch`) |
| Video has no sound | Playing in VS Code or Cursor's built-in player, which mutes by default; no audio source mounted; `volume` 0; audio outside the `<Sequence>` time range | Open in QuickTime, VLC, IINA or mpv; check the composition has `<Audio>` or a video with audio, and that it is mounted at that time |

## Visual problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| Flicker with CSS `background-image` or `mask-image` | Remotion cannot know when CSS images finish loading | Use `<Img>` inside `<AbsoluteFill>`; if mask-image is unavoidable, render a hidden adjacent `<Img>` with the same src |
| Flicker with Next.js `<Image>` | Same: load completion is unknown | Use Remotion's `<Img>` |
| Broken or flickering animation using CSS animations, `transition`, `@keyframes`, `setTimeout` | Frames render independently, possibly out of order or twice | Drive every animation from `useCurrentFrame()` and `interpolate()` |
| Jittery text motion | Chrome snaps text to whole pixels | Add `transform: 'perspective(100px)'` or `willChange: 'transform'` (preferably only while rendering) |
| Empty frames in the `<Player>` or Studio while media loads | Remotion only mounts media when it appears | Ignore (render is unaffected), or pause when buffering (`pauseWhenBuffering`, default for `<Video>` and `<Audio>` from `@remotion/media`), or premount sequences (4.0.140, recommended), or preload; prefetching as blob or Base64 is memory heavy and not recommended |

## Studio and tooling

| Symptom | Cause | Fix |
| --- | --- | --- |
| Fast Refresh stops updating | Studio server disconnected (Ctrl+C or closed terminal); or filename capitalization mismatch in an import (a Webpack watchpack bug) | Restart the Studio; match import case exactly |
| "Can't save default props" | Props editor cannot find or read `defaultProps`: not an inline object literal, `id` not a string literal, root file not found or not TypeScript | Put the composition in a findable TS root file with literal id and inline `defaultProps` (root file next to an entry such as `gold-star-entry.tsx` is found as `GoldStarRoot.tsx`) |

## Contribute back

See misc.md#contributing-to-remotion-upstream for the Remotion contribution guides, which JAL does not need unless it reports a Remotion bug.
