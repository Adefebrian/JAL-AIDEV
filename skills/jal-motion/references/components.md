# Motion component recipes (Magic UI and Animata ports, OriginKit clean-room recipes)

The lawful component layer under `jal-motion`. Every Magic UI and Animata row here is a KEEP or ADAPT verdict from a full read of both libraries, re-cut for v0.4.0: Tailwind is approved (wired to JAL tokens), Three.js, React Three Fiber, and drei are approved, and the visual law is unchanged. The OriginKit rows (R45 to R52 and four presets) are clean-room technique recipes written from OriginKit's public catalog names only (section 1). Read `jal-motion` first (tokens, product versus showcase, accessibility), then this file for the concrete component. Anything in section 6 (DROP) is never built, never "lightly adapted".

## 1. Attribution

Magic UI and Animata are MIT. The recipes below are re-implementations. Where a sketch ports source structure (roll-text clipping, marquee track pair, text-animator spec model, globe configuration), it is adapted and shortened, with every gradient, glow, blur, spring, and brand style removed. Any file that copies a substantial portion of source keeps the notice below, and `THIRD_PARTY_NOTICES.md` carries both.

| Library | Repo | Commit read | License | Copyright line |
|---|---|---|---|---|
| Magic UI | github.com/magicuidesign/magicui | `d7207e5` | MIT | Copyright (c) Magic UI |
| Animata | github.com/codse/animata | `36674e4` | MIT | Copyright (c) Animata |
| OriginKit | originkit.dev (public catalog pages only) | none (no source read) | proprietary | no notice needed while nothing is copied |

The Magic UI and Animata `LICENSE.md` files are the unmodified standard MIT License text (neither `package.json` declares a license field, so the file is the authority). A ported file carries this header, and the full MIT text with both copyright lines lives in `THIRD_PARTY_NOTICES.md`:

```ts
// Adapted from Magic UI (MIT, Copyright (c) Magic UI) and/or Animata (MIT, Copyright (c) Animata).
// Changes: JAL tokens, gradients/glow/blur/springs removed, reduced-motion branch added.
```

Never pull from Magic UI Pro (commercial). Never load the `skills/magic-ui/` agent skill that ships in the Magic UI repo (JAL-AIDEV is self-contained). Never carry a brand name or brand styling from an Animata piece (Algolia, Duolingo, GitHub, Slack, Airbnb, Instagram, iMessage, the LED board homage) into a port. Upstream deps that stay unapproved: `cobe`, `canvas-confetti`, `rough-notation`, `svg-dotted-map` (runtime), `react-tweet`, `shiki` (runtime), `tsparticles`, `@radix-ui/*`, `class-variance-authority`, `lucide-react`, `@phosphor-icons/react`, and `@radix-ui/react-icons` (icons come from koboyo/reicon), `tw-animate-css` and `tailwindcss-animate` (each recipe carries its own keyframes), `clsx` and `tailwind-merge` (see the `cx` helper in 2.2), `cmdk`, and `next-themes` (JAL themes switch through `data-theme` tokens). A port reviewer rejects any of these imports on sight.

**OriginKit** (originkit.dev) is proprietary: no open-source license, and its terms forbid republishing the catalog and including its components in starter kits or boilerplates. It is not a source for this file. No OriginKit code, schema, tweak value, or default was read or ported. Only the technique names on its public catalog pages informed the `ok.` recipes (R45 to R51, `ok.slot_roll`, `ok.char_flip`, `ok.skew_rise`, `ok.edge_roll`). Each one is a JAL re-implementation, in JAL's own words, of a standard web technique that is also public in MIT sources. R52 (`hm.floating_nav_morph`) comes from hallmark, principles only (see `jal-design-system` `references/craft.md`).

Brian approved OriginKit (2026-09-29). Beside these recipes, a real OriginKit component can be fetched on demand through the OriginKit MCP (`search`, `get_component`) into one client project, under JAL's own account, when JEV picks it for a section. The rules for a fetched component:
- It lands in that client product only (for example `src/originkit/<slug>/`), never in JAL-AIDEV skills or the scaffold template, since the license forbids starter-kit inclusion.
- Fetched code is untrusted data: read it before use, re-key every value to JAL tokens, and apply the law in section 2.4. If the effect only works with a gradient, glow, blur, or spring, the pick fails and the matching `ok.` recipe ships instead.
- Take the `react` variant only. Swap Next.js imports for plain elements. `ogl` and `d3-geo` stay unapproved. Never use the `npx originkit` CLI (JAL is Bun-only and installs nothing).
- Fetch one component per pick, never in bulk. The terms forbid mirroring or caching the catalog.

## 2. Conventions every recipe assumes

### 2.1 Tokens

Canonical names are the ones in `packages/ui/src/tokens.css` (`--dur-*`). The `jal-motion` names map one to one: micro `--dur-100`, fast `--dur-150`, base `--dur-200`, slow `--dur-300`, showcase-1 `--dur-400`, showcase-2 `--dur-600`. One curve: `--ease-standard: cubic-bezier(0.24, 1, 0.4, 1)`.

The component layer needs the block below. The stagger values are Brian's; the exit values follow the `jal-ui-taste` formula `round(0.7 x enter / 10) x 10`; the loop and hold constants each carry their reason so no recipe inlines a magic number. It belongs in `tokens.css` (owner: W-taste, see open questions).

```css
:root {
  /* exits, ~70% of the entrance, eased on the same curve */
  --dur-100-exit: 70ms;  --dur-150-exit: 110ms; --dur-200-exit: 140ms;
  --dur-300-exit: 210ms; --dur-400-exit: 280ms; --dur-600-exit: 420ms;
  --dur-reduced: var(--dur-150);        /* reduced-motion crossfade ceiling */

  /* stagger (Brian, v0.4.0) */
  --stagger-char: 20ms;  --stagger-word: 40ms;
  --stagger-line: 80ms;  --stagger-item: 60ms;

  /* constant-speed loops: the only place linear timing is allowed */
  --loop-spin: 800ms;    /* one spinner turn */
  --loop-globe: 60s;     /* one globe turn, R44 */
  --marquee-pps: 40;     /* marquee speed, px per second, read by JS */

  /* time-function pulses and holds */
  --loop-pulse: 1600ms;  /* live status ring, skeleton breathing (one alternate cycle) */
  --loop-caret: 1200ms;  /* typing caret on/off period, steps(2) */
  --type-char: 40ms;     /* typing cadence per character */
  --hold-word: 2500ms;   /* rotating word dwell */
  --hold-step: 1200ms;   /* success hold, feed-arrival step */
  --wait-skeleton: 300ms;/* skeleton appears only after this wait */
  --cap-preloader: 1500ms;/* preloader hard cap */
}
```

**Exits.** Every exit runs at its `-exit` duration on the same `--ease-standard` curve. Animata pairs each preset with its own decelerating entrance and accelerating exit bezier; JAL's one-curve law drops that. If Brian ever wants accelerating exits, one `--ease-exit` token changes every recipe in a single pass, never per preset. (`jal-motion` SKILL.md section 8 still asks for exits "eased in"; that checklist line is out of step with this file and needs its owner to reword it.)

Cost tiers used in the index:

| Tier | Meaning | Ships |
|---|---|---|
| T0 | CSS only | nothing |
| T1 | small vanilla JS: IntersectionObserver, WAAPI, pointer vars | under 1 KB per recipe |
| T2 | Framer Motion (`layout`, `AnimatePresence`, motion values) or one rAF loop | FM already in the app bundle |
| T3 | GSAP ScrollTrigger with Lenis, pinned or scrubbed | GSAP chunk, lazy per route |
| T4 | Three.js / R3F / drei, lazy `import()`, poster first | three chunk, only on capable tiers |

### 2.2 Shared helpers

```ts
// packages/ui/src/motion/runtime.ts
const css = () => getComputedStyle(document.documentElement);
export const tok = (name: string) => parseFloat(css().getPropertyValue(name)); // ms (or unitless)
export const ease = () => css().getPropertyValue("--ease-standard").trim();   // for WAAPI
export const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches; // read at every play(), never cached

export function useInView<T extends Element>(ref: React.RefObject<T | null>,
  { once = true, rootMargin = "0px 0px -10% 0px" } = {}) {
  const [inView, set] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { set(true); if (once) io.disconnect(); } else if (!once) set(false);
    }, { rootMargin });
    io.observe(el); return () => io.disconnect();
  }, [once, rootMargin]);
  return inView;
}

// Framer Motion pairs, seconds (mirror the tokens; one file, never inline literals)
const E = [0.24, 1, 0.4, 1] as const;
export const T = {
  micro: { duration: 0.1, ease: E },  microExit: { duration: 0.07, ease: E },
  fast:  { duration: 0.15, ease: E }, fastExit:  { duration: 0.11, ease: E },
  base:  { duration: 0.2, ease: E },  baseExit:  { duration: 0.14, ease: E },
  slow:  { duration: 0.3, ease: E },  slowExit:  { duration: 0.21, ease: E },
  show1: { duration: 0.4, ease: E },  show1Exit: { duration: 0.28, ease: E },
  show2: { duration: 0.6, ease: E },  show2Exit: { duration: 0.42, ease: E },
  reduced: { duration: 0.15, ease: E }, none: { duration: 0 },
};
```

```css
.sr-only { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
```

- **Split text pattern** (any per-line, per-word, per-char motion): the full string once in `.sr-only`, the animated units inside an `aria-hidden="true"` wrapper. Words are `display: inline-block; white-space: pre`, characters are grouped inside their word span so a line never breaks mid-word.
- **Visible without JS**: the hidden start state is applied only after hydration (React sets `data-reveal` in an effect), so no-JS, crawler, and failed-hydration renders are complete.
- **`will-change`**: set on start, removed on `transitionend` or `animation.finished`. Never left standing.
- **Showcase only** means landing heroes and demo pieces (`jal-motion` section 4). Product UI uses product tokens.
- **Transform means transform**: the individual `translate`, `scale`, and `rotate` properties (which Tailwind v4 utilities emit) count as transform. Nothing else animates, except the one disclosure exception (`grid-template-rows`) and state-layer `background-color`/`color` at `--dur-100`.
- **Hidden means hidden**: a unit resting at opacity 0 is also taken out of focus order and the accessibility tree. That covers inactive R05 words, the outgoing R02 copy during a crossfade, undealt R32 cards, the R24 overlay after reveal, and collapsed R43 labels. Give it `inert`, plus `aria-hidden` when it repeats the sr-only string, or unmount it once its exit ends. Opacity alone leaves it focusable and announced.
- **Registered properties**: a custom variable interpolates in a transition or keyframe only when it is registered with `@property` and a typed `syntax` (`<number>`, `<angle>`, `<percentage>`). JAL registers one only when it feeds transform or opacity, for example `--p` into `scaleX` (R24, R36) or an angle into `rotate` (R39). It never drives a spinning conic border. Browsers without support jump to the end value, so the end state must be right on its own.
- **Container-relative travel** (showcase tiles only): set `container-type: inline-size` on the card and size internal travel in `cqi`, clamped between two spacing tokens (`clamp(var(--space-4px), 3cqi, var(--space-16px))`), so a demo moves the same share of the card at 280px and at 480px. Product UI keeps fixed token travel (4px and 8px).
- **Class joining**: a local `cx(...parts)` drops falsy values and joins the rest with spaces. `tailwind-merge` stays unapproved: unconfigured, it cannot tell JAL's `text-n2` (size) from `text-ink` (color) or its `p-8px` spacing keys apart and silently drops one as a conflict; if Brian approves it, it ships extended with the JAL theme groups. Object-form conditional classes from upstream become `data-*` state attributes, since JAL recipes key state on attributes.

```ts
// packages/ui/src/motion/runtime.ts (continued)
export const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(" ");

// Live media queries: server and no-JS snapshots are false, so first paint is the complete, motion-free state.
export function useMedia(q: string) {
  return React.useSyncExternalStore(
    (cb) => { const m = matchMedia(q); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => matchMedia(q).matches, () => false);
}
export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const usePointerFine = () => useMedia("(hover: hover) and (pointer: fine)");
export const useBelow640 = () => useMedia("(max-width: 639px)");

// One controller per multi-step WAAPI chain (R02 swaps, R05, R10, center build). Abort cancels every live
// animation, clears timers, and settles pending waits, so closures and DOM refs are released on unmount
// or when reduced motion flips mid-session.
export function sequence() {
  const ac = new AbortController(), live = new Set<Animation>(), timers = new Set<number>();
  const run = (el: Element, k: Keyframe[], o: KeyframeAnimationOptions) => {
    const a = el.animate(k, o); live.add(a); a.finished.catch(() => {}).finally(() => live.delete(a)); return a.finished; };
  const wait = (ms: number) => new Promise<void>((res) => {
    if (ac.signal.aborted) return res();
    const id = window.setTimeout(() => { timers.delete(id); res(); }, ms); timers.add(id);
    ac.signal.addEventListener("abort", () => res(), { once: true }); });
  const abort = () => { ac.abort(); live.forEach((a) => a.cancel()); timers.forEach(clearTimeout); live.clear(); timers.clear(); };
  return { signal: ac.signal, run, wait, abort };
}

// Element-local pointer point: the rect is cached and refreshed only on pointerenter, resize, and scroll
// (capture, passive); at most one frame per burst of moves; the callback writes CSS variables, never state.
export function pointerLocal(el: HTMLElement, cb: (x: number, y: number) => void) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};
  let r = el.getBoundingClientRect(), raf = 0, x = 0, y = 0;
  const measure = () => { r = el.getBoundingClientRect(); };
  const move = (e: PointerEvent) => { x = e.clientX - r.left; y = e.clientY - r.top;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; cb(x, y); }); };
  el.addEventListener("pointerenter", measure); el.addEventListener("pointermove", move, { passive: true });
  addEventListener("resize", measure); addEventListener("scroll", measure, { capture: true, passive: true });
  return () => { cancelAnimationFrame(raf); el.removeEventListener("pointerenter", measure); el.removeEventListener("pointermove", move);
    removeEventListener("resize", measure); removeEventListener("scroll", measure, { capture: true }); };
}
```

### 2.3 Tailwind wiring (one `@theme`, JAL names only)

Tailwind is approved for these components through `bun-plugin-tailwind`. The theme below points every utility at a JAL CSS variable and wipes Tailwind's default palette, shadows, blurs, easings, and animations, so an off-token or purple utility simply does not exist. It lives once in the app's Tailwind entry CSS.

```css
@import "tailwindcss";
@import "@jal/ui/tokens.css"; /* unlayered: JAL values always win */

/* inline: utilities emit var(--color-ink) directly; reference: Tailwind does not
   re-declare the variables, so no --x: var(--x) cycle is ever emitted. */
@theme inline reference {
  --color-*: initial; --shadow-*: initial; --inset-shadow-*: initial;
  --drop-shadow-*: initial; --text-shadow-*: initial; --blur-*: initial;
  --ease-*: initial; --animate-*: initial; --radius-*: initial;

  --color-page: var(--color-page);       --color-surface: var(--color-surface);
  --color-layer-1: var(--color-layer-1); --color-layer-2: var(--color-layer-2);
  --color-border: var(--color-border);   --color-border-strong: var(--color-border-strong);
  --color-border-control: var(--color-border-control);
  --color-ink: var(--color-ink); --color-ink-muted: var(--color-ink-muted); --color-ink-subtle: var(--color-ink-subtle);
  --color-accent: var(--color-accent);   --color-accent-contrast: var(--color-accent-contrast);
  --color-primary: var(--color-primary); --color-primary-contrast: var(--color-primary-contrast);
  --color-danger: var(--color-danger);   --color-danger-surface: var(--color-danger-surface);
  --color-success: var(--color-success); --color-success-surface: var(--color-success-surface);
  --color-warning: var(--color-warning); --color-warning-surface: var(--color-warning-surface);
  --color-info: var(--color-info);       --color-info-surface: var(--color-info-surface);
  --color-scrim: var(--color-scrim);
  --color-state-hover: var(--state-hover); --color-state-pressed: var(--state-pressed);
  --color-state-focus: var(--state-focus);

  --spacing-2px: var(--space-2px);   --spacing-4px: var(--space-4px);   --spacing-6px: var(--space-6px);
  --spacing-8px: var(--space-8px);   --spacing-12px: var(--space-12px); --spacing-16px: var(--space-16px);
  --spacing-20px: var(--space-20px); --spacing-24px: var(--space-24px); --spacing-32px: var(--space-32px);
  --spacing-40px: var(--space-40px); --spacing-48px: var(--space-48px); --spacing-64px: var(--space-64px);
  --spacing-80px: var(--space-80px); --spacing-96px: var(--space-96px);
  --spacing-control: var(--control-h);

  --radius-sm: var(--radius-sm); --radius-md: var(--radius-md); --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl); --radius-pill: var(--radius-pill);

  --text-n2: var(--text-n2); --text-n2--line-height: var(--line-n2);
  --text-n1: var(--text-n1); --text-n1--line-height: var(--line-n1);
  --text-0: var(--text-0);   --text-0--line-height: var(--line-0);
  --text-1: var(--text-1);   --text-1--line-height: var(--line-1);
  --text-2: var(--text-2);   --text-2--line-height: var(--line-2);
  --text-3: var(--text-3);   --text-3--line-height: var(--line-3);
  --text-4: var(--text-4);   --text-4--line-height: var(--line-4);
  --text-5: var(--text-5);   --text-5--line-height: var(--line-5);
  --text-6: var(--text-6);   --text-6--line-height: var(--line-6);
  --text-display-1: var(--text-display-1); --text-display-1--line-height: var(--line-display-1);
  --text-display-2: var(--text-display-2); --text-display-2--line-height: var(--line-display-2);
  --text-display-3: var(--text-display-3); --text-display-3--line-height: var(--line-display-3);
  --tracking-*: initial;
  --tracking-display: var(--tracking-display); --tracking-heading: var(--tracking-heading);
  --tracking-title: var(--tracking-title);     --tracking-body: var(--tracking-body);

  --ease-standard: var(--ease-standard);
  --default-transition-duration: var(--dur-150);
  --default-transition-timing-function: var(--ease-standard);

  --animate-marquee: jal-marquee var(--mq-dur, 40s) linear infinite;
  --animate-spin: jal-spin var(--loop-spin) linear infinite;
  --animate-pulse: jal-pulse var(--loop-pulse) var(--ease-standard) infinite alternate;
  @keyframes jal-marquee { to { transform: translateX(calc(-100% - var(--mq-gap, 0px))); } }
  @keyframes jal-spin { to { transform: rotate(1turn); } }
  @keyframes jal-pulse { to { opacity: 0.6; } }
}
```

If the local Tailwind build rejects the `reference` option, drop it and keep `@theme inline`: tokens.css stays unlayered, so its declarations beat Tailwind's `@layer theme` copies and no cycle resolves.

Class conventions: durations and delays read tokens with the v4 variable shorthand (`duration-(--dur-200)`, `delay-(--d)` where the component sets `--d`); travel uses spacing keys (`translate-y-4px`); travel classes sit behind `motion-safe:` so reduced motion gets none by default; `motion-reduce:` sets the 150ms crossfade. Hidden start states use `[&:not([data-in])]:` so they never fight the visible state on variant order.

Banned classes in any JAL component (the guard and review treat them like the CSS they emit): `transition-all`, bare `transition` in motion work (it includes shadow and filter), `bg-linear-*`, `bg-radial-*`, `bg-conic-*`, `bg-gradient-*`, `from-*`, `via-*`, `to-*`, `shadow-*`, `inset-shadow-*`, `drop-shadow-*`, `text-shadow-*`, `blur-*`, `backdrop-blur-*`, `animate-bounce`, `animate-ping`, `mask-*` fades, and any arbitrary value that smuggles one of these in (`[box-shadow:...]`, `[filter:blur(...)]`). Tailwind v4 transition helpers: `transition-transform` covers `transform, translate, scale, rotate`; use `transition-[opacity,translate]` or `transition-[opacity,translate,scale]` when both change.

**Upstream animation utilities do not exist here.** The theme resets `--animate-*`, so any animation class pasted from upstream other than `animate-marquee`, `animate-spin`, and `animate-pulse` compiles to nothing, and the element snaps with no warning (upstream's own setup page names a missing keyframe as the usual reason a paste does not move). That covers `animate-in`, `animate-out`, `fade-in-*`, `slide-in-from-*`, `zoom-in-*` (tw-animate-css), `animate-fadeIn`, `animate-flip-words`, `animate-[reveal-up...]`, `animate-accordion-down`, `animate-bg-position`, and `animate-ping`. The guard treats any `animate-*` utility outside the three JAL names as an error, not a warning. Each recipe keeps its keyframes in its component stylesheet with a `jal-` prefix. Replacements: accordion is R22 grid rows, fadeIn is R01, flip-words is R05, reveal-up and reveal-down are the R02 character preset, and ping is the R39 opacity pulse.

### 2.4 The law, restated once for every recipe

No gradient, no blurred shadow (no shadow at all), no glow or neon, no blur filter, no emoji, no em-dash, no purple, violet, or indigo, no overlap at rest (only true overlay layers stack), no side stripe, marker dot, underline draw-on, or connector line, 44px controls with 8px between targets, transform and opacity motion only, one curve, linear only for constant-speed loops (marquee, spinner, velocity band drift, globe turn), `steps()` only for hard cuts (caret, editorial swap), no bounce, overshoot, or spring, loops over 5s ship a pause control, ambient loops are a pure function of elapsed time, and `prefers-reduced-motion: reduce` leaves no infinite CSS or WAAPI animation and no rAF loop above 10 calls per second running (the v0.4.0 `reduced-motion` audit rule).

Two bounded transform additions exist for the OriginKit text presets only: `skewX` up to 8 degrees in `ok.skew_rise` and a per-glyph `rotateX` in `ok.char_flip`, both settling to 0 with no overshoot, showcase only. Everything else above holds for R45 to R52 unchanged.

Inside a WebGL canvas (R44 only in this file) natural lighting and shading are exempt per the v0.4.0 spec, but this file's globe stays unlit and flat by choice, and bloom, neon, and purple stay banned there.

## 3. Index of every KEEP and ADAPT component

Cost tiers are defined in section 2.1. Rows are grouped by source in upstream order; several components share one recipe. OriginKit rows name the public catalog item whose technique a JAL recipe covers; no OriginKit code sits behind them (section 1). OriginKit items dropped by law are in section 6.

| Component | Source | Category | Verdict | Recipe | Cost | When to use |
|---|---|---|---|---|---|---|
| `animated-circular-progress-bar` | Magic UI | data / meter | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `animated-list` | Magic UI | list / feed | ADAPT | R21 | T2 | List add, remove, reorder, and list-to-detail. |
| `animated-shiny-text` | Magic UI | text | ADAPT | R11 | T1 | One-shot emphasis on a short new label. |
| `animated-subscribe-button` | Magic UI | button | KEEP | R14 | T1 | Every submit, save, follow, or toggle with a pending state. |
| `animated-theme-toggler` | Magic UI | theme | ADAPT | R34 | T1 | Only where an explicit dark mode exists. |
| `avatar-circles` | Magic UI | social proof | ADAPT | R35 | T0 | Social proof or team presence. |
| `bento-grid` | Magic UI | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `blur-fade` | Magic UI | reveal | ADAPT | R01 | T1 | Default entrance for any section or card group entering view. |
| `client-tweet-card` | Magic UI | testimonial | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `code-comparison` | Magic UI | code | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `dock` | Magic UI | navigation | ADAPT | R29 | T1 | Launcher row on pointer-fine desktop (showcase). |
| `dotted-map` | Magic UI | data / map | ADAPT | R38 | T0 | Offices or coverage on a flat map (build-time SVG). |
| `file-tree` | Magic UI | code / docs | ADAPT | R22 | T0 | FAQ, expandable rows, file tree, step list. |
| `globe` | Magic UI | 3D / visual | ADAPT (re-admitted) | R44 | T4 | Global reach story where rotation carries meaning (showcase). |
| `hero-video-dialog` | Magic UI | media / overlay | ADAPT | R20 | T0 | Video lightbox and every modal. |
| `hyper-text` | Magic UI | text | ADAPT | R09 | T1 | One short devtool or security brand word, once (showcase). |
| `interactive-hover-button` | Magic UI | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `kinetic-text` | Magic UI | text / hover | ADAPT | R12 | T0 | Display word where letterforms are the point, pointer-fine (showcase). |
| `lens` | Magic UI | media | ADAPT | R28 | T1 | Product imagery where detail matters, pointer-fine. |
| `marquee` | Magic UI | scroll strip | ADAPT | R18 | T1 | Logo or quote wall with more items than fit (showcase). |
| `number-ticker` | Magic UI | data / text | ADAPT | R07 | T1 | Marketing stat row seen once (showcase). |
| `pixel-image` | Magic UI | media | ADAPT | R26 | T1 | Hero or case-study image reveal (showcase). |
| `ripple-button` | Magic UI | button | ADAPT | R16 | T1 | Touch-heavy surfaces that want tactile press feedback. |
| `scroll-based-velocity` | Magic UI | scroll strip | ADAPT | R19 | T3 | One kinetic type band per immersive page (showcase). |
| `scroll-progress` | Magic UI | scroll | ADAPT | R42 | T1 | Long-form reading pages. |
| `terminal` | Magic UI | code / demo | ADAPT | R10 | T1 | CLI or API product demo under 5s (showcase). |
| `text-3d-flip` | Magic UI | text / hover | ADAPT | R06 | T0 | Nav links and CTA labels that want hover craft. |
| `text-animate` | Magic UI | text | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text-reveal` | Magic UI | scroll text | ADAPT | R04 | T3 | One manifesto or story paragraph per page (showcase). |
| `tweet-card` | Magic UI | testimonial | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `typing-animation` | Magic UI | text | ADAPT | R10 | T1 | CLI or API product demo under 5s (showcase). |
| `word-rotate` | Magic UI | text | ADAPT | R05 | T1 | Hero value prop naming 3 to 5 audiences or benefits (showcase). |
| `accordion/faq` | Animata | disclosure | ADAPT | R22 | T0 | FAQ, expandable rows, file tree, step list. |
| `bento-grid/three` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/four` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/five` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/six` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/seven` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/eight` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/nine` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/ten` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `bento-grid/eleven` | Animata | layout | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `button/algolia-blue-button` | Animata | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `button/algolia-white-button` | Animata | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `button/animated-follow-button` | Animata | button | ADAPT | R14 | T1 | Every submit, save, follow, or toggle with a pending state. |
| `button/arrow-button` | Animata | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `button/external-link-button` | Animata | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `button/get-started-button` | Animata | button | ADAPT | R15 | T0 | Chip arrow swap on a primary CTA. |
| `button/ripple-button` | Animata | button | ADAPT | R16 | T1 | Touch-heavy surfaces that want tactile press feedback. |
| `button/slide-arrow-button` | Animata | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `button/status-button` | Animata | button | ADAPT | R14 | T1 | Every submit, save, follow, or toggle with a pending state. |
| `button/swipe-button` | Animata | button | KEEP | R06 | T0 | Nav links and CTA labels that want hover craft. |
| `button/toggle-switch` | Animata | control | ADAPT | R17 | T0 | Binary settings and on/off rows. |
| `button/work-button` | Animata | button | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `card/card-comment` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `card/card-spread` | Animata | card / deck | ADAPT | R32 | T2 | Card storytelling, one testimonial at a time (showcase). |
| `card/card-stack` | Animata | card / deck | ADAPT | R32 | T2 | Card storytelling, one testimonial at a time (showcase). |
| `card/collab-card` | Animata | bento tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `card/comment-reply-card` | Animata | form / list | ADAPT | R21 | T2 | List add, remove, reorder, and list-to-detail. |
| `card/email-feature-card` | Animata | card | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `card/flip-card` | Animata | card / 3D | ADAPT | R33 | T0 | Reveal a back side on explicit tap, once per page (showcase). |
| `card/integration-pills` | Animata | card | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `card/notice-card` | Animata | card / status | ADAPT | R17 | T0 | Binary settings and on/off rows. |
| `card/notification-card` | Animata | card / disclosure | ADAPT | R22 | T0 | FAQ, expandable rows, file tree, step list. |
| `card/notify-user-info` | Animata | card | ADAPT | R22 | T0 | FAQ, expandable rows, file tree, step list. |
| `card/reminder-scheduler` | Animata | card / form | ADAPT | R13 | T2 | Tabs, segmented control, billing toggle, nav pill. |
| `card/staggered-card` | Animata | menu | ADAPT | R13 | T2 | Tabs, segmented control, billing toggle, nav pill. |
| `card/subscribe-card` | Animata | form | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `card/survey-card` | Animata | card / data | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `card/swap-text-card` | Animata | card | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `card/WebHooks-card` | Animata | card | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `carousel/expandable` | Animata | carousel | ADAPT | R43 | T2 | Horizontally browsable media; expandable strip is T2. |
| `carousel/image-carousel` | Animata | carousel | ADAPT | R43 | T0 | Horizontally browsable media; expandable strip is T2. |
| `container/animated-dock` | Animata | navigation | ADAPT | R29 | T1 | Launcher row on pointer-fine desktop (showcase). |
| `container/announcement-ribbon` | Animata | banner | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `container/marquee` | Animata | scroll strip | ADAPT | R18 | T1 | Logo or quote wall with more items than fit (showcase). |
| `container/nav-tabs` | Animata | navigation | ADAPT | R13 | T2 | Tabs, segmented control, billing toggle, nav pill. |
| `container/sibling-focus-nav` | Animata | navigation | ADAPT | R30 | T0 | Top nav or link list of 3 to 7 links. |
| `fabs/flower-menu` | Animata | menu / FAB | ADAPT | R31 | T0 | 3 to 5 secondary actions in the mobile app-shell. |
| `fabs/speed-dial` | Animata | menu / FAB | ADAPT | R31 | T0 | 3 to 5 secondary actions in the mobile app-shell. |
| `feature-cards/confirmation-message` | Animata | status | ADAPT | R14 | T1 | Every submit, save, follow, or toggle with a pending state. |
| `feature-cards/content-scan` | Animata | feature demo | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `graphs/bar-chart` | Animata | data | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `graphs/commit-graph` | Animata | data | ADAPT | R37 | T0 | Activity over time. |
| `graphs/donut-chart` | Animata | data | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `graphs/gauge-chart` | Animata | data | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `graphs/progress` | Animata | data | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `graphs/ring-chart` | Animata | data | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `icon/icon-ripple` | Animata | icon / status | ADAPT | R39 | T0 | Spinner, live status pulse, clock hands. |
| `image/disclose-image` | Animata | media | ADAPT | R26 | T1 | Hero or case-study image reveal (showcase). |
| `image/photo-booth` | Animata | media | ADAPT | R27 | T0 | Linked image cards. |
| `image/zoom-image` | Animata | media | ADAPT | R27 | T0 | Linked image cards. |
| `list/avatar-list` | Animata | social proof | ADAPT | R35 | T0 | Social proof or team presence. |
| `list/menu-animation` | Animata | menu | ADAPT | R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `list/transaction-list` | Animata | list | ADAPT | R21 | T2 | List add, remove, reorder, and list-to-detail. |
| `list/transition-list` | Animata | list | ADAPT | R21 | T2 | List add, remove, reorder, and list-to-detail. |
| `overlay/modal` | Animata | overlay | ADAPT | R20 | T0 | Video lightbox and every modal. |
| `preloader/split-reveal` | Animata | preloader | ADAPT | R24 | T1 | First load of an image-heavy immersive page (showcase). |
| `preloader/vertical-tiles` | Animata | transition | ADAPT | R25 | T1 | One section handoff on an immersive page (showcase). |
| `progress/animatedtimeline` | Animata | timeline | ADAPT | R22 | T0 | FAQ, expandable rows, file tree, step list. |
| `progress/spinner` | Animata | loader | ADAPT | R39 | T0 | Spinner, live status pulse, clock hands. |
| `scroll/stacked-sections` | Animata | scroll | ADAPT | R23 | T3 | Scroll story of 3 to 6 steps (showcase). |
| `section/pricing` | Animata | section | ADAPT | R13 | T2 | Tabs, segmented control, billing toggle, nav pill. |
| `skeleton/category-glyphs` | Animata | illustration | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `skeleton/category-skeleton` | Animata | illustration | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `skeleton/code` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `skeleton/cookie-banner` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `skeleton/list` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `skeleton/receipt` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `skeleton/report` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `skeleton/wide-card` | Animata | skeleton | ADAPT | R40 | T0 | Loading states that wait longer than 300ms. |
| `tabs/fluid-tabs` | Animata | tabs | ADAPT | R13 | T2 | Tabs, segmented control, billing toggle, nav pill. |
| `text/blur-out-up` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/bottom-up-letters` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/counter` | Animata | text / data | ADAPT | R07 | T1 | Marketing stat row seen once (showcase). |
| `text/cycle-text` | Animata | text | ADAPT | R05 | T1 | Hero value prop naming 3 to 5 audiences or benefits (showcase). |
| `text/fade-through` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/gibberish-text` | Animata | text | ADAPT | R09 | T1 | One short devtool or security brand word, once (showcase). |
| `text/kinetic-center-build` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/line-by-line-slide` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/mask-reveal-up` | Animata | text-animator | ADAPT | R03 | T1 | Signature hero headline of 2+ lines (showcase). |
| `text/micro-scale-fade` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/per-character-rise` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/per-word-crossfade` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/roll-text` | Animata | text / hover | KEEP | R06 | T0 | Nav links and CTA labels that want hover craft. |
| `text/scale-down-fade` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/scroll-reveal` | Animata | scroll text | ADAPT | R04 | T3 | One manifesto or story paragraph per page (showcase). |
| `text/shared-axis-y` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/shared-axis-z` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/shimmer-sweep` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/short-slide-down` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/short-slide-right` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/soft-blur-in` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/spring-scale-in` | Animata | text-animator | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/staggered-letter` | Animata | text | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/swap-text` | Animata | text / hover | ADAPT | R06 | T0 | Nav links and CTA labels that want hover craft. |
| `text/text-animator` | Animata | engine | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/text-flip` | Animata | text | ADAPT | R05 | T1 | Hero value prop naming 3 to 5 audiences or benefits (showcase). |
| `text/ticker` | Animata | text / data | ADAPT | R08 | T0 | Numbers that change while visible: counters, prices, KPIs. |
| `text/top-down-letters` | Animata | text-animator | KEEP | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `text/typing-text` | Animata | text | ADAPT | R10 | T1 | CLI or API product demo under 5s (showcase). |
| `text/wave-reveal` | Animata | text | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `widget/alarm-clock` | Animata | widget tile | ADAPT | R17 | T0 | Binary settings and on/off rows. |
| `widget/battery-level` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/battery` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/calendar-event` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/calendar-widget` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/calorie-counter` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/delivery-card` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/expense-tracker` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/flight-widget` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/music-widget` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/notes` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/profile` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/reminder-widget` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/reminder` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/score-board` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/security-alert` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/shopping-list` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/sleep-tracker` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/storage-status` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/storage-widget` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/study-timer` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/team-clock` | Animata | widget tile | ADAPT | R39 | T0 | Spinner, live status pulse, clock hands. |
| `widget/vpn-widget` | Animata | widget tile | ADAPT | R17 | T0 | Binary settings and on/off rows. |
| `widget/water-tracker` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `widget/weather-card` | Animata | widget tile | ADAPT | R41 | T0 | Layout and content reference only; no motion. |
| `widget/weekly-progress` | Animata | widget tile | ADAPT | R36 | T0 | Progress, usage, bars, rings, gauges. |
| `mask-text-reveal`, `text-wipe` | OriginKit (name only) | text | KEEP idea | R03 | T1 | Signature hero headline of 2+ lines (showcase). |
| `stagger-text-rise`, `letter-swing`, `popcorn-text`, `text-emerge`, `text-gather` | OriginKit (name only) | text | ADAPT | R02 | T1 | Any headline, label, or content swap; pick the preset by context. |
| `rolling-letters` | OriginKit (name only) | text | ADAPT | R02 `ok.slot_roll` | T1 | Short showcase title where a mechanical, counter-like arrival fits the brand. |
| `mechanical-flip` | OriginKit (name only) | text | ADAPT | R02 `ok.char_flip` | T1 | Short showcase title with a split-flap or departures-board voice. |
| `skew-in-text-effect` | OriginKit (name only) | text | ADAPT | R02 `ok.skew_rise` | T1 | Showcase headline that wants forward lean on arrival. |
| `text-colour-sweep` | OriginKit (name only) | text | ADAPT | R11 | T1 | One-shot emphasis on a short new label. |
| `type-sequence`, `typewriter` | OriginKit (name only) | text | KEEP idea | R10 | T1 | CLI or API product demo under 5s (showcase). |
| `text-carousel` | OriginKit (name only) | text | ADAPT | R05 | T1 | Hero value prop naming 3 to 5 audiences or benefits (showcase). |
| `random-letter-swap`, `directionhover` | OriginKit (name only) | text / hover | ADAPT | R06 `ok.edge_roll` | T1 | Nav links and CTA labels where the roll should answer the pointer's direction. |
| `dynamic-weight`, `weight-hover` | OriginKit (name only) | text / hover | ADAPT | R47 | T1 | Display word or nav label where weight is the hover signal (showcase). |
| `scroll-text-reveal`, `scroll-text-highlight`, `block-text-reveal` | OriginKit (name only) | scroll text | ADAPT | R04 | T3 | One manifesto or story paragraph per page (showcase). |
| `scrambletext`, `encrypt-button` | OriginKit (name only) | text | KEEP idea | R09 | T1 | One short devtool or security brand word, once (showcase). |
| `label-slide-button`, `arrow-reveal-button` | OriginKit (name only) | button | KEEP idea | R06, R15 | T0 | Arrow nudge, fill sweep, label slide on buttons and menu rows. |
| `radial-reveal-button`, `slide-fill-button` | OriginKit (name only) | button | ADAPT | R51 | T1 | Marketing CTA whose hover fill starts where the pointer entered. |
| `tactile-button` | OriginKit (name only) | button | ADAPT | R50 | T0 | One marketing CTA that wants a physical press. |
| `magnetic-hover-button` | OriginKit (name only) | button | ADAPT | R15 note | T1 | Pointer-fine showcase CTA; travel 4px or less inside its own box. |
| `compare-slider` | OriginKit (name only) | media / control | ADAPT | R45 | T1 | Before and after of a product result, retouch, or redesign. |
| `hover-image-reveal`, `link-preview` | OriginKit (name only) | list / media | ADAPT | R46 | T1 | Named rows (work, cases, articles) with an image per row on desktop. |
| `smooth-scroll-slider` | OriginKit (name only) | carousel | ADAPT | R48 | T1 | Browsable media where the centered item should read as the current one. |
| `image-flipper` | OriginKit (name only) | media | KEEP idea | R26 | T1 | Hero or case-study image reveal (showcase). |
| `image-magnifier` | OriginKit (name only) | media | KEEP idea | R28 | T1 | Product imagery where detail matters, pointer-fine. |
| `deck-carousel`, `swipe-stack`, `coverflowcarousel`, `stacked-carousel` | OriginKit (name only) | card / deck | KEEP idea | R32 | T2 | Card storytelling, one testimonial at a time (showcase). |
| `flip-gallery` | OriginKit (name only) | card / 3D | ADAPT | R33 | T0 | Reveal a back side on explicit tap, once per page (showcase). |
| `live-chat` | OriginKit (name only) | list / feed | ADAPT | R21 | T2 | Chat or feed demo, clearly labelled sample data. |
| `sync-scroll` | OriginKit (name only) | scroll strip | KEEP idea | R19 | T3 | One kinetic type band per immersive page (showcase). |
| `globe`, `dither-globe` | OriginKit (name only) | 3D / visual | KEEP idea | R44 | T4 | Global reach story where rotation carries meaning (showcase). |
| `features-01` | OriginKit (name only) | section | ADAPT | R49 | T2 | Feature walkthrough: a vertical tab list switching one preview. |
| `pricing-03` | OriginKit (name only) | section | ADAPT | R13 | T2 | Tabs, segmented control, billing toggle, nav pill. |
| floating nav (bar to pill) | hallmark (principles only) | navigation | ADAPT | R52 | T1 | Marketing top nav from 640px that detaches into a pill on scroll. |

## 4. Recipes

Each recipe: DOM, mechanism, JAL timing, reduced motion, a plain-CSS or React sketch, the Tailwind variant, and the law note. Sketches are minimal and assume section 2.

### R01 Reveal on view (blur-fade, section and card-group entrances)

- **DOM**: any block gets `data-reveal` (set after hydration); siblings in a group get `style="--i: n"`.
- **Mechanism**: `useInView` sets `data-in`; a CSS transition carries opacity and translateY. Source used 6px blur, dropped.
- **Timing**: product `--dur-200`, travel `--space-4px`; showcase `--dur-400`, travel `--space-8px`. Delay `min(i, 6) x --stagger-item` (the seventh item onward shares the last delay, so a long grid never waits).
- **Reduced motion**: no travel, opacity only at `--dur-reduced`, no delay.

```css
[data-reveal]:not([data-in]) { opacity: 0; transform: translate3d(0, var(--reveal-y, var(--space-4px)), 0); }
[data-reveal] { transition: opacity var(--dur-200) var(--ease-standard), transform var(--dur-200) var(--ease-standard);
  transition-delay: calc(min(var(--i, 0), 6) * var(--stagger-item)); }
[data-reveal][data-showcase] { --reveal-y: var(--space-8px); transition-duration: var(--dur-400); }
@media (prefers-reduced-motion: reduce) {
  [data-reveal]:not([data-in]) { transform: none; }
  [data-reveal] { transition: opacity var(--dur-reduced) var(--ease-standard); transition-delay: 0s; }
}
```
```tsx
export function Reveal({ i = 0, as: Tag = "div", ...p }: { i?: number; as?: any } & React.HTMLAttributes<HTMLElement>) {
  const ref = React.useRef<HTMLElement>(null); const inView = useInView(ref);
  const [armed, arm] = React.useState(false); React.useEffect(() => arm(true), []);
  return <Tag ref={ref} data-reveal={armed || undefined} data-in={inView || undefined} style={{ "--i": i } as React.CSSProperties} {...p} />;
}
```
- **Tailwind**: `transition-[opacity,translate] duration-(--dur-200) ease-standard delay-(--d) [&[data-reveal]:not([data-in])]:opacity-0 motion-safe:[&[data-reveal]:not([data-in])]:translate-y-4px motion-reduce:delay-0 motion-reduce:duration-(--dur-reduced)` with `style={{ "--d": \`calc(${Math.min(i, 6)} * var(--stagger-item))\` }}`.
- **Law**: no blur; content complete without JS; one entrance per block, never re-plays on scroll back up.

### R02 Text motion engine (text-animator spec model, text-animate, all text presets)

- **DOM**: `<Tag><span class="sr-only">{text}</span><span aria-hidden="true" class="tm">{units}</span></Tag>`. Units are words, characters (inside word spans), or lines (measured once with `Range.getClientRects()` after `document.fonts.ready`, re-split on debounced resize, never mid-animation).
- **Mechanism**: one spec object per preset (Animata's model), executed with WAAPI per unit. Swap modes: `sequential` (exit all, then enter, with an optional gap of 0 or `--dur-100` between them, never a literal) or `crossfade` (old and new grid-stacked in one cell, so no layout jump, with an optional overlap: the new copy starts entering `--dur-100` before the old exit ends, capped at half the exit duration; during the overlap the outgoing copy is `aria-hidden` and `inert`). Every multi-step swap runs under one `sequence()` controller (2.2). In-view start via `useInView`. The spec type only admits `opacity`, `x`, `y`, `scale`, plus `skewX` (at most 8deg, `ok.skew_rise` only) and `rotateX` (`ok.char_flip` only); a `blur`, `rotateY`, overshoot key, or either extra key on any other preset fails a lint over the preset table.
- **Timing**: enter on `--ease-standard`, exit on the same curve at the `-exit` duration. Budget: last delay plus duration at most 1200ms for a hero, 400ms in product UI. Scale stays within 0.96 to 1.04.

| Preset (source) | Unit | From | Enter | Stagger | Exit to | Exit | Context |
|---|---|---|---|---|---|---|---|
| micro-scale-fade | whole | opacity 0, scale 0.96 | `--dur-200` | 0 | scale 0.96 | `--dur-200-exit` | product label or heading change |
| fade-through (blur dropped) | whole | y 6px | `--dur-200` | 0 | y -4px | `--dur-200-exit` | product content swap (tabs, cards, month change) |
| shared-axis-z (blur dropped, scale capped) | whole | scale 0.96 | `--dur-300` | 0 | scale 1.04 | `--dur-300-exit` | drill-in context change |
| shared-axis-y | word | opacity cut, `steps(1)` | `--dur-100` | `--stagger-word` | opacity cut | `--dur-100-exit` | editorial hard swap |
| scale-down-fade | whole | y 8px, scale 1.04 | `--dur-400` | 0 | y -8px, scale 0.96 | `--dur-400-exit` | showcase |
| per-word-crossfade | word | y 8px | `--dur-600` | `--stagger-word` | y -6px | `--dur-600-exit` | showcase hero line |
| blur-out-up, short-slide-down, short-slide-right, wave-reveal (blur dropped) | word | y or x 8px | `--dur-400` | `--stagger-word` | opposite 6px | `--dur-400-exit` | showcase |
| per-character-rise, soft-blur-in, staggered-letter, top-down-letters, bottom-up-letters | char | y 0.6em in a clipped line (top-down: -0.6em) | `--dur-600` | `--stagger-char` | y -0.4em | `--dur-600-exit` | showcase title under 24 chars |
| center-build (kinetic-center-build rewrite, see below) | word | y 6px, opacity 0 | `--dur-400` | one word per arrival | y -6px (whole line) | `--dur-400-exit` | showcase phrase of 3 to 5 words |
| line-by-line-slide | line | x -48px | `--dur-600` | `--stagger-line` | x 48px | `--dur-600-exit` | showcase multi-line statement |
| shimmer-sweep (blur dropped) | whole | x -24px | `--dur-400` | 0 | x 24px | `--dur-400-exit` | showcase |
| spring-scale-in (overshoot removed) | word | scale 0.96 | `--dur-300` | `--stagger-word` | scale 0.96 | `--dur-300-exit` | showcase |
| text-animate fadeIn and slide presets | word, char, line | y or x 8px (source 20px) | `--dur-200` to `--dur-400` | by unit | mirrored | `-exit` | as above |
| `ok.slot_roll` (full recipe after R52) | char | a 3-glyph column at y 0, clipped per glyph | `--dur-600` | `--stagger-char` | opacity 0 | `--dur-600-exit` | showcase title under 24 chars |
| `ok.char_flip` (full recipe after R52) | char | rotateX 90deg, opacity 0 | `--dur-400` | `--stagger-char` | rotateX -90deg | `--dur-400-exit` | showcase title under 24 chars |
| `ok.skew_rise` (full recipe after R52) | word | y 8px, skewX -8deg, opacity 0 | `--dur-400` | `--stagger-word` | y -6px, opacity 0 | `--dur-400-exit` | showcase headline |

- **Order**: a preset may set `order`. `normal` is index order; `reverse` starts from the last unit; `center-out` ranks units by distance from the middle index (lower index first on a tie); `edges-in` takes the outermost remaining pair and works inward. A unit's delay is its rank times the stagger token, so the total budget is the same as index order. Use center-out for a centered display word (it grows from the axis), edges-in for closing moments, and reverse for exits (last in, first out). Reduced motion ignores order.
- **Center build** (kinetic-center-build rewrite): the words of a phrase arrive one at a time in a line box with reserved height. On each arrival, read every word's width in one pass before any write, compute centered x positions with a `--space-16px` gap, then move the words already placed to their new x by transform at `--dur-400` while the new word fades in and rises 6px. After `--hold-word` the line exits upward at `--dur-400-exit`. Upstream's entry and reflow blur is dropped. Showcase only, 3 to 5 words, one pass or a pause control; reduced motion shows the whole phrase at once.
- **Reduced motion**: skip splitting entirely; crossfade the whole string at `--dur-reduced`.

```ts
type Frame = { opacity?: number; x?: string; y?: string; scale?: number;
  skewX?: `${number}deg`;   // ok.skew_rise only, |value| <= 8
  rotateX?: `${number}deg`; // ok.char_flip only, needs perspective on the word span
};
type Phase = { from: Frame; dur: `--dur-${number}`; stagger?: `--stagger-${"char" | "word" | "line"}` };
type Order = "normal" | "reverse" | "center-out" | "edges-in";
type Preset = { unit: "whole" | "line" | "word" | "char"; order?: Order; enter: Phase; exit: Phase & { to: Frame } };

export function rank(n: number, order: Order = "normal") {           // delay rank per unit index
  const idx = [...Array(n).keys()];
  const seq = order === "reverse" ? idx.reverse()
    : order === "center-out" ? idx.sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b)
    : order === "edges-in" ? idx.map((_, k) => (k % 2 ? n - 1 - (k >> 1) : k >> 1))
    : idx;
  const r = new Array<number>(n); seq.forEach((u, k) => (r[u] = k)); return r;
}

const tf = (f: Frame) => `translate3d(${f.x ?? 0}, ${f.y ?? 0}, 0) scale(${f.scale ?? 1})`
  + (f.skewX ? ` skewX(${f.skewX})` : "") + (f.rotateX ? ` rotateX(${f.rotateX})` : "");
export function play(units: HTMLElement[], p: Preset, dir: "enter" | "exit") {
  const reduced = prefersReduced();
  const ph = p[dir], a = dir === "enter" ? ph.from : (ph as Preset["exit"]).to;
  const frames = reduced
    ? [{ opacity: dir === "enter" ? 0 : 1 }, { opacity: dir === "enter" ? 1 : 0 }]
    : dir === "enter" ? [{ opacity: a.opacity ?? 0, transform: tf(a) }, { opacity: 1, transform: "none" }]
                      : [{ opacity: 1, transform: "none" }, { opacity: a.opacity ?? 0, transform: tf(a) }];
  const dur = reduced ? tok("--dur-reduced") : tok(dir === "exit" ? `${ph.dur}-exit` : ph.dur);
  const step = reduced || !ph.stagger ? 0 : tok(ph.stagger), r = rank(units.length, p.order);
  return Promise.all((reduced ? units.slice(0, 1) : units).map((u, i) =>
    u.animate(frames, { duration: dur, delay: r[i] * step, easing: ease(), fill: "both" }).finished));
}
```
- **Tailwind**: structure only, motion stays in WAAPI: units `inline-block whitespace-pre`, clipped lines `block overflow-clip py-[0.08em] -my-[0.08em]`, crossfade slot `grid *:[grid-area:1/1]`.
- **Law**: no blur preset survives; no 3D rotate except the per-glyph `ok.char_flip`, which settles flat at 0; no overshoot; product presets never exceed `--dur-300`.

### R03 Line mask reveal (mask-reveal-up, box-reveal idea)

- **DOM**: each line `<span class="ml"><span class="ml-in" style="--l: n">line text</span></span>` inside the split pattern.
- **Mechanism**: outer `display: block; overflow: clip` with `padding-block: 0.08em` and matching negative margin (descenders never cut, line rhythm unchanged); inner starts at `translateY(105%)` and rises to 0. A true clip, no gradient mask, no blur.
- **Timing**: showcase `--dur-600` per line, delay `--l x --stagger-line`; exit to `translateY(-105%)` at `--dur-600-exit`. Three lines finish at 760ms.
- **Reduced motion**: inner at rest position with opacity 0, crossfade at `--dur-reduced`, no stagger.

```css
.ml { display: block; overflow: clip; padding-block: 0.08em; margin-block: -0.08em; }
.ml-in { display: block; transition: transform var(--dur-600) var(--ease-standard); transition-delay: calc(var(--l, 0) * var(--stagger-line)); }
[data-reveal]:not([data-in]) .ml-in { transform: translateY(105%); }
@media (prefers-reduced-motion: reduce) {
  [data-reveal]:not([data-in]) .ml-in { transform: none; opacity: 0; }
  .ml-in { transition: opacity var(--dur-reduced) var(--ease-standard); transition-delay: 0s; }
}
```
- **Tailwind**: outer `block overflow-clip py-[0.08em] -my-[0.08em]`; inner (hidden-state classes added only after hydration, `data-in` set on each line) `block transition-transform duration-(--dur-600) ease-standard delay-(--d) motion-safe:[&:not([data-in])]:translate-y-[105%] motion-reduce:[&:not([data-in])]:opacity-0 motion-reduce:transition-opacity motion-reduce:duration-(--dur-reduced) motion-reduce:delay-0`.
- **Law**: `overflow: clip` on the line box is intended clipping; the text is never clipped at rest (audit `clipped-text` passes because the inner rests at 0).

### R04 Scroll-linked word reveal (text-reveal, scroll-reveal)

- **DOM**: `<section data-sw>` (natural height, or 200vh with a sticky block on showcase) holding the paragraph in the split pattern, one `.sw` span per word with `--i` and `--n`. No ghost copy under each word (upstream stacks a duplicate, which is overlap).
- **Mechanism**: each word's opacity maps from 0.2 to 1 across its slice `[i/n, (i+1)/n]` of section progress. Preferred path: CSS scroll-driven animation behind `@supports`; fallback: one GSAP ScrollTrigger timeline, `scrub: true`, synced with Lenis, `scroller` set to the app-shell content region below 640px.
- **Timing**: scrub (scroll is the clock); start `top 70%`, end `bottom 60%`; each word eases on the standard curve inside its slice.
- **Reduced motion**: every word at opacity 1, natural height, no sticky.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-sw] { view-timeline-name: --sw; }
    .sw { animation: sw-in var(--ease-standard) both; animation-timeline: --sw; /* timeline after the shorthand */
      animation-range: contain calc(var(--i) / var(--n) * 100%) contain calc((var(--i) + 1) / var(--n) * 100%); }
    @keyframes sw-in { from { opacity: 0.2; } to { opacity: 1; } }
  }
}
```
```ts
// fallback when animation-timeline is unsupported
useLayoutEffect(() => {
  if (prefersReduced() || CSS.supports("animation-timeline: view()")) return;
  const ctx = gsap.context(() => {
    gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: true, scroller } })
      .fromTo(".sw", { opacity: 0.2 }, { opacity: 1, ease: "jal-standard", stagger: 1, duration: 1 });
  }, root);
  return () => ctx.revert();
}, []);
```
- **Tailwind**: structure only (the scroll-timeline block stays in the component stylesheet): words `inline-block whitespace-pre`, sticky block `sticky top-0` on showcase; the GSAP path needs no classes.
- **Law**: the 0.2 floor is transient while scrolling and every word rests at 1 after the section; one R04 per page.

### R05 Rotating word (word-rotate, cycle-text, text-flip)

- **DOM**: `<span class="rot" style="--w: {longest}ch" aria-hidden="true"><span class="rot-w">word</span></span>` next to `.sr-only` text listing all words as a phrase ("fast, private, and cheap").
- **Mechanism**: all words share one grid cell; a single rAF clock computes `index = floor(elapsed / hold) % n` (pure function of time, no `setInterval`); on index change, outgoing y 0 to -0.4em plus fade, incoming y 0.4em to 0 plus fade. Upstream travels 50px, too far.
- **Timing**: in `--dur-200`, out `--dur-200-exit`, dwell `--hold-word`. Stop after 3 full cycles, or ship a pause control if it runs past 5s.
- **Reduced motion**: no rotation; show the first word (the sr-only phrase carries the rest).

```css
.rot { display: inline-grid; inline-size: var(--w); overflow: clip; vertical-align: bottom; }
.rot-w { grid-area: 1 / 1; }
```
```ts
function rotate(els: HTMLElement[], prev: number, next: number) {
  const e = ease();
  els[prev].animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-0.4em)" }], { duration: tok("--dur-200-exit"), easing: e, fill: "forwards" });
  els[next].animate([{ opacity: 0, transform: "translateY(0.4em)" }, { opacity: 1, transform: "none" }], { duration: tok("--dur-200"), easing: e, fill: "forwards" });
}
```
- **Tailwind**: `inline-grid w-(--w) overflow-clip align-bottom *:[grid-area:1/1]`.
- **Law**: width reserved for the longest word (no reflow of the headline); `aria-live` off; one rotator per page.

### R06 Hover roll (roll-text, swipe-button, swap-text, text-3d-flip rewrite)

- **DOM** (roll-text's clipping pattern): `<span class="ru" style="--c: n"><span class="ru-sizer">Label</span><span class="ru-stack"><span>Label</span><span>Label</span></span></span>` inside the link or button that owns hover and focus.
- **Mechanism**: on hover or focus-visible of the parent, `.ru-stack` translates 0 to -50% (two stacked copies). Per-character units delay `--c x --stagger-char` for the letter wave; one unit for a whole-label roll. `clip-path: inset(0)` plus `contain: paint` keeps the roll clipped under composited sticky headers where `overflow: hidden` alone leaks. The 3D cube flip (text-3d-flip) becomes this 2D roll.
- **Timing**: buttons `--dur-200` in, `--dur-200-exit` back; showcase nav words `--dur-400` / `--dur-400-exit`.
- **Reduced motion**: no roll; the state layer alone signals hover.

```css
.ru { position: relative; display: inline-grid; overflow: clip; clip-path: inset(0); contain: paint; vertical-align: baseline; }
.ru-sizer { grid-area: 1 / 1; visibility: hidden; white-space: pre; }
.ru-stack { position: absolute; inset-inline: 0; inset-block-start: 0; display: flex; flex-direction: column; white-space: pre;
  transition: transform var(--dur-200-exit) var(--ease-standard); transition-delay: calc(var(--c, 0) * var(--stagger-char)); }
:is(a, button):focus-visible .ru-stack { transform: translateY(-50%); transition-duration: var(--dur-200); }
@media (hover: hover) { :is(a, button):hover .ru-stack { transform: translateY(-50%); transition-duration: var(--dur-200); } }
@media (prefers-reduced-motion: reduce) { .ru-stack { transition: none; transform: none !important; } }
```
- **Tailwind**: parent `group`; unit `relative inline-grid overflow-clip [clip-path:inset(0)] [contain:paint] align-baseline`; sizer `[grid-area:1/1] invisible whitespace-pre`; stack `absolute inset-x-0 top-0 flex flex-col whitespace-pre transition-transform duration-(--dur-200-exit) ease-standard delay-(--d) group-hover:-translate-y-1/2 group-hover:duration-(--dur-200) group-focus-visible:-translate-y-1/2 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-focus-visible:translate-y-0`.
- **Law**: transform only; the focus ring still appears instantly on the parent, never animated.
- **Kerning**: per-character units set `font-kerning: none` (the sizer too), so the split glyphs match the sizer's width and the label does not jiggle sideways at the start and end of a roll.
- **Play-through variant** (showcase words): the roll runs through WAAPI and always completes once started, even if the pointer leaves; new triggers are ignored while `animation.finished` is pending; a replay resets to the start state and waits two animation frames before starting, so the browser registers the reset. The transition version above stays the default for nav, where reversing on leave is correct.
- **Variant**: `ok.edge_roll` rolls from the edge the pointer entered (full recipe after R52).

### R07 Number count-up (number-ticker, counter)

- **DOM**: `<span class="num" style="min-inline-size: {digits}ch"><span class="sr-only">{final}</span><span aria-hidden="true">0</span></span>`, `font-variant-numeric: tabular-nums`.
- **Mechanism**: on in-view, a rAF tween `v = from + (to - from) * y(t)` where `y` is the standard cubic-bezier sampled once into a lookup table; text written through `Intl.NumberFormat`. No spring.
- **Timing**: showcase `--dur-600`; product UI shows numbers final (no count-up).
- **Reduced motion**: write the final value immediately.

```ts
const LUT = (() => { const pts: [number, number][] = []; // sample cubic-bezier(0.24, 1, 0.4, 1)
  for (let i = 0; i <= 200; i++) { const u = i / 200, a = 3 * (1 - u) ** 2 * u, b = 3 * (1 - u) * u * u, c = u ** 3;
    pts.push([a * 0.24 + b * 0.4 + c, a * 1 + b * 1 + c]); } return pts; })();
const curve = (t: number) => { let i = 0; while (i < LUT.length - 1 && LUT[i + 1][0] < t) i++; return LUT[i][1]; };
export function countUp(el: HTMLElement, to: number, fmt: Intl.NumberFormat) {
  if (prefersReduced()) { el.textContent = fmt.format(to); return; }
  const dur = tok("--dur-600"), t0 = performance.now();
  const f = (now: number) => { const t = Math.min(1, (now - t0) / dur); el.textContent = fmt.format(to * curve(t)); if (t < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
```
- **Tailwind**: `inline-block tabular-nums min-w-[6ch]` (the ch count equals the formatted final length).
- **Law**: width reserved so the stat row never reflows; the number is ink, never accent-colored, never oversized beyond the type scale.

### R08 Odometer digits (ticker)

- **DOM**: per digit `<span class="od"><span class="od-col" style="--d: 7; --p: 0">0 1 2 3 4 5 6 7 8 9</span></span>` (each numeral on its own line), `aria-hidden`, with the value in `.sr-only` (and `aria-live="polite"` on that span for live numbers).
- **Mechanism**: `.od` is one line tall with `overflow: clip`; the column translates by `d x -10%` of its own height. Transform only, which is why this beats count-up for numbers that change while visible.
- **Timing**: `--dur-300`; right-most digit first, delay `--p x --stagger-char` moving left.
- **Reduced motion**: `transition: none` (instant digit swap).

```css
.od { display: inline-block; block-size: 1lh; overflow: clip; font-variant-numeric: tabular-nums; }
.od-col { display: flex; flex-direction: column; transform: translateY(calc(var(--d) * -10%));
  transition: transform var(--dur-300) var(--ease-standard); transition-delay: calc(var(--p) * var(--stagger-char)); }
@media (prefers-reduced-motion: reduce) { .od-col { transition: none; } }
```
- **Tailwind**: digit `inline-block h-[1lh] overflow-clip tabular-nums`; column `flex flex-col translate-y-(--y) transition-transform duration-(--dur-300) ease-standard delay-(--dl) motion-reduce:transition-none`, where the component sets `--y: calc(d * -10%)`.
- **Law**: no layout shift on value change; digits never blur or flash.

### R09 Deterministic scramble (hyper-text, gibberish-text)

- **DOM**: monospace, one span per character inside the split pattern, width fixed in `ch`.
- **Mechanism**: rAF over `progress = elapsed / duration`; characters with `index <= progress x n` show the real glyph, the rest show `charset[hash(index, floor(elapsed / --stagger-word)) % charset.length]`. An integer hash, never `Math.random`. Runs once on in-view or hover, never loops.
- **Timing**: showcase `--dur-600`; glyph tick `--stagger-word`.
- **Reduced motion**: final text, no scramble.

```ts
const hash = (i: number, f: number) => (Math.imul(i + 1, 73856093) ^ Math.imul(f + 1, 19349663)) >>> 0;
const glyph = (i: number, elapsed: number, cs: string) => cs[hash(i, Math.floor(elapsed / tok("--stagger-word"))) % cs.length];
```
- **Tailwind**: `font-mono tabular-nums inline-block w-[12ch]`.
- **Law**: showcase only; never on body copy; the rotating glyphs are `aria-hidden`.

### R10 Typing sequence (typing-animation, typing-text, terminal without window chrome)

- **DOM**: a hairline code block (`pre` on `--color-layer-1`, 1px `--color-border`, `--radius-md`), no traffic lights, no fake title bar. Each line is a grid stack: an invisible sizer with the full line plus the typed span in the same cell, so height and width are final from the start.
- **Mechanism**: one timeline computed up front (start time and character count per line); a single rAF clock slices each line by elapsed time. Output lines enter with R01 product timing. The caret is a `1ch` block toggling opacity with `steps(2)` over `--loop-caret` and is removed when the sequence ends.
- **Timing**: `--type-char` per character, `--dur-300` pause between commands, whole demo under 5s or a 44px replay and pause control.
- **Reduced motion**: all lines shown, no caret.

```css
.tl { display: grid; } .tl > * { grid-area: 1 / 1; white-space: pre; } .tl-sizer { visibility: hidden; }
.caret { display: inline-block; inline-size: 1ch; background: var(--color-ink); animation: caret var(--loop-caret) steps(2, jump-none) infinite; }
@keyframes caret { from { opacity: 1; } to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .caret { display: none; } }
```
- **Tailwind**: block `bg-layer-1 border border-border rounded-md p-16px font-mono text-n1 overflow-x-auto`; line `grid *:[grid-area:1/1] *:whitespace-pre`; caret `inline-block w-[1ch] bg-ink motion-reduce:hidden`.
- **Law**: no fake terminal chrome (banned slop), the code block scrolls horizontally inside itself only.

### R11 Opacity wave (animated-shiny-text rewrite)

- **DOM**: split into characters (R02 pattern).
- **Mechanism**: each character runs a one-shot WAAPI keyframe `opacity: [1, 0.55, 1]`, delay `i x --stagger-char`. Flat ink, no gradient band, no `background-clip: text`. Plays once on entrance or a state change ("New" label), never loops.
- **Timing**: `--dur-400` per character; total under 1000ms (so at most 30 characters).
- **Reduced motion**: none.

```ts
chars.forEach((c, i) => c.animate({ opacity: [1, 0.55, 1] }, { duration: tok("--dur-400"), delay: i * tok("--stagger-char"), easing: ease() }));
```
- **Tailwind**: characters `inline-block whitespace-pre`; motion is WAAPI.
- **Law**: never a shimmer sweep, never infinite.

### R12 Neighbor lift (kinetic-text rewrite)

- **DOM**: per-letter spans (`display: inline-block`) inside a display word.
- **Mechanism**: CSS only. Hovered letter `translateY(-0.08em)`, immediate neighbors `-0.04em`, second neighbors `-0.02em`, via `:has()` and sibling selectors. Upstream animated font-weight, stroke, and padding (layout); this is transform only.
- **Timing**: `--dur-150` in, `--dur-150-exit` back.
- **Reduced motion**: removed (the media query below never matches).

```css
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .nl > span { display: inline-block; transition: transform var(--dur-150-exit) var(--ease-standard); }
  .nl > span:hover { transform: translateY(-0.08em); transition-duration: var(--dur-150); }
  .nl > span:hover + span, .nl > span:has(+ span:hover) { transform: translateY(-0.04em); transition-duration: var(--dur-150); }
  .nl > span:hover + span + span, .nl > span:has(+ span + span:hover) { transform: translateY(-0.02em); transition-duration: var(--dur-150); }
}
```
- **Tailwind**: parent `pointer-fine:*:inline-block pointer-fine:motion-safe:*:transition-transform *:duration-(--dur-150-exit) *:ease-standard pointer-fine:motion-safe:[&>span:hover]:-translate-y-[0.08em] pointer-fine:motion-safe:[&>span:hover+span]:-translate-y-[0.04em] pointer-fine:motion-safe:[&>span:has(+span:hover)]:-translate-y-[0.04em]`.
- **Law**: showcase display words only, never body text or links that must stay legible under the pointer.

### R13 Sliding tonal indicator (fluid-tabs, nav-tabs, staggered-card hover, reminder-scheduler, pricing billing toggle)

- **DOM**: `role="tablist"` of `<button role="tab" aria-selected>` (44px min height). The indicator renders as a child of the selected tab (`isolation: isolate`, indicator `z-index: -1`), so at rest it never overlaps a sibling; Framer Motion's shared `layoutId` FLIPs it between tabs with transform.
- **Mechanism**: indicator is a `--color-layer-2` fill with the tab radius, no shadow, no underline. The active tab also gets ink and weight 600 (JAL active rule). Roving tabindex, arrow keys move focus, Enter or Space selects (manual activation, as fluid-tabs does). Hover-follow variant (staggered-card): the same shared-layout child on the hovered item, `pointer: fine` only.
- **Timing**: tween `T.base` (upstream spring and 0.98 label scale dropped); hover-follow `T.fast`; panel content swaps with R02 fade-through.
- **Reduced motion**: `layout` transition `T.none` (indicator jumps), panel crossfade `T.reduced`.

```tsx
<div role="tablist" aria-label="Billing" className="seg">
  {tabs.map((t) => { const on = t.id === sel; return (
    <button key={t.id} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} className="seg-tab" onClick={() => setSel(t.id)}>
      {on && <motion.span layoutId="seg-ind" className="seg-ind" style={{ borderRadius: radiusPx }} transition={reduced ? T.none : T.base} />}
      {t.label}
    </button>); })}
</div>
```
```css
.seg { display: inline-flex; gap: var(--space-4px); padding: var(--space-4px); background: var(--color-layer-1); border-radius: var(--radius-md); }
.seg-tab { position: relative; isolation: isolate; min-block-size: var(--control-h); padding-inline: var(--space-16px); border-radius: var(--radius-sm); color: var(--color-ink-muted); }
.seg-tab[aria-selected="true"] { color: var(--color-ink); font-weight: var(--weight-semibold); }
.seg-ind { position: absolute; inset: 0; z-index: -1; background: var(--color-layer-2); }
```
- **Tailwind**: list `inline-flex gap-4px p-4px bg-layer-1 rounded-md`; tab `relative isolate min-h-control px-16px rounded-sm text-ink-muted aria-selected:text-ink aria-selected:font-semibold`; indicator `absolute inset-0 -z-10 bg-layer-2`.
- **Law**: pass the radius in px through `style` so FM scale-corrects it; no underline, no side bar, no pill shadow.

### R14 Async state button (status-button, animated-subscribe-button, animated-follow-button, confirmation-message)

- **DOM**: `<button class="btn" aria-busy={pending}>` containing a label slot where every state label sits in one grid cell (the cell sizes to the widest label, so width never changes), plus a sibling `<span role="status" class="sr-only">` that announces the result.
- **Mechanism**: states `idle`, `pending`, `success`, `error`, each label tagged `data-pos="before|on|after"` by its order; outgoing labels exit upward, incoming arrive from below. Spinner (R39) inside the pending label. Success icon enters opacity plus scale 0.96 to 1, no pop. Color changes only through state-layer tokens.
- **Timing**: in `--dur-200`, out `--dur-200-exit`, travel `--space-6px`; success holds `--hold-step`, then returns to idle (a toggle like Follow stays).
- **Reduced motion**: no travel, opacity at `--dur-reduced`.

```css
.ab-slot { display: grid; } .ab-slot > span { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: var(--space-8px);
  transition: opacity var(--dur-200-exit) var(--ease-standard), transform var(--dur-200-exit) var(--ease-standard); }
.ab-slot > [data-pos="on"] { transition-duration: var(--dur-200); }
.ab-slot > [data-pos="before"] { opacity: 0; transform: translateY(calc(var(--space-6px) * -1)); }
.ab-slot > [data-pos="after"] { opacity: 0; transform: translateY(var(--space-6px)); }
@media (prefers-reduced-motion: reduce) { .ab-slot > span { transform: none !important; transition-property: opacity; transition-duration: var(--dur-reduced); } }
```
- **Tailwind**: slot `grid`; label `[grid-area:1/1] inline-flex items-center gap-8px transition-[opacity,translate] duration-(--dur-200-exit) ease-standard data-[pos=on]:duration-(--dur-200) data-[pos=before]:opacity-0 data-[pos=after]:opacity-0 motion-safe:data-[pos=before]:-translate-y-6px motion-safe:data-[pos=after]:translate-y-6px motion-reduce:duration-(--dur-reduced)`.
- **Law**: 44px height, one primary per section, the confirmation-panel variant swaps heading and body with R02 fade-through on a fixed layout (no width or height animation).

### R15 Button micro affordances (interactive-hover-button, arrow-button, slide-arrow-button, external-link-button, work-button, algolia buttons, menu-animation)

- **DOM**: the JAL button (jal-frontend-rules): 44px, eight states, press `scale(0.98)` at `--dur-100`. Optional trailing icon, optional `.fill` layer, optional grid-stacked twin labels.
- **Mechanism**: arrow nudge: trailing icon `translateX(var(--space-2px))` (external link: `translate(2px, -2px)`) on hover or focus-visible. Fill sweep: an inner circle `inline-size: 250%; aspect-ratio: 1` centered, `scale(0)` to `scale(1)`, under the label (`isolation: isolate`, button `overflow: clip`), flat token color, no resting dot. Label slide: twin labels, outgoing `translateX(12px)` plus fade, incoming from `-12px` (R06, horizontal). Menu rows: icon `translateX(var(--space-4px))`.
- **Timing**: nudge `--dur-150` / `--dur-150-exit`; fill `--dur-300` / `--dur-300-exit`; label color follows the state-layer rule at `--dur-100`.
- **Reduced motion**: state layer only; no nudge, no fill travel (fill appears at full opacity via the state layer instead).

```css
.btn .ico { transition: transform var(--dur-150-exit) var(--ease-standard); }
.btn .fill { position: absolute; inset-inline-start: 50%; inset-block-start: 50%; inline-size: 250%; aspect-ratio: 1; border-radius: 50%;
  translate: -50% -50%; scale: 0; z-index: -1; background: var(--color-ink); transition: scale var(--dur-300-exit) var(--ease-standard); }
@media (hover: hover) {
  .btn:hover .ico { transform: translateX(var(--space-2px)); transition-duration: var(--dur-150); }
  .btn:hover .fill { scale: 1; transition-duration: var(--dur-300); }
}
.btn:focus-visible .ico { transform: translateX(var(--space-2px)); }
@media (prefers-reduced-motion: reduce) { .btn .ico, .btn .fill { transition: none; transform: none; } .btn .fill { display: none; } }
```
- **Tailwind**: button `group relative isolate overflow-clip min-h-control`; icon `transition-transform duration-(--dur-150-exit) ease-standard motion-safe:group-hover:translate-x-2px motion-safe:group-focus-visible:translate-x-2px group-hover:duration-(--dur-150)`; fill `absolute left-1/2 top-1/2 -z-10 w-[250%] aspect-square rounded-full -translate-x-1/2 -translate-y-1/2 scale-0 bg-ink transition-transform duration-(--dur-300-exit) ease-standard motion-safe:group-hover:scale-100 group-hover:duration-(--dur-300) motion-reduce:hidden`.
- **Law**: never `transition: all`; no underline draw-on (work-button), no brand styling (algolia), no shadow lift.
- **Chip arrow swap** (Animata get-started-button): a round chip of at least 28px inside the 44px control, clipped, holds a strip twice its width with two identical arrows side by side. On hover and focus-visible the strip moves from `translateX(-50%)` to `0`, so one arrow leaves as its twin enters, at `--dur-200` (back at `--dur-200-exit`). The button's color change comes from the state layer, never the upstream amber and orange. Reduced motion: the arrow swaps with no travel.
- **Magnetic note** (OriginKit `magnetic-hover-button` idea): on pointer-fine showcase CTAs only, the label and icon may follow the pointer by at most `--space-4px`, clamped inside the button's own padding box, set through `translate` from pointer vars and returned at `--dur-150-exit`. Never on touch, never under reduced motion, and never together with the arrow nudge (one hover signal per element).

### R16 Press ripple (ripple-button, both libraries)

- **DOM**: button with `position: relative; overflow: clip; isolation: isolate`; a `span.rip` appended at the pointer on `pointerdown` (at the center for keyboard presses).
- **Mechanism**: WAAPI `scale(0), opacity 0.12` to `scale(1), opacity 0`, span sized to twice the diagonal so it covers from any corner, removed on finish. Color is ink (the state-layer ink).
- **Timing**: `--dur-300`.
- **Reduced motion**: no ripple; the pressed state layer communicates the press.

```ts
export function ripple(b: HTMLElement, x?: number, y?: number) {
  if (prefersReduced()) return;
  const r = b.getBoundingClientRect(), d = Math.hypot(r.width, r.height) * 2;
  const cx = x == null ? r.width / 2 : x - r.left, cy = y == null ? r.height / 2 : y - r.top;
  const s = document.createElement("span"); s.className = "rip";
  Object.assign(s.style, { inlineSize: `${d}px`, left: `${cx - d / 2}px`, top: `${cy - d / 2}px` });
  b.append(s);
  s.animate([{ transform: "scale(0)", opacity: 0.12 }, { transform: "scale(1)", opacity: 0 }],
    { duration: tok("--dur-300"), easing: ease() }).finished.then(() => s.remove());
}
```
```css
.rip { position: absolute; aspect-ratio: 1; border-radius: 50%; background: var(--color-ink); pointer-events: none; z-index: -1; }
```
- **Tailwind**: button `relative isolate overflow-clip`; the created span gets `absolute aspect-square rounded-full bg-ink pointer-events-none -z-10`.
- **Law**: the ripple lives inside its button's box (clipped), so no overlap; no colored or multi-ring ripple.

### R17 Switch (toggle-switch, alarm-clock, notice-card, vpn-widget slide)

- **DOM**: `<button role="switch" aria-checked>` with a 44px hit area around a `--space-32px` by `--space-20px` track and a `--space-16px` thumb, visible label beside it.
- **Mechanism**: thumb `translateX(0)` to `translateX(var(--space-12px))`; track color through state tokens (`--color-border-control` off, `--color-ink` or the accent on). Slide-to-connect becomes this switch or a plain 44px button; drag-to-confirm is optional showcase only (thumb follows the pointer, snaps at 60% of the track).
- **Timing**: `--dur-100` / `--dur-100-exit`.
- **Reduced motion**: instant.

```css
.sw { display: inline-grid; place-items: center; min-block-size: var(--control-h); min-inline-size: var(--control-h); }
.sw-track { inline-size: var(--space-32px); block-size: var(--space-20px); padding: var(--space-2px); border-radius: var(--radius-pill);
  background: var(--color-border-control); transition: background-color var(--dur-100) var(--ease-standard); }
.sw-thumb { display: block; inline-size: var(--space-16px); aspect-ratio: 1; border-radius: 50%; background: var(--color-surface);
  transition: transform var(--dur-100-exit) var(--ease-standard); }
.sw[aria-checked="true"] .sw-track { background: var(--color-ink); }
.sw[aria-checked="true"] .sw-thumb { transform: translateX(var(--space-12px)); transition-duration: var(--dur-100); }
@media (prefers-reduced-motion: reduce) { .sw-track, .sw-thumb { transition: none; } }
```
- **Tailwind**: button `group inline-grid place-items-center min-h-control min-w-control`; track `w-32px h-20px p-2px rounded-pill bg-border-control group-aria-checked:bg-ink transition-colors duration-(--dur-100)`; thumb `block size-16px rounded-full bg-surface transition-transform duration-(--dur-100-exit) ease-standard group-aria-checked:translate-x-12px motion-reduce:transition-none`.
- **Law**: the thumb stays inside the track; no glow on the on state.

### R18 Marquee (Magic marquee, Animata container/marquee)

- **DOM**: `<section aria-label="Customers"><div class="mq" data-paused?><ul class="mq-track">items</ul><ul class="mq-track" aria-hidden="true">items</ul></div><button class="mq-pause" aria-pressed>Pause</button></section>`.
- **Mechanism**: two identical tracks in a flex row inside a clipping container; each animates `translateX(0)` to `translateX(calc(-100% - gap))`, linear, infinite. Duration is computed once per resize from track width (`trackWidth / --marquee-pps` seconds, ResizeObserver). Paused on `data-paused`, on hover or focus-within, offscreen (IntersectionObserver), and on `document.hidden`. No gradient edge fade; a hard clip is fine.
- **Timing**: linear, the constant-speed-loop exception. Pause control required (runs past 5s).
- **Reduced motion**: no animation; the first track wraps into a static row, the duplicate is removed.
- **Options**: vertical (`data-axis="y"`) stacks the same track pair in a column inside a block-size clip; each track moves `translateY(0)` to `translateY(calc(-100% - gap))`, with the same pause rules. Reverse (`data-reverse`) sets `animation-direction: reverse` on both tracks, for a second band moving the other way. Upstream repeats the children a fixed five times; JAL computes the repeat count from the measured item width against the container, in the ResizeObserver R18 already runs, so the track always overflows by at least one item and never by many.

```css
.mq { --mq-gap: var(--space-32px); display: flex; gap: var(--mq-gap); overflow: clip; }
.mq-track { display: flex; flex: none; gap: var(--mq-gap); min-inline-size: 100%; animation: jal-marquee var(--mq-dur) linear infinite; }
.mq[data-paused] .mq-track, .mq:is(:hover, :focus-within) .mq-track { animation-play-state: paused; }
@keyframes jal-marquee { to { transform: translateX(calc(-100% - var(--mq-gap))); } }
@media (prefers-reduced-motion: reduce) {
  .mq-track { animation: none; flex: 1; flex-wrap: wrap; min-inline-size: 0; } .mq-track[aria-hidden] { display: none; }
}
```
```ts
new ResizeObserver(([e]) => mq.style.setProperty("--mq-dur", `${e.contentRect.width / tok("--marquee-pps")}s`)).observe(track);
```
- **Tailwind**: container `flex gap-(--mq-gap) overflow-clip [--mq-gap:var(--space-32px)] group`; track `flex flex-none gap-(--mq-gap) min-w-full animate-marquee group-data-paused:[animation-play-state:paused] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-1 motion-reduce:flex-wrap motion-reduce:min-w-0`; duplicate `motion-reduce:hidden`; pause button `min-h-control`.
- **Law**: logos single ink (monochrome SVG), no hover color burst; the container is declared as intended clipping for the audit; showcase only.

### R19 Velocity band (scroll-based-velocity)

- **DOM**: one or two rows of repeated large text, each row `overflow: clip`, the text in `.sr-only` once and the moving copies `aria-hidden`.
- **Mechanism**: on the GSAP ticker (Lenis already synced to it): `x -= dir x base x (1 + |v|) x dt`, where `v` is `lenis.velocity` scaled and clamped to 5, `dir` flips with scroll direction, and `x` wraps modulo one copy's width. Transform only, one ticker callback, removed offscreen and on hidden tab.
- **Timing**: constant drift (linear exception) plus scroll-driven velocity; showcase only, one band per page, pause control.
- **Reduced motion**: static text, no drift, callback never added.

```ts
const wrap = (min: number, max: number, v: number) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };
const tick = (_t: number, dtMs: number) => {
  const v = gsap.utils.clamp(-5, 5, lenis.velocity * 0.1); if (v) dir = Math.sign(v);
  x = wrap(-copyW, 0, x - dir * base * (1 + Math.abs(v)) * (dtMs / 1000));
  row.style.transform = `translate3d(${x}px, 0, 0)`;
};
if (!prefersReduced()) gsap.ticker.add(tick); // remove in cleanup and when offscreen
```
- **Tailwind**: row `overflow-clip whitespace-nowrap`; track `flex w-max` (set `will-change-transform` only while running).
- **Law**: never on product surfaces; no skew or blur tied to velocity (upstream-adjacent demos add skew; banned as distortion).

### R20 Dialog (hero-video-dialog, overlay/modal)

- **DOM**: a thumbnail `<button>` (44px play control inside, accessible name "Play video: title") opens a native `<dialog>` via `showModal()`; inside, `<video controls preload="none" poster>` (never autoplay with sound) and a 44px close button.
- **Mechanism**: CSS-only open and close with `@starting-style` plus `transition-behavior: allow-discrete`; WAAPI fallback where unsupported. Dialog opacity plus scale 0.98 to 1; `::backdrop` is a flat `--color-scrim` fading with opacity. Initial focus on close, Escape closes, focus returns to the trigger, video pauses on close.
- **Timing**: `--dur-300` open, `--dur-300-exit` close.
- **Reduced motion**: opacity only at `--dur-reduced`.

```css
dialog.dlg { border: var(--border-weight) solid var(--color-border-strong); border-radius: var(--radius-lg); background: var(--color-surface); padding: var(--space-24px);
  opacity: 0; scale: 0.98;
  transition: opacity var(--dur-300-exit) var(--ease-standard), scale var(--dur-300-exit) var(--ease-standard),
              overlay var(--dur-300-exit) allow-discrete, display var(--dur-300-exit) allow-discrete; }
dialog.dlg[open] { opacity: 1; scale: 1; transition-duration: var(--dur-300); }
@starting-style { dialog.dlg[open] { opacity: 0; scale: 0.98; } }
dialog.dlg::backdrop { background: var(--color-scrim); opacity: 0; transition: opacity var(--dur-300-exit) var(--ease-standard), overlay var(--dur-300-exit) allow-discrete, display var(--dur-300-exit) allow-discrete; }
dialog.dlg[open]::backdrop { opacity: 1; }
@starting-style { dialog.dlg[open]::backdrop { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { dialog.dlg, dialog.dlg[open] { scale: 1; transition-duration: var(--dur-reduced); } }
```
- **Tailwind**: `border border-border-strong rounded-lg bg-surface p-24px opacity-0 scale-98 open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-98 transition-[opacity,scale,overlay,display] transition-discrete duration-(--dur-300-exit) open:duration-(--dur-300) ease-standard backdrop:bg-scrim motion-reduce:scale-100 motion-reduce:duration-(--dur-reduced)`.
- **Background scroll lock**: `showModal()` makes the page inert but does not stop it scrolling behind the dialog (iOS Safari, wheel over the backdrop). While a modal is open, set `overflow: hidden` on the root with `scrollbar-gutter: stable` so nothing shifts sideways. On iOS, also fix the body at `top: -scrollY` with inline inset 0, full width, and `touch-action: none`. On close, restore the previous inline styles and jump back to the saved position instantly, never smoothly. With Lenis, call `stop()` on open and `start()` on close, and mark scroll areas inside the dialog `data-lenis-prevent`. CSS-first form: `html:has(dialog:modal) { overflow: hidden; scrollbar-gutter: stable; }`, still with the iOS fallback.

```ts
export function lockScroll() {
  const b = document.body, y = scrollY, prev = b.getAttribute("style") ?? "";
  document.documentElement.style.overflow = "hidden";
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) Object.assign(b.style, { position: "fixed", top: `${-y}px`, insetInline: "0", width: "100%", touchAction: "none" });
  return () => { document.documentElement.style.overflow = ""; b.setAttribute("style", prev); scrollTo({ top: y, behavior: "instant" }); };
}
```
- **Law**: no backdrop blur, no shadow (the hairline is the edge), no rotate; the dialog is a true overlay layer, so stacking is lawful.

### R21 FLIP lists and list-to-detail (animated-list, transition-list, comment-reply-card, transaction-list)

- **DOM**: `<ul>` of `<li>` inside Framer Motion `AnimatePresence`, `layout` on each item.
- **Mechanism**: add opacity 0 to 1 plus y 4px to 0; remove opacity to 0 plus y 4px; siblings reflow by layout FLIP (transform). Never animate height or margin (upstream does both). Feed demo (animated-list): items from a fixed list arrive every `--hold-step`, newest on top, finite, with a replay control. List to detail (transaction-list): row and detail share a `layoutId`; the detail replaces the list region (not over it) or opens as a sheet overlay.
- **Timing**: add `T.base`, remove `T.baseExit`, layout `T.base`, list-to-detail `T.slow`.
- **Reduced motion**: `layout` off, items crossfade `T.reduced`.

```tsx
<ul className="list"><AnimatePresence initial={false}>
  {items.map((it) => (
    <motion.li key={it.id} layout={!reduced} transition={{ layout: reduced ? T.none : T.base }}
      initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0, transition: reduced ? T.reduced : T.base }}
      exit={{ opacity: 0, y: reduced ? 0 : 4, transition: reduced ? T.reduced : T.baseExit }}>{it.label}</motion.li>))}
</AnimatePresence></ul>
```
- **Tailwind**: list `grid gap-8px content-start`; rows use the jal-frontend-rules row recipe (`min-h-control`); motion is FM.
- **Law**: no spring (upstream uses 350/30), no scale from 0, no gradient or shadow on the detail card.

### R22 Disclosure (faq, notification-card, notify-user-info, file-tree, animatedtimeline rewrite)

- **DOM**: `<button aria-expanded aria-controls>` (44px row, chevron in a reserved lane) plus `<div class="dz" id data-open?><div class="dz-in">content</div></div>`. Plain `<details>` is the no-motion fallback.
- **Mechanism**: the one permitted layout exception: the wrapper animates `grid-template-rows` 0fr to 1fr, scoped to itself. Chevron rotates 180deg by transform. Content fades in. File tree: nesting by `padding-inline-start: var(--space-16px)` per level, no guide lines, ARIA `tree` and `treeitem` with arrow keys when interactive. Timeline rewrite: an ordered list with step numbers as text, active step on `--color-layer-2`, no connector line, no marker dots, entrance via R01.
- **Timing**: rows `--dur-300` / `--dur-300-exit`; content opacity `--dur-200`; chevron `--dur-200`.
- **Reduced motion**: instant open and close.

```css
.dz { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--dur-300-exit) var(--ease-standard); }
.dz[data-open] { grid-template-rows: 1fr; transition-duration: var(--dur-300); }
.dz-in { min-block-size: 0; overflow: clip; opacity: 0; transition: opacity var(--dur-200-exit) var(--ease-standard); }
.dz[data-open] .dz-in { opacity: 1; transition-duration: var(--dur-200); }
[aria-expanded] .chev { transition: transform var(--dur-200) var(--ease-standard); }
[aria-expanded="true"] .chev { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) { .dz, .dz-in, [aria-expanded] .chev { transition: none; } }
```
- **Tailwind**: wrapper `grid grid-rows-[0fr] data-open:grid-rows-[1fr] transition-[grid-template-rows] duration-(--dur-300-exit) data-open:duration-(--dur-300) ease-standard motion-reduce:transition-none`; inner `min-h-0 overflow-clip`; chevron `transition-transform duration-(--dur-200) ease-standard group-aria-expanded:rotate-180 motion-reduce:transition-none`.
- **Law**: the reflow is confined to the disclosure's own wrapper; no decorative tilt on the icon (faq), no chat-bubble styling.

### R23 Pinned crossfade stage (stacked-sections rewrite)

- **DOM**: `<section class="stage" data-pinned?>` holding N panes. Only when JS arms the pin do panes share one grid cell; inactive panes get `inert` and `aria-hidden`. Upstream stacks sticky panes that cover each other (sibling overlap); this is one pinned stage with one visible pane.
- **Mechanism**: at 768px and wider only (the `motion.pin` floor), GSAP ScrollTrigger pins the stage for N x 100vh (Lenis synced); in the scrubbed timeline, pane i fades out with y 0 to -16px while pane i+1 fades in from 16px, each change over 0.3 of a pane's segment on `jal-standard`.
- **Timing**: scrub; travel `--space-16px`; 3 to 6 panes.
- **Below 768px**: never pinned. Panes stay ordinary blocks in document flow and arrive as an in-flow stagger (R01 per pane, `autoAlpha` plus 16px `y`, `--stagger-item`, played once on enter through `ScrollTrigger.batch`); no inner scroller, no shared grid cell.
- **Reduced motion**: no pin; panes are ordinary sections in document flow.
- **Nested scrollers**: when the stage sits inside its own overflow container (a docs preview, a dialog, an app-shell pane), find the nearest ancestor whose computed `overflow-y` is `auto` or `scroll`, pass it as the ScrollTrigger `scroller` and the IntersectionObserver `root`, and listen for scroll on it, not on window. Lenis drives only the window (or a wrapper given to it), so nested panes keep native scrolling and carry `data-lenis-prevent`.

```css
.stage[data-pinned] { display: grid; } .stage[data-pinned] > .pane { grid-area: 1 / 1; }
```
```ts
useLayoutEffect(() => {
  if (prefersReduced()) return;
  const mm = gsap.matchMedia(stage);
  mm.add("(max-width: 767px)", () => {            // in-flow stagger, never a pin
    ScrollTrigger.batch(".pane", { start: "top 85%", once: true,
      onEnter: (els) => gsap.from(els, { autoAlpha: 0, y: 16, stagger: 0.06, ease: "jal-standard" }) });
  });
  mm.add("(min-width: 768px)", () => {
    stage.current!.dataset.pinned = "";
    const panes = gsap.utils.toArray<HTMLElement>(".pane"); gsap.set(panes.slice(1), { autoAlpha: 0, y: 16 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: stage.current, pin: true, scrub: true,
      start: "top top", end: () => `+=${panes.length * innerHeight}`,
      onUpdate: (st) => { const a = Math.round(st.progress * (panes.length - 1)); panes.forEach((p, i) => (p.inert = i !== a)); } } });
    panes.slice(1).forEach((p, i) => tl
      .to(panes[i], { autoAlpha: 0, y: -16, ease: "jal-standard", duration: 0.3 }, i + 0.7)
      .to(p, { autoAlpha: 1, y: 0, ease: "jal-standard", duration: 0.3 }, i + 0.7));
    return () => { delete stage.current!.dataset.pinned; };
  });
  return () => mm.revert();
}, []);
```
- **Tailwind**: `data-pinned:grid data-pinned:*:[grid-area:1/1]`.
- **Law**: panes never overlap at rest (one visible, the rest `autoAlpha: 0`); true sticky stacking cards need a written law exception from Brian, not a JEV call.

### R24 Shutter preloader (split-reveal)

- **DOM**: an overlay layer with two halves (`.sh-top`, `.sh-bottom`, each `inset-inline: 0; block-size: 50%`, surface tone) and a centered hairline progress track (`role="progressbar"`).
- **Mechanism**: preload critical images with `img.decode()`; progress is `transform: scaleX(p)` (upstream animated width); when ready, the progress fades out, then the shutters translate to -100% and 100%; the overlay is removed on finish and scroll unlocks. Hard cap: reveal at `--cap-preloader` even if images are pending. Skip on repeat visits in the session (sessionStorage flag inside try/catch).
- **Tasks**: the preloader waits on a list of tasks, not only images: image decode, `document.fonts.ready`, the first critical fetch, and the lazy three chunk (R3F `useProgress` readiness becomes one task). Each task reports loaded and total and takes an AbortSignal; progress is the sum of loaded over the sum of total. Phases run in order: loading, fade-ui (the progress fades), reveal (the shutters), done (overlay removed, scroll unlocked). The image task resolves on error too, so one broken image never holds the page; it treats `complete` with a non-zero `naturalWidth` as a cache hit before waiting on load, and sets `decoding="async"` before awaiting `decode()`. At `--cap-preloader` the signal aborts whatever is still pending. An optional "03 / 12" counter uses tabular numerals in `--color-ink-muted`.
- **Timing**: progress fade `--dur-200-exit`; shutters `--dur-600`.
- **Reduced motion**: no shutters; overlay fades out at `--dur-reduced`.

```css
.sh { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; }
.sh-top, .sh-bottom { position: absolute; inset-inline: 0; block-size: 50%; background: var(--color-surface); transition: transform var(--dur-600) var(--ease-standard); }
.sh-top { inset-block-start: 0; } .sh-bottom { inset-block-end: 0; }
.sh[data-open] .sh-top { transform: translateY(-100%); } .sh[data-open] .sh-bottom { transform: translateY(100%); }
.sh-bar { inline-size: min(240px, 60vw); block-size: var(--space-2px); background: var(--color-layer-2); overflow: clip; }
.sh-bar > i { display: block; block-size: 100%; background: var(--color-ink); transform-origin: left; transform: scaleX(var(--p, 0)); }
@media (prefers-reduced-motion: reduce) { .sh-top, .sh-bottom { transition: none; } .sh[data-open] { opacity: 0; transition: opacity var(--dur-reduced) var(--ease-standard); } }
```
- **Tailwind**: overlay `fixed inset-0 z-50 grid place-items-center group`; halves `absolute inset-x-0 h-1/2 bg-surface transition-transform duration-(--dur-600) ease-standard group-data-open:-translate-y-full` (bottom: `group-data-open:translate-y-full`) `motion-reduce:transition-none`; fill `block h-full bg-ink origin-left scale-x-(--p)`.
- **Law**: the preloader is a transient overlay layer, removed after reveal; never on product surfaces; never longer than the cap.

### R25 Tile section transition (vertical-tiles)

- **DOM**: a transient overlay of K vertical columns over the entering section, each a surface-tone block, removed after the animation (so nothing overlaps at rest).
- **Mechanism**: on in-view, column k translates from 0 to 100% (downward), delay `order(k) x --stagger-item`, order left to right or from the center out.
- **Timing**: `--dur-600` per column; K at most 6, so the whole handoff ends by 900ms.
- **Reduced motion**: no tiles (the layer is never rendered).

```ts
cols.forEach((c, k) => c.animate([{ transform: "none" }, { transform: "translateY(100%)" }],
  { duration: tok("--dur-600"), delay: k * tok("--stagger-item"), easing: ease(), fill: "forwards" }));
Promise.all(cols.map((c) => c.getAnimations()[0].finished)).then(() => layer.remove());
```
- **Tailwind**: layer `absolute inset-0 grid grid-flow-col auto-cols-fr pointer-events-none`; column `bg-surface`.
- **Law**: once per page at most; showcase only.

### R26 Panel slide-off and tile image reveal (disclose-image, pixel-image rewrite)

- **DOM**: image frame `overflow: clip; border-radius: var(--radius-lg)`, the image, and a transient cover layer (two halves, or a grid of tiles), removed after the reveal.
- **Mechanism**: disclose: two surface-tone halves slide out to -100% and 100% on X. Pixel: tiles fade opacity 1 to 0 in a deterministic order (row-major or distance from center), delay `rank x --stagger-char`. No grayscale filter transition: if a grayscale-to-color story is needed, crossfade two image layers stacked in one grid cell with opacity.
- **Timing**: halves `--dur-600`; tiles `--dur-300` each.
- **Reduced motion**: the image shows immediately; no cover.

```css
.dz-frame { position: relative; overflow: clip; border-radius: var(--radius-lg); }
.dz-half { position: absolute; inset-block: 0; inline-size: 50%; background: var(--color-surface); transition: transform var(--dur-600) var(--ease-standard); }
.dz-half:first-of-type { inset-inline-start: 0; } .dz-half:last-of-type { inset-inline-end: 0; }
.dz-frame[data-in] .dz-half:first-of-type { transform: translateX(-100%); }
.dz-frame[data-in] .dz-half:last-of-type { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) { .dz-half { display: none; } }
```
- **Tailwind**: frame `relative overflow-clip rounded-lg group`; halves `absolute inset-y-0 w-1/2 bg-surface transition-transform duration-(--dur-600) ease-standard group-data-in:-translate-x-full` (right half `right-0 group-data-in:translate-x-full`) `motion-reduce:hidden`.
- **Law**: showcase only; the cover never stays at rest; no filter animation.

### R27 Image hover zoom (zoom-image, photo-booth)

- **DOM**: `<a class="frame">` with `overflow: clip; border-radius: var(--radius-lg)` and the `img` inside.
- **Mechanism**: `img` scale 1 to 1.03 on hover or focus-visible of the link, gated by `(hover: hover)` for hover.
- **Timing**: `--dur-300` in, `--dur-300-exit` out.
- **Reduced motion**: none.

```css
.frame { display: block; overflow: clip; border-radius: var(--radius-lg); }
.frame img { transition: transform var(--dur-300-exit) var(--ease-standard); }
@media (hover: hover) and (prefers-reduced-motion: no-preference) { .frame:hover img { transform: scale(1.03); transition-duration: var(--dur-300); } }
@media (prefers-reduced-motion: no-preference) { .frame:focus-visible img { transform: scale(1.03); } }
```
- **Tailwind**: link `group block overflow-clip rounded-lg`; img `transition-transform duration-(--dur-300-exit) ease-standard motion-safe:group-hover:scale-103 motion-safe:group-focus-visible:scale-103 group-hover:duration-(--dur-300)`.
- **Law**: the zoom never leaves the frame; no colored shadow on hover.

### R28 Lens magnifier (lens)

- **DOM**: media container (`position: relative; overflow: clip`) holding the image and a second copy in a layer inside the same box.
- **Mechanism**: pointermove sets `--x`, `--y` (px within the box); the copy uses `clip-path: circle(var(--r) at var(--x) var(--y))` (hard edge, no gradient mask) and `transform: scale(var(--zoom))` with `transform-origin: var(--x) var(--y)`. Keyboard alternative: a "View full size" button opening R20.
- **Timing**: lens appears with opacity `--dur-150`, leaves at `--dur-150-exit`.
- **Reduced motion**: the lens still tracks (it is direct manipulation, not animation) but appears without the fade.

```css
.lens { position: relative; overflow: clip; }
.lens-copy { position: absolute; inset: 0; pointer-events: none; opacity: 0;
  clip-path: circle(var(--r, 64px) at var(--x) var(--y)); transform: scale(var(--zoom, 2)); transform-origin: var(--x) var(--y);
  transition: opacity var(--dur-150-exit) var(--ease-standard); }
@media (pointer: fine) { .lens:hover .lens-copy { opacity: 1; transition-duration: var(--dur-150); } }
```
- **Tailwind**: box `relative overflow-clip group`; copy `absolute inset-0 pointer-events-none opacity-0 [clip-path:circle(var(--r)_at_var(--x)_var(--y))] scale-(--zoom) origin-[var(--x)_var(--y)] transition-opacity duration-(--dur-150-exit) pointer-fine:group-hover:opacity-100`.
- **Pointer**: `pointerLocal` (2.2) writes `--x` and `--y`, so the rect is not re-read on every move.
- **Law**: product imagery where detail matters (commerce, photography), pointer-fine only; the layer lives inside the media box.

### R29 Dock magnification (dock, animated-dock)

- **DOM**: `<nav aria-label>` of fixed slots sized to the magnified maximum (`calc(var(--space-40px) * 1.4)`), each holding a 40px icon link with a 44px+ hit area and a visible or tooltip label.
- **Mechanism**: pointermove over the nav writes `--s` per slot: `s = 1 + gain x max(0, 1 - d / reach)` with `d` the distance from the pointer to the slot center (defaults gain 0.4, reach 120px, as component props); the icon applies `transform: scale(var(--s))` from `bottom center` with a transition. Scaling stays inside the reserved slot, so no overlap and no layout thrash (upstream animates width and height with springs).
- **Timing**: `--dur-150`; pointerleave resets `--s` to 1 at `--dur-150-exit`.
- **Reduced motion**: plain icon row, no magnification (listener not attached).

```ts
nav.addEventListener("pointermove", (e) => { for (const s of slots) { const r = s.getBoundingClientRect();
  const d = Math.abs(e.clientX - (r.left + r.width / 2)); s.style.setProperty("--s", String(1 + gain * Math.max(0, 1 - d / reach))); } });
```
```css
.dock { display: flex; gap: var(--space-8px); padding: var(--space-8px); background: var(--color-surface); border: var(--border-weight) solid var(--color-border); border-radius: var(--radius-lg); }
.dock-slot { inline-size: calc(var(--space-40px) * 1.4); block-size: calc(var(--space-40px) * 1.4); display: grid; place-items: end center; }
.dock-slot > a { inline-size: var(--space-40px); aspect-ratio: 1; transform: scale(var(--s, 1)); transform-origin: bottom center; transition: transform var(--dur-150) var(--ease-standard); }
```
- **Tailwind**: nav `flex gap-8px p-8px bg-surface border border-border rounded-lg`; slot `size-[calc(var(--space-40px)*1.4)] grid items-end justify-center`; icon `size-40px origin-bottom scale-(--s) transition-transform duration-(--dur-150) ease-standard`.
- **Pointer**: read the slot rects once on `pointerenter` and on resize (the sketch above re-reads them per move for brevity), and drive the loop through `pointerLocal` (2.2), so a burst of moves costs one frame.
- **Law**: no glass blur (animated-dock), showcase and pointer-fine only; touch gets the plain row.

### R30 Sibling dim (sibling-focus-nav)

- **DOM**: `<nav><a>...</a>...</nav>`, 3 to 7 links.
- **Mechanism**: when one link is hovered or focus-visible, the others drop to opacity 0.48 via `:has()`. No blur mode.
- **Timing**: `--dur-150` / `--dur-150-exit`.
- **Reduced motion**: instant opacity change.

```css
nav.dim > a { transition: opacity var(--dur-150-exit) var(--ease-standard); }
nav.dim:has(> a:is(:hover, :focus-visible)) > a:not(:hover, :focus-visible) { opacity: 0.48; transition-duration: var(--dur-150); }
@media (prefers-reduced-motion: reduce) { nav.dim > a { transition: none; } }
```
- **Tailwind**: nav `*:transition-opacity *:duration-(--dur-150-exit) *:ease-standard [&:has(>a:is(:hover,:focus-visible))>a:not(:hover,:focus-visible)]:opacity-48 motion-reduce:*:transition-none`.
- **Law**: dimmed links must still pass 4.5:1; tune the opacity per palette, never go lower.

### R31 Speed dial and radial menu (speed-dial, flower-menu)

- **DOM**: a FAB `button` (`aria-expanded`, `popovertarget`) anchored in the app-shell content region (sticky to its bottom edge or in the last shell row, never `position: fixed` over content) plus a `<div popover>` holding a `role="menu"` of 44px items. The popover puts the menu in the top layer, which is a lawful overlay.
- **Mechanism**: speed dial: items from `opacity 0, translateY(10px) scale(0.96)` to rest, delay `i x --stagger-char` (upstream 12ms + 22ms per item, 0.82 scale, both too far). Radial: item i placed with `rotate(a) translateX(-r) rotate(-a)`, closed at `translateX(0) scale(0.96) opacity 0`. Focus moves into the menu, arrow keys move between items, Escape closes and returns focus.
- **Timing**: speed dial `--dur-200` open, `--dur-200-exit` close in reverse order; radial `--dur-300` / `--dur-300-exit`.
- **Reduced motion**: items appear with opacity only, no stagger.

```css
.dial-item { opacity: 0; transform: translateY(var(--space-8px)) scale(0.96);
  transition: opacity var(--dur-200-exit) var(--ease-standard), transform var(--dur-200-exit) var(--ease-standard);
  transition-delay: calc((var(--n) - var(--i)) * var(--stagger-char)); }
:popover-open .dial-item { opacity: 1; transform: none; transition-duration: var(--dur-200); transition-delay: calc(var(--i) * var(--stagger-char)); }
.petal { --t: rotate(var(--a)) translateX(calc(var(--r) * -1)) rotate(calc(var(--a) * -1)); }
@media (prefers-reduced-motion: reduce) { .dial-item { transform: none; transition-delay: 0s !important; } }
```
- **Tailwind**: item `min-h-control opacity-0 motion-safe:translate-y-8px motion-safe:scale-96 transition-[opacity,translate,scale] duration-(--dur-200-exit) ease-standard delay-(--d) in-[:popover-open]:opacity-100 in-[:popover-open]:translate-y-0 in-[:popover-open]:scale-100 in-[:popover-open]:duration-(--dur-200) bg-surface border border-border rounded-md`.
- **Law**: no shadow, no backdrop blur, hairline items on surface; 3 to 5 actions.

### R32 Deck carousel and deal-in (card-stack, card-spread)

- **DOM**: deck: one visible card in a fixed slot, 44px prev and next buttons, and a "2 / 5" status (`aria-live="polite"`). Deal-in: the final spread grid is the markup.
- **Mechanism**: deck advance: outgoing `translateX(-24px)` plus fade (showcase may add `rotate(-2deg)`, 2D only), incoming from `translateX(24px)` plus fade. Pointer drag moves the card with the pointer (FM `drag="x"`, `dragMomentum={false}`); past 30% of the width it advances, otherwise it tweens back with `animate(x, 0, T.base)` (never FM's default spring snap). No peeking stack at rest. Deal-in: on first in-view, each card starts at the offset to the first card's cell (FLIP: measure both rects) and animates to its own cell.
- **Timing**: advance out `T.baseExit`, in `T.base`; deal-in `--dur-600`, delay `i x --stagger-item`.
- **Reduced motion**: advance is a `T.reduced` crossfade, no drag throw; the spread grid shows directly.

```ts
// deal-in
const first = cards[0].getBoundingClientRect();
cards.forEach((c, i) => { const r = c.getBoundingClientRect();
  c.animate([{ transform: `translate(${first.left - r.left}px, ${first.top - r.top}px)` }, { transform: "none" }],
    { duration: tok("--dur-600"), delay: i * tok("--stagger-item"), easing: ease(), fill: "backwards" }); });
```
- **Tailwind**: deck slot `grid *:[grid-area:1/1] overflow-clip`; controls `min-h-control min-w-control`; grid `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16px`.
- **Law**: overlap exists only during the entrance; cards share one shape; no shadow under the deck.

### R33 3D flip (flip-card, showcase only)

- **DOM**: `<button aria-pressed>` wrapping `.flip` (`perspective`) with `.flip-inner` (`transform-style: preserve-3d`) holding front and back in one grid cell, back pre-rotated 180deg, both `backface-visibility: hidden`; the hidden face is `inert`.
- **Mechanism**: toggle `.flip-inner` `rotateY(0)` to `rotateY(180deg)` on click or tap, never on hover (hover-hidden content is undiscoverable on touch).
- **Timing**: `--dur-600` / `--dur-600-exit`.
- **Reduced motion**: crossfade the faces at `--dur-reduced`, no rotation.

```css
.flip { perspective: 1000px; } .flip-inner { display: grid; transform-style: preserve-3d; transition: transform var(--dur-600) var(--ease-standard); }
.flip-inner > * { grid-area: 1 / 1; backface-visibility: hidden; } .flip-back { transform: rotateY(180deg); }
[aria-pressed="true"] .flip-inner { transform: rotateY(180deg); }
@media (prefers-reduced-motion: reduce) {
  .flip-inner { transform: none !important; transition: none; } .flip-back { transform: none; opacity: 0; }
  .flip-inner > * { transition: opacity var(--dur-reduced) var(--ease-standard); }
  [aria-pressed="true"] .flip-front { opacity: 0; } [aria-pressed="true"] .flip-back { opacity: 1; }
}
```
- **Tailwind**: `perspective-[1000px]`; inner `grid transform-3d transition-transform duration-(--dur-600) ease-standard group-aria-pressed:rotate-y-180 motion-reduce:transition-none motion-reduce:group-aria-pressed:rotate-y-0`; faces `[grid-area:1/1] backface-hidden`; back `rotate-y-180 motion-reduce:rotate-y-0`.
- **Law**: 3D rotate is banned in product UI; this is the one showcase use, one per page.

### R34 Theme toggle (animated-theme-toggler)

- **DOM**: a 44px `button aria-pressed` with a visible or accessible label ("Dark mode").
- **Mechanism**: only where an explicit dark mode exists. `document.startViewTransition(() => (root.dataset.theme = next))`, keeping the browser default root crossfade (opacity). No clip-path circle reveal. Without View Transitions, switch instantly.
- **Timing**: `--dur-200`.
- **Reduced motion**: instant switch (skip `startViewTransition`).

```css
::view-transition-old(root), ::view-transition-new(root) { animation-duration: var(--dur-200); animation-timing-function: var(--ease-standard); }
```
- **Tailwind**: button `min-h-control min-w-control rounded-md hover:bg-state-hover`.
- **Law**: dark is never the default; the toggle never animates a large color sweep.

### R35 Avatar row (avatar-circles, avatar-list)

- **DOM**: `<ul class="avatars">` with `gap: var(--space-8px)`, each avatar a 44px link (or a 32px image inside a 44px target) with the name in a tooltip and `alt`; the last item a "+N" chip linking to the full list.
- **Mechanism**: static. No negative margins, no overlap, no hover lift.
- **Timing**: none (entrance, if any, is R01).
- **Reduced motion**: n/a.

```css
.avatars { display: flex; flex-wrap: wrap; gap: var(--space-8px); } .avatars img { inline-size: var(--control-h); aspect-ratio: 1; border-radius: 50%; }
```
- **Tailwind**: `flex flex-wrap gap-8px`; image `size-control rounded-full`; chip `min-h-control px-12px rounded-pill bg-layer-1 text-n1`.
- **Law**: the overlapping stack is the unlawful part and is gone; no colored ring per avatar.

### R36 Meters and chart entrances (circular progress, bar-chart, progress, donut, gauge, ring, survey, battery, calorie, delivery, expense, score-board, sleep, storage, study-timer, water, weekly-progress)

- **DOM**: linear: a track with a full-size fill child and the value as text; bars: one column per value; ring and gauge: an SVG arc with `pathLength="100"` and `stroke-dasharray="{p} 100"`. `role="progressbar"` or `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and a text label.
- **Mechanism**: fills `transform: scaleX(p)` (bars `scaleY(p)`) with `transform-origin` left or bottom. Rings are drawn at their value; entrance is opacity only (dashoffset is not transform or opacity). If a sweep is essential in showcase, build the ring from two half-rings clipped to their halves and rotate each by transform.
- **Timing**: entrance `--dur-400` (showcase) or none (product); value updates `--dur-200`.
- **Reduced motion**: final state, no transition.

```css
.meter { block-size: var(--space-8px); background: var(--color-layer-2); border-radius: var(--radius-pill); overflow: clip; }
.meter > i { display: block; block-size: 100%; background: var(--color-ink); transform-origin: left; transform: scaleX(var(--p));
  transition: transform var(--dur-200) var(--ease-standard); }
@media (prefers-reduced-motion: reduce) { .meter > i { transition: none; } }
```
- **Tailwind**: track `h-8px bg-layer-2 rounded-pill overflow-clip`; fill `block h-full bg-ink origin-left scale-x-(--p) transition-transform duration-(--dur-200) ease-standard motion-reduce:transition-none`; bars `origin-bottom scale-y-(--p)`.
- **Law**: one hue plus tonal steps; status colors only for real status; no gradient fills; never animate width or height; ring, battery, and study-timer tiles recolored to light surfaces.

### R37 Heat grid (commit-graph)

- **DOM**: CSS grid of small squares (`grid-auto-flow: column; grid-template-rows: repeat(7, 1fr)`), each `data-level` 0 to 4, with a table or tooltip fallback carrying the counts.
- **Mechanism**: static. Levels map to tonal steps of one hue.
- **Timing**: none.
- **Reduced motion**: n/a.

```css
.heat { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, var(--space-12px)); grid-auto-columns: var(--space-12px); gap: var(--space-2px); }
.heat > [data-level="0"] { background: var(--color-layer-2); }
.heat > [data-level="1"] { background: color-mix(in oklab, var(--color-ink) 20%, var(--color-surface)); }
.heat > [data-level="2"] { background: color-mix(in oklab, var(--color-ink) 40%, var(--color-surface)); }
.heat > [data-level="3"] { background: color-mix(in oklab, var(--color-ink) 60%, var(--color-surface)); }
.heat > [data-level="4"] { background: var(--color-ink); }
```
- **Tailwind**: grid `grid grid-flow-col grid-rows-[repeat(7,var(--space-12px))] auto-cols-(--space-12px) gap-2px`; cell `data-[level=0]:bg-layer-2 data-[level=1]:bg-ink/20 data-[level=2]:bg-ink/40 data-[level=3]:bg-ink/60 data-[level=4]:bg-ink`.
- **Law**: never a multi-hue heat ramp; the grid scrolls inside its own container at 320px.

### R38 Dotted map (dotted-map)

- **DOM**: inline SVG of `<circle>` dots, markers as larger tonal circles, and a visible list of the locations as text.
- **Mechanism**: build time: a Bun script samples a public-domain land mask (Natural Earth derived, equirectangular) into a dot lattice (every other row offset by half a step, as upstream does) and writes a static SVG, plus a `lonlat.json` the globe (R44) reuses. No runtime dependency.
- **Timing**: none, or R01 entrance.
- **Reduced motion**: already static.

```ts
// scripts/dotmap.ts (Bun): mask is a 1-bit equirectangular bitmap, width W, height H
const step = 2, dots: [number, number][] = [];
for (let y = 0; y < H; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < W; x += step)
  if (mask[y * W + Math.floor(x)]) dots.push([(x / W) * 360 - 180, 90 - (y / H) * 180]);
await Bun.write("public/lonlat.json", JSON.stringify(dots.flat()));
await Bun.write("public/dotmap.svg", `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${dots
  .map(([lon, lat]) => `<circle cx="${((lon + 180) / 360) * W}" cy="${((90 - lat) / 180) * H}" r="0.6"/>`).join("")}</svg>`);
```
- **Tailwind**: `<svg class="w-full h-auto fill-ink/30">`; markers `fill-accent`.
- **Law**: dots in ink at low alpha (a flat alpha, not a gradient); no pulsing markers except a genuinely live location (R39); the `svg-dotted-map` package is never shipped.

### R39 Time-function motion (spinner, icon-ripple live pulse, team-clock hands)

- **DOM**: spinner: a 20px SVG arc in ink with `role="status"` and a text label; live pulse: one ring behind the icon while the state is live; clock: an SVG face with hands and the time as text.
- **Mechanism**: spinner rotates on `--loop-spin` linear (constant-speed exception). Live pulse is a CSS keyframe `opacity` alternate on `--loop-pulse` (a CSS animation is already a pure function of time). Clock hands `rotate(deg)` computed from the current time each second with `setTimeout` aligned to the next second, recomputed from the clock every tick so it never drifts (reading real time is the information here, not decoration).
- **Timing**: as above; hands jump (no transition).
- **Reduced motion**: spinner replaced by the static text "Loading"; pulse static; clock hands still update once per second (under the 10 per second audit ceiling, and it is information).

```css
.spin { animation: jal-spin var(--loop-spin) linear infinite; }
.live-ring { animation: jal-pulse var(--loop-pulse) var(--ease-standard) infinite alternate; }
@keyframes jal-spin { to { transform: rotate(1turn); } }
@keyframes jal-pulse { to { opacity: 0.6; } }
@media (prefers-reduced-motion: reduce) { .spin { display: none; } .spin + .spin-text { position: static; } .live-ring { animation: none; } }
```
- **Tailwind**: `animate-spin motion-reduce:hidden`; ring `animate-pulse motion-reduce:animate-none`; label `sr-only motion-reduce:not-sr-only`.
- **Law**: one ring, never concentric ripples; no gradient clock face, no shadow; the pulse only while the state is actually live.

### R40 Skeleton loaders (skeleton set, card-comment)

- **DOM**: blocks in `--color-layer-2` with the real component's radius and final dimensions (no layout shift on arrival), `aria-hidden="true"`, the region `aria-busy="true"`.
- **Mechanism**: optional breathing via the `jal-pulse` keyframe on `--loop-pulse`. Shown only after `--wait-skeleton` of waiting; content crossfades in.
- **Timing**: content crossfade `--dur-200`.
- **Reduced motion**: static blocks.

```css
.sk { background: var(--color-layer-2); border-radius: var(--radius-md); animation: jal-pulse var(--loop-pulse) var(--ease-standard) infinite alternate; }
@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }
```
- **Tailwind**: `bg-layer-2 rounded-md animate-pulse motion-reduce:animate-none`.
- **Law**: no shimmer gradient, no shadow; the skeleton matches the final layout exactly.

### R41 Static tile and card references (bento layouts, tweet cards, code comparison, widget tiles)

- **DOM**: rebuild each on the JAL card and Bento recipes (jal-frontend-rules): surface on page, one 1px hairline, no shadow, no colored edge, no gradient, no eyebrow, no emoji, one gap per grid, equal card shape per row, shared elements pinned with `margin-top: auto`.
- **Mechanism**: static. Specific notes: testimonial and tweet cards render from our own data at build time (quote, name, role, avatar), no embed. Code comparison highlights at build time in Bun and dims the inactive pane with opacity 0.56 (no blur). Content-scan: detected words get a tonal highlight span fading in word by word (`--dur-200`, `--stagger-word`), no scanning bar. Category glyphs: the three-ink-token SVG shading (`--cg-ink`, `--cg-soft`, `--cg-faint` mapped to ink, layer-2, layer-1) for empty states. Calendar month change uses R02 fade-through. Music equalizer bars run only while audio plays (R39 rules). Announcement ribbon becomes a static row in the header grid. Security alert becomes the JAL danger status notice. Bento hover CTA reveal uses R01 on hover (`--dur-150`).
- **Timing**: none beyond the named recipes.
- **Reduced motion**: n/a.

```css
.tile { display: flex; flex-direction: column; gap: var(--space-12px); padding: var(--space-24px); background: var(--color-surface);
  border: var(--border-weight) solid var(--color-border); border-radius: var(--radius-lg); }
.tile > :last-child { margin-block-start: auto; }
```
- **Tailwind**: `flex flex-col gap-12px p-24px bg-surface border border-border rounded-lg *:last:mt-auto`.
- **Law**: every purple, violet, or indigo recolors to the accent or neutral ink; multicolor tiles collapse to neutral surfaces with status colors only for status. These are low-value references, never priorities.

### R42 Scroll progress (scroll-progress)

- **DOM**: a 2px track as the last row of the header grid (the app-shell forbids fixed layers over content), `role="progressbar"`, `aria-valuenow` rounded to 5%.
- **Mechanism**: fill `transform: scaleX(var(--p))`, `transform-origin: left`, `--p` from `lenis.progress` or a ScrollTrigger on the shell's content scroller.
- **Timing**: none (tracks scroll directly, no smoothing).
- **Reduced motion**: kept (it is information), still unsmoothed.

```css
.sp { block-size: var(--space-2px); background: var(--color-layer-2); }
.sp > i { display: block; block-size: 100%; background: var(--color-ink); transform-origin: left; transform: scaleX(var(--p, 0)); }
```
- **Tailwind**: `h-2px bg-layer-2`; fill `block h-full bg-ink origin-left scale-x-(--p)`.
- **Law**: long-form reading pages only; flat ink, no gradient.

### R43 Carousel (image-carousel, expandable)

- **DOM**: `<ul>` as a scroll-snap track (`display: grid; grid-auto-flow: column; overflow-x: auto; scroll-snap-type: x mandatory`), items `scroll-snap-align: start`, 44px prev and next buttons calling `scrollBy` by one item width, `aria-roledescription="carousel"` on the region.
- **Mechanism**: native scrolling; `scroll-behavior: smooth` only without reduced motion. Expandable strip: the active item's grid track changes instantly and FM `layout` FLIPs the items (transform, with scale correction on the image); auto-advance off by default, and if on, a pure time clock plus a pause control.
- **Timing**: expandable `T.slow`.
- **Reduced motion**: instant scroll and instant expand.

```css
.car { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 80%); gap: var(--space-16px); overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; }
.car > li { scroll-snap-align: start; }
@media (prefers-reduced-motion: no-preference) { .car { scroll-behavior: smooth; } }
```
- **Tailwind**: `grid grid-flow-col auto-cols-[minmax(0,80%)] gap-16px overflow-x-auto snap-x snap-mandatory overscroll-x-contain motion-safe:scroll-smooth`; item `snap-start`; buttons `min-h-control min-w-control`.
- **Law**: the track scrolls inside itself (no page overflow); no blur, rotate, or 3D (image-carousel).

### R44 Dotted globe, R3F port (globe, re-admitted)

Re-admitted in v0.4.0: the digest dropped Magic UI `globe` only because WebGL was not approved. `cobe` (the upstream renderer) is still not installed without Brian's yes; this port uses the approved Three.js plus React Three Fiber. Configuration ideas (tilt 0.3 rad, dot lattice, marker sizes, drag-to-rotate) come from the Magic UI source; everything else is new.

- **DOM**: `<figure class="globe">` holding a grid cell with the poster `<img>` (build-time SVG) and, once armed, the `<Canvas>`; a 44px "Pause rotation" button (`aria-pressed`); a `<figcaption>` plus a visible `<ul>` of the marked locations (the canvas is `aria-hidden`). The figure sizes to its container (`aspect-ratio: 1; inline-size: 100%`), never `absolute inset-0` like upstream.
- **Mechanism**: the same `lonlat.json` as R38 becomes an `InstancedMesh` of small circles on a unit sphere, each oriented outward; an unlit `MeshBasicMaterial` sphere in `--color-surface` at radius 0.995 hides the back dots (flat, no shading). Markers are a second `InstancedMesh` in `--color-accent` at radius 1.002. Rotation `y = offset + playTime x 2pi / --loop-globe` (constant speed, linear exception) plus a drag offset smoothed with `THREE.MathUtils.damp` (critically damped, no overshoot). `frameloop` is `"always"` only while playing, in view, and the tab is visible; otherwise `"demand"`. `touch-action: pan-y` so vertical scrolling passes through and horizontal drag rotates.
- **Loading**: `three` and R3F load by dynamic `import()` only when the figure nears the viewport (IntersectionObserver, 200px margin) and `imm.tier` allows WebGL; the poster renders first and is the fallback for low tiers, context loss, and reduced motion. DPR capped at 2. R3F disposes JSX-declared geometry and materials on unmount; the instance buffers are declared in JSX, so nothing leaks.
- **Timing**: canvas fades in over the poster at `--dur-400` after the first frame, then the poster is set `hidden` (so nothing stacks at rest); one turn per `--loop-globe`; drag damping lambda 8.
- **Reduced motion**: static. No canvas and no rotation; the poster and the location list only. Auto-rotation otherwise runs slowly (one turn per `--loop-globe`) and always with the visible 44px pause control; this matches `three.dot_globe` in `jal-immersive` SKILL.md section 4.5.

```tsx
// Globe.tsx (lazy chunk)
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { tok } from "../motion/runtime";

function Dots({ ll, r, size, color }: { ll: Float32Array; r: number; size: number; color: string }) {
  const ref = React.useRef<THREE.InstancedMesh>(null!); const n = ll.length / 2;
  React.useLayoutEffect(() => {
    const o = new THREE.Object3D(), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const lon = THREE.MathUtils.degToRad(ll[2 * i]), lat = THREE.MathUtils.degToRad(ll[2 * i + 1]);
      v.setFromSphericalCoords(r, Math.PI / 2 - lat, lon);
      o.position.copy(v); o.lookAt(v.x * 2, v.y * 2, v.z * 2); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [ll, r, n]);
  return (<instancedMesh ref={ref} args={[undefined, undefined, n]}>
    <circleGeometry args={[size, 8]} /><meshBasicMaterial color={color} /></instancedMesh>);
}

function Spin({ playing, drag, turn, children }: { playing: React.RefObject<boolean>; drag: React.RefObject<number>; turn: number; children: React.ReactNode }) {
  const g = React.useRef<THREE.Group>(null!); const play = React.useRef(0); const off = React.useRef(0);
  useFrame((_, dt) => {
    if (playing.current) play.current += dt;
    off.current = THREE.MathUtils.damp(off.current, drag.current, 8, dt);
    g.current.rotation.y = (play.current * 2 * Math.PI) / turn + off.current;
  });
  return <group ref={g} rotation-x={0.3}>{children}</group>;
}

type GlobeProps = { land: Float32Array; markers: Float32Array; colors: { surface: string; ink: string; accent: string };
  playing: boolean; inView: boolean; onLost: () => void };

export default function Globe({ land, markers, colors, playing, inView, onLost }: GlobeProps) {
  const play = React.useRef(playing); play.current = playing;
  const drag = React.useRef(0); const [dragging, setDragging] = React.useState(false);
  return (
    <Canvas dpr={[1, 2]} frameloop={inView && (playing || dragging) ? "always" : "demand"}
      camera={{ position: [0, 0, 2.6], fov: 45 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} aria-hidden
      onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onLost(); })}
      onPointerDown={() => setDragging(true)} onPointerUp={() => setDragging(false)} onPointerLeave={() => setDragging(false)}
      onPointerMove={(e) => { if (e.buttons) drag.current += e.movementX / 200; }} style={{ touchAction: "pan-y" }}>
      <Spin playing={play} drag={drag} turn={tok("--loop-globe") / 1000}>
        <mesh><sphereGeometry args={[0.995, 48, 48]} /><meshBasicMaterial color={colors.surface} /></mesh>
        <Dots ll={land} r={1} size={0.006} color={colors.ink} />
        <Dots ll={markers} r={1.002} size={0.018} color={colors.accent} />
      </Spin>
    </Canvas>);
}
```
```css
.globe { display: grid; aspect-ratio: 1; inline-size: 100%; contain: layout paint; }
.globe > .globe-stage { display: grid; } .globe-stage > * { grid-area: 1 / 1; inline-size: 100%; block-size: 100%; }
.globe canvas { opacity: 0; transition: opacity var(--dur-400) var(--ease-standard); } .globe[data-live] canvas { opacity: 1; }
```
- **Colors**: read `--color-surface`, `--color-ink` (at low alpha via `color-mix` resolved to a hex by the component), and `--color-accent` from `getComputedStyle` once, convert with `new THREE.Color()`, and rebuild on theme change.
- **Tailwind**: figure `grid aspect-square w-full [contain:layout_paint]`; stage `grid *:[grid-area:1/1] *:size-full`; canvas wrapper `opacity-0 transition-opacity duration-(--dur-400) ease-standard group-data-live:opacity-100`; pause button `min-h-control px-16px rounded-md border border-border-control`.
- **Law**: unlit flat materials, so no lighting gradient on the sphere; no atmosphere glow (upstream `glowColor` dropped), no bloom, no gradient rim, no purple markers; the page around it stays white-first; the pause control is mandatory (the turn runs past 5s); one globe per page; `cobe` is not a dependency.

### R45 Compare slider (`ok.compare_slider`; OriginKit compare-slider idea)

- **DOM**: `<figure class="cs" style="--p: 50">` holding a `.cs-frame` grid whose children share one cell: the after `<img>` (with alt text), a `.cs-clip` wrapper around the before `<img>` (with alt text), and a `.cs-rail` layer (`pointer-events: none`) that carries the handle `<div role="slider" tabindex="0" aria-label="Before and after split" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50 percent before">`. The handle is a 44px circle (`surface`, 1px `border-strong`, a koboyo grip icon) and takes pointer events itself. A `<figcaption>` row under the frame holds the visible "Before" and "After" labels. Both images share one `aspect-ratio`, so nothing shifts on load.
- **Mechanism**: the split is transform only. `.cs-clip` has `overflow: clip` and moves by `translateX((p - 100)%)`, and the before image inside it moves back by `translateX((100 - p)%)`, so the left p% of the frame shows the before image and the rest shows the after image. The rail moves by `translateX((p - 50)%)` with the handle centered in it. `pointerdown` on the frame captures the pointer and sets `p` from `clientX`; `pointermove` while captured updates `--p` once per frame (rAF-coalesced). Keys on the handle: Left and Right step 1, PageUp and PageDown (or Shift plus an arrow) step 10, Home 0, End 100. Optional hover-follow (`data-follow`) runs only under `(hover: hover) and (pointer: fine)`. `touch-action: pan-y` lets vertical page scroll pass through while horizontal drags move the split.
- **Timing**: drag and hover-follow track the pointer directly (no transition). A keyboard step eases at `--dur-100`. There is no entrance sweep.
- **Reduced motion**: keyboard steps are instant; hover-follow is off; drag stays (direct manipulation).
- **OriginKit**: Brian approved OriginKit, so the real `compare-slider` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this recipe stays the default and the fallback.

```css
.cs-frame { display: grid; overflow: clip; border-radius: var(--radius-lg); touch-action: pan-y; }
.cs-frame > * { grid-area: 1 / 1; }
.cs-frame img { inline-size: 100%; aspect-ratio: var(--cs-ratio, 16 / 10); object-fit: cover; }
.cs-clip { overflow: clip; transform: translateX(calc((var(--p) - 100) * 1%)); }
.cs-clip > img { transform: translateX(calc((100 - var(--p)) * 1%)); }
.cs-rail { display: grid; place-items: center; pointer-events: none; transform: translateX(calc((var(--p) - 50) * 1%)); }
.cs-handle { pointer-events: auto; inline-size: var(--control-h); aspect-ratio: 1; display: grid; place-items: center;
  border-radius: var(--radius-pill); background: var(--color-surface); border: 1px solid var(--color-border-strong); cursor: ew-resize; }
.cs-clip, .cs-clip > img, .cs-rail { transition: transform var(--dur-100) var(--ease-standard); }
.cs[data-dragging] :is(.cs-clip, .cs-clip > img, .cs-rail) { transition: none; }
.cs figcaption { display: flex; justify-content: space-between; padding-block-start: var(--space-8px); color: var(--color-ink-muted); }
@media (prefers-reduced-motion: reduce) { .cs-clip, .cs-clip > img, .cs-rail { transition: none; } }
```
```ts
export function bindCompare(fig: HTMLElement, handle: HTMLElement) {
  const frame = fig.querySelector<HTMLElement>(".cs-frame")!; let raf = 0;
  const set = (p: number) => { p = Math.max(0, Math.min(100, Math.round(p)));
    fig.style.setProperty("--p", String(p)); handle.setAttribute("aria-valuenow", String(p));
    handle.setAttribute("aria-valuetext", `${p} percent before`); };
  const fromX = (x: number) => { const r = frame.getBoundingClientRect(); return ((x - r.left) / r.width) * 100; };
  frame.addEventListener("pointerdown", (e) => { frame.setPointerCapture(e.pointerId); fig.dataset.dragging = ""; set(fromX(e.clientX)); });
  frame.addEventListener("pointermove", (e) => {
    const follow = "follow" in fig.dataset && matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReduced();
    if (!frame.hasPointerCapture(e.pointerId) && !follow) return;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => set(fromX(e.clientX)));
  });
  frame.addEventListener("pointerup", () => delete fig.dataset.dragging);
  handle.addEventListener("keydown", (e) => {
    const p = Number(handle.getAttribute("aria-valuenow")), big = e.shiftKey ? 10 : 1;
    const next = ({ ArrowLeft: p - big, ArrowRight: p + big, PageDown: p - 10, PageUp: p + 10, Home: 0, End: 100 } as Record<string, number>)[e.key];
    if (next === undefined) return; e.preventDefault(); set(next);
  });
}
```
- **Tailwind**: frame `grid overflow-clip rounded-lg touch-pan-y *:[grid-area:1/1]`; clip `overflow-clip translate-x-(--cs-a) transition-transform duration-(--dur-100) ease-standard motion-reduce:transition-none` with before image `translate-x-(--cs-b)`, where the component sets `--cs-a: calc((var(--p) - 100) * 1%)` and `--cs-b: calc((100 - var(--p)) * 1%)`; rail `grid place-items-center pointer-events-none translate-x-(--cs-r)`; handle `pointer-events-auto size-control grid place-items-center rounded-pill bg-surface border border-border-strong`; caption `flex justify-between pt-8px text-ink-muted`. Add `data-dragging:transition-none` on each moving part.
- **Law**: the two images share one cell, but the clip splits the frame so no pixel ever shows both (the stack is the mechanism, like the R02 crossfade slot); labels sit outside the image, never text on a photo; no drawn divider line (the image edge is the boundary) and no glow on the handle; 44px handle; the split starts at 50 and is never animated on load.

### R46 Row preview (`ok.row_preview`; OriginKit hover-image-reveal and link-preview ideas)

- **DOM**: `<section class="rp">` as a two-column grid: a `<ul class="rp-list">` of rows, each `<li><a href data-i="n"><span>Name</span><img class="rp-thumb" alt="..."></a></li>`, and a `.rp-stage` (`aria-hidden="true"`, since its images repeat the row thumbnails) that holds every preview image in one grid cell, with `data-on` on the active one. The link-preview variant uses a `popover` element for inline links in prose, anchored with CSS anchor positioning.
- **Mechanism**: from 1024 under `(hover: hover) and (pointer: fine)`, the row thumbnails hide and the stage shows as the second column, sticky below the 64px nav plus `--banner-height` (`hm.sticky_stack`). `pointerenter` or `focus` on a row makes its preview active: the old image fades out and the new one fades in (opacity only). Leaving the list keeps the last preview, so the stage never flashes empty. The first row starts active. All preview images decode on idle (`img.decode()`), so a hover never shows a blank frame. The row answers hover with `ink-muted` to `ink` only; the preview is its one hover signal. Link-preview variant: above the link, flipping below when there is no room, never covering the link; a thumbnail plus a title, 240 wide at most; it opens after the tooltip hover delay (`hm.tooltip_timing`) and instantly on keyboard focus, and closes on pointer leave, blur, or Escape. It holds no links or buttons.
- **Timing**: preview crossfade `--dur-200` in, `--dur-200-exit` out; popover opacity in at `--dur-100`, out instantly (DS-C Tooltip).
- **Reduced motion**: the preview swaps instantly; the popover appears without a fade.
- **Below 1024 or on touch**: no stage; each row shows its own inline thumbnail at a fixed aspect ratio. The link preview never opens (the link text carries the meaning).
- **OriginKit**: Brian approved OriginKit, so the real `hover-image-reveal` or `link-preview` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this recipe stays the default and the fallback.

```css
.rp { display: grid; gap: var(--space-32px); }
.rp-stage { display: none; }
.rp-thumb { inline-size: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius-md); }
.rp-list a { color: var(--color-ink-muted); transition: color var(--dur-100) var(--ease-standard); }
.rp-list a:is(:hover, :focus-visible, [aria-current="true"]) { color: var(--color-ink); }
@media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
  .rp { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .rp-thumb { display: none; }
  .rp-stage { display: grid; position: sticky; inset-block-start: calc(var(--space-64px) + var(--banner-height)); align-self: start; }
  .rp-stage > img { grid-area: 1 / 1; inline-size: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius-lg);
    opacity: 0; transition: opacity var(--dur-200-exit) var(--ease-standard); }
  .rp-stage > img[data-on] { opacity: 1; transition-duration: var(--dur-200); }
}
@media (prefers-reduced-motion: reduce) { .rp-stage > img { transition: none; } }
```
```ts
export function bindRowPreview(list: HTMLElement, stage: HTMLElement) {
  const imgs = [...stage.querySelectorAll<HTMLImageElement>("img")];
  requestIdleCallback?.(() => imgs.forEach((i) => i.decode().catch(() => {})));
  const show = (i: number) => imgs.forEach((im, k) => im.toggleAttribute("data-on", k === i));
  list.querySelectorAll<HTMLElement>("a[data-i]").forEach((a) => {
    const i = Number(a.dataset.i); a.addEventListener("pointerenter", () => show(i)); a.addEventListener("focus", () => show(i));
  });
  show(0);
}
```
- **Tailwind**: section `grid gap-32px lg:pointer-fine:grid-cols-2`; thumb `w-full aspect-[4/3] object-cover rounded-md lg:pointer-fine:hidden`; stage `hidden lg:pointer-fine:grid lg:pointer-fine:sticky top-[calc(var(--space-64px)+var(--banner-height))] self-start *:[grid-area:1/1]`; preview `w-full aspect-[4/3] object-cover rounded-lg opacity-0 transition-opacity duration-(--dur-200-exit) ease-standard data-on:opacity-100 data-on:duration-(--dur-200) motion-reduce:transition-none`; row link `text-ink-muted hover:text-ink focus-visible:text-ink transition-colors duration-(--dur-100)`.
- **Law**: no image follows the cursor and nothing tilts; the preview never covers a row; one preview visible at rest; the stage images are decorative duplicates (`aria-hidden`), the row thumbnails carry the alt text; real work imagery only.

### R47 Weight shift (`ok.weight_shift`; OriginKit dynamic-weight and weight-hover ideas)

- **DOM**: `<span class="ws"><span class="sr-only">Word</span><span class="ws-row" aria-hidden="true">{letters}</span></span>`. Each letter is `<span class="ws-l" data-w="0">` holding copies of the same glyph in one grid cell: 400 and 600 for hover mode, 400, 500, and 600 for proximity mode. The cell sizes to the widest copy, so the word's width never changes.
- **Mechanism**: `font-weight` never animates. Each letter crossfades between its static copies by opacity, and `data-w` names the visible copy. Hover mode: hover or focus-visible on the parent link or button sets every letter to 600. Proximity mode (pointer-fine only): a rAF-coalesced `pointermove` inside the word gives the nearest letter 600, its direct neighbors 500, and the rest 400, and `pointerleave` resets every letter to 400. Every letter always rests on exactly one copy, so glyphs never ghost at rest. Any static face with 400, 500, and 600 works. The variable-font route (interpolating `font-weight`) is not used: it animates a layout property and needs a new font dependency, both Brian's call.
- **Timing**: hover mode `--dur-150` in, `--dur-150-exit` out; proximity mode `--dur-100` per letter.
- **Reduced motion**: hover mode swaps the weight instantly (a state change, still visible); proximity mode is off.
- **Touch and below 640**: proximity mode off; hover mode answers focus only.
- **OriginKit**: Brian approved OriginKit, so the real `dynamic-weight` or `weight-hover` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this recipe stays the default and the fallback. A fetched version that animates a variable axis still needs Brian's font approval.

```css
.ws-l { display: inline-grid; } .ws-l > * { grid-area: 1 / 1; opacity: 0; transition: opacity var(--dur-150-exit) var(--ease-standard); }
.ws-l > .w0 { font-weight: var(--weight-regular); } .ws-l > .w1 { font-weight: var(--weight-medium); } .ws-l > .w2 { font-weight: var(--weight-semibold); }
.ws-l[data-w="0"] > .w0, .ws-l[data-w="1"] > .w1, .ws-l[data-w="2"] > .w2 { opacity: 1; transition-duration: var(--dur-150); }
:is(a, button):is(:hover, :focus-visible) .ws[data-mode="hover"] .ws-l > .w0 { opacity: 0; }
:is(a, button):is(:hover, :focus-visible) .ws[data-mode="hover"] .ws-l > .w2 { opacity: 1; transition-duration: var(--dur-150); }
.ws[data-mode="near"] .ws-l > * { transition-duration: var(--dur-100); }
@media (prefers-reduced-motion: reduce) { .ws-l > * { transition: none; } }
```
```ts
export function bindNear(word: HTMLElement) {
  if (prefersReduced() || !matchMedia("(hover: hover) and (pointer: fine) and (min-width: 640px)").matches) return;
  const ls = [...word.querySelectorAll<HTMLElement>(".ws-l")]; let raf = 0;
  word.addEventListener("pointermove", (e) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
    let near = 0, best = Infinity;
    ls.forEach((l, i) => { const r = l.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)); if (d < best) { best = d; near = i; } });
    ls.forEach((l, i) => (l.dataset.w = String(Math.max(0, 2 - Math.abs(i - near)))));
  }); }, { passive: true });
  word.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); ls.forEach((l) => (l.dataset.w = "0")); });
}
```
- **Tailwind**: letter `inline-grid *:[grid-area:1/1] *:opacity-0 *:transition-opacity *:duration-(--dur-150-exit) *:ease-standard motion-reduce:*:transition-none`; copies `font-normal`, `font-medium`, `font-semibold` (Tailwind's default weight keys equal the JAL 400, 500, and 600 tokens; no other weight utility is used); visible copy `data-[w=0]:[&>.w0]:opacity-100 data-[w=1]:[&>.w1]:opacity-100 data-[w=2]:[&>.w2]:opacity-100`; hover mode on the parent `group` with `group-hover:[&>.w0]:opacity-0 group-hover:[&>.w2]:opacity-100 group-focus-visible:[&>.w2]:opacity-100`.
- **Law**: weights 400, 500, and 600 only (the JAL scale); transform and opacity only; display words and nav labels only, never body text or links in running copy; the word is set on 600 widths, so the 400 state reads slightly open, which is why this stays on short words; one hover signal (no roll, no nudge with it).

### R48 Center focus slider (`ok.center_focus_slider`; OriginKit smooth-scroll-slider idea)

- **DOM**: R43 markup (`aria-roledescription="carousel"` on the region, a `<ul class="cf" tabindex="0">` track, items `.cf-item`, 44px previous and next buttons), with inline padding so the first and last items can center.
- **Mechanism**: native horizontal scrolling with `scroll-snap-type: x mandatory` and `scroll-snap-align: center`. Each item runs a CSS scroll-driven animation on `view(inline)` that scales it from 0.94 at the track edges to 1 at the center, eased on `--ease-standard` per keyframe. It sits behind `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`; other browsers get plain R43. The buttons call `scrollBy` one item width. The source's lerped JS momentum is dropped: the browser's own scrolling is the physics.
- **Timing**: scroll is the clock (no duration); buttons use native smooth scrolling.
- **Reduced motion**: no scale, instant `scrollBy`, no smooth scrolling.
- **Mobile**: the same track with items at 80% width; native swipe.
- **OriginKit**: Brian approved OriginKit, so the real `smooth-scroll-slider` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this recipe stays the default and the fallback. Its lerped momentum is removed on adoption.

```css
.cf { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 80%); gap: var(--space-16px); overflow-x: auto;
  scroll-snap-type: x mandatory; overscroll-behavior-x: contain; padding-inline: 10%; }
@media (min-width: 768px) { .cf { grid-auto-columns: minmax(0, 40%); padding-inline: 30%; } }
.cf-item { scroll-snap-align: center; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .cf { scroll-behavior: smooth; }
    .cf-item { animation: cf-focus linear both; animation-timeline: view(inline); }
    @keyframes cf-focus {
      0% { scale: 0.94; animation-timing-function: var(--ease-standard); }
      50% { scale: 1; animation-timing-function: var(--ease-standard); }
      100% { scale: 0.94; }
    }
  }
}
```
- **Tailwind**: track `grid grid-flow-col auto-cols-[minmax(0,80%)] md:auto-cols-[minmax(0,40%)] gap-16px overflow-x-auto snap-x snap-mandatory overscroll-x-contain px-[10%] md:px-[30%]`; item `snap-center`; the scroll-timeline block stays in the component stylesheet; buttons `min-h-control min-w-control`.
- **Law**: scale only, never below 0.94 and never above 1, so an item never grows past its own box and never overlaps a neighbor; no opacity dimming, so text contrast holds on every item; no 3D, no tilt, no blur; the track scrolls inside itself (no page overflow); auto-advance is off.

### R49 Tab preview (`ok.tab_preview`; OriginKit features-01 idea)

- **DOM**: `<section class="tp">` as a two-column grid: a `role="tablist"` with `aria-orientation="vertical"` and an `aria-label`, holding `<button role="tab" aria-selected aria-controls>` rows (title 16 / 600 plus a one-line description, at least 44 tall), and a `.tp-stage` holding one `role="tabpanel"` per tab in one grid cell. Only the active panel is visible; the others are `hidden` (during a swap, the outgoing panel stays until its exit finishes).
- **Mechanism**: the R13 tonal indicator (a `layoutId` child of the selected tab, `layer-2`), moving vertically. The panel swaps with the R02 fade-through preset in crossfade mode. Keyboard: roving tabindex; Up and Down move focus, Home and End jump, and Enter or Space selects (manual activation, as R13). Below 640 the list becomes an R22 disclosure: each tab becomes a disclosure button with its preview inside its own panel, one open at a time.
- **Timing**: indicator `T.base`; panel fade-through `--dur-200` in, `--dur-200-exit` out. There is no auto-advance by default. If one is added, it is a pure time clock with a pause control, and any user input stops it.
- **Reduced motion**: the indicator jumps (`T.none`); the panel crossfades at `--dur-reduced`.
- **OriginKit**: Brian approved OriginKit, so the real `features-01` section can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules; Next.js imports are replaced); this recipe stays the default and the fallback.

```tsx
<section className="tp">
  <div role="tablist" aria-orientation="vertical" aria-label="Features" className="tp-list" onKeyDown={roving}>
    {items.map((t) => { const on = t.id === sel; return (
      <button key={t.id} role="tab" id={`t-${t.id}`} aria-selected={on} aria-controls={`p-${t.id}`} tabIndex={on ? 0 : -1}
        className="tp-tab" onClick={() => setSel(t.id)}>
        {on && <motion.span layoutId="tp-ind" className="tp-ind" style={{ borderRadius: radiusPx }} transition={reduced ? T.none : T.base} />}
        <span className="tp-title">{t.title}</span><span className="tp-desc">{t.desc}</span>
      </button>); })}
  </div>
  <div className="tp-stage">
    {items.map((t) => (<div key={t.id} role="tabpanel" id={`p-${t.id}`} aria-labelledby={`t-${t.id}`} hidden={t.id !== shown}>
      <img src={t.src} alt={t.alt} /></div>))}
  </div>
</section>
```
```css
.tp { display: grid; gap: var(--space-32px); }
@media (min-width: 768px) { .tp { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: start; } }
.tp-list { display: grid; gap: var(--space-4px); }
.tp-tab { position: relative; isolation: isolate; display: grid; gap: var(--space-4px); text-align: start; min-block-size: var(--control-h);
  padding: var(--space-12px) var(--space-16px); border-radius: var(--radius-md); color: var(--color-ink-muted); }
.tp-tab[aria-selected="true"] { color: var(--color-ink); }
.tp-ind { position: absolute; inset: 0; z-index: -1; background: var(--color-layer-2); }
.tp-stage { display: grid; } .tp-stage > * { grid-area: 1 / 1; }
.tp-stage img { inline-size: 100%; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
```
- **Tailwind**: section `grid gap-32px md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-start`; list `grid gap-4px`; tab `relative isolate grid gap-4px text-start min-h-control px-16px py-12px rounded-md text-ink-muted aria-selected:text-ink`; indicator `absolute inset-0 -z-10 bg-layer-2`; stage `grid *:[grid-area:1/1]`; image `w-full rounded-lg border border-border`.
- **Law**: the indicator is a tonal fill, never a side bar or accent edge (the vertical list tempts one, and it is banned); real product screenshots in a hairline frame, no fake device chrome; tabs carry numbers only for a real ordered process; one visible panel at rest.

### R50 Press plate (`ok.press_plate`; OriginKit tactile-button idea)

- **DOM**: `<button class="pp"><span class="pp-cap">Label</span></button>`. The button is the hit area (44 cap plus a 4px plate, 48 in all). Its `::before` is the plate, a `layer-2` block offset 4px down behind the cap, so only a 4px strip of it shows under the cap at rest.
- **Mechanism**: on `:active` (and on `data-pressed`, set from keydown for Enter, which has no native `:active`), the cap moves down `--space-4px` onto the plate and takes the 12% pressed state layer. The press travel replaces the standard `scale(0.98)`; the two never combine. Hover gives the cap the 8% state layer only. The only hairline is the cap's 1px `border-control`; the plate is a tonal step with no border. The return is eased, with no spring.
- **Timing**: press `--dur-100`; return `--dur-150-exit`; state layer `--dur-100`.
- **Reduced motion**: no travel; the pressed state layer carries the press.
- **OriginKit**: Brian approved OriginKit, so the real `tactile-button` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this recipe stays the default and the fallback. Any shadow or spring in it is removed on adoption.

```css
.pp { position: relative; isolation: isolate; display: inline-grid; padding: 0 0 var(--space-4px); border: 0; background: none; border-radius: var(--radius-md); }
.pp::before { content: ""; position: absolute; inset: var(--space-4px) 0 0; z-index: -1; border-radius: var(--radius-md); background: var(--color-layer-2); }
.pp-cap { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8px); min-block-size: var(--control-h);
  padding-inline: var(--space-16px); border-radius: var(--radius-md); border: 1px solid var(--color-border-control);
  background: var(--color-surface); color: var(--color-ink);
  transition: transform var(--dur-150-exit) var(--ease-standard), background-color var(--dur-100) var(--ease-standard); }
@media (hover: hover) { .pp:hover .pp-cap { background: color-mix(in oklab, var(--color-ink) 8%, var(--color-surface)); } }
.pp:is(:active, [data-pressed]) .pp-cap { transform: translateY(var(--space-4px)); transition-duration: var(--dur-100);
  background: color-mix(in oklab, var(--color-ink) 12%, var(--color-surface)); }
@media (prefers-reduced-motion: reduce) { .pp:is(:active, [data-pressed]) .pp-cap { transform: none; } }
```
- **Tailwind**: button `group relative isolate inline-grid pb-4px rounded-md before:absolute before:inset-x-0 before:bottom-0 before:top-4px before:-z-10 before:rounded-md before:bg-layer-2`; cap `inline-flex items-center justify-center gap-8px min-h-control px-16px rounded-md border border-border-control bg-surface text-ink transition-[translate,background-color] duration-(--dur-150-exit) ease-standard hover:bg-state-hover group-active:bg-state-pressed motion-safe:group-active:translate-y-4px group-active:duration-(--dur-100) group-data-pressed:bg-state-pressed motion-safe:group-data-pressed:translate-y-4px`.
- **Law**: no shadow and no offset block shadow (the plate is a tonal step inside the button's own box and never extends past it); no spring back; the cap resting over the plate is one control's own parts, like the R17 thumb on its track; marketing CTAs only, one per section, never product UI.

### R51 Entry fill (`ok.entry_fill`; OriginKit radial-reveal-button and slide-fill-button ideas)

- **DOM**: a button or link with `position: relative; isolation: isolate; overflow: clip`, holding `<span class="ef-fill" aria-hidden="true">` under the label.
- **Mechanism**: the hover fill starts where the pointer entered. Radial variant: on `pointerenter` (mouse or pen only), the component places a circle, twice the box diagonal wide, centered on the entry point, and scales it from 0 to 1. On `pointerleave` it moves the circle's center to the exit point with no transition (at scale 1 the circle covers the box from any center, so nothing jumps), then scales it back to 0. Straight variant: the fill is `inset: 0` and scales on the inline axis from the entry side (`transform-origin` set to the left or right edge), shrinking toward the exit side on leave. Two tones: `tint` (default) is the flat 8% hover state layer, so the label never changes color; `solid` (marketing only) fills with `ink` and switches the label to `surface` at `--dur-100`, delayed half the fill duration. Keyboard focus shows the focus ring only and no fill (`hm.zero_ms`).
- **Timing**: fill `--dur-200` in, `--dur-200-exit` out; `solid` label color `--dur-100` after a `--dur-100` delay.
- **Reduced motion**: no wipe; the fill fades in at full size at `--dur-reduced`.
- **Touch**: no hover fill; the pressed state layer only.
- **OriginKit**: Brian approved OriginKit, so the real `radial-reveal-button` or `slide-fill-button` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this recipe stays the default and the fallback. Liquid waves and gradients in them are removed on adoption.

```css
.ef { position: relative; isolation: isolate; overflow: clip; }
.ef-fill { position: absolute; z-index: -1; pointer-events: none; background: color-mix(in oklab, var(--color-ink) 8%, transparent);
  scale: 0; transition: scale var(--dur-200-exit) var(--ease-standard); }
.ef[data-shape="radial"] .ef-fill { inline-size: var(--d); aspect-ratio: 1; border-radius: 50%;
  inset-inline-start: calc(var(--x) - var(--d) / 2); inset-block-start: calc(var(--y) - var(--d) / 2); }
.ef[data-shape="straight"] .ef-fill { inset: 0; scale: 0 1; transform-origin: var(--from, left) center; }
.ef[data-tone="solid"] .ef-fill { background: var(--color-ink); }
.ef[data-in] .ef-fill { scale: 1; transition-duration: var(--dur-200); }
.ef[data-tone="solid"][data-in] { color: var(--color-surface); transition: color var(--dur-100) var(--ease-standard) var(--dur-100); }
@media (prefers-reduced-motion: reduce) {
  .ef-fill { scale: 1; opacity: 0; transition: opacity var(--dur-reduced) var(--ease-standard); }
  .ef[data-in] .ef-fill { opacity: 1; }
}
```
```ts
export function bindEntryFill(el: HTMLElement) {
  const at = (e: PointerEvent) => { const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`); el.style.setProperty("--y", `${e.clientY - r.top}px`);
    el.style.setProperty("--d", `${Math.hypot(r.width, r.height) * 2}px`);
    el.style.setProperty("--from", e.clientX - r.left < r.width / 2 ? "left" : "right"); };
  el.addEventListener("pointerenter", (e) => { if (e.pointerType === "touch") return; at(e); el.dataset.in = ""; });
  el.addEventListener("pointerleave", (e) => { if (e.pointerType === "touch") return; at(e); delete el.dataset.in; });
}
```
- **Tailwind**: host `group relative isolate overflow-clip`; fill `absolute -z-10 pointer-events-none bg-state-hover scale-0 transition-[scale] duration-(--dur-200-exit) ease-standard group-data-in:scale-100 group-data-in:duration-(--dur-200)`; radial `w-(--d) aspect-square rounded-full left-[calc(var(--x)-var(--d)/2)] top-[calc(var(--y)-var(--d)/2)]`; straight `inset-0 scale-x-0 origin-(--from) group-data-in:scale-x-100`; solid tone `bg-ink` plus `group-data-in:text-surface`; reduced `motion-reduce:scale-100 motion-reduce:opacity-0 motion-reduce:group-data-in:opacity-100`.
- **Law**: one flat color, clipped inside its own box, no gradient, no waves; one hover signal (never together with the R15 arrow nudge or fill sweep; R15 grows from the center, R51 from the entry point); marketing CTAs only. Product controls keep the DS-C state layer, which never spreads from the pointer; the `solid` label must pass contrast in both resting states.

### R52 Floating nav morph (`hm.floating_nav_morph`; hallmark principle)

- **DOM**: `<header class="fn">` (sticky, fixed block size) holding a `.fn-bar` background layer (`aria-hidden`) and `<nav class="fn-row" aria-label="Main">`, a content-sized group (logo, links, CTA) centered in the header, with its own `.fn-pill` background layer (`aria-hidden`, `inset: 0`). A 1px `.fn-sentinel` (`aria-hidden`) sits 64px (`--space-64px`) from the top of the page.
- **Mechanism**: an IntersectionObserver on the sentinel sets `data-morphed` on the header once the sentinel scrolls out (so after 64px of scroll) and clears it when the sentinel returns. The morph changes only three properties: `.fn-bar` opacity 1 to 0, `.fn-pill` opacity 0 to 1, and `.fn-row` `translate` 0 to `--space-8px`, which detaches the pill from the top edge. The bar is `surface` with a bottom 1px `border` hairline across the full width. The pill is opaque `surface` with a 1px `border` hairline on all sides and `--radius-pill`, sized to the nav group. The four laws:
  1. **Constant height**: the header's block size never changes between states.
  2. **Transform offset**: detachment is `translate` on the row, never `top`, `margin`, or `padding`.
  3. **Explicit ownership and neutralization**: each morphing property has one owner selector and an explicit value in both states (bar opacity, pill opacity, row translate). Nothing else differs between states (no width, radius, border, padding, or color change), and a property set in one state but not reset in the other is a bug.
  4. **One curve, one listener rule**: all three properties run on `--ease-standard` at one duration and start together. The trigger is the sentinel observer; if a scroll listener is used instead, it is `passive`, rAF-throttled, and uses a threshold of 60px or more (64 here).
  The header sits above in-page stickies on the named nav z-level (`--z-nav`, `hm.sticky_stack`), and in-page stickies dock at `--banner-height` below it (`hm.sticky_stack`).
- **Timing**: `--dur-300` into the pill, `--dur-300-exit` back to the bar.
- **Below 640**: the app-shell header stays pinned and unmorphed (the observer is not created and the styles are gated at 640).
- **Reduced motion**: the backgrounds swap by opacity at `--dur-reduced`; the row does not travel (the pill stays attached at the top).
- **OriginKit**: no OriginKit item backs this recipe. Brian approved OriginKit, so if JEV picks an OriginKit navigation component for a client project instead, it can be fetched on demand through the OriginKit MCP (section 1 rules), and it must still pass the four laws above.

```css
@media (min-width: 640px) {
  .fn { position: sticky; inset-block-start: 0; z-index: var(--z-nav); block-size: var(--space-64px); display: grid; place-items: center; }
  .fn-bar { position: absolute; inset: 0; background: var(--color-surface); border-block-end: 1px solid var(--color-border);
    opacity: 1; transition: opacity var(--dur-300-exit) var(--ease-standard); }
  .fn-row { position: relative; isolation: isolate; display: flex; align-items: center; gap: var(--space-24px);
    padding-inline: var(--space-16px); min-block-size: var(--control-h);
    translate: 0 0; transition: translate var(--dur-300-exit) var(--ease-standard); }
  .fn-pill { position: absolute; inset: 0; z-index: -1; border-radius: var(--radius-pill); background: var(--color-surface);
    border: 1px solid var(--color-border); opacity: 0; transition: opacity var(--dur-300-exit) var(--ease-standard); }
  .fn[data-morphed] .fn-bar { opacity: 0; transition-duration: var(--dur-300); }
  .fn[data-morphed] .fn-pill { opacity: 1; transition-duration: var(--dur-300); }
  .fn[data-morphed] .fn-row { translate: 0 var(--space-8px); transition-duration: var(--dur-300); }
}
@media (min-width: 640px) and (prefers-reduced-motion: reduce) {
  .fn-bar, .fn-pill { transition: opacity var(--dur-reduced) var(--ease-standard); }
  .fn-row, .fn[data-morphed] .fn-row { translate: 0 0; transition: none; }
}
```
```ts
export function bindFloatingNav(header: HTMLElement, sentinel: HTMLElement) {
  const mq = matchMedia("(min-width: 640px)"); let io: IntersectionObserver | null = null;
  const arm = () => { io?.disconnect(); io = null; header.removeAttribute("data-morphed"); if (!mq.matches) return;
    io = new IntersectionObserver(([e]) => header.toggleAttribute("data-morphed", !e.isIntersecting)); io.observe(sentinel); };
  mq.addEventListener("change", arm); arm();
  return () => { io?.disconnect(); mq.removeEventListener("change", arm); };
}
```
- **Tailwind**: header `sm:sticky sm:top-0 sm:z-(--z-nav) sm:h-64px sm:grid sm:place-items-center group`; bar `absolute inset-0 bg-surface border-b border-border transition-opacity duration-(--dur-300-exit) ease-standard group-data-morphed:opacity-0 group-data-morphed:duration-(--dur-300)`; row `relative isolate flex items-center gap-24px px-16px min-h-control transition-[translate] duration-(--dur-300-exit) ease-standard motion-safe:group-data-morphed:translate-y-8px group-data-morphed:duration-(--dur-300)`; pill `absolute inset-0 -z-10 rounded-pill bg-surface border border-border opacity-0 transition-opacity duration-(--dur-300-exit) group-data-morphed:opacity-100 group-data-morphed:duration-(--dur-300)`.
- **Law**: no blur, no shadow, no glow, no translucency (the pill is opaque, so scrolled content never shows through its text); no height change and no layout property in the morph; marketing pages only, never the product app-shell; one floating nav per site.

### OriginKit presets on R02 and R06

These four ride on the R02 engine or the R06 structure. Each gets the full recipe shape here; the R02 preset table carries the three text rows.

#### `ok.slot_roll` (R02 preset; OriginKit rolling-letters idea)

- **DOM**: the R02 split pattern at character level. Each glyph is `<span class="sl"><span class="sl-size">A</span><span class="sl-col"><span>k</span><span>r</span><span>A</span></span></span>`. The box sizes to the real glyph (the hidden sizer) and clips on both axes. The column holds two filler glyphs, picked from the string's own letters with the R09 integer hash (never `Math.random`), then the real glyph last.
- **Mechanism**: WAAPI moves each column from `translateY(0)` to `translateY(-66.667%)`, so two fillers roll past and the real glyph lands, with opacity 0 to 1 over the same span. The delay is `i x --stagger-char`. It lands exactly on the real glyph, with no overshoot and no settle bounce.
- **Timing**: `--dur-600` per glyph; titles under 24 characters keep the total under 1200ms (23 x 20 + 600 = 1060ms); exit is an opacity fade at `--dur-600-exit`.
- **Reduced motion**: no split; the whole string crossfades at `--dur-reduced` (the R02 rule).
- **OriginKit**: Brian approved OriginKit, so the real `rolling-letters` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this preset stays the default and the fallback.

```css
.sl { position: relative; display: inline-grid; block-size: 1lh; overflow: clip; vertical-align: bottom; }
.sl-size { grid-area: 1 / 1; visibility: hidden; white-space: pre; }
.sl-col { position: absolute; inset-inline: 0; inset-block-start: 0; display: flex; flex-direction: column; align-items: center; }
.sl-col > span { block-size: 1lh; white-space: pre; }
```
```ts
export const slotRoll = (cols: HTMLElement[]) => Promise.all(cols.map((c, i) => c.animate(
  [{ transform: "translateY(0)", opacity: 0 }, { transform: "translateY(-66.667%)", opacity: 1 }],
  { duration: tok("--dur-600"), delay: i * tok("--stagger-char"), easing: ease(), fill: "both" }).finished));
```
- **Tailwind**: box `relative inline-grid h-[1lh] overflow-clip align-bottom`; sizer `[grid-area:1/1] invisible whitespace-pre`; column `absolute inset-x-0 top-0 flex flex-col items-center *:h-[1lh] *:whitespace-pre`; motion stays in WAAPI.
- **Law**: the fillers are `aria-hidden` (the sr-only string carries the text) and deterministic; the resting glyph is never clipped (it rests at its own cell); showcase titles only, one per page.

#### `ok.char_flip` (R02 preset; OriginKit mechanical-flip idea)

- **DOM**: the R02 split pattern at character level; each word span gets `perspective: 4em` (relative to the type, so it scales with size), and each glyph is `display: inline-block; backface-visibility: hidden; transform-origin: 50% 50%`.
- **Mechanism**: the R02 engine with `from: { rotateX: "90deg", opacity: 0 }` and `exit.to: { rotateX: "-90deg", opacity: 0 }`. Each glyph turns on its horizontal axis into place and rests flat at exactly 0. This is the one `rotateX` the R02 lint admits. There is no shading, no flap shadow, and no bounce (the real mechanical flip overshoots; dropped).
- **Timing**: `--dur-400` per glyph, `--stagger-char`; exit `--dur-400-exit`; titles under 24 characters (under 1000ms total).
- **Reduced motion**: no split; whole-string crossfade at `--dur-reduced`.
- **OriginKit**: Brian approved OriginKit, so the real `mechanical-flip` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this preset stays the default and the fallback. Its overshoot is removed on adoption.

```ts
export const charFlip: Preset = { unit: "char",
  enter: { from: { rotateX: "90deg", opacity: 0 }, dur: "--dur-400", stagger: "--stagger-char" },
  exit: { from: {}, to: { rotateX: "-90deg", opacity: 0 }, dur: "--dur-400", stagger: "--stagger-char" } };
```
```css
.tm-flip .w { perspective: 4em; } .tm-flip .c { display: inline-block; backface-visibility: hidden; transform-origin: 50% 50%; }
```
- **Tailwind**: word `[perspective:4em]`; glyph `inline-block backface-hidden origin-center`; motion stays in WAAPI.
- **Law**: the glyph always rests flat at 0 and fully legible; no 3D at rest; showcase titles only, never product UI; it never runs beside another 3D recipe (R33, R44) in one section.

#### `ok.skew_rise` (R02 preset; OriginKit skew-in-text-effect idea)

- **DOM**: the R02 split pattern at word level; each word is `transform-origin: 0 100%` (it leans from its baseline start).
- **Mechanism**: the R02 engine with `from: { y: "8px", skewX: "-8deg", opacity: 0 }` and `exit.to: { y: "-6px", opacity: 0 }` (no skew on exit). Each word rises and straightens to 0 on the one curve.
- **Timing**: `--dur-400`, `--stagger-word`; exit `--dur-400-exit`; hero budget 1200ms.
- **Reduced motion**: no split; whole-string crossfade at `--dur-reduced`.
- **OriginKit**: Brian approved OriginKit, so the real `skew-in-text-effect` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this preset stays the default and the fallback.

```ts
export const skewRise: Preset = { unit: "word",
  enter: { from: { y: "8px", skewX: "-8deg", opacity: 0 }, dur: "--dur-400", stagger: "--stagger-word" },
  exit: { from: {}, to: { y: "-6px", opacity: 0 }, dur: "--dur-400", stagger: "--stagger-word" } };
```
- **Tailwind**: words `inline-block whitespace-pre origin-bottom-left`; motion stays in WAAPI.
- **Law**: skew at most 8 degrees, settling to 0; no blur; one per page hero; never product UI.

#### `ok.edge_roll` (R06 variant; OriginKit random-letter-swap and directionhover ideas)

- **DOM**: the R06 structure, with the stack holding three identical copies (above, label, below) and resting at `translateY(-33.333%)` on the middle copy. The sizer keeps the box at one line.
- **Mechanism**: on `pointerenter`, compare `clientY` with the box's vertical midpoint. Entering from the top rolls the stack to `translateY(0)` (the copy above slides in); entering from the bottom rolls it to `translateY(-66.667%)`. When the roll finishes, the stack snaps back to the middle with no transition; since the copies are identical, the snap is invisible. On `pointerleave` it rolls toward the exit edge the same way and snaps back again. Side entries use the nearer vertical edge. `focus-visible` rolls from the bottom (as R06). Per-character stagger from R06 applies when the label is split.
- **Timing**: enter `--dur-200`, leave `--dur-200-exit`; showcase nav words `--dur-400` / `--dur-400-exit`.
- **Reduced motion**: no roll; the state layer alone signals hover.
- **OriginKit**: Brian approved OriginKit, so the real `random-letter-swap` or `directionhover` can also be fetched on demand through the OriginKit MCP into a client project when JEV picks it (section 1 rules); this variant stays the default and the fallback.

```ts
export function bindEdgeRoll(host: HTMLElement, stack: HTMLElement) {
  if (prefersReduced()) return;
  const REST = "translateY(-33.333%)"; stack.style.transform = REST;
  const roll = (e: PointerEvent, dur: string) => {
    const r = host.getBoundingClientRect(), fromTop = e.clientY < r.top + r.height / 2;
    stack.animate([{ transform: REST }, { transform: fromTop ? "translateY(0)" : "translateY(-66.667%)" }],
      { duration: tok(dur), easing: ease() }).finished.then(() => (stack.style.transform = REST));
  };
  host.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") roll(e, "--dur-200"); });
  host.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") roll(e, "--dur-200-exit"); });
}
```
- **Tailwind**: the R06 unit, sizer, and stack classes, with the stack at `-translate-y-1/3` at rest and no hover utilities (motion stays in WAAPI).
- **Law**: identical copies, all `aria-hidden` behind the sr-only label; transform only; one hover signal; the focus ring still appears instantly on the parent.

## 5. Top 20, prioritized

Ranked by value for a high-taste product or an immersive marketing page: reuse frequency x craft x margin inside the law. "Surface" says where it earns its place first.

| Rank | Recipe | Component (source) | Surface | Why it ranks |
|---|---|---|---|---|
| 1 | R02 | Text motion engine (Animata text-animator, Magic text-animate) | both | One engine drives every headline, label swap, and content change; the preset table is the asset. |
| 2 | R01 | Reveal on view (Magic blur-fade, blur removed) | both | The default entrance for every section; cheap, lawful, no-JS safe. |
| 3 | R13 | Sliding tonal indicator (Animata fluid-tabs, nav-tabs) | product | Tabs, segmented controls, billing toggles at product grade. |
| 4 | R14 | Async state button (Animata status-button, Magic animated-subscribe-button) | product | Every submit, save, and follow gets honest pending and success states. |
| 5 | R03 | Line mask reveal (Animata mask-reveal-up) | immersive | The signature editorial hero headline, a true clip. |
| 6 | R21 | FLIP lists and list-to-detail (Animata transaction-list, transition-list; Magic animated-list) | product | Add, remove, reorder, drill-in without layout thrash. |
| 7 | R04 | Scroll-linked word reveal (Magic text-reveal, Animata scroll-reveal) | immersive | The manifesto section, CSS scroll timeline first. |
| 8 | R23 | Pinned crossfade stage (Animata stacked-sections rewrite) | immersive | The scroll-story backbone without resting overlap. |
| 9 | R06 | Hover roll (Animata roll-text, swipe-button) | both | Nav and CTA craft, transform only, clip-safe. |
| 10 | R08 | Odometer digits (Animata ticker) | both | Live numbers with zero layout shift. |
| 11 | R20 | Dialog (Magic hero-video-dialog, Animata modal) | product | Native `dialog`, CSS-only open and close, every modal. |
| 12 | R07 | Number count-up (Magic number-ticker, Animata counter) | immersive | Stat rows seen once. |
| 13 | R05 | Rotating word (Magic word-rotate, Animata cycle-text) | immersive | Hero value-prop rotation with reserved width. |
| 14 | R18 | Marquee (both libraries) | immersive | Logo and quote walls, with pause. |
| 15 | R44 | Dotted globe, R3F (Magic globe, re-admitted) | immersive | Global presence where rotation carries meaning; poster first, flat and unlit. |
| 16 | R40 | Skeleton loaders (Animata skeleton set) | product | Loading states that match the final layout. |
| 17 | R10 | Typing sequence (Magic terminal, typing-animation) | immersive | Devtool and API demos without fake chrome. |
| 18 | R24 | Shutter preloader (Animata split-reveal) | immersive | First impression on image-heavy pages, hard-capped. |
| 19 | R22 | Disclosure (Animata faq, notification-card; Magic file-tree) | product | FAQ, expandable rows, file trees on the one permitted layout exception. |
| 20 | R32 | Deck carousel and deal-in (Animata card-stack, card-spread) | immersive | Card storytelling without a peeking stack at rest. |

Runners-up: R30 sibling dim, R31 speed dial, R36 meter entrances, R26 panel slide-off, R29 dock, R19 velocity band, R38 dotted map, R09 scramble, R25 tile transition, R45 compare slider (product before and after), R49 tab preview (feature walkthrough), R52 floating nav morph (marketing nav).

## 6. DROP list (never build these)

The effect's essence is unlawful, so no rewrite keeps what makes it that component. Agents never reach for these, and a request for one gets the lawful stand-in named in the reason, or an escalation to Brian.

### Magic UI

- `android`: Re-drawn fake phone chrome is on the banned slop list. Show the real screenshot in a hairline frame instead.
- `animated-beam`: Connector line between elements plus gradient plus glow.
- `animated-gradient-text`: Gradient is the whole effect.
- `animated-grid-pattern`: Decorative lines, ambient loop, random.
- `aurora-text`: Gradient plus blur blob.
- `backlight`: Glow.
- `border-beam`: Ornament riding on motion, gradient.
- `comic-text`: Gradient, shadow, overshoot.
- `confetti`: Unapproved dep, random multicolor decoration. Success is an R14 state change.
- `cool-mode`: Decorative particles, random.
- `dia-text-reveal`: Gradient band is the effect. Use R03 or R02 for a lawful headline reveal.
- `dot-pattern`: Decorative texture with gradient mask and glow; "if it does not communicate, cut it".
- `flickering-grid`: Ambient random background motion.
- `floating-3d-particles`: Ambient decorative particles, purple. Real particle work lives in jal-immersive (GPU instanced).
- `glare-hover`: Gradient sweep.
- `glyph-matrix`: Ambient, random.
- `grid-pattern`: Decorative lines.
- `hexagon-pattern`: Decorative lines.
- `highlighter`: Marker/underline draw-on ornament.
- `icon-cloud`: Pointer-rotated logo soup; 3D decoration with no information. Not re-admitted with WebGL.
- `interactive-grid-pattern`: Decorative lines.
- `iphone`: Fake phone chrome.
- `light-rays`: Gradient, blur, ambient.
- `line-shadow-text`: Gradient plus shadow.
- `magic-card`: Gradient spotlight, purple default.
- `meteors`: Glow, ambient, dark-first.
- `morphing-text`: Blur/filter is the effect; plain rotation is R05.
- `neon-gradient-card`: Neon, gradient, glow.
- `noise-texture`: Fake grain overlay (banned).
- `orbiting-circles`: Infinite ambient decoration plus orbit line.
- `particles`: Ambient random drift. Real particle work lives in jal-immersive (GPU instanced).
- `pointer`: Replaces the native cursor for decoration; accessibility loss.
- `progressive-blur`: Blur plus gradient masks.
- `pulsating-button`: Shadow glow, attention loop.
- `rainbow-button`: Gradient, multicolor.
- `retro-grid`: Dark synthwave, gradient, ambient; WebGL is no longer the blocker, the look is.
- `ripple`: Ambient decoration with gradient mask and shadow.
- `safari`: Fake browser chrome.
- `shimmer-button`: Gradient, glow.
- `shine-border`: Gradient.
- `shiny-button`: Gradient sweep is the effect (press scale lives in R15).
- `smooth-cursor`: Custom cursor decoration.
- `sparkles-text`: Sparkle ornament, purple, random.
- `spinning-text`: Infinite ambient decoration.
- `striped-pattern`: Decorative lines.
- `video-text`: Legibility loss, decorative, autoplaying video.
- `warp-background`: Gradient beams, ambient.

### Animata

- `background/animated-beam`: Dark default, glow, gradient.
- `background/blurry-blob`: Blur blob (banned), purple.
- `background/boids-ecosystem`: Ambient, random, decorative.
- `background/diagonal-lines`: Decorative lines via gradient.
- `background/dot`: Gradient texture.
- `background/grid`: Gradient, decorative lines.
- `background/interactive-grid`: Decorative lines, layout transition.
- `background/moving-gradient`: Gradient.
- `background/shooting-stars`: Dark, glow, random, ambient.
- `background/zigzag`: Gradient, decorative.
- `bento-grid/gradient`: Gradient is the point.
- `button/ai-button`: Sparkle, purple, shimmer, unapproved dep.
- `button/duolingo`: The ledge is a shadow/bottom bar; JAL press is scale 0.98.
- `button/shining-button`: Shine sweep, violet.
- `card/blur-stack-card`: Overlap at rest plus blur.
- `card/card-stack-profile`: Overlap at rest, layout animation.
- `card/case-study-card`: 3D rotate gimmick, eyebrow-like label.
- `card/github-card-shiny`: Gradient spotlight.
- `card/github-card-skew`: 3D tilt gimmick, shadow.
- `card/glowing-card`: Glow, gradient.
- `card/led-board`: Decorative ambient loop, brand homage, purple.
- `card/score-card`: Dark default, layout animation, novelty.
- `card/swap-card`: A flip card nested inside a slide swap (two gimmicks stacked, the flip duplicating R33), text laid over a photo, a heavy shadow, and 700ms of travel. Only one pane shows at a time, so overlap is not the issue. To swap two content panes, use R02 fade-through.
- `card/tilted-card`: Tilt gimmick, shadow.
- `container/animated-border-trail`: Gradient, ornament.
- `container/cursor-tracker`: Decorative cursor follower.
- `container/fibonacci-lines`: Decorative lines.
- `hero/hero-section-text-hover`: Floating images overlap text, emoji.
- `hero/hero-section`: Emoji, shadow, decoration.
- `hero/product-features`: Gradient, blur, shadow.
- `hero/shape-shifter`: Decorative morph.
- `hero/slack-intro`: Glow, purple, brand mimic.
- `icon/hover-interaction`: Decorative spring gimmick.
- `image/image-box-shadow`: Shadow.
- `image/images-reveal`: Overlap at rest, overshoot.
- `image/skew-image`: Distortion gimmick.
- `image/tilted-cover`: 3D tilt.
- `image/trailing-image`: Overlap, decorative cursor trail.
- `list/flipping-cards`: Duplicate of flip-card, hover-hidden content.
- `list/orbiting-items-3-d`: Ambient 3D orbit.
- `list/orbiting-items`: Ambient orbit.
- `list/reveal-image`: Floating image overlaps rows.
- `tabs/gooey-tabs`: Filter effect plus layout animation.
- `tabs/shift-tabs`: Tilt gimmick, accent border.
- `text/animated-gradient-text`: Gradient.
- `text/bold-copy`: Decorative overlap.
- `text/circular-text`: Ambient spin.
- `text/double-underline`: Underline draw-on, layout properties.
- `text/focus-blur-resolve`: Blur is the whole effect.
- `text/glitch-text`: Multicolor ghosts overlapping, flash risk, ambient.
- `text/jitter-text`: Ambient random.
- `text/jumping-text-instagram`: Bounce/overshoot.
- `text/mask-text`: Cursor gimmick, dark.
- `text/metis-text`: Underline draw-on on hover (banned ornament).
- `text/mirror-text`: Overlapping duplicate.
- `text/split-text`: Legibility gimmick.
- `text/text-border-animation`: Underline draw-on.
- `text/text-explode-imessage`: Random, overshoot, decorative.
- `text/underline-hover-text`: Underline draw-on, width animation.
- `widget/clock-with-photo`: Text over photo with blur, `transition-all`.
- `widget/cycling`: Dark default, multicolor.
- `widget/direction-card`: Glow, dark.
- `widget/fund-widget`: Dark default, blur.
- `widget/live-score`: Hover-only content (the score panel slides away to reveal a hidden status strip, lost on touch), dark default. Use an R41 static tile with the status as visible text; the slide mechanism itself is R06.
- `widget/mobile-detail`: Dark, faux device.
- `widget/music-stack-interaction`: Overlap at rest, dark.
- `widget/video-chat`: Overlapping picture-in-picture at rest.

### OriginKit (technique names only; nothing was fetched)

These families also stay dropped when Brian's OriginKit approval would let a real component be fetched: the effect itself is unlawful.

- `gradient-text`: Gradient is the whole effect. Use R02 or R03.
- `glitch-text`, `spring-text`: Chromatic slices, spring physics, overlapping trails. Use R09 for a devtool word.
- `electricborder`, `glow-border`, `neon-border`, `pulsating-border`, `moving-gradient-button`: Glow, neon, gradient, marker motion.
- `light-glass-button`, `frost-glass-card`, `scan-grid-button`: Glass, blur, HUD glitch.
- `dotted-offset-button`: Hard offset block shadow. Use R15 or R50.
- `keycap-button`: Floats on its own colored glow. Use R50.
- `cube-flip-button`: The hidden label face hurts accessibility. Use R06.
- `interactive-grid`: 3D hover logo wall with a glow pulse. Use a static R41 logo wall.
- `repetition-hover`, `image-spotlight`: Image hover motion and a dark veil on product and marketing. `zoom-grid` and `pixelate-image` go to the `jal-immersive` pool (canvas only).
- `gyro-loader`, `pulse-roll`, `coin-loader`, and the other WebGL loaders: Heavy WebGL for a wait state. Use R39 and R40.
- `dot-cursor`, `text-button-cursor`, and every cursor outside an immersive section: Decorative cursors. Immersive only, under the `jal-immersive` custom-cursor rules, with no spring.
- `wire-terrain`, `accretion-disc`, `blackhole`, `nebula-drift`, `cosmic-bg`, `hyperspace`, aurora ribbons, `snowfall`, `money-rain`, `fireworks`, `emoji-particle`, `emojiburst`: Dark default, neon, glow, cosmic void, emoji.
- games (`pixel-run-game`, `deparkanoid`, `pixel-tetris`, and the rest): Outside scope.
- `hero-01` to `hero-47`, `features-02` to `features-04`, `pricing-01`, `pricing-02`, footers, CTAs: Next.js-coupled bands with fake device frames, big-number panels, and dark stat panels. Structure vocabulary only (`hm.structure_vocab`); `features-01` survives as R49 and `pricing-03` as R13.
- the 23 site templates: Static Framer exports, not React, and the license forbids them in starter kits.

Legacy Magic UI registry names absent from the live catalog (`script-copy-btn`, `flip-text`, `scratch-to-reveal`, `box-reveal`, `arc-timeline`, `grid-beams`, `iphone-15-pro`) are not components; only the `box-reveal` idea survives, as R03 and R26.

## 7. How JEV chooses among these recipes

The agent never picks a component recipe by taste alone. Law decides first (section 6 and every precheck below is never asked); JEV answers only what law leaves open.

### 7.1 Recipe classes

| Class | Recipes | Runs at |
|---|---|---|
| State (S): carries a state change | R13, R14, R15, R16, R17, R20, R21, R22, R30, R31, R34, R36 value updates, R39, R40, R42, R43, R45, R50, R51, R52 | product tokens, every intensity level |
| Entrance (E): arrival of content | R01, R02 product presets, R07 (showcase only), R08, R36 entrance, R35 and R37 and R38 and R41 with R01, R49 panel crossfade | product tokens at level 1, showcase tokens at 2 and up |
| Signature (G): a move a section is remembered by | R02 showcase presets (including `ok.slot_roll`, `ok.char_flip`, `ok.skew_rise`), R03, R05, R06 showcase and `ok.edge_roll`, R09, R10, R11, R12, R26, R27, R28, R29, R32, R33, R44, R46, R47, R48 | showcase tokens |
| Sequence (Q): scroll or page-level choreography | R04, R18, R19, R23, R24, R25 | showcase tokens, scroll-driven or page-level |

### 7.2 `motion.intensity` (score, one key per region) selects the allowed classes

| Level | Allowed | Caps |
|---|---|---|
| 0 still | S only | no entrances; state feedback at product tokens |
| 1 product-restrained | S + E at product tokens (R01 at `--dur-200`, 4px; R02 micro-scale-fade and fade-through) | nothing showcase |
| 2 signature | S + E + G, showcase tokens | how many G layers stack is JEV's call per layer (7.3); hero budget 1200ms |
| 3 choreographed | S + E + G + Q, staged (G first, then Q, never simultaneous) | never two Q on one scroll range; per page at most: one R04, one R19, one R23 per story, one R24, one R25, one R44, one R33, one R52 |

The level sets which classes may appear; it never sets a count of layers (Brian's no-limit ruling, 7.3). Prechecks (never asked): forms, pricing tables, legal, and docs are tier 0, and tables, settings, and dashboards are capped at 1 (JC `motion.intensity`); any region in a regulated or trust-sensitive product rounds the score down; a region below 640px drops R12, R28, R29, the R46 stage, R47 proximity mode, and R52 (pointer-fine or 640-and-up only); low `imm.tier` removes R44 (poster only) and R19. Rounding: nearest level elsewhere.

### 7.3 `imm.recipe` (choice per section kind for the base recipe, then JEV-judged layers with no fixed limit)

The candidate set for each section kind, filtered by the region's `motion.intensity` (a candidate above the allowed class is removed before the call). The lead's catalog renders the criteria from the index "When to use" column; candidates from other pools (noyzzi, Three.js scenes, clean-room effects, GSAP choreography) join the same choice.

| Section kind | Component candidates |
|---|---|
| hero headline | R03, R02 per-word-crossfade, R02 per-character-rise, `ok.slot_roll`, `ok.char_flip`, `ok.skew_rise`, R47, R05, R09 (devtool or security brand only), R11 |
| hero media | R26, R44, R24 (first load only), R33 |
| manifesto or story | R04, R23, R02 line-by-line-slide |
| stats | R07, R08, R36 entrance |
| logos and social proof | R18, R35, R41 static wall |
| feature walkthrough | R49, R23, R13 with R02 fade-through, R32, R21, R45 (before and after) |
| product demo | R10, R21 feed demo, R14, R45 |
| global presence | R44, R38, R41 static location list |
| section handoff | R25, R01 |
| kinetic type band | R19, R18 |
| navigation | R52 (640 and up), R06, `ok.edge_roll`, R47 (hover mode), R30, R29, R42 |
| gallery | R43, R48, R46, R27, R28, R32 |
| work or case list | R46, R06, R01 |
| CTA or close | R15, R51, R50, R06, R14 |

OriginKit immersive pointers: the canvas-only ideas from OriginKit's public catalog (topo contour field, halftone ripple, dot field, cell magnify, image tear, image fold, ring and corridor galleries, WebGL type, ascii for devtool brands, cursors) are routed to the `jal-immersive` pool under its canvas rules, not to this file.

Layering rule: there is no fixed limit on how many layers a section stacks (Brian's ruling). JEV judges each added layer, one at a time, with the protocol in `jal-design-system` `references/recipe-index.md` section 4, and the stack stops at the first no. The mechanical constraints on any stack: each layer fills a different role; never two scroll owners (two Q) on one scroll range; never two pinned stages overlapping in scroll distance; one pointer effect per element; the summed cost stays within the section's tier. Any number of G, E, and S recipes may stack when they take different roles and JEV judges each one aligned; Q layers stack too, as long as no two share a scroll range.

## 8. Component-specific JEV decisions

`ui.text_reveal_granularity`, `ui.number_motion`, and `ui.geo_visual` live in `jal-jev` `references/catalog.md` (section UI/UX). The catalog is the single source.

No new decision type is needed for the OriginKit recipes. `ui.component_recipe` and `imm.recipe` candidate lines accept `ok.*` IDs (R45 to R51 and the four presets) and `hm.floating_nav_morph` (R52) beside `mu.`, `an.`, `nz.`, `bang.`, and `md.` IDs, and they layer with any other source when JEV judges each layer aligned. When JEV picks a real OriginKit component instead of its `ok.` recipe, the fetch follows the section 1 rules and the build report logs the slug next to the section.
