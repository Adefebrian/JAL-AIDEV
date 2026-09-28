# Astryx lens (default)

Source: Astryx by Meta, `@astryxdesign/core@0.6.3`, MIT, beta. Research digest `ds-research/astryx.md`. Paths below are repo-relative to the Astryx source; bare file names such as `tokens.stylex.ts` live under `packages/core/src/theme/`. Every JAL value is a JAL Core token from `jal-ui-taste`. Knowledge-only: never install `@astryxdesign/*`.

Astryx is a dense, desktop-first product-UI system (base 14px, controls 28/32/36px) that was built to be driven by agents. Take its method and doctrine. Leave its numbers.

## 1. What to take

### 1.1 Frame-first, outside-in layout doctrine (`layout.doc.dense.mjs`)

1. **Scaffold.** Pick the shell first: AppShell for nav apps, Layout + LayoutPanel for multi-pane tools, plain column for docs and forms. Give every fixed region a width budget. Decide fill versus capped: tables, charts, boards fill; prose, forms, lists cap. Set container policy (rows or card grid) before any content. Raw px only for structural widths.
2. **Structure.** Weakest container that still reads as a group: gap, then Divider, then Section (no border, the default page structure), then Card (self-contained widget or hard boundary). Records render as rows (Table or List) edge to edge with dividers. Never card soup, never cards in cards, never full-width Cards as page structure. Pinned header and footer share one padding and one content line with the body. Master-detail: fixed-width side panel; EmptyState fills it when nothing is selected so the region never collapses.
3. **Spacing.** The container owns padding; children have zero margins. Hold one content line per region: `container_inset = content_line - component_intrinsic_inset`. Verify by drawing a vertical line: every label touches it, only hover and selected backgrounds cross it. Grouping is contrast between tight and generous gaps; "same step everywhere means proximity does no work". Test by removing all borders and naming the groups from spacing alone.
4. **Breakpoints.** Write a per-region contract: divide, reveal, resize, or swap, each naming the mechanism that enforces it. Drop a region rather than shrinking everything uniformly. Side panel swaps to Dialog or BottomSheet. Nav swaps to mobile nav. Prefer container queries over ResizeObserver.

Bordered Card subtracts its 1px border from padding so the content line never moves (`Card/Card.tsx`). Concentric radius rule: inner radius = `max(0, outerRadius - padding)` (`shape.doc.mjs`).

### 1.2 Hierarchy (`typography.doc.mjs`)

- One lead per region. Rank by weight and ink, not by size.
- Exactly two text colors for content (primary and secondary), "nothing dimmer". Disabled color is never used for content.
- Support text steps to the secondary color, not a smaller size.
- Never set font-size or line-height by hand; tune base and ratio, never single tokens.
- No skipped heading levels; decouple visual level from semantic level (`accessibilityLevel`).
- Leading algorithm (`expandTypeScale.ts:240-262`): ratio 1.5 under 20px, 1.4 for 20 to 31px, 1.25 at 32px and up, snapped to the 4px grid with a floor of `fontSize + 4`. JAL Core line heights are already generated this way.

### 1.3 Generators, not hand lists

Type `round(base x ratio^step)`, radius `base x step x multiplier`, motion `base x ratio`. A theme changes two or three numbers, never individual tokens. JAL Core type is `round(16 x 1.2^step)` by this method.

### 1.4 Contract-guaranteed contrast (`theme/contrast.ts`, `expandColorScale.test.ts`)

Text at 4.5:1 or better and form-control boundaries at 3:1 or better, guaranteed by tone spacing and asserted in tests. Translucent colors are composited over their backdrop before measuring. `ensureContrastTone` walks a border tone until it reaches 3:1 against the surface. JAL note: `border-strong #d4d4d1` on `surface #ffffff` is well under 3:1, so a JAL field must never be identifiable by its border alone. Always pair it with a visible label above the field, and on focus step the border to `ink`. Raising a dedicated control-boundary token is Brian's call.

### 1.5 One interaction overlay language

Hover and press are translucent tints composited over whatever fill exists (Astryx 5% and 10%), so every variant and surface gets consistent states for free. JAL keeps the mechanism and uses the Material percentages (hover 8%, pressed 12%). Pressed matrix (`docs/design/user-states.md`), the exact part that paints pressed: CheckboxInput indicator, Collapsible trigger row, Link text, Slider thumb while dragged, Switch track and thumb, Tab surface, RadioList indicator, SegmentedControl unselected item (the selected item keeps its raised surface). Disabled never paints pressed.

### 1.6 State taxonomy (`docs/design/README.md`, `docs/design/system-states.md`)

- **User states:** rest, hover, press, focus, selection, manipulation.
- **System states:** disabled (muted, reason reachable), loading (skeleton matching the expected shape, no layout shift), processing (in place, no size change), status (muted in-flow, solid for compact or urgent, inverted overlay for transient), transient.
- **Agentic states:** thinking, streaming, tool execution, waiting, sync. Reuse user and system language first.
- Meaning never changes across prominence tiers. Busy must be readable without motion.

### 1.7 Elevation by stacking order (`elevation.doc.mjs`, `docs/design/elevation-hierarchy.md`)

Pick depth by how far a surface sits from the page, not by taste. One edge language per surface. State rings are never depth. Tonal order body, surface, card, popover also carries depth. Layering uses the native top layer (`popover`, `dialog.showModal()`, CSS anchor positioning), not z-index wars (`docs/architecture/layer-runtime.md`). JAL keeps the ordering rule and renders it with tonal steps and hairlines only.

### 1.8 Density and size cascade

- Density modes: compact (logs, monitors), balanced (most tables and lists), spacious (settings, short selection lists). Table first-cell inline padding compact 8, balanced 12, spacious 16 (`Table/table.stylex.ts:74-97`).
- One control size per row. Size cascade: explicit prop, then nearest provider, then component default (`docs/architecture/component-size-cascade.md`).
- Spacing guidance: small steps inside items, large steps between sections; never mix tokens with raw px in one component.

### 1.9 Accessibility rules worth copying

- Focus: one system ring, `:focus-visible` only, keyboard only. Input focus rings are never elevation.
- Hover gated by `@media (hover: hover)`; state meaning never depends on hover.
- Disabled: no hover, no pressed, default cursor, `aria-disabled` when a tooltip must explain why.
- Status never by color alone: icon, label, or text required.
- Invisible `::after` hit-area outsets for small clear or remove buttons on coarse pointers.
- Logical properties only (`no-physical-properties` lint), no hardcoded strings, IME-safe keydown.
- Modal close control must stay visible (`guard:modal-close`).
- Reduced motion keeps the same meaning with no travel.

### 1.10 Motion principles (`motion.doc.mjs`, `docs/design/motion.md`)

Motion carries meaning (response, continuity, entry, exit, spatial change). Weight sets timing. High-frequency hovers feel instant. Animation never blocks the next action. Things the user leaves (tooltip, hover card, menu) may vanish instantly. Exit mirrors entrance. Direction matches navigation depth. Contextual UI grows from its trigger. Loading is readable without animation. Easing `cubic-bezier(0.24, 1, 0.4, 1)` is adopted as the JAL standard curve.

### 1.11 Agent mechanics

WORKFLOW (discover, template skeleton, component doc) + RULES + mandatory SELF-CHECK re-read, which cut raw-CSS escapes about 4x (`packages/cli/foundation/agent-docs/agent-docs.mjs:424-468`). Typed per-component docs with anatomy, do and don't, and a per-part WCAG matrix (`Button/Button.doc.mjs`). Constrained layout grammar with a validator: padding is legal only on Card, Section, and AppShell (`packages/cli/api/layout/grammar/grammar.mjs`). JAL adopts the workflow in `SKILL.md` and the padding rule as law of thumb: only shells, sections, and cards own padding.

## 2. Translation table (Astryx to JAL Core)

| Astryx | Value (source) | JAL Core |
|---|---|---|
| Type base and ratio | 14, 1.2 (`expandTypeScale.ts`) | 16, 1.2: 11, 13, 16, 19, 23, 28, 33, 40, 48 |
| body | 14 / 400 / 20 | 16 / 400 / 24 |
| supporting | 12 / 400 / 20 | 13 / 400 / 20, ink-muted |
| label | 14 / 500 / 20 | 16 / 500 / 24 (13 / 500 / 20 in dense desktop rows) |
| h4, h3, h2, h1 | 14, 17, 20, 24 at 600 | 16/24, 19/28, 23/32, 28/36 at 600 |
| display-3, 2, 1 | 29, 35, 42 at 400 | 33/40, 40/48, 48/56 at 400 or 500, real hero or data callout only |
| Weights | 400, 500, 600, 700 | 400, 500, 600 only |
| Spacing | 0, 2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48 (`tokens.stylex.ts`) | 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. 28 becomes 24 or 32, 36 becomes 32 or 40, 44 is a control height, not a spacing step |
| Container padding | 16 (`--spacing-4`) | 16 mobile, 24 at 768 and up |
| radius inner, element, container, page, full | 4, 8, 12, 28, 9999 (`tokens.stylex.ts`) | 4, 8, 12 or 16, 28, 9999; role assignment per `jal-ui-taste` |
| size-element sm, md, lg | 28, 32, 36 | 44 for every input, select, date input, button |
| Icon sizes | 12, 16, 20, 24 (`Icon/IconSize.stylex.ts`) | 16, 20, 24 from koboyo, reicon.dev fallback |
| background-body | #F1F4F7 (neutral theme #f1f1f1) | `page` #fafaf9 |
| surface, card, popover | #FFFFFF | `surface` #ffffff |
| background-muted | #0536590C | `layer-1` #f5f5f4 |
| neutral (secondary button fill) | rgba(5,54,89,0.1) | `layer-2` #efefed |
| text-primary | #0A1317 (neutral #000000) | `ink` #1b1b1b |
| text-secondary | #4E606F (neutral #474747) | `ink-muted` #474747 |
| text-disabled | #A4B0BC (neutral #919191) | content at 38% state layer |
| border | #05365919 (neutral #00000014) | `border` hairline #e5e5e3 |
| border-emphasized | #CCD3DB (neutral #d4d4d4) | `border-strong` #d4d4d1 |
| accent | #0064E0 (neutral theme #1b1b1b) | `ink` as primary action; optional single brand accent, never purple family |
| overlay-hover, pressed | 5%, 10% | 8%, 12% |
| scrim | NL10 at 40% | neutral scrim, ink at 40%, dialogs only |
| status success, error, warning | #0D8626, #E3193B, #E9AF08 | JAL desaturated status tokens, real state only |
| shadow-low, med, high | blurred box-shadows | none; tonal step + hairline |
| Durations | fast 175, medium 410, slow 975 (neutral 125, 300, 700) | 100, 150, 200, 300; showcase 400, 600 |
| Easing | `cubic-bezier(0.24, 1, 0.4, 1)` | same, the one JAL curve |
| Breakpoints | 640, 768, 1024, 1280, 1536 (`themeAdaptations.ts:46`) | same; app-shell below 640 |
| Focus ring | 2px solid accent, 3px offset | `outline` in ink, instant, never animated; offset per `jal-ui-taste` |
| Fonts | system stack, Figtree (neutral) | JAL system stack; any new font needs Brian's sign-off |

## 3. Conflicts to shed (with exact JAL replacement)

| Astryx behavior | JAL replacement |
|---|---|
| `<Theme mode>` defaults to `'system'`, OS dark follows automatically (`theme/Theme.tsx:275`); gothic theme dark-only | Light is the hard default. Dark exists only behind an explicitly requested dark-mode toggle, never from `prefers-color-scheme`. Drop gothic |
| `linear-gradient(c, c)` stacked in `background-image` for hover and press overlays (`utils/interactionOverlay.stylex.ts`, Button, Switch, Slider, TabList) | `color-mix(in oklab, var(content) 8%, var(container))` for hover, 12% for pressed, or a `::before` flat fill animating opacity |
| Scroll-edge fade masks (`TabList.tsx:220`, `Carousel.tsx:182`, `ChatLayout.tsx:181`) | Hard edge. When content scrolls under a pinned region, a 1px `border` hairline on the region boundary |
| Sticky-column shadow gradient (`useTableStickyColumns.tsx:237`) | 1px `border` hairline on the sticky column edge, `surface` fill |
| `--shadow-low/med/high`, `elevation` prop on Card, Button, Banner, ChatComposer default `low`, baked shadows on overlays | No `elevation` prop. In-flow Card = `surface` + 1px `border` on `page`. Overlays (menu, popover, dialog, toast) = `surface` + 1px `border-strong`; dialogs add the neutral scrim. No elevated buttons |
| `StatusDot` as the recommended status primitive, AvatarStatusDot | No marker dots. Status = Badge or Token with text label + icon. Presence = text ("Online") or an icon with accessible name |
| Accent edge roles and TabList selected indicator line | Selection = full integrated ring (spread-only `0 0 0 2px`, or 1px `border` stepping to `ink`) or a tonal fill change. Tab selection = weight 600 + `ink` + `layer-2` fill. Never a side or bottom accent stripe |
| Purple and pink categorical tokens (purple bg #7952FF33, text #3E0697) | Deleted. Categorical hues only inside data visualization, never purple family, never in UI chrome |
| Default accent #0064E0, cool blue-grey body #F1F4F7 | `ink` primary on `surface`; `page` #fafaf9 (neutral chroma, never reads blue) |
| Control heights 28, 32, 36px; 44 only per component on coarse pointers | One 44px control token for input, select, date input, button. Density lives only in desktop table rows (40, 48, 56 at 1024 and up) |
| Divider for ornamental separation | Dividers only as structural boundaries (table rows, pinned header against scroll body). No decorative rules, no connectors |
| lucide-react icons (neutral theme dependency) | koboyo first, reicon.dev fallback |
| Chat radius 28 on bubbles and composer | Container radius role per `jal-ui-taste`; 28 reserved for page-level sheets |
| Em-dash in docs and CLI output | Commas, colons, periods in every UI string |
| "Guidance over enforcement" | Law is enforced mechanically (hooks, `ui_audit`); guidance covers the rest |
| Node CLI, pnpm, Vite and Next plugins, postinstall | Bun only. Port knowledge, never tooling |

## 4. Component anatomy and state models (core set)

All components use the JAL state recipe in `SKILL.md` (hover 8%, focus-visible outline, active 12% + scale 0.98, disabled 38% and 12%, loading, error, success). Only component-specific parts are listed.

### Button (`Button/Button.tsx`, `Button.doc.mjs`)
- **Anatomy:** leading Icon (optional), Label (required, also the accessible name), End content (Icon or Badge, optional), Spinner (replaces the icon while loading).
- **Variants to JAL:** primary = `ink` fill, `surface` label; secondary = `layer-2` fill, `ink` label; ghost = transparent, `ink` label; destructive = danger-tinted fill with danger text (Astryx neutral theme uses error-muted fill + error text, not solid red). Icon-only = 44x44 square, accessible name required.
- **Size:** 44 height, padding inline 16, gap 8, icon 20, radius per the control role.
- **States:** hover overlay composited on the fill, only when enabled and hover-capable; active overlay 12% + `scale(0.98)`; focus-visible keyboard only (destructive uses the danger color); disabled opacity path is replaced by the JAL 38%/12% rule; loading keeps width, `aria-busy`, "Loading" announced; `clickAction`-style async: auto loading + dedupe double clicks.
- **Rules:** one primary per view; labels describe the action; destructive needs confirmation; navigation uses a link, never a button.

### Text field (`Field/inputStyles.stylex.ts`)
- **Anatomy:** Label (above, always visible), Field wrapper (optional leading icon, input, end lane for clear, reveal, status icon, or processing indicator), Helper or status message row below.
- **Size:** 44 height, 1px `border-strong`, `surface` fill, 16px text (prevents iOS zoom), padding inline 12, gap 8.
- **States:** hover (enabled, not focused, hover-capable): border steps toward `ink` or 8% state layer on the fill; focus-within: border `ink` + spread-only ring `0 0 0 1px` ink, no blur; error, warning, success: border becomes the status token, status icon in the end lane, message text below, focus keeps the status border; disabled: 38% content, 12% container, no ring; processing keeps width and label with the indicator in the end lane; read-only: `layer-1` fill, no hover.
- Status always pairs color with icon and text (`useInputStatusIcon`, FieldStatus).

### Selector (select)
Same chrome as Text field, trailing chevron in the end lane, visually indistinguishable from an input except the chevron. Native `<select>` on touch. Items list in a popover: `surface` + 1px `border-strong`, item rows 44 tall, selected item = `layer-2` fill + check icon + weight 500.

### Card family (Card, ClickableCard, SelectableCard)
- **Anatomy:** optional header (title + optional action), body, optional footer pinned with `margin-top: auto`.
- **Chrome:** `surface` on `page`, 1px `border`, container radius, `overflow: clip`, padding 16 (24 at 768 and up) minus the 1px border.
- **Variants:** default (`surface`), muted (`layer-1`), transparent (spacing-only group). Use Card only for a self-contained widget or hard boundary.
- **ClickableCard:** whole card is one action; hover 8% layer, active 12%, focus-visible outline around the whole card.
- **SelectableCard:** selected = spread-only ring `0 0 0 2px` in `ink` plus a check icon; unselected = 1px `border`. Never a side stripe (Astryx DR4: "a selected rounded card receives an integrated boundary rather than a thick side stripe").

### Table (plugins: selection, sorting, filtering, pagination, grouping, tree, row expansion, sticky columns, column resize)
Records as rows, edge to edge, divided by 1px `border`. Header row `layer-1`. First-cell inline padding by density (8, 12, 16). Row hover instant 8% layer; selected row `layer-2` + checked checkbox. Sticky header and sticky column use a 1px hairline edge, no shadow. Below 640: stacked record rows. For heavy data tables prefer the Carbon DataTable anatomy.

### List and Item
- **Anatomy:** leading slot (icon 20 or 24, avatar), title (16 / 500), description (13, ink-muted), trailing slot (meta, badge, chevron, action).
- Rows top-aligned, one fixed gap or a hairline divider, min height 44 (56 for two-line on touch). Never `space-between` or `flex-grow` to fill a card.

### Dialog and AlertDialog
- **Anatomy:** header (title + visible close, 44 hit area), body (scrolls), footer (actions, primary last).
- **Chrome:** `surface`, 1px `border-strong`, container radius, neutral scrim, native `dialog.showModal()`, entry via `@starting-style` with opacity and transform, 200ms in, about 140ms out.
- Below 640 (Astryx AlertDialog small screen at `max-width: 640px`): full-width bottom sheet with 28 top corners and `safe-area-inset-bottom` padding.
- AlertDialog: non-dismissible by scrim, destructive confirm uses the destructive button.

### Banner and Toast
Banner: in-flow, `surface` or status-tinted `layer-1`, full 1px `border`, status icon + title + body + optional action. Toast: top-layer, `surface` + 1px `border-strong`, auto-dismiss with pause on hover and focus, `role="status"`. No shadow, no side stripe.

### Badge and Token (replaces StatusDot)
Text label always present, optional leading icon, `layer-2` fill for neutral, status-tinted fill with status text for state. Radius pill 9999. Height follows text (13 / 500 / 20), never a bare dot.

### TabList and Tab, SegmentedControl
TabList: 44 tall tabs, selected = weight 600 + `ink` + `layer-2` fill; unselected `ink-muted`; one full-width hairline divider under the whole tab list as the region boundary. Overflowing tabs scroll with a hard edge, no fade. SegmentedControl: `layer-1` track, selected segment `surface` + 1px `border` (it keeps its raised surface on press), unselected segments paint pressed.

### EmptyState and Skeleton
EmptyState: icon (24), title, one sentence, one primary action; fills a region so it never collapses. Skeleton: `layer-2` blocks matching the expected shape exactly, opacity pulse only, static under reduced motion.

### AppShell and mobile nav
Below 640: sticky header with `safe-area-inset-top`, independently scrolling content, fixed bottom tab bar with `safe-area-inset-bottom` (Material navigation bar anatomy in `material.md`). 640 to 1023: collapsible side nav or top nav. 1024 and up: side nav with a fixed width budget. Astryx swaps at `md` (`AppShell/AppShell.tsx:487`); JAL swaps at 640.

## 5. Product-fit signals and template families

Choose Astryx when the brief is a tool, not a brochure: tables, inboxes, consoles, admin, settings, editors, kanban, AI chat with tool calls; users return daily and scan dense data; multi-region layouts (side nav, content, detail panel, resizable panes, pinned header and footer); many screens built by agents or many hands; white-label from one codebase; heavy a11y, i18n, RTL needs.

Dilute it for marketing sites, editorial landings, one-off campaigns, and illustrative consumer apps: only the generators and spatial hierarchy rules carry over.

Template families to use as structural references (`packages/cli/assets/templates/pages/`, 56 templates): ai-chat, dashboard (7 variants), incident-console, ide, kanban-board, table (6 variants), settings (3 variants), form-wizard (5 variants), login (4 variants), messaging-shell, work-item-detail, product-detail, checkout-wizard. Copy structure only: shell, regions, width budgets, container policy. Never pixels, never values.
