# jal-aidev

JAL engineering guardrails and the Pawang agent crew for Claude Code. It builds backend, frontend, and UI to one JAL standard, judges its own decisions with JEV, and proves the UI with an automatic check before calling anything done.

## Install

New teammate (needs GitHub access to `JAL-Group/JAL-AIDEV`, for example `gh auth login`):

```
claude plugin marketplace add JAL-Group/JAL-AIDEV
claude plugin install jal-aidev@jal-aidev-marketplace
```

Update to the latest version:

```
claude plugin marketplace update jal-aidev-marketplace
claude plugin update jal-aidev@jal-aidev-marketplace
```

Use the full name `jal-aidev@jal-aidev-marketplace`; the short name `jal-aidev` fails with "Plugin not found". After installing or updating, fully quit and reopen Claude so the new agents, skills, and tools load.

## How it works

- **The crew.** Any real task goes through the Pawang crew: jal-principal sets direction, jal-lead splits the work and runs independent pieces in parallel, specialists build, and the review gate decides when it is done.
- **JEV is the judge.** JEV (TypeSafe's decision model) makes the small, bounded calls: which specialists a task needs, what can run in parallel, how dense tables and lists should be, whether a section is worth building, how severe a security finding is, whether a release is ready. Its verdict on those calls is final. Every decision is logged in `.jal/decisions/` so you can see why. Secrets are stripped before anything is sent.
- **Hard law is mechanical.** The JAL rules (Bun only, no gradients, no shadows, no side lines on cards, no overlap, white-first, no emoji or em-dash, and the rest in `jal-standards`) are enforced by a write-time guard and by checks. JEV can never override them.
- **UI is proven, not promised.** The automatic UI check opens the page in Chrome at 320, 375, 414, 768, and 1280 pixels wide and fails on overlap, anything sticking out of its container, clipped text, side stripes, shadows, gradients, dark backgrounds, mismatched field heights, form fields stretched wider than 640px, a phone layout without a pinned header and bottom tab bar, empty card space, and more. A screen is not done until it passes.

## Agents

| Agent | Role |
|-------|------|
| jal-principal | Head assistant: direction, architecture bar, final ship gate |
| jal-lead | Splits work and runs the crew in parallel |
| jal-jev | The judge: frames and settles new decisions with JEV |
| jal-architect | System design and technical specifications |
| jal-ux | Design system owner: builds or redesigns screens to the JAL standard |
| jal-frontend | Frontend development to the jal-ux standard |
| jal-backend | Backend services on Bun and Hono |
| jal-systems | Go or Rust sidecars for hot paths Bun cannot serve |
| jal-security | Security baseline and vulnerability assessment |
| jal-redteam | Offensive security: exploit or disprove |
| jal-blueteam | Defensive hardening and fix verification |
| jal-reviewer | Code review and module-boundary gate |
| jal-qa | Tests, coverage, and the UI check |
| jal-devops | Deploys and infrastructure |
| jal-researcher | Research, with every fetched page screened before use |

## Commands

| Command | What it is for |
|---------|----------------|
| `/jal-ui` | Build a new screen or redesign an existing one: tidy, modern, mobile-first, checked automatically |
| `/jal-ship` | Build a whole feature end to end with the full crew |
| `/jal-orchestrate` | Run the crew on a task (plan, parallel build, review) |
| `/jal-review` | Check the project against every JAL rule and give one PASS or FAIL |
| `/jal-scaffold` | Start a new JAL project from the template |
| `/jal-module` | Add a new backend module |
| `/jal-service` | Add a Go or Rust sidecar for a hot path |
| `/jal-migrate` | Run database migrations |
| `/jal-audit` | Deep scan: security, architecture drift, dependencies, dead code, bundle size |
| `/jal-pentest` | Red team attacks, blue team fixes, one report |
| `/jal-debug` | Find and fix a bug properly: reproduce, root cause, test, fix |
| `/jal-pr` | Review and open a pull request |
| `/jal-deploy` | Deploy to deploy.jalgroup.id with health check and rollback |
| `/jal-release` | Version, changelog, and tag a release |
| `/jal-adr` | Record an architecture decision |

## Skills

18 skills back the agents and commands. The main ones:

- `jal-standards`: the JAL engineering constitution. Read before building or reviewing anything.
- `jal-ui-taste`: the design core. Generated type, spacing, radius, and color scales, the no-overlap rule, section concept, and the JEV decision points for UI.
- `jal-design-system`: JAL Core, the one JAL design system. Meta Astryx is the foundation, IBM Carbon supplies tables, forms, and notifications, and a few Google Material pieces cover mobile touch. One spec per component, so every product looks like the same team built it. JEV only sets how dense tables and lists are. Knowledge only, no extra packages.
- `jal-motion`: restrained product motion plus richer showcase choreography, always with reduced-motion support.
- `jal-jev`: the decision catalog, 24 standard decisions with their exact questions and thresholds.
- `jal-frontend-rules`: the CSS recipes that keep UI tidy.

Also: `jal-scaffold`, `jal-architecture`, `jal-rpc`, `jal-polyglot`, `jal-security-hardening`, `jal-redteam-ops`, `jal-blueteam-ops`, `jal-qa-automation`, `jal-git-safety`, `jal-memory`, `jal-adr`, `jal-release`.

## Bundled tools (MCP)

- **jal-design**: `jev_decide` (ask JEV) and `ui_audit` (the automatic UI check). Runs on Bun, no extra dependencies.
- **designmd**: design references from designmd.ai. Supplementary only, read-only, and every kit is screened by JEV before use.
- **koboyo-icons**: the icon library. Fallback: https://reicon.dev.

The JEV and designmd keys ship inside the plugin so the whole team gets them with no setup. That means anyone with access to this repo holds them. Keep the repo private and inside JAL.

## Requirements

- Bun installed and on PATH (the guard and the tools run on Bun).
- Google Chrome or Chromium installed for the UI check (`CHROME_PATH` overrides the location).

## Docs website

A static docs site lives in `docs-site/`, built with Bun:

```
cd docs-site && bun install && bun run build
bun run serve
```

## Specification

- v0.3.0 design intelligence: [docs/superpowers/specs/2026-09-28-jal-design-intelligence-design.md](docs/superpowers/specs/2026-09-28-jal-design-intelligence-design.md)
- Original design: [docs/superpowers/specs/2026-08-06-jal-aidev-design.md](docs/superpowers/specs/2026-08-06-jal-aidev-design.md)
