---
description: Write or update documentation for a JAL project in the JAL Docs portal, technical and non-technical, with every claim checked against the code.
argument-hint: <project repo or path> [what to focus on]
---

What to document: $ARGUMENTS

## What this does

Reads the project's code and writes its page in JAL Docs (malasbaca.jalgroup.id):
- **for developers:** architecture, how to run and deploy it, every menu and screen, the endpoints, database, and storage, the env variable names, and the gotchas, plus a handover file that a new developer or Claude Code session can load
- **for non-technical readers:** what it is, who uses it, its current status, and who to contact

If the project already has docs, it only updates the parts the code changed since the last time. Every sentence must point to real code. A mechanical check and the JEV judge throw out anything that cannot be proven, so nothing is made up. Secrets are never written; env files list names only.

It runs only when you ask. It opens a pull request on JAL-Group/malasbaca, and when every check passes it merges that PR and deploys JAL Docs, then confirms the site is up. If anything fails, the PR stays open and it tells you why. For the deploy step it needs the Coolify token. It reads `COOLIFY_API_TOKEN` from your environment, or asks you (or whoever on the team is running it) for it at that moment. The token is used for that one deploy and never saved anywhere.

Examples:
- `/jal-docs JAL-Group/Sentimen_DPP`
- `/jal-docs ~/Documents/JAL/tally for the finance team`

## Run it

Dispatch agent `jal-docs`, which runs the skill `jal-docs` pipeline in order on the `jal-orchestration` engine:
1. intake, then create-or-update detection from the last analysed commit
2. `docs.plan`
3. parallel evidence research
4. `docs_verify`
5. `docs.claim`
6. writing in the malasbaca house style
7. `tsc`, build, and a local render
8. `docs.publish`
9. branch plus PR, then squash-merge and a Coolify deploy when every check passes

Report: mode, sections written or updated, claims verified and removed, each JEV decision with confidence, the build result, the PR URL, and the merge and deploy result.
