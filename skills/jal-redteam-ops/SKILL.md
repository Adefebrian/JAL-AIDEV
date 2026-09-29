---
user-invocable: false
name: jal-redteam-ops
description: Offensive security workflow for JAL projects, defining scope, recon, mapping findings to the installed hunt-* and bug-bounty skills, exploit-or-disprove discipline, evidence capture, and responsible reporting back into the project. Use when running an offensive security pass, red-teaming a JAL app before ship, or triaging a suspected vulnerability class.
---

# JAL Red Team Ops

Offensive half of the security loop referenced from `jal-standards` and `jal-security-hardening`. Paired with `jal-blueteam-ops`, which owns the defensive response to whatever this workflow finds.

## Scope

- Scope to the project actually being shipped: the deployed Coolify service, its exposed routes, its auth flows, its third-party integrations, its AI feature if it has one. Never test infrastructure or accounts outside the JAL project's own boundary without explicit authorization, this is authorized internal testing, not open-ended hunting.
- State scope explicitly before starting: the target URL(s) or environment, which environments are in-bounds (staging vs prod), and any explicitly out-of-bounds action, for example no destructive writes against prod data, no testing against real user accounts.
- Re-confirm scope any time the target's surface changes materially: a new auth provider, a new payment integration, a new AI-facing endpoint.

## Recon

- Enumerate the actual attack surface before touching a payload: routes (from the Hono app's route tree), auth boundaries, third-party integrations, the AI feature's input and output surface, exposed static assets, and any subdomain or environment beyond the primary one.
- Read the code, not just the black-box surface, this is a white-box pass on an owned project. Check `apps/api/src/modules/*/routes.ts` for every exposed endpoint, check `src/core/adapters/` for what infra it actually touches, check env and config for anything that leaked into a client bundle.
- Note the stack-specific surface: Hono middleware order (a security header or rate limiter registered after a route it should protect is a real, common finding), Redis-backed rate limits that might not be keyed correctly, CORS allowlist config, and the gpt-4o-mini integration's prompt/output boundary.

## Map to installed hunt-* and bug-bounty skills

Do not hand-roll technique research, this plugin ships an extensive library, route by target shape:

- Auth/session: `hunt-auth-bypass`, `hunt-session`, `hunt-mfa-bypass`, `hunt-ato`, `hunt-brute-force`, `hunt-oauth`.
- API surface: `hunt-api-misconfig`, `hunt-idor`, `hunt-cors`, `hunt-csrf`, `hunt-graphql` (if applicable), `hunt-business-logic`.
- Injection: `hunt-sqli`, `hunt-nosqli`, `hunt-ssrf`, `hunt-ssti`, `hunt-xss`, `hunt-xxe`, `hunt-deserialization`, `hunt-lfi`.
- Infra/config: `hunt-cloud-misconfig`, `hunt-cicd`, `hunt-tls-network`, `hunt-source-leak`, `hunt-open-redirect`, `hunt-host-header`.
- AI feature (relevant given the gpt-4o-mini default): `hunt-llm-ai` for prompt injection, system-prompt extraction, and exfiltration paths through the model.
- For a broader end-to-end pass, or when the target resembles an external bug bounty engagement, start from `bb-methodology` or `bug-bounty`/`bb-local-toolkit` for the full recon-to-report workflow rather than picking hunt-* skills piecemeal.
- Pick the skill or skills that match what recon actually surfaced. Running every hunt-* skill against a target with no matching surface wastes the pass, target the ones whose trigger conditions are actually present.

## Exploit-or-disprove

- Every suspected finding gets resolved to one of two states before it is written up: exploited (a concrete PoC that demonstrates real impact) or disproven (a specific reason the suspected path is not actually reachable or exploitable). "Looks suspicious" is not a valid end state.
- Prefer the minimal PoC that proves impact without causing damage: a read-only IDOR proof that returns another user's data once, not a mass-scrape; a blind SSRF confirmed via an out-of-band callback, not a live pivot into internal infra.
- If a finding cannot be exploited but also cannot be confidently disproven, for example a theoretical race condition that needs load infrastructure to trigger reliably, report it as unresolved with the reasoning. Do not round it up to confirmed or down to fine.

## Evidence

- Capture evidence for every exploited finding: the request/response pair (redacted per session and PII hygiene), the exact steps to reproduce, and the observed impact.
- Follow the redaction discipline from `evidence-hygiene` when capturing anything containing session cookies, tokens, or another user's PII, this is an internal project but the hygiene habit prevents evidence itself from becoming a leak.
- Store findings in `.jal/memory/` (per `jal-memory`) so a fixed class of vulnerability does not silently reappear in the next project because the finding was only ever in someone's head.

## Responsible reporting

- Report every finding to the owning agent or team through the normal review path (the review gate (`/jal-check`)), severity-ranked, with the exploit-or-disprove verdict and evidence attached. No finding gets held back or downplayed to keep a ship date.
- Hand off exploited findings to `jal-blueteam-ops` for the fix-and-verify loop, do not fix-and-forget on the red team side. The blue team pass confirms the fix actually closes the path the red team pass opened.
- This is authorized testing of JAL's own project. Nothing here authorizes testing any system outside the defined scope, that is a distinct, separately authorized engagement covered by `bug-bounty`/`bb-local-toolkit`.
