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

Scales are generated, not hand-listed: type `round(base x ratio^step)`, radius by role, motion by a base and a ratio. A theme changes two or three numbers, never single tokens. All tokens live in one file (`packages/ui/src/tokens.css`), one line per token, so drift is impossible (Carbon's single-source discipline). Tokens use `var(--token, fallback)` so a scoped override reskins a subtree without JS (Material's token contract).

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
- **One overlay language.** Hover and press are tints of the content color composited over whatever fill exists, so every variant and surface gets consistent states for free. Percentages (Material): hover 8, focus 12, pressed 12, dragged 16, disabled content 38, disabled container 12. The state layer is one reusable utility (a `::before` flat fill whose opacity is set per state); no ripple.
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
