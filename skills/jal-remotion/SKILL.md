---
user-invocable: false
name: jal-remotion
description: Remotion as the main core motion engine of JAL-AIDEV (Brian, 2026-10-01). Covers when Remotion is used and when a supplement is (kit CSS motion, Lenis plus GSAP, Three.js and R3F, noyzzi, magicui, animata, OriginKit, the JAL frame core), how they combine (a composition scroll-scrubbed by Lenis or ScrollTrigger, R3F inside a composition), the JEV decisions motion.engine, motion.remotion_recipe, and video.render_path, the workflow for a website section (the opt-in video module, RemotionSection, poster first, the Player in a lazy Bun.build chunk) and for an MP4 deliverable (in-browser export with @remotion/web-renderer and WebCodecs by default, every headless Chrome or cloud path only with Brian's yes), the free-license rule and the 4th-person stop, privacy for in-browser export, the law zones, the 261 rm.* recipes, and verification (ui_audit, ui_shots, the critic gate, an MP4 frame-sample check). Use for any Remotion, video, MP4, WebM, GIF, motion graphics, composition, Player, render, captions, product intro, explainer, product demo, hero motion piece, social video, data animation, or data story request.
---

# JAL Remotion: the core motion engine

Remotion is the main core motion of JAL-AIDEV (Brian's ruling, 2026-10-01). A Remotion composition is React where every pixel is a pure function of a frame number, so one piece of code plays live on a page through the Player, scrubs with scroll, and exports to an MP4. The other motion tools stay as supplements and are combined with it whenever they fit. JEV decides per section; Brian decides on anything heavier than the defaults below.

Read order: `jal-standards` (law and approved tech), `jal-ui-taste`, `jal-design-system` (JAL Core, the kit), `jal-motion` (tokens, motion law), then this skill and the references a task needs. For a 3D scene also `jal-immersive`. The video module (`templates/modules/video`, copied into `packages/video`) is the code; its README describes `RemotionSection`, the compositions registry, the in-browser export helper, and the optional Studio entry.

## 1. Remotion as core, at zero cost when unused

- **Nothing is installed in a project that needs no motion.** The JAL template ships no Remotion package. The kit's own motion layer (`packages/ui/src/kit/motion.ts`, zero dependencies) covers entrances and counts on every page at no cost.
- **When a build needs motion, JEV decides per section** (`motion.engine`, after `motion.intensity`). Remotion is the first choice for timeline or composed motion: product intros, hero motion pieces, data stories, product demos, and explainers.
- **Every video request uses Remotion directly**, with no question: MP4, WebM, GIF, a social cut, a captioned clip, a still render of a composition.
- Only then is the video module copied in (`packages/video`), and only the pieces the section needs load: the Player in a lazy split chunk on approach, the web renderer only on the first export.
- **JEV may pick another library or framework when it fits better.** Any complex extra stack (a new runtime, a native toolchain, a cloud account, a render server, a second bundler in an app) needs Brian's confirmation as tech lead first (`be.new_tech`, then `orch.escalate`).

## 2. The decision flow

```
section or deliverable
  |-- no motion needed on the page ............ nothing installed (motion.engine none)
  |-- video, MP4, WebM, GIF, social clip ....... remotion (precheck, not asked)
  |-- micro-interaction only .................. kit_css (precheck, not asked)
  |-- otherwise: motion.intensity, then motion.engine (JEV)
        remotion ........ motion.remotion_recipe (rm.* pool, 3 or more families), then layers
        gsap_lenis ...... motion.choreography, motion.pin
        r3f ............. imm.gate, imm.recipe, imm.tech, imm.tier
        frame_core ...... motion.demo_medium frame_core (zero-dependency demo)
        noyzzi_or_library  imm.recipe or ui.component_recipe (noyzzi, magicui, animata, OriginKit)
        kit_css ......... kit data-motion, CSS, WAAPI, Framer Motion
  |-- any file output: video.render_path (web_renderer by default)
```

| Engine (`motion.engine`) | Use it for | Owner of the clock |
|---|---|---|
| `remotion` | A composed timeline with beats: product intro, hero motion piece, data story, product demo, explainer, captioned clip; anything that must also be a file | `useCurrentFrame()` inside the composition; the Player (time) or scroll (scrub) drives the frame |
| `kit_css` | Micro-interactions and state changes: hover, press, focus, toggles, list add and remove, one entrance; the kit's `data-motion` layer; Framer Motion for React state, layout, and exit | CSS, WAAPI, or Framer Motion, per `jal-motion` sections 3 and 4a |
| `gsap_lenis` | Smooth scroll, pins, parallax, scroll reveals, SplitText on real page elements | Lenis on the GSAP ticker (`templates/modules/motion`, `jal-immersive` `references/scroll-choreography.md`) |
| `r3f` | A live 3D scene the visitor drives (rotate, drag, configure) | R3F frame loop on the one clock (`jal-immersive`) |
| `frame_core` | A small zero-dependency demo with no export need | The JAL frame core (`jal-immersive` `references/frames.md`) |
| `noyzzi_or_library` | A signature effect from noyzzi, magicui, animata, OriginKit, or another JEV-picked library | The piece's own loop, under its law zone |
| `none` | The section reads better still | Nothing |

### How they combine

One section may layer several engines through the layering protocol (`jal-design-system` `references/recipe-index.md` section 4), with one owner per element and one scroll owner per page:

- **Remotion plus Lenis or ScrollTrigger:** the composition is the picture, scroll is the clock. A paused Player is moved with `seekTo` from scroll progress; Lenis (or a ScrollTrigger `onUpdate`) supplies the progress, CSS `position: sticky` does the pin (`references/web/scroll-scrub.md`, the module's `watchScroll`). Lenis stays the page's one smoother.
- **Remotion plus kit motion:** the kit animates the page around the section (heading rise, CTA state layer); the composition animates only inside its `MediaFrame`. The kit steps aside on any element that sets `data-motion-engine`.
- **Remotion plus R3F:** a 3D scene on a timeline goes inside the composition through `@remotion/three` (`<ThreeCanvas>` reads the frame). A 3D scene the visitor drives stays a page R3F canvas (`jal-immersive`). Never two WebGL canvases in one viewport.
- **Remotion plus noyzzi or a library:** a noyzzi section or a magicui or animata recipe may sit beside a Remotion section, never inside the composition's frame; each keeps its own law zone.
- **Never** a free-running clock inside a composition (CSS transitions or keyframes, WAAPI, the GSAP ticker, Framer Motion, `Math.random()`): everything there is derived from the frame with `interpolate`, `spring`, or `@remotion/gsap` (which seeks a paused timeline to the frame). GSAP, Lenis, and Framer Motion run on the page, outside the composition (`references/core/timing-and-animation.md`).

## 3. Workflow: a Remotion section on a website

1. **Gate.** `motion.intensity` for the section, then `motion.engine` answers `remotion` (or the precheck does).
2. **Recipe.** `motion.remotion_recipe`: a shortlist from `references/visuals/recipe-index.md` (261 `rm.*` rows) across at least 3 families, plus the module's registry compositions as the JAL-native base. Then grow the composition one layer at a time (the same `layer_n` protocol as `imm.recipe`).
3. **Module.** Copy `templates/modules/video` into `packages/video` (README there), `bun add --exact` every `remotion` and `@remotion/*` package on one version, Mediabunny pinned to Remotion's paired version. The app's `Bun.build` gets `splitting: true`; Studio and its bundler never enter `apps/web`.
4. **Composition.** Register it in the compositions registry with a zod schema for its props (`references/core/props-and-schemas.md`), the JAL tokens as a theme object, Geist as the font, and its law zone written in the schema file (section 7).
5. **Page.** Place it with `RemotionSection` inside the kit (`MediaFrame` ratio fixed): stage 0 poster in the server HTML, stage 1 `Thumbnail` when the section nears the viewport, stage 2 `Player` when it is in view and motion is allowed (`references/web/website-integration.md` section 4). Modes: `autoplay` (muted, looped, only while on screen, a pause control past 5 seconds), `scrub`, or `manual`.
6. **Scroll.** For a scrubbed story, `motion.choreography` `scrub` or `pinned_sequence` and `motion.pin` first; then `watchScroll` with Lenis as the source.
7. **Export button (optional).** Only when the feature is needed; the privacy rule in section 6 applies on public pages.
8. **Verify** (section 9).

## 4. Workflow: an MP4 deliverable

1. **Intake.** A video request goes to Remotion without asking (`motion.engine` precheck). Restate format, length, aspect (16:9, 9:16, 1:1, 4:5), fps, captions, audio, and where it will be used.
2. **Render path.** `video.render_path`. The default `web_renderer` needs no question when a person is at a screen, the composition passes the fit check (`references/rendering/render-paths.md`), and `canRenderMediaOnWeb()` returns true. Anything else stops and asks Brian (section 5).
3. **Composition.** Build it in the video workspace (`packages/video`, or a separate video package for a pure video job), props through a zod schema, recipes from `motion.remotion_recipe`. Audio: CC0 sound only by default (`references/ai-media/sfx.md`), loudness rules in `references/ai-media/audio.md`. Captions: `@remotion/captions` from a script or SRT the project already has; automatic transcription only after Brian approves an engine for the project (`references/ai-media/captions.md`, `whisper.md`).
4. **Preview.** In the Player on a dev page, or in Remotion Studio, which runs only inside the video workspace (`templates/modules/video/src/studio/index.ts`). Studio's Render button renders with Chrome Headless Shell, so it counts as `local_cli`.
5. **Render.** `exportMp4` from the module (`@remotion/web-renderer` `renderMediaOnWeb`, WebCodecs through Mediabunny, `licenseKey: 'free-license'`), from a dev page or an internal tool.
6. **Verify** (section 9, MP4 checks), then deliver the file with its probe line and the sampled frames.

## 5. Render paths

| Path (`video.render_path`) | What runs | Needs Brian's confirmation | Notes |
|---|---|---|---|
| `web_renderer` | `renderMediaOnWeb` / `renderStillOnWeb` in the viewer's own tab, WebCodecs via Mediabunny | No. The default | No headless Chrome, no server, no FFmpeg. A person must be at a screen. Subset of CSS (fit check). Sends a telemetry event per render (section 6) |
| `local_cli` | `bunx remotionb render`, `renderMedia()`, or the Studio Render button on a developer machine, Chrome Headless Shell | Yes, per project | Bundled FFmpeg is GPLv2+; never shipped in an image without checking GPL duties |
| `coolify_service` | A Bun and Hono render worker with Chrome Headless Shell on deploy.jalgroup.id | Yes, per project | Design in `references/rendering/render-paths.md`; only JAL-owned compositions with validated props, never user-uploaded Remotion code |
| `lambda` | Remotion Lambda in an AWS account | Yes, per project | AWS account, cost, license counting |
| `cloud_run` | `@remotion/cloudrun` | Yes, and argue against it | Alpha, not actively developed |
| `vercel` | `@remotion/vercel` Sandbox | Yes, and argue against it | JAL deploys on Coolify |

When a task needs a row other than `web_renderer`, stop and ask Brian in plain words: which path, why the default does not fit, what it costs, what it adds to the license count. Build nothing until he says yes, then record the decision in an ADR (`references/rendering/render-paths.md`, confirmation wording). The guard hook keeps `@remotion/cli`, `@remotion/studio`, `@remotion/bundler`, `@remotion/renderer`, and the cloud packages out of any package that is not a video workspace.

## 6. License and privacy

**License.** JAL uses the free Remotion License. JAL is 3 people (2 developers and 1 AI specialist) and every project is internal, with no external clients, so Remotion may be used in every JAL project that needs motion. Where an API asks for a key, pass `licenseKey: 'free-license'` (it declares free eligibility and silences the console warning).

**Stop rule.** The plugin warns and stops when either of these appears in a brief, an intake note, a contributor list, or a plan:

- a 4th team member on any project that uses Remotion (employee, contractor, or agency; from Remotion 5.0 contractors count, and the count spans every party that owns, controls, or directly uses the Remotion code);
- an external client, or anyone outside JAL who would receive the Remotion source or run it.

The warning, said once and then wait: "Remotion's free license ends at 4 people on a project, and contractors count from Remotion 5.0. An external client who receives the source counts too. A Company License would be required (Creators $25 per seat per month, or Automators $0.01 per render with a $100 monthly minimum). Confirm with Brian before continuing." Never build a rendering service that runs user-supplied Remotion code. Details: `references/core/license-and-policy.md`, `references/rendering/license.md`.

**Privacy.**

- The Player sends nothing anywhere. A live or scrubbed composition is private by construction.
- In-browser export sends one event per render to Remotion (remotion.pro): the page origin, success or failure, and the visitor's IP address. No video content.
- Internal tools and dev pages: free to use.
- Public pages: only when the export feature is actually needed. Then, mechanically: no UI text at all (no notice, banner, or extra copy near the button: Brian, 2026-10-01), a privacy-policy line added automatically to the site's policy (operational telemetry to Remotion as a technical provider), and `https://www.remotion.pro` allowed in `connect-src` so the ping does not fail.
- Anything else that leaves the browser (a cloud transcription, a TTS voice, an upload) is off by default (section 8).

## 7. Law zones

| Zone | Law |
|---|---|
| The page around the section, and the `MediaFrame` that holds the Player | Full JAL law: white-first, no gradient, no shadow, no side line, caption below the media, fixed ratio, 44px controls, no overlap |
| Player controls | Custom controls from kit tokens outside the stage are the default; Remotion's built-in bar only after it passes `ui_audit` on that page |
| Inside a composition shown in a Player | Full page law. A composition is DOM: no gradient, no shadow, no glow, no purple, no emoji, no em-dash, the type scale, the overlap law |
| Scene content inside a composition | The canvas exemption (natural light and shade, `jal-immersive` Zone B) applies only to scene content: a 3D scene, footage, a rendered image. JEV decides per composition and the answer is written in its schema file. Text, UI, captions, and chrome in the same frame keep full law |
| `rm.*` Law column | `fine` breaks no rule by itself, but JAL motion law still decides use (no decorative draw-on, marker, or sparkle ornament); `canvas-only` only inside scene content; `brief-only` only when the brief asks for that style and JEV agrees, and then inside a noyzzi-style exempt section |
| An MP4 deliverable | The same as a Player composition: it is the same code |

## 8. Defaults decided by the lead (2026-10-01)

- Paid items are excluded unless Brian asks: the cube transition, the Editor Starter, paid templates, the Timeline component.
- ElevenLabs, the OpenAI Whisper API, and transformers.js or ONNX (`@remotion/whisper-webgpu`, `@remotion/video-matting`) are off until Brian approves them per project.
- `remotion skills add` (and any third-party Remotion skill or plugin install) is ask-first.
- Sound effects are CC0 only by default.
- Video fonts default to Geist (vendored). `@remotion/google-fonts` only inside video renders, never on a website.
- Compositions in a Player follow full page law, with the canvas exemption only for scene content (JEV).
- Animated emoji only when a brief explicitly asks.
- The deprecated `@remotion/media-parser` and `@remotion/webcodecs` are never installed; Mediabunny is pinned to the version Remotion pairs with (the guard hook blocks the two packages).
- Runtime LLM video generation uses gpt-4o-mini with a zod-validated JSON scene spec (`references/ai-media/ai-authoring.md` Pattern A). Free-form code generation only with Brian's yes.
- Tailwind inside a video workspace only when the brief or a copied Element already uses it, through the JAL `@theme` (the v0.4.0 Tailwind approval); the default is plain React with the JAL token theme object.

## 9. Verification

**A page with a Remotion section:**

1. `bun run build && bun test`, plus `bun run check:boundaries` in a monorepo. Inspect the `Bun.build` output: no `remotion` code in the first chunk, the Player only in its lazy chunk, the web renderer only in the export chunk.
2. `ui_audit` PASS at 320, 375, 414, 768, and 1280, including `reduced-motion` (a paused Thumbnail, no autoplay, no scrub), `stuck-reveal`, and `blank-viewport`. SKIPPED is never a pass.
3. `ui_shots` at 375 and 1280 (`webgl: true` when the composition holds a `ThreeCanvas`), every image Read: the poster stage, the playing stage, a reduced-motion run, and for a scrub section three scroll positions.
4. The network log: the Player makes no third-party request; an export makes only the remotion.pro ping.
5. The fresh-eyes critic gate (`jal-orchestration` step 6b): a critic that did not build the page scores the `ui_shots` images; the builder never self-approves.

**An MP4:**

1. `bun scripts/video/probe-mp4.ts <file>`: duration, width and height, codec, frame count, fps, and `fastStart` match the brief.
2. **Frame-sample check.** Sample at least five frames (first, 25, 50, and 75 percent, last, plus every scene cut): render each with `renderStillOnWeb` at that frame on the export page, or decode them from the file with Mediabunny's `VideoSampleSink`. Read every image: law holds, text is legible inside the safe area, captions match the audio, nothing overlaps, the last frame settles, no blank or black frame.
3. Audio, when present: CC0 source listed, no clipping, the voice above music.
4. Report the probe line, the sampled frame paths, and the render path with any confirmation Brian gave.

## 10. References

Every file under `references/` (written against Remotion 4.0.532, docs read 2026-10-01). The coverage ledgers list 1301 docs URLs with where each landed.

### core/

| File | Holds |
|---|---|
| `core/fundamentals.md` | What Remotion is, the package map, the license gate, creating a project with Bun (`remotionb`), Bun caveats, exact version pinning, project shape |
| `core/compositions.md` | `registerRoot`, `<Composition>`, `<Still>`, `<Folder>`, `<Sequence>`, `<Series>`, `<Loop>`, `<Freeze>`, `<AbsoluteFill>`, `<TransitionSeries>`, layout in time |
| `core/timing-and-animation.md` | Frame-derived motion: `useCurrentFrame`, timing props, `interpolate`, `spring`, easing, determinism, flicker rules, `@remotion/gsap` and other libraries inside a composition |
| `core/props-and-schemas.md` | `defaultProps`, input props, `calculateMetadata()`, zod schemas, Studio controls, `Interactive`, batch and dataset renders |
| `core/data-and-delayrender.md` | Async data, `delayRender` and `continueRender`, `useDelayRender`, environment detection, render artifacts |
| `core/assets-and-fonts.md` | `staticFile()`, images, iframes, CSS, `@remotion/fonts`, `@remotion/google-fonts`, Geist in video |
| `core/media.md` | Video and audio tags, volume curves and `loopVolumeCurveBehavior`, trim, HLS, transparency, HDR, greenscreen, metadata, uploads |
| `core/visuals-and-3d.md` | Canvas components with `effects`, custom effects, HTML-in-canvas, 3D through `@remotion/three`, canvas-capture |
| `core/rendering-and-output.md` | Ways to render, the JAL gate (headless Chrome only with Brian's yes), output formats, codecs, the server API pattern |
| `core/integrations.md` | Remotion inside an existing app, a monorepo package, other frameworks, bundler tweaks, the JAL scaffold note |
| `core/api-remotion.md` | Index of every `remotion` export and the `@remotion/*` package map with owning reference and license |
| `core/license-and-policy.md` | License tiers, the 4-person rule, disallowed uses, package licenses, telemetry, privacy, support |
| `core/official-skills.md` | Remotion's official agent skills and templates, distilled in JAL's words; install is ask-first |
| `core/migrations-and-troubleshooting.md` | Breaking-change history to 5.0, the upgrade procedure, common error pages |

### rendering/

| File | Holds |
|---|---|
| `rendering/render-paths.md` | Read first: the six render paths, the JAL default, the fit check, pick by case, the Coolify render service design, confirmation wording |
| `rendering/license.md` | The free license rule and the 4-person warning text, counting agencies and clients, Company License plans, automations |
| `rendering/cli.md` | The `remotion` / `remotionb` command reference |
| `rendering/config.md` | `remotion.config.ts` options for Studio and the CLI |
| `rendering/renderer-api.md` | `@remotion/renderer`, `@remotion/bundler`, `@remotion/browser-bundler`, server-side rendering |
| `rendering/server-runtime.md` | Docker recipe, Chrome Headless Shell, Linux libraries, memory and temp disk, GPU, FFmpeg GPL note |
| `rendering/studio.md` | Remotion Studio: start, APIs, interactivity, deploy |
| `rendering/studio-protocol.md` | Sending Elements and Element Libraries into a running Studio |
| `rendering/codemods.md` | `@remotion/codemods`: editing Remotion source in memory |
| `rendering/lambda.md` | Remotion Lambda API and CLI (needs Brian) |
| `rendering/lambda-ops.md` | Lambda setup, limits, cost, security, troubleshooting (needs Brian) |
| `rendering/cloudrun.md` | Cloud Run reference (needs Brian, argue against) |
| `rendering/vercel.md` | Vercel Sandbox reference (needs Brian, argue against) |
| `rendering/troubleshooting.md` | Symptom, cause, fix for render errors and glitches |
| `rendering/misc.md` | Terminology, short answers, snippets, contributing |

### web/

| File | Holds |
|---|---|
| `web/website-integration.md` | Read first for a website: where Remotion sits, stack rules, law zones, poster-first lazy loading, budgets, accessibility, checks, anti-patterns |
| `web/player.md` | `@remotion/player`: props, ref API, events, scaling, controls, performance |
| `web/thumbnail-and-preload.md` | `<Thumbnail>`, the three ways to get a poster, `@remotion/preload` |
| `web/scroll-scrub.md` | Scroll-driven compositions: the sticky track, the hook, Lenis and ScrollTrigger as sources, reduced motion |
| `web/accessibility.md` | WCAG 2.2 AA rules for a page with a Player, a Thumbnail, or an export button |
| `web/client-side-rendering.md` | In-browser rendering concepts, supported CSS and elements, limits |
| `web/web-renderer.md` | `renderMediaOnWeb`, `renderStillOnWeb`, `canRenderMediaOnWeb`, codecs, progress, the license key |
| `web/webcodecs.md` | WebCodecs in the browser, the deprecated `@remotion/webcodecs`, what replaces it |
| `web/mediabunny.md` | Mediabunny (MPL-2.0): metadata, frame extraction, conversion, pinning |
| `web/media-parser.md` | The deprecated `@remotion/media-parser` and its Mediabunny replacements |
| `web/media.md` | `@remotion/media` tags and `@remotion/media-utils` helpers |
| `web/videos.md` | Putting video files into a composition: trim, delay, speed, jump cuts, transparency |
| `web/products-and-licensing.md` | Player, automation, `@remotion/design`, pricing, and the JAL reading of the license |
| `web/editor-starter.md` | The paid Editor Starter (excluded unless Brian asks) |
| `web/timeline.md` | The paid Timeline component (excluded unless Brian asks) |
| `web/recorder.md` | The Recorder template for talking-head and screen videos (extra stack, Brian) |

### ai-media/

| File | Holds |
|---|---|
| `ai-media/ai-authoring.md` | How JAL agents author Remotion, and runtime generation: gpt-4o-mini with a zod JSON scene spec, code generation only with Brian's yes |
| `ai-media/audio.md` | Audio import, trim, volume, speed, pitch, export, visualization, loudness |
| `ai-media/captions.md` | `@remotion/captions`: the `Caption` type, SRT, pages, the JAL transcription order |
| `ai-media/whisper.md` | Speech to text: whisper-webgpu, whisper.cpp, WASM, the OpenAI API (off until Brian approves) |
| `ai-media/elevenlabs.md` | ElevenLabs conversion and voice services (off until Brian approves) |
| `ai-media/sfx.md` | `@remotion/sfx` and the CC0-only sound rule |
| `ai-media/lottie-gif.md` | Lottie, GIF, and animated emoji (only when a brief asks) |
| `ai-media/video-matting.md` | Local video background removal (transformers.js, off until Brian approves) |
| `ai-media/templates.md` | Official templates and how JAL starts from them on Bun |
| `ai-media/showcase-patterns.md` | Capabilities and patterns from remotion.dev marketing, vendor facts, release history |

### visuals/

| File | Holds |
|---|---|
| `visuals/recipe-index.md` | All 261 `rm.*` recipes with tier, web use, reduced-motion fallback, and law note: the `motion.remotion_recipe` pool |
| `visuals/transitions.md` | `@remotion/transitions`: presentations, timings, overlays, sounds (cube is paid) |
| `visuals/effects.md` | `@remotion/effects`: the canvas effect catalog and custom effects |
| `visuals/shapes-paths.md` | `@remotion/shapes` and `@remotion/paths` |
| `visuals/text-utils.md` | `@remotion/layout-utils` text fitting, rounded boxes, hand-drawn annotations |
| `visuals/elements.md` | The Remotion Elements catalog |
| `visuals/canvas-skia-three.md` | `@remotion/canvas` (editor), Skia, Three |
| `visuals/noise-lightleaks-starburst.md` | `@remotion/noise`, light leaks, starburst |
| `visuals/motion-blur.md` | `@remotion/motion-blur` and its three approaches |
| `visuals/animation-utils.md` | `@remotion/animation-utils` style interpolation |
| `visuals/fonts.md` | `@remotion/fonts` and `@remotion/google-fonts` (video only) |
| `visuals/tailwind.md` | Tailwind in a video workspace |
| `visuals/zod-types.md` | `@remotion/zod-types` Studio controls |
| `visuals/prompts.md` | The community prompt gallery as recipe ideas |

### coverage/

| File | Holds |
|---|---|
| `coverage/core.md` | Ledger for the core slice: every URL, where it landed, status |
| `coverage/rendering.md` | Ledger for the rendering slice |
| `coverage/web.md` | Ledger for the web slice |
| `coverage/aimedia.md` | Ledger for the AI and media slice |
| `coverage/visuals.md` | Ledger for the visuals slice |

## JEV questions

The exact question JSON, prechecks, state fields, and thresholds for `motion.engine`, `motion.remotion_recipe`, and `video.render_path` live in `jal-jev` `references/catalog.md`, next to `motion.intensity`, `motion.choreography`, `motion.pin`, and `motion.demo_medium`. The catalog is the single source; do not copy questions into this file.
