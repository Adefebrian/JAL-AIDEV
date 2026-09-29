# Motion module (opt-in)

Lenis smooth scroll on the GSAP clock, plus GSAP upgrades of the kit's own motion (split-line headlines, a scrubbed StickyStory, rail rows in order, a scroll drift on bleed media). The base template stays dependency-light: the kit ships its own zero-dependency entrances (`packages/ui/src/kit/motion.ts`, T0 and T1), and this module is copied into a client project only when a page earns tier 2 or 3 motion.

## When to copy it

- A marketing or immersive page whose JEV `motion.intensity` is 2 or 3 in at least one section, or whose `motion.choreography` picked `stagger_sequence`, `scrub`, or `pinned_sequence`.
- Lenis is the default smooth scroll for marketing and immersive pages. Never ScrollSmoother, never both, never a second smoother.
- Not for product UI (tables, forms, settings, dashboards): those stay at tier 0 or 1 on the kit's own motion, with native scroll.

## How to copy it

From the client repo root (a JAL monorepo scaffolded from `templates/monorepo`):

```sh
cp -R <jal-aidev>/templates/modules/motion packages/motion
```

1. Replace `__APP_NAME__` with the project's name in `packages/motion/package.json` and `packages/motion/src/`, add `"@<project>/motion": "workspace:*"` to `apps/web/package.json`, and run `bun install`.
2. Import the styles once after the kit: `@import "../../../packages/motion/src/motion.css";` in `apps/web/src/styles.css`.
3. Wrap the page's sections in `<SmoothScroll>` and render `<KitMotion tier={...} />` as its first child (the example below).
4. Record the ADR: the module, its pinned versions, the tier per section and the JEV answers behind it.

## Pinned versions (verified 2026-09-29 against the npm registry)

| Package | Version | Why |
|---|---|---|
| `lenis` | 1.3.26 | latest 1.x; `autoRaf: false`, `wrapper`/`content`, `prevent`, `anchors` |
| `gsap` | 3.15.0 | latest; ScrollTrigger, SplitText (with `mask` and `autoSplit`), CustomEase, all free |
| `@gsap/react` | 2.1.2 | latest; `useGSAP` for components that add their own timelines |

## File map

| File | Holds |
|---|---|
| `src/SmoothScroll.tsx` | `SmoothScroll` (the provider and the single wrapper inside `main`), `useLenis`, `useScrollRefresh`, `useLenisStop` |
| `src/clock.ts` | `wireClock`: gsap.ticker drives `lenis.raf(time * 1000)` prioritized, `lagSmoothing(0)`, `lenis.on("scroll", ScrollTrigger.update)`; returns the unwire |
| `src/policy.ts` | `smoothScrollEnabled` (off under reduced motion, off on touch-first unless opted in), `readSignals`, `resolveScrollTarget` (window or the contained scroller and its single child) |
| `src/anchor.ts` | `headerOffset`, `anchorTarget`, `scrollToAnchor`, `handleAnchorClick`, `bindAnchors`: in-page links through `lenis.scrollTo` minus the sticky header, then focus |
| `src/gsap.ts` | `registerMotion` (plugins once, the `jal-standard` CustomEase), `tokSeconds`, `tokPx` |
| `src/KitMotion.tsx` | `KitMotion`: the GSAP upgrades of kit motion, by tier, in one `gsap.matchMedia` branch that never matches under reduced motion |
| `src/motion.css` | The Lenis rules (html height, stopped state, `data-lenis-prevent` overscroll, iframes) and the SplitText mask room |
| `src/helpers.test.ts` | The pure helpers with fakes: clock wiring, the policy, the scroll target, the anchor offset and click handling |

## Lenis wiring

- **One clock.** `wireClock` is the only place Lenis meets GSAP: one rAF (gsap.ticker) for tweens, smooth scroll, and every ScrollTrigger. No `scrollerProxy` (Lenis moves the native scroll position), no second loop.
- **After mount.** The wiring runs in a leaf rendered before the sections, so its layout effect runs before theirs and every trigger sees the right scroller. `getScroller()` is read there, never at module top level.
- **Document shell** (`AppShell scroll="document"`, the default for marketing and immersive pages): `wrapper` is `window`, `content` the root element.
- **Contained shell** (`scroll="contained"`): `wrapper` is `main.shell-main` (from `getScroller()`), `content` is SmoothScroll's own single wrapper, the one element `main` holds, and `ScrollTrigger.defaults({ scroller })` is set even when Lenis stays off. Unmount restores `window`.
- **When it runs.** Never under `prefers-reduced-motion: reduce` (native scroll, no rAF loop; switching it on mid-session destroys Lenis at once). Not on touch-first devices (coarse pointer and no hover) unless the page passes `touch="smooth"`: native touch scroll already has the platform's momentum, and replacing it costs a loop and battery and fights pull to refresh and the address bar. Opt in only when a pinned story must not overshoot on touch; Lenis then runs with `syncTouch`.
- **Anchors.** Same-page `#id` links scroll through `lenis.scrollTo` with the sticky header's measured height as the offset (0 on a contained shell), `--dur-600` on the standard curve, then focus the target without a second scroll. A link with `data-lenis-prevent`, a modified click, or another page's link keeps the browser default.
- **Inner scrollers.** Put `data-lenis-prevent` on every element that scrolls on its own: a dialog body, a code block, a map, a horizontal carousel, a table's `.scroll-x` wrapper. It keeps native scrolling and `motion.css` stops the scroll chaining into the page. While a modal dialog is open, call `useLenisStop(open)`.
- **Refresh.** `useScrollRefresh()` once per page, after the sections: it refreshes Lenis and ScrollTrigger in one frame after fonts, late images, and any change in the page's height (a disclosure, a tab panel).

## KitMotion tiers and the recipes behind them

| Tier (JEV `motion.intensity`) | Adds | Recipes |
|---|---|---|
| 1 quiet | kit entrances on `ScrollTrigger.batch`, once; figures count up | R01 reveal on view (`mu.blur-fade` without blur), R07 count-up (`mu.number-ticker`, `an.counter`) |
| 2 staged | items staggered at `--stagger-item`, capped at 6; SplitText line reveals on the Masthead h1 and section headings | R03 line mask reveal (`an.mask-reveal-up`), R02 line preset |
| 3 cinematic (1024 and up) | StickyStory frames on a scrubbed crossfade across the kit's own pin; a scroll drift on bleed image or canvas media; SpecTable rail rows arrive in order, with a GSAP pin only when an ancestor's overflow breaks CSS sticky | R23 pinned crossfade stage (`an.stacked-sections` rewrite), the `scrub` pattern, `ok.row_preview` idea for the rail |

Which kit composition gets which motion:

| Composition | Kit default (no module) | With KitMotion |
|---|---|---|
| Masthead | text rises, media follows (stagger 1) | h1 lines rise from a mask (tier 2+) |
| SectionHead, Split, CTABand, Quote | one rise per block | headings split by line (tier 2+) |
| FeatureGrid, PricingTable, FAQ open, Bento | block rises (quiet) or items stagger (staged) | batch stagger, capped |
| StatRow, Bento stat, Quote results | figures count up once, width locked | same, on ScrollTrigger |
| StickyStory | frames swap on the active step (CSS) | frames scrubbed to scroll (tier 3) |
| SpecTable rail | CSS sticky rail | rows in order; GSAP pin fallback (tier 3) |
| Split bleed | rise | image or canvas drift, never a DOM view (tier 3) |

Every tier: under reduced motion nothing is created, nothing is hidden, and no ticker work starts; the hidden start states are `gsap.set` inside the motion branch, never a stylesheet, so no-JS and a failed bundle render the finished page.

## Example

Twenty lines: Lenis on the one clock, one ScrollTrigger the page owns, and kit components.

```tsx
import { useLayoutEffect } from "react";
import { AppShell, Masthead, MediaFrame, Page, SpecTable, StickyStory } from "@<project>/ui";
import { KitMotion, ScrollTrigger, SmoothScroll, useScrollRefresh } from "@<project>/motion";

function StoryMark() { // rendered inside SmoothScroll, so the scroller is already wired
  useScrollRefresh();
  useLayoutEffect(() => {
    const t = ScrollTrigger.create({ trigger: "#story", start: "top center", end: "bottom center", toggleClass: { targets: "#story", className: "is-reading" } });
    return () => t.kill();
  }, []);
  return null;
}

export const Home = () => (
  <Page direction="D3" motion="staged">
    <AppShell title="Hawa" destinations={nav} current="top">
      <SmoothScroll>
        <KitMotion tier={3} />
        <Masthead id="top" variant="split" title="Air you can read." lead={lead} media={<MediaFrame kind="view">{view}</MediaFrame>} />
        <StickyStory id="story" title="From a number to a decision." steps={steps} />
        <SpecTable id="specs" variant="rail" title="Specifications" prose={prose} groups={groups} />
        <StoryMark />
      </SmoothScroll>
    </AppShell>
  </Page>
);
```

## Budget

Measured with `Bun.build` (minified, browser target, React and the kit external), gzip, 2026-09-29:

| Chunk | min | gzip |
|---|---|---|
| The whole module (SmoothScroll, KitMotion, helpers) with its dependencies | 155.2 KB | 60.9 KB |
| of which gsap core and ScrollTrigger | 113.1 KB | 45.7 KB |
| of which Lenis | 18.5 KB | 5.5 KB |
| of which SplitText | 7.2 KB | 3.4 KB |
| of which CustomEase | 6.9 KB | 3.6 KB |
| the module's own code | about 9 KB | about 2.7 KB |

The kit preview's page B entry (the office landing with the module on, React and the kit in a shared chunk) is 64.7 KB gzip. Load the module only on routes that use it (a lazy `import()` per route), so product screens never pay for it.

## Checks

```sh
bun test            # helpers.test.ts, no install needed
bunx tsc --noEmit   # needs the workspace installed (packages/ui for getScroller and the kit)
```

Then `bun mcp/jal-design/server.ts audit <url>` on the page: `reduced-motion` must stay clean (no rAF loop under reduced motion) and `stuck-reveal` must find nothing.
