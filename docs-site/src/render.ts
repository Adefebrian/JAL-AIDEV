// docs-site/src/render.ts
//
// Turns the data in content.ts into the final HTML string for the page.
// Plain string templating, no React: this page is entirely static content,
// so a virtual DOM would not earn its keep here (see README for the
// reasoning). build.ts calls renderPage() once and writes the result into
// the shell from src/index.html.
import {
  AGENTS,
  COMMANDS,
  CONSTITUTION,
  FAQ,
  FOOTER,
  HERO,
  INSTALL,
  NAV,
  OVERVIEW,
  STUDY_CASES,
  SECTION_MARKERS,
  type Agent,
  type Command,
} from "./content";
import { iconSvg, type IconName } from "./icons";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function codeBlock(code: string, filename?: string): string {
  const label = filename ? `<div class="code-label">${escapeHtml(filename)}</div>` : "";
  return `<div class="code-block">${label}<pre><code>${escapeHtml(code)}</code></pre><button type="button" class="copy-btn" data-copy="${escapeHtml(code)}">Copy</button></div>`;
}

const ALL_SECTIONS: { id: string; label: string }[] = [
  { id: "overview", label: SECTION_MARKERS.overview },
  { id: "install", label: SECTION_MARKERS.install },
  { id: "constitution", label: SECTION_MARKERS.constitution },
  { id: "agents", label: SECTION_MARKERS.agents },
  { id: "commands", label: SECTION_MARKERS.commands },
  { id: "study-cases", label: SECTION_MARKERS.studyCases },
  { id: "faq", label: SECTION_MARKERS.faq },
];

function renderHeader(): string {
  const links = NAV.map((item) => `<a class="nav-link" href="#${item.id}">${item.label}</a>`).join("");
  const drawerLinks = ALL_SECTIONS.map((s) => `<a class="drawer-link" href="#${s.id}" data-drawer-link>${s.label}</a>`).join("");
  return `
<header class="app-header">
  <div class="app-header-inner">
    <a class="brand" href="#overview">
      <span class="brand-mark">JAL-AIDEV</span>
      <span class="brand-tag">${escapeHtml(HERO.kicker)}</span>
    </a>
    <nav class="top-nav" aria-label="Sections">${links}</nav>
    <a class="btn btn-primary btn-sm top-nav-cta" href="#install">Get started</a>
    <button type="button" class="menu-btn" aria-label="Open menu" aria-expanded="false" data-menu-toggle>
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<div class="drawer" data-drawer hidden>
  <nav aria-label="All sections">${drawerLinks}</nav>
</div>`;
}

function renderHero(): string {
  const stats = HERO.stats
    .map((stat) => `<div class="stat-chip"><span class="stat-value">${stat.value}</span><span class="stat-label">${stat.label}</span></div>`)
    .join("");
  return `
<section class="hero" id="hero">
  <div class="hero-inner">
    <h1>${escapeHtml(HERO.title)}</h1>
    <p class="hero-body">${escapeHtml(HERO.body)}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="${HERO.primaryCta.href}">${HERO.primaryCta.label}</a>
      <a class="btn btn-ghost" href="${HERO.secondaryCta.href}">${HERO.secondaryCta.label}</a>
    </div>
    <div class="stat-row">${stats}</div>
  </div>
</section>`;
}

function renderOverview(): string {
  const points = OVERVIEW.points
    .map(
      (point) =>
        `<article class="bento-item bento-sm"><h3>${escapeHtml(point.title)}</h3><p>${escapeHtml(point.body)}</p></article>`,
    )
    .join("");
  return `
<section class="section" id="overview">
  <h2>${escapeHtml(OVERVIEW.title)}</h2>
  <div class="bento overview-grid">
    <article class="bento-item bento-lg overview-lead">
      <p class="lead-text">${escapeHtml(OVERVIEW.lead)}</p>
    </article>
    ${points}
    <article class="bento-item bento-sm overview-why">
      <h3>${escapeHtml(OVERVIEW.whyTitle)}</h3>
      <p>${escapeHtml(OVERVIEW.why)}</p>
    </article>
  </div>
</section>`;
}

function renderInstall(): string {
  const steps = INSTALL.steps
    .map(
      (step, index) => `
    <article class="bento-item bento-full install-step">
      <div class="step-number">${index + 1}</div>
      <div class="step-body">
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.body)}</p>
        ${codeBlock(step.code, step.filename)}
      </div>
    </article>`,
    )
    .join("");
  return `
<section class="section" id="install">
  <h2>${escapeHtml(INSTALL.title)}</h2>
  <p class="section-lead">${escapeHtml(INSTALL.lead)}</p>
  <div class="bento install-grid">${steps}</div>
  <p class="section-note">${escapeHtml(INSTALL.note)}</p>
</section>`;
}

function renderConstitution(): string {
  const [first, ...rest] = CONSTITUTION.items;
  const restCards = rest
    .map(
      (item) => `<article class="bento-item bento-sm"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p></article>`,
    )
    .join("");
  return `
<section class="section" id="constitution">
  <h2>${escapeHtml(CONSTITUTION.title)}</h2>
  <p class="section-lead">${escapeHtml(CONSTITUTION.lead)}</p>
  <div class="bento">
    <article class="bento-item bento-wide">
      <h3>${escapeHtml(first.title)}</h3>
      <p>${escapeHtml(first.body)}</p>
    </article>
    ${restCards}
  </div>
</section>`;
}

function renderAgentCard(agent: Agent): string {
  return `<article class="bento-item bento-sm agent-card"><h4 class="agent-slug">${escapeHtml(agent.slug)}</h4><p>${escapeHtml(agent.line)}</p></article>`;
}

function renderAgents(): string {
  const principal = AGENTS.find((agent) => agent.tier === "head");
  const lead = AGENTS.find((agent) => agent.tier === "lead");
  const specialists = AGENTS.filter((agent) => agent.tier === "specialist");
  const specialistCards = specialists.map(renderAgentCard).join("");
  return `
<section class="section" id="agents">
  <h2>${SECTION_MARKERS.agents}</h2>
  <p class="section-lead">One head, one orchestrator, twelve specialists. Direction flows down, findings and status flow back up.</p>
  <div class="hierarchy">
    <article class="hierarchy-row hierarchy-head">
      <span class="hierarchy-tier">Head</span>
      <h3 class="agent-slug">${principal ? escapeHtml(principal.slug) : ""}</h3>
      <p>${principal ? escapeHtml(principal.line) : ""}</p>
    </article>
    <div class="hierarchy-connector" aria-hidden="true"></div>
    <article class="hierarchy-row hierarchy-lead">
      <span class="hierarchy-tier">Orchestrator</span>
      <h3 class="agent-slug">${lead ? escapeHtml(lead.slug) : ""}</h3>
      <p>${lead ? escapeHtml(lead.line) : ""}</p>
    </article>
    <div class="hierarchy-connector" aria-hidden="true"></div>
    <span class="hierarchy-tier hierarchy-tier-specialists">Specialists</span>
    <div class="bento specialists-grid">${specialistCards}</div>
  </div>
</section>`;
}

function renderCommandCard(command: Command): string {
  const hint = command.argumentHint ? ` <span class="cmd-hint">${escapeHtml(command.argumentHint)}</span>` : "";
  return `
<article class="bento-item bento-sm cmd-card">
  <h4 class="cmd-name">${escapeHtml(command.name)}${hint}</h4>
  <p>${escapeHtml(command.what)}</p>
  ${codeBlock(command.example)}
</article>`;
}

function renderCommands(): string {
  const v1 = COMMANDS.filter((command) => command.version === "v0.1.0");
  const v2 = COMMANDS.filter((command) => command.version === "v0.2.0");
  return `
<section class="section" id="commands">
  <h2>${SECTION_MARKERS.commands}</h2>
  <p class="section-lead">Every command below is a slash command inside Claude Code. Type it, fill in the argument, read the result.</p>

  <h3 class="cmd-group-title">v0.1.0</h3>
  <div class="bento cmd-grid cmd-grid-3">${v1.map(renderCommandCard).join("")}</div>

  <h3 class="cmd-group-title">v0.2.0</h3>
  <div class="bento cmd-grid">${v2.map(renderCommandCard).join("")}</div>
</section>`;
}

function renderStudyCases(): string {
  const cards = STUDY_CASES.map((studyCase) => {
    const steps = studyCase.steps
      .map(
        (step) =>
          `<li><code class="inline-code">${escapeHtml(step.command)}</code><span class="step-note">${escapeHtml(step.note)}</span></li>`,
      )
      .join("");
    const badge = studyCase.optional ? '<span class="badge-optional">Optional</span>' : "";
    return `
<article class="bento-item bento-lg study-card">
  <div class="study-card-head">
    <h3>${escapeHtml(studyCase.title)}</h3>
    ${badge}
  </div>
  <p>${escapeHtml(studyCase.summary)}</p>
  <ol class="study-steps">${steps}</ol>
</article>`;
  }).join("");
  return `
<section class="section" id="study-cases">
  <h2>${SECTION_MARKERS.studyCases}</h2>
  <p class="section-lead">Four real walkthroughs, the exact commands in the exact order, so a new project has a map before it starts.</p>
  <div class="bento study-grid">${cards}</div>
</section>`;
}

function renderFaq(): string {
  const items = FAQ.items
    .map(
      (item) => `
<details class="faq-item">
  <summary>${escapeHtml(item.q)}</summary>
  <p>${escapeHtml(item.a)}</p>
</details>`,
    )
    .join("");
  return `
<section class="section" id="faq">
  <h2>${escapeHtml(FAQ.title)}</h2>
  <div class="faq-list">${items}</div>
</section>`;
}

function renderFooter(): string {
  return `
<footer class="app-footer">
  <p>${escapeHtml(FOOTER.tagline)}</p>
  <a href="https://${FOOTER.repo}">${escapeHtml(FOOTER.repo)}</a>
</footer>`;
}

function renderTabBar(): string {
  const items = NAV.map(
    (item) => `
  <a class="tab-item" href="#${item.id}" data-tab="${item.id}">
    ${iconSvg(item.icon as IconName)}
    <span>${item.label}</span>
  </a>`,
  ).join("");
  return `<nav class="tab-bar" aria-label="Quick jump">${items}</nav>`;
}

// Layout note: on mobile (see styles.css) .page-shell becomes a 100dvh
// flex column with the header and .tab-bar as fixed-size flex children and
// .scroll-region as the single flexible child that actually scrolls. That
// is the whole app-shell trick, no position:fixed/overlap-padding hack
// needed, header and tab bar simply never enter the scrolling flex item.
// On tablet and desktop .page-shell reverts to a normal static document,
// the tab bar is hidden, and the page scrolls the ordinary way.
export function renderPage(): string {
  return [
    '<div class="page-shell">',
    renderHeader(),
    '<div class="scroll-region">',
    '<main class="app-main">',
    renderHero(),
    renderOverview(),
    renderInstall(),
    renderConstitution(),
    renderAgents(),
    renderCommands(),
    renderStudyCases(),
    renderFaq(),
    "</main>",
    renderFooter(),
    "</div>",
    renderTabBar(),
    "</div>",
  ].join("\n");
}
