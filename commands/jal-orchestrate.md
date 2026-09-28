---
description: Run the full Pawang crew loop (owned workstreams, JEV-judged parallel dispatch, verify and commit, gate, memory) on a task.
argument-hint: <task description>
---

Task for this run: $ARGUMENTS

Act as `jal-lead` (or dispatch it via the Task tool when a subagent boundary is available) and run its full operating loop on the task above, per agents/jal-lead.md and skill jal-standards. Do not shortcut any stage of the loop.

## The crew

`jal-lead` dispatches into: jal-architect (stack/design gate), jal-ux (design system, taste, UI builds), jal-immersive (immersive and 3D sites and sections), jal-frontend (UI implementation), jal-backend (API/data/AI), jal-systems (Go/Rust gRPC sidecars), jal-security (hardening baseline), jal-redteam (offensive security), jal-blueteam (defensive security), jal-reviewer (code-review gate), jal-qa (tests/gate), jal-devops (deploy/CI/git safety), jal-researcher (websearch/verification), jal-jev (judge for a novel decision). UI and taste work routes to jal-ux, security work to jal-redteam and jal-blueteam.

## JEV judges soft calls

Soft calls go through `mcp__plugin_jal-aidev_jal-design__jev_decide` {state, questions, decision_id, domain} with question templates and thresholds per skill jal-jev. A JEV veto is final. Hard law (jal-standards, file ownership, the worker git ban, the 3-round cap, `JAL REVIEW: FAIL`) is mechanical and never sent to JEV. On `UNVERIFIED BY JEV`, fall back to own judgment and stamp the report line. Every call is secret-redacted and logged to `.jal/decisions/`.

## The loop

1. **Decompose into owned workstreams.** Write the FILE OWNERSHIP table before any dispatch: ID, owner, model, exclusive paths, depends on, acceptance, verify command. One owner per file per wave.
2. **Route and tier.** `orch.route` per workstream picks the specialist, `orch.model` per worker picks its model tier.
3. **Parallelize.** Overlapping ownership or a declared dependency means sequential. Every other same-wave pair gets `orch.parallel`. Every independent workstream goes out in ONE message, one dispatch call per worker.
4. **Brief like a new hire.** Exact requirement, owned paths, acceptance criteria, verify command, skill names, and the hard rules: touch only owned paths, never run git commit, checkout, reset, stash, restore, or clean, no em-dash, report real command output. An agent's `git checkout` once silently reverted another agent's edit, which is why workers never touch git state.
5. **Verify, then commit.** Re-run each worker's verify command yourself, check `git status --porcelain` against its ownership, then `git add <owned paths>` and commit. Never `git add -A`. A stray edit goes back to its worker.
6. **Gate.** Run `/jal-review` against the current repo state.
7. **Route every failing finding to its owner.** Ownership table owner first, else by class: UI, taste, emdash, ui_audit to jal-ux; API/DB/AI to jal-backend; sidecars to jal-systems; hardening to jal-security; exploitable findings to jal-blueteam with jal-redteam re-verifying; test gaps to jal-qa; deploy/CI/git to jal-devops; design mismatch to jal-architect. Independent fixes go out in parallel, same rules as steps 3 to 5.
8. **Exit or escalate.** `JAL REVIEW: PASS` is required to stop, then `orch.loop_exit` decides whether the loop may stop. Cap 3 fix rounds per finding, a survivor goes to Brian. `orch.escalate` decides every softer stop-and-ask.
9. **Memory.** `mem.promote` on each new learning: project gotchas to `.jal/memory/` per skill jal-memory (dated slug plus an `INDEX.md` line), universal learnings into the owning skill. Skip anything not worth a future agent's time.

## Escalation

Any subagent proposing tech outside the approved stack, or any default-LLM change away from gpt-4o-mini, gets routed to Brian for confirmation before it ships anywhere. jal-lead does not approve deviations on its own, and JEV does not decide them.
