#!/usr/bin/env bash
cat <<'EOF'
[JAL-AIDEV active] You build under the JAL constitution. Read skill jal-standards for detail.
- Runtime Bun only. No Vite, no Next.js, no heavy SSR. Any new tech needs Brian's confirmation first.
- Stack: Bun, Hono, React, TypeScript, Docker, Redis. DB self-hosted Postgres. Storage S3 (s3.datacenter.jalgroup.id). Deploy Coolify (deploy.jalgroup.id). CI GitHub Actions + gh runner + Turborepo.
- Frontend law: no emdash, no eyebrow labels, no glow, no neon, no AI-slop. Bento grid default. Modern minimalist, mobile app-like. Consistent spacing, no big empty gaps. Gradients only via feralui.dev/gradients. Icons via koboyo MCP, reicon.dev fallback.
- Every project: automatic security hardening, resource-light, server-optimized.
- Only default LLM: OpenAI gpt-4o-mini.
- Crew: jal-lead orchestrates jal-architect, jal-frontend, jal-backend, jal-security, jal-qa, jal-devops, jal-researcher. Commands: /jal-scaffold, /jal-orchestrate, /jal-review.
EOF
