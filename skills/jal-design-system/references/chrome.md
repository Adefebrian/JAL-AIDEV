# JAL Core chrome: the app-shell archetypes

Why this file exists: the kit gave every JAL page a signature, but the chrome around it (the desktop header and the mobile bottom bar) was one generic pattern: wordmark left, links, one button right, hairline under, and a stock tab bar. The chrome is now part of the identity. `AppShell` (`templates/monorepo/packages/ui/src/AppShell.tsx`, styles `.shell*` in `packages/ui/src/ui.css`) ships three header archetypes and three bottom bar archetypes, each distinct in structure, and every direction picks a pair by default.

Read with: `identity.md` (the kit), `directions.md` (section 2 chrome table, section 7a knobs), `components.md` (`md.nav_bar`, the state layer), `jal-motion` `SKILL.md` (durations, the one curve), `jal-frontend-rules` (the app-shell law).

## 1. What never changes (law)

- White-first. Depth comes from tonal layers (`page`, `surface`, `layer-1`, `layer-2`) and 1px hairlines only: no shadow, no gradient, no blur, no glow, no purple, no emoji, no eyebrow labels or numbered markers, no side lines, no overlap.
- Below 640px every screen is an app-shell: a pinned header (compact wordmark plus one action) and a bottom bar of 3 to 5 destinations. From 640px the same destinations move into the header. Every target is 44px or more (bottom bar items are 62 to 64px tall).
- One Primary nav. Every destination is one link in the DOM: the nav sits in the header bar, and below 640px it is `position: fixed` at the bottom edge. Nothing above it may carry a transform below 640px (a transformed ancestor would capture the fixed bar), so the header condenses by moving its children, never the header or the bar.
- No layout shift. The header keeps one height (`--shell-header-h`) in document mode; condensing moves only transforms and opacity. The shell reserves the bottom bar's height (`--shell-nav-h` plus the safe area), so content never sits under it.
- Floating chrome floats on the page tone. The island sits on a page-tone band and the dock on a page-tone tray, so scrolling content never shows in the inset around them.
- Reduced motion: no slide, no compaction, no hide; state changes are instant. `scroll="document"` (default) and `scroll="contained"` both work, and `getScroller` semantics are unchanged.
- A container never rounds past a third of its height, so chrome radius caps at 16 (the island, the dock, the split action) and the segmented track caps at 12, even in pill-control directions. Controls inside keep their tier.

## 2. The archetypes

### 2.1 Desktop and mobile header (`archetype.header`)

| Archetype | Structure | Rest | Condensed (after 24px scrolled) |
|---|---|---|---|
| `island` | an inset floating bar: 8px from the top and 8px from the sides below 640px (56 tall), 12px from the top from 640px (60 tall), its outer edge `--kit-margin` minus its inner padding so the wordmark still lands on the content edge; `surface`, a full 1px `border`, radius `min(--kit-radius-card, 16)`. Wordmark left, destinations centred in a segmented track (`layer-1`, radius `min(--kit-radius-control, 12)`) with one sliding thumb (`surface` plus a 1px `border`), the primary action right. | on a page-tone band | the hairline steps to `border-strong`; nothing moves |
| `rail` | a full-width bar on the kit grid. From 1024px the wordmark takes columns 1 to 3, the destinations start on column 4 (the first label's text on the column line, its pill outside it), the action ends on column 12. Destinations are text; active = weight 600, `ink`, and a small `layer-2` pill (32 tall, never an underline). | 64 tall below 640px, 72 from 640px, in the page tone, no hairline | the surface bar and its 1px hairline fade in at 56 tall; the row rises to its centre. Optional `hideOnScroll` (640px and up, document mode): hides on scroll down past 160px, returns on scroll up and on keyboard focus |
| `masthead` | two tiers for editorial and brand pages: from 640px a 72px wordmark row (the direction's display face at `--text-5`) over a 56px nav row (destinations centred, action right), one hairline under both. Below 640px one 64px row with the wordmark at `--text-2`. | page tone, one hairline | the wordmark scales to the `--text-1` size and rises, the nav row rises 72px, and the whole collapses into one 56px surface bar with a hairline |

Contained mode keeps each header in its condensed geometry (a 56px bar; the island keeps its inset) and changes only tone on scroll, because the header sits outside the scroller.

### 2.2 Mobile bottom bar (`archetype.bar`)

| Archetype | Structure | Active state | On scroll |
|---|---|---|---|
| `dock` | a floating inset dock: 12px from the sides and 12px above the safe area, 64 tall, `surface`, a full 1px `border`, radius `min(--kit-radius-card, 16)`, on a page-tone tray | one `layer-2` lozenge that slides between items (inset 4px) | compacts to 0.95 on scroll down past 64px, restores on scroll up; never hides |
| `bar` | a full-width edge bar, Material 3 navigation-bar anatomy (`md.nav_bar`): 64px row, `surface`, a 1px top hairline, icon in a 64 by 32 pill over a label | the pill fills `layer-2` and grows from 0.6 wide to full; label weight 600 `ink` | stays put |
| `split` | the dock with 3 or 4 destinations plus one detached primary action segment at its end (`primaryAction`, for example Buy or New): same height and radius, `primary` fill, `primary-contrast` label | the dock lozenge | the dock compacts; the action stays |

Shared by every bar: labels on one line (13px, 11px on a 320px phone, an ellipsis if they still do not fit); label-only destinations put the pill behind the label; `archetype.labels="active"` shows the label on the active item only (inactive icons centre, and every link keeps `aria-label`); press feedback scales the icon (or label) to 0.96 and darkens the state layer to 12% (the JAL state recipe: hover 8, pressed 12); badges are flat `ink` with `surface` text, a dot or a count capped at `9+`, inside the pill beside the icon, named on the link (`aria-label="Inbox, 12 new"`); safe-area insets on every edge.

### 2.3 Shared behaviour

- **Skip link.** First in the shell, off screen until focused, then a `surface` chip at the top left that jumps to `main` (`mainId`, default `main`).
- **Focus.** The global 2px `ink` ring, instant; inside the bottom bar it sits 2px inside the item, following its radius.
- **Current page.** `aria-current="page"` on exactly one link, set from `current`.
- **Scrollspy.** When every destination is an in-page anchor (`#id`), an IntersectionObserver rooted on the real scroller (`scrollerRoot(getScroller(main))`, after mount) marks the section crossing the band under the header as current. `spy={false}` turns it off.
- **More.** Up to 5 destinations fit everywhere. From 6, the header and the dock or bar show 4 plus More; the split bar with an action shows 3 plus More plus the action from 5. More opens one popover sheet (Escape and outside taps close it; a link closes it), anchored under the header from 640px and above the bar below 640px. When the current destination is in the sheet, More carries the active state. There is never a hamburger on desktop. More than 5 destinations logs a development warning (so does fewer than 3): the bottom bar law is 3 to 5, so cut the list.
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
| Rail row and masthead morph | transform | `--dur-300` / `--dur-300-exit` |
| Island thumb, dock lozenge slide | transform, width | `--dur-200` |
| Bar pill grows / shrinks | opacity, transform | `--dur-200` / `--dur-200-exit` |
| Dock compacts / restores | transform | `--dur-200-exit` / `--dur-200` |
| Header hides / returns | transform | `--dur-200-exit` / `--dur-200` |
| Active-only label | opacity, visibility | `--dur-150` / `--dur-150-exit` |
| Press, hover state layer | scale, background-color | `--dur-100` |
| More sheet opens / closes | opacity, translate 4px | `--dur-150` / `--dur-150-exit` |

The scroll state comes from one rAF-throttled, passive listener on the real scroller (window, or `main` when contained), cleaned up on unmount. It writes `data-scrolled` (past 24px), `data-dir` (flips after 6px of travel), `data-compact` (down, past 64px), and `data-hidden` (down, past 160px) on the shell, never React state, so scrolling never re-renders the page. Under reduced motion it still writes `data-scrolled` (an instant tone change) and never `data-compact` or `data-hidden`. The indicator reads the active item's box into `--shell-ind-x` and `--shell-ind-w` in a layout effect and again on resize, and shows once measured.

## 6. Checks

- `ui_audit` rule `mobile-app-shell`: a pinned header at the top and a nav whose box touches the bottom edge, 3 to 5 targets, each 44 by 44 or more. The dock passes because its nav box is the full-width tray at the bottom edge; the dock floats inside it.
- `ui_audit` tidiness rules (`radius-scale`, `overlap`, `overflow-parent`, spacing scale): the indicator is `aria-hidden` and `pointer-events: none`, badges sit inside the pill beside the icon, and every inset is on the 4px scale.
- `AppShell.test.tsx`: landmarks and `aria-current` for every pair, More and the sheet, the split overflow, badges, the scroll state machine, listener cleanup, the reduced-motion path, the indicator, scrollspy, and a CSS scan of the shell block (no gradient, shadow, blur, raw colour, or em-dash; every transition under `.shell-motion`; every direction mapped once).
