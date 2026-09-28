# Carbon lens (data-dense, enterprise, productivity)

Source: Carbon Design System by IBM, Apache-2.0. Research digest `ds-research/carbon.md`. Paths below are repo-relative to the Carbon source (`packages/themes`, `packages/layout`, `packages/motion`, `packages/type`, `packages/styles/scss/components/*`). Every JAL value is a JAL Core token from `jal-ui-taste`. Knowledge-only: never install `@carbon/react`, `@carbon/styles`, or `@carbon/web-components`, and never compile Carbon Sass.

Carbon is productive over expressive: a density system threaded through every control and table, layer tokens for depth, and a disciplined notification and form model. Take the mechanisms. Leave the square corners, the dark themes, the stripes, and the shadows.

## 1. What to take

### 1.1 Layer model for depth without shadow (`packages/styles/scss/_layer.scss`)
A contextual token set: a nested container increments its layer context and every role token (background, hover, selected, border) resolves to the next step automatically. A card never needs to know which layer it is on. Carbon's white theme flip-flops two tones (background #ffffff, layer-01 #f4f4f4, layer-02 #ffffff, layer-03 #f4f4f4, `packages/themes/src/dtcg/themes.json`). JAL keeps the contextual mechanism with a monotonic ramp: `page` #fafaf9, `surface` #ffffff, `layer-1` #f5f5f4, `layer-2` #efefed, each nesting level stepping once, with hairline borders where two planes meet.

### 1.2 Field and row density (`packages/styles/scss/utilities/_layout.scss`)
- Controls declare a default size plus an allowed min and max band (`layout.use('size', $default: 'md', $min: 'xs', $max: 'lg')`) instead of hardcoding a height; an ancestor class changes context. Carbon sizes: xs 24, sm 32, md 40 (default), lg 48, xl 64, 2xl 80.
- Control height is its own token family, separate from spacing (`container-01..05` 24, 32, 40, 48, 64 in `packages/layout/src/dtcg/layout.json`).
- DataTable density is one modifier driving row height and cell padding together (`data-table/_data-table.scss` lines 625 to 760): xs 24 (padding-block 2), sm 32, md 40 (default), lg 48, xl 64 (padding-block 16, cells `vertical-align: top`).
- JAL keeps the mechanism, not the band: form controls are fixed at 44 everywhere; only desktop table rows (1024 and up) take a density context of compact 40, default 48, comfortable 56.

### 1.3 Productive motion (`packages/motion/src/dtcg/motion.json`)
Productive (UI-internal) versus expressive (hero) is a real split. Productive durations 70, 110, 150, 240; productive standard easing `[0.2, 0, 0.38, 0.9]`. JAL keeps the split (product UI versus showcase in `jal-motion`) and maps to JAL durations and the one JAL easing.

### 1.4 Notification model (`packages/styles/scss/components/notification/`)
Three variants: inline (in-flow), toast (transient, top layer), actionable (carries an action). Anatomy: severity icon + heading + body + optional action + optional close. Background tinted per severity. Status is carried by icon plus tint plus text. JAL keeps this and removes the stripe (section 3).

### 1.5 Form discipline
Label above, field, helper or error row below. Trailing space reserved for an icon at every size (`padding-inline-end: layout.size('height')`, `text-input/_text-input.scss` lines 36, 180). Invalid and warning reuse one geometry with a status color. Read-only is a distinct state.

### 1.6 Type tokens with breakpoint overrides inside the token (`packages/type/src/styles.ts`)
`expressiveHeading05` is 32 by default and steps to 36, 42, 48, 60 across breakpoints inside the token itself, not in ad-hoc media queries. JAL uses the same idea for display sizes only: a display token may step from 33 to 40 to 48 across 640 and 1024, declared once on the token.

### 1.7 Accessibility discipline (`packages/styles/scss/utilities/_focus-outline.scss`, `docs/guides/accessibility.md`)
- Focus as `outline` (never shadow); under `prefers-contrast` the outline switches to dotted for Windows High Contrast Mode. Invalid state reuses the same focus geometry in the danger color.
- Three-tier verification checklist: automated scan, then keyboard-only pass, then screen reader pass.
- Status colors are re-chosen per surface to keep contrast.

### 1.8 Single-source token file
DTCG JSON with every theme value on one line per token (`$extensions["carbon.themes"]`), so theme drift is impossible. JAL's generated token file follows the same one-source discipline.

## 2. Translation table (Carbon to JAL Core)

| Carbon | Value (source) | JAL Core |
|---|---|---|
| background | #ffffff (white theme) | `page` #fafaf9 |
| layer-01, 02, 03 | #f4f4f4, #ffffff, #f4f4f4 | `surface` #ffffff, `layer-1` #f5f5f4, `layer-2` #efefed (monotonic) |
| field-01 | #f4f4f4 | `surface` with 1px `border-strong` (fields sit on white) |
| border-subtle-00 | #e0e0e0 | `border` #e5e5e3 |
| border-strong-01 | #8d8d8d | `border-strong` #d4d4d1; focus steps to `ink` |
| text-primary, text-secondary | #161616, #525252 | `ink` #1b1b1b, `ink-muted` #474747 |
| text-disabled | #161616 at 25% | content at 38% |
| interactive, focus | #0f62fe | `ink` (primary action and focus); optional brand accent, never purple family |
| support error, success, warning, info | #da1e28, #24a148, #f1c21b, #0043ce | JAL desaturated status tokens danger, success, warning, info |
| support-caution-undefined | #8a3ffc | deleted; `ink-muted` + icon |
| overlay | #000000 at 60% | neutral scrim, dialogs only |
| skeleton-background | #e8e8e8 | `layer-2` |
| Spacing 01..13 | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 (`layout.json`) | same steps within 0..96; 160 dropped; add 6 and 20 from JAL |
| Field size md | 40 | 44 |
| Table rows xs, sm, md, lg, xl | 24, 32, 40, 48, 64 | 40 compact, 48 default, 56 comfortable, 1024 and up only |
| Radius | 0 (v11 default), 2, 4, 8, 16, 24, pill | 4, 8, 12, 16, 28, 9999 per `jal-ui-taste` roles |
| Type scale | 12, 14, 16, 18, 20, 24, 28, 32, 36, 42 (productive range of `scale.ts`) | 11, 13, 16, 19, 23, 28, 33, 40, 48 |
| bodyShort01 / bodyLong01 | 14 | 16 / 24 on every breakpoint |
| label01, helperText01, caption01 | 12, letter-spacing 0.32px | 13 / 20, letter-spacing 0 |
| productiveHeading01 | 14 / 600 | 16 / 600 / 24 |
| Weights | 300, 400, 600 | 400, 500, 600 |
| Durations fast-01, fast-02, moderate-01, moderate-02 | 70, 110, 150, 240 | 100, 100, 150, 200 |
| slow-01, slow-02 | 400, 700 | showcase only: 400; 700 dropped |
| Easing productive standard | `[0.2, 0, 0.38, 0.9]` | `cubic-bezier(0.24, 1, 0.4, 1)` |
| Grid breakpoints sm, md, lg, xlg, max | 320, 672, 1056, 1312, 1584 | 640, 768, 1024, 1280, 1536 |
| Grid | 16 columns, gutter 32 | 1 column below 640, 2 columns 640 to 1023, 4-column Bento at 1024 and up; gutter 16, 24 at 768 and up |
| Focus outline | 1px or 2px solid #0f62fe, offset -2px | `outline` in ink, instant; dotted under `prefers-contrast` |
| Font | IBM Plex Sans and Mono | JAL system stack; Plex only with Brian's sign-off |

## 3. Conflicts to shed (with exact JAL replacement)

| Carbon behavior | JAL replacement |
|---|---|
| g90 and g100 full dark themes (#262626, #161616) selectable as default | Only white-path tokens ship as default. Dark ports only behind an explicit `data-theme="dark"` toggle that Brian's brief requests, never OS-selected |
| **Notification left-border accent:** `border-inline-start: 6px solid $color` and `3px solid $color` (`notification/_mixins.scss:14, 28, 35`) | **Icon + title + tonal surface + full hairline border.** Severity icon (koboyo, status color, 20), title (16 / 600, `ink`), body (16 or 13, `ink-muted`), surface = status tint `color-mix(in oklab, var(status) 8%, var(surface))`, border = 1px `border-strong` on all four sides in one color. No colored side, no bar |
| **Tile accents and AI inner shadow:** tiles with `inset 0 -80px 70px -65px` shadows (`tile/_tile.scss:521, 575, 610`) and elevated tile box-shadows | Tile = `surface` + full 1px `border` + container radius. Selected tile = spread-only ring `0 0 0 2px` in `ink` + check icon + tonal fill. **Icon + title + tonal surface + full hairline border** for any highlighted tile. No inset stripes, no shadow |
| Contained and vertical tabs selected via `box-shadow: inset 3px 0 0 0` (`tabs/_tabs.scss:360, 605`); line tabs via `border-block-end: 2px solid $border-interactive` (`tabs/_tabs.scss:612`) | Selected tab = weight 600 + `ink` + `layer-2` fill. One full-width hairline divider under the tab list as the region boundary. No inset stripe, no accent underline |
| Toast and actionable notification `box-shadow: 0 2px 6px 0 rgba(0,0,0,0.2)` | `surface` + 1px `border-strong`, top layer, no shadow |
| Every other box-shadow (tile elevation, overlays, `shadow` token #000 at 30%) | Zero shadow. Tonal step + hairline |
| Square-first radius (0px in v11, 4px opt-in in v12) | JAL radius tokens by role; never 0 on cards or controls |
| Purple support color `#8a3ffc` / `#a56eff` | Deleted; unknown state = `ink-muted` + icon + label |
| 16-column grid with 32 gutter | JAL Bento columns and gutters (table above) |
| Fluid form variants (label inside a full-bleed field, height varies) | Standard field: label above, fixed 44 control, message row below |
| Batch action bar in brand blue | `layer-2` toolbar row with selection count + actions, 44 controls |
| `cds--` classes, Carbon token names | Re-keyed under JAL names; never leaked |
| 23-step type scale to 156px | JAL 9-step scale; expressive steps not imported |

## 4. Component anatomy and state models

All components use the JAL state recipe in `SKILL.md`. Component-specific parts follow.

### DataTable
- **Anatomy:** toolbar (search, filters, column settings, overflow menu; replaced by the batch-action row when rows are selected) > header row (optional select-all checkbox, sortable column headers) > body rows (optional select checkbox, cells, optional expand toggle, optional inline row actions) > optional expanded row content > pagination footer (rows-per-page select, range text, previous and next icon buttons). Skeleton variant for loading. Zebra, sticky header, column resize are modifiers on the same table (`data-table-sort`, `data-table-expandable`, `data-table-action`).
- **Chrome:** table sits in a `surface` region with a full 1px `border` and container radius, `overflow: clip`. Header row `layer-1`, 13 / 500 `ink-muted`. Rows divided by 1px `border`. Cell padding inline 12 (16 comfortable, 8 compact). Numbers right-aligned with tabular figures.
- **Density (1024 and up only):** compact 40, default 48, comfortable 56, one class on the table.
- **Row states:** default; hover instant 8% layer; focus-visible outline on the row or cell (grid keyboard nav); selected `layer-2` + checked checkbox; expanded = expanded content in `layer-1` directly below, toggle icon rotates (transform only); disabled row 38% content, not selectable.
- **Sort header states:** unsorted (icon on hover and focus), ascending, descending, each with `aria-sort`; the whole header cell is a 44-tall button.
- **Table states:** loading = skeleton rows matching column widths; empty = EmptyState inside the table body with one action; error = inline notification above the table with retry; filtered-to-zero = "No results" row with a clear-filters action; success = transient toast after a batch action.
- **Responsive contract:** below 640 each record becomes a stacked row (primary field as title 16 / 500, two or three secondary fields as a 13 meta line, trailing chevron or action), 44+ targets. 640 to 1023: priority columns only, dropped columns reachable in the row detail; the page never scrolls horizontally. Sticky first column uses a 1px hairline edge.

### TextInput
- **Anatomy:** label (16 / 500 or 13 / 500 in dense desktop forms) > field (optional leading icon, input, trailing lane reserved for clear, reveal, or status icon) > helper or message row (13, `ink-muted`).
- **Chrome:** 44 height, `surface`, 1px `border-strong` on all sides, control radius, padding inline 12, 16px input text.
- **States:** default; hover border steps toward `ink`; focus-visible border `ink` + spread-only `0 0 0 1px` ink; disabled 38% and 12%, label also muted; read-only `layer-1` fill, no hover, text selectable; invalid border danger + danger icon in the trailing lane + message (`text-error` equivalent) with `aria-invalid` and `aria-describedby`; warning same geometry with the warning token; loading or validating spinner in the trailing lane; success check icon + message after async validation.
- PasswordInput: reveal toggle in the trailing lane, 44 hit area.

### Select
- **Anatomy:** label > field (`block-size: layout.size('height')`, `select/_select.scss:58`, JAL 44) with trailing chevron > helper or message row.
- Native `<select>` with `appearance: none` and a koboyo chevron, identical chrome to TextInput. Option groups via `optgroup`. States identical to TextInput; the chevron takes `ink-muted`, `ink` on hover and focus.

### DatePicker
- **Anatomy:** label > input (44, trailing calendar icon button) > helper or message row; popover calendar with month and year navigation (previous and next icon buttons 44), weekday header, day grid, optional time row. Carbon calendar box 288 by 336 (`date-picker/_flatpickr.scss:132-133`).
- **JAL chrome:** popover `surface` + 1px `border-strong`, container radius, padding 8. Day cells 44 by 44 on touch (Astryx gives DateInput day cells 44 on coarse pointers). Weekday header 13 / 500 `ink-muted`.
- **Day states:** default; hover 8%; focus-visible outline (arrow-key grid navigation); today = weight 600 + 1px `border-strong` ring, never a dot or underline; selected = `ink` fill, `surface` text; in-range = `layer-2` fill between endpoints; disabled (out of bounds) 38%, not selectable; outside-month days are hidden, or shown at 38% and not selectable.
- **Field states:** as TextInput, plus invalid date format message. Range variant = two inputs sharing one popover.
- Below 640: native `<input type="date">` at 44, or the calendar in a bottom sheet with `safe-area-inset-bottom`.

### Notification (inline, toast, actionable)
- **Anatomy:** severity icon > title > body > optional action (secondary button, 44) > optional close icon button (44 hit area).
- **Chrome:** icon + title + tonal surface + full hairline border (section 3). Inline sits in flow at the top of the region it describes. Toast sits in the top layer, stacked with a fixed gap 8, auto-dismiss with pause on hover and focus. Actionable never auto-dismisses.
- **Severity:** danger, warning, success, info, each with its own icon shape so meaning survives without color. Roles: `role="alert"` for danger, `role="status"` for others.
- **Motion:** enter opacity + translate 8, 200ms; exit about 140ms; reduced motion = opacity only.

### Tabs
- **Anatomy:** tab list (tabs with label, optional icon, optional count badge, optional dismiss) > tab panel.
- **Chrome:** tabs 44 tall (Carbon routes tab height through `layout.size('height')`, `_tabs.scss` lines 63, 357, 560), padding inline 16, one hairline divider under the full list.
- **States:** default `ink-muted` weight 500; hover 8%; focus-visible outline; active 12%; selected weight 600 + `ink` + `layer-2` fill + `aria-selected`; disabled 38% (dismiss icon suppressed, no hover or focus); dismissible tab close button is its own focus stop.
- Overflow scrolls horizontally inside the tab list with a hard edge; the page never scrolls.

### Modal
- **Anatomy:** header (title 23 / 600, optional description, close icon button always visible) > body (scrolls; `max-block-size` bounded) > footer (button set, secondary then primary, full-width split on mobile).
- **Sizes:** Carbon steps inline size down as the viewport grows, 100vw on the smallest screens, then 84%, 60%, 48% (`modal/_modal.scss` lines 44 to 108). JAL: full-screen or bottom sheet below 640 (28 top corners, `safe-area-inset-bottom`), then fixed widths capped by region, never percentage soup.
- **Chrome:** `surface` + 1px `border-strong`, container radius, neutral scrim, no shadow, header and footer padding 24 with a hairline divider only when the body scrolls.
- **States:** opening (opacity + scale from 0.98, 200ms), open (focus trapped, first field or primary action focused), submitting (primary shows loading, other actions disabled), error (inline notification in the body), closing (about 140ms). Danger modal uses the destructive button and names the object.

## 5. Product-fit signals

Choose Carbon as primary or secondary when the brief shows: an internal admin or ops console; reporting screens dominated by large sortable, selectable, paginated tables; dense multi-field settings or configuration forms; date and filter heavy workflows; users in long daily sessions with keyboard and pointer; many teams maintaining one product where predictable field and row heights matter more than warmth.

Do not use it for marketing pages, onboarding flows, or anything meant to feel warm or expressive. In a mixed product, Carbon usually enters as the secondary lens for DataTable, forms, and notifications inside an Astryx frame.
