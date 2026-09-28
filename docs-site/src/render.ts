// docs-site/src/render.ts
//
// Turns the data in content.ts into the final HTML string for the page.
// Plain string templating, no React: this page is entirely static content,
// so a virtual DOM would not earn its keep here (see README for the
// reasoning). build.ts calls renderPage() once and writes the result into
// the shell from src/index.html.
//
// Layout components, all defined in styles.css:
// - .bento / .bento-item: hairline cards on a grid. Used only where the
//   cards in one row carry comparable content, and any card with a footer
//   (an example block, a JEV line) pins that footer to the bottom so a row
//   never shows an empty band.
// - .rows / .row: a bordered list of records, title on the left and body on
//   the right from tablet up. Used for anything that reads as a list of
//   rules or facts, so uneven copy lengths never leave dead card space.
// - .stack: cards stacked one per row (install steps, study cases).
import {
  AGENTS,
  AGENT_TIER_LABEL,
  BRAND,
  COMMANDS,
  COMMANDS_INTRO,
  COMMAND_MAP,
  CONSTITUTION,
  DESIGN_SYSTEM,
  DOCS,
  FAQ,
  FOOTER,
  HERO,
  IMMERSIVE,
  INSTALL,
  JEV,
  JEV_CATALOG,
  NAV,
  OVERVIEW,
  SECTION_MARKERS,
  STUDY_CASES,
  TOP_NAV,
  UI_CHECK,
  UI_RULES,
  type Agent,
  type Command,
} from "./content";
import { iconSvg, type IconName } from "./icons";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Escapes text, then renders `backtick` spans as inline code.
function richText(input: string): string {
  return escapeHtml(input).replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
}

function codeBlock(code: string, opts: { filename?: string; copy?: boolean; wrap?: boolean } = {}): string {
  const label = opts.filename ? `<div class="code-label">${escapeHtml(opts.filename)}</div>` : "";
  const copy = opts.copy
    ? `<button type="button" class="copy-btn" data-copy="${escapeHtml(code)}">Copy</button>`
    : "";
  const wrapClass = opts.wrap ? " code-wrap" : "";
  return `<div class="code-block${wrapClass}">${label}<div class="code-row"><pre><code>${escapeHtml(code)}</code></pre>${copy}</div></div>`;
}

function rows(items: { title: string; body: string; meta?: string; mono?: boolean }[], extraClass = ""): string {
  const inner = items
    .map((item) => {
      const titleClass = item.mono ? "row-title row-title-mono" : "row-title";
      const meta = item.meta ? `<span class="row-meta">${escapeHtml(item.meta)}</span>` : "";
      return `<div class="row"><div class="row-head"><h3 class="${titleClass}">${escapeHtml(item.title)}</h3>${meta}</div><p class="row-body">${richText(item.body)}</p></div>`;
    })
    .join("");
  const cls = extraClass ? `rows ${extraClass}` : "rows";
  return `<div class="${cls}">${inner}</div>`;
}

function sectionHead(title: string, lead?: string): string {
  const leadHtml = lead ? `<p class="section-lead">${richText(lead)}</p>` : "";
  return `<h2>${escapeHtml(title)}</h2>${leadHtml}`;
}

const ALL_SECTIONS: { id: string; label: string }[] = [
  { id: "overview", label: SECTION_MARKERS.overview },
  { id: "install", label: SECTION_MARKERS.install },
  { id: "constitution", label: SECTION_MARKERS.constitution },
  { id: "agents", label: SECTION_MARKERS.agents },
  { id: "commands", label: SECTION_MARKERS.commands },
  { id: "jev", label: SECTION_MARKERS.jev },
  { id: "design-system", label: SECTION_MARKERS.designSystem },
  { id: "immersive", label: SECTION_MARKERS.immersive },
  { id: "ui-check", label: SECTION_MARKERS.uiCheck },
  { id: "docs", label: SECTION_MARKERS.docs },
  { id: "study-cases", label: SECTION_MARKERS.studyCases },
  { id: "faq", label: SECTION_MARKERS.faq },
];

function renderHeader(): string {
  const links = TOP_NAV.map((item) => `<a class="nav-link" href="#${item.id}">${escapeHtml(item.label)}</a>`).join("");
  const drawerLinks = ALL_SECTIONS.map(
    (s) => `<a class="drawer-link" href="#${s.id}" data-drawer-link>${escapeHtml(s.label)}</a>`,
  ).join("");
  return `
<header class="app-header">
  <div class="app-header-inner">
    <a class="brand" href="#overview">
      <span class="brand-mark">${escapeHtml(BRAND.name)}</span>
      <span class="brand-tag">${escapeHtml(BRAND.tag)}</span>
    </a>
    <nav class="top-nav" aria-label="Sections">${links}</nav>
    <a class="btn btn-primary top-nav-cta" href="#install">Get started</a>
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
    .map(
      (stat) =>
        `<div class="stat-chip"><span class="stat-value">${escapeHtml(stat.value)}</span><span class="stat-label">${escapeHtml(stat.label)}</span></div>`,
    )
    .join("");
  return `
<section class="hero" id="hero">
  <div class="hero-inner">
    <h1>${escapeHtml(HERO.title)}</h1>
    <p class="hero-body">${richText(HERO.body)}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="${HERO.primaryCta.href}">${escapeHtml(HERO.primaryCta.label)}</a>
      <a class="btn btn-ghost" href="${HERO.secondaryCta.href}">${escapeHtml(HERO.secondaryCta.label)}</a>
    </div>
    <div class="stat-row">${stats}</div>
  </div>
</section>`;
}

function textCards(items: { title: string; body: string }[]): string {
  return items
    .map((item) => `<article class="bento-item"><h3>${escapeHtml(item.title)}</h3><p>${richText(item.body)}</p></article>`)
    .join("");
}

function renderOverview(): string {
  return `
<section class="section" id="overview">
  ${sectionHead(OVERVIEW.title, OVERVIEW.lead)}
  <div class="bento trio-grid">${textCards(OVERVIEW.points)}</div>
  <article class="bento-item callout">
    <h3>${escapeHtml(OVERVIEW.whyTitle)}</h3>
    <p>${richText(OVERVIEW.why)}</p>
  </article>
</section>`;
}

function renderInstall(): string {
  const steps = INSTALL.steps
    .map(
      (step, index) => `
    <article class="bento-item install-step">
      <div class="step-number">${index + 1}</div>
      <div class="step-body">
        <h3>${escapeHtml(step.title)}</h3>
        <p>${richText(step.body)}</p>
        ${codeBlock(step.code, { filename: step.filename, copy: true })}
      </div>
    </article>`,
    )
    .join("");
  return `
<section class="section" id="install">
  ${sectionHead(INSTALL.title, INSTALL.lead)}
  <div class="stack">${steps}</div>
  <p class="section-note">${richText(INSTALL.note)}</p>
</section>`;
}

function renderConstitution(): string {
  return `
<section class="section" id="constitution">
  ${sectionHead(CONSTITUTION.title, CONSTITUTION.lead)}
  ${rows(CONSTITUTION.items)}
</section>`;
}

function renderLeaderRow(agent: Agent | undefined): string {
  if (!agent) return "";
  return `
    <article class="bento-item agent-card agent-card-leader">
      <h3 class="agent-slug">${escapeHtml(agent.slug)}</h3>
      <p><strong class="agent-tier">${escapeHtml(AGENT_TIER_LABEL[agent.tier])}.</strong> ${richText(agent.line)}</p>
      <p class="agent-jev">JEV: ${escapeHtml(agent.jev)}</p>
    </article>`;
}

function renderAgentCard(agent: Agent): string {
  return `
    <article class="bento-item agent-card">
      <h3 class="agent-slug">${escapeHtml(agent.slug)}</h3>
      <p>${richText(agent.line)}</p>
      <p class="agent-jev">JEV: ${escapeHtml(agent.jev)}</p>
    </article>`;
}

function renderAgents(): string {
  const principal = AGENTS.find((agent) => agent.tier === "head");
  const lead = AGENTS.find((agent) => agent.tier === "lead");
  const judge = AGENTS.find((agent) => agent.tier === "judge");
  const specialists = AGENTS.filter((agent) => agent.tier === "specialist");
  return `
<section class="section" id="agents">
  ${sectionHead(
    SECTION_MARKERS.agents,
    `${AGENTS.length} agents: one head, one orchestrator, one judge, and ${specialists.length} specialists. Direction flows down, findings flow back up, and each card lists the JEV decisions that agent asks.`,
  )}
  <div class="stack">
    ${renderLeaderRow(principal)}
    ${renderLeaderRow(lead)}
    ${renderLeaderRow(judge)}
  </div>
  <h3 class="sub-title">Specialists</h3>
  <div class="bento pair-grid">${specialists.map(renderAgentCard).join("")}</div>
</section>`;
}

function renderCommandCard(command: Command): string {
  const wide = command.wide ? " cmd-card-wide" : "";
  return `
<article class="bento-item cmd-card${wide}">
  <h3 class="cmd-name">${escapeHtml(command.name)}</h3>
  <p class="cmd-hint">${escapeHtml(command.argumentHint)}</p>
  <p class="cmd-purpose">${escapeHtml(command.purpose)}</p>
  <p>${richText(command.what)}</p>
  ${codeBlock(command.examples.join("\n"), { filename: command.examples.length > 1 ? "Examples" : "Example", wrap: true })}
</article>`;
}

function renderCommands(): string {
  const mapRows = COMMAND_MAP.map((entry) => {
    const old = entry.old.map((name) => `<code class="inline-code">${escapeHtml(name)}</code>`).join(" ");
    return `<div class="row"><div class="row-head"><h3 class="row-title row-title-mono">${escapeHtml(entry.now)}</h3></div><p class="row-body chip-line">${old}</p></div>`;
  }).join("");
  return `
<section class="section" id="commands">
  ${sectionHead(SECTION_MARKERS.commands, COMMANDS_INTRO.lead)}
  <div class="bento cmd-grid">${COMMANDS.map(renderCommandCard).join("")}</div>

  <h3 class="sub-title">${escapeHtml(COMMANDS_INTRO.engineTitle)}</h3>
  <p class="sub-lead">${richText(COMMANDS_INTRO.engineLead)}</p>
  ${rows(COMMANDS_INTRO.waves)}

  <h3 class="sub-title">${escapeHtml(COMMANDS_INTRO.mapTitle)}</h3>
  <p class="sub-lead">${richText(COMMANDS_INTRO.mapLead)}</p>
  <div class="rows">${mapRows}</div>
  <p class="section-note">${richText(COMMANDS_INTRO.mapNote)}</p>
</section>`;
}

function renderJev(): string {
  const total = JEV_CATALOG.reduce((sum, entry) => sum + entry.count, 0);
  return `
<section class="section" id="jev">
  ${sectionHead(JEV.title, JEV.lead)}
  ${rows(JEV.principles)}
  <h3 class="sub-title">${escapeHtml(JEV.catalogTitle)}</h3>
  <p class="sub-lead">${richText(JEV.catalogLead)}</p>
  ${rows(JEV_CATALOG.map((entry) => ({ title: entry.area, meta: `${entry.count} ${entry.count === 1 ? "decision" : "decisions"}`, body: entry.covers })))}
  <p class="section-note">${total} decisions in total.</p>
</section>`;
}

function renderDesignSystem(): string {
  return `
<section class="section" id="design-system">
  ${sectionHead(DESIGN_SYSTEM.title, DESIGN_SYSTEM.lead)}
  <div class="bento trio-grid">${textCards(DESIGN_SYSTEM.sources)}</div>
  ${rows(DESIGN_SYSTEM.points)}
</section>`;
}

function renderImmersive(): string {
  const earned = IMMERSIVE.earned.map((line) => `<li>${richText(line)}</li>`).join("");
  return `
<section class="section" id="immersive">
  ${sectionHead(IMMERSIVE.title, IMMERSIVE.lead)}
  <article class="bento-item callout">
    <h3>${escapeHtml(IMMERSIVE.earnedTitle)}</h3>
    <ul class="plain-list">${earned}</ul>
    <p>${richText(IMMERSIVE.never)}</p>
  </article>
  <h3 class="sub-title">${escapeHtml(IMMERSIVE.zonesTitle)}</h3>
  <div class="bento trio-grid">${textCards(IMMERSIVE.zones)}</div>
  <h3 class="sub-title">${escapeHtml(IMMERSIVE.safetyTitle)}</h3>
  ${rows(IMMERSIVE.safety)}
</section>`;
}

function renderUiCheck(): string {
  const widths = UI_CHECK.widths.map((w) => `<span class="width-chip">${w}px</span>`).join("");
  return `
<section class="section" id="ui-check">
  ${sectionHead(UI_CHECK.title, UI_CHECK.lead)}
  <div class="width-line">${widths}</div>
  ${rows(UI_RULES.map((r) => ({ title: r.rule, body: r.catches, mono: true })))}
  <article class="bento-item callout">
    <h3>${escapeHtml(UI_CHECK.runTitle)}</h3>
    <p>${richText(UI_CHECK.runBody)}</p>
    ${codeBlock(UI_CHECK.runCode, { copy: true })}
  </article>
</section>`;
}

function renderDocs(): string {
  return `
<section class="section" id="docs">
  ${sectionHead(DOCS.title, DOCS.lead)}
  ${rows(DOCS.points)}
</section>`;
}

function renderStudyCases(): string {
  const cards = STUDY_CASES.map((studyCase) => {
    const steps = studyCase.steps
      .map(
        (step) =>
          `<li><code class="inline-code step-cmd">${escapeHtml(step.command)}</code><span class="step-note">${richText(step.note)}</span></li>`,
      )
      .join("");
    const badge = studyCase.optional ? '<span class="badge-optional">Optional</span>' : "";
    return `
<article class="bento-item study-card" id="${studyCase.id}">
  <div class="study-intro">
    <div class="study-card-head">
      <h3>${escapeHtml(studyCase.title)}</h3>
      ${badge}
    </div>
    <p>${richText(studyCase.summary)}</p>
  </div>
  <ol class="study-steps">${steps}</ol>
</article>`;
  }).join("");
  return `
<section class="section" id="study-cases">
  ${sectionHead(
    SECTION_MARKERS.studyCases,
    `${STUDY_CASES.length} real walkthroughs, the exact commands in the exact order, so a new project has a map before it starts.`,
  )}
  <div class="stack">${cards}</div>
</section>`;
}

function renderFaq(): string {
  const items = FAQ.items
    .map(
      (item) => `
<details class="faq-item">
  <summary>${escapeHtml(item.q)}</summary>
  <p>${richText(item.a)}</p>
</details>`,
    )
    .join("");
  return `
<section class="section" id="faq">
  ${sectionHead(FAQ.title)}
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
    <span>${escapeHtml(item.label)}</span>
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
    renderJev(),
    renderDesignSystem(),
    renderImmersive(),
    renderUiCheck(),
    renderDocs(),
    renderStudyCases(),
    renderFaq(),
    "</main>",
    renderFooter(),
    "</div>",
    renderTabBar(),
    "</div>",
  ].join("\n");
}
