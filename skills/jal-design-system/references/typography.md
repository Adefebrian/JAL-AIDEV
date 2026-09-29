# JAL Core typography: the font system

Brian's decision (2026-09-29): Geist Sans and Geist Mono are the JAL Core default, but typography is not locked to one or two fonts. What matters is that the type is tidy, relevant, and matched to the context, the section, and the content. This file is the system that makes that repeatable: fixed rules, a curated pool of open-licensed faces, a default pairing per direction, and one JEV decision (`ui.type_pairing`) for everything in between.

Code: the default faces are vendored in `templates/monorepo/packages/ui/src/fonts` (`fonts.css`, two variable woff2 files, `OFL.txt`), imported by `tokens.css`, which declares `--font-sans`, `--font-display`, `--font-mono`, and `--font-numeric`. `kit.css` maps every direction to its pairing through `--kit-font-sans`, `--kit-font-display`, and `--kit-font-mono`. Pool faces are fetched into the client project, never into the plugin, by `scripts/assets/fonts.ts`.

## 1. What never changes with the font

- **The type scale.** `round(16 x 1.2^n)`, the display set, and the line heights in `tokens.css`. A new face never brings its own sizes.
- **The five type roles** from `identity.md` section 1.2: display, heading, title (19), body (16), meta (13). No sixth size, whatever the face.
- **Weights 400, 500, 600 only.** Display and heading weights stay inside their knobs (500 or 600), with one exception in rule 2.5.
- **Tracking** stays inside the knob ranges (display -0.01 to -0.04em, heading 0 to -0.02em, body 0). A face that needs looser tracking at display sizes is the wrong face for that role.
- **Numbers are always tabular** (rule 2.4).
- **The rest of the law is untouched:** no purple, no gradients, no glow, no shadows, no emoji, no em-dash, no eyebrow labels, no uppercase tracked kickers.

## 2. The pairing rules

The kit has three family roles. They are not type roles: one family can carry several type roles.

| Family role | Variable | Carries | Default |
|---|---|---|---|
| text | `--kit-font-sans` (`--font-sans`) | title, body, lead, meta, controls, units | Geist |
| display | `--kit-font-display` (`--font-display`) | the Masthead display, section headings, quotes | Geist (same as text) |
| mono | `--kit-font-mono` (`--font-mono`) | `.kit-num` values, spec rows, code, ticks, times | Geist Mono |

Big figures (StatRow, price, Bento stat) read `--kit-font-figure`, which points at the display face, the text face, or the mono.

1. **One pairing per page, at most three families.** A text family, at most one display family (or the text family again, the usual case), and one mono. The pairing is chosen once for the page, at direction time, and written in the direction contract.
2. **A section may switch only its display role,** and only when its content calls for it: an editorial quote, a manifesto line, a pull statement in a content-led product. Never the text role, never the mono.
   1. The switch counts against the three-family cap: it is allowed only when the page's display role is the text family, so the page still loads at most three families.
   2. One switched face per page, the same one in every switched section.
   3. The switch is a JEV call (`ui.type_pairing`, `display_switch` key) for a section flagged editorial. Adjacent sections never both switch.
   4. Mechanism: redeclare `--kit-font-display` (and nothing else about type) on that section's root, in the app's stylesheet or a `style` attribute. The heading and quote inside the section follow it.
   5. A single-weight face (Instrument Serif, 400 only) also sets that section's `--kit-display-weight` and `--kit-heading-weight` to 400. A weight is never synthesised.
3. **Pool faces only, SIL OFL 1.1 only.** Section 3 is the pool. A face outside it needs Brian's yes and an OFL check first, then an entry in `POOL` in `scripts/assets/fonts.ts` and a row here.
4. **Numbers are always tabular.** `.kit-num` sets `tabular-nums slashed-zero` on the mono. A face may carry figures only when it has the `tnum` feature or tabular digits by default (the Figures column below). When the display face has neither, `--kit-font-figure` points at the text face or the mono. Slashed zero comes from the mono: Geist Mono draws it by default; JetBrains Mono and IBM Plex Mono draw a dotted zero, which is equally unambiguous. The Fontsource builds carry no `zero` feature, so `slashed-zero` changes nothing there.
5. **Every stack ends in the Geist stack.** A pool face is listed first and followed by `var(--font-sans)` (or `var(--font-mono)`), so a project that has not fetched it renders the tidy default, never a random system face.
6. **No costume.** No italic display, no one-word serif or italic swap inside a sans headline, no warm-paper plus italic serif plus terracotta trio (`craft.md` section 14), no mono as a label costume (mono is for code, data, and measurement).
7. **Budget.** Fetch latin plus latin-ext unless the content needs another script, and the `wght` axis file unless the page really uses optical sizes at display sizes (Newsreader `opsz` is about 219 KB for two subsets, `wght` about 94 KB). The Geist default is 141 KB for both families, all scripts. The faces are served as real files, never inlined: `fonts.css` points at `/fonts/<file>.woff2`, `apps/web/build.ts` keeps that URL external (Bun.build 1.3 would otherwise inline any file under about 128 KB into `index.css` as base64, which took the stylesheet from about 125 KB to 294 KB and made both faces uncacheable apart from it), copies the files to `dist/fonts`, and `index.html` preloads both faces; the server sends `/fonts` with a one-year immutable cache. A pool face fetched into the client project follows the same path.
8. **Loading.** Every face uses `font-display: swap`. Geist ships metric-matched fallbacks (`Geist Fallback` on Arial, `Geist Mono Fallback` on Courier New) so the swap does not move the layout; pool faces fall back to Geist, whose own fallback keeps the shift small.

## 3. The curated pool

All faces were checked on npm on 2026-09-29: the package `license` field, `license.type` in the package's `metadata.json`, and the LICENSE text all read OFL 1.1 (`fonts.ts` repeats all three checks on every fetch). Roles: T text, D display, M mono, F figures. Build: `var` means `@fontsource-variable/<id>`, `static` means `@fontsource/<id>`. Geist and Geist Mono are vendored from the official `geist` release and never fetched.

| Family | Pool id | Build | Character | Best contexts | Roles | Figures | Pairs with |
|---|---|---|---|---|---|---|---|
| Geist | geist | vendored | Swiss-leaning neutral grotesque, tight and exact | product UI, data, docs, finance, luxury hardware | T D F | tnum | Geist Mono, Newsreader, Instrument Serif |
| Geist Mono | geist-mono | vendored | Geist's monospace, slashed zero by default | product UI, data, docs, finance | M F | tabular | Geist, Inter, Instrument Sans |
| IBM Plex Sans | ibm-plex-sans | var (wght, wdth) | engineered grotesque with a humanist hand, corporate and industrial | product UI, data, docs, finance | T D F | tabular | IBM Plex Mono, IBM Plex Serif |
| IBM Plex Mono | ibm-plex-mono | static | warm code face, dotted zero | data, docs, finance | M F | tabular | IBM Plex Sans, IBM Plex Serif, Inter |
| IBM Plex Serif | ibm-plex-serif | static | sturdy, sober serif, not literary | editorial, docs, finance | D T F | tabular | IBM Plex Sans, IBM Plex Mono |
| Inter | inter | var (wght, opsz) | screen-first neo-grotesque, most legible at small sizes | product UI, data, docs | T D F | tnum | JetBrains Mono, Geist Mono, Source Serif 4 |
| Inter Tight | inter-tight | var (wght) | Inter spaced for headlines | product UI, luxury hardware, finance | D F | tnum | Inter, Geist, Geist Mono |
| JetBrains Mono | jetbrains-mono | var (wght) | tall x-height code face, dotted zero | docs, data, product UI | M F | tabular | Inter, Geist, Manrope |
| Instrument Sans | instrument-sans | var (wght 400 to 700, wdth) | crisp contemporary grotesque, slightly warm | product UI, luxury hardware, editorial | T D F | tnum | Instrument Serif, Geist Mono, Newsreader |
| Instrument Serif | instrument-serif | static (400 only) | condensed high-contrast display serif | editorial, luxury hardware | D (section switch only) | none | Instrument Sans, Geist |
| Newsreader | newsreader | var (wght, opsz) | transitional serif with optical sizes, made for screens | editorial, docs | D T F | tnum | Geist, Instrument Sans, Geist Mono |
| Fraunces | fraunces | var (wght, opsz, SOFT, WONK) | soft old-style display serif | editorial, playful consumer | D | none | Geist, DM Sans, Figtree |
| Source Serif 4 | source-serif-4 | var (wght, opsz) | clear transitional serif, bookish without costume | editorial, docs, finance | D T F | tnum | Inter, Geist, JetBrains Mono |
| Space Grotesk | space-grotesk | var (wght 300 to 700) | grotesque with mono-derived quirks, technical | product UI, playful consumer, luxury hardware | D F | tnum | Geist, Inter, JetBrains Mono |
| Manrope | manrope | var (wght) | semi-condensed modern grotesque, geometric curves | product UI, finance, playful consumer | T D F | tnum | JetBrains Mono, Geist Mono |
| DM Sans | dm-sans | var (wght, opsz) | low-contrast geometric sans, friendly and even | product UI, playful consumer | T D | none | Geist Mono, Fraunces |
| Figtree | figtree | var (wght 300 to 900) | clean friendly geometric sans | playful consumer, product UI | T D F | tnum | Geist Mono, Fraunces, Newsreader |
| Onest | onest | var (wght) | humanist-leaning grotesque, soft terminals, wide Cyrillic | product UI, playful consumer, docs | T D F | tnum | Geist Mono, JetBrains Mono |
| Bricolage Grotesque | bricolage-grotesque | var (wght, opsz, wdth) | expressive grotesque with ink traps at large sizes | playful consumer, editorial | D F | tnum | Geist, Inter, Geist Mono |
| Nunito | nunito | var (wght) | rounded-terminal sans, warm and cheerful | playful consumer | D T F | tabular | Geist, Geist Mono |

Notes on the pool:

- **Display only:** Inter Tight, Space Grotesk, and Bricolage Grotesque tire or crowd at body sizes; Fraunces keeps SOFT and WONK at 0 unless the contract gives a reason. Instrument Serif is a section switch only (rule 2.5), never the page display face and never italic.
- **No tabular figures** in the Fontsource builds of DM Sans, Fraunces, and Instrument Serif: figures go to the text face or the mono.
- **Stylistic sets:** the Fontsource builds carry no stylistic sets or character variants. Geist's `ss01` to `ss11` exist only in the vendored official files, and JAL turns none of them on by default.
- **Weights:** static builds are fetched at 400, 500, and 600 only; `fonts.ts` refuses any other weight.

## 4. Context guide

Start from the content, not from the mood word. Each line lists the candidates in the order to try them; the direction default (section 5) and Geist are always candidates too.

| Context | Candidate pairings (text / display / mono) | Why |
|---|---|---|
| Product UI, daily-use tools | Geist / Geist / Geist Mono; Inter / Inter / JetBrains Mono; Onest / Onest / Geist Mono | neutral, dense-friendly, tabular everywhere |
| Data, dashboards, tables | Geist / Geist / Geist Mono; IBM Plex Sans / IBM Plex Sans / IBM Plex Mono | tabular digits by default, an unambiguous zero |
| Finance, money, precision | Geist / Geist / Geist Mono; IBM Plex Sans / IBM Plex Sans / IBM Plex Mono; Manrope / Manrope / Geist Mono | exact figures, sober voice |
| Docs, developer reading | Geist / Geist / Geist Mono; Inter / Inter / JetBrains Mono; Geist / Source Serif 4 / Geist Mono | long reading plus code, one clear mono |
| Editorial, content-led products | Geist / Newsreader / Geist Mono; Instrument Sans / Newsreader / Geist Mono; Inter / Source Serif 4 / JetBrains Mono | a reading serif for display, a calm sans for text |
| Luxury hardware, product showcase | Geist / Geist / Geist Mono; Geist / Inter Tight / Geist Mono; Instrument Sans / Instrument Sans / Geist Mono | tight confident headlines, quiet text |
| Playful consumer | Geist / Nunito / Geist Mono; Figtree / Figtree / Geist Mono; Geist / Bricolage Grotesque / Geist Mono | friendly shapes on the display, a neutral text face keeps it disciplined |

Section switches (rule 2) worth considering: Instrument Serif or Newsreader for an editorial quote or a manifesto line on an otherwise one-family page.

## 5. Direction defaults

Every direction starts from Geist unless its character clearly needs another face. `kit.css` sets these in each `[data-direction]` block; the pool face falls back to the Geist stack until the project fetches it.

| Direction | Text | Display | Mono | Figures | Fetch |
|---|---|---|---|---|---|
| D1 research_notebook | Geist | Geist | Geist Mono | display | none |
| D2 single_signal_ledger | Geist | Geist | Geist Mono | display | none |
| D3 blueprint_hairline | Geist | Geist | Geist Mono | mono | none |
| D4 bone_white_gallery | Geist | Geist | Geist Mono | display | none |
| D5 calm_productivity | Geist | Geist | Geist Mono | display | none |
| D6 clean_docs | Geist | Geist | Geist Mono | display | none |
| D7 warm_paper_editorial | Geist | Newsreader | Geist Mono | text | `fonts.ts get newsreader --axes opsz` |
| D8 quiet_care | Geist | Geist | Geist Mono | display | none |
| D9 cinematic_hardware | Geist | Geist | Geist Mono | display | none |
| D10 industrial_catalogue | Geist | Geist | Geist Mono | mono | none |
| D11 oversized_masthead | Geist | Geist | Geist Mono | display | none |
| D12 friendly_consumer | Geist | Nunito | Geist Mono | text | `fonts.ts get nunito` |
| D13 precision_dark | Geist | Geist | Geist Mono | display | none |

D7 needs a serif display for its reading register (Newsreader's optical sizes keep the display crisp and the quotes readable), and it keeps its content-led gate. D12 needs a rounded display (Nunito is the pool's rounded face; the text stays Geist so the page stays disciplined). A derived identity or a JEV `ui.type_pairing` answer may pick another pool pairing; the contract records it.

## 6. How to apply it

1. **Default:** nothing to do. `tokens.css` imports `fonts/fonts.css`, `ui.css` sets `body` to `--font-sans`, and the kit reads the `--kit-font-*` variables.
2. **At direction time** (jal-ux pipeline step 2): take the direction default, build 3 to 5 candidate pairings from sections 3 and 4 (the direction default and Geist always among them), and ask JEV `ui.type_pairing` with content samples per section. Write the answer in the direction contract's Type pairing knob.
3. **Fetch any pool face** into the client project, next to the entry CSS:

   ```sh
   bun <plugin>/scripts/assets/fonts.ts list --role display
   bun <plugin>/scripts/assets/fonts.ts get newsreader --axes opsz --out apps/web/src/fonts
   ```

   It writes `apps/web/src/fonts/newsreader/` (woff2, `OFL.txt`, `newsreader.css`) and appends a row to `apps/web/src/fonts/FONTS.md`. Then import the CSS once in `apps/web/src/styles.css` after `tokens.css` (`@import "./fonts/newsreader/newsreader.css";`); Bun.build bundles the woff2 files.
4. **Set the variables** only where the contract says, always ending in the Geist stack: a preset direction already names its face; a derived identity sets `--kit-font-sans`, `--kit-font-display`, `--kit-font-mono`, and `--kit-font-figure` in its own `[data-direction]` block.
5. **Section switch:** redeclare `--kit-font-display` on the section root (rule 2), log the `display_switch` answer in the decision ledger.
6. **Proof:** capture with `ui_shots` and read the images: the face must actually render (not its fallback), numbers must line up in columns, and `ui_audit` must PASS.
