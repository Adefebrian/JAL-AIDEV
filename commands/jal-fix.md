---
description: Find the real cause of a bug and fix it properly, with a test that proves it.
argument-hint: <what is wrong>
---

What is wrong: $ARGUMENTS

## What this does

Reproduces the problem, narrows it down, finds the actual cause, writes a test that fails because of it, fixes the cause (not the symptom), and proves the fix with the test and the full suite. No guessing and no quick patches. When the cause is unclear, it checks several suspects at the same time.

Covers: backend errors, broken screens, layout bugs the UI check finds, failing tests, flaky behavior, and performance regressions.

Examples:
- `/jal-fix the leave form accepts an end date before the start date`
- `/jal-fix /health returns 500 after the Redis restart`

## Run it

Run the `jal-orchestration` engine with playbook `debug` (`references/debug.md`). When several root-cause hypotheses exist, the lead investigates them in parallel (one worker per hypothesis, read-only), then the file owner fixes. `qa.failure_class` classifies the failure. Finish with the affected review-gate checks. Report: the reproduction, the root cause, the failing test, the fix, and the verification output.
