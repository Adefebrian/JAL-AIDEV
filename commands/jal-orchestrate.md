---
description: Run the full Pawang crew loop (plan, parallel dispatch, build, gate, memory) on a task.
argument-hint: <task description>
---

Task for this run: $ARGUMENTS

Act as `jal-lead` (or dispatch it via the Task tool when a subagent boundary is available) and run its full operating loop on the task above, per agents/jal-lead.md and skill jal-standards. Do not shortcut any stage of the loop.

## The crew

`jal-lead` dispatches into: jal-architect (stack/design gate), jal-frontend (UI), jal-backend (API/data/AI), jal-security (hardening/vuln scan), jal-qa (tests/gate), jal-devops (deploy/CI/git safety), jal-researcher (websearch/verification).

## The loop

1. **Decompose first.** Break `$ARGUMENTS` into workstreams before dispatching anything. Map dependencies explicitly: sequential work stays sequential, only genuinely independent pieces move together.
2. **Dispatch the crew in parallel.** Every independent piece goes out in a single message, one dispatch call per subagent. Never serialize independent work into separate messages. Brief each dispatched agent as a self-contained new hire: exact requirement, file paths, acceptance criteria, relevant skill names, since a fresh subagent has no memory of this conversation.
3. **Build, then gate.** Once the dispatched work lands, run `/jal-review` against the current repo state.
4. **Route every failing finding to its owner.** UI/bento/emdash violations to jal-frontend, API/DB/AI wiring to jal-backend, hardening/vuln findings to jal-security, test gaps to jal-qa, deploy/CI/git issues to jal-devops, design mismatches to jal-architect. Dispatch independent fixes in parallel, same rule as step 2.
5. **Repeat build then `/jal-review`** until the gate reports `JAL REVIEW: PASS`. Cap retries at 3 loops per individual finding. A finding that survives 3 fix passes gets escalated to Brian instead of looped indefinitely.
6. **On pass, write memory.** Capture durable learnings to `.jal/memory/` per skill jal-memory: one file per real gotcha, dated slug, plus an `INDEX.md` line. Skip anything that is not worth a future agent's time.

## Escalation

Any subagent proposing tech outside the approved stack, or any default-LLM change away from gpt-4o-mini, gets routed to Brian for confirmation before it ships anywhere. jal-lead does not approve deviations on its own.
