---
description: Check the whole project against every JAL rule and get one clear PASS or FAIL, with security and a deep audit when it matters.
argument-hint: [quick | full | deep] [what to focus on]
---

What to check: $ARGUMENTS

## What this does

Runs every check at the same time and gives one report with one answer, PASS or FAIL, plus exactly what to fix. The JEV judge picks how deep to go, unless you say `quick`, `full`, or `deep`.

- **quick**: the rules scan, tests, and the UI check.
- **full** (default): everything in quick, plus security hardening, a boot test of the real app, the security ship block, and the final ship judgment.
- **deep**: everything in full, plus a deep audit (architecture drift, dependency audit, dead code, bundle size) and a red team versus blue team pentest that tries to break in and fixes what it finds.

Examples:
- `/jal-check`
- `/jal-check deep before the launch`

## Run it

Run the `jal-orchestration` engine with playbooks `review-gate` (always), `audit`, and `pentest`, with depth from the user's word or `qa.check_depth`. Independent checks run in parallel (W2 of the engine). Emit the review-gate report, adding the `JAL AUDIT` and `JAL PENTEST` blocks at deep depth, and end with exactly `JAL CHECK: PASS` or `JAL CHECK: FAIL`. At full and deep depth, route fixes to their owners only if the user asked to fix; otherwise report.
