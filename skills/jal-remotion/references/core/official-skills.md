# Official Remotion agent skills and templates (distilled, not vendored)

Source: github.com/remotion-dev/skills (default branch `main`, skills version 4.0.532) and the templates in github.com/remotion-dev/remotion `packages/template-*`. Read 2026-10-01.

## Licence decision (checked first)

- `remotion-dev/skills` has **no LICENSE file** (GitHub reports no licence); its `package.json` is `private` and points to `remotion-dev/remotion/tree/main/packages/skills`. The monorepo licence is the **Remotion License** (GitHub "Other / NOASSERTION"): source-available, free for individuals and teams up to 3, company licence at 4+, and it forbids copying or modifying Remotion to sell or sublicense a derivative. No file in the skills tree carries an MIT or other permissive notice.
- `packages/agent-plugin` in the monorepo has an MIT licence, but it is an internal package with no documentation and is not the skills content.
- Result: redistribution of the skill files is not granted. **Nothing is vendored verbatim.** This file distils the skills in JAL's own words (short code patterns only). The `references/core/official/` folder is intentionally absent.
- Installing the official skills into a user project (`npx skills add remotion-dev/skills`, the `bun create video` wizard option, `bunx remotion skills add`) pulls third-party instructions. JAL does not run these by itself: ask the user first. When installed, `bunx remotion upgrade` keeps them in step with the Remotion version.

## Structure of the repo

12 skills, each a folder with `SKILL.md` (front matter: `name`, `description`, `version`) and sub-files: `remotion-best-practices` (router and full bundle of the others, ~140 files), `remotion-create`, `remotion-markup` (47 topic files), `remotion-interactivity`, `remotion-studio`, `remotion-render`, `remotion-maps` (techniques: cesium, mapbox, maplibre, maptiler, static-map), `remotion-captions`, `remotion-saas`, `remotion-docs`, `remotion-multimedia`, `remotion-upgrade`. Scripts sync the README and embedded copies; `openai.yaml` files describe each skill for Codex.

## What each skill teaches (summary)

### remotion-best-practices (router)
- Preserve edits the user made outside the chat; if something changed unexpectedly, assume intent or ask.
- New video or no project: follow `remotion-create`. Writing markup: `remotion-markup`. Maps, multimedia, interactivity, captions, SaaS, docs, upgrade have their own skills.
- **Open the Studio preview as soon as the project runs and keep it open**; do not render unless the user explicitly asks ("render", "export", "give me the MP4"). Studio can be opened with `--no-open` for an in-app browser (then open the printed URL and verify; visit `/<composition-id>` for a specific composition).

### remotion-create
- Scaffold only if no project exists: empty folder -> `create-video --yes --blank --no-tailwind .`; non-empty -> new subfolder. Inspect hidden files first (`.env`, `.git` are meaningful). JAL form: `bun create video`.
- Open the preview before building. Keep the scaffold and add markup. Video-first layout: you are designing a video, not a webpage; one thing to notice per scene; key text at least 80 px from the sides and 100 px from top/bottom on a 1080 wide frame; headline 84 px minimum and supporting text 44 px minimum at 1080 wide (scale with width); no redundant elements.
- Timeline of clips -> video-editing rules; multi-scene -> multi-scene rules. Tailwind allowed if installed, never `transition-*` or `animate-*`.

### remotion-markup (the main one)
- Drive animation only with `useCurrentFrame()` and `interpolate()`; use `Easing.bezier()` / `Easing.spring()`; CSS `transition`/`animation` and Tailwind animation classes must be refactored.
- Put timing props directly on components that support them; avoid redundant `<Sequence>` wrappers. Give every timed component one second of premount: `premountFor={fps}` (media, interactive components, `Sequence`, `Series.Sequence`, `TransitionSeries.Sequence`, `TransitionSeries.Overlay`, including nested ones; premount the parent too when a nested item must mount before it).
- Studio edits the JSX node that created an item: every independently editable composition, clip, scene, layer needs its own JSX node with inline editable props; loops are only for template-like sets.
- Keep `interpolate()` inline in `style`; prefer `scale`, `translate`, `rotate`, `opacity` properties over `transform`; scale keyframes use `output: 'perceptual-scale'`.
- Media: `<Video>`/`<Audio>` from `@remotion/media`, images with `<CanvasImage>`, animated images with `<AnimatedImage>` (or `@remotion/gif` outside Chrome); `staticFile()` for `public/`; install with `remotion add`.
- Visual effects preference order: plain HTML/CSS -> effect on the element (`effects` prop) or wrap in `<HtmlInCanvas>` -> custom `createEffect()` (reusable, parameterised, stackable). WebGL effects need `Config.setChromiumOpenGlRenderer('angle')` in 4.x.
- Pre-compose action: extract selected markup into a named component made with `Interactive.withSchema({wrapInSequence: true})` and register the same reference as its own `<Composition>` (own id, dimensions, fps, duration, equal `defaultProps`); extraction without registration is incomplete.
- Compositions: inline `defaultProps` literal (not a variable, import, spread, helper or `satisfies`), `type` not `interface`, keep component and registration visible together, `<Folder>`, `<Still>`, `calculateMetadata` for dynamic values, nesting via `<Sequence width height>`.
- Multi-scene: one file/component per scene, connected compositions, `<TransitionSeries>` when transitions may occur, inline `durationInFrames`; with no transition total = sum of scenes, with transitions subtract overlaps; `<Series>` when no transitions.
- Video editing timelines: independently placed `<Video name trimBefore from durationInFrames premountFor>` nodes (moving one does not move others), `<Series>` when later clips must reflow, `<TransitionSeries>` when transitions/overlays.
- Topic files: audio, voiceover (ElevenLabs TTS), sfx, silence detection and FFmpeg trimming, audio visualisation, motion blur (prefer HTML-in-canvas), light leaks, transitions, cropping, GIFs, Lottie, Google and local fonts, measuring DOM nodes and text, text highlights, 3D (Three/R3F), maps, parameters (Zod), sequencing, timing.
- Visual check: open the Studio, or render a few frames as images (`render --frames=0,30,90 --image-format=png`).

### remotion-interactivity
Structure markup so the Studio can select, drag, resize, rotate, edit CSS and keyframes: prefer interactive components with their own timelines (`Interactive.withSchema`), choose schema fields for meaningful props, register as connected compositions, put timing on the component, one JSX node per editable item, `Interactive.*` elements for plain HTML/SVG, inline text and inline styles, descriptive `name`, `interpolate()` inline, editable SVG paths via `Interactive.Path` with inline `interpolatePaths()`, `scale/translate/rotate` properties, inline composition metadata, inline effects. If the markup is too complex the Studio greys values out.

### remotion-studio / remotion-render
Studio flags: `--log=<level>`, `--port`, `--force-new`, `--no-open`. Render: `remotion render`, `remotion still`, several frames in one call with `render <id> out/frames --frames=0,30,90 --image-format=png`; transparent videos note (PNG frames + VP8/VP9 `yuva420p`, or ProRes 4444).

### remotion-captions
`Caption` type from `@remotion/captions` (`text`, `startMs`, `endMs`, `timestampMs`, `confidence`, optional `pageBreakAfter`); transcribe (Whisper via `@remotion/install-whisper-cpp`), import SRT, display with page-based captions; keep captions inline on the editor node so the caption editor can edit them. Lives in the captions reference of the plugin if another worker owns it.

### remotion-saas
Templates and framework choice (Next.js + Lambda, Vercel Sandbox, React Router, Express render server), the Player, client vs server rendering, Lambda setup checklist (account, region, role/policies, `.env` with `REMOTION_AWS_ACCESS_KEY_ID`/`REMOTION_AWS_SECRET_ACCESS_KEY`, deploy function and site, quotas), GitHub Actions/Azure/Cloudflare only if asked. Before production: rate limiting, auth, cost controls, output privacy, cleanup. JAL: all server rendering is gated on Brian (see `rendering-and-output.md`).

### remotion-docs
Search the docs (an Algolia index; do not copy the embedded search key into JAL files) and fetch any docs page as Markdown by appending `.md` to its URL (also `llms.txt` lists the main topics). JAL agents should use `.md` URLs through the context tools, then implement from current docs rather than memory.

### remotion-multimedia / remotion-upgrade
Mediabunny for duration, dimensions, trimming in the browser (`mediabunny.dev/llms.txt`). Upgrade: `remotion upgrade` else manual exact-version bump plus aligning auxiliary packages plus `npx skills update ...`.

### remotion-maps
Techniques for MapLibre, Mapbox, MapTiler, Cesium 3D flyovers and static maps with render-stability notes (idle waits, no cleanup, single concurrency).

## Templates (remotion-dev/remotion `packages/template-*`)

| Template | What it is | Notable deps |
|---|---|---|
| blank, helloworld | minimal starter; helloworld is the recommended first project | remotion, cli, zod-types |
| still | design stills with dynamic data and a built-in server | renderer, bundler |
| three | React Three Fiber boilerplate | three, @react-three/fiber, @remotion/three, media |
| audiogram | podcast clips with captions (Whisper) | media, captions, install-whisper-cpp |
| music-visualization | audio-reactive visuals | media, media-utils |
| tiktok | captioned vertical video | layout-utils, animation-utils |
| code-hike | animated code | google-fonts, layout-utils, studio |
| overlay | transparent overlays | google-fonts |
| skia | React Native Skia graphics (React 18) | @remotion/skia |
| stargazer | GitHub stars celebration | renderer, bundler |
| recorder | record, caption, edit, render videos | captions, lambda, renderer |
| prompt-to-video | AI story video CLI (OpenAI + ElevenLabs) | media, layout-utils |
| prompt-to-motion-graphics | natural language to Remotion code | ai-sdk, lambda, player, three, lottie |
| vibe-code | in-browser motion graphics editor | browser-bundler, web-renderer, canvas, player |
| next-app-tailwind | Next.js SaaS with Player + Lambda | player, lambda, tailwind-v4 |
| react-router | React Router starter with Player + Lambda | player, lambda |
| vercel | Next.js with Vercel Sandbox rendering | @remotion/vercel, player |
| render-server | Express render API with progress and cancel | renderer, bundler |
| electron | Electron Forge + Vite + Tailwind, main-process render | renderer, bundler |

JAL pick: `helloworld` or `blank` for a video project; `three` for R3F; none of the SaaS/cloud templates without Brian's yes (they pull Lambda, Vercel, Next or React Router, which are outside the JAL stack).

## How JAL uses this

- `skills/jal-remotion` carries JAL's own rules built from these ideas (inline timing, `premountFor={fps}`, preview first, render only on request, Studio-editable structure). JAL rules win where they differ (Bun, no Next/Vite, JEV decisions, Brian gates).
- Do not fetch or paste the official skill files into the repository. If someone wants the latest official text, fetch the `.md` doc pages or the GitHub raw file at task time and summarise.

From:
- https://github.com/remotion-dev/skills (README, package.json, skills/*/SKILL.md)
- https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- https://github.com/remotion-dev/remotion/tree/main/packages (template-*)
- https://www.remotion.dev/docs/resources
- https://www.remotion.dev/docs/export-opentimeline
- https://www.remotion.dev/docs/html-in-canvas
- https://www.remotion.dev/docs/schemas
