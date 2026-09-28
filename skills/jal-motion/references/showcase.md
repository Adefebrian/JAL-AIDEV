# Showcase motion reference

Deep choreography for landing heroes and product demo pieces. Read `SKILL.md` first for the token scale, the approved stack, and the hard law, this file only expands section 4. Everything here is bang-motion's choreography knowledge, filtered through JAL law and rebuilt in Lenis/GSAP/Framer Motion/CSS/WAAPI. Bang-motion's own runtime (Three.js, Node/Python/ffmpeg export, AE bridge) is not ported and never referenced as a tool.

## One continuous world, never a slideshow

A showcase piece is one world the camera moves through, not a stack of sections that crossfade in and out. Mechanical self-check before shipping: grep the markup for repeated full-block opacity crossfades on sibling `<section>`s, if three or more sections each just fade in and out on scroll with nothing else changing, it reads as a slideshow, restructure it so a parent container (the camera) moves, scales, or reveals content, rather than each section independently fading.

## Asymmetric in/out timing

Entrances are slower and eased-out, exits are faster and eased-in, never symmetric. Use the showcase durations from `SKILL.md` section 2:

- Standard beat: entrance `--dur-400` (400ms), exit `--dur-400-exit` (280ms).
- Larger staged reveal: entrance `--dur-600` (600ms), exit `--dur-600-exit` (420ms).
- All on `--ease-standard`, the one curve, no exception for showcase.

## Stagger rhythm

Real values, ported directly since they were already UI-scale in the source:

- Per-character reveal: stagger 24ms in, 10ms out. Use sparingly, on a short headline only, never on body copy.
- Per-word reveal: stagger 70 to 120ms, the default for a headline built of a handful of words.
- Cap at two text tiers animating in a single beat: one headline plus one supporting label. A kicker plus title plus body plus caption stack animating together is the "every section looks like a slide" failure mode, cut it to two tiers or split into two beats.

## Shot-size language

Model the hero's focal element in three sizes and move deliberately between them on content beats, not continuously: wide (establishing, the whole composition visible), medium (the subject readable but still in context), close (the subject fills the frame, used for the one moment that matters most). Change shot size only on a real content beat, holding a shot at least 1.2 to 1.5s before changing again, a viewer cannot read a size change faster than that. The shift itself runs on `--ease-standard`; a slow ambient scale drift of a percent or two while holding a shot is fine as a baseline "breathing" layer, implemented as `transform: scale()` driven by `sin(elapsed * k)`, alternating direction between beats so it never reads as continuous zoom.

## Camera follows the click (product demo reels)

For a piece that shows a UI being clicked through:

1. **Approach**, 300 to 500ms on `--ease-standard`, the camera (a parent transform, not the UI itself) scales up 1.4x to 2.2x toward the target control before the click lands.
2. **Click reads**, roughly 200ms either side of the actual click, the clicked control itself scales down slightly (0.96) and back to communicate the press, this is the one place a control's own transform, not just the camera's, is allowed to move.
3. **Retreat**, 700ms to 1s, camera eases back out to the previous shot size.

Budget this treatment to a small number of clicks per piece (two or three), not every interaction, so it stays a highlight rather than a tic.

## Staging and hierarchy of motion

One thing moves at a time, even in a richly choreographed piece. If the camera is moving, foreground UI elements hold still relative to it; if a foreground element is animating in, the camera holds still. Simultaneous independent motion on multiple layers is what makes a piece feel busy rather than directed. Sequence beats on one shared timeline (`gsap.timeline({ paused: true })`) with explicit absolute-time calls, not relative `+=` offsets, so the whole rundown can be read second by second and reasoned about.

## Deterministic timelines

Any generative or ambient motion (a breathing scale, a slow drift, a looping background element) must be a pure function of elapsed time, `transform: scale(1 + Math.sin(t * k) * 0.02)` style, never `Math.random()` or `Date.now()` inside the render or animation loop, and never velocity accumulated frame over frame. This is what makes the piece reproducible for screenshot QA, freezable under reduced motion, and scrubbable if a scrub control is ever added.

## Anti-slide mechanical checks

Before returning a showcase piece, check for these bang-motion-identified failure patterns:

- Every heading entrance looks identical (same direction, same stagger, same position) across the whole piece, vary at least direction or position between consecutive beats.
- A rigid template rundown (hook, then feature, then feature, then promise, then logo, then CTA) applied regardless of what the piece is actually showing.
- The camera stays static while text just fades or slides, that is not a showcase piece, that is a regular page with a fade, use the restrained product-motion recipes instead if nothing is actually staged.
- A whip pan or transition that reveals the edge of the composition (the "turning a page" tell), keep any directional motion inside the frame.
- The single most expensive effect in the piece (a shot-size close, a camera-follows-click moment) shows up more than once or twice, ration it so it stays a highlight.

## Directional blur, rare and gated

A per-tween SVG `feGaussianBlur` aligned to the actual motion vector (not a blanket CSS `filter: blur()`) is the one showcase-only enhancement worth keeping from bang-motion, reserved for a hero video or demo-reel transition, never in product UI. Attach the filter only for the duration of the tween and detach it immediately after (`filter: none`), leaving it attached forces per-frame rasterization and is expensive. Under `prefers-reduced-motion`, cut the blur and the whip it was attached to entirely, keep only an opacity crossfade.

## What stays out of showcase too

No word-highlight pill, marker, underline draw-on, or sparkle, even as a "one per project" signature, JAL bans the whole ornament category outright. No gradient light leak, no glow, no grain or paper/sticker collage skin, no dark-by-default opener. Any of these as a one-off exception needs Brian's explicit sign-off per technique, never assumed available by default. Three.js, WebGL, and WebGPU scenes are approved and live under `jal-immersive` (poster first, canvas lighting allowed, no bloom or neon); a WebGL background is only built when JEV `imm.gate` and `imm.recipe` choose it. noyzzi-derived sections follow their own exemption (`jal-immersive` `references/noyzzi.md`).
