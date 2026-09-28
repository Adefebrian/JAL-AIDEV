# JAL Core craft floor and critique

The quality floor every JAL surface clears, the anti-pattern ban list, the per-discipline craft rules (type, color, layout, motion, states, copy), and the critique and finish-review system. Applies to `/jal-ui` and `/jal-ui (immersive mode)`.

**Provenance.** The doctrine, thresholds, and workflows here are derived from pbakaus/impeccable (Apache-2.0, commit `114ea1d`), restated in JAL's own words and filtered through JAL law. No impeccable file, code, or tooling is copied, installed, or run. The tracking curve and a few statistics also draw on referodesign/refero_skill (MIT). Both are recorded in `THIRD_PARTY_NOTICES.md` and `sources.md`.

**Order of authority.** JAL law (`jal-standards`, `jal-ui-taste` Hard law), then the brief, then this file. Where impeccable says "the brief wins", in JAL the brief wins only inside the law.

## 1. Visitor mode (per surface, never per product)

Decide the mode from the requested surface before anything else. Many rules below switch on it. Law is identical in every mode.

| Mode | Visitor succeeds when | Surfaces | Switches |
|---|---|---|---|
| Persuade | they understand the offer and act within seconds | landing, pricing, campaign, signup | display set allowed, one authored motion moment, h7 and h10 may be n/a |
| Operate | they finish a task fast and trust the controls | app screens, dashboards, admin, settings, editors | top at `--text-6`, motion 150 to 250ms, no page-load choreography, one family |
| Read | they understand and find their way | docs, guides, articles, changelog | measure first, one family, fixed scale |
| Experience | they are inside the work from the first viewport | portfolio, showcase, immersive site | display set allowed, UI recedes, h7 and h10 may be n/a |

A product's landing page is Persuade even when the product is a tool. When unsure, Operate.

## 2. Minimum-quality checklist (verify on the render, in one batched pass)

Check the built result at 375 and 1280 together, read computed values, fix everything in one batch.

| Area | Floor (numbers) |
|---|---|
| Measure | Body prose 65 to 75ch (JAL prose cap about 68ch). Lines over 80ch fail. Tables may run wider. |
| Leading | Body 1.5 (the `--line-*` tokens). Nothing that wraps under 1.3. Display about 1.1 (`--line-display-*`). |
| Tracking | Display `--tracking-display` (-0.03em), headings `--tracking-heading` (-0.02em), titles `--tracking-title` (-0.01em), body and all text under 19px `--tracking-body` (0). Floor -0.04em. Body never above +0.05em. No caps tracking (no caps role exists). |
| Display | App and product screens top at `--text-6` (48). Marketing and immersive heroes may use `--text-display-1..3` (57, 69, 83), one per page. Below 640px, `--text-display-1` at most. Display text is at most about 8 words; a longer headline steps down to `--text-6` or `--text-5`. |
| Heading rhythm | Space above a heading is always greater than the space below it; target 2x or more (section heading: 48 or 64 above, 16 or 24 below; subheading: 32 above, 8 or 12 below). |
| Hierarchy | The heading that leads a region is at least 2 steps above body (`--text-2` over `--text-0`, ratio 1.44), or it differs in both weight and ink. Adjacent roles closer than 1.25x in size must differ in weight. |
| Wrapping | `text-wrap: balance` on headings, `text-wrap: pretty` on short prose only, `overflow-wrap: anywhere` on headings so long words wrap, `min-width: 0` on every flex or grid child that holds text. |
| Text sizes | Body 16. Functional UI text (links, buttons, nav, labels, table cells, meta) never under 11. Inputs never under 16. |
| Edges | Text never flush to the viewport: at least 16px side gutter at 320 to 414. Text never cramped against its own container edge: at least `--space-12px` inside any bordered box. |
| Contrast | Body and placeholder 4.5:1, large text 3:1, control boundaries, icons, and focus 3:1. On a tinted surface, secondary text is derived from that surface or ink, never a neutral gray that drops contrast. |
| Numerals | `font-variant-numeric: tabular-nums` on every table cell, price, timer, counter, and KPI value, not only live numbers. |
| Typographic polish | Real ellipsis character, curly quotes and apostrophes, a non-breaking space between a number and its unit. |
| Browser surfaces | Theme the parts nobody draws (recipe below). This is the cheapest proof a page was built, not assembled, and the one agents skip most. |
| Motion | One authored moment per page at most, from a default state that is already visible. Never the same entrance on every section. |
| States | Every control has all eight states; every view has empty, loading (skeleton), and error designed; keyboard focus works end to end. |
| Copy | The product's own words; controls name their action; errors name the problem and the recovery. |
| Coverage | Every requirement in the brief is present and findable within a few seconds. |

Browser-surface recipe (tokens only; with the default neutral accent these resolve to ink and grays):

```css
::selection { background: color-mix(in oklab, var(--color-accent) 16%, var(--color-surface)); color: var(--color-ink); }
:root { caret-color: var(--color-accent); accent-color: var(--color-accent); scrollbar-color: var(--color-border-strong) transparent; }
.scroll-region { scrollbar-gutter: stable; }            /* no layout shift when a scrollbar appears */
a { text-decoration-thickness: 1px; text-underline-offset: var(--space-4px); }
button:not(:disabled), [role="button"]:not([aria-disabled="true"]), a[href], .row-clickable { cursor: pointer; }
:disabled, [aria-disabled="true"] { cursor: default; }
```

- Never replace native scroll behavior; only its color. Never `cursor: none` in product UI. A custom cursor exists only on an Experience surface through `jal-immersive` or `jal-motion`, only under `(hover: hover) and (pointer: fine)`, never over form fields, and falls back to the system cursor under reduced motion.

## 3. Anti-pattern ban list (refuse on sight)

Each item is refused as a category default. JAL treats all of them as bans; the "earned by" column is the only way back in, and it must be written in the direction contract.

| Ban | Why | Earned by |
|---|---|---|
| Icon tile above a heading (small rounded square holding an icon, stacked over a title) | the most common AI feature-block tell | never |
| Big-number hero (huge number, small label, supporting stats, accent) | template standing in for proof | never; a metric is ink at a normal step with an ink-muted label |
| Identical feature-card grid (same-size cards of icon, heading, text as page structure) | interchangeable, says nothing | content that is truly equivalent and compared side by side, built as rows or a real comparison |
| Numbered section labels (01 / 02 / 03 beside headings) | fake sequence | a real ordered process the user follows |
| Eyebrow, kicker, or pill badge above a headline | JAL law | never |
| Nested cards | JAL law | never |
| Full-sentence headline at display size eating the first viewport | shouting instead of composing | never |
| Gradient text, glass, blur, glow, halo, spotlight | JAL law | never |
| Side stripe or top or bottom accent bar on any box | JAL law (stricter than impeccable, which allows 1px) | never |
| Hard offset zero-blur block shadow | decoration posing as depth; JAL has no shadows | never |
| Modal as the first idea for a task that needs neither interruption nor protected focus | breaks flow | a destructive confirm or a truly blocking step |
| Sparklines, progress rings, soft rounded rectangles standing in for content | chrome filling a gap | real data behind them |
| Monospace as a "technical" costume | costume | code, data, measurements only |
| A platform system face (Arial Black, Impact, the OS sans) as the display voice of a Persuade or Experience page | no point of view | never on those modes; fine for Operate and Read |
| Unicode glyphs or emoji as icons (typed arrows, stars, checkmarks) | JAL law | never; koboyo, then reicon.dev |
| Geometric masks faking an organic photo contour; organic clip-path blobs; shape-assembled SVG clip art | fake illustration | never; real illustration or none |
| Decorative grid, stripe, blueprint, or grain backgrounds | ornament | a subject that is a canvas, map, blueprint, or measuring tool, and then structural |
| Auto-scrolling marquee as filler | motion with no job | real content, pausable, static under reduced motion (spec in `jal-motion`) |
| Pulsing status dot, blinking cursor as decoration | JAL bans marker dots; loops with no job | a real live state, with text |
| Animating an image on hover | the image is content, not a control | Off by default; the container gets the feedback. Allowed only when JEV `ui.component_recipe` (or `imm.recipe`) picks an image-hover recipe for a marketing or immersive gallery where the image is the subject: noyzzi effects, a scale of 1.04 or less (`an.R27`), or `three.img_hover`. Never in product UI. |
| Justified text, all-caps body text | readability | never |
| Light or dark picked by category habit | JAL law: light by default | an explicit dark-mode brief |
| Borrowing a reference's skin over a standard marketing grid | new clothes on the old layout | never; borrow structure, see `directions.md` |

**Calibration check.** If someone could guess this page's look from its category alone, or from its category plus this ban list, rework it. **Memory test.** If a visitor left after one viewport, what would they describe an hour later? If the honest answer is a mood, the direction is not committed. **Skeleton test.** Strip the copy from a section; its bare structure should still say what it is.

## 4. Detector thresholds ported (JAL-fit)

Mechanical ones are candidates for `ui_audit` (owner: lead); the rest are review checks.

| Rule | Threshold | JAL status |
|---|---|---|
| side stripe | any side border wider than 1px or colored unlike the other sides | law, in `ui_audit` (stricter than impeccable's 2px) |
| em-dash | any em-dash | law, in `ui_audit` (impeccable only flags 8 or more) |
| line length | rendered lines over about 80 characters | audit candidate |
| tight leading | line height under 1.3x on wrapping text | audit candidate |
| tiny text | body under 12px; functional UI text under 11px | audit candidate |
| wide tracking | body letter-spacing above 0.05em | audit candidate |
| extreme negative tracking | below -0.04em | audit candidate |
| heading rhythm | rendered space above a heading not greater than space below | audit candidate |
| body at viewport edge | paragraph with under 16px side padding | audit candidate |
| cramped padding | text closer than 12px to its bordered container edge | audit candidate |
| content hidden at rest | a large share of text still at opacity 0 after reveal handlers ran (a failed reveal) | audit candidate, pairs with `reduced-motion` |
| first-viewport column overflow | one opening column runs far past the fold while its sibling fits | audit candidate |
| edge-flush cards | cards in a horizontal scroller flush on one side, gutter on the other | audit candidate |
| repeated container text | same literal text 3 or more times in one card in different structural spots | audit candidate |
| icon tile stack | small rounded-square icon container directly above a heading | audit candidate |
| eyebrow chip | tiny tracked uppercase or small-caps text, or a pill, as its own block above a heading | law, in `ui_audit` (extend to pills) |
| numbered section labels | small numeric index beside repeated section headings | audit candidate |
| flat type hierarchy | dominant heading and body closer than 1.25x at every step | audit candidate |
| justified text, all-caps body | any | audit candidate |
| overused fonts | Inter, Roboto, Open Sans, Lato, Montserrat, Arial, Helvetica, Fraunces, Instrument Sans and Serif, Geist family, Mona Sans, Plus Jakarta Sans, Space Grotesk, Recoleta as a Persuade or Experience display face | review only (fine for Operate and Read body) |
| copy slop | buzzword list in section 10; 3 or more sections ending "X. No Y." or "Not X. Y."; dismissing something as "theater" | review, cheap to regex |
| cream palette | not ported as a ban: beige is lawful in JAL | contract check only (section 13, row 2) |

## 5. Typography

- Decide roles before sizes: the fewest roles and families that make hierarchy obvious. Size, weight, space, and ink carry hierarchy together; never size alone.
- Operate and Read: one well-tuned sans (the JAL system stack is right), the fixed JAL scale. Persuade and Experience: a display face may carry the voice, but only with a written reason in the direction contract, and adding a webfont is a dependency decision that goes to Brian.
- Pick a face like an object from the subject's world. A subject association ("books want serif", "tech wants mono") is never the reason. The overused list above signals you stopped looking.
- Paragraph rhythm: paragraph spacing or first-line indent, never both.
- Light text on a dark theme (explicit dark mode only): add a little leading, `--tracking-title` on body-size text if it looks crowded, and one weight step up where the face needs it.
- Delivery: only the weights used (400, 500, 600), `font-display: swap`, metric-compatible fallback, no invisible text.
- Stress test every screen: the longest real heading, German-length copy (about 30% longer), 200% zoom, 320px width, a missing weight.

## 6. Color strategy within JAL

- **Restrained is the only lawful strategy**: neutrals plus at most one accent at about 3% of the surface. impeccable's Committed, Full palette, and Drenched strategies are out. Variety comes from which hue, which single role it plays, and the neutral temperature, never from area.
- **The default accent is no accent.** `--color-accent` equals ink until a product's direction contract sets a hue. When one is set, pick it from product meaning, HSL hue outside 235 to 330 (`ui_audit` fails 250 to 320; a 225 to 235 cobalt needs a written reason), with 4.5:1 on surface for text use.
- **One role, exclusive** (recorded in the contract): `none`, `filled_primary` (fills the one primary action per view), `signal_only` (marks one key figure, live status, or selection; never a fill or surface), or `text_and_icon` (links, icons, brand mark only). The accent appears nowhere else.
- Hover and pressed on an accent fill are the JAL state-layer formula, never a new hue. Semantic colors are never the accent. An accent within about 30 degrees of a status hue never appears in a status context.
- Build roles, not swatches: page, surface, layers, ink, ink-muted, border, border-control, accent, status. Generate any new hue in OKLCH (lower chroma near white and black), store it as hex.
- Prefer explicit colors over stacked translucent overlays; alpha makes contrast depend on the backdrop.
- Never color as the only code: data uses lightness, shape, label, or pattern too.
- Dark mode, when explicitly asked, is composed on its own scale (surfaces lighter as they rise, white-alpha hairlines), never an inversion.

## 7. Layout and rhythm

- **Diagnose before moving boxes**: reading order, grouping, rhythm, structure (are repeated items truly equivalent), density, adaptation, extremes. Answer with render evidence.
- **Squint test**: blur the render; you must still see the primary element, the secondary element, and the major groups in order.
- **Spatial thesis** before editing: the primary path, what groups and what separates, what leads, intended density, and what changes across widths.
- **Rhythm is contrast of intervals**: tight inside a group (`--space-8px` to `--space-16px`), generous between groups (`--space-32px` to `--space-48px`), sections at one repeated value (`--space-64px` to `--space-96px`). One value everywhere means proximity does no work.
- **Variation is not a goal by itself.** Repetition supports recognition; break it only when content or priority changes. This balances the JAL adjacent-variety rule so it never becomes random variety.
- **Pace the scroll** (Persuade, Experience): vary density, scale, media, and quiet within one grammar; a dense passage earns a quiet one; the page ends on a real close, not a fade.
- **The first viewport is a thesis, not a header**: show the product doing its job at the scale it has in life; do not trap it in a stock hero or card shell.
- Asymmetry is lawful (spans, offsets, alignment changes) as long as no box intersects another. One alignment (left or center) per page.
- Overlays escape clipping ancestors through the top layer (`dialog`, `popover`), never z-index wars.

## 8. Motion timing bands

| Band | Duration | JAL tokens | Use |
|---|---|---|---|
| Feedback | 100 to 150ms | `--dur-100`, `--dur-150` | press, toggle, hover state layer |
| State change | 150 to 300ms | `--dur-150`, `--dur-200`, `--dur-300` | menus, popovers, list add and remove |
| Layout and overlay | 300 to 500ms | `--dur-300`, `--dur-400` (showcase) | dialogs, sheets, route and view transitions |
| Authored focal entrance | 500 to 800ms | `--dur-600` (showcase) | the one moment on a Persuade or Experience page |

- Operate surfaces stay at 150 to 250ms with no page-load choreography. Nothing in product UI exceeds 300ms.
- Exit at about 70% of entrance (the JAL exit formula). Long feedback reads as latency.
- The one JAL curve `--ease-standard`. Never bounce or elastic by reflex, never linear, never `transition: all`.
- Write a motion thesis first: the one focal moment, the continuity changes, the feedback, the budget. A generic fade-and-rise on every section is not a thesis.
- Stagger only a list that appears as a list: 30 to 50ms per item, total delay 300ms at most. Never stagger every scrolled section.
- Content is visible in the default state, so a failed script never hides the page.
- Animate transform and opacity only; `will-change` only during a known animation; loops stop off-screen or when the tab is hidden.
- **Reduced motion is gentler, not zero**: remove travel and scale, keep the opacity and color feedback that carries meaning (150ms or less). A global kill that erases feedback is a finding.
- Intensity, choreography, and pinning are JEV calls owned by `jal-motion` (`motion.intensity`, `motion.choreography`, `motion.pin`).

## 9. Interaction and states

- Every control: default, hover, focus-visible, active, disabled, loading, error, success (JAL state recipe in `SKILL.md`).
- **Polish triage order**: (1) broken tasks, data loss, misleading state, inaccessible paths; (2) missing loading, empty, error, success, disabled, permission states; (3) flow, hierarchy, responsive, system drift; (4) visual and motion inconsistency; (5) code and asset cleanup. Never perfect one corner while the rest is below the floor.
- **Drift classes**, fixed at the narrowest correct level: missing token, one-off implementation (use the shared component), conceptual mismatch (flow differs from comparable screens), local defect.
- **Harden matrix**: very long and very short text, RTL and CJK, huge numbers, 1000+ items, empty; offline, slow, timeout; 400, 401, 403, 404, 429, 500 each with its own treatment; double-submit blocked; optimistic updates roll back; permission states explain why; `Intl` for dates, numbers, currency; search debounced about 300ms, scroll handlers throttled about 100ms.
- **Interrupted gestures** (drag surfaces, custom sliders, scroll strips): a second pointer never steals the drag; state clears on `pointercancel`, `lostpointercapture`, release outside, and window `blur`; the next drag works without reload; `touch-action` is set; a scroll across the control scrolls the page. Say what produced the evidence (emulation, synthesized touch, real device).
- Undo beats confirmation when recovery is safe.
- **Empty states** name which of the five they are (first use, user cleared, no results, no permission, error) and carry what goes here, why it matters, and how to start.
- **Onboarding**: time to first value, skippable, 1 to 3 concepts, tours 3 to 7 steps, never shown twice.
- **Cognitive load**: at most 4 options at a decision point (5 to 7 is the edge, 8 or more is overload); 1 primary action, 1 or 2 secondary, the rest in a menu; at most 5 top-level destinations (the bottom tab bar is 3 to 5); no working-memory bridge across screens.

## 10. UX writing

- Read the whole path, not isolated strings. Per state: the one fact needed now, the next action, context that changes the decision.
- Say each idea once. If the heading explains the state, the intro adds new information or goes.
- Action labels are verb plus object and describe the outcome ("Save changes", "Export invoices"). Confirmation buttons repeat the action ("Delete project"), never Yes, No, OK, or Submit.
- Destructive actions name the object and the consequence.
- Errors say what failed, why when it helps, and how to recover. No internal codes as the main message. Warmth is fine for payment, privacy, deletion, and access loss; jokes never.
- Loading text names the real operation. Never fake progress. Routine success is brief.
- Forms: persistent labels above (placeholders are examples), requirements shown before submit, validation that says what to fix without blame, errors announced accessibly.
- Link text works out of context; icon-only controls have accessible names.
- Keep one term per concept everywhere; never vary words for style. Cut copy in half, then again.
- Sentence case for headings, buttons, and labels.
- **Banned phrases**: "streamline your", "empower your", "supercharge your", "unleash", "leverage the power", "harness the power", "built for the modern", "trusted by leading", "best-in-class", "industry-leading", "world-class", "enterprise-grade", "next-generation", "cutting-edge", "transform your business", "revolutionize", "game-changer", "mission-critical", "future-proof", "seamless", "seamlessly integrate", "drive engagement / growth / results". Also the "X. No Y." or "Not X. Y." cadence as a section ending, and calling things "theater".
- No em-dash, no emoji, no invented metrics, customers, or testimonials. Demonstration data may be full-fidelity but is labeled as sample data.

## 11. Critique workflow

Used for `/jal-ui` audits of an existing frontend and as the evidence step of the finish review.

1. **Resolve the target** to a source path and a running URL.
2. **Two isolated assessments** in parallel subagents that never see each other:
   - **A, design review**: specificity verdict first (could an unrelated product reuse this unchanged?), the cognitive-load checklist (single focus, chunks of at most 4, grouping, hierarchy, one decision at a time, at most 4 options per decision, no memory bridge, progressive disclosure; 0 to 1 failures low, 2 to 3 moderate, 4 or more critical), the emotional path (peak and end, valleys, reassurance at high-stakes moments), personas, and Nielsen's 10 through `ui.heuristics`.
   - **B, mechanical evidence**: `ui_audit` at every width plus the screenshots. It finishes isolated so its numbers never anchor A.
   - Without subagents, run A then B sequentially and head the report `DEGRADED: sequential critique`.
3. **Synthesize, never concatenate**: where A and B agree, what only B caught, which audit hits are false positives (never report an unverified one).
4. **Score Nielsen's 10** (`ui.heuristics`, each 0 to 4): h1 visibility of status, h2 match with the real world, h3 user control and freedom, h4 consistency and standards, h5 error prevention, h6 recognition over recall, h7 flexibility and efficiency, h8 aesthetic and minimalist design, h9 error recovery, h10 help and documentation. On Persuade and Experience, h7 and h10 may be n/a and leave both the total and the max.
   - Bands on 40 (or the percentage with n/a): 36 to 40 (90%+) excellent, 28 to 35 (70%+) good, 20 to 27 (50%+) acceptable, 12 to 19 (30%+) poor, under that critical. Most real interfaces land 20 to 32.
   - Any heuristic under 2 becomes a priority issue. A "not specific" answer is P1 regardless of total.
5. **Five personas**, each reported as what broke on the primary action, never a generic description:

   | Persona | Tests |
   |---|---|
   | Power user | speed, shortcuts, bulk actions, density |
   | First-timer | clarity, jargon, where to start, empty states |
   | Keyboard and screen reader user | focus order, names, announcements, no hover-only paths |
   | Stress tester | extreme input, errors, interrupted flows, double submits |
   | One-handed mobile user | thumb reach in the app-shell, 44px targets, bottom tab bar, sheets |

   Pick by surface: landing (first-timer, stress tester, one-handed); dashboard (power user, keyboard); checkout (one-handed, stress tester, first-timer); onboarding (first-timer, one-handed); data-heavy (power user, keyboard); forms (first-timer, keyboard, one-handed). Add a product persona only from real product context.
6. **Severity**: P0 blocks the task; P1 significant difficulty, fix before release; P2 annoyance with a workaround; P3 polish. Tie-break: would a user contact support? Then P1 at least. P0 to P2 are fixed before handoff.
7. **Report**: method line; heuristic score table (score, key issue, total over applicable max, band); specificity verdict; overall impression; 2 to 3 things working; 3 to 5 priority issues (each P-level, what, why it matters, fix); persona findings; minor observations; 2 to 4 closing questions, each with 2 or 3 concrete options tied to findings (skip only with fewer than 3 priority issues, and say so).
8. **Persist a snapshot line** in the target repo's `docs/design/critique-log.md`: date, surface, total, max, n/a list, P0 count, P1 count. Print the last 5 as a trend. A later polish pass closes the snapshot only when every priority issue is cleared.

## 12. Fresh-context final reviewer

A reviewer that inherits the builder's conversation inherits its optimism. After `ui_audit` PASS and the builder's `ui.final_taste`, spawn a fresh subagent (`jal-ux`) with no transcript and only these inputs: the 375 and 1280 captures (and any required state captures), `docs/design/direction.md`, this file, and the `ui_audit` summary.

Checks, in order:

0. **Evidence validity**: captures not blank, taken from the top, entrance motion settled, correct widths, required states present.
1. **Persistence**: the contract and decision log exist; every phase is closed.
2. **Fidelity matrix**: one row per element (first viewport, primary action, nav, each region) with status `match`, `adaptation`, `missing`, `contradicted`, or `added`. Mandatory rows: TYPE, ACCENT, GROUND (canvas and depth). Imitation material (CSS faking a physical finish) is contradicted on its face.
3. **Ceiling**: devices the chosen direction offers that the build left unused.
4. **Contract**: promise by promise, plus the memory test.
5. **Truth**: no invented claims; sample data labeled.
6. **Floor**: walk sections 2 and 3 of this file against the captures.

Output: disposition line, then persistence, fidelity, ceiling, `material_fixes` (at most 8, fidelity before craft), and one `keep` line naming what must not be diluted. No praise. The reviewer then runs `ui.heuristics` and `ui.finish_disposition`.

**The four verdicts** (`ui.finish_disposition`):

| Verdict | When | Then |
|---|---|---|
| `recapture` | the evidence is invalid (blank, cropped, mid-animation, wrong width, missing state) | recapture and review again; does not count as a fix round |
| `rebuild` | the concept failed in the build: the first viewport or the focal element contradicts the contract, or contradiction is the norm | re-derive the named regions from the contract, full review again |
| `fix` | the concept holds; up to 8 material fixes one batch can close | apply all fixes in one batch, recapture the same widths, review again with a verdict pass scoring each fix `resolved`, `partial`, or `unresolved` |
| `ship` | no contradicted or missing rows, no material fixes, the first viewport keeps the contract's promise and passes the memory test | report the verdict at its real scope ("the three fixes scored resolved" is not "no issues remain") |

**Two fix rounds at most.** Build, then at most two fix or rebuild rounds. Open items after round 2 go to Brian as the open table; never loop a third time. User-supplied evidence against a `ship` reopens a full review. Self-QA outside this loop is bounded the same way: one batched inspection, one fix batch, one confirming pass, stop.

## 13. The 25 JAL conflicts and their lawful replacements

| # | impeccable says | JAL law | Lawful replacement |
|---|---|---|---|
| 1 | Light or dark from the physical use scene | White-first; dark only when explicitly asked | Keep the light default. The scene sentence tunes density and contrast inside the light theme, or the tone of a requested dark theme. |
| 2 | Warm beige or cream ground is a reflex AI surface (flagged) | Light beige is an allowed default | Do not ban beige. Ban the reflex trio: beige ground plus italic serif display plus terracotta or clay accent. A beige canvas is justified in the contract. |
| 3 | Committed, Full palette, and Drenched color strategies | One accent, about 3% | Restrained only. Vary hue, role, and neutral temperature, never area. |
| 4 | Depth from offset soft shadows; blur and backdrop filters as materials | No blurred shadow, no blur | Tonal layers, 1px hairlines, a flat scrim for dialogs. Motion materials are opacity and transform; clip-path or mask reveals need Brian. |
| 5 | Animate gradient position, texture, distortion, shaders | No gradients, glow, neon | Drop them on the page. The one authored moment is a transform and opacity sequence. Shaders live only inside a `jal-immersive` canvas under its rules. |
| 6 | Asymmetric, disruptive composition; comps keep overlaps | No overlap | Asymmetry through spans, offsets, and alignment, with no intersecting boxes. Replace overlap with adjacency, scale contrast, and full-bleed media regions. |
| 7 | Side stripe banned above 1px only | No side line at any width | JAL rule: any side border that differs from the others fails. |
| 8 | Em-dash flagged only at saturation | No em-dash | Zero, in UI copy and in anything an agent writes into UI. |
| 9 | Eyebrow and kicker banned | No eyebrow | Agreement; also ban the pill badge above a headline and numbered section labels. |
| 10 | Emoji and glyph icons banned | No emoji | Agreement; also no typed Unicode glyph as an icon. |
| 11 | Purple gradients and cyan-on-dark flagged | No purple, violet, indigo | JAL stricter: HSL hue 250 to 320 fails outright; pick accents outside 235 to 330. |
| 12 | Zero-blur offset block shadows allowed in a neobrutalist world | No shadows | Banned as decoration even though it passes the blur check. |
| 13 | Glass and backdrop blur as a specific effect; system materials | No blur | Opaque surfaces and a flat scrim. |
| 14 | Hamburger or bottom nav on mobile | Mobile app-shell | Pinned header plus bottom tab bar of 3 to 5 below 640px; no hamburger as primary nav. |
| 15 | Display up to 6rem, fluid display on Persuade | 48px display in product UI | Product UI tops at `--text-6`. Marketing and immersive heroes get the fixed `--text-display-1..3` steps (57, 69, 83), no fluid clamp. Adopt the -0.04em floor, balanced headings, and the display-sentence ban. |
| 16 | Inter and Helvetica on the overused list; Persuade wants a face with a view | System or Inter-like default; a webfont is a dependency | Operate and Read keep the default. Persuade and Experience may propose a self-hosted face with a written reason; Brian approves the dependency. Never from the overused list without a reason. |
| 17 | Cream plus terracotta is the saturated AI look | `jal-ui-taste` used to suggest terracotta | Terracotta is dropped as a default suggestion. The default is no accent (ink); a hue comes from product meaning. |
| 18 | `npx impeccable`, a downloaded Rust binary, image generation, a browser extension, telemetry, a remote roll API | Bun only; no Node tooling; no remote calls | Install and run nothing. Knowledge lives in JAL skills, mechanical checks in `ui_audit`, the seeded draw is a Bun one-liner (`directions.md`). |
| 19 | Examples in Tailwind classes | Tailwind only through the approved `bun-plugin-tailwind` wiring to JAL tokens | Translate every value to JAL tokens (`--space-*`, `--control-h`, `--text-*`). |
| 20 | Names Three.js, OGL, regl, deck.gl, TanStack Virtual, tour and tooltip libraries | Approved stack only | Three.js and R3F are approved for `jal-immersive`. Tours, tooltips, and virtual lists are built in React on JAL Core; any other library is a `be.new_tech` escalation. |
| 21 | Theme scrollbars (craft) versus never reinvent affordances (operate) | Not specified | Theme scrollbar color, selection, caret, accent-color, underline offset from tokens; never replace native scroll behavior. |
| 22 | Hover lift `translateY(-2px)` | Transform allowed, no shadow | Only as a state change on an interactive container, never with a shadow change. On images it is allowed only through a JEV-picked image-hover recipe (see the ban list). |
| 23 | Committed first viewport, drenched onboarding screens | Accent under 3%, no accent-filled hero | Drama from scale, type, media, and layout, never from color area. |
| 24 | Monospace allowed for code, data, measurement | Not banned | Agreement; add "no mono as technical costume". |
| 25 | Live mode, comp-led builds, a localhost decision page, image generation | No image-generation pipeline; Bun only | Code-led path only: ambition lives in the written direction contract and one named signature moment, audited at finish. |

## 14. Claude's rendition prior and the terracotta default

- **Claude's own tendency** (impeccable documents it for Claude specifically, and JAL agents run on Claude): warm, bookish, family, and child-facing subjects come out as a cream ground, a serif display with italic accents, and a "lamplight" mood. Treat that first palette as already spent. Rework from the saturated materials of the audience's real world, inside JAL's light canvas.
- **The three saturated AI looks** to avoid when the brief is open: (a) warm cream ground, high-contrast serif display, terracotta or signal-red accent; (b) near-black with one neon accent and glowing edges (JAL law bans it anyway); (c) broadsheet hairlines, italic display serif, small tracked mono labels. A bookish, warm, or child-facing subject does not license (a).
- **Terracotta is no longer a suggested default accent.** `jal-ui-taste` replaces it with: no accent by default (ink); when a hue is needed, choose it from product meaning, for example a clear blue (HSL about 200 to 225), a forest or signal green, a teal, or an ochre, checked against the status hues and the 235 to 330 exclusion band.
