# JAL-AIDEV — Design Spec

Date: 2026-08-06
Author: Brian (lead) + Claude
Repo: https://github.com/JAL-Group/JAL-AIDEV (private)

## 1. Purpose

A private Claude Code plugin that is two things at once:

1. **Brian-as-lead guardrails** — the JAL engineering constitution encoded as skills + agent system prompts + a hard hook, so every teammate's Claude session builds to the same standard.
2. **A working boilerplate + team of agents** — a scaffolder that generates a real, optimized Bun monorepo, plus an 8-agent parallel team (crew codename "Pawang", command/agent prefix `jal-`) that plans, builds, secures, tests, and ships to it.

Team installs with:
```
/plugin marketplace add JAL-Group/JAL-AIDEV
/plugin install jal-aidev
```

## 2. Non-negotiable constraints (the constitution)

**Runtime:** Bun only. No Vite. No Next.js or any heavy SSR framework that taxes server CPU/RAM. Any new tech beyond the approved stack must be reported to Brian for confirmation before use.

**Approved stack:** Bun, Hono, React, TypeScript, Docker, Redis.
**Animation (only if needed):** Lenis, GSAP, Framer Motion, originkit.dev.
**Deployment:** Coolify at deploy.jalgroup.id.
**Database:** self-hosted PostgreSQL.
**Object storage:** S3 at s3.datacenter.jalgroup.id.
**CI/CD:** GitHub Actions with self-hosted gh runner + Turborepo.
**Repo:** GitHub monorepo.
**Frontend icons:** koboyo MCP (bundled, token hardcoded — free/public per Brian), reicon.dev as fallback.
**AI integration:** default and only default LLM is OpenAI `gpt-4o-mini`, maxed config.

**Frontend law:**
- No emdash anywhere in frontend content.
- No eyebrow labels, glow, neon, or any "AI-slop" look.
- Bento Grid UI is the default layout system.
- Modern minimalist, clean, super mobile-friendly; mobile has a dedicated app-like presentation.
- Consistent layout/sizing/spacing/padding; no large empty gaps.
- Gradients (static or animated) only via feralui.dev/gradients, and only when actually needed.

**Every project ships with automatic security hardening.**
**Every project must stay resource-light and server-optimized.**

## 3. Repo layout

```
.claude-plugin/
  plugin.json            # manifest (name: jal-aidev, version, components)
  marketplace.json       # single-plugin marketplace for team install
.mcp.json                # bundled koboyo icons MCP (hardcoded token) + reicon note
agents/
  jal-lead.md            # orchestrator
  jal-architect.md       # stack gatekeeper
  jal-frontend.md        # UI builder
  jal-backend.md         # Bun/Hono/PG/Redis/S3
  jal-security.md        # hardening + vuln/gap scan
  jal-qa.md              # bun test + happy-dom + puppeteer-core E2E
  jal-devops.md          # Docker/Coolify/GH Actions/git safety
  jal-researcher.md      # agentic websearch
skills/
  jal-standards/            # master constitution (auto-referenced)
  jal-frontend-rules/       # UI law detail + bento recipes + feralui/icons
  jal-scaffold/             # how to generate the monorepo
  jal-qa-automation/        # test patterns + pass/fail reporting
  jal-security-hardening/   # default hardening checklist
  jal-git-safety/           # branch/worktree/rollback/image versioning
  jal-memory/               # self-learning memory convention
commands/
  jal-scaffold.md        # /jal-scaffold <name>
  jal-orchestrate.md     # /jal-orchestrate <task>
  jal-review.md          # /jal-review  (guideline + security + QA gate)
hooks/
  hooks.json             # PreToolUse registration
  guardrails.mjs         # hard backstop
templates/monorepo/      # scaffolder source (see section 6)
docs/superpowers/specs/  # this spec + future ones
README.md
```

## 4. Agents (the parallel team — crew codename "Pawang", prefix `jal-`)

Each agent's system prompt embeds a compact copy of the constitution plus its role. All are dispatchable as subagents so `jal-lead` can fan out in parallel.

| Agent | Role | Key tools/skills |
|-------|------|------------------|
| **jal-lead** | Orchestrator. Plan → decompose → delegate parallel subagents → loop until gates pass → write learnings to memory. Advanced prompt engineering, loop engineering. | Agent/Task, jal-memory, all skills |
| **jal-architect** | Stack gatekeeper. Designs to constraints, keeps server light, flags any new tech to Brian before use. | jal-standards |
| **jal-frontend** | Bento, minimalist, app-like mobile, koboyo/reicon icons, feralui gradients, no emdash/eyebrow/glow/neon. | jal-frontend-rules, koboyo MCP |
| **jal-backend** | Bun+Hono+TS, self-hosted PG, Redis, S3, hardening middleware, gpt-4o-mini integration. | jal-security-hardening |
| **jal-security** | Continuous hardening + live vuln/gap detection, fast-fix reporting. Leverages installed `hunt-*` skills. | jal-security-hardening, hunt-* |
| **jal-qa** | Automated QA dev/prod: bun test + happy-dom + puppeteer-core E2E, pass/fail report. | jal-qa-automation |
| **jal-devops** | Docker, Coolify deploy, GH Actions + gh runner + turbo, git branch/worktree/rollback/image versioning. | jal-git-safety |
| **jal-researcher** | Agentic websearch, opens links, returns verified findings. | WebSearch, WebFetch |

## 5. Skills, commands, hooks

**Skills** — one focused file each, invokable by name and auto-referenced by agents. `jal-standards` is the source of truth; other skills reference it rather than duplicate.

**Commands:**
- `/jal-scaffold <name>` — copy `templates/monorepo` into a new dir, rename, install deps with `bun install`, git init + first commit, print next steps.
- `/jal-orchestrate <task>` — invoke `jal-lead` to run the full plan→parallel-build→gate→memory loop on a task.
- `/jal-review` — run the guideline + security + QA gate on the current repo, output a single pass/fail report.

**Hook** (`guardrails.mjs`, PreToolUse on Write|Edit): hard backstop that blocks, with a clear message, any write that:
- introduces an emdash into frontend content files,
- adds `vite`, `next`, or other banned heavy deps to a `package.json`.
- The hook fails safe (never blocks non-matching writes) and explains why on block.

## 6. The monorepo template (`templates/monorepo`)

Turborepo monorepo, Bun runtime throughout, no Vite:

```
apps/web/     React + TS SPA. Bundled with Bun.build(); served by a Hono
              static server. Dev = bun --watch rebuild + serve. Bento tokens,
              mobile app-shell layout, koboyo icons, feralui gradient helper.
apps/api/     Hono on Bun. Postgres (self-hosted) + Redis + S3 clients.
              Security hardening middleware (secure headers, rate limit via
              Redis, CORS allowlist, input validation, no secrets in code).
              gpt-4o-mini client (maxed) as the only default LLM.
packages/ui/  Shared React components: bento primitives, design tokens,
              icon wrapper, feralui gradient presets.
packages/config/ shared tsconfig, eslint, env schema.
infra/        Dockerfile per app (multi-stage, slim), docker-compose for local
              PG + Redis, Coolify service config.
.github/workflows/ci.yml  gh-runner + turbo: install, lint, typecheck,
              bun test (happy-dom + api fetch), puppeteer smoke, build.
.jal/memory/  committed self-learning memory for the team.
turbo.json, package.json (workspaces), bun.lockb, .gitignore, README.
```

**No-Vite React on Bun — proof obligation:** before shipping the template, `bun install` + `bun run build` + `bun test` must all pass locally. If `Bun.build()` for React needs a specific config (JSX runtime, CSS handling), that gets solved and documented in `jal-scaffold`.

## 7. Orchestration + self-learning memory

- `jal-lead` decomposes a task, dispatches independent pieces to subagents in parallel, and loops: build → `/jal-review` gate → if fail, route findings back to the right agent → repeat until pass.
- Memory lives in `.jal/memory/*.md` (committed to the project repo, so the whole team inherits learnings). Convention defined by `jal-memory`: one file per durable learning, with a short index. Distinct from Claude's personal `~/.claude` memory.

## 8. Git safety

`jal-git-safety` + `jal-devops` enforce: feature branches off `main`, git worktrees for parallel agent work (no clobber), tagged stable Docker images for one-command rollback, conventional commits, never force-push shared branches.

## 9. QA stack (final)

Playwright rejected as too heavy. Final stack, Bun-native:
- `bun test` — runner.
- `happy-dom` + `@happy-dom/global-registrator` — DOM/component tests under Bun.
- Direct `fetch` against the Hono app — API/integration E2E.
- `puppeteer-core` + system Chromium — optional headless browser smoke for dev/prod.
- JUnit/TAP output → pass/fail summary surfaced by `/jal-review` and CI.

## 10. Out of scope (v1)

- Publishing to a public marketplace (repo stays private).
- Non-JAL deploy targets.
- Any LLM other than gpt-4o-mini as a default.

## 11. Success criteria

1. Team can install the plugin from the private repo.
2. `/jal-scaffold demo` produces a monorepo where `bun install && bun run build && bun test` all pass, no Vite, no Next.js.
3. All 8 agents load and carry the constitution.
4. The guardrails hook blocks an emdash-in-frontend write and a `vite` dependency add, and lets clean writes through.
5. `/jal-review` emits a single pass/fail gate report.
6. koboyo icons MCP is wired and usable; reicon.dev documented as fallback.
