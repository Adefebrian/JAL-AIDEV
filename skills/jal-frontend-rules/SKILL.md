---
name: jal-frontend-rules
description: Concrete JAL frontend recipes on the v0.3.0 core tokens. No overlap law and its prevention CSS, mobile-first app-shell, Bento Grid, rows-vs-bento, card, form-control, button, and status/notification (no side stripe) recipes, banned visual patterns (overlap, em-dash, eyebrow, glow, neon, gradients, shadows, side lines, emoji, decorative lines, dark default backgrounds), white-first palette, koboyo/reicon icon sourcing, spacing checklist. Use when building or reviewing any JAL frontend, React UI, or Bento layout.
---

# JAL Frontend Rules

Detail layer for the frontend law in `jal-standards` and the system in `jal-ui-taste`. Read those first; this file does not re-derive them, it operationalizes them as copyable recipes. Every value below is a token from `jal-ui-taste` (Core tokens), declared in `packages/ui/src/tokens.css`. If a recipe needs a value that is not a token, the recipe is wrong.

Every recipe is mobile-first: base styles are the phone, `min-width` queries add tablet (640px) and desktop (1024px). No recipe uses a shadow, a gradient, or a side border, and no recipe lets anything overlap or stick out.

## No overlap law (tidiness rule number 1)

Absolute, as hard as the side-line ban. No element (text, icon, or component) overlaps a sibling; only true overlay layers (dialog, menu, tooltip, popover, listbox, bottom sheet) stack, inside their own layer. No child extends outside its parent's box unless the parent is an explicit scroll container. Right edges of stacked regions line up. No clipped text without a deliberate ellipsis and the full value reachable. Icons inside controls get reserved padding. Rows fit their container. The real failure this exists for: a three-field row wider than its container, with the Country select sticking out past the right edge of the info box and of the cards above and below it.

Prevention recipe, applied globally in `packages/ui`:

```css
*, *::before, *::after { box-sizing: border-box; }

/* Every grid and flex child may shrink below its content width. */
:where(.grid, .bento, .field-row, .row, .stack, .cluster) > * { min-width: 0; }

/* Tracks shrink; never bare 1fr, never fixed px columns. */
.grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-16px); }

/* Controls fill their track, never their content. */
:where(input, select, textarea, .btn-block) { width: 100%; max-width: 100%; }

/* Media never pushes out of its box. */
:where(img, video, canvas, svg, iframe) { max-width: 100%; height: auto; }

/* Long words and URLs wrap inside their box. */
:where(h1, h2, h3, h4, p, li, dd, td, .row-title) { overflow-wrap: anywhere; }

/* Deliberate truncation only: ellipsis plus the full value in title or aria-label. */
.truncate { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

/* The only boxes allowed to hold wider content scroll it inside themselves. */
.scroll-x { overflow-x: auto; overscroll-behavior-x: contain; max-width: 100%; }

/* Icon lanes inside controls: icon size (20px) plus a 12px gap, reserved. */
.control-icon-start { padding-inline-start: var(--space-40px); }
.control-icon-end   { padding-inline-end: var(--space-40px); }
.control-wrap { position: relative; }
.control-wrap > .icon { position: absolute; top: 50%; translate: 0 -50%; pointer-events: none; }
.control-wrap > .icon-start { inset-inline-start: var(--space-12px); }
.control-wrap > .icon-end   { inset-inline-end: var(--space-12px); }
.control-wrap > :is(input, select) { text-overflow: ellipsis; }
```

- A field row with N fields is `repeat(N, minmax(0, 1fr))` only at a width where N fields fit at 44px tall with readable values; below that it is 1 or 2 columns. Never a fixed `width` or `min-width` on a field, a select, or a card that can exceed 320px.
- Stacked regions (info box, cards above and below) share one container with one inline padding, so their left and right edges are the same line. Never widen one region with a negative margin.
- `position: absolute` is for icon lanes, overlays, and badges on avatars only; an absolutely positioned element always has a reserved lane in its parent so it cannot sit on top of text.
- No negative margins that pull an element over a sibling. No `z-index` stacking inside page content; stacking belongs to overlay layers.
- `ui_audit` reports `overlap`, `overflow-parent`, `clipped-text`, and `icon-text-collision` at 320, 375, 414, 768, and 1280. Any hit is fixed in layout, not hidden with `overflow: hidden` on the parent.

## Mobile app-shell pattern

Mobile is not "the desktop site, but narrower." Below 640px ship a dedicated app-like shell, built before any tablet or desktop layout:

```
┌─────────────────────┐
│  Status/header bar  │  <- sticky, safe-area-inset-top
├─────────────────────┤
│                      │
│   Scrollable content │
│                      │
├─────────────────────┤
│  Bottom tab bar      │  <- fixed, safe-area-inset-bottom
└─────────────────────┘
```

```css
.shell { min-height: 100dvh; background: var(--color-page); color: var(--color-ink); }
.shell-header {
  position: sticky; top: 0; z-index: 10;
  padding: calc(var(--space-8px) + env(safe-area-inset-top)) var(--space-16px) var(--space-8px);
  background: var(--color-page);
  border-bottom: 1px solid var(--color-border);   /* structural divider, full width, neutral */
}
.shell-main { padding: var(--space-16px); padding-bottom: calc(var(--control-h) + var(--space-24px) + env(safe-area-inset-bottom)); }
.tabbar {
  position: fixed; inset-inline: 0; bottom: 0; z-index: 10;
  display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr);
  padding: var(--space-4px) var(--space-8px) calc(var(--space-4px) + env(safe-area-inset-bottom));
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);      /* structural divider, full width, neutral */
}
.tabbar a {
  display: grid; justify-items: center; align-content: center; gap: var(--space-2px);
  min-height: var(--control-h); border-radius: var(--radius-8);
  font-size: var(--text-n1); line-height: var(--line-n1); color: var(--color-ink-muted);
}
.tabbar a[aria-current="page"] { background: var(--color-layer-2); color: var(--color-ink); font-weight: var(--weight-semibold); }
@media (min-width: 640px) {
  .tabbar { display: none; }
  .shell-main { padding: var(--space-24px); }
}
```

- Bottom tab bar (3 to 5 items max) replaces top nav on mobile. Fixed position, `padding-bottom: env(safe-area-inset-bottom)`, icon + label per tab, active state via tonal fill, ink, and weight, never an underline or a side bar.
- Content area scrolls independently of the shell; header and tab bar never scroll away unless the interaction explicitly calls for it (e.g. hide-on-scroll for a feed).
- Touch targets minimum 44x44px. No hover-only affordances on mobile, every interactive element needs a visible resting state.
- Use `100dvh` (dynamic viewport height), never bare `100vh`, to avoid mobile browser chrome jump.
- At 640px the top nav returns and the tab bar drops; at 1024px a side nav is allowed.

## Rows vs Bento: pick the container per region

Decided before markup, per region, by `jev_decide` using the layout doctrine in `jal-ui-taste`. The short version:

| The region holds | Container |
|---|---|
| Many records of one shape (orders, users, files, logs, messages) | `rows` |
| Mixed summary content of different kinds (KPIs, a chart, a short list, a status, an action) | `bento` |
| A long sequence of related groups read top to bottom (settings, profile) | `divided-section` |
| One self-contained widget or a hard boundary | `card` |
| A few tightly related items, a hero, prose | `plain-spacing` |

Records inside a Bento tile still render as rows. Never cards inside cards, never card soup for records.

### Rows recipe

```css
.rows {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  overflow: clip;
}
.row {
  display: grid; grid-template-columns: minmax(0, 1fr) auto;
  align-items: center; gap: var(--space-12px);
  min-height: var(--control-h);                    /* phone and tablet floor */
  padding: var(--space-12px) var(--space-16px);
}
.row + .row { border-top: 1px solid var(--color-border); }   /* full-width neutral divider between records */
.row-title { font-size: var(--text-0); line-height: var(--line-0); font-weight: var(--weight-medium); overflow-wrap: anywhere; }
.row-meta  { font-size: var(--text-n1); line-height: var(--line-n1); color: var(--color-ink-muted); }
@media (hover: hover) { a.row:hover, button.row:hover { background: var(--state-hover); } }
.row[aria-selected="true"] { background: var(--color-layer-2); }   /* tonal fill, never a side stripe */

/* Desktop density, 1024px and up only. One density per table. */
@media (min-width: 1024px) {
  .rows[data-density="compact"] .row     { min-height: var(--control-row-h-compact);     padding-block: var(--space-6px); }
  .rows[data-density="default"] .row     { min-height: var(--control-row-h-default);     padding-block: var(--space-12px); }
  .rows[data-density="comfortable"] .row { min-height: var(--control-row-h-comfortable); padding-block: var(--space-16px); }
}
```

- One left content line: every row's first column starts at the same inline offset as the region header above it.
- Rows are top-to-bottom with no gap between them; the divider is the only separator. Never `space-between` rows to fill a container.
- Wide tables below 1024px reflow to stacked rows (title, then meta line), never a horizontally scrolling page.

## Bento Grid recipes

The container for mixed summary content. A Bento layout is a CSS grid of unevenly sized cards that tile with zero leftover space, no exceptions for "it looked fine with a gap."

Base recipe (mobile-first):

```css
.bento {
  display: grid;
  grid-template-columns: minmax(0, 1fr);            /* phone: one column */
  grid-auto-rows: auto;                             /* rows follow content: a fixed floor opens a void in a short tile */
  gap: var(--space-16px);
}
@media (min-width: 640px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bento-lg, .bento-wide { grid-column: span 2; }
}
@media (min-width: 1024px) {
  .bento { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .bento-lg   { grid-column: span 2; grid-row: span 2; }
  .bento-wide { grid-column: span 2; grid-row: span 1; }
  .bento-tall { grid-column: span 1; grid-row: span 2; }
  .bento-sm   { grid-column: span 1; grid-row: span 1; }
}
```

Rules:
- Every row must be fully occupied. If the card count does not tile evenly, resize one card (span 2 instead of 1) rather than leave dead space.
- Cards in a grid must share ONE consistent shape (this is fatal to get wrong). Cards in a row are equal height (`grid-auto-rows: 1fr` or grid stretch). Any repeated internal element (a code block, a CTA, a price, a meta row) is pinned to the same baseline in every card: make the card `display:flex; flex-direction:column` and give that shared element `margin-top:auto` so it rests on one line across the row. Variable content is constrained so it cannot reshape the card: one-line code is `white-space:nowrap; overflow:hidden` on the row with `overflow-x:auto` (scrolls, never wraps to a taller block); long text is clamped or absorbed by the bottom-pinned row. A grid must read as one system, never a pile of different-shaped cards.
- No empty void inside a card, and never fake-fill with stretched gaps (both equally fatal). A card must never be taller than its content, but never spread content to fill either: `justify-content:space-between` or `flex-grow` on list rows makes huge uneven gaps, which is chaotic and just as bad as a void. Rules: list/rows use ONE fixed gap token, top-aligned, never stretched; only a genuinely stretchable visual (chart body, image, map) may `flex:1` to fill height; a card's height follows its content, so do not give a text/list card a row span it cannot naturally fill. When mixing a tall chart with short lists, put the chart in its own full-width band and lay the short cards in an even row of similar natural height, rather than forcing the lists to span the chart's height. Any empty band OR any oversized row gap is a bug, fix the layout, do not stretch.
- Use `grid-template-areas` for hero-style asymmetric layouts (one big feature card plus small utility cards) instead of manually counting spans when the layout is bespoke.
- Never mix gap sizes within one grid. One `gap` value per breakpoint.
- Card corner radius, padding, and border weight must be identical across every card in a given grid. Visual weight varies only by size and content, never by inconsistent chrome, and never by a colored edge on one card.
- Collapse to a single column on mobile; do not shrink a 4-column grid down proportionally, it produces cramped unreadable cards.

### Card recipe

```css
.card {
  display: flex; flex-direction: column; gap: var(--space-12px);
  padding: var(--space-24px);
  background: var(--color-surface);
  border: 1px solid var(--color-border);          /* all four sides, same weight, same color */
  border-radius: var(--radius-12);
  min-width: 0;
}
.card-title { font-size: var(--text-1); line-height: var(--line-1); font-weight: var(--weight-semibold); }
.card-body  { font-size: var(--text-0); line-height: var(--line-0); color: var(--color-ink-muted);
              display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card-list  { display: grid; gap: var(--space-8px); align-content: start; }   /* one fixed gap, top-aligned */
.card-visual { flex: 1; min-height: 160px; }                                 /* only real visuals flex-fill */
.card-foot  { margin-top: auto; }                                            /* shared element on one baseline */
.card-code  { white-space: nowrap; overflow-x: auto; font-size: var(--text-n1); line-height: var(--line-n1);
              padding: var(--space-8px) var(--space-12px); background: var(--color-layer-1); border-radius: var(--radius-8); }
@media (hover: hover) { a.card:hover { background: var(--state-hover); } }     /* state layer, never a lift */
.card[aria-selected="true"] { outline: 2px solid var(--color-focus); outline-offset: calc(var(--space-2px) * -1); }   /* full ring, never a stripe */
```

- No `box-shadow` on a card in any state. No colored border on one side. No top accent bar. Depth is `surface` on `page` plus the hairline.
- A metric in a card is ink at `--text-4` or `--text-5` with an ink-muted `--text-n1` label, never a giant colored numeral.

## Form controls: normalize or it looks amateur

Native `input`, `select`, `textarea`, and `input type="date"` size themselves differently. Unnormalized, they render at different heights in one row. Required:

```css
.field input,
.field select,
.field input[type="date"],
.field input[type="time"] {
  box-sizing: border-box;
  width: 100%;
  height: var(--control-h);                        /* 44px, every control, every width */
  padding: 0 var(--space-12px);
  font: inherit;
  font-size: var(--text-0);                        /* 16px: below 16px iOS zooms on focus */
  line-height: var(--line-0);
  border: 1px solid var(--color-border-control);   /* all four sides, 3:1 boundary */
  border-radius: var(--radius-8);
  background: var(--color-surface);
  color: var(--color-ink);
  transition: border-color var(--dur-150) var(--ease-standard), background-color var(--dur-150) var(--ease-standard);
}

.field select,
.field input[type="date"],
.field input[type="time"] {
  -webkit-appearance: none;                        /* platform chrome silently adds height */
  appearance: none;
}

.field textarea { box-sizing: border-box; width: 100%; min-height: calc(var(--control-h) * 2); padding: var(--space-12px); font: inherit; font-size: var(--text-0); }

/* Chevron is a real Icon inside the field, never a decorative bar. */
.select-wrap { position: relative; }
.select-wrap select { padding-inline-end: var(--space-40px); text-overflow: ellipsis; }   /* reserved icon lane, value never runs under the chevron */
.select-wrap .icon { position: absolute; inset-inline-end: var(--space-12px); top: 50%; translate: 0 -50%; pointer-events: none; color: var(--color-ink-muted); }

/* States */
@media (hover: hover) { .field :is(input, select, textarea):enabled:hover { background: var(--state-hover); } }
.field :is(input, select, textarea):focus-visible { border-color: var(--color-ink); outline: 2px solid var(--color-focus); outline-offset: 2px; }
.field :is(input, select, textarea)[aria-invalid="true"] { border-color: var(--color-danger); }
.field :is(input, select, textarea):disabled { background: var(--state-disabled-container); color: var(--state-disabled-content); cursor: default; }

/* A row of fields: equal tracks, TOP-aligned, helper slot reserves space so a
   validation error never shifts the layout. Use `start`, never `end`: bottom
   anchoring lets a two-line error in one field push that control up relative
   to its neighbors, recreating the misalignment this rule prevents. */
.field-row { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-16px); align-items: start; }
@media (min-width: 768px) { .field-row { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.field { display: grid; gap: var(--space-6px); align-content: start; }
.field-label { font-size: var(--text-n1); line-height: var(--line-n1); font-weight: var(--weight-medium); color: var(--color-ink); }
.field-hint { min-height: var(--line-n1); font-size: var(--text-n1); line-height: var(--line-n1); color: var(--color-ink-muted); }
.field-hint[data-state="error"] { color: var(--color-danger); }
```

- Every control in a row must report the SAME computed height and SAME top offset. Measure with `getBoundingClientRect()` before shipping, do not eyeball it; `ui_audit` checks it at every width. A 13px height difference between an input and a select is the classic botched form.
- Supply your own select chevron (an `Icon` positioned inside the wrapper), never a decorative bar.
- Validation changes color and text only, never layout. An error is a red border plus an error message with an icon, never color alone.

## Buttons: eight states

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-8px);
  box-sizing: border-box; height: var(--control-h); padding: 0 var(--space-16px);
  font: inherit; font-size: var(--text-0); line-height: var(--line-0); font-weight: var(--weight-medium);
  white-space: nowrap;                               /* a clickable target never wraps to two lines */
  border: 1px solid var(--color-border-strong); border-radius: var(--radius-8);
  background: var(--color-surface); color: var(--color-ink);
  transition: background-color var(--dur-150) var(--ease-standard), transform var(--dur-100) var(--ease-standard);
}
.btn-primary { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-primary-contrast); }
@media (hover: hover) {
  .btn:enabled:hover { background: var(--state-hover); }
  .btn-primary:enabled:hover { background: var(--color-primary-hover); }
}
.btn:enabled:active { transform: scale(0.98); background: var(--state-pressed); }
.btn-primary:enabled:active { background: var(--color-primary-active); }
.btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }      /* instant, never animated */
.btn:disabled, .btn[aria-disabled="true"] { background: var(--state-disabled-container); border-color: transparent; color: var(--state-disabled-content); cursor: default; transform: none; }
.btn[aria-busy="true"] { cursor: progress; }        /* loading: spinner replaces the leading icon, width does not change */
.btn[data-state="error"] { border-color: var(--color-danger); color: var(--color-danger); }
.btn[data-state="success"] { border-color: var(--color-success); color: var(--color-success); }
@media (prefers-reduced-motion: reduce) { .btn { transition: opacity var(--dur-150) linear; } .btn:enabled:active { transform: none; } }
```

- One primary button per section. Destructive actions confirm first. Navigation is a link, not a button.
- Error and success states pair the color with an icon and a word in the label or next to it.

## Status and notification: no side stripe, ever

The Carbon-style left-border notice is banned. A status notice is an icon, a title that names the state, a tonal surface, and one full hairline border on all four sides.

```html
<div class="notice" data-tone="warning" role="status">
  <Icon name="alert-triangle" class="notice-icon" aria-hidden="true" />
  <div class="notice-body">
    <p class="notice-title">Payment method expires soon</p>
    <p class="notice-text">Update the card before 30 October to avoid a failed renewal.</p>
  </div>
  <button class="notice-close" aria-label="Dismiss"><Icon name="x" aria-hidden="true" /></button>
</div>
```

```css
.notice {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start;
  gap: var(--space-12px); padding: var(--space-16px);
  background: var(--notice-surface);
  border: 1px solid var(--notice-border);          /* ONE shorthand, all four sides identical */
  border-radius: var(--radius-12);
}
.notice[data-tone="info"]    { --notice-fg: var(--color-info);    --notice-surface: var(--color-info-surface);    --notice-border: var(--color-info-border); }
.notice[data-tone="success"] { --notice-fg: var(--color-success); --notice-surface: var(--color-success-surface); --notice-border: var(--color-success-border); }
.notice[data-tone="warning"] { --notice-fg: var(--color-warning); --notice-surface: var(--color-warning-surface); --notice-border: var(--color-warning-border); }
.notice[data-tone="danger"]  { --notice-fg: var(--color-danger);  --notice-surface: var(--color-danger-surface);  --notice-border: var(--color-danger-border); }
.notice-icon  { color: var(--notice-fg); margin-top: var(--space-2px); }
.notice-title { font-size: var(--text-0); line-height: var(--line-0); font-weight: var(--weight-semibold); color: var(--color-ink); }
.notice-text  { font-size: var(--text-n1); line-height: var(--line-n1); color: var(--color-ink-muted); }
.notice-close { min-width: var(--control-h); min-height: var(--control-h); border-radius: var(--radius-8); }   /* 44px target inside the notice box, no negative margin */
```

- `--color-<status>-border` is the derived token from `jal-ui-taste` (`color-mix(in oklab, var(--color-<status>) 24%, var(--color-border))`); declare it in `tokens.css` if it is missing.
- Carbon's own notifications, tabs, and tiles use side stripes (`border-inline-start` 6px and 3px, tab stripes, inset tile shadows). When the Carbon lens is active, port its anatomy and severity model only; the stripe is always shed.
- Never: `border-left: 4px solid var(--color-warning)`, `border-inline-start` in a status color, `box-shadow: inset 4px 0 0 ...`, a `::before` bar, a colored top strip, or a status dot beside the title.
- Toasts use the same anatomy on `--color-surface` with a `--color-border-strong` hairline, no shadow, entering with opacity and a short transform per `jal-motion`, and `role="status"` (or `role="alert"` for errors).
- Inline field errors are not notices: they live in the field's reserved hint slot.

## Banned looks

Hard rejects, no exceptions without Brian's sign-off:

- Overlap of any kind: an element over a sibling, a child sticking out of its parent, silently clipped text, an icon touching control text, a row wider than its container. See No overlap law.
- Em-dash character anywhere in copy or code comments in frontend files. Use a comma, colon, or period.
- Eyebrow labels (small uppercase kicker text above a heading, e.g. "FEATURES" above "Everything you need"). Delete it, let the heading stand alone.
- Glow effects (`box-shadow` with large blur + saturated color, `filter: drop-shadow` halos).
- Shadows of any kind: any `box-shadow` with a blur radius above 0, `filter: drop-shadow`, elevated cards, menus, toasts, or dialogs. Only a spread-only focus ring (`0 0 0 Npx`) is allowed, and `outline` is preferred.
- Side lines on any card or panel: `border-left`, `border-right`, `border-inline-start`, `border-inline-end` wider than 1px or colored differently from the other sides, `box-shadow: inset` stripes, pseudo-element bars, top or bottom accent bars, active-tab underlines.
- Neon color accents, oversaturated pinks/cyans/purples used as decoration rather than semantic state. Any purple, violet, or indigo accent.
- Dark or colored default backgrounds. The default background is always white, off-white, broken white, or light beige. Black is ink only; a dark background is allowed only inside a dedicated, explicitly requested dark mode, never as the light default and never auto-triggered from the OS color scheme.
- Gradients of any kind, anywhere (background, fill, text, border, mask, scroll fade, hover overlay). Flat neutral surfaces only.
- Emoji or emoticons anywhere in UI copy, headings, labels, buttons, or empty states. Use a real koboyo/reicon icon instead.
- Decorative lines and marks: connector lines drawn between cards/tiers/sections, side/top/bottom accent stripes on panels or cards, and marker dots/squares/glyphs beside a heading or label. Group and rank with spacing, order, and type, not drawn lines. Only functional hairline neutral dividers between structural regions are allowed.
- Any other now-common AI-slop pattern: gratuitous blur blobs in the background, fake grain overlays, decorative squiggles with no meaning, re-drawn fake browser or phone chrome. If it does not communicate information or hierarchy, cut it.

## Icons

1. Query the koboyo MCP first for every icon need. It is bundled with the plugin and free to call.
2. Only if koboyo has no match for the concept, fall back to https://reicon.dev/.
3. Never hand-draw or hand-pick a third icon source. Consistency of icon family matters more than finding the "perfect" glyph. No lucide, no Material Symbols.
4. Wrap icons in a shared `Icon` component (`packages/ui`) so size, stroke width, and color token are enforced centrally, not per usage.

## Gradients: banned

- No gradients in any JAL project, of any kind, anywhere: no gradient background, fill, text, border, mask, or overlay. Gradients read as slop. Use a flat, considered solid color or a tonal layer step instead, always.
- This overrides the old feralui.dev-only allowance. There is no gradient exception without Brian's explicit sign-off.

## Spacing/sizing consistency checklist

Before shipping any screen, check:

- [ ] One spacing scale for the whole project (the 4px scale: 0/2/4/6/8/12/16/20/24/32/40/48/64/80/96px), no arbitrary values like `13px` or `22px`.
- [ ] Card padding is identical across all cards of the same tier (bento-lg vs bento-sm may differ, but every bento-sm shares one padding value).
- [ ] Section vertical rhythm (space between major page sections) is a single repeated value, not ad hoc per section.
- [ ] No large empty gaps: every visible whitespace block should be intentional rhythm, not leftover grid dead space.
- [ ] Border radius uses one scale (4/8/12/16/28px and pill), matched to component tier, not randomly varied.
- [ ] Typography scale is the fixed generated set (11/13/16/19/23/28/33/40/48px with their line tokens), no one-off font-size values inline.
- [ ] Every control and button is 44px (`--control-h`); table row density (40/48/56) appears only at 1024px and up.
- [ ] Nothing overlaps, nothing sticks out of its parent, right edges of stacked regions line up, every row fits at 320px.
- [ ] Control boundaries use `--color-border-control` (`#8f8e89`, 3:1); cards and dividers use `--color-border`.
- [ ] Every border is a full four-side hairline or a full-width structural divider; no side lines, no shadows, no gradients.
- [ ] Mobile and desktop share the same spacing tokens; only layout changes by breakpoint, never the token values.
- [ ] `ui_audit` reports PASS at 320, 375, 414, 768, and 1280.
