// docs-site/src/content.ts
//
// Single source of truth for every piece of copy on the docs site. build.ts
// (via render.ts) turns this into the final static HTML, and
// content.test.ts imports the same data to assert the section markers, the
// agent and command lists, the JEV catalog count, the UI check rules, and
// the no em dash rule, so the page and the test can never drift apart.
//
// Facts here (agent names, command names, argument hints, catalog IDs, UI
// check rule names) are read directly from the repo root: agents/*.md,
// commands/*.md, skills/jal-orchestration/SKILL.md, skills/jal-jev,
// skills/jal-design-system, skills/jal-immersive, mcp/jal-design/audit.ts,
// and .claude-plugin/plugin.json. content.test.ts cross-checks the lists
// against those files when they are present.
//
// Inline `backticks` in any body text render as inline code (see
// render.ts richText), so copy can name a file or a command plainly.

export const PLUGIN_VERSION = "v0.5.0";

export type NavItem = {
  id: string;
  label: string;
  icon: "home" | "install" | "terminal" | "faq";
};

// The bottom tab bar on phones: 4 destinations (the app-shell law allows 3
// to 5). Every other section is one tap away in the menu drawer.
export const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "install", label: "Install", icon: "install" },
  { id: "commands", label: "Commands", icon: "terminal" },
  { id: "faq", label: "FAQ", icon: "faq" },
];

// The desktop top navigation. Wider screens have room for more direct
// links; the full list of sections is always in the menu drawer.
export const TOP_NAV: { id: string; label: string }[] = [
  { id: "install", label: "Install" },
  { id: "agents", label: "Agents" },
  { id: "commands", label: "Commands" },
  { id: "jev", label: "JEV" },
  { id: "ui-check", label: "UI check" },
  { id: "faq", label: "FAQ" },
];

export const SECTION_MARKERS = {
  overview: "What is JAL-AIDEV",
  install: "Install and enable it per project",
  constitution: "The constitution, in plain words",
  agents: "The agent hierarchy",
  commands: "Commands",
  jev: "JEV, the judge",
  designSystem: "One design system: JAL Core",
  immersive: "The immersive and 3D layer",
  uiCheck: "The 33-rule UI check",
  docs: "Publishing to JAL Docs",
  search: "SEO, AEO, dan GEO",
  studyCases: "Study cases",
  faq: "FAQ and troubleshooting",
} as const;

export const BRAND = {
  name: "JAL-AIDEV",
  tag: `Pawang crew for Claude Code, ${PLUGIN_VERSION}`,
};

export const HERO = {
  title: "Ship faster without shipping spaghetti.",
  body:
    "JAL-AIDEV is a Claude Code plugin: a written constitution, a crew of 17 specialist agents, and a judge called JEV that settles the small calls. Eight commands cover everything from an empty folder to a deploy, and nothing is called done until the checks pass.",
  primaryCta: { label: "Install the plugin", href: "#install" },
  secondaryCta: { label: "See the eight commands", href: "#commands" },
  stats: [
    { value: "17", label: "specialist agents" },
    { value: "8", label: "commands" },
    { value: "53", label: "JEV decisions" },
    { value: "33", label: "UI check rules" },
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
        "One written standard for the stack, the architecture, the look, and the security baseline. Every agent builds to it and every check measures against it, so all projects stay alike.",
    },
    {
      title: "A crew with a judge",
      body:
        "Seventeen agents, each with a narrow job. A lead splits the work and runs the independent parts at once, and JEV settles the judgment calls so nothing rests on gut feeling.",
    },
    {
      title: "Proven, not promised",
      body:
        "A write-time guard blocks banned patterns as files are saved. Tests, a review gate, and a 33-rule UI check in a real browser decide when a change is actually finished.",
    },
    {
      title: "It learns",
      body:
        "Every UI build records what it combined and how it scored, and the next build reads that history. Say \"learn this reference\" in any command to teach it something new. Learnings proven across projects come back as a pull request you review. The anti-slop rules never change through learning.",
    },
  ],
  whyTitle: "Why this matters",
  why:
    "Spaghetti code and architectural drift are not one big mistake, they are hundreds of small unreviewed ones. JAL-AIDEV makes the good path the only path: one approved stack, one module shape, one design system, one security checklist, applied on every task instead of hoped for.",
};

export type InstallStep = {
  title: string;
  body: string;
  code: string;
  filename?: string;
};

export const INSTALL: { title: string; lead: string; steps: InstallStep[]; note: string } = {
  title: SECTION_MARKERS.install,
  lead:
    "Install the plugin once for your Claude Code account, then turn it on per project. Each step is one or two lines in a terminal.",
  steps: [
    {
      title: "Add the marketplace",
      body:
        "You need GitHub access to the private `JAL-Group/JAL-AIDEV` repository first, for example through `gh auth login`.",
      code: "claude plugin marketplace add JAL-Group/JAL-AIDEV",
    },
    {
      title: "Install the plugin",
      body:
        "Always use the full name. The short name `jal-aidev` fails with Plugin not found.",
      code: "claude plugin install jal-aidev@jal-aidev-marketplace",
    },
    {
      title: "Auto enable it per project",
      body:
        "Add this to the project's settings so the plugin turns on for anyone who opens the repo, with no manual enable step per teammate.",
      code: '{\n  "enabledPlugins": {\n    "jal-aidev@jal-aidev-marketplace": true\n  }\n}',
      filename: ".claude/settings.json",
    },
    {
      title: "Update to the latest version",
      body:
        "After installing or updating, fully quit and reopen Claude so the new agents, skills, and tools load.",
      code: "claude plugin marketplace update jal-aidev-marketplace\nclaude plugin update jal-aidev@jal-aidev-marketplace",
    },
  ],
  note:
    "Bun must be installed and on PATH, because the guard and the bundled tools run on Bun. Google Chrome or Chromium must be installed for the UI check; `CHROME_PATH` overrides where it looks.",
};

export const CONSTITUTION = {
  title: SECTION_MARKERS.constitution,
  lead:
    "The constitution is the one standard every agent defers to. Here is what it actually says, without the legal-document tone.",
  items: [
    {
      title: "Bun only, nothing else",
      body:
        "Bun is the runtime and the package manager, full stop. No Vite, no Next.js, no plain node, no deno, no ts-node. Every script, build, and test runs through bun directly.",
    },
    {
      title: "Modular monolith",
      body:
        "One deployable app, split into domain modules under `apps/api/src/modules/`. Each module exposes exactly one public `index.ts`, everything else stays private to it. No microservices without sign off.",
    },
    {
      title: "Go and Rust, only as sidecars",
      body:
        "Go or Rust are allowed only as compiled gRPC sidecars under `services/`, and only for a hot path Bun genuinely cannot serve fast enough. Adding one always asks Brian first.",
    },
    {
      title: "Deploy target: deploy.jalgroup.id",
      body:
        "Coolify at deploy.jalgroup.id is the only permitted deploy target, and only when your own message says deploy. Every image is tagged, so a rollback is always one step.",
    },
    {
      title: "Frontend law",
      body:
        "White or off-white background. No em-dash, no emoji, no eyebrow labels, no gradients, no blurred shadows, no side stripes, no glow, no purple. One 44px control height, nothing overlapping, and a pinned header plus bottom tab bar on phones.",
    },
    {
      title: "gpt-4o-mini by default",
      body:
        "Every new AI integration defaults to OpenAI's gpt-4o-mini. A different model is a decision for Brian, never a silent swap.",
    },
    {
      title: "Security hardening ships on day one",
      body:
        "Secure headers, Redis backed rate limiting, a CORS allowlist, input validation, env-only secrets, and dependency auditing ship with the first commit, not as a follow-up task.",
    },
    {
      title: "Hard law is mechanical",
      body:
        "A write-time guard blocks banned patterns the moment a file is saved, and tests, scans, and the UI check catch the rest. No agent and no JEV verdict can waive a rule.",
    },
  ],
};

export type Agent = {
  slug: string;
  tier: "head" | "lead" | "judge" | "specialist";
  line: string;
  // The JEV catalog decisions this agent asks, from the role table in
  // skills/jal-orchestration/SKILL.md. Rendered at the foot of each card.
  jev: string;
};

export const AGENT_TIER_LABEL: Record<Agent["tier"], string> = {
  head: "Head",
  lead: "Orchestrator",
  judge: "Judge",
  specialist: "Specialist",
};

export const AGENTS: Agent[] = [
  {
    slug: "jal-principal",
    tier: "head",
    line: "Sets direction, scope, and the architecture bar, talks to Brian, and makes the final ship call. It delegates and never writes bulk code.",
    jev: "orch.route, orch.escalate, rev.ship, sec.ship_block",
  },
  {
    slug: "jal-lead",
    tier: "lead",
    line: "Runs the engine: splits a task into owned pieces, sends independent work out in parallel, verifies and commits each worker, and loops until the gate passes.",
    jev: "orch.playbooks, orch.route, orch.model, orch.parallel, orch.loop_exit, orch.escalate, mem.promote",
  },
  {
    slug: "jal-jev",
    tier: "judge",
    line: "The impartial judge. Frames a new decision that is not in the catalog yet, asks JEV, and returns the verdict with its confidence. It never builds and never overrides law.",
    jev: "designs new questions when no catalog entry fits",
  },
  {
    slug: "jal-architect",
    tier: "specialist",
    line: "Stack gatekeeper. Designs solutions inside Bun, Hono, React, TypeScript, Docker, and Redis, and vets any new dependency before it enters a project.",
    jev: "be.placement, be.api_quality, be.migration_risk, be.new_tech",
  },
  {
    slug: "jal-ux",
    tier: "specialist",
    line: "Owns JAL Core and cross-screen taste. Builds new screens or redesigns old ones through one ordered pipeline that ends in a passing UI check.",
    jev: "ui.experience, ui.type_pairing, ui.density, ui.region_gate, ui.final_taste, motion.*",
  },
  {
    slug: "jal-frontend",
    tier: "specialist",
    line: "Builds UI in React and TypeScript on Bun to the direction jal-ux sets: app-shell on phones, JAL Core tokens, koboyo or reicon icons.",
    jev: "ui.region_gate, ui.final_taste, ui.number_motion, motion.intensity",
  },
  {
    slug: "jal-immersive",
    tier: "specialist",
    line: "Builds immersive, animated, and 3D sites and sections: Three.js, React Three Fiber, shaders, scroll stories, and noyzzi pieces, always poster first.",
    jev: "imm.concept, imm.gate, imm.recipe, imm.tech, imm.tier, imm.taste, motion.*",
  },
  {
    slug: "jal-backend",
    tier: "specialist",
    line: "Builds APIs on Bun and Hono with self-hosted Postgres, Redis, and S3, hardening middleware, and gpt-4o-mini for AI features.",
    jev: "be.placement, be.api_quality, be.migration_risk, be.new_tech",
  },
  {
    slug: "jal-systems",
    tier: "specialist",
    line: "Builds and benchmarks Go or Rust gRPC sidecars, only for the hot paths Bun genuinely cannot serve fast enough.",
    jev: "be.placement, be.api_quality, be.new_tech",
  },
  {
    slug: "jal-security",
    tier: "specialist",
    line: "Runs continuous hardening and live vulnerability checks, and hands fast fixes back to the agent that owns the code.",
    jev: "sec.severity, sec.false_positive, sec.ship_block, sec.input_screen",
  },
  {
    slug: "jal-redteam",
    tier: "specialist",
    line: "Attacks the project and resolves every suspected finding to exploited or disproven, with evidence.",
    jev: "sec.severity, sec.false_positive",
  },
  {
    slug: "jal-blueteam",
    tier: "specialist",
    line: "Triages red team findings, fixes them, adds detection and logging, and proves each fix actually closes the gap.",
    jev: "sec.severity, sec.false_positive, sec.ship_block",
  },
  {
    slug: "jal-reviewer",
    tier: "specialist",
    line: "The code review gate: correctness, module boundaries through `check:boundaries`, and simplification. It blocks on any Critical or Important finding.",
    jev: "rev.risk, rev.ship, be.api_quality, qa.coverage",
  },
  {
    slug: "jal-qa",
    tier: "specialist",
    line: "Runs bun test, happy-dom component tests, puppeteer smoke tests, and the UI check, then gives one pass or fail.",
    jev: "qa.check_depth, qa.failure_class, qa.test_selection, qa.coverage, qa.release_go",
  },
  {
    slug: "jal-devops",
    tier: "specialist",
    line: "Owns Docker, Coolify deploys to deploy.jalgroup.id, GitHub Actions, and git branch, worktree, and rollback safety.",
    jev: "qa.release_go, be.migration_risk, orch.escalate",
  },
  {
    slug: "jal-researcher",
    tier: "specialist",
    line: "Searches the web and returns verified, sourced findings. Every fetched page is screened before it is used.",
    jev: "sec.input_screen",
  },
  {
    slug: "jal-docs",
    tier: "specialist",
    line: "Writes technical and non-technical docs in JAL Docs from the code only, checks every claim, and publishes as a pull request.",
    jev: "docs.plan, docs.claim, docs.publish",
  },
];

export type Command = {
  name: string;
  version: typeof PLUGIN_VERSION;
  argumentHint: string;
  purpose: string;
  what: string;
  examples: string[];
  wide?: boolean;
};

export const COMMANDS: Command[] = [
  {
    name: "/jal-new",
    version: PLUGIN_VERSION,
    argumentHint: "<project-name> [what it is for]",
    purpose: "Start a new project",
    what:
      "Scaffolds a Bun monorepo from the JAL template (Hono API, React web app, JAL Core UI kit, migrations, Docker, CI), installs it, proves the build and tests pass, and makes the first commit. Say what it is for and it builds the first version too.",
    examples: ["/jal-new tally", "/jal-new halo a landing page for a smart desk lamp"],
  },
  {
    name: "/jal-build",
    version: PLUGIN_VERSION,
    argumentHint: "<what to build or change>",
    purpose: "Build or change anything",
    what:
      "A feature end to end, a backend module or API route, a database migration, a Go or Rust sidecar (asks Brian first), or an architecture decision record. Any screens the change needs go through the /jal-ui pipeline.",
    examples: [
      "/jal-build invoices: create, list, and mark paid, with a screen",
      "/jal-build add a Redis cache to the search endpoint",
    ],
  },
  {
    name: "/jal-ui",
    version: PLUGIN_VERSION,
    argumentHint: "<what to build, or which screen or site to redesign>",
    purpose: "Anything visual",
    what:
      "New screens, redesigns, landing pages, and immersive or 3D websites. JEV first decides whether the brief is product UI, a marketing page, or immersive. A redesign lists what is wrong before changing anything. Every section gets a purpose, one message, and one action, then it is built phone first on JAL Core and proven with the 33-rule UI check.",
    examples: [
      "/jal-ui a settings screen for team members and roles",
      "/jal-ui redesign the pricing page",
      "/jal-ui an immersive landing page for Halo, a smart desk lamp, with a 3D lamp hero",
    ],
    wide: true,
  },
  {
    name: "/jal-fix",
    version: PLUGIN_VERSION,
    argumentHint: "<what is wrong>",
    purpose: "Fix a bug properly",
    what:
      "Reproduces the problem, finds the real cause, writes a test that fails because of it, fixes the cause, and proves it with the full suite. When the cause is unclear, several suspects are checked in parallel.",
    examples: [
      "/jal-fix the leave form accepts an end date before the start date",
      "/jal-fix /health returns 500 after the Redis restart",
    ],
  },
  {
    name: "/jal-check",
    version: PLUGIN_VERSION,
    argumentHint: "[quick | full | deep] [what to focus on]",
    purpose: "One PASS or FAIL",
    what:
      "quick runs the rules scan, tests, and the UI check. full, the default, adds security hardening, a boot test of the real app, and the ship call. deep adds a deep audit and a red team versus blue team pentest. JEV picks the depth if you do not.",
    examples: ["/jal-check", "/jal-check deep before the launch"],
  },
  {
    name: "/jal-ship",
    version: PLUGIN_VERSION,
    argumentHint: "<pr | release | deploy | rollback> [tag or note]",
    purpose: "Get it out",
    what:
      "The full check runs first. pr opens a pull request, release bumps the version, writes the changelog, and tags it, deploy ships a tagged image to deploy.jalgroup.id with a health check, and rollback returns to the last healthy version. It never deploys unless you say so.",
    examples: ["/jal-ship pr", "/jal-ship release", "/jal-ship deploy", "/jal-ship rollback v1.4.2"],
  },
  {
    name: "/jal-docs",
    version: PLUGIN_VERSION,
    argumentHint: "<project repo or path> [what to focus on]",
    purpose: "Documentation",
    what:
      "Writes or updates a project's page in JAL Docs for developers and for non-technical readers. Every sentence must point to real code and secrets are never written. It opens a pull request, and when every check passes it merges it and deploys JAL Docs.",
    examples: ["/jal-docs JAL-Group/Sentimen_DPP", "/jal-docs ~/Documents/JAL/tally for the finance team"],
  },
  {
    name: "/jal-seo-geo-aeo",
    version: PLUGIN_VERSION,
    argumentHint: "[audit|integrate|boost|submit|monitor] [url]",
    purpose: "Search: SEO, AEO, and GEO",
    what:
      "Scores a site 0 to 100 on classic search, direct answers, and AI assistants, with evidence for every item. It can install the full search layer, raise the scores and prove the change, submit URLs to IndexNow, Bing, and Yandex after your yes, and track what the crawlers did.",
    examples: ["/jal-seo-geo-aeo audit https://padelparty.id", "/jal-seo-geo-aeo integrate", "/jal-seo-geo-aeo boost https://padelparty.id"],
  },
];

export const COMMANDS_INTRO = {
  lead:
    "Eight commands, each typed inside Claude Code. Every one runs the whole crew on the same engine: it plans, splits the work across specialists that run in parallel, lets JEV make the judgment calls, checks everything, and fixes what fails before calling it done.",
  engineTitle: "How every command runs",
  engineLead:
    "The engine works in waves. Inside a wave, every independent piece of work goes out at the same time, and every file has exactly one owner, so two agents never edit the same thing.",
  waves: [
    {
      title: "W0 Research and design",
      body: "jal-researcher, jal-architect, jal-ux or jal-immersive, and jal-security gather facts, write the design and the contracts, and fill in the file ownership table.",
    },
    {
      title: "W1 Build",
      body: "jal-backend, jal-frontend, jal-ux, jal-immersive, jal-systems, jal-qa, and jal-docs build in parallel, each only inside the paths it owns. The lead verifies and commits each worker.",
    },
    {
      title: "W2 Verify",
      body: "jal-reviewer, jal-qa, jal-security, jal-redteam when a pentest is in scope, and the UI check all run at once and report findings.",
    },
    {
      title: "W3 Fix",
      body: "The owner of each failing file fixes it, in parallel, then the affected checks run again. At most three rounds per finding; anything left goes to Brian.",
    },
  ],
  mapTitle: "Old command, new command",
  mapLead:
    "Version 0.4.0 folded the old commands into seven of these eight; /jal-seo-geo-aeo came after, as a new command. The old ones live on as internal playbooks in `skills/jal-orchestration/references/`, so nothing they did is lost.",
  mapNote:
    "Careful with /jal-ship: it used to mean build a feature. Now it means get finished work out. Building a feature is /jal-build.",
};

export const COMMAND_MAP: { now: string; old: string[] }[] = [
  { now: "/jal-new", old: ["/jal-scaffold"] },
  {
    now: "/jal-build",
    old: ["/jal-ship (feature)", "/jal-orchestrate", "/jal-module", "/jal-service", "/jal-migrate", "/jal-adr"],
  },
  { now: "/jal-ui", old: ["/jal-ui", "/jal-immersive"] },
  { now: "/jal-fix", old: ["/jal-debug"] },
  { now: "/jal-check", old: ["/jal-review", "/jal-audit", "/jal-pentest"] },
  { now: "/jal-ship", old: ["/jal-pr", "/jal-release", "/jal-deploy"] },
  { now: "/jal-docs", old: ["new in 0.4.0"] },
];

export const JEV = {
  title: SECTION_MARKERS.jev,
  lead:
    "JEV is a fast decision model from TypeSafe. The agents reason and build; JEV settles the small, bounded calls they would otherwise make on gut feeling. On those calls its verdict is final.",
  principles: [
    {
      title: "Hard law comes first",
      body: "The constitution is checked mechanically before JEV is ever asked. JEV cannot waive a rule, and it is never asked a question the law already answers.",
    },
    {
      title: "Final on soft calls",
      body: "Which specialists a task needs, what can run in parallel, how dense a table is, whether a section is worth building, how severe a finding is, whether a release is ready. When JEV says no, the idea is dropped or revised, and nobody re-asks to fish for a different answer.",
    },
    {
      title: "Every agent's decision helper",
      body: "Each agent has its own list of catalog decisions, shown on its card above, and the lead pastes the JEV contract into every brief. Any other soft call goes to JEV too, and the jal-jev agent designs the question when none fits.",
    },
    {
      title: "Answers come with confidence",
      body: "Every verdict carries a confidence. Under 0.5 the agent asks one sharper follow-up or takes the safer option, and flags it in its report.",
    },
    {
      title: "Logged, with secrets stripped",
      body: "Every call is written to `.jal/decisions/` so you can see why something happened. Secrets are stripped before anything is sent.",
    },
    {
      title: "Honest when it is offline",
      body: "If JEV cannot be reached, the agent applies the same criteria itself and stamps the decision UNVERIFIED BY JEV. Ship calls made that way go to jal-principal for a final look.",
    },
    {
      title: "Escalations stay with Brian",
      body: "New tech outside the approved stack, a change of the default LLM, and scope changes that move a deadline go to Brian. JEV can help frame the tradeoff; it never approves them.",
    },
  ],
  catalogTitle: "The 53 catalog decisions",
  catalogLead:
    "The standard decisions live in the `jal-jev` skill, each with its exact question, the check that runs before it, and the threshold that turns the answer into an action.",
};

export const JEV_CATALOG: { area: string; count: number; covers: string }[] = [
  { area: "Orchestration", count: 6, covers: "Which playbooks a request needs, who owns each piece, which model tier, what runs in parallel, when to escalate, and when the loop may stop." },
  { area: "UI and UX", count: 13, covers: "Product UI, marketing, or immersive; table and list density; whether a region earns its place; the direction screen; the type pairing from the font pool; which components and motion recipes to layer from every source; heuristics; the final taste call." },
  { area: "Motion", count: 4, covers: "How much motion a section gets, the choreography, whether to pin a scroll section, and the medium for a live demo." },
  { area: "Immersive", count: 6, covers: "The signature concept, whether 3D earns its place, which recipe, which technique, the device tier, and the final taste of the built scene." },
  { area: "Backend", count: 4, covers: "Where code belongs, API quality, migration risk, and whether a new technology is worth raising with Brian." },
  { area: "Security", count: 4, covers: "Severity, false positive or real, whether a finding blocks ship, and screening pasted or fetched input for injection." },
  { area: "QA", count: 5, covers: "How deep to check, what class a failure is, which tests to run, whether coverage is enough, and whether a release may go." },
  { area: "Review", count: 2, covers: "How risky a change is, and the final ship call." },
  { area: "Docs", count: 3, covers: "The docs plan, whether a claim is proven by the code, and whether the page is ready to publish." },
  { area: "Search", count: 4, covers: "Which mode to run next, how each search intent is answered, the order of the boost backlog, and which title, description, or FAQ answer reads best." },
  { area: "Memory and learning", count: 2, covers: "Whether a new learning goes into project memory, a plugin pull request, or nowhere; and whether a new reference is worth teaching JAL-AIDEV." },
];

export const DESIGN_SYSTEM = {
  title: SECTION_MARKERS.designSystem,
  lead:
    "There is one design system, JAL Core. Every JAL product, from an ops console to a phone-first app, is built from the same foundations and the same component specs, so every screen looks like the same team built it.",
  sources: [
    {
      title: "Astryx is the base",
      body: "Meta Astryx supplies the method: generated type, radius, and motion scales, frame-first layout, hierarchy, states, and navigation.",
    },
    {
      title: "Carbon runs data and forms",
      body: "IBM Carbon supplies tables, form fields, date pickers, and notifications, plus the density rules for desktop tables and lists.",
    },
    {
      title: "Material fills the touch gaps",
      body: "A few Google Material pieces cover mobile touch: the bottom navigation bar, chips, state layers, and the one floating action.",
    },
  ],
  points: [
    {
      title: "JEV picks density, never a system",
      body: "The only choice made per product is how dense tables and lists are: compact, default, or comfortable. Nobody picks a design system per project.",
    },
    {
      title: "Knowledge, not packages",
      body: "No Astryx, Carbon, or Material package is ever installed. Their patterns are rebuilt once in JAL Core tokens with Bun, because their compiled CSS carries gradients, shadows, and stripes the law bans.",
    },
    {
      title: "The identity is code",
      body: "Every page is composed from the JAL Core kit in the template (`packages/ui/src/kit`): Masthead, Split, Bento, spec rails and tables, stat rows, feature grids, media frames, quotes, FAQ, CTA band, pricing, footers, and sticky stories. One `data-direction` attribute sets the look, and a validator keeps sections from repeating.",
    },
    {
      title: "Law always wins",
      body: "JAL law first, then JAL Core tokens, then the JEV verdict, then the component spec. A component is never built from two anatomies.",
    },
    {
      title: "A fresh look every time",
      body: "Each product explores several visual directions, JEV screens them, and one is committed to, so a product never settles for the obvious first idea.",
    },
  ],
};

export const IMMERSIVE = {
  title: SECTION_MARKERS.immersive,
  lead:
    "/jal-ui covers the whole range, and JEV places each brief on it: a calm modern site, a modern site with motion accents (Lenis smooth scroll, GSAP or Framer Motion reveals), a modern site with a few immersive sections, or a fully immersive site. Sections can sit at different levels on one page. jal-immersive holds all motion and 3D in one place: GreenSock's official GSAP skills, Lenis, the JAL frame core, Three.js, React Three Fiber, shaders, particles, physics, and the noyzzi catalogue. Immersion is a tool for understanding, never decoration.",
  earnedTitle: "When 3D earns its place",
  earned: [
    "The shape, material, or assembly of a thing is the message, and a still image loses it.",
    "The visitor has to rotate, configure, or explore to understand.",
    "The message is a change over scroll: an assembly, a reveal, a path through space.",
    "One calm signature moment for the brand, used once per page, usually the hero.",
    "Touching it is the proof: a small toy that shows the product's character.",
  ],
  never:
    "Never for app screens, forms, tables, dashboards, settings, docs, pricing tables, or checkout. Those stay calm product UI.",
  zonesTitle: "Three zones, one set of rules",
  zones: [
    {
      title: "The page",
      body: "Full JAL law outside any canvas: white page, no gradients, no shadows, no glow, and the app-shell on phones.",
    },
    {
      title: "Inside a 3D canvas",
      body: "Natural light is allowed: soft shadows, reflections, and material detail. Bloom, glow, neon, and purple stay banned.",
    },
    {
      title: "A noyzzi section",
      body: "A piece from the noyzzi catalogue keeps its designed look, marked in the page. Em-dash, emoji, and motion rules still apply.",
    },
  ],
  safetyTitle: "Fast on a real phone",
  safety: [
    {
      title: "Poster first",
      body: "A still poster renders before any WebGL. It is also what a visitor sees with reduced motion, on a weak device, or when the GPU fails.",
    },
    {
      title: "Device tiers",
      body: "JEV picks full, reduced, or static per device class against a frame budget, so heavy effects scale down on slower phones.",
    },
    {
      title: "Reduced motion is respected",
      body: "When a visitor asks for reduced motion, nothing keeps moving on its own. The UI check measures this; it is not a promise.",
    },
    {
      title: "A GPU budget, not a fixed count",
      body: "Each device tier has a budget for canvases, draw calls, and pixels. JEV adds effects only while the page stays inside it, and every scene has a text version in the page for readers and search.",
    },
    {
      title: "Real assets, real light",
      body: "Product scenes use real models, studio HDRIs, and surfaces: the client's own, or CC0 Poly Haven assets fetched into the client project at build time (approved by Brian), never kept in the plugin. The opt-in scene module adds shadow-casting light, one scene with a moving camera, and a tier-gated post stack on `@react-three/postprocessing` (approved by Brian). Bloom stays banned.",
    },
    {
      title: "JEV picks the recipe",
      body: "For each section JEV chooses from the whole pool and keeps layering while each layer fits: noyzzi pieces, OriginKit components, shader effects and particles, Magic UI and Animata motion, GSAP scroll stories, and live product demos. There is no fixed limit, only the rules and the budget.",
    },
  ],
};

export const UI_CHECK = {
  title: SECTION_MARKERS.uiCheck,
  lead:
    "The UI check (`ui_audit`) opens the page in Chrome at five widths and measures what is actually on screen. A screen is not done until it passes at every width, and SKIPPED is never a pass.",
  widths: [320, 375, 414, 768, 1280],
  runTitle: "Run it yourself",
  runBody: "Point it at any running page. It prints a JSON report and exits with an error on FAIL.",
  runCode: "bun mcp/jal-design/server.ts audit http://localhost:3000",
};

// Rule names match mcp/jal-design/audit.ts exactly; content.test.ts checks
// that every rule the audit can report is listed here.
export const UI_RULES: { rule: string; catches: string }[] = [
  { rule: "overlap", catches: "Two elements sit on top of each other." },
  { rule: "overflow-parent", catches: "Something sticks out of its container." },
  { rule: "horizontal-overflow", catches: "The page scrolls sideways." },
  { rule: "clipped-text", catches: "Text is cut off with no ellipsis." },
  { rule: "icon-text-collision", catches: "An icon runs into its label, or a select has no room for its arrow." },
  { rule: "light-background", catches: "The page background is dark instead of white or off-white." },
  { rule: "gradient-background", catches: "A gradient, anywhere." },
  { rule: "blurred-shadow", catches: "A soft, blurred shadow." },
  { rule: "side-stripe", catches: "A colored line down one side of a card or panel." },
  { rule: "purple-color", catches: "Purple, violet, or indigo." },
  { rule: "emoji-text", catches: "An emoji in the text." },
  { rule: "em-dash-text", catches: "An em-dash in the text." },
  { rule: "eyebrow-label", catches: "A small, tracked, all-caps label sitting above a heading." },
  { rule: "form-control-min-height", catches: "A button or field shorter than 44px." },
  { rule: "form-row-mismatch", catches: "Controls in one row with different heights or tops." },
  { rule: "form-width-cap", catches: "A text field wider than 640px on desktop." },
  { rule: "card-row-mismatch", catches: "Cards side by side with different heights." },
  { rule: "card-empty-band", catches: "A card with a large empty band at the bottom." },
  { rule: "mobile-app-shell", catches: "Under 640px: no pinned header, or no bottom tab bar with 3 to 5 targets of at least 44px." },
  { rule: "reduced-motion", catches: "Something keeps animating after a visitor asks for reduced motion." },
  { rule: "stuck-reveal", catches: "Content is still invisible after it scrolls into view, usually a scroll reveal listening to the wrong scroller." },
  { rule: "blank-viewport", catches: "A whole screen of the page is empty while scrolling through it." },
  { rule: "spacing-scale", catches: "A gap, padding, or margin on a layout block that is not on the spacing scale." },
  { rule: "gap-consistency", catches: "Items of one kind sitting at uneven gaps, like hand-placed margins or drifting card spacing." },
  { rule: "section-rhythm", catches: "A section whose top and bottom space breaks the page's one vertical rhythm." },
  { rule: "composition-repeat", catches: "The same section layout twice in a row, or more than twice on a page." },
  { rule: "dead-space", catches: "A big empty area beside a column with content, such as a short text column next to tall media." },
  { rule: "proximity", catches: "Cards spaced further apart than the padding inside them, so they stop reading as a group." },
  { rule: "radius-scale", catches: "A card or panel rounded so much it turns into a pill." },
  { rule: "band-padding", catches: "A colored band whose content hugs one edge or has more room below than above." },
  { rule: "gap-seam", catches: "A thin stray strip of page background between two sections next to a colored band." },
  { rule: "display-measure", catches: "A big headline that wraps to too many lines or is too large for its column." },
  { rule: "hero-card", catches: "The main page heading boxed inside a rounded card instead of set on the page." },
];

export const DOCS = {
  title: SECTION_MARKERS.docs,
  lead:
    "/jal-docs writes a project's page in JAL Docs (malasbaca.jalgroup.id) straight from its code, for developers and for everyone else, and nothing in it is made up.",
  points: [
    {
      title: "For developers",
      body: "Architecture, how to run and deploy it, every menu and screen, the endpoints, database, and storage, env variable names, the gotchas, and a handover file a new developer or Claude Code session can load.",
    },
    {
      title: "For everyone else",
      body: "What the project is, who uses it, where it stands today, and who to contact.",
    },
    {
      title: "Every claim is checked",
      body: "Each sentence must point to real code. `docs_verify` checks claims against the source and scans for secrets, and JEV throws out anything that cannot be proven.",
    },
    {
      title: "Updates, not rewrites",
      body: "If a page already exists, only the parts the code changed since the last run are updated.",
    },
    {
      title: "Runs only when you ask",
      body: "Nothing triggers it but a person typing the command. There is no CI hook and no schedule.",
    },
    {
      title: "Pull request, then merge and deploy",
      body: "It opens a pull request on JAL-Group/malasbaca. When every check passes, it squash-merges that one PR, deploys JAL Docs through Coolify, and confirms the site is up. If anything fails, the PR stays open and it tells you why. It never pushes straight to main.",
    },
    {
      title: "The deploy needs one token",
      body: "The deploy step reads `COOLIFY_API_TOKEN` from your environment, or asks you or a teammate for it at that moment. It is used for that one deploy and never saved.",
    },
  ],
};

// Section in Indonesian (Brian's spec asks for one page in Indonesian).
export const SEARCH = {
  title: SECTION_MARKERS.search,
  lead:
    "/jal-seo-geo-aeo membuat website mudah ditemukan di tiga jenis pencarian, dan memberi skor 0 sampai 100 untuk masing-masing, lengkap dengan bukti.",
  points: [
    {
      title: "SEO",
      body: "Ditemukan dan diranking di Google, Bing, dan Yandex: robots.txt, sitemap dengan hreflang, canonical, judul 50 sampai 60 karakter, structured data, kecepatan, dan Search Console.",
    },
    {
      title: "AEO",
      body: "Menjadi jawaban langsung di snippet, People Also Ask, asisten suara, dan AI Overviews: peta intent, satu URL per intent penting, FAQ dengan jawaban di kalimat pertama, dan markup yang sama persis dengan yang tampil.",
    },
    {
      title: "GEO",
      body: "Disebut dan dikutip oleh ChatGPT, Claude, Perplexity, Gemini, dan asisten lain: crawler AI diizinkan, llms.txt, fakta entitas yang konsisten di mana-mana, statistik terverifikasi, kutipan dari media, dan log crawler untuk melihat bot mana membaca halaman mana.",
    },
    {
      title: "Lima mode",
      body: "audit (skor dan bukti), integrate (memasang seluruh lapisan pencarian), boost (menaikkan skor dan membuktikan selisihnya), submit (IndexNow, Bing, Yandex, selalu dry run dulu dan butuh persetujuan Anda), dan monitor (apa yang benar-benar dilakukan mesin pencari).",
    },
    {
      title: "Fakta tidak pernah dikarang",
      body: "Setiap fakta berasal dari pemilik bisnis dan disimpan di satu modul dengan tanggal konfirmasi. Klaim yang ditolak menjadi tes yang memeriksa setiap halaman. Satu teks untuk manusia dan mesin: tidak ada cloaking.",
    },
    {
      title: "JEV membantu keputusan",
      body: "JEV memilih mode berikutnya, cara menjawab setiap intent, urutan backlog boost, dan judul, deskripsi, atau jawaban FAQ terbaik. Hukum keras tidak pernah diserahkan ke JEV.",
    },
  ],
};

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
      "A new project, from an empty folder to a checked dashboard with a real billing module and a screen that passes the UI check.",
    steps: [
      { command: "/jal-new acme-dashboard", note: "Scaffold the Bun monorepo from the JAL template, install, prove the build and tests pass, and make the first commit." },
      { command: "/jal-build billing: plans, invoices, and a Stripe webhook, with a screen", note: "JEV picks the playbooks (feature, module, migrate, and the UI pipeline). Backend and frontend work runs in parallel, each in its own files." },
      { command: "/jal-ui polish the billing dashboard for the first customer demo", note: "JEV places the brief at modern and sets table density. jal-ux builds phone first on JAL Core and loops until the UI check passes." },
      { command: "/jal-check", note: "One PASS or FAIL: rules scan, tests, UI check, security hardening, a boot test, and the ship call." },
    ],
  },
  {
    id: "case-b",
    title: "Add a Rust gRPC image-processing sidecar",
    summary:
      "A hot path, resizing and transcoding uploaded images, is too slow in Bun. Add a compiled sidecar the right way.",
    steps: [
      { command: "/jal-build a Rust sidecar that resizes and transcodes uploaded images", note: "New tech outside Bun asks Brian first. Once approved, the service playbook scaffolds `services/imgproc/` with a proto-first contract, jal-systems implements and benchmarks the Rust server, and Bun callers get a typed client generated from the same proto." },
      { command: "/jal-check full", note: "Tests, module boundaries, hardening, and a boot test cover the new service before it ships next to the main app." },
      { command: "/jal-ship pr", note: "Open a pull request with a clear title and a test checklist, only after the gate passes." },
    ],
  },
  {
    id: "case-c",
    title: "Ship a feature safely as a small team",
    summary:
      "A small team ships a real feature end to end with a paper trail: a decision record, a checked pull request, a release, and a safe deploy.",
    steps: [
      { command: "/jal-build weekly report generation as a background job, with an ADR", note: "The adr playbook records the decision first, then the feature is built with its tests." },
      { command: "/jal-ship pr", note: "The full check runs first, then a pull request opens with a summary and a test plan." },
      { command: "/jal-ship release", note: "Bump the version, write the changelog, and tag it." },
      { command: "/jal-ship deploy", note: "Deploy the tagged image to deploy.jalgroup.id and health check it. It happens only because your message said deploy." },
      { command: "/jal-ship rollback v1.4.2", note: "If the health check ever fails, return to the last healthy version in one step." },
    ],
  },
  {
    id: "case-d",
    title: "Launch an immersive product page",
    summary:
      "A landing page for a physical product, where a 3D hero earns its place and the rest of the page stays calm and fast.",
    steps: [
      { command: "/jal-ui an immersive landing page for Halo, a smart desk lamp, with a 3D lamp hero", note: "JEV classifies the brief as immersive and jal-immersive takes over. Only sections that pass the immersion gate get 3D; the rest stay product calm." },
      { command: "/jal-ui make the hero lighter on older phones", note: "JEV re-picks the device tier. The poster, reduced-motion stills, and the text version of the scene stay in place." },
      { command: "/jal-check quick", note: "Rules scan, tests, and the UI check at all five widths, reduced motion included." },
    ],
  },
  {
    id: "case-e",
    title: "Document a project for the team",
    summary:
      "Give developers a handover and give everyone else a plain summary, both written from the code and both checked.",
    steps: [
      { command: "/jal-docs JAL-Group/Sentimen_DPP", note: "Reads the code, writes the developer and non-technical sections, verifies every claim, opens a pull request on malasbaca, and merges and deploys it once every check passes." },
      { command: "/jal-docs JAL-Group/Sentimen_DPP", note: "Run it again after the code changes: it detects the existing page and updates only what changed." },
    ],
  },
  {
    id: "case-f",
    title: "Security pass before launch",
    optional: true,
    summary:
      "Before a public launch, run both sides of the security loop and ship with every confirmed finding closed and verified again.",
    steps: [
      { command: "/jal-check deep before the launch", note: "Adds a deep audit (architecture drift, dependency audit, dead code, bundle size) and a red team versus blue team pentest." },
      { command: "/jal-ship release", note: "Cut the release only once the deep check reports PASS." },
    ],
  },
];

export const FAQ = {
  title: SECTION_MARKERS.faq,
  items: [
    {
      q: "Install says Plugin not found.",
      a:
        "Use the full name, `claude plugin install jal-aidev@jal-aidev-marketplace`. The short name `jal-aidev` fails with Plugin not found. Make sure the marketplace was added first.",
    },
    {
      q: "The marketplace add fails against the private repository.",
      a:
        "Adding the marketplace needs the same GitHub access your git client uses for private repos, for example `gh auth login`, an SSH key, or a credential helper with a valid token. If a plain `git clone` of JAL-Group/JAL-AIDEV works in a terminal, the plugin install will too.",
    },
    {
      q: "New agents or commands do not show up after an update.",
      a:
        "Fully quit and reopen Claude after installing or updating. The agents, skills, and bundled tools load at start.",
    },
    {
      q: "I typed an old command like /jal-scaffold or /jal-review.",
      a:
        "The old commands were folded into seven. See the old command, new command table in the Commands section: /jal-scaffold is now /jal-new, /jal-review is /jal-check, /jal-debug is /jal-fix, and so on.",
    },
    {
      q: "Bun is not found, or the guard fails.",
      a:
        "The guard and the bundled tools run on bun, so bun must be on PATH for the shell Claude Code runs in, not just installed somewhere on disk. Run `bun --version` in the same terminal or IDE. If that fails, reinstall Bun from https://bun.sh and open a fresh shell.",
    },
    {
      q: "The UI check says SKIPPED.",
      a:
        "It could not find Chrome. Install Google Chrome or Chromium, or set `CHROME_PATH` to its location. SKIPPED is never treated as a pass.",
    },
    {
      q: "A save was blocked by the guard.",
      a:
        "The write-time guard stops a banned pattern before it lands: an em-dash, an emoji, a gradient, a blurred shadow, or a side stripe. Rephrase with a comma or colon, or use a flat surface with a hairline border.",
    },
    {
      q: "A decision in a report says UNVERIFIED BY JEV.",
      a:
        "JEV could not be reached, so the agent applied the same criteria itself and said so. Ship calls made that way are reviewed by jal-principal. Nothing is ever reported as verified unless JEV actually answered.",
    },
    {
      q: "A command reports a module boundary violation and stops.",
      a:
        "`bun run check:boundaries` failed: a module imported another module's internals instead of its public `index.ts`, or a route imported a concrete Postgres, Redis, or S3 client instead of the port it should depend on. Fix the import and run the command again; it does not skip the check on retry.",
    },
    {
      q: "A specialist refuses a library outside the approved stack.",
      a:
        "That is by design. jal-architect and every specialist reject Vite, Next.js, an ORM, or anything else outside the approved stack, and a real exception goes to Brian for a yes before it ships. JEV never approves new tech.",
    },
  ],
};

export const FOOTER = {
  tagline: "Built by JAL Group. Dibuat dengan hati di Indonesia.",
  repo: "github.com/JAL-Group/JAL-AIDEV",
};
