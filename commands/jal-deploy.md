---
description: Deploy a tagged image to Coolify at deploy.jalgroup.id only, run a health check, and support one-command rollback to the last stable tag.
argument-hint: <deploy|rollback> [tag]
---

Run subcommand `$1` (full argument: $ARGUMENTS). Dispatch agent `jal-devops` to execute this per skill `jal-git-safety` (tagged image rollback, conventional commits) and skill `jal-standards`.

## The only valid target

Every deploy and rollback in this command targets **`deploy.jalgroup.id`**, the JAL Coolify instance, and nothing else. This host is hardcoded, never read from an argument, environment variable, or user-supplied override. If `$ARGUMENTS` names any other host, endpoint, or environment, **refuse explicitly**: state that this command only deploys to `deploy.jalgroup.id`, do not proceed, do not silently substitute the requested target.

## Steps, in order

1. **Validate `$1`.** Must be `deploy` or `rollback`. Anything else, print usage and stop.
2. **If `$1` is `deploy`:**
   - Build the image and tag it with the current git short SHA plus a semantic label (e.g. `<sha>-<branch>`).
   - Push the tagged image to the registry Coolify at `deploy.jalgroup.id` pulls from.
   - Trigger the Coolify deploy for that tag.
   - **Health check.** Poll the deployed service's health endpoint after rollout. If it does not report healthy within a reasonable window, treat the deploy as failed, do not report success.
   - On a healthy check, record the tag as the new last-stable tag (e.g. in `.jal/deploy/last-stable`).
3. **If `$1` is `rollback`:**
   - `$2`, if given, names the tag to roll back to. If omitted, use the recorded last-stable tag.
   - Trigger the Coolify deploy for that tag against `deploy.jalgroup.id`, this is the one command needed, no manual multi-step recovery.
   - Health check the rollback the same way as a normal deploy.
4. **Never deploy an untagged image.** Every image that reaches `deploy.jalgroup.id` carries an explicit tag, latest-only pushes are not allowed.

Report the tag deployed or rolled back, and the health check result. Stay terse.
