# JAL Core components

One spec per component. Every component uses the JAL state recipe in `SKILL.md` (hover 8%, focus-visible outline, active 12% plus scale 0.98, disabled 38% and 12%, loading, error, success); only component-specific parts are listed here. Values are JAL Core tokens. The "From" line records which source the anatomy came from; it is provenance, not a choice.

## Actions

### Button
From: Astryx anatomy, Material variant contracts.
- **Anatomy:** optional leading icon (20), label (16 / 500, also the accessible name), optional end content (icon or badge), spinner replacing the leading icon while loading.
- **Variants:** primary = `ink` fill, `surface` label, one per view; secondary = `layer-2` fill, `ink` label; outlined = `surface` + 1px `border-control`, `ink` label; ghost = transparent, `ink` label, for low-emphasis and inline actions; destructive = danger-tinted fill with danger text. Icon-only = 44 by 44 square with an accessible name. No elevated variant.
- **Size:** `--control-h` 44, padding inline 16 (12 beside an icon), gap 8, control radius.
- **States:** hover tint over the fill only when enabled and hover-capable; active 12% + `scale(0.98)`; loading keeps width, `aria-busy`, dedupes double clicks; errors and success are shown by the surrounding form or a toast, never by recoloring the button.
- **Rules:** labels name the action; destructive actions confirm and name the object; navigation is a link, never a button.

### Floating create action (mobile only)
From: Material FAB contract, shadow removed.
- **When:** one dominant create action on a phone screen (compose, new item). At most one per screen. From 640 up the action lives in the page header instead.
- **Chrome:** 56 by 56, radius 16, `ink` fill, `surface` icon (24) with an accessible name, 1px `ink` border, no shadow in any state. Fixed at inset-inline-end 16 and bottom = tab bar height + 16 + `env(safe-area-inset-bottom)`. Extended variant = icon + label (16 / 500), collapsing to icon-only on scroll down.
- **States:** hover `surface` at 8% over `ink`; focus-visible outline with an offset so it reads on the dark fill; pressed 12% + `scale(0.98)`; enter and exit by opacity and scale, 200ms in, about 140ms out.

## Form controls

All form controls share one chrome: label above and always visible, a 44 field, 1px `--color-border-control` on all four sides, `surface` fill, control radius, 16px input text (prevents iOS zoom), padding inline 12, and a helper or message row below (13, `ink-muted`) whose space is reserved so validation never shifts layout. A trailing lane is reserved for an icon at every size (Carbon), so a chevron, clear button, or status icon never touches the value.

### TextInput
From: Carbon anatomy, Astryx and Material state detail.
- **Anatomy:** label (16 / 500, or 13 / 500 in dense desktop forms) > field (optional leading icon, input, trailing lane for clear, reveal, or status icon, optional prefix or suffix text) > helper or message row, optional character counter at the end of that row.
- **States:** hover border steps toward `ink`; focus-visible border `ink` + spread-only `0 0 0 1px` ink, no layout shift; disabled 38% and 12%, label also muted; read-only `layer-1` fill, no hover, text selectable; invalid border danger + danger icon in the trailing lane + message, `aria-invalid` and `aria-describedby`; warning same geometry with the warning token; validating spinner in the trailing lane; success check icon + message after async validation.
- **PasswordInput:** reveal toggle in the trailing lane, 44 hit area.
- **Textarea:** same chrome, grows from content, starts at three lines only where a paragraph is expected.
- Never a floating label, never a filled field with an underline indicator, never a content-derived height.

### Select
From: Carbon.
- **Anatomy:** label > field with a trailing chevron in the reserved lane (40px lane, the value never runs under it) > helper or message row.
- Native `<select>` with `appearance: none` and a koboyo chevron, identical chrome to TextInput. Option groups via `optgroup`. The chevron is `ink-muted`, `ink` on hover and focus. Custom listboxes open in a top-layer popover: `surface` + 1px `border-strong`, item rows 44 tall, selected item `layer-2` + check icon + weight 500.

### DatePicker
From: Carbon anatomy, Astryx touch sizing.
- **Anatomy:** label > input (44, trailing calendar icon button) > helper or message row; top-layer calendar popover with month and year navigation (previous and next icon buttons 44), weekday header (13 / 500 `ink-muted`), day grid, optional time row.
- **Chrome:** popover `surface` + 1px `border-strong`, container radius, padding 8; day cells 44 by 44.
- **Day states:** hover 8%; focus-visible outline with arrow-key grid navigation; today = weight 600 + 1px `border-strong` ring, never a dot or underline; selected = `ink` fill, `surface` text; in range = `layer-2` between endpoints; disabled 38%, not selectable; outside-month days hidden, or shown at 38% and not selectable.
- Range variant = two inputs sharing one popover. Below 640: native `<input type="date">` at 44, or the calendar in a bottom sheet with `safe-area-inset-bottom`.

### Chips (filter, input, suggestion, assist)
From: Material.
- **Anatomy:** optional leading icon or check (20) + label (13 / 500, 16 / 500 on mobile) + optional trailing remove button (input chips).
- **Chrome:** 44 tall so a chip row aligns with every other control, radius 8, padding inline 12, gap 8, wraps to new lines, never scrolls the page.
- **Filter:** unselected `surface` + 1px `border-control`; selected `layer-2`, border removed, leading check, weight 500, `aria-pressed`.
- **Input:** the remove button is its own focus stop with an accessible name ("Remove Jakarta"); Backspace removes the focused chip.
- **Suggestion** (AI prompts, quick replies): `layer-1`, one tap submits, no selected state. **Assist:** leading icon + action label, behaves as a button.

## Records

### DataTable
From: Carbon.
- **Anatomy:** toolbar (search, filters, column settings, overflow menu; replaced by the batch-action row when rows are selected) > header row (optional select-all checkbox, sortable headers) > body rows (optional select checkbox, cells, optional expand toggle, optional inline row actions) > optional expanded content > pagination footer (rows-per-page select, range text, previous and next icon buttons).
- **Chrome:** a `surface` region with a full 1px `border` and container radius, `overflow: clip`. Header row `layer-1`, 13 / 500 `ink-muted`. Rows divided by 1px `border`. Numbers right-aligned with tabular figures. Batch-action row = `layer-2` toolbar with the selection count and 44 controls.
- **Density (1024 and up):** row height and cell padding from the product density (`SKILL.md`), one class on the app root.
- **Row states:** hover instant 8%; focus-visible outline on the row or cell (grid keyboard navigation); selected `layer-2` + checked checkbox; expanded content in `layer-1` directly below, toggle rotates (transform only); disabled 38%, not selectable.
- **Sort header:** unsorted (icon on hover and focus), ascending, descending, each with `aria-sort`; the whole header cell is a 44-tall button.
- **Table states:** loading = skeleton rows matching column widths; empty = EmptyState in the table body with one action; error = inline notification above the table with retry; filtered to zero = a "No results" row with a clear-filters action; batch success = transient toast.
- **Responsive contract:** below 640 each record becomes a stacked row (primary field as the title 16 / 500, two or three secondary fields as a 13 meta line, trailing chevron or action, 44+ targets). 640 to 1023: priority columns only, dropped columns reachable in the row detail. The page never scrolls horizontally. A sticky first column uses a 1px hairline edge, never a shadow.

### List and Item
From: Astryx anatomy, Material slot sizes.
- **Anatomy:** leading slot (icon 20 or 24, avatar 40, or image 56), text block (title 16 / 500 `ink`, description 13 `ink-muted`, clamped to one or two lines), trailing slot (meta text, badge, switch, chevron, icon button).
- **Chrome:** rows are flush inside their container (the radius belongs to the container), padding inline 16, padding block from the product density at 1024 and up; below 1024 a tappable one-line row is at least 56. Rows top-align; two and three-line rows grow from content. Separation is one fixed gap or a 1px `border` divider inset to the text start. Never `justify-content: space-between` or `flex-grow` to fill a card.
- **States:** interactive rows hover 8% instantly, focus-visible outline drawn inward so it never clips, pressed 12%, selected `layer-2` + check or weight 500, disabled 38% on all slots. Loading = skeleton rows of the same height; empty = EmptyState in place of the list.

## Containers

### Card family (Card, ClickableCard, SelectableCard, Tile)
From: Astryx, with Carbon's selectable tile folded in.
- **Anatomy:** optional header (title + optional action), body, optional footer pinned with `margin-top: auto`.
- **Chrome:** `surface` on `page`, 1px `border`, container radius, `overflow: clip`, padding 16 (24 at 768 and up) minus the 1px border.
- **Variants:** default (`surface`), muted (`layer-1`), transparent (spacing-only group). A card is only for a self-contained widget or a hard boundary.
- **ClickableCard:** the whole card is one action; hover 8%, active 12%, focus-visible outline around the whole card.
- **SelectableCard / selectable tile:** selected = spread-only ring `0 0 0 2px` in `ink` + check icon + optional tonal fill; unselected = 1px `border`. Never a side stripe, never an inset shadow.
- Cards in one grid share one shape: equal heights per row, repeated elements on one baseline, no internal void.

### Dialog, Modal, AlertDialog
From: Astryx anatomy and top-layer rules, Carbon states and sizing.
- **Anatomy:** header (title 23 / 600, optional description, close icon button always visible with a 44 hit area) > body (scrolls, bounded `max-block-size`) > footer (actions, secondary then primary, primary last).
- **Chrome:** native `dialog.showModal()`, `surface` + 1px `border-strong`, container radius, `--color-scrim`, no shadow, padding 24, hairline dividers above and below the body only when it scrolls.
- **Sizes:** below 640 a full-width bottom sheet with 28 top corners and `safe-area-inset-bottom` (full-screen with a sticky header for multi-field tasks); from 640 fixed widths capped by the region, never percentage soup.
- **States:** opening opacity + scale from 0.98 at 200ms via `@starting-style`; open with focus trapped and the first field or primary action focused; submitting shows loading on the primary with the other actions disabled; error = inline notification in the body; closing about 140ms.
- **AlertDialog:** `alertdialog`, not dismissible by scrim tap, the destructive confirm uses the destructive button and names the object.

## Feedback

### Notification (inline, toast, actionable) and Banner
From: Carbon model, re-chromed to the JAL notice pattern.
- **Anatomy:** severity icon (20, its own shape per severity so meaning survives without color) > title that names the state (16 / 600 `ink`) > body (16 or 13 `ink-muted`) > optional action (secondary button, 44) > optional close icon button (44 hit area).
- **Chrome:** icon + title + tonal surface + full border. Surface `--color-<status>-surface`, border `--color-<status>-border` 1px on all four sides. Never a colored side, never a bar, never a shadow.
- **Inline / Banner:** in flow, at the top of the region it describes. **Toast:** top layer, stacked with a fixed gap 8, auto-dismiss with pause on hover and focus, `role="status"`. **Actionable:** carries an action and never auto-dismisses. Danger uses `role="alert"`.
- **Motion:** enter opacity + translate 8 at 200ms, exit about 140ms, reduced motion = opacity only.

### Badge and Token
From: Astryx (replaces StatusDot).
Text label always present, optional leading icon, `layer-2` fill for neutral, status-tinted fill with status text for state, pill radius 9999, height follows text (13 / 500 / 20). Never a bare dot. Presence is text ("Online") or an icon with an accessible name.

### EmptyState and Skeleton
From: Astryx.
EmptyState: icon (24), title, one sentence, one primary action; fills its region so it never collapses. Skeleton: `layer-2` blocks matching the expected shape exactly, opacity pulse only, static under reduced motion.

## Navigation

### AppShell and mobile navigation bar
From: Astryx AppShell, Material navigation bar anatomy.
- **Below 640:** sticky header with `safe-area-inset-top`, independently scrolling content, fixed bottom tab bar. The bar: 3 to 5 equal-width destinations, each an icon (24) above a label (11 / 500 / 16 or 13 / 500 / 20), the whole destination one target of at least 44 by 44; `surface`, one 1px `border` hairline on its top edge as the structural boundary, height 64 plus `env(safe-area-inset-bottom)`, no shadow. Content pads its bottom by the bar height so nothing hides under it.
- **Bar states:** inactive `ink-muted`; active = `layer-2` pill 64 by 32 behind the icon (radius 9999) + label weight 600 `ink`, `aria-current="page"`; pressed 12% on the pill + `scale(0.98)`; focus-visible outline around the destination; count badges carry text, never a bare dot.
- **640 to 1023:** top nav or a collapsible side nav. **1024 and up:** side nav with a fixed width budget. The destinations stay the same at every width.

### Tabs and SegmentedControl
From: Astryx, with Carbon tab detail.
- **Tabs:** 44 tall, padding inline 16, optional icon, optional count badge, optional dismiss (its own focus stop). Unselected `ink-muted` weight 500; selected weight 600 + `ink` + `layer-2` fill + `aria-selected`; disabled 38% with the dismiss suppressed. One full-width hairline divider under the whole tab list as the region boundary. Never an accent underline, never an inset stripe. Overflowing tabs scroll inside the list with a hard edge, no fade; the page never scrolls.
- **SegmentedControl:** `layer-1` track, selected segment `surface` + 1px `border` (it keeps its surface on press), unselected segments paint pressed.

## Conversation

### AI chat
From: Astryx.
Message list (region fills, scrolls independently), composer pinned to the bottom of its region sharing the content line, tool calls and agentic states (thinking, streaming, tool execution, waiting) rendered with the system state language, suggestion chips for prompts on mobile. Bubbles and the composer take the container radius; 28 is reserved for page-level sheets. Scroll edges are hard with a hairline, never a fade.
