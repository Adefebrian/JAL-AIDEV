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

## Stack: Forbidden

- Never use Vite. Bun is the build tool and dev server.
- Never use Next.js or any heavy SSR framework that taxes server CPU or RAM.
- Never use webpack or Create React App.
- Never introduce any technology outside the approved stack without reporting it to Brian for confirmation first. Propose, wait, then use.

## Animation (Only If Needed)

- Reach for animation only when the interaction genuinely needs it, not by default.
- Use Lenis for smooth scrolling.
- Use GSAP for complex timeline and scroll-triggered animation.
- Use Framer Motion for React-native component and gesture animation.
- Check originkit.dev (https://www.originkit.dev/) for pre-built motion patterns before hand-rolling one.

## Frontend Law

- Never use an em-dash character anywhere in frontend content. Use commas, colons, or periods instead.
- Never use eyebrow labels, glow effects, neon, or any other AI-slop visual pattern.
- Default to a Bento Grid layout unless the content genuinely calls for something else.
- Keep the design modern, minimalist, and clean. No decoration without purpose.
- Design mobile-first and make every surface super mobile-friendly with a dedicated app-like mobile presentation.
- Keep layout, sizing, spacing, and padding consistent across the whole product. No large empty gaps.
- Use gradients only from https://feralui.dev/gradients, and only when the design actually needs one.
- Source icons from the koboyo MCP first. Fall back to https://reicon.dev/ only when koboyo has no match.

## Backend / Security

- Ship automatic security hardening on every project: secure HTTP headers, Redis-backed rate limiting, a CORS allowlist, input validation, secrets loaded from env only, and dependency auditing.
- Never hardcode secrets, keys, or credentials in code or config files.
- Run the installed hunt-* skills for deep security scans before shipping.
- Keep every project resource-light and server-optimized. Do not default to heavy frameworks or unnecessary background processes.

## AI Default

- Default every new AI integration to OpenAI gpt-4o-mini.
- Run gpt-4o-mini with a maxed configuration (max tokens, full capability) unless the task specifies otherwise.
- Report any deviation from this default model to Brian before use.

## Deploy / Infra

- Deploy through Coolify at deploy.jalgroup.id.
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
