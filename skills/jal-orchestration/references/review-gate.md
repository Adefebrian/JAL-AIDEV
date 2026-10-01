# Playbook: Review gate (one PASS/FAIL)

Internal playbook, run through the `jal-orchestration` engine by a JAL command (see `../SKILL.md` for which command runs it). Run the consolidated guideline, security, QA, UI audit, runtime smoke, and JEV ship gate on the repo and emit one PASS/FAIL report.

Run the full JAL review gate against the current repo state. Do every check below, then emit exactly one consolidated report ending in `JAL REVIEW: PASS` or `JAL REVIEW: FAIL`. Never stop early because one check already failed, collect every failure first, then report once.

Checks (a) to (g) are hard checks. JEV judges only the soft calls in (g) and (h), with question templates and thresholds per skill jal-jev, via `mcp__plugin_jal-aidev_jal-design__jev_decide` {state, questions, decision_id, domain}. A failed hard check is `JAL REVIEW: FAIL` regardless of any JEV verdict. On `UNVERIFIED BY JEV`, use your own judgment and stamp that line of the report `UNVERIFIED BY JEV`.

## Checks

**(a) Em-dash scan, frontend.**
Run `grep -rn $'\xe2\x80\x94' apps/web packages/ui 2>/dev/null` (adjust the paths if the repo layout differs). Any match is a fail, quote file and line in the report. Zero matches is a pass. Reference skill jal-frontend-rules for the full banned-pattern list, also scan for eyebrow labels, glow, and neon while you are in there.

**(b) Banned dependency scan.**
Run `grep -rln '"\(vite\|next\|@vitejs\|webpack\|create-react-app\)"' --include=package.json -r .` across every `package.json` in the repo. Any match is a fail, name the package.json path and the offending dependency. Zero matches is a pass. Reference skill jal-standards for the full forbidden-tech list. Also run `grep -rln '"@remotion/\(media-parser\|webcodecs\)"' --include=package.json --exclude-dir=node_modules -r .` (deprecated, never installed) and `grep -rln '"@remotion/\(cli\|studio\|bundler\|browser-bundler\|renderer\|lambda\|cloudrun\|vercel\)"' --include=package.json --exclude-dir=node_modules -r .`: any match outside a video workspace package (a directory named `video` or `video-*`) is a fail, and a headless render package needs Brian's recorded yes (skill jal-remotion).

**(c) Test suite.**
Run `bun test` at the repo root. Capture the pass/fail result and list every failing test file by name, do not summarize failures away. A clean run that hides unexplained skipped or todo tests is also a fail, per jal-qa-automation.

**(d) Security hardening checklist.**
Run the jal-security-hardening checklist against the repo: secure HTTP headers, Redis-backed rate limiting, CORS allowlist, input validation, env-only secrets (no hardcoded credentials), dependency audit (`bun audit`, block on critical/high). Report each item pass/fail with the file that proves or disproves it.

**(e) Runtime smoke.**
Build and tests have passed before while the app could not boot, so actually boot it. Bring up local deps if the app needs them (docker-compose Postgres and Redis). Build the web app, then start the api and web on unused scratch ports (for the JAL template: `PORT=<api-port> bun apps/api/src/index.ts` and `WEB_PORT=<web-port> bun apps/web/serve.ts`). Hit `curl -fsS http://127.0.0.1:<api-port>/health` and `curl -fsS http://127.0.0.1:<web-port>/`. Any boot crash, non-2xx, or timeout is a fail, quote the first error line. Kill both processes afterwards. A repo with no api or no web skips that half and says so.

**(f) UI audit.** Required for any project with a frontend.
With the web app from (e) still up, run `mcp__plugin_jal-aidev_jal-design__ui_audit` {url, widths?} against its URL. `FAIL` is a fail, list every violation (rule, width, selector). `SKIPPED` is also a fail, give the reason, the audit has to actually run. A repo with no frontend reports `N/A`.

**(g) Security ship block.**
Collect every open security finding (from (d), `bun audit`, and any jal-security, jal-redteam, or jal-blueteam report on this change). Critical/high from `bun audit` is a hard fail. For the rest, run `sec.ship_block` over the open set. A block verdict is a fail, name each blocking finding. No open findings is a pass.

**(h) JEV ship call.**
Last, run `rev.ship` over the results of (a) to (g) and the diff under review. A no-go is a fail with JEV's reason. `rev.ship` can turn a PASS into a FAIL, it can never turn a FAIL into a PASS.

## Report format

One consolidated block, no separate messages per check:

```
JAL REVIEW
(a) Em-dash scan: PASS|FAIL [details]
(b) Banned deps: PASS|FAIL [details]
(c) bun test: PASS|FAIL [details]
(d) Security hardening: PASS|FAIL [details]
(e) Runtime smoke: PASS|FAIL [api /health, web /]
(f) UI audit: PASS|FAIL|N/A [violations]
(g) Security ship block: PASS|FAIL [blocking findings]
(h) JEV ship call: PASS|FAIL [rev.ship verdict, or UNVERIFIED BY JEV]

JAL REVIEW: PASS|FAIL
```

The final line is always exactly `JAL REVIEW: PASS` or `JAL REVIEW: FAIL`. PASS only when every check is PASS (or N/A for (f) on a repo with no frontend). On FAIL, list every specific failure (file, line, what is wrong) so `jal-lead` can route each finding to the owning specialist without re-deriving it.
