# Showcase patterns, license, vendor facts and release history

Everything on the marketing side of remotion.dev that reveals a capability, a technique, a product pattern or a rule JAL must follow. Pages with nothing usable are listed at the end with the reason.

From:
- https://www.remotion.dev/ and https://www.remotion.dev/ai
- https://www.remotion.dev/about/ and https://www.remotion.dev/contact/
- https://www.remotion.dev/explore_section and https://www.remotion.dev/search
- https://www.remotion.dev/lambda/
- https://www.remotion.dev/learn, https://www.remotion.dev/learn/apple-wow, https://www.remotion.dev/learn/archive
- https://www.remotion.dev/showcase/ and https://www.remotion.dev/showcase/add
- https://www.remotion.dev/success-stories and its pages: a-million-dollars, archive, makestories, shortvid, typeframes, yarx
- https://www.remotion.dev/experts/ and the 22 expert profiles under https://www.remotion.dev/experts/<name>
- https://www.remotion.dev/blog, /blog/archive, /blog/page/2, /blog/page/3 and the posts: 1-1, 1-2, 1-3, 1-4, 1-5, 2-0, 2-1, 2-2, 2-3, 2-4, 2-5, 2-6, 3-0, 3-1, 3-2, 3-3, 4-0, company-licenses, deployable-studio, editor-starter, faster-lambda, introducing-remotion, media-parser, mediabunny, seed-funding

Remotion version this was written against: `remotion` 4.0.532 (docs and site read 2026-10-01).

## License and pricing

From the homepage:

- **Free License** for individuals and companies of **up to 3 people**: create and automate, all features, unlimited commercial use, no sign-up. You must upgrade when the organisation grows.
- A **Company License** is required for collaboration and companies of **4 or more people**. Two products: *Remotion for Automators* (build video-creation tools, batch rendering, prompt-to-video apps, embedding the Player: $0.01 per render, $100 per month minimum; developers on automation projects do not need a seat) and *Remotion for Creators* (low-volume manual creation, motion design systems in a local environment including AI agents and Studio: $25 per month per seat).
- **Enterprise License** from $500 per month: everything in the Company License plus private chat, monthly consulting, custom terms, compliance forms, prioritised feature requests and the Editor Starter.
- Terms are in LICENSE.md, the license FAQ and the Terms; Remotion offers a 20-minute evaluation call or email for questions.

JAL rule: JAL is 3 people today (2 developers and 1 AI specialist), so the Free License applies. Every project is internal, with no external clients (Brian, 2026-10-01). **The plugin warns and stops when the team reaches 4 or more people or an external client appears.** A visitor-facing render feature is an automation the free license allows at JAL's size; it would become Automators territory only past 3 people (confirm with Remotion's license text, not from memory). The company license history: public pricing since 2021-03-15 (companies.remotion.dev, self-serve purchase and invoices). Remotion itself is source-available on GitHub, not OSI open source.

## Vendor facts

Remotion AG, Zurich, Switzerland; started 2021; founder-owned; says it is profitable and does not plan to sell; a succession plan hands the project to William Candillon's supervision; 400+ customers, 2M+ videos per month, 60,000+ GitHub stars; the code is source-available to inspect, fork and self-host; team of three (Jonny Burger, Mehmet Ademi, Igor Samokhovets). Use as a vendor-risk note: low lock-in because compositions are plain React and the code is public. The seed round was CHF 180k in 2022 from investors who also use Remotion. Support is on Discord (public channels) and paid experts; no technical support by email.

## Homepage positioning and capability map

Three workflows, switchable at any time because code stays the source of truth: **agentic** (a coding agent builds the video, see `ai-authoring.md`), **interactive** (Studio with drag and drop, saves back to code), **programmatic** (data, parameters, batch). Plus: parameterization and motion design systems, batch rendering "millions of videos on your own infrastructure", applications (Editor Starter). Built-with examples: music visualisation, captions, screencast, year in review, Banger.Show (3D visual creation tool for artists). Site counters: 5M+ installs per month, 1000 pages of docs, 35 templates and examples, 10K+ Discord members, 300+ contributors.

The explore page lists the full capability categories, which is the checklist for "none skipped": Video, Audio, Captions, AI, Parameterization, Rendering, Effects, Transitions, Elements, Color Correction, Keyframes, Background removal, Fonts, Integrations, Editor Starter, Convert. This slice owns Audio (`audio.md`, `sfx.md`), Captions (`captions.md`, `whisper.md`, `elevenlabs.md`), AI (`ai-authoring.md`) and Background removal (`video-matting.md`); the rest belong to the core, effects, rendering and player references.

## Success stories

| Story | Pattern | Takeaway for JAL |
|---|---|---|
| MakeStories (2021) | HTML/CSS Web Stories exported to MP4 by a Remotion render service; renders up to ten slides in under a minute | Any HTML/React document model can become video; keep the render service separate |
| Shortvid.io (2023) | Open-source set of customisable compositions for event announcement videos (meetups, conferences); used on venue screens; adding a Zod schema for props and a hosted playground | Template library plus Zod props equals non-developers can make videos |
| Typeframes (2023) | Text-to-video for SaaS product intros. Player gives live preview, Lambda renders. Free plan with watermark, programmatic SEO pages; plans an animation library like Canva templates | Player for editing UX, server render for delivery, watermark as growth |
| YARX (2022) | Personalised marathon-finisher videos for hundreds of runners; moved from FFmpeg overlays because animations were too limited; backend in C# starts many VMs that call Remotion as a render engine | Remotion can be a render engine behind any backend; batch personalised video |
| "Making a million dollars" (2025-08-08) | Four AI-video products built on Remotion and the revenue they report: Submagic (AI shorts), AIVideo.com, Revid.ai, Crayo.ai. Remotion cannot verify the figures | Market proof for prompt-to-short and caption tools; treat revenue as unverified |

The `/success-stories` index shows the million-dollars article itself; the archive lists the other four plus year groups.

## Expert-built products

The 22 expert pages are freelancer profiles. The products they name show real pipelines: AI video production orchestrating self-hosted TTS, an image API, SRT-driven subtitle timing and Ken Burns motion presets (book to video); AI video editors using vision/LLM analysis for highlights and Deepgram for captions; talking-head clip editors; caption apps (CapTok); personalised/automated templates; data-driven video with d3 (DataFlics); mock-up and product video SaaS; audio visualisations; social video generator; AWS deployment helpers (`remotion-sst`); custom video editors and rendering infrastructure. JAL does not hire from the list. Take the shapes: AI step makes structured data, SRT or caption JSON drives timing, Ken Burns presets give still images motion, Remotion renders. Cloud AI pieces (Gemini, Deepgram, TTS APIs) follow the paid-service rule.

## Apple fireworks tutorial

A beginner tutorial (2022-12-22, 17 min) that teaches composition by building small reusable motion wrappers. The techniques are the value:

- **Layered pure components:** `Background`, `Dot`, then wrappers `Shrinking` (scale out with `interpolate`), `Move` (a spring from 0 to 1 over about 4 s with a `delay` prop), `Trail` (clones children N times, each with more delay and a smaller scale), `Explosion` (clones children and rotates each by `(i / AMOUNT) * 2 * PI`), all stacked inside-out.
- **Order matters:** scale, then move, then delay.
- **Variants** by re-using the same wrappers with different leaf shapes and an offset (bigger radius plus a translate).
- **Time remapping:** a `Slowed` wrapper integrates a speed function (`interpolate` from speed 1.5 to 0.5 at frame 20) into a remapped frame and feeds it to `<Freeze frame>`, giving a slow-motion tail without changing the children.
- Last step uses an alpha-ProRes avatar clip over the animation (see `video-matting.md` for a modern WebM alpha route).

JAL change: the tutorial's hearts, stars and "animoji" are emoji. JAL swaps them for SVG shapes or `@remotion/shapes` so the no-emoji law holds, and a dark gradient background becomes a flat brand color. The tutorial source repo is linked from the page; the archive page lists this as the only tutorial.

## Showcase

`/showcase/` is rendered by JavaScript and returns no content to a plain fetch, so only the submission rules at `/showcase/add` were readable: title up to 80 characters with no emoji and no ALL CAPS; description up to 280 characters in neutral language about how Remotion was used; four optional links (video, source, website, tutorial); order reshuffles daily; upload is hosted by Remotion (Mux) and the entry is added as JSON via a GitHub edit. JAL does not publish to the showcase unless Brian asks (public posting needs his confirmation). A "Prompt Showcase" exists at remotion.dev/prompts (linked in the footer, outside this page set) as a gallery of agent prompts and results.

## Lambda page claims

Marketing for `@remotion/lambda` (AWS): an 80-second video rendered in 15 s, a 2-hour video in 12 min, concurrency up to 200x, cost from about $0.01 per minute (measured on warm ARM64 functions in us-east-1 with specific frames-per-lambda settings, S3 and transfer excluded). The idea worth keeping is that declarative React video can be split into frame ranges and rendered in parallel. JAL does not default to AWS (paid third-party cloud, ask Brian); the same split-and-concat design can be done on self-hosted workers, owned by the rendering reference.

## Release history

The blog is mostly release notes. Early notes describe the old Puppeteer/Chromium/FFmpeg pipeline. Today headless Chrome is still the server default, but **JAL's rule is no headless Chrome by default and prefer the browser (WebCodecs) renderer**; treat the old pipeline notes as history. Capabilities are owned by the core, rendering, player and cloud references; this table is the index so none is missed.

| Release | Date | Capabilities introduced |
|---|---|---|
| 1.1 | 2021-02-11 | Webpack override config, `<Img>`/`<IFrame>` that wait for load (delayRender), ESLint rule against native media tags |
| 1.2 | 2021-02-13 | JPEG frame rendering (2x faster), Windows support, company licensing becomes available, Discord opens |
| 1.3 | 2021-02-15 | Faster rendering (5.5x), plain JS support, config file, Easing API, padded PNG-sequence names |
| 1.4 | 2021-02-26 | HEVC and WebM (VP8/VP9), transparent video, `random(seed)` and why `Math.random` breaks renders, CRF/quality/pixel-format options, `<Sequence layout="none">`, async composition metadata, ESLint rule for imported assets |
| 1.5 | 2021-03-03 | No Chromium download, Apple Silicon and WSL fixes, render served from localhost (CORS-friendly) |
| 2.0 | 2021-04-15 | Audio (trim, align, volume curves), audio visualisation, mp3/aac/wav export, `@remotion/media-utils`, partial render `--frames` and stills, `<Gif>`, multi-point `interpolate`, `startFrom`/`endAt` (now `trimBefore`/`trimAfter`) |
| 2.1 | 2021-05-06 | `interpolateColors()`, `measureSpring()`, Player alpha |
| 2.2 | 2021-07-09 | Env variables, `<Freeze>`, `playbackRate`, `@remotion/three`, ProRes and MKV, Player controls/events, waits for web fonts |
| 2.3 | 2021-08-11 | `<Still>`, `remotion still`, `renderStill()`, Stills template, template chooser |
| 2.4 | 2021-09-27 | Studio toolbar, new-composition helper, `<Series>` |
| 2.5 | 2021-10-26 | In/Out markers, `<Loop>`, playback rates -4x to 4x, J/K/L keys, blank template, OTF fonts |
| 2.6 | 2022-01-05 | Player stable, `public/` and `staticFile()`, data URLs for media, Audiogram template |
| 3.0 | 2022-04-26 | Remotion Lambda, parallel render and encode, `renderMedia()`, `openBrowser()`, React 18 |
| 3.1 | 2022-07-14 | GIF output (`--codec=gif`), Tailwind, springs with durations, `<OffthreadVideo>`, `renderMedia()` buffer, `@remotion/preload` |
| 3.2 | 2022-08-10 | `@remotion/lottie`, `@remotion/skia`, zoomable timeline, `--muted`, audio-only speedups |
| 3.3 | 2022-11-17 | Auto-downloaded FFmpeg, `@remotion/google-fonts`, `@remotion/motion-blur`, `@remotion/noise`, `@remotion/paths`, `<Thumbnail>`, Player `inFrame`/`outFrame`, `prefetch()`, Lambda webhooks, large payloads, R2/Spaces output, `deleteRender()`, `remotion benchmark`, Remix template |
| 4.0 | 2023-07-03 | Studio, Zod-typed editable props, Render button, Rust binary with baked-in FFmpeg, faster `<OffthreadVideo>`, WebP and PDF stills, `calculateMetadata()`, `@remotion/rive`, `@remotion/shapes`, `@remotion/tailwind`, separate audio codec, 20 Lambda regions, ESM builds, font picker, `getStaticFiles()`, Cloud Run alpha |
| Studio deploy | 2024-03-05 | `bunx remotion bundle` exports Studio as a static site (deploy on a static host), render from a URL with `--props`, click a sequence to jump to source, deploy Studio to a server to keep the Render button |
| Faster Lambda | 2024-03-21 | Why audio, not video, was the slow part, and a seamless AAC concatenation method |
| Media Parser | 2025-05-20 | `parseMedia()` metadata and WebCodecs decoding, the remotion.dev/convert converter |
| Editor Starter | 2025-08-21 | Paid template for building a video editor (see `templates.md`) |
| Mediabunny | 2025-09-01 | Remotion sponsors Mediabunny ($1000 per month) and phases out Media Parser and `@remotion/webcodecs`; **Media Parser is deprecated since 2026-02-01, use Mediabunny** (MPL-2.0); expect faster `<Video>` and in-browser rendering built on it |
| Seed round | 2022-11-09 | CHF 180k raise; plans for higher-level components, UI elements, SaaS templates |
| First post | 2021-02-08 | Origin story: React instead of After Effects, Puppeteer + FFmpeg |

Blog index, archive and page 2 and 3 are lists of these same posts.

## Pages with nothing usable (reason)

- `/experts/<name>` profiles: personal marketing; patterns are summarised above.
- `/contact/`: licensing contact and Discord support pointers; contact Remotion only through Brian.
- `/search`: Algolia search widget, empty without script.
- `/learn/archive`, `/success-stories/archive`, `/blog/archive`, `/blog/page/*`: indexes.
- `/showcase/`: script-rendered gallery, empty to a fetch.
- `/templates/editor-starter`: empty page; facts from the blog post.

## See also: where each release capability is owned

The release table above is an index; the rules and APIs live in the owning files:

- Compositions, `<Sequence>`, `<Series>`, `<Loop>`, `<Freeze>`, `<Still>`, transitions: `../core/compositions.md`, `../visuals/transitions.md`.
- Timing, `interpolate`, `spring`, `interpolateColors`, `measureSpring`, Easing, `random(seed)`: `../core/timing-and-animation.md`.
- Audio, volume curves, media tags, `<OffthreadVideo>`, transparency, ProRes, HEVC, GIF output: `../core/media.md`, `audio.md`, `../web/media.md`, `../web/videos.md`, `lottie-gif.md`.
- Props, Zod-typed editable props, `calculateMetadata`, env variables: `../core/props-and-schemas.md`, `../visuals/zod-types.md`.
- `public/`, `staticFile()`, fonts, `@remotion/google-fonts`: `../core/assets-and-fonts.md`, `../visuals/fonts.md`.
- Player, `<Thumbnail>`, `@remotion/preload`: `../web/player.md`, `../web/thumbnail-and-preload.md`.
- Studio, Render button, Studio deploy, config file: `../rendering/studio.md`, `../rendering/config.md`, `../rendering/cli.md`.
- `renderMedia()`, `renderStill()`, stills, PDF and WebP, FFmpeg, the Rust binary: `../rendering/renderer-api.md`, `../rendering/server-runtime.md`, `../core/rendering-and-output.md`.
- Lambda, Cloud Run, Vercel: `../rendering/lambda.md`, `../rendering/lambda-ops.md`, `../rendering/cloudrun.md`, `../rendering/vercel.md` (each needs Brian).
- Client-side rendering and WebCodecs: `../web/web-renderer.md`, `../web/client-side-rendering.md`, `../web/webcodecs.md`, `../web/mediabunny.md`.
- Media Parser (deprecated, never installed): `../web/media-parser.md`.
- `@remotion/three`, `@remotion/skia`, `@remotion/lottie`, `@remotion/motion-blur`, `@remotion/noise`, `@remotion/paths`: `../visuals/canvas-skia-three.md`, `lottie-gif.md`, `../visuals/motion-blur.md`, `../visuals/noise-lightleaks-starburst.md`, `../visuals/shapes-paths.md`.
- Tailwind: `../visuals/tailwind.md`. Captions: `captions.md`. License and pricing: `../core/license-and-policy.md`, `../rendering/license.md`.
