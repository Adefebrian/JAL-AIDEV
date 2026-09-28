# JAL Design Intelligence (v0.3.0): design spec

Date: 2026-09-28. Owner: Brian. Scope: UIUX agent + design system upgrade only. Parallel orchestration (phase 2), command compaction (phase 3), and the SEO/GEO agent (phase 4) are out of scope here.

## 1. Goal

Turn the JAL frontend layer into one intelligent design system that builds or redesigns UI that is modern, tidy, aesthetic, conceptually structured per section, mobile-first, and never AI-slop. It combines the core knowledge of Astryx (Meta), Carbon (IBM), Material Web (Google), and bang-motion, filtered through JAL law, with JEV (TypeSafe) as an automatic decision layer and a mechanical UI audit that proves the result.

## 2. Locked decisions

1. **Knowledge-only integration.** None of the four systems ship as runtime packages. Research proved each one fights Bun.build (StyleX, Lit, Sass) and ships banned patterns (gradients, shadows, purple, dark-by-default, 28 to 36px controls). We port ideas, generators, and doctrine into JAL-native tokens and skills.
2. **JAL Law is absolute and mechanical where possible.** Nothing in any system, designmd kit, or JEV verdict can override it.
3. **JEV is the decision layer.** Its verdict is final on soft calls (density, relevance, implement-or-drop, container choice). The agent may not override a JEV veto. Hard law is outside JEV's authority. On outage: exponential-backoff retry; if still unreachable, fall back to agent judgment and stamp the report `UNVERIFIED BY JEV`.
4. **Container choice is combined and decided per region by JEV**: rows, bento tiles, divided section, single card, or plain spacing, using the Astryx layout doctrine as the criteria.
5. **designmd is supplementary only.** Read tools only (never upload/delete). Every kit is JEV-screened and law-filtered before it may influence anything.
6. **One command.** `/jal-ui` builds from zero or redesigns. Mobile-first is mandatory. No new commands.
7. **Keys are bundled** in the plugin so the whole team gets JEV and designmd with no setup (Brian's call, same practice as koboyo). Trade-off accepted: anyone with repo access holds the keys, they persist in git history, and rotation needs a plugin release.

## 3. JAL Law (hard, frontend)

All existing law stays. Stated in full so nothing is lost:

- Default background is white, off-white, broken white, or light beige. Never a dark or colored default. Dark only inside an explicitly requested dark mode, never auto-triggered from the OS.
- No gradients of any kind. No emoji or emoticons. No em-dash. No eyebrow labels. No glow, no neon, no AI-slop signatures. One restrained accent, never purple, violet, or indigo.
- **No shadows.** Depth comes from tonal layer steps and hairline borders only. The single exception is a spread-only focus ring (`0 0 0 Npx`), and `outline` is preferred.
- **No side line on any card or panel, ever.** No `border-left/right/inline-start/inline-end` accent stripe, no `box-shadow: inset` stripe trick, no top or bottom accent bar. Also no connector lines between cards or tiers, and no marker dots or squares beside headings or labels. Only functional full hairline borders and neutral dividers between structural regions.
- No big empty gaps. No empty void inside a card. No fake-fill (never `justify-content: space-between` or `flex-grow` on list rows to fill height).
- Cards in a grid share one shape. Form controls are normalized to one 44px height token, measured not eyeballed.
- **New: every section is conceptualized.** Each section declares, before any markup, its job (what it must make the user understand or do), its one primary message, its primary action (if any), and its container (chosen per region by JEV). A section with no job is deleted. Adjacent sections vary in structure; no template repetition.
- Mobile-first always: app-shell with fixed bottom tab bar below 640px, no horizontal scroll at 320/375/414/768/1280, 44px touch targets.

## 4. JAL Core tokens (rebuilt, generated)

Generated with the Astryx method (formulas, not hand lists), tuned for JAL.

- **Type:** `round(16 x 1.2^step)`, steps -2..6 = 11, 13, 16, 19, 23, 28, 33, 40, 48px. Line heights snapped to a 4px grid: 16, 20, 24, 28, 32, 36, 40, 48, 56. Weights 400, 500, 600 only. Hierarchy by weight and ink before size (Astryx). Base 16 keeps mobile legibility and prevents iOS focus zoom.
- **Spacing:** 4px scale: 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
- **Radius:** 4, 8, 12, 16, 28, and pill 9999.
- **Controls:** 44px for every input, select, date input, button. Table row density (desktop only, 1024px and up): compact 40, default 48, comfortable 56.
- **Color (neutral base, from Astryx neutral, white-first):** page `#fafaf9`, surface `#ffffff`, layer-1 `#f5f5f4`, layer-2 `#efefed`, border hairline `#e5e5e3`, border-strong `#d4d4d1`, ink `#1b1b1b`, ink-muted `#474747`, ink-subtle `#6b6b6b` (large text only). Primary action is ink on white by default. A project may add one brand accent (never purple family); status colors (success, warning, danger, info) are desaturated and used only for real state.
- **Depth (no shadow):** Carbon layer model plus Material tonal ladder. Nested surfaces step page -> surface -> layer-1 -> layer-2. Overlays (menu, dialog, popover) sit on `surface` with a hairline `border-strong`; dialogs add a neutral scrim, never a shadow.
- **State layers (Material table, rendered without gradients):** hover 8%, focus 12%, pressed 12%, disabled content 38%, disabled container 12%, applied with `color-mix(in oklab, var(--ink) N%, var(--surface))`. Astryx's gradient hover overlays are replaced by this.
- **Motion:** product UI durations 100 (micro), 150 (fast), 200 (base), 300 (slow); showcase only 400, 600. Standard easing `cubic-bezier(0.24, 1, 0.4, 1)` (Astryx). Exits run at about 70% of the entrance duration (bang-motion asymmetry). Transform and opacity only. `prefers-reduced-motion` collapses to an opacity crossfade of 150ms or less.
- **Breakpoints:** 640, 768, 1024, 1280, 1536. App-shell below 640, tablet 640 to 1023, desktop 1024 and up.

## 5. One design system: JAL Core (skill `jal-design-system`)

Revised 2026-09-28 on Brian's call: no per-product lens pick. Astryx and Carbon are merged into one system so every JAL product looks like one team built it.

- **Astryx is the foundation.** Method (generated scales, contrast by contract), layout doctrine (frame and region widths first; lightest container that still groups: spacing, then divider, then section, then card; records as rows; one content line per region; grouping survives with borders removed), hierarchy, state taxonomy (user, system, agentic), elevation order, accessibility rules, motion principles, the agent workflow with a mandatory self-check, and the Button, Card, List, Dialog, Tabs, Badge, EmptyState, AppShell, and chat specs.
- **Carbon is the data and form layer.** Contextual layer tokens, the density mechanism, DataTable, TextInput, Select, DatePicker, the notification model, modal states and sizing, three-tier accessibility verification.
- **Material contributes four contracts only:** state-layer percentages, the mobile navigation bar, chips, the one floating create action (no shadow), plus soft-disabled.
- One owner per concern and one spec per component (`references/components.md`); if Astryx and Carbon disagree and the owner table does not decide, Astryx wins. Provenance and every shed pattern are kept in `references/sources.md`. Sheds: OS-following dark mode, gradient overlays and fades, shadow elevation, StatusDot, notification and tab stripes, square radius, purple palettes, ripple, 28 to 40px controls, third-party icon fonts.

## 6. Motion (skill `jal-motion`)

Two contexts. **Product UI motion:** restrained, the token scale above, state transitions, list add/remove, route transitions. **Showcase motion** (landing heroes, product demo pieces): bang-motion choreography (asymmetric in/out, shot-size "camera" language, staging, anti-slide checks, deterministic timelines) rebuilt in the approved stack (Lenis, GSAP, Framer Motion, CSS/WAAPI) with reduced-motion support added. Bang-motion's own Node, Python, ffmpeg, Three.js, and AE-bridge workflow is not imported.

## 7. JEV decision layer

Official endpoint only: `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer <key>`, model `jev-latest`. Question types: `choice` (`criteria` map, max 255 options, answer `choice` + `probabilities` + `confidence`), `score` (ordered `criteria` array, at least 2 levels, answer `score` + `legend` + `probabilities` + `confidence`), `noul` (answer `noul`, the probability of yes). Errors 401, 422, 429, 529; 429 and 529 retry with exponential backoff.

Called automatically at four points in `/jal-ui`:

1. **Density pick (`ui.density`):** choice over compact, default, comfortable for desktop tables and record lists, given the brief. Controls stay 44px. JEV never picks a design system.
2. **Region and component gate:** for every proposed section and major component, `noul` "implement?" plus `score` relevance (0 Irrelevant, 1 Marginal, 2 Useful, 3 Core) plus `choice` container (rows, bento, divided-section, card, plain-spacing). Drop when implement is under 0.5 or relevance is under 1.5.
3. **designmd screen:** before any kit is used as reference, `noul` "is this slop?" and `score` fit; reject when slop is 0.5 or more.
4. **Final taste verdict:** `score` on the built screen description and audit results; under 2 means revise before returning.

Every decision is logged in the build report (question, answer, confidence). Outage path per section 2.3.

## 8. Mechanical UI audit

A zero-dependency Chrome DevTools Protocol driver (Bun native WebSocket, system Chrome via `CHROME_PATH` or standard install paths). Loads a URL at 320, 375, 414, 768, 1280 and asserts on computed styles and the live DOM:

- Page background is light (relative luminance of `body` and main container background at least 0.85).
- No gradient in any computed `background-image`.
- No `box-shadow` with blur greater than 0 (spread-only focus rings allowed).
- No side stripe: no element with a left or right (or inline start or end) border wider than 1px, or with a side border whose color differs from its other sides, or with an inset horizontal box-shadow stripe.
- No emoji and no em-dash in visible text.
- No purple family color (hue 250 to 320 with meaningful chroma) in any computed color or background.
- Form rows: every control in the same row has identical height and top offset; all controls are at least 44px tall.
- Cards in a row share height; no card has a blank band taller than its content by a threshold.
- No horizontal overflow (`scrollWidth <= innerWidth`) at every width.
- Eyebrow heuristic: small uppercase letter-spaced text directly above a heading is flagged.

Output: a PASS/FAIL report listing each violation with selector, width, and measured values. Missing Chrome is reported loudly as `SKIPPED`, never as PASS.

## 9. Delivery form

One zero-dependency Bun MCP server inside the plugin, `mcp/jal-design/server.ts`, exposing `jev_decide` and `ui_audit`, with the same functions also runnable as CLI subcommands for scripts and fallback. Bundled in the plugin `.mcp.json` with the JEV key in `env`. designmd is bundled as `bunx designmd-mcp` with its key in `env`.

## 10. Hook upgrades (write-time, mechanical)

`hooks/guardrails.mjs` additionally blocks, in frontend files (apps/web, packages/ui, docs-site): any `linear-gradient`, `radial-gradient`, `conic-gradient`; any `box-shadow` with a blur radius above 0 (spread-only rings allowed); any side stripe (`border-left`, `border-right`, `border-inline-start`, `border-inline-end` at 2px or more or colored with an accent or status token; inset horizontal box-shadow stripes); emoji in frontend content. Each rule has unit tests for block and allow cases.

## 11. Files

- Rewrite: `skills/jal-ui-taste/SKILL.md`, `agents/jal-ux.md`, `commands/jal-ui.md`.
- Update: `skills/jal-standards/SKILL.md`, `skills/jal-frontend-rules/SKILL.md`, `agents/jal-frontend.md`, `hooks/guardrails.mjs` (+ tests), `.mcp.json`, `README.md`, `.claude-plugin/plugin.json`, template `packages/ui/src/tokens.css` and `packages/ui/src/ui.css`.
- New: `skills/jal-design-system/SKILL.md` + `references/foundations.md`, `references/components.md`, `references/sources.md`; `skills/jal-motion/SKILL.md`; `mcp/jal-design/server.ts` + tests.

## 12. Acceptance

- Hook tests pass, including new block and allow cases for gradient, shadow, side stripe, emoji.
- MCP server: `initialize`, `tools/list`, and `tools/call` work over stdio under Bun; `jev_decide` returns a live JEV answer; retries on a mocked 429; returns an `UNVERIFIED BY JEV` fallback when the network is down.
- `ui_audit` FAILs a known-bad fixture page (gradient, shadow, side stripe, mixed control heights, dark background, emoji) with each violation named, and PASSes a known-good fixture.
- Template: `bun install`, `bun run build`, `bun test`, `bun run check:boundaries` stay green on the new tokens, and the template starter page passes `ui_audit`.
- End to end: a real `/jal-ui` build from zero records its JEV decisions, passes `ui_audit`, and is screenshot at 375 and 1280 before it is called done.
