---
user-invocable: false
name: jal-blueteam-ops
description: Defensive security workflow for JAL projects, hardening beyond the v0.1.0 baseline, detection and logging, triaging red-team findings from jal-redteam-ops, and verifying fixes actually close the gap. Use when responding to a security finding, adding logging or detection, or confirming a patch before it ships.
---

# JAL Blue Team Ops

Defensive half of the security loop, paired with `jal-redteam-ops`. Where red team ops finds and proves a gap, blue team ops closes it and confirms the closure.

## Hardening beyond the v0.1.0 baseline

`jal-security-hardening` defines the default checklist every project ships with: secure headers, Redis rate limiting, CORS allowlist, input validation, env-only secrets, dependency audit. Treat that as the floor, not the ceiling:

- Re-verify the baseline checklist is still true after every change that touches routing, auth, or middleware order. A header or rate limiter registered in the wrong order silently stops protecting what it should.
- Add hardening specific to what the project actually does: stricter limits on auth/OTP-style endpoints, tighter validation on file upload paths, prompt-injection-resistant boundaries around the gpt-4o-mini integration. Never let raw model output drive a privileged action without a validation step.
- Keep hardening resource-light per `jal-standards`, security is not an excuse to bolt on a heavy framework or an unnecessary background service. The fix should fit the same Bun/Hono/Redis footprint as the rest of the project.

## Detection and logging

- Log security-relevant events with enough structure to act on later: auth failures (with rate, not just occurrence), rate-limit breaches, validation rejections at the route boundary, and any 4xx/5xx spike on a sensitive route.
- Logs go somewhere queryable, not just stdout that scrolls away. Ship them to whatever the project's log sink is (Coolify's log aggregation or a shipped-to service), tagged with enough context, route, IP, user id if authenticated, to correlate an incident after the fact.
- Never log secrets, full request bodies containing credentials, or raw tokens, structured logging is not an exception to the env-only-secrets rule in `jal-standards`.
- Alert on the events that matter operationally: a sustained spike in rate-limit breaches on an auth route, a sudden spike in 401/403s, a dependency audit finding a new critical CVE. A log line nobody reads is not detection.

## Triage red-team findings

When a finding arrives from `jal-redteam-ops`:

- Confirm the exploit-or-disprove verdict independently before prioritizing. Do not take the PoC at face value without reproducing it once on the blue-team side, this catches a false positive before it burns a fix cycle.
- Severity-rank by real impact (data exposure, auth bypass, financial or business-logic abuse) and reachability (public unauthenticated route vs admin-only vs a rare precondition), not just by which hunt-* skill flagged it.
- Anything severe enough to block ship gets fixed before release. Anything lower-severity gets logged to `.jal/memory/` with a clear reason if it is deliberately deferred, silent deferral is not an option.

## Verify fixes

- A fix is not done until the original PoC from the red-team finding no longer reproduces. Re-run the exact repro steps, do not just eyeball the diff and assume it is fixed.
- Check that the fix did not just move the gap: a validation added to one route but not a near-duplicate route, a rate limit added to the endpoint but keyed in a way that is trivially bypassed, for example IP-only when the real risk is per-account.
- Add a regression test that encodes the fixed vulnerability's repro as a failing-then-passing test case where practical, per `jal-qa-automation`, so the same class of gap trips a test next time instead of waiting for another red-team pass.
- Close the loop back to `.jal/memory/`: record what the gap was, what closed it, and what test now guards it, so the next JAL project scaffolded from this one starts with the lesson already applied.
