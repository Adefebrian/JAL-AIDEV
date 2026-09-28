---
description: Build or change anything, a feature, API, database change, module, or service, with the whole crew in parallel and checked before it is called done.
argument-hint: <what to build or change>
---

What to build: $ARGUMENTS

## What this does

Plans the work, splits it across the right specialists, builds the independent parts at the same time, then checks everything and fixes what fails until it passes. The JEV judge makes the small calls along the way, such as who owns what, what can run in parallel, and whether a design is good enough.

Covers:
- new features end to end
- backend modules and API routes
- database tables and migrations
- Go or Rust sidecars for hot paths (asks Brian first)
- architecture decision records
- any screens the feature needs, built through the `/jal-ui` pipeline

Examples:
- `/jal-build invoices: create, list, and mark paid, with a screen`
- `/jal-build add a Redis cache to the search endpoint`

## Run it

Dispatch `jal-principal` to set direction and scope, then `jal-lead` runs the `jal-orchestration` engine. Playbooks it may use: `feature`, `module`, `migrate`, `service`, `adr`, plus the `/jal-ui` pipeline for UI parts. `orch.playbooks` picks the set, and waves run in parallel per the engine. It ends with the review gate PASS and `rev.ship`. Report: the plan (ownership table), every JEV decision, files changed per workstream, the gate result, and the memory written.
