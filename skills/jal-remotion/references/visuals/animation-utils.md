# Animation utils (@remotion/animation-utils)

From:
- https://www.remotion.dev/docs/animation-utils/
- https://www.remotion.dev/docs/animation-utils/interpolate-styles
- https://www.remotion.dev/docs/animation-utils/make-transform

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

Helpers for animating CSS style objects (4.0.92): `interpolateStyles()` interpolates whole style objects across a range with `interpolate()` options (extrapolation, easing including one per segment, posterize), and `makeTransform()` composes a typed list of CSS transform functions into one string (rotate, scale, skew, translate, perspective, matrix, and the 3D forms).

## When a JAL agent uses it

Any scene where one element animates several CSS properties (color, size, transform) together, or a 3D tilt needs readable code. It keeps keyframes in one table, which suits the Studio editor.

## Rules that bite

- `inputRange` and `outputStylesRange` need the same length and at least 2 values.
- The usual client-side rendering limits on supported CSS properties still apply.
- Style output must stay inside JAL law on pages: no gradients, no shadows, no glow. In video frames, natural shading is fine.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.anim.interpolate-styles` | Interpolate whole style objects (colors, transforms, sizes) over a frame range. | interpolateStyles(input, inputRange, outputStylesRange, options?) from @remotion/animation-utils; same options as interpolate() incl. per-segment easing array; ranges must be the same length (4.0.92+) | T1 | live | F1 | fine |
| `rm.anim.make-transform` | Compose a CSS transform string from typed functions. | makeTransform([rotate(), translateX(), scale3d(), perspective(), ...]) covers matrix, matrix3d, perspective, rotate/rotate3d/X/Y/Z, scale/scale3d/X/Y/Z, skew/X/Y, translate/translate3d/X/Y/Z | T1 | live | F1 | fine |
