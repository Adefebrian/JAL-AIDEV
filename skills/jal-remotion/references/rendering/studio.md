# Remotion Studio: start, APIs, interactivity, deploy

Written against `remotion` 4.0.532 (docs read 2026-10-01).

From:
- https://www.remotion.dev/docs/studio/
- https://www.remotion.dev/docs/studio/api
- https://www.remotion.dev/docs/studio/browse-elements
- https://www.remotion.dev/docs/studio/delete-static-file
- https://www.remotion.dev/docs/studio/deploy-server
- https://www.remotion.dev/docs/studio/deploy-static
- https://www.remotion.dev/docs/studio/focus-default-props-path
- https://www.remotion.dev/docs/studio/get-static-files
- https://www.remotion.dev/docs/studio/go-to-composition
- https://www.remotion.dev/docs/studio/interactivity
- https://www.remotion.dev/docs/studio/interactivity-best-practices
- https://www.remotion.dev/docs/studio/make-component-interactive
- https://www.remotion.dev/docs/studio/open-in-editor
- https://www.remotion.dev/docs/studio/pause
- https://www.remotion.dev/docs/studio/play
- https://www.remotion.dev/docs/studio/quick-switcher
- https://www.remotion.dev/docs/studio/reevaluate-composition
- https://www.remotion.dev/docs/studio/remotion-dev-new
- https://www.remotion.dev/docs/studio/restart-studio
- https://www.remotion.dev/docs/studio/save-default-props
- https://www.remotion.dev/docs/studio/seek
- https://www.remotion.dev/docs/studio/shortcuts
- https://www.remotion.dev/docs/studio/shut-down-studio
- https://www.remotion.dev/docs/studio/toggle
- https://www.remotion.dev/docs/studio/update-default-props
- https://www.remotion.dev/docs/studio/visual-control
- https://www.remotion.dev/docs/studio/watch-public-folder
- https://www.remotion.dev/docs/studio/watch-static-file
- https://www.remotion.dev/docs/studio/write-static-file

## What it is

The Remotion Studio is the editor that opens with `remotion studio`: a composition list, a preview built on the `<Player>`, a timeline, a props editor, and (when a server is attached) a Render button. Since 4.0.475 it also edits your source: moving, scaling, rotating, keyframing and easing write changes back into the code.

## When a JAL agent uses it

Every Remotion task starts here for preview and review. It is also the home of the default in-browser render ("Render in browser" button). Write compositions in the shape the Studio can edit (see interactivity below) so designers can tune values without a developer.

## Start

Install `@remotion/cli` (`bun add @remotion/cli`). Templates start the Studio with `npm start` (regular templates) or `npm run remotion` (Next.js and React Router 7 templates), both shorthand for `remotion studio`. JAL scripts use `remotionb studio`. It serves on port 3000 or the next free one. Options are in cli.md; config setters in config.md.

## `@remotion/studio` APIs

Install with `bun add --exact @remotion/studio@<version>`. These run inside the Studio (or inside a composition while it is in the Studio) and throw or return empty outside it.

| API | Purpose |
| --- | --- |
| `getStaticFiles()` | List files in `public/` (empty in the Player and plain Node/Bun; available in the Studio and during SSR) |
| `watchPublicFolder(cb)` | Callback with the new file list on change; returns `{cancel}` |
| `watchStaticFile(name, cb)` | Callback when one static file changes, `null` when removed; returns `{cancel}` |
| `writeStaticFile({filePath, contents})` | Save to `public/` (text or binary from a file input) |
| `deleteStaticFile(name)` | Delete from `public/`; resolves `{existed}` |
| `saveDefaultProps({compositionId, defaultProps})` | Write default props back to the root file; `defaultProps` is a function that may spread `savedDefaultProps` |
| `updateDefaultProps(...)` | Alias of `saveDefaultProps()`; prefer the latter |
| `focusDefaultPropsPath({path, scrollBehavior})` | Scroll the props editor to a field, path as an array like `["array", 0, "subfield"]` |
| `reevaluateComposition()` | Re-run `calculateMetadata()` on the selected composition |
| `goToComposition(id)` | Select a composition |
| `play()`, `pause()`, `toggle()`, `seek(frame)` | Control timeline playback |
| `restartStudio()` | Restart the Studio server (4.0.162); a fresh CLI process on the same port, so package upgrades take effect; needs a running Studio, not a static deploy |
| `shutDownStudio()` | Gracefully stop the Studio server |
| `visualControl(id, value, schema?)` | Deprecated (4.0.292). A slider in the right sidebar to tune a constant, with a save button. Interactivity replaced it |

## Interactivity (4.0.475)

Visual edits that are written back to the source, with undo (`Cmd/Ctrl+Z`) and redo (`Cmd/Ctrl+Y`).

- **Select**: sequences, sequence props, effects, effect props, keyframes, easing segments. Shift selects a range, Cmd/Ctrl toggles, drag on the timeline for a marquee, Cmd/Ctrl+A selects all sequence rows.
- **Canvas edits**: drag outlines to move (`style.translate`), edges to scale (`style.scale`), corners to rotate (`style.rotate`), and a handle for transform origin; Shift locks an axis; keyframed values get keyframes at the current frame.
- **Effects**: drop effects onto outlined sequences, drag UV handles, copy and paste effects and individual effect values.
- **Keyframes and easing**: drag keyframes, move several at once, delete; edit easing segments, copy and paste easing. Editable easing in source: `Easing.linear`, `Easing.step1` (4.0.509), `Easing.bezier(...)` with numbers, `Easing.spring()` with static config, exact Bezier helpers (`ease`, `quad`, `cubic`, `back`, `poly(1..3)`, 4.0.487), `Easing.in(...)` and `Easing.out(...)` around supported ones, `Easing.inOut(Easing.linear)`. Others (`sin`, `circle`, `exp`, `bounce`, `elastic`, `poly(4)`) show as computed values.
- **Delete, reset, duplicate**: Delete or Backspace; Cmd/Ctrl+D duplicates selected sequences.
- Switch it off with `--disable-interactivity` or `Config.setInteractivityEnabled(false)`.

### Write code the Studio can edit (best practices)

If the markup is too complex, values turn gray and stop being editable. A skill `/remotion-interactivity` (Remotion Agent Skills) can restructure markup for this.

- Use `Interactive.Div` and friends for HTML and SVG elements that should be editable; give each a `name` (also `<Img name=...>`, `<Video name=...>`).
- One JSX node per independently editable clip, scene, layer or sequence. Do not generate editable items with `.map()` unless they are one controlled template (bars, particles).
- Keep CSS inline as a plain object: no constants, spreads or math in `style`.
- Animate with inline `interpolate()` on the changing property, with hard-coded output range, easing, extrapolation. The input range may use `durationInFrames`.
- Prefer `scale`, `rotate`, `translate` CSS properties over `transform`.
- Keep `width`, `height`, `fps`, `durationInFrames` and `defaultProps` inline on `<Composition>` or `<Still>` with no type assertions; use `calculateMetadata()` only for the dynamic part. Since 4.0.516 basic controls are inferred from default props, so Zod is optional.
- Keep effect arrays inline and stable; render separate elements when one version has effects and another does not.
- A custom component becomes editable with `Interactive.withSchema()` (4.0.530): it must accept `style` and pass it to its visual root; declare an `InteractivitySchema` for the editable props (types such as `color`); built-in schemas cover timing (`durationInFrames`, `from`, `trimBefore`, `playbackRate`, `freeze`, `hidden`, `name`, `showInTimeline`), premount, crop, transform, and captions (`Interactive.captionsSchema`, 4.0.500).
- "Cannot save default props" appears when `defaultProps` is not an inline literal on a findable TypeScript root file (troubleshooting.md).

## Other Studio features

- **Quick switcher**: `Cmd/Ctrl+K`; type to filter compositions by id; `>` first switches to menu items; `?` first searches the docs.
- **Keyboard shortcuts**: open the Shortcuts settings tab or press `?`. Examples: `Space` play and pause, `M` mute, `J` `K` `L` reverse, pause, forward, `G` go to frame, `A` and `E` start and end, `Cmd/Ctrl+B` and `Cmd/Ctrl+J` sidebars. Rebind with `Config.setKeyboardShortcuts({playPause: {key: 'q'}, render: null})` (4.0.523); `null` disables, an array assigns several, `commandOrControl`, `shift`, `alt` modifiers. Turn all off with `--disable-keyboard-shortcuts`.
- **Open in code editor** (4.0.503): compositions, sequences and error frames open in `vscode`, `cursor`, `windsurf`, `zed`, `vscodium`, `webstorm`, `sublime-text` or a custom executable with `%TARGET_PATH%:%LINE_NUMBER%:%COLUMN_NUMBER%` arguments. Set in the Studio menu, `Config.setDefaultEditor()`, or `--editor`. In a team use an env var for the executable path.
- **Browse Elements**: Remotion Elements are inside the Studio (right inspector Actions). Add more libraries with the gear dialog or `Config.addElementLibrary({url, displayName})`. Protocol details: studio-protocol.md.
- **remotion.dev/new**: a browser-only Studio with a virtual file system (Rspack Browser API) to scaffold and tinker; you cannot edit code, use an agent, or save there. Download the project and continue locally.
- **Embedding the Studio** as a React component is not supported (not customizable, and it needs a backend). Alternatives: build your own UI around the `<Player>`, deploy the Studio for the team, or wait for a bundle that includes it.

## Deploy

### Studio on a server (VPS, 4.0.46)

Install Node and Chrome, run `remotion studio`, expose port 3000. Dockerfile is the same as the render Dockerfile with `CMD ["npx", "remotion", "studio"]`. Fly.io needs `--ipv4` (4.0.125), a paid plan, `--vm-size=performance-2x` (2 CPU, 4 GB). Render.com: at least the Standard plan (2 GB). DigitalOcean App Platform does not work (its proxy blocks server-sent events), a droplet does. Scaleway Serverless Containers work from a registry image. For JAL this is a Coolify app behind the normal auth proxy; do not expose a Studio publicly because it can write files and run renders.

### Studio as a static site (4.0.97)

`remotion bundle` writes the Studio and the project to `build/` (add to `.gitignore`). No server-side rendering, but in-browser rendering works. Build command `bunx remotion bundle`, output directory `build` on Vercel; Netlify: `npx remotion bundle`, publish `build`; GitHub Pages through a workflow that pushes to `gh-pages` (before 4.0.497 pass `--public-path="./"`). The deployed URL is a Serve URL: `remotion render <url> <id> --props '{...}'`, `renderMedia({serveUrl})`, and Lambda or Cloud Run renders accept it. In read-only mode the Render modal's "Copy command" gives the matching CLI command. On Coolify a static site works the same way.

## Related

- cli.md, config.md, studio-protocol.md, codemods.md.
