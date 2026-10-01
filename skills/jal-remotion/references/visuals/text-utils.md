# Text utilities, rounded boxes and hand-drawn annotations

From:
- https://www.remotion.dev/docs/layout-utils/
- https://www.remotion.dev/docs/layout-utils/best-practices
- https://www.remotion.dev/docs/layout-utils/debug
- https://www.remotion.dev/docs/layout-utils/fill-text-box
- https://www.remotion.dev/docs/layout-utils/fit-text
- https://www.remotion.dev/docs/layout-utils/fit-text-on-n-lines
- https://www.remotion.dev/docs/layout-utils/measure-text
- https://www.remotion.dev/docs/rough-notation/api
- https://www.remotion.dev/docs/rough-notation/box
- https://www.remotion.dev/docs/rough-notation/bracket
- https://www.remotion.dev/docs/rough-notation/circle
- https://www.remotion.dev/docs/rough-notation/crossed-off
- https://www.remotion.dev/docs/rough-notation/highlight
- https://www.remotion.dev/docs/rough-notation/strike-through
- https://www.remotion.dev/docs/rough-notation/underline
- https://www.remotion.dev/docs/rounded-text-box/
- https://www.remotion.dev/docs/rounded-text-box/create-rounded-text-box

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

- `@remotion/layout-utils` (4.0.50): `measureText()`, `fitText()`, `fitTextOnNLines()`, `fillTextBox()`. They measure in the browser (not Node or Bun) and cache results. The page `docs/layout-utils/debug` returns 404 on the site; `best-practices` was read.
- `@remotion/rounded-text-box` (4.0.360): `createRoundedTextBox()` returns an SVG path (`d`), `boundingBox` and `instructions` for a TikTok-style multi-line box with rounded corners.
- `@remotion/rough-notation` (4.0.490): animated hand-drawn `<Highlight>`, `<Underline>`, `<Circle>`, `<Box>`, `<Bracket>`, `<CrossedOff>`, `<StrikeThrough>` around any child. Every component has `progress` (0 to 1), `seed`, `color`, `roughness`, `maxRandomnessOffset`, `disabled`, `style`.

## When a JAL agent uses it

- Fit a headline into a safe area without guessing font sizes; build captions; draw attention to a word in an explainer.
- Rounded boxes are a caption style, not page chrome. Rough-notation strokes are flat and solid, so they meet the no-gradient, no-shadow law; hand-drawn marker is an editorial style, so JEV decides whether it fits a tidy brand.

## Rules that bite

- Measure only after the font is loaded (wait for `waitUntilDone()` or mount children behind a font-ready wrapper). `validateFontIsLoaded` defaults to true in Remotion 5.0.
- Match every font property in the measurement and in the real element: family, size, weight, letterSpacing, fontVariantNumeric, textTransform.
- Use `outline`, not `border` or `padding`, around measured words. Add `display: inline-block; white-space: pre` to the real markup to match.
- In server-rendered React, call the measure functions inside `useEffect`.
- The JAL font default is Geist Sans and Geist Mono (self-hosted OFL). Measurements must use the same loaded family, not a fallback.
- Annotation `seed` changing every frame makes the stroke boil; keep it constant for a calm look. Put a `<Highlight>` behind the text.
- Reduced motion for a site: freeze `progress` at 1 (annotation fully drawn) or show the final frame as a still.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.text.fit` | One line of text sized to fit a width. | fitText({text, withinWidth, fontFamily, fontWeight?, letterSpacing?, fontVariantNumeric?, textTransform?, validateFontIsLoaded?}) returns fontSize; font must be loaded first; browser only; @remotion/layout-utils | T1 | live | S | fine |
| `rm.text.fit-n-lines` | Headline that wraps over at most N lines at the biggest size that fits. | fitTextOnNLines({text, maxBoxWidth, maxLines, fontFamily, ...}) returns fontSize and the lines array (4.0.313+); @remotion/layout-utils | T1 | live | S | fine |
| `rm.text.measure` | Width and height of a string for layout. | measureText({text, fontFamily, fontSize, fontWeight, letterSpacing, ...}) returns width, height; cached; browser only; @remotion/layout-utils | T1 | live | S | fine |
| `rm.text.fill-box` | Word-by-word fill of a text box with max width and lines. | fillTextBox({maxBoxWidth, maxLines}).add(...) returns exceedsBox and newLine; @remotion/layout-utils | T1 | live | S | fine |
| `rm.text.font-ready` | Rules that make measurement correct. | wait for the font (waitUntilDone or a higher-order component), match every font property (family, size, weight, letterSpacing, fontVariantNumeric), use outline not border or padding, add display inline-block and white-space pre, measure inside useEffect for SSR, validateFontIsLoaded defaults to true in Remotion 5.0 | T1 | live | S | fine |
| `rm.text.rounded-box` | TikTok and Instagram style multi-line text box with rounded corners as one SVG path. | createRoundedTextBox({textMeasurements, textAlign, horizontalPadding, borderRadius}) returns d, boundingBox, instructions; feed it from measureText()/fitTextOnNLines(); @remotion/rounded-text-box (4.0.360+) | T1 | live | S | fine |
| `rm.annotate.common` | Shared controls of every hand-drawn annotation. | progress 0 to 1 (animate it), seed (change per frame to boil), color (default currentColor), roughness (3 for Highlight, 1.5 others), maxRandomnessOffset, disabled, style; wraps children text or element; @remotion/rough-notation (4.0.490+) | T1 | live | F1 | fine |
| `rm.annotate.highlight` | Marker highlight drawn behind text. | <Highlight iterations? 2 padding? rtl?>; put behind the text; @remotion/rough-notation | T1 | live | F1 | fine |
| `rm.annotate.underline` | Hand-drawn underline. | <Underline strokeWidth? 20 iterations? 2 padding.top rtl?>; @remotion/rough-notation | T1 | live | F1 | fine |
| `rm.annotate.circle` | Hand-drawn circle around text or element. | <Circle strokeWidth? 20 iterations? 2 padding box? around/inside curveFitting curveTightness curveStepCount>; @remotion/rough-notation | T1 | live | F1 | fine |
| `rm.annotate.box` | Hand-drawn box around text or element. | <Box strokeWidth? 7 iterations? 2 padding>; @remotion/rough-notation | T1 | live | F1 | fine |
| `rm.annotate.bracket` | Hand-drawn brackets on any side. | <Bracket strokeWidth? 20 bracketLeft bracketRight(default) bracketTop bracketBottom padding>; @remotion/rough-notation | T1 | live | F1 | fine |
| `rm.annotate.crossed-off` | Two crossing strokes over text. | <CrossedOff strokeWidth? 20 iterations? 1 rtl?>; @remotion/rough-notation | T1 | live | F1 | fine |
| `rm.annotate.strike-through` | Hand-drawn line through text. | <StrikeThrough strokeWidth? 20 iterations? 1 rtl?>; @remotion/rough-notation | T1 | live | F1 | fine |
