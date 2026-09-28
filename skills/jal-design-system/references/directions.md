# JAL Core directions: variety without a second system

How a JAL surface gets a distinct, committed look without leaving JAL Core. A **direction** is a set of JAL Core knob values (accent hue and role, canvas temperature, tracking, display ceiling, radius tier, hairline weight, type personality, density, motion intensity, media role). It never selects a design system, a component set, or a token table, and it never loosens law. Tokens, components, and law stay JAL Core.

**Provenance.** The candidate, screen, and seeded-draw mechanism and the six variation axes are derived from pbakaus/impeccable (Apache-2.0), restated in JAL's own words. The page-shape vocabulary, the domain trios, the chrome verdicts, and the context ask are principles from the local hallmark skill (no license file), tagged `From: hallmark`, restated with no text copied; they feed the impeccable mechanism and never replace it (`craft.md` header). The 13 visual directions are JAL's own distillation of a small, hand-scale browse of Refero style pages (n = 29, 2026-09-29), written fresh; no Refero style document, token table, or URL index is reproduced, and Refero is never fetched by JAL agents (its robots.txt blocks Claude agents and its Terms forbid systematic extraction). Method notes also draw on referodesign/refero_skill (MIT).

## 1. When to roll

| Situation | What happens |
|---|---|
| The target repo already has `docs/design/direction.md` and the brief does not ask for a change | Inherit it. No roll. |
| A local extension, one component, or a precisely specified narrow request | No roll. Build inside the existing direction. |
| A whole new surface inside an established direction | Keep the direction fixed; roll **structures** only (section 3, `kind = structure`). Composition changes, identity does not. |
| A new product, a replacement look, or a redesign | Full roll: candidates, JEV screen, seeded draw, contract (sections 2 to 6). |

From: hallmark. The pre-flight scan (`hm.preflight_scan`, `craft.md` section 11 step 1) runs before this table is read, so "inherit" or "roll" is decided on cited evidence. Whether a request is "one component" is decided by the scope signals in `hm.scope_first` (`craft.md` section 9): two signals mean component and no roll; unclear and unanswered defaults to component.

## 2. The variety mechanism

Why a mechanism: when any chooser picks from a ranked shortlist (the model, a simulated user, a judge model), the first option wins about 9 times in 10. Variety dies at selection, not at ideation. So the agent proposes, JEV screens, a hash assigns, and the agent builds. **JEV screens; it never rank-picks.**

1. **Ground it.** Write one sentence each: the product's unique mechanism, the audience's real scene (who, where, what light), their cultural home, and what the first surface must prove. Pick the visitor mode (`craft.md` section 1).
   - **Context ask** (From: hallmark, H>I, `hm.context_gate`): on attended runs, when the brief does not already say them, ask for the audience, the one action the surface exists for, and the tone as an extreme ("clean and modern" is not a tone), once, in one message, with an explicit "or say go ahead and I will infer". Never ladder follow-up questions. If the user opts out or does not answer, infer all three and state the inference in one line at the top of the next message so it can be redirected. Unattended runs infer and log the line. Why hallmark wins: impeccable grounds the brief but does not say what to do when an attended user will not answer. If the domain splits on intent (docs or marketing), that is the one question.
2. **Name the rut and keep it off the list**: the page this category always ships, and its predictable opposite. If the brief paints its own picture (a product name, a governing metaphor), its literal reading joins the rut; spend at most one candidate on it.
3. **Write 5 to 7 candidates** (default 7), ordered by resonance, rank 1 first. Each candidate is:
   - a **form**: a concrete visual system, artifact, place, or ritual the audience knows by heart (their notation, publications, instruments, identity programs, data graphics, screen traditions; what the thing would be as a physical object; what their world looked like before the web), with a one-line reason;
   - a **preset**: one of the 13 directions in section 7, so the form is expressed in JAL Core knob values;
   - a **first viewport** in one line (composition at 375 and 1280, where the primary action sits);
   - a **lawful expression**: accent hue and role, type voice, container grammar, media, icon style.
   Near-duplicates count once. The list spans **at least 3 material families**; if more than 3 candidates share one family, dig until it spans three. Every pair of candidates differs on at least 2 of the six axes (section 4).
4. **Law precheck** (no JEV): drop any candidate that needs a gradient, shadow, glow, neon, blur, dark default, overlap, purple family, emoji, eyebrow, invented claims, or assets that do not exist. Drop presets whose gate fails (section 7). Replace dropped candidates at the same rank before the screen.
5. **JEV screen** (`ui.direction_screen`): per candidate, `slop` (noul) and `fit` (score 0 to 3). Drop a candidate when `slop` is 0.5 or more or `fit` is under 1.5. Survivors keep their **original rank**; never re-sort by JEV score.
6. **Seeded draw** (section 3) over the survivors ranked 3 to 7. Ranks 1 and 2 are what every run would ship, so they are never drawn.
7. **Write the contract** (section 5) with the seed key before any code.

Rules around the draw:

- **Alternate card** (attended runs only): if a rank 1 or 2 survivor beats the drawn candidate's `fit` by 1.0 or more, show it once as a single alternate with an honest line naming its familiarity risk. It never leads and there is never a ranked lineup. Unattended runs build the drawn candidate.
- **Re-roll** only on named factual grounds (the drawn direction cannot carry the product's real task or truth, found during the build) or when Brian asks. Taste is never grounds. A re-roll increments the reroll counter and excludes every candidate already shown. After two consecutive re-rolls, ask Brian what quality is missing.
- **Standing exit**: the category standard played straight is always available when Brian asks for it; the agent never recommends it. If taken, ask for 2 or 3 products to match in craft level.
- **Refill**: if fewer than 4 candidates survive, or none survives at rank 3 or below, write replacements for the dropped slots at the same ranks and screen them once. If the rank 3 to 7 pool is still empty, build the best-ranked survivor and log `fallback: empty pool`.
- A **structure roll** (new surface in an established direction) uses the same steps with 5 to 7 **structures** derived from content, task, and behavior, the preset fixed, and `kind = structure`.

### Page shapes (From: hallmark, `hm.structure_vocab`)

Named whole-page shapes, used as inputs when writing structure candidates (and the layout-topology half of a direction candidate). A shape is a vocabulary word, never a pick: the candidates still pass the law precheck, the JEV screen, and the seeded draw. Name each candidate's shape out loud in its first-viewport line. When the brief is vague, never default to the first familiar shape; spread the candidates across categorically different shapes. hallmark's rotation log (avoid the last three shapes) is not adopted: the seeded draw and one direction per product do that job.

| Shape | What it is | JAL verdict |
|---|---|---|
| Bento Grid | a fully occupied grid of unequal tiles, each tile one real claim or view | lawful (Bento recipes in `jal-frontend-rules`; no void tiles) |
| Long Document | one reading column that argues from top to bottom | lawful |
| Conversational FAQ | the page is a sequence of real questions answered plainly | lawful |
| Photographic | real photography leads every region | lawful with real media only; captions below, never over |
| Quote-Led | one real, attributed quote opens and frames the page | lawful with a real testimonial only |
| Catalogue | the offer is a list of items with counts, dates, and prices | lawful |
| Letter | the page reads as a signed note from a person | lawful |
| Index-First | the page opens on its own index of work or entries | lawful |
| Split Studio | a statement column beside a work or proof column | lawful; replaces Stat-Led in the B2B trio |
| Feature Stack | one feature per pinned pane, walked through in order | lawful; sticky panes on desktop only, stacked below 960px |
| Portfolio Grid | a grid of projects, indexed by year or client | lawful |
| Ecosystem Index | several discovery surfaces (featured, latest, by category) on one page | lawful |
| Component Playground | live, editable examples are the page | lawful |
| Marquee Hero | one oversized display line owns the first viewport | ADAPT: fixed display steps (57, 69, 83) replace viewport-width type; the hero footprint rule applies |
| Workbench | the page opens on a real command, input, or tool in use | ADAPT: a numbered legend below replaces annotation arrows; no re-drawn window frames |
| Narrative Workflow | the page walks a real process stage by stage | ADAPT: a real process only, numbers inline, no thick numbered rules or connectors |
| Manifesto | a sequence of short declarations | ADAPT: sentence case, no tilt, tonal bands instead of bleed-color blocks, accent at 3% or less |
| Map / Diagram | a structural diagram of the system is the page's spine | ADAPT: the diagram is structural content with static edges, never decoration |
| Type Specimen | the page shows a typeface as the product | ADAPT: needs a display face, and Brian approves the dependency |
| Stat-Led | giant numbers carry the page | DROP (big-number hero, `craft.md` section 3) |
| Specimen | numbered specimen plates with margin labels | DROP (numbered section labels) |

Every shape states what it becomes below 960px and below 640px (`hm.mobile_collapse`); below 640px the app-shell always ships.

### Three shapes per domain (From: hallmark, `hm.domain_trio`)

Seeds for the 5 to 7 structure candidates. The trio for the brief's domain enters the candidate list (ranked by resonance like any candidate); the rest of the list comes from content, task, and behavior. The seeded draw still picks.

| Domain | Three shapes to seed |
|---|---|
| Audio and podcasts | Photographic, Quote-Led, Letter |
| Commerce | Catalogue, Photographic, Bento Grid |
| Docs and CLI | Workbench, Long Document, Component Playground |
| B2B platform | Bento Grid, Workbench, Split Studio (in place of Stat-Led) |
| Agency and studio | Portfolio Grid, Split Studio, Index-First |
| Personal site | Long Document, Letter, Index-First |
| Food | Photographic, Long Document, Catalogue |
| Fashion | Photographic, Catalogue, Marquee Hero |
| Fintech | Workbench, Long Document, Split Studio |
| Cause and nonprofit | Manifesto, Quote-Led, Long Document |
| Event | Marquee Hero, Manifesto, Photographic |

A domain that splits on intent (docs or marketing) gets the one `hm.context_gate` question before its trio is chosen.

### Chrome archetypes (From: hallmark, `hm.nav_fingerprint`, `hm.footer_fingerprint`)

Nav and footer are part of a Persuade or Experience page's fingerprint. The contract names one of each; defaulting to the AI nav or AI footer (`craft.md` section 3) is a finding. Operate and Read surfaces use the JAL app-shell and need no pick.

| Nav | Verdict |
|---|---|
| Wordmark plus two links | keep when there are only two destinations |
| Floating chip | keep, opaque |
| Side rail | adapt: no dot indicators, no rotated tracked caps |
| Command-K only | adapt: an accelerator; the app-shell still ships |
| Floating pill | adapt: opaque `surface` plus a full hairline, no blur, no shadow |
| Masthead | adapt: one hairline, not a double rule |
| Slab | adapt: a 1px `border-strong`, not 2px |
| Terminal | keep for devtool brands; the caret only inside a typed command |
| Edge-aligned minimal | keep |
| Scroll morph | adapt: the `jal-motion` floating-nav recipe, 640px and up only |

| Footer | Verdict |
|---|---|
| Mast-headed | keep |
| Inline line | keep, no dash separators |
| Index columns | keep for hubs and docs only |
| Dense colophon | adapt: sans, not mono as costume |
| Statement | keep at a heading step |
| Letter close | keep |
| Newsletter-first | keep only if the page asked for the subscription earlier |
| Marquee | adapt: the pausable marquee recipe, sentence case |

## 3. The seed (deterministic, stable on rerun)

- `key` = the first 8 hex characters of `SHA-256(lower(trim(product)) + "|" + lower(trim(screen)))`. `product` is the product name as written in the brief; `screen` is the surface name or route (`landing`, `/pricing`, `dashboard home`). Record both strings verbatim in the contract, so any rerun of the same product and screen reproduces the same draw.
- `pool` = the survivors whose original rank is 3 or more, in original rank order (length `n`, at most 5).
- `u` = the first 4 bytes, big-endian, of `SHA-256(kind + ":index:" + key)` (plus `":reroll-" + r` when `r` is above 0), divided by 2^32. `kind` is `direction` or `structure`.
- `pick` = `pool[floor(u * n)]`.

Bun one-liner (prints the key and the 0-based index into the pool):

```bash
bun -e 'const [p,s,n,r="0",k="direction"]=process.argv.slice(1);const h=x=>new Bun.CryptoHasher("sha256").update(x).digest();const key=h(p.trim().toLowerCase()+"|"+s.trim().toLowerCase()).toString("hex").slice(0,8);const u=h(k+":index:"+key+(r==="0"?"":":reroll-"+r)).readUInt32BE(0)/2**32;console.log(JSON.stringify({key,kind:k,pool:+n,reroll:+r,pick:Math.floor(u*+n)}))' "<product>" "<screen>" <pool size> [reroll] [kind]
```

Example: `"Warung Kas" "landing" 4` gives key `7d4b6a5e`, pick 3 (the fourth pool entry). Log the command line and its output in the build report.

## 4. The six variation axes

Candidates, structures, and any "give me options" variants each commit to a different primary axis:

1. **Hierarchy**: what commands the eye first.
2. **Layout topology**: stacked, side by side, grid, asymmetric spans, full-bleed media band (never overlap).
3. **Type system**: which steps of the one scale carry the page, weight contrast, the display role, tracking within the knob range, mono for data or none.
4. **Color role**: which single role the accent plays (none, filled primary, signal only, text and icon) and the canvas temperature.
5. **Density**: minimal, comfortable, dense (desktop rows through `ui.density`; section rhythm everywhere).
6. **Structural decomposition**: merge, split, progressive disclosure, rows versus bento versus divided sections.

- **Identity lock first** for variants inside an existing direction: one factual sentence of what is on screen (canvas and accent values, loaded faces, layout topology, voice). Every variant reads as the same product side by side.
- **Family pass**: label each option with its family; two options sharing a label means rework. **Sentence pass**: two one-line descriptions that rhyme means rework. Three variants that differ only in density is a failure.
- When unsure whether a request wants variants inside the identity or a departure from it, stay inside: three similar on-brand options are recoverable, three off-brand ones are not.
- **Knob delta** (From: hallmark, optional): when two surfaces of one product use the same page shape, the second changes at least one knob inside that shape (tile count, spans, border mode, media side) and the build report states the knob values of both, as one line.

## 5. The direction contract (`docs/design/direction.md` in the target repo)

Written before any code, kept in the repo, never shipped to the browser. If a block reads like a mood, the direction is not decided. The finish reviewer audits the build against it promise by promise.

```markdown
# <Product> direction: <screen>

Seed: product "<verbatim>", screen "<verbatim>", key <8 hex>, kind direction, pool <n>, pick <i>, reroll <r>
Decided: <date>. Mode: <persuade | operate | read | experience>. JEV: ui.direction_screen <confidence summary>

## Brief
Audience: <who, where, how often, in what light>
Job: <what the visitor must understand or do after this surface>
Mechanism: <the product's one unique mechanism, one sentence>
Rut: <the page this category always ships, and its predictable opposite>

## Direction
Form: <the drawn candidate: artifact from the audience's world, its original rank, one-line reason>
Preset: <direction id> (JAL Core knob set, not a design system)
Thesis: <the one idea this surface owns, and the category default it refuses>
Own world: <what stays recognizable with all content removed: accent role, type voice, container grammar, media, icon style>
Story: <what the visitor understands, then believes, then does>
First viewport: <exact composition at 375 and at 1280; where the primary action sits>
Signature moment: <the one authored motion or interaction moment, or none>
Page shape: <shape from the section 2 table, and what it becomes below 960 and 640> (optional, From: hallmark)
Nav / Footer archetype: <from the chrome tables> (optional, From: hallmark)
Headline chars: <rendered count and its hm.headline_buckets bucket> (optional, From: hallmark)
Media role evidence: <hm.image_need result; does the hero pass hm.survives_deletion> (optional, From: hallmark)

## Knobs (the only values this file may set)
| Knob | Value | Token or mechanism | Reason |
|---|---|---|---|
| Type personality | <system sans / approved sans + mono / display face pending Brian> | --font-* | |
| Accent | <none, or hex + HSL hue> | --color-accent, --color-accent-contrast | |
| Accent role | <none / filled_primary / signal_only / text_and_icon> | role rule, audited | |
| Primary fill | <ink / accent> | --color-primary (+ hover, active re-derived) | |
| Canvas | <neutral / white / cool / warm> | --color-page | |
| Tracking | display <em>, heading <em> | --tracking-display, --tracking-heading | |
| Display ceiling | <--text-6 / --text-display-1..3> | hero only, one per page | |
| Radius tier | cards <4/12/16/28>, controls <4/8/pill> | existing --radius-* by tier | |
| Hairline | <border / border-strong for structure> | --color-border, --color-border-strong | |
| Density | <ui.density result> | data-density | |
| Motion intensity | <motion.intensity result> | jal-motion | |
| Media role | <none / supporting / leading> + real assets on hand | | |

## Law (fixed, restated, not editable here)
JAL Core tokens and components. White-first page; dark only as an explicit dark mode. No gradients,
no blurred shadows, no glow or neon, no side stripes or accent bars, no emoji, no em-dash, no
eyebrow labels, no purple/violet/indigo, no overlap, 44px controls, mobile app-shell below 640px.

## Candidates (as screened)
| Rank | Form | Preset | slop | fit | Result (dropped / pool / drawn / alternate) |

## Reference lock (only when the brief or Brian supplied references)
Primary: <reference, date seen> (structure only, never a brand to copy)
Structure taken: <3 to 5 traits, as JAL knob values or layout moves>
Borrowed details: <1 or 2, each with its bounded job>
Stripped by law: <what the law filter removed>
Rejected: <averaging traps and clone-risk items for this product>

## Decision ledger
| Decision | Source (brief / craft rule / JEV id / reference) | Why |

## Open decisions
<what the direction cannot answer yet: states, copy, data density, responsive edge cases>

## Finish
Verdict: <ship / fix / rebuild / recapture>, round <1 or 2>, reviewer keep line: <...>
```

**Where knob values land.** A product sets knobs in one override block at the end of its own `packages/ui/src/tokens.css`, and only these names may appear there: `--color-accent`, `--color-accent-contrast`, `--color-primary`, `--color-primary-contrast`, `--color-primary-hover`, `--color-primary-active`, `--color-focus`, `--color-page`, `--tracking-display`, `--tracking-heading`. Every line carries a comment pointing to the contract. Radius tier, hairline, and display ceiling are applied by which existing token each component uses, never by a new value.

```css
/* direction: single_signal_ledger, see docs/design/direction.md */
:root {
  --color-accent: #1d5fa8;                    /* HSL 212, 6.45:1 on surface */
  --color-accent-contrast: var(--color-surface);
  --color-primary: var(--color-accent);       /* role: filled_primary */
  --color-primary-hover: color-mix(in oklab, white 8%, var(--color-accent) 92%);
  --color-primary-active: color-mix(in oklab, white 12%, var(--color-accent) 88%);
}
```

## 6. The knobs and their lawful ranges

| Knob | Default | Lawful range |
|---|---|---|
| Accent hue | none (ink) | one hue, HSL outside 235 to 330 (250 to 320 fails `ui_audit`; 225 to 235 cobalt needs a written reason), 4.5:1 on surface for any text use, never within about 30 degrees of a status hue in a status context |
| Accent role | none | exactly one of `none`, `filled_primary`, `signal_only`, `text_and_icon`; about 3% of any viewport at most |
| Primary fill | ink | ink, or the accent when the role is `filled_primary` |
| Canvas | neutral `#fafaf9` | white `#ffffff`; cool (for example `#f7f8f8`); warm (for example `#faf8f5`); light beige (for example `#f8f5f0`). Only `--color-page` moves. It must keep `--color-border-control` at 3:1 on it (relative luminance about 0.91 or more, OKLCH chroma 0.008 or less). A deeper beige needs a recomputed control border, a generator change for Brian. |
| Tracking | display -0.03em, heading -0.02em | display -0.01 to -0.04em; heading 0 to -0.02em; title and body fixed |
| Display ceiling | `--text-6` (48) | `--text-display-1`, `-2`, or `-3` (57, 69, 83) on Persuade or Experience heroes only, one per page, `--text-display-1` at most below 640px |
| Display weight | 500 | 500 or 600 (weights are 400, 500, 600 only) |
| Radius tier | cards 12, controls 8 | cards 4, 12, 16, or 28; controls 4, 8, or pill; media matches cards; nested radius smaller than its parent; one choice product-wide per tier |
| Hairline | `--color-border` | `--color-border`, or `--color-border-strong` for structure-heavy directions; structural only, never decoration |
| Type personality | JAL system stack | one approved sans; mono only for code, data, measurement; a display face only with a written reason and Brian's yes |
| Density | `ui.density` | compact, default, comfortable (desktop rows only) |
| Motion intensity | `motion.intensity` | per `jal-motion` |
| Media role | none | supporting or leading, only with real assets or honest fixed-ratio placeholders |

Fixed for every direction: the 1.2 scale from 16 (no other ratio, no other base), 4px spacing, 44px controls, 1px hairlines, the tonal depth ramp, the state-layer formula, one easing.

## 7. The 13 visual directions

Each gives the direction in plain words, the knob set, the law filter (what JAL strips from the pattern as it exists in the wild), and its gate.

### D1 `research_notebook` (the JAL Core default)
Quiet and type-led. Ink on white does the work; one ink-filled action per view; everything else ghost, outline, or text. Sections separate by whitespace, not rules.
- Knobs: accent none (at most `text_and_icon` for links); primary ink; canvas neutral or white; display `--text-6` app, up to `--text-display-2` marketing; tracking display -0.03 to -0.04; radius cards 12, controls 8 or pill; hairline border; density any.
- Law filter: spectrum or decorative gradients; weight 700 becomes 600.
- Gate: none. The fallback when nothing else survives.

### D2 `single_signal_ledger` (trustworthy money and precision)
Near-monochrome and exact. One vivid hue means money or action and nothing else. Trust comes from exact numbers and restraint.
- Knobs: accent one saturated hue (green, teal, blue at HSL 225 or lower, orange); role `filled_primary` or `signal_only`, never both; canvas neutral, cool, or warm; display `--text-display-1` to `-2`, tracking -0.02 to -0.03; tabular numerals wherever money appears; radius cards 12, controls 8 (rectangular reads more serious than pill); density default or compact.
- Law filter: navy-indigo brand fills, multi-layer shadows. A chartreuse accent fails 4.5:1 as text, so it is a fill with ink as `--color-accent-contrast`, never text.
- Gate: none.

### D3 `blueprint_hairline` (engineering precision)
A clinical light field where visible structure (tables, spec rows, code, grids of records) is the ornament. Everything aligns; labels are small and exact.
- Knobs: accent none or one functional hue (teal) as `signal_only`; alerts use the danger status, not the accent; canvas neutral with white surfaces; hairline border-strong; sans plus mono for data and code; display up to `--text-display-1`, tracking -0.04; radius cards 16, nested 8, controls 8; density compact.
- Law filter: decorative blueprint grids, crosshair ornaments, connector lines (lines must be structural: table rules, record dividers, cell borders); positive-tracked caps labels become sentence-case labels at 0 tracking; teal-to-white gradient fills.
- Gate: none.

### D4 `bone_white_gallery` (image-led)
The interface steps back and the media carries the page. Chrome is minimal, type compact, one small mark carries the brand.
- Knobs: accent one warm hue as `text_and_icon` only (save, favorite, brand mark); primary ink; canvas white or neutral; display modest (`--text-4` to `--text-6`), the images are the display; tracking heading -0.02; radius media and cards 16, controls pill; density comfortable.
- Law filter: image hover transforms (the container gets the feedback); CSS-faked imagery; indigo CTAs.
- Gate: real media exists or is budgeted, or honest fixed-ratio placeholders with art direction.

### D5 `calm_productivity` (daily-use tools)
Quiet, near-white, ready for daily use. Ink text, soft geometry, one small punctuation color.
- Knobs: accent one hue (red-orange, coral, or blue at HSL 225 or lower) as `text_and_icon` or `signal_only`, never a large fill; canvas warm or cool; display `--text-5` to `--text-display-1`, tracking -0.01; radius cards 12, controls 8; hairline border; density default.
- Law filter: hover elevations become state layers.
- Gate: none.

### D6 `clean_docs` (developer documentation)
A white reading surface built for scanning: sidebar, tight heading ladder, code blocks as the richest object, one hue for links.
- Knobs: accent one hue (green or teal) as `text_and_icon` for links; active nav stays tonal `layer-2` plus ink plus 600 (law); canvas white; sans plus mono; display `--text-6` at most (Read mode), tracking heading -0.02; measure 65 to 75ch; radius controls 4 or 8, cards 16, large containers 28; density default.
- Law filter: illustrated sky art (media only), warm beige surfaces neutralized to white.
- Gate: Read-mode surfaces.

### D7 `warm_paper_editorial` (content-led products only)
A literary, warm-neutral reading page with an optional serif display. The newest AI autopilot, so it is gated hard.
- Knobs: canvas warm (inside the canvas floor); serif display only with a written reason and Brian's yes on the font; display `--text-display-1` to `-2`, tracking -0.01 to -0.02; body sans; accent none or one muted warm hue as `signal_only`; radius cards 16, controls pill.
- Law filter: cream grounds below the canvas floor; a one-word italic or serif swap inside a sans headline; the beige plus italic serif plus terracotta trio (`craft.md` section 14); multi-color illustration palettes.
- Gate: the product publishes content (journal, research, culture) and the brief says so. Never picked for a bookish mood alone.
- Note (From: hallmark): hallmark's editorial genre default (warm paper, italic serif display, hairlines, mono labels) is exactly the reflex look in `craft.md` section 14, so it never lowers this gate.

### D8 `quiet_care` (health, wellness, nonprofit)
Soft and humane, generous air, one gentle color, calm without the editorial-serif autopilot.
- Knobs: accent one low-chroma hue (slate blue at HSL 225 or lower, sage, or a warm orange mark) as `signal_only` or `text_and_icon`; canvas warm or white; display `--text-display-1` to `-2`, tracking 0 to -0.02; radius commit to one register (cards 16 with pill controls, or 4 everywhere); density comfortable.
- Law filter: weight 300 becomes 400; violet and indigo illustration palettes.
- Gate: none.

### D9 `cinematic_hardware` (physical product showcase)
One precisely lit product per section, framed like a plinth. Large display type and big rounded media tiles, separated by shape alone.
- Knobs: display `--text-display-3` on the marketing hero only, weight 600, tracking -0.02; radius media and cards 28, controls pill; accent one blue at HSL 225 or lower as `filled_primary` (buy); canvas white or neutral; density comfortable.
- Law filter: charcoal gradient bands, shadows under products. The dark plinth version exists only as an explicit dark mode.
- Gate: real product photography or renders; placeholders keep the exact aspect ratio.

### D10 `industrial_catalogue` (hard-edged catalogue)
A Swiss-catalogue register: straight cuts, ink on a faint mist canvas, the product as the only rich object.
- Knobs: radius 4 on cards, controls, and media (the sharpest lawful tier; true zero needs Brian); canvas cool or white; display weight 500, tracking -0.01; lead copy at `--text-1` or `--text-2` in place of the large body base the pattern uses; accent none; hairline border plus border-strong for secondary rules; density default.
- Law filter: weights 100 to 300 become 400; a 20 to 24px body base (JAL body is 16); zero radius.
- Gate: none.

### D11 `oversized_masthead` (bold studio or brand marketing)
One huge letterform or wordmark becomes the layout, against a white wall. Everything else is small and quiet. Fully achromatic.
- Knobs: the masthead is an authored SVG wordmark sized to its region (`width: 100%`, accessible name), not a text size; live text never exceeds `--text-display-3`; supporting text `--text-0` and `--text-n1`; accent none; radius media 4 or 12, controls pill.
- Law filter: stacked letterforms at sub-1 line height that overlap other boxes; iridescent overlays; any chromatic effect that is not real media.
- Gate: Persuade or Experience only, and a real wordmark asset exists.

### D12 `friendly_consumer` (broad-audience consumer apps)
Bold, rounded, cheerful but disciplined: one saturated hue owns headlines or icons, body stays ink-muted, big radii soften everything.
- Knobs: accent one saturated hue (green, coral, orange) as `text_and_icon`, allowed on one display headline, counted inside the 3%; never body text; canvas white or a tinted near-white inside the canvas floor; display `--text-display-1` to `-2`, weight 600, tracking -0.02 to -0.04; radius containers 28, controls pill; density comfortable.
- Law filter: weight 700 becomes 600; violet "night ink" text accents; multi-hue surfaces.
- Gate: none.

### D13 `precision_dark` (explicit dark mode only)
A near-black instrument panel with stepped surfaces, thin light hairlines, weights capped at 600, one functional accent.
- Knobs: page the JAL warm near-black (about `#171412`, never `#000`, never cold blue-black); surfaces step lighter by about 3 to 6% each; hairlines as solid colors equal to white at 10 to 12%; text near-white, never `#fff`; primary a light neutral fill; accent one hue used flat (chartreuse or green) as `signal_only`; elevation by surface step only; density compact.
- Law filter: every shadow stack, glow, neon edges, violet and indigo tag fills, cobalt brand fills.
- Gate: the brief explicitly asks for dark or the product ships a dark theme. Never OS-triggered, never the light default.
- Note (From: hallmark): hallmark's atmospheric genre (dark canvas, warm blooms, glow) is a rejected direction, not a form of D13. The accent follows `hm.dark_hue_lock` (`craft.md` section 6).

### Rejected directions (never candidates)
The law filter would strip their carrier:
- **Neon command center**: glow, dark by default.
- **Violet neon or velvet**: purple family plus glow.
- **Frosted glass**: blur and translucency.
- **Prismatic or iridescent obsidian**: gradients, dark.
- **Candy pastel studio**: multi-hue surfaces.
- **Cosmic void or aurora**: dark, gradients, glow.
- **The reflex looks** in `craft.md` section 14 (cream plus italic serif plus terracotta; broadsheet hairlines plus italic serif plus tracked mono labels), when chosen by habit.

A noyzzi piece may carry dark, neon, or glow inside its own exempt section; that is a `jal-immersive` per-section recipe call (`imm.recipe`), never a page direction.

## 8. References: take the structure, never the surface or the brand

- **Sources.** A reference comes from the brief, from Brian, or from the agent's own knowledge described in its own words. JAL agents do not fetch Refero pages or scrape any style library. designmd kits pass `ui.designmd_screen` first.
- **Law filter first.** Strip gradients, shadows, glow, neon, the purple family, dark default, emoji, em-dash, eyebrows, side stripes, and sub-44 controls, and record what was stripped. If the filter strips the reference's carrier (its mood depends on glow, glass, iridescence, or neon), discard it.
- **Skeleton, not clothes.** Take reading order, grouping, section rhythm, density, the component grammar, and the media role. Leave the palette, the typeface, the signature layout move, logos, wordmarks, mascots, and photography style. A new skin over a standard marketing grid is the failure this rule exists for.
- **Clone risk.** Never take a brand's signature color, type, and layout signature together; that reproduces an identity, not craft. If the borrow list does, cut the item with the most identity weight.
- **One primary reference** owns mood, density, and structure. Secondaries get one bounded job each ("owns the code-block treatment") and contribute one or two details.
- **Never average.** Blending references yields the safe middle every model converges on. Keep the primary's sharp traits whole, or drop them whole.
- **A token's role is part of the token.** A CTA-only color stays CTA-only; syntax colors stay in code; decorative color never becomes UI surface.
- **Keep the media role.** If a reference is carried by photography, keep real media or an honest fixed-ratio placeholder; never fake imagery with CSS shapes or collapse to text only.
- Record the result in the contract's reference lock and decision ledger.
- **How to study one** (From: hallmark): diagnose a supplied reference with the ordered protocol in `craft.md` section 11 (`hm.reference_study`: surface, type roles, structure, motion, rhythm; roles only from a screenshot; rhythm cannot be read from markup; one source per diagnosis; no code in the diagnosis turn), and check any URL against `hm.reference_url_safety` before fetching it.
- **OriginKit** is an approved, paid, closed component library, not a reference to study. Its components enter a client build only when JEV `ui.component_recipe` picks one and JAL law holds; the source comes from Brian's account (pasted by him, or through OriginKit's MCP connected with his key), since agents never sign in. Never crawl its catalog. The JAL template holds only the clean-room `ok.*` recipes (`jal-motion` `references/components.md`).

## 9. Calibration statistics (hand-scale sample, n = 29)

Indicative only; the ranges matter more than exact shares. They confirm the JAL Core default sits at the center of well-made product sites.

| Measure | Sample | JAL Core |
|---|---|---|
| Theme | light 79%, dark 17% | light by law |
| Scale ratio | 1.2 in 62%, 1.125 in 31% | 1.2 fixed |
| Body row | 16 / 1.5 / tracking about 0 is most common | 16 / 24 / 0 |
| Display size | median 64, middle half 55 to 72 | 48 app; 57, 69, 83 heroes |
| Display leading | median 1.1 | about 1.1 |
| Display tracking | median -0.012em, middle half -0.025 to 0; tightest about -0.05 | -0.03 default, -0.04 floor |
| Spacing base | 4px in most | 4px |
| Max width | 1200 in 69% | 1280 cap |
| Card radius | 12 or 16 in most | 12 default, 16 allowed |
| Button radius | pill 38%, 6 to 8 in about a third | 8 default, pill allowed |
| Hairline | about 8 to 12% ink on white | `#e5e5e3`, about 10% |
| Shadows | none or at most 2 recipes in most | none |
| Gradients | 17%, almost all decorative or media | none |
| Accent | zero or one hue family in 69% | one at most |
| Families | one family in about half; serif only as display or long-form body | one family default |
