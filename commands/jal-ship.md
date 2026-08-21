---
description: Invoke jal-principal to run the full senior loop on a feature, brainstorm, spec, plan, parallel subagent build, review gate, memory.
argument-hint: <feature description>
---

Feature to ship: $ARGUMENTS

Dispatch agent `jal-principal` (via the Task tool) to own this feature end to end, per `agents/jal-principal.md` and skill `jal-standards`. `jal-principal` sets direction and the quality gate but delegates execution, it does not write bulk code itself. Do not shortcut any stage below.

## The senior loop

1. **Brainstorm.** Explore intent, constraints, and open questions on `$ARGUMENTS` before any spec exists. Surface ambiguity to Brian rather than guessing.
2. **Spec.** Turn the brainstorm into a concrete spec: scope, interfaces, acceptance criteria.
3. **Plan.** Break the spec into workstreams with explicit dependencies, sequential work stays sequential, only genuinely independent pieces run together.
4. **Parallel subagent build.** Dispatch independent workstreams to `jal-lead`, which fans out to jal-architect, jal-frontend, jal-backend, jal-security, jal-qa, jal-devops, jal-researcher as needed, matching the `/jal-orchestrate` loop. Every independent piece goes out in one message.
5. **Review gate.** Run `/jal-review` against the resulting repo state. Route every failing finding to its owning specialist, rebuild, and re-run the gate until it reports `JAL REVIEW: PASS`. Cap retries at 3 loops per finding, escalate anything that survives 3 passes to Brian instead of looping indefinitely.
6. **Memory.** On pass, write durable learnings to `.jal/memory/` per skill `jal-memory`, one file per real gotcha plus an `INDEX.md` line.

## Escalation

Any proposal to use tech outside the approved stack, or any default-LLM change away from gpt-4o-mini, routes to Brian for confirmation before it ships. `jal-principal` does not approve deviations unilaterally, and neither does this command.

Report the final gate result and the memory entries written. Stay terse.
