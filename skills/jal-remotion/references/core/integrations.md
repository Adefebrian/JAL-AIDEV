# Integrations: existing apps, other frameworks, build tooling (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01).

## What it is

How Remotion sits inside a project that is not a fresh `create-video`: an existing React app, Angular/Vue/Svelte shells, Electron, a monorepo package, plus bundler tweaks (TypeScript aliases, SCSS, Tailwind legacy, Babel, JS-only) and what is explicitly unsupported.

## When a JAL agent uses it

When a JAL monorepo (Bun + Hono + React, `Bun.build`, no Vite) needs a video or a Player: decide where the Remotion project lives, how the page embeds the Player, and which tooling stays separate. Also when a customer project is on Angular/Vue/Svelte (JAL default stack is React, so these are reference only).

## Placement decision for JAL (JEV picks, defaults here)

1. **Video project as its own workspace package** (`packages/video`, folder holds `src/index.ts` with `registerRoot`, `public/`, `remotion.config.ts`). Remotion's bundler (Webpack or Rspack) is used only for the Studio and renders. Run with `bunx remotionb studio` / `bun run dev`.
2. **Website embeds a Player** (`@remotion/player`) imported from the video package source through the site's normal `Bun.build`; no Remotion bundler needed there. Compositions are plain React components, so both builds can import the same file. Keep `public/` assets referenced with `staticFile()` only inside the Remotion project; in the site pass absolute URLs as props.
3. Put shared constants (`FPS`, `DURATION_IN_FRAMES`, sizes) in one file imported by both the Studio root and the site Player. If `calculateMetadata()` is used, mirror it for the Player manually (the Player does not run it).
4. Convert a Player-only React app into a Remotion project (to get the Studio and renders): `bun add --exact @remotion/cli@4.0.532`, create `remotion/Root.tsx` + `remotion/index.ts`, `bunx remotionb studio`. Reverse (project to app): scaffold the Next.js / Vercel / React Router template, copy `Root.tsx` and `public/`, wire the Player in `app/page.tsx` or `app/home.tsx`. JAL does not use Next/Vite: prefer the first pattern.

## Existing project install (brownfield)

```bash
bun add --exact remotion@4.0.532 @remotion/cli@4.0.532      # pin; add @remotion/player to embed, @remotion/renderer for Node rendering
```
Create `remotion/Composition.tsx`, `remotion/Root.tsx`, `remotion/index.ts` (`registerRoot(RemotionRoot)`), run `bunx remotionb studio remotion/index.ts`, render with `bunx remotionb render remotion/index.ts <CompId> out.mp4` (Chrome based, gated). Warning: a `tsconfig` `paths` alias that maps the bare name `remotion` to your `remotion/` folder breaks `import ... from 'remotion'`; use prefixed aliases or none. Add ESLint plugin: `@remotion/eslint-plugin` into an existing config (flat: `{files: ['src/remotion/**/*.{ts,tsx}'], ...remotion.flatPlugin}`; legacy: `plugin:@remotion/recommended`), or the full config `@remotion/eslint-config-flat` (ESLint 9; `makeConfig({remotionDir})` to scope) / `@remotion/eslint-config` (legacy).

## Frameworks

| Framework | Status | Approach |
|---|---|---|
| React (Next, React Router, Vite, CRA) | supported | install packages, `remotion/` folder, Player in a client component |
| Angular | supported via wrapper | `jsx: react`, `skipLibCheck: true`, a TSX component that `createRoot()`s the Player, props via Signal or EventEmitter; copy `remotion.config.ts` to the root |
| Vue | supported via wrapper | `jsx: react`, `jsxImportSource: ""`, `@vitejs/plugin-react` with `include: /\.(jsx|tsx)$/` next to the Vue plugin, `.vue` wrapper that `createRoot()`s a React `PlayerView`, re-render on prop change, unmount on destroy |
| Svelte | supported via wrapper | `.svelte` wrapper with `onMount` `createRoot`, `$effect` to re-render, `onDestroy` unmount; read props inside the effect (no deep reactivity) |
| React Native | not planned (per-frame re-render too slow); Expo DOM components experiment only | |
| Deno | not supported; `remotiond` for experiments with `--allow-env --allow-read --allow-write --allow-net --allow-run --allow-sys` | |
| Bun | mostly supported (see `fundamentals.md`) | |
| Electron | template exists | render in main process via IPC, bundle at build time, `binariesDirectory` into `app.asar.unpacked`, `ensureBrowser()` or package the browser (`REMOTION_ELECTRON_PACKAGE_BROWSER=true`, not for macOS universal), separate glibc/musl compositor packages on Linux; code signing and installers are app-specific |

Wrapper pattern shared by all non-React shells:

```tsx
// PlayerView.tsx  (React side)
import {Player, type PlayerRef} from '@remotion/player';
import {forwardRef, useImperativeHandle, useRef} from 'react';
import {HelloWorld} from './HelloWorld';
export const PlayerView = forwardRef<{playerRef: PlayerRef | null}, {data: {titleText: string}; onPaused?: () => void}>(({data, onPaused}, ref) => {
  const playerRef = useRef<PlayerRef>(null);
  useImperativeHandle(ref, () => ({get playerRef() { return playerRef.current; }}));
  return <Player ref={playerRef} component={HelloWorld} inputProps={data} durationInFrames={150} fps={30} compositionWidth={1920} compositionHeight={1080} style={{width: '100%'}} controls />;
});
```
Mount it from the shell with `createRoot(container).render(<PlayerView .../>)`, re-render on data change, `root.unmount()` on destroy.

## Bundler tweaks

- **TypeScript path aliases** are not resolved by default: add `resolve.alias` in `Config.overrideBundlerConfig` (works for Webpack and Rspack); `tsconfig-paths-webpack-plugin` works with Webpack only; `bundle()` needs the same override passed as `bundlerOverride`. Docs recommend not using aliases.
- **SCSS**: `bun add --exact @remotion/enable-scss@4.0.532 sass@1.77.2 sass-loader@14.2.1 css-loader@5.2.7` (exact versions only), then `Config.overrideBundlerConfig(enableScss)`; the function is the reducer-style `enableScss(currentConfiguration)`.
- **Tailwind**: current projects use `@remotion/tailwind-v4` via `Config.overrideBundlerConfig`; v2 page is legacy (postcss-loader, tailwind@2). Never use `transition-*` or `animate-*` classes in comps. JAL uses Tailwind via `bun-plugin-tailwind` on the site, not inside the Remotion bundler, unless the video package needs it.
- **Other loaders**: MDX, PostCSS, SVGR snippets are in the bundlers page; follow it only when needed.
- **Legacy Babel**: default is esbuild-loader / SWC; `@remotion/babel-loader` `replaceLoadersWithBabel()` is the fallback.
- **JavaScript only**: allowed (`.jsx`), not used in JAL.
- **Authoring a Remotion library**: use `remotion-dev/library-starter` (ESM+CJS, Studio inside, `remotion` as peer + dev dependency, Turborepo); publish to npm, NPM Kiosk, or the Remotion Store. `peerDependencies: {remotion: '*'}` prevents duplicate copies (mismatched copies break context).

## Combining with the JAL kit

- JAL scaffold (`/jal-new`) does not include Remotion; adding it is a `packages/video` workspace plus a page that embeds the Player. Needs Brian's confirmation only for server rendering extras, not for the Player.
- Docker/Coolify images stay Bun-only unless Brian approves a render server.

From:
- https://www.remotion.dev/docs/brownfield
- https://www.remotion.dev/docs/studio-into-app
- https://www.remotion.dev/docs/player-into-remotion-project
- https://www.remotion.dev/docs/angular
- https://www.remotion.dev/docs/vue
- https://www.remotion.dev/docs/svelte
- https://www.remotion.dev/docs/electron
- https://www.remotion.dev/docs/react-native
- https://www.remotion.dev/docs/deno
- https://www.remotion.dev/docs/typescript-aliases
- https://www.remotion.dev/docs/enable-scss/enable-scss
- https://www.remotion.dev/docs/enable-scss/overview
- https://www.remotion.dev/docs/tailwind-legacy
- https://www.remotion.dev/docs/legacy-babel
- https://www.remotion.dev/docs/javascript
- https://www.remotion.dev/docs/authoring-packages
- https://www.remotion.dev/docs/eslint-config
- https://www.remotion.dev/docs/eslint-plugin
