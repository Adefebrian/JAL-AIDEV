---
description: Deep scan of the repo, security, architecture drift, dependency audit, dead code, bundle size, in one consolidated report.
---

Run a full audit of the current repo state. Do every check below, then emit exactly one consolidated report. Never stop early because one check already failed, collect every finding first, then report once.

## Checks

**(a) Security.** Dispatch agent `jal-blueteam` to run the security-hardening checklist and the installed hunt-* skills against the codebase (secure headers, rate limiting, CORS allowlist, input validation, env-only secrets, no hardcoded credentials). Reference skill `jal-security-hardening` for the full list.

**(b) Architecture drift.** Run `bun run check:boundaries` at the repo root. Any violation is a finding, quote the offending import and the module it crosses. Reference skill `jal-architecture` for the allowed dependency directions.

**(c) Dependency audit.** Run `bun audit` (or `bun pm audit` if that is the current subcommand) across every workspace. Block on any critical or high finding, list the package and advisory.

**(d) Dead code.** Scan for unused exports, unreferenced files, and modules with no inbound import anywhere in the tree. Report each candidate with its path, do not auto-delete anything, this is a finding for a human to confirm.

**(e) Bundle size.** For any app with a build step, run the build and report the output size per entrypoint. Flag anything that grew unexpectedly versus the last known baseline if one is recorded.

## Report format

One consolidated block, no separate messages per check:

```
JAL AUDIT
(a) Security: PASS|FAIL [findings]
(b) Architecture drift: PASS|FAIL [findings]
(c) Dependency audit: PASS|FAIL [findings]
(d) Dead code: PASS|FAIL [findings]
(e) Bundle size: PASS|FAIL [findings]

JAL AUDIT: PASS|FAIL
```

The final line is always exactly `JAL AUDIT: PASS` or `JAL AUDIT: FAIL`, PASS only when all five checks pass. On FAIL, list every specific finding (file, line, what is wrong) so it can be routed to the owning specialist without re-deriving it.
