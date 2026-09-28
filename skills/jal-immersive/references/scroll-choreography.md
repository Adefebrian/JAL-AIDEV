# Scroll and time choreography

Expert reference for GSAP, ScrollTrigger, SplitText, Flip, Lenis, and scroll-driven R3F cameras on JAL. Read `skills/jal-motion/SKILL.md` first: it owns the token scale, the one curve, and the law. This file owns how motion is choreographed against time and scroll. For frame-driven "video" pieces use `frames.md` instead.

Stack: `bun add gsap @gsap/react lenis`. Every GSAP plugin is free (since the 2024 Webflow licensing change) and allowed. JAL law still decides what each one may be used for (section 1.4). No auth token, private registry, or Club membership is ever needed; any doc or agent that says otherwise is outdated.

## 1. GSAP core

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

### 1.4 Eases and the linear exception

- Everything that starts and stops: `jal-standard` (entrance) or `jal-exit` (exit). Nothing else.
- Linear (`ease: "none"`) only where the motion has no start or stop to shape:
  - constant-speed loops: marquee, spinner, indeterminate progress;
  - scroll-mapped tracks where scroll is the easing: a `containerAnimation` horizontal track (mandatory, or position and scroll drift apart), and the outer mapping of a scrubbed timeline.
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
- `overwrite: "auto"` for interruptible hover or toggle motion.
- `gsap.quickTo(el, "x", { duration: dur.fast, ease: "jal-standard" })` for pointer followers: one tween reused, not one per event.

## 2. ScrollTrigger

### 2.1 Anatomy

- `start` and `end` read "trigger edge, viewport edge": `"top 80%"`, `"bottom top"`, or relative `"+=100%"`. Functions are allowed and re-evaluate on refresh with `invalidateOnRefresh: true`.
- Two modes, never both on one trigger:
  - `toggleActions: "play none none none"`: discrete, played once on enter;
  - `scrub`: progress follows scroll. `scrub: true` is locked to scroll; `scrub: 0.6` adds 0.6s catch-up.
  If both are set, scrub silently wins. That is a bug; remove one.
- A ScrollTrigger lives on a timeline or a top-level tween only. Never on a tween nested inside a timeline, never nested triggers.

### 2.2 Pin

- `pin: true` holds the trigger for the scroll range. Animate the pinned element's children, never the pinned element itself.
- `pinSpacing` stays at its default `true`. Never `pinSpacing: false` over content: following content would slide under the pinned block and break the no-overlap law. There is no JAL case for it.
- Size the range to the steps: `end: () => "+=" + steps * 100 + "%"`, with `invalidateOnRefresh: true`.
- `anticipatePin: 1` removes the one-frame jump when a fast scroll hits the pin.
- Pinned content must fit `100svh` at every width it pins at, with no inner scroll.
- Never pin below 768px, never pin two adjacent sections, never pin forms, tables, or anything with its own scroll.

### 2.3 Snap

`snap: { snapTo: "labels", duration: { min: dur.base, max: dur.show2 }, delay: 0.1, ease: "jal-standard" }` on a pinned sequence, so each step comes to rest on its label. Snap is unavailable on `containerAnimation` triggers.

### 2.4 Batch

`ScrollTrigger.batch(targets, { start, once, interval, batchMax, onEnter })` groups elements that enter together into one staggered tween. It is the replacement for hand-rolled IntersectionObserver reveals. Never pass `trigger`, `scrub`, `snap`, `toggleActions`, or `animation` to batch.

### 2.5 Refresh order

- Refresh runs in creation order. Create triggers top to bottom in page order, or set `refreshPriority` (lower refreshes first) and call `ScrollTrigger.sort()`.
- A pin above changes every trigger below it. That is why order matters: a lower trigger measured before an upper pin spacer exists lands at the wrong place.
- Call `ScrollTrigger.refresh()` after `document.fonts.ready`, after hero images decode, and after injected content changes layout. Resize refresh is automatic (debounced).
- On route change without `useGSAP`: kill by id, or `ScrollTrigger.getAll().forEach((t) => t.kill())`.

### 2.6 Markers in dev only

`markers: __DEV__`, where `__DEV__` is a Bun.build `define` that is `false` in production. The gate greps `dist/` for `markers:` and `GSDevTools` and fails on a hit.

## 3. SplitText

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

## 4. Flip

Record, mutate, animate:

```ts
const state = Flip.getState(cards);
grid.append(...sorted);               // reorder, reparent, or toggle a class
Flip.from(state, { duration: dur.slow, ease: "jal-standard", absolute: true, nested: true });
```

Flip turns a layout change into transforms, so width and height never animate. For layout driven by React state, Framer Motion `layout` is the smaller tool. Use Flip when the change is a beat inside a GSAP timeline or crosses component boundaries.

## 5. matchMedia and reduced motion

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

## 6. React integration

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

## 7. Choreography patterns

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
const track = gsap.to(".track", {
  xPercent: -100 * (panels.length - 1), ease: "none",
  scrollTrigger: { trigger: ".track-wrap", pin: true, scrub: true, end: () => "+=" + trackWidth(), invalidateOnRefresh: true },
});
gsap.from(".panel-title", { autoAlpha: 0, y: 16, scrollTrigger: { trigger: ".panel-title", containerAnimation: track, start: "left 70%" } });
```

In a pinned sequence, the outgoing step fades as the incoming one arrives, so two steps never sit on top of each other. Screenshot at progress 0, 0.5, and 1 to prove it.

## 8. Lenis and the single frame loop

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

## 9. Scroll-driven camera paths for R3F

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
- Keep "settling" true for a short tail after the last scroll event so the damp finishes, then stop rendering.
- Reduced motion: no scroll-linked camera. Each section shows its authored beat as a still (or the poster image), switched with a crossfade of 150ms or less.
- DPR capped at 2 (`dpr={[1, 2]}`). Pause the canvas when its section is offscreen.

## 10. Motion intensity tiers

Set per section by JEV `motion.intensity`. At most one tier 3 section per page. Product UI (app screens, forms, tables, settings) is capped at tier 1 and uses the product durations (`--dur-200`, 4px travel). Legal, pricing tables, docs, and forms are tier 0.

| Tier | Name | Allows | Never |
|---|---|---|---|
| 0 | Still | state layers from jal-motion only | entrances, scroll links |
| 1 | Quiet | one entrance per section, played once on enter: `autoAlpha` plus `y` of 8 to 16px, `--dur-400`, `reveal` pattern | SplitText, scrub, pin |
| 2 | Staged | sequenced reveal of the section's parts, SplitText lines or words on the headline, stagger tokens, at most one light scrubbed element | pin, horizontal track, camera paths |
| 3 | Cinematic | pinned sequence, horizontal track (desktop), scroll camera path in R3F, a frames Player tied to scroll | a second tier 3 on the page, a pin below 768px |

Every tier: reduced motion collapses to the static final state, `ui_audit` passes at every width, and the page reads fully with motion off.

## 11. How JEV feeds in

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

- Only `transform` and `autoAlpha` tween. Never `width`, `height`, `top`, `left`, `margin`, `filter`, `boxShadow`, `backgroundColor`, or a gradient. A section color change on scroll is a crossfade of two solid layers.
- `will-change: transform` right before a tween and cleared after (`onComplete`), never blanket in CSS.
- No layout reads inside `onUpdate`. Read in refresh, write in the tick. Batch reads before writes.
- Prefer one staggered tween and `ScrollTrigger.batch` over hundreds of tweens or triggers.
- Pause offscreen work: canvases, marquees, and Players stop when their section leaves the viewport or the tab is hidden.
- Refresh only on real layout change.
- Lazy-load three (`import()`) when its section nears the viewport; the poster renders first.
- Test on a low-end phone profile. A tier 3 section that drops frames there downgrades to tier 2 on mobile.

## 13. Common mistakes checklist

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
