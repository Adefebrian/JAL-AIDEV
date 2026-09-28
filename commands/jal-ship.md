---
description: Get the work out, open a pull request, cut a release, or deploy to deploy.jalgroup.id with a health check and one-step rollback.
argument-hint: <pr | release | deploy | rollback> [tag or note]
---

What to ship: $ARGUMENTS

## What this does

Runs the full check first, and only moves on if it passes. Then it does what you asked:
- **pr**: opens a pull request with a clear title and a test checklist.
- **release**: bumps the version, writes the changelog, and tags it.
- **deploy**: builds a tagged image, deploys it to deploy.jalgroup.id, and checks it is healthy.
- **rollback**: returns to the last healthy version in one step.

With no word it opens a pull request. It never deploys unless your message says deploy or rollback, and never anywhere except deploy.jalgroup.id.

Examples:
- `/jal-ship pr`
- `/jal-ship release`
- `/jal-ship deploy`
- `/jal-ship rollback v1.4.2`

## Run it

Run the `jal-orchestration` engine: playbook `review-gate` first (it must PASS), then `pr`, `release`, or `deploy` (`references/pr.md`, `release.md`, `deploy.md`) per the user's word, with jal-devops executing. `qa.release_go` and `rev.ship` judge readiness. Deploy and rollback run only on the user's explicit word in this message and only to deploy.jalgroup.id; JEV never authorizes them. Report: the gate result, then the PR URL, the version and tag, or the deployed tag and health check.
