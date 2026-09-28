---
description: Start a new JAL project, ready to build on, in one step.
argument-hint: <project-name> [what it is for]
---

What to start: $ARGUMENTS

## What this does

Creates a new JAL project from the standard template, installs everything, proves it builds and passes its tests, and makes the first commit. If you also say what the project is for, it goes straight on and builds the first version with `/jal-build`.

Covers: the project skeleton (Bun, Hono API, React web app, shared UI kit with the JAL design system and app-shell, Postgres migrations, Docker, CI), security hardening from day one, and a starter screen that already passes the UI check.

Examples:
- `/jal-new tally`
- `/jal-new halo a landing page for a smart desk lamp`

## Run it

Run the `jal-orchestration` engine (skill `jal-orchestration`) with playbook `scaffold` (`references/scaffold.md`) for the first argument as the project name. If the request says what the project is for, continue with the `/jal-build` flow on that description in the new project. Report: the path, the build and test result, and next steps.
