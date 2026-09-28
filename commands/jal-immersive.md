---
description: Build or redesign an immersive, animated, or 3D website to the JAL standard, beautiful, fast, mobile-friendly, and checked automatically.
argument-hint: <what to build, or which site to redesign>
---

What to work on: $ARGUMENTS

## What happens

1. It works out whether this is a new site or a redesign. For a redesign it checks the current site first and lists what is wrong.
2. It explores several creative directions for your audience, has the JEV judge screen them, and commits to one fresh direction instead of the obvious first idea.
3. It plans every section, then decides section by section whether it deserves 3D or rich motion at all. The rest stays calm and clean.
4. For each immersive section it picks the best recipe from the whole library: noyzzi heroes, effects, and 3D objects, WebGL and shader effects, particles, magicui and animata motion, GSAP scroll stories, and live product demos. It can also combine them. JEV makes these picks.
5. It builds phone first. A still poster frame shows first, and the 3D loads after it. Motion calms down for people who ask their device to reduce motion, and heavy effects scale down on slower phones.
6. It proves the result with the automatic UI check at phone, tablet, and desktop widths, screenshots, and a frame-speed check. It fixes what it finds and repeats until everything passes.
7. It reports what it built, each decision and how confident JEV was, where each effect came from, and the check results.

## Run it

Dispatch agent `jal-immersive` with the full request: $ARGUMENTS

`jal-immersive` runs its pipeline from `agents/jal-immersive.md` in order, with no step skipped:
1. brief or audit
2. seeded direction pick screened by `ui.direction_screen`, then the direction contract
3. section concepts
4. `imm.gate` per section
5. `imm.recipe` over the combined pool, with `noyzzi_get` for noyzzi picks
6. `imm.tech` and `imm.tier`
7. `motion.intensity`, `motion.choreography`, and `motion.pin`
8. a poster-first build
9. the self-check
10. `ui_audit` at 320, 375, 414, 768, and 1280 until PASS (`SKIPPED` is never a pass), plus screenshots and a frame-time sample
11. `imm.taste`, then the fresh-context `ui.heuristics` and `ui.finish_disposition`
12. the decision log

Report back, terse: mode, direction, section concepts, each JEV decision with confidence and action (stamp `UNVERIFIED BY JEV` where it applies), the recipe and source per section, the tier, files changed, the `ui_audit` result per width, the frame-time sample, and build and test status.
