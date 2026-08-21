---
description: Scaffold a Go or Rust gRPC sidecar in services/<name>/ with a Bun-side typed client, only for a hot path Bun cannot serve.
argument-hint: <name> <go|rust>
---

Scaffold a compiled sidecar named `$1` in language `$2` (full argument: $ARGUMENTS). Reference skill `jal-polyglot` for the decision rubric and layout behind this scaffold, do not re-derive it here. Delegate the actual implementation to agent `jal-systems`.

## Steps, in order

1. **Validate `$2`.** Must be exactly `go` or `rust`. Anything else, stop and fail loudly.
2. **Print this line verbatim before doing anything else:** `new tech: confirm with Brian`. A compiled sidecar sits outside the default Bun-only stack per skill `jal-standards`, this print is mandatory disclosure every run, never skip it even on repeat invocations.
3. **Dispatch to agent `jal-systems`** to build `services/$1/`:
   - `proto/$1.proto`: the service contract, proto-first, define this before any server code.
   - Server stub in `$2` implementing the proto, minimal and benchmarked, no unrelated dependencies.
   - `Dockerfile` for the sidecar, multi-stage build, small final image.
   - A Coolify service entry documenting how this sidecar deploys alongside the main app.
   - A Bun-side typed gRPC client generated from the proto, placed under the consuming app's `lib/` so Bun callers get full types.
4. **Check for a plugin template first.** If `${CLAUDE_PLUGIN_ROOT}/templates/services/$2` exists, use it as the starting skeleton instead of writing every file from a blank slate.
5. **Verify.** The sidecar builds (`docker build` if Docker is available, otherwise compile check for `$2`), and the Bun client typechecks against the generated proto types.

Report what was created and the verification result. Stay terse.
