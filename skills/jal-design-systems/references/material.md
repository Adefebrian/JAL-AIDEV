# Material lens (touch-first consumer, mobile-app feel)

Source: Material Web (`@material/web` v2.5.0, tokens from Material 3 v0.192), in maintenance mode. Research digest `ds-research/material.md`. Paths below are repo-relative to the material-web source; component token files are `tokens/versions/v0_192/_md-comp-*.scss`. Every JAL value is a JAL Core token from `jal-ui-taste`. Knowledge-only: never install `@material/web` or Lit.

Material 3 is the best source for state-layer math, tonal elevation, and touch interaction contracts. Its resting look (purple seed, pill buttons, ripple, shadows) reads as Google system UI. Take the contracts. Leave the skin.

## 1. What to take

### 1.1 State-layer model (`tokens/versions/v0_192/_md-sys-state.scss`)
States are an opacity of the content (on-) color composited over the resting container, never separate hand-picked swatches:

| State | Opacity |
|---|---|
| hover | 0.08 |
| focus | 0.12 |
| pressed | 0.12 |
| dragged | 0.16 |
| disabled content | 0.38 |
| disabled container | 0.12 |

Every interactive component repeats the same keys (`hover-*`, `focus-*`, `pressed-*`, `disabled-*`) with these constants, so one formula keeps every state consistent. This is the JAL state-layer table. The state-layer color is always the content color of that component: `ink` over light containers, `surface` over an `ink`-filled button.

### 1.2 State layer as a decoupled part
Ripple, focus ring, and elevation are small sibling elements attached to any control (`ripple/`, `focus/`, `docs/components/ripple.md`). JAL keeps the pattern as one reusable state-layer utility (a `::before` flat fill whose opacity is set per state), so states are consistent and can be tuned in one place. The ripple visual itself is not taken.

### 1.3 Tonal surface ladder (`tokens/versions/v0_192/_md-sys-color.scss`)
Depth is communicated by flat neutral steps, not shadow: surface (neutral98), surface-container-lowest (neutral100), low (neutral96), container (neutral94), high (neutral92), highest (neutral90). JAL keeps the ladder concept and maps it to `page`, `surface`, `layer-1`, `layer-2`, each seam marked with a hairline.

### 1.4 Component token contracts
Every token is a CSS custom property with an inline fallback (`var(--md-sys-color-primary, #6750a4)`, `tokens/_md-sys-color.scss` L79-90), so a scoped override reskins a subtree without JS or a build step and nothing breaks when a var is unset. JAL tokens follow the same `var(--token, fallback)` shape with JAL values. Component-level tokens map to system tokens by default and are overridable one by one.

### 1.5 Soft-disabled
Disabled but still keyboard-focusable, announced as disabled (`docs/components/button.md` L737, WAI-ARIA APG). JAL rule: any disabled control whose reason must be explained stays focusable with `aria-disabled` and a reachable reason.

### 1.6 Composite type roles
Five roles by three sizes, each fully specified (family, size, line height, weight, tracking), shipped as utility classes (`tokens/versions/v0_192/_md-sys-typescale.scss`, `docs/theming/typography.md`). JAL keeps the discipline: every text style resolves to one named role, never an arbitrary size.

### 1.7 Touch and a11y semantics
- Focus ring follows `:focus-visible` exactly, keyboard only, never on pointer press (`docs/components/focus-ring.md`).
- Every icon-only or unlabeled control requires an explicit `aria-label`.
- Dialog labelled by its headline or `aria-label`; `type="alert"` maps to `alertdialog`.
- List and item roles are settable (`role="list"` with `tabindex="-1"`, items `role="listitem"` with `tabindex="0"`).
- Switch handle grows on press (16 unselected, 24 selected, 28 pressed, `docs/components/switch.md`): a pressed state that is visible without color. JAL renders it as a `transform: scale()` on the handle.
- Fixed color roles that stay constant across themes (`primary-fixed`), useful for chart legends and brand marks.

## 2. Translation table (Material to JAL Core)

| Material | Value (source) | JAL Core |
|---|---|---|
| primary (seed) | #6750a4 (`_md-ref-palette.scss` L73) | `ink` #1b1b1b; optional brand accent, never purple family |
| on-primary | #fff | `surface` #ffffff |
| primary-container, secondary-container | #eaddff, #e8def8 | `layer-2` #efefed with `ink` content |
| background, surface | neutral98 | `page` #fafaf9 |
| surface-container-lowest | neutral100 | `surface` #ffffff |
| surface-container-low, container | neutral96, neutral94 | `layer-1` #f5f5f4 |
| surface-container-high, highest | neutral92, neutral90 | `layer-2` #efefed |
| on-surface | #1d1b20 | `ink` #1b1b1b |
| on-surface-variant | #49454f | `ink-muted` #474747 |
| outline | #79747e | `border-strong` #d4d4d1; focus steps to `ink` |
| outline-variant | #cac4d0 | `border` #e5e5e3 |
| error | #b3261e | JAL danger status token |
| State layers | 0.08, 0.12, 0.12, 0.38, 0.12 | same: `color-mix(in oklab, var(--ink) N%, var(--surface))` |
| Display L, M, S | 57/64, 45/52, 36/44 at 400 | 48/56, 40/48, 33/40 at 400 or 500 |
| Headline L, M, S | 32/40, 28/36, 24/32 at 400 | 33/40, 28/36, 23/32 at 600 |
| Title L, M, S | 22/28 400, 16/24 500, 14/20 500 | 19/28 600, 16/24 500, 13/20 500 |
| Body L, M, S | 16/24, 14/20, 12/16 | 16/24, 16/24 (mobile never below 16 for body), 13/20 |
| Label L, M, S | 14/20, 12/16, 11/16 at 500 (prominent 700) | 16/24 500 on buttons, 13/20 500, 11/16 500 (tab bar labels only); 700 becomes 600 |
| Tracking | 0.00625 to 0.03125rem | 0 |
| Shape none, xs, sm, md, lg, xl, full | 0, 4, 8, 12, 16, 28, 9999 (`_md-sys-shape.scss`) | 4, 8, 12, 16, 28, 9999; role assignment per `jal-ui-taste`, never Material's per-component mapping |
| Button height | 40 | 44 |
| Durations short2, short3, short4, medium2 | 100, 150, 200, 300 (`_md-sys-motion.scss`) | 100, 150, 200, 300 |
| medium4, long4 | 400, 600 | showcase only: 400, 600 |
| Easing standard, emphasized | `(0.2, 0, 0, 1)` | `cubic-bezier(0.24, 1, 0.4, 1)` |
| Window size classes | 600, 840, 1200, 1600 (spec only, not in the repo) | 640, 768, 1024, 1280, 1536 |
| Spacing | none exposed as tokens | JAL 4px scale |
| Focus ring width | 3px (`--md-focus-ring-width`) | `outline` in ink per `jal-ui-taste`, instant |
| Icons | Material Symbols ligatures | koboyo first, reicon.dev fallback |
| Typeface | Roboto | JAL system stack |

## 3. Conflicts to shed (with exact JAL replacement)

| Material behavior | JAL replacement |
|---|---|
| **Purple seed `#6750A4`** and the whole primary, secondary, tertiary palette generated from it (primary10 #21005d to primary90 #eaddff) | Never import or reference any Material palette literal. Primary = `ink`. A project may re-seed a tonal method with one non-purple brand accent. Containers use JAL neutrals |
| **Ripple** (`<md-ripple>`), a spreading circular ink fill on press | Flat state layer: opacity 0.12 fill of the content color over the container + `transform: scale(0.98)` on the control, no expanding circle |
| **Shadow elevation** levels 0 to 5 as dp shadows (`_md-sys-elevation.scss`: 0, 1, 3, 6, 8, 12), `<md-elevation>`, shadow appearing on hover (`hover-container-elevation: level1` on filled and tonal buttons), FAB at level3 (hover level4), menu level2, dialog level3, navigation bar level2 | Tonal step + hairline only. Hover changes the state layer, never adds depth. Floating surfaces = `surface` + 1px `border-strong`; the FAB-equivalent separates by `ink` fill contrast |
| Elevated button and elevated chip variants | Dropped; use secondary (`layer-2`) or outline (1px `border-strong`) |
| Dark scheme as a first-class, often OS-selected scheme (surface neutral6 #141218) | Light only by default. Dark only behind an explicitly requested toggle, never `prefers-color-scheme` |
| Content-derived text field height (varies with variant and supporting text) | Fixed 44 control; supporting and error text render below and never stretch the control |
| Filled text field with top-only radius and an active-indicator underline (`corner-extra-small-top`) | Outlined style only: full 1px border on all sides, one radius on all corners, no bottom indicator bar |
| Floating label animating into the outline | Static label above the field, always visible |
| Per-component radius scale (buttons pill, chips 8, dialog 28, menu 4) | JAL radius by role, one radius per tier product-wide |
| Material Symbols icon font | koboyo first, reicon.dev fallback, SVG with accessible names |
| Navigation bar active indicator as a colored pill in primary-container | Neutral `layer-2` pill behind the icon plus weight 600 `ink` label |

## 4. Component anatomy and state models

All components use the JAL state recipe in `SKILL.md`. Component-specific parts follow.

### Button (filled, tonal, outlined, text)
- **Source contract:** container height 40, shape `corner-full`, icon 18, label `label-large`; outlined `outline-width` 1px; disabled container on-surface at 0.12, content at 0.38 (`_md-comp-filled-tonal-button.scss`, `_md-comp-outlined-button.scss`, `_md-comp-text-button.scss`).
- **JAL anatomy:** optional leading icon (20) + label (16 / 500) + optional trailing icon; spinner replaces the leading icon while loading.
- **Variants:** filled = `ink` container, `surface` content (primary, one per view); tonal = `layer-2` container, `ink` content (secondary); outlined = `surface` container + 1px `border-strong`, `ink` content; text = transparent, `ink` content, used for low-emphasis and inline actions. Elevated is dropped.
- **Size:** 44 height, padding inline 16 (12 beside an icon), gap 8, radius per the control role (pill 9999 only if `jal-ui-taste` sets pill buttons product-wide).
- **States:** hover content color at 8% over the container; focus-visible outline; pressed 12% + `scale(0.98)`; disabled container 12%, content 38%, no hover or press; soft-disabled keeps focus with `aria-disabled`; loading width locked + `aria-busy`; error and success shown by the surrounding form or toast, not by recoloring the button.

### TextField (outlined only)
- **Source contract:** outlined `container-shape` corner-extra-small (4), `outline-width` 1px, `focus-outline-width` 2px (`_md-comp-outlined-text-field.scss`).
- **JAL anatomy:** label above > field (optional leading icon, input, optional trailing icon or clear button, optional prefix and suffix text) > supporting text or error text (13) with optional character counter at the end of the same row.
- **Chrome:** 44 height, `surface`, 1px `border-strong` on all sides, control radius, padding inline 12, 16px input text.
- **States:** hover border toward `ink`; focus border `ink` + spread-only `0 0 0 1px` ink (together equal to Material's 2px focus outline, with no layout shift); disabled 38% content, 12% container; error border danger + error icon + message replacing the supporting text, `aria-invalid`; loading spinner in the trailing slot; success check icon after validation. Multiline (textarea) keeps the same chrome, grows from content, and starts at three text lines only where a paragraph is expected.

### Chips (assist, filter, input, suggestion)
- **Source contract:** container height 32, shape `corner-small` (8), flat unselected outline 1px, flat selected outline 0, icon 18 (`_md-comp-filter-chip.scss`).
- **JAL anatomy:** optional leading icon or check (20) + label (13 / 500 or 16 / 500 on mobile) + optional trailing remove button (input chips).
- **Chrome:** 44 tall so a chip row aligns with every other control, radius 8, padding inline 12, chip set gap 8, wraps to new lines, never scrolls the page.
- **Filter chip states:** unselected `surface` + 1px `border-strong`; selected `layer-2` fill, border removed, leading check icon, weight 500 `ink`, `aria-pressed` or checkbox semantics; hover 8%; focus-visible outline; pressed 12%; disabled 38%.
- **Input chip:** trailing remove button is its own focus stop with an accessible name ("Remove Jakarta"), Backspace removes the focused chip.
- **Suggestion chip** (AI prompts, quick replies): tonal `layer-1`, one tap submits, no selected state.
- **Assist chip:** leading icon + action label, behaves as a button.

### List
- **Source contract:** one-line 56, two-line 72, three-line 88 container heights; leading and trailing space 16; leading icon 24, avatar 40, image 56; item container `surface`, shape `corner-none` (`_md-comp-list.scss`).
- **JAL anatomy:** leading slot (icon 24, avatar 40, or image 56) + text block (headline 16 / 500 `ink`, supporting text 13 `ink-muted`, clamped to one or two lines) + trailing slot (meta text, badge, switch, chevron, icon button).
- **Chrome:** rows are flush inside their container (radius belongs to the container, not rows), padding inline 16, padding block 8 to 12, min height 56 for one-line; two and three-line rows grow from content and top-align. Separation is one fixed gap or a 1px `border` divider inset to the text start (Material `divider-leading-space` 16). Never `justify-content: space-between` or `flex-grow` to fill a card.
- **States:** interactive rows get hover 8% (instant), focus-visible outline drawn inward so it never clips, pressed 12%, selected `layer-2` + check or weight 500, disabled 38% on all slots. Loading = skeleton rows of the same height; empty = EmptyState in place of the list.

### Dialog
- **Source contract:** container `surface-container-high`, elevation level3, shape `corner-extra-large` (28), padding 24 with headline to content 16 and actions padding `16px 24px 24px` (`_md-comp-dialog.scss`, `dialog/internal/_dialog.scss` lines 111, 192, 218).
- **JAL anatomy:** optional icon (24) > headline (23 / 600) > supporting content (16, scrolls when long) > actions row (text or tonal secondary, filled primary last, right-aligned on desktop, full-width stacked on mobile).
- **Chrome:** `surface` + 1px `border-strong`, container radius (28 only as a mobile bottom sheet top radius), neutral scrim, no shadow. Hairline dividers appear above and below content only when it scrolls.
- **States:** opening opacity + scale from 0.98 at 200ms; open with focus trapped and labelled by the headline; submitting shows loading on the primary; error inline in the content; closing about 140ms; `type="alert"` becomes `alertdialog` and does not close on scrim tap.
- Full-screen dialog below 640 for multi-field tasks, with a sticky header holding close and the primary action, `safe-area-inset-top` and bottom respected.

### Navigation bar (JAL mobile bottom tab bar)
- **Source contract:** container height 80, `surface-container`, elevation level2, active indicator 64 by 32 `corner-full`, icon 24, inactive icon `on-surface-variant`, active label `on-surface` (`_md-comp-navigation-bar.scss`).
- **JAL anatomy:** fixed to the bottom below 640, 3 to 5 equal-width destinations, each = icon (24) above label (11 / 500 / 16 or 13 / 500 / 20), whole destination is one tap target of at least 44 by 44.
- **Chrome:** `surface`, one 1px `border` hairline on its top edge as the structural boundary with content, height 64 plus `env(safe-area-inset-bottom)` padding, no shadow. Content area pads its bottom by the bar height so nothing hides under it.
- **States:** inactive `ink-muted` icon and label; active = `layer-2` pill 64 by 32 behind the icon (radius 9999) + label weight 600 `ink`, `aria-current="page"`; pressed 12% on the pill area + `scale(0.98)`; focus-visible outline around the destination; badge (count) on the icon carries text, never a bare dot.
- At 640 and up the bar is replaced by a side nav or top nav; the destinations stay the same.

### FAB-equivalent (primary floating action, no shadow)
- **Source contract:** 56 by 56, shape `corner-large` (16), `primary-container`, elevation level3 at rest and level4 on hover, icon 24; extended FAB height 56 with a label (`_md-comp-fab-primary.scss`, `_md-comp-extended-fab-primary.scss`).
- **When:** one dominant create action on a mobile screen (compose, new item). Never more than one per screen. On desktop the action lives in the page header instead.
- **JAL anatomy:** icon (24) with accessible name; extended variant = icon + label (16 / 500), collapsing to icon-only on scroll down.
- **Chrome:** 56 by 56, radius 16, `ink` fill, `surface` icon, 1px `ink` border so its edge stays crisp on any layer, no shadow at any state. Fixed at inset-inline-end 16 and bottom = bar height + 16 + `env(safe-area-inset-bottom)`.
- **States:** hover `surface` at 8% over `ink`; focus-visible outline with offset so it reads on the dark fill; pressed 12% + `scale(0.98)`; disabled 12% container, 38% icon; loading spinner replaces the icon, `aria-busy`; enter and exit by opacity + scale, 200ms in, about 140ms out.

## 5. Product-fit signals

Choose Material as primary or secondary when the brief shows: a phone-first consumer product; thumb-reach navigation with a bottom bar; one dominant create action; list and card browsing; chips for filters, tags, and suggestions; strong tactile press feedback; parity with an existing Android or Material app; user-driven theming as a headline feature.

Do not use it where the brief asks for an editorial or hand-crafted brand feel, or for dense desktop data tools (use Carbon). In a mixed product, Material usually enters as the secondary lens for the below-640 app-shell, list rows, chips, and state-layer math inside an Astryx frame.
