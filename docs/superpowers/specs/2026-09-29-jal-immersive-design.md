# JAL Immersive + sharper UIUX (v0.4.0): design spec

Date: 2026-09-29. Owner: Brian. Builds on v0.3.0 (JAL Core, JEV, ui_audit).

## 1. Goal

1. Sharper, more varied, higher-taste UI in `/jal-ui`. Sources: impeccable (Apache-2.0), refero styles and refero_skill (MIT, used within Refero's Terms), magicui and animata (MIT).
2. A new expert immersive and 3D layer, with the `/jal-immersive` command and the `jal-immersive` agent, for building or redesigning immersive websites. Sources:
   - noyzzi (sections, hover effects, 3D elements)
   - Three.js / WebGPU / TSL (scottstts, dgreenheck, majidmanzarpour, nixie-fx)
   - the clean-room rebuilds of GPL, non-commercial, and unlicensed effects
   - the pmndrs / three.js permissive survey
   - gsap-skills
   - a JAL-native frame core (Remotion's idea, not its code)
3. JEV judges every soft call across all of it. No single source is "the" answer: JEV picks and combines per section.

## 2. Locked decisions (Brian, 2026-09-29)

- Page and UI keep full JAL law. Natural lighting and shading inside a 3D canvas are exempt. No bloom, neon, or purple there unless the piece comes from noyzzi.
- **noyzzi is exempt from the visual law** inside its own section (dark, neon, glow, bloom, its palettes, its overlap). It is also one source among many: JEV decides when a noyzzi piece is the right one, and may combine it with others.
- Approved tech: Three.js (WebGL + WebGPU), React Three Fiber + drei, Tailwind (wired to JAL tokens through `bun-plugin-tailwind`). Lenis, GSAP (all plugins, now free), and Framer Motion were already approved.
- Remotion is never installed (webpack, Node, Chromium, company license). JAL ships its own small frame core instead.
- A new `/jal-immersive` command. `/jal-ui` stays the entry point for product UI.
- Mechanical rules bind everything, noyzzi included: 44px targets, no horizontal overflow, no clipped text, a `prefers-reduced-motion` fallback for every animation, DPR cap 2, disposal and cleanup, Bun-only build.
- Refero content is used within its Terms: distilled directions only, no bulk scraping, no build-time fetching (its robots.txt blocks Claude).
- Clean-room rule: no GPL, non-commercial, or unlicensed code is copied. Permissive code carries attribution in `THIRD_PARTY_NOTICES.md`.

## 3. The combined recipe pool

The `jal-immersive` skill holds a catalog of section recipes, each tagged with source, kind, surface (light or dark), law note, cost tier, and mobile fallback:

| Pool | Kinds |
|---|---|
| noyzzi | 30 hero sections, 22 image hover effects, 26 3D elements (live fetch through `noyzzi_get` for sections and elements; effects linked for manual paste) |
| Clean-room | window rain, wet puddles, deformable sand or snow, wind grass, ocean |
| Three.js skills | studio object showcase, scroll camera path, particles (GPU instanced, GPGPU), instanced fields, post-processing on light scenes, WebGPU compute |
| magicui + animata | text motion engine, reveals, marquee, dock, FLIP lists, tabs indicator, number tickers, globe (now allowed), and the rest of the KEEP/ADAPT list |
| GSAP choreography | pinned sequences, scrub timelines, horizontal tracks, SplitText reveals, Flip transitions |
| JAL frame core | frame-driven compositions and demo "videos" played live in the browser |

Per section, JEV makes two calls:
1. `imm.gate`: does this section earn immersion at all?
2. `imm.recipe`: which recipe or recipes, as a `choice` over the candidates for that section kind, with a `noul` on whether to combine the top two.

The agent never picks from the pool by taste alone.

## 4. Sharper UIUX (applies to `/jal-ui` and `/jal-immersive`)

- **Seeded direction pick (impeccable).**
  1. The agent writes 5 to 7 direction candidates drawn from the audience's world.
  2. JEV screens each one (`ui.direction_screen`: slop `noul` plus fit `score`).
  3. A deterministic seeded pick chooses among the survivors ranked 3 to 7.
  JEV screens, it does not rank-pick, because ranked picks collapse to the top idea.
- **Direction contract** written before code: audience, job, direction, type personality, accent role, density, motion intensity. The refero-derived "directions" are knob sets inside JAL Core, never a second design system.
- **Craft floor** (impeccable) plus refero statistics, added to `jal-ui-taste`:
  - measure 65 to 75ch
  - display tracking tokens
  - more space above a heading than below
  - selection, scrollbar, and cursor styling
  - a ban on icon-tile-above-heading, big-number hero, identical feature-card grids, and numbered section labels
- **New tokens:** `--color-accent` (one hue, never purple family, used for about 3% of the surface), a `--tracking-*` set, and a `--text-display-*` set above 48px for marketing and immersive heroes only.
- **Critique:** `ui.heuristics` (Nielsen's 10, scored 0 to 4) and a fresh-context final reviewer (`ui.finish_disposition`: ship, fix, rebuild, recapture). At most three fix rounds, each judged by a new critic.

## 5. Immersive workflow (`jal-immersive`)

1. Brief, visitor mode, and direction (the seeded pick above).
2. Section concepts.
3. Per section: `imm.gate`, then `imm.recipe`.
4. `imm.tech`: CSS-only, 2D canvas, WebGL (Three.js/R3F), or WebGPU/TSL with a WebGL fallback.
5. `imm.tier`: the per-device performance tier and the budget from `performance.md`.
6. Poster first: a static poster frame renders before any WebGL, and is the reduced-motion and low-power fallback.
7. Build:
   - three.js is loaded lazily with a dynamic `import()`.
   - The Draco, KTX2, and Basis decoders are copied to static files by the build script.
   - Lenis is synced with GSAP ScrollTrigger and the R3F frame loop.
   - Every object is disposed on unmount, and WebGL context loss is handled.
8. Motion: `motion.intensity`, `motion.choreography`, `motion.pin`.
9. Self-check, then `ui_audit` (19 rules plus the new `reduced-motion` rule) at every width.
10. Screenshots at 375 and 1280 (with the poster, and with the scene when the GPU allows it).
11. `imm.taste`, then `ui.finish_disposition` from a fresh-context review.

## 6. Mechanical changes

- `ui_audit`:
  - `[data-jal-exempt~="noyzzi"]` subtrees are exempt from the visual rules (light-background, gradient, shadow, stripe, purple, eyebrow, overlap).
  - The mechanical rules still apply there: min height, overflow, clipped text, reduced motion.
  - New rule `reduced-motion`: with `prefers-reduced-motion: reduce` emulated, no infinite CSS or WAAPI animation may be running, and no continuous `requestAnimationFrame` loop above 10 calls per second.
- Guard hook: noyzzi paths (`**/noyzzi/**`) are exempt from the gradient, shadow, and stripe checks. `remotion` and `@remotion/*` are added to the banned dependencies.
- MCP: `noyzzi_list` and `noyzzi_get` (sections and elements live, effects return their URL). Output is marked untrusted data, and code is reviewed before use (no network calls, no eval, no remote scripts).
- Template: `packages/ui/src/frames/` holds the JAL frame core: `FrameProvider`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `Sequence`, `Series`, `Player` (play, pause, scrub, reduced-motion aware). Tests use `bun test`.

## 7. Files (ownership for parallel work)

| Writer | Files |
|---|---|
| W-imm | `skills/jal-immersive/SKILL.md`, `skills/jal-immersive/references/{three-foundations,shaders,effects-cleanroom,particles-physics,performance,r3f}.md` |
| W-motion | `skills/jal-immersive/references/{scroll-choreography,frames}.md`, `templates/monorepo/packages/ui/src/frames/**`, `skills/jal-motion/SKILL.md` (the Three.js approval line, GSAP plugins) |
| W-comp | `skills/jal-motion/references/components.md` (magicui + animata recipes), stagger tokens note |
| W-taste | `skills/jal-design-system/references/{craft,directions}.md`, `skills/jal-ui-taste/SKILL.md` (craft floor, seeded direction pick, direction contract), `templates/monorepo/packages/ui/src/tokens.css` (accent, tracking, display tokens) |
| Lead | this spec, `skills/jal-jev/references/catalog.md` (new IDs), `skills/jal-immersive/references/noyzzi.md`, `agents/jal-immersive.md`, `commands/jal-immersive.md`, `agents/jal-ux.md`, `mcp/jal-design/**`, `hooks/**`, `README.md`, `THIRD_PARTY_NOTICES.md`, `.claude-plugin/plugin.json` (0.4.0) |

## 8. New JEV catalog IDs

- `ui.direction_screen`, `ui.heuristics`, `ui.finish_disposition`
- `imm.gate`, `imm.recipe`, `imm.tech`, `imm.tier`, `imm.taste`
- `motion.intensity`, `motion.choreography`, `motion.pin`

## 9. Acceptance

- Every new skill and reference file exists with no em-dash, and every JSON block in the catalog parses.
- Hook, MCP, and audit tests are green, including new fixtures for the noyzzi exemption and the reduced-motion rule.
- The template frame core has passing tests, and the template builds with three, R3F, and Tailwind through Bun.build in a proof project.
- A real headless `/jal-immersive` build of a one-page immersive site finishes with `ui_audit` PASS at every width, a JEV decision log, and screenshots.

## PAUSED checkpoint (2026-09-29, Brian asked to pause)

Branch `feat/immersive-v0.4.0` (built on the unmerged v0.3.0 branch). Last lead commit `7e5d1fe`. Nothing pushed, nothing merged.

Background jobs that were still running at pause (their edits are uncommitted until reviewed):
- W-material: full Material Web into JAL Core. It edits `jal-design-system` `components.md`, `foundations.md`, `sources.md`, `SKILL.md`, and the template `ui.css`.
- W-coverage: the 8 immersive repos audited file by file, with gap fills. It edits `jal-immersive` `SKILL.md` and its references, plus the new `coverage.md` and `procedural-geometry.md`, and adds Animata gaps to `jal-motion` `components.md`.
- The Halo `/jal-ui` immersive E2E in the scratch folder `e2e-imm`.

Resume, in order:
1. Review and commit W-material, then W-coverage (check the diffs and run the tests).
2. Add the OriginKit clean-room recipes R45 to R52 and the `md.*` rows to `jal-motion` `components.md` and `recipe-index.md`. Add a hallmark line to `sources.md`.
3. Fill the recipe-index spec gaps:
   - side nav
   - KPI tiles and charts
   - pricing, testimonial, hero, and footer blocks
   - the `live_dom` and `poster_steps` demo builds
   - the ocean mobile fallback
   - the law note for 2D canvas
4. Halo proof: check its result, run `ui_audit` at all widths, take screenshots at 375 and 1280, serve it locally for Brian, and read the JEV log.
5. Full verification:
   - hooks, MCP, template, and docs-site tests
   - the em-dash and frontmatter sweep
   - a headless plugin load that shows exactly 8 commands
6. Update the docs-site for the spectrum, the learning loop, GSAP in jal-immersive, and OriginKit.
7. With Brian's OK: merge to main, tag v0.3.0 and v0.4.0, push, and send the team update commands.

Waiting on Brian:
- a new koboyo key (koboyo.com/mcp)
- `COOLIFY_API_TOKEN` in his environment, for the jal-docs deploy step

SEO/GEO stays on hold.
