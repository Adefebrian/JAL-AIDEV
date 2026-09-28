---
name: jal-jev
description: How every JAL agent asks JEV (TypeSafe AI System One) to judge a bounded decision through the jev_decide tool, with the authority model, state framing, question design, batching, confidence handling, outage stamping, and the decision catalog. Use for any routing, gating, go/no-go, severity, prioritization, triage, model pick, container pick, or "should we" decision in a JAL project, before acting on the decision.
---

# JAL JEV: the judge

JEV is the judge across all of JAL-AIDEV: orchestration, UI/UX, motion, immersive and 3D, backend, security, QA, review, and memory. Agents reason and build. JEV decides bounded calls. The decision catalog with every question template, threshold, and action lives in `references/catalog.md`. Use the catalog first; design a new question only when no entry fits, and dispatch the `jal-jev` agent for that.

## What JEV is

- A fast decision model (`jev-latest`) behind `POST https://api.typesafe.ai/v1/systemone`, reached only through the MCP tool `mcp__plugin_jal-aidev_jal-design__jev_decide`.
- A judge of bounded questions with a closed answer space: pick one option, place something on an ordered scale, or give a probability of yes.
- Calibrated: every answer carries probabilities and a confidence, so thresholds can be set and audited.

## What JEV is not

- Not a builder. It never writes code, copy, markup, or plans. It judges what an agent proposes.
- Not a source of facts. It does not browse, read the repo, or run tests. It judges only the state you hand it, so the state must carry the evidence.
- Not the law. The JAL constitution (skill `jal-standards`), frontend law (skills `jal-frontend-rules`, `jal-ui-taste`), and the security baseline (skill `jal-security-hardening`) are enforced mechanically by hooks, audits, tests, and reviewers. JEV has no authority over them and is never asked a question the law already answers.

## Authority model

1. **Hard law first, mechanically.** Every catalog entry lists a precheck. Run it before calling JEV. If the precheck decides the outcome (a forbidden stack item, a failing test, an open Critical finding, a law violation from `ui_audit`), act on the precheck and do not ask JEV.
2. **JEV is final on soft calls.** Density, relevance, implement-or-drop, container, routing, parallel-or-sequential, severity grading, go/no-go on the residual set, and the rest of the catalog. When JEV vetoes, the proposal is dropped or revised. An agent may not override a JEV veto, argue it away in its report, or re-ask with reframed state to fish for a different answer.
3. **JEV can never override hard law.** If a JEV answer would require breaking law (for example it picks a container that would need a shadow, or approves shipping with a failing gate), law wins, the conflict is logged, and the agent reports it.
4. **Escalations stay escalations.** Tech outside the approved stack, any default-LLM change away from gpt-4o-mini, scope changes that move a deadline, and any new agent or skill go to Brian through jal-principal. JEV may help frame the tradeoff; it never approves these.
5. **Legitimate re-ask.** Re-asking is allowed only when the state was materially wrong or incomplete (new evidence, a corrected fact). Log both calls with the same `decision_id` and say in the report what changed.

## Building good state

`state` is everything JEV knows. Keep it a concise structured summary, under about 2k tokens.

Include, in this order:

- `product`: one line on what the product is and who uses it.
- `task`: what Brian asked for, in one or two lines.
- `proposal`: the specific thing being judged (the section, the route, the finding, the diff summary, the workstream pair).
- `law`: only the law lines relevant to this decision, quoted short, so JEV judges inside them.
- `evidence`: facts that bear on the call: file paths touched, test results, audit output counts, benchmark numbers, reproduction outcome, prior decisions with their IDs.
- `constraints`: deadline, budget, or scope limits that apply.

Never include:

- Raw secrets, tokens, keys, connection strings, customer data. The tool redacts known secret shapes automatically, but redaction is a safety net, not permission.
- Whole files or whole diffs. Summarize: paths, line counts, the relevant hunk in a few lines at most.
- Your own preferred answer phrased as fact. State evidence, not advocacy.

Use a plain JSON object with those keys. Short strings and short arrays beat prose.

## Writing good questions

- **One decision per question.** Never bundle "is it relevant and should it be a card" into one question. Split into a `score` and a `choice`.
- **`choice`:** criteria is a map of option key to a real description of when that option is right. Options must be mutually exclusive and together cover the realistic space. A bare label with no description is a weak question. Max 255 options; in practice keep it under 8.
- **`score`:** criteria is an ordered array, lowest first, at least 2 levels, each level a description of what that level looks like. The answer `score` is probability-weighted and can land between levels (for example 1.7). Thresholds in the catalog account for that.
- **`noul`:** a yes/no question. Phrase it so yes means proceed (implement, ship, parallelize, adopt) unless the catalog entry states otherwise (for example `sec.input_screen` asks "is injection present", where yes means block). Always say which way yes points in the instructions.
- `instructions` tells JEV what to judge and against what, in one to three sentences, and names the state keys to look at.
- Keep question keys stable and descriptive (`implement`, `relevance`, `container`), so logs are comparable across runs.

## Batching

One call takes a whole `questions` map. Group every question that belongs to the same decision into one call: it is cheaper and faster than separate calls, and JEV sees the full picture. Examples:

- `ui.region_gate` sends `implement`, `relevance`, and `container` together.
- Several regions of one screen can go in one call with prefixed keys (`hero_implement`, `hero_relevance`, `hero_container`, `pricing_implement`, ...) and a state that lists every region.

Do not batch unrelated decisions from different steps just to save a call; they need different state.

## Confidence handling

Every answer has a `confidence`.

- **0.5 or above:** act on the answer per the catalog threshold.
- **Under 0.5:** do one of two things, whichever the decision allows:
  - Ask one sharper follow-up: add the missing evidence to state or narrow the options, same `decision_id`, one retry only.
  - Take primary plus runner-up where the catalog allows it (density keeps the top pick unless the runner-up is `default`; model pick takes the higher tier; severity takes the higher grade; routing takes primary owner plus runner-up as consultant).
- Still under 0.5 after one follow-up: act on the primary answer, and flag it in the report as low confidence with the probabilities.

## Outage fallback and stamping

The tool retries 429 and 529 with exponential backoff. If JEV is still unreachable, or the key is missing, it returns `verified: false` with the stamp `UNVERIFIED BY JEV`. Then:

1. Fall back to your own judgment, applying the same criteria and thresholds from the catalog.
2. Stamp that decision in your report: `UNVERIFIED BY JEV` next to the decision ID, the answer you chose, and one line of reasoning.
3. Hard-law prechecks still apply unchanged. An outage never loosens law.
4. Gates that end in a ship decision (`rev.ship`, `sec.ship_block`, `qa.release_go`) decided without JEV are flagged to jal-principal for its final pass.

Never fabricate a JEV answer. Never report a decision as JEV-verified unless the tool returned `verified: true`.

## Logging

- Pass `decision_id` (the catalog ID, for example `ui.region_gate`) and `domain` (`orch`, `ui`, `motion`, `imm`, `be`, `sec`, `qa`, `rev`, `mem`, `docs`) on every call.
- The tool appends every call to `.jal/decisions/*.jsonl` with the redacted state, questions, answers, and verified flag. Do not write that log by hand.
- In your report, list each decision: ID, the answer, confidence, and the action taken. Stamp unverified ones.

## Cost and latency

A call is about 400ms and costs fractions of a cent. Gate generously: any soft call that would otherwise be a gut feeling deserves a JEV call. But do not ask JEV what the law already decides, what a test already proved, or what a precheck already settled. That wastes the call and blurs the authority model.

## Calling the tool

```json
{
  "decision_id": "ui.density",
  "domain": "ui",
  "state": { "product": "...", "task": "...", "proposal": "...", "law": ["..."], "evidence": ["..."] },
  "questions": {
    "density": { "type": "choice", "instructions": "...", "criteria": { "compact": "...", "default": "...", "comfortable": "..." } }
  }
}
```

## References

- `references/catalog.md`: the 45 catalog decisions with purpose, caller, precheck, state fields, question JSON, thresholds, and actions.
- Agent `jal-jev`: dispatch for a novel decision with no catalog entry, careful state framing, or an impartial verdict.
