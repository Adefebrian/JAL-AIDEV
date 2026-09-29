# GSAP in JAL: the official GSAP skills plus the JAL layer

GSAP is fully approved in JAL-AIDEV, with every plugin (all free since 2024) and `@gsap/react`. GreenSock's official agent skills (github.com/greensock/gsap-skills, MIT) ship verbatim under `official/` next to this file, so every agent has the complete official knowledge. GSAP serves every surface: calm modern sites use it for small accents, marketing pages for reveals and scroll stories, and immersive sites for full choreography. JEV (`motion.intensity`) sets how much motion each section gets.

| Official skill | File | Read it when |
|---|---|---|
| Core API | `official/gsap-core.md` | Any tween: to, from, fromTo, easing, stagger, defaults, matchMedia |
| Timelines | `official/gsap-timeline.md` | Sequencing, the position parameter, nesting, playback control |
| ScrollTrigger | `official/gsap-scrolltrigger.md` | Scroll-linked motion, pin, scrub, snap, batch, refresh order |
| Plugins | `official/gsap-plugins.md` | SplitText, Flip, MorphSVG, DrawSVG, ScrollTo, Observer, Draggable, Inertia, MotionPath |
| Utils | `official/gsap-utils.md` | clamp, mapRange, normalize, interpolate, snap, toArray, wrap, pipe |
| React | `official/gsap-react.md` | useGSAP, refs, contextSafe, cleanup |
| Other frameworks | `official/gsap-frameworks.md` | Vue, Svelte, and vanilla lifecycles |
| Performance | `official/gsap-performance.md` | Transforms, avoiding layout thrash, will-change, batching |

JAL's own choreography layer (tiers, patterns, the single clock for Lenis, ScrollTrigger, and R3F, and camera paths) is `../scroll-choreography.md`. Read both.

**Know the scroller.** Immersive and marketing pages use AppShell `scroll="document"` (the default), so ScrollTrigger and Lenis use `window`. On a contained shell (`scroll="contained"`, where `main.shell-main` scrolls and the document never does), set `ScrollTrigger.defaults({ scroller })` once before any trigger, or every reveal stays hidden. Get the element with `getScroller()` from `@__APP_NAME__/ui` and pass `scrollerRoot(scroller)` as the IntersectionObserver `root`. `ui_audit`'s stuck-reveal rule catches this.

Call `getScroller()` after mount, inside `useGSAP` (or `useLayoutEffect`), never at module top level. At import time AppShell has not rendered yet, so there is no `[data-jal-scroller]` and it returns `window`, which is the exact stuck-reveal bug; during server rendering `document` does not exist and it throws. React runs layout effects child first and in sibling order, so put the wiring in a small leaf component rendered before the sections, or it runs after their triggers already exist.

If the contained page uses Lenis, give it `wrapper: scroller` and `content: scroller.firstElementChild`, and render one wrapper element as AppShell's only child so `main` holds exactly one element. Lenis observes `content` for resizes and computes its scroll limit from `content`'s height against `wrapper`'s. Left out, `content` defaults to the document root, which never grows on a contained shell, so Lenis misses resizes and clamps scroll at the wrong limit.

```tsx
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { getScroller } from "@__APP_NAME__/ui";
import { gsap, ScrollTrigger } from "./motion/gsap";

// Rendered first inside the page's single wrapper, before any section:
// <AppShell scroll="contained"><div><ScrollWiring />...sections</div></AppShell>
export function ScrollWiring() {
  useGSAP(() => {
    const scroller = getScroller(); // after mount: main.shell-main on a contained shell, window on a document one
    if (scroller === window) return; // document shell: the defaults already fit
    const wrapper = scroller as HTMLElement;
    ScrollTrigger.defaults({ scroller: wrapper });
    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement, // the single wrapper inside main
      autoRaf: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf, false, true);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.defaults({ scroller: window });
    };
  }, []);
  return null;
}
```

## The JAL layer (wins where the official skills differ)

1. **Stack.**
   - Bun installs and builds: `bun add gsap @gsap/react`. Imports bundle with Bun.build.
   - The official Vite, Next.js, and Nuxt examples are references for the API only; JAL never uses those toolchains.
   - Import plugins from `gsap/<Plugin>` and register them once with `gsap.registerPlugin`.
2. **Smooth scroll is Lenis, not ScrollSmoother.** Run one ticker: `lenis.on("scroll", ScrollTrigger.update)`, drive `lenis.raf` from `gsap.ticker.add`, and set `gsap.ticker.lagSmoothing(0)`. There is exactly one smoother per scroll signal.
3. **Easing.**
   - The JAL curve: `CustomEase.create("jal-standard", "0.24, 1, 0.4, 1")`, or the closest built-in (`power3.out`) when CustomEase is not wanted. Exits run at about 70% of the entrance duration.
   - `none` or linear is only for constant-speed loops (marquee, spinner) and for scrubbed progress.
   - No `back`, `elastic`, or `bounce` overshoot in DOM UI. Inside noyzzi sections, the piece keeps its own easing.
4. **Durations and staggers come from tokens.** Read `--dur-*` and `--stagger-*` with `getComputedStyle` (a helper `tok()` is in `skills/jal-motion/references/components.md` section 2.2). Never inline magic numbers.
5. **Transform and opacity only on DOM elements.**
   - Never animate `filter: blur`, `box-shadow`, width, height, top, or left.
   - With Flip, pass `scale: true`, or state explicitly how the size change stays transform-only.
   - Inside a canvas (Three.js uniforms and objects) GSAP may drive any value.
6. **Reduced motion.** Wrap every animation in `gsap.matchMedia()`. Under `(prefers-reduced-motion: reduce)`, set the final state or an opacity crossfade of 150ms or less, create no scroll-linked motion, and start no ticker-driven loop (`ui_audit` rule `reduced-motion` checks this).
7. **React 19.**
   - Use `useGSAP` with a scope ref for every animation.
   - Wrap handlers in `contextSafe`.
   - Rely on its cleanup, and never create tweens in render.
   - Never keep ScrollTrigger instances across routes without killing them.
8. **ScrollTrigger rules.**
   - `markers` only in development. Keep `pinSpacing` true (pinned content never overlaps what follows).
   - No pin below 768px, and never two pinned sections back to back (`motion.pin`).
   - Call `ScrollTrigger.refresh()` after fonts and images load.
   - For a horizontal track, compute the travel from the real track width (`-(track.scrollWidth - window.innerWidth)`), not a fixed `xPercent` per panel.
9. **Visual law.**
   - No draw-on underlines, connector lines, or scramble text outside noyzzi sections.
   - DrawSVG only for real data lines; MorphSVG only for meaningful icon changes.
   - SplitText keeps the full string in an `.sr-only` element and marks the animated units `aria-hidden`.
10. **JEV decides the choreography.** `motion.intensity`, `motion.choreography`, and `motion.pin` in the JEV catalog, plus `ui.component_recipe` or `imm.recipe` when GSAP is one layer in a larger stack (no fixed layer limit; JEV keeps every layer that fits).
11. **Licensing.** GSAP runs under GreenSock's standard no-charge license. The one limit is that JAL never builds a visual no-code animation builder on top of GSAP.
