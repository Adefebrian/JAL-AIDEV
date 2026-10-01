---
user-invocable: false
name: jal-standards
description: JAL engineering constitution: approved stack, forbidden tech, frontend law (no overlap, white-first, no gradients, no shadows, no side lines, section concept law, mobile-first, JEV and ui_audit gates), security hardening, AI default. Read before building or reviewing any JAL project.
---

# JAL Engineering Constitution

This is the single source of truth for how JAL projects are built. Every other skill and agent in this plugin defers to this file. When in doubt, this file wins.

## Stack: Approved

- Use Bun as the runtime and package manager. No exceptions.
- Use Hono for backend HTTP services and APIs.
- Use React for frontend UI.
- Use TypeScript everywhere. No plain JavaScript in new code.
- Use Docker for containerization and local parity with production.
- Use Redis for caching, rate limiting, and ephemeral state.

## Runtime: Bun Only

- Bun is the only JS/TS runtime. It is both runtime and package manager for every JAL project.
- Never use node, deno, ts-node, tsx, or nodemon, in any script, Dockerfile, CI job, or package.json.
- Every run, build, test, and script entry point invokes bun directly.

## Stack: Forbidden

- Never use Vite. Bun is the build tool and dev server.
- Never use Next.js or any heavy SSR framework that taxes server CPU or RAM.
- Never use webpack or Create React App. The one carve-out: Remotion Studio and `@remotion/bundler` bring their own webpack inside a separate video workspace (`packages/video`), never as an app's bundler.
- Never use node, deno, ts-node, tsx, or nodemon. Bun replaces all of them.
- Never introduce any technology outside the approved stack without reporting it to Brian for confirmation first. Propose, wait, then use.

## Polyglot: Go and Rust

- Go and Rust are allowed only as compiled gRPC sidecar services under services/. Never as a JS/TS runtime substitute.
- Justify the sidecar to Brian first and get a yes before writing it. Opt-in per project, never a default.
- Reserve Go or Rust for CPU-bound or latency-critical hot paths that Bun cannot serve fast enough. Everything else stays in Bun/Hono/TypeScript.
- Bun/Hono owns the proto contract. The sidecar implements it, it does not define it.
- See skill jal-polyglot for the detailed workflow.

## Architecture: Modular Monolith

- Modular monolith is mandatory. Do not split a JAL project into microservices without Brian's sign-off.
- Domain modules live under apps/api/src/modules/<domain>/, one directory per domain.
- Each module exposes exactly one public index.ts. Everything else in the module is private to it.
- Cross-module imports go through the owning module's index.ts only. Never reach into another module's internals.
- Infra dependencies, Postgres, Redis, S3, AI providers, sit behind ports/adapters in src/core/. Modules depend on the port, not the concrete client.
- Every project is a Turborepo monorepo, no exceptions.
- See skill jal-architecture for module anatomy and detail.

## Animation (Only If Needed)

- Reach for animation only when the interaction genuinely needs it, not by default.
- Remotion is the main core motion (Brian, 2026-10-01; skill jal-remotion). It is never installed in a project that needs no motion. When a build needs motion, JEV `motion.engine` decides per section: Remotion is the first choice for timeline or composed motion (product intros, hero motion pieces, data stories, product demos, explainers) and is used directly for every video or MP4 request. The supplements below stay and combine with it; JEV may pick another library when it fits, and any complex extra stack needs Brian's confirmation.
  - Packages: `remotion`, `@remotion/player`, `@remotion/web-renderer`, `@remotion/media`, `@remotion/preload`, and the visual packages a recipe needs (`@remotion/transitions`, `@remotion/shapes`, `@remotion/paths`, `@remotion/layout-utils`, `@remotion/captions`, `@remotion/three`, `@remotion/gsap`, and the rest in `jal-remotion` `references/core/api-remotion.md`), all exact-pinned to one version, through the opt-in video module (`templates/modules/video`, copied to `packages/video`). Mediabunny is pinned to Remotion's paired version; the deprecated `@remotion/media-parser` and `@remotion/webcodecs` are never installed.
  - Websites stay on `Bun.build` with the Player in a lazy split chunk. Remotion Studio, `@remotion/cli`, and `@remotion/bundler` live only inside a separate video workspace.
  - MP4 output defaults to in-browser rendering (`renderMediaOnWeb`, WebCodecs, no headless Chrome). A local CLI or Chrome Headless Shell render, a Coolify render service, Lambda, Cloud Run, or Vercel needs Brian's confirmation per project (`video.render_path`).
  - License: the free Remotion License (JAL is 3 people, every project internal), `licenseKey: 'free-license'` where an API asks. Warn and stop if a 4th team member or an external client appears.
  - Privacy: the Player sends nothing. In-browser export sends the page origin and the visitor's IP to Remotion: free to use in internal tools and dev pages; on a public page only when the feature is needed, with one privacy-policy line and no UI text added automatically.
  - Off until Brian says yes: paid items (cube transition, Editor Starter, paid templates, Timeline), ElevenLabs, the OpenAI Whisper API, transformers.js or ONNX, `remotion skills add`, free-form LLM code generation (runtime generation uses gpt-4o-mini with a zod-validated JSON scene spec). CC0-only sound effects; Geist in video, `@remotion/google-fonts` only inside video renders; animated emoji only when a brief asks; compositions follow full page law, with the canvas exemption for scene content only.
- Use Lenis for smooth scrolling.
- Use GSAP for complex timeline and scroll-triggered animation.
- Use Framer Motion for React-native component and gesture animation.
- Use three.js with React Three Fiber and drei for 3D, only on a section that passed JEV `imm.gate` (see skill jal-immersive). A lit product scene builds on the opt-in scene module (`templates/modules/scene`, copied to `packages/scene`). Approved by Brian (2026-09-29): `@react-three/postprocessing` and `postprocessing` (with its bundled `n8ao`) through that module's tier-gated `PostFX` (no bloom: bloom is banned in the canvas outside a noyzzi section), and CC0 Poly Haven models, HDRIs, and textures fetched into the client project at build time with `scripts/assets/polyhaven.ts` (never mirrored into JAL-AIDEV, listed in the project's `ASSETS.md`).
- OriginKit (https://www.originkit.dev/) is approved. Agents may use real OriginKit components in client projects whenever JEV (`ui.component_recipe`) picks one and JAL law holds. Its license forbids vendoring components into starter kits or templates, so the JAL-AIDEV template ships only the clean-room `ok.*` recipes (`skills/jal-motion/references/components.md`, indexed in `skills/jal-design-system/references/recipe-index.md`). OriginKit needs a signed-in account and agents never sign in, so the source comes from Brian's account: pasted by him, or through OriginKit's MCP connected with his key. Its CLI (`npx originkit add`) is not used: copy the source and adapt it to Bun.build and the JAL tokens (Tailwind through the JAL `@theme`).
- Animate transform and opacity only, on the motion tokens in jal-ui-taste, and honor `prefers-reduced-motion` on every animation. See skill jal-motion for product and showcase motion.

## Frontend Law

- No overlap, ever. Tidiness is rule number 1. No element (text, icon, or component) overlaps a sibling; only true overlay layers (dialog, menu, tooltip, popover, listbox) stack, inside their own layer. No child extends outside its parent's box unless the parent is an explicit scroll container, and the right edges of stacked regions line up. No clipped text without a deliberate ellipsis and the full value still reachable. Icons inside controls get reserved padding so they never touch the text. Rows fit their container (`minmax(0, 1fr)` tracks, `box-sizing: border-box`, `min-width: 0`, no fixed widths that can exceed it). `ui_audit` verifies this at every width.
- Never use an em-dash character anywhere in frontend content. Use commas, colons, or periods instead.
- Never use eyebrow labels, glow effects, neon, or any other AI-slop visual pattern.
- The default background is always white, off-white, broken white, or light beige. Never a dark or colored default background. Black is ink only; a dark background is allowed only inside a dedicated, explicitly requested dark mode.
- Never use gradients, of any kind, anywhere. Flat neutral surfaces only. This overrides any older feralui.dev allowance.
- Never use emoji or emoticons on any surface. Use a real koboyo/reicon icon when a glyph is needed.
- Never draw decorative lines or marks: no connector lines between cards/tiers, no side/top/bottom accent stripes on panels, no marker dots or squares beside headings or labels. Rank and group with spacing, order, and type. Only functional hairline neutral dividers between structural regions are allowed.
- Never put a side line on any card or panel, ever. No `border-left`, `border-right`, `border-inline-start`, or `border-inline-end` accent stripe (nothing wider than 1px, nothing colored differently from the other sides), no `box-shadow: inset` stripe trick, no pseudo-element bar, no top or bottom accent bar, no active-tab underline. Status is an icon plus a title on a tonal surface inside a full hairline border; selection is a full ring or a tonal fill. This is absolute.
- Never use shadows. Depth comes from tonal layer steps and hairline borders only. No `box-shadow` with a blur above 0, no `filter: drop-shadow`, no elevated cards, menus, toasts, or dialogs (dialogs use a neutral scrim). The single exception is a spread-only focus ring (`0 0 0 Npx`), and `outline` is preferred.
- Use one restrained accent at most, never purple, violet, or indigo. The primary action is ink on white by default.
- Conceptualize every section before any markup: its job, its one primary message, its primary action (if any), and its container. A section with no job is deleted. Adjacent sections vary in structure; no template repetition.
- Pick the container per region with the layout doctrine in jal-ui-taste (rows, bento, divided-section, card, plain-spacing; records render as rows). Bento Grid stays the default for mixed summary content unless the content genuinely calls for something else.
- Keep the design modern, minimalist, and clean, Apple/Google grade. No decoration without purpose.
- Mobile-first is mandatory: build the app-shell (sticky header, independent scroll, fixed bottom tab bar below 640px) first, then expand to tablet and desktop. Every surface is super mobile-friendly with a dedicated app-like mobile presentation, no horizontal scroll at 320/375/414/768/1280, and 44px touch targets.
- Normalize every form control to the one 44px control height token, measured not eyeballed. Interactive control boundaries use the `border-control` token (3:1 contrast, WCAG 1.4.11); cards and dividers keep the light hairline.
- Keep layout, sizing, spacing, and padding consistent across the whole product, on the generated core tokens in jal-ui-taste. No large empty gaps, no dead grid cells, no empty void inside a card, and no fake-fill with stretched gaps.
- Source icons from the koboyo MCP first. Fall back to https://reicon.dev/ only when koboyo has no match.
- Run the JEV decision layer (the `jev_decide` tool) at its four points on every UI build: density pick, region and component gate, designmd screen, final taste verdict. JEV is final on soft calls and has no authority over this law. If JEV is unreachable after retries, fall back to agent judgment and stamp the report `UNVERIFIED BY JEV`.
- Never call a screen done until the `ui_audit` tool reports PASS at every width. `SKIPPED` is not a pass.
- Design-system integration is knowledge-only. Never add Astryx, Material Web, or Carbon runtime packages (`@astryxdesign/*`, `@material/web`, `@carbon/react`, `@carbon/styles`) or their toolchains (StyleX, Lit, Sass) without Brian's explicit yes. They are merged, as knowledge, into one JAL design system, JAL Core (see jal-design-system): Astryx is the foundation, Carbon the data and form layer. JAL Core ships as code in the template: tokens and `ui.css`, plus the identity kit (`packages/ui/src/kit` and `kit.css`), and every page is composed from the kit with the direction set by one `data-direction` attribute. Never pick a different design system per product.
- designmd is supplementary only: read tools only, never upload or delete. Every kit is JEV-screened and law-filtered before it may influence anything.

## Search (SEO, AEO, GEO)

- Public websites use `/jal-seo-geo-aeo`: audit, integrate, boost, submit, monitor. It follows the standard in `seo-geo-aeo/standard.md`. Its hard law: verified facts only, one text for people and machines, one source per fact, language as a URL, no self-serving review markup, verbatim quotes only, measured metadata, secrets in env, no SERP scraping, and outward submissions confirmed in chat (IndexNow on production boot is the standing exception).

## Backend / Security

- Ship automatic security hardening on every project: secure HTTP headers, Redis-backed rate limiting, a CORS allowlist, input validation, secrets loaded from env only, and dependency auditing.
- Never hardcode secrets, keys, or credentials in code or config files.
- Run the installed hunt-* skills for deep security scans before shipping.
- Keep every project resource-light and server-optimized. Do not default to heavy frameworks or unnecessary background processes.
- Run red team passes via skill jal-redteam-ops.
- Run blue team passes via skill jal-blueteam-ops.

## AI Default

- Default every new AI integration to OpenAI gpt-4o-mini.
- Run gpt-4o-mini with a maxed configuration (max tokens, full capability) unless the task specifies otherwise.
- Report any deviation from this default model to Brian before use.

## Deploy / Infra

- The only permitted deploy target is Coolify at deploy.jalgroup.id. No other target, no exceptions.
- Use self-hosted PostgreSQL for the database layer.
- Use S3-compatible object storage at s3.datacenter.jalgroup.id.
- Run CI/CD on GitHub Actions with a self-hosted gh runner and Turborepo.
- Keep all JAL projects in a single GitHub monorepo.

## Git Safety (Summary)

- Branch feature work off main. Never commit directly to main.
- Use git worktrees when running parallel agent work on the same repo.
- Tag stable Docker images so rollback is always one command away.
- Write commit messages in conventional commit format.
- Never force-push a shared branch.
