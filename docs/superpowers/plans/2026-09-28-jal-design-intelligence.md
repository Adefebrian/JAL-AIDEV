# JAL Design Intelligence (v0.3.0): build plan

Spec: `docs/superpowers/specs/2026-09-28-jal-design-intelligence-design.md`. Branch: `feat/design-intelligence-v0.3.0`.
Research digests (inputs): `<scratchpad>/ds-research/{astryx,carbon,material,bang-motion,designmd}.md`.

## Rules for every parallel worker

- Touch ONLY the files you own. Other workers are editing other files at the same time.
- Never run `git commit`, `git checkout`, `git reset`, `git stash`, `git restore`, or `git clean`. The controller commits.
- No em-dash anywhere in any file you write.
- Report: files written, commands run with real output, open concerns.

## Wave 1 (parallel, disjoint files)

| ID | Owner agent | Owns | Deliverable |
|----|-------------|------|-------------|
| W1a | jal-backend | `mcp/jal-design/jev.ts`, `mcp/jal-design/server.ts`, `mcp/jal-design/*.test.ts` for those | JEV client + zero-dep stdio MCP server + CLI |
| W1b | jal-qa | `mcp/jal-design/audit.ts`, `mcp/jal-design/audit.test.ts`, `mcp/jal-design/fixtures/*` | CDP UI audit + bad/good fixtures |
| W2 | jal-frontend | `hooks/guardrails.mjs`, `hooks/guardrails.test.mjs` | write-time blocks: gradient, blurred shadow, side stripe, emoji |
| W3 | jal-ux | `skills/jal-ui-taste/SKILL.md`, `skills/jal-standards/SKILL.md`, `skills/jal-frontend-rules/SKILL.md` | core token + law rewrite |
| W4 | jal-ux | `skills/jal-design-systems/**` | lens skill + astryx/carbon/material references |
| W5 | jal-ux | `skills/jal-motion/**` | motion skill |
| W6 | jal-ux | `templates/monorepo/packages/ui/src/tokens.css`, `templates/monorepo/packages/ui/src/ui.css` (and template web CSS only if a token rename forces it) | template adopts new core tokens, stays green |

### Shared interfaces (W1a and W1b must match exactly)

```ts
// audit.ts (W1b)
export type Violation = { rule: string; width: number; selector: string; detail: string };
export type AuditReport = { status: "PASS" | "FAIL" | "SKIPPED"; reason?: string; widths: number[]; violations: Violation[] };
export async function runAudit(url: string, opts?: { widths?: number[]; chromePath?: string; timeoutMs?: number }): Promise<AuditReport>;

// jev.ts (W1a)
export type JevQuestion =
  | { type: "choice"; instructions: unknown; criteria: Record<string, unknown> }
  | { type: "score"; instructions: unknown; criteria: unknown[] }
  | { type: "noul"; instructions: unknown };
export type JevResult =
  | { verified: true; model: string; answers: Record<string, unknown> }
  | { verified: false; stamp: "UNVERIFIED BY JEV"; error: string };
export async function decide(
  req: { state: unknown; questions: Record<string, JevQuestion> },
  opts?: { apiKey?: string; fetchImpl?: typeof fetch; retries?: number; baseDelayMs?: number; timeoutMs?: number },
): Promise<JevResult>;
```

Server (W1a): newline-delimited JSON-RPC 2.0 over stdio. Methods `initialize` (echo client protocolVersion, serverInfo `jal-design`), `notifications/initialized`, `tools/list`, `tools/call`. Tools: `jev_decide` {state, questions} and `ui_audit` {url, widths?}. CLI: `bun server.ts decide <file|->` and `bun server.ts audit <url>`. Key from env `JEV_API_KEY`. Endpoint `https://api.typesafe.ai/v1/systemone`, model `jev-latest`.

## Wave 2 (after W1a..W5)

- **W7 integration** (controller or jal-ux): rewrite `agents/jal-ux.md`, update `agents/jal-frontend.md`, rewrite `commands/jal-ui.md`, wire `.mcp.json` (jal-design + designmd), update `README.md`, bump `plugin.json` to 0.3.0.

## Wave 3

- **W8 verification**: hook tests, MCP stdio round trip, live JEV call, audit FAILs bad fixture and PASSes good fixture, template green and starter passes audit, then a real `/jal-ui` build from zero with JEV log + audit PASS + screenshots at 375 and 1280.

## Wave 2b: JEV as judge across all of JAL-AIDEV (added by Brian, 2026-09-28)

JEV judges bounded decisions in every domain; agents still create. Hard law stays mechanical and outside JEV.

| ID | Owner agent | Owns | Deliverable |
|----|-------------|------|-------------|
| W1c | jal-backend | `mcp/jal-design/jev.ts`, `mcp/jal-design/server.ts`, their tests | secret redaction before send, decision log to `.jal/decisions/*.jsonl`, `decision_id` param |
| W9 | jal-principal | `skills/jal-jev/**`, `agents/jal-jev.md` | decision catalog (IDs, questions, thresholds, state guidance) + the judge agent |
| W10 | jal-lead | the 12 non-UI agents, `commands/jal-orchestrate.md`, `commands/jal-ship.md`, `commands/jal-review.md`, `hooks/session-context.sh`, `hooks/prompt-reminder.sh` | JEV decision points wired into every agent, advanced parallel orchestration protocol, auto-routing on every run |

Decision catalog IDs (shared contract for W9 and W10): `orch.route`, `orch.parallel`, `orch.model`, `orch.escalate`, `orch.loop_exit`, `ui.lens`, `ui.region_gate`, `ui.designmd_screen`, `ui.final_taste`, `be.placement`, `be.api_quality`, `be.migration_risk`, `be.new_tech`, `sec.severity`, `sec.false_positive`, `sec.ship_block`, `sec.input_screen`, `qa.failure_class`, `qa.test_selection`, `qa.coverage`, `qa.release_go`, `rev.risk`, `rev.ship`, `mem.promote`.

MCP tool names (verify after install): `mcp__plugin_jal-aidev_jal-design__jev_decide`, `mcp__plugin_jal-aidev_jal-design__ui_audit`, `mcp__plugin_jal-aidev_designmd__*`.

## Queue after v0.3.0 (Brian, 2026-09-28), in order

3. **Docs agent + command -> JAL-Group/malasbaca.** Auto-generate comprehensive technical AND non-technical documentation of what a project builds, detect existing docs and update them instead of duplicating, and never hallucinate. Seeds:
   - malasbaca is a Bun APP (auth.ts, login.html, build.ts, serve.ts, src/, Dockerfile, HANDOVER.md), not a plain docs folder. Study its content model first and write in that model.
   - Evidence-only: every doc claim must trace to evidence (file tree, code, tests, git log and diffs, ADRs, .jal/decisions). JEV gates each claim with a noul "supported by this evidence?" and drops unsupported claims; JEV also picks update-existing vs new-page vs no-change per section.
   - Publishing to malasbaca is an outward write to another repo: default to a branch plus PR, not a direct push to main, unless Brian says otherwise.
4. **Command compaction.** Fold the command set into as few entry points as possible (ideally one) that route by intent, JEV-routed. The docs command from item 3 folds in too.
   Brian's requirements (2026-09-28):
   - Plain language, not technical. A teammate must know what a command is FOR from its name and one-line description alone, without knowing which agents, skills, or sub-commands it runs.
   - Easy to use: describe the goal in normal words; the command figures out the rest.
   - One command bundles several commands, agents, and skills and runs them automatically (JEV routes); internals stay hidden unless the user asks.
   - Output tells the user in plain words what was done and what to do next.
   - Open design question to settle with Brian at the start of this phase: one master command (for example `/jal <goal>`) versus a very small set of plain-verb commands (build, fix, check, ship, docs). The trade-off is simplicity versus discoverability.
5. **SEO / GEO agent. BLOCKED: do not start.** Brian will supply the instructions first. Do not design, scaffold, or execute anything for it until those arrive.

## PAUSED 2026-09-28 (Brian stepped away). Resume here.

Branch `feat/design-intelligence-v0.3.0`, all local, nothing pushed yet.

Done and committed: W1a jev+server, W1b audit (17 rules incl. overlap, overflow-parent, clipped-text, icon-text-collision), W1c redaction+decision log, W2 hook blocks (gradient, shadow, side stripe, emoji), W3 core taste and law (rule 0 no overlap, border-control #8f8e89), W4 design-system lenses, W5 motion, W6 template tokens + ui.css, W9 JEV catalog + jal-jev agent, W10 JEV in all 12 non-UI agents + orchestration + /jal-review gates, plus .mcp.json wiring (jal-design, designmd) and session hooks.

Not done:
1. W7a was STOPPED mid-work. Only `templates/monorepo/packages/ui/src/tokens.css` has an uncommitted partial edit; review it or discard and redo. Still to do: rewrite agents/jal-ux.md (pipeline + exact tool list, omitting designmd upload/delete), update agents/jal-frontend.md, rewrite commands/jal-ui.md in plain language, tokens (border-control, per-status borders, scrim, 640px Bento comment), ui.css (control border, 640px Bento, no-overflow rows, chevron padding). Audit rule names to reference are the 17 above.
2. README + plugin.json to 0.3.0.
3. W8 verification: fresh plugin update, confirm agents see the MCP tools (headless `claude -p` tool listing), audit bad/good fixtures, audit the template starter, real /jal-ui build from zero with JEV log + ui_audit PASS + screenshots at 375 and 1280.
4. Merge to main, tag v0.3.0, push, give team update commands.

Open decision for Brian: /jal-review treats a SKIPPED ui_audit (no Chrome) as FAIL for frontend projects. Kept strict pending his call.
