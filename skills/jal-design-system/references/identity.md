# JAL Core identity: the composition kit

Why this file exists: JAL Core used to live only as prose rules and tokens, so every agent rewrote layout and CSS from scratch and every page came out generic (text left and 3D right in every section, default cards, two stacked headings, no grid, no type pairing). The identity is now code. Every JAL page is composed from the kit in `templates/monorepo/packages/ui/src/kit` (styles in `packages/ui/src/kit.css`), so the signature is carried by the components, not by the agent's memory.

**Identity = fixed signature + dynamic expression.** The signature is what every JAL page shares and a visitor recognises with the copy removed. The expression is what a direction (D1 to D13 in `directions.md`, or a project's own derived identity) changes through knobs. Law is outside both and never moves.

Read with: `SKILL.md` (Kit first), `directions.md` (the knob values per direction), `craft.md` (the floor and the critic), `blocks.md` (block specs the compositions implement), `jal-ui-taste` (tokens and hard law).

## 1. The fixed signature (never a knob)

### 1.1 Grid and rhythm

One grid, placed by every composition on its column lines. Defined in `kit.css` (`.kit-grid`).

| Width | Columns | Page margin | Gutter | Stack gap (between blocks in a section) | Section rhythm (default / tight / generous) |
|---|---|---|---|---|---|
| 0 to 639 | 4 | 16 | 16 | 32 | 64 / 40 / 80 |
| 640 to 1023 | 8 | 32 | 24 | 32 | 80 / 48 / 96 |
| 1024 and up | 12 | knob `--kit-margin-lg` (32 to 64) | knob `--kit-gutter-lg` (16 to 32) | 48 | knob `--kit-space-lg` (64 to 96) / 48 / knob plus 32 |

- Content caps at 1280 (`--kit-max`); above it the page centers. Tracks are `minmax(0, 1fr)`; every child has `min-width: 0`.
- Parts that live on the page columns use `subgrid` (`.kit-sub`, the section head, Split, StatRow, SpecTable, StickyStory, CTABand), so every section shares one content line and one right edge.
- Every line height sits on the 4px grid (the `--line-*` tokens); spacing is the 4px scale only.
- One section rhythm per page. `tight` is only for a band attached to its neighbour (LogoRow, a short proof band); `generous` only for the one signature section. Heading rhythm: space above a heading is always at least twice the space below it.
- Two sections of the same tone are separated by space, or by the structural rule when the direction turns it on (`--kit-section-rule`, 1px, content width, never full bleed, never between two different tones).

### 1.2 Type

- **The generator is fixed:** `round(16 x 1.2^n)` from `tokens.css`. A direction picks which steps carry the page; it never changes the ratio.
- **Five roles per page, no sixth size:** display (the Masthead headline only, one per page), heading (section h2, stat values, prices, quotes), title (19, h3 and item titles), body (16), meta (13, labels, captions, units). `kit.css` sets no other size, and a test enforces it.
- **Display ramp:** `--kit-display-sm/md/lg-size` step at 768 and 1024 (Carbon's responsive display token, declared once), weight 500 or 600, tracking `--tracking-display` (-0.01 to -0.04em), `font-optical-sizing: auto`, `text-wrap: balance`.
- **Numerals, Carbon style:** every spec value, list value, chart tick, and time is `.kit-num`: tabular mono (`--kit-font-mono`), `tabular-nums slashed-zero`. Units are set at the meta size in ink-muted, joined by a no-break space (`<Figure value unit>`). Big figures (StatRow, price, Bento stat) use `--kit-font-figure` (the display face with tabular numerals by default; mono in D3 and D10).
- **One heading plus one lead.** Every section head is `SectionHead`: an h2 and one lead line, split across the grid (heading on 1 to 5, lead on 7 to 12) or stacked (1 to 8). Two stacked headings, a kicker, an eyebrow, or a numbered marker ("01") above a heading cannot be expressed with the kit.
- System stacks only (`system-ui` sans, `ui-monospace` mono, `ui-serif` for D7 with Brian's yes, `ui-rounded` for D12). A webfont is a dependency decision for Brian.

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
| `Masthead` | the hero, once, first | variants `left` (type-led, headline on 1 to 10), `centered` (Marquee or wordmark openings, pair with a centered Quote), `split` (text on 5, media on 7, `mediaSide` flips it), `overlay` (full-bleed media as a decorative backdrop band, text on a solid surface panel with a hairline, stacked below 1024, media `aria-hidden`); 70 to 90% of the first viewport; bottom padding 1.3x the top; one primary and at most one secondary action |
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
| `StickyStory` + `useStickyStory` | a scroll story | at 1024 and up a sticky stage (columns 7 to 12) shows the active step's media while the steps (1 to 5) scroll; the step crossing the middle of the real scroller becomes active (IntersectionObserver rooted with `getScroller` from AppShell, so contained shells work); below 1024 each step shows its media in flow; reduced motion swaps frames with no travel or fade; inactive frames are `visibility: hidden`, never stacked visibly |

Helpers: `Figure` (value plus unit), `validateBentoLayout`, `validatePageRecipe`, `PAGE_RECIPES`, `DIRECTIONS`.

## 2. Dynamic expression: the knobs

Every knob is a CSS custom property set in one block keyed on `[data-direction="..."]`. Components read only these names, so a direction changes the whole page with no component edit.

| Knob | Property | Lawful range |
|---|---|---|
| Canvas | `--color-page` | white, neutral `#fafaf9`, cool `#f7f8f8`, warm `#faf8f5`, light beige `#f8f5f0` (the canvas floor in `directions.md` section 6) |
| Accent and role | `--color-accent`, `--color-accent-contrast`, `--color-primary` (+ hover, active), `--kit-signal`, `--kit-link` | one hue outside HSL 235 to 330, 4.5:1 for text use; exactly one role: none, `filled_primary` (primary fill), `signal_only` (`--kit-signal`), `text_and_icon` (`--kit-link`) |
| Display face | `--kit-font-display` | system sans (default), `ui-rounded` (D12), `ui-serif` (D7, with Brian's yes) |
| Figure face | `--kit-font-figure` | display face (default) or `--kit-font-mono` |
| Display steps | `--kit-display-{sm,md,lg}-{size,line}` | sm at most `--text-display-1`; lg from `--text-6` to `--text-display-3`; Persuade and Experience only above `--text-6` |
| Heading steps | `--kit-heading-{sm,lg}-{size,line}` | `--text-3` to `--text-5`, at least two steps above body |
| Weights | `--kit-display-weight`, `--kit-heading-weight` | 500 or 600 |
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

The one overlay: `Masthead variant="overlay"` puts text on a solid, opaque surface panel above a decorative, `aria-hidden`, pointer-inert media band at 1024 and up, and stacks the two below 1024. It is the only lawful form of text over media: never a translucent scrim, never text directly on the image, and every fact the media shows is also in the panel (`hm.survives_deletion`).

## 5. Composition rules and page recipes

### 5.1 The anti-repetition law (checked by `validatePageRecipe`)

1. A marketing page opens on a `Masthead` (any variant). Nothing else is a hero; Operate and Read screens open on a page header, not a Masthead.
2. No two adjacent sections share a composition.
3. No composition appears more than twice on a page; Masthead and Footer once.
4. Every marketing page carries the data identity: at least one `BentoGrid`, `SpecTable`, `SpecRail` section, or `StatRow`.
5. A `StatRow` never directly follows the Masthead (no big-number hero).
6. The Footer is last.

Also, outside the validator: adjacent sections change tone or structure, and a page keeps one text alignment (start by default; a centered Masthead pairs with a centered Quote). The same Masthead variant and footer archetype are not reused across two surfaces of one product without a knob delta (`directions.md` section 4).

### 5.2 Page recipes

Each recipe lists compositions in section order (the user's question order). JEV still gates every region, so a recipe is the candidate stack, not a mandate. `PAGE_RECIPES` in `kit/recipe.ts` holds the same lists and every one passes the validator.

| Page | Compositions | Notes |
|---|---|---|
| Product landing | masthead, logo-row, split, stat-row, sticky-story, bento, spec-table, quote, feature-grid, pricing, faq, cta-band, footer | the kit preview builds exactly this; hardware leans on MediaFrame canvas or real renders, software on `view` frames of the real product |
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
3. `ui.component_recipe` per surviving section, with the kit composition and variant as candidates (for example `kit.masthead.split`, `kit.masthead.overlay`, `kit.split.7-5`, `kit.bento.2x2-lead`), layered with motion recipes as the section's tier allows. The kit composition is always a candidate, the way the JAL Core component spec is.
4. Run `validatePageRecipe` on the final order; fix and re-gate before markup.
5. Record in the direction contract: the preset or derived knob set, the Masthead variant, the Footer archetype, the composition list, and any hand-written section with its reason.

### 5.4 Hand-written layout (the exception)

Only when no kit composition carries the section's job, and only on the kit grid: build it inside `<Section>` with `SectionHead` for its title, place parts on column lines with `.kit-sub` and spans, use the type roles and `Figure`, and record it in the direction contract's decision ledger as `custom` with the reason. A hand-written section that repeats a kit composition is a finding.

## 6. Preview and proof

`packages/ui/src/kit/preview/` renders the product landing recipe (a sample desk air monitor, sample content) from the kit only.

```bash
bun packages/ui/src/kit/preview/serve.ts 4190      # builds with Bun.build, serves
# compare board (D1, D9, D11 side by side): http://127.0.0.1:4190/
# one direction:                            http://127.0.0.1:4190/landing?d=D9
bun mcp/jal-design/server.ts shots "http://127.0.0.1:4190/landing?d=D9" --widths 1280,375 --out <dir>
bun mcp/jal-design/server.ts audit "http://127.0.0.1:4190/landing?d=D9"
```

The preview is never the app's starter page and never shipped as one. Tests live in `kit/kit.test.tsx` (markup, landmarks, Bento validation, FeatureGrid headings, recipes, the StickyStory observer on document and contained shells) and `kit/kit-css.test.ts` (law on `kit.css`).
