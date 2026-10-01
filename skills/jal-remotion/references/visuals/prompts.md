# Prompt showcase

From:
- https://www.remotion.dev/prompts/
- https://www.remotion.dev/prompts/2
- https://www.remotion.dev/prompts/3
- https://www.remotion.dev/prompts/3d-retro-pixel-font
- https://www.remotion.dev/prompts/apple-style-device-rise-animation
- https://www.remotion.dev/prompts/audio-spectrum-visualizer
- https://www.remotion.dev/prompts/bar-line-chart-combined
- https://www.remotion.dev/prompts/bms-active-cell-balancing-animation-8s1p-pack-with-energy-flow-visualization
- https://www.remotion.dev/prompts/cinematic-tech-intro
- https://www.remotion.dev/prompts/cursor-agent-skills-announcement
- https://www.remotion.dev/prompts/glitch-effect-html-in-canvas
- https://www.remotion.dev/prompts/html-in-canvas-magnifying-glass
- https://www.remotion.dev/prompts/launch-video-on-x
- https://www.remotion.dev/prompts/music-cd-store-promo
- https://www.remotion.dev/prompts/news-article-headline-highlight
- https://www.remotion.dev/prompts/product-demo-for-presscut
- https://www.remotion.dev/prompts/promotion-video-for-vvterm
- https://www.remotion.dev/prompts/real-estate-investing
- https://www.remotion.dev/prompts/rocket-launches-timeline
- https://www.remotion.dev/prompts/shape-to-words-transformation
- https://www.remotion.dev/prompts/show
- https://www.remotion.dev/prompts/solar-system-orbit-animation
- https://www.remotion.dev/prompts/spinning-glitching-svg-logo-turned-3d
- https://www.remotion.dev/prompts/strava-run-visualized
- https://www.remotion.dev/prompts/submit
- https://www.remotion.dev/prompts/the-kinetic-marketing
- https://www.remotion.dev/prompts/threejs-top-20-games-sold-ranking-1
- https://www.remotion.dev/prompts/transparent-call-to-action-overlay
- https://www.remotion.dev/prompts/travel-route-on-map-with-3d-landmarks
- https://www.remotion.dev/prompts/vintage-screen-effect-html-in-canvas

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

The Remotion gallery of community prompts: 25 prompts across 3 gallery pages, each page showing the prompt, the coding agent and the model. Authors used Claude Code, OpenCode, Cursor and Gemini with the Remotion skills. The pages `/prompts/show` (a redirect page) and `/prompts/submit` (submissions disabled) hold no prompts.

## When a JAL agent uses it

As a brief library: JEV offers a prompt as a candidate shape for a piece (intro, explainer, data video, overlay, 3D) and the agent rewrites it with JAL tokens, fonts, assets and law. Prompts are community work; keep authorship in notes, do not paste them into client deliverables, and do not copy third-party brands, real people's likeness or unlicensed music.

## Patterns that recur (use them in JAL briefs)

- Start with "use remotion best practices" so the skills load.
- State resolution, fps and duration; give a timeline in seconds or frames.
- Keep it deterministic: no `Math.random()` (seed a function or use `random(seed)`), no CSS animations, no wall-clock.
- For open briefs ask for three variants first, then pick one and refine (Rocket Launches).
- For product demos let the agent interview you before building (Presscut).
- Refine in small turns: material, lighting, range of rotation, then export.
- Transparent output: render ProRes with alpha, or VP9 WebM with alpha for a site.
- Data in, picture out: GPX (Strava), JSON ranking (Three.js towers), OCR word boxes (news highlight), launch tables (rockets).
- Audio-reactive: use windowed audio data and low-frequency bands only if the piece must stay calm.
- Law filter for JAL: the community prompts often ask for gradient backgrounds, glow, glass panels, neon and purple. Those rows are brief-only or canvas-only below.

## Gallery index pages

- `/prompts/`: gallery page 1, 12 prompts.
- `/prompts/2`: gallery page 2, 12 prompts.
- `/prompts/3`: gallery page 3, 1 prompt.
- `/prompts/show`: /prompts/show, a redirect page with no content.
- `/prompts/submit`: /prompts/submit, submissions currently disabled.

## Meta of each prompt (author, tool, model)

| ID | Author | Tool | Model |
|---|---|---|---|
| `rm.prompt.3d-retro-pixel-font` | @GogHeng | Claude Code | Opus 4.6 |
| `rm.prompt.apple-style-device-rise` | @gaucho_booleano | Claude Code | Opus 4.5 |
| `rm.prompt.audio-spectrum-visualizer` | samohovets | OpenCode | Opus 4.5 |
| `rm.prompt.bar-line-chart-combined` | samohovets | OpenCode | Opus 4.5 |
| `rm.prompt.bms-cell-balancing` | pasrom | Claude Code | Opus 4.6 |
| `rm.prompt.cinematic-tech-intro` | @tiw_ari_ayu | Gemini | k2.5 |
| `rm.prompt.cursor-agent-skills-announcement` | @edwinarbus | Cursor | not stated |
| `rm.prompt.glitch-effect-html-in-canvas` | @remotion | Claude Code | Opus 4.7 |
| `rm.prompt.html-in-canvas-magnifying-glass` | @JNYBGR | Claude Code | Opus 4.7 |
| `rm.prompt.launch-video-on-x` | @ghumare64 | Claude Code | Opus 4.6 |
| `rm.prompt.music-cd-store-promo` | samohovets | OpenCode | Kimi K2.5 |
| `rm.prompt.news-article-highlight` | @Remotion | Claude Code | Opus 4.5 |
| `rm.prompt.product-demo-for-presscut` | @Shpigford | Claude Code | Opus 4.5 |
| `rm.prompt.promotion-video-for-vvterm` | @wiedymi | Claude Code | Opus 4.5 |
| `rm.prompt.real-estate-investing` | HarisShah2345 | Claude Code | Opus 4.5 |
| `rm.prompt.rocket-launches-timeline` | @crispynotfound | not stated | not stated |
| `rm.prompt.shape-to-words-transformation` | @tiw_ari_ayu | Gemini | k2.5 |
| `rm.prompt.solar-system-orbit` | @GogHeng | Claude Code | Opus 4.6 |
| `rm.prompt.spinning-glitching-svg-logo-3d` | @Remotion | Claude Code | Opus 4.5 |
| `rm.prompt.strava-run-visualized` | @JNYBGR | Claude Code | Opus 4.5 |
| `rm.prompt.the-kinetic-marketing` | @tiw_ari_ayu | Gemini | k2.5 |
| `rm.prompt.threejs-top-20-games-ranking` | @DilumSanjaya | Claude Code | not stated |
| `rm.prompt.transparent-cta-overlay` | @Remotion | Claude Code | Opus 4.5 |
| `rm.prompt.travel-route-map-3d-landmarks` | @JNYBGR | Claude Code | Opus 4.5 |
| `rm.prompt.vintage-screen-effect` | @JNYBGR | Claude Code | Opus 4.7 |

## Recipes

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.prompt.3d-retro-pixel-font` | 8 s square brand animation: colored cursors fly in, line up, then light up pixel blocks one by one to build two lines of text, subtitle types in. | div or SVG block grid with layered inset borders for the 3D feel, per-cursor timing with Sequence/interpolate/spring; no extra packages (inferred); the prompt uses purple, blue, pink, indigo cursors and a purple block palette, restyle to brand colors | T1 | video | F3 | brief-only |
| `rm.prompt.apple-style-device-rise` | 4 s keynote reveal: a large phone mockup rises from below with ease-out, perspective tilt settling from 35 to 8 degrees, scale 0.8 to 1. | CSS 3D transform on a div device (bezel, island, status bar), interpolate with Easing.out(cubic); no extra packages (inferred) | T1 | video | F3 | canvas-only |
| `rm.prompt.audio-spectrum-visualizer` | 32-bar audio spectrum synced to a track, bars reacting to bass, mids, highs, rounded tops, faint floor reflection. | visualizeAudio / useWindowedAudioData (@remotion/media-utils), <Audio>; configurable bar count, colors, width. Prompt asks magenta to cyan gradient and glow: brief-only, use flat brand colors otherwise | T3 | video | F3 | brief-only |
| `rm.prompt.bar-line-chart-combined` | Combined chart: bars grow in sequence, a conversion-rate line draws on with a pulsing dot at its tip, 120 frames. | SVG bars + path draw-on (rm.path.draw-on), spring timing; the prompt wants a glowing line on a dark navy field: drop the glow for JAL | T1 | video | F3 | canvas-only |
| `rm.prompt.bms-cell-balancing` | 10 s technical explainer of battery cell balancing: 8 cells, voltages converge, energy-flow particles, info panel. | SVG/DOM cells, smoothstep convergence, phase-based Sequence, spring panel; plain remotion only; full spec incl. setup and render command (inferred) | T1 | video | F3 | canvas-only |
| `rm.prompt.cinematic-tech-intro` | CEO introduction: giant pop-in name, cutout portrait with spring entrance and glitch skew, HUD panel, falling data streams. | spring + interpolate, clip-path cut-corner panel, rotating dashed rings, glitch via skew and hue-rotate; Google font Knewave; uses a real person's likeness and a brand green, never reuse the likeness; glassmorphism and glitch are brief-only | T2 | video | F3 | brief-only |
| `rm.prompt.cursor-agent-skills-announcement` | Announcement video: typewriter title cards, then a screen recording that zooms in continuously, end card clip. | typewriter at 1 char per frame (string slice by frame), Video clips from @remotion/media, easing zoom, hold times; the prompt follows another company's brand rules, use JAL's | T2 | video | F3 | fine |
| `rm.prompt.glitch-effect-html-in-canvas` | A composition run through a glitch shader. | <HtmlInCanvas> with a glitch effect or custom shader (rm.fx.custom-effect, rm.fx.chromatic-aberration, rm.fx.noise-displacement); Chrome flag in preview | T3 | video | F3 | brief-only |
| `rm.prompt.html-in-canvas-magnifying-glass` | A round magnifying glass sweeps across a line of text with slight refraction. | <HtmlInCanvas> + custom shader or fisheye()/barrel-distortion region (rm.fx.fisheye); animate lens center left to right | T3 | video | F3 | canvas-only |
| `rm.prompt.launch-video-on-x` | 37 s, 8-scene product launch for a desktop agent: terminal install, home, chat, provider switch, with music fades. | Series of scenes, terminal typing 1 char/frame, 3D tilt via rotateX, spring staggers, <Audio> with volume curve; app UI rebuilt in React; the named music track needs a licence check | T2 | video | F3 | canvas-only |
| `rm.prompt.music-cd-store-promo` | 30 s store promo: hook text, logo, count-up to 12,000, five sliding album cards, CTA, smoother section transitions, later audio-reactive. | Series, interpolateColors between sections, counter (rm.data.number-counter), card slide-ins, useWindowedAudioData for low-frequency reaction; the prompt uses orange gradient backgrounds: brief-only, use flat brand colors | T3 | video | F3 | brief-only |
| `rm.prompt.news-article-highlight` | Screenshot of an article on white: slow 3D tilt and zoom, blur-to-sharp, highlighter draws over key phrases. | tesseract OCR for word boxes, rough-notation Highlight behind the text (rm.annotate.highlight, rm.text.news-article-highlight), CSS 3D rotate, blur filter animated to 0 in 1 s | T1 | video | F3 | fine |
| `rm.prompt.product-demo-for-presscut` | Product demo: rebuild the app UI as React components and replay what a founder shows a customer. | interview-first workflow (agent asks many questions before building), UI replicas with cursor and click choreography, simple copy from the marketing page | T2 | video | F3 | fine |
| `rm.prompt.promotion-video-for-vvterm` | About 20 s Apple-presentation-style promo built from a product website's logo and details. | fetch site assets, nerd font + Inter pairing, spring-timed type reveals; check the font licence of any Nerd Font patched family | T1 | video | F3 | fine |
| `rm.prompt.real-estate-investing` | 15 to 30 s listing video from a raw clip: analysis, second-by-second plan, price reveal, location lower third with pin, counters, typography, cinematic grade. | staged prompt chain: clip analysis, timeline plan, motion graphics package, type system, cinematic enhancements; OffthreadVideo, captions, transitions, grade via rm.fx.color-correction; prompt mentions text shadow and glow: drop for JAL | T3 | video | F3 | canvas-only |
| `rm.prompt.rocket-launches-timeline` | Every SpaceX launch 2015 to 2025 as fading launch parabolas, minimalist, three variants first. | data to paths (quadratic arcs), trajectory fade, chronological counter; ask for three versions then refine (a good JEV pattern for open briefs) | T2 | video | F3 | fine |
| `rm.prompt.shape-to-words-transformation` | 10 s intro: row of colored shapes jumps, spins and morphs into the letters of a word, logo wipes across and erases them. | path morph (use rm.path.interpolate instead of the flubber library the prompt names), spring damping 14 for jumps and 300 for the wipe, ghost trail, filled shapes only, light grid background | T1 | video | F3 | fine |
| `rm.prompt.solar-system-orbit` | 30 s, 1080p orbital motion of 8 planets over one year, moon, Saturn rings, labels. | deterministic star field from a seeded function (use random(seed) from remotion, never Math.random), J2000 orbital elements, linear then log2 radius compression, SVG/canvas; radial-gradient planets and glow halos are canvas-only | T2 | video | F3 | canvas-only |
| `rm.prompt.spinning-glitching-svg-logo-3d` | SVG logo extruded to 3D with a metallic material, swing -90 to 90 degrees, glitch post effect, transparent export. | @remotion/three ThreeCanvas, SVG to extruded geometry, metallic material and lighting tuned over several turns, react-postprocessing Glitch made deterministic, transparent video per the transparent-videos doc | T4 | video | F3 | brief-only |
| `rm.prompt.strava-run-visualized` | Story-format video of a run: map, animated route, live metrics from a GPX file. | parse GPX, route path draw-on (rm.path.draw-on, rm.path.follow), map tiles, large legible type for 9:16 stories | T3 | video | F3 | fine |
| `rm.prompt.the-kinetic-marketing` | Fast kinetic typography promo timed to 140 BPM: words crash in and push others, iris wipes, ring tunnels, floating 3D logos with depth-of-field. | spring layout push, iris()/clock-wipe transitions (rm.transition.iris), radar rings (rm.fx.rings), 3D logos in ThreeCanvas; aurora glass gradients and pastel pink/lavender are brief-only; third-party logo marks are trademarks | T3 | video | F3 | brief-only |
| `rm.prompt.threejs-top-20-games-ranking` | Vertical 3D tower of the top 20 best-selling games, camera climbs from rank 20 to 1 with pauses, 60 fps. | @remotion/three ThreeCanvas, box heights from data, keyframed camera, chromium gl angle | T4 | video | F3 | canvas-only |
| `rm.prompt.transparent-cta-overlay` | Lower third that slides up with avatar, subscriber count and a Subscribe button that presses to Subscribed, rendered with alpha. | spring bounce on release, ease-out press, fade out; render ProRes with alpha (or VP9 WebM alpha for a website); related rm.yt.subscribe-nudge | T1 | video | F3 | fine |
| `rm.prompt.travel-route-map-3d-landmarks` | Map zooms out of one city, a line draws to the next, camera follows, third stop with a 3D landmark. | map renderer + route path draw-on + camera follow (rm.map.flyover, rm.path.follow), landmark in ThreeCanvas | T4 | video | F3 | canvas-only |
| `rm.prompt.vintage-screen-effect` | Subtle CRT convex screen over an animated terminal typing a create-video command. | <HtmlInCanvas> + barrelDistortion() with scanlines() or a custom shader (rm.fx.barrel-distortion, rm.fx.scanlines); terminal typewriter DOM | T3 | video | F3 | brief-only |
