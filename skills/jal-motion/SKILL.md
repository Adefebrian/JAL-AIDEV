---
user-invocable: false
name: jal-motion
description: JAL's motion system, with Remotion as the core motion engine and the supplements that layer with it (kit CSS motion, Lenis plus GSAP, Framer Motion, Three.js and R3F, the frame core, noyzzi and component libraries), restrained product UI motion and richer showcase choreography, the duration/easing token scale, Framer Motion and GSAP mappings, accessibility and performance rules. Use when building or reviewing any animation, transition, micro-interaction, state change, page transition, landing hero motion, scroll effect, or product demo motion piece.
---

# JAL Motion

Motion has two contexts, never one blended set of habits. **Product UI motion** is restrained: it exists only to carry information about a state change. **Showcase motion** (landing heroes, product demo reels) can choreograph more, borrowed from bang-motion's video-director discipline, rebuilt entirely in the approved stack and stripped of every technique that fights JAL law. Read `jal-ui-taste` and `jal-frontend-rules` first for the surface this motion sits on; this skill governs only how things move.

Before writing any animation: name what state it communicates in one sentence. If you cannot, delete the animation. In product UI this sentence must be reachable from the token scale below with zero improvisation, consistency across surfaces is the point. In showcase pieces the choreography may be bespoke per project, but the stack, tokens, easing curve, and every law in section 7 are never bespoke.

## 1. Approved stack, nothing else

- **Remotion is the core motion engine** (Brian, 2026-10-01; skill `jal-remotion`). Remotion is never installed in a project that needs no motion. When a section needs motion, JEV `motion.engine` decides after `motion.intensity`. Remotion is the first choice for timeline or composed motion (product intros, hero motion pieces, data stories, product demos, explainers) and is used directly for every video or MP4 request. It ships through the opt-in video module (`templates/modules/video`, copied to `packages/video`): the Player in a lazy chunk on the page, in-browser MP4 export by default. The tools below are its supplements and stay in use.
- **Lenis** for smooth scroll, the default on marketing and immersive pages, through `templates/modules/motion` (section 4a).
- **GSAP** for orchestrated timelines and scroll-linked motion (official skills plus the JAL layer: `skills/jal-immersive/references/gsap/gsap.md`). Every GSAP plugin is free (since the 2024 Webflow licensing change) and allowed: ScrollTrigger, SplitText, Flip, MorphSVG, CustomEase, and the rest. JAL law still decides what each is used for (no DrawSVG ornaments, no ScrollSmoother next to Lenis, no bounce or elastic eases); the per-plugin filter is in `skills/jal-immersive/references/scroll-choreography.md`.
- **Framer Motion** for React component, gesture, layout (FLIP), and exit animation (`AnimatePresence`).
- **CSS transitions and WAAPI** (`element.animate()`) for simple, single-property, non-orchestrated motion. Prefer this over a library whenever a plain transition does the job, it costs nothing over the wire.

- **Three.js** (WebGL and WebGPU), **React Three Fiber**, and **drei** for 3D and immersive sections, approved in v0.4.0 and governed by `skills/jal-immersive/SKILL.md` (lazy `import()`, poster first, DPR cap 2, disposal).
- **Tailwind**, approved in v0.4.0, wired to JAL tokens through `bun-plugin-tailwind`. It styles; it never becomes a second token set.
- **The JAL frame core** (`packages/ui/src/frames/`) for frame-driven compositions and product demo "videos" played live in the browser. See `skills/jal-immersive/references/frames.md`.

Lottie on a page, any ffmpeg/Node/Python export pipeline, and AE-bridge style tooling are **not approved**. Inside a Remotion composition, `@remotion/lottie` follows `jal-remotion` `references/ai-media/lottie-gif.md`. Video files come from Remotion's in-browser export; its CLI or Chrome Headless Shell render needs Brian's yes per project (`video.render_path`). Bang-motion's own workflow (fixed-stage HTML export, Puppeteer/ffmpeg frame dumps, nebula/bloom backgrounds) is explicitly not ported, per its source digest. Anything outside this list needs Brian's explicit yes before adoption, name what it replaces and why.

## 1a. Remotion and the supplements, layered

`motion.engine` picks one engine per section (`remotion`, `kit_css`, `gsap_lenis`, `r3f`, `frame_core`, `noyzzi_or_library`, `none`); a video request is `remotion` and a micro-interaction is `kit_css` by precheck. Then supplements layer onto the section through the layering protocol (`jal-design-system` `references/recipe-index.md` section 4), each with one job:

| Layer | Engine | Job beside a Remotion composition |
|---|---|---|
| Micro-interactions and the kit | Kit CSS motion, CSS transitions, WAAPI, Framer Motion | State layers, the heading rise, the CTA press around the section; never inside the composition |
| Smooth scroll, pins, parallax | Lenis plus GSAP ScrollTrigger (section 4a) | Lenis stays the one smoother. A Remotion composition may be scroll-scrubbed with Lenis or ScrollTrigger as the scroll source (`jal-remotion` `references/web/scroll-scrub.md`) |
| 3D scenes | Three.js and R3F (`jal-immersive`) | A timeline 3D scene goes inside the composition through `@remotion/three`; a scene the visitor drives stays a page canvas |
| Signature effects | noyzzi, magicui, animata, OriginKit, the JAL frame core | Beside the composition in their own section or region, each in its law zone |

Inside a composition every motion is a function of the frame (`interpolate`, `spring`, `@remotion/gsap`); the tokens below still apply, converted at 30 fps (200ms is 6 frames, 400ms is 12, 600ms is 18). JEV may pick another library when it fits; any complex extra stack needs Brian's confirmation.

## 2. Token scale (canonical, source of truth is `packages/ui/src/tokens.css`)

Product UI durations, generated on the same discipline as the type and spacing scales, not hand-picked per component:

```css
--dur-100: 100ms;  /* micro: hover/press state layer, focus ring, toggle */
--dur-150: 150ms;  /* fast: small expansion, tooltip, menu item */
--dur-200: 200ms;  /* base: default entrance: card, panel, dropdown, toast */
--dur-300: 300ms;  /* slow: large expansion, route transition, dialog */

--dur-400: 400ms;  /* showcase only: hero element entrance */
--dur-600: 600ms;  /* showcase only: large staged reveal */

--ease-standard: cubic-bezier(0.24, 1, 0.4, 1); /* the one curve, everywhere */
```

**Exit runs at about 70% of its matching entrance duration** (`round(0.7 x enter / 10) x 10`), on the same curve (bang-motion's asymmetric-rhythm law, translated to UI scale: symmetric in/out reads as mechanical). Compute once, do not re-derive per component:

```css
--dur-100-exit:  70ms;
--dur-150-exit: 110ms;
--dur-200-exit: 140ms;
--dur-300-exit: 210ms;
--dur-400-exit: 280ms;
--dur-600-exit: 420ms;
```

Stagger, constant-speed loop, and hold tokens (`--stagger-*`, `--loop-*`, `--hold-*`) also live in `tokens.css`; see `references/components.md` section 2.1.

Default pair when nothing more specific applies: entrance `--dur-200` / exit `--dur-200-exit`, both on `--ease-standard`. There is exactly one easing curve in the system. Do not introduce a second curve, a bounce, or an overshoot anywhere in product UI.

**The linear exception.** Linear timing (`linear` in CSS, `ease: "none"` in GSAP, `Easing.linear` in the frame core) is allowed only where motion has no start or stop to shape: constant-speed loops such as a marquee, a spinner, or indeterminate progress, and scroll-mapped tracks where the scroll itself is the easing (a GSAP `containerAnimation` track must be linear). Anything that starts and stops uses `--ease-standard`. Linear is never a stylistic choice for an entrance or exit.

### Framer Motion mapping

```tsx
const standard = { duration: 0.2, ease: [0.24, 1, 0.4, 1] }; // --dur-200
const standardExit = { duration: 0.14, ease: [0.24, 1, 0.4, 1] }; // --dur-200-exit

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

- **State transitions**: hover, focus-visible, pressed, disabled use the state-layer opacities from `jal-ui-taste` (`color-mix` tints), transition `background-color`/`opacity` at `--dur-100`. Focus rings appear instantly, never animate in.
- **List add and remove**: enter with opacity + `translateY(4px to 0)` at `--dur-200`; remove with opacity + `translateY(0 to 4px)` at `--dur-200-exit`. Use Framer Motion `layout` + `AnimatePresence` so surrounding items reflow via FLIP (transform-driven), never an animated `height`/`margin` on siblings.
- **Disclosure** (accordion, dropdown panel): the one permitted exception to transform/opacity is animating a CSS grid track (`grid-template-rows: 0fr` to `1fr`) on the disclosure's own wrapper, since there is no way to animate to an intrinsic height otherwise. Scope it to that single element, never let it ripple a reflow through unrelated siblings, and collapse it to an instant show/hide under reduced motion.
- **Route transitions**: crossfade (opacity only) by default. A directional slide (`translateX`) is allowed only when it communicates real navigation depth (drilling into a detail view versus going back), never as decoration on a flat navigation.
- **Toast**: enter opacity + `translateY(8px to 0)` at `--dur-200`, exit at `--dur-200-exit`. Auto-dismissed toasts still need a manual dismiss control per section 5.
- **Live status pulse or ambient product indicator**: must be a pure function of elapsed time (`sin(t * k)` style), never `setInterval` or accumulated velocity, so it is reproducible and trivially freezable under reduced motion.

**What may never move in product UI**: `width`/`height`/`top`/`left`/`margin` (layout thrash, the one disclosure exception above aside), `box-shadow` (JAL has none to animate), any gradient sweep, any infinite ambient background motion, any bounce or overshoot easing, any 3D rotate, any blur filter, any decorative flourish (sparkle, marker, underline draw-on) per section 7.

**Discipline**: one thing moves at a time. If two elements must change together, they share one timeline and one duration, they do not each improvise their own. Motion carries information or it does not ship, "looks nice" is not a reason.

## 4. Showcase motion (landing heroes, product demo pieces)

Richer choreography is allowed here: asymmetric in/out at the showcase durations, staged reveals, scroll-linked camera language, and the choreography bang-motion proved out (camera-follows-click, shot-size staging, deterministic timelines), rebuilt in Lenis/GSAP/Framer Motion/CSS/WAAPI only. Full recipe, stagger values, the shot-size vocabulary, the anti-slide mechanical checks, and worked GSAP timeline examples live in `references/showcase.md`, read it before building any hero or demo reel.

For scroll and time choreography (ScrollTrigger pin, scrub, snap, batch, SplitText, Flip, Lenis synced with ScrollTrigger and the R3F frame loop, scroll camera paths, intensity tiers 0 to 3, and the JEV `motion.intensity`, `motion.choreography`, `motion.pin` calls) read `skills/jal-immersive/references/scroll-choreography.md`. For a composed showcase piece (product intro, hero motion piece, data story, product demo, explainer) read `skills/jal-remotion/SKILL.md` first: Remotion is the first choice. For a small zero-dependency demo with play, pause, scrub, and a reduced-motion poster, read `skills/jal-immersive/references/frames.md`.

The short version: one continuous world, never a slideshow of crossfading `<section>` blocks; the camera (a parent transform) does the moving, not every element animating itself independently; entrances slower and eased-out, exits faster and eased-in, at roughly the same 70% ratio as product UI; every showcase piece still opens on a white or off-white base and still obeys every rule in section 7.

## 4a. The kit motion layer and the motion module

Every JAL page gets motion from the kit first (`jal-design-system` `references/identity.md` section 7), at two costs:

- **Kit default (T0 and T1, zero dependencies, `packages/ui/src/kit/motion.ts`).** Compositions carry `data-motion` (`rise`, `item`, `count`); `Page motion` arms the page after mount with one IntersectionObserver rooted on the real scroller (`getScroller`). Entrances are opacity plus a 12px rise on `--ease-standard` at `--dur-400`, played once, with `--stagger-item` capped at the sixth item; the pending state is opacity only (the box never moves), and the rise is an animation that starts at reveal. StatRow, Bento stat, and Quote results figures count up once at `--dur-600` with their width locked. No JavaScript, a failed bundle, no IntersectionObserver, and reduced motion all render the finished page.
- **Motion module (`templates/modules/motion`, copied into `packages/motion`).** Two pieces. `SmoothScroll` is Lenis, the page's one smooth scroll; `KitMotion tier` is the GSAP upgrade of the kit's own motion. Pinned: `lenis` 1.3.26, `gsap` 3.15.0, `@gsap/react` 2.1.2, all peers fine on React ~19.3. Budget: Lenis, gsap core, ScrollTrigger, and SplitText are 54.3 KB gzip together (Lenis 5.5, core 28.1, ScrollTrigger 17.6, SplitText 3.0); the whole module with CustomEase and its own 5.3 KB is 63.6 KB. Load it lazily per route, so product screens never pay for it. The README holds the file map, the copy steps, the recipe map (Magic UI, Animata, and OriginKit-style recipes to kit components), and the browser proof.

**Lenis is the default smooth scroll for marketing and immersive pages.** Wrap their sections in `<SmoothScroll>` whatever the tier. Never GSAP ScrollSmoother, never both, never a second smoother or `scrollerProxy` (Lenis moves the native scroll position). Product UI keeps native scroll.

**The one-clock wiring** (`clock.ts`, the only place Lenis meets GSAP; `skills/jal-immersive/references/scroll-choreography.md` section 8):

```ts
const lenis = new Lenis({ wrapper, content, autoRaf: false, anchors: false, prevent });
lenis.on("scroll", ScrollTrigger.update);                     // triggers read Lenis's scroll
const raf = (time: number) => lenis.raf(time * 1000);         // seconds to ms
gsap.ticker.add(raf, false, true);                            // prioritized: scroll first in each tick
gsap.ticker.lagSmoothing(0);                                  // a long frame never stalls the scroll
// unmount: off the scroll listener, gsap.ticker.remove(raf), lenis.destroy(), default lag smoothing back
```

- **After mount.** SmoothScroll renders a leaf before the sections, so its layout effect runs before theirs; `getScroller()` is read there, never at module top level. Nothing runs on the server: the markup is one wrapper div (`.motion-root`).
- **Document shell** (`AppShell scroll="document"`, the marketing default): wrapper `window`, content the root element, the `lenis` classes on `html`.
- **Contained shell** (`scroll="contained"`): wrapper `main.shell-main` from `getScroller()`, content its single child (SmoothScroll's wrapper), and `ScrollTrigger.defaults({ scroller })` set before any trigger, even when Lenis stays off. Unmount restores `window`.
- **Touch-first** (coarse pointer and no hover) keeps native scroll unless the page passes `touch="smooth"` (then `syncTouch`), only for a pinned story that must not overshoot on touch.
- **Anchors.** Same-page `#id` links go through `lenis.scrollTo` with the sticky header's height (`--shell-header-h`, measured) as the offset, less the `html` scroll-padding Lenis already subtracts, on `--dur-600` and the standard curve, then focus moves to the target (`tabindex="-1"` when needed, `preventScroll`). A contained shell's header sits outside the scroller, so its offset is 0.
- **Inner scrollers** (a code block, a map, a carousel, a table's `.scroll-x`) carry `data-lenis-prevent` and keep native scrolling; open dialogs and text areas are exempt on their own. While a modal is open, call `useLenisStop(open)`.
- **Refresh.** One batched `lenis.resize()` plus `ScrollTrigger.refresh()` per frame on `document.fonts.ready`, later font loads, a resize of the scroller, and any change in the content's height. Call `useScrollRefresh()` for a section that swaps media of the same height or mounts late.

**What each KitMotion upgrade does, and the JEV answer that turns it on.** `motion.intensity` (0 to 3, per showcase section) sets `Page motion` (`none`, `quiet`, `staged`) and the page's `KitMotion tier` (the highest section wins); `motion.choreography` names the pattern.

| Upgrade | Kit hook | On when | Tier |
|---|---|---|---|
| Entrances on `ScrollTrigger.batch`, once; StatRow, Bento, and Quote figures count up on the ticker | `data-motion="rise"`, `"count"` | intensity 1, choreography `reveal` | 1 |
| Grid stagger at `--stagger-item`, capped at the sixth item | `data-motion="item"` (FeatureGrid, PricingTable, Bento, StatRow) | intensity 2, choreography `stagger_sequence` | 2 |
| SplitText masked line reveal on display headlines and section headings that scroll in; the heading keeps its box and reverts to plain text when the lines land; the first viewport paints finished for LCP | `.kit-display`, `.kit-head > .kit-heading`, Split and CTABand headings | intensity 2, choreography `stagger_sequence` | 2 |
| StickyStory frames scrubbed to scroll progress over the kit's own pin, in step with the kit's active step | `.kit-story` | intensity 3, choreography `scrub` or `pinned_sequence`, 1024 and up | 3 |
| SpecTable rail rows in order; a GSAP pin only when an ancestor's overflow breaks CSS sticky (it restores the kit's own sticky, so no extra `motion.pin` call) | `.kit-spec-sticky` | intensity 3, choreography `pinned_sequence`, 1024 and up | 3 |
| Scroll drift on bleed image, video, or canvas media, never on a live DOM view | Split `variant="bleed"` | intensity 3, choreography `scrub`, 1024 and up | 3 |

Any other pin, horizontal track, or camera path stays gated by `motion.pin` and is page-owned, built on the module's `gsap` and `ScrollTrigger` exports inside `gsap.matchMedia`. At most one tier 3 section per page.

**The reduced-motion contract** (proven in the browser with `Emulation.setEmulatedMedia`, at load and switched mid-session):

- Under `prefers-reduced-motion: reduce`, Lenis is never constructed, no GSAP plugin is registered, no ticker callback is added, and no trigger is created. Scroll is native and anchors jump natively below the header (the `html` scroll-padding).
- KitMotion creates nothing and hides nothing: every heading unsplit, every figure at its exact text, every block at full opacity.
- Switched on mid-session, Lenis is destroyed at once, its ticker callback removed, and the motion branch reverts (tweens killed, inline styles cleared, splits reverted, counts written final). Switched off again, one fresh Lenis starts.
- Pending states are opacity only, set by script inside the motion branch, never visibility and never a stylesheet, so assistive tech still reads them, and no-JS or a failed bundle renders the finished page. Content on screen at setup paints finished.
- A page-owned trigger checks the same query before it is created, or it restarts the loop the contract just stopped. `ui_audit`'s `reduced-motion` and `stuck-reveal` rules check both.

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
- Every duration and easing value traces to a named token in section 2, no inline magic numbers (`0.37s`, `ease-in-out`, a hand-typed cubic-bezier). Linear appears only under the linear exception in section 2.
- Every entrance/exit pair is asymmetric: exit at roughly 70% of the entrance duration, on the same one curve (`--ease-standard`).
- `prefers-reduced-motion` is implemented and actually tested (toggle it, confirm every motion collapses), not just referenced in a comment.
- Nothing autoplays longer than 5s without a pause control; nothing flashes past the WCAG limit.
- `will-change` is scoped to the active animation window only, verified in devtools, not left standing.
- No gradient, glow, neon, shadow, decorative ornament, emoji, or em dash appears anywhere in the motion work, including showcase copy and labels.
- Showcase pieces open on white or off-white, read as one continuous world (no crossfading section slideshow), and use the approved stack only. A Remotion section records its `motion.engine` and `motion.remotion_recipe` answers, keeps the Player out of the first bundle, and stops at a paused Thumbnail under reduced motion.
- Grepped the diff for `Math.random()` and `Date.now()` inside any render/animation loop, none found (ambient motion must be a pure function of elapsed time).
