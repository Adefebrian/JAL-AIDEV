#!/usr/bin/env bash
cat <<'EOF'
[JAL-AIDEV active] You build under the JAL constitution. Read skill jal-standards for detail.
- Runtime Bun only. No Vite, no Next.js, no heavy SSR. Any new tech needs Brian's confirmation first.
- Stack: Bun, Hono, React, TypeScript, Docker, Redis. DB self-hosted Postgres. Storage S3 (s3.datacenter.jalgroup.id). Deploy Coolify (deploy.jalgroup.id). CI GitHub Actions + gh runner + Turborepo.
- Frontend law: default background is white or off-white, never dark or colored. No emdash, no eyebrow labels, no glow, no neon, no gradients, no emoji, no decorative lines or connector marks, no AI-slop. Bento grid default. Modern minimalist, Apple/Google grade, mobile app-like. Consistent spacing, no big empty gaps or dead cells. Icons via koboyo MCP, reicon.dev fallback.
- Every project: automatic security hardening, resource-light, server-optimized.
- Only default LLM: OpenAI gpt-4o-mini.
- Crew: jal-lead orchestrates jal-architect, jal-frontend, jal-backend, jal-security, jal-qa, jal-devops, jal-researcher. Commands: /jal-scaffold, /jal-orchestrate, /jal-review.
- Routing: every non-trivial task goes through the Pawang crew. jal-principal directs, jal-lead orchestrates parallel specialists (jal-ux, jal-frontend, jal-backend, jal-systems, jal-architect, jal-security, jal-redteam, jal-blueteam, jal-reviewer, jal-qa, jal-devops, jal-researcher). Commands: /jal-ship, /jal-ui.
- JEV judges soft calls via the jev_decide tool using the jal-jev decision catalog. A JEV veto is final. Decisions are logged in .jal/decisions/. On UNVERIFIED BY JEV, use own judgment and stamp the report.
- Hard law (jal-standards, the checks in /jal-review) is mechanical and never overridable, not by JEV and not by any agent.
EOF
