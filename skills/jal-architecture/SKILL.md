---
user-invocable: false
name: jal-architecture
description: Modular-monolith bible for JAL projects, module anatomy (routes/service/repo/ports/index.ts/tests), the single-public-index rule, ports and adapters (hexagonal-lite), allowed dependency directions, folder-by-feature layout, splitting a module that has outgrown itself, and how the boundary checker enforces all of it. Use when scaffolding a new domain module, reviewing cross-module imports, or a module is turning into spaghetti.
---

# JAL Architecture: Modular Monolith

Detail layer for the "Architecture: Modular Monolith" section of `jal-standards`. Read that skill first. A JAL project is one Turborepo monorepo, one deployable API, split into strictly bounded domain modules under `apps/api/src/modules/<domain>/`. Never microservices without Brian's sign-off.

## Module anatomy

Every domain module is a folder with this shape, no more, no less:

```
modules/<domain>/
  routes.ts      # Hono router for this domain, mounted by the app entrypoint
  service.ts     # business logic, orchestrates repo + ports, framework-agnostic
  repo.ts        # data access for this domain's own tables only
  ports.ts       # interfaces this module needs from core (re-exported, not redefined)
  index.ts       # the ONLY file other modules or the app entrypoint may import
  <domain>.test.ts
```

- `routes.ts` parses and validates the request, calls `service.ts`, shapes the response. No business logic in the router.
- `service.ts` holds the actual behavior. Depends on `repo.ts` and on ports from `src/core/`, never on another module's `service.ts` or `repo.ts` directly.
- `repo.ts` is the only file that touches this module's own database tables. No other module, and no other file inside this module, runs a query.
- `ports.ts` declares the interfaces this module consumes (for example `EmailSender`, `ObjectStore`). The concrete adapter lives in `src/core/`, this file only describes the shape the module depends on.
- `index.ts` re-exports the module's public surface: the router, and whatever typed functions or types other modules are allowed to call. Nothing else escapes the folder.

## Single-public-index rule

- Every module has exactly one public entrypoint: `index.ts`.
- Any import that reaches past `index.ts` into `service.ts`, `repo.ts`, or an internal helper of another module is a violation, even when it "just needs one function."
- If a second module needs something a sibling module has not exported, add it to that sibling's `index.ts` on purpose. Do not reach around the boundary because exporting it properly felt like too much ceremony.

## Ports and adapters (hexagonal-lite)

- Infra dependencies, Postgres, Redis, S3, AI providers, external HTTP, live behind an interface (a "port") declared in `src/core/ports/`.
- The concrete implementation (an "adapter") lives in `src/core/adapters/` and is wired at app bootstrap, not imported directly by a module.
- A module imports the port type and receives an implementation through dependency injection (a constructor param or a small factory), never `import { s3Client } from "../../core/adapters/s3"` inline in a service.
- This is "lite" hexagonal: no full ports-and-adapters ceremony, no CQRS, no event bus by default. Just enough indirection that swapping Postgres for a different store, or mocking S3 in tests, never touches module code.

## Allowed dependency directions

```
routes.ts -> service.ts -> repo.ts
service.ts -> core/ports/*                 (interfaces only)
module/index.ts -> another module's index.ts   (the only legal cross-module edge)
```

Never allowed:
- `module A` importing anything under `module B/` other than `module B/index.ts`.
- `module A` importing a concrete infra client (`pg`, `ioredis`, an S3 SDK client) directly, instead of the port in `src/core/`.
- `repo.ts` in one module querying another module's tables. Cross-domain reads go through the owning module's `service.ts`, exposed via `index.ts`.
- A dependency cycle between two modules' `index.ts` files. If A needs B and B needs A, one of them is drawn at the wrong boundary, split out a shared module instead.

## Folder-by-feature

- Organize by domain (`users/`, `billing/`, `notifications/`), never by technical layer (`controllers/`, `services/`, `models/` at the top level). A layer-first tree makes every feature change touch five folders; a feature-first tree keeps a change local to one.
- Shared, domain-agnostic code (a date formatter, a generic pagination helper) lives in `packages/shared` or `src/lib/`, not duplicated per module and not smuggled into a specific module's folder because it happened to be needed there first.

## Splitting a module when it grows

Signs a module has outgrown one folder: `service.ts` past a few hundred lines with clearly separable concerns, `repo.ts` querying more than one clear sub-domain of tables, or the module's tests grouping into obviously distinct scenarios.

- First move: split the file, not the module. `service.ts` becomes `service/index.ts` re-exporting from `service/create.ts`, `service/billing-cycle.ts`, and so on. The module's external boundary, `index.ts` at the module root, does not change.
- Second move, only if the sub-concerns are genuinely separate domains with their own data and their own reason to change independently: promote a sub-concern to its own sibling module with its own `index.ts`, and have the original module depend on it through that index like any other module.
- Never split a module because it "feels big." Split because two people would keep colliding on unrelated changes to the same file, or because a sub-concern's data and logic are independently owned.

## Anti-spaghetti checklist

Before merging any change that touches module boundaries:

- [ ] No import statement reaches past a module's `index.ts`.
- [ ] No module imports a concrete infra client, only a port from `src/core/`.
- [ ] No circular dependency between two modules' public indexes.
- [ ] `routes.ts` contains no business logic, only parse, validate, delegate, shape response.
- [ ] `repo.ts` in this module queries only this module's own tables.
- [ ] New shared logic went into `packages/shared` or `src/lib/`, not copy-pasted into a second module.

## How the boundary checker enforces it

- CI runs a dependency-boundary lint (an ESLint rule set such as `eslint-plugin-boundaries`, or an equivalent import-graph check configured in the repo) that fails the build on any deep import into a module's internals or a direct infra-client import outside `src/core/adapters/`.
- Treat a boundary-checker failure as a hard gate, the same severity as a failing test. Do not silence it with an inline eslint-disable to unblock a PR, fix the import or extend the module's `index.ts` on purpose.
- `jal-architect` owns keeping the boundary-checker config in sync with the module layout as the project grows.
