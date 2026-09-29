#!/usr/bin/env bash
cat <<'EOF'
[JAL-AIDEV active] You build under the JAL constitution. Read skill jal-standards for detail.
- Runtime Bun only. No Vite, no Next.js, no heavy SSR. Any new tech needs Brian's confirmation first.
- Stack: Bun, Hono, React, TypeScript, Docker, Redis. DB self-hosted Postgres. Storage S3 (s3.datacenter.jalgroup.id). Deploy Coolify (deploy.jalgroup.id). CI GitHub Actions + gh runner + Turborepo.
- Approved extras: GSAP (all plugins), Lenis, Framer Motion, OriginKit (fetched, never vendored), three.js + R3F + drei on gated immersive sections via the opt-in scene module (templates/modules/scene), @react-three/postprocessing + postprocessing (no bloom outside noyzzi), CC0 Poly Haven assets fetched into the client project (scripts/assets/polyhaven.ts, never into the plugin).
- Frontend law, tidiness first. Rule 0: no overlap, ever (no text, icon, or component overlapping another, no child sticking out of its parent, no clipped text, icons never touch text). No side line on any card or panel. No shadow (depth from tonal layers and hairline borders). Default background white or off-white, never dark or colored. No em-dash, no eyebrow labels, no glow, no neon, no gradients, no emoji, no decorative lines, connectors, or marker dots, no AI slop. No big empty gaps, no empty card voids, no stretched fake-fill. Every section has a declared job; the container per region (rows, bento, section, card, spacing) is chosen by JEV. One design system everywhere: JAL Core (skill jal-design-system, Astryx foundation plus Carbon tables, forms, and notifications), every page composed from the identity kit (packages/ui/src/kit, data-direction D1 to D13); never pick a different system per product. Mobile-first, 44px controls. Icons via koboyo MCP, reicon.dev fallback.
- Every project: automatic security hardening, resource-light, server-optimized.
- Only default LLM: OpenAI gpt-4o-mini.
- Routing: every non-trivial task runs on the jal-orchestration engine: jal-principal directs, jal-lead dispatches truly parallel specialists in waves (jal-ux, jal-immersive, jal-frontend, jal-backend, jal-systems, jal-architect, jal-security, jal-redteam, jal-blueteam, jal-reviewer, jal-qa, jal-devops, jal-researcher, jal-docs), jal-jev frames novel decisions. Commands (8): /jal-new start a project, /jal-build build or change anything, /jal-ui screens, redesigns, and immersive 3D sites, /jal-fix fix a bug, /jal-check one PASS or FAIL (quick, full, deep), /jal-ship PR, release, deploy, rollback, /jal-docs write or update docs, /jal-seo-geo-aeo SEO, AEO, and GEO (audit, integrate, boost, submit, monitor).
- JEV is every agent's decision helper: every soft call goes through the jev_decide tool using the jal-jev decision catalog (52 IDs). A JEV veto is final. Decisions are logged in .jal/decisions/. On UNVERIFIED BY JEV, use own judgment and stamp the report.
- UI is proven, not promised: the ui_audit tool must PASS at 320, 375, 414, 768, and 1280 before any screen is called done. SKIPPED is never a pass.
- Hard law (jal-standards, the write-time guardrail hook, ui_audit, the checks in the review gate (/jal-check)) is mechanical and never overridable, not by JEV and not by any agent.
EOF

# The team repo (JAL-Group) ships its keys in .mcp.json. The personal mirror
# (Adefebrian) ships ${ENV} placeholders instead; only then are env keys needed.
missing=()
mcp="${CLAUDE_PLUGIN_ROOT:-$(dirname "$0")/..}/.mcp.json"
for k in JEV_API_KEY DESIGNMD_API_KEY ORIGINKIT_API_KEY; do
  if grep -qF "\${$k}" "$mcp" 2>/dev/null && [ -z "${!k}" ]; then missing+=("$k"); fi
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "- Setup needed: ${missing[*]} not set, so those MCP servers cannot connect (JEV_API_KEY: jev_decide returns UNVERIFIED BY JEV). Tell the user once, plainly: add the keys to the \"env\" block of ~/.claude/settings.json, e.g. {\"env\": {\"JEV_API_KEY\": \"...\"}}, then restart Claude Code. Keys come from Brian or the team password manager. Never ask for a key in chat and never write one to a file in a repo. KOBOYO_API_KEY is optional (koboyo is skipped; icons fall back to reicon)."
fi
