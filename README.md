# jal-aidev

JAL engineering guardrails and Pawang agent crew for Claude Code.

## Install

```
/plugin marketplace add JAL-Group/JAL-AIDEV
/plugin install jal-aidev
```

## Agents

| Agent | Role |
|-------|------|
| jal-principal | Head assistant, Principal/Staff-grade direction, architecture bar, and final ship gate |
| jal-lead | Project leadership and parallel crew orchestration |
| jal-architect | System design and technical specifications |
| jal-frontend | Frontend development and UI implementation |
| jal-ux | Design system ownership and cross-surface visual taste |
| jal-backend | Backend services and infrastructure |
| jal-systems | Go/Rust gRPC sidecars for hot paths Bun cannot serve |
| jal-security | Security audits and vulnerability assessment |
| jal-reviewer | Code review, module-boundary, and simplification gate |
| jal-redteam | Offensive security passes, exploit-or-disprove verification |
| jal-blueteam | Defensive hardening, detection, and fix-and-verify triage |
| jal-qa | Quality assurance and test coverage |
| jal-devops | Deployment and operational infrastructure |
| jal-researcher | Investigation and technical research |

## Commands

`/jal-scaffold` - Scaffold a new JAL Bun monorepo from the JAL-AIDEV template, install deps, commit, and verify the build.

`/jal-orchestrate` - Run the full Pawang crew loop (plan, parallel dispatch, build, gate, memory) on a task.

`/jal-review` - Run the consolidated guideline, security, and QA gate on the repo and emit one PASS/FAIL report.

`/jal-ship` - Invoke jal-principal to run the full senior loop on a feature: brainstorm, spec, plan, parallel subagent build, review gate, memory.

`/jal-ui` - Invoke jal-ux to audit then fine-tune or rebuild a frontend to the JAL taste standard, from scratch or existing.

`/jal-audit` - Deep scan of the repo: security, architecture drift, dependency audit, dead code, bundle size, one consolidated report.

`/jal-pentest` - Red team attacks via jal-redteam, blue team triages and fixes via jal-blueteam, single PASS/FAIL report with findings.

`/jal-pr` - Run the jal-reviewer gate and /jal-review, then open a conventional-commit PR with a checklist. Never force-merges.

`/jal-deploy` - Deploy a tagged image to Coolify at deploy.jalgroup.id only, run a health check, and support one-command rollback to the last stable tag.

`/jal-module` - Scaffold a compliant domain module into apps/api/src/modules/<name>/, register it in the app assembly, and verify module boundaries.

`/jal-service` - Scaffold a Go or Rust gRPC sidecar in services/<name>/ with a Bun-side typed client, only for a hot path Bun cannot serve.

`/jal-migrate` - Run the Postgres migration runner (tools/migrate.ts) over migrations/*.sql. Supports up, down, and create.

`/jal-release` - Cut a release with changesets, version bump, changelog generation, and a git tag.

`/jal-adr` - Create the next-numbered Architecture Decision Record in docs/adr/ from the standard template.

`/jal-debug` - Systematic debugging of a symptom: reproduce, isolate, root-cause, failing test, fix, verify. No guess-patching.

## Skills

15 skills back the agents and commands above: `jal-standards` (the JAL engineering constitution, read before building or reviewing any JAL project), `jal-scaffold`, `jal-frontend-rules`, `jal-ui-taste`, `jal-security-hardening`, `jal-qa-automation`, `jal-git-safety`, `jal-memory`, `jal-architecture` (modular-monolith module boundaries), `jal-rpc` (Bun-to-sidecar client generation), `jal-polyglot` (Go/Rust service conventions), `jal-adr`, `jal-release` (changesets workflow), `jal-redteam-ops`, and `jal-blueteam-ops`.

## Docs website

A static docs site lives in `docs-site/`: architecture, agent/skill/command reference, and study cases for the JAL-AIDEV plugin, built with Bun (no Vite, no Next.js). Build and serve it locally with:

```
cd docs-site && bun install && bun run build
bun run serve
```

## Icons

Icons powered by koboyo (https://koboyo.com). Fallback icon source: https://reicon.dev.

## Specification

Full design specification: [docs/superpowers/specs/2026-08-06-jal-aidev-design.md](docs/superpowers/specs/2026-08-06-jal-aidev-design.md)

## Requirements

Bun must be installed and on PATH; the guardrails PreToolUse hook runs via `bun`.
