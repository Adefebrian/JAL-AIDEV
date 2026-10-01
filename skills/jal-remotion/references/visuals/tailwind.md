# Tailwind in Remotion

From:
- https://www.remotion.dev/docs/tailwind
- https://www.remotion.dev/docs/tailwind-v4/enable-tailwind
- https://www.remotion.dev/docs/tailwind-v4/overview
- https://www.remotion.dev/docs/tailwind/enable-tailwind
- https://www.remotion.dev/docs/tailwind/tailwind

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

Remotion supports Tailwind CSS v4 through `@remotion/tailwind-v4` (4.0.256) and v3 through `@remotion/tailwind` (3.3.95). Both give an `enableTailwind()` function for the bundler: `Config.overrideBundlerConfig((c) => enableTailwind(c))`. Also add it to the `bundle()` Node.js API if you use it. Scaffold with `npx create-video@latest` and pick a Tailwind template, or add it by hand: install `@remotion/tailwind-v4 tailwindcss`, create `src/index.css` with the Tailwind import, import it in `src/Root.tsx`, and make sure `package.json` does not declare `"sideEffects": false` (use `["*.css"]` if it does). v3 takes an optional `configLocation` (4.0.187+) because Remotion resolves files relative to the Remotion root.

## When a JAL agent uses it

Only inside a Remotion video project and only when the brief or the source Element already uses Tailwind classes. JAL websites use the JAL Core tokens, not Tailwind utilities, so do not carry Tailwind into the site. For new video work prefer plain React with the JAL tokens as a small theme object; the Remotion Elements are mostly inline style anyway. Decided by the lead (2026-10-01), from the v0.4.0 Tailwind approval: Tailwind v4 is allowed in a video workspace through `@remotion/tailwind-v4` only when the brief or a copied Element already uses it, wired to the JAL `@theme`; a composition that a website Player shows uses the site's own `bun-plugin-tailwind` setup or inline token styles; the default stays plain React with the JAL token theme object.

## Rules that bite

- Use v4 for new work. v3 only to keep an old project alive.
- Utility classes that create gradients, shadows or glow are still banned on page chrome; inside video frames natural shading is fine.
- Arbitrary values keep video layout in pixels; do not rely on responsive breakpoints in a fixed-size composition.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.style.tailwind-v4` | Tailwind CSS v4 inside a Remotion video project. | @remotion/tailwind-v4 + tailwindcss; Config.overrideBundlerConfig(enableTailwind) (4.0.256+), also in bundle() API; src/index.css with the tailwind import, import it in Root.tsx; package.json sideEffects must include *.css; `npx create-video` templates scaffold it | T1 | video | S | fine |
| `rm.style.tailwind-v3` | Tailwind CSS v3 (legacy) in a Remotion video project. | @remotion/tailwind enableTailwind (3.3.95+), optional configLocation (4.0.187+); prefer v4 for new work | T1 | video | S | fine |
