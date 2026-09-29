# JAL Core chrome: the app-shell archetypes

Why this file exists: the kit gave every JAL page a signature, but the chrome around it (the desktop header and the mobile bottom bar) was one generic pattern: wordmark left, links, one button right, full width, hairline under (the AI nav fingerprint), and a stock tab bar. The chrome is now part of the identity. `AppShell` (`templates/monorepo/packages/ui/src/AppShell.tsx`, styles `.shell*` in `packages/ui/src/ui.css`) ships three header archetypes and three bottom bar archetypes, each distinct in structure, and every direction picks a pair by default.

Read with: `identity.md` (the kit), `directions.md` (section 2 chrome table, section 7a knobs), `components.md` (`md.nav_bar`, the state layer), `jal-motion` `SKILL.md` (durations, the one curve), `jal-frontend-rules` (the app-shell law).

## 1. What never changes (law)

- White-first. Depth comes from tonal layers (`page`, `surface`, `layer-1`, `layer-2`) and 1px hairlines only: no shadow, no gradient, no blur, no glow, no purple, no emoji, no eyebrow labels or numbered markers, no side lines, no overlap.
- Below 640px every screen is an app-shell: a pinned header (compact wordmark plus one action) and a bottom bar of 3 to 5 destinations. From 640px the same destinations move into the header. Every target is 44px or more (bottom bar items are 62 to 64px tall).
- One Primary nav. Every destination is one link in the DOM: the nav sits in the header bar, and below 640px it is `position: fixed` at the bottom edge. Nothing above it may carry a transform below 640px (a transformed ancestor would capture the fixed bar), so the header condenses by moving its children, never the header or the bar.
- No layout shift. The header keeps one height (`--shell-header-h`) in document mode; condensing moves only transforms and opacity. The shell reserves the bottom bar's height (`--shell-nav-h` plus the safe area), so content never sits under it.
- Floating chrome is judged against what scrolls under it. A full-width inset bar (the mobile island) sits on a page-tone band that ends at its bottom edge, and the dock sits on a page-tone tray whose top is its top edge, so no content shows in the few pixels around them. The desktop island floats free: a full-width band there would cut a page-tone strip across every tonal section scrolling under it (a broken band). It is opaque `surface` with a full hairline, the Floating pill verdict in `directions.md`.
- Reduced motion: no slide, no compaction, no hide; state changes are instant. `scroll="document"` (default) and `scroll="contained"` both work, and `getScroller` semantics are unchanged. A contained shell never condenses its geometry: the condense knobs are reset on the shell itself (a bundle computes them on the direction element against the document header height, so overriding only the transform would still move the row).
- Radius is concentric and capped. The island takes `min(16, card + 4)` and the dock `min(20, card + 8)`, never past a third of their height; everything nested subtracts its inset (the island's track and action take the island radius minus its 6px padding, the thumb 4px less again; the split action takes the dock radius minus 6px). Hard-edged directions (card 4) get 8 and 12.

## 2. The archetypes

### 2.1 Desktop and mobile header (`archetype.header`)

| Archetype | Structure | Rest | Condensed (after 24px scrolled) |
|---|---|---|---|
| `island` | one floating object, 56 tall, `surface` with a full 1px `border`. Below 640px a full-width inset bar 8px from the top and sides (wordmark on the content edge, the action 6px inside its end). From 640px it hugs its content and centres, 12px from the top with 12px of air under it (the header box is 80): the wordmark, a segmented track (`layer-1`) with one sliding thumb (`surface` plus a 1px `border`, 4px inside the track), and the primary action as the last segment, all on concentric radii. | floats; below 640px on its page-tone band | the hairline steps to `border-strong`; nothing moves |
| `rail` | edge to edge on the kit margin: the wordmark on the start edge at `--text-2`, the destinations and the action grouped on the end edge. Destinations are text; the one sliding indicator is a 32px `layer-2` pill (the control radius, capped at 16). The action draws a 36px fill inside a 44px target, a step quieter than the page's buttons. | 64 tall below 640px, 72 from 640px, transparent (a tonal first section runs up behind it), no hairline | a 56px surface bar with its 1px hairline fades in; the row rises to its centre and the wordmark settles to the `--text-1` size. Optional `hideOnScroll` (640px and up, document mode): hides on scroll down past 160px, returns on scroll up and on keyboard focus |
| `masthead` | a nameplate for editorial and brand pages. From 640px two tiers, 128 tall: the wordmark centred at `--text-6` in the direction's display face (72px row) over a 56px row holding the compact mark slot, the destinations centred, and the action; one hairline under both. Below 640px one 64px row with the wordmark at `--text-2`. | transparent, one hairline | the nameplate lifts 8px and fades, the row rises 72px into one 56px surface bar, and the compact mark (the wordmark at `--text-1`, hidden from assistive tech and out of the tab order) fades in on its start edge. Below 640px the wordmark scales to the `--text-1` size |

Contained mode keeps each header in its condensed geometry (a 56px bar; the island keeps its inset; the masthead shows its compact mark) and changes only tone on scroll, because the header sits outside the scroller.

### 2.2 Mobile bottom bar (`archetype.bar`)

| Archetype | Structure | Active state | On scroll |
|---|---|---|---|
| `dock` | a floating inset dock: 12px from the sides and 12px above the safe area, 64 tall, `surface`, a full 1px `border`, radius `min(20, card + 8)`, on a page-tone tray | one 56 by 32 `layer-2` pill that slides behind the active icon (behind the label box on a label-only dock); label weight 600 `ink` | scrolling down past 64px the labels fade, the icons and the pill settle 9px to the centre, and the dock draws in to 0.94; scrolling up restores it; it never hides |
| `bar` | the Material 3 navigation bar (`md.nav_bar`) on the bottom edge: a 64px `surface` row under one 1px top hairline, the icon in a 64 by 32 pill over a one-line label | the pill fills `layer-2` and grows from 0.6 wide to full; label weight 600 `ink` | stays put |
| `split` | the dock with its last segment loaded: 3 or 4 destinations, then the primary action (`primaryAction`, for example Buy or New) as a filled segment 6px inside the dock's end, `primary` fill, `primary-contrast` label, radius the dock's minus 6. With 4 destinations the action shows its icon only (its name stays in `aria-label`), so no label truncates | the dock pill | the dock compacts with the action inside it |

Shared by every bar: labels on one 16px line (13px, 11px on a 320px phone, an ellipsis if they still do not fit); label-only destinations put the pill behind the label; `archetype.labels="active"` shows the label on the active item only (inactive icons centre, and every link keeps `aria-label`); press feedback scales the icon (or label) to 0.96 and darkens the state layer to 12% (the JAL state recipe: hover 8, pressed 12); badges are flat `ink` with `surface` text, a dot or a count capped at `9+`, just past the icon's end edge inside the pill, named on the link (`aria-label="Inbox, 12 new"`); safe-area insets on every edge. Before the pill is measured (server render, no script), the active item wears its own pill, so the current page always shows.

### 2.3 Shared behaviour

- **Skip link.** First in the shell, off screen until focused, then a `surface` chip at the top left that jumps to `main` (`mainId`, default `main`).
- **Focus.** The global 2px `ink` ring, instant; inside the bottom bar it sits 2px inside the item, following its radius.
- **Current page.** `aria-current="page"` on exactly one link, set from `current`.
- **Scrollspy.** When every destination is an in-page anchor (`#id`), an IntersectionObserver rooted on the real scroller (`scrollerRoot(getScroller(main))`, after mount) marks the section crossing the band under the header as current. `spy={false}` turns it off.
- **More.** Up to 5 destinations fit everywhere. From 6, the header shows 4 plus More, a tidy popover sheet (Escape and outside taps close it; a link closes it) hung 12px under More with its end edge on More's end edge where CSS anchor positioning exists, under the header's end otherwise. Below 640px the bar rejects more than 5: it shows 4 plus More (never a scrolling bar) and the sheet opens above the bar, and a development warning asks you to cut the list (fewer than 3 warns too). The split bar with an action shows 3 plus More plus the action from 5. When the current destination is in the sheet, More carries the active state. There is never a hamburger on desktop.
- **Wordmark.** `title` renders as text, or `brand` renders an SVG wordmark with `title` as its accessible name; `brandHref` makes it a link.

## 3. Direction defaults

Unset, `archetype` follows the page direction (`data-direction` on or above the shell, `ui.css`). The prop always wins. One direction per page, as the law already requires.

| Direction | Header | Bottom bar | Labels | Why |
|---|---|---|---|---|
| none (the JAL Core default) | island | dock | all | the signature pair |
| D1 research_notebook | island | dock | all | the default direction wears the signature pair |
| D2 single_signal_ledger | island | split | all | one money action deserves its own segment |
| D3 blueprint_hairline | rail | bar | all | structure on the grid, edge-to-edge bars |
| D4 bone_white_gallery | island | dock | active | chrome steps back; the media leads |
| D5 calm_productivity | rail | dock | all | daily tools: a quiet bar that condenses, a soft dock |
| D6 clean_docs | rail | bar | all | reading surfaces want the plainest edges |
| D7 warm_paper_editorial | masthead | bar | all | the display face as the publication's nameplate |
| D8 quiet_care | island | dock | all | soft, inset, calm |
| D9 cinematic_hardware | island | split | all | Buy is always one tap away |
| D10 industrial_catalogue | rail | split | all | the grid plus an order action |
| D11 oversized_masthead | masthead | dock | active | the wordmark is the layout |
| D12 friendly_consumer | island | dock | all | rounded, floating, friendly |
| D13 precision_dark | rail | bar | all | an instrument panel: straight edges |

How it works: each archetype is a knob bundle, one CSS rule that sets the same `--shell-header-h`, `--shell-bar-h`, `--shell-nav-h`, and private `--_hd-*` (header) and `--_nb-*` (bottom bar) values. A bundle applies on the direction element, on the shell itself when the prop is set (`data-header`, `data-bar`, `data-labels`, which win), and on `html` through `:has()` so the html scroll-padding rule sees the same heights. Bundles read existing tokens only. A derived identity (`identity.md` section 3) maps itself to a pair in its contract and passes the prop.

## 4. How JEV picks

- **Header:** the contract names the nav archetype from the chrome table in `directions.md` section 2 (`hm.nav_fingerprint`). Map it: Floating pill or Floating chip to `island`; Edge-aligned minimal, Slab, Scroll morph, or Wordmark plus two links to `rail`; Masthead to `masthead`. Side rail, Command-K, and Terminal stay app-level additions on top of the shell. When the contract names none, the direction default applies, and the AI nav fingerprint is never the reason.
- **Bottom bar:** `ui.component_recipe` for the chrome region, candidates `shell.bar.dock`, `shell.bar.bar` (`md.nav_bar`), and `shell.bar.split`, plus `shell.labels.active` as a layer. `split` needs a real primary action (`primaryAction`); without one it is a dock.
- The build report logs `shell.header.<id>` and `shell.bar.<id>` next to the page's other recipe IDs.

## 5. Motion

One curve (`--ease-standard`) and the duration tokens only; every transition sits under `.shell-motion`, which AppShell sets one frame after the first paint and only when `prefers-reduced-motion` is not `reduce`, so a restored scroll position never animates in.

| Moment | Property | Duration |
|---|---|---|
| Condensed layer and hairline appear / leave | opacity | `--dur-200` / `--dur-200-exit` |
| Rail row, wordmark settle, masthead morph | transform | `--dur-300` / `--dur-300-exit` |
| Nameplate fades, compact mark appears | opacity | `--dur-200` / `--dur-150-exit` |
| Island thumb, rail pill, dock pill slide | transform, width | `--dur-200` |
| Bar pill grows / shrinks | opacity, transform | `--dur-200` / `--dur-200-exit` |
| Dock compacts / restores (labels, icons, scale) | opacity, translate, transform | `--dur-200-exit` / `--dur-200` |
| Header hides / returns | transform | `--dur-200-exit` / `--dur-200` |
| Active-only label | opacity, visibility | `--dur-150` / `--dur-150-exit` |
| Press, hover state layer | scale, background-color | `--dur-100` |
| More sheet opens / closes | opacity, translate 4px | `--dur-150` / `--dur-150-exit` |

The scroll state comes from one rAF-throttled, passive listener on the real scroller (window, or `main` when contained), cleaned up on unmount. It writes `data-scrolled` (past 24px), `data-dir` (flips after 6px of travel), `data-compact` (down, past 64px), and `data-hidden` (down, past 160px) on the shell, never React state, so scrolling never re-renders the page. Under reduced motion it still writes `data-scrolled` (an instant tone change) and never `data-compact` or `data-hidden`. The indicator reads the active item's box into `--shell-ind-x` and `--shell-ind-w` in a layout effect and again on resize (a ResizeObserver on its track), and shows once measured; the island's thumb and the rail pill take the item box, the dock pill centres a 56px pill on it.

## 6. Checks

- `ui_audit` rule `mobile-app-shell`: a pinned header at the top and a nav whose box touches the bottom edge, 3 to 5 targets, each 44 by 44 or more. The dock passes because its nav box is the full-width tray at the bottom edge; the dock floats inside it. The split action counts as one of the 5.
- Lawful shapes the audit reads correctly: the header action's quieter 36px fill takes its 44px target from a `::after` hit area (a transparent border reads as a side stripe), and the split's icon-only action carries its name in `aria-label` (a visually hidden span reads as clipped text).
- `ui_audit` tidiness rules (`radius-scale`, `overlap`, `overflow-parent`, spacing scale): the indicator is `aria-hidden` and `pointer-events: none`, badges sit inside the pill beside the icon, and every inset is on the 4px scale.
- `AppShell.test.tsx`: landmarks, the skip link, and `aria-current` for every pair, the one indicator, the compact mark, More and the sheet, the split overflow, badges, the scroll state machine, listener cleanup, the reduced-motion path, the indicator on a current change, scrollspy, and a CSS scan of the shell block (no gradient, shadow, blur, raw colour, or em-dash; every transition under `.shell-motion`; every direction mapped once; every knob set by every bundle of its kind; concentric capped radii; compaction only below 640px under `.shell-motion`; contained mode resetting the condense knobs after every bundle).
- The nav preview (a scratch Bun.build page over the kit, `?h=&b=&d=&n=&scroll=&labels=&hide=&auto=1`) is the visual gate: `ui_shots` at 375 and 1280 with a scrolled screen, and `ui_audit` at all five widths, PASS with zero violations.
