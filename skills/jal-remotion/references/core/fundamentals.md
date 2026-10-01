# Fundamentals: create, run, Bun, versions (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01). React 19 + TypeScript.

## What it is

Remotion is a React framework where a video is a function of a frame number. Core packages: `remotion` (primitives), `@remotion/cli` (Studio + render CLI), `@remotion/player` (embed a live video in a React page), `@remotion/renderer` + `@remotion/bundler` (Node/Bun server rendering, Chrome based), `@remotion/web-renderer` (client-side rendering with WebCodecs, no server), `@remotion/media` (media tags), `@remotion/lambda` / `@remotion/vercel` / `@remotion/cloudrun` (optional cloud rendering).

## When a JAL agent uses it

Remotion is the main core motion of JAL-AIDEV (decision of Brian, 2026-10-01). Use it for any video output (MP4, WebM, GIF, stills, transparent overlays) and for in-site video-like pieces driven by the Player. GSAP, Lenis, Framer Motion, magicui, animata, noyzzi, OriginKit and the JAL frame core remain supplements; JEV picks per case (`motion.engine`) and may pick any other library when it fits better; any complex extra stack needs Brian's confirmation. Remotion is never installed in a project that needs no motion.

See also: `skills/jal-remotion/SKILL.md` (decision flow, workflows, law zones), `../web/website-integration.md` (websites), `../rendering/render-paths.md` (files).

## Licence gate (read first, warn the user)

- Free License: individuals; a for-profit organisation or team of up to 3 people; non-profits; evaluation without commercial use. Commercial use is allowed for free inside those groups.
- Company License required at 4 or more people. JAL is 3 people today: free. **The plugin must warn when a team reaches 4.** Remotion 5.0 changes the licence so contractors also count toward team size (see `license-and-policy.md`).
- Remotion is source-available, not open source: it may not be copied/modified to sell, relicense or sublicense a derivative. Some small packages are MIT (`@remotion/paths`, `@remotion/noise`, `@remotion/shapes`, `@remotion/layout-utils`, `@remotion/media-utils`, `@remotion/preload`, `@remotion/gsap` MIT); `remotion` core (incl. `interpolate`, `spring`), renderer, player, cli are under the Remotion License.
- Telemetry: server APIs only report when a `licenseKey` is set; **client-side rendering always sends an event per render, including the end user's IP address, to Remotion** unless declared. Pass `licenseKey: 'free-license'` to declare free eligibility (also silences the console warning). The Player sends nothing. On a public page in-browser export is used only when the feature is needed, with a privacy-policy line added automatically and no UI text (no notice, banner, or extra copy: Brian, 2026-10-01) (operational telemetry to Remotion as a technical provider); internal tools and dev pages use it freely (Brian, 2026-10-01; `skills/jal-remotion/SKILL.md` section 6).

## Create a project (Bun)

```bash
bun create video                  # wizard: template, Tailwind yes/no, Agent Skills yes/no; scripts use bunx remotionb
bunx create-video@latest --yes --blank --no-tailwind my-video   # non-interactive (npx form is the documented one)
cd my-video && bun install
bun run dev                       # = bunx remotionb studio  (port 3000+)
```
Templates (repos `remotion-dev/template-*`): helloworld (recommended first), blank, still, three (R3F), audiogram, music-visualization, skia, tiktok, code-hike, overlay, recorder, stargazer, next-app-tailwind, react-router, vercel (Sandbox), render-server (Express), electron, prompt-to-motion-graphics, prompt-to-video, vibe-code. Next.js / React Router templates start the Studio with `bun run remotion`.

### Bun notes and caveats
- Use `remotionb` (not `remotion`) so the CLI runs on the Bun runtime; `npx remotionb`, `bunx remotionb` and others are equivalent. Switch the script back to `remotion` to run on Node.
- Bun as a runtime is "mostly supported" (since Remotion 1.0.3). Known issues (as of Bun 1.0.24, Remotion 4.0.88): `lazyComponent` on `<Composition>`/`<Player>` does not work (disabled automatically); a server-side rendering script may not exit by itself (call `process.exit(0)` at the end).
- Bun is also fine as package manager (`bun i`, `bun add`) for every template. Remotion tooling bundles with Webpack or Rspack, not `Bun.build`; Remotion Studio and `remotion render` do their own bundling inside the project. In a JAL app that uses `Bun.build` for its site, only the Player embed (`@remotion/player`, `remotion`) goes through `Bun.build`; keep the Remotion project in its own `remotion/` folder or workspace package.
- Deno: not supported (`remotiond` exists with all permissions). React Native: not planned.
- System requirements: Node (or Bun) at or above the minimum shown on the install page, macOS 15 or later, Linux glibc 2.35 or later with Chrome dependencies installed; Alpine and NixOS unsupported.
- Exact version pinning: all `remotion` and `@remotion/*` packages same version, no `^`. `bunx remotion versions` checks. `bunx remotion add <pkg>` installs a package at the matching version (also `zod`, `mediabunny`, `@huggingface/transformers`).

## Project shape

```
my-video/
  public/            # staticFile() assets
  src/index.ts       # registerRoot(RemotionRoot)
  src/Root.tsx       # <Composition ...>
  src/MyComp.tsx
  remotion.config.ts # Config from @remotion/cli/config
  package.json
```
Preview: `bun run dev` (Studio). Render: `bunx remotionb render <CompId> out/x.mp4`. Still: `bunx remotionb still <CompId> out.png`. Details in `rendering-and-output.md`.

Install into an existing project (brownfield): `bun add --exact remotion@4.0.532 @remotion/cli@4.0.532` (+ `@remotion/player` to embed, `@remotion/renderer` for Node rendering, `@remotion/lambda` for Lambda). Create a `remotion/` folder with `Composition.tsx`, `Root.tsx`, `index.ts` (`registerRoot`), start with `remotion studio remotion/index.ts`, render with `remotion render remotion/index.ts <id> out.mp4`. Avoid tsconfig `paths` that map `remotion` to a local folder. Add `@remotion/eslint-plugin` (existing ESLint) or `@remotion/eslint-config-flat` (ESLint 9) / `@remotion/eslint-config` (legacy).

## Hello world (runs under Bun, React 19)

```tsx
// src/HelloWorld.tsx
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
export const HelloWorld: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: '#fff', fontSize: 100}}>
      <div style={{opacity}}>{text} ({Math.round((durationInFrames / fps) * 10) / 10}s)</div>
    </AbsoluteFill>
  );
};
```
```tsx
// src/Root.tsx
import {Composition} from 'remotion';
import {HelloWorld} from './HelloWorld';
export const RemotionRoot: React.FC = () => (
  <Composition id="HelloWorld" component={HelloWorld} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={{text: 'Hello JAL'}} />
);
```
```ts
// src/index.ts
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';
registerRoot(RemotionRoot);
```

## React and versions

- React 18 needs Remotion 3+, React 19 needs Remotion 4+ (all templates are React 19 except Skia, which stays on React 18). With React 19 update `@types/react`, `@types/react-dom`, R3F 9.1.2+ with `three` 0.171+, `styled-components` 6, Next.js 15. `React.FC` no longer includes `children`. Remotion auto-uses `createRoot`.
- `remotion upgrade` (`bunx remotion upgrade`, needs `@remotion/cli`) upgrades all packages and local skills. Semver: no breaking changes inside 4.x. Migration notes in `migrations-and-troubleshooting.md`.
- Plain JavaScript is allowed (rename `index.ts` / `Root.tsx` to `.jsx`). JAL uses TypeScript.
- `VERSION` constant: `import {VERSION} from 'remotion/version'` (no React import).

## Agent workflow (from the official skills, own words)

Start the Studio preview as soon as the project runs and keep it open; do not render an MP4 unless the user explicitly asks to render/export. Drive animation only with `useCurrentFrame()` + `interpolate()`/`spring()`; no CSS transitions/animations or Tailwind `transition-*`/`animate-*`. Keep assets in `public/` with `staticFile()`. Install packages via `remotion add` so versions match. See `official-skills.md`.

## Combining with JAL

- JAL stack law: Bun runtime, TypeScript, React, Hono. Remotion fits as a workspace package (`packages/video` or `apps/video`) with its own `bun run dev`. The site embeds a Player; the Studio is a dev tool.
- Docker/Coolify: only needed if Brian approves server-side rendering; see `rendering-and-output.md`.
- JEV decides density and design-system usage inside a comp (JEV picks density only, never a system).

From:
- https://www.remotion.dev/docs/
- https://www.remotion.dev/docs/the-fundamentals
- https://www.remotion.dev/docs/bun
- https://www.remotion.dev/docs/deno
- https://www.remotion.dev/docs/react-native
- https://www.remotion.dev/docs/brownfield
- https://www.remotion.dev/docs/preview
- https://www.remotion.dev/docs/react-18
- https://www.remotion.dev/docs/react-19
- https://www.remotion.dev/docs/javascript
- https://www.remotion.dev/docs/upgrading
- https://www.remotion.dev/docs/version
- https://www.remotion.dev/docs/version-mismatch
- https://www.remotion.dev/docs/eslint-config
- https://www.remotion.dev/docs/eslint-plugin
- https://www.remotion.dev/docs/authoring-packages
