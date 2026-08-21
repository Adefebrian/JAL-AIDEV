---
name: jal-ui-taste
description: The JAL high-taste frontend design system, Apple/Google-grade UX-first taste, a modular type scale, a 4/8pt spacing rhythm, radius and elevation tokens, mobile/tablet/desktop breakpoints with the mobile app-shell, visual-consistency rules, gradient discipline (feralui.dev only), UX heuristics, and an audit checklist for tuning or refactoring an existing frontend. Use when building any new JAL UI, redesigning a screen, reviewing a frontend PR for taste, or auditing an existing product for visual and UX debt.
---

# JAL UI Taste

The taste layer on top of `jal-frontend-rules`. That skill gives the recipes (Bento grid CSS, banned looks, icon sourcing, the spacing checklist). This skill gives the underlying system those recipes are built from, and the judgment to apply it well. Both defer to `jal-standards`. Read all three before touching frontend code, in that order: `jal-standards` for the law, `jal-ui-taste` for the system, `jal-frontend-rules` for the recipe.

The bar is Apple- or Google-grade taste: quiet confidence, obvious hierarchy, zero decoration without purpose. Every JAL surface should look like one product designed by one careful team, never a stitched-together set of screens each improvised on the spot.

## Type scale

One modular scale for the whole product, base 16px, ratio 1.25 (major third), rounded to clean pixel values:

| Token | Size | Line-height | Typical use |
|---|---|---|---|
| `text-caption` | 13px | 1.4 | metadata, timestamps, helper text |
| `text-body` | 16px | 1.6 | default body copy, base of the scale |
| `text-subhead` | 20px | 1.5 | card titles, section labels |
| `text-h4` | 25px | 1.3 | minor headings |
| `text-h3` | 31px | 1.25 | section headings |
| `text-h2` | 39px | 1.2 | page-level headings |
| `text-h1` | 49px | 1.15 | hero headline, major page title |
| `text-display` | 61px | 1.1 | landing hero, rare, one per page at most |

- Every size a component uses comes from this table. No inline `font-size: 22px` because it "looked right," pick the nearest scale step and adjust weight or line-height instead.
- Headings tighten line-height as they grow (display and h1 near 1.1, body stays loose at 1.6 for readability). Never apply body line-height to a display headline, it reads as loose and unstructured.
- Two weights maximum per screen: one for headings, one for body. A third weight (usually medium, for emphasis inside body copy) is the ceiling, never four or five weights fighting for attention.

## Spacing scale: 4/8pt rhythm

One spacing scale, everything a multiple of 4, most things a multiple of 8:

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-24` | 96px |

- No arbitrary value like `13px` or `22px` anywhere, ever. If nothing on the scale looks right, the layout is wrong, not the scale.
- Micro-spacing (icon-to-label gap, inline chip padding) uses `space-1` to `space-3`. Component padding uses `space-4` to `space-8`. Section rhythm (space between major page blocks) uses `space-12` to `space-24`, one value repeated consistently down the page, not hand-tuned per section.
- This is the same scale `jal-frontend-rules` assumes in its spacing checklist, do not introduce a second scale for a new surface.

## Radius and elevation tokens

Radius:

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | chips, small buttons, inputs |
| `radius-md` | 12px | cards, standard buttons |
| `radius-lg` | 16px | large cards, modals |
| `radius-xl` | 24px | hero panels, bottom sheets |
| `radius-full` | 9999px | avatars, pills, icon buttons |

Elevation (shadow depth communicates stacking order, nothing else):

| Token | Shadow | Use |
|---|---|---|
| `elevation-0` | none | flat surface, default card on a plain background |
| `elevation-1` | `0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04)` | resting card that needs slight lift |
| `elevation-2` | `0 4px 12px rgba(0,0,0,0.08)` | dropdown, popover, raised nav |
| `elevation-3` | `0 12px 32px rgba(0,0,0,0.14)` | modal, dialog, anything above a scrim |

- Pick radius by component tier, not by feel. Every card of the same tier across the product shares the same radius token, exactly as `jal-frontend-rules` requires for Bento card chrome.
- Elevation only increases with actual stacking (something is literally above something else, a menu over content, a modal over a scrim). Never add elevation as decoration on a flat resting element, that is a glow effect wearing a shadow costume, and it is banned by `jal-frontend-rules`.

## Responsive breakpoints and the mobile app-shell

| Breakpoint | Range | Layout behavior |
|---|---|---|
| Mobile | `< 640px` | single column, app-shell pattern (below), bottom tab bar |
| Tablet | `640px - 1024px` | 2-column Bento, top nav returns, bottom tab bar drops |
| Desktop | `> 1024px` | full 4-column Bento per `jal-frontend-rules` |

- Mobile is not "the desktop site, but narrower." Ship the dedicated app-shell defined in `jal-frontend-rules`: sticky header with safe-area-inset-top, independently scrolling content, fixed bottom tab bar (3 to 5 items) with safe-area-inset-bottom.
- Design mobile-first: build the single-column, app-shell version first, then expand the same components into the tablet and desktop grids. Never design desktop first and squeeze it down, that produces the cramped, proportionally-shrunk mobile screens `jal-frontend-rules` explicitly forbids.
- Breakpoint values, spacing tokens, and type scale steps do not change across breakpoints, only layout (columns, nav pattern) does. A `text-h2` is 39px on mobile and 39px on desktop; what changes is how much horizontal room it has, not its identity in the scale.

## Visual-consistency rules

- One type scale, the table above, used everywhere. No screen introduces its own heading size.
- One spacing rhythm, the table above, used everywhere. No screen introduces its own gap value.
- No ad-hoc px values in any dimension, font-size, margin, padding, gap, border-radius. If it is not on a token table in this skill, it does not go in the codebase.
- Align every element to the grid. A component that is 2px off the nearest 4pt line is a bug, not a rounding error to shrug off.
- Component chrome (padding, radius, border weight) is identical across every instance of the same component tier. Visual weight varies only by size and content, exactly as `jal-frontend-rules` requires for Bento cards, and the same principle applies to buttons, inputs, and list rows.

## Gradient discipline

- Every gradient, static or animated, comes from https://feralui.dev/gradients. No hand-rolled `linear-gradient` stops, no generated-on-the-fly color math, no exceptions.
- A gradient must do real work: a hero background that needs depth, a primary CTA that needs to stand out, a data-viz accent. It is never default card chrome and never default text fill.
- Never ship a gradient that reads as muddy or unclear, colors that fight each other, a transition with no clear direction, contrast so low the gradient disappears on most displays. If a gradient does not read cleanly at a glance, pick a different one from feralui.dev, do not tweak stops by hand to "fix" it.
- No glow, no neon, no AI-slop gradient use: no radial glow blobs behind text, no oversaturated pink-to-cyan halo effects, no gradient text fill applied to body copy for decoration. These are the exact patterns `jal-frontend-rules` bans outright.
- If a screen uses more than one gradient, they come from the same feralui.dev palette family so they read as one system, never two unrelated gradients competing on the same view.

## UX heuristics

- **Clear hierarchy**: one primary action per screen, obvious at a glance. Size, weight, and position communicate importance before color does. If a user has to read copy to find the primary action, the hierarchy failed.
- **Affordance**: every interactive element looks interactive, buttons look pressable, links are visually distinct from static text, disabled states are visibly disabled (reduced opacity or muted tone), not just inert.
- **Immediate feedback**: every action gets a visible response within roughly 100ms, a pressed state, a spinner past 300 to 400ms, a toast or inline confirmation on completion. Silence after a tap reads as broken, even when the request is still in flight.
- **Restrained motion**: animate only to clarify a state change (an item entering, a panel expanding, a page transitioning), never as ambient decoration. Per `jal-standards`, reach for Lenis, GSAP, or Framer Motion only when the interaction genuinely needs it, and honor `prefers-reduced-motion` on every animation added.
- **Accessibility and contrast AA+**: text and meaningful icons meet WCAG AA contrast at minimum (4.5:1 for normal text, 3:1 for large text) against their background, including on top of any feralui.dev gradient. Never rely on color alone to convey state, pair it with an icon, label, or shape change.
- **Touch targets 44px+**: every tappable element on mobile is at least 44x44px including padding, not just the visible glyph. Two targets never sit closer than 8px apart, per the `space-2` token, to avoid mis-taps.
- **Empty, loading, and error states**: every view that can be empty, loading, or errored ships a deliberate design for all three, never a blank screen, a bare spinner with no context, or a raw error string. Empty states explain what belongs there and how to fill it; error states explain what happened and offer a next action, not just "something went wrong."

## Design-taste engines this skill may lean on

For extra ideation, references, or a second pass on a hard layout problem, this skill may draw on the installed design-taste skills:

- `design-taste-frontend` for anti-slop landing pages, portfolios, and redesigns.
- `ui-ux-pro-max` for style libraries, color palettes, font pairings, and stack-specific UI patterns.
- `high-end-visual-design` for the specific fonts, spacing, shadow, and card conventions that make a screen feel expensive.
- `hallmark` for anti-AI-slop audits and redesign extraction from a URL or screenshot.

These are references, not authorities. Every token, breakpoint, gradient source, and banned pattern in this file and in `jal-frontend-rules` is JAL law and overrides anything one of these engines suggests. If an engine's output disagrees with this skill (a different type scale, a hand-rolled gradient, a glow effect), this skill wins, no exception without Brian's sign-off per `jal-standards`.

## Audit checklist: fine-tuning or refactoring an existing frontend

Run this top to bottom on any existing screen or component before or during a redesign pass:

- [ ] Every font size on screen maps to a token in the type scale table above. Flag and fix any inline one-off size.
- [ ] Every spacing value (margin, padding, gap) maps to the 4/8pt scale. Flag and fix any arbitrary value.
- [ ] Every radius maps to the radius token table, matched to the correct component tier.
- [ ] Shadows only appear where real stacking exists, and match an elevation token, none used as ambient decoration.
- [ ] The screen has a working mobile app-shell (sticky header, independent scroll region, bottom tab bar), not a shrunk desktop layout.
- [ ] Bento grid rows are fully occupied at every breakpoint per `jal-frontend-rules`, no dead space patched with a gap.
- [ ] All gradients trace back to https://feralui.dev/gradients, and none read as muddy, low-contrast, or glow-like.
- [ ] No eyebrow labels, no neon accents, no fake grain or blur-blob decoration anywhere on the screen.
- [ ] Icons are sourced from koboyo first, reicon only as fallback, all wrapped in the shared `Icon` component.
- [ ] One primary action is visually obvious on the screen, everything else is clearly secondary or tertiary.
- [ ] Every interactive element has a visible affordance and a feedback state (hover where applicable, pressed, disabled, loading).
- [ ] Contrast passes AA at minimum for every text and icon element, checked specifically over any gradient background.
- [ ] Every touch target on mobile is 44x44px or larger with adequate spacing from its neighbors.
- [ ] Empty, loading, and error states exist and are deliberately designed for every view that can hit them, not left as defaults.
- [ ] No em-dash anywhere in the copy or code comments on the screen.
