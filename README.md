# jal-aidev

JAL engineering guardrails and the Pawang agent crew for Claude Code. It builds backend, frontend, and UI to one JAL standard, judges its own decisions with JEV, and proves the UI with an automatic check before calling anything done.

## Install

New teammate (needs GitHub access to `JAL-Group/JAL-AIDEV`, for example `gh auth login`):

```
claude plugin marketplace add JAL-Group/JAL-AIDEV
claude plugin install jal-aidev@jal-aidev-marketplace
```

Update to the latest version:

```
claude plugin marketplace update jal-aidev-marketplace
claude plugin update jal-aidev@jal-aidev-marketplace
```

Use the full name `jal-aidev@jal-aidev-marketplace`; the short name `jal-aidev` fails with "Plugin not found". After installing or updating, fully quit and reopen Claude so the new agents, skills, and tools load.

API keys: the team install from `JAL-Group/JAL-AIDEV` already carries them, so there is nothing to set up. Only the personal mirror (`Adefebrian/JAL-AIDEV`) ships without keys; it reads them from your environment. For that mirror, get the keys from Brian, add them to the `env` block of `~/.claude/settings.json`, and restart Claude:

```json
{
  "env": {
    "JEV_API_KEY": "...",
    "DESIGNMD_API_KEY": "...",
    "ORIGINKIT_API_KEY": "..."
  }
}
```

`KOBOYO_API_KEY` is optional. A missing key only disables that one tool, and the session start tells you which key is missing.

Releasing: push `main` and the tags to `JAL-Group/JAL-AIDEV` as usual, then build the key-free mirror with `bun scripts/release/mirror-clean.ts` and push `main --tags` from the directory it prints to `Adefebrian/JAL-AIDEV`. The rewrite is deterministic, so that push is a fast-forward.

## How it works

- **The crew.** Any real task goes through the Pawang crew: jal-principal sets direction, jal-lead splits the work and runs independent pieces in parallel, specialists build, and the review gate decides when it is done.
- **JEV is the judge.** JEV (TypeSafe's decision model) makes the small, bounded calls: which specialists a task needs, what can run in parallel, how dense tables and lists should be, whether a section is worth building, how severe a security finding is, whether a release is ready. Its verdict on those calls is final. Every decision is logged in `.jal/decisions/` so you can see why. Secrets are stripped before anything is sent.
- **Hard law is mechanical.** The JAL rules (Bun only, no gradients, no shadows, no side lines on cards, no overlap, white-first, no emoji or em-dash, and the rest in `jal-standards`) are enforced by a write-time guard and by checks. JEV can never override them.
- **UI is proven, not promised.** The automatic UI check opens the page in Chrome at 320, 375, 414, 768, and 1280 pixels wide and fails on overlap, anything sticking out of its container, clipped text, side stripes, shadows, gradients, dark backgrounds, mismatched field heights, form fields stretched wider than 640px, a phone layout without a pinned header and bottom tab bar, motion that keeps running when a visitor asks for reduced motion, empty card space, and more. A screen is not done until it passes.

## Agents

| Agent | Role |
|-------|------|
| jal-principal | Head assistant: direction, architecture bar, final ship gate |
| jal-lead | Splits work and runs the crew in parallel |
| jal-jev | The judge: frames and settles new decisions with JEV |
| jal-architect | System design and technical specifications |
| jal-ux | Design system owner: builds or redesigns screens to the JAL standard |
| jal-frontend | Frontend development to the jal-ux standard |
| jal-immersive | Immersive, animated, and 3D websites: Three.js, shaders, scroll stories, noyzzi pieces |
| jal-backend | Backend services on Bun and Hono |
| jal-systems | Go or Rust sidecars for hot paths Bun cannot serve |
| jal-security | Security baseline and vulnerability assessment |
| jal-redteam | Offensive security: exploit or disprove |
| jal-blueteam | Defensive hardening and fix verification |
| jal-reviewer | Code review and module-boundary gate |
| jal-qa | Tests, coverage, and the UI check |
| jal-devops | Deploys and infrastructure |
| jal-researcher | Research, with every fetched page screened before use |
| jal-docs | Technical and non-technical docs in JAL Docs, every claim checked against the code |

## Commands

Eight commands. Each one runs the whole crew on the JAL orchestration engine: it plans, splits the work across specialists that run in parallel, lets JEV make the judgment calls, checks everything, and fixes what fails before calling it done.

| Command | What it is for | What it covers |
|---------|----------------|----------------|
| `/jal-new` | Start a new project | Scaffold from the JAL template, install, first commit, a build and test proof. Optionally builds the first version right away |
| `/jal-build` | Build or change anything | Features end to end, backend modules and API routes, database migrations, Go or Rust sidecars (asks Brian first), architecture decision records, and any screens the change needs |
| `/jal-ui` | Anything visual | New screens, redesigns, landing pages, and immersive or 3D websites. JEV picks product UI, marketing, or immersive mode. Built phone first and proven with the 22-rule UI check |
| `/jal-fix` | Fix a bug properly | Reproduce, root cause, a failing test, the fix, and proof. Several suspects are checked in parallel |
| `/jal-check` | One PASS or FAIL | `quick` (rules, tests, UI check), `full` (plus security hardening, boot test, ship call), and `deep` (plus a deep audit and a red team versus blue team pentest). JEV picks the depth if you do not |
| `/jal-ship` | Get it out | `pr` (pull request), `release` (version, changelog, tag), `deploy` (deploy.jalgroup.id with a health check), and `rollback`. The full check runs first; it never deploys unless you say so |
| `/jal-seo-geo-aeo` | Search: SEO, AEO, and GEO | `audit` (scores 0 to 100 with evidence), `integrate` (installs the full search layer: facts, prerender, sitemaps, llms files, structured data, IndexNow, crawler log), `boost` (raises the scores and proves the delta), `submit` (IndexNow, Bing, Yandex, always confirmed first), and `monitor` (crawlers, index coverage, performance) |
| `/jal-docs` | Documentation | Technical and non-technical docs written from the code, with every claim checked. It opens a PR on JAL-Group/malasbaca, then merges and deploys JAL Docs automatically when every check passes (it asks you or your team for the Coolify token at deploy time) |

The old commands still exist as internal playbooks inside `skills/jal-orchestration/references/`, so nothing they did is lost.

| Old command | Now |
|---|---|
| `/jal-scaffold` | `/jal-new` |
| `/jal-ship` (feature), `/jal-orchestrate`, `/jal-module`, `/jal-service`, `/jal-migrate`, `/jal-adr` | `/jal-build` |
| `/jal-ui`, `/jal-immersive` | `/jal-ui` |
| `/jal-debug` | `/jal-fix` |
| `/jal-review`, `/jal-audit`, `/jal-pentest` | `/jal-check` |
| `/jal-pr`, `/jal-release`, `/jal-deploy` | `/jal-ship` |

## Skills

21 skills back the agents and commands. The main ones:

- `jal-standards`: the JAL engineering constitution. Read before building or reviewing anything.
- `jal-ui-taste`: the design core. Generated type, spacing, radius, and color scales, the no-overlap rule, section concept, and the JEV decision points for UI.
- `jal-design-system`: JAL Core, the one JAL design system. Meta Astryx is the foundation, IBM Carbon supplies tables, forms, and notifications, and a few Google Material pieces cover mobile touch. One spec per component, so every product looks like the same team built it. JEV only sets how dense tables and lists are. Knowledge only, no extra packages. The identity ships as code in the template: the JAL Core kit (`packages/ui/src/kit` and `kit.css`: Masthead, Split, Bento, spec rails and tables, stat rows, feature grids, media frames, quotes, logos, FAQ, CTA band, pricing, footers, sticky stories, plus page-recipe and Bento validators). Every page is composed from it, and one `data-direction` attribute (D1 to D13) sets the look (`references/identity.md`).
- `jal-design-system` also holds the craft floor (`references/craft.md`, from impeccable) and the visual directions with the seeded direction pick (`references/directions.md`, from impeccable and refero), so every product gets a fresh, deliberate look instead of the obvious first idea.
- `jal-immersive`: all motion and 3D in one place: GreenSock's eight official GSAP skills (MIT) with the JAL layer, Lenis, the JAL frame core, and the immersive and 3D core. Three.js (WebGL and WebGPU/TSL), React Three Fiber and drei, shaders, particles, clean-room effects (rain, puddles, sand, grass, ocean), performance tiers, poster-first loading, GSAP and Lenis scroll choreography, the JAL frame core for live product demos, and the noyzzi catalogue. JEV picks and combines recipes per section. Premium 3D (`references/premium-3d.md`) sets the bar for product scenes: real CC0 Poly Haven assets fetched into the client project (`scripts/assets/polyhaven.ts`), motivated light, one persistent scene with a moving camera. It builds on the opt-in scene module (`templates/modules/scene`, copied to `packages/scene` only for an immersive page) with a tier-gated post stack and never bloom.
- `jal-motion`: restrained product motion plus richer showcase choreography, and 167 component motion recipes from Magic UI and Animata (plain CSS and Tailwind), always with reduced-motion support.
- `jal-jev`: the decision catalog, 52 standard decisions (orchestration, UI, motion, immersive, backend, security, QA, review, memory, docs, search) with their exact questions and thresholds.
- `jal-frontend-rules`: the CSS recipes that keep UI tidy.

- `jal-orchestration`: the one engine behind every command: waves of truly parallel agents, JEV as every agent's decision helper, verification and commits by the lead, and the playbooks the old commands became.
- `jal-docs`: how documentation is written for JAL Docs from evidence only.

Also: `jal-scaffold`, `jal-architecture`, `jal-rpc`, `jal-polyglot`, `jal-security-hardening`, `jal-redteam-ops`, `jal-blueteam-ops`, `jal-qa-automation`, `jal-git-safety`, `jal-memory`, `jal-adr`, `jal-release`.

## It learns

JAL-AIDEV gets better with use:
- **Every UI build records what it stacked and how it scored**, in the project's `.jal/memory/design-log.jsonl`. The next build reads that history, so JEV favors what worked and avoids what failed.
- **Teach it a new reference:** say "learn this reference: <url>" in any command. JAL researches it, JEV screens it for slop, fit, and license, and it is wired into the recipe index.
- **Learnings proven across builds and projects become a pull request to JAL-AIDEV.** You review it, and your whole team gets it on the next plugin update.
- The anti-slop rules never change through learning.

## Design references

Every reference is integrated as knowledge (no extra packages, except the approved scene module dependencies below) and is used by a pipeline step, not just stored. JEV picks among them per section, and the build report names the recipe and source for every section. The full map is in `skills/jal-design-system/references/source-map.md`.

- **Design system and UIUX:** Meta Astryx (foundation), IBM Carbon (data and forms), Google Material (state layers, mobile navigation), impeccable (craft floor, critique, seeded direction pick), refero (visual directions, type statistics), designmd.ai (screened supplementary kits).
- **Components and motion:** Magic UI and Animata (167 recipes), bang-motion (showcase choreography), GSAP skills (scroll choreography), the JAL frame core (Remotion's idea, rebuilt).
- **Immersive and 3D:** noyzzi (sections, hover effects, 3D elements), Threejs-Awesome-Graphics-Agent-Skills, webgpu-claude-skill, threejs-game-skills, nixie-fx, ai-dev-kit, three.js and pmndrs, plus clean-room rebuilds of the GPL or unlicensed effects. Approved by Brian (2026-09-29): Poly Haven CC0 models, HDRIs, and textures, fetched into client projects at build time and never into this plugin, and `@react-three/postprocessing` with `postprocessing` in the scene module's `PostFX`.

## Bundled tools (MCP)

- **jal-design**: `jev_decide` (ask JEV), `ui_audit` (the automatic UI check, 22 rules), `ui_shots` (real screenshots of every screen through the page scroller, for the critic gate; WebGL captures get `?scene-tier=full` automatically so the critic sees the live scene), `noyzzi_list` / `noyzzi_get` (the noyzzi catalogue and live prompts or code), `docs_verify` (checks every documentation claim against the source and scans for secrets), and `design_history` (what past builds stacked and how it scored). Runs on Bun, no extra dependencies.
- **designmd**: design references from designmd.ai. Supplementary only, read-only, and every kit is screened by JEV before use.
- **koboyo-icons**: the icon library. Fallback: https://reicon.dev.
- **originkit**: OriginKit components on demand (search, list, get, fetch). JEV picks them; they are fetched into client projects only, never into this plugin.

The JEV, designmd, and OriginKit keys ship inside the plugin so the whole team gets them with no setup. That means anyone with access to this repo holds them. Keep the repo private and inside JAL.

## Requirements

- Bun installed and on PATH (the guard and the tools run on Bun).
- Google Chrome or Chromium installed for the UI check (`CHROME_PATH` overrides the location).

## Docs website

A static docs site lives in `docs-site/`, built with Bun:

```
cd docs-site && bun install && bun run build
bun run serve
```

## Specification

- v0.3.0 design intelligence: [docs/superpowers/specs/2026-09-28-jal-design-intelligence-design.md](docs/superpowers/specs/2026-09-28-jal-design-intelligence-design.md)
- Original design: [docs/superpowers/specs/2026-08-06-jal-aidev-design.md](docs/superpowers/specs/2026-08-06-jal-aidev-design.md)
