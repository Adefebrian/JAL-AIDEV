// docs-site/src/content.ts
//
// Single source of truth for every piece of copy on the docs site. build.ts
// (via render.ts) turns this into the final static HTML, and
// content.test.ts imports the same data to assert the required section
// markers, the study case titles, and the no em dash rule, so the page and
// the test can never drift apart.
//
// Facts here (agent names, command names, argument hints) are read directly
// from agents/*.md and commands/*.md at the repo root, not invented.

export type NavItem = {
  id: string;
  label: string;
  icon: "home" | "install" | "terminal" | "faq";
};

export const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "install", label: "Install", icon: "install" },
  { id: "commands", label: "Commands", icon: "terminal" },
  { id: "faq", label: "FAQ", icon: "faq" },
];

export const SECTION_MARKERS = {
  overview: "What is JAL-AIDEV",
  install: "Install and enable it per project",
  constitution: "The constitution, in plain words",
  agents: "The agent hierarchy",
  commands: "Commands",
  studyCases: "Study cases",
  faq: "FAQ and troubleshooting",
} as const;

export const HERO = {
  kicker: "Pawang crew for Claude Code",
  title: "Ship faster without shipping spaghetti.",
  body:
    "JAL-AIDEV is a Claude Code plugin: a written constitution plus a crew of specialist agents that plan, build, review, and ship your project the same way every time. Install it once, turn it on per project, and every change gets checked against the same architecture bar before it lands.",
  primaryCta: { label: "Install the plugin", href: "#install" },
  secondaryCta: { label: "Read the constitution", href: "#constitution" },
  stats: [
    { value: "14", label: "specialist agents" },
    { value: "15", label: "slash commands" },
    { value: "1", label: "constitution, no exceptions" },
  ],
};

export const OVERVIEW = {
  title: SECTION_MARKERS.overview,
  lead:
    "A codebase drifts a little on every unreviewed change: a shortcut here, a copy pasted pattern there, one more dependency nobody vetted. JAL-AIDEV exists to catch that drift before it becomes the reason a project is hard to touch six months from now.",
  points: [
    {
      title: "One constitution, every project",
      body:
        "A single written standard for the stack, the architecture, the frontend look, and the security baseline. Every agent builds to it, every review checks against it.",
    },
    {
      title: "A crew, not a chatbot",
      body:
        "Fourteen specialist agents, each with a narrow job: architecture, frontend, backend, security, QA, deploy. A lead orchestrates them so work happens in parallel, not one slow conversation at a time.",
    },
    {
      title: "Guardrails, not a lecture",
      body:
        "Hooks and review gates catch a banned dependency or a boundary violation automatically, before it reaches a human reviewer, so taste and safety are not a matter of remembering.",
    },
  ],
  whyTitle: "Why this matters",
  why:
    "Spaghetti code and architectural drift are not one big mistake, they are hundreds of small unreviewed ones. JAL-AIDEV protects a project from that by making the good path the only path: one approved stack, one module shape, one frontend system, one security checklist, applied automatically on every task instead of hoped for.",
};

export const INSTALL = {
  title: SECTION_MARKERS.install,
  lead:
    "Install the plugin once for your Claude Code account, then turn it on per project. Both steps are one line each.",
  steps: [
    {
      title: "Add the marketplace",
      body: "Point Claude Code at the JAL-AIDEV marketplace repository.",
      code: "/plugin marketplace add JAL-Group/JAL-AIDEV",
    },
    {
      title: "Install the plugin",
      body: "Pull the plugin itself: agents, commands, skills, and hooks.",
      code: "/plugin install jal-aidev",
    },
    {
      title: "Auto enable it per project",
      body:
        "Add this to the project's .claude/settings.json so the plugin turns on automatically for anyone who opens the repo, no manual enable step per teammate.",
      code: '{\n  "enabledPlugins": {\n    "jal-aidev@jal-aidev-marketplace": true\n  }\n}',
      filename: ".claude/settings.json",
    },
  ],
  note:
    "Bun must be installed and on PATH. The plugin's guardrail hook runs via bun, so a machine without it on PATH will see the hook fail rather than silently skip.",
};

export const CONSTITUTION = {
  title: SECTION_MARKERS.constitution,
  lead:
    "The constitution is the one file every agent defers to. Here is what it actually says, without the legal-document tone.",
  items: [
    {
      title: "Bun only, nothing else",
      body:
        "Bun is the runtime and the package manager, full stop. No Vite, no Next.js, no plain node, no deno, no ts-node. Every script, build, and test runs through bun directly.",
    },
    {
      title: "Modular monolith",
      body:
        "One deployable app, split into domain modules under apps/api/src/modules/. Each module exposes exactly one public index.ts, everything else stays private to it. No microservices without sign off.",
    },
    {
      title: "Go and Rust, only as sidecars",
      body:
        "Go or Rust are allowed only as compiled gRPC sidecars under services/, and only for a CPU-bound hot path Bun genuinely cannot serve fast enough. They implement the proto contract, they never define it.",
    },
    {
      title: "Deploy target: deploy.jalgroup.id",
      body:
        "Coolify at deploy.jalgroup.id is the only permitted deploy target. Every image is tagged, so a rollback is always one command, never a manual recovery.",
    },
    {
      title: "Frontend law",
      body:
        "No em dash, no eyebrow labels, no glow, no neon, no gradients. Bento grid by default, mobile app-shell on phones, one spacing and one type scale everywhere. Default background stays white or off-white, never a dark or colored fill.",
    },
    {
      title: "gpt-4o-mini by default",
      body:
        "Every new AI integration defaults to OpenAI's gpt-4o-mini, run at full capability. A different model is a decision to report, not a silent swap.",
    },
    {
      title: "Security hardening ships on day one",
      body:
        "Secure headers, Redis backed rate limiting, a CORS allowlist, input validation, env-only secrets, and dependency auditing are not a follow-up task, they ship with the first commit.",
    },
  ],
};

export type Agent = {
  slug: string;
  tier: "head" | "lead" | "specialist";
  line: string;
};

export const AGENTS: Agent[] = [
  {
    slug: "jal-principal",
    tier: "head",
    line: "Head of the crew: owns direction, the architecture bar, project scope, and the final ship gate.",
  },
  {
    slug: "jal-lead",
    tier: "lead",
    line: "Orchestrates the crew: decomposes a task, dispatches specialists in parallel, runs the build, review, fix loop.",
  },
  {
    slug: "jal-architect",
    tier: "specialist",
    line: "Stack gatekeeper: designs solutions inside Bun, Hono, React, TypeScript, Docker, and Redis, and vets any new dependency.",
  },
  {
    slug: "jal-frontend",
    tier: "specialist",
    line: "Builds the UI: Bento grid layouts, the mobile app-shell, koboyo or reicon icons, white-first and no gradients.",
  },
  {
    slug: "jal-ux",
    tier: "specialist",
    line: "Owns the design system and cross-surface taste: type scale, spacing rhythm, tokens, and UX heuristics.",
  },
  {
    slug: "jal-backend",
    tier: "specialist",
    line: "Builds APIs on Bun and Hono with Postgres, Redis, S3, hardening middleware, and gpt-4o-mini wiring.",
  },
  {
    slug: "jal-systems",
    tier: "specialist",
    line: "Builds and benchmarks Go or Rust gRPC sidecars for the hot paths Bun genuinely cannot serve fast enough.",
  },
  {
    slug: "jal-security",
    tier: "specialist",
    line: "Runs continuous hardening and live vulnerability scans using the installed hunt-* skills.",
  },
  {
    slug: "jal-redteam",
    tier: "specialist",
    line: "Runs offensive security passes and resolves every finding to exploited or disproven, with evidence.",
  },
  {
    slug: "jal-blueteam",
    tier: "specialist",
    line: "Triages red team findings, hardens beyond the baseline, and adds detection and logging.",
  },
  {
    slug: "jal-qa",
    tier: "specialist",
    line: "Runs automated QA: bun test, happy-dom component tests, puppeteer smoke, one pass or fail report.",
  },
  {
    slug: "jal-devops",
    tier: "specialist",
    line: "Owns Docker, Coolify deploys, GitHub Actions CI, and git branch, worktree, and rollback safety.",
  },
  {
    slug: "jal-reviewer",
    tier: "specialist",
    line: "Runs the code review gate: correctness, module boundary compliance, and simplification.",
  },
  {
    slug: "jal-researcher",
    tier: "specialist",
    line: "Runs agentic web search and returns verified, sourced findings, no filler.",
  },
];

export type Command = {
  name: string;
  version: "v0.1.0" | "v0.2.0";
  argumentHint?: string;
  what: string;
  example: string;
};

export const COMMANDS: Command[] = [
  {
    name: "/jal-scaffold",
    version: "v0.1.0",
    argumentHint: "<app-name>",
    what: "Scaffold a new Bun monorepo from the JAL-AIDEV template, install deps, commit, and verify the build.",
    example: "/jal-scaffold acme-dashboard",
  },
  {
    name: "/jal-orchestrate",
    version: "v0.1.0",
    argumentHint: "<task description>",
    what: "Run the full Pawang crew loop: decompose, dispatch specialists in parallel, build, and gate.",
    example: "/jal-orchestrate add a billing module with Stripe webhooks",
  },
  {
    name: "/jal-review",
    version: "v0.1.0",
    what: "Run the consolidated guideline, security, and QA gate on the repo and emit one pass or fail report.",
    example: "/jal-review",
  },
  {
    name: "/jal-module",
    version: "v0.2.0",
    argumentHint: "<name>",
    what: "Scaffold a compliant domain module (routes, service, repo, ports, index) and verify import boundaries.",
    example: "/jal-module billing",
  },
  {
    name: "/jal-service",
    version: "v0.2.0",
    argumentHint: "<name> <go|rust>",
    what: "Scaffold a Go or Rust gRPC sidecar with a typed Bun client, only for a hot path Bun cannot serve.",
    example: "/jal-service imgproc rust",
  },
  {
    name: "/jal-migrate",
    version: "v0.2.0",
    argumentHint: "<up|down|create> [name]",
    what: "Run the Postgres migration runner over migrations/*.sql: apply, revert, or create a new file.",
    example: "/jal-migrate create add_users_table",
  },
  {
    name: "/jal-adr",
    version: "v0.2.0",
    argumentHint: "<title>",
    what: "Create the next numbered Architecture Decision Record in docs/adr/ from the standard template.",
    example: "/jal-adr Adopt Redis for session storage",
  },
  {
    name: "/jal-ship",
    version: "v0.2.0",
    argumentHint: "<feature description>",
    what: "Run the full senior loop on a feature: brainstorm, spec, plan, parallel build, review gate, memory.",
    example: "/jal-ship customer-facing invoice PDF export",
  },
  {
    name: "/jal-pr",
    version: "v0.2.0",
    what: "Run the review gate, then open a conventional-commit pull request with a checklist. Never force-merges.",
    example: "/jal-pr",
  },
  {
    name: "/jal-deploy",
    version: "v0.2.0",
    argumentHint: "<deploy|rollback> [tag]",
    what: "Deploy a tagged image to Coolify at deploy.jalgroup.id, run a health check, or roll back in one command.",
    example: "/jal-deploy rollback a1b2c3d-main",
  },
  {
    name: "/jal-debug",
    version: "v0.2.0",
    argumentHint: "<symptom>",
    what: "Systematic debugging: reproduce, isolate, root cause, failing test, fix, verify. No guess patching.",
    example: "/jal-debug checkout button does nothing on mobile Safari",
  },
  {
    name: "/jal-audit",
    version: "v0.2.0",
    what: "Deep scan of the repo: security, architecture drift, dependency audit, dead code, bundle size, one report.",
    example: "/jal-audit",
  },
  {
    name: "/jal-pentest",
    version: "v0.2.0",
    what: "Red team attacks the project, blue team triages and fixes, one pass or fail report with every finding.",
    example: "/jal-pentest",
  },
  {
    name: "/jal-release",
    version: "v0.2.0",
    what: "Cut a release with changesets: version bump, changelog generation, and an annotated git tag.",
    example: "/jal-release",
  },
  {
    name: "/jal-ui",
    version: "v0.2.0",
    argumentHint: "<scope>",
    what: "Audit, then fine-tune or rebuild a frontend to the JAL taste standard, from scratch or existing.",
    example: "/jal-ui apps/web",
  },
];

export type StudyCase = {
  id: string;
  title: string;
  optional?: boolean;
  summary: string;
  steps: { command: string; note: string }[];
};

export const STUDY_CASES: StudyCase[] = [
  {
    id: "case-a",
    title: "Build a SaaS dashboard from zero",
    summary:
      "A new project, from an empty folder to a deployed dashboard with a real module and a taste-checked UI.",
    steps: [
      { command: "/jal-scaffold acme-dashboard", note: "Scaffold the Bun monorepo, install deps, first commit, verified build." },
      { command: "/jal-module billing", note: "Add a compliant domain module for billing: routes, service, repo, ports, one public index." },
      { command: "/jal-ui apps/web", note: "Audit and build the dashboard UI against the JAL taste standard: bento layout, mobile app-shell, tokens." },
      { command: "/jal-ship polish the billing dashboard for first customer demo", note: "Run the full senior loop to close remaining gaps before the review gate passes." },
    ],
  },
  {
    id: "case-b",
    title: "Add a Rust gRPC image-processing sidecar",
    summary:
      "A hot path, resizing and transcoding uploaded images, is too slow in Bun. Add a compiled sidecar the right way.",
    steps: [
      { command: "/jal-service imgproc rust", note: "Prints \"new tech: confirm with Brian\", then scaffolds services/imgproc/ with a proto-first contract." },
      { command: "dispatch agent jal-systems", note: "jal-systems implements the Rust server against the proto, benchmarks it, and writes the Dockerfile." },
      { command: "bun-side typed client generated under apps/api/lib/", note: "Bun callers get full types generated from the same proto, no hand-typed client to drift." },
      { command: "/jal-review", note: "Confirm the new service passes the consolidated gate before it ships alongside the main app." },
    ],
  },
  {
    id: "case-c",
    title: "Ship a feature safely as a small team",
    summary:
      "A small team ships a real feature end to end with a paper trail: a decision record, a review, a pull request, and a safe deploy.",
    steps: [
      { command: "/jal-adr Adopt background jobs for report generation", note: "Record the decision before writing code that depends on it." },
      { command: "/jal-ship weekly report generation as a background job", note: "Brainstorm, spec, plan, parallel build, review gate, memory, all through jal-principal." },
      { command: "/jal-pr", note: "Gate the diff, then open a conventional-commit pull request with a summary and a test plan." },
      { command: "/jal-deploy deploy", note: "Tag the image, deploy to deploy.jalgroup.id, and health check the rollout." },
      { command: "/jal-deploy rollback", note: "If the health check ever fails, roll back to the last stable tag in one command." },
    ],
  },
  {
    id: "case-d",
    title: "Security pass before launch",
    optional: true,
    summary:
      "Before a public launch, run both sides of the security loop and ship with every confirmed finding closed and re-verified.",
    steps: [
      { command: "/jal-audit", note: "Consolidated scan: security, architecture drift, dependency audit, dead code, bundle size." },
      { command: "/jal-pentest", note: "jal-redteam exploits or disproves every suspected finding with evidence, jal-blueteam fixes and re-verifies each one." },
    ],
  },
];

export const FAQ = {
  title: SECTION_MARKERS.faq,
  items: [
    {
      q: "Bun is not found, or the plugin's hook fails silently.",
      a:
        "The guardrail hook shells out to bun directly, so it needs bun on PATH for the shell Claude Code runs in, not just installed somewhere on disk. Run `bun --version` in the same terminal or IDE Claude Code uses. If that fails, reinstall Bun from https://bun.sh and open a fresh shell before retrying the install command.",
    },
    {
      q: "The marketplace add or plugin install fails against a private repository.",
      a:
        "`/plugin marketplace add JAL-Group/JAL-AIDEV` needs the same GitHub auth your git client already uses for private repos: an SSH key on the account with access, or a git credential helper with a valid token. If `git clone` of the same repository works in a plain terminal, the plugin install will too. If it does not, fix that auth first, the plugin command does not add its own auth path.",
    },
    {
      q: "A command reports a module boundary violation and stops.",
      a:
        "`bun run check:boundaries` failed, meaning a module imported another module's internals (repo.ts, service.ts) instead of its public index.ts, or a route imported a concrete Postgres, Redis, or S3 client directly instead of the port it should depend on. Fix the import to go through the owning module's index.ts, or through the port in src/core/, then re-run the command, it does not skip the check on retry.",
    },
    {
      q: "A specialist agent wants to use a library outside the approved stack.",
      a:
        "That is by design, not a bug. jal-architect and every specialist reject Vite, Next.js, an ORM, or any other tool outside the constitution's approved stack, and any real exception gets reported to Brian for confirmation before it ships, never adopted silently.",
    },
  ],
};

export const FOOTER = {
  tagline: "Built by JAL Group. Dibuat dengan hati di Indonesia.",
  repo: "github.com/JAL-Group/JAL-AIDEV",
};
