# Scroll and time choreography

The complete official GSAP skills ship in `gsap/official/` (GreenSock, MIT), with the JAL layer in `gsap/gsap.md`. This file is JAL's choreography on top of them.

Expert reference for GSAP, ScrollTrigger, SplitText, Flip, Lenis, and scroll-driven R3F cameras on JAL. Read `skills/jal-motion/SKILL.md` first: it owns the token scale, the one curve, and the law. This file owns how motion is choreographed against time and scroll. For frame-driven "video" pieces use `frames.md` instead.

Stack: `bun add gsap @gsap/react lenis`. Every GSAP plugin is free (since the 2024 Webflow licensing change) and allowed. JAL law still decides what each one may be used for (section 1.4). No auth token, private registry, or Club membership is ever needed; any doc or agent that says otherwise is outdated.

**When to escalate to GSAP.** Move up from CSS or WAAPI only when the motion needs one of four things: several beats sequenced on one timeline, runtime control (pause, reverse, seek, scrub), scroll-linked progress, or values computed in JS at run time (measured widths, pointer position). A change driven by React state stays on Framer Motion. Name the trigger that forced the escalation in the build report.

## 1. GSAP core

From: gsap-skills (`gsap-core`, `gsap-timeline`, `gsap-plugins`, `gsap-utils`), GSAP docs, JAL-authored (tokens, the one curve, plugin and ease law).

### 1.1 Setup, once per app

Register at module top level, never inside a component that re-renders:

```ts
// motion/gsap.ts, imported once by the app entry
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, CustomEase);
CustomEase.create("jal-standard", "0.24, 1, 0.4, 1"); // --ease-standard
CustomEase.create("jal-exit", "0.6, 0, 0.76, 0");     // same curve, time-reversed
gsap.defaults({ ease: "jal-standard", duration: 0.4 }); // --dur-400
export { gsap, ScrollTrigger, SplitText, Flip };
```

`jal-exit` is the JAL curve mirrored through (0.5, 0.5): control points `(1 - x2, 1 - y2, 1 - x1, 1 - y1)`. It is the same curve run backward, not a second curve, and it serves jal-motion's eased-in exit rule.

**Lazy plugins.** Register ScrollTrigger, SplitText, Flip, and CustomEase eagerly (most sections use them). A plugin used by one section (MorphSVG, DrawSVG, MotionPath, Draggable, Inertia, Observer, ScrollTo) loads with `const { MorphSVGPlugin } = await import("gsap/MorphSVGPlugin")` and one `gsap.registerPlugin`, cached in a module-level promise so a second caller reuses it. With `splitting: true` in Bun.build each becomes its own chunk (`three-foundations.md` section 6). Await before building the animation inside `useGSAP`, and wrap anything built after the await in `contextSafe` so it still reverts.

### 1.2 Timing constants in JS

Durations and staggers come from tokens, in seconds. Keep one module; never type a literal duration in a tween.

```ts
// motion/tokens.ts, mirrors tokens.css
export const dur = { micro: 0.1, fast: 0.15, base: 0.2, slow: 0.3, show1: 0.4, show2: 0.6 } as const;
export const exit = { micro: 0.07, fast: 0.11, base: 0.14, slow: 0.21, show1: 0.28, show2: 0.42 } as const;
export const stagger = { char: 0.02, word: 0.04, line: 0.08, item: 0.06 } as const;
export const CASCADE_CAP = 0.6; // --dur-600: a whole stagger cascade never runs longer
```

### 1.3 Stagger tokens

```css
--stagger-char: 20ms;  /* SplitText chars, display text of 24 characters or fewer */
--stagger-word: 40ms;  /* SplitText words, display headings */
--stagger-line: 80ms;  /* SplitText lines, headings and lead paragraphs */
--stagger-item: 60ms;  /* cards, logos, list rows, proof points */
```

Rules:

- Cap the cascade. When `count * each` would pass 600ms, switch from `each` to `amount: CASCADE_CAP` so 40 logos do not take 2.4s.
- `from: "start"` by default. `from: "center"` only for a symmetric row. Never `from: "random"` (non-deterministic, reads as noise).
- One staggered tween beats N tweens with hand-set delays.
- 2D grids: `stagger: { grid: "auto", from: "start", axis: null, amount: CASCADE_CAP }` so the cascade follows rows and columns, not DOM order; `axis: "y"` lands each row together. `from: "center"` only for a symmetric grid, `from: "random"` never.
- Per-item values rather than delays (a fanned deck's rotation, a depth offset): `gsap.utils.distribute({ base, amount, from: "center", ease: "none" })` gives a deterministic spread by position; its ease is `"none"` or `jal-standard` only.

### 1.4 Eases and the linear exception

- Everything that starts and stops: `jal-standard` (entrance) or `jal-exit` (exit). Nothing else.
- Linear (`ease: "none"`) only where the motion has no start or stop to shape:
  - constant-speed loops: marquee, spinner, indeterminate progress;
  - scroll-mapped tracks where scroll is the easing: a `containerAnimation` horizontal track (mandatory, or position and scroll drift apart), and the outer mapping of a scrubbed timeline.
- `repeat: -1` only for the constant-speed loops named above (marquee, spinner, indeterminate progress, globe turn), with `ease: "none"`, a visible pause control once it runs past 5 s, and a pause offscreen and on a hidden tab. `yoyo: true, repeat: 1` is fine for a single press nudge (section 6). An infinite yoyo is ambient ping-pong: build it as a pure function of elapsed time per `jal-motion` instead. Under reduced motion no infinite tween exists.
- Never `back`, `elastic`, `bounce`, `CustomBounce`, `CustomWiggle`, `Physics2D`, or `PhysicsProps`: overshoot and wobble are banned. `power*`, `expo`, `sine`, and `circ` are not the JAL curve; do not use them as stand-ins.

Plugin filter (all free, all installable, law decides use):

| Plugin | JAL use |
|---|---|
| ScrollTrigger | every scroll-linked pattern in section 7 |
| SplitText | line, word, char reveals (section 3) |
| Flip | layout changes inside a GSAP timeline (section 4) |
| MorphSVG | a meaningful shape change, such as an icon state from koboyo or reicon. Never decorative blob morphs |
| DrawSVG | revealing a real data line in a chart. Never an underline draw-on, a connector, or an ornament |
| CustomEase | the two registrations above, nothing more |
| ScrollSmoother | not used: Lenis is the smooth scroller. Never both |
| ScrambleText, TextPlugin glitch | not used: glitch aesthetic and flash risk |
| GSDevTools | dev only, never imported by app code |

### 1.5 Tweens and timelines

- `gsap.from()` for entrances (the final state is the authored layout), `gsap.to()` for exits, `fromTo()` when both ends must be explicit, `set()` for instant state.
- Animate `x`, `y`, `xPercent`, `yPercent`, `scale`, `autoAlpha`, and sparing `rotation`. `autoAlpha` also sets `visibility: hidden` at 0, so a faded-out element stops catching clicks.
- Stacked `from()` tweens on one property need `immediateRender: false` on the later ones.
- Sequence with a timeline and the position parameter, never with chained `delay`. Readable showcase rundowns use absolute times or labels (`tl.addLabel("proof", 1.2)`), per `showcase.md`.
- `timeline({ defaults: { ease: "jal-standard", duration: dur.show1 } })` so beats inherit tokens.
- Nest section timelines into a master with `master.add(child, "label")`.
- **Overwrite.** The default is `overwrite: false`: two tweens on one property both run and the later wins every frame. `true` kills every tween of the same targets at creation, whatever they animate. `"auto"` waits for the new tween's first render and kills only the overlapping properties of still-active tweens. Use `"auto"` for interruptible hover, toggle, and pointer motion, `true` only for a hard reset. Never set a global overwrite default.
- **Transform order and units.** GSAP composes transforms in one fixed order (translate, scale, rotationX and Y, skew, rotation). Set the aliases; never tween a raw `transform` string (GSAP parses a matrix and rotations can flip or snap), and never write `transform:` in vars. `x` and `y` default to px, rotation to degrees; `"0.5rad"` switches units.
- **`xPercent` stacks with `x`.** They are separate channels that add. Centre an absolutely positioned element once with `xPercent: -50, yPercent: -50`, then animate `x` and `y` freely. Both work on SVG, where CSS percentage translate is unreliable.
- **Relative values** (`"+=16"`, `"-=16"`, `"*=2"`) read the value at first render. Use them for step controls so repeated presses accumulate, with the step computed from layout (panel width), not a px literal. Scrubbed or reversible motion keeps absolute values, because relative ones drift when the tween is recreated.
- **Function-based values** (`x: (i, el, all) => ...`) run once per target at first render and are locked in: the deterministic way to vary targets, replacing any randomness. Measured values (`() => -(track.scrollWidth - innerWidth)`) re-run only when the tween is invalidated, which is why a layout-reading scroll tween needs `invalidateOnRefresh: true`.
- **`clearProps`** (`"transform"`, a comma list, or `"all"`) strips inline styles on complete, handing the element back to CSS (a stylesheet `:hover` transform that a leftover inline transform would override). Clearing any single transform part removes the whole inline transform. Only on entrances whose end state equals the CSS state: an exit with clearProps pops the element back. `clearProps: "willChange"` drops the hint on complete.
- **Control.** Store every tween or timeline you control in a ref. Build interactive timelines once with `paused: true` and drive them with `play()`, `reverse()`, `restart()`, `progress(p)`, `time(t)`; never create a tween per event. `kill()` stops an animation and a timeline's children (context revert does it on unmount). Timeline-level `repeat`, `yoyo`, `onComplete` apply to the whole sequence and fall under the loop rule in section 1.4.
- **Position parameter grammar.** A number is an absolute time in seconds; `"+=0.2"` and `"-=0.2"` offset from the timeline end; `"label"` and `"label+=0.2"` place relative to a label; `"<"` is the start of the most recently added child, `">"` its end (the default), and `"<0.1"` or `">-0.1"` offset from those. Rundowns use absolute numbers or labels; `"<"` pairs an outgoing and an incoming beat.
- **Chapter jumps.** `tl.play("proof")` jumps to a label and plays. `tl.tweenFromTo("intro", "proof", { duration: dur.show1, ease: "jal-standard" })` pauses the timeline and returns a tween moving the playhead between labels, the tool for chapter buttons in a demo. Pass the ease: the returned tween is linear by default. Under reduced motion set `progress()` straight to the label.
- `gsap.quickTo(el, "x", { duration: dur.fast, ease: "jal-standard" })` for pointer followers: one tween reused, not one per event.

### 1.6 SVG plugins and dial transforms

- **`svgOrigin: "120 80"`** rotates or scales around a point in the SVG's own user coordinates, so parts of one drawing share a pivot (gauge needle and ticks). No percentages, and it replaces `transformOrigin` on that element: never set both.
- **Directional rotation** for dials, gauges, and rings that show a real value: `"_short"` takes the short way round, `"_cw"` and `"_ccw"` force a direction, so a wrap from 350 to 10 degrees turns 20, not 340. These are state displays: `jal-standard`, token durations.
- **DrawSVG.** The value is the visible stretch of the stroke, `"start end"` in percent or length (one value means from 0). A chart line reveal is `fromTo(path, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%" })`. It affects stroke only (the path needs a stroke token and width; nothing happens to fills or `<use>`). One continuous `<path>` per data series. Scale duration with `DrawSVGPlugin.getLength(path)`, capped at `dur.show2`, so short and long series feel the same speed. Reduced motion shows the full line at once.
- **MorphSVG.** Takes a selector, element, path string, or points string; point counts may differ; primitives go through `MorphSVGPlugin.convertToPath()` first. A twisting morph needs `shapeIndex` (log once with `shapeIndex: "log"`, paste the number); wrong segment pairing tries `map: "position"` or `"complexity"`; a mid-way kink tries `type: "rotational"` or `curveMode: true` (3.14 and up), `smooth` for jagged output. `precompile: "log"` removes the first-frame cost of complex morphs, not mid-tween jank (simplify the path). JAL use is a real state change of a koboyo or reicon icon, `jal-standard` at `dur.fast` to `dur.slow`, an instant swap under reduced motion.

### 1.7 `gsap.utils`

- Most utils return a reusable function when the value argument is left out: build `const toDeg = gsap.utils.mapRange(0, 1, 0, 270)` once and call it in `onUpdate`, never re-parse per frame.
- Core set: `clamp(min, max)`, `mapRange(inMin, inMax, outMin, outMax)`, `normalize(min, max)`, `interpolate(a, b)` (numbers, solid colours, objects of numbers), `snap(step | array)`, `wrap(min, max)` for cyclic tracks like marquees (max exclusive), `wrapYoyo`, `pipe(f, g, h)`. They are unitless: split with `getUnit`, rejoin with `unitize`. `toArray(selector, scope)` returns a real array from a scoped selector.
- `random`, `shuffle`, and the `"random(...)"` string form are banned in animation code (determinism). Per-target variety comes from index-based function values or `distribute` (section 1.3).

## 2. ScrollTrigger

From: gsap-skills (`gsap-scrolltrigger`), animata (nested scroller detection), GSAP docs, JAL-authored (pin law, dev-only gate).

### 2.1 Anatomy

- Defaults when unset: `start` `"top bottom"` (`"top top"` when pinned), `end` `"bottom top"`, `toggleActions` `"play none none none"`. Write start and end explicitly anyway so a reviewer can read the range. A bare number is an absolute scroll offset in px; `"max"` is the maximum scroll (a footer trigger). `"+=N"` and `"+=N%"` measure from start, percentages of the scroller height.
- `start` and `end` read "trigger edge, viewport edge": `"top 80%"`, `"bottom top"`, or relative `"+=100%"`.
- Functions for `start` and `end` are called again on every refresh regardless of other options. `invalidateOnRefresh: true` is a separate switch that flushes the linked tween's recorded values, so function-based tween values (`x: () => ...`) are re-measured. A responsive horizontal track or a content-sized range needs both.
- `clamp()` (3.12 and up): `start: "clamp(top bottom)"`, `end: "clamp(bottom top)"` so a trigger already on screen at load starts at progress 0 instead of partly played, and one near the page bottom can still reach 1. Use it on every scrubbed trigger in the first and last viewport; not on pinned ranges sized with `"+="`.
- `endTrigger: ".proof-end"` measures `end` against a different element than `trigger` (a caption that ends when a later block reaches the top), both in the same component scope so they revert together.
- A trigger inside a scrollable panel (dialog, docs pane, anything with `data-lenis-prevent`) needs `scroller: panelEl`, or it measures the page and never fires; refresh it when the panel changes. When the component cannot know its container, take the nearest ancestor whose computed `overflow-y` is `auto` or `scroll` (window if none), and use that same element as any IntersectionObserver `root` and scroll listener target. If Lenis ever runs on a wrapper instead of the window, set `ScrollTrigger.defaults({ scroller: wrapper })` once.
- `toggleActions` slots map in order to onEnter, onLeave, onEnterBack, onLeaveBack; each takes play, pause, resume, reset, restart, complete, reverse, or none. Content reveals keep `"play none none none"`. Pausing loops and Players offscreen is `"play pause resume pause"`. Never reverse or reset content on leave: it hides text the reader already passed.
- **Callbacks** receive the instance (`progress` 0 to 1, `direction` 1 down and -1 up, `isActive`, `getVelocity()` in px per second). `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` fire on the four crossings, in the toggleActions slot order. `onToggle` fires when `isActive` flips: start and stop render-on-demand for a canvas (the dirty flag in section 8) or set `aria-current`. `onRefresh` fires after positions are recalculated, the one place to cache layout reads so `onUpdate` never reads layout. `onScrubComplete` fires when a numeric scrub finishes catching up, the moment to clear the settling flag in section 9.
- Two modes, never both on one trigger:
  - `toggleActions: "play none none none"`: discrete, played once on enter;
  - `scrub`: progress follows scroll. `scrub: true` is locked to scroll; `scrub: 0.6` adds 0.6s catch-up.
  If both are set, scrub silently wins. That is a bug; remove one.
- A ScrollTrigger lives on a timeline or a top-level tween only. Never on a tween nested inside a timeline, never nested triggers.

### 2.2 Pin

- `pin: true` holds the trigger for the scroll range. Animate the pinned element's children, never the pinned element itself.
- `pin` also takes an element or selector: pin the section wrapper and move the track or children inside it. The pinned node never moves; for a horizontal track the trigger stays still and the child moves. If a design truly needs the trigger to move, offset start and end by the same distance, or positions are read from where it was.
- `pinSpacing` stays at its default `true`. Never `pinSpacing: false` over content: following content would slide under the pinned block and break the no-overlap law. There is no JAL case for it.
- Size the range to the steps: `end: () => "+=" + steps * 100 + "%"`, with `invalidateOnRefresh: true`.
- `anticipatePin: 1` removes the one-frame jump when a fast scroll hits the pin.
- Pinned content must fit `100svh` at every width it pins at, with no inner scroll.
- Never pin below 768px, never pin two adjacent sections, never pin forms, tables, or anything with its own scroll.

### 2.3 Snap

`snap: { snapTo: "labels", duration: { min: dur.base, max: dur.show2 }, delay: 0.1, ease: "jal-standard" }` on a pinned sequence, so each step comes to rest on its label. Snap is unavailable on `containerAnimation` triggers.

`snap` also takes a number (a progress increment, `1 / (steps - 1)` for equal steps), an array of allowed progress values, or a function `(value, self) => snapped`. JAL always uses the object form so `ease: "jal-standard"` and token durations apply. `snapTo: "labelsDirectional"` snaps in the scroll direction and avoids snapping back **[verify]** against the installed version.

### 2.4 Batch

`ScrollTrigger.batch(targets, { start, once, interval, batchMax, onEnter })` groups elements that enter together into one staggered tween. It is the replacement for hand-rolled IntersectionObserver reveals. Never pass `trigger`, `scrub`, `snap`, `toggleActions`, `animation`, `invalidateOnRefresh`, `onSnapComplete`, or `onScrubComplete` to batch.

`interval` is the collection window in seconds (about one frame by default); the batch fires when it closes, or earlier when `batchMax` elements are collected. Make `batchMax` a function returning the current column count so a grid row arrives together at every breakpoint (it is re-read on refresh). The combined stagger still respects `CASCADE_CAP`.

### 2.5 Refresh order

- Refresh runs in creation order. Create triggers top to bottom in page order, or set `refreshPriority` (lower refreshes first) and call `ScrollTrigger.sort()`.
- A pin above changes every trigger below it. That is why order matters: a lower trigger measured before an upper pin spacer exists lands at the wrong place.
- Call `ScrollTrigger.refresh()` after `document.fonts.ready`, after hero images decode, and after injected content changes layout. Resize refresh is automatic (debounced).
- On route change without `useGSAP`: kill by id, or `ScrollTrigger.getAll().forEach((t) => t.kill())`.

### 2.6 Markers in dev only

`markers: __DEV__`, where `__DEV__` is a Bun.build `define` that is `false` in production. The gate greps `dist/` for `markers:` and `GSDevTools` and fails on a hit.

### 2.7 Scroll state without animation

`toggleClass: { targets: ".toc-proof", className: "is-active" }` adds a class while the range is active, the cheapest scroll-spy table of contents. With `start: "top center"` and `end: "bottom center"` exactly one section is active at a time. The class switches state tokens only (ink colour, weight) and `onToggle` sets `aria-current`; it never draws an underline, marker dot, or pill.

## 3. SplitText

From: gsap-skills (`gsap-plugins` SplitText), remotion (ideas only: measure text after fonts load), GSAP docs, JAL-authored (units, token staggers, accessibility law).

Build home of `gsap.splittext_reveal`.

```ts
SplitText.create(heading, {
  type: "lines",          // split only what you animate: lines, words, or chars
  mask: "lines",          // clip box per line, clean reveal, no neighbor overlap
  autoSplit: true,        // re-split on font load and width change
  onSplit: (self) =>
    gsap.from(self.lines, { yPercent: 100, autoAlpha: 0, stagger: stagger.line, duration: dur.show2 }),
});
```

- Return the animation from `onSplit` so a re-split reverts and resyncs it.
- Without `autoSplit`, split after `document.fonts.ready`, or line breaks are computed on the fallback font.
- Units: lines for headings and lead paragraphs, words for short display headings, chars only for display text of 24 characters or fewer.
- The default `aria: "auto"` labels the parent and hides fragments from screen readers. Keep it.
- `text-wrap: balance` fights the split: turn it off on split targets. SplitText does not work on SVG `<text>`.
- `revert()` on unmount. Context revert (useGSAP) does this for you.
- Chars without words or lines can break a word across lines: add `smartWrap: true`, or split words too. Span fragments need `display: inline-block` (some browsers skip transforms on inline elements). `deepSlice` (default true) cuts nested `<strong>` or `<a>` that span lines; `ignore: "sup, .no-split"` keeps parts whole; `reduceWhiteSpace` (default true) collapses spaces and honours `<br>`. Char-split targets get `font-kerning: none; text-rendering: optimizeSpeed` so letters do not shift at the split.
- `linesClass: "line++"` numbers each line's class. `propIndex: true` writes `--line`, `--word`, or `--char` index variables, so a CSS-only reveal can use `transition-delay: calc(var(--word) * var(--stagger-word))` from the same tokens, capped the same way (section 1.3).
- `aria: "auto"` puts the text in an `aria-label` and hides the fragments, which also hides any link inside. When split text holds links or other semantics, use `aria: "none"` plus a visually hidden copy with the real markup, split copy `aria-hidden`. Never ship a split paragraph whose links are unreachable.
- Languages without spaces (Chinese, Japanese, Thai): insert break markers with `prepareText(text, el)` from `Intl.Segmenter` (granularity `"word"`) and split on them with `wordDelimiter`. A custom `wordDelimiter` RegExp keeps hashtags or product codes whole.

## 4. Flip

From: gsap-skills (`gsap-plugins` Flip, Draggable, InertiaPlugin, Observer, MotionPathPlugin), GSAP docs, JAL-authored (no-overshoot and content-only rules).

Build home of `gsap.flip_transition` (4.1 to 4.3 cover Draggable, Inertia, Observer, and MotionPath).

Record, mutate, animate:

```ts
const state = Flip.getState(cards);
grid.append(...sorted);               // reorder, reparent, or toggle a class
Flip.from(state, { duration: dur.slow, ease: "jal-standard", scale: true, absolute: true, nested: true });
```

Flip turns position changes into transforms. For size changes it animates width and height unless `scale: true` is set (the gsap-skills table and the GSAP docs disagree on the default, so never rely on it). **JAL rule: every Flip passes `scale: true` explicitly**, so width and height never tween (section 12). A text block that would visibly squash is not size-Flipped: Flip its container and crossfade the text inside it in 150 to 200ms. `simple: true` skips rotation and skew math on large grids; `absolute: true` takes elements out of flow during the flip so siblings do not reflow; `nested: true` handles flipped elements inside flipped elements. For layout driven by React state, Framer Motion `layout` is the smaller tool. Use Flip when the change is a beat inside a GSAP timeline or crosses component boundaries.

### 4.1 Draggable and inertia

Framer Motion drag stays the default for React-state carousels (R32). Use `Draggable.create(el, { type, bounds, edgeResistance: 1, cursor: "grab" })` when a drag must drive a GSAP timeline (`onDrag` setting `tl.progress()`), for rotation knobs (`type: "rotation"`), or drag-to-scrub. Always `bounds` plus `edgeResistance: 1`: no rubber band past the edge (that is overshoot). With InertiaPlugin, `inertia: true` plus `snap` to cell positions ends every throw on a cell; the glide is deceleration, never a bounce. `InertiaPlugin.track(el, "x")` plus `inertia: { x: "auto" }` lets a pointer-driven value glide to rest. Reduced motion: inertia off, snap with a `jal-standard` tween. Create inside `useGSAP` (or `kill()` in cleanup), 44px handles, and an equal keyboard or button path.

### 4.2 Observer for gesture intent

`Observer.create({ target, type: "wheel,touch,pointer", tolerance: 10, onUp, onDown, onLeft, onRight })` turns wheel, touch, and pointer input into one directional intent: swipe-to-step inside a pinned tier 3 section, or swipe to rotate a product on a canvas. Never global scroll hijacking. While an Observer owns input, `lenis.stop()`, and `lenis.start()` on release; debounce so one gesture moves one step. Keyboard and reduced-motion users get step buttons with the same outcome. Kill it in cleanup.

### 4.3 MotionPath (DOM and SVG)

`motionPath: { path: "#route", align: "#route", alignOrigin: [0.5, 0.5], autoRotate: true }` moves an element along an SVG path, or along a point array with `curviness` (0 straight, 1 default, up to 2); `start` and `end` (0 to 1) travel part of the path. JAL use: an object travelling a route that is content (a parcel on a delivery map, a marker on a process diagram), never a decorative orbit. The path is drawn only if it is itself content, never as a connector ornament. Scrubbed travel uses `ease: "none"`, discrete hops `jal-standard`. 3D cameras use the CatmullRom approach in section 9 or drei `MotionPathControls`. MotionPathHelper is dev only (section 2.6 grep).

## 5. matchMedia and reduced motion

From: gsap-skills (`gsap-core` matchMedia), GSAP docs, JAL-authored (reduced-motion collapse law).

One `gsap.matchMedia()` per section, conditions form, so one code path branches cleanly:

```ts
const mm = gsap.matchMedia(scope);
mm.add(
  { isDesktop: "(min-width: 1024px)", isMobile: "(max-width: 1023px)", reduce: "(prefers-reduced-motion: reduce)" },
  (ctx) => {
    const { isDesktop, reduce } = ctx.conditions!;
    if (reduce) return; // final state is already on screen: no trigger, no pin, no split
    gsap.set(".reveal", { autoAlpha: 0, y: 16 }); // hidden only inside the motion branch
    // ...build this section's timeline and triggers
  },
);
```

- Everything created in a handler reverts when its query stops matching. `mm.revert()` on unmount (useGSAP does it).
- Do not nest `gsap.context()` inside matchMedia; it already is one.
- Reduced motion is a real collapse, not `duration: 0`: no ScrollTrigger, no pin, no split, no scroll-linked camera. At most an opacity crossfade of 150ms or less.
- Never hide content in CSS (`opacity: 0` in a stylesheet). Set the hidden start state with `gsap.set` inside the motion branch, so no-JS, reduced motion, and a failed bundle all show the finished page.
- `gsap.matchMediaRefresh()` after an in-page motion toggle.
- GSAP objects made in an `mm.add` handler revert on their own; listeners, observers, Lenis options, and R3F dirty flags do not. Return a cleanup function from the handler: it runs whenever the query stops matching (resize across the breakpoint, reduced motion switched on) as well as on `mm.revert()`.

## 6. React integration

From: gsap-skills (`gsap-react`), GSAP docs (`@gsap/react`), JAL-authored.

```tsx
export function Proof() {
  const scope = useRef<HTMLElement>(null);
  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        if (ctx.conditions!.reduce) return;
        ScrollTrigger.batch(".proof-item", {
          start: "top 85%",
          once: true,
          onEnter: (els) => gsap.from(els, { autoAlpha: 0, y: 16, stagger: stagger.item }),
        });
      });
    },
    { scope },
  );
  const nudge = contextSafe(() => gsap.to(".proof-cta", { scale: 0.98, duration: dur.micro, yoyo: true, repeat: 1 }));
  return <section ref={scope}>...</section>;
}
```

- Always pass `scope`, so class selectors match only inside the component.
- `useGSAP` reverts tweens, timelines, triggers, and splits on unmount.
- Anything created later (event handlers, timers) goes through `contextSafe`; remove listeners in the hook's returned cleanup.
- `dependencies` plus `revertOnUpdate: true` when the choreography must rebuild on a prop change.
- Fallback without the hook: `const ctx = gsap.context(fn, ref)` in `useEffect`, return `() => ctx.revert()`.
- GSAP is client only. Never run it during server render.
- StrictMode mounts, unmounts, and mounts again in dev. `useGSAP` reverts between the runs so `from()` tweens, splits, and pin spacers never double. A raw `useEffect` without `ctx.revert()` leaves a duplicate tween and a second pin spacer that only shows in dev. Keep StrictMode on and treat a jumping pin or a stagger that plays twice in dev as a missing-cleanup bug.
- Target the element (`boxRef.current`), never the ref object: GSAP would animate the plain object and nothing moves, with no error. A null `current` inside `useGSAP` means the ref sits on a conditionally rendered node.

## 7. Choreography patterns

From: JAL-authored (patterns, tiers, pin law), gsap-skills (`gsap-scrolltrigger` horizontal and pinned examples, corrected), GSAP docs.

Build home of `gsap.reveal`, `gsap.stagger_sequence`, `gsap.scrub`, `gsap.pinned_sequence`, and `gsap.horizontal_track` (the pattern names below are these IDs without the prefix). The live DOM demo (`gsap.live_dom_demo`) and poster steps (`frame.poster_steps`) are built in `frames.md` sections 8 and 9.

Pick by what the content is, never by taste. JEV `motion.choreography` makes the call (section 11).

| Pattern | Use when | Tier | Build |
|---|---|---|---|
| `reveal` | independent peers (cards, logos, proof points) that just need to arrive | 1+ | `ScrollTrigger.batch`, `once: true`, `autoAlpha` plus `y: 16`, `stagger.item` |
| `stagger_sequence` | a small group read in order (headline, body, action) | 2+ | labelled timeline, `toggleActions: "play none none none"`, SplitText lines on the headline |
| `scrub` | one element or parent transform should track reading progress without holding the page | 2+ | `scrub: 0.6` on a parent "camera" transform, no pin, beats inside eased with `jal-standard` |
| `pinned_sequence` | 3 or more ordered steps that must be read in the same frame | 3 | `pin: true`, default pinSpacing, `scrub`, `snap: "labels"`, end sized to steps |
| `horizontal_track` | a wide set of peer panels browsed sideways | 3, desktop only | pinned wrapper, track `xPercent` with `ease: "none"`, nested triggers use `containerAnimation` |

Sketches:

```ts
// pinned_sequence
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".steps", pin: true, scrub: true, anticipatePin: 1,
    end: () => "+=" + steps.length * 100 + "%", invalidateOnRefresh: true,
    snap: { snapTo: "labels", duration: { min: dur.base, max: dur.show2 }, ease: "jal-standard" },
  },
});
steps.forEach((step, i) => {
  tl.addLabel(`s${i}`);
  if (i > 0) tl.from(step, { autoAlpha: 0, y: 24 }).to(steps[i - 1], { autoAlpha: 0, ease: "jal-exit" }, "<");
});

// horizontal_track (inside the isDesktop branch only; mobile gets stagger_sequence)
const trackEl = document.querySelector<HTMLElement>(".track")!;
const distance = () => trackEl.scrollWidth - window.innerWidth;           // px form: works when panels differ in width
const track = gsap.to(trackEl, {
  x: () => -distance(), ease: "none",
  scrollTrigger: { trigger: ".track-wrap", pin: true, scrub: true, end: () => "+=" + distance(), invalidateOnRefresh: true },
});
gsap.from(".panel-title", { autoAlpha: 0, y: 16, scrollTrigger: { trigger: ".panel-title", containerAnimation: track, start: "left 70%" } });
```

In a pinned sequence, the outgoing step fades as the incoming one arrives, so two steps never sit on top of each other. Screenshot at progress 0, 0.5, and 1 to prove it.

- **Track distance.** `xPercent` is a percentage of the tweened element's own width. Either tween the panels array (each 100vw) with `xPercent: -100 * (panels.length - 1)`, or tween the track in px as sketched above. Applying `-100 * (n - 1)` percent to a track that is n panels wide moves it n times too far.
- **Scrubbed duration is a scroll ratio.** A timeline's duration is the sum of its children's placement, and under scrub each child's duration is a share of the pinned range, not seconds. Give every step the same unit (duration 1 per step) so steps get equal scroll, and add a dwell with an empty spacer (`tl.to({}, { duration: 0.5 })`) so a step rests before the next starts. `end` sized from the step count keeps scroll per unit constant across breakpoints.

## 8. Lenis and the single frame loop

From: Lenis docs, gsap-skills (`gsap-scrolltrigger` scroller wiring, ScrollToPlugin), pmndrs docs (R3F `frameloop` and `advance`), animata (frame-rate-independent follow), JAL-authored (one clock).

One rAF for the whole page, owned by `gsap.ticker`. Lenis, ScrollTrigger, and the R3F canvas all hang off it.

```ts
const lenis = new Lenis({ autoRaf: false }); // respectReducedMotion stays at its default (on)
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000), false, true); // prioritized: scroll first
gsap.ticker.lagSmoothing(0); // never stall scroll after a long frame
```

React: `<ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />`, then one effect adds the ticker callback (`lenisRef.current?.lenis?.raf(time * 1000)`) and removes it in cleanup.

R3F joins the same loop. Give the canvas `frameloop="never"` and advance it from the ticker, after Lenis and ScrollTrigger have written this frame's progress:

```tsx
import { advance } from "@react-three/fiber";

const dirty = { current: true }; // set by ScrollTrigger onUpdate, pointer, resize
useEffect(() => {
  const tick = (time: number) => {
    if (!dirty.current && !settling()) return; // render on demand
    dirty.current = false;
    advance(time * 1000);
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}, []);
// <Canvas frameloop="never" dpr={[1, 2]}>...</Canvas>
```

Order inside one tick: GSAP renders tweens, Lenis moves scroll and fires `ScrollTrigger.update`, triggers write progress into refs, R3F renders reading those refs. No second rAF, no `useFrame` loop running on its own clock, no GSAP ScrollSmoother.

Lenis details:

- `data-lenis-prevent` on nested scroll areas (dialogs, code blocks, maps).
- `anchors: true` for smooth in-page links.
- `lenis.stop()` while a dialog is open, `lenis.start()` on close.
- `lenis.destroy()` and remove the ticker callback on unmount. No stray tickers.
- No `scrollerProxy` with Lenis: Lenis moves the real native scroll position, so `lenis.on("scroll", ScrollTrigger.update)` is the only wiring. A proxy next to Lenis double-maps positions and makes pins jitter.
- Page-level scroll-to goes through Lenis: `lenis.scrollTo(target, { offset: -headerHeight, duration: dur.show2, easing })` with the easing matching `jal-standard`, `immediate: true` under reduced motion, then move focus to the target. ScrollToPlugin (`scrollTo: { y: "#id", offsetY: 16 }`) is only for inner containers that opt out with `data-lenis-prevent`; never tween `window` with it while Lenis runs.

## 9. Scroll-driven camera paths for R3F

Build section for `three.scroll_camera`.

From: ai-dev-kit (`threejs-scene` scroll camera rules), Threejs-Awesome-Graphics-Agent-Skills (camera skill: pose snap, rigid anchoring, docking corridor and terminal lock; ideas in own words), webgpu-claude-skill (scene pass transition, own words), remotion (ideas only: arc-length speed), three.js docs (MIT), JAL-authored.

One ScrollTrigger per 3D section maps scroll to a normalized progress in a ref. The render step samples an authored path and writes the camera once.

```ts
const beats = [
  { pos: new Vector3(0, 1.2, 6), look: new Vector3(0, 1, 0), fov: 35 },
  { pos: new Vector3(2.5, 1.6, 3.5), look: new Vector3(0, 1.1, 0), fov: 30 },
  { pos: new Vector3(0, 2.4, 2.2), look: new Vector3(0, 0.9, 0), fov: 28 },
];
const posPath = new CatmullRomCurve3(beats.map((b) => b.pos));
const lookPath = new CatmullRomCurve3(beats.map((b) => b.look));
const progress = { target: 0, shown: 0 };

ScrollTrigger.create({ trigger: section, start: "top top", end: "+=300%", pin: true, scrub: true,
  onUpdate: (st) => { progress.target = st.progress; dirty.current = true; } });

function applyCamera(camera: PerspectiveCamera, dt: number) {
  progress.shown += (progress.target - progress.shown) * (1 - Math.exp(-8 * dt)); // frame-rate independent
  const p = progress.shown;
  camera.position.copy(posPath.getPointAt(p));
  camera.lookAt(lookPath.getPointAt(p));
  const seg = Math.min(Math.floor(p * (beats.length - 1)), beats.length - 2);
  const t = p * (beats.length - 1) - seg;
  camera.fov = beats[seg].fov + (beats[seg + 1].fov - beats[seg].fov) * t;
  camera.updateProjectionMatrix();
}
```

- Derive every camera value from progress, never from accumulated scroll deltas, so scrubbing backward is exact.
- One smoother only. Lenis already smooths the scroll signal, so with Lenis on use `scrub: true` and no damp (the camera follows the smoothed progress directly). Without Lenis, either `scrub: true` plus the exponential damp above, or `scrub: 0.6` and no damp. Two smoothers stacked stall mid-transition.
- Put easing in the damp, not in the scroll mapping. For orientation handoffs between authored quaternions, `slerp`, never Euler lerp.
- Stage subjects in the shot's own basis (camera forward, right, up), not free world coordinates.
- Keep "settling" true for a short tail after the last scroll event so the damp finishes, then stop rendering. When the remaining difference falls under a small epsilon (about 0.0005 of the progress range, or half a pixel of motion), copy the target pose exactly and stop: an exponential never arrives and leaves a permanent subpixel tail.
- When the subject itself moves fast (a product flying in on scroll), anchor the camera rigidly in the subject's frame for that beat instead of following it with lag, then hand back to the path with one interpolation.
- **Assembly beats.** When a part slots into a host on a scroll beat, split its offset from the port into an along-axis part `dot(offset, axis)` and a radial part; interpolate the axial distance down to a small clearance and the radial error to zero on separate eased ranges, so the part travels a readable corridor and aligns before it seats. If a spring drives it, finish with a terminal lock: once the beat passes about 0.995, copy the exact seated pose and zero velocity. Reduced motion shows the seated still.
- Reduced motion: no scroll-linked camera. Each section shows its authored beat as a still (or the poster image), switched with a crossfade of 150ms or less.
- DPR capped at 2 (`dpr={[1, 2]}`). Pause the canvas when its section is offscreen.
- **Scene handoff inside one canvas** (WebGPU): `transition(passA.getTextureNode(), passB.getTextureNode(), progress, maskTexture)` blends two scene passes with an optional wipe mask, `progress` from a ScrollTrigger for a chapter change. Both scenes render during the blend, so only the active one renders outside the overlap; reduced motion snaps to the end state.

## 10. Motion intensity tiers

From: JAL-authored.

Set per section by JEV `motion.intensity`. At most one tier 3 section per page. Product UI (app screens, forms, tables, settings) is capped at tier 1 and uses the product durations (`--dur-200`, 4px travel). Legal, pricing tables, docs, and forms are tier 0.

| Tier | Name | Allows | Never |
|---|---|---|---|
| 0 | Still | state layers from jal-motion only | entrances, scroll links |
| 1 | Quiet | one entrance per section, played once on enter: `autoAlpha` plus `y` of 8 to 16px, `--dur-400`, `reveal` pattern | SplitText, scrub, pin |
| 2 | Staged | sequenced reveal of the section's parts, SplitText lines or words on the headline, stagger tokens, at most one light scrubbed element | pin, horizontal track, camera paths |
| 3 | Cinematic | pinned sequence, horizontal track (desktop), scroll camera path in R3F, a frames Player tied to scroll | a second tier 3 on the page, a pin below 768px |

Every tier: reduced motion collapses to the static final state, `ui_audit` passes at every width, and the page reads fully with motion off.

## 11. How JEV feeds in

From: JAL-authored.

Question shapes and IDs live in `skills/jal-jev/references/catalog.md`. The agent asks, then builds exactly what the answers say.

1. **`motion.intensity`** (`score`, levels 0 to 3), once per section before any motion is written.
   - Precheck: product UI capped at 1; legal, pricing, docs, forms fixed at 0; if a tier 3 already exists, cap at 2. Reduced motion is law, never asked.
   - Action: round the weighted score, clamp to the cap. Low confidence takes the lower of the top two.
2. **`motion.choreography`** (`choice` over the five patterns in section 7), for tier 1 and up.
   - Precheck: tier 1 is always `reveal`, not asked. `pinned_sequence` and `horizontal_track` are offered only at tier 3. `horizontal_track` is never offered below 1024px; mobile falls back to `stagger_sequence`.
   - Action: confidence 0.5 or more builds the pick. A low-confidence tie between a pinned and a non-pinned option takes the non-pinned one.
3. **`motion.pin`** (`noul`), only when choreography is `pinned_sequence` or `horizontal_track`, before the ScrollTrigger is written.
   - Precheck: never below 768px, never adjacent pins, never forms, tables, or inner scroll. `pinSpacing` stays true, not asked.
   - Action: 0.6 or more pins with the range sized to steps and `snap: "labels"`. Under 0.6 or low confidence downgrades to `stagger_sequence`.

Log each answer (question, answer, confidence, what was built) in the build report. No JEV answer can grant a law exception.

## 12. Performance rules

From: gsap-skills (`gsap-performance`), ai-dev-kit (performance standards), animata (batch reads before writes), JAL-authored (transform-only law, budgets).

- Only `transform` and `autoAlpha` tween. Never `width`, `height`, `top`, `left`, `margin`, `filter`, `boxShadow`, `backgroundColor`, or a gradient. A section color change on scroll is a crossfade of two solid layers.
- `will-change: transform` right before a tween and cleared after (`onComplete`), never blanket in CSS. GSAP's default `force3D: "auto"` already promotes a layer only while tweening; never set `force3D: true` globally or in `gsap.defaults`.
- A numeric custom property can carry one scrubbed value to many CSS-only children (`gsap.to(el, { "--p": 1 })`, read through `calc()` in `transform` or `opacity`). Set it on the smallest subtree (every change restyles descendants). Never sweep colours, hues, or gradient stops with it.
- Never create a tween or timeline inside `onUpdate`, a ticker callback, or `pointermove`. Build hover and toggle timelines once, paused; `quickTo` for continuous values; rebuild only through `useGSAP` `dependencies` with `revertOnUpdate`. A `gsap.globalTimeline.getChildren().length` that grows while you scroll or move the pointer is a leak.
- No layout reads inside `onUpdate`. Read in refresh, write in the tick. Batch reads before writes.
- Prefer one staggered tween and `ScrollTrigger.batch` over hundreds of tweens or triggers.
- Pause offscreen work: canvases, marquees, and Players stop when their section leaves the viewport or the tab is hidden.
- Refresh only on real layout change.
- Lazy-load three (`import()`) when its section nears the viewport; the poster renders first.
- Test on a low-end phone profile. A tier 3 section that drops frames there downgrades to tier 2 on mobile.

## 13. Common mistakes checklist

From: gsap-skills (common mistakes across `gsap-core`, `gsap-scrolltrigger`, `gsap-react`), JAL-authored.

Before returning motion work, grep and check:

- [ ] Plugin used before `registerPlugin`, or registered inside a component.
- [ ] ScrollTrigger on a tween nested in a timeline, or nested triggers.
- [ ] `scrub` and `toggleActions` on the same trigger.
- [ ] A non-`none` ease on a `containerAnimation` track.
- [ ] Triggers created out of page order without `refreshPriority`.
- [ ] No `refresh()` after fonts, images, or injected content.
- [ ] `markers: true`, `GSDevTools`, or `ScrollSmoother` reachable in production.
- [ ] Selectors without a `scope`, or missing cleanup (Lenis not destroyed, ticker callback not removed).
- [ ] Stacked `from()` tweens without `immediateRender: false`.
- [ ] Kebab-case vars (`"transform-origin"`, `"background-color"`) instead of camelCase (`transformOrigin`); custom properties are the only quoted, dashed exception.
- [ ] A ref object passed as a target instead of `ref.current`.
- [ ] `xPercent: -100 * (n - 1)` on a track that is n panels wide.
- [ ] `scrollerProxy` next to Lenis, or ScrollToPlugin tweening `window` while Lenis runs.
- [ ] `pinSpacing: false`, a pin below 768px, or two adjacent pins.
- [ ] Content hidden by CSS instead of by `gsap.set` inside the motion branch.
- [ ] Chained `delay` instead of a timeline position.
- [ ] Invented ease names; `back`, `elastic`, or `bounce` anywhere; a duration literal instead of a token.
- [ ] `Math.random()` or `Date.now()` in an animation callback; `from: "random"` in a stagger.
- [ ] A second rAF loop next to `gsap.ticker` (a free-running `useFrame`, a raw `requestAnimationFrame` scroll handler).
- [ ] Two smoothers stacked on one camera (Lenis plus a damp, or a scrub number plus a damp).
- [ ] GSAP executed during server render.
- [ ] Reduced motion leaves any trigger, pin, split, parallax, or camera drift alive.
- [ ] Any `remotion` or `@remotion/*` import.
