# Remotion miscellaneous notes, terminology and contributing

Written against `remotion` 4.0.532 (docs read 2026-10-01). Server-runtime items (Docker, Chrome, Linux, GPU, edge, fonts, FFmpeg, formats) are in server-runtime.md; the Studio items are in studio.md.

From:
- https://www.remotion.dev/docs/contributing/
- https://www.remotion.dev/docs/contributing/docs
- https://www.remotion.dev/docs/contributing/feature
- https://www.remotion.dev/docs/contributing/formatting
- https://www.remotion.dev/docs/contributing/option
- https://www.remotion.dev/docs/contributing/presentation
- https://www.remotion.dev/docs/contributing/rust
- https://www.remotion.dev/docs/contributing/sfx
- https://www.remotion.dev/docs/contributing/web-renderer
- https://www.remotion.dev/docs/miscellaneous/absolute-paths
- https://www.remotion.dev/docs/miscellaneous/automatic-duration
- https://www.remotion.dev/docs/miscellaneous/live-streaming
- https://www.remotion.dev/docs/miscellaneous/pexels
- https://www.remotion.dev/docs/miscellaneous/render-in-browser
- https://www.remotion.dev/docs/miscellaneous/snippets/combine-compositions
- https://www.remotion.dev/docs/miscellaneous/snippets/freeze-portions
- https://www.remotion.dev/docs/miscellaneous/snippets/player-in-iframe
- https://www.remotion.dev/docs/terminology
- https://www.remotion.dev/docs/terminology/bundle
- https://www.remotion.dev/docs/terminology/cloud-run-url
- https://www.remotion.dev/docs/terminology/composition
- https://www.remotion.dev/docs/terminology/concurrency
- https://www.remotion.dev/docs/terminology/entry-point
- https://www.remotion.dev/docs/terminology/input-props
- https://www.remotion.dev/docs/terminology/player
- https://www.remotion.dev/docs/terminology/public-dir
- https://www.remotion.dev/docs/terminology/remotion-root
- https://www.remotion.dev/docs/terminology/root-file
- https://www.remotion.dev/docs/terminology/sequence
- https://www.remotion.dev/docs/terminology/serve-url
- https://www.remotion.dev/docs/terminology/service-name
- https://www.remotion.dev/docs/terminology/studio

## What it is

Short answers that do not belong to one API: why absolute paths fail, why duration cannot be inferred, what Remotion is not for, small snippets, the terms used across the docs, and how to contribute to Remotion itself.

## When a JAL agent uses it

When writing assets code (paths), planning durations, answering "can Remotion do live streaming or edge rendering", looking up a term, or when JAL decides to send Remotion a fix.

## Answers

### Files with absolute paths

Browsers cannot read your filesystem, so `<Img src="C://Users/.../image.png"/>` fails. Put assets in `public/` and wrap the path in `staticFile('image.png')`. `staticFile()` keeps URLs correct when the bundle is not served from `/` (Lambda, Cloud Run, Studio deployed under a path) and keeps the same code working in the Studio and in a `<Player>` inside any framework. Absolute paths would also break after bundling, because a bundle is moved and hosted elsewhere.

### Duration cannot be derived from content

Remotion only knows the current frame, content can be infinite, and `from` and `durationInFrames` can change over time. Calculate the length yourself: constants beside the components (`MAIN_DURATION = ONE_DURATION + TWO_DURATION`), or `calculateMetadata()` from props.

### Combining compositions and other snippets

- Combine: make a `Main` component that sequences components with `<Series>` (or `<TransitionSeries>`, subtracting the transition duration), register `Main` as a composition, compute total duration from shared constants or `calculateMetadata()`, and build scene lists with `.map()` as scenes grow.
- Freeze portions of a sequence: a snippet using `<Freeze>` and `<Sequence>` with a list of `{frame, durationInFrames}` freezes; it sums the freeze lengths so playback holds at each freeze frame and resumes from where it paused.
- Player in an `<iframe>`: an `IframePlayer` wrapper isolates a page's global CSS from the Player's.

### Render in the browser

Supported with `@remotion/web-renderer` (client-side rendering), see render-paths.md. The `<Player>` previews without encoding.

### Live streaming

Not a Remotion use case: it renders deterministic, fixed-length videos. For web graphics in a stream use a web app with a transparent background as an OBS browser source; OBS stinger transitions can be made with Remotion; for programmatic live streams with React the docs point to Live Compositor from Software Mansion.

### Render on the edge

Not possible (see server-runtime.md#edge-runtimes-and-nextjs).

### Pexels timeouts

Pexels throttles repeated requests; many Lambda chunks each load the video and hit `delayRender()` timeouts. Use `<Video>` from `@remotion/media` or re-host the media on your own server or bucket.

### Changing the temp directory and cloud GPU

See server-runtime.md#temp-directory and server-runtime.md#gpu-in-the-cloud.

### Embedding the Studio

Not supported, see studio.md#other-studio-features.

## Terminology

| Term | Meaning |
| --- | --- |
| Composition | Something renderable: a React component, width and height, fps, duration, and an `id`. Duration of 1 frame is a `<Still>`. Not the same as a Sequence. In the Player you pass the component and metadata directly |
| Composition ID | The `id` string; used in `remotion render <entry> <id>` and `selectComposition({id})` |
| Sequence | Built-in component that time-shifts and limits children; not a composition |
| Remotion Bundle | The folder (HTML, CSS, JS, assets) that Webpack or Rspack produce; made automatically during a CLI render, by `bundle()`, `remotion bundle`, or `lambda sites create` |
| Serve URL | A URL hosting a bundle (S3, Netlify, Vercel, GitHub Pages...). Headless Chrome visits it to screenshot. Can be passed to the CLI instead of an entry point |
| Entry point | File that calls `registerRoot()`; default `src/index.ts`. Chosen in order: path on the command line, `Config.setEntryPoint()`, then the first existing of `src/index.ts`, `src/index.tsx`, `src/index.js`, `src/index.mjs`, `remotion/index.*`, `src/remotion/index.*`. No entry point concept in the Player |
| Root file | File exporting the Root component, which renders the compositions (often `src/Root.tsx`) |
| Remotion Root | The directory commands run in: from where you run, go up to the first folder with `package.json`; decides default `public/`, `.env`, config file |
| Public dir | Folder (default `public/`) whose files are loaded with `staticFile()`; set with `--public-dir` or `setPublicDir()` |
| Input props | Data that parametrizes a render; arrive as component props and via `getInputProps()`; Studio default props are placeholders; the Player has no default props, only `inputProps` |
| Concurrency | Local: browser tabs in parallel. Lambda: number of chunks (usually one function each); `concurrency: 1` renders on the main function (4.0.517). Too high gives diminishing returns and overload |
| Remotion Player | The React component that embeds a composition in an app |
| Remotion Studio | The editor opened by `remotion studio` |
| Cloud Run URL, Service Name | Address and name of a Cloud Run service (cloudrun.md) |

## Contributing to Remotion (upstream)

Not needed for JAL work. Notes for the day JAL sends a fix.

- Issues and pull requests are welcome; coordinate large work with Jonny Burger (maintainer). Contributions are used commercially and the project cannot be redistributed. A Code of Conduct applies.
- Setup: Bun at least 1.3.3 is Remotion's own package manager (they moved off pnpm; wipe `node_modules` with `bun run cleanall` if you come from pnpm), shallow clone (`--depth=1`), `bun i`, `bun run build`, `bun run watch`. Test with the example testbed (`packages/example`, `bun run dev`, `bunx remotion render`), `bun run test`, and the Player testbed (`packages/player-example`).
- Docs: "Improve this page" for edits; a new page is an `.mdx` in `packages/docs/docs` plus `sidebars.ts` plus `bun render-cards.ts` for social cards. Style: brief, link to terminology, no filler.
- New feature: open an issue first, keep it generic and small, avoid heavy dependencies, document it.
- New option: resolve it in this order: Node API argument, Studio render UI, CLI flag, config file, default. Name Node options in camelCase and CLI flags in hyphen-case, put the unit in numeric names (`timeoutInMilliseconds`), and document it in the API and CLI references with its first version.
- Presentations for `@remotion/transitions`: add under `packages/transitions/src/presentations`, list in `bundle.ts`, `package.json` exports, docs.
- Rust: only maintenance, no new Rust (migration to the new media tags); build with `cargo` in `packages/compositor` (`bun build.ts --debug`).
- Sound effects for `@remotion/sfx`: WAV, CC0, peak normalized to -3 dB; an `add-sfx` Agent Skill helps.
- Web renderer: code in `packages/web-renderer`; `bun run watchwebrenderer`, Vitest Browser Mode with Playwright (`bunx playwright install --with-deps`, `bun run testwebrenderer`); add failing markup to `src/test/fixtures` and the test Root to support a new CSS style.
- Formatting: Oxfmt and ESLint (`bunx oxfmt src --write`); all code must be formatted before merge.
