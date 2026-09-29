# JAL Core foundations

The rules every JAL surface is built on. Astryx doctrine is the base; Carbon and Material additions are marked where they come in. Every value is a JAL Core token from `jal-ui-taste`. Provenance and source values live in `sources.md`.

## 1. Layout doctrine: frame first, outside in

1. **Scaffold.** Pick the shell first: AppShell for nav apps, a multi-pane layout for tools, a plain column for docs and forms. Give every fixed region a width budget. Decide fill versus capped: tables, charts, and boards fill; prose (near 68ch), forms (near 640px), and lists cap; the page caps at 1280. Set the container policy per region before any content. Raw px only for structural widths.
2. **Structure.** The lightest container that still reads as a group: gap, then divider, then section (no border, the default page structure), then card (a self-contained widget or a hard boundary). Records render as rows edge to edge with dividers. Never card soup, never cards in cards, never full-width cards as page structure. Pinned header and footer share one padding and one content line with the body. Master-detail: a fixed-width side panel; an empty state fills it when nothing is selected so the region never collapses.
3. **Spacing.** The container owns padding; children have zero outer margins. Only shells, sections, and cards own padding. Hold one content line per region: `container_inset = content_line - component_intrinsic_inset`. Verify by drawing a vertical line: every label touches it, only hover and selected backgrounds cross it. Grouping comes from contrast between tight and generous gaps; the same step everywhere means proximity does no work. Test by removing every border and naming the groups from spacing alone.
4. **Breakpoints.** Write a per-region contract: divide, reveal, resize, or swap, naming the mechanism. Drop a region rather than shrinking everything uniformly. A side panel swaps to a dialog or bottom sheet below 640. Nav swaps to the bottom tab bar below 640. Prefer container queries over ResizeObserver.

A bordered card subtracts its 1px border from its padding so the content line never moves. Concentric radius: inner radius = `max(0, outer radius - padding)`.

## 2. Hierarchy and type

- One lead per region. Rank by weight and ink before size.
- Exactly two content text colors, `ink` and `ink-muted`, nothing dimmer. The disabled color is never used for content.
- Support text steps to `ink-muted`, not to a smaller size.
- Every text style resolves to one named role (Material's composite role discipline): display, heading, title, body, label, each fully specified by the JAL type table. Never an arbitrary size.
- Never set a font-size or line-height by hand; the scale is generated (`round(16 x 1.2^step)`), and line heights follow the leading algorithm: ratio 1.5 under 20px, 1.4 for 20 to 31px, 1.25 at 32px and up, snapped to 4px with a floor of size + 4.
- Display sizes may step across breakpoints inside the token itself (Carbon), for example 33 to 40 to 48 across 640 and 1024, declared once on the token, never in ad-hoc media queries.
- No skipped heading levels; visual level and semantic level are decoupled.

## 3. Generated scales and one source

Scales are generated, not hand-listed: type `round(base x ratio^step)`, radius by role, motion by a base and a ratio. A theme changes two or three numbers, never single tokens. All tokens live in one file (`packages/ui/src/tokens.css`), one line per token, so drift is impossible (Carbon's single-source discipline). Tokens use `var(--token, fallback)` so a scoped override reskins a subtree without JS (Material's token contract, specified in section 11).

## 4. Contrast by contract

Text at 4.5:1 or better and form-control boundaries at 3:1 or better, guaranteed by tone spacing. Translucent colors are composited over their backdrop before measuring. JAL Core ships `--color-border-control` #8f8e89 for exactly this (3.28 on surface, 3.14 on page, 3.01 on layer-1); controls use it on all four sides, cards and dividers keep `--color-border`. Status colors are re-chosen per surface to keep contrast.

## 5. Depth: contextual layers, stacking order, no shadow

- **Contextual layers (Carbon).** A nested container increments its layer context and every role token (background, hover, selected, border) resolves to the next step automatically; a card never needs to know which layer it sits on. JAL ramp, monotonic: `page` #fafaf9, `surface` #ffffff, `layer-1` #f5f5f4, `layer-2` #efefed, with a hairline wherever two planes meet.
- **Stacking order (Astryx).** Pick depth by how far a surface sits from the page, not by taste: body, surface, card, popover. One edge language per surface. Focus and state rings are never depth.
- **Top layer.** Menus, popovers, dialogs, and toasts use the native top layer (`popover`, `dialog.showModal()`, CSS anchor positioning), not z-index wars. They render as `surface` plus a 1px `border-strong`; dialogs add `--color-scrim`.
- No shadow at any level, ever.

## 6. Density

- One density context (set by `ui.density`, see `SKILL.md`) drives row height and cell padding together, never one without the other (Carbon mechanism).
- Modes: compact (logs, monitors), default (most tables and lists), comfortable (settings, short selection lists).
- Controls never change with density: every input, select, date input, and button is `--control-h` 44 at every density and every width. Density lives only in desktop table rows and record lists at 1024 and up.
- One control size per row. Small steps inside items, large steps between sections. Never mix tokens and raw px in one component.

## 7. State model

- **User states:** rest, hover, press, focus, selection, drag, manipulation.
- **System states:** disabled (muted, reason reachable), loading (skeleton matching the expected shape, no layout shift), processing (in place, no size change), status (muted in flow, solid for compact or urgent, inverted overlay for transient), transient.
- **Agentic states:** thinking, streaming, tool execution, waiting, sync. Reuse user and system language first.
- **One overlay language.** Hover and press are tints of the content color composited over whatever fill exists, so every variant and surface gets consistent states for free. Percentages (Material): hover 8, focus 12, pressed 12, dragged 16, disabled content 38, disabled container 12. The state layer is one reusable utility (a `color-mix` of content over container, or a `::before` flat fill whose opacity is set per state), bounded by the control's own shape; no ripple, no circle around small controls (spec: `components.md` State layer).
- **What paints pressed:** checkbox indicator, collapsible trigger row, link text, slider thumb while dragged, switch track and thumb (the handle also scales on press), tab surface, radio indicator, the unselected items of a segmented control (the selected item keeps its surface). Disabled never paints pressed.
- **Soft-disabled.** A disabled control whose reason must be explained stays focusable with `aria-disabled` and a reachable reason.
- Meaning never changes across prominence tiers. Busy must be readable without motion. Read-only is its own state (Carbon): `layer-1` fill, no hover, text selectable.

## 8. Motion principles

Motion carries meaning: response, continuity, entry, exit, spatial change. Weight sets timing. High-frequency hovers feel instant. Animation never blocks the next action. Things the user leaves (tooltip, hover card, menu) may vanish instantly. Exit mirrors entrance. Direction matches navigation depth. Contextual UI grows from its trigger. Loading is readable without animation. Product UI uses the productive durations (100, 150, 200, 300); showcase surfaces may use the expressive ones (400, 600) per `jal-motion`. One curve: `cubic-bezier(0.24, 1, 0.4, 1)`.

## 9. Accessibility

- Focus: one system ring, `:focus-visible` only, keyboard only, as an `outline` (never a shadow). Under `prefers-contrast` the outline switches to dotted. Invalid state reuses the same focus geometry in the danger color.
- Hover gated by `@media (hover: hover)`; meaning never depends on hover.
- Disabled: no hover, no press, default cursor, `aria-disabled` when the reason must be explained.
- Status never by color alone: icon, label, or text is required.
- Every icon-only control has an accessible name. Dialogs are labelled by their title; alert dialogs use `alertdialog`.
- Small clear or remove buttons get an invisible `::after` hit-area outset on coarse pointers so every target is at least 44 by 44.
- Logical properties only, no hardcoded strings, IME-safe keydown handling.
- A modal's close control stays visible.
- Reduced motion keeps the same meaning with no travel.
- Verify in three tiers (Carbon): automated scan (`ui_audit` plus contrast), then a keyboard-only pass, then a screen reader pass.

## 10. Agent mechanics and template families

- Workflow, rules, and a mandatory self-check re-read (see `SKILL.md`). Per-component specs carry anatomy, do and don't, and states, so an agent never guesses.
- Padding is legal only on shells, sections, and cards.
- Template families to use as structural references when the repo has no nearby screen: ai-chat, dashboard, incident-console, ide, kanban-board, table, settings, form-wizard, login, messaging-shell, work-item-detail, product-detail, checkout-wizard. Copy structure only (shell, regions, width budgets, container policy), never pixels or values.

## 11. Theming model

From: Material Web (`docs/theming/README.md`, `color.md`, `typography.md`, `shape.md`, `docs/support.md`, `docs/quick-start.md`, `docs/roadmap.md`, and the `tokens/versions/v0_192` system token files). Material owns the model; JAL Core owns every value. Nothing here adds a token to `tokens.css`: it defines how the existing tokens are layered, named, paired, and overridden.

### 11.1 The token contract with fallbacks

From: Material Web.
- **Three tiers.** Reference tokens hold raw values (the hex, px, and ms primitives at the top of each `tokens.css` group). System tokens name decisions and roles (`--color-surface`, `--color-ink`, `--text-0`, `--radius-8`, `--dur-150`, `--state-hover`). Component tokens name one part of one component (`--jal-switch-track-color`). Each component token maps to a system token, and each system token to a reference value. Components never read reference values directly.
- **Component token names:** `--jal-<component>-<part>[-<state>]-<property>`, for example `--jal-icon-btn-container-color`, `--jal-menu-item-selected-container-color`. The prefix is `jal`, never `md`, and there is no `comp` segment (Material omits it too).
- **Read with a fallback, never declared on `:root`.** A component resolves its parts once, at its root, into private custom properties: `--_container: var(--jal-icon-btn-container-color, transparent);`, then uses only the private names. Undeclared means the system default applies; a scoped declaration (`.billing-danger-zone { --jal-icon-btn-icon-color: var(--color-danger); }`) reskins that subtree without JS, without specificity fights, and without touching `ui.css`.
- **Override the key color, not every state.** State colors are derived from the key colors by the state layer (`color-mix`), so a reskin sets the container and content tokens only; hover, pressed, and disabled follow automatically (Material support FAQ: change the key color the component maps to). A component that needs a per-state override is a design smell.
- **Overrides are still under law.** A component token may only be set to a system token (never a raw hex, never a purple-family hue, never a gradient or shadow), and the pair it creates still meets 4.5:1 for text and 3:1 for boundaries. `ui_audit` checks the rendered result, not the token name.
- **No shadow parts.** Material reaches inside Shadow DOM with `::part()`; JAL Core has no Shadow DOM, so a part is styled by its class inside the component (`.jal-switch-track`), still only through its tokens.

### 11.2 System to component layering

From: Material Web component token maps (`_md-comp-*.scss`), re-keyed.

| Component part | System token (default) |
|---|---|
| Filled container (primary button, filled icon button, checked checkbox and radio, on switch track, slider thumb and fill, progress indicator) | `--color-ink` (`--color-primary`), content `--color-surface` (`--color-primary-contrast`) |
| Tonal container (secondary button, tonal icon button, selected segment, filter chip selected, active nav pill, selected list and menu item) | `--color-layer-2`, content `--color-ink` |
| Surface container (fields, outlined buttons, unselected segments and chips, menus, dialogs, tooltips) | `--color-surface`, content `--color-ink` |
| Muted container (read-only field, suggestion chip, table header, rail and drawer) | `--color-layer-1` |
| Inactive track (switch off, slider, progress) | `--color-layer-2` |
| Control boundary (field, checkbox, radio, switch track, slider track, outlined button, segment, chip) | `--color-border-control` |
| Overlay edge (menu, listbox, dialog, tooltip, popover) | `--color-border-strong` |
| Structural hairline (divider, card, table row) | `--color-border` |
| Secondary content (standard icon button, unselected tab, supporting text, off switch handle) | `--color-ink-muted` |
| State layers | `--state-hover`, `--state-focus`, `--state-pressed`, or `color-mix` of the part's content over its container |
| Disabled | `--state-disabled-content`, `--state-disabled-container` |
| Focus ring | `--color-focus` |

### 11.3 Color roles mapped to JAL roles

From: Material Web (`docs/theming/color.md`, `_md-sys-color.scss`). Material generates a scheme from five key colors; JAL Core ships one neutral white-first scheme and at most one accent. The pairing rule is kept: every fill role has one named content role with accessible contrast (Material's `on-*`).

| Material role | Pair | JAL role | Pair |
|---|---|---|---|
| primary | on-primary | `--color-primary` (ink) | `--color-primary-contrast` (surface) |
| primary-container | on-primary-container | `--color-layer-2` | `--color-ink` |
| secondary | on-secondary | `--color-ink-muted` (secondary content only, never a fill) | n/a |
| secondary-container | on-secondary-container | `--color-layer-2` | `--color-ink` |
| tertiary, tertiary-container | on-* | `--color-accent` only when `direction.md` sets one, otherwise not used | `--color-accent-contrast` |
| error | on-error | `--color-danger` | `--color-surface` |
| error-container | on-error-container | `--color-danger-surface` | `--color-danger` |
| background, surface, surface-dim | on-surface | `--color-page` | `--color-ink` |
| surface-bright, surface-container-lowest | on-surface | `--color-surface` | `--color-ink` |
| surface-container-low, surface-container | on-surface | `--color-layer-1` | `--color-ink` |
| surface-container-high, surface-container-highest | on-surface | `--color-layer-2` | `--color-ink` |
| on-surface-variant | n/a | `--color-ink-muted` | n/a |
| outline | n/a | `--color-border-control` | n/a |
| outline-variant | n/a | `--color-border` (and `--color-border-strong` on overlays) | n/a |
| inverse-surface, inverse-on-surface, inverse-primary | n/a | not used: tooltips and toasts are `surface` + `border-strong` | n/a |
| scrim | n/a | `--color-scrim` | n/a |
| shadow, surface-tint | n/a | not used (no shadow, no tint elevation) | n/a |

- Success, warning, and info have no Material role; they are JAL status tokens with the same fill and content pairing.
- No runtime scheme generation (Material theme builder, `material-color-utilities`, dynamic color from wallpaper): one fixed scheme, one optional accent recorded in `docs/design/direction.md`.
- Dark mode is the app's decision, never automatic; Material's own FAQ says the same and does not apply dark tokens from `prefers-color-scheme` on its own. JAL ships dark only behind an explicit toggle.

### 11.4 Typography roles mapped to the JAL type scale

From: Material Web (`docs/theming/typography.md`, `_md-sys-typescale.scss`). Material's five roles in three sizes become JAL roles with one value each. Tracking is always a discrete property (Material warns that its composite `font` shorthand cannot carry tracking).

| Material role | Material size / line / weight | JAL role | JAL tokens |
|---|---|---|---|
| display-large, medium, small | 57/64, 45/52, 36/44, 400 | display (real hero or data callout only) | `--text-6`/`--line-6` 48/56, `--text-5` 40/48, `--text-4` 33/40, 400 or 500, `--tracking-display` or `--tracking-heading`; marketing heroes may use `--text-display-1..3` |
| headline-large, medium, small | 32/40, 28/36, 24/32, 400 | heading (h1, h2, dialog title) | `--text-4` 33/40, `--text-3` 28/36, `--text-2` 23/32, 600 |
| title-large, medium, small | 22/28 400, 16/24 500, 14/20 500 | title (card, section, list title) | `--text-1` 19/28 600, `--text-0` 16/24 500, `--text-n1` 13/20 500 |
| body-large, medium, small | 16/24, 14/20, 12/16, 400 | body | `--text-0` 16/24 (inputs and all mobile body), `--text-0` 16/24, `--text-n1` 13/20 (supporting, meta) |
| label-large, medium, small | 14/20, 12/16, 11/16, 500 | label (buttons, chips, tabs, nav) | `--text-0` 16/24 500 on buttons and tabs, `--text-n1` 13/20 500 on chips, table headers, rail labels, `--text-n2` 11/16 500 on tab bar labels only |

- Typefaces: Material's brand and plain faces collapse to the one JAL system stack; a brand face needs Brian's sign-off. Weights 400, 500, 700 become 400, 500, 600.
- Component type is assigned by role, never by size: a component token such as `--jal-menu-item-label-font` would resolve to a role, not a px value. Material's `.md-typescale-*` classes have no JAL counterpart; components apply roles in their own CSS.

### 11.5 Shape scale by role

From: Material Web (`docs/theming/shape.md`, `_md-sys-shape.scss`). Shape is assigned by component tier, one radius per tier product-wide, never by Material's per-component defaults.

| Material corner | Value | JAL radius | JAL tier |
|---|---|---|---|
| none | 0 | not used on controls or cards; rows inside a container are square because the container owns the radius | list rows, table rows, menu and tab lists |
| extra-small | 4 | `--radius-4` | checkbox box, badge inner, split button inner corners, tags |
| small | 8 | `--radius-8` | buttons, fields, selects, chips, segments, menu items, drawer items, tooltips |
| medium | 12 | `--radius-12` | cards, Bento tiles, notices, table and list containers |
| large | 16 | `--radius-16` | dialogs, menus, popovers, the floating create action, modal drawer end corners |
| extra-large | 28 | `--radius-28` | bottom sheets (top corners only), page-level hero panels |
| full | 9999 | `--radius-pill` | icon buttons, switches, slider and progress tracks, radios, avatars, badges, nav pills |

- Asymmetric shapes keep Material's role logic: `extra-large-top` becomes the bottom sheet's 28 top corners, `large-end` the modal drawer's 16 end corners, split button inner corners take `--radius-4`.
- Increased and extra-extra-large steps from the Material labs (`lg-increased`, `xl-increased`, `xxl`) and shape morphing on press or selection are not used. Concentric rule: an inner radius is `max(0, outer - padding)` (menu 16, padding 8, items 8).

### 11.6 Motion tokens mapped to the JAL durations and the one curve

From: Material Web (`_md-sys-motion.scss`). JAL Core keeps four product durations, two showcase durations, and one curve.

| Material duration | ms | JAL |
|---|---|---|
| short1 | 50 | instant (no transition) |
| short2 | 100 | `--dur-100` |
| short3 | 150 | `--dur-150` |
| short4 | 200 | `--dur-200` |
| medium1 | 250 | `--dur-200` |
| medium2 | 300 | `--dur-300` |
| medium3 | 350 | `--dur-300` |
| medium4 | 400 | `--dur-400`, showcase only |
| long1 to long4 | 450 to 600 | `--dur-600`, showcase only |
| extra-long1 to 4 | 700 to 1000 | not used for transitions; constant loops use `--loop-*` |

- Easing: standard, emphasized, their accelerate and decelerate forms, and the legacy curves all become `--ease-standard` (`cubic-bezier(0.24, 1, 0.4, 1)`). Exits use the `-exit` durations (about 70% of the entrance), which replaces Material's accelerate curves. Linear timing is allowed only for constant loops (spinner turn, indeterminate progress travel).
- Component motion ported: menu open 500 becomes `--dur-200`, close 150 becomes instant; dialog open 500 becomes `--dur-200`, close 150 becomes `--dur-200-exit`; tab indicator 250 becomes `--dur-200` or instant; switch handle 300 with overshoot becomes `--dur-150` without overshoot; checkbox 350 and radio 300 become instant; linear indeterminate 2000 becomes twice `--loop-spin`; circular arc 1333 becomes one `--loop-spin` turn; focus ring 600 becomes instant.
- Every Material component that respects `prefers-reduced-motion` (focus ring, slider label) is matched, and JAL extends it to all: travel and scale collapse to an opacity change of `--dur-reduced` or less, loops stop, meaning stays readable without motion.

### 11.7 Density and touch targets

From: Material Web (`docs/roadmap.md` density goal, the `touch-target` wrapper in button, checkbox, radio, switch, chip, FAB, and icon button sources).
- Material separates the visual size of a control from its touch target (an 18 checkbox inside a 48 target) and lets density shrink controls on large displays. JAL Core keeps the separation and removes the shrink: the target is 44 at every density and width; the visual may be smaller (checkbox 20, radio 20, switch track 32 tall, slider thumb 20) only inside a row or box that is itself at least 44.
- There is no `touch-target="none"` equivalent. Density changes only desktop table rows and record lists (section 6); Material's planned spacing-based density is already the JAL density context.
- Two targets never sit closer than 8.

### 11.8 Accessibility guidance

From: Material Web (component docs accessibility sections, `docs/roadmap.md`, and the `forced-colors` rules in the component sources). These add to section 9.
- **Labels.** Every control has a visible label; add `aria-label` only where there is none or it is not descriptive enough (icon buttons, table row checkboxes, icon-only tabs, progress). Groups (radio groups, chip sets, segmented buttons, toolbars, tab lists) carry their own label (`legend`, `aria-label`, or `aria-labelledby`).
- **Toggles.** One stable name plus `aria-pressed`; a changing name only when the action itself changes.
- **Soft-disabled.** Disabled controls are removed from the tab order; soft-disabled controls (`aria-disabled="true"`) stay focusable when discoverability matters (toolbar items, chips, menu items), with no hover or press, and the reason reachable. Follows the WAI-ARIA guidance on focusability of disabled controls.
- **Structure.** Decorative dividers are hidden from assistive tech; meaningful ones are separators. Every tab controls a labelled tab panel. Dialogs are labelled by their title; urgent confirmations are `alertdialog`. Menus expose `menu`, `menuitem`, and `none` for everything else.
- **Forced colors.** Every component works under `@media (forced-colors: active)`: boundaries are real borders (they survive), selection and checked states also carry a shape or glyph cue, focus is an `outline` (survives), and checked fills may map to `Highlight` and `CanvasText`. State layers vanish in forced colors by design.
- **Screen readers.** The screen reader tier of section 9 covers at least one desktop reader (VoiceOver on macOS or NVDA) and, for phone-first surfaces, VoiceOver on iOS or TalkBack; Material verified VoiceOver, TalkBack, ChromeVox, JAWS, and NVDA.
- **Reduced motion.** See 11.6.

### 11.9 Platform floor

From: Material Web (`docs/support.md`: the latest two major browser versions, Chrome and Edge 120, Firefox 119, Safari 16.4). JAL Core targets the same floor. Features newer than it are progressive: `popover` (Safari 17, Firefox 125) falls back to an in-flow panel, CSS anchor positioning falls back to a centered popover or the mobile bottom sheet, `popover="hint"` falls back to `manual`, and `@starting-style` falls back to no entrance animation. `color-mix()` is inside the floor; `:has()` needs Firefox 121, so every `:has()` rule in JAL Core only adds polish (a muted label, a proxy focus ring on a hidden input) over a state that is already readable without it.
