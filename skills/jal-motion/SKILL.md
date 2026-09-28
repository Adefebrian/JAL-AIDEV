---
name: jal-motion
description: JAL's motion system, restrained product UI motion and richer showcase choreography, the duration/easing token scale, Framer Motion and GSAP mappings, accessibility and performance rules. Use when building or reviewing any animation, transition, micro-interaction, state change, page transition, landing hero motion, scroll effect, or product demo motion piece.
---

# JAL Motion

Motion has two contexts, never one blended set of habits. **Product UI motion** is restrained: it exists only to carry information about a state change. **Showcase motion** (landing heroes, product demo reels) can choreograph more, borrowed from bang-motion's video-director discipline, rebuilt entirely in the approved stack and stripped of every technique that fights JAL law. Read `jal-ui-taste` and `jal-frontend-rules` first for the surface this motion sits on; this skill governs only how things move.

Before writing any animation: name what state it communicates in one sentence. If you cannot, delete the animation. In product UI this sentence must be reachable from the token scale below with zero improvisation, consistency across surfaces is the point. In showcase pieces the choreography may be bespoke per project, but the stack, tokens, easing curve, and every law in section 7 are never bespoke.

## 1. Approved stack, nothing else

- **Lenis** for smooth scroll.
- **GSAP** (core plus its free plugin set, including ScrollTrigger, CustomEase) for orchestrated timelines and scroll-linked motion.
- **Framer Motion** for React component, gesture, layout (FLIP), and exit animation (`AnimatePresence`).
- **CSS transitions and WAAPI** (`element.animate()`) for simple, single-property, non-orchestrated motion. Prefer this over a library whenever a plain transition does the job, it costs nothing over the wire.

Three.js, WebGL, Lottie, any ffmpeg/Node/Python export pipeline, and AE-bridge style tooling are **not approved**. Bang-motion's own workflow (fixed-stage HTML export, Puppeteer/ffmpeg frame dumps, Three.js nebula/bloom backgrounds) is explicitly not ported, per its source digest. Anything outside this list needs Brian's explicit yes before adoption, name what it replaces and why.

## 2. Token scale (canonical, source of truth is `packages/ui/src/tokens.css`)

Product UI durations, generated on the same discipline as the type and spacing scales, not hand-picked per component:

```css
--duration-micro:   100ms;  /* hover/press state layer, focus ring, toggle */
--duration-fast:    150ms;  /* small expansion, tooltip, menu item */
--duration-base:    200ms;  /* default entrance: card, panel, dropdown, toast */
--duration-slow:    300ms;  /* large expansion, route transition, dialog */

--duration-showcase-1: 400ms; /* showcase only: hero element entrance */
--duration-showcase-2: 600ms; /* showcase only: large staged reveal */

--ease-standard: cubic-bezier(0.24, 1, 0.4, 1); /* the one curve, everywhere */
```

**Exit runs at about 70% of its matching entrance duration**, eased in rather than out (bang-motion's asymmetric-rhythm law, translated to UI scale: symmetric in/out reads as mechanical). Compute once, do not re-derive per component:

```css
--duration-micro-exit:   70ms;
--duration-fast-exit:   105ms;
--duration-base-exit:   140ms;
--duration-slow-exit:   210ms;
--duration-showcase-1-exit: 280ms;
--duration-showcase-2-exit: 420ms;
```

Default pair when nothing more specific applies: entrance `--duration-base` / exit `--duration-base-exit`, both on `--ease-standard`. There is exactly one easing curve in the system. Do not introduce a second curve, a bounce, or an overshoot anywhere in product UI.

### Framer Motion mapping

```tsx
const standard = { duration: 0.2, ease: [0.24, 1, 0.4, 1] }; // --duration-base
const standardExit = { duration: 0.14, ease: [0.24, 1, 0.4, 1] }; // --duration-base-exit

<motion.div
  initial={{ opacity: 0, transform: "translateY(4px)" }}
  animate={{ opacity: 1, transform: "translateY(0px)", transition: standard }}
  exit={{ opacity: 0, transform: "translateY(4px)", transition: standardExit }}
/>
```

Keep a single `transitions.ts` (or equivalent) exporting the token pairs as typed constants, `standardTransition` / `fastTransition` / etc. Components import from there, never inline a duration literal.

### GSAP mapping

GSAP's plugin set (CustomEase included) has been free since the 2024 licensing change, so register the exact curve once and reuse it, do not approximate with a built-in ease:

```ts
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
CustomEase.create("jal-standard", "0.24, 1, 0.4, 1");

gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.2, ease: "jal-standard" });
gsap.to(el, { autoAlpha: 0, y: 4, duration: 0.14, ease: "jal-standard" }); // exit, 70%
```

If `CustomEase` is unavailable in a given build, the nearest core-only substitutes are `power2.out` for entrance and `power1.in` for exit, both a visible compromise, use only as a stopgap and file a note to add `CustomEase`.

## 3. Product UI motion (restrained)

**What may move**: opacity and `transform` (`translate`, `scale`) only. Every entry below is a state transition, nothing is ambient.

- **State transitions**: hover, focus-visible, pressed, disabled use the state-layer opacities from `jal-ui-taste` (`color-mix` tints), transition `background-color`/`opacity` at `--duration-micro`. Focus rings appear instantly, never animate in.
- **List add and remove**: enter with opacity + `translateY(4px to 0)` at `--duration-base`; remove with opacity + `translateY(0 to 4px)` at `--duration-base-exit`. Use Framer Motion `layout` + `AnimatePresence` so surrounding items reflow via FLIP (transform-driven), never an animated `height`/`margin` on siblings.
- **Disclosure** (accordion, dropdown panel): the one permitted exception to transform/opacity is animating a CSS grid track (`grid-template-rows: 0fr` to `1fr`) on the disclosure's own wrapper, since there is no way to animate to an intrinsic height otherwise. Scope it to that single element, never let it ripple a reflow through unrelated siblings, and collapse it to an instant show/hide under reduced motion.
- **Route transitions**: crossfade (opacity only) by default. A directional slide (`translateX`) is allowed only when it communicates real navigation depth (drilling into a detail view versus going back), never as decoration on a flat navigation.
- **Toast**: enter opacity + `translateY(8px to 0)` at `--duration-base`, exit at `--duration-base-exit`. Auto-dismissed toasts still need a manual dismiss control per section 5.
- **Live status pulse or ambient product indicator**: must be a pure function of elapsed time (`sin(t * k)` style), never `setInterval` or accumulated velocity, so it is reproducible and trivially freezable under reduced motion.

**What may never move in product UI**: `width`/`height`/`top`/`left`/`margin` (layout thrash, the one disclosure exception above aside), `box-shadow` (JAL has none to animate), any gradient sweep, any infinite ambient background motion, any bounce or overshoot easing, any 3D rotate, any blur filter, any decorative flourish (sparkle, marker, underline draw-on) per section 7.

**Discipline**: one thing moves at a time. If two elements must change together, they share one timeline and one duration, they do not each improvise their own. Motion carries information or it does not ship, "looks nice" is not a reason.

## 4. Showcase motion (landing heroes, product demo pieces)

Richer choreography is allowed here: asymmetric in/out at the showcase durations, staged reveals, scroll-linked camera language, and the choreography bang-motion proved out (camera-follows-click, shot-size staging, deterministic timelines), rebuilt in Lenis/GSAP/Framer Motion/CSS/WAAPI only. Full recipe, stagger values, the shot-size vocabulary, the anti-slide mechanical checks, and worked GSAP timeline examples live in `references/showcase.md`, read it before building any hero or demo reel.

The short version: one continuous world, never a slideshow of crossfading `<section>` blocks; the camera (a parent transform) does the moving, not every element animating itself independently; entrances slower and eased-out, exits faster and eased-in, at roughly the same 70% ratio as product UI; every showcase piece still opens on a white or off-white base and still obeys every rule in section 7.

## 5. Accessibility

Non-negotiable, in both contexts:

- `prefers-reduced-motion: reduce` collapses every animation to a plain opacity crossfade of 150ms or less (or an instant cut for anything trivial). No exceptions, no partial motion, no "just the parallax" left running.
- No autoplay parallax, no scroll-linked camera drift, no ambient background motion, no vestibular-trigger technique (whip pan, roll, screen shake, rapid scale pulsing) under reduced motion. These are removed, not slowed.
- Anything that runs longer than 5 seconds unattended (a looping hero, an autoplaying demo reel) ships a visible pause control.
- No flashing: no more than three flashes per second in any region, no rapid full-field color cuts under 300ms repeated in sequence. This applies to showcase pieces as much as product UI, a video-style deliverable is not exempt from WCAG flash limits.
- Focus-visible rings are never animated in, they must appear the instant focus lands.

## 6. Performance

- **Compositor-only properties**: `transform` and `opacity` drive essentially everything. `filter` (blur) is not cheap, GPU cost scales with the blurred region, use it rarely and only in showcase pieces, never in product UI.
- **`will-change` discipline**: set it immediately before the animation starts, remove it immediately after. Never leave `will-change` sitting on an element indefinitely, that pins a compositor layer for nothing (the same lesson bang-motion learned the hard way with SVG blur filters left attached after a tween).
- **Frame budget**: target 60fps, a 16.7ms budget per frame. Batch any JS-driven reads and writes (read layout, then write style), never interleave them inside a scroll or animation callback.
- **No scroll-jank**: scroll-linked motion goes through Lenis and GSAP ScrollTrigger's batched update, never a raw non-passive `scroll` listener doing layout reads. Cap the number of simultaneously animating elements, a handful at a time reads as intentional, dozens reads as thrash and drops frames.
- Prefer the smallest tool: a CSS transition over WAAPI over Framer Motion over GSAP, reach for the next one only when the current one cannot express the choreography.

## 7. JAL law in motion (absolute, showcase included)

No gradients of any kind, animated or static. No glow, no neon. No shadows (JAL depth is tonal layers and hairline borders only; the one exception is a spread-only, non-animated focus ring). No decorative ornaments riding on motion: no marker dot, no underline draw-on, no pill or star or sparkle appearing on a hover or entrance, no side accent stripe animating in, no connector line drawing between elements. No emoji, anywhere, including in demo-reel copy or on-screen labels. No em dash. No dark default background, in a showcase piece or anywhere else, dark exists only inside an explicit, separately requested dark mode. A showcase piece that would look at home as a generic AI-tool product video (dark base, purple accent, glow, gradient light leak) is wrong, rebuild it white-first.

## 8. Pre-return checklist

- Every animation states, in one sentence, what state change it communicates. None left that cannot answer this.
- Only `transform` and `opacity` animate in product UI, with the one named disclosure exception in section 3.
- Every duration and easing value traces to a named token in section 2, no inline magic numbers (`0.37s`, `ease-in-out`, a hand-typed cubic-bezier).
- Every entrance/exit pair is asymmetric, exit at roughly 70% of entrance, exit eased in.
- `prefers-reduced-motion` is implemented and actually tested (toggle it, confirm every motion collapses), not just referenced in a comment.
- Nothing autoplays longer than 5s without a pause control; nothing flashes past the WCAG limit.
- `will-change` is scoped to the active animation window only, verified in devtools, not left standing.
- No gradient, glow, neon, shadow, decorative ornament, emoji, or em dash appears anywhere in the motion work, including showcase copy and labels.
- Showcase pieces open on white or off-white, read as one continuous world (no crossfading section slideshow), and use the approved stack only.
- Grepped the diff for `Math.random()` and `Date.now()` inside any render/animation loop, none found (ambient motion must be a pure function of elapsed time).
