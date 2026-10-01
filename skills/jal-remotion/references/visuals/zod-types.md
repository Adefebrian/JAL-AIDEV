# Zod types (@remotion/zod-types)

From:
- https://www.remotion.dev/docs/zod-types/
- https://www.remotion.dev/docs/zod-types/v3
- https://www.remotion.dev/docs/zod-types/z-color
- https://www.remotion.dev/docs/zod-types/z-matrix
- https://www.remotion.dev/docs/zod-types/z-textarea

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

Remotion-specific Zod types that turn props into Studio controls: `zColor()` (color picker and validation), `zTextarea()` (multi-line string; keep line breaks with `white-space: pre-line`), `zMatrix()` (square matrix as a flat array, 2x2 to 4x4, visual editor). Since 4.0.426 `@remotion/zod-types` is based on Zod v4; `@remotion/zod-types-v3` keeps Zod 3.22.3 working with the same three functions. Schema validation works in all environments; the visual editor exists only in Remotion Studio. Install: `npx remotion add @remotion/zod-types` (or `-v3`).

## When a JAL agent uses it

Every reusable composition that a person or JEV will tune: brand color, headline text, transform matrix. Pair with `rm.schema.*` and the props rules in `references/core/props-and-schemas.md`. Choose v4 types unless the project is pinned to Zod 3.

## Rules that bite

- Do not nest `zColor()` from `@remotion/zod-types` inside a Zod 3 schema; use the v3 package there.
- Defaults for color props must be JAL tokens (never purple).
- Reduced motion has no meaning here (static data types).

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.schema.zod-types` | Remotion-specific Zod types for editable props (Zod v4 since 4.0.426). | @remotion/zod-types: zColor, zTextarea, zMatrix; Studio shows a control for each | T1 | video | S | fine |
| `rm.schema.color` | Color prop with a color picker in the Studio. | zColor() inside z.object({color: zColor()}) | T1 | video | S | fine |
| `rm.schema.textarea` | Multi-line text prop. | zTextarea(); value is one string, show line breaks with white-space: pre-line | T1 | video | S | fine |
| `rm.schema.matrix` | Square matrix prop (2x2, 3x3, 4x4 as a flat array) with a visual editor. | zMatrix(); flat array of n squared numbers | T1 | video | S | fine |
| `rm.schema.v3-compat` | Same types for projects still on Zod 3.22.3. | @remotion/zod-types-v3 (4.0.426+) exports the same zColor, zTextarea, zMatrix | T1 | video | S | fine |
