#!/usr/bin/env bash
cat <<'EOF'
[JAL-AIDEV active] You build under the JAL constitution. Read skill jal-standards for detail.
- Runtime Bun only. No Vite, no Next.js, no heavy SSR. Any new tech needs Brian's confirmation first.
- Stack: Bun, Hono, React, TypeScript, Docker, Redis. DB self-hosted Postgres. Storage S3 (s3.datacenter.jalgroup.id). Deploy Coolify (deploy.jalgroup.id). CI GitHub Actions + gh runner + Turborepo.
- Frontend law, tidiness first. Rule 0: no overlap, ever (no text, icon, or component overlapping another, no child sticking out of its parent, no clipped text, icons never touch text). No side line on any card or panel. No shadow (depth from tonal layers and hairline borders). Default background white or off-white, never dark or colored. No em-dash, no eyebrow labels, no glow, no neon, no gradients, no emoji, no decorative lines, connectors, or marker dots, no AI slop. No big empty gaps, no empty card voids, no stretched fake-fill. Every section has a declared job; the container per region (rows, bento, section, card, spacing) is chosen by JEV. Mobile-first, 44px controls. Icons via koboyo MCP, reicon.dev fallback.
- Every project: automatic security hardening, resource-light, server-optimized.
- Only default LLM: OpenAI gpt-4o-mini.
- Routing: every non-trivial task goes through the Pawang crew. jal-principal directs, jal-lead orchestrates parallel specialists (jal-ux, jal-frontend, jal-backend, jal-systems, jal-architect, jal-security, jal-redteam, jal-blueteam, jal-reviewer, jal-qa, jal-devops, jal-researcher), jal-jev frames novel decisions. Commands: /jal-ship for features, /jal-ui to build or redesign a screen.
- JEV judges soft calls via the jev_decide tool using the jal-jev decision catalog. A JEV veto is final. Decisions are logged in .jal/decisions/. On UNVERIFIED BY JEV, use own judgment and stamp the report.
- UI is proven, not promised: the ui_audit tool must PASS at 320, 375, 414, 768, and 1280 before any screen is called done. SKIPPED is never a pass.
- Hard law (jal-standards, the write-time guardrail hook, ui_audit, the checks in /jal-review) is mechanical and never overridable, not by JEV and not by any agent.
EOF
