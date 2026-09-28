# Combined recipe index: every source, one lookup

**Experience levels and surfaces.** `ui.experience` places a page on the spectrum `modern`, `modern_motion`, `modern_immersive`, or `immersive`. The "surfaces" column in this index is per section:
- `product_ui`: a daily-use app screen, allowed on any page level
- `marketing`: a persuasive page section, on `modern` and above
- `immersive`: a section that passed `imm.gate`, on `modern_immersive` and `immersive` pages

One page can mix all three.

One row per recipe from every source Brian supplied, so any recipe can be mixed with any other on any surface where it is allowed. Agents assemble `ui.component_recipe` (product and marketing) and `imm.recipe` (immersive) candidates from this file in one lookup, then grow each section with the layering protocol (section 4). The full recipe always lives in the file named in the last column; this index never replaces it.

## 0. How to read the tables

**Lookup in four moves:** (1) find the section kind in section 3; (2) take the candidate IDs for each role; (3) drop rows whose Surf, Tier, Cost, Mobile, or Law column fails the section (precheck, no JEV); (4) ask JEV for the top pick, then run the layering protocol.

**Surf** (surfaces allowed): `P` product_ui, `M` marketing, `I` immersive.

**Tier** (lowest `motion.intensity` tier that allows the recipe, plus its class from `jal-motion` components section 7.1): `S` state (carries a state change), `E` entrance, `G` signature, `Q` sequence (scroll or page-level). `-` means static (no motion of its own). A recipe marked `host` inherits the tier of the recipe it modifies.

**Cost** (`jal-motion` components section 2.1, with the immersive GPU grade after the slash when there is a canvas):

| Tier | Meaning | GPU grade (`jal-immersive` SKILL section 4) |
|---|---|---|
| T0 | CSS only | C0 |
| T1 | small vanilla JS (IntersectionObserver, WAAPI, pointer vars), under 1 KB | C0 |
| T2 | Framer Motion or one rAF loop (includes a 2D canvas) | C0, or C1 for a 2D canvas |
| T3 | GSAP ScrollTrigger with Lenis, lazy per route | C0 |
| T4 | Three.js / R3F / drei, lazy `import()`, poster first | C1 under 1 ms, C2 1 to 2.5 ms, C3 over 2.5 ms |

`est.` marks a noyzzi estimate: re-tier after reading the code from `noyzzi_get`.

**Law**: `full` (Zone A everywhere), `canvas` (Zone B: natural light and shade inside a JAL canvas, still no bloom, glow, neon, purple, chromatic aberration, full-bleed colour field, additive blend), `noyzzi: <flags>` (Zone C: visual law exempt inside a `data-jal-exempt="noyzzi"` section only; mechanical rules still bind). Zones are defined in `jal-immersive` `SKILL.md` section 2.

**File keys** (all paths under `skills/`):

| Key | File |
|---|---|
| DS-C | `jal-design-system/references/components.md` |
| DS-F | `jal-design-system/references/foundations.md` |
| DS-D | `jal-design-system/references/directions.md` |
| DS-K | `jal-design-system/references/craft.md` |
| DS | `jal-design-system/SKILL.md` |
| FR | `jal-frontend-rules/SKILL.md` |
| MO | `jal-motion/SKILL.md` |
| MC | `jal-motion/references/components.md` |
| MS | `jal-motion/references/showcase.md` |
| IM | `jal-immersive/SKILL.md` |
| NZ | `jal-immersive/references/noyzzi.md` |
| CR | `jal-immersive/references/effects-cleanroom.md` |
| SH | `jal-immersive/references/shaders.md` |
| PX | `jal-immersive/references/particles-physics.md` |
| SC | `jal-immersive/references/scroll-choreography.md` |
| FM | `jal-immersive/references/frames.md` |
| R3 | `jal-immersive/references/r3f.md` |
| TF | `jal-immersive/references/three-foundations.md` |
| PF | `jal-immersive/references/performance.md` |
| JC | `jal-jev/references/catalog.md` |

**ID aliases** (both forms resolve to the same row; log the canonical form):
- `Rnn` is the canonical key of a Magic UI or Animata recipe. The index lists it under the lead source's prefix (`mu.` Magic UI, `an.` Animata); the other prefix is an accepted alias (`mu.R13` in JC and `mu.R21` in IM section 4.6 both resolve).
- `nz.fx.<slug>` (canonical, IM section 4.2) = `nz.effect.<slug>` (JC). `nz.el.<id>` (canonical, IM section 4.3) = `nz.element.<id>`.
- Particle tiers 3 to 6 are the `three.*` rows marked `px tier n`; `px.tn` resolves to them.
- `md.<kit>.<part>` is a designmd class (section 1.12), never a fixed row.

## 1. Recipe rows

### 1.1 JAL Core component and layout specs (`core.*`)

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `core.button` | JAL Core (Astryx, Material) | component | P M I | 0 S | T0 | 44 at every width; icon-only 44 by 44 | state layers only; no press scale | full | DS-C Button |
| `core.fab` | JAL Core (Material) | component | P | 0 S | T0 | phone only; 640 up moves to page header | opacity only | full | DS-C Floating create action |
| `core.text_input` | JAL Core (Carbon) | component | P M I | 0 S | T0 | 16px input text, 44 field, reserved message row | no transition needed | full | DS-C TextInput (incl. PasswordInput, Textarea) |
| `core.select` | JAL Core (Carbon) | component | P M I | 0 S | T0 | native `<select>` | n/a | full | DS-C Select |
| `core.date_picker` | JAL Core (Carbon, Astryx) | component | P M | 0 S | T1 | below 640 native date input or bottom sheet | popover opacity only | full | DS-C DatePicker |
| `core.chips` | JAL Core (Material) | component | P M I | 0 S | T0 | wraps, 16/500 label | n/a | full | DS-C Chips |
| `core.table` | JAL Core (Carbon) | layout (records) | P M | 0 S | T0 | below 640 stacked rows; 640 to 1023 priority columns; no page h-scroll | expand toggle instant | full | DS-C DataTable |
| `core.list` | JAL Core (Astryx, Material) | layout (records) | P M I | 0 S | T0 | tappable row at least 56 below 1024 | n/a | full | DS-C List and Item |
| `core.card` | JAL Core (Astryx) | layout (container) | P M I | 0 - | T0 | padding 16 below 768 | n/a | full | DS-C Card family |
| `core.clickable_card` | JAL Core (Astryx) | component | P M I | 0 S | T0 | whole card one target | state layer only | full | DS-C Card family |
| `core.selectable_card` | JAL Core (Astryx, Carbon) | component | P M | 0 S | T0 | same | n/a | full | DS-C Card family |
| `core.dialog` | JAL Core (Astryx, Carbon) | component (overlay) | P M I | 0 S | T0 | below 640 bottom sheet (28 top corners) or full screen | opacity only | full | DS-C Dialog |
| `core.alert_dialog` | JAL Core (Astryx, Carbon) | component (overlay) | P M | 0 S | T0 | bottom sheet | opacity only | full | DS-C Dialog, AlertDialog |
| `core.notification` | JAL Core (Carbon) | component (feedback) | P M I | 0 S | T0 | same; toast stack gap 8 | opacity only | full | DS-C Notification (inline, toast, actionable) |
| `core.banner` | JAL Core (Carbon) | component (feedback) | P M | 0 - | T0 | same | n/a | full | DS-C Notification and Banner |
| `core.badge` | JAL Core (Astryx) | component | P M I | 0 - | T0 | same | n/a | full | DS-C Badge and Token |
| `core.empty_state` | JAL Core (Astryx) | component | P M | 0 - | T0 | fills region | n/a | full | DS-C EmptyState |
| `core.skeleton` | JAL Core (Astryx) | component (loading) | P M I | 0 S | T0 | same shape | static blocks | full | DS-C Skeleton; motion in `an.R40` |
| `core.app_shell` | JAL Core (Astryx, Material) | layout (shell) | P | 0 - | T0 | below 640 pinned header, own-scroll content, bottom tab bar | n/a | full | DS-C AppShell; template `packages/ui` `AppShell` |
| `core.top_nav` | JAL Core (Astryx) | layout (navigation) | P M | 0 S | T0 | swaps to `core.app_shell` tab bar below 640 | n/a | full | DS-C AppShell (640 and up) |
| `core.side_nav` | JAL Core (Astryx) | layout (navigation) | P | 0 S | T0 | tab bar below 640 | n/a | full | DS-C AppShell (1024 and up); GAP 1 |
| `core.tabs` | JAL Core (Astryx, Carbon) | component | P M I | 0 S | T0 | tabs scroll inside the list, hard edge | n/a | full | DS-C Tabs; motion in `an.R13` |
| `core.segmented` | JAL Core (Astryx) | component | P M I | 0 S | T0 | same | n/a | full | DS-C SegmentedControl |
| `core.ai_chat` | JAL Core (Astryx) | layout (conversation) | P M | 0 S | T1 | suggestion chips for prompts; composer pinned | agentic states readable without motion | full | DS-C AI chat |
| `core.rows` | JAL Core | layout | P M I | 0 - | T0 | stacked title plus meta line | n/a | full | FR Rows vs Bento, Rows recipe |
| `core.bento` | JAL Core | layout | P M I | 0 - | T0 | one column below 640 | n/a | full | FR Bento Grid recipes |
| `core.divided_section` | JAL Core | layout | P M I | 0 - | T0 | same | n/a | full | FR Rows vs Bento; DS-F section 1 |
| `core.plain_spacing` | JAL Core | layout | P M I | 0 - | T0 | same | n/a | full | FR Rows vs Bento; DS-F section 1 |
| `core.master_detail` | JAL Core (Astryx) | layout | P | 0 - | T0 | side panel swaps to dialog or bottom sheet below 640 | n/a | full | DS-F section 1 (structure, breakpoints) |
| `core.browser_surfaces` | JAL Core (impeccable) | layout (chrome) | P M I | 0 - | T0 | same | n/a | full | DS-K section 2, browser-surface recipe |
| `core.menu_popover` | JAL Core (Astryx) | component (overlay) | P M I | 0 S | T0 | bottom sheet below 640 (inferred) | opacity only | full | DS-F section 5 top layer; GAP 2 |
| `core.tooltip` | JAL Core (Astryx) | component (overlay) | P M | 0 S | T0 | no hover on touch | instant | full | DS-F section 8 (motion); GAP 2 |
| `core.checkbox_radio` | JAL Core (Astryx, Material) | component | P M I | 0 S | T0 | 44 hit area | n/a | full | DS-F section 7 (what paints pressed); GAP 3 |
| `core.switch` | JAL Core (Astryx, Material) | component | P M I | 0 S | T0 | 44 hit area | instant | full | DS-F section 7; motion in `an.R17`; GAP 3 |
| `core.slider` | JAL Core (Material) | component | P M | 0 S | T0 | 44 thumb hit area | n/a | full | DS-F section 7; GAP 3 |
| `core.tpl.<family>` | JAL Core (Astryx) | layout (class) | P | 0 - | T0 | per family | n/a | full | DS-F section 10: ai-chat, dashboard, incident-console, ide, kanban-board, table, settings, form-wizard, login, messaging-shell, work-item-detail, product-detail, checkout-wizard; GAP 4 |

### 1.2 Magic UI (`mu.*`) and Animata (`an.*`) recipes

Every row: DOM, mechanism, timing, reduced motion, CSS and Tailwind sketches in MC section 4 under the recipe number. Source components per recipe are in MC section 3. The DROP list (MC section 6) is never a candidate.

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `mu.R01` | Magic UI (blur-fade) | reveal | P M I | 1 E | T1 | same, 4px travel at product tokens | opacity only, no delay | full: no blur | MC R01 |
| `an.R02` | Animata + Magic UI (text-animator, text-animate) | text motion | P M I | 1 E product presets, 2 G showcase presets | T1 | same; chars only for 24 characters or fewer | no split, whole-string crossfade at `--dur-reduced` | full | MC R02; JC `ui.text_reveal_granularity` |
| `an.R03` | Animata (mask-reveal-up) | text motion | M I | 2 G | T1 | same, re-split on width | inner at rest, crossfade, no stagger | full | MC R03 |
| `mu.R04` | Magic UI + Animata (text-reveal, scroll-reveal) | text motion (scroll) | M I | 3 Q | T0 (CSS scroll timeline) or T3 fallback | same | every word at 1, no sticky | full; one per page | MC R04 |
| `mu.R05` | Magic UI + Animata (word-rotate, cycle-text) | text motion | M I | 2 G | T1 | same, width reserved | first word only | full; one per page | MC R05 |
| `an.R06` | Animata + Magic UI (roll-text, text-3d-flip) | hover | P M I | 0 S nav, 2 G showcase | T0 | touch: state layer only | no roll, state layer | full | MC R06 |
| `mu.R07` | Magic UI + Animata (number-ticker, counter) | data viz (text) | M I | 1 E (showcase tokens at 2) | T1 | same | final value at once | full; ink, width reserved | MC R07; JC `ui.number_motion` |
| `an.R08` | Animata (ticker) | data viz | P M I | 0 S live, 1 E entrance | T0 | same | instant digit swap | full | MC R08 |
| `mu.R09` | Magic UI + Animata (hyper-text, gibberish) | text motion | M I | 2 G | T1 | same | final text | full; one devtool or security word, once | MC R09 |
| `mu.R10` | Magic UI + Animata (terminal, typing) | demo (text) | M I | 2 G | T1 | code scrolls inside itself | all lines, no caret | full; no fake terminal chrome; under 5s | MC R10 |
| `mu.R11` | Magic UI (animated-shiny-text) | text motion | M I | 2 G | T1 | same | none needed (finite one-shot) | full; never infinite | MC R11 |
| `mu.R12` | Magic UI (kinetic-text) | hover (text) | M I | 2 G | T1 | dropped below 640 and on touch | removed | full; display words only | MC R12 |
| `an.R13` | Animata (fluid-tabs, nav-tabs, pricing) | component | P M I | 0 S | T2 | same | indicator jumps, panel crossfade | full | MC R13 |
| `an.R14` | Animata + Magic UI (status-button, subscribe) | component | P M I | 0 S | T1 | same, 44 | opacity only | full | MC R14 |
| `mu.R15` | Magic UI + Animata (interactive-hover-button, arrow buttons) | hover (component) | P M I | 0 S | T0 | touch: state layer only | state layer, no nudge | full | MC R15 |
| `mu.R16` | Magic UI + Animata (ripple-button) | component (press) | P M I | 0 S | T1 | built for touch | no ripple, pressed layer | full | MC R16 |
| `an.R17` | Animata (toggle-switch) | component | P M I | 0 S | T0 | same, 44 | instant | full | MC R17 |
| `mu.R18` | Magic UI + Animata (marquee) | component (strip) | M I | 3 Q | T1 | same, pause control | static wrapped row | full; logos single ink | MC R18 |
| `mu.R19` | Magic UI (scroll-based-velocity) | text motion (scroll) | M I | 3 Q | T3 | static text on low `imm.tier` | static, no drift | full; one per page | MC R19 |
| `mu.R20` | Magic UI + Animata (hero-video-dialog, modal) | component (overlay) | P M I | 0 S | T0 | bottom sheet below 640 (`core.dialog`) | opacity only | full | MC R20 |
| `an.R21` | Animata + Magic UI (transition-list, animated-list) | component (list) | P M I | 0 S | T2 | same | `layout` off, crossfade | full; no spring | MC R21 |
| `an.R22` | Animata + Magic UI (faq, file-tree) | component (disclosure) | P M I | 0 S | T0 | same | instant | full; grid-track exception | MC R22 |
| `an.R23` | Animata (stacked-sections) | scroll choreography | M I | 3 Q | T3 | panes in flow below 768 (`motion.pin`); GAP 7 | no pin, panes in flow | full; no resting overlap | MC R23 |
| `an.R24` | Animata (split-reveal) | transition (preloader) | M I | 3 Q | T1 | same, cap 1500ms | overlay fades | full; never product | MC R24 |
| `an.R25` | Animata (vertical-tiles) | transition | M I | 3 Q | T1 | same | layer never rendered | full; once per page | MC R25 |
| `an.R26` | Animata + Magic UI (disclose-image, pixel-image) | reveal (media) | M I | 2 G | T1 | same | image shows at once | full; no filter | MC R26 |
| `an.R27` | Animata (zoom-image, photo-booth) | hover (media) | M I | 2 G | T0 | touch: none | none | full; GAP 8 | MC R27 |
| `mu.R28` | Magic UI (lens) | hover (media) | M I | 2 G | T1 | dropped below 640 and on touch | tracks, no fade | full | MC R28 |
| `mu.R29` | Magic UI + Animata (dock) | hover (navigation) | M I | 2 G | T1 | plain icon row on touch and below 640 | plain row | full; no glass | MC R29 |
| `an.R30` | Animata (sibling-focus-nav) | hover (navigation) | P M I | 0 S | T0 | touch: no dim | instant | full; dimmed links keep 4.5:1 | MC R30 |
| `an.R31` | Animata (speed-dial, flower-menu) | component (menu) | P | 0 S | T0 | mobile app-shell only | opacity only, no stagger | full; 3 to 5 actions | MC R31 |
| `an.R32` | Animata (card-stack, card-spread) | component (deck) | M I | 2 G | T2 | swipe advance | crossfade, spread grid direct | full; overlap only during entrance | MC R32 |
| `an.R33` | Animata (flip-card) | component (3D flip) | M I | 2 G | T0 | tap only | crossfade faces | full; one per page | MC R33 |
| `mu.R34` | Magic UI (animated-theme-toggler) | component | P M | 0 S | T1 | same | instant | full; only with an explicit dark mode | MC R34 |
| `mu.R35` | Magic UI + Animata (avatar-circles, avatar-list) | layout (social proof) | P M I | 0 - (entrance via `mu.R01`) | T0 | wraps | n/a | full; no overlapping stack | MC R35 |
| `an.R36` | Animata + Magic UI (meters, charts) | data viz | P M I | 0 S update, 1 E entrance | T0 | same | final state | full; one hue, no width animation | MC R36 |
| `an.R37` | Animata (commit-graph) | data viz | P M | 0 - | T0 | scrolls inside own box at 320 | n/a | full; ink ramp only | MC R37 |
| `mu.R38` | Magic UI (dotted-map) | data viz (map) | P M I | 0 - | T0 (build-time SVG) | same | static | full | MC R38; JC `ui.geo_visual` |
| `an.R39` | Animata (spinner, icon-ripple, team-clock) | component (status) | P M I | 0 S | T0 | same | static "Loading" text, pulse off | full; live state only | MC R39 |
| `an.R40` | Animata (skeleton set) | component (loading) | P M I | 0 S | T0 | same | static blocks | full | MC R40 |
| `an.R41` | Animata + Magic UI (bento, tweet cards, widgets) | layout (tiles) | P M I | 0 - | T0 | one column (`core.bento`) | n/a | full | MC R41; FR Bento |
| `mu.R42` | Magic UI (scroll-progress) | component (scroll) | P M I | 0 S | T1 | same | kept (information) | full; long-form only | MC R42 |
| `an.R43` | Animata (image-carousel, expandable) | component (carousel) | P M I | 0 S | T0, expandable T2 | native swipe | instant scroll and expand | full | MC R43 |
| `mu.R44` | Magic UI (globe) | 3D object (data viz) | M I | 2 G | T4/C1 | poster plus location list on low `imm.tier` | poster plus list, no canvas | canvas: unlit, pause control; GAP 9 | MC R44 |

### 1.3 bang-motion choreography (`bang.*`)

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `bang.continuous_world` | bang-motion | scroll choreography | M I | 3 Q | T3 | triggered beats | static final state | full | MS One continuous world |
| `bang.staged_reveal` | bang-motion | reveal | M I | 2 G | T1 to T3 | same | crossfade, 150ms or less | full; two text tiers per beat; exit 70% of entrance | MS Asymmetric in/out, Staging |
| `bang.stagger_char` | bang-motion | text motion | M I | 2 G | T1 | same | no split | full; short headline only; GAP 10 | MS Stagger rhythm |
| `bang.stagger_word` | bang-motion | text motion | M I | 2 G | T1 | same | no split | full; GAP 10 | MS Stagger rhythm |
| `bang.shot_size` | bang-motion | scroll choreography (camera) | M I | 3 Q (2 G when time-driven) | T3 | fewer beats | stills per shot | full; hold 1.2 to 1.5s per shot; GAP 11 | MS Shot-size language |
| `bang.breathing_scale` | bang-motion | reveal (ambient) | M I | 2 G | T1 | same | frozen | full; `sin(t)`, 1 to 2% | MS Shot-size, Deterministic timelines |
| `bang.camera_follow_click` | bang-motion | demo | M I | 2 G | T3 | same | poster | full; 2 to 3 clicks per piece; GAP 11 | MS Camera follows the click |
| `bang.directional_blur` | bang-motion | transition | M I | 2 G | T1 | not specified | blur and whip cut, opacity crossfade | CONFLICT, GAP 12 | MS Directional blur |

### 1.4 GSAP patterns (`gsap.*`)

Chosen by `motion.choreography`; a story section may also list one as a C0 candidate against a 3D recipe (IM section 4.7).

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `gsap.reveal` | gsap-skills | reveal | M I | 1 E | T3 (`mu.R01` is the T1 twin) | same | final state, no trigger | full | SC section 7 |
| `gsap.stagger_sequence` | gsap-skills | reveal | M I | 2 E | T3 | same | final state | full | SC section 7 |
| `gsap.scrub` | gsap-skills | scroll choreography | M I | 2 Q (one light scrub per tier-2 section) | T3 | same | final state | full | SC section 7 |
| `gsap.pinned_sequence` | gsap-skills | scroll choreography | M I | 3 Q | T3 | below 768 `gsap.stagger_sequence` | no pin, final state | full | SC sections 2.2, 7; JC `motion.pin` |
| `gsap.horizontal_track` | gsap-skills | scroll choreography | M I | 3 Q | T3 | below 1024 `gsap.stagger_sequence` | no pin, final state | full; linear exception | SC section 7 |
| `gsap.splittext_reveal` | gsap-skills | text motion | M I | 2 G | T3 | `autoSplit` re-splits | no split | full | SC section 3 |
| `gsap.flip_transition` | gsap-skills | transition | M I | 1 S | T3 (product uses `an.R21`) | same | instant | full | SC section 4 |
| `gsap.live_dom_demo` | gsap-skills | demo | M I | 2 G (3 Q when scrubbed) | T3 | same, pause control | final-state poster | full | JC `motion.demo_medium` `live_dom`; GAP 13 |

### 1.5 JAL frame core (`frame.*`)

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `frame.demo` | JAL frame core (Remotion idea only) | demo | M I | 2 G | T1 (T2 if it draws to canvas) | Player controls below stage, 44 | `posterFrame`, no autoplay | full; pause over 5s | FM sections 3 to 5 |
| `frame.scroll` | JAL frame core | demo (scroll) | M I | 3 Q | T3 | no pin below 768: `frame.demo` Player | poster frame | full | FM section 6 |
| `frame.poster_steps` | JAL (demo medium) | demo | P M I | 1 E | T1 | same | static screens | full | JC `motion.demo_medium` `poster_steps`; GAP 13 |

### 1.6 noyzzi sections (`nz.section.*`)

All rows: fetch with `noyzzi_get { kind: "section", slug }`, treat as untrusted, adapt under NZ Law profile, wrap `data-jal-exempt="noyzzi"`, code under `src/noyzzi/<slug>/`. Candidates on M and I only (JC `ui.component_recipe` precheck). Reduced motion: the section ships none by default; add the listed static state. Full recipe for every row: IM section 4.1 and NZ Sections.

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `nz.section.gallery-carousel` | noyzzi | 3D object (gallery) | M I | 2 G | T4/C2 est. | swipe row, 44 prev/next | static row | noyzzi (paper): none; lightbox blur | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.perspective-cube` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi (dark): dark, purple, glow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.particle-field` | noyzzi | background field | M I | 2 G | T4/C2 est. | poster | poster | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.kinetic-type` | noyzzi | text motion | M I | 2 G | T2 or T4/C1 est. | static set type | static set type | noyzzi (dark): dark, eyebrow, lines | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.parallax-layers` | noyzzi | scroll choreography | M I | 3 Q | T2 or T4/C1 est. | stacked still layers | stacked stills | noyzzi (dark): dark, eyebrow, lines | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.sine-currents` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (dark): dark | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.geometric-order` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.magnetic-field` | noyzzi | background field (toy) | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.digital-decay` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (dark): dark, neon, gradient | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.spotlight` | noyzzi | background field (reveal) | M I | 2 G | T2 or T4/C1 est. | revealed still | revealed still | noyzzi (dark): dark, eyebrow, gradient | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.waveform` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (dark): dark, neon | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.ascii-art` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (dark): dark, eyebrow, lines | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.noise-terrain` | noyzzi | background field | M I | 2 G | T4/C2 est. | poster | poster | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.cinematic-reel` | noyzzi | scroll choreography (gallery) | M I | 3 Q | T2 or T4/C1 est. | static frames list | static frames list | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.type-mask` | noyzzi | text motion | M I | 2 G | T2 or T4/C1 est. | static set type | static set type | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.visual-board` | noyzzi | layout (gallery) | M I | 2 G | T2 or T4/C1 est. | image grid | image grid | noyzzi (dark): dark, eyebrow, shadow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.starfield-warp` | noyzzi | background field | M I | 2 G | T4/C2 est. | poster | poster | noyzzi (dark): dark, eyebrow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.word-rotator` | noyzzi | text motion | M I | 2 G | T1 est. (C0) | static first word | static first word | noyzzi (dark): dark, eyebrow, lines, glow, gradient | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.floating-playground` | noyzzi | layout (toy) | M I | 2 G | T2 or T4/C1 est. | cards arranged clear of text | static arrangement | noyzzi (dark): dark, eyebrow, shadow; cards start clear of text | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.terminal` | noyzzi | demo (text) | M I | 2 G | T1 est. (C0) | all lines shown | all lines shown | noyzzi (dark): dark, neon, glow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.magnetic-scatter` | noyzzi | text motion | M I | 2 G | T2 or T4/C1 est. | static set type | static set type | noyzzi (dusty pink): none | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.flaming-hot` | noyzzi | background field | M I | 2 G | T4/C2 est. | poster | poster | noyzzi (dark): dark, neon, glow | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.cosmic-dust` | noyzzi | background field (particles) | M I | 2 G | T4/C2 est. | poster | poster | noyzzi (dark): dark, neon | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.moodboard` | noyzzi | layout (gallery) | M I | 2 G | T2 or T4/C1 est. | image grid | image grid | noyzzi (white): shadow, gradient; GAP 14 | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.helix-portfolio` | noyzzi | 3D object (gallery) | M I | 2 G | T4/C2 est. | vertical list of work | vertical list | noyzzi (paper): none | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.gaze` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (paper): none | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.loom` | noyzzi | background field | M I | 2 G | T2 or T4/C1 est. | poster | poster | noyzzi (paper): none | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.ink-drift` | noyzzi | background field (scroll scene) | M I | 3 Q | T4/C1 to C2 est. | poster | poster | noyzzi (slate paper): none | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.veil` | noyzzi | scroll choreography (scroll scene) | M I | 3 Q | T4/C2 est. | poster | poster | noyzzi (paper): purple | IM section 4.1; NZ Sections; `noyzzi_get` section |
| `nz.section.draw` | noyzzi | background field (toy) | M I | 2 G | T2 or T4/C1 est. | poster; drawing on tap works | no ambient; drawing still works | noyzzi (paper): gradient; Clear pill under 44 | IM section 4.1; NZ Sections; `noyzzi_get` section |

### 1.7 noyzzi image hover effects (`nz.fx.*`, alias `nz.effect.*`)

All rows: kind hover, Surf M I, Tier 2 G, Cost T4/C1 est. (one image-plane shader), mobile fallback the plain image (no tap-triggered distortion), reduced motion the plain image as a static frame (none of the 22 ships one: JAL adds it). `noyzzi_get` returns MANUAL (Brian pastes the prompt) or build `three.img_hover` natively. Law notes other than `none` need a `data-jal-exempt="noyzzi"` gallery section. JEV: `imm.recipe` `hover_family` and `motion_budget`. Full recipe: IM section 4.2 and NZ Effects.

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `nz.fx.calm-distort` | noyzzi | hover (calm) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.liquid-pool` | noyzzi | hover (calm) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.saturation-focus` | noyzzi | hover (calm) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.halftone-print` | noyzzi | hover (calm) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.duotone-wash` | noyzzi | hover (editorial grade) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: purple | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.burn-focus` | noyzzi | hover (editorial grade) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: glow | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.negative-reveal` | noyzzi | hover (editorial grade) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.ripple-bloom` | noyzzi | hover (expressive) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.orbital-swirl` | noyzzi | hover (expressive) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.liquid-trail` | noyzzi | hover (expressive) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.chrome-ripple` | noyzzi | hover (expressive) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.kaleido-mirror` | noyzzi | hover (expressive) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.prism-hover` | noyzzi | hover (expressive) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: purple | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.glitch-shift` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: neon | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.pixel-dissolve` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.thermal-scan` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: neon | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.holo-shift` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: purple | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.crystal-shatter` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: glow | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.sonar-pulse` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: neon, glow | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.starburst` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: glow | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.flower-bloom` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: none | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |
| `nz.fx.heart-burst` | noyzzi | hover (loud) | M I | 2 G | T4/C1 est. | plain image | static frame | noyzzi: glow | IM section 4.2; NZ Effects; `noyzzi_get` MANUAL |

### 1.8 noyzzi 3D elements (`nz.el.*`, alias `nz.element.*`)

All rows: kind 3D object, Surf M I, Tier 2 G, Cost T4/C2 est., mobile fallback a poster of the element at its design angle, reduced motion the same poster. `noyzzi_get { kind: "element", id }` returns full code. One element per section. `none` rows may sit on the page white in a transparent canvas and read JAL-native (canvas law); every other row needs the exempt wrapper. JEV: `noyzzi_object` `earns_place` (under 0.6 means do not ship) and `placement`. Full recipe: IM section 4.3 and NZ 3D elements.

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `nz.el.ring` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.knot` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.mochi` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.coral` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.orb` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.star` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.heart` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.cube` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: dark studio | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.spark` | noyzzi (AI Spark) | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: glow | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.flower` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.smiley` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple studio | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.terrace` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.squiggle` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.melt` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.prism` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: dark studio, glow | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.cloud` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: dark studio | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.cursor` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.fuzz` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.crystal` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: dark studio | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.bolt` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.blossom` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.wave` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.shards` | noyzzi | 3D object (interactive) | M I | 2 G | T4/C2 est. | poster; touch intents | poster | noyzzi: purple | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.voxel` | noyzzi | 3D object (interactive) | M I | 2 G | T4/C2 est. | poster; touch intents | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.book` | noyzzi (Grimoire) | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: purple studio | IM section 4.3; NZ 3D elements; `noyzzi_get` element |
| `nz.el.shades` | noyzzi | 3D object | M I | 2 G | T4/C2 est. | poster | poster | noyzzi: none (canvas-grade) | IM section 4.3; NZ 3D elements; `noyzzi_get` element |

### 1.9 Clean-room effects (`cr.*`)

JAL-authored from permissive sources; every row ships a DOM text equivalent and a static WebP poster, and at most two `cr.*` share one mobile viewport (CR section 6).

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `cr.window_rain` | clean-room (JAL) | background field (environment) | M I | 2 G | T4/C2 (1.5 ms; 2 ms mobile) | one static layer, 12 sliders, pre-blurred background; lowest tier WebP poster | freeze `uTime`, draw one frame | canvas: no bloom | CR section 1; IM 4.4 |
| `cr.wet_ground` | clean-room (JAL) | background field (environment) | M I | 2 G | T4/C3 with reflector; C1 mobile env only | no reflector, one ripple layer, no wave grid | `uRain = 0` mirror-still puddles | canvas: never neon night city | CR section 2 |
| `cr.deform_sand_snow` | clean-room (JAL) | background field (toy) | M I | 2 G | T4/C1 (0.8 ms; 0.5 ms mobile) | stamp only, no relax; lowest tier pooled decals | user-driven trails only, pre-baked trail | canvas: snow neutral grey-blue | CR section 3 |
| `cr.wind_grass` | clean-room (JAL) | background field (environment) | M I | 2 G | T4/C3 (3 ms; 2.5 ms mobile) | 3-segment blades, flutter off, or cross-quad clusters | freeze `uTime`, keep push | canvas: backlight in shading | CR section 4 |
| `cr.ocean_snell` | clean-room (JAL) | background field (environment, story) | M I | 2 G | T4/C2 to C3 (2.5 ms; 3 ms mobile) | 3 waves, depth tint only, no caustics | frozen surface; above-below switch as 150ms crossfade | canvas: pale sea fog, no dark abyss | CR section 5; GAP 15 |

### 1.10 Three.js and R3F patterns (`three.*`, including particle tiers 3 to 6)

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `three.studio_object` | three.js, drei | 3D object | M I | 2 G | T4/C2 | DPR per tier, fake contact shadow, `<PresentationControls>` off, poster | poster | canvas | IM 4.5; R3 section 7; TF section 3; GAP 16 |
| `three.scroll_camera` | three.js, gsap-skills, ai-dev-kit | scroll choreography (3D) | M I | 3 Q | T4/C2 | triggered beats; touch never scrubs a pinned 3D section over 200% vh | authored stills, crossfade 150ms or less | canvas | SC section 9; R3 section 12 |
| `three.points_field` | three.js (px tier 3) | background field (particles) | M I | 2 G | T4/C1 (100k desktop) | 30k mobile, 10k reduced | freeze at a seeded frame | canvas: normal blend, dark sparse points | PX sections 1, 2 |
| `three.instanced_field` | three.js (px tier 4) | background field, data viz | M I | 2 G | T4/C2 | fewer instances, no shadows | freeze | canvas | PX section 3; R3 section 5 |
| `three.gpgpu_particles` | three.js (px tier 5) | background field (particles) | M I | 2 G | T4/C2 to C3 (65k to 262k) | 128 squared, or `three.points_field` | freeze | canvas | PX section 4 |
| `three.compute_particles` | three.js, webgpu skill (px tier 6) | background field (particles) | M I | 2 G | T4/C3 (WebGPU) | `three.gpgpu_particles` or points, then poster | freeze | canvas | PX section 5 |
| `three.img_hover` | three.js (JAL-native) | hover (media) | M I | 2 G | T4/C1 | plain `<img>` | plain `<img>` | canvas: displacement and grade only; GAP 8 | SH section 10 |
| `three.matcap_clay` | three.js | 3D object | M I | 2 G | T4/C1 | poster | poster | canvas: bake our own matcap | SH section 7 |
| `three.sdf_blob` | three.js, IQ snippets (MIT) | 3D object, background field | M I | 2 G | T4/C2 (48 to 96 steps at 0.5 res) | fewer steps, then poster | frozen | canvas: rim darkens | SH section 4 |
| `three.dot_globe` | three.js (Magic UI globe home) | 3D object (data viz) | M I | 2 G | T4/C1 | static SVG `mu.R38` | `mu.R38` static | canvas: drag or scroll only, no ambient spin; GAP 9 | IM 4.5; MC R44 |
| `three.post_light` | three.js addons | modifier (any WebGL host) | M I | host | adds 0.3 to 1.5 ms per full-res pass | none on mobile | n/a | canvas: AA, LUT, dither, subtle DoF only | IM 4.5; SH sections 8, 9 |
| `three.views` | drei `View` | layout (many 3D regions, one canvas) | M I | host | T4, one context | fewer views; poster per view | poster per view | canvas | R3 section 8 (ID new here) |

### 1.11 Particles and interaction (`px.*`)

Tiers 3 to 6 are the `three.*` rows above. Taste for every row: on white, ink dust not fireflies, no additive blend, drift under about 0.2 units per second, pointer nudges only (PX section 1).

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `px.canvas2d_field` | threejs-game-skills (px tier 2) | background field (particles) | M I | 2 G | T2/C1 | fewer dots | freeze at a seeded frame | canvas; GAP 17 | PX section 1 (tier 2) |
| `px.pointer_repel` | threejs-game-skills | hover (field interaction) | M I | 2 G | adds to host | pointer events emit the same intents; scoped `touch-action` | nudge off, loop stopped | canvas | PX sections 1, 7 |
| `px.fixed_step_toy` | threejs-game-skills | 3D object (toy) | M I | 2 G | T2 to T4 | fewer bodies | settled state, paused | canvas | PX section 6; custom collision in section 9 |
| `px.orbit_bounded` | threejs-game-skills, drei | 3D object (interaction) | M I | 2 G | adds to host | `<PresentationControls>`, scoped `touch-action` | still usable (direct manipulation), no ambient | canvas | PX section 7 |
| `px.pointer_look` | threejs-game-skills | 3D object (spatial tour) | M I | 2 G | adds to host | touch intents, 44 DOM controls | no ambient motion | canvas | PX section 7 |
| `px.nixie_fx` | nixie-fx (approval candidate) | background field (particles) | M I | 2 G | T4/C1 to C2 | per-emitter cap | `seek(t)` to a fixed frame, stopped | canvas: `blend: "alpha"` only; GAP 18 | PX section 8 |
| `px.rapier_toy` | react-three-rapier (approval candidate) | 3D object (toy) | M I | 2 G | T4 plus WASM chunk | tens of bodies | `paused`, settled state | canvas; GAP 18 | PX section 9 |

### 1.12 Shader recipes (`sh.*`)

Shader recipes are modifiers: each rides on a `three.*`, `cr.*`, or `px.*` host, takes no section role of its own, and adds its cost to the host. Reduced motion for every row: time frozen or the loop asleep (SH section 12). Surf M I, Tier host, Law canvas for every row.

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `sh.value_grain` | JAL, hash-prospector | modifier (surface grain, masks) | M I | host | adds C0 to C1 | integer hash, no `sin`-hash | frozen | canvas | SH sections 2, 3 |
| `sh.fbm_surface` | JAL | modifier (terrain, surface detail) | M I | host | adds C1 | cap 4 to 5 octaves | frozen | canvas | SH section 3 |
| `sh.cellular` | JAL | modifier (cells, caustic-like, cracks) | M I | host | adds C1 | fewer cells | frozen | canvas | SH section 3 |
| `sh.curl_drift` | JAL, three addons | modifier (particle drift field) | M I | host | adds C1 | same field, fewer particles | frozen at a seeded frame | canvas | SH section 3; PX section 1 |
| `sh.sdf_raymarch` | IQ snippets (MIT) | modifier (host `three.sdf_blob`) | M I | host | C2 | fewer steps, 0.5 res, then poster | frozen | canvas | SH section 4 |
| `sh.sdf_2d` | IQ snippets (MIT) | modifier (crisp rings, arcs, rounded rects) | M I | host | adds C0 to C1 | same | frozen | canvas | SH section 4 |
| `sh.domain_warp` | JAL, IQ article | modifier (marble, ink-in-water material) | M I | host | adds C1 | fewer octaves | frozen | canvas: bounded surface only, never full-bleed field | SH section 5 |
| `sh.fresnel_rim` | JAL | modifier (silhouette separation) | M I | host | adds C0 | same | n/a | canvas: rim darkens, never additive | SH section 6 |
| `sh.matcap` | JAL | modifier (host `three.matcap_clay`) | M I | host | C1 | same | n/a | canvas: our own baked matcap | SH section 7 |
| `sh.dither` | JAL, three addons | modifier (anti-banding) | M I | host | adds C0 | same | n/a | canvas | SH section 8 |
| `sh.print_dither` | JAL | modifier (Bayer or print style) | M I | host | adds C0 to C1 | same | frozen | canvas; filter look is noyzzi territory (`nz.fx.halftone-print`), needs `imm.taste` | SH section 8 |
| `sh.lut_grade` | JAL, three addons | modifier (brand grade) | M I | host | adds C0 | same | n/a | canvas: small shifts only | SH section 9 |
| `sh.cover_uv_hover` | JAL | modifier (host `three.img_hover`) | M I | host | C1 | plain image | plain image | canvas | SH section 10 |
| `sh.fullscreen_pass` | JAL, three.js | modifier (GPGPU, transitions) | M I | host | adds one pass | half-float targets | frozen | canvas | SH section 11 |

### 1.13 refero-derived layout and type recipes (`rf.*`)

A direction is page-level (DS-D section 7): its knob values come only from the target repo's direction contract. An `rf.*` row lends a section its **structure grammar** (reading order, grouping, container grammar, media role) and is a candidate only when the page's contract names that direction, or when the grammar works at the contract's knob values without changing them. Each carries the direction's gate. All rows: Tier 0 -, Cost T0, reduced motion n/a, Law full (law filter already applied).

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `rf.D1.type_led` | refero D1 research_notebook | layout, type | P M I | 0 - | T0 | whitespace separation holds | n/a | full; gate none | DS-D section 7 D1 |
| `rf.D2.ledger_numbers` | refero D2 single_signal_ledger | layout, type (tabular money) | P M | 0 - | T0 | stacked rows | n/a | full; gate none | DS-D section 7 D2 |
| `rf.D3.spec_rows` | refero D3 blueprint_hairline | layout (visible structure, spec rows, mono data) | P M | 0 - | T0 | stacked spec rows | n/a | full; gate none | DS-D section 7 D3 |
| `rf.D4.media_led` | refero D4 bone_white_gallery | layout (media carries the page) | M I | 0 - | T0 | one column media | n/a | full; gate real media or honest placeholders | DS-D section 7 D4 |
| `rf.D5.calm_tool` | refero D5 calm_productivity | layout, type | P | 0 - | T0 | app-shell | n/a | full; gate none | DS-D section 7 D5 |
| `rf.D6.docs_sidebar` | refero D6 clean_docs | layout (sidebar, heading ladder, code blocks) | P M | 0 - | T0 | sidebar swaps below 640 | n/a | full; gate Read mode | DS-D section 7 D6 |
| `rf.D7.editorial_measure` | refero D7 warm_paper_editorial | layout, type (reading page) | M | 0 - | T0 | measure holds | n/a | full; gate content product, serif needs Brian | DS-D section 7 D7 |
| `rf.D8.generous_air` | refero D8 quiet_care | layout (comfortable rhythm) | P M | 0 - | T0 | same | n/a | full; gate none | DS-D section 7 D8 |
| `rf.D9.plinth` | refero D9 cinematic_hardware | layout (one lit product per section, 28 radius media) | M I | 0 - | T0 | `--text-display-1` at most below 640 | n/a | full; gate real product imagery | DS-D section 7 D9 |
| `rf.D10.catalogue` | refero D10 industrial_catalogue | layout (straight cuts, radius 4) | P M | 0 - | T0 | one column | n/a | full; gate none | DS-D section 7 D10 |
| `rf.D11.masthead` | refero D11 oversized_masthead | layout, type (authored SVG wordmark as layout) | M I | 0 - | T0 | wordmark `width: 100%` | n/a | full; gate Persuade or Experience plus real wordmark | DS-D section 7 D11 |
| `rf.D12.friendly_display` | refero D12 friendly_consumer | type (one saturated display headline) | P M | 0 - | T0 | display-1 at most below 640 | n/a | full; accent inside the 3% | DS-D section 7 D12 |
| `rf.D13.precision_dark` | refero D13 precision_dark | layout (stepped dark surfaces) | P M | 0 - | T0 | same | n/a | full; gate explicit dark brief only | DS-D section 7 D13 |
| `rf.display_hero` | refero calibration, impeccable | type (display set) | M I | 0 - | T0 | `--text-display-1` at most below 640 | n/a | full; one per page, at most about 8 words, tracking -0.03 to -0.04em | DS-D sections 6, 9; DS-K section 2 |

### 1.14 designmd (`md.*`, class)

| ID | Source | Kind | Surf | Tier | Cost | Mobile fallback | Reduced motion | Law | Full recipe |
|---|---|---|---|---|---|---|---|---|---|
| `md.<kit>.<part>` | designmd.ai kit (MCP, read tools only) | layout or component idea | P M | 0 - | T0 | the JAL Core responsive contract of the nearest `core.*` spec | per the `core.*` or `mu.*`/`an.*` recipe it is rebuilt on | full after translate: every value becomes a JAL Core token; kit shadows become hairline plus tonal step | DS designmd policy; JC `ui.designmd_screen` (slop under 0.5 and fit 1.5 or more, else never a candidate) |

A kit part is proposed as its own candidate (for example `md.nav_bar`, JC) only after the screen passes for that kit, and is always rebuilt on the matching `core.*` spec. It never overrides a spec, a token, or law.

## 2. Role of each kind in a stack

A section stack holds at most one layer per role. The kind column maps to a role:

| Kind | Role | Notes |
|---|---|---|
| layout (any qualifier), static data viz | layout | the container grammar; the top pick is often here on product UI |
| text motion, number count-up (`mu.R07`) | text | headline, label, or number in motion |
| reveal, scroll choreography, transition, animated data viz entrance (`an.R36`) | motion | entrance, sequence, camera, or handoff |
| hover (any qualifier), `px.pointer_repel` | hover | at most one pointer effect per element |
| background field | background | environments, fields, particles, paper heroes |
| 3D object (any qualifier) | 3D | one object or multi-view layout; `three.views` counts as 3D |
| demo | demo | frame core, live DOM, typing demo |
| component (any qualifier) | control-bound | attaches to one control inside the layout; takes no section role; each control carries at most one motion recipe and one hover recipe |
| modifier (`sh.*`, `three.post_light`) | host-bound | rides on a background, 3D, or hover host; takes no role; cost adds to the host |

## 3. Section kind to candidate recipes

Candidates are grouped by role, across every source and surface. Drop by the Surf, Tier, Cost, Mobile, and Law columns before any JEV call. Immersive section kinds (IM section 4) are in brackets.

| Section kind | Layout | Text | Motion | Hover | Background | 3D | Demo | Prechecks and notes |
|---|---|---|---|---|---|---|---|---|
| Hero [hero] | `core.plain_spacing`, `core.bento` (areas), `rf.D1.type_led`, `rf.D9.plinth`, `rf.D11.masthead`, `rf.D4.media_led`, `rf.display_hero`, `nz.section.gallery-carousel`, `nz.section.helix-portfolio`, `md.*` | `an.R02`, `an.R03`, `mu.R05`, `mu.R09`, `mu.R11`, `gsap.splittext_reveal`, `bang.stagger_word`, `bang.stagger_char`, `nz.section.kinetic-type`, `nz.section.type-mask`, `nz.section.magnetic-scatter`, `nz.section.word-rotator` | `mu.R01`, `bang.staged_reveal`, `gsap.stagger_sequence`, `gsap.scrub`, `bang.shot_size`, `bang.breathing_scale`, `an.R24` (first load), `an.R26` | `an.R06`, `mu.R15` (CTA) | `nz.section.gaze`, `.loom`, `.draw`, `.ink-drift`, `.veil`, `.particle-field`, `.sine-currents`, `.waveform`, `.flaming-hot`, `.cosmic-dust`, `.starfield-warp`, `.ascii-art`, `.noise-terrain`, `.geometric-order`, `.magnetic-field`, `.digital-decay`, `.spotlight`, `cr.window_rain`, `cr.wet_ground`, `cr.wind_grass`, `cr.ocean_snell`, `three.points_field`, `px.canvas2d_field`, `px.pointer_repel` | `three.studio_object`, `three.matcap_clay`, `three.sdf_blob`, `nz.el.*`, `mu.R44`, `px.orbit_bounded` | `frame.demo`, `mu.R10` | never on P; one display per page; one tier-3 section per page; `mu.R09` only for a devtool or security brand |
| Feature grid or walkthrough [story] | `core.bento`, `core.rows`, `core.divided_section`, `rf.D3.spec_rows`, `an.R41`, `md.*` | `an.R02` fade-through, `an.R03` (heading) | `mu.R01`, `gsap.reveal`, `an.R23`, `an.R13` with `an.R02`, `an.R32`, `an.R21`, `gsap.pinned_sequence`, `gsap.horizontal_track` | `core.clickable_card`, `mu.R15` | `three.instanced_field` | `three.views`, `nz.el.*` (placement `section`) | `frame.demo`, `mu.R10` | DS-K section 3 bans the identical feature-card grid and the icon tile above a heading |
| Proof or logos | `an.R41` static wall, `mu.R35`, `core.rows` | none | `mu.R18`, `mu.R01`, `gsap.reveal` | none (logos single ink, no hover burst) | none | none | none | marquee needs more items than fit, plus a pause control |
| Stats (marketing) | `core.plain_spacing`, `core.bento`, `rf.D2.ledger_numbers` | `mu.R07`, `an.R08` | `mu.R01`, `an.R36` entrance | none | none | none | none | DS-K bans the big-number hero; JC `ui.number_motion` |
| Dashboard KPI row [data_viz] | `core.bento`, `core.card`, `core.rows`, `core.tpl.dashboard`, `rf.D2.ledger_numbers`, `rf.D13.precision_dark` (dark brief only) | none | `mu.R01` product preset only | `core.clickable_card` | none | none | none | P capped at tier 1; control-bound: `an.R08` live, `an.R36` update, `an.R37`, `core.badge`, `core.skeleton`; GAP 5 |
| Pricing | `core.selectable_card`, `core.card`, `core.table` (real comparison), `rf.D2.ledger_numbers` | `an.R08` (price on billing toggle) | `mu.R01` | `mu.R15` | none | none | none | pricing tables are tier 0 (JC `motion.intensity`); control-bound: `an.R13` billing toggle, `core.segmented`, `an.R14`; GAP 6 |
| Testimonial | `an.R41` (tweet-card layout), `core.card`, `rf.D8.generous_air`, `rf.D7.editorial_measure` | `an.R02` per-word-crossfade | `an.R32`, `mu.R18` (quote wall), `mu.R01` | none | none | none | none | one testimonial at a time for `an.R32`; GAP 6 |
| Story, steps, or manifesto [story] | `core.divided_section`, `core.plain_spacing`, `rf.D7.editorial_measure` | `mu.R04`, `an.R02` line-by-line-slide, `gsap.splittext_reveal`, `an.R03` | `an.R23`, `gsap.pinned_sequence`, `gsap.scrub`, `gsap.stagger_sequence`, `bang.continuous_world`, `bang.shot_size` | none | `nz.section.ink-drift`, `.veil`, `.parallax-layers`, `.cinematic-reel`, `cr.ocean_snell` | `three.scroll_camera`, `three.studio_object`, `three.views` | `frame.scroll` | numbered labels only for a real ordered process; `motion.pin` before any pin; one `mu.R04` per page |
| Product demo [demo] | `core.plain_spacing` (figure plus caption), `core.app_shell` (real components) | `mu.R10` | `bang.camera_follow_click`, `bang.shot_size`, `bang.staged_reveal`, `bang.directional_blur` (blocked, GAP 12) | none | none | `three.studio_object` | `frame.demo`, `gsap.live_dom_demo`, `frame.poster_steps`, `mu.R10`, `nz.section.terminal` | `motion.demo_medium` first; pause over 5s; control-bound in the demo: `an.R21`, `an.R14` |
| Gallery [gallery_hover] | `an.R43`, `core.bento`, `rf.D4.media_led`, `rf.D10.catalogue`, `nz.section.gallery-carousel`, `.moodboard`, `.visual-board`, `.helix-portfolio`, `.cinematic-reel` | none | `an.R32`, `an.R26`, `gsap.horizontal_track`, `mu.R01` | `an.R27`, `mu.R28`, `three.img_hover` (+ `sh.cover_uv_hover`), `nz.fx.*` by family | none | `three.views` | none | `imm.recipe` `hover_family` and `motion_budget`; paper heroes pair with calm or editorial-grade hovers |
| CTA or close | `core.plain_spacing`, `rf.D11.masthead`, `md.*` | `an.R02` micro-scale-fade | `mu.R01` | `an.R06`, `mu.R15`, `mu.R16` (touch) | none | none | none | display type only if the hero did not use it; control-bound: `core.button`, `an.R14`, `core.text_input` (email capture) |
| Data table | `core.table`, `core.rows`, `core.list`, `rf.D3.spec_rows` | none | none | none | none | none | none | tier 0 to 1; control-bound: `an.R21` row add and remove, `an.R22` expand, `an.R40`, `an.R08` live cells, `core.empty_state`, `core.notification` |
| Form | `core.divided_section`, `core.plain_spacing` (640 cap), `core.tpl.form_wizard` | none | none | none | none | none | none | tier 0; control-bound: `core.text_input`, `core.select`, `core.date_picker`, `core.chips`, `core.checkbox_radio`, `core.button` with `an.R14`, `an.R22`, `an.R17`, `core.notification` |
| Settings | `core.divided_section`, `core.list`, `core.tpl.settings` | none | none | none | none | none | none | tier 0 to 1; control-bound: `core.switch` with `an.R17`, `core.select`, `core.segmented` with `an.R13`, `core.notification` toast, `core.dialog`, `core.alert_dialog`, `mu.R34` (explicit dark mode only) |
| Empty state | `core.empty_state`, `rf.D1.type_led` | none | `mu.R01` product preset | none | none | none | none | never 3D, never faked illustration |
| Loading state | `core.skeleton` | none | none | none | none | none | none | control-bound: `an.R40`, `an.R39`, `an.R14`; `an.R24` only on an immersive first load |
| Navigation | `core.app_shell`, `core.top_nav`, `core.side_nav`, `rf.D6.docs_sidebar` | none | `mu.R42` (long-form) | `an.R06`, `an.R30`, `mu.R29` (pointer-fine showcase) | none | none | none | control-bound: `core.tabs` with `an.R13`, `core.segmented`, `core.fab`, `an.R31` (mobile secondary actions) |
| Footer | `core.divided_section`, `core.rows` (link groups), `core.plain_spacing`, `rf.D11.masthead` | none | none | `an.R06`, `an.R30` | none | none | none | GAP 6 (no footer spec) |
| FAQ | `core.divided_section`, `core.list` | none | none | none | none | none | none | control-bound: `an.R22` |
| Global presence or map [data_viz] | `an.R41` (location list), `core.rows` | none | `mu.R01` | none | none | `mu.R44`, `three.dot_globe`, `three.instanced_field` | none | JC `ui.geo_visual`; under 3 locations a static list; P never gets `mu.R44`; `mu.R38` static map as layout |
| Object showcase [object_showcase] | `rf.D9.plinth`, `core.plain_spacing`, `nz.section.perspective-cube` | `an.R02`, `an.R03` | `bang.shot_size`, `gsap.scrub` | `px.orbit_bounded` | none | `three.studio_object`, `three.matcap_clay`, `three.sdf_blob`, `nz.el.*`, `an.R33` (back side on tap) | `frame.demo` | host-bound: `sh.fresnel_rim`, `sh.matcap`, `three.post_light`; `noyzzi_object` `earns_place` |
| Kinetic type band [strip, text_motion] | `core.plain_spacing` | `mu.R19`, `mu.R12`, `nz.section.kinetic-type`, `nz.section.word-rotator` | `mu.R18` | `mu.R12` | none | none | none | one `mu.R19` per page; `mu.R12` pointer-fine only |
| Section handoff [transition] | none | none | `an.R25`, `mu.R01`, `an.R24` (first load), `gsap.flip_transition`, MO section 3 route crossfade | none | none | none | none | `an.R25` once per page; `bang.directional_blur` blocked (GAP 12) |
| Environment or toy [environment, toy] | `core.plain_spacing` | none | `gsap.scrub` | `px.pointer_repel` | `cr.window_rain`, `cr.wet_ground`, `cr.deform_sand_snow`, `cr.wind_grass`, `cr.ocean_snell`, `nz.section.draw`, `.magnetic-field`, `.floating-playground`, `.magnetic-scatter` | `px.fixed_step_toy`, `px.rapier_toy` (approval), `px.pointer_look`, `nz.el.shards`, `nz.el.voxel` | none | interaction is the message (IM section 1); at most two `cr.*` per mobile viewport |
| Particles [particles] | `core.plain_spacing` | none | none | `px.pointer_repel` | `three.points_field`, `three.gpgpu_particles`, `three.compute_particles`, `px.canvas2d_field`, `px.nixie_fx` (approval), `nz.section.particle-field`, `.cosmic-dust`, `.starfield-warp` | none | none | pick the lowest particle tier that reads (PX section 1); host-bound: `sh.curl_drift` |
| AI chat or conversation | `core.ai_chat`, `core.tpl.ai_chat`, `core.tpl.messaging_shell` | `an.R02` (content swap) | none | none | none | none | none | P tier 0 to 1; control-bound: `core.chips` suggestion, `an.R21` message add, `an.R39` live thinking state, `an.R14` |
| Docs or article reading | `rf.D6.docs_sidebar`, `rf.D7.editorial_measure`, `core.side_nav`, `core.browser_surfaces` | none | `mu.R42` | none | none | none | none | Read mode, tier 0; control-bound: `an.R22` file tree; `an.R41` code comparison as layout |
| Auth or checkout | `core.tpl.login`, `core.tpl.checkout_wizard`, `core.plain_spacing` | none | none | none | none | none | none | tier 0; content read fast, never immersive; control-bound as Form |

## 4. Mixing rules and the layering protocol

Brian's ruling: **no fixed limit on how many recipes mix in one section**, as long as each aligns and fits. JEV judges every added layer. Law and the mechanical rules decide first and are never asked.

### 4.1 Precheck (no JEV)

1. Section kind from the concept, then candidates from section 3.
2. Drop a row when: its Surf lacks the section's surface; its Tier is above the section's `motion.intensity` tier; its Cost is over the section's ceiling (`imm.tier` budget, PF section 1; product UI never above T2); it has no mobile fallback and mobile is a target; its Law note needs an exemption the section does not have (a `noyzzi` row needs M or I plus the exempt wrapper; an `rf.*` row needs a matching direction contract; an `md.*` row needs a passed `ui.designmd_screen`); it is on the MC DROP list; it names an approval candidate without Brian's yes.
3. Page-level caps (count across the page, not the section): one tier-3 section; one WebGL canvas (more 3D regions through `three.views`); one each of `mu.R04`, `mu.R19`, `an.R23` per story, `an.R24`, `an.R25`, `mu.R44`, `an.R33`, `mu.R05`; at most two `cr.*` in one mobile viewport.

### 4.2 The protocol

1. **Top pick.** Ask the `recipe` choice (`ui.component_recipe` on P and M, `imm.recipe` on I) over 2 to 6 candidates. The pick becomes `stack[0]` with its role from section 2. Low confidence: JC fallback (calmer or lighter wins).
2. **Propose the next layer.** Choose one candidate for a role the stack does not fill yet. Propose in the order that most serves the section's message; a useful default is layout, text, motion, hover, background, 3D, demo, skipping roles already filled.
3. **Mechanical check before asking** (a failing layer is never asked about):
   - one layer per role; control-bound recipes attach to one control each, at most one motion and one hover recipe per control;
   - no overlap at rest (only true overlay layers stack: dialog, preloader, transient tiles; noyzzi designed overlap only inside its exempt box);
   - 44px targets on every control, canvas controls included; no horizontal overflow; no clipped text at 320, 375, 414, 768, 1280;
   - every layer has a reduced-motion fallback (the Reduced motion column); the stack under reduce collapses to the static final state with feedback kept at 150ms or less;
   - summed cost within the tier budget; canvases within the page and viewport count; DPR cap 2; one scroll owner (Lenis or numeric scrub or damp, never two); one pointer effect per element; never two Q layers on one scroll range; never two pinned stages overlapping in scroll distance;
   - one surface: a shared paper surface, or the noyzzi boundary (JAL-authored copy, CTAs, and navigation inside a noyzzi section stay Zone A; a JAL-native recipe never goes dark; a `three.*` layer inside a noyzzi section keeps canvas law);
   - staging: layers never move at the same moment; signature (G) layers play before sequence (Q) layers on one shared timeline (MS Staging, MC section 7.2);
   - timing: a tier-2 hero stays within 1200ms total; one authored focal moment per Persuade or Experience page (DS-K section 2).
4. **Ask JEV per layer** (`layer_1`, then `layer_2` with the updated stack, and so on): a `noul` with `state.proposal.stack` (every kept layer: ID, role, source, class, cost) and `state.proposal.layers[0]` (the proposed ID and role). Yes means it aligns with the stack, makes the section carry its message better, adds no competing focal point, and fills no role already filled. Keep at 0.6 or above.
5. **Stop** at the first of: a no (under 0.6, or low confidence); the next layer would exceed the section's motion tier; the next layer would exceed the performance budget; no role is left; a mechanical rule in step 3 would break.
6. **Record** in the build report, per section: `section | stack: ID (role, JEV confidence), ... | stop reason`. Any outage fallback is stamped `UNVERIFIED BY JEV`.

The MC section 7.2 and 7.3 caps of "exactly one G per section" and "combine only the top two" are superseded by this protocol: the section tier still sets which classes may appear (tier 0 S only, tier 1 adds E, tier 2 adds G, tier 3 adds Q), and focal competition between layers is JEV's call per layer.

### 4.3 Adjacent sections

- Default is variety: an adjacent section never repeats a recipe by habit, and never repeats the same entrance (DS-K section 2).
- A repeat is allowed only when JEV judges it serves the story: ask a `noul` "Yes means reusing `<ID>` from the adjacent section serves the page's story (a deliberate rhythm or a continued beat) and does not read as a template." Keep at 0.6 or above; otherwise pick the next candidate for that role.
- Page caps in 4.1 step 3 always win over a yes.

### 4.4 Worked stacks (from IM section 5)

- Hero, immersive: `nz.section.gaze` (background) + `an.R02` per-word headline (text) + `gsap.scrub` exit (motion) + `an.R06` CTA (hover).
- Gallery, immersive: `nz.section.gallery-carousel` (layout) + `three.img_hover` with `sh.cover_uv_hover` (hover) + `an.R02` on captions (text).
- Hero, marketing: `rf.D9.plinth` (layout) + `three.studio_object` with `sh.fresnel_rim` (3D) + `an.R03` (text) + `frame.demo` below as its own section (demo).

## 5. Gaps (mentioned but not fully specified)

1. `core.side_nav`: DS-C allows a side nav from 1024 "with a fixed width budget" but gives no width, item anatomy, or collapse behaviour.
2. `core.menu_popover`, `core.tooltip`: DS-F sections 5 and 8 set top-layer chrome and timing; no anatomy, trigger, keyboard, or placement spec in DS-C.
3. `core.checkbox_radio`, `core.switch`, `core.slider`: DS-F section 7 lists what paints pressed; DS-C has no spec (anatomy, sizes, states). `an.R17` covers switch motion only.
4. `core.tpl.<family>`: DS-F section 10 names 13 template families; no region map, width budget, or container policy exists for any of them.
5. Dashboard KPI tile and charts: no JAL Core KPI tile or chart spec in DS-C; only motion (`an.R08`, `an.R36`, `an.R37`) and FR Bento. The `dataviz` skill is the nearest home and is not wired here.
6. No JAL Core spec for a pricing table, testimonial block, hero layout, or footer; section 3 composes them from `core.*` layouts.
7. `an.R23` pins below 640 through the app-shell scroller (MC R23) while JC `motion.pin` never pins below 768. This index uses the `motion.pin` rule; MC R23 needs its owner to reconcile.
8. `an.R27` scales an image on hover, which DS-K section 3 bans ("Animating an image on hover") and DS-D D4 strips. `three.img_hover` distorts images inside a canvas; the ban does not state whether the canvas exemption covers it. Needs Brian's ruling.
9. `mu.R44` runs an ambient 60s turn with a pause control (MC R44); `three.dot_globe` forbids ambient spin (IM 4.5). Same globe, two rules.
10. bang stagger values (24ms char, 70 to 120ms word, MS) differ from the tokens (`--stagger-char` 20ms, `--stagger-word` 40ms, Brian v0.4.0, MC section 2.1). The tokens win.
11. `bang.shot_size`, `bang.camera_follow_click`: MO section 4 says "worked GSAP timeline examples live in `references/showcase.md`", but MS has no code sketch for either.
12. `bang.directional_blur`: resolved by the lead. DOM `filter: blur` stays banned: DOM motion is transform and opacity only, for performance and reduced motion. Directional or motion blur is allowed inside a WebGL canvas as shader shading (`sh.*`), and inside noyzzi sections as designed. On DOM transitions, use the opacity crossfade fallback.
13. `gsap.live_dom_demo` and `frame.poster_steps` exist only as JC `motion.demo_medium` criteria; neither has a build section.
14. `nz.section.moodboard`: resolved. Brian allows everything from noyzzi, including its designed overlap, inside a `data-jal-exempt="noyzzi"` section; `ui_audit` exempts overlap there.
15. `cr.ocean_snell`: CR section 5 has no mobile fallback subsection; the fallback here comes from IM 4.4.
16. `three.*` rows other than `three.scroll_camera`, `three.img_hover`, `three.matcap_clay`, `three.sdf_blob`, and the particle tiers have no single build section; the recipe is spread across IM 4.5, R3, TF, and SH.
17. `px.canvas2d_field`: IM Zone B covers "a 3D canvas"; the law for a JAL 2D canvas is not stated. This index applies canvas law.
18. `px.nixie_fx`, `px.rapier_toy`: approval candidates (need Brian's yes); nixie-fx pins three to 0.185.x; the Rapier one-clock wiring is marked `[verify]` in PX section 9.
19. noyzzi: effect code is not retrievable (`noyzzi_get` returns MANUAL); every cost tier is an estimate; the technique (2D canvas or WebGL) of every C1 section is unknown until `noyzzi_get`; dark house buttons and the Draw Clear pill are under 44px.
20. ID drift: resolved. Canonical noyzzi IDs are `nz.section.<slug>`, `nz.fx.<slug>`, and `nz.el.<id>` (the catalog now uses `nz.fx.*`). Magic UI and Animata recipes resolve by number: `mu.Rnn` and `an.Rnn` are the same row.
21. Stale combine text in files owned elsewhere: IM section 3 step 3 ("a `noul` on combining the top two"), IM section 5 step 3 ("Drop the recipe used by the adjacent section"), and MC section 7.3 ("combining the top two ... never two G") predate Brian's ruling; section 4 of this file is the current protocol. JC has no named key for the adjacent-repeat question in 4.3.
22. Forms: MC section 7.2 caps forms at tier 1; JC `motion.intensity` fixes them at tier 0. This index uses tier 0.
23. Resolved: `jal-motion` now cites `skills/jal-immersive/references/...`.
