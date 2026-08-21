---
name: jal-security-hardening
description: Default security checklist for every JAL project (secure headers, Redis rate limiting, CORS allowlist, input validation, env-only secrets, dependency audit) plus pointer to installed hunt-* skills for deep scans. Use before shipping any JAL backend, reviewing a PR for security, or hardening an API.
---

# JAL Security Hardening

Default hardening every JAL project ships with, no opt-in required. Defers to `jal-standards`, which mandates this baseline on every project.

## Default checklist

Run through this on every new API and re-check it on every PR that touches routing, auth, or dependencies.

**Secure HTTP headers**
- Set via middleware on every response: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in CSP), `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` behind TLS.
- Hono: use `hono/secure-headers` middleware, apply globally with `app.use(secureHeaders())` before route registration.

**Redis-backed rate limiting**
- Every public-facing route gets a rate limit, keyed by IP + route, backed by Redis (never in-memory, in-memory counters reset on every deploy and do not work across multiple instances).
- **Never key the limit on the left-most `X-Forwarded-For` value.** That segment is attacker-controlled, so a client can rotate it per request and get unlimited attempts. Key on the socket peer address, or on a hop your own proxy appends at the right-hand end of the chain, and only trust `X-Forwarded-For` at all when the request came from a proxy you control. Verify with a test that sends a changing `X-Forwarded-For` and still gets throttled.
- **Key on the matched route pattern, not the raw path.** Keying on the raw URL lets an attacker mint unlimited distinct keys for one endpoint (`/login?a=1`, `/login?a=2`, trailing slashes, casing, path params), which resets the counter every request.
- **Decide fail-open vs fail-closed deliberately and write it down.** A limiter that fails open when Redis is unreachable means an outage removes all rate limiting; that may be acceptable, but it must be a stated choice, and any environment running without Redis has no protection at all.
- Auth and OTP-style endpoints get a stricter limit than general API traffic.
- Return `429` with a `Retry-After` header on limit breach, never a silent drop.

**CORS allowlist**
- Explicit origin allowlist, never `*`, never a reflected-origin wildcard.
- Allowlist lives in env config, not hardcoded in route code, so staging vs prod origins differ without a code change.
- Credentialed requests (`credentials: "include"`) require the allowlist to be exact-match, not a regex that could over-match a lookalike domain.

**Input validation**
- Validate every request body, query param, and path param against a schema (zod or equivalent) at the route boundary, before any handler logic runs.
- Reject on validation failure with `400` and a structured error, never let unvalidated data reach a DB query or downstream call.
- Validate file uploads: content-type, size limit, and (if applicable) magic-byte sniffing, not just the client-supplied extension.

**Secrets loaded from env only**
- No API keys, DB credentials, or tokens in code, config files, or committed `.env` files.
- `.env` is gitignored; `.env.example` documents required keys with placeholder values only.
- Secrets reach the runtime via env vars injected by Coolify (or docker-compose locally), never baked into a Docker image layer.

**Dependency audit**
- Run `bun audit` (or the current Bun equivalent) before every release and on a CI schedule, not just at scaffold time.
- Any critical/high finding blocks the release until patched or explicitly accepted with a written reason in `.jal/memory/`.
- New dependencies outside the approved stack still need Brian's sign-off per `jal-standards`, independent of whether they pass audit.

## Deep scans: hunt-* skills

This checklist is the baseline, not the ceiling. Before shipping anything handling auth, payments, user data, or third-party integrations, run the relevant installed `hunt-*` skills for a deeper pass:

- Auth/session surface: `hunt-auth-bypass`, `hunt-session`, `hunt-mfa-bypass`, `hunt-ato`, `hunt-brute-force`.
- API surface: `hunt-api-misconfig`, `hunt-idor`, `hunt-graphql` (if applicable), `hunt-cors`, `hunt-csrf`.
- Injection classes: `hunt-sqli`, `hunt-nosqli`, `hunt-ssrf`, `hunt-ssti`, `hunt-xss`, `hunt-xxe`, `hunt-deserialization`, `hunt-lfi`.
- Infra/config: `hunt-cloud-misconfig`, `hunt-cicd`, `hunt-tls-network`, `hunt-source-leak`, `hunt-open-redirect`.
- LLM integration (relevant given the gpt-4o-mini default): `hunt-llm-ai` for prompt injection and data exfiltration paths through the AI feature.

`jal-security` (the agent) owns running these continuously and reporting fast-fix findings back through `/jal-review`. Any finding severe enough to block ship gets logged to `.jal/memory/` so the same class of gap does not recur in the next project.

## Red team / blue team ops

This checklist and the hunt-* deep scans above are the baseline security posture. For a structured offensive pass, scope it and run it through `jal-redteam-ops` (scope, recon, hunt-*/bug-bounty mapping, exploit-or-disprove, evidence, responsible reporting). For the defensive response, hardening beyond this baseline, detection and logging, triage of red-team findings, and verifying a fix actually closes the gap, run it through `jal-blueteam-ops`. Every exploited finding from a red team pass gets handed to the blue team pass before it counts as resolved.
