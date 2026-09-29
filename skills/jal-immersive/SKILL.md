---
name: jal-immersive
description: The JAL expert layer for immersive and 3D websites, owned by the jal-immersive agent and the /jal-ui command in immersive mode. Covers when immersion earns its place, the three-zone law profile (full JAL law on the page and UI, natural lighting inside a canvas, the noyzzi exemption inside a data-jal-exempt="noyzzi" section), the 11-step immersive workflow with its JEV decisions (imm.gate, imm.recipe, imm.tech, imm.tier, motion.intensity, motion.choreography, motion.pin, imm.taste, ui.finish_disposition, ui.direction_screen), the combined recipe pool (noyzzi sections, hover effects and 3D elements, clean-room effects, Three.js patterns, magicui and animata recipes, GSAP choreography, the JAL frame core), poster-first loading, Bun.build wiring for three, and verification with ui_audit, screenshots, frame-time sampling, and forced context loss. Use for any immersive website, 3D website, WebGL, WebGPU, Three.js, React Three Fiber or R3F, drei, shader, GLSL, TSL, particles, GPGPU, scroll animation, scroll-driven camera, hero animation, image hover effect, awwwards-style site, noyzzi section, or a request to redesign an existing site as immersive.
---

# JAL Immersive: world-class 3D and immersive websites under JAL law

The job: build immersive sections that make a message obvious, on a white-first page, at 60 fps on the visitor's real device, with a poster that stands in whenever the GPU cannot. Immersion is a tool for understanding, never decoration. JEV judges every soft call; no single source (noyzzi included) is "the" answer.

Read order before building: `jal-standards` (law), `jal-ui-taste` (tokens, craft floor, seeded direction pick, direction contract), `jal-design-system` (JAL Core), `jal-motion` (motion tokens and law), then this skill and the references below that the section needs.

References (this skill):

| File | Holds |
|---|---|
| `references/three-foundations.md` | Renderer setup, the white-background tone-mapping trap, WebGL vs WebGPU/TSL, the `three/webgpu` alias plugin, lazy `import()`, the Bun.build asset pipeline and self-hosted decoders, disposal, context and device loss, version pins |
| `references/r3f.md` | R3F architecture, `useFrame` rules, frameloops and `advance()`, instancing, events, drei helpers, `View`, Suspense, performance monitoring |
| `references/shaders.md` | GLSL and TSL craft: noise, SDFs, domain warping, fresnel, matcaps, dithering, grading, cover-UV image hover, full-screen quads |
| `references/effects-cleanroom.md` | Window rain, wet puddles, deformable sand or snow, wind grass, ocean: clean-room rebuilds with licenses |
| `references/particles-physics.md` | Points, instanced, GPGPU and WebGPU compute particles, nixie-fx and Rapier (approved, JEV-picked), boids, game-loop patterns, interaction |
| `references/performance.md` | Budget table, device tiers for `imm.tier`, fallbacks, the verification method, page shell and media budgets |
| `references/procedural-geometry.md` | Generated products, architecture, and kits: plan then emit, operations, profiles and sweeps, joins, normals and winding, audits, LOD |
| `references/coverage.md` | Per-repo coverage audit of the eight immersive references: what JAL holds where, what was added, what was excluded and why |
| `references/scroll-choreography.md` | Lenis plus ScrollTrigger choreography, pinning, scrub, SplitText, Flip (written by W-motion) |
| `references/frames.md` | The JAL frame core (`FrameProvider`, `Sequence`, `Player`) for live demo compositions (written by W-motion) |
| `references/noyzzi.md` | The noyzzi index, taxonomy, tool usage, code review rules (Lead) |
| `skills/jal-motion/references/components.md` | magicui and animata recipes (R01 to R44 plus any added later, written by W-comp) |

## 1. When immersion earns its place

From: JAL-authored (Brian's immersive rulings, `jal-motion` scope law).

Immersion is earned when at least one of these is true of the section's one message:

1. **Form carries it.** Shape, material, scale, or assembly is the point, and a still loses it (a product object, an architecture model, a mechanism).
2. **Viewpoint carries it.** The visitor must rotate, configure, or explore to understand (configurators, spatial tours).
3. **Continuous change carries it.** The message is a transformation over scroll: assembly, rotation to reveal, a path through space, before and after.
4. **Brand signature.** One composed, calm moment that becomes the brand's recognisable mark, used once per page, usually the hero.
5. **Interaction is the message.** A playful toy that demonstrates the product's character, where touching it is the proof.

Not earned, never immersive (hard precheck, no JEV call):

- Product UI chrome, app screens, forms, tables, dashboards, settings, docs, pricing tables, legal. 3D belongs to showcase and marketing sections only (`jal-motion`).
- Decoration: the section reads the same if the scene is replaced by its poster.
- Content that must be read fast (announcements, error or status copy, checkout).
- A second cinematic section on a page that already has one: at most one tier-3 (`motion.intensity` 3) section per page.

Page-level budget, before any section is gated: one WebGL canvas per page (more regions go through drei `View`), at most two clean-room effects in one mobile viewport, and every immersive section ships a poster plus a DOM text equivalent of whatever the scene says.

## 2. Law profile: three zones, one set of mechanical rules

From: JAL-authored (JAL law, Brian's canvas and noyzzi rulings, the Bun-only stack); noyzzi (flags); nixie-fx (peer range); Threejs-Awesome-Graphics-Agent-Skills and threejs-game-skills (the glow, bloom, and additive recipes the Zone B bans answer); three.js docs (tone mapping).

### Zone A: the page and UI (full JAL law)

Everything outside a canvas and outside a noyzzi section: white, off-white, or light beige page (`--color-page`), no CSS gradients of any kind, no blurred shadows (spread-only focus ring is the one exception), no glow, no neon, no emoji, no em-dash, no eyebrow labels, no purple, violet, or indigo, no side stripes or accent bars, no decorative lines or marker dots, no overlap, nothing outside its box, one 44px control height, the mobile app-shell below 640px, one accent at about 3% of the surface. This includes the canvas element's own CSS: no gradient or shadow on it, no dark fill behind it.

### Zone B: inside a JAL canvas, 3D or 2D (natural lighting exemption)

Allowed inside a JAL-authored canvas: physically plausible light and shade. PBR shading, soft shadows and contact shadows, specular highlights, refraction and reflection, tonal falloff across a surface, depth haze matched to the page white, texture and material detail, natural daylight or studio colour.

Still banned inside the canvas, unless the piece comes from noyzzi:

- Bloom, glow, emissive halos, additive rim light, lens flare, god rays, sparkles or `<Sparkles>`/`<Stars>`.
- Neon palettes (`0xff00ff`, `0x00ffff`, `0x18e0ff` style saturates) and every purple, violet, or indigo hue.
- Chromatic aberration, glitch, scanlines, CRT, pixelation, heavy vignette.
- A painted dark background, or a full-bleed smooth colour field (a 3D sky gradient is a gradient).
- Additive blending for particles (invisible on white, glow on dark).

The page white must show through: transparent canvas (`alpha: true`, `scene.background = null`) over the DOM page, never a WebGL-painted background. Tone mapping maps 1.0 white to `#F0F0F0` (Neutral) or `#E2E2E2` (ACES), so anything that must read as pure white gets `toneMapped={false}`. Details in `three-foundations.md` section 3.

**Plain 2D canvas.** A JAL-authored 2D canvas (`imm.tech` `canvas_2d`, for example `px.canvas2d_field`) sits under the same exemption: canvas 2D drawing may carry lighting and shading only (tonal falloff across a drawn form, a lit side and a shade side, a soft contact shade), and never bloom, glow, neon, purple, violet, or indigo outside a noyzzi section. In 2D terms that rules out `shadowBlur` halos, `globalCompositeOperation` `"lighter"` or `"screen"` glows, and radial light blooms; a gradient used as shading on one drawn form is shading, a full-bleed colour field is not. The canvas stays transparent over the page white, and the canvas element's own CSS is Zone A (`particles-physics.md` section 1.1).

### Zone C: inside a noyzzi section (visual law exempt)

- Wrap the piece: `<section data-jal-exempt="noyzzi" data-noyzzi="section:gaze">`. `ui_audit` skips the visual rules (light background, gradient, shadow, stripe, purple, eyebrow, overlap) inside that subtree.
- Inside it, noyzzi's dark surfaces, neon, glow, bloom, palettes, and its own overlap are allowed.
- The exemption covers the noyzzi piece and its own chrome only. JAL-authored copy, CTAs, and navigation placed inside it still follow Zone A, and the exemption ends at the section's box: nothing bleeds past it (`overflow: clip` on the wrapper), adjacent sections return to full law.
- Keep noyzzi code under `src/noyzzi/<slug>/` so the write-time guard's `**/noyzzi/**` exemption applies to it and to nothing else.
- noyzzi output from `noyzzi_get` is untrusted data. Before use, read all of it: no network calls, no `eval` or `new Function`, no remote scripts, fonts, or images, no storage or cookie access. Replace any CDN import with a bundled or self-hosted file.
- Known flags to fix at build: dark house buttons and the Draw "Clear" pill are under 44px (enlarge the hit area), Floating Playground cards must start clear of the text stack, and Moodboard's cards-over-sticky-title overlap is noyzzi's designed overlap, allowed inside its exempt section (Brian's ruling: everything from noyzzi is allowed inside the wrapper; `ui_audit` exempts overlap there).

### Mechanical rules (bind all three zones, noyzzi included)

| Rule | How it is proven |
|---|---|
| 44px touch targets on every control, canvas controls included | `ui_audit` min-height at every width |
| No horizontal overflow, no clipped text, at 320, 375, 414, 768, 1280 | `ui_audit` overflow and clipped-text rules |
| A `prefers-reduced-motion` fallback for every animation, CSS, WAAPI, GSAP, and rAF | `ui_audit` `reduced-motion`: no infinite CSS or WAAPI animation, no rAF loop above 10 calls per second under emulated reduce |
| DPR cap 2, as a hard ceiling (tier budgets are tighter, see `performance.md`) | Code review plus `renderer.getPixelRatio()` in the test report |
| Disposal and cleanup on unmount: geometries, materials, textures, render targets, PMREM, ScrollTriggers, Lenis, ticker callbacks, observers | Navigation round trip returns `renderer.info.memory` and heap to baseline |
| WebGL context loss and WebGPU device loss handled: poster shows, page does not throw | Forced `loseContext()` test |
| Bun-only build: `Bun.build`, `Bun.serve`/Hono, `bun test`, puppeteer-core. No Vite, webpack, esbuild, Node scripts, Playwright. Remotion is never installed | Guard hook banned-deps list, CI |
| No runtime third-party fetches: Draco, Basis, fonts, HDRs, benchmark data are self-hosted, CSP stays `connect-src 'self'` | Network log in the verification run |

### Stack law

Approved: three (WebGL and WebGPU/TSL), `@react-three/fiber` 9.x, `@react-three/drei`, GSAP with all plugins and `@gsap/react` (part of GSAP), Lenis, Framer Motion, Tailwind through `bun-plugin-tailwind` wired to JAL tokens, CSS and WAAPI, OriginKit motion patterns (check originkit.dev before hand-rolling a pattern, per `jal-standards`; the ported result still follows JAL law), and, approved by Brian for immersive work:

- **`nixie-fx`**: usable whenever JEV (`imm.tech`, `imm.recipe`) picks it and the rules hold. Its peer range (`three >=0.184.0 <0.186.0` at 0.1.16) means either pin three to that range for the app or skip nixie-fx when the page needs a newer three; `imm.tech` weighs that trade. Outside noyzzi sections: neutral palettes and `blend: "alpha"` only (`particles-physics.md` section 8).
- **Rapier** (`@react-three/rapier` or `@dimforge/rapier3d-compat`): usable whenever JEV picks it and interaction is the message. The WASM is served through Bun.build's file loader (or the compat build's inlined WASM), with the 3D CSP additions already in `three-foundations.md` section 7.3 (`'wasm-unsafe-eval'`, `worker-src 'self' blob:`) (`particles-physics.md` section 9).

Approval candidates, documented but never a default until Brian says yes (**ask Brian**: he approves quickly; route through `be.new_tech` and jal-principal and record the ADR): `@react-three/postprocessing` and `postprocessing`, `@gltf-transform/*` plus `meshoptimizer` (dev only), the native `ktx` CLI and `sharp` (dev only), `cobe`, `three-custom-shader-material`, `three-bvh-csg`, `r3f-perf` and `leva` (dev only), `cannon-es`, direct imports of drei's transitive deps (`maath`, `zustand`, `three-mesh-bvh`, `camera-controls`), `detect-gpu`, `@theatre/core`, Rive and dotLottie runtimes, PixiJS. Never: Remotion, `@theatre/studio` (AGPL), LYGIA, The Book of Shaders code, Shadertoy code, OGL, curtains.js, `framer-motion-3d`.

Note for every R3F project: R3F 9 needs React `>=19 <19.4`. The JAL template ships React 18.3, so an R3F section means bumping `react` and `react-dom` to 19.x below 19.4 in that app (record it in the ADR).

## 3. The 11-step workflow

From: JAL-authored (JEV workflow); threejs-game-skills (`game-director` scope from the request, continuity file, representative scene first, greybox); Threejs-Awesome-Graphics-Agent-Skills (per-scene visual contract).

Every soft call below goes through `jev_decide` with the catalog question. Run each entry's precheck first; never ask JEV what the law or a precheck already decides. Log every decision (ID, answer, confidence, action) in the build report; stamp `UNVERIFIED BY JEV` on any outage fallback.

**The build report is the continuity file:** one living file per page (for example `docs/immersive/<page>-build.md`) holding intent and constraints, a link to the direction contract, the JEV decision log, completed work, pending external jobs with their IDs, open defects, and next actions. Re-read it after any interruption. A correction updates the affected entries and pending work instead of restarting; completed assets are kept and obsolete pending ones marked obsolete. Captures, metrics, the scorecard, and the capture manifest live there; the final chat answer stays short and links to it.

1. **Brief, visitor mode, direction.**
   - **Scope from the request's own words.** "Polish", "premium", "showcase", or "less basic" means the current visual level was rejected: run all 11 steps and the section scorecard (section 7). A fix to one section is a narrow edit: keep the direction, recapture only the affected sections at 375 and 1280, rerun `ui_audit` (cheap, always), re-score only the categories touched. A full pass only when shared pieces changed (canvas, clock, tokens, the poster pipeline). Evidence from the same revision is reused; a check repeats only after a relevant change, a failure, or an open concern.
   - Restate goal, constraints, and done-when. Name the visitor mode: `explore` (first-time visitor with time), `task` (returning visitor who wants to get somewhere), or `mixed`. Task mode caps immersion at the hero.
   - Direction by the seeded pick in `jal-ui-taste`: write 5 to 7 direction candidates from the audience's world, screen each with `ui.direction_screen` (slop `noul` plus fit `score`), then a deterministic seeded pick among the survivors ranked 3 to 7. Never rank-pick the top one.
   - Write the direction contract before code (audience, job, direction, type personality, accent role, density, motion intensity) plus the immersive addendum: the page's one 3D role, surface per section (paper or a contained noyzzi dark moment), target device tiers, and the DOM text equivalent of each scene.
   - Per scene, a visual contract: the subject and its real size in metres, the unit convention (one conversion from source units, done once at load), camera distance and lens per beat, motion per beat, and the frame budget from `performance.md` section 1. Nothing else in the scene carries its own scale factor.
2. **Section concepts.** For each section: job, one message, primary action, the beats a visitor should notice, and its section kind from the pool (section 4). A section with no job is deleted. Non-immersive sections follow the `/jal-ui` loop (`ui.region_gate`).
3. **Per section, `imm.gate` then `imm.recipe`.** Gate first (does it earn immersion at all, and if it is a noyzzi 3D element, does the object carry meaning and where does it sit). Only gated sections get `imm.recipe`, a `choice` over that section's assembled candidates for the base recipe (section 5). Then the section grows one layer at a time (`layer_1`, `layer_2`, and so on, no fixed limit, per Brian): each proposed layer fills a role the stack does not have yet, JEV keeps it only at 0.6 or above, and growth stops at the first no or at the tier, budget, or mechanical limit. The protocol lives in `skills/jal-design-system/references/recipe-index.md`. The agent never picks from the pool by taste alone.
4. **`imm.tech`.** Per gated section: `css_dom`, `canvas_2d`, `webgl`, or `webgpu_tsl` (with a WebGL2 fallback), plus the integration `stack` (`vanilla_three`, `r3f`, or `r3f_views`). The lightest technique that delivers the recipe wins. The same ID runs a second, post stage after the first captures (step 10).
5. **`imm.tier`.** Per device class, `full`, `reduced`, or `static`, against the budget table in `performance.md`. Planning uses the recipe's cost tier; the binding call uses measured numbers from a real GPU.
6. **Poster first.** The static poster renders before any WebGL. It is the LCP element, the no-WebGL state, the reduced-motion state, the low-power state, and the failure state (section 6).
7. **Build.**
   - **Representative beat first.** Block the section out with grey primitives at true scale inside the real layout at 375 and 1280 (framing, subject size, scroll length, beat timing, while changes are cheap). Then bring one beat to full fidelity (real or authored object, material roles, lighting, contact shadow, poster, reduced-motion still), capture and score it, and only then author the remaining beats. Object and beat counts follow the concept, never a quota.
   - three and every scene chunk load lazily through dynamic `import()` with `splitting: true` in Bun.build.
   - The build script copies Draco and Basis decoders into `dist/vendor/r<three>/` and every drei CDN default is overridden (`three-foundations.md` section 7).
   - One clock: Lenis (`autoRaf: false`) and R3F (`frameloop="never"` plus `advance()`, or `demand` plus `invalidate()`) are driven from `gsap.ticker`, with `lagSmoothing(0)` (`r3f.md` section 3).
   - Every object is disposed on unmount, WebGL context loss and WebGPU device loss swap to the poster (`three-foundations.md` sections 8 and 9).
   - noyzzi pieces: `noyzzi_get` (sections and elements live; effects return their URL for a human to paste, or build the JAL-native `three.img_hover` instead), code review per Zone C, then wrap in the exempt section.
8. **Motion.** `motion.intensity` (0 still to 3 cinematic, one tier-3 per page), `motion.choreography` (reveal, stagger_sequence, scrub, pinned_sequence, horizontal_track), `motion.pin` (only for pinned or horizontal picks). Recipes and wiring in `references/scroll-choreography.md`. 3D-specific prechecks: one smoother per signal (Lenis or numeric scrub or damp, never two); mobile touch never scrubs a pinned 3D section longer than 200% of the viewport, it downgrades to triggered beats; reduced motion shows authored stills swapped by a crossfade of 150ms or less.
9. **Self-check, then `ui_audit`.** Re-read every file written against Zone A, the canvas bans, the mechanical table, and disposal. Then `ui_audit` (19 rules plus `reduced-motion`) at 320, 375, 414, 768, and 1280. Fix and rerun until PASS; SKIPPED is not PASS.
10. **Screenshots at 375 and 1280**, with the poster, and with the live scene when a real GPU is available (renderer string recorded, never SwiftShader). Capture each authored beat, a reduced-motion run, and a no-WebGL run. Sample frame time. Then the `imm.tech` post stage: the smallest post stack that fixes a problem the captures show (default none).
11. **`imm.taste`, then `ui.finish_disposition`.** `imm.taste` scores the built section, confirms the scene is worth its cost over the poster (`keep`), and scores motion calm. Then a fresh-context reviewer gives `ui.finish_disposition` (ship, fix, rebuild, recapture). At most two fix rounds; after that, report what remains.

## 4. The combined recipe pool

From: noyzzi (4.1 to 4.3); JAL-authored clean-room rebuilds (4.4); three.js and drei docs (MIT), Threejs-Awesome-Graphics-Agent-Skills, webgpu-claude-skill, threejs-game-skills (4.5); Magic UI and animata (MIT) through `jal-motion` (4.6); gsap-skills (4.7); remotion ideas only, JAL-native core (4.8); ai-dev-kit (cost tiers).

Each recipe carries: an ID, its section kind, source and license, surface, cost tier, mobile fallback, and law note, plus, when it is built, the invariant that keeps it from degrading and the debug view that proves it. Every fallback names which mechanism it keeps. The pool is the only place candidates come from.

**Cost tiers** (GPU time per frame at the tier pixel budget, on a real GPU):

| Tier | Meaning |
|---|---|
| C0 | DOM, CSS, SVG, WAAPI, GSAP on DOM. No canvas |
| C1 | 2D canvas or a light WebGL pass, under 1 ms |
| C2 | A standard WebGL or WebGPU scene, 1 to 2.5 ms |
| C3 | Heavy: an extra scene pass (reflector), GPGPU, compute, or over 2.5 ms |

**Law notes:** `full` (Zone A everywhere), `canvas` (Zone B inside the canvas), `noyzzi` (Zone C, followed by the index's flags: `dark`, `neon`, `glow`, `purple`, `gradient`, `shadow`, `lines`, `eyebrow`, `none`). noyzzi cost tiers are estimates by type; re-tier after reading the code from `noyzzi_get`.

**Section kinds:** `hero`, `gallery_hover`, `object_showcase`, `story`, `environment`, `particles`, `text_motion`, `strip`, `data_viz`, `demo`, `transition`, `toy`.

### 4.1 noyzzi sections (30), `noyzzi_get` kind `section`

Hero types from the taxonomy: paper field, scroll scene, 3D object, kinetic type, dark generative field. Types marked (inferred) are not in the taxonomy and were assigned by kind.

| ID | Kind (type) | Surface | Cost (est.) | Mobile fallback | Law note |
|---|---|---|---|---|---|
| `nz.section.gallery-carousel` | hero, gallery (3D object) | light paper | C2 | swipe row of images, 44px prev/next | noyzzi: none (lightbox backdrop blur) |
| `nz.section.perspective-cube` | object_showcase (inferred) | dark | C2 | poster | noyzzi: dark, purple, glow |
| `nz.section.particle-field` | hero (dark field) | dark | C2 | poster | noyzzi: dark, eyebrow |
| `nz.section.kinetic-type` | hero, text_motion (kinetic type) | dark | C1 | static set type | noyzzi: dark, eyebrow, lines |
| `nz.section.parallax-layers` | story (inferred) | dark | C1 | stacked still layers | noyzzi: dark, eyebrow, lines |
| `nz.section.sine-currents` | hero (dark field) | dark | C1 | poster | noyzzi: dark |
| `nz.section.geometric-order` | hero (dark field, inferred) | dark | C1 | poster | noyzzi: dark, eyebrow |
| `nz.section.magnetic-field` | hero, toy (dark field, inferred) | dark | C1 | poster | noyzzi: dark, eyebrow |
| `nz.section.digital-decay` | hero (dark field, inferred) | dark | C1 | poster | noyzzi: dark, neon, gradient |
| `nz.section.spotlight` | hero (inferred) | dark | C1 | revealed still | noyzzi: dark, eyebrow, gradient |
| `nz.section.waveform` | hero (dark field) | dark | C1 | poster | noyzzi: dark, neon |
| `nz.section.ascii-art` | hero (dark field) | dark | C1 | poster | noyzzi: dark, eyebrow, lines |
| `nz.section.noise-terrain` | hero (dark field) | dark | C2 | poster | noyzzi: dark, eyebrow |
| `nz.section.cinematic-reel` | story, gallery (inferred) | dark | C1 | static frames list | noyzzi: dark, eyebrow |
| `nz.section.type-mask` | hero (kinetic type) | dark | C1 | static set type | noyzzi: dark, eyebrow |
| `nz.section.visual-board` | gallery (inferred) | dark | C1 | image grid | noyzzi: dark, eyebrow, shadow |
| `nz.section.starfield-warp` | hero (dark field) | dark | C2 | poster | noyzzi: dark, eyebrow |
| `nz.section.word-rotator` | hero, text_motion (kinetic type) | dark | C0 | static first word | noyzzi: dark, eyebrow, lines, glow, gradient |
| `nz.section.floating-playground` | toy (inferred) | dark | C1 | static arranged cards clear of text | noyzzi: dark, eyebrow, shadow |
| `nz.section.terminal` | text_motion, demo (inferred) | dark | C0 | all lines shown | noyzzi: dark, neon, glow |
| `nz.section.magnetic-scatter` | hero (kinetic type) | light dusty pink | C1 | static set type | noyzzi: none |
| `nz.section.flaming-hot` | hero (dark field) | dark | C2 | poster | noyzzi: dark, neon, glow |
| `nz.section.cosmic-dust` | hero, particles (dark field) | dark | C2 | poster | noyzzi: dark, neon |
| `nz.section.moodboard` | gallery | white | C1 | image grid | noyzzi: shadow, gradient (hover sheen), designed overlap (allowed inside the exempt box) |
| `nz.section.helix-portfolio` | hero, gallery (3D object) | light paper | C2 | vertical list of work | noyzzi: none |
| `nz.section.gaze` | hero (paper field) | light paper | C1 | poster | noyzzi: none |
| `nz.section.loom` | hero (paper field) | light paper | C1 | poster | noyzzi: none |
| `nz.section.ink-drift` | hero, story (paper field, scroll scene) | light slate paper | C1 to C2 | poster | noyzzi: none |
| `nz.section.veil` | hero, story (scroll scene) | light paper | C2 | poster | noyzzi: purple (periwinkle, lilac blobs) |
| `nz.section.draw` | hero, toy (paper field) | light paper | C1 | poster, drawing on tap still works | noyzzi: gradient (canvas vignette); Clear pill under 44px |

Best fits for a white-first JAL page: Gallery Carousel, Moodboard, Helix Portfolio, Gaze, Loom, Ink Drift, Veil, Draw, Magnetic Scatter. Dark pieces are a contained dark moment inside their section, chosen only through JEV (`imm.recipe` `surface`).

### 4.2 noyzzi image hover effects (22), kind `gallery_hover`

`noyzzi_get` returns the effect URL only: a human pastes the code, or build `three.img_hover` natively. Every effect lacks reduced-motion handling: add a static frame (the plain image) under reduce. Touch has no hover: the fallback is the plain image, no tap-triggered distortion. Cost C1 (est., one image-plane shader).

| ID | Family | Law note |
|---|---|---|
| `nz.fx.calm-distort` | calm | none |
| `nz.fx.liquid-pool` | calm | none |
| `nz.fx.saturation-focus` | calm | none |
| `nz.fx.halftone-print` | calm | none |
| `nz.fx.duotone-wash` | editorial grade | purple (indigo shadow) |
| `nz.fx.burn-focus` | editorial grade | glow |
| `nz.fx.negative-reveal` | editorial grade | none |
| `nz.fx.ripple-bloom` | expressive | none |
| `nz.fx.orbital-swirl` | expressive | none |
| `nz.fx.liquid-trail` | expressive | none |
| `nz.fx.chrome-ripple` | expressive | none |
| `nz.fx.kaleido-mirror` | expressive | none |
| `nz.fx.prism-hover` | expressive | purple (spectral fringe) |
| `nz.fx.glitch-shift` | loud | neon (RGB fringe) |
| `nz.fx.pixel-dissolve` | loud | none |
| `nz.fx.thermal-scan` | loud | neon (false colour) |
| `nz.fx.holo-shift` | loud | purple (full spectrum) |
| `nz.fx.crystal-shatter` | loud | glow (edge light) |
| `nz.fx.sonar-pulse` | loud | neon, glow |
| `nz.fx.starburst` | loud | glow |
| `nz.fx.flower-bloom` | loud | none |
| `nz.fx.heart-burst` | loud | glow |

Pairings from the taxonomy: paper heroes pair with calm or editorial-grade hovers; dark field heroes pair with expressive or loud hovers; an object showcase pairs with at most one calm hover elsewhere on the page. A noyzzi effect with a law note other than `none` sits inside a `data-jal-exempt="noyzzi"` gallery section.

### 4.3 noyzzi 3D elements (26), kind `object_showcase` (or `hero` 3D object)

One element per section, as a product or brand mark, on its studio colour or on the page colour. Cost C2 (est.). Mobile fallback: poster of the element at its design angle. Only Shards and Voxel are interactive.

| ID | Law note | ID | Law note |
|---|---|---|---|
| `nz.el.ring` | purple (lavender wash) | `nz.el.prism` | dark studio, glow |
| `nz.el.knot` | none | `nz.el.cloud` | dark studio |
| `nz.el.mochi` | purple (lilac zone) | `nz.el.cursor` | none |
| `nz.el.coral` | none | `nz.el.fuzz` | none |
| `nz.el.orb` | purple (violet core) | `nz.el.crystal` | dark studio |
| `nz.el.star` | purple (hue sweep) | `nz.el.bolt` | purple (violet kicks) |
| `nz.el.heart` | purple (foil hues) | `nz.el.blossom` | none |
| `nz.el.cube` | dark studio | `nz.el.wave` | none |
| `nz.el.spark` (AI Spark) | glow (additive core) | `nz.el.shards` | purple (violet kicks), interactive |
| `nz.el.flower` | none | `nz.el.voxel` | none, interactive |
| `nz.el.smiley` | purple studio | `nz.el.book` (Grimoire) | purple studio |
| `nz.el.terrace` | none | `nz.el.shades` | none |
| `nz.el.squiggle` | none | `nz.el.melt` | purple (lavender) |

Elements with `none` can sit on the page white with a transparent canvas and still read as JAL-native; the rest need the exempt wrapper.

### 4.4 Clean-room effects (JAL-authored, `references/effects-cleanroom.md`)

| ID | Kind | Surface | Cost desktop / mobile | Mobile fallback | Law note |
|---|---|---|---|---|---|
| `cr.window_rain` | hero, environment | daylight scene behind glass | C2 (1.5 ms) / C2 (2 ms) | one static layer, 12 sliders, pre-blurred background; lowest tier WebP poster | canvas: specular from lighting, no bloom |
| `cr.wet_ground` | environment | grey asphalt, pale sky | C3 (3 ms with reflector) / C1 (1 ms env only) | no reflector, one ripple layer, no wave grid | canvas: neutral, never neon night city |
| `cr.deform_sand_snow` | toy, environment | bright sand or snow | C1 (0.8 ms) / C1 (0.5 ms) | stamp only, no relax; lowest tier pooled decals | canvas: snow shade is neutral grey-blue, never purple |
| `cr.wind_grass` | environment | daylight greens | C3 (3 ms, vertex bound) / C3 (2.5 ms) | 3-segment blades, flutter off, or cross-quad clusters | canvas: backlight done in shading, no bloom |
| `cr.ocean_snell` | environment, story | bright shallow sea | C2 to C3 (2.5 ms) / C3 (3 ms) | 3 waves, depth tint only, no caustics | canvas: pale sea fog `#8fc7c9`, no dark abyss |
| `cr.procedural_tree` | environment, object_showcase | one hero tree, flowers, or ivy in daylight | C2 / C2 | halved leaf cards and radial segments, whole-tree wind only | canvas: natural greens and bark, haze to page white |
| `cr.touch_frost` | toy, hero | fogged pane over a light scene | C2 (about 1 ms) / C2 (1.5 ms) | blur without refraction | canvas: neutral cool grey, never purple |
| `cr.snowfall` | environment | light snow and cover in daylight | C1 to C2 (0.8 ms) / C2 (1 ms) | half the flakes, shading-only cover | canvas: no sparkle, neutral grey-blue shade |

Build sections, one per recipe, in `effects-cleanroom.md`: `cr.window_rain` section 1, `cr.wet_ground` 2, `cr.deform_sand_snow` 3, `cr.wind_grass` 4, `cr.ocean_snell` 5 (with its own mobile fallback subsection), `cr.procedural_tree` 8, `cr.touch_frost` 9, `cr.snowfall` 10. The license ledger for all of them is section 0.

### 4.5 Three.js patterns (JAL-native)

| ID | Kind | Surface | Cost | Mobile fallback | Law note |
|---|---|---|---|---|---|
| `three.studio_object` | object_showcase, hero | transparent canvas on page white, neutral studio light | C2 | DPR per tier, fake contact shadow, `<PresentationControls>` off, poster | canvas |
| `three.scroll_camera` | story | page white | C2 | triggered beats instead of scrub; stills under reduce | canvas |
| `three.points_field` | particles, hero | ink dust on white | C1 (up to 100k points) | half count | canvas: normal blend, dark small sparse points |
| `three.gpgpu_particles` | particles | ink on white | C2 to C3 (256 squared = 65k, 512 squared = 262k) | 128 squared (16k) or `three.points_field` | canvas |
| `three.compute_particles` | particles | ink on white | C3 (100k and up, WebGPU) | `three.gpgpu_particles` or points, then poster | canvas |
| `three.instanced_field` | hero, data_viz | page white | C2 | fewer instances, no shadows | canvas |
| `three.img_hover` | gallery_hover | the images themselves | C1 | plain `<img>` (no hover on touch) | canvas: displacement and grade only, no RGB split |
| `three.matcap_clay` | object_showcase | soft grey clay on white | C1 | poster | canvas: bake our own matcap |
| `three.sdf_blob` | hero | page white | C2 (48 to 96 steps at 0.5 resolution) | fewer steps, then poster | canvas: rim darkens, never glows |
| `three.dot_globe` | data_viz | ink dots on white | C1 | static SVG dotted map (R38) | canvas: flat and unlit; a slow auto-rotation (one turn per `--loop-globe`, linear) is allowed only with a visible 44px pause control, drag rotates; static poster under reduced motion (recipe R44) |
| `three.mesh_sweep` | object_showcase | product models on page white | C1 (one extra discard test) | 150 ms crossfade | canvas: thin darker sweep band, never an additive edge (`shaders.md` section 16) |
| `three.post_light` | modifier (any WebGL section) | light scenes | adds 0.3 to 1.5 ms per full-res pass | none on mobile | canvas: AA, LUT, dither, subtle DoF only |
| `three.views` | layout (many 3D regions, one canvas) | page white | host scene cost, one context | fewer views; poster per view | canvas |

**Build section per recipe** (each is the one place the recipe is built; it links out for shared pieces):

| Recipe | Built in |
|---|---|
| `three.studio_object` | `three-foundations.md` section 13 |
| `three.scroll_camera` | `scroll-choreography.md` section 9 (R3F binding in `r3f.md` section 12) |
| `three.points_field` | `particles-physics.md` section 2 |
| `three.instanced_field` | `particles-physics.md` section 3 (instancing in `r3f.md` section 5) |
| `three.gpgpu_particles` | `particles-physics.md` section 4 |
| `three.compute_particles` | `particles-physics.md` section 5 |
| `three.img_hover` | `shaders.md` section 10 |
| `three.matcap_clay` | `shaders.md` section 7 |
| `three.sdf_blob` | `shaders.md` section 4 |
| `three.dot_globe` | `r3f.md` section 14 |
| `three.mesh_sweep` | `shaders.md` section 16 |
| `three.post_light` | `shaders.md` section 19 |
| `three.views` | `r3f.md` section 8 |
| `px.canvas2d_field` | `particles-physics.md` section 1.1 |
| `px.nixie_fx`, `px.rapier_toy` | `particles-physics.md` sections 8 and 9 |

`three.dot_globe` is the lawful home of the magicui globe now that three is approved; `cobe` stays an approval candidate (ask Brian).

### 4.6 magicui and animata recipes (C0, surface light, law full)

Recipes live in `skills/jal-motion/references/components.md` (W-comp). Pool IDs map to recipe numbers: `mu.R01` reveal on view, `mu.R02` text motion engine, `mu.R03` line mask reveal, `mu.R04` scroll-linked word reveal, `mu.R05` rotating word, `mu.R06` hover roll, `mu.R07` number count-up, `mu.R08` odometer, `mu.R09` deterministic scramble, `mu.R10` typing sequence, `mu.R11` opacity wave shimmer, `mu.R12` neighbour lift, `mu.R13` sliding tonal tabs indicator, `mu.R18` marquee, `mu.R19` velocity band, `mu.R20` dialog, `mu.R21` FLIP lists, `mu.R23` pinned crossfade sections, `mu.R24` shutter preloader, `mu.R25` tile section transition, `mu.R26` panel slide-off image reveal, `mu.R27` image hover zoom, `mu.R28` lens magnifier, `mu.R29` dock magnification, `mu.R32` deck carousel, `mu.R33` 3D flip (showcase only), `mu.R38` dotted map, `mu.R43` carousel, and the rest of the KEEP and ADAPT list. Kinds: `text_motion` (R02 to R12), `strip` (R18, R19), `transition` (R23 to R26), `gallery_hover` (R27, R28), `data_viz` (R07, R08, R36 to R38). Mobile fallback: the static final state.

### 4.7 GSAP choreography (C0 on DOM, drives canvases through a progress ref)

`gsap.reveal`, `gsap.stagger_sequence`, `gsap.scrub`, `gsap.pinned_sequence`, `gsap.horizontal_track` (desktop 1024 and up only, mobile becomes `gsap.stagger_sequence`), `gsap.splittext_reveal`, `gsap.flip_transition`. Recipes, pin rules, and Lenis sync in `references/scroll-choreography.md`. These are chosen by `motion.choreography`, not `imm.recipe`, but a `story` section may list a GSAP pattern as a C0 candidate against a 3D recipe.

### 4.8 JAL frame core (`references/frames.md`)

`frame.demo`: a frame-driven composition (`Sequence`, `Series`, `interpolate`, `spring`) played live in the page by `Player` with play, pause, and scrub, reduced-motion aware. Kind `demo`, C0 to C1, surface light, law full. It replaces any pre-rendered video idea; Remotion is never installed.

The other two demo mediums, picked by JEV `motion.demo_medium`, have their build sections in the same file: `gsap.live_dom_demo` (`live_dom`: the real JAL Core components acting out a scripted GSAP timeline, 2 G, 3 Q when scrubbed, visible 44px pause control, final-state poster under reduce) in `frames.md` section 8, and `frame.poster_steps` (`poster_steps`: a few static authored screens with step captions, 1 E, crossfade 150ms or less, stacked static screens under reduce) in `frames.md` section 9.

## 5. Assembling `imm.recipe` candidates per section

From: JAL-authored (the layering protocol in `skills/jal-design-system/references/recipe-index.md` section 4); Threejs-Awesome-Graphics-Agent-Skills (keep the mechanism that gives a reference its character); ai-dev-kit.

1. **Kind.** Take the section kind from the concept (step 2). A section may carry two kinds (hero plus text_motion).
2. **Pull.** Every pool entry tagged with that kind.
3. **Hard filter (precheck, no JEV):**
   - Drop anything whose tech is an unapproved candidate.
   - Drop anything over the section's cost ceiling: the page's target tiers (`performance.md` section 3) set a ceiling; a recipe with no mobile fallback is dropped when mobile is a target.
   - Drop cinematic recipes when a tier-3 section already exists.
   - Variety between adjacent sections is the default: an adjacent section's recipe stays in the shortlist only when JEV judges that reusing it serves the story (a deliberate echo or continuation), otherwise it is dropped.
   - Drop anything that cannot meet the mechanical rules without a rewrite (a hover-only mechanic with no touch path for a touch-first audience, 44px impossible).
   - Drop dark noyzzi pieces only when the brief explicitly forbids a dark moment; otherwise surface is JEV's call.
4. **Shape the shortlist:** 2 to 6 candidates. When a candidate is inspired by a reference site or piece, write one line naming the mechanism that gives it character (for example "haze that shares the key light's direction") and keep that mechanism in the rebuild; swapping it for a generic category effect ("add fog", "add particles") fails the recipe even when a still looks similar. At least one JAL-native candidate (clean-room, three, mu, gsap, frame), at least one lighter control (C0 or C1), at most three noyzzi candidates. Each candidate's criterion says when that option is right for this section's message and audience, from the pool row, never advocacy.
5. **Ask one call** with `recipe` (choice) plus the conditional questions: `surface` when candidates span paper and dark; `hover_family` and `motion_budget` when the kind is `gallery_hover`. Then **grow the section layer by layer** (`layer_1`, `layer_2`, and so on, with no fixed limit, per Brian): each proposed layer takes a role the stack lacks (layout, text, motion, hover, background, 3D, demo), and JEV keeps it only if it aligns and fits (0.6 or above). The protocol is in `jal-design-system` `references/recipe-index.md`.
6. **A layer is proposed only if the mechanical rules hold:** canvases within the tier's count (usually one WebGL canvas per viewport, for GPU cost), shared surface or noyzzi boundary, summed cost under the tier, one scroll owner, one pointer effect per element. Typical stacks: kinetic type over a paper field with a GSAP scroll exit; `three.img_hover` inside a noyzzi gallery carousel with a text reveal on its captions; a `mu.R02` headline over `three.studio_object` with a frame-core demo below.

Example: a `hero` for a ceramics studio might ship `nz.section.gaze`, `nz.section.loom`, `three.matcap_clay`, `three.studio_object`, and `mu.R02` as the C0 control.

## 6. Poster-first loading

From: JAL-authored; ai-dev-kit (LCP, preload, and lazy-media rules); webgpu-claude-skill (adapter and capability checks); remotion (poster frame idea only); nixie-fx, animata, Threejs-Awesome-Graphics-Agent-Skills (readiness and failure states).

1. **The poster.** An `<img>` (WebP, at most 200KB, explicit `width` and `height`, `fetchpriority="high"` above the fold, `decoding="async"` below) rendered from the scene itself at the design camera beat and the same lighting, so the swap is seamless. Generate it in a Bun script: puppeteer-core loads the page with `?poster`, calls `window.__immersive.seek(0)`, advances two frames, screenshots the canvas box.
2. **Capability and preference checks** before any `import()`:
   - `prefers-reduced-motion: reduce` keeps the poster. A user-driven scene (drag to rotate) may be offered behind an explicit 44px "View in 3D" button, and then runs with no ambient motion.
   - `navigator.connection?.saveData` keeps the poster.
   - WebGL2 (`canvas.getContext("webgl2")`) or WebGPU (`navigator.gpu` and a resolved `requestAdapter()`) must exist.
   - Tier hints: `navigator.deviceMemory`, `hardwareConcurrency`, viewport width, `(pointer: coarse)` (`performance.md` section 3).
3. **Lazy start** on `IntersectionObserver` entry (`rootMargin` about one viewport ahead), then `await import("./scene")`.
4. **Load assets** under Suspense, then `renderer.compileAsync(scene, camera)` (or drei `<Preload all />`), render one frame, wait two rAFs.
5. **Reveal.** Crossfade the canvas in over the poster (opacity, 300ms, `jal-standard` curve), then `ScrollTrigger.refresh()` because layout may have settled.
6. **Keep the poster on any failure:** loader error, compile error, context loss, device loss, `PerformanceMonitor` fallback, or a frame-time probe over budget. Log the reason once.

The canvas is `aria-hidden="true"` when decorative. An interactive canvas gets `tabIndex=0`, an `aria-label` naming the interaction, keyboard equivalents (arrows rotate or step beats), and a visible focus ring on its wrapper. Essential information never lives only in 3D text.

## 7. Verification

From: JAL-authored; threejs-game-skills (section scorecard, built-output verification, stripped test hooks); Threejs-Awesome-Graphics-Agent-Skills (visual contract, causal tuning order, rejection criteria); ai-dev-kit (perf audit).

Full method, commands, and thresholds in `performance.md` section 6. The minimum per build:

1. `ui_audit` PASS at 320, 375, 414, 768, 1280, including `reduced-motion`, with noyzzi subtrees exempt from visual rules only.
2. Real GPU or nothing: the renderer string is recorded and must not contain SwiftShader before any frame time is quoted.
3. Screenshots at 375 and 1280: poster, each authored beat, reduced-motion run, no-WebGL run. Background pixels in the canvas box equal the DOM white (catches the tone-mapping trap); no bloom-like radial falloff.
4. Frame-time sampling: 5 seconds of scripted scroll, p50, p95, p99, frames over 1.5 times the refresh budget, long-animation-frame entries; `renderer.info.render.calls`, `triangles`, `info.memory` per beat against the tier budget.
5. Forced context loss: `WEBGL_lose_context.loseContext()` shows the poster within one frame with no thrown error; `restoreContext()` resumes or stays on the poster by design. Blocked `*.glb` keeps the poster and logs.
6. Navigation round trip: `renderer.info.memory` and JS heap back to baseline, WebGL context count unchanged.
7. **Verify the built output.** Captures, sweeps, and frame timing run against the `Bun.build` output served by `Bun.serve`, never a dev server. The production build defines the test flag as false so `__immersive`, debug panels, and verbose logging are dead-code eliminated, and a check greps the built bundle for the hook name (absent except in the dedicated test build).
8. **Section scorecard** before `imm.taste`: score each immersive section 0 to 3 in eight categories, each with one line of evidence from the captures: subject form (silhouette, authored parts), materials (roles, roughness contrast, detail), lighting and grounding, camera and composition, motion purpose, poster parity, the DOM around the canvas (Zone A), and performance evidence (renderer counters against the tier). Name what each category means for the section kind first. Pass: none under 2 and a mean of 2.3 or more; showcase: most at 3 and a mean of 2.7. Automatic fails: an unmodified primitive as the subject; any surface in frame left at a default material; empty frame the concept does not justify; haze or darkness standing in for missing geometry; only idle or poster frames captured; no renderer counters after a graphics change; canvas background not equal to page white. Never add props, particles, or noise to lift a score or a pixel metric; a deliberately minimal scene can pass; a placeholder is never reported as final. Calibration: three lawful anchor stills rendered from JAL scenes on page white (primitives with default materials and flat light; an authored object with material roles, contact shadow, calm light; reference quality) are viewed before scoring. They do not exist yet: render them on the first real-GPU build and keep them under `skills/jal-immersive/assets/taste-anchors/` (the source pack's dark neon anchors are never used). The scorecard feeds `imm.taste` as evidence.
9. **Visual contract before tuning.** Write the effect's observable invariants (the rim stays visible with post off, the mesh boundary never shows, card roots stay attached at maximum wind), its camera envelope (near, design, far), and any deliberate divergence from the reference. Tune in causal order: domain and cost, then motion, then lifetime, then shading, then presentation, and never compensate a weak stage with a later one (a weak velocity field with stronger shading, an oversized domain with extinction).
10. **Reject** a build when post-processing manufactures its form, when it has no debug view proving its mechanism, when deterministic reset or a fixed-camera capture is impossible, or when it silently diverges from its recipe.

## 8. Pre-return gate

From: JAL-authored; Threejs-Awesome-Graphics-Agent-Skills (acceptance gate: seed, perceptual parameters, debug views, no-post baseline); animata.

Do not return until every line is true, or the report names the line and why:

- [ ] Every immersive section has a concept, an `imm.gate` pass, an `imm.recipe` pick, `imm.tech`, and `imm.tier`, all logged with confidence.
- [ ] Direction came from the seeded pick with `ui.direction_screen`; the direction contract and immersive addendum exist.
- [ ] Zone A law holds everywhere outside canvases and noyzzi sections; canvases carry no bloom, glow, neon, purple, chromatic aberration, or painted background; noyzzi pieces sit inside `data-jal-exempt="noyzzi"` wrappers under `src/noyzzi/`, reviewed for network calls, eval, and remote scripts.
- [ ] Every scene has a poster that is the reduced-motion, no-WebGL, low-power, and failure state, plus a DOM text equivalent.
- [ ] three loads through dynamic `import()`; decoders are self-hosted under a versioned `/vendor/r<N>/` path; no drei, troika, detect-gpu, or Rive CDN default remains; CSP `connect-src` is still `'self'` plus the API.
- [ ] DPR never exceeds 2 and follows the tier budget; one canvas per page; one clock; one smoother per signal.
- [ ] Disposal, context loss, and device loss are handled and were tested.
- [ ] Every scene system ships with a fixed seed for all procedural inputs, parameters grouped by what the eye reads (form, material, motion, atmosphere), a debug view for every field that controls the look, and a no-post baseline capture that already reads as finished. Each rung of a quality ladder names the mechanism it changes (fewer march steps, lower field resolution, a cheaper fallback), never a blind DPR cut.
- [ ] Core Web Vitals hold in the lab run: LCP under 2.5 s with the poster as the LCP element, CLS under 0.1, INP under 200 ms (`performance.md` section 7).
- [ ] `ui_audit` PASS at all five widths; screenshots at 375 and 1280 were looked at; frame-time numbers are from a real GPU or explicitly marked as not measured.
- [ ] Any approval candidate used was cleared with Brian (ask Brian) and has an ADR; none became a default. Approved packages (nixie-fx, Rapier, OriginKit patterns, every GSAP plugin, `@gsap/react`) entered only where JEV picked them, with the three range trade recorded for nixie-fx and the WASM loader plus CSP additions recorded for Rapier.
- [ ] `imm.taste` at or above threshold with `keep` passing; `ui.finish_disposition` is `ship`; no more than two fix rounds were spent.
- [ ] No em-dash, emoji, or eyebrow label in any file, copy, or comment written.

## JEV questions

From: JAL-authored (`jal-jev` catalog).

The exact question JSON, prechecks, state fields, and thresholds for `imm.gate`, `imm.recipe`, `imm.tech`, `imm.tier`, and `imm.taste` live in `jal-jev` `references/catalog.md` (section Immersive), next to `motion.intensity`, `motion.choreography`, `motion.pin`, `motion.demo_medium`, `ui.direction_screen`, `ui.heuristics`, and `ui.finish_disposition`. The catalog is the single source; do not copy questions into this file.
