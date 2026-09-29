# JAL Core components

One spec per component. Every component uses the JAL state recipe in `SKILL.md` (hover 8%, focus-visible outline, active 12% plus scale 0.98, disabled 38% and 12%, loading, error, success); only component-specific parts are listed here. Values are JAL Core tokens. The "From" line records which source the anatomy came from; it is provenance, not a choice. Specs marked "From: Material Web" follow the Material Web component (`@material/web` v2.5.0 source and the `tokens/versions/v0_192/_md-comp-*.scss` token files) with every value re-keyed to JAL Core and JAL law applied; the source values and what law removed are in `sources.md`.

Component tokens follow the contract in `foundations.md` section 11.1: each part reads `var(--jal-<component>-<part>-<property>, <system token>)`, so a scoped override reskins a subtree without JS. The CSS-built components (`.jal-checkbox`, `.jal-radio`, `.jal-switch`, `.jal-slider`, `.jal-progress`, `.jal-icon-btn`, `.jal-segmented`, `.jal-menu`) live in the Material Web block of `packages/ui/src/ui.css`, built on native elements so they work without JS.

## Interaction primitives

### State layer (the ripple replacement)
From: Material Web (`<md-ripple>` and the `md-sys-state` percentages), JAL law applied: bounded, flat, no circle.
- **Anatomy:** one flat tint of the component's content color over its container color, painted on the component's own shape. Two ways to paint it: `background: color-mix(in oklab, var(--_content) N%, var(--_container))` (the default, used by every `.jal-*` component), or a `::before` fill at `inset: 0`, `border-radius: inherit`, `background: currentColor`, with `opacity` set per state (used when the container is an image or a status surface).
- **Percentages:** hover 8, focus 12 (only where DOM focus cannot sit on the item, see Menu and Combobox), pressed 12, dragged 16, disabled content 38, disabled container 12. Selected is never a state layer; selection is a fill change (`layer-2`) plus a second cue (weight, check icon).
- **Bounded, never a circle.** The layer never grows past the control and never spreads from the pointer. A checkbox or radio tints its own box, a switch tints its track, a slider tints its thumb, an icon button tints its own 44 square. No 40px circle around a small control, no press-origin animation.
- **States:** default no layer; hover 8% on `@media (hover: hover)` only, instant on rows and list items, `--dur-100` on standalone controls; focus-visible is the focus ring, not a fill; active 12% plus `scale(0.98)` on standalone controls (never on rows, segments, or menu items); disabled removes every layer; loading removes hover and press; error and success never use the layer (status tokens and text carry them).
- **A11y:** the layer is decoration; meaning never depends on it. It disappears in forced-colors mode, so every state it marks also has a non-color cue.
- **Motion:** opacity or background change only; a quick tap still shows the pressed layer because the release fades at `--dur-150-exit`. No JS press controller, no touch delay timer.

### Focus ring
From: Material Web (`<md-focus-ring>`), JAL law applied: no animation, ink, outline only.
- **Anatomy:** one `outline` on the focused element (or on its visible proxy when the native control is hidden).
- **Chrome:** `2px solid var(--color-focus)` (ink), `outline-offset: 2px` outward, following the element radius. Inward variant `outline-offset: -2px` for list rows, menu items, table rows and cells, and tabs inside a scrolling container, where an outward ring would clip (Material's `inward`).
- **States:** shows on `:focus-visible` only (keyboard and programmatic focus that the UA flags), instantly, never animated (Material grows to 8px and settles at 3px over 600ms; dropped). Invalid controls keep the same geometry. Under `prefers-contrast: more` the outline is dotted.
- **Proxy rule:** when the input is visually hidden (switch, segmented button, custom checkbox skins), the ring is drawn on the visible part through `input:focus-visible ~ .part` or `:has(> input:focus-visible)`. Exactly one ring per focus.
- **A11y:** 3:1 against both the element and its backdrop; forced-colors mode keeps outlines, so no ring is ever a `box-shadow` (the spread-only ring is the last resort and vanishes in forced colors).

### Icon
From: Material Web (`<md-icon>`), re-sourced to koboyo.
- **Anatomy:** inline SVG from koboyo (reicon.dev fallback), `fill` or `stroke` in `currentColor`. Never an icon font, never ligature names.
- **Sizes:** 16 (inline with 13 text), 20 (controls: buttons, icon buttons, chips, fields, menu items), 24 (navigation destinations, empty states). One size per control row.
- **Filled variant:** where koboyo offers a filled glyph of the same icon, the selected state of a navigation destination or toggle may swap to it (Material's FILL axis), always paired with a non-icon cue (weight, fill, `aria-pressed`).
- **A11y:** decorative icons get `aria-hidden="true"`; an icon-only control carries the accessible name on the control (`aria-label`), never on the SVG alone. Directional icons (back, forward, chevrons pointing along the reading direction) flip under `[dir="rtl"]` with `transform: scaleX(-1)`.

## Actions

### Button
From: Astryx anatomy, Material Web emphasis contract and link and form rules.
- **Anatomy:** optional leading icon (20), label (16 / 500, also the accessible name), optional trailing icon (forward, external, disclosure only), optional end content (badge), spinner replacing the leading icon while loading.
- **Variants and when (Material emphasis ladder):** primary = `ink` fill, `surface` label, one per view, for the final action that completes a flow (Save, Confirm, Join); secondary = `layer-2` fill, `ink` label, a lower-priority step that still needs more weight than an outline (Next in onboarding; Material filled tonal); outlined = `surface` + 1px `border-control`, `ink` label, important but not primary; ghost = transparent, `ink` label, the lowest priority, for dialog actions and runs of several options (Material text button); destructive = danger-tinted fill with danger text. Icon-only = Icon button spec. No elevated variant.
- **Size:** `--control-h` 44, padding inline 16 (12 beside an icon), gap 8, control radius. The visual box is the target; there is no smaller visual with an invisible 48 wrapper and no `touch-target="none"` mode.
- **States:** hover tint over the fill only when enabled and hover-capable; active 12% + `scale(0.98)`; disabled is not focusable, soft-disabled (`aria-disabled="true"`) stays focusable for discoverability in toolbars and explains why; loading keeps width, `aria-busy`, dedupes double clicks; errors and success are shown by the surrounding form or a toast, never by recoloring the button.
- **Rules:** labels name the action; destructive actions confirm and name the object; navigation is a link (`<a href>` styled as a button, which cannot take a trailing icon), never a button. A `<button>` inside a form defaults to `type="submit"`, so every non-submit button sets `type="button"`. Submitting buttons may carry `name` and `value` so the form knows which one submitted.

### Icon button (standard, filled, tonal, outlined, toggle)
From: Material Web (`<md-icon-button>`, `<md-filled-icon-button>`, `<md-filled-tonal-icon-button>`, `<md-outlined-icon-button>`). Build: `.jal-icon-btn`.
- **Anatomy:** one icon (20) centered in a 44 by 44 square, `border-radius: var(--radius-pill)`. Toggle variant holds two icons (`[data-icon="off"]`, `[data-icon="on"]`) and shows one per state; a single icon is allowed when fill or weight carries the change.
- **Variants (emphasis low to high):** standard = transparent, `ink-muted` icon, the default for supplementary actions (overflow, search, close); outlined = `surface` + 1px `border-control`, `ink` icon; tonal = `layer-2` fill, `ink` icon, a secondary action beside a primary one; filled = `ink` fill, `surface` icon, the one high-emphasis icon action. `data-variant="outlined|tonal|filled"` on the button; no attribute is standard.
- **Toggle (`aria-pressed`):** standard off transparent `ink-muted`, on `layer-2` + `ink`; outlined off as outlined, on `ink` fill + `surface` icon; tonal off `layer-1` + `ink-muted`, on `layer-2` + `ink`; filled off `layer-2` + `ink`, on `ink` + `surface`. The on state always changes fill and icon, never color alone.
- **States:** hover `color-mix(in oklab, var(--_content) 8%, var(--_container))`; focus-visible outline offset 2 following the pill; active 12% + `scale(0.98)`; disabled icon 38%, filled and tonal container 12%, outlined border steps to `border`; soft-disabled `aria-disabled="true"` looks disabled, stays focusable, no hover or press; loading `aria-busy`, icon hidden, 16 ring spinner in the content color; error and success come from the surrounding context, never a recolored icon button.
- **Responsive:** 44 at every width. Runs of icon buttons keep an 8 gap. Below 640 the mobile header holds at most two icon buttons; more move into an overflow menu.
- **A11y:** accessible name on every icon button (`aria-label`, naming the action, not the icon). Toggle buttons keep one stable label and expose the state with `aria-pressed` (never swap the label and the pressed state together; Material's `aria-label-selected` is used only when the action itself changes, such as Mute and Unmute, and then drop `aria-pressed`). An icon button that opens a menu adds `aria-haspopup="menu"` and `aria-expanded`. Link icon buttons are `<a>` with the same chrome.
- **Component tokens:** `--jal-icon-btn-container-color`, `--jal-icon-btn-icon-color`, `--jal-icon-btn-outline-color`.

### Segmented button (includes SegmentedControl)
From: Material Web labs (`<md-outlined-segmented-button>`, `<md-outlined-segmented-button-set>`), with the Astryx rule that unselected segments paint pressed. Build: `.jal-segmented`.
- **When:** 2 to 5 options that switch a view, a filter, or a setting in place. Single-select (view switch, sort order) or multi-select (formatting toggles). More than 5 options or long labels use a Select; destinations use Tabs.
- **Anatomy:** a group (`<fieldset>` with a visually hidden `<legend>`, or `role="group"` + `aria-label`) of segments. Each segment: optional check icon (20, only while selected, Material's checkmark) or a leading icon, then the label (16 / 500). Without JS: each segment is a `<label>` wrapping a visually hidden `<input type="radio">` (single) or `<input type="checkbox">` (multi). With app state: `<button type="button" aria-pressed>`.
- **Chrome:** segments 44 tall, padding inline 16, gap 8, `surface` fill, 1px `border-control` on all four sides of every segment, adjacent borders collapsed by a `-1px` inline-start margin so the group reads as one outlined bar; control radius 8 on the group's outer corners only. Segments share the width equally (`flex: 1 1 0`) and ellipsize, never wrap.
- **States:** selected = `layer-2` fill + weight 600 + check icon, `aria-pressed="true"` or `:checked`; hover on unselected 8%; focus-visible outline on the segment, raised above its neighbors; pressed paints the unselected segment 12% while the selected segment keeps its fill; no scale on segments; disabled segment content 38% and border `border`, or the whole group; loading the group sets `aria-busy` and blocks input; error the group border steps to danger with a message below; success is shown by the content the segments control.
- **Responsive:** fills its region width below 640 (`inline-size: 100%`); from 640 it sizes to content, capped at the region. If segments would ellipsize below 640, switch to a Select.
- **A11y:** single-select radio segments get native arrow-key movement and one tab stop; `aria-pressed` buttons are separate tab stops. Never convey selection by fill alone (the check icon or weight 600 also changes). A segment that shows only an icon has an accessible name.
- **Component tokens:** `--jal-segmented-container-color`, `--jal-segmented-selected-container-color`, `--jal-segmented-outline-color`, `--jal-segmented-label-color`.

### Split button
From: Material Web labs (`md-gb` split button), shape morph removed.
- **Anatomy:** a primary action Button plus a trailing 44 by 44 menu trigger (chevron icon 20) joined into one group with a 2 gap (`--space-2px`).
- **Chrome:** both halves share one variant (primary, secondary, or outlined). Outer corners take the control radius 8, the two inner corners take `--radius-4`. The chevron half is square.
- **States:** each half has its own hover, focus-visible, active, and disabled; the trigger adds expanded = `aria-expanded="true"`, a 12% layer while its menu is open, and the chevron rotates 180 degrees (transform, `--dur-150`). The group never changes shape on press or expand. Loading applies to the primary half only; error and success come from the result surface.
- **Responsive:** below 640, when the split button is the region's primary action, it fills the width and the primary half grows (`flex: 1 1 auto`).
- **A11y:** the trigger has `aria-haspopup="menu"`, `aria-expanded`, and a name that says what the menu holds ("More save options"). The menu is a Menu (spec below) anchored to the group's inline end.

### Toolbar (docked)
From: Material Web labs (`md-gb` toolbar, docked mode), floating mode removed.
- **Anatomy:** `role="toolbar"` with `aria-label`, holding icon buttons, buttons, a segmented button, or a split button, grouped by a 16 gap or a vertical Divider between groups.
- **Chrome:** a row inside its region, 44 controls, 8 gap inside a group, background inherited (no own fill), a 1px `border` hairline only where it is pinned against a scrolling body. Never a floating pill over content.
- **States:** items carry their own states; the toolbar has none of its own.
- **Responsive:** items that do not fit collapse from the end into a "More" icon button that opens a Menu; the toolbar never scrolls horizontally. Below 640 a region toolbar is pinned above the bottom tab bar row only when the region is an editor.
- **A11y:** one tab stop; arrow keys move between items (roving `tabindex`, Home and End jump to the ends); disabled items stay reachable as soft-disabled so the set is discoverable.

### Floating create action (mobile only)
From: Material Web FAB contract (`<md-fab>`), shadow and color variants removed.
- **When:** one dominant create action on a phone screen (compose, new item). At most one per screen. From 640 up the action lives in the page header instead.
- **Chrome:** 56 by 56, radius 16, `ink` fill, `surface` icon (24) with an accessible name, 1px `ink` border, no shadow in any state. Fixed at inset-inline-end 16 and bottom = tab bar height + 16 + `env(safe-area-inset-bottom)`. Extended variant = icon + label (16 / 500), collapsing to icon-only on scroll down; the extended variant may drop the icon (Material: the only FAB without one). Small (40) and large (96) sizes, the lowered variant, color variants, and branded multicolor FABs are not used.
- **States:** hover `surface` at 8% over `ink`; focus-visible outline with an offset so it reads on the dark fill; pressed 12% + `scale(0.98)`; disabled 38% and 12% (avoid: hide the action instead when it cannot apply); loading `aria-busy` with the icon swapped for a spinner; error and success via a toast above the tab bar that pushes the action up by the toast height, never covering it; enter and exit by opacity and scale, 200ms in, about 140ms out.
- **A11y:** icon-only needs `aria-label` naming the action; the extended variant is named by its label and its icon is `aria-hidden`.

## Selection controls

All selection controls share the control boundary: 1px `--color-border-control` on all four sides (3:1), `ink` fill when on, a whole-row target of at least 44, and a label that is always visible. Visual size may be smaller than 44; the target never is.

### Checkbox
From: Material Web (`<md-checkbox>`), JAL chrome from `ui.css` base. Build: `.jal-checkbox`.
- **Anatomy:** `<label class="jal-checkbox">` wrapping a native `<input type="checkbox">` and the label text (16 / 400 `ink`), optional description (13 `ink-muted`) below the label, then the field hint row for errors. Groups use `<fieldset>` + `<legend>` (16 / 500).
- **Chrome:** box 20 by 20, `--radius-4`, `surface` fill, 1px `border-control`; checked and indeterminate = `ink` fill and border with a `surface` glyph (check 12, dash 12); row min-height 44, gap 12, box top-aligned to the first text line.
- **States:** hover (row or box, pointer only) tints the box 8% (checked: `--color-primary-hover`); focus-visible outline on the box; active tints the box 12% (checked: `--color-primary-active`), no scale; disabled box 38% and 12%, label `--state-disabled-content`, default cursor; indeterminate (`input.indeterminate = true`, set from JS for parent rows of partial selections, `aria-checked="mixed"` implied) shows the dash and moves to checked on activation; loading (async commit) = `aria-busy="true"` on the row, input blocked, the requested state already painted, reverted with a message on failure; error `aria-invalid="true"` = danger border, danger fill when checked, message in the hint row with an icon, `aria-describedby`; success = no extra chrome, autosave rows may show a transient "Saved" in the hint row.
- **Responsive:** identical at every width; in lists and tables below 1024 the row stays at least 44 tall and the whole row toggles.
- **A11y:** the label is the name (wrapping or `for`); a checkbox without visible text (table row select) gets `aria-label` naming the record ("Select order 1042"). `required` on a single consent checkbox; group requirements are validated on the fieldset with the message after the legend. A lone yes or no setting that applies immediately is a Switch, not a checkbox.
- **Motion:** the mark changes instantly (high-frequency control); Material's 350ms scale-in is not ported.
- **Component tokens:** `--jal-checkbox-selected-container-color`, `--jal-checkbox-outline-color`.

### Radio and radio group
From: Material Web (`<md-radio>`). Build: `.jal-radio` (and `.jal-radio-group` for the fieldset reset).
- **Anatomy:** `<fieldset class="jal-radio-group">` + `<legend>` (16 / 500) holding `<label class="jal-radio">` rows, each a native `<input type="radio">` sharing one `name`, the label (16 / 400), optional description (13 `ink-muted`).
- **Chrome:** circle 20, `--radius-pill`, `surface` fill, 1px `border-control`; selected = `ink` fill and border with an 8 `surface` center; rows min-height 44, gap 12, stacked with a 4 gap (horizontal only for 2 or 3 short options from 640).
- **States:** hover tints the circle 8%; focus-visible outline on the circle; active 12%; disabled 38% and 12% with the label muted; loading on the group (`aria-busy`, inputs blocked); error on the group (danger border on every circle in the group, message after the legend, `aria-describedby` on the fieldset); success via the hint row. Selection changes instantly (Material's 300ms inner grow is not ported).
- **A11y:** one tab stop per group, arrow keys move the selection (native). The group is labelled by its legend (or `role="radiogroup"` + `aria-labelledby`). If any radio in a group is `required`, the whole group is required. Never a single radio; never preselect an option the user must consciously choose (consent, plan with cost).
- **Component tokens:** `--jal-radio-selected-color`, `--jal-radio-outline-color`.

### Switch
From: Material Web (`<md-switch>`). Build: `.jal-switch`.
- **When:** a setting that takes effect immediately (Wi-Fi on). A choice that is submitted with a form is a Checkbox.
- **Anatomy:** `<label class="jal-switch">` holding a native `<input type="checkbox" role="switch">` (visually hidden, covering the row), a `.jal-switch-track` span (`aria-hidden`) whose `::after` is the handle, and the label text (16 / 400). Text may sit before or after the track in the DOM.
- **Chrome:** track 52 by 32 (`calc(var(--space-32px) + var(--space-20px))` by `--space-32px`), pill, 1px `border-control`; off = `layer-2` track, 16 handle in `ink-muted`; on = `ink` track and border, 24 handle in `surface`; pressed handle 28. The handle is one 24 circle scaled by `transform` (0.667 off, 1 on, 1.167 pressed) and moved 20 by `translateX` (mirrored in RTL). Row min-height 44, gap 12.
- **States:** hover track 8% (on: `--color-primary-hover`); focus-visible outline around the track; active handle grows to 28 (transform); disabled off track 12% with a 38% handle, on track 38% with a `surface` handle, label muted; loading `aria-busy="true"` on the label blocks input and paints the handle at 38% (a pending network write), with the result in the hint row; error `aria-invalid="true"` = danger track border plus a message (a failed write reverts the switch and says so); success = transient "Saved" in the hint row, the switch itself is the confirmation.
- **Responsive:** same at every width. In settings lists the switch is the row's trailing slot and the whole row is the target.
- **A11y:** `role="switch"` on the checkbox so it announces on and off; the label names the setting, not the state ("Wi-Fi", never "Turn on Wi-Fi"). Position and handle size carry the state without color. Material's optional handle icons are not required.
- **Motion:** handle travel and scale at `--dur-150` on the one curve, no overshoot (Material's 300ms overshoot curve is dropped); press growth `--dur-100`.
- **Component tokens:** `--jal-switch-track-color`, `--jal-switch-selected-track-color`, `--jal-switch-handle-color`, `--jal-switch-selected-handle-color`.

### Slider (continuous, discrete, range)
From: Material Web (`<md-slider>`), value bubble and tick dots removed. Build: `.jal-slider`.
- **When:** an approximate value on a bounded scale where the visual position helps (volume, brightness, price range). Exact entry pairs the slider with a number TextInput or uses the input alone.
- **Anatomy:** `.jal-slider` grid: label (16 / 500) and an `<output>` readout (16 / 500, tabular figures) in the first row, the native `<input type="range">` spanning the second row, optional `.jal-slider-scale` row with the min and max as text (13 `ink-muted`). Range = two range inputs inside `.jal-slider-range`.
- **Chrome:** the input is 44 tall and fills its region (at least 192 wide); track 4 tall + 1px `border-control`, pill, `layer-2`; active fill `ink` from the start to the thumb (WebKit reads `--jal-slider-fill`, a percentage the app sets on input; Firefox paints it natively); thumb 20 `ink` circle. Range: the fill spans `--jal-slider-start` to `--jal-slider-end` on the shared track; both thumbs are the only hit areas so either can be grabbed.
- **Variants:** continuous = `step` fine or `any`; discrete = a coarse `step`, the readout shows the snapped value and the scale row shows min and max text (tick marks as dots are not drawn); range = two inputs, start and end, each labelled.
- **States:** hover thumb `--color-primary-hover`; focus-visible outline around the 44 control box; active (dragging) thumb `--color-primary-active`, the readout updates live; disabled track border `border`, thumb and fill `--state-disabled-content`, readout muted; loading (value applying remotely) `aria-busy` on the group, input stays usable, readout shows the pending value; error `aria-invalid="true"` = danger track border + message; success = transient confirmation in the hint row.
- **Responsive:** fills the region at every width; below 640 a range slider stacks the two readouts ("From 20" and "To 80") so the output never ellipsizes.
- **A11y:** each thumb is a native range input with its own name ("Minimum price", "Maximum price"); `aria-valuetext` when the number needs a unit or a word ("40 percent", "Medium"). Keyboard is native (arrows by step, Page keys by larger steps, Home and End). Range inputs must not cross: the app clamps start to end and end to start.
- **Motion:** none on the thumb (it follows the pointer); the readout changes instantly.
- **Component tokens:** `--jal-slider-active-track-color`, `--jal-slider-inactive-track-color`, `--jal-slider-handle-color`.

## Form controls

All form controls share one chrome: label above and always visible, a 44 field, 1px `--color-border-control` on all four sides, `surface` fill, control radius, 16px input text (prevents iOS zoom), padding inline 12, and a helper or message row below (13, `ink-muted`) whose space is reserved so validation never shifts layout. A trailing lane is reserved for an icon at every size (Carbon), so a chevron, clear button, or status icon never touches the value.

### TextInput (Material outlined field rules merged)
From: Carbon anatomy, Astryx and Material Web state detail, Material Web outlined text field and field rules (`<md-outlined-text-field>`, `field/`).
- **Anatomy:** label (16 / 500, or 13 / 500 in dense desktop forms) > field (optional leading icon, optional prefix text, input, optional suffix text, trailing lane for clear, reveal, or status icon) > message row (helper text, replaced by the error text while invalid, never both), optional character counter at the end of that row when `maxlength` is set ("12 / 80").
- **Input types (Material):** use the real type (`email`, `tel`, `url`, `search`, `number`, `password`) for the right keyboard and built-in validation, plus `inputmode` and `autocomplete` for finer control. Codes, card and account numbers, and postal codes are `type="text"` with `inputmode="numeric"`; `type="number"` only for quantities, with its spinner hidden.
- **Icons (Material):** a leading icon only describes the input method (search, currency); a trailing icon clears, reveals, or reports status; never decoration.
- **Prefix and suffix:** `ink-muted` text inside the field (currency, unit, domain), part of the field's accessible description.
- **Validation (Material order):** constraint validation first (`required`, `pattern`, `min`, `max`, `minlength`, `maxlength`, the type itself), reported on submit or blur with the browser `invalid` event feeding the message row; manual validation only when the rule lives in app state. The error text replaces the helper text in the reserved row. Required fields: the control carries `required`, the label carries a visible marker whose meaning the form states once.
- **States:** hover border steps toward `ink`; focus-visible border `ink` + the focus outline, no layout shift; disabled 38% and 12%, border `border`, label also muted; read-only `layer-1` fill, no hover, text selectable; invalid border danger + danger icon in the trailing lane + message, `aria-invalid` and `aria-describedby`; warning same geometry with the warning token; validating spinner in the trailing lane; success check icon + message after async validation.
- **PasswordInput:** reveal toggle in the trailing lane, 44 hit area, `aria-pressed` on the toggle.
- **Textarea:** same chrome, grows from content, starts at three lines only where a paragraph is expected (Material `rows`), resizes vertically only.
- **Responsive:** fills its field-row track; one column below 640.
- Never a floating label, never a filled field with an underline indicator or top-only radius, never a content-derived height, never a placeholder as the only label.

### Select
From: Carbon anatomy, Material Web select behavior (`<md-outlined-select>`).
- **Anatomy:** label > field with a trailing chevron in the reserved lane (40px lane, the value never runs under it) > helper or message row (error replaces helper).
- Native `<select>` with `appearance: none` and a koboyo chevron, identical chrome to TextInput. Option groups via `optgroup`. The chevron is `ink-muted`, `ink` on hover and focus.
- **Custom listbox (only when native cannot do it: rich options, icons, descriptions):** a top-layer popover using the Menu chrome (`surface` + 1px `border-strong`, radius 16, padding 8), option rows 44, selected option `layer-2` + check icon + weight 500, the listbox at least as wide as the field and aligned to its start edge (Material `menu-align` start, `clamp-menu-width` when options are long). Typeahead jumps to the first matching option, clearing the buffer after 200ms without a keystroke (Material default). The field shows the selected option's display text. Below 640 the listbox is a bottom sheet.

### Combobox (autocomplete)
From: Material Web autocomplete tokens (`_md-comp-outlined-autocomplete.scss`), WAI-ARIA combobox pattern.
- **Anatomy:** TextInput chrome with `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` > a top-layer listbox (Menu chrome) of 44 option rows > message row.
- **States:** the highlighted option is `aria-activedescendant` (DOM focus stays in the input), marked with the 12% focus layer plus weight 500, since no outline can sit on it; selected option `layer-2` + check; no results = one static row "No matches for ..." with a clear action; loading = a spinner row, `aria-busy` on the listbox; error = message row under the field; disabled as TextInput.
- **Keyboard:** Down opens and moves, Up moves, Enter picks, Escape closes then clears, Tab picks nothing and moves on.
- **Responsive:** below 640 the combobox opens a full-screen dialog with the input pinned at the top and results as a list (Material search view).

### DatePicker
From: Carbon anatomy, Astryx touch sizing, Material Web date picker geometry (`_md-comp-date-picker-modal.scss`).
- **Anatomy:** label > input (44, trailing calendar icon button) > helper or message row; top-layer calendar popover with month and year navigation (previous and next icon buttons 44), weekday header (13 / 500 `ink-muted`), day grid, optional time row. Year selection is a list of 44 rows, not a grid of pills.
- **Chrome:** popover `surface` + 1px `border-strong`, container radius, padding 8; day cells 44 by 44 (Material 40). No large colored header block.
- **Day states:** hover 8%; focus-visible outline with arrow-key grid navigation; today = weight 600 + 1px `border-strong` ring, never a dot or underline; selected = `ink` fill, `surface` text; in range = `layer-2` between endpoints; disabled 38%, not selectable; outside-month days hidden, or shown at 38% and not selectable.
- Range variant = two inputs sharing one popover. Below 640: native `<input type="date">` at 44, or the calendar in a bottom sheet with `safe-area-inset-bottom`. Time uses native `<input type="time">` or hour and minute fields; the clock dial is not used.

### Chips (filter, input, suggestion, assist)
From: Material Web (`<md-chip-set>`, `<md-filter-chip>`, `<md-input-chip>`, `<md-suggestion-chip>`, `<md-assist-chip>`).
- **Choose by purpose:** assist = a contextual action (add to calendar); filter = a tag that filters content, an alternative to checkboxes; input = a piece of information the user entered (recipients, tags); suggestion = a generated reply or query (AI prompts).
- **Anatomy:** optional leading icon, check, or avatar (20; input chips with a person use a 24 avatar) + label (13 / 500, 16 / 500 on mobile) + optional trailing remove button (input chips, removable filter chips).
- **Chrome:** 44 tall so a chip row aligns with every other control, radius 8, padding inline 12, gap 8, 1px `border-control` when unselected, wraps to new lines, never scrolls the page.
- **Chip set:** chips always appear in a set, `role="toolbar"` with `aria-label` (or `aria-labelledby`); one tab stop, arrow keys move between chips and into a chip's remove button.
- **Filter:** unselected `surface` + 1px `border-control`; selected `layer-2`, border removed, leading check, weight 500, `aria-pressed`. Removable filter chips add the trailing remove button.
- **Input:** the remove button is its own focus stop with an accessible name ("Remove Jakarta"); Backspace or Delete removes the focused chip and moves focus to the neighbor; a chip with no action of its own is remove-only (the label is not a button).
- **Suggestion** (AI prompts, quick replies): `layer-1`, one tap submits, no selected state. **Assist:** leading icon + action label, behaves as a button, may be a link.
- **States:** hover 8%; focus-visible outline; active 12% + `scale(0.98)`; disabled 38% and not focusable, or soft-disabled (focusable with arrow keys, Material `always-focusable`) when the set must stay discoverable; loading (a suggestion being sent) `aria-busy` on that chip; error on an input chip that failed validation = danger border + icon + the reason in the field message row; success is the chip appearing. No elevated chips: chips on an image sit below it or on a `surface` band.

## Records

### DataTable
From: Carbon.
- **Anatomy:** toolbar (search, filters, column settings, overflow menu; replaced by the batch-action row when rows are selected) > header row (optional select-all checkbox, sortable headers) > body rows (optional select checkbox, cells, optional expand toggle, optional inline row actions) > optional expanded content > pagination footer (rows-per-page select, range text, previous and next icon buttons).
- **Chrome:** a `surface` region with a full 1px `border` and container radius, `overflow: clip`. Header row `layer-1`, 13 / 500 `ink-muted`. Rows divided by 1px `border`. Numbers right-aligned with tabular figures. Batch-action row = `layer-2` toolbar with the selection count and 44 controls.
- **Density (1024 and up):** row height and cell padding from the product density (`SKILL.md`), one class on the app root.
- **Row states:** hover instant 8%; focus-visible inward outline on the row or cell (grid keyboard navigation); selected `layer-2` + checked checkbox; expanded content in `layer-1` directly below, toggle rotates (transform only); disabled 38%, not selectable.
- **Sort header:** unsorted (icon on hover and focus), ascending, descending, each with `aria-sort`; the whole header cell is a 44-tall button.
- **Table states:** loading = skeleton rows matching column widths; empty = EmptyState in the table body with one action; error = inline notification above the table with retry; filtered to zero = a "No results" row with a clear-filters action; batch success = transient toast.
- **Responsive contract:** below 640 each record becomes a stacked row (primary field as the title 16 / 500, two or three secondary fields as a 13 meta line, trailing chevron or action, 44+ targets). 640 to 1023: priority columns only, dropped columns reachable in the row detail. The page never scrolls horizontally. A sticky first column uses a 1px hairline edge, never a shadow.

### List and Item
From: Astryx anatomy, Material Web item types, line heights, slot sizes, and keyboard model (`<md-list>`, `<md-list-item>`).
- **Anatomy:** leading slot (icon 20 or 24, avatar 40, or image 56), text block (overline is not used; title 16 / 500 `ink`, description 13 `ink-muted`, clamped to one or two lines), trailing slot (meta text 13 `ink-muted`, badge, switch, checkbox, chevron, icon button).
- **Item types (Material):** text (static, `role="listitem"`, not focusable), button (acts in place), link (`<a href>`, navigates). Pick one type per list; never a clickable static row.
- **Chrome:** rows are flush inside their container (the radius belongs to the container), padding inline 16, padding block from the product density at 1024 and up; below 1024 minimum heights by line count: one line 56, two lines 72, three lines 88. Rows top-align; multi-line rows grow from content. Separation is one fixed gap or a 1px `border` Divider inset to the text start. Never `justify-content: space-between` or `flex-grow` to fill a card.
- **States:** interactive rows hover 8% instantly, focus-visible inward outline, pressed 12%, selected `layer-2` + check or weight 500, disabled 38% on all slots and removed from the tab order. Loading = skeleton rows of the same height; empty = EmptyState in place of the list; error = inline notification above the list with retry; success = the changed row updates in place, a toast for bulk actions.
- **Keyboard (interactive lists):** the list is one tab stop (`tabindex="-1"` on the list, roving `tabindex="0"` on the current item); Up and Down move, Home and End jump, navigation wraps at the ends unless the list is a menu or listbox that says otherwise.
- **Responsive:** below 640 trailing controls stay in the row (switches, chevrons); trailing meta text moves under the description when it would squeeze the title below 50% of the row.

### Divider
From: Material Web (`<md-divider>`).
- **When:** a structural boundary only: between list rows, between groups inside a menu or toolbar, between a pinned header and a scrolling body. Never ornament, never a connector, never to split content that spacing already separates.
- **Anatomy and chrome:** `block-size: 1px` (`--border-weight`), `background: var(--color-border)`, no border. Full-bleed between unrelated groups; inset to the text start (16, the list padding) between related rows (Material inset-start); inset on both sides only inside menus (8, the menu padding). Vertical divider between toolbar groups: 1 wide, 24 tall, centered.
- **States:** not interactive; no hover, focus, or press. Disabled, loading, error, and success do not apply.
- **A11y:** decorative by default (a CSS rule or `role="presentation"`); a native `<hr>` or `role="separator"` only when the boundary carries meaning for assistive tech, such as between menu groups.

## Containers

### Card family (Card, ClickableCard, SelectableCard, Tile)
From: Astryx, with Carbon's selectable tile and Material Web's card variants (labs `outlined-card`, `filled-card`) folded in.
- **Anatomy:** optional header (title + optional action), body, optional footer pinned with `margin-top: auto`.
- **Chrome:** `surface` on `page`, 1px `border`, container radius, `overflow: clip`, padding 16 (24 at 768 and up) minus the 1px border.
- **Variants:** default (`surface` + border, Material outlined card), muted (`layer-1`, Material filled card), transparent (spacing-only group). No elevated card. A card is only for a self-contained widget or a hard boundary.
- **ClickableCard:** the whole card is one action; hover 8%, active 12%, focus-visible outline around the whole card.
- **SelectableCard / selectable tile:** selected = spread-only ring `0 0 0 2px` in `ink` + check icon + optional tonal fill; unselected = 1px `border`. Never a side stripe, never an inset shadow.
- Cards in one grid share one shape: equal heights per row, repeated elements on one baseline, no internal void.

### Dialog, Modal, AlertDialog
From: Astryx anatomy and top-layer rules, Carbon states and sizing, Material Web return-value, labelling, and alert contracts (`<md-dialog>`).
- **Anatomy:** header (optional icon 24 above the title, title 23 / 600, optional description, close icon button always visible with a 44 hit area) > body (scrolls, bounded `max-block-size`) > footer (actions, secondary then primary, primary last; ghost buttons for low-emphasis actions).
- **Chrome:** native `dialog.showModal()`, `surface` + 1px `border-strong`, container radius, `--color-scrim`, no shadow, padding 24, hairline dividers above and below the body only when it scrolls.
- **Return value (Material):** actions live in `<form method="dialog">`; each action button carries a `value`, which becomes `dialog.returnValue`; the app reads it on the `close` event. Escape and the close button return an empty value, which always means cancel.
- **Sizes:** below 640 a full-width bottom sheet with 28 top corners and `safe-area-inset-bottom` (full-screen with a sticky header for multi-field tasks, Material full-screen dialog); a drag handle appears only when the sheet is actually resizable, and then it is a real 44 control with a name; from 640 fixed widths capped by the region, never percentage soup.
- **States:** opening opacity + scale from 0.98 at 200ms via `@starting-style` (content is not staged); open with focus trapped and the first field or primary action focused; submitting shows loading on the primary with the other actions disabled; error = inline notification in the body; success closes and confirms with a toast; closing about 140ms. Programmatic opens that are not a response to the user may skip the animation (Material `quick`). Focus is never untrapped in a modal.
- **AlertDialog:** `alertdialog`, not dismissible by scrim tap, the destructive confirm uses the destructive button and names the object.
- **A11y:** labelled by its title (`aria-labelledby`); a dialog without a visible title gets `aria-label`; focus returns to the opener on close.

## Overlays

### Menu and submenu
From: Material Web (`<md-menu>`, `<md-menu-item>`, `<md-sub-menu>`), positioned with the native top layer. Build: `.jal-menu`.
- **Anatomy:** a trigger (Button, Icon button, or Split button trigger with `aria-haspopup="menu"` and `aria-expanded`) > the menu (`role="menu"`, a `<div popover>` or a `<ul role="menu">` with `<li role="none">` wrappers) > items (`role="menuitem"`, `menuitemcheckbox`, or `menuitemradio`, as `<button type="button">` or `<a>`): check lane (20, reserved when any item is checkable so labels align), leading icon (20), label (16 / 400), trailing slot (shortcut text 13 `ink-muted`, or a chevron for a submenu). Groups are separated by a Divider with `role="separator"`; anything that is not an item is `role="none"`.
- **Chrome:** `surface` + 1px `border-strong`, `--radius-16` (popover tier), padding 8, min width 112, max width 288 or the viewport minus 32, max height 8 items then it scrolls inside with `overscroll-behavior: contain`. Items 44 min height, padding inline 12, gap 12, `--radius-8` (concentric: 16 minus 8), text wraps rather than truncates.
- **Positioning:** from 640, anchored to the trigger with CSS anchor positioning (`anchor-name` on the trigger, `position-anchor` on the menu, `data-anchor` on the menu opts in), below and start-aligned, flipping on either axis when it would leave the viewport (Material's flip behavior), 4 from the trigger; without anchor support the popover opens centered. Below 640 every menu is a bottom sheet (full width, 28 top corners, `safe-area-inset-bottom`).
- **States:** item hover 8% instantly; item focus-visible inward outline; item active 12%, no scale; checked (`aria-checked="true"`) = check icon + weight 500 + `layer-2`; submenu open (`aria-expanded="true"` on its item) = `layer-2`, the item stays highlighted while the submenu has focus; disabled item 38%, `aria-disabled="true"`, still focusable so the set reads in full; destructive item danger text (`data-tone="danger"`), placed last, confirming when the action cannot be undone; loading = a spinner row "Loading", `aria-busy` on the menu; error = a static row naming the failure with a retry item; success = the menu closes and the result shows in place or in a toast.
- **Submenu:** its item carries `aria-haspopup="menu"`, a trailing chevron (flipped in RTL), and opens to the inline end, aligned with its item's top (Material anchor corner start-end). Hover opens after a 300 intent delay and closes after 300 outside; ArrowRight (ArrowLeft in RTL), Enter, or Space opens and focuses its first item; ArrowLeft or Escape closes it and returns focus to its item. Below 640 a submenu replaces the sheet content with a back row at the top; submenus never cascade on a phone. At most one nesting level.
- **Keyboard:** opening focuses the first item (the last when opened with ArrowUp); Up and Down move and wrap; Home and End jump; typeahead jumps to the next item starting with the typed letters, the buffer clearing after 200ms; Enter or Space activates and closes (a checkable item may keep the menu open when the user is choosing several); Escape closes and returns focus to the trigger; Tab closes and moves on. Native `popover` gives light dismiss and Escape without JS; roving focus and typeahead are app JS.
- **Motion:** opens with opacity + scale from 0.98 at `--dur-200` from the anchored corner; closes instantly (the user is leaving it). No staggered items, no height reveal.
- **Component tokens:** `--jal-menu-container-color`, `--jal-menu-outline-color`, `--jal-menu-item-selected-container-color`.

### Tooltip (plain and rich)
From: Material Web tooltip tokens (`_md-comp-plain-tooltip.scss`, `_md-comp-rich-tooltip.scss`), inverse fill removed.
- **Plain tooltip:** a short text label (13 / 20 `ink`) that names or explains a control. `surface` + 1px `border-strong`, `--radius-8`, padding 4 by 8, max width 240, top layer (`popover="hint"` where supported, `manual` otherwise), placed above its trigger with 4 of clearance and flipped below when there is no room; it never covers the trigger.
- **Rich tooltip (toggletip):** title (16 / 600) + text (13) + optional action (ghost button). Opens on click or Enter, not hover, as a non-modal popover (`role="dialog"`, labelled by its title) with the Menu chrome; stays until dismissed.
- **States:** plain shows on hover after a 300 intent delay and instantly on keyboard focus, hides on pointer leave, blur, and Escape; it is never focusable and never holds links or buttons. Disabled triggers still get their tooltip when soft-disabled. Loading, error, and success do not apply.
- **Responsive:** touch surfaces get no hover tooltip; anything a tooltip says is reachable another way (visible label, helper text, or a toggletip).
- **A11y:** the trigger references the tooltip with `aria-describedby`; an icon button's accessible name lives on the button, and the tooltip repeats it for sighted pointer users.
- **Motion:** opacity in at `--dur-100`, out instantly.

## Feedback

### Notification (inline, toast, actionable) and Banner
From: Carbon model, re-chromed to the JAL notice pattern, Material Web snackbar placement for toasts.
- **Anatomy:** severity icon (20, its own shape per severity so meaning survives without color) > title that names the state (16 / 600 `ink`) > body (16 or 13 `ink-muted`) > optional action (secondary button, 44) > optional close icon button (44 hit area).
- **Chrome:** icon + title + tonal surface + full border. Surface `--color-<status>-surface`, border `--color-<status>-border` 1px on all four sides. Never a colored side, never a bar, never a shadow, never an inverse dark fill.
- **Inline / Banner:** in flow, at the top of the region it describes. **Toast:** top layer, stacked with a fixed gap 8, auto-dismiss with pause on hover and focus, `role="status"`, at most one action (Undo, Retry), never the only path to that action; below 640 it sits above the bottom tab bar with the 16 gutter and lifts the floating create action, from 640 it sits at the top inline end of the content region. **Actionable:** carries an action and never auto-dismisses. Danger uses `role="alert"`.
- **Motion:** enter opacity + translate 8 at 200ms, exit about 140ms, reduced motion = opacity only.

### Progress (linear and circular)
From: Material Web (`<md-linear-progress>`, `<md-circular-progress>`). Build: `.jal-progress`.
- **When:** linear for work with a known place in the layout (upload row, page top, a card being refreshed); circular for small in-place waits (inside a button, a list row, an empty region). Determinate whenever the fraction is known; indeterminate otherwise. Skeletons replace both when the expected content shape is known.
- **Anatomy:** `.jal-progress` wrapper holding a native `<progress>` (`value` and `max` for determinate, no `value` for indeterminate), plus visible text naming the work ("Uploading 3 of 12 files"). Circular determinate adds an `aria-hidden` SVG ring (`.jal-progress-ring`, `pathLength="100"`, value in `--jal-progress-value` 0 to 100, set inline so server rendering needs no client JS) and hides the bar visually while keeping the native element for assistive tech.
- **Chrome:** linear track 4 tall, full width, pill, `layer-2`; indicator `ink`, one color (Material's four-color cycle is dropped). Buffer (streaming media): a static `border-strong` segment from the value to the buffered point, never animated dots. Circular 24 inline or 48 standalone; ring stroke 4 at 48 (2 at 24), track `layer-2`, arc `ink`, starting at 12 o'clock and running clockwise.
- **States:** determinate value changes instantly (no width tween); indeterminate linear = a 40% `ink` segment traveling start to end in 1600ms (twice `--loop-spin`), linear timing, the one place loops may be linear; indeterminate circular = a quarter arc turning once per `--loop-spin`; paused = indicator at 38% plus the word "Paused"; error = indicator and text in `--color-danger` with the reason and a retry action, the bar stops; success = the bar is replaced by a success icon and text, then the region shows its content; disabled, hover, focus, and active do not apply (progress is never focusable). Show an indicator only after `--wait-skeleton` (300ms) so fast work never flashes.
- **Reduced motion:** travel and rotation stop. Indeterminate linear becomes a static full-width indicator at 38% and indeterminate circular a static quarter arc; the visible busy text carries the state. Determinate is unaffected.
- **Responsive:** linear always fills its region width; page-level linear progress pins to the top of the content region, under the header, never under the tab bar.
- **A11y:** native `<progress>` is a progressbar; name it with `aria-label` or `aria-labelledby`; use `aria-valuetext` when a count reads better than a percentage. Announce start and completion through a polite live region, never every tick. RTL mirrors linear travel.
- **Component tokens:** `--jal-progress-track-color`, `--jal-progress-indicator-color`.

### Badge and Token
From: Astryx (replaces StatusDot), Material Web labs badge sizes with the small dot removed.
Text label always present, optional leading icon, `layer-2` fill for neutral, status-tinted fill with status text for state, pill radius 9999, height follows text (13 / 500 / 20), min width 20 so a single digit reads as a circle-like pill. Never a bare dot (Material's 6px small badge is not used). Presence is text ("Online") or an icon with an accessible name. On a navigation destination the count badge sits in its own lane at the icon's inline end without covering the glyph, and counts above 99 read "99+"; the destination's accessible name includes the count ("Inbox, 3 unread").

### EmptyState and Skeleton
From: Astryx.
EmptyState: icon (24), title, one sentence, one primary action; fills its region so it never collapses. Skeleton: `layer-2` blocks matching the expected shape exactly, opacity pulse only, static under reduced motion.

## Navigation

### AppShell and mobile navigation bar
From: Astryx AppShell, Material Web navigation bar and navigation tab anatomy (labs `navigationbar`, `navigationtab`, `_md-comp-navigation-bar.scss`).
- **Implementation:** the shared `AppShell` component in `packages/ui` (grid sized to `100dvh`: header row, content region that scrolls on its own, tab bar row; nothing `position: fixed`). Never hand-roll a shell. One header height; Material's medium and large collapsing app bars are not used.
- **Below 640:** pinned header with `safe-area-inset-top`, independently scrolling content, bottom tab bar. The bar: 3 to 5 equal-width destinations, each an icon (24) above a label (11 / 500 / 16 or 13 / 500 / 20), the whole destination one target of at least 44 by 44; `surface`, one 1px `border` hairline on its top edge as the structural boundary, height 64 plus `env(safe-area-inset-bottom)`, no shadow. The bar is its own grid row, so nothing can hide under it. Labels are always visible, on every destination (Material's hide-inactive-labels mode is not used).
- **Bar states:** inactive `ink-muted`; active = `layer-2` pill 64 by 32 behind the icon (radius 9999) + label weight 600 `ink`, `aria-current="page"`, optionally the filled glyph; hover (pointer) `ink`; pressed 12% on the pill + `scale(0.98)`; focus-visible outline around the destination; disabled destinations are removed, not greyed; count badges carry text, never a bare dot; loading a destination shows the target screen's skeleton, never a spinner in the bar.
- **A11y:** a `<nav>` landmark with an `aria-label`, links with `aria-current="page"`; not a tablist (destinations are pages).
- **640 and up:** the same destinations move into the header row as top nav (44 items, active `layer-2`). A side navigation (rail or drawer, next spec) is allowed from 1024 when the product has more than 5 destinations. The destinations stay the same at every width.

### Navigation rail and drawer
From: Material Web navigation rail tokens (`_md-comp-navigation-rail.scss`) and labs navigation drawer (`navigation-drawer`, `navigation-drawer-modal`).
- **When:** from 1024, when a product has more than 5 top-level destinations or deep sections. Rail = up to 7 destinations where content width matters most; drawer = more destinations or grouped sections. One per product. Below 1024 the bottom bar (below 640) or top nav (640 to 1023) stays the primary navigation; a modal drawer may hold secondary destinations only.
- **Rail anatomy and chrome:** a fixed 80 width budget (`--space-80px`), `layer-1` background, separated from the `page` content region by that tonal step alone (no side line, no shadow). Destinations stacked from the top with an 8 gap: icon 24 above label (13 / 500 / 20), at least 56 tall; active pill 56 by 32 `layer-2` behind the icon. A label-less rail is not used.
- **Drawer anatomy and chrome:** a 256 width budget (`calc(var(--space-64px) * 4)`), `layer-1` background, the same tonal separation. Active items use `layer-2`, one step deeper. Optional group labels (13 / 500 `ink-muted`, sentence case, never uppercase) and Dividers between groups. Items 44 tall, padding inline 12, gap 12, icon 20, label 16 / 500, `--radius-8`, trailing count badge.
- **Modal drawer:** `dialog.showModal()` from the inline start, full height, width 320 or 85% of the viewport, `surface` + 1px `border-strong`, end corners 16 (Material large-end shape), scrim; opened by a header icon button with a name.
- **States:** item hover 8% instantly; focus-visible inward outline; active item `layer-2` + weight 600 + `aria-current="page"`; pressed 12%, no scale on drawer rows (scale on rail pills); disabled items are removed; loading shows the destination's skeleton; error and success belong to the destination screen. Modal drawer enters with `translateX` from the inline start at `--dur-300`, exits at `--dur-300-exit`, opacity only under reduced motion.
- **A11y:** `<nav>` with `aria-label`; links with `aria-current`; group labels are headings or `aria-labelledby` on the group list; the modal drawer traps focus, closes on Escape and scrim, and returns focus to its trigger.

### Tabs
From: Astryx, with Carbon tab detail and Material Web tab types and activation model (`<md-tabs>`, `<md-primary-tab>`, `<md-secondary-tab>`).
- **Types (Material):** primary tabs sit at the top of a content pane under the header and switch its main views; secondary tabs sit inside a content area to separate related content one level down. Same chrome, never both types in one tab list, never primary and secondary stacked without a heading between them.
- **Anatomy and chrome:** 44 tall, padding inline 16, optional icon (20, inline before the label; the stacked 64-tall icon-over-label tab is not used), optional count badge, optional dismiss (its own focus stop). Unselected `ink-muted` weight 500; selected weight 600 + `ink` + `layer-2` fill + `aria-selected`; disabled 38% with the dismiss suppressed. One full-width hairline divider under the whole tab list as the region boundary. Never an accent underline, never an inset stripe. Overflowing tabs scroll inside the list with a hard edge, no fade; the page never scrolls.
- **States:** hover 8% on unselected; focus-visible inward outline; active 12% on the tab surface; selected as above; disabled 38%; loading the panel shows its skeleton, the tab stays selected; error and success belong to the panel. The selected fill may slide to the new tab (transform only, `--dur-200`) or change instantly.
- **Keyboard (Material):** one tab stop; Left and Right move focus (mirrored in RTL), Home and End jump. Manual activation is the default (arrows move focus, Enter or Space selects), because a panel change may load data; automatic activation (select on focus) only when every panel is already in memory.
- **A11y:** `role="tablist"` with `aria-label`; every tab `aria-controls` its `role="tabpanel"`, and each panel is labelled by its tab (`aria-labelledby`); icon-only tabs have an accessible name.
- **SegmentedControl** is specified under Segmented button.

## Conversation

### AI chat
From: Astryx.
Message list (region fills, scrolls independently), composer pinned to the bottom of its region sharing the content line, tool calls and agentic states (thinking, streaming, tool execution, waiting) rendered with the system state language, suggestion chips for prompts on mobile. Bubbles and the composer take the container radius; 28 is reserved for page-level sheets. Scroll edges are hard with a hairline, never a fade.
