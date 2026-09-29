---
user-invocable: false
name: jal-docs
description: How the jal-docs agent writes and updates JAL project documentation in the JAL Docs portal (github.com/JAL-Group/malasbaca, live at malasbaca.jalgroup.id), for developers (technical sections plus a memory handover file for Claude Code) and for non-technical readers (what it is, who uses it, current condition). It covers the malasbaca content model, detecting existing docs and updating only what changed since the last analysed commit, evidence-cited claims checked mechanically by docs_verify and judged by JEV (docs.plan, docs.claim, docs.publish) so nothing is invented, names-only env files, secret scanning, and publishing as a branch plus a pull request. Use when documenting a project, updating stale docs, writing a handover, or anything aimed at malasbaca.
---

# JAL docs: evidence-only documentation for the JAL Docs portal

## Where docs live

- **Repo:** `github.com/JAL-Group/malasbaca` (private). The main branch is `main`, and it deploys to `https://malasbaca.jalgroup.id` through Coolify. It is a Bun + React 19 SPA with a Google login restricted to `@jalgroup.id`. Its own `HANDOVER.md` and `README.md` are the rules of that repo: read both first, every run.
- **Language:** Bahasa Indonesia, matching the existing docs. Code identifiers, paths, and commands stay as they are in the source.

### Content model (one project = one slug)

| File | What it holds | Audience |
|---|---|---|
| `src/<slug>.tsx` | `meta`, `GROUPS`, `sections` (see below) | Both |
| `src/docs.ts` | Registry: `import * as <slug> from "./<slug>.tsx"` and push the module into `DOCS` | n/a |
| `public/<slug>-memory.md` | Full memory handover for a new developer or Claude Code session: what it is, architecture, run, deploy, env names, gotchas | Technical |
| `public/<slug>.env.txt` | Env var **names only**, one per line, with the standard header. Never a value | Technical |

- **`meta`:** `{ slug, title, tagline, stack[], liveUrl, repoUrl, memoryUrl: "/<slug>-memory.md", envUrl: "/<slug>.env.txt", condition? }`
  - `condition` is the plain-language current-status note shown beside the Environment button: what is done, what is in progress, and who to contact.
- **`GROUPS`:** the sidebar groups, in order. The house set is `"Quick Review"`, `"Konsep Inti"`, `"Frontend · Menu & Fitur"`, `"Backend & Data"`, `"Referensi"`. Add `"Untuk Non-Teknis"` first when the project has non-technical readers.
- **`sections`:** `{ id, group, label, node }[]`. Build each node only with the primitives from `src/ui.tsx`:
  - `M` (HTTP method badge)
  - `C` (inline code)
  - `Pre` (code block)
  - `Tag`
  - `EndpointTable` (rows: method, path, purpose)
  - `Table` (head, rows)
  - `Callout` (type `info` or `warn`, title)
  - the `kpi-row` and `kpi` classes for key numbers
- Never add a dependency to malasbaca. It is deliberately minimal.

### Section set

| Group | Sections | Source of truth |
|---|---|---|
| Untuk Non-Teknis | Apa ini dan untuk siapa, Status sekarang, Cara akses, Siapa yang dihubungi | README, the live URL, commit history, `meta.condition` inputs from Brian |
| Quick Review | Ringkasan (with KPIs), Arsitektur, Cara menjalankan | package.json, entrypoints, Dockerfile, compose |
| Konsep Inti | Domain concepts and data flow | modules, services, schema |
| Frontend · Menu & Fitur | Every menu and screen: what it does, the endpoints it calls | router, pages, API client |
| Backend & Data | Endpoints (`EndpointTable`), database tables, storage, jobs, AI calls | routes, migrations, workers |
| Referensi | Env names, deploy (Coolify), repo map, gotchas | `.env.example`, infra, `HANDOVER`-style notes |

Non-technical sections use plain words, no jargon, and short paragraphs: what it does, who uses it, what state it is in, and how to reach it. Technical sections are precise enough that a new developer can run, change, and deploy the project without reading all the code first.

## The pipeline (`/jal-docs`)

1. **Intake.** Identify the source repo (a local path, or `JAL-Group/<name>`) and the slug. Run `sec.input_screen` on any pasted notes. Clone or pull malasbaca into a scratch working copy; never work in a checkout the user is editing.
2. **Detect.**
   - If the slug's `src/<slug>.tsx` already exists, or another doc's `meta.repoUrl` matches the source repo, this is an **update**. Otherwise it is a **create**.
   - For an update, read the last analysed source commit from the memory file header (`Dianalisis dari <repo>@<sha> pada <date>`) or from the malasbaca git log (`update to <repo>@<sha>`).
   - Diff the source repo from that commit to `HEAD` and map the changed files to the sections they feed.
3. **Plan (JEV `docs.plan`).**
   - Batched `noul` per candidate section: write or update it? In update mode, only sections whose sources changed are candidates, plus any section flagged stale.
   - `choice` for the non-technical layer: `none`, `summary_only`, or `full`.
   - Dropped sections are not written. Sections that are not candidates keep their current text, untouched.
4. **Research in parallel.** One read-only worker per section group reads the source and returns claims, each with evidence `{ path, contains }` taken from the actual code:
   - an endpoint's route line
   - a table's migration
   - an env name from `.env.example` or code
   - a command from `package.json`
   Nothing is written from memory, the README's wishes, or guesswork.
5. **Verify claims mechanically** (`docs_verify` tool, CLI fallback in `mcp/jal-design/docs-verify.ts`).
   - Every claim must cite evidence that exists and contains the snippet.
   - `NO_EVIDENCE` and `MISSING_EVIDENCE` claims are fixed with real evidence or removed.
   - Any secret-shaped value in a claim or draft fails the run until it is removed.
6. **Judge claims (JEV `docs.claim`).** A batched `noul` per claim: does the cited evidence support the claim as worded? Under 0.6, the claim is rewritten to what the evidence shows, or removed. If a claim matters but cannot be proven from the code (a business owner, a roadmap), it stays out, or it is written as a question for Brian in the PR description. It is never written as a fact.
7. **Write.** Draft `src/<slug>.tsx`, `public/<slug>-memory.md`, and `public/<slug>.env.txt`, and the `src/docs.ts` registration on create.
   - Keep the house style of the existing docs.
   - The memory file header records `Dianalisis dari <repoUrl>@<sha> pada <date>`.
   - No em-dash in new text. Use commas, colons, or a new sentence.
   - No emoji.
8. **Build.** In the malasbaca working copy, run `bunx tsc --noEmit` and `bun run build`. Both must pass. Render the new route locally (`bun run dev`, open `#/<slug>`) and confirm it renders with no console errors.
9. **Publish, merge, deploy (JEV `docs.publish`).** Brian authorized this flow on 2026-09-29: `/jal-docs` runs only when someone asks, and a docs PR that passes every check merges and deploys itself.
   1. The mechanical gate: the build passes, `docs_verify` passes, and the diff touches only this slug's files plus the `src/docs.ts` registration.
   2. JEV `docs.publish` scores readiness.
   3. Push branch `docs/<slug>-<yyyymmdd>` and open a pull request against `main` with `gh pr create`. The PR body lists what changed, the source commit, the verified claim count, the removed claims, and the open questions for Brian.
   4. **Auto-merge** only when all of these hold:
      - the mechanical gate is green
      - `docs.publish` is 2 or above
      - no claim was dropped for lack of evidence in a section Brian marked as required
      - the PR is the one this run created
      - its diff is still only the slug files and the registration

      Merge with `gh pr merge <number> --squash --delete-branch`. Otherwise leave the PR open, stating exactly why.
   5. **Auto-deploy** after a merge, following malasbaca's `HANDOVER.md`:
      - Trigger the Coolify deploy for application `r3pyjc6qczm9y7ouithk3b0m` on `https://deploy.jalgroup.id/api/v1/deploy?uuid=r3pyjc6qczm9y7ouithk3b0m&force=false`, with `Authorization: Bearer $COOLIFY_API_TOKEN` taken only from the environment variable.
      - Never read the token from any file. Never print it or log it.
      - Poll `/api/v1/deployments/<deployment_uuid>` until it is `finished` or `failed`, then fetch `https://malasbaca.jalgroup.id/` and expect a response (a login page is fine).
      - If `COOLIFY_API_TOKEN` is not set, ask the person running `/jal-docs` (Brian or a teammate) for it. The preferred path is setting it in the environment for the session (`export COOLIFY_API_TOKEN=...` in their terminal, or in their Claude Code env), then continuing. If they paste it in chat instead, use it only for this one deploy call: never write it to a file, a log, a commit, or the report, and never echo it. If nobody provides it, stop after the merge and report "deploy skipped: no Coolify token".
      - A failed deploy is reported with its status. It is not retried blindly.
   6. Never push directly to `main`. The only path into `main` is this run's own squash-merged PR.
10. **Report.** Mode (create or update), sections written or updated, claims verified or removed, every JEV decision, the build result, and the PR URL.

## Hard lines

- **Secrets:**
  - Never write a secret value anywhere: not in `.tsx`, `.md`, `.env.txt`, the PR body, or the commit message.
  - Env files are names only.
  - Coolify tokens, database URLs with passwords, API keys, and session secrets never appear, even masked partially.
  - `docs_verify` scans every draft.
- **Evidence only:** every factual sentence traces to cited source. Marketing claims, performance numbers, user counts, and dates not in the source are not written.
- **Minimal footprint in malasbaca:** touch only the slug's files and its registration. Never restyle the portal, add dependencies, or change auth or serve code. A needed portal change is a separate finding for Brian.
- **Outward actions:** `/jal-docs` runs only when a person invokes it (no CI trigger). Within that run, Brian's standing authorization covers exactly this: pushing the docs branch, opening the PR, squash-merging that same PR when every check passes, and deploying malasbaca through Coolify at deploy.jalgroup.id. Nothing else in malasbaca is merged or deployed, and a direct push to `main` is never allowed.
