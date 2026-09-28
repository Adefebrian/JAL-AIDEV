---
name: jal-git-safety
description: Feature-branch flow, git worktrees for parallel agents, tagged Docker image rollback, conventional commits, never force-push shared branches. Use when starting new work, running parallel agents on one repo, tagging a release, or rolling back a bad deploy.
---

# JAL Git Safety

Operational detail behind the git safety summary in `jal-standards`. Applies to every human and every agent working in a JAL repo.

## Feature-branch flow

- Never commit directly to `main`. Every change starts on a branch cut from `main`: `git checkout -b feat/<slug>` (or `fix/`, `chore/`, matching the conventional-commit type).
- Keep branches short-lived and scoped to one task. Merge or open a PR as soon as the task's gate (the review gate (`/jal-check`)) passes, do not let branches accumulate unmerged for days.
- Rebase onto latest `main` before opening a PR (`git fetch origin && git rebase origin/main`) to keep history linear; resolve conflicts locally, never in the PR UI.

## Git worktrees for parallel agents

When `jal-lead` fans out multiple subagents onto the same repo at once, a single working directory is not safe, two agents editing the same checkout will clobber each other's uncommitted state.

```bash
git worktree add ../jal-work-frontend feat/frontend-bento-refresh
git worktree add ../jal-work-backend feat/rate-limit-redis
```

- Each agent gets its own worktree, its own branch, checked out from the same `.git`. They share the object store, so no duplicate clone cost.
- Naming convention: `../<repo>-work-<agent-role>` so leftover worktrees are identifiable at a glance.
- Clean up after merge: `git worktree remove ../jal-work-frontend` (fails safely if the worktree has uncommitted changes, forcing a deliberate decision rather than silent data loss).
- Never point two worktrees at the same branch simultaneously, git will refuse to check out a branch that is already checked out elsewhere, which is the correct guardrail, do not work around it.

## Tagged stable Docker image rollback

Every deploy that reaches a stable state gets tagged, both in git and in the image registry, so rollback is one command, not a git-bisect session.

```bash
# on the commit that is currently deployed and verified stable
git tag -a v0.4.2 -m "stable: rate limiting + bento refresh shipped"
git push origin v0.4.2

# tag the Docker image built from that commit
docker tag jal-aidev/api:latest jal-aidev/api:v0.4.2
docker push jal-aidev/api:v0.4.2
```

Rollback when a new deploy breaks prod:

```bash
docker pull jal-aidev/api:v0.4.2
docker tag jal-aidev/api:v0.4.2 jal-aidev/api:latest
docker push jal-aidev/api:latest
# then redeploy `latest` through Coolify, or point the Coolify service
# directly at the v0.4.2 tag if it supports pinned tags
```

- Tag on every successful production deploy, not just major releases. A tag costs nothing and turns "what was running before this broke" into a lookup instead of an investigation.
- Match the git tag and the Docker image tag exactly (same version string) so the two rollback halves, code and image, never drift apart.
- `jal-devops` owns tagging as part of the deploy step, not as an afterthought once something has already broken.

## Conventional commits

Every commit message: `<type>: <summary>`, imperative mood, no period at the end of the summary line.

Types in use: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`.

```
feat: add Redis-backed rate limiting to auth routes
fix: correct CORS allowlist missing staging origin
chore: bump bun.lockb after dependency audit
```

Body (optional, blank line after summary) explains why, not what, the diff already shows what.

## Never force-push a shared branch

- `main` and any long-lived shared branch (`develop`, release branches) never receive a force-push, from a human or an agent, under any circumstance.
- If history needs cleanup (squash, rebase) on a branch others may have pulled, coordinate first or do it only on a branch that is provably still solo (just cut, not yet shared, not yet reviewed).
- Force-push is permitted only on an agent's own short-lived feature branch that no one else has based work on, and even then prefer `--force-with-lease` over bare `--force` so a stale local view cannot silently clobber someone else's push.
