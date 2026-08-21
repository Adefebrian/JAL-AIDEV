---
name: jal-polyglot
description: Decision rubric and workflow for Go or Rust gRPC sidecars in a JAL project, only for a CPU-bound or latency-critical hot path Bun cannot serve, proto-first contract, the services/<name>/ layout (proto, server, Dockerfile), gRPC wiring to the Bun client, the Coolify service, and reporting the sidecar to Brian. Use when a performance problem is suspected to need a compiled sidecar, or when adding or reviewing a Go or Rust service.
---

# JAL Polyglot: Go/Rust Sidecars

Detail layer for the "Polyglot: Go and Rust" section of `jal-standards`. Go and Rust are never a JS/TS runtime substitute. They exist only as compiled gRPC sidecars for the rare hot path Bun genuinely cannot serve.

## Decision rubric: do you actually need a sidecar

Answer these in order. Stop and stay in Bun the moment one answer is "no."

1. Is this path CPU-bound or latency-critical (sub-millisecond budget, tight numeric loop, heavy parsing or encoding, high-throughput streaming) rather than I/O-bound? I/O-bound slowness, a slow DB query, an unbatched N+1, a missing cache, is a Bun/Hono problem, not a language problem. Fix it in place first.
2. Have you benchmarked the path in Bun first, with a real profile (production build, realistic payload size), and confirmed Bun itself is the bottleneck rather than the query, the network hop, or an unindexed table?
3. Is the bottleneck isolated enough to move behind a narrow gRPC contract, without dragging half the domain module's logic across the process boundary?
4. Have you gotten a yes from Brian on this specific sidecar, before writing it? `jal-standards` requires this sign-off for any tech outside the approved stack, sidecars included. This is opt-in per project, never a default.

If all four are yes, proceed. If any is no, the answer is optimize the Bun code, add a cache, or fix the query, not reach for Rust.

## Proto-first contract

- Bun/Hono owns the contract. Write the `.proto` file before writing a line of sidecar server code.
- The proto lives with the sidecar under `services/<name>/proto/`, but the Bun side is the source of truth for what the contract says. The sidecar implements it, it does not redefine it later.
- Version the proto deliberately: additive field changes are safe, renaming or renumbering a field is a breaking change and needs a new service version, not an in-place edit that silently desyncs client and server.
- Generate typed stubs for both sides from the same proto file, never hand-write a client struct that mirrors the proto by eye.

## Sidecar layout under services/<name>/

```
services/<name>/
  proto/<name>.proto
  src/               # Go or Rust source
  Dockerfile
  README.md          # what hot path this serves, why Bun could not, benchmark numbers
```

- One sidecar, one clear job. Do not let a sidecar accumulate a second unrelated hot path over time, that is a new sidecar with its own justification.
- The Dockerfile builds a minimal, statically linked (Go) or release-mode (Rust) binary image. No dev toolchain in the shipped image.
- `README.md` in the sidecar folder is not optional: it records the benchmark that justified the sidecar's existence, so a future reviewer does not have to re-derive whether it is still needed.

## gRPC wiring to the Bun client

- The Bun/Hono side calls the sidecar through a generated gRPC client, wrapped behind a port in `src/core/ports/` per `jal-architecture`, exactly like any other infra dependency. A domain module never dials the sidecar's socket directly.
- Set explicit deadlines on every call from Bun to the sidecar. A sidecar that hangs must not hang the request that called it.
- Health-check the sidecar (the gRPC health-checking protocol or a simple ping RPC) and fail closed with a clear error if it is unreachable, never silently fall back to a slow in-process path that masks the sidecar being down.

## Coolify service

- The sidecar deploys as its own service on Coolify at `deploy.jalgroup.id`, alongside the main app, not bundled into the API's container.
- Wire the sidecar's internal address to the Bun app via env var (service discovery through Coolify's internal network), never a hardcoded IP or a public endpoint for an internal-only sidecar.
- Scale and resource-limit the sidecar independently, it likely has a very different CPU/RAM profile than the Bun API it serves.

## Report to Brian

- Before writing the sidecar: propose it (what hot path, what benchmark showed Bun insufficient, what language and why) and wait for a yes, per the decision rubric above.
- After shipping: report what was built, the before/after benchmark, and the new operational surface, one more Coolify service, one more Dockerfile, one more thing to monitor. A sidecar is a standing cost. Brian should know it exists and why.
