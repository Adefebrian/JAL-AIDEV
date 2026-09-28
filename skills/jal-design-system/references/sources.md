# JAL Core sources and provenance

JAL Core is one system. This file records where its pieces came from, the source values each JAL Core token replaced, and every source pattern JAL law removed. Use it to trace a decision or to port one more pattern from a source; never to pick a source for a product. Knowledge-only: none of these packages is ever installed.

## Astryx (Meta), the foundation

Source: Astryx by Meta, `@astryxdesign/core@0.6.3`, MIT, beta. Paths below are repo-relative to the Astryx source; bare file names such as `tokens.stylex.ts` live under `packages/core/src/theme/`. Every JAL value is a JAL Core token from `jal-ui-taste`. Knowledge-only: never install `@astryxdesign/*`.

### Translation to JAL Core

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

### Removed by JAL law (with the JAL replacement)

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

## Carbon (IBM), the data and form layer

Source: Carbon Design System by IBM, Apache-2.0. Paths below are repo-relative to the Carbon source (`packages/themes`, `packages/layout`, `packages/motion`, `packages/type`, `packages/styles/scss/components/*`). Every JAL value is a JAL Core token from `jal-ui-taste`. Knowledge-only: never install `@carbon/react`, `@carbon/styles`, or `@carbon/web-components`, and never compile Carbon Sass.

### Translation to JAL Core

| Carbon | Value (source) | JAL Core |
|---|---|---|
| background | #ffffff (white theme) | `page` #fafaf9 |
| layer-01, 02, 03 | #f4f4f4, #ffffff, #f4f4f4 | `surface` #ffffff, `layer-1` #f5f5f4, `layer-2` #efefed (monotonic) |
| field-01 | #f4f4f4 | `surface` with 1px `border-control` (fields sit on white) |
| border-subtle-00 | #e0e0e0 | `border` #e5e5e3 |
| border-strong-01 | #8d8d8d | `border-control` #8f8e89 (control boundaries, 3:1); focus steps to `ink` |
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

### Removed by JAL law (with the JAL replacement)

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

## Material 3 (Google), folded-in contracts

Source: Material Web (`@material/web` v2.5.0, tokens from Material 3 v0.192), in maintenance mode. Paths below are repo-relative to the material-web source; component token files are `tokens/versions/v0_192/_md-comp-*.scss`. Every JAL value is a JAL Core token from `jal-ui-taste`. Knowledge-only: never install `@material/web` or Lit.

### Translation to JAL Core

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
| outline | #79747e | `border-control` #8f8e89 on controls; focus steps to `ink` |
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

### Removed by JAL law (with the JAL replacement)

| Material behavior | JAL replacement |
|---|---|
| **Purple seed `#6750A4`** and the whole primary, secondary, tertiary palette generated from it (primary10 #21005d to primary90 #eaddff) | Never import or reference any Material palette literal. Primary = `ink`. A project may re-seed a tonal method with one non-purple brand accent. Containers use JAL neutrals |
| **Ripple** (`<md-ripple>`), a spreading circular ink fill on press | Flat state layer: opacity 0.12 fill of the content color over the container + `transform: scale(0.98)` on the control, no expanding circle |
| **Shadow elevation** levels 0 to 5 as dp shadows (`_md-sys-elevation.scss`: 0, 1, 3, 6, 8, 12), `<md-elevation>`, shadow appearing on hover (`hover-container-elevation: level1` on filled and tonal buttons), FAB at level3 (hover level4), menu level2, dialog level3, navigation bar level2 | Tonal step + hairline only. Hover changes the state layer, never adds depth. Floating surfaces = `surface` + 1px `border-strong`; the FAB-equivalent separates by `ink` fill contrast |
| Elevated button and elevated chip variants | Dropped; use secondary (`layer-2`) or outlined (1px `border-control`) |
| Dark scheme as a first-class, often OS-selected scheme (surface neutral6 #141218) | Light only by default. Dark only behind an explicitly requested toggle, never `prefers-color-scheme` |
| Content-derived text field height (varies with variant and supporting text) | Fixed 44 control; supporting and error text render below and never stretch the control |
| Filled text field with top-only radius and an active-indicator underline (`corner-extra-small-top`) | Outlined style only: full 1px border on all sides, one radius on all corners, no bottom indicator bar |
| Floating label animating into the outline | Static label above the field, always visible |
| Per-component radius scale (buttons pill, chips 8, dialog 28, menu 4) | JAL radius by role, one radius per tier product-wide |
| Material Symbols icon font | koboyo first, reicon.dev fallback, SVG with accessible names |
| Navigation bar active indicator as a colored pill in primary-container | Neutral `layer-2` pill behind the icon plus weight 600 `ink` label |
