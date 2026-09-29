---
name: jal-ui-taste
description: JAL Design Intelligence core. The hard frontend law (no overlap and nothing outside its box, white-first, no gradients, no shadows, no side line on any card or panel, no emoji, no em-dash, no eyebrow, no purple), the section concept law, the Astryx layout doctrine used to pick a container per region, the generated core tokens (type, spacing, radius, controls, color, tonal depth, state layers, motion, breakpoints), form-control and card-grid consistency, UX heuristics, the JEV decision layer (`jev_decide`), and the mechanical proof gate (`ui_audit`), plus the audit checklist. Use when building any new JAL UI from zero, redesigning or fine-tuning a screen, reviewing a frontend PR for taste, or auditing a product for visual and UX debt.
---

# JAL UI Taste: the JAL Design Intelligence core

This is the system every JAL surface is built from. Read order before touching frontend code: `jal-standards` (the law), this skill (the system and the decisions), `jal-frontend-rules` (the recipes). For depth, `jal-design-system` holds JAL Core, the one JAL design system (Astryx foundation, Carbon data and form layer, one spec per component), and `jal-motion` holds product and showcase motion. All of them defer to `jal-standards`; nothing in any of them, in any source design system, in any designmd kit, or in any JEV verdict overrides the hard law below.

The bar is Apple- or Google-grade: quiet confidence, obvious hierarchy, zero decoration without purpose, every section schemed before it is drawn. Every JAL surface reads as one product designed by one careful team, never a stitched-together set of screens each improvised on the spot.

## The build loop (every screen, in order)

1. Read the brief. Call `jev_decide` for the density pick (Decision layer, point 1). Open `jal-design-system` and the component specs you will place.
2. Set the direction (`jal-design-system` `references/directions.md`). If the target repo has `docs/design/direction.md`, inherit it. For a new product, a new surface, or a redesign: write 5 to 7 candidates from the audience's world, screen them with `jev_decide` (point 5, `ui.direction_screen`), then run the seeded draw over the survivors ranked 3 to 7 (seed from the product name plus the screen, so reruns are stable). JEV screens; it never picks the direction.
3. Write the direction contract to `docs/design/direction.md` before any code: audience, job, direction (form plus preset), type personality, accent role, density, motion intensity, first viewport, and the seed key. The contract sets knob values inside JAL Core only; it never changes the law, the components, or the token tables.
4. Set the frame: shell, region list, and each region's width budget (Layout doctrine, step 1).
5. Write the section concept for every section (Section concept law). Call `jev_decide` for the region and component gate (point 2). Delete what JEV drops.
6. Lock tokens from the Core tokens section, plus the contract's knob overrides. No value outside those tables.
7. Build mobile-first: the app-shell below 640px first, then tablet, then desktop. Same tokens at every width, only layout changes.
8. Give every interactive element all eight states. Motion from `jal-motion`, restrained.
9. Self-critique (six axes, 1 to 5) and the Craft floor check, then run `ui_audit` until it reports PASS (Mechanical proof).
10. Call `jev_decide` for the final taste verdict (point 4). Revise if it scores under 2.
11. The critic gate. The lead runs `ui_shots` (every screen at 375 and 1280, through the real scroller) and hands only the brief, the direction, and those images to a fresh critic (jal-reviewer in critic mode, or a fresh jal-ux) that never saw the build. It reads every image, scores `ui.heuristics` (point 6) and the seven-part critic rubric in `jal-design-system` `references/craft.md` section 12, and its scores feed `ui.finish_disposition` (point 7) as `evidence.critic`. A total under 15 of 21, or any 0, is `fix` without asking. The builder never answers the finish. At most three fix rounds; open items after round 3 go to Brian with the scores.
12. Log every JEV decision, the seed key, and the audit result in the build report.

## Hard law (absolute, Brian, non-negotiable)

These override every other guideline, every older doc, every source design system, and every JEV answer. A screen that violates any of them is rebuilt, not patched over. No exception without Brian's explicit sign-off.

0. **No overlap, nothing outside its box. Tidiness is rule number 1.** No element overlaps a sibling, and no child extends past its parent's box. See the dedicated rule below.
1. **White-first background.** The default background of any screen is white, off-white, broken white, or a light beige, one of the whites, always. Never a dark or a colored default background. Black is used for ink (text) only. A black or near-black background is allowed only inside a dedicated dark mode that the user explicitly asked for, never as the light default and never auto-triggered from the OS `prefers-color-scheme` unless the product explicitly ships a dark theme. If in doubt, the background is white.
2. **No gradients at all.** No gradient background, fill, text, border, mask, or overlay, static or animated, anywhere. There is no feralui exception anymore. See Gradients: banned.
3. **No shadows.** Depth comes from tonal layer steps and hairline borders only (see Depth). No `box-shadow` with a blur radius above 0, no `filter: drop-shadow`, no elevated cards, no shadow on hover, no shadow on menus, popovers, toasts, or dialogs. The single exception is a spread-only focus ring (`box-shadow: 0 0 0 Npx`), and `outline` is preferred over it.
4. **No side line on any card or panel, ever.** See the dedicated rule below. This is the ban Brian hates seeing broken most.
5. **No decorative lines or marks.** No vertical or horizontal connector line drawn between cards, tiers, steps, or sections. No marker dot, square, or bullet glyph placed beside a heading, label, or tier name as decoration. Hierarchy and grouping come from spacing, order, and typography. The only lines allowed are functional full hairlines (1px, low-contrast neutral): a complete border around a container, or a neutral divider that genuinely separates structural regions (a header underline, a footer top border, a divider between table rows).
6. **No emoji or emoticons.** Never in UI copy, headings, labels, buttons, empty states, or anywhere on any JAL surface. Use a real icon from koboyo (first) or reicon.dev (fallback).
7. **No em-dash.** Not in copy, not in code comments, not in generated text. Use a comma, colon, or period.
8. **No eyebrow labels, no glow, no neon, no AI-slop signature.** Small uppercase letter-spaced kicker text above a heading is deleted; the heading stands alone.
9. **One restrained accent, never purple, violet, or indigo.** Primary action is ink on white by default.
10. **No big empty gaps, no empty void inside a card, no fake-fill.** Never `justify-content: space-between` or `flex-grow` on list rows to fill height. See Card and grid consistency.
11. **Cards in a grid share one shape. Form controls share one 44px height token**, measured, not eyeballed.
12. **Every section is conceptualized before markup.** See Section concept law.
13. **Mobile-first always.** App-shell with a fixed bottom tab bar below 640px, no horizontal scroll at 320, 375, 414, 768, and 1280, 44px touch targets.

### No overlap, nothing outside its box (tidiness rule number 1)

- **No element overlaps a sibling**: not text, not an icon, not a component, at any width. Only true overlay layers (dialog, menu, tooltip, popover, listbox, bottom sheet) may stack, and only inside their own layer above the page.
- **No child extends outside its parent's box**, unless the parent is an explicit scroll container (`overflow-x: auto` on a code line, a table scroller). The failure Brian caught: a three-field row wider than its container, so the Country select stuck out past the right edge of the info box and past the cards above and below it. That is a rebuild.
- **Right edges of stacked regions line up.** Regions stacked in one column share one left content line and one right edge. A region that pokes out on either side is a bug.
- **No clipped text** without a deliberate `text-overflow: ellipsis` (with `overflow: hidden` and `white-space: nowrap`, or a line clamp) and the full value still reachable (`title`, `aria-label`, or a detail view). Text that is silently cut off by a box is a bug.
- **Icons inside controls get reserved padding.** A select chevron, a leading search icon, a trailing clear or reveal button: the control reserves `padding-inline-start` or `padding-inline-end` for the icon plus a gap, so the icon never touches or overlaps the text, even with the longest value.
- **Rows must fit their container.** Grid tracks are `minmax(0, 1fr)`, never bare `1fr` or fixed widths; every control is `box-sizing: border-box` and `width: 100%` of its track; every grid and flex child that holds text or a control gets `min-width: 0`; no fixed `width` or `min-width` that can exceed the container at 320px. A row with more fields than the width allows wraps to fewer columns (1 on phone, 2 on tablet), it never overflows.
- **Mechanically verified.** `ui_audit` checks this at 320, 375, 414, 768, and 1280 and reports `overlap`, `overflow-parent`, `clipped-text`, and `icon-text-collision`. The prevention recipe is in `jal-frontend-rules` (No overlap recipe).

### No side line on any card or panel, ever

Forbidden on every card, tile, panel, notice, list item, table row, quote, callout, nav item, and section, in every state (resting, hover, selected, active, error):

- A `border-left`, `border-right`, `border-inline-start`, or `border-inline-end` that is wider than 1px, or whose color differs from the element's other sides, or that exists without the other three sides.
- A top or bottom accent bar (`border-top` or `border-bottom` in an accent or status color, or thicker than the other sides).
- The `box-shadow: inset Npx 0 0` stripe trick, a `::before` or `::after` pseudo-element drawn as a vertical or horizontal bar, or a background-image stripe.
- An underline bar under the active tab or active nav item.

What to do instead:

- **Status and notification**: status icon plus a title that names the state, on a tonal surface (status color mixed at 8% into surface), inside one full 1px hairline border of the same color on all four sides. Recipe in `jal-frontend-rules`. Carbon's notifications, tabs, and tiles do ship side stripes (a 6px or 3px `border-inline-start`, tab stripes, inset tile shadows); JAL Core keeps Carbon's notification anatomy and sheds those stripes, never ports them.
- **Selection** (selected card, row, option): a full ring on all four sides (`outline: 2px solid` in ink or accent, following the corner radius) or a tonal fill change (`layer-1` or `layer-2`). Never a stripe on one edge.
- **Active nav item and active tab**: tonal fill (`layer-2`), ink color, and weight 600. Never an underline or side bar.
- **Quote or callout**: a tonal surface with a full hairline border, or type alone (size step and ink-muted). Never a left rule.
- **Emphasis on one card in a grid**: position, span, and content, never a colored edge.

### No shadows: how depth is made

- Nested surfaces step page, surface, layer-1, layer-2 (tokens below). A card is `surface` with a 1px `border` hairline on the `page` background.
- Overlays (menu, popover, select list, dialog, toast, bottom sheet) sit on `surface` with a 1px `border-strong` hairline. A dialog adds a neutral scrim behind it. Never a shadow.
- Hover and pressed feedback is a state layer (color-mix), never a lift.
- Focus is `outline: 2px solid var(--color-focus); outline-offset: 2px`. If `outline` cannot be used, a spread-only ring `box-shadow: 0 0 0 2px var(--color-focus)` is the only permitted box-shadow.
- Sticky headers and sticky table columns get a 1px `border` edge when content scrolls under them, never a shadow or a fade.

## Palette law and anti-slop (read this before any color decision)

Every LLM defaults to the same look when nobody stops it: a dominant black or near-black background, a saturated purple or violet accent, glowing cards, oversized colored numbers, a gradient smeared across whatever is left, and a colored stripe down the side of every card. That look is the AI-slop signature. It is not a style choice, it is a tell, and it is forbidden on every JAL surface.

**Reference bar.** The output should feel like it belongs next to Apple, Linear, Stripe, or Vercel documentation: quiet, confident, mostly neutral, one considered accent at most. If a screen looks like a generic dark AI-tool landing page, it is wrong, full stop, rebuild it.

**Neutral-first.** The dominant surface of every screen is neutral, not colored.

- The page base is a near-white neutral (`--color-page`, `#fafaf9`), never a flat `#ffffff` page. White (`--color-surface`) is for cards and overlays sitting on that page, which is what makes the layer step readable without a shadow.
- Dark mode, only when explicitly requested and shipped as a dedicated theme: a warm near-black, e.g. `oklch(16% 0.006 60)` (roughly `#171412`), never `#000000`, never a cold blue-black, never auto-selected from the OS.
- Body text is ink (`--color-ink`, `#1b1b1b`), never pure `#000`. On a dark theme, ink is a near-white, never pure `#fff`.
- Most of any given view is neutral. Color is rare, deliberate, and small in area.

**At most one accent hue.** The primary action is ink on white by default, and that is the preferred posture. A project may add exactly one brand accent. A desaturated status color (success, warning, danger, info) is permitted only for real state, never for decoration. The accent is used on at most a handful of elements per screen: a primary CTA, links, an active nav indicator (tonal, never a bar), a focus ring. It is a highlighter, not a fill. It is never a marker square, dot, stripe, or hairline placed beside a heading or label.

- **The accent is never purple, violet, or indigo** (HSL hue 250 to 320 with saturation above 20%, the band `ui_audit` enforces; keep an accent outside 235 to 330, and a 225 to 235 cobalt needs a written reason in the direction contract). That family is the single most recognizable AI-slop tell. The default is no accent at all (`--color-accent` equals ink). When a product needs one, the direction contract picks it from product meaning: a blue that is clearly blue and not violet, a forest or signal green, a teal, an ochre. Terracotta is no longer a suggested default: on a beige ground with a serif display it is a known AI tell (see `craft.md` section 14).
- The accent never fills a large area. Cap it at roughly 3% of any viewport's pixels. A giant accent-filled hero band, an accent-filled card grid, or an accent-colored stat number is the fill violation, not the highlight use.
- Giant colored stat numbers are banned outright. A metric is ink at a normal-to-large type step with a small ink-muted label underneath, never a huge saturated numeral competing for attention.
- No gradient text fill on headings or body copy, ever. That is decoration standing in for a design decision.

**Banned outright, no exceptions:**

- Glow effects of any kind: radial glow blobs behind text or cards, neon edge lighting, blurred colored drop-shadows standing in for elevation.
- Purple-on-black as a page's dominant identity, in any variation (violet-on-near-black, indigo-on-charcoal).
- Gradients of any kind, anywhere, on any surface. A flat neutral is always the answer.
- Saturated accent fill covering a large surface area: full-bleed accent heroes, accent-filled card backgrounds as the default card treatment, accent-colored borders around every card in a grid.
- Shadows of any kind (the hard law above), including the "subtle neutral elevation" that older JAL docs allowed. That allowance is gone.
- Gratuitous blur blobs, fake grain overlays, decorative squiggles, re-drawn fake chrome.

**Type: editorial, not decorative.**

- One generated scale (below), a restrained set of large headings, generous line-height on body copy. Headings tighten as they grow; body stays loose and readable.
- A clean interface font stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` or an Inter-like sans by default. A tasteful display or serif face only when it earns its place (an editorial or manifesto-toned product), never added reflexively "to look designed." A new webfont is a dependency decision per `jal-standards`.
- Weights 400, 500, and 600 only. Two weights per screen, three as a hard ceiling.
- Hierarchy comes from weight, ink step (ink versus ink-muted), and position before size, and never from the accent color. Exactly two text colors carry content (ink and ink-muted); ink-subtle is for large text and non-essential meta only; the disabled color is never used for content.

**Space and layout: generous, gridded, no dead air.**

- Whitespace is generous and rhythmic: the same spacing tokens repeated down a page, not hand-tuned per section. Grouping comes from contrast between tight gaps inside a group and generous gaps between groups.
- Borders and dividers are hairline: 1px, low-contrast neutral, never full-contrast black, never the accent, never on one side only.
- Everything aligns to the 4px grid and to one left content line per region.
- A Bento region fills completely at every breakpoint: no oversized empty bands, no dead gaps patched with a stray margin. If content does not tile cleanly, resize the spans or change the container, do not leave a hole.

This section is strict on purpose: a prior JAL surface shipped the exact forbidden look (black background, saturated purple accent, glowing cards, oversized colored stat numbers, weak layout) and it read as AI-slop, not as a JAL product. Every build and every audit checks against the Hard law and this section first.

## Craft floor

The minimum quality every render clears, checked in one batched pass at 375 and 1280. The full floor, with the numbers, the ported detector thresholds, and the reasons, is in `jal-design-system` `references/craft.md`. The short form:

- **Measure** 65 to 75ch for body prose; over 80ch fails. **Leading** 1.5 on body, never under 1.3 on wrapping text.
- **Tracking** from the `--tracking-*` tokens: display -0.03em, headings -0.02em, titles -0.01em, body 0. Floor -0.04em; body never above +0.05em; no tracked caps.
- **Display** tops at `--text-6` on product screens; `--text-display-1..3` only on marketing and immersive heroes, one per page, about 8 words at most.
- **Heading rhythm**: more space above a heading than below it, 2x as the target.
- **Browser surfaces** themed from tokens: `::selection`, `caret-color`, `accent-color`, `scrollbar-color`, underline offset, `cursor: pointer` on enabled controls and default on disabled, `tabular-nums` in every table, price, and counter.
- **Bans** on top of the Hard law: icon tile above a heading, big-number hero, identical feature-card grids as page structure, numbered section labels, pill badge above a headline, full-sentence display headline, image hover transforms, decorative grid or stripe backgrounds, mono as costume.
- **Claude's own prior**: warm subjects drift to cream, italic serif, and lamplight. Treat that first palette as spent.
- **Critique** uses Nielsen's 10 scored 0 to 4 (`ui.heuristics`), five personas, and P0 to P3; the finish is judged by the critic gate (`ui_shots` images, a fresh critic, rubric scores in `ui.finish_disposition`), three fix rounds at most, and the builder never self-approves.
- **From: hallmark** (merged into the impeccable core; each item's full rule is in `craft.md` or `directions.md`): hero rules (`hm.headline_buckets`, `hm.hero_space`, `hm.image_need`, `hm.survives_deletion`; `craft.md` sections 2 and 3); component specs for inputs, tooltips, toasts, dialogs, menus, the command palette, and copy buttons, plus `hm.silent_success` and the `hm.state_harness` eight-state page (`craft.md` section 9; under silent success, the "toast or inline confirmation" in UX heuristics means the visible result itself when the user can see it); nav and footer fingerprint checks (`craft.md` section 3, chrome tables in `directions.md` section 2); page shapes and domain trios (`directions.md` section 2); the pre-flight scan and the redesign safety rail (`craft.md` section 11); the reference-study protocol (`craft.md` section 11); copy specificity, placeholder names, and microcopy bans (`craft.md` section 10); the philosophy and variety self-critique axes (`craft.md` section 12). Audit hooks, candidates for `ui_audit` (owner: lead), are the hallmark rows in `craft.md` section 4: fill canary, root `overflow-x: clip`, full-viewport hero, hero padding ratio, lazy LCP, sticky under sticky, unnamed SVG or canvas, bar alignment, more than 5 font sizes, `100vw`, unsized images. Until they land in `ui_audit`, check them by eye in the craft-floor pass.

## Section concept law

No section is drawn until it is schemed. Before any markup, write a concept line for every section of the screen:

```
Section: <name>
Job: what the user must understand or do after this section
Message: the one primary message, one sentence
Action: the one primary action, or "none"
Container: rows | bento | divided-section | card | plain-spacing (JEV decides, see Layout doctrine)
```

- **A section with no job is deleted.** "It looks empty without it" is not a job. Filler features, filler stats, and filler testimonials are deleted, not written.
- **One primary message and at most one primary action per section.** Secondary actions are visibly secondary.
- **At most two text tiers inside a block**: a lead line and one supporting line or body. A kicker plus title plus subtitle plus body plus badges stack is a failure.
- **Adjacent sections vary in structure.** Two neighbors never share the same container and the same shape (not three cards then three cards, not hero then three cards then CTA band then footer on every page). Vary container, column count, alignment, or density between neighbors.
- **Section order follows the user's question order**, not a template's order: what is this, why should I care, how does it work, what does it cost, what do I do now (landing); status, exceptions, records, actions (product).
- The concept lines go into the build report and into the `state` sent to `jev_decide`.

## Layout doctrine: the criteria JEV uses to pick a container

Outside-in, adapted from Astryx. Structure is decided before content and before styling.

1. **Frame and region widths first.** Pick the shell (mobile app-shell; top nav or side nav at tablet and desktop; multi-pane for tools; plain column for docs and forms). Give every fixed region a width budget. Decide fill versus capped per region: tables, charts, boards, and maps fill; prose caps near 68ch (about 720px), forms near 640px; page content caps at 1280px and centers above that.
2. **Lightest container that still groups.** Try in this order and stop at the first that reads as a group: spacing, then a divider, then a section (no border), then a card. A card is for a self-contained widget or a hard boundary, not for page structure. No cards inside cards. No full-width cards stacked as page structure.
3. **Records render as rows, not cards.** Many items of the same shape that the user scans or compares (orders, users, logs, invoices, files, messages) are rows in a list or table, edge-to-edge inside one container, separated by neutral dividers. Card soup is a failure.
4. **One left content line per region.** Every label, heading, and control in a region starts on the same vertical line. Only hover and selected backgrounds may cross it. Verify by drawing a vertical line down the region.
5. **Grouping must survive with borders removed.** Mentally delete every border: if the groups can still be named from spacing alone, the spacing is right. If everything uses the same gap, proximity is doing no work, fix it.
6. **Per-region breakpoint contract.** For each region, state what happens as width shrinks: divide (columns become rows), reveal (hidden detail appears at a width), resize (fill width changes), or swap (side panel becomes a bottom sheet, side nav becomes the bottom tab bar). Drop a non-essential region rather than shrink everything uniformly.

**The container options JEV chooses from, and when each is right:**

| Container | Choose when | Never when |
|---|---|---|
| `rows` | Many records of one shape, scanned, sorted, compared, or acted on one at a time | The items are different kinds of content |
| `bento` | Mixed summary content of different kinds side by side: KPIs, a chart, a short list, a status, a primary action (overview, dashboard home, landing feature summary) | The content is a list of records, or one tile would be a text card forced into a span it cannot fill |
| `divided-section` | A long sequence of related groups read top to bottom (settings, profile, docs, a form with parts) | The groups need to be compared side by side |
| `card` | One self-contained widget or a hard boundary (a sign-in panel, a checkout summary, a single chart with its own controls) | It would wrap page structure or hold other cards |
| `plain-spacing` | A few tightly related items, or a hero, headline, or prose block | The items need a visible boundary to be understood |

Bento is the default for mixed summary content, not for everything. Records inside a Bento tile still render as rows. JEV makes the call per region; the doctrine above is its criteria and the agent sends those criteria in the question.

## Core tokens (generated, JAL-tuned)

Generated with formulas, not hand lists. A project changes a generator input only with a written reason, never an individual resolved token. Every token is a CSS custom property declared once in `packages/ui/src/tokens.css`; components reference tokens by name only, no inline hex, no inline `rgb()` or `oklch()`, no one-off `font-family`, no px value outside these tables (structural region widths are the only raw px allowed). The names below are the template's names. Pre-v0.3.0 aliases (`--font-size-*`, `--space-1` to `--space-8`, `--color-bg`, `--color-text`, `--color-text-muted`, `--dur-fast`, `--dur-med`, `--ease-out`) still resolve for old consumers; new code uses the primary names.

### Type

Formula: `size(step) = round(16 x 1.2^step)`, steps -2 to 6, plus the hero-only display set at steps 7 to 9. Line height: `lh(size) = 4 x round(min(1.5 x size, size + 8) / 4)`, which keeps body at 1.5, tightens headings toward 1.17, and display toward 1.1, all on the 4px grid.

| Size token | Line token | Step | Size | Line height | Weight | Role and typical use |
|---|---|---|---|---|---|---|
| `--text-n2` | `--line-n2` | -2 | 11px | 16px | 500 | micro: dense desktop meta, table column headers; never body, never a tap label |
| `--text-n1` | `--line-n1` | -1 | 13px | 20px | 400 | caption: metadata, timestamps, helper and error text |
| `--text-0` | `--line-0` | 0 | 16px | 24px | 400 | body: body copy, controls, base of the scale |
| `--text-1` | `--line-1` | 1 | 19px | 28px | 600 | subhead: card titles, row titles, lead lines |
| `--text-2` | `--line-2` | 2 | 23px | 32px | 600 | h4: minor headings |
| `--text-3` | `--line-3` | 3 | 28px | 36px | 600 | h3: section headings |
| `--text-4` | `--line-4` | 4 | 33px | 40px | 600 | h2: page-level headings |
| `--text-5` | `--line-5` | 5 | 40px | 48px | 600 | h1: major page title, hero headline |
| `--text-6` | `--line-6` | 6 | 48px | 56px | 500 | display: landing hero only, one per page at most; the ceiling on product and app screens |
| `--text-display-1` | `--line-display-1` | 7 | 57px | 64px | 500 | marketing or immersive hero only; the largest allowed below 640px |
| `--text-display-2` | `--line-display-2` | 8 | 69px | 76px | 500 | marketing or immersive hero only, from 768px |
| `--text-display-3` | `--line-display-3` | 9 | 83px | 92px | 500 | marketing or immersive hero only, from 1024px |

- The display set (steps 7 to 9) is generated by the same two formulas. It exists for Persuade and Experience surfaces (landing, campaign, showcase, `/jal-ui (immersive mode)`) only: one display element per page, about 8 words at most, never on an app screen, never a fluid `clamp()`. The hero component picks the step per breakpoint with literal `min-width` media queries. A direction may set display weight 600 in place of 500.
- Weights are `--weight-regular` 400, `--weight-medium` 500, `--weight-semibold` 600, and nothing else.
- Every size a component uses comes from this table, always paired with its matching line token. No inline `font-size: 22px` because it "looked right": pick the nearest step and adjust weight or ink instead.
- Base 16 keeps mobile legibility and prevents iOS focus zoom: every input, select, and textarea is `--text-0` (16px) or larger.
- Never apply body line-height to a display headline; never apply heading line-height to body copy.
- Numbers that update live use `font-variant-numeric: tabular-nums` so the box does not jitter.

Tracking tokens (letter-spacing in em, so they scale with the size they sit on):

| Token | Value | Applies to |
|---|---|---|
| `--tracking-display` | -0.03em | `--text-6` and `--text-display-1..3` |
| `--tracking-heading` | -0.02em | `--text-3` to `--text-5` (28 to 40px) |
| `--tracking-title` | -0.01em | `--text-1` and `--text-2` (19 and 23px) |
| `--tracking-body` | 0em | `--text-0` and smaller, controls, table data |

- Floor -0.04em, never tighter. Body text never above +0.05em. There is no caps token: JAL has no all-caps text role, so uppercase text is never tracked out.
- A direction may move `--tracking-display` between -0.01 and -0.04em and `--tracking-heading` between 0 and -0.02em, recorded in its contract. Title and body are fixed.

### Spacing

Formula: a 4px base, `step(n) = 4px x n` for n in 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, plus the half-steps 2px and 6px. Token names are the literal pixel value, so a token is self-documenting.

| Token | `--space-0` | `--space-2px` | `--space-4px` | `--space-6px` | `--space-8px` | `--space-12px` | `--space-16px` | `--space-20px` | `--space-24px` | `--space-32px` | `--space-40px` | `--space-48px` | `--space-64px` | `--space-80px` | `--space-96px` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Value | 0 | 2px | 4px | 6px | 8px | 12px | 16px | 20px | 24px | 32px | 40px | 48px | 64px | 80px | 96px |

- No arbitrary value like `13px` or `22px` anywhere, ever. If nothing on the scale looks right, the layout is wrong, not the scale.
- Micro-spacing (icon-to-label gap, chip padding) uses 2px to 12px. Component padding uses 16px to 32px. Section rhythm uses 48px to 96px, one value repeated consistently down the page.
- The legacy index names `--space-1` to `--space-8` keep their old values (4, 8, 12, 16, 24, 32, 48, 64) for existing consumers only. Never mix index names and pixel names in one component.
- The container owns padding; children carry zero outer margin. Gaps between siblings come from the parent's `gap`.

### Radius

Formula: `--radius = 4px x step`, steps 1, 2, 3, 4, 7, plus pill.

| Token | Tier alias | Value | Use |
|---|---|---|---|
| `--radius-4` | | 4px | badges, tags, inner elements, code chips |
| `--radius-8` | `--radius-sm` | 8px | inputs, selects, buttons, menu items |
| `--radius-12` | `--radius-md` | 12px | cards, Bento tiles, row containers, notices |
| `--radius-16` | `--radius-lg` | 16px | large cards, dialogs, popovers |
| `--radius-28` | `--radius-xl` | 28px | bottom sheets, page-level hero panels |
| `--radius-pill` | | 9999px | avatars, pills, icon buttons, toggles |

- Pick radius by component tier, not by feel. Every instance of a tier shares one radius across the product.
- Concentric rule: an element nested inside a padded container uses `max(0, outer radius - padding)` so the corners stay parallel.
- Selection rings and focus outlines follow the element's radius.

### Controls and row density

| Token | Value | Use |
|---|---|---|
| `--control-h` | 44px | every input, select, date and time input, and button, at every width |
| `--control-row-h-compact` | 40px | table rows, desktop only (1024px and up), logs and monitors |
| `--control-row-h-default` | 48px | table rows, desktop default |
| `--control-row-h-comfortable` | 56px | table rows, desktop, short selection lists and settings |

- Below 1024px, density tokens do not apply: every tappable row is at least `--control-h` and wide tables reflow to stacked rows.
- One control size per row and one density per table. Density changes row height and cell padding together, never one without the other.

### Color (neutral base, white-first)

| Token | Value | Role | Contrast note |
|---|---|---|---|
| `--color-page` | `#fafaf9` | page background (luminance 0.955) | |
| `--color-surface` | `#ffffff` | cards, overlays, controls | |
| `--color-layer-1` | `#f5f5f4` | first nested step, hover rows, sidebars | |
| `--color-layer-2` | `#efefed` | second nested step, active nav, selected | |
| `--color-border` | `#e5e5e3` | hairline borders and dividers | decorative, exempt |
| `--color-border-strong` | `#d4d4d1` | overlay edges, emphasized hairlines | decorative, exempt |
| `--color-border-control` | `#8f8e89` | interactive control boundaries ONLY: input, select, date and time input, textarea, checkbox, radio, switch track | 3.28:1 on surface, 3.14:1 on page, 3.01:1 on layer-1 (WCAG 1.4.11) |
| `--color-ink` | `#1b1b1b` | primary text, primary action fill | 17.2:1 on surface, 15.0:1 on layer-2 |
| `--color-ink-muted` | `#474747` | secondary text | 9.3:1 on surface, 8.1:1 on layer-2 |
| `--color-ink-subtle` | `#6b6b6b` | large text and non-essential meta only | 5.3:1 on surface, 4.6:1 on layer-2 |
| `--color-primary` | `var(--color-ink)` | primary action fill (ink on white by default) | |
| `--color-primary-contrast` | `var(--color-surface)` | text and icon on the primary fill | 17.2:1 |
| `--color-primary-hover` | `color-mix(in oklab, white 8%, var(--color-ink) 92%)` | primary hover state layer | |
| `--color-primary-active` | `color-mix(in oklab, white 12%, var(--color-ink) 88%)` | primary pressed state layer | |
| `--color-focus` | `var(--color-ink)` (or the one accent) | focus outline | at least 3:1 |
| `--color-accent` | `var(--color-ink)` | the one product hue; neutral (equal to ink) until a direction contract sets a hue and its single role (`none`, `filled_primary`, `signal_only`, `text_and_icon`); about 3% of any viewport at most; HSL hue outside 235 to 330 | at least 4.5:1 on surface for text use |
| `--color-accent-contrast` | `var(--color-surface)` | text and icon on an accent fill | at least 4.5:1 on the accent |
| `--color-success` / `--color-success-surface` | `#1f7a45` / `#ebf4ee` | real success state only | 5.4:1 on surface, 4.8:1 on its surface |
| `--color-warning` / `--color-warning-surface` | `#8a5a1f` / `#f6efe4` | real warning state only | 5.9:1 on surface, 5.2:1 on its surface |
| `--color-danger` / `--color-danger-surface` | `#b3261e` / `#f7ebea` | real error and destructive state only | 6.5:1 on surface, 5.6:1 on its surface |
| `--color-info` / `--color-info-surface` | `#3d5a73` / `#ecf1f4` | real informational state only (slate blue, OKLCH hue 245, low chroma) | 7.2:1 on surface, 6.4:1 on its surface |

Derived tokens (declare them in `tokens.css` before first use if the project does not have them yet):

| Token | Value | Role | Contrast note |
|---|---|---|---|
| `--color-<status>-border` | `color-mix(in oklab, var(--color-<status>) 24%, var(--color-border))` | the full four-side hairline of a status notice | decorative, the icon and title carry meaning |
| `--color-scrim` | `color-mix(in oklab, var(--color-ink) 40%, transparent)` | dialog backdrop only | |

- `--color-border-control` is for interactive control boundaries only. Cards, tiles, row containers, and dividers keep the light `--color-border` hairline (`#e5e5e3`); overlays keep `--color-border-strong`. On focus, a control's border turns to `--color-ink` and the focus outline is added.
- The accent, when a direction sets one, replaces `--color-primary` (with hover and active re-derived by the same formula) only when its role is `filled_primary`, and `--color-focus` only where it keeps 3:1. Ink on white stays the default. Per-product values go in one override block at the end of the product's `tokens.css`, only for the knob tokens listed in `directions.md` section 5.
- Status colors are desaturated, always paired with an icon and a word, never used for decoration, never used as a card edge.
- Status notices use `--color-<status>-surface` as the fill and `--color-<status>-border` on all four sides.

### Depth (tonal layers, no shadow)

Carbon's layer model plus Material's tonal ladder, rendered flat. Nested surfaces step `page` -> `surface` -> `layer-1` -> `layer-2`, each step a small luminance change plus, where the boundary matters, a 1px `border` hairline. A surface never skips more than one step from its parent. Overlays sit on `surface` with a 1px `border-strong` hairline; a dialog adds `--color-scrim`. Elevation never changes on hover; state layers do.

### State layers (Material table, no gradients)

Formula: `state(fill, on, N) = color-mix(in oklab, var(on) N%, var(fill))`, where `on` is the content color that sits on that fill (ink on surface, white on the ink primary).

| State | N | Token on surface | Resolved (ink over `#ffffff`) | Token on primary | Resolved (white over `#1b1b1b`) |
|---|---|---|---|---|---|
| hover | 8% | `--state-hover` | `#eaeaea` | `--color-primary-hover` | `#2a2a2a` |
| focus (layer, with the outline) | 12% | `--state-focus` | `#e0e0e0` | | |
| pressed | 12% | `--state-pressed` | `#e0e0e0` | `--color-primary-active` | `#323232` |
| disabled content | 38% | `--state-disabled-content` | `#a0a0a0` (exempt from contrast) | | |
| disabled container | 12% | `--state-disabled-container` | `#e0e0e0` | | |

- On a fill other than surface (layer-1, a status surface), compute the state with the same formula against that fill; do not reuse the surface token on a different fill.

- Hover applies only under `@media (hover: hover)` and only when enabled. Disabled never paints hover or pressed, and uses the default cursor.
- Astryx's `linear-gradient(c, c)` hover overlays are replaced by this formula. No `background-image` state trick of any kind.

### Motion

| Token | Value | Use |
|---|---|---|
| `--dur-100` | 100ms | micro: press, toggle, checkbox, color change |
| `--dur-150` | 150ms | fast: hover and state-layer transitions, small fades |
| `--dur-200` | 200ms | base: menus, popovers, list add and remove |
| `--dur-300` | 300ms | slow: dialogs, sheets, route transitions |
| `--dur-400` | 400ms | showcase only (landing hero, demo pieces) |
| `--dur-600` | 600ms | showcase only |
| `--ease-standard` | `cubic-bezier(0.24, 1, 0.4, 1)` | the one product easing |

- Exit asymmetry: an exit runs at about 70% of its entrance, `exit = round(0.7 x enter / 10) x 10`: 100 -> 70, 150 -> 110, 200 -> 140, 300 -> 210, 400 -> 280, 600 -> 420 (ms).
- Transform and opacity only. Never `transition: all`. Never animate layout properties, color of large areas, or shadows (there are none).
- `prefers-reduced-motion: reduce` collapses every animation to an opacity crossfade of 150ms or less with no travel and no scale. Meaning is preserved without motion.
- Focus rings show instantly and never animate. High-frequency hovers (rows, list items) feel instant.
- Showcase choreography, exit curves beyond the default, and library choice (Lenis, GSAP, Framer Motion, CSS or WAAPI) live in `jal-motion`.

### Breakpoints

| Token | Min width | Layout |
|---|---|---|
| (base) | 0 | app-shell, single column, bottom tab bar |
| `--bp-sm` | 640px | tablet: 2-column Bento, top nav returns, bottom tab bar drops |
| `--bp-md` | 768px | tablet wide: regions may divide, forms may go 2 across |
| `--bp-lg` | 1024px | desktop: 4-column Bento, side nav allowed, table density tokens apply |
| `--bp-xl` | 1280px | content cap reached, page centers |
| `--bp-2xl` | 1536px | wide: extra room goes to fill regions (tables, charts), never to wider prose |

CSS custom properties cannot be read inside `@media`, so media queries use these literal values (`min-width: 640px` and so on), mobile-first, `min-width` only. Container queries are preferred inside components.

## Responsive and the mobile app-shell

- Mobile is not "the desktop site, but narrower." Below 640px ship the dedicated app-shell from `jal-frontend-rules`: sticky header with `safe-area-inset-top`, independently scrolling content, fixed bottom tab bar (3 to 5 items) with `safe-area-inset-bottom`.
- Design mobile-first: build the single-column app-shell version first, then expand the same components into the tablet and desktop layouts. Never design desktop first and squeeze it down; that produces the cramped, proportionally-shrunk mobile screens `jal-frontend-rules` forbids.
- Type steps, spacing tokens, radius, and control height do not change across breakpoints, only layout (columns, nav pattern, region visibility) does. `--text-4` (h2) is 33px on mobile and 33px on desktop; what changes is how much horizontal room it has.
- Side panels swap to a bottom sheet, side nav swaps to the bottom tab bar, tables swap to stacked rows.

## Visual-consistency rules

- One type scale, the table above, used everywhere. No screen introduces its own heading size.
- One spacing rhythm, the table above, used everywhere. No screen introduces its own gap value.
- No ad-hoc px values in any dimension, font-size, margin, padding, gap, or border-radius. If it is not on a token table in this skill, it does not go in the codebase.
- Align every element to the 4px grid. A component 2px off the nearest line is a bug, not a rounding error.
- Component chrome (padding, radius, border weight) is identical across every instance of the same component tier. Visual weight varies only by size and content, and the same principle applies to buttons, inputs, list rows, and cards.

### Form control consistency (fatal to get wrong, and the most commonly botched)

A native `input`, `select`, `textarea`, and `input type="date"` all size themselves differently. Left unnormalized they render at different heights in the same row, which reads as amateur work. Normalize every control explicitly.

- **One control height token.** `--control-h` (44px, which also satisfies the touch target) applies to every `input`, `select`, button, and date or time input as `height` (`min-height` for `textarea`). `box-sizing: border-box` so padding cannot change it.
- **Kill platform chrome sizing.** Every `select` and date or time input gets `appearance: none` (plus `-webkit-appearance: none`), because platform styling silently adds height and padding that a text input does not have. Supply your own chevron as an `Icon` positioned inside the field, never a decorative bar.
- **Identical chrome across control types.** Same padding token, same `--radius-sm`, same 1px `--color-border-control` border on all four sides, same `font-size` (16px minimum, smaller triggers zoom on iOS), same `font-family` (`inherit`, never the platform default), same focus-visible treatment (border to `--color-ink` plus the focus outline). A select is visually indistinguishable from a text input except for its chevron.
- **Icons inside a control reserve their lane.** A chevron, leading icon, or trailing button gets reserved inline padding (icon size plus a 12px gap) so it never touches or overlaps the value, and the value ellipsizes before it reaches the icon.
- **The row fits its container.** Field rows use `minmax(0, 1fr)` tracks, every field wrapper has `min-width: 0`, every control is `width: 100%` with `box-sizing: border-box`. Three fields that do not fit wrap to fewer columns; they never push past the right edge of the container.
- **A row of fields uses equal grid tracks, top-aligned.** `grid-template-columns: repeat(N, minmax(0, 1fr))` with `align-items: start` (and `align-content: start` inside each field wrapper), and every field wrapper has the same internal structure: label, control, helper slot. Use `start`, never `end`: bottom-anchoring lets a taller helper or a two-line error in one field push that control up relative to its neighbors, recreating the exact misalignment this rule exists to prevent. Never let one field be a different width or sit at a different vertical offset than its neighbors.
- **Reserve space for helper and error text.** The helper and error slot has a fixed `min-height` so a validation error does not shift the row, resize the card, or push neighbors out of alignment. Validation changes color and text, never layout.
- **Verify by measurement, not by eye.** Every control in the same row reports the SAME computed height and the SAME top offset. Measure with `getBoundingClientRect` before shipping; `ui_audit` checks it. A 1px difference is a bug; 13px is what a botched form looks like.

### Card and grid consistency (this is fatal to get wrong)

Repeated cards or items in a grid MUST share one consistent shape. Uneven card shapes in a grid are the single most damaging tidiness failure and are forbidden.

- **Equal card heights per row.** Cards in the same row are the same height (CSS grid stretch, or `grid-auto-rows: 1fr`). Never let one card in a row be taller than its neighbors.
- **Align repeated internal elements to the same baseline.** When every card contains the same kind of element (a code block, a primary CTA, a price, a meta row, a thumbnail), it sits at the SAME position in every card. Make the card a flex column and give the shared bottom element `margin-top: auto` so it rests on one baseline across the row, no matter how long the text above it runs. A CTA or code block floating at a different height in each card is the classic ragged-grid tell.
- **Constrain variable-length content so it does not reshape the card.** A one-line command or code snippet is `white-space: nowrap` with its own `overflow-x: auto`, so a long value scrolls inside a fixed-height block instead of wrapping and making that card taller. Long descriptions are clamped to a fixed line count or absorbed by a bottom-pinned action row. Content length never changes a card's shape.
- **No empty void inside a card, and never fake-fill with stretched gaps (both are fatal).** A card must never be taller than its content fills. But the fix is NOT to spread the content out: `justify-content: space-between`, `flex-grow` on list rows, or any trick that distributes items to fill vertical space produces huge uneven gaps, which is chaotic spacing and just as forbidden as an empty void. The real rule:
  - **Rows and list items use exactly one fixed gap token**, always the same gap, top-aligned. Never stretch, never space-between to fill height. A list of 4 items looks the same whether its card is short or tall.
  - **Only a genuinely stretchable visual may flex to fill height** (a bar or line chart body, a map, an image, a canvas): `flex: 1` on that visual is correct because it scales. A list, a stat, or a text block never flex-fills.
  - **Therefore a card's height follows its content.** Do NOT give a text or list card a big row span it cannot naturally fill. Match spans to content.
  - **When a layout mixes a tall visual with short lists, do not force the lists into the visual's height.** Put the tall visual in its own full-width band (or its own column), and lay the short cards in an even row where they share a similar natural height.
  - Before shipping, look at every card: any visible empty band (void) OR any oversized gap between rows (fake-fill) is a bug. Fix the layout, do not paper over it by stretching.
- **A grid reads as one system, not a pile of different cards.** Scan across each row: do the borders, heights, internal element positions, and code-block sizes line up, does every card's content fill its box with no empty band, and does no card carry a side line or a different edge? If any card is a different shape or has a dead region, it is a bug.

## Gradients: banned

- No gradients of any kind, anywhere: no gradient background, fill, text, border, mask, scroll fade, or state overlay, static or animated. Not from feralui.dev, not from a source design system, not hand-rolled. This is absolute.
- The answer to "this surface feels flat" is better spacing, hierarchy, a tonal layer step, and one considered accent at most, never a gradient.
- Scroll edges get a hard edge plus a 1px hairline when content scrolls under them, never a fade.

## UX heuristics

- **Clear hierarchy**: one primary action per screen and per section, obvious at a glance. Weight, ink, position, and size communicate importance before color does. If a user has to read copy to find the primary action, the hierarchy failed.
- **Affordance**: every interactive element looks interactive. Buttons look pressable, links are visually distinct from static text, disabled states are visibly disabled (state-layer disabled tokens), not just inert. A disabled control that needs to explain why stays focusable (`aria-disabled`) with the reason reachable.
- **Immediate feedback**: every action gets a visible response within roughly 100ms: a pressed state, a spinner past 300 to 400ms, and on completion the changed state itself (silent success, `hm.silent_success`: the new row, the updated value, the closed dialog). A toast is only for results that happen out of view or cannot be undone. Silence after a tap reads as broken.
- **Restrained motion**: animate only to clarify a state change (an item entering, a panel expanding, a page transitioning), never as ambient decoration. Per `jal-standards`, reach for Lenis, GSAP, or Framer Motion only when the interaction genuinely needs it, and honor `prefers-reduced-motion` on every animation. Detail in `jal-motion`.
- **Accessibility and contrast AA+**: text and meaningful icons meet WCAG AA (4.5:1 for normal text, 3:1 for large text and for control boundaries and focus indicators) against their background. Never rely on color alone to convey state; pair it with an icon, a word, or a shape change. No skipped heading levels.
- **Touch targets 44px+**: every tappable element on mobile is at least 44x44px including padding, not just the visible glyph. Two targets never sit closer than 8px (`--space-8px`) apart.
- **Empty, loading, and error states**: every view that can be empty, loading, or errored ships a deliberate design for all three, never a blank screen, a bare spinner with no context, or a raw error string. Loading is a skeleton matching the expected shape (no layout shift). Empty states explain what belongs there and how to fill it; error states explain what happened and offer a next action.

## Design principles (JAL-native, self-contained)

JAL-AIDEV does not depend on any external design skill. Do NOT load `hallmark`, `design-taste-frontend`, `ui-ux-pro-max`, `high-end-visual-design`, or any other outside skill to build a JAL frontend. The design-system knowledge JAL uses (Astryx as the foundation, Carbon for data and forms, a few Material contracts, bang-motion) is already merged into one system in this skill, `jal-design-system`, and `jal-motion`, so the plugin is self-contained and every teammate gets the same bar with nothing extra installed. All of it is JAL law alongside the Hard law and the Palette law.

- **Structural variety.** Two different JAL screens must not share the same shape, and two adjacent sections must not share the same structure. Do not fall back to hero, then three feature cards, then a CTA band, then a footer on every page. Vary the macrostructure so each surface reads as its own product, not a color-swap of one template.
- **Pre-emit self-critique.** Before you show any screen, score it 1 to 5 on six axes: hierarchy (is the most important thing obviously first), restraint (could anything be removed), consistency (one type scale, one spacing rhythm, one accent at most), specificity (does it fit this product or any product), execution (spacing, alignment, states), and taste (does it clear the Apple/Vercel bar). Anything under 3 gets a revision pass before it ships. Never hand over a screen you have not scored. The JEV final verdict comes after this, not instead of it.
- **Honest copy.** Never fabricate a metric, testimonial, logo, user count, or review. Use a real number, a clearly labeled placeholder, or a layout that does not need the number. Invented proof is slop the moment it is written.
- **Locked tokens.** Every color and every font-family references a named token (`var(--color-...)`, `var(--font-...)`). No inline hex, no inline `rgb()` or `oklch()`, no one-off `font-family` mid-file. If a value is missing, add it to the token block first (with a reason), then reference it.
- **No re-drawn chrome.** Never hand-build a fake browser bar (URL pill plus traffic-light dots), a fake phone frame, a fake code-window title bar, or fake IDE chrome. Use a real screenshot in a bordered figure, or let the content stand alone.
- **Mobile verified at 320, 375, 414, and 768px** (and 1280 on desktop). No horizontal scroll at any width. No clickable target that wraps to two lines. Image-bearing grid tracks use `minmax(0, 1fr)`, never bare `1fr`. Headings wrap inside long words. Every layout collapses cleanly to one column on the smallest width. This is a floor, not a wish.
- **Eight states on every interactive element.** default, hover, focus-visible, active, disabled, loading, error, success. A button or input that ships fewer than eight states is unfinished. Focus rings show instantly and never animate.
- **Cut motion before adding it.** Motion earns its place only when it carries information (a state change, a spatial relationship). Transform and opacity only, the named easing, a reduced-motion crossfade. Restraint reads as expensive; decoration reads as slop.

If any outside reference (a library example, a source design system, a designmd kit, a generated mock, a teammate's snippet) disagrees with this file or `jal-frontend-rules`, this file wins, no exception without Brian's sign-off per `jal-standards`.

## Decision layer (JEV)

JEV (TypeSafe) makes the soft calls so taste does not depend on the mood of one run. Call it through the `jev_decide` tool of the bundled `jal-design` MCP server (`{ state, questions }`; CLI fallback `bun mcp/jal-design/server.ts decide <file|->`). Question types: `choice` (a `criteria` map of options, answer `choice` plus `probabilities` plus `confidence`), `score` (an ordered `criteria` array of at least 2 levels, answer `score` plus `legend` plus `probabilities` plus `confidence`), `noul` (answer `noul`, the probability of yes). Always put the brief, the section concept lines, and the relevant criteria from this skill into `state`.

Seven decision points. Points 1 to 4 run in every `/jal-ui` run; point 5 runs whenever a direction or structure is rolled (`directions.md`); points 6 and 7 run in every fresh-context finish review and every critique (`craft.md` sections 11 and 12):

| # | Point | Questions | Rule |
|---|---|---|---|
| 1 | Density pick (`ui.density`) | `choice` over `compact`, `default`, `comfortable` for desktop tables and record lists, criteria from `jal-design-system`. There is one design system, JAL Core; JEV never picks a design system | Set `data-density` on the app root. Confidence under 0.5: take the runner-up only if it is `default` |
| 2 | Region and component gate | For every proposed section and major component: `noul` "implement?"; `score` relevance with levels 0 Irrelevant, 1 Marginal, 2 Useful, 3 Core; `choice` container over `rows`, `bento`, `divided-section`, `card`, `plain-spacing` with the Layout doctrine table as criteria | Drop when implement is under 0.5 or relevance is under 1.5 (use the probability-weighted mean when probabilities are returned). Build the kept ones in the chosen container |
| 3 | designmd screen | Before any designmd kit is used as a reference: `noul` "is this slop?" with the Palette law and Hard law as the definition; `score` fit to the brief on the same 0 to 3 scale | Reject when slop is 0.5 or more. Treat fit under 1.5 as not useful. A kept kit is still law-filtered before it influences anything |
| 4 | Final taste verdict | `score` on the built screen description plus the `ui_audit` result, levels 0 Reject, 1 Weak, 2 Ship-ready, 3 Excellent | Under 2: revise and ask again before returning |
| 5 | Direction screen (`ui.direction_screen`) | Per candidate, batched with prefixed keys (`c1_slop`, `c1_fit`, ... `c7_fit`): `noul` slop (generic, the category rut, dependent on what the law strips, or needs invented claims or missing assets); `score` fit 0 Foreign or obscuring, 1 Skin over a stock layout, 2 Supports the task, 3 Native to the audience and explains the product | Drop when slop is 0.5 or more or fit is under 1.5. Survivors keep their original rank, never re-sorted by score. The seeded draw picks among survivors ranked 3 to 7; JEV never picks |
| 6 | Heuristics (`ui.heuristics`) | Nielsen's 10 as `score` 0 to 4 (`h1_status` to `h10_help`) plus `noul` specific (could an unrelated product reuse this unchanged?), on the reviewer's structured screen description, the `ui_audit` summary, and the persona findings | Band on applicable max (h7 and h10 may be n/a on Persuade and Experience): 90% excellent, 70% good, 50% acceptable, 30% poor. Any heuristic under 2 is a priority issue; specific under 0.5 is P1. Feeds point 7 as evidence |
| 7 | Finish disposition (`ui.finish_disposition`) | `choice` over `ship`, `fix`, `rebuild`, `recapture`, judged from the critic gate evidence (`evidence.critic`: the rubric scores from a fresh critic that read every `ui_shots` image) against `docs/design/direction.md` and its fidelity matrix; a critic total under 15 or any 0 is `fix` without asking | `fix` applies up to 8 fixes in one batch and re-reviews with a resolved, partial, unresolved pass; `rebuild` re-derives the named regions; `recapture` redoes the evidence and does not count as a round. At most three fix rounds, then open items go to Brian with the scores. Low confidence: the stricter of primary and runner-up |

- **JEV is final on soft calls**: density, relevance, implement-or-drop, container choice, fit, final taste, direction screening, heuristics, finish disposition. The one exception by design: JEV screens direction candidates but never chooses among them, because a ranked pick collapses to the top idea; the seeded draw chooses. The agent does not override a JEV veto and does not re-ask the same question hoping for a different answer.
- **JEV has no authority over hard law.** If a JEV answer would require a gradient, a shadow, a side line, a dark default, purple, an emoji, or a broken grid, the law wins and the agent picks the next-best option that is lawful. JEV cannot grant an exception; only Brian can.
- **designmd is supplementary only.** Read tools only, never upload or delete. A kit influences nothing until it passes point 3 and the law filter.
- **Outage path.** 429 and 529 are retried with exponential backoff by the tool. If JEV is still unreachable (or returns 401 or 422 that cannot be fixed), the agent falls back to its own judgment using the same thresholds and criteria, and stamps the build report `UNVERIFIED BY JEV` for each affected decision. Never silently skip a decision point.
- **Log every decision** in the build report: point, question, answer, confidence, and what was built or dropped because of it.

## Mechanical proof (`ui_audit`)

No screen is called done until `ui_audit` reports **PASS**. Call the `ui_audit` tool of the `jal-design` MCP server with the running page URL (`{ url, widths? }`, default widths 320, 375, 414, 768, 1280; CLI fallback `bun mcp/jal-design/server.ts audit <url>`). It drives system Chrome over the DevTools Protocol and asserts on computed styles and the live DOM at every width:

- Page background is light: relative luminance of `body` and the main container background is at least 0.85.
- No gradient in any computed `background-image`.
- No `box-shadow` with a blur radius above 0 (spread-only focus rings allowed).
- No side stripe: no element with a left or right (or inline start or end) border wider than 1px, or a side border whose color differs from its other sides, or an inset horizontal box-shadow stripe.
- No emoji and no em-dash in visible text.
- No purple-family color (hue 250 to 320 with meaningful chroma) in any computed color or background.
- Form rows: every control in the same row has identical height and top offset, and every control is at least 44px tall.
- Cards in a row share height, and no card has a blank band taller than its content by more than the threshold.
- No horizontal overflow (`scrollWidth <= innerWidth`) at every width.
- Eyebrow heuristic: small uppercase letter-spaced text directly above a heading is flagged.
- `overlap`: no text, icon, or component box intersects a sibling's box (overlay layers excluded).
- `overflow-parent`: no child extends past its parent's box unless the parent is a scroll container.
- `clipped-text`: no text is cut off by its box without an ellipsis and a reachable full value.
- `icon-text-collision`: no icon inside a control touches or overlaps the control's text.
- `form-width-cap`: from 1024px no text input, select, or textarea outside a table, grid, or toolbar is wider than 640px. A wider field means the frame skipped region width budgets.
- `mobile-app-shell`: below 640px the screen has a pinned top header and a bottom tab bar of 3 to 5 destinations, each at least 44 by 44 (use the shared `AppShell`).

`FAIL` lists each violation with selector, width, and measured values: fix every one and re-run. `SKIPPED` (Chrome not found) is never a PASS: set `CHROME_PATH` or install Chrome and re-run; if that is impossible, report the screen as not verified. The audit proves the mechanical floor; the self-critique, the JEV verdict, and your own eyes on the 375 and 1280 screenshots prove the taste.

## Audit checklist: fine-tuning or refactoring an existing frontend

Run top to bottom on any existing screen or component before or during a redesign pass. Fix drift from the token tables first, then layout and UX gaps; never rewrite when a tune closes the gap.

- [ ] Tidiness first: nothing overlaps a sibling, nothing sticks out of its parent, right edges of stacked regions line up, no silently clipped text, no icon touching control text, every row fits its container at 320px (`ui_audit`: `overlap`, `overflow-parent`, `clipped-text`, `icon-text-collision` all clean).
- [ ] Hard law first. The default background is white, off-white, broken white, or light beige (page `#fafaf9`, cards white), never dark or colored; a dark theme exists only when explicitly requested (warm near-black like `#171412`, never pure `#000`, never OS-triggered).
- [ ] No gradients anywhere (background, fill, text, border, mask, scroll fade, state overlay).
- [ ] No shadows anywhere. Depth is tonal layers plus hairlines; focus is an outline or a spread-only ring.
- [ ] No side line on any card, panel, notice, row, nav item, or tab: no thick or colored side border, no top or bottom accent bar, no inset stripe, no pseudo-element bar, no active underline.
- [ ] No decorative lines, connectors, or marker dots. No emoji. No em-dash in copy or code comments. No eyebrow labels, no neon, no glow, no fake grain or blur-blob decoration.
- [ ] At most one accent hue, roughly 3% or less of any viewport, never purple, violet, or indigo, never filling a large surface, never a giant colored stat number.
- [ ] Every section has a written concept (job, message, action, container). Sections with no job are gone. Adjacent sections differ in structure.
- [ ] Each region uses the lightest container that groups; records are rows, not card soup; no cards in cards; one left content line per region; grouping survives with borders removed.
- [ ] Every font size maps to a type token; weights are 400, 500, 600 only, two per screen, three at most.
- [ ] Every spacing value maps to the 4px scale. Every radius maps to the radius table by component tier.
- [ ] Every control is `--control-h` (44px); every control in a row has the same measured height and top offset; helper slots reserve space; control boundaries use `--color-border-control` (3:1), cards and dividers keep the light hairline.
- [ ] Every color references a token; status colors appear only for real state, with an icon and a word.
- [ ] Grid rows are fully occupied at every breakpoint; cards in a row share one shape; repeated elements sit on one baseline; no internal void and no fake-fill.
- [ ] The screen has a working mobile app-shell below 640px (sticky header, independent scroll region, bottom tab bar), not a shrunk desktop layout; no horizontal scroll at 320, 375, 414, 768, 1280.
- [ ] Icons come from koboyo first, reicon.dev only as fallback, all through the shared `Icon` component.
- [ ] One primary action is visually obvious per screen and per section; everything else is clearly secondary or tertiary.
- [ ] Every interactive element has all eight states, hover gated by `@media (hover: hover)`, disabled without hover or pressed.
- [ ] Contrast passes AA for every text and icon element; control boundaries and focus indicators reach 3:1.
- [ ] Every touch target on mobile is 44x44px or larger with at least 8px between neighbors.
- [ ] Empty, loading (skeleton, no layout shift), and error states exist and are deliberately designed for every view that can hit them.
- [ ] Motion uses the duration and easing tokens, transform and opacity only, exits shorter than entrances, reduced motion honored.
- [ ] JEV decisions for every point that ran are logged (or stamped `UNVERIFIED BY JEV`), and the final verdict is 2 or higher.
- [ ] `docs/design/direction.md` exists with its seed key, and the finish disposition is `ship` (or the open table went to Brian after round 3, with the last critic scores).
- [ ] The craft floor holds (`craft.md` section 2): measure, tracking tokens, heading rhythm, browser surfaces, tabular numerals, and none of the section 3 bans.
- [ ] `ui_audit` reports PASS at every width, and the 375 and 1280 screenshots have been looked at.
