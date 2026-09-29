---
user-invocable: false
name: jal-adr
description: Architecture Decision Record discipline, when a change needs an ADR before code, the Context/Decision/Consequences/Status template, and numbering under docs/adr/NNNN-title.md. Use when proposing a non-trivial technical decision, introducing new tech outside the approved stack, or reviewing whether a PR should have shipped with an ADR.
---

# JAL ADR/RFC Discipline

A lightweight paper trail for decisions that are expensive to reverse. Not every change needs one, most do not. This skill decides which ones do and how to write them.

## When a change needs an ADR first

Write an ADR before writing code when the change is any of:

- Introducing a new dependency or technology outside the stack approved in `jal-standards` (this is already required there, the ADR is how the proposal to Brian gets recorded, not a separate optional step).
- Changing a module boundary in a way that reshapes `apps/api/src/modules/` (per `jal-architecture`), not just adding a module of the existing shape.
- Choosing between two materially different implementations of the same feature where the choice is hard to reverse later: a database schema shape, a queueing strategy, an auth flow.
- Any decision a future contributor would reasonably ask "why did we do it this way" about, where the answer is not obvious from the code.

Skip the ADR for anything reversible with a small diff: a new route on an existing module, a bug fix, a dependency version bump within the approved stack, a copy change.

## ADR template

```markdown
# NNNN. <short decision title>

## Status
Proposed | Accepted | Superseded by NNNN | Rejected

## Context
What problem forced this decision. What constraints applied (stack, timeline,
existing architecture). What alternatives were on the table.

## Decision
The decision, stated plainly in one or two sentences. Not a summary of the
discussion, the actual call.

## Consequences
What this makes easier, what it makes harder, what it forecloses. Include the
concrete tradeoff, not just the upside. If this required Brian's sign-off per
jal-standards, note that the sign-off was obtained, and when.
```

- Keep it short. An ADR that takes fifteen minutes to write and two minutes to read gets used; a ten-page design doc gets skipped next time.
- Status starts at `Proposed` while awaiting sign-off (for example Brian's approval for an out-of-stack dependency), moves to `Accepted` once approved and shipped, `Rejected` if declined, `Superseded by NNNN` if a later ADR reverses it. Never delete or rewrite a superseded ADR's history.

## Numbering: docs/adr/NNNN-title.md

- ADRs live in `docs/adr/` at the repo root, one file per decision.
- Filename: `NNNN-kebab-case-title.md`, a four-digit zero-padded sequence number, for example `0001-modular-monolith-over-microservices.md`, `0002-go-sidecar-for-image-resize.md`.
- Numbers increment sequentially and are never reused, even for a `Rejected` ADR, the number still marks its place in the timeline.
- Link related ADRs by number in the `Context` or `Consequences` section ("supersedes 0004", "see also 0007") rather than duplicating their content.
