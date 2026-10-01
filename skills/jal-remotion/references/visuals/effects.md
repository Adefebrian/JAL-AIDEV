# Effects (@remotion/effects)

From:
- https://www.remotion.dev/docs/effects
- https://www.remotion.dev/docs/effects/api
- https://www.remotion.dev/docs/effects/barrel-distortion
- https://www.remotion.dev/docs/effects/blur
- https://www.remotion.dev/docs/effects/brightness
- https://www.remotion.dev/docs/effects/burlap
- https://www.remotion.dev/docs/effects/checkerboard
- https://www.remotion.dev/docs/effects/chromatic-aberration
- https://www.remotion.dev/docs/effects/color-correction
- https://www.remotion.dev/docs/effects/color-key
- https://www.remotion.dev/docs/effects/contour-lines
- https://www.remotion.dev/docs/effects/contrast
- https://www.remotion.dev/docs/effects/corner-pin
- https://www.remotion.dev/docs/effects/dot-grid
- https://www.remotion.dev/docs/effects/drop-shadow
- https://www.remotion.dev/docs/effects/duotone
- https://www.remotion.dev/docs/effects/emboss
- https://www.remotion.dev/docs/effects/evolve
- https://www.remotion.dev/docs/effects/exposure
- https://www.remotion.dev/docs/effects/fisheye
- https://www.remotion.dev/docs/effects/flannel
- https://www.remotion.dev/docs/effects/glow
- https://www.remotion.dev/docs/effects/grayscale
- https://www.remotion.dev/docs/effects/gridlines
- https://www.remotion.dev/docs/effects/halftone
- https://www.remotion.dev/docs/effects/halftone-linear-gradient
- https://www.remotion.dev/docs/effects/hue
- https://www.remotion.dev/docs/effects/invert
- https://www.remotion.dev/docs/effects/levels
- https://www.remotion.dev/docs/effects/light-leak
- https://www.remotion.dev/docs/effects/light-trail
- https://www.remotion.dev/docs/effects/linear-gradient
- https://www.remotion.dev/docs/effects/linear-gradient-tint
- https://www.remotion.dev/docs/effects/linear-progressive-blur
- https://www.remotion.dev/docs/effects/linear-progressive-pixelate
- https://www.remotion.dev/docs/effects/lines
- https://www.remotion.dev/docs/effects/liquid-contours
- https://www.remotion.dev/docs/effects/lut
- https://www.remotion.dev/docs/effects/mirror
- https://www.remotion.dev/docs/effects/noise
- https://www.remotion.dev/docs/effects/noise-displacement
- https://www.remotion.dev/docs/effects/outline
- https://www.remotion.dev/docs/effects/paper
- https://www.remotion.dev/docs/effects/pattern
- https://www.remotion.dev/docs/effects/pixel-dissolve
- https://www.remotion.dev/docs/effects/pixelate
- https://www.remotion.dev/docs/effects/radial-progressive-blur
- https://www.remotion.dev/docs/effects/radial-progressive-pixelate
- https://www.remotion.dev/docs/effects/region-blur
- https://www.remotion.dev/docs/effects/rings
- https://www.remotion.dev/docs/effects/roughen-edges
- https://www.remotion.dev/docs/effects/saturation
- https://www.remotion.dev/docs/effects/scale
- https://www.remotion.dev/docs/effects/scanlines
- https://www.remotion.dev/docs/effects/shadows-highlights
- https://www.remotion.dev/docs/effects/shine
- https://www.remotion.dev/docs/effects/shrinkwrap
- https://www.remotion.dev/docs/effects/skew
- https://www.remotion.dev/docs/effects/speckle
- https://www.remotion.dev/docs/effects/starburst
- https://www.remotion.dev/docs/effects/tear
- https://www.remotion.dev/docs/effects/thermal-vision
- https://www.remotion.dev/docs/effects/tile
- https://www.remotion.dev/docs/effects/tint
- https://www.remotion.dev/docs/effects/tv-signal-off
- https://www.remotion.dev/docs/effects/uv-translate
- https://www.remotion.dev/docs/effects/venetian-blinds
- https://www.remotion.dev/docs/effects/vibrance
- https://www.remotion.dev/docs/effects/vignette
- https://www.remotion.dev/docs/effects/wave
- https://www.remotion.dev/docs/effects/waves
- https://www.remotion.dev/docs/effects/white-balance
- https://www.remotion.dev/docs/effects/white-noise
- https://www.remotion.dev/docs/effects/xy-translate
- https://www.remotion.dev/docs/effects/zigzag
- https://www.remotion.dev/docs/effects/zoom-blur

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

Effects manipulate the pixels of canvas-based components. You pass an array to the `effects` prop and the effects run in array order (multipass). One import per effect, kebab-case path: `import {glow} from '@remotion/effects/glow'`. Install with `npx remotion add @remotion/effects` (package tag 4.0.464).

Components that take `effects`: `<Solid>`, `<HtmlInCanvas>`, `<Video>`, `<Img>`, `<CanvasImage>`, `<AnimatedImage>`, `<Gif>`, `<RemotionRiveCanvas>`, and every `@remotion/shapes` component (`Rect`, `Circle`, `Triangle`, `Star`, `Ellipse`, `Pie`, `Polygon`, `Heart`, `Arrow`). Plain DOM content is not a canvas: wrap it in `<HtmlInCanvas>` (experimental; preview needs Chrome with `chrome://flags/#canvas-draw-element`, rendering needs no flag).

Three ways to use them: in code, interactively in Remotion Studio (drag an effect from the table of contents onto the element), or by asking an agent that has the Remotion skills.

## When a JAL agent uses it

- Look work on a video or brand film: grade, grain, focus pull, redaction, backgrounds, reveals.
- Never to dress up page chrome. On a JAL website an effect lives only on scene content inside a composition (a 3D scene, footage, a rendered image), under the canvas exemption JEV grants per composition; the composition's text, UI, and captions keep full page law. Gradient, shadow, glow and neon effects are not allowed on cards, buttons or sections.
- JEV picks per case. Effects here are supplements to the main Remotion motion core, not a replacement for scene timing.

## Rules that bite

- Effects never animate on their own. Drive parameters with `useCurrentFrame()` and `interpolate()`, written inline so the Studio can edit the keyframes.
- Every effect has `disabled?`. Use it for A/B passes and for the reduced-motion render.
- Most effects use a WebGL2 backend. Check the WebGL and WebGPU rendering notes (`../core/visuals-and-3d.md`, and `../rendering/troubleshooting.md` for the `--gl=angle` setting on server paths) for the Chromium GL setting, test renders on the real render machine, and test on the target device. For a website, ship a pre-rendered video unless a live Player has been tested on the target browsers.
- Replace-type effects (`linearGradient`, `starburst`, `liquidContours`) overwrite the source pixels; `flannel` generates its pattern on a `<Solid>`; `whiteNoise` can replace or blend. Put these first in the chain or on a `<Solid>`.
- Mask-respecting effects keep transparent regions transparent (`noise`, `scanlines`, `tint`, `duotone`, `vignette`, `burlap`, `paper`).
- Colour order for a manual grade: brightness, contrast, saturation, hue. Prefer `colorCorrection()` (one pass, fixed order, no intermediate canvases) over a long chain.
- Defaults are not on-brand (red/black `liquidContours`, red plaid `flannel`, red/yellow burns). Always set colors from the project tokens; never use purple.
- `createEffect()` builds a custom effect for 2D canvas, WebGL2 or WebGPU (see `rm.fx.custom-effect`).

## Families for JEV

- Grade: brightness, contrast, exposure, levels, saturation, vibrance, hue, whiteBalance, shadowsHighlights, colorCorrection, lut, tint, duotone, grayscale, invert.
- Focus and privacy: blur, linearProgressiveBlur, radialProgressiveBlur, regionBlur, pixelate, linearProgressivePixelate, radialProgressivePixelate, zoomBlur.
- Geometry: scale, skew, xyTranslate, uvTranslate, cornerPin, mirror, tile, pattern, fisheye, barrelDistortion, wave, noiseDisplacement.
- Reveals: evolve, venetianBlinds, pixelDissolve, tear.
- Backgrounds and patterns: lines, waves, zigzag, rings, checkerboard, dotGrid, gridlines, contourLines, liquidContours, paper, burlap, flannel, halftone, halftoneLinearGradient, starburst.
- Light: glow, lightTrail, lightLeak, shine, vignette, dropShadow, outline, linearGradient, linearGradientTint.
- Texture and grit: noise, whiteNoise, speckle, roughenEdges, emboss, shrinkwrap.
- Retro and glitch: scanlines, tvSignalOff, thermalVision, chromaticAberration.
- Utility: colorKey (greenscreen).

## Candidate bundles

- Clean product grade: `colorCorrection` then a light `vignette` (rm.fx.color-correction, rm.fx.vignette).
- Focus pull on a screenshot: `linearProgressiveBlur` animated from blurred to sharp.
- Redact a face or plate: `regionBlur` with `feather` and `roundness`.
- Sticker or cutout: `outline` plus `roughenEdges` on a transparent logo.
- Seamless motion background: `waves`, `zigzag` or `liquidContours` on a `<Solid>` with a loop-safe `offset`.
- Premium sweep on a badge or title: `scale(0.75)` then `shine` inside `<HtmlInCanvas>` (this is what the Shine element does).

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.fx.barrel-distortion` | Bends the layer outward like a convex lens. | barrelDistortion() from @remotion/effects/barrel-distortion; amount 0 to 1 (default 0.25); geometry only, no scanlines or color change | T2 | pre | S | fine |
| `rm.fx.blur` | Gaussian blur on a layer. | blur() from @remotion/effects/blur; radius in px; horizontal and vertical flags make a one-axis directional blur | T2 | pre | F1 | fine |
| `rm.fx.brightness` | Lifts or lowers brightness. | brightness() from @remotion/effects/brightness; amount -1 to 1; order brightness, contrast, saturation, hue | T2 | pre | S | fine |
| `rm.fx.burlap` | Woven burlap texture over the layer, alpha kept. | burlap() from @remotion/effects/burlap; amount, size, roughness, seed, color; static texture | T2 | pre | S | canvas-only |
| `rm.fx.checkerboard` | Repeating checkerboard pattern over or behind content. | checkerboard() from @remotion/effects/checkerboard; colors (2 or more, cyclic), cellSize, gap, angle, offsetX and offsetY; same controls as lines() | T2 | pre | S | fine |
| `rm.fx.chromatic-aberration` | RGB channel split, lens fringe or glitch look. | chromaticAberration() from @remotion/effects/chromatic-aberration; amount in px (default 8), angle; keep amount low for a lens look | T2 | pre | F1 | brief-only |
| `rm.fx.color-correction` | Primary grade in one pass: exposure, white balance, shadows, highlights, contrast, saturation, vibrance. | colorCorrection() from @remotion/effects/color-correction; one WebGL pass, fixed operation order, avoids the intermediate canvases of a chained grade; prefer it to stacking six effects | T2 | pre | S | fine |
| `rm.fx.color-key` | Chroma key: turns pixels near a key color transparent. | colorKey() from @remotion/effects/color-key; keyColor, similarity, smoothness, spillSuppression; for greenscreen video | T2 | pre | S | fine |
| `rm.fx.contour-lines` | Topographic contour line overlay. | contourLines() from @remotion/effects/contour-lines; lineColor, lineWidth, spacing, scale, offsets; animate offsets to move the terrain | T2 | pre | F1 | fine |
| `rm.fx.contrast` | Contrast multiplier around mid gray. | contrast() from @remotion/effects/contrast; amount 0 and up (1 is neutral); not commutative with brightness | T2 | pre | S | fine |
| `rm.fx.corner-pin` | Pins a layer into a four-corner quad (screen replacement, perspective). | cornerPin() from @remotion/effects/corner-pin; topLeft, topRight, bottomRight, bottomLeft as UV pairs | T2 | pre | F1 | fine |
| `rm.fx.dot-grid` | Dot mask: the layer shows only through a grid of circles. | dotGrid() from @remotion/effects/dot-grid; dotSize, gridSize, invert | T2 | pre | S | fine |
| `rm.fx.drop-shadow` | Blurred shadow behind a transparent cutout. | dropShadow() from @remotion/effects/drop-shadow; radius, offsetX, offsetY, opacity, color | T2 | pre | S | canvas-only |
| `rm.fx.duotone` | Maps luminance to two brand colors. | duotone() from @remotion/effects/duotone; darkColor, lightColor, threshold; alpha preserved; pick non-purple brand colors | T2 | pre | S | fine |
| `rm.fx.emboss` | Raised-line relief texture. | emboss() from @remotion/effects/emboss; amount, size, lineWidth, depth, angle | T2 | pre | S | canvas-only |
| `rm.fx.evolve` | Directional soft-edge reveal (wipe in or out). | evolve() from @remotion/effects/evolve; progress 0 to 1, direction left/right/top/bottom, feather; drive progress with interpolate() | T2 | pre | F1 | fine |
| `rm.fx.exposure` | Exposure in photographic stops, linear light. | exposure() from @remotion/effects/exposure; stops -5 to 5; multiplies light, unlike brightness which adds | T2 | pre | S | fine |
| `rm.fx.fisheye` | Ultra-wide lens warp, center magnified. | fisheye() from @remotion/effects/fisheye; fieldOfView radians, center, radius, zoom | T2 | pre | S | canvas-only |
| `rm.fx.flannel` | Plaid woven-fabric pattern generated on a Solid. | flannel() from @remotion/effects/flannel; amount, size, softness, baseColor, stripeColor (defaults are red and dark, not on-brand) | T2 | pre | S | brief-only |
| `rm.fx.glow` | Soft halo around bright parts, element looks like it emits light. | glow() from @remotion/effects/glow; radius, intensity, threshold, color; subtle bloom on natural highlights only unless the brief is neon | T2 | pre | S | brief-only |
| `rm.fx.grayscale` | Black and white pass with controllable mix. | grayscale() from @remotion/effects/grayscale; amount 0 to 1 | T2 | pre | S | fine |
| `rm.fx.gridlines` | Technical grid overlay, can tilt in 3D (rotationX). | gridlines() from @remotion/effects/gridlines; gridSize, lineWidth, lineColor, backgroundColor, rotation, rotationX | T2 | pre | S | fine |
| `rm.fx.halftone` | Luminance to printed dots, squares or lines. | halftone() from @remotion/effects/halftone; shape circle/square/line, dotSize, dotSpacing, rotation | T2 | pre | S | canvas-only |
| `rm.fx.halftone-linear-gradient` | Dot size changes across a gradient axis, a dot-pattern wipe. | halftoneLinearGradient() from @remotion/effects/halftone-linear-gradient; firstStopDotSize, secondStopDotSize, stop positions as UV | T2 | pre | F1 | canvas-only |
| `rm.fx.hue` | Rotates hue in degrees. | hue() from @remotion/effects/hue; degrees; keep result away from purple | T2 | pre | S | fine |
| `rm.fx.invert` | Negative or x-ray look. | invert() from @remotion/effects/invert; amount 0 to 1 | T2 | pre | S | fine |
| `rm.fx.levels` | Black point, white point and midtone gamma. | levels() from @remotion/effects/levels; blackPoint, whitePoint, gamma 0.01 to 10 | T2 | pre | S | fine |
| `rm.fx.light-leak` | Warm film light leak that reveals then retracts, hides cuts. | lightLeak() from @remotion/effects/light-leak; seed, hueShift 0 to 360 (0 is yellow-orange), progress 0 to 1 (animate it); with TransitionSeries.Overlay at a cut; avoid hueShift in the purple range | T2 | pre | F1 | canvas-only |
| `rm.fx.light-trail` | Directional light streak from bright or opaque areas. | lightTrail() from @remotion/effects/light-trail; direction, distance, intensity, decay, threshold | T2 | pre | F1 | brief-only |
| `rm.fx.linear-gradient` | Two-stop linear gradient that replaces the pixels. | linearGradient() from @remotion/effects/linear-gradient; start and end UV, startColor, endColor; use inside video frames only, never as page chrome | T2 | pre | S | canvas-only |
| `rm.fx.linear-gradient-tint` | Tint whose color changes along a gradient axis, alpha respected. | linearGradientTint() from @remotion/effects/linear-gradient-tint; start, end, startColor, endColor | T2 | pre | S | canvas-only |
| `rm.fx.linear-progressive-blur` | Blur radius varies along an axis: focus pull, depth of field, soft edge. | linearProgressiveBlur() from @remotion/effects/linear-progressive-blur; start, end, startBlur, endBlur | T2 | pre | F1 | fine |
| `rm.fx.linear-progressive-pixelate` | Pixel block size varies along an axis. | linearProgressivePixelate() from @remotion/effects/linear-progressive-pixelate; start, end, startBlockSize, endBlockSize | T2 | pre | F1 | fine |
| `rm.fx.lines` | Alternating stripes over or behind content. | lines() from @remotion/effects/lines; colors, direction, thickness, gap, angle, offset; animate offset for movement | T2 | pre | S | fine |
| `rm.fx.liquid-contours` | Flowing two-color liquid contour background on a Solid. | liquidContours() from @remotion/effects/liquid-contours; firstColor, secondColor, spacing, scale, complexity, smoothness, seed; defaults are red and black, set brand colors | T2 | pre | F1 | fine |
| `rm.fx.lut` | Applies a 3D .cube color lookup table. | lut() from @remotion/effects/lut; content is the .cube text, size 2 to 256; 1D LUTs not supported | T2 | pre | S | fine |
| `rm.fx.mirror` | Mirrors the layer around an axis. | mirror() from @remotion/effects/mirror; direction, position, invert | T2 | pre | S | fine |
| `rm.fx.noise` | Subtle procedural film grain, alpha kept. | noise() from @remotion/effects/noise; amount (default 0.15), seed, premultiply; change seed per frame for living grain | T2 | pre | S | canvas-only |
| `rm.fx.noise-displacement` | Noise warp inside a circular region only. | noiseDisplacement() from @remotion/effects/noise-displacement; center, radius, strength, seed, grainSize, passes, feather | T2 | pre | F1 | canvas-only |
| `rm.fx.outline` | Solid outline around non-transparent pixels, sticker look. | outline() from @remotion/effects/outline; width, color, opacity, outlineOnly, edgeSimplification | T2 | pre | S | fine |
| `rm.fx.paper` | Procedural paper texture: grain, fibers, crumples, folds, speckles. | paper() from @remotion/effects/paper; colorFront, colorBack, contrast, roughness, fiber, crumples, folds; based on the open-source Paper Shaders texture | T2 | pre | S | canvas-only |
| `rm.fx.pattern` | Tiles scaled copies of a source: wallpaper, contact sheet, brick layout. | pattern() from @remotion/effects/pattern; scale, crop, gap, offsets, row and column offset | T2 | pre | S | fine |
| `rm.fx.pixel-dissolve` | Grid cells fade out in random order, a mosaic dissolve. | pixelDissolve() from @remotion/effects/pixel-dissolve; progress, columns, rows, seed, feather | T2 | pre | F1 | fine |
| `rm.fx.pixelate` | Mosaic or censor blocks. | pixelate() from @remotion/effects/pixelate; blockSize px | T2 | pre | S | fine |
| `rm.fx.radial-progressive-blur` | Blur grows from a center ellipse to the edge: spotlight focus. | radialProgressiveBlur() from @remotion/effects/radial-progressive-blur; center, width, height, rotation, start, startBlur, endBlur | T2 | pre | F1 | fine |
| `rm.fx.radial-progressive-pixelate` | Pixel size grows from the center to the edge. | radialProgressivePixelate() from @remotion/effects/radial-progressive-pixelate; center, width, height, startBlockSize, endBlockSize | T2 | pre | F1 | fine |
| `rm.fx.region-blur` | Blur only a rectangle or rounded box, for faces, plates, documents. | regionBlur() from @remotion/effects/region-blur; topLeft, bottomRight, blurRadius, feather, roundness; privacy redaction | T2 | pre | S | fine |
| `rm.fx.rings` | Concentric colored bands from a center. | rings() from @remotion/effects/rings; colors, center, thickness, gap, offset | T2 | pre | S | fine |
| `rm.fx.roughen-edges` | Rough paper-torn alpha edge on cutouts, logos, text. | roughenEdges() from @remotion/effects/roughen-edges; amount, border, scale, seed; Paper Shaders noise | T2 | pre | S | canvas-only |
| `rm.fx.saturation` | Scales color intensity. | saturation() from @remotion/effects/saturation; amount | T2 | pre | S | fine |
| `rm.fx.scale` | Scales a layer (horizontal and vertical flags). | scale() from @remotion/effects/scale; scale; place before tile() to expand a texture past its edges; used inside the Shine and Tear elements to leave room | T2 | pre | S | fine |
| `rm.fx.scanlines` | Additive horizontal scanlines, CRT look. | scanlines() from @remotion/effects/scanlines; amount, spacing, thickness, offset | T2 | pre | F1 | brief-only |
| `rm.fx.shadows-highlights` | Lift shadows and recover highlights independently. | shadowsHighlights() from @remotion/effects/shadows-highlights; shadows, highlights | T2 | pre | S | fine |
| `rm.fx.shine` | Glossy diagonal light sweep for stickers, badges, titles. | shine() from @remotion/effects/shine; progress, angle, haloSigma, coreSigma, haloIntensity, coreIntensity | T2 | pre | F1 | canvas-only |
| `rm.fx.shrinkwrap` | Plastic wrap: wrinkles, glossy highlights, small displacement. | shrinkwrap() from @remotion/effects/shrinkwrap; amount, displacement, highlightIntensity, wrinkleDensity, edgeTension, phase | T2 | pre | S | canvas-only |
| `rm.fx.skew` | Horizontal and vertical skew. | skew() from @remotion/effects/skew; x and y degrees, origin | T2 | pre | S | fine |
| `rm.fx.speckle` | Small random alpha holes, dust or pinpricks. | speckle() from @remotion/effects/speckle; density, size, randomness | T2 | pre | S | canvas-only |
| `rm.fx.starburst` | Retro ray pattern that replaces the pixels, usually the first effect on a Solid. | starburst() from @remotion/effects/starburst; rays 2 to 100, colors (2 or more), rotation, smoothness, origin; replaces the deprecated @remotion/starburst package | T2 | pre | F1 | brief-only |
| `rm.fx.tear` | Tears the layer along a zigzag seam, halves rotate away. | tear() from @remotion/effects/tear; progress, angle, rotation, jaggedness | T2 | pre | F1 | fine |
| `rm.fx.thermal-vision` | Luminance mapped to a heat-map ramp. | thermalVision() from @remotion/effects/thermal-vision; amount, palette | T2 | pre | S | brief-only |
| `rm.fx.tile` | Repeats the opaque area, alternate copies mirrored for seamless edges. | tile() from @remotion/effects/tile; horizontal, vertical; scale() first to expand | T2 | pre | S | fine |
| `rm.fx.tint` | Flat color tint, alpha mask respected. | tint() from @remotion/effects/tint; color, amount | T2 | pre | S | fine |
| `rm.fx.tv-signal-off` | Blends into TV color bars and calibration test pattern. | tvSignalOff() from @remotion/effects/tv-signal-off; amount | T2 | pre | F1 | brief-only |
| `rm.fx.uv-translate` | Moves a layer by normalized UV units. | uvTranslate() from @remotion/effects/uv-translate; u, v | T2 | pre | S | fine |
| `rm.fx.venetian-blinds` | Slatted reveal, vertical or horizontal blinds. | venetianBlinds() from @remotion/effects/venetian-blinds; progress, direction, slats | T2 | pre | F1 | fine |
| `rm.fx.vibrance` | Boosts muted colors more than saturated ones. | vibrance() from @remotion/effects/vibrance; amount | T2 | pre | S | fine |
| `rm.fx.vignette` | Darkens, colors or fades the edges. | vignette() from @remotion/effects/vignette; amount, radius, center, feather, roundness, color, mode | T2 | pre | S | canvas-only |
| `rm.fx.wave` | Sine-wave displacement of the layer. | wave() from @remotion/effects/wave; phase, direction, amplitude, wavelength; animate phase | T2 | pre | F1 | fine |
| `rm.fx.waves` | Repeating wavy color bands, seamless motion background. | waves() from @remotion/effects/waves; colors, direction, thickness, gap, angle, offset, amplitude, wavelength, phase | T2 | pre | F1 | fine |
| `rm.fx.white-balance` | Fixes temperature (blue to amber) and tint (green to magenta). | whiteBalance() from @remotion/effects/white-balance; temperature, tint | T2 | pre | S | fine |
| `rm.fx.white-noise` | Grayscale TV static replacing or blending the layer. | whiteNoise() from @remotion/effects/white-noise; amount, seed; for film grain use noise() instead | T2 | pre | F1 | brief-only |
| `rm.fx.xy-translate` | Moves a layer by absolute pixels. | xyTranslate() from @remotion/effects/xy-translate; x, y | T2 | pre | S | fine |
| `rm.fx.zigzag` | Repeating zigzag bands, seamless motion background. | zigzag() from @remotion/effects/zigzag; colors, direction, thickness, gap, angle, offset, amplitude, wavelength | T2 | pre | F1 | fine |
| `rm.fx.zoom-blur` | Radial zoom blur from a center point. | zoomBlur() from @remotion/effects/zoom-blur; amount, center, samples (default 24) | T2 | pre | F1 | fine |
| `rm.fx.chain` | Stack of effects applied in array order to canvas-based components (Solid, HtmlInCanvas, Video, Img, CanvasImage, AnimatedImage, Gif, Rive canvas, shapes). | `effects={[a(), b()]}` prop; each effect needs WebGL2 or Canvas2D backend; effects never animate alone, drive params from useCurrentFrame()/interpolate() kept inline so Studio can edit them; `disabled` skips an effect; DOM content needs HtmlInCanvas | T2 | pre | S | fine |
| `rm.fx.custom-effect` | Own effect factory for a look Remotion does not ship. | createEffect() from remotion (2D canvas, WebGL2 or WebGPU), returns a factory usable in any effects array; named on the effects pages, API not in this slice (API: `../core/visuals-and-3d.md`, custom effects) | T3 | pre | S | fine |
