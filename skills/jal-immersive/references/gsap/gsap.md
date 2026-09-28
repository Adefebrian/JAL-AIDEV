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
