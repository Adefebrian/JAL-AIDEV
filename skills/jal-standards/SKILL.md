---
name: jal-standards
description: JAL engineering constitution: approved stack, forbidden tech, frontend law, security hardening, AI default. Read before building or reviewing any JAL project.
---

# JAL Engineering Constitution

This is the single source of truth for how JAL projects are built. Every other skill and agent in this plugin defers to this file. When in doubt, this file wins.

## Stack: Approved

- Use Bun as the runtime and package manager. No exceptions.
- Use Hono for backend HTTP services and APIs.
- Use React for frontend UI.
- Use TypeScript everywhere. No plain JavaScript in new code.
- Use Docker for containerization and local parity with production.
- Use Redis for caching, rate limiting, and ephemeral state.

## Runtime: Bun Only

- Bun is the only JS/TS runtime. It is both runtime and package manager for every JAL project.
- Never use node, deno, ts-node, tsx, or nodemon, in any script, Dockerfile, CI job, or package.json.
- Every run, build, test, and script entry point invokes bun directly.

## Stack: Forbidden

- Never use Vite. Bun is the build tool and dev server.
- Never use Next.js or any heavy SSR framework that taxes server CPU or RAM.
- Never use webpack or Create React App.
- Never use node, deno, ts-node, tsx, or nodemon. Bun replaces all of them.
- Never introduce any technology outside the approved stack without reporting it to Brian for confirmation first. Propose, wait, then use.

## Polyglot: Go and Rust

- Go and Rust are allowed only as compiled gRPC sidecar services under services/. Never as a JS/TS runtime substitute.
- Justify the sidecar to Brian first and get a yes before writing it. Opt-in per project, never a default.
- Reserve Go or Rust for CPU-bound or latency-critical hot paths that Bun cannot serve fast enough. Everything else stays in Bun/Hono/TypeScript.
- Bun/Hono owns the proto contract. The sidecar implements it, it does not define it.
- See skill jal-polyglot for the detailed workflow.

## Architecture: Modular Monolith

- Modular monolith is mandatory. Do not split a JAL project into microservices without Brian's sign-off.
- Domain modules live under apps/api/src/modules/<domain>/, one directory per domain.
- Each module exposes exactly one public index.ts. Everything else in the module is private to it.
- Cross-module imports go through the owning module's index.ts only. Never reach into another module's internals.
- Infra dependencies, Postgres, Redis, S3, AI providers, sit behind ports/adapters in src/core/. Modules depend on the port, not the concrete client.
- Every project is a Turborepo monorepo, no exceptions.
- See skill jal-architecture for module anatomy and detail.

## Animation (Only If Needed)

- Reach for animation only when the interaction genuinely needs it, not by default.
- Use Lenis for smooth scrolling.
- Use GSAP for complex timeline and scroll-triggered animation.
- Use Framer Motion for React-native component and gesture animation.
- Check originkit.dev (https://www.originkit.dev/) for pre-built motion patterns before hand-rolling one.

## Frontend Law

- Never use an em-dash character anywhere in frontend content. Use commas, colons, or periods instead.
- Never use eyebrow labels, glow effects, neon, or any other AI-slop visual pattern.
- The default background is always white, off-white, broken white, or light beige. Never a dark or colored default background. Black is ink only; a dark background is allowed only inside a dedicated, explicitly requested dark mode.
- Never use gradients, of any kind, anywhere. Flat neutral surfaces only. This overrides any older feralui.dev allowance.
- Never use emoji or emoticons on any surface. Use a real koboyo/reicon icon when a glyph is needed.
- Never draw decorative lines or marks: no connector lines between cards/tiers, no side/top/bottom accent stripes on panels, no marker dots or squares beside headings or labels. Rank and group with spacing, order, and type. Only functional hairline neutral dividers between structural regions are allowed.
- Default to a Bento Grid layout unless the content genuinely calls for something else.
- Keep the design modern, minimalist, and clean, Apple/Google grade. No decoration without purpose.
- Design mobile-first and make every surface super mobile-friendly with a dedicated app-like mobile presentation.
- Keep layout, sizing, spacing, and padding consistent across the whole product. No large empty gaps and no dead grid cells.
- Source icons from the koboyo MCP first. Fall back to https://reicon.dev/ only when koboyo has no match.

## Backend / Security

- Ship automatic security hardening on every project: secure HTTP headers, Redis-backed rate limiting, a CORS allowlist, input validation, secrets loaded from env only, and dependency auditing.
- Never hardcode secrets, keys, or credentials in code or config files.
- Run the installed hunt-* skills for deep security scans before shipping.
- Keep every project resource-light and server-optimized. Do not default to heavy frameworks or unnecessary background processes.
- Run red team passes via skill jal-redteam-ops.
- Run blue team passes via skill jal-blueteam-ops.

## AI Default

- Default every new AI integration to OpenAI gpt-4o-mini.
- Run gpt-4o-mini with a maxed configuration (max tokens, full capability) unless the task specifies otherwise.
- Report any deviation from this default model to Brian before use.

## Deploy / Infra

- The only permitted deploy target is Coolify at deploy.jalgroup.id. No other target, no exceptions.
- Use self-hosted PostgreSQL for the database layer.
- Use S3-compatible object storage at s3.datacenter.jalgroup.id.
- Run CI/CD on GitHub Actions with a self-hosted gh runner and Turborepo.
- Keep all JAL projects in a single GitHub monorepo.

## Git Safety (Summary)

- Branch feature work off main. Never commit directly to main.
- Use git worktrees when running parallel agent work on the same repo.
- Tag stable Docker images so rollback is always one command away.
- Write commit messages in conventional commit format.
- Never force-push a shared branch.
