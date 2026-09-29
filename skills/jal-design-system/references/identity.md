# JAL Core identity: the composition kit

Why this file exists: JAL Core used to live only as prose rules and tokens, so every agent rewrote layout and CSS from scratch and every page came out generic (text left and 3D right in every section, default cards, two stacked headings, no grid, no type pairing). The identity is now code. Every JAL page is composed from the kit in `templates/monorepo/packages/ui/src/kit` (styles in `packages/ui/src/kit.css`), so the signature is carried by the components, not by the agent's memory.

**Identity = fixed signature + dynamic expression.** The signature is what every JAL page shares and a visitor recognises with the copy removed. The expression is what a direction (D1 to D13 in `directions.md`, or a project's own derived identity) changes through knobs. Law is outside both and never moves.

Read with: `SKILL.md` (Kit first), `directions.md` (the knob values per direction), `craft.md` (the floor and the critic), `blocks.md` (block specs the compositions implement), `jal-ui-taste` (tokens and hard law).

## 1. The fixed signature (never a knob)

### 1.1 Grid and rhythm

One grid, placed by every composition on its column lines. Defined in `kit.css` (`.kit-grid`).

| Width | Columns | Page margin | Gutter | Section rhythm (default / tight / generous) |
|---|---|---|---|---|
| 0 to 639 | 4 | 16 | 16 | 64 / 40 / 80 |
| 640 to 1023 | 8 | 32 | 24 | 80 / 48 / 96 |
| 1024 and up | 12 | knob `--kit-margin-lg` (32 to 64) | knob `--kit-gutter-lg` (16 to 32) | knob `--kit-space-lg` (64 to 96) / 64 / knob plus 32 |

- Content caps at 1280 (`--kit-max`); above it the page centers. Tracks are `minmax(0, 1fr)`; every child has `min-width: 0`.
- Parts that live on the page columns use `subgrid` (`.kit-sub`, the section head, Split, StatRow, SpecTable, StickyStory, CTABand), so every section shares one content line and one right edge.
- Every line height sits on the 4px grid (the `--line-*` tokens); spacing is the 4px scale only.
- **One section rhythm per page:** `Page rhythm` (tight, default, generous) writes `data-rhythm` on `.kit-page`, and every section's block padding is `--kit-gap-section` from it. A section never picks its own rhythm. A band that belongs to its neighbour (LogoRow, a short proof band) is `attached`: it takes the group gap, and the section after it tops up to one full section gap.
- **One gap between two sections, never two.** Two sections on the same ground: the follower's top padding collapses, so content to content is one section gap. When the direction draws the structural rule (`--kit-section-rule` 1px, `--kit-rule-pad` 1), the follower keeps its padding and the rule sits in the middle (content width, never full bleed, never between two tones). A tone change keeps full padding on both sides of the edge. The CTABand `band` is its own tone and never collapses.
- Heading rhythm: space above a heading is always at least twice the space below it.

### 1.1a The spacing ladder (tidiness)

Every kit composition spaces by relation, only with these five names (`kit.css`, on `:root`, `[data-direction]`, and `.kit-page`), so a page reads as one hand at every width:

| Relation | Variable | 0 to 639 | 640 to 1023 | 1024 and up | Used for |
|---|---|---|---|---|---|
| inside one item | `--kit-gap-inside` | 8 | 8 | 12 | a title and its body, a value and its caption, a label and its value, action buttons |
| between related items | `--kit-gap-related` | 16 | 16 | 20 | a heading and its lead, the rows of a text column, text and its actions, items of one list |
| inset | `--kit-inset` | 20 | 24 | 32 | the padding inside a tile, cell, panel, or live view |
| between groups | `--kit-gap-group` | 32 | 40 | 48 | the section head and its body, stacked text and media, two groups of one table |
| between sections | `--kit-gap-section` | page rhythm | page rhythm | page rhythm | every section's block padding |

- **Proximity law:** inside < related < inset < group < section, at every width (`kit-css.test.ts` checks it). The gap between items of one list is never larger than the padding inside an item, and never a section-sized gap.
- **Short items share one surface.** Items that are a title and a sentence sit in one grouped surface: the hairline cell grid (`.kit-cells`), which on a phone is a single panel with a hairline between rows (the grouped inset list), never N separate cards. Separate tiles only for items that carry media or substantial content (Bento tiles, FeatureGrid lead tiles, pricing plans).
- **Radius scales with the element:** the large card radius only on large frames and panels; a list row, tab, or control takes the control tier; a radius never exceeds about a third of its element's height.
- **No card around section text.** A heading, a lead, and actions sit on the section ground; only media, data views, and grouped items get a frame.
- **Audit attributes.** Every top-level section writes `data-kit-composition` (the recipe id) and `data-variant` (its structure), and the page root writes `data-rhythm`, so `ui_audit`'s tidiness rules and `readPageLedger` read rhythm and repetition from the markup.

### 1.2 Type

- **The generator is fixed:** `round(16 x 1.2^n)` from `tokens.css`. A direction picks which steps carry the page; it never changes the ratio.
- **Five roles per page, no sixth size:** display (the Masthead headline only, one per page), heading (section h2, stat values, prices, quotes), title (19, h3 and item titles), body (16), meta (13, labels, captions, units). `kit.css` sets no other size, and a test enforces it.
- **Display ramp:** `--kit-display-sm/md/lg-size` step at 768 and 1024 (Carbon's responsive display token, declared once), weight 500 or 600, tracking `--tracking-display` (-0.01 to -0.04em), `font-optical-sizing: auto`, `text-wrap: balance`. **Capped by measure:** the size is `min(step, fit)`, where the fit comes from the headline's length (`--kit-display-chars`, written by Masthead) and its column (the masthead text is an inline-size container): at most 3 lines below 640, 2 from 640, and 1 from 1024 for a headline of 22 characters or fewer. The line height follows the size on the 4px grid. A headline never grows past the direction's step and never breaks into three awkward lines on a desktop.
- **Numerals, Carbon style:** every spec value, list value, chart tick, and time is `.kit-num`: tabular mono (`--kit-font-mono`), `tabular-nums slashed-zero` (Geist Mono draws its zero slashed by default). Units are set at the meta size in ink-muted, joined by a no-break space (`<Figure value unit>`). Big figures (StatRow, price, Bento stat) use `--kit-font-figure` (the display face with tabular numerals by default; mono in D3 and D10; the text face in D7 and D12). A face without tabular figures never carries figures.
- **One heading plus one lead.** Every section head is `SectionHead`: an h2 and one lead line, split across the grid (heading on 1 to 5, lead on 7 to 12) or stacked (1 to 8). Two stacked headings, a kicker, an eyebrow, or a numbered marker ("01") above a heading cannot be expressed with the kit.
- **Families (full rules in `typography.md`):** Geist Sans and Geist Mono are the default, vendored in `packages/ui/src/fonts` (SIL OFL 1.1) with metric-matched fallbacks and read through `--font-sans`, `--font-display`, `--font-mono`. Typography is not locked to them: each page takes one pairing from the curated OFL pool, a text family plus at most one display family plus one mono, so at most three families. A section may switch only its display role when its content calls for it (an editorial quote, a manifesto line), never the text role, and only while the page stays at three families. The scale, the five roles, the weights, and tabular numbers stay fixed whatever the face. Every stack ends in the Geist stack. Each direction has a default pairing (`typography.md` section 5, set in `kit.css`); JEV `ui.type_pairing` picks among candidates at direction time. Pool faces are fetched into the client project with `scripts/assets/fonts.ts`, never vendored in the plugin.

### 1.3 Depth and surface

- Tonal bands, never shadows: `page` (canvas) and `layer-1` bands alternate by `Section tone`; tiles, cells, panels, and frames are `surface` with one full 1px hairline.
- The **hairline cell grid** (`.kit-cells`): a 1px gap over the border tone draws every internal line, so each cell is a full box and no line is one-sided. FeatureGrid and PricingTable use it; item counts are validated so no cell is dead.
- Media always sits in a `MediaFrame`: fixed aspect ratio, the direction's media radius, a full hairline, the caption below, never over.

### 1.4 Shape

Radius scale 4, 8, 12, 16, 28, pill. One value per tier product-wide: `--kit-radius-card` (4, 12, 16, 28), `--kit-radius-media` (matches cards), `--kit-radius-control` (4, 8, pill). Nested radius is smaller than its parent. Controls are 44px everywhere.

### 1.5 Data presentation

Specs and stats are the data identity of every marketing page (Carbon's structured list and DataTable, rendered in JAL Core):

- **SpecRail:** label (meta, ink-muted) and value (ink, tabular mono) rows between two structural rules, 44px minimum rows.
- **SpecTable:** groups of rows in a real `<table>` with row headers; at 1024 and up the group name takes columns 1 to 4 and the rows 5 to 12 at the product density (`ui.density`).
- **StatRow:** two to four figures at the heading step with a structural rule above each; never a hero, never a giant numeral.

### 1.6 Signature compositions

The only building blocks of a page. Each renders its own `Section` (except Masthead, Footer, SpecRail, and MediaFrame, which are placed inside or as their own element).

| Composition | Job | Anatomy and rules |
|---|---|---|
| `Page` | root | carries `data-direction` (and `data-theme="dark"` for D13 only); paints the canvas; wrap the AppShell with it, or set `data-direction` on `<html>` |
| `Section` | a band | `tone` base or layer, `rhythm` tight, default, generous; the 4/8/12 grid inside; for hand-written layout that still lands on the grid |
| `SectionHead` | one heading plus one lead | `layout` split or stack; the only way a section is titled |
| `Masthead` | the hero, once, first | variants `left` (type-led, headline on 1 to 10, an optional proof strip below), `centered` (Marquee or wordmark openings, pair with a centered Quote), `split` (text on 5, a MediaFrame on 7, `mediaSide` flips it); the headline never sits in a card or panel; the display size is the direction's step capped by measure (at most 2 lines from 640, 3 below, 1 from 1024 for 22 characters or fewer, balanced); 70 to 90% of the first viewport; bottom padding 1.3x the top; one primary and at most one secondary action |
| `Split` | one statement beside one proof | ratios 5/7, 7/5, 4/8, 8/4 (text/media), `mediaSide`, `mobileMedia` before or after; the extra slot takes a SpecRail or a short list |
| `BentoGrid` + `BentoTile` | mixed claims, each a real view | a declared `grid-template-areas` map (`lg` 2 to 4 columns, optional `md` 1 or 2), validated: no dead cell, rectangles only, every area has a tile, only media tiles span rows; tile kinds `media`, `stat`, `text`, `list` share one chrome |
| `SpecRail` / `SpecTable` | the data identity | see 1.5 |
| `StatRow` | 2 to 4 figures side by side | see 1.5; never directly under the Masthead |
| `FeatureGrid` | truly equivalent capabilities compared | 2, 3, or 4 columns in the hairline cell grid; one anatomy per item: optional inline icon on the title row (never a tile above), the title (the item's only heading), one or two sentences; the count must fill every row |
| `MediaFrame` | every image, video, canvas, live view | kinds `image` (sized, lazy unless `priority`), `video` (muted, looped, inline, poster, no autoplay under reduced motion), `canvas` (drawn content; the canvas zone rules of `jal-immersive` apply inside, the frame keeps page law), `view` (a live DOM product view in flow, the ratio is its minimum), `placeholder` (honest, names the subject) |
| `Quote` | one real, attributed quote | type alone at the heading step; no rule, no card, no quote glyph |
| `LogoRow` | real customers or platforms | one monochrome treatment, one height, gap only; a one-line relationship label beside the marks |
| `FAQ` | real questions | native `details` and `summary` rows in one bordered container; 44px summaries with the state recipe; head on 1 to 4, rows on 6 to 12 |
| `CTABand` | the close | start aligned, heading and lead on 1 to 6, actions and proof from the page's own world (a price, a delivery promise, a SpecRail) on 8 to 12 |
| `PricingTable` | Carbon-structured pricing | 2 to 4 plans in cells (name, price in tabular figures with unit and period, summary, included list, action on one baseline); the recommended plan has the filled action and a surface cell, never a badge; optional comparison `<table>` with words, not color |
| `Footer` | the chrome close | one archetype from the `directions.md` chrome table: `inline`, `statement`, `masthead`, `letter`, `index` (hubs and docs only) |
| `StickyStory` + `useStickyStory` | a scroll story | at 1024 and up the whole story pins: every step is on screen, distributed along the stage height beside the sticky stage (the text column is never empty), the active step in ink and the others in ink-subtle (muted, never hidden); a hidden track of markers gives each step the same pinned scroll, and the marker crossing the middle of the real scroller makes its step active (IntersectionObserver rooted with `getScroller` from AppShell, so contained shells work); below 1024 each step shows its media in flow; reduced motion swaps frames with no travel or fade; inactive frames are `visibility: hidden`, never stacked visibly |

Helpers: `Figure` (value plus unit, `count` for the count-up), `staggerStyle`, `validateBentoLayout`, `BENTO_PRESETS` and `bentoPreset`, `validatePageRecipe`, `validateVarietyLedger`, `readPageLedger`, `PAGE_RECIPES`, `DIRECTIONS`, and the motion layer (`useKitMotion`, `armMotion`, `countUp`, section 7).

Media in every slot is a MediaFrame holding a real image or poster, a live data view built from kit roles (a readout, a list, a chart), or an honest placeholder that names its subject. Never a drawn or CSS-faked product (`blocks.md`).

### 1.7 Structural variants

Each composition has two or three variants that change structure, never colour, all on the grid and inside the law. Fewer, excellent variants over many: a variant ships only when it reads as finished at 375 and 1280. The ledger (section 5.1) keeps neighbours from rhyming. JEV picks among them: `ui.region_gate` maps the region's container to the composition (section 5.3), then `ui.component_recipe` takes `kit.<composition>.<variant>` candidates with the criteria below.

| Composition | Variant | Job | JEV picks it when |
|---|---|---|---|
| Masthead | `left` | type-led opening, optional SpecRail strip as proof | the product's proof is a handful of facts, or there is no honest media yet |
| | `centered` | a wordmark or a Marquee | the name is the composition; pair with a centered Quote |
| | `split` | the claim beside one live view or real image | there is one real product view that proves the headline |
| Split | `inset` | text beside a framed media on the ratio | the default for one statement and one proof |
| | `bleed` | the frame's surface runs to the viewport edge on its side; a live view's content and the caption stay on the grid | the one hero-grade product view below the Masthead; at most once per page |
| | `over-spec` | text across the top, the media full width, a SpecRail strip under it | a claim whose proof is four measured values |
| StatRow | `row` | 2 to 4 figures across the grid | figures that stand on their own |
| | `lead` | a heading and one lead on 1 to 5, the figures as a 2 by 2 block on 7 to 12 | a claim the numbers then prove |
| | `chart` | the heading and figures on 1 to 6 (figures on the chart's baseline), one short chart on 7 to 12 | numbers that have a shape over time |
| FeatureGrid | `cells` | equivalent capabilities in the hairline cell grid | three to eight peers with a title and a sentence each |
| | `rows` | title, body, and a measured value per row between hairlines | capabilities that each carry a number |
| | `detail` | a selectable list on 1 to 5, the active item's media on 7 to 12 (tabs, arrows, first active without JS) | three to five capabilities that each need a picture |
| | `lead` | two media tiles, then the other four as one hairline cell group | two headline capabilities and four supporting ones |
| SpecTable | `grouped` | group name and note on 1 to 4, its table on 5 to 12 | a datasheet read top to bottom |
| | `rail` | prose or media on 1 to 6 beside a sticky rail of every group on 8 to 12 | a spec a reader checks while reading the story beside it |
| BentoGrid | preset (three per tile count) | `lead-left`, `lead-right`, `row` (3 tiles); `lead-left`, `lead-right`, `band` (4); `lead-left`, `lead-center`, `columns` (5); `lead-left`, `grid`, `stagger` (6) | the count of real claims; the lead area holds the one media tile; two Bentos on a page never share a preset |
| Quote | `pull` | a large pull quote and the name | one voice that needs no numbers |
| | `results` | the quote on 1 to 7, the customer's own figures on 9 to 12 | a case-study voice with numbers behind it |
| CTABand | `split` | heading and lead on 1 to 6, actions and proof on 8 to 12 | the default close |
| | `form` | heading on 1 to 5, a one-field form with its submit on one row on 7 to 12 | a close that asks for one field |
| | `band` | a full-bleed tint band (tone `band`), heading, actions, and a SpecRail strip on the grid | the one close a brand wants remembered |
| FAQ | `split` | details rows beside the head | more than four questions, or long answers |
| | `open` | question and answer pairs in two columns, every answer visible | four to six short answers nobody should have to open |
| StickyStory | `stage-end`, `stage-start` | media on the right or the left | flip it when the page's other stage sits on the same side |
| LogoRow, PricingTable, Footer | one structure each (Footer has its five archetypes) | | |

## 2. Dynamic expression: the knobs

Every knob is a CSS custom property set in one block keyed on `[data-direction="..."]`. Components read only these names, so a direction changes the whole page with no component edit.

| Knob | Property | Lawful range |
|---|---|---|
| Canvas | `--color-page` | white, neutral `#fafaf9`, cool `#f7f8f8`, warm `#faf8f5`, light beige `#f8f5f0` (the canvas floor in `directions.md` section 6) |
| Accent and role | `--color-accent`, `--color-accent-contrast`, `--color-primary` (+ hover, active), `--kit-signal`, `--kit-link` | one hue outside HSL 235 to 330, 4.5:1 for text use; exactly one role: none, `filled_primary` (primary fill), `signal_only` (`--kit-signal`), `text_and_icon` (`--kit-link`) |
| Type pairing | `--kit-font-sans`, `--kit-font-display`, `--kit-font-mono` | one pairing from the pool in `typography.md` section 3, at most three families, every stack ending in the Geist stack; default Geist plus Geist Mono, Newsreader display in D7, Nunito display in D12; a section may redeclare `--kit-font-display` only |
| Figure face | `--kit-font-figure` | display face (default), the text face, or `--kit-font-mono`; always a face with tabular figures |
| Display steps | `--kit-display-{sm,md,lg}-{size,line}` | sm at most `--text-display-1`; lg from `--text-6` to `--text-display-3`; Persuade and Experience only above `--text-6` |
| Heading steps | `--kit-heading-{sm,lg}-{size,line}` | `--text-3` to `--text-5`, at least two steps above body |
| Weights | `--kit-display-weight`, `--kit-heading-weight` | 500 or 600; 400 only inside a section switched to a single-weight face (`typography.md` rule 2.5) |
| Tracking | `--tracking-display`, `--tracking-heading` | display -0.01 to -0.04em, heading 0 to -0.02em |
| Grid | `--kit-margin-lg`, `--kit-gutter-lg` | margin 32 to 64, gutter 16 to 32 (spacing tokens) |
| Rhythm | `--kit-space-lg` | 64, 80, or 96 |
| Shape | `--kit-radius-card`, `--kit-radius-media`, `--kit-radius-control` | cards and media 4, 12, 16, 28; controls 4, 8, pill |
| Structure | `--kit-rule-color`, `--kit-section-rule` | `--color-border` or `--color-border-strong`; rule 0 or 1px |
| Density | `data-density` on the root | `ui.density` result, desktop rows only |

The per-direction values are the table in `directions.md` section 7a. A direction also names its default Masthead variant and Footer archetype there; both are still gated like any region.

## 3. A derived identity (a new system from the same base)

A project may define its own identity instead of a preset, when the contract says why no preset carries the product. It stays JAL Core: same components, same signature, same law.

1. In `docs/design/direction.md`, set `Preset: derived <name>` and fill the Knobs table with one value per knob in section 2, each inside its lawful range, each with a reason.
2. Add one block to the app's own stylesheet (for example `apps/web/src/styles.css`), never to `kit.css`:
   ```css
   /* direction: derived harbor, see docs/design/direction.md */
   [data-direction="harbor"] {
     --color-page: #f7f8f8;
     --color-accent: #0f766e;               /* HSL 175, signal only */
     --kit-signal: var(--color-accent);
     --kit-display-lg-size: var(--text-display-2);
     --kit-display-lg-line: var(--line-display-2);
     --tracking-display: -0.03em;
     --kit-radius-card: var(--radius-16);
     --kit-radius-media: var(--radius-16);
     --kit-radius-control: var(--radius-8);
     --kit-margin-lg: var(--space-40px);
     --kit-space-lg: var(--space-80px);
     --kit-section-rule: 1px;
   }
   ```
3. Set `data-direction="<name>"` on `<html>` or `<Page direction="<name>">`. Only knob names from section 2 may appear in the block; raw values only where the range table allows a hex (canvas, accent). Anything else (a new size, a new radius, a shadow, a second accent) is a law or token change and goes to Brian.
4. The finish critic audits the build against the knob table like any preset.

## 4. Hard law the kit keeps (restated, not editable here)

White-first page (dark only as an explicit dark mode, D13 needs `data-theme="dark"`); no gradients on page chrome; no shadows, no glow, no blur; no purple, violet, or indigo; no emoji; no em-dash; no eyebrow labels, kickers, or numbered section markers ("01" counts); no side lines, top or bottom accent bars, decorative lines, connectors, or marker dots; no overlap and nothing outside its box; 44px controls; the mobile app-shell below 640; reduced motion keeps meaning with no travel. `kit.css` is tested for gradients, shadows, purple hues, em-dash, side borders, uppercase tracking, fill hacks, raw hex outside the knob layer, and any sixth font size (`kit/kit-css.test.ts`).

No text over media anywhere in the kit: the former `Masthead variant="overlay"` (a text panel over a backdrop band) is removed, and a hero headline never sits in a card or a panel. The accent has one role per direction; with `filled_primary` (D2, D9) it fills only the page's two conversion actions (the Masthead's and the CTABand's first action, `--kit-action`), which never share a view, and every other primary action stays ink.

## 5. Composition rules and page recipes

### 5.1 The anti-repetition law (checked by `validatePageRecipe`)

1. A marketing page opens on a `Masthead` (any variant). Nothing else is a hero; Operate and Read screens open on a page header, not a Masthead.
2. No two adjacent sections share a composition.
3. No composition appears more than twice on a page; Masthead and Footer once.
4. Every marketing page carries the data identity: at least one `BentoGrid`, `SpecTable`, `SpecRail` section, or `StatRow`.
5. A `StatRow` never directly follows the Masthead (no big-number hero).
6. The Footer is last.

The variety ledger (`validateVarietyLedger`, run by `validatePageRecipe` when entries carry variants: `"split.bleed"` or `{ composition, variant }`) works one level down:

7. No two adjacent sections share composition and variant.
8. No composition and variant appears more than twice on a page.
9. A marketing page uses at least three different compositions (the Footer does not count).

`readPageLedger(root)` builds the entries from rendered markup, so a built page is checked the same way as its plan.

Also, outside the validator: adjacent sections change tone or structure, and a page keeps one text alignment (start by default; a centered Masthead pairs with a centered Quote). The same Masthead variant and footer archetype are not reused across two surfaces of one product without a knob delta (`directions.md` section 4).

### 5.2 Page recipes

Each recipe lists compositions in section order (the user's question order). JEV still gates every region, so a recipe is the candidate stack, not a mandate. `PAGE_RECIPES` in `kit/recipe.ts` holds the same lists and every one passes the validator.

| Page | Compositions | Notes |
|---|---|---|
| Product landing | masthead, logo-row, split, stat-row, sticky-story, bento, spec-table, quote, feature-grid, pricing, faq, cta-band, footer | the kit preview's page A builds this with its variants (section 6); hardware leans on MediaFrame canvas or real renders, software on `view` frames of the real product |
| SaaS landing | masthead, logo-row, bento, sticky-story, split, quote, pricing, faq, cta-band, footer | the Masthead proof slot or the Bento carries a live product fragment, never a drawn screenshot of a browser |
| Company profile | masthead, split, stat-row, feature-grid, quote, split, cta-band, footer | the two Splits flip `mediaSide` and ratio (5/7 then 7/5) so neighbours never rhyme |
| Portfolio | masthead, bento, split, quote, media, cta-band, footer | Bento tiles are real projects (media tiles), the `media` section is one full MediaFrame band |
| Docs home | masthead (left, `--text-6` ceiling, Read mode), feature-grid, spec-table, faq, footer (index) | D6 by default; the FeatureGrid is the entry index, one item per real doc area |
| Pricing | masthead (left), pricing, spec-table, faq, cta-band, footer | the SpecTable holds limits and quotas per plan |
| App dashboard entry | custom page header, bento, spec-table | Operate mode (`validatePageRecipe(..., "product")`): no Masthead, the AppShell and a page header lead, the Bento holds KPI tiles and one real view |

### 5.3 How the agent picks, with JEV

No new catalog IDs; the existing gates carry the kit.

1. Write the section concept lines (`jal-ui-taste` Section concept law), then the candidate stack from the recipe.
2. `ui.region_gate` per region, as always. Its `container` answer maps to a composition: `bento` to BentoGrid, `rows` to SpecTable, SpecRail, or FAQ, `divided-section` to FeatureGrid or StickyStory, `plain-spacing` to Masthead, Split, Quote, StatRow, or CTABand, `card` to a single MediaFrame or panel inside a Section.
3. `ui.component_recipe` per surviving section, with the kit composition and its variants as candidates (`kit.masthead.split`, `kit.split.bleed`, `kit.stat-row.lead`, `kit.feature-grid.detail`, `kit.bento.lead-center`, the criteria in section 1.7), layered with motion recipes as the section's tier allows (section 7). The kit composition is always a candidate, the way the JAL Core component spec is.
4. Run `validatePageRecipe` on the final ledger (composition plus variant); fix and re-gate before markup.
5. Record in the direction contract: the preset or derived knob set, the Masthead variant, the Footer archetype, the composition list, and any hand-written section with its reason.

### 5.4 Hand-written layout (the exception)

Only when no kit composition carries the section's job, and only on the kit grid: build it inside `<Section>` with `SectionHead` for its title, place parts on column lines with `.kit-sub` and spans, use the type roles and `Figure`, and record it in the direction contract's decision ledger as `custom` with the reason. A hand-written section that repeats a kit composition is a finding.

## 6. Preview and proof

`packages/ui/src/kit/preview/` renders two pages from the kit only (a sample desk air monitor, sample content, every media slot a live data view):

- **Page A** `/landing` (D1 by default): the tidy product landing on the kit's own motion. Ledger: masthead.split, logo-row.row, split.inset, stat-row.lead, sticky-story.stage-end, bento.lead-right, feature-grid.rows, quote.results, spec-table.grouped, pricing.cells-compare, faq.open, cta-band.form, footer.inline.
- **Page B** `/motion` (D3 by default): the same system in another direction with the motion module on (Lenis on the GSAP clock, `KitMotion tier={3}`). Ledger: masthead.left, split.bleed, stat-row.chart, feature-grid.lead, sticky-story.stage-end, spec-table.rail, quote.pull, feature-grid.detail, bento.lead-left, faq.split, cta-band.band, footer.statement.

```bash
# page B needs lenis and gsap from a scratch install, never the repo:
#   mkdir /tmp/motion-deps && cd /tmp/motion-deps && bun add lenis@1.3.26 gsap@3.15.0 @gsap/react@2.1.2 react@~19.3.0 react-dom@~19.3.0
KIT_PREVIEW_DEPS=/tmp/motion-deps bun packages/ui/src/kit/preview/serve.ts 4190
# page A: http://127.0.0.1:4190/landing?d=D1     page B: http://127.0.0.1:4190/motion?d=D3
# ?reduce=1 answers the reduced motion query as matching, to check the finished page
bun mcp/jal-design/server.ts shots "http://127.0.0.1:4190/landing?d=D1" --widths 1280,375 --out <dir inside the cwd>
bun mcp/jal-design/server.ts audit "http://127.0.0.1:4190/motion?d=D3"
```

The preview is never the app's starter page and never shipped as one. Tests: `kit/kit.test.tsx` (markup, landmarks, Bento validation, FeatureGrid headings, recipes, the StickyStory observer on document and contained shells), `kit/variants.test.tsx` (every variant, the presets, the ledger, both preview ledgers, the audit attributes), `kit/motion.test.tsx` (the motion layer and the count-up), `kit/kit-css.test.ts` (law on `kit.css`, the measure cap, the accent role, the proximity law).

## 7. The motion layer

Motion is part of the kit, at two costs.

**The kit default (T0 and T1, zero dependencies, `kit/motion.ts`).** Markup carries intent only: `data-motion="rise"` on a block, `"item"` on each item of a list (with the capped stagger `--kit-i`), `"count"` on a figure. After mount, `useKitMotion` (in `Page`) arms the page: each target it will observe gets `data-motion-state="pending"`, and an IntersectionObserver rooted on the real scroller (`getScroller` after mount) flips it to `"in"` once. `kit.css` hides only the pending state and only without reduced motion: fade plus a 12px rise on `--ease-standard` at `--dur-400`, `--stagger-item` capped at the sixth item. No JavaScript, a failed bundle, no IntersectionObserver, and reduced motion all render the finished page, and a target added after arming is never pending, so nothing can stick (`ui_audit` stuck-reveal stays clean). Figures count up once on the standard curve at `--dur-600`, their box locked to the final width first, digits tabular, so nothing shifts. State layers follow the JAL state recipe (hover and press tints, instant focus rings; the detail tabs carry state in ink).

| Page `motion` | JEV `motion.intensity` | Kit default |
|---|---|---|
| `none` | 0 still (forms, pricing-only, docs, legal) | state layers only |
| `quiet` (default) | 1 | one entrance per block, once |
| `staged` | 2 | blocks without items plus every item staggered |

Which composition gets which default: Masthead text then media (stagger 1); SectionHead, Split text and media, Quote, CTABand, FAQ list: one rise per block; FeatureGrid items, pricing plans, Bento tiles, FAQ open pairs, stat items: item stagger at `staged`; StatRow, Bento stat, and Quote results figures: count-up; StickyStory: the active step and frame swap (CSS, no travel under reduced motion).

**The motion module (T2 and T3, `templates/modules/motion`).** Lenis is the default smooth scroll for marketing and immersive pages, never ScrollSmoother and never both: `SmoothScroll` wires Lenis to the one GSAP clock (gsap.ticker drives `lenis.raf`, `lagSmoothing(0)`, `lenis.on("scroll", ScrollTrigger.update)`), after mount, on window or a contained shell's scroller, off under reduced motion and on touch-first devices unless the page opts in, with in-page anchors through `lenis.scrollTo` minus the header. `KitMotion tier` takes over the kit's entrances (it claims the page with `data-motion-engine` so there is one owner): tier 2 adds SplitText line reveals on the h1 and section headings, tier 3 (1024 and up) scrubs the StickyStory frames across the kit's pin, drifts bleed image or canvas media, and brings the SpecTable rail rows in order. JEV `motion.choreography` per section picks the pattern (`reveal` is the kit default; `stagger_sequence` is tier 2; `scrub` and `pinned_sequence` are tier 3 and map to the story scrub). The module's README has the file map, the wiring, and the budget.
