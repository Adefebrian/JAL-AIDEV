---
description: Invoke jal-principal to run the full senior loop on a feature, brainstorm, spec, owned-workstream plan, JEV-judged parallel build, review gate, ship call, memory.
argument-hint: <feature description>
---

Feature to ship: $ARGUMENTS

Dispatch agent `jal-principal` (via the Task tool) to own this feature end to end, per `agents/jal-principal.md` and skill `jal-standards`. `jal-principal` sets direction and the quality gate but delegates execution, it does not write bulk code itself. Do not shortcut any stage below.

JEV judges soft calls through `mcp__plugin_jal-aidev_jal-design__jev_decide` {state, questions, decision_id, domain}, question templates and thresholds per skill `jal-jev`. A JEV veto is final. Hard law is mechanical and never sent to JEV. On `UNVERIFIED BY JEV`, fall back to own judgment and stamp the report line. Every call is logged to `.jal/decisions/`.

## The senior loop

1. **Brainstorm.** Explore intent, constraints, and open questions on `$ARGUMENTS` before any spec exists. Surface ambiguity to Brian rather than guessing, `orch.escalate` decides when a gap is worth the ask.
2. **Spec.** Turn the brainstorm into a concrete spec: scope, interfaces, acceptance criteria.
3. **Plan.** Break the spec into workstreams with a FILE OWNERSHIP table (ID, owner, model, exclusive paths, depends on, acceptance, verify command), one owner per file per wave. `orch.route` fills owners, `orch.model` fills model tiers.
4. **Parallel subagent build.** Overlap or dependency means sequential, every other same-wave pair gets `orch.parallel`. Dispatch to `jal-lead`, which runs the `/jal-orchestrate` loop across the crew; every independent piece goes out in one message. Workers touch only their owned paths and never run git commit, checkout, reset, stash, restore, or clean. The lead re-runs each worker's verify command, checks ownership with `git status --porcelain`, and commits only that worker's paths.
5. **Review gate.** Run `/jal-review` against the resulting repo state. Route every failing finding to its owning specialist, rebuild, and re-run until `JAL REVIEW: PASS` and `orch.loop_exit` agree the loop may stop. Cap 3 fix rounds per finding, escalate any survivor to Brian.
6. **Ship call.** `jal-principal` does its own review pass, then runs `rev.ship` as the final go/no-go. A no-go goes back to step 5.
7. **Memory.** `mem.promote` on each new learning: project gotchas to `.jal/memory/` per skill `jal-memory` (one file plus an `INDEX.md` line), universal learnings into the owning skill.

## Escalation

Any proposal to use tech outside the approved stack, or any default-LLM change away from gpt-4o-mini, routes to Brian for confirmation before it ships. `jal-principal` does not approve deviations unilaterally, neither does this command, and neither does JEV.

Report the final gate result, the `rev.ship` verdict (or `UNVERIFIED BY JEV`), and the memory entries written. Stay terse.
