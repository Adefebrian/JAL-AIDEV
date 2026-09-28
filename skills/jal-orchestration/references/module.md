# Playbook: New backend module

Internal playbook, run through the `jal-orchestration` engine by a JAL command (see `../SKILL.md` for which command runs it). Scaffold a compliant domain module into apps/api/src/modules/<name>/, register it in the app assembly, and verify module boundaries.

Scaffold a new domain module named `<arg1>` (full argument: <request>). Reference skill `jal-architecture` for the module anatomy behind this scaffold (routes/service/repo/ports/index.ts/tests, the single-public-index rule, allowed dependency directions), do not re-derive it here.

## Steps, in order

1. **Validate the name.** `<arg1>` must be lowercase kebab-case. If `apps/api/src/modules/<arg1>` already exists, stop and fail loudly, never overwrite an existing module.
2. **Check for a plugin template first.** If `${CLAUDE_PLUGIN_ROOT}/templates/module` exists, copy it to `apps/api/src/modules/<arg1>` and rename tokens. Otherwise hand-write the following files per `jal-architecture`:
   - `routes.ts`: Hono router for the module, no business logic inline.
   - `service.ts`: business logic, depends only on `ports.ts` interfaces, never imports `repo.ts` directly.
   - `repo.ts`: data access against Postgres, implements the interfaces declared in `ports.ts`.
   - `ports.ts`: interfaces for the repo and any external dependency the service needs.
   - `index.ts`: the module's single public surface, re-export only what other modules are allowed to import, everything else stays private to the module.
   - `<arg1>.test.ts`: a `bun test` skeleton that at least imports `index.ts` and asserts the router mounts.
3. **Register the module** in the core app assembly (the composeApp entrypoint in `apps/api/src/index.ts` or equivalent). Import only from the module's `index.ts`, mount its router under `/<arg1>`. Never import from a module's internal files (`repo.ts`, `service.ts`) outside the module.
4. **Run `bun run check:boundaries`.** If it reports a violation, fix the offending import before reporting done, never leave a module in a broken boundary state.
5. **Run `bun test apps/api/src/modules/<arg1>/<arg1>.test.ts`** to confirm the skeleton loads.

Report pass or fail for both the boundary check and the test run explicitly. Stay terse, no narration beyond what each step needs.
