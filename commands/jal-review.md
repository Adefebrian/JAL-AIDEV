---
description: Run the consolidated guideline, security, and QA gate on the repo and emit one PASS/FAIL report.
---

Run the full JAL review gate against the current repo state. Do every check below, then emit exactly one consolidated report ending in `JAL REVIEW: PASS` or `JAL REVIEW: FAIL`. Never stop early because one check already failed, collect every failure first, then report once.

## Checks

**(a) Em-dash scan, frontend.**
Run `grep -rn $'\xe2\x80\x94' apps/web packages/ui 2>/dev/null` (adjust the paths if the repo layout differs). Any match is a fail, quote file and line in the report. Zero matches is a pass. Reference skill jal-frontend-rules for the full banned-pattern list, also scan for eyebrow labels, glow, and neon while you are in there.

**(b) Banned dependency scan.**
Run `grep -rln '"\(vite\|next\|@vitejs\|webpack\|create-react-app\)"' --include=package.json -r .` across every `package.json` in the repo. Any match is a fail, name the package.json path and the offending dependency. Zero matches is a pass. Reference skill jal-standards for the full forbidden-tech list.

**(c) Test suite.**
Run `bun test` at the repo root. Capture the pass/fail result and list every failing test file by name, do not summarize failures away. A clean run that hides unexplained skipped or todo tests is also a fail, per jal-qa-automation.

**(d) Security hardening checklist.**
Run the jal-security-hardening checklist against the repo: secure HTTP headers, Redis-backed rate limiting, CORS allowlist, input validation, env-only secrets (no hardcoded credentials), dependency audit (`bun audit`, block on critical/high). Report each item pass/fail with the file that proves or disproves it.

## Report format

One consolidated block, no separate messages per check:

```
JAL REVIEW
(a) Em-dash scan: PASS|FAIL [details]
(b) Banned deps: PASS|FAIL [details]
(c) bun test: PASS|FAIL [details]
(d) Security hardening: PASS|FAIL [details]

JAL REVIEW: PASS|FAIL
```

The final line is always exactly `JAL REVIEW: PASS` or `JAL REVIEW: FAIL`, PASS only when all four checks pass. On FAIL, list every specific failure (file, line, what is wrong) so `jal-lead` can route each finding to the owning specialist without re-deriving it.
