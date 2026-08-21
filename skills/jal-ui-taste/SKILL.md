---
name: jal-ui-taste
description: The JAL high-taste frontend design system, Apple/Google-grade UX-first taste, a modular type scale, a 4/8pt spacing rhythm, radius and elevation tokens, mobile/tablet/desktop breakpoints with the mobile app-shell, visual-consistency rules, a white-first palette law, a hard no-gradient/no-emoji/no-decorative-line rule, UX heuristics, and an audit checklist for tuning or refactoring an existing frontend. Use when building any new JAL UI, redesigning a screen, reviewing a frontend PR for taste, or auditing an existing product for visual and UX debt.
---

# JAL UI Taste

The taste layer on top of `jal-frontend-rules`. That skill gives the recipes (Bento grid CSS, banned looks, icon sourcing, the spacing checklist). This skill gives the underlying system those recipes are built from, and the judgment to apply it well. Both defer to `jal-standards`. Read all three before touching frontend code, in that order: `jal-standards` for the law, `jal-ui-taste` for the system, `jal-frontend-rules` for the recipe.

The bar is Apple- or Google-grade taste: quiet confidence, obvious hierarchy, zero decoration without purpose. Every JAL surface should look like one product designed by one careful team, never a stitched-together set of screens each improvised on the spot.

## Palette law and anti-slop (mandatory, read this first)

Every LLM defaults to the same look when nobody stops it: a dominant black or near-black background, a saturated purple or violet accent, glowing cards, oversized colored numbers, and a gradient smeared across whatever is left. That look is the AI-slop signature. It is not a style choice, it is a tell, and it is forbidden on every JAL surface, no exception without Brian's sign-off.

**Reference bar.** The output should feel like it belongs next to Apple, Linear, Stripe, or Vercel documentation: quiet, confident, mostly neutral, one considered accent. If a screen looks like a generic dark AI-tool landing page, it is wrong, full stop, rebuild it.

**Neutral-first.** The dominant surface of every screen is neutral, not colored.

- Light mode (default posture unless the product is explicitly dark-only): the base surface is a near-white *warm* neutral, never a flat `#ffffff`. Tint it toward whatever hue anchors the palette, e.g. `oklch(97% 0.006 60)` (roughly `#f7f5f1`), not pure white.
- Dark mode, if the surface ships one: a sophisticated warm near-black, e.g. `oklch(16% 0.006 60)` (roughly `#171412`), never `#000000` and never a cold blue-black.
- Body text is ink, near-black on light surfaces (`oklch(18–22% 0.01 <hue>)`), near-white on dark surfaces (`oklch(92–96% 0.006 <hue>)`). Never pure `#000` or pure `#fff` for either surface or ink.
- Most of any given view is neutral. Color is rare, deliberate, and small in area.

**Exactly one accent hue.** Pick one. A second, desaturated semantic color (a success green, a danger red) is permitted only for real state, never for decoration. The accent is used on at most a handful of elements per screen: a primary CTA, links, an active nav indicator, a focus ring. It is a highlighter, not a fill. It is never a marker square, dot, or hairline placed beside a heading or label (see the decorative-line ban below).

- **The accent is never purple, violet, or indigo.** That hue family is the single most recognizable AI-slop tell (it is the default nearly every model reaches for). Pick something else: a warm terracotta or signal orange, a considered blue that is clearly blue and not violet, a forest green, an ochre. Anything except the purple/violet/indigo family as the *default* choice.
- The accent never fills a large area. Cap it at roughly 3% of any viewport's pixels. A giant accent-filled hero band, an accent-filled card grid, or an accent-colored stat number is the fill violation, not the highlight use.
- Giant colored stat numbers are banned outright. A metric on screen is ink-colored at a normal-to-large size with a small muted label underneath, never a huge saturated-color numeral competing with the page's one accent for attention.
- No gradient text fill on headings or body copy, ever. That is decoration standing in for a design decision.

**Banned outright, no exceptions:**

- Glow effects of any kind: radial glow blobs behind text or cards, neon edge lighting, blurred colored drop-shadows standing in for elevation.
- Purple-on-black as a page's dominant identity, in any variation (violet-on-near-black, indigo-on-charcoal, etc.).
- Gradients of any kind, anywhere: no gradient background, no gradient fill, no gradient text, no gradient border, on any surface. A flat neutral is always the answer. This is absolute and overrides any earlier feralui.dev allowance in older docs.
- Saturated accent fill covering a large surface area: full-bleed accent-colored hero sections, accent-filled card backgrounds used as the default card treatment, accent-colored borders around every card on a grid.
- Any shadow that is not neutral. If a shadow exists at all, it uses the elevation tokens below (neutral, low-opacity black or ink), reserved for genuine stacking (a menu over content, a modal over a scrim), never as ambient decoration or a stand-in for a glow.

**Type: editorial, not decorative.**

- A real modular type scale (the table below), a confident, restrained set of large headings, and generous line-height on body copy. Headings tighten as they grow; body stays loose and readable.
- A clean interface font stack: system-ui/-apple-system/Segoe UI/Roboto or an Inter-like sans by default. A tasteful display or serif face is allowed only when it earns its place (an editorial or manifesto-toned product), never added reflexively "to look designed."
- Two weights per screen, three as a hard ceiling. Hierarchy comes from size, weight, and position, not from color.

**Space and layout: generous, gridded, no dead air.**

- Whitespace is generous and rhythmic: the same spacing scale repeated consistently down a page, not hand-tuned per section.
- Dividers and borders are hairline: 1px, low-contrast against the surface (a neutral a few steps off the background, never full-contrast black or the accent color).
- Everything aligns to the grid, no element sits off the nearest spacing line.
- A Bento layout fills completely at every breakpoint: no oversized empty bands, no dead gaps patched with a stray margin. If content does not tile cleanly, resize the spans, do not leave a hole.

This section is strict on purpose: it exists because a prior JAL surface shipped the exact forbidden look (black background, saturated purple accent, glowing cards, oversized colored stat numbers, weak layout) and it read as AI-slop, not as a JAL product. Every subsequent build and every audit checks against this section first.

### Absolute bans (Brian, non-negotiable)

These override every other guideline and every older doc. No exceptions without Brian's explicit sign-off.

- **White-first background.** The default background of any screen is white, off-white, broken white, or a light beige, one of the whites, always. Never a dark or a colored default background. Black is used for ink (text) only. A black or near-black background is allowed only inside a dedicated dark mode that the user explicitly asked for, never as the light default and never auto-triggered from the OS `prefers-color-scheme` unless the product explicitly ships a dark theme. If in doubt, the background is white.
- **No gradients at all.** Anywhere. See the banned list above. There is no feralui exception anymore.
- **No emoji or emoticons.** Never in UI copy, headings, labels, buttons, empty states, or anywhere on any JAL surface. Use a real icon from koboyo or reicon.dev when a glyph is needed.
- **No decorative lines or marks.** Forbidden: a vertical or horizontal connector line drawn between cards, tiers, or sections; a colored accent stripe on the side, top, or bottom of a panel or card (border-left/right/top accent bars); a marker dot, square, or bullet-glyph placed beside a heading, label, or tier name as decoration. Hierarchy and grouping are communicated by spacing, order, and typography, not by drawn lines or marks. The only lines allowed are functional hairline (1px, low-contrast neutral) dividers that genuinely separate structural regions (for example a header underline or a footer top border), never an accent-colored or decorative one.

A screen that violates any of these four is rebuilt, not patched over.

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

### Card and grid consistency (this is fatal to get wrong)

Repeated cards or items in a grid MUST share one consistent shape. Uneven card shapes in a grid are the single most damaging tidiness failure and are forbidden.

- **Equal card heights per row.** Cards in the same row are the same height (CSS grid stretch, or `grid-auto-rows: 1fr`). Never let one card in a row be taller than its neighbors.
- **Align repeated internal elements to the same baseline.** When every card in a grid contains the same kind of element (a code block, a primary CTA, a price, a meta row, a thumbnail), that element sits at the SAME position in every card. Pin it: make the card a flex column and give the shared bottom element `margin-top: auto` so it rests on one baseline across the whole row, no matter how long the text above it runs. A CTA or code block that floats at a different height in each card is the classic ragged-grid tell.
- **Constrain variable-length content so it does not reshape the card.** A one-line command or code snippet is `white-space: nowrap` with its own `overflow-x: auto`, so a long value scrolls inside a fixed-height block instead of wrapping to three lines and making that one card taller. Long descriptions are either clamped to a fixed line count or absorbed by a bottom-pinned action row. Content length must never change a card's shape.
- **No empty void inside a card, and never fake-fill with stretched gaps (both are fatal).** A card must never be taller than its content fills. But the fix is NOT to spread the content out: `justify-content: space-between`, `flex-grow` on list rows, or any trick that distributes items to fill vertical space produces huge uneven gaps between rows, which is chaotic spacing and is just as forbidden as an empty void. The real rule:
  - **Rows and list items use exactly one fixed gap token** (the spacing scale), always the same gap, top-aligned. Never stretch, never space-between to fill height. A list of 4 items looks the same whether its card is short or tall.
  - **Only a genuinely stretchable visual may flex to fill height** (a bar/line chart body, a map, an image, a canvas): `flex: 1` on that visual is correct because it scales. A list, a stat, or a text block never flex-fills.
  - **Therefore a card's height follows its content.** Do NOT give a text or list card a big row span it cannot naturally fill. Match spans to content.
  - **When a layout mixes a tall visual with short lists, do not force the lists into the visual's height.** Put the tall visual in its own full-width band (or its own column), and lay the short cards in an even row where they share a similar natural height. That is how you get no void and no stretched gaps at the same time.
  - Before shipping, look at every card: any visible empty band (void) OR any oversized gap between rows (fake-fill) is a bug. Fix the layout, do not paper over it by stretching.
- **A grid reads as one system, not a pile of different cards.** Before shipping any card grid, scan across a row: do the borders, heights, internal element positions, and code-block sizes line up, and does every card's content fill its box with no empty band? If any card is a different shape or has a dead region, it is a bug, fix it before shipping.

## Gradients: banned

- No gradients, of any kind, anywhere: no gradient background, fill, text, or border, static or animated. Not from feralui.dev, not hand-rolled, not anywhere. This is absolute.
- The answer to "this surface feels flat" is better spacing, hierarchy, and one considered accent, never a gradient.
- Depth, when a surface genuinely needs it, comes from a hairline neutral border or a single subtle neutral elevation token reserved for real stacking, never from a gradient or a glow.

## UX heuristics

- **Clear hierarchy**: one primary action per screen, obvious at a glance. Size, weight, and position communicate importance before color does. If a user has to read copy to find the primary action, the hierarchy failed.
- **Affordance**: every interactive element looks interactive, buttons look pressable, links are visually distinct from static text, disabled states are visibly disabled (reduced opacity or muted tone), not just inert.
- **Immediate feedback**: every action gets a visible response within roughly 100ms, a pressed state, a spinner past 300 to 400ms, a toast or inline confirmation on completion. Silence after a tap reads as broken, even when the request is still in flight.
- **Restrained motion**: animate only to clarify a state change (an item entering, a panel expanding, a page transitioning), never as ambient decoration. Per `jal-standards`, reach for Lenis, GSAP, or Framer Motion only when the interaction genuinely needs it, and honor `prefers-reduced-motion` on every animation added.
- **Accessibility and contrast AA+**: text and meaningful icons meet WCAG AA contrast at minimum (4.5:1 for normal text, 3:1 for large text) against their background. Never rely on color alone to convey state, pair it with an icon, label, or shape change.
- **Touch targets 44px+**: every tappable element on mobile is at least 44x44px including padding, not just the visible glyph. Two targets never sit closer than 8px apart, per the `space-2` token, to avoid mis-taps.
- **Empty, loading, and error states**: every view that can be empty, loading, or errored ships a deliberate design for all three, never a blank screen, a bare spinner with no context, or a raw error string. Empty states explain what belongs there and how to fill it; error states explain what happened and offer a next action, not just "something went wrong."

## Design principles (JAL-native, self-contained)

JAL-AIDEV does not depend on any external design skill. Do NOT load `hallmark`, `design-taste-frontend`, `ui-ux-pro-max`, `high-end-visual-design`, or any other outside skill to build a JAL frontend. The anti-slop principles below are copied into this skill so the plugin is self-contained and every teammate gets the same bar with nothing extra installed. These principles sit alongside the Palette law and the Absolute bans above; all of it is JAL law.

- **Structural variety.** Two different JAL screens must not share the same shape. Do not fall back to the same hero, then three feature cards, then a CTA band, then a footer on every page. Vary the macrostructure so each surface reads as its own product, not a color-swap of one template.
- **Pre-emit self-critique.** Before you show any screen, score it 1 to 5 on six axes: hierarchy (is the most important thing obviously first), restraint (could anything be removed), consistency (one type scale, one spacing rhythm, one accent), specificity (does it fit this product or any product), execution (spacing, alignment, states), and taste (does it clear the Apple/Vercel bar). Anything under 3 gets a revision pass before it ships. Never hand over a screen you have not scored.
- **Honest copy.** Never fabricate a metric, testimonial, logo, user count, or review. Use a real number, or a clearly labeled placeholder, or a layout that does not need the number. Invented proof is slop the moment it is written.
- **Locked tokens.** Every color and every font-family references a named token (`var(--color-...)`, `var(--font-...)`). No inline hex, no inline `rgb()`/`oklch()`, no one-off `font-family` mid-file. If a value is missing, add it to the token block first, then reference it.
- **No re-drawn chrome.** Never hand-build a fake browser bar (URL pill plus traffic-light dots), a fake phone frame, a fake code-window title bar, or fake IDE chrome. Use a real screenshot in a bordered figure, or let the content stand alone.
- **Mobile verified at 320, 375, 414, and 768px.** No horizontal scroll at any width. No clickable target that wraps to two lines. Image-bearing grid tracks use `minmax(0, 1fr)`, never bare `1fr`. Headings wrap inside long words. Every layout collapses cleanly to one column on the smallest width. This is a floor, not a wish.
- **Eight states on every interactive element.** default, hover, focus-visible, active, disabled, loading, error, success. A button or input that ships fewer than eight states is unfinished. Focus rings show instantly and never animate.
- **Cut motion before adding it.** Most screens have too much. Motion earns its place only when it carries information (a state change, a spatial relationship). Animate transform and opacity only, with the named easings, and collapse to a short opacity crossfade under `prefers-reduced-motion`. Restraint reads as expensive; decoration reads as slop.

If any outside reference (a library example, a generated mock, a teammate's snippet) disagrees with this file or `jal-frontend-rules`, this file wins, no exception without Brian's sign-off per `jal-standards`.

## Audit checklist: fine-tuning or refactoring an existing frontend

Run this top to bottom on any existing screen or component before or during a redesign pass:

- [ ] The dominant surface is a neutral (warm near-white in light mode, or a warm near-black like `#171412`, never pure `#000`/`#fff`), not a colored or purple/violet/indigo-on-black identity. Fails the Palette law above are the first thing to fix, before any other item on this list.
- [ ] Exactly one accent hue is in use, occupying roughly 3% or less of any viewport, never purple/violet/indigo, never filling a large surface, never a giant colored stat number.
- [ ] Every font size on screen maps to a token in the type scale table above. Flag and fix any inline one-off size.
- [ ] Every spacing value (margin, padding, gap) maps to the 4/8pt scale. Flag and fix any arbitrary value.
- [ ] Every radius maps to the radius token table, matched to the correct component tier.
- [ ] Shadows only appear where real stacking exists, and match an elevation token, none used as ambient decoration.
- [ ] The screen has a working mobile app-shell (sticky header, independent scroll region, bottom tab bar), not a shrunk desktop layout.
- [ ] Bento grid rows are fully occupied at every breakpoint per `jal-frontend-rules`, no dead space patched with a gap.
- [ ] No gradients anywhere (no gradient background, fill, text, or border). No emoji. No decorative lines, connectors, side accent stripes, or marker dots.
- [ ] Default background is white, off-white, broken white, or light beige, never dark or colored (dark only inside an explicitly requested dark mode).
- [ ] No eyebrow labels, no neon accents, no fake grain or blur-blob decoration anywhere on the screen.
- [ ] Icons are sourced from koboyo first, reicon only as fallback, all wrapped in the shared `Icon` component.
- [ ] One primary action is visually obvious on the screen, everything else is clearly secondary or tertiary.
- [ ] Every interactive element has a visible affordance and a feedback state (hover where applicable, pressed, disabled, loading).
- [ ] Contrast passes AA at minimum for every text and icon element against its background.
- [ ] Every touch target on mobile is 44x44px or larger with adequate spacing from its neighbors.
- [ ] Empty, loading, and error states exist and are deliberately designed for every view that can hit them, not left as defaults.
- [ ] No em-dash anywhere in the copy or code comments on the screen.
