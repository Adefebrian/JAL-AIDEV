# JAL-AIDEV docs site

The public docs site for the JAL-AIDEV plugin: what it is, how to install it,
the constitution in plain words, the agent crew, every command, four real
study-case walkthroughs, and an FAQ.

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
- `src/styles.css`: the whole design system, tokens copied from skill
  `jal-ui-taste` (type scale, 4/8pt spacing, radius, elevation,
  breakpoints), the Bento grid recipe, and the mobile app-shell.
- `src/app.ts`: the progressive-enhancement layer, bundled by `build.ts`.
- `src/content.test.ts`: asserts the 7 required section markers, the
  required study case titles, the install snippet, all 14 agents, all 15
  commands, and that no em dash appears anywhere in the rendered page or
  in any source file under this directory.

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
