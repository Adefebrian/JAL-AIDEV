# Noise, light leaks and starburst

From:
- https://www.remotion.dev/docs/light-leaks
- https://www.remotion.dev/docs/light-leaks/api
- https://www.remotion.dev/docs/light-leaks/light-leak
- https://www.remotion.dev/docs/light-leaks/light-leak-effect
- https://www.remotion.dev/docs/noise/
- https://www.remotion.dev/docs/noise/noise-2d
- https://www.remotion.dev/docs/noise/noise-3d
- https://www.remotion.dev/docs/noise/noise-4d
- https://www.remotion.dev/docs/starburst
- https://www.remotion.dev/docs/starburst/api
- https://www.remotion.dev/docs/starburst/starburst
- https://www.remotion.dev/docs/starburst/starburst-effect

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

- `@remotion/noise` (3.2.32): `noise2D(seed, x, y)`, `noise3D(seed, x, y, z)`, `noise4D(seed, x, y, z, w)`. Same seed and inputs always give the same value in -1 to 1. Safe across parallel render tabs.
- Light leak: the maintained version is the `lightLeak()` effect in `@remotion/effects` (4.0.500). It reveals in the first half of `progress` and retracts in the second half, `seed` shapes it, `hueShift` rotates it (0 is yellow-orange, 120 green, 240 blue). Use it as a `<TransitionSeries.Overlay>` on a cut; at the midpoint it hides the cut. The old `@remotion/light-leaks` package and `<LightLeak>` component are deprecated and will not be published from Remotion 5.0.
- Starburst: the maintained version is the `starburst()` effect (4.0.500): `rays` 2 to 100, 2 or more `colors`, `rotation`, `smoothness`, `origin`. It replaces pixels, so put it first or on a `<Solid>`. The old `@remotion/starburst` package and `<Starburst>` component (extra props `vignette`, `originOffsetX/Y`) are deprecated, same Remotion 5.0 cut-off.

## When a JAL agent uses it

- Noise: organic drift, wobble, parallax jitter, procedural backgrounds, camera shake. Never `Math.random()`.
- Light leak: warm film transition or accent in a brand film. Law: canvas-only. Pick `hueShift` away from the purple range.
- Starburst: retro ray burst for announcement or sale moments. Law: brief-only (retro, saturated); a calm brand film does not need it.
- Do not install the deprecated packages in new work. Existing projects migrate to the effect imports.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.noise.2d` | Seeded smooth 2D noise value from -1 to 1. | noise2D(seed, x, y) from @remotion/noise; deterministic, safe for frames; drift, wobble, organic offsets | T1 | live | F1 | fine |
| `rm.noise.3d` | Seeded 3D noise; third axis is time. | noise3D(seed, x, y, z); use frame for z to evolve a field smoothly | T1 | live | F1 | fine |
| `rm.noise.4d` | Seeded 4D noise; two extra axes (z, w) for time or looping fields. | noise4D(seed, x, y, z, w) | T1 | live | F1 | fine |
| `rm.lightleak.component` | Deprecated <LightLeak> component (WebGL). | @remotion/light-leaks is deprecated, not published from Remotion 5.0; use rm.fx.light-leak; LightLeak accepts Sequence props, seed, hueShift | T2 | pre | F1 | canvas-only |
| `rm.starburst.component` | Deprecated <Starburst> component (WebGL rays). | @remotion/starburst is deprecated, not published from Remotion 5.0; use rm.fx.starburst; props rays, colors, rotation, smoothness, vignette, originOffsetX/Y | T2 | pre | F1 | brief-only |
