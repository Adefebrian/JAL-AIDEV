---
description: Scaffold a new JAL Bun monorepo from the JAL-AIDEV template, install deps, commit, and verify the build.
argument-hint: <app-name>
---

Scaffold a new JAL project named `$1` (full argument: $ARGUMENTS) from the plugin's monorepo template. Reference skill `jal-scaffold` for the no-Vite Bun.build() recipe behind this template, do not re-derive it here.

## Steps, in order

1. **Verify Bun.** Run `bun --version`. If it fails or Bun is not found, abort immediately with a clear message telling the user to install Bun (https://bun.sh) before retrying. Do not fall back to npm, pnpm, yarn, or node for any part of this scaffold.
2. **Copy the template.** Copy `${CLAUDE_PLUGIN_ROOT}/templates/monorepo` to `./$1`. If `./$1` already exists, stop and fail loudly, never overwrite an existing directory.
3. **Rename tokens.** Replace every occurrence of `__APP_NAME__` inside the copied tree with `$1`, across every file in `./$1` (package.json name fields, README, Docker labels, anything else carrying the placeholder), not just the root package.json.
4. **Install.** `cd $1 && bun install`. Bun workspaces resolve `apps/*` and `packages/*` in one pass.
5. **First commit.** `git init && git add -A && git commit -m "chore: scaffold from JAL-AIDEV"`.
6. **Prove the build.** Run `bun run build && bun test` inside `$1`. Report pass/fail explicitly for each. If either fails, stop and surface the error, do not print next steps on a broken build.
7. **Print next steps**, only after build and test pass:
   - Copy `.env.example` to `.env` and fill in real values: `DATABASE_URL` (self-hosted Postgres), `REDIS_URL`, S3 credentials for `s3.datacenter.jalgroup.id`, `OPENAI_API_KEY`. Never commit `.env`.
   - Push the repo and connect it to Coolify at deploy.jalgroup.id, pointing the build command at the Dockerfiles in `infra/`.

Stay terse throughout: run each command, report its result, move to the next step. No narration between steps beyond what is needed to report pass or fail.
