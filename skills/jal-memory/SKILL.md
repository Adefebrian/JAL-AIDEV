---
name: jal-memory
description: The .jal/memory/*.md convention for durable project learnings, one file per learning plus an index, committed so the whole team shares it. Use when an agent discovers a gotcha worth remembering, when starting a task to check prior learnings, or when asked about project memory. Distinct from Claude's personal ~/.claude memory.
---

# JAL Memory

Project-level, team-shared memory. Distinct from Claude's personal `~/.claude` memory, which is per-user and never committed. `.jal/memory/` lives inside the project repo, is committed to git, and every teammate's and every agent's session inherits it the moment they check out the branch.

## The convention

```
.jal/memory/
  INDEX.md                       # one-line summary per learning file, newest first
  2026-08-06-bun-build-css-entry.md
  2026-08-10-redis-rate-limit-key-collision.md
  2026-08-12-coolify-env-var-caching-gotcha.md
```

- One durable learning per file. Not a running journal, not a catch-all notes dump. If it is not something a future agent would need to avoid repeating a mistake or rediscovering a fact, it does not get a file.
- Filename: `YYYY-MM-DD-short-slug.md`, dated by when the learning was captured, slug describes the learning, not the task that produced it.
- File body, minimal and direct:

```markdown
# Redis rate-limit key collision across routes

Date: 2026-08-10
Discovered by: jal-security (during the review gate (/jal-check) on apps/api)

## What happened
Rate limit keys were built as `ratelimit:${ip}` with no route segment, so
hitting /api/leads and /api/contact from the same IP shared one bucket and
falsely 429'd unrelated endpoints.

## Fix
Key format changed to `ratelimit:${route}:${ip}`. Applied in
apps/api/src/middleware/rateLimit.ts.

## Rule going forward
Every new rate-limited route must include the route path in its Redis key.
Check this in the review gate (/jal-check) whenever a new rate-limited route is added.
```

- `INDEX.md` is a flat, newest-first list, one line per file, enough to scan without opening every file:

```markdown
# Memory Index

- 2026-08-12: Coolify caches env vars per build, redeploy after changing them ([file](2026-08-12-coolify-env-var-caching-gotcha.md))
- 2026-08-10: Redis rate-limit keys must include route, not just IP ([file](2026-08-10-redis-rate-limit-key-collision.md))
- 2026-08-06: Bun.build() needs CSS listed as an entrypoint to emit hashed CSS output ([file](2026-08-06-bun-build-css-entry.md))
```

## When to write

Write a memory file when:
- An agent hits a real gotcha (a library quirk, a platform behavior, a config trap) that cost real debugging time and would cost it again for the next agent or teammate.
- A the review gate (`/jal-check`) gate failure traces back to a root cause that is not obvious from the code alone, capture the cause, not just the fix.
- A deviation from `jal-standards` gets approved by Brian, record what was approved and why, so it is not silently re-litigated or silently violated by someone who never saw the approval.
- A scaffold or deploy step needed a workaround not covered in `jal-scaffold` or `jal-git-safety`.

Do not write a memory file for:
- Routine bug fixes with an obvious, self-explanatory cause.
- Anything already documented in a skill file, if it belongs in `jal-frontend-rules` or `jal-security-hardening` as a permanent rule, put it there instead, memory is for project-specific and time-stamped learnings, not for rules that apply to every JAL project.

## Why committed, not personal

`.jal/memory/` is committed alongside the code it describes because the learning belongs to the project and the team, not to one agent's session or one person's local machine. A new teammate cloning the repo, or a fresh agent session starting cold on the same project, gets the same accumulated context as everyone who worked on it before. Claude's personal `~/.claude` memory persists across a user's own sessions and projects; it never substitutes for this, and nothing here should be duplicated there.

`jal-lead` writes to `.jal/memory/` as the closing step of its plan-build-gate loop whenever the loop surfaces a learning worth keeping, and updates `INDEX.md` in the same commit.
