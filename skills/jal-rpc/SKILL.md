---
name: jal-rpc
description: Hono end-to-end type safety, export AppType from the Hono app, consume it with a typed hono/client on the frontend, keep the backend route as the single source of the API contract, and never hand-write fetch response types. Use when wiring frontend-to-backend calls, adding a new API route, or reviewing a fetch call for type drift.
---

# JAL RPC: End-to-End Types via Hono

Detail layer for how JAL frontends talk to JAL backends. One contract, one source of truth, zero hand-written response types.

## Export AppType from the Hono app

The Hono app's route chain, chained with `.route()`, `.get()`, `.post()`, and so on, carries the full type of every route's input and output. Export it once from the backend entrypoint:

```ts
// apps/api/src/index.ts
import { Hono } from "hono";
import { users } from "./modules/users";
import { billing } from "./modules/billing";

const app = new Hono()
  .route("/users", users)
  .route("/billing", billing);

export type AppType = typeof app;
export default app;
```

- `AppType` is derived automatically from the chained routes. Do not write a parallel `.d.ts` describing the same routes by hand, it will drift the moment a route changes and no compiler will catch it.
- Chain routes with `.route()` rather than mounting them separately when the combined type needs to flow through. A route registered outside the chain does not appear in `AppType`.

## Typed hono/client on the frontend

```ts
// packages/api-client/src/index.ts
import { hc } from "hono/client";
import type { AppType } from "@jal/api";

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

```ts
// usage in a component
const res = await api.users[":id"].$get({ param: { id: userId } });
if (!res.ok) throw new Error("failed to load user");
const user = await res.json(); // fully typed from the route's actual response
```

- The frontend imports the type only (`import type { AppType } from "@jal/api"`), never the running server code, so the client bundle stays clean.
- Path params, query params, JSON body, and the response shape are all inferred from the backend route definition. Renaming a field on the backend produces a type error on every frontend call site that used it, before it ever reaches runtime.

## Single source of contract

- The backend route handler's Zod (or equivalent) validator schema and return type are the contract. There is no separate OpenAPI file, no separate TypeScript interface, no GraphQL schema running in parallel that could disagree with what the route actually does.
- If a route needs to be documented for an external consumer, generate that documentation from the same route definitions (for example `@hono/zod-openapi`) rather than maintaining a second hand-written spec.

## No hand-written fetch types

- Never write `interface UserResponse { id: string; name: string }` by hand next to a `fetch("/users/1")` call. That is exactly the drift `hono/client` exists to eliminate.
- If a call site is using raw `fetch` instead of the typed client, that is a bug to fix, not a pattern to extend. Route every frontend-to-backend call through the shared `hc<AppType>` client in `packages/api-client`.
- A raw `fetch` is acceptable only for a genuinely external third-party API that is not part of the JAL monorepo, and even then prefer a typed wrapper over the raw response.

## Reference

Depends on the Hono/TypeScript/Turborepo stack mandated by `jal-standards`. Keep `AppType` exported from one place and imported everywhere it is needed, never redefined.
