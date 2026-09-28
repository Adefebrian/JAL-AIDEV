---
description: Design and build any screen or website, a new screen, a redesign, or an immersive 3D site, beautiful, tidy, mobile-first, and checked automatically.
argument-hint: <what to build, or which screen or site to redesign>
---

What to work on: $ARGUMENTS

## What this does

One command for everything visual. The JEV judge first decides what kind of work it is:
- **product UI**: app screens, dashboards, forms, and tables. Calm, tidy, and fast.
- **marketing page**: landing pages and product pages. More expressive, with restrained motion.
- **immersive**: 3D heroes, WebGL and shader effects, scroll stories, and noyzzi pieces. Rich, but still fast on phones.

Then it:
1. On a redesign, it checks the current screen first and lists what is wrong before changing anything.
2. It explores several creative directions for your audience, lets JEV screen them, and commits to one fresh direction instead of the obvious first idea.
3. It plans every section: its purpose, one message, and one action. Sections without a purpose are left out. For each section JEV decides whether it belongs, how to lay it out, and how much motion it gets. For immersive sections JEV also picks which recipe to use from the whole library, or a combination:
   - noyzzi heroes, effects, and 3D objects
   - WebGL and shader effects, and particles
   - Magic UI and Animata motion
   - GSAP scroll stories
   - live product demos
4. It builds phone first with a real app-shell, then tablet, then desktop, on the one JAL design system: white background, nothing overlapping, and 44px controls. Outside noyzzi sections there are no shadows, gradients, or side lines. For 3D, a still poster shows first, motion calms down for people who ask for reduced motion, and heavy effects scale down on slower phones. Independent sections are built at the same time.
5. It proves the result with the automatic UI check at phone, tablet, and desktop widths (20 rules) and screenshots. For 3D it also runs a frame-speed check. A fresh reviewer then judges it. It fixes and repeats until everything passes.
6. It reports what it built, each decision with its confidence, where each effect came from, and the check results.

Examples:
- `/jal-ui a settings screen for team members and roles`
- `/jal-ui redesign the pricing page`
- `/jal-ui an immersive landing page for Halo, a smart desk lamp, with a 3D lamp hero`

## Run it

1. JEV `ui.experience` classifies the brief as `product_ui`, `marketing`, or `immersive`. A brief that names 3D, WebGL, shaders, noyzzi, or immersive is `immersive` without asking.
2. Dispatch `jal-ux` for `product_ui` and `marketing`, or `jal-immersive` for `immersive`. Each runs its pipeline from `agents/jal-ux.md` or `agents/jal-immersive.md` with no step skipped. jal-ux hands any single section that earns immersion (`imm.gate`) to jal-immersive.
3. For a multi-section page, once the section concepts are written, the lead agent splits the sections into owned files and builds them in parallel per the `jal-orchestration` engine.
4. It then integrates the sections and runs `ui_audit` at 320, 375, 414, 768, and 1280 until PASS (`SKIPPED` is never a pass).

Report back, tersely:
- the mode and lead agent
- the direction and the section concepts
- each JEV decision with its confidence and the action taken (stamp `UNVERIFIED BY JEV` where it applies)
- the recipe and source for each immersive section
- the files changed
- the `ui_audit` result per width, and the frame-time sample for 3D
- build and test status
