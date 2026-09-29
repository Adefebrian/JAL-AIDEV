# JAL-AIDEV docs site

The docs site for the JAL-AIDEV plugin (v0.4.1): what it is, how to install
it, the constitution in plain words, the 17-agent crew, the eight commands
and the old-to-new command map, JEV as the judge, the one design system
(JAL Core), the immersive and 3D layer, the 22-rule UI check, JAL Docs
publishing, six study-case walkthroughs, and an FAQ.

## Stack

Bun only, no Vite, no Next.js, no framework the constitution does not
already allow. The page is static HTML and CSS built from one content
source (`src/content.ts`); the only client-side JavaScript is a small
progressive-enhancement layer (copy buttons, the mobile section drawer,
active-tab tracking), because nothing on this page needs component state
or a virtual DOM to earn a framework's weight.

## Layout

- `src/content.ts`: every piece of copy on the page, one place, so the
  page and its test can never drift apart.
- `src/icons.ts`: koboyo-sourced icon markup (home, install, terminal,
  FAQ), per skill `jal-frontend-rules`.
- `src/render.ts`: turns `content.ts` into the final HTML string.
- `src/index.html`: the shell the rendered content is spliced into.
- `src/styles.css`: the whole design system, tokens from skill
  `jal-ui-taste` and JAL Core (type scale, 4/8pt spacing, radius, one 44px
  control height, breakpoints), the Bento card grid, the rows list, and
  the mobile app-shell (pinned header plus a 4-tab bottom bar under 640px).
- `src/app.ts`: the progressive-enhancement layer, bundled by `build.ts`.
- `src/content.test.ts`: asserts the 12 section markers, the study cases
  (every step uses a current command), the install snippet, all 17 agents,
  the 8 commands, the old-to-new map, the 53 JEV decisions, the 22 UI check
  rules, the hero stats against the catalog and the rule list, and that no em dash or emoji appears anywhere. When the plugin
  sources sit next to this directory it also cross-checks the agents,
  commands, plugin version, and audit rule names against them.

## Commands

```bash
bun install       # install deps
bun run build     # build dist/
bun run serve     # serve dist/ with Hono on :4000 (DOCS_PORT to change)
bun test          # run content.test.ts
bun run typecheck # tsc --noEmit
```

## Requirements

Bun must be installed and on PATH.
