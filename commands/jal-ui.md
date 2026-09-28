---
description: Build a new screen or redesign an existing one to the JAL standard, tidy, modern, mobile-first, and checked automatically.
argument-hint: <what to build, or which screen to redesign>
---

What to work on: $ARGUMENTS

## What happens

1. It works out whether this is a new screen or a redesign of one that already exists. For a redesign it checks the current screen first and lists what is wrong before changing anything.
2. It plans every section before drawing it: what the section is for, the one message it carries, and the one action it offers. Sections with no clear purpose are left out.
3. It picks the design system that fits the product, and decides for each section whether it belongs and how it should be laid out. These calls are made by the JEV judge, not by guesswork.
4. It builds phone first, then tablet, then desktop, on the shared JAL design tokens: white background, one quiet accent at most, nothing overlapping, nothing sticking out of its box, no shadows, no gradients, no side lines on cards.
5. It proves the result with the automatic UI check at phone, tablet, and desktop widths, fixes anything the check finds, and repeats until it passes.
6. It reports back what it built, each decision it made and how confident it was, and the result of the UI check.

## Run it

Dispatch agent `jal-ux` with the full request: $ARGUMENTS

`jal-ux` runs its pipeline from `agents/jal-ux.md` in order, with no step skipped: read the brief or audit the existing UI, write a concept for every section, JEV `ui.lens`, the Astryx frame and region workflow, JEV `ui.region_gate` per section and major component, an optional designmd reference only after JEV `ui.designmd_screen` passes, build on JAL Core tokens mobile-first, motion per `jal-motion`, the hard-law self-check, `ui_audit` at 320, 375, 414, 768, and 1280 until PASS (`SKIPPED` is never a pass), JEV `ui.final_taste`, screenshots at 375 and 1280, then the decision log.

Report back, terse: mode (new or redesign), the section concepts, each JEV decision with confidence and the action taken (stamp `UNVERIFIED BY JEV` where it applies), what was built or changed by file, the final `ui_audit` result per width, and build and test status.
