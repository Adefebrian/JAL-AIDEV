# Visuals recipe index

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

Every `rm.<family>.<name>` recipe from the visuals slice in one table. JEV offers these as candidates; it picks per case. Remotion is the main core motion of JAL-AIDEV; other motion libraries (GSAP, Lenis, Framer Motion, CSS) are supplements.

From:
- https://www.remotion.dev/docs/effects
- https://www.remotion.dev/docs/transitions/
- https://www.remotion.dev/elements/
- https://www.remotion.dev/prompts/

## Taste law that applies to every row

- Page chrome (cards, buttons, sections, any DOM on a JAL site): no gradients, no shadows, no glow, no purple, no emoji, no em-dash, no eyebrow labels.
- Inside a composition: a composition (in a Player or as an MP4) follows full page law, and the canvas exemption (natural light and shade) covers scene content only: a 3D scene, footage, a rendered image inside the frame; JEV decides per composition (Brian, 2026-10-01). Text, UI, and captions keep full law. Still no neon, glow or purple unless the brief is a noyzzi-style piece.
- Used by: JEV `motion.remotion_recipe` (candidates from at least 3 families of this table, then layers) after `motion.engine` answers `remotion`; indexed by pointer in `skills/jal-design-system/references/recipe-index.md` section 1.19. Skill: `skills/jal-remotion/SKILL.md`.
- Fonts: Geist Sans and Geist Mono self-hosted (OFL) by default, pool via `scripts/assets/fonts.ts`. `@remotion/google-fonts` only in video renders, never on a JAL website.

## Legend

- Tier (cost): T1 DOM, SVG, CSS or pure math; cheap to render and to play. T2 WebGL2 or canvas effect on a Solid, image, video or shape. T3 HTML-in-canvas, multi-sample blur or audio analysis; heavier render, experimental browser support in preview. T4 3D scene, map tiles, Skia or a custom shader; heaviest, longest render, network or GPU needs.
- Web (website and mobile): `live` can play in a Remotion Player on any browser and on mobile; `pre` ship as a pre-rendered video (a live Player only after a device test of WebGL2); `video` rendered file only, never live on a site.
- Motion fallback (for `prefers-reduced-motion` on a page, and for stills): S static, nothing to remove; F1 freeze on the settled frame (or a still render of it); F2 hard cut or zero-length transition; F3 poster image, no autoplay, controls visible; F4 opacity crossfade of 200 ms or less.
- Law: `fine` breaks no JAL rule by itself; `canvas-only` only inside a canvas or video frame, never page chrome; `brief-only` only when the brief asks for that style (retro, glitch, neon, noyzzi) and JEV agrees.

## Counts

- `transitions.md`: 30
- `effects.md`: 76
- `shapes-paths.md`: 37
- `canvas-skia-three.md`: 8
- `noise-lightleaks-starburst.md`: 5
- `motion-blur.md`: 4
- `text-utils.md`: 14
- `animation-utils.md`: 2
- `fonts.md`: 10
- `tailwind.md`: 2
- `zod-types.md`: 5
- `elements.md`: 43
- `prompts.md`: 25
- Total: 261 recipes

## All recipes

| ID | Family file | Shows | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.anim.interpolate-styles` | animation-utils.md | Interpolate whole style objects (colors, transforms, sizes) over a frame range. | T1 | live | F1 | fine |
| `rm.anim.make-transform` | animation-utils.md | Compose a CSS transform string from typed functions. | T1 | live | F1 | fine |
| `rm.annotate.box` | text-utils.md | Hand-drawn box around text or element. | T1 | live | F1 | fine |
| `rm.annotate.bracket` | text-utils.md | Hand-drawn brackets on any side. | T1 | live | F1 | fine |
| `rm.annotate.circle` | text-utils.md | Hand-drawn circle around text or element. | T1 | live | F1 | fine |
| `rm.annotate.common` | text-utils.md | Shared controls of every hand-drawn annotation. | T1 | live | F1 | fine |
| `rm.annotate.crossed-off` | text-utils.md | Two crossing strokes over text. | T1 | live | F1 | fine |
| `rm.annotate.highlight` | text-utils.md | Marker highlight drawn behind text. | T1 | live | F1 | fine |
| `rm.annotate.strike-through` | text-utils.md | Hand-drawn line through text. | T1 | live | F1 | fine |
| `rm.annotate.underline` | text-utils.md | Hand-drawn underline. | T1 | live | F1 | fine |
| `rm.audio.mirrored-spectrum` | elements.md | Mirrored frequency bars, for music and speech. | T3 | video | F1 | fine |
| `rm.audio.oscilloscope` | elements.md | Waveform line that traces the voice, for speech. | T3 | video | F1 | fine |
| `rm.audio.waveform-progress` | elements.md | Voice-note style static waveform with playback progress. | T3 | video | F1 | fine |
| `rm.bg.liquid-contours` | elements.md | Flowing two-color liquid contour background. | T2 | pre | F1 | fine |
| `rm.bg.moving-waves` | elements.md | Seamless wave bands flowing upward. | T2 | pre | F1 | fine |
| `rm.bg.moving-zigzags` | elements.md | Seamless zigzag bands flowing upward. | T2 | pre | F1 | fine |
| `rm.bg.notebook-paper` | elements.md | White paper with faint blue grid lines. | T2 | pre | S | canvas-only |
| `rm.bg.paper-texture` | elements.md | Animated white paper texture. | T2 | pre | F1 | canvas-only |
| `rm.bg.rotating-starburst` | elements.md | Solid with a slowly rotating retro ray pattern. | T2 | pre | F1 | brief-only |
| `rm.blur.camera` | motion-blur.md | Film-like motion blur via layered blending, works without the flag. | T3 | pre | S | fine |
| `rm.blur.common-mistake` | motion-blur.md | Rule: useCurrentFrame() must sit inside the blurred component. | T1 | live | S | fine |
| `rm.blur.html-in-canvas` | motion-blur.md | Best-quality motion blur: samples are averaged inside HTML-in-canvas (4.0.529+). | T3 | video | S | fine |
| `rm.blur.trail` | motion-blur.md | Echo trail behind a moving object (not a real exposure). | T3 | pre | S | fine |
| `rm.caption.basic` | elements.md | Simple synchronized captions, white text on a translucent gray bar. | T1 | live | S | fine |
| `rm.caption.moving-pill` | elements.md | A pill that glides between the spoken words. | T1 | live | F1 | fine |
| `rm.caption.popping-word` | elements.md | Each spoken word pops into focus. | T1 | live | F1 | fine |
| `rm.caption.rounded` | elements.md | Multi-line captions in an SVG box with all corners rounded. | T1 | live | S | fine |
| `rm.caption.word-highlight` | elements.md | Highlights each word as it is spoken. | T1 | live | F1 | fine |
| `rm.commerce.rotating-cards` | elements.md | Three cards, each takes the center once. | T1 | live | F1 | canvas-only |
| `rm.commerce.shine` | elements.md | Diagonal shine sweep over any content. | T3 | video | F1 | canvas-only |
| `rm.commerce.tear` | elements.md | Content tears apart along a zigzag seam. | T3 | video | F1 | fine |
| `rm.commerce.wiggling-callout` | elements.md | Attention-grabbing wiggling speech bubble for a discount. | T1 | live | F1 | fine |
| `rm.data.horizontal-bar-chart` | elements.md | Bold bar card with three labeled bars. | T1 | live | F1 | fine |
| `rm.data.line-chart` | elements.md | Animated line chart with labeled trend. | T1 | live | F1 | fine |
| `rm.data.number-counter` | elements.md | Counts from a start to an end value. | T1 | live | F1 | fine |
| `rm.data.pie-chart` | elements.md | Pie chart with four labeled slices. | T1 | live | F1 | fine |
| `rm.data.vertical-bar-chart` | elements.md | Bold vertical bars, three labeled values. | T1 | live | F1 | fine |
| `rm.editor.canvas` | canvas-skia-three.md | Preview canvas and layer list for a Remotion authoring interface (experimental). | T3 | video | S | fine |
| `rm.editor.hover-selection` | canvas-skia-three.md | Synced hover and selection between canvas and layer rows. | T3 | video | S | fine |
| `rm.editor.keyframes` | canvas-skia-three.md | Keyframe markers, drag, easing editing on a custom timeline. | T3 | video | S | fine |
| `rm.el.author-guidelines` | elements.md | How to author and submit an Element: one focused technique, portable, own assets, in and out animation, Studio controls, preview poster. | T1 | video | S | fine |
| `rm.font.css-import` | fonts.md | Google Fonts through a CSS import. | T1 | video | S | fine |
| `rm.font.facefont-manual` | fonts.md | Manual FontFace loading with delayRender. | T1 | live | S | fine |
| `rm.font.google-from-info` | fonts.md | Load a Google font from metadata fetched on a server. | T1 | video | S | fine |
| `rm.font.google-info` | fonts.md | Metadata of one Google font. | T1 | video | S | fine |
| `rm.font.google-list` | fonts.md | List all fonts available in @remotion/google-fonts. | T1 | video | S | fine |
| `rm.font.google-load` | fonts.md | Type-safe Google font loading for video renders. | T1 | video | S | fine |
| `rm.font.google-variable` | fonts.md | Variable Google font, one file with weight range and axes (4.0.525+). | T1 | video | S | fine |
| `rm.font.google-variable-from-info` | fonts.md | Variable Google font loaded from server-side metadata (4.0.525+). | T1 | video | S | fine |
| `rm.font.local` | fonts.md | Self-hosted font file loaded into a composition (the JAL default path). | T1 | live | S | fine |
| `rm.font.svg-web-renderer` | fonts.md | Fonts inside SVG text for client-side rendering. | T2 | pre | S | fine |
| `rm.fx.barrel-distortion` | effects.md | Bends the layer outward like a convex lens. | T2 | pre | S | fine |
| `rm.fx.blur` | effects.md | Gaussian blur on a layer. | T2 | pre | F1 | fine |
| `rm.fx.brightness` | effects.md | Lifts or lowers brightness. | T2 | pre | S | fine |
| `rm.fx.burlap` | effects.md | Woven burlap texture over the layer, alpha kept. | T2 | pre | S | canvas-only |
| `rm.fx.chain` | effects.md | Stack of effects applied in array order to canvas-based components (Solid, HtmlInCanvas, Video, Img, CanvasImage, AnimatedImage, Gif, Rive canvas, shapes). | T2 | pre | S | fine |
| `rm.fx.checkerboard` | effects.md | Repeating checkerboard pattern over or behind content. | T2 | pre | S | fine |
| `rm.fx.chromatic-aberration` | effects.md | RGB channel split, lens fringe or glitch look. | T2 | pre | F1 | brief-only |
| `rm.fx.color-correction` | effects.md | Primary grade in one pass: exposure, white balance, shadows, highlights, contrast, saturation, vibrance. | T2 | pre | S | fine |
| `rm.fx.color-key` | effects.md | Chroma key: turns pixels near a key color transparent. | T2 | pre | S | fine |
| `rm.fx.contour-lines` | effects.md | Topographic contour line overlay. | T2 | pre | F1 | fine |
| `rm.fx.contrast` | effects.md | Contrast multiplier around mid gray. | T2 | pre | S | fine |
| `rm.fx.corner-pin` | effects.md | Pins a layer into a four-corner quad (screen replacement, perspective). | T2 | pre | F1 | fine |
| `rm.fx.custom-effect` | effects.md | Own effect factory for a look Remotion does not ship. | T3 | pre | S | fine |
| `rm.fx.dot-grid` | effects.md | Dot mask: the layer shows only through a grid of circles. | T2 | pre | S | fine |
| `rm.fx.drop-shadow` | effects.md | Blurred shadow behind a transparent cutout. | T2 | pre | S | canvas-only |
| `rm.fx.duotone` | effects.md | Maps luminance to two brand colors. | T2 | pre | S | fine |
| `rm.fx.emboss` | effects.md | Raised-line relief texture. | T2 | pre | S | canvas-only |
| `rm.fx.evolve` | effects.md | Directional soft-edge reveal (wipe in or out). | T2 | pre | F1 | fine |
| `rm.fx.exposure` | effects.md | Exposure in photographic stops, linear light. | T2 | pre | S | fine |
| `rm.fx.fisheye` | effects.md | Ultra-wide lens warp, center magnified. | T2 | pre | S | canvas-only |
| `rm.fx.flannel` | effects.md | Plaid woven-fabric pattern generated on a Solid. | T2 | pre | S | brief-only |
| `rm.fx.glow` | effects.md | Soft halo around bright parts, element looks like it emits light. | T2 | pre | S | brief-only |
| `rm.fx.grayscale` | effects.md | Black and white pass with controllable mix. | T2 | pre | S | fine |
| `rm.fx.gridlines` | effects.md | Technical grid overlay, can tilt in 3D (rotationX). | T2 | pre | S | fine |
| `rm.fx.halftone` | effects.md | Luminance to printed dots, squares or lines. | T2 | pre | S | canvas-only |
| `rm.fx.halftone-linear-gradient` | effects.md | Dot size changes across a gradient axis, a dot-pattern wipe. | T2 | pre | F1 | canvas-only |
| `rm.fx.hue` | effects.md | Rotates hue in degrees. | T2 | pre | S | fine |
| `rm.fx.invert` | effects.md | Negative or x-ray look. | T2 | pre | S | fine |
| `rm.fx.levels` | effects.md | Black point, white point and midtone gamma. | T2 | pre | S | fine |
| `rm.fx.light-leak` | effects.md | Warm film light leak that reveals then retracts, hides cuts. | T2 | pre | F1 | canvas-only |
| `rm.fx.light-trail` | effects.md | Directional light streak from bright or opaque areas. | T2 | pre | F1 | brief-only |
| `rm.fx.linear-gradient` | effects.md | Two-stop linear gradient that replaces the pixels. | T2 | pre | S | canvas-only |
| `rm.fx.linear-gradient-tint` | effects.md | Tint whose color changes along a gradient axis, alpha respected. | T2 | pre | S | canvas-only |
| `rm.fx.linear-progressive-blur` | effects.md | Blur radius varies along an axis: focus pull, depth of field, soft edge. | T2 | pre | F1 | fine |
| `rm.fx.linear-progressive-pixelate` | effects.md | Pixel block size varies along an axis. | T2 | pre | F1 | fine |
| `rm.fx.lines` | effects.md | Alternating stripes over or behind content. | T2 | pre | S | fine |
| `rm.fx.liquid-contours` | effects.md | Flowing two-color liquid contour background on a Solid. | T2 | pre | F1 | fine |
| `rm.fx.lut` | effects.md | Applies a 3D .cube color lookup table. | T2 | pre | S | fine |
| `rm.fx.mirror` | effects.md | Mirrors the layer around an axis. | T2 | pre | S | fine |
| `rm.fx.noise` | effects.md | Subtle procedural film grain, alpha kept. | T2 | pre | S | canvas-only |
| `rm.fx.noise-displacement` | effects.md | Noise warp inside a circular region only. | T2 | pre | F1 | canvas-only |
| `rm.fx.outline` | effects.md | Solid outline around non-transparent pixels, sticker look. | T2 | pre | S | fine |
| `rm.fx.paper` | effects.md | Procedural paper texture: grain, fibers, crumples, folds, speckles. | T2 | pre | S | canvas-only |
| `rm.fx.pattern` | effects.md | Tiles scaled copies of a source: wallpaper, contact sheet, brick layout. | T2 | pre | S | fine |
| `rm.fx.pixel-dissolve` | effects.md | Grid cells fade out in random order, a mosaic dissolve. | T2 | pre | F1 | fine |
| `rm.fx.pixelate` | effects.md | Mosaic or censor blocks. | T2 | pre | S | fine |
| `rm.fx.radial-progressive-blur` | effects.md | Blur grows from a center ellipse to the edge: spotlight focus. | T2 | pre | F1 | fine |
| `rm.fx.radial-progressive-pixelate` | effects.md | Pixel size grows from the center to the edge. | T2 | pre | F1 | fine |
| `rm.fx.region-blur` | effects.md | Blur only a rectangle or rounded box, for faces, plates, documents. | T2 | pre | S | fine |
| `rm.fx.rings` | effects.md | Concentric colored bands from a center. | T2 | pre | S | fine |
| `rm.fx.roughen-edges` | effects.md | Rough paper-torn alpha edge on cutouts, logos, text. | T2 | pre | S | canvas-only |
| `rm.fx.saturation` | effects.md | Scales color intensity. | T2 | pre | S | fine |
| `rm.fx.scale` | effects.md | Scales a layer (horizontal and vertical flags). | T2 | pre | S | fine |
| `rm.fx.scanlines` | effects.md | Additive horizontal scanlines, CRT look. | T2 | pre | F1 | brief-only |
| `rm.fx.shadows-highlights` | effects.md | Lift shadows and recover highlights independently. | T2 | pre | S | fine |
| `rm.fx.shine` | effects.md | Glossy diagonal light sweep for stickers, badges, titles. | T2 | pre | F1 | canvas-only |
| `rm.fx.shrinkwrap` | effects.md | Plastic wrap: wrinkles, glossy highlights, small displacement. | T2 | pre | S | canvas-only |
| `rm.fx.skew` | effects.md | Horizontal and vertical skew. | T2 | pre | S | fine |
| `rm.fx.speckle` | effects.md | Small random alpha holes, dust or pinpricks. | T2 | pre | S | canvas-only |
| `rm.fx.starburst` | effects.md | Retro ray pattern that replaces the pixels, usually the first effect on a Solid. | T2 | pre | F1 | brief-only |
| `rm.fx.tear` | effects.md | Tears the layer along a zigzag seam, halves rotate away. | T2 | pre | F1 | fine |
| `rm.fx.thermal-vision` | effects.md | Luminance mapped to a heat-map ramp. | T2 | pre | S | brief-only |
| `rm.fx.tile` | effects.md | Repeats the opaque area, alternate copies mirrored for seamless edges. | T2 | pre | S | fine |
| `rm.fx.tint` | effects.md | Flat color tint, alpha mask respected. | T2 | pre | S | fine |
| `rm.fx.tv-signal-off` | effects.md | Blends into TV color bars and calibration test pattern. | T2 | pre | F1 | brief-only |
| `rm.fx.uv-translate` | effects.md | Moves a layer by normalized UV units. | T2 | pre | S | fine |
| `rm.fx.venetian-blinds` | effects.md | Slatted reveal, vertical or horizontal blinds. | T2 | pre | F1 | fine |
| `rm.fx.vibrance` | effects.md | Boosts muted colors more than saturated ones. | T2 | pre | S | fine |
| `rm.fx.vignette` | effects.md | Darkens, colors or fades the edges. | T2 | pre | S | canvas-only |
| `rm.fx.wave` | effects.md | Sine-wave displacement of the layer. | T2 | pre | F1 | fine |
| `rm.fx.waves` | effects.md | Repeating wavy color bands, seamless motion background. | T2 | pre | F1 | fine |
| `rm.fx.white-balance` | effects.md | Fixes temperature (blue to amber) and tint (green to magenta). | T2 | pre | S | fine |
| `rm.fx.white-noise` | effects.md | Grayscale TV static replacing or blending the layer. | T2 | pre | F1 | brief-only |
| `rm.fx.xy-translate` | effects.md | Moves a layer by absolute pixels. | T2 | pre | S | fine |
| `rm.fx.zigzag` | effects.md | Repeating zigzag bands, seamless motion background. | T2 | pre | F1 | fine |
| `rm.fx.zoom-blur` | effects.md | Radial zoom blur from a center point. | T2 | pre | F1 | fine |
| `rm.layout.pip-transition` | elements.md | Element goes from fullscreen to a picture-in-picture box. | T1 | live | F1 | canvas-only |
| `rm.layout.slide-to-split` | elements.md | Fullscreen scene opens into a 60/40 split. | T1 | live | F1 | canvas-only |
| `rm.lightleak.component` | noise-lightleaks-starburst.md | Deprecated <LightLeak> component (WebGL). | T2 | pre | F1 | canvas-only |
| `rm.map.flyover` | elements.md | Animated map flight from point A to point B with labels. | T4 | video | F1 | canvas-only |
| `rm.map.watercolor` | elements.md | Watercolor map journey between two places. | T3 | video | F1 | canvas-only |
| `rm.noise.2d` | noise-lightleaks-starburst.md | Seeded smooth 2D noise value from -1 to 1. | T1 | live | F1 | fine |
| `rm.noise.3d` | noise-lightleaks-starburst.md | Seeded 3D noise; third axis is time. | T1 | live | F1 | fine |
| `rm.noise.4d` | noise-lightleaks-starburst.md | Seeded 4D noise; two extra axes (z, w) for time or looping fields. | T1 | live | F1 | fine |
| `rm.overlay.location-lower-third` | elements.md | Lower third for an event location and venue. | T1 | live | F2 | canvas-only |
| `rm.overlay.name-lower-third` | elements.md | Clean lower third for a speaker, guest or host. | T1 | live | F2 | fine |
| `rm.overlay.social-safe-zones` | elements.md | Preview of Instagram or TikTok UI to keep content inside safe areas. | T1 | video | S | fine |
| `rm.path.bounding-box` | shapes-paths.md | Smallest rectangle around a path (x1,x2,y1,y2,width,height) to compute a viewBox. | T1 | live | S | fine |
| `rm.path.center` | shapes-paths.md | Moves a path so its bounding-box center sits on a target (default 0,0). | T1 | live | S | fine |
| `rm.path.cut` | shapes-paths.md | Returns the part of a path from the start to a length. | T1 | live | F1 | fine |
| `rm.path.draw-on` | shapes-paths.md | Stroke that draws itself, the standard line-reveal. | T1 | live | F1 | fine |
| `rm.path.evolve` | shapes-paths.md | Draws a path on from invisible to full, returns strokeDasharray and strokeDashoffset. | T1 | live | F1 | fine |
| `rm.path.extend-viewbox` | shapes-paths.md | Widens an SVG viewBox in all directions; alternative is overflow: visible. | T1 | live | S | fine |
| `rm.path.follow` | shapes-paths.md | Object or camera that travels along a route and faces its direction. | T1 | live | F1 | fine |
| `rm.path.instruction-index` | shapes-paths.md | Which path instruction sits at a given length (4.0.84+). | T1 | live | S | fine |
| `rm.path.interpolate` | shapes-paths.md | Morphs between two paths (d3-interpolate-path). | T1 | live | F1 | fine |
| `rm.path.interpolate-multi` | shapes-paths.md | Morphs across several path keyframes with interpolate() options (4.0.529+). | T1 | live | F1 | fine |
| `rm.path.length` | shapes-paths.md | Total length of a path. | T1 | live | S | fine |
| `rm.path.morph` | shapes-paths.md | One shape turning into another, icon to icon or logo to word. | T1 | live | F1 | fine |
| `rm.path.normalize` | shapes-paths.md | Converts relative commands to absolute. | T1 | live | S | fine |
| `rm.path.parse` | shapes-paths.md | Parses a path string into Instruction objects. | T1 | live | S | fine |
| `rm.path.parts` | shapes-paths.md | Removed in v4, replaced by getSubpaths(). | T1 | live | S | fine |
| `rm.path.point-at-length` | shapes-paths.md | x,y of a point along a path, null past the end (from v4). | T1 | live | F1 | fine |
| `rm.path.reduce-instructions` | shapes-paths.md | Reduces to M, L, C, Z only (Q kept before 4.0.168 was reduced away). | T1 | live | S | fine |
| `rm.path.reset` | shapes-paths.md | Moves the bounding-box top-left to 0,0. | T1 | live | S | fine |
| `rm.path.reverse` | shapes-paths.md | Swaps start and end of a path. | T1 | live | S | fine |
| `rm.path.scale` | shapes-paths.md | Scales a path (origin top-left). | T1 | live | S | fine |
| `rm.path.serialize` | shapes-paths.md | Turns Instruction[] back into a path string. | T1 | live | S | fine |
| `rm.path.subpaths` | shapes-paths.md | Splits a path at each M or m into an array of subpaths. | T1 | live | S | fine |
| `rm.path.tangent-at-length` | shapes-paths.md | Tangent x,y at a length: use for rotation to face along the path. | T1 | live | F1 | fine |
| `rm.path.translate` | shapes-paths.md | Shifts a path by x and y. | T1 | live | S | fine |
| `rm.path.warp` | shapes-paths.md | Remaps every coordinate with your function: wobble, bend, wave. | T1 | live | F1 | fine |
| `rm.prompt.3d-retro-pixel-font` | prompts.md | 8 s square brand animation: colored cursors fly in, line up, then light up pixel blocks one by one to build two lines of text, subtitle types in. | T1 | video | F3 | brief-only |
| `rm.prompt.apple-style-device-rise` | prompts.md | 4 s keynote reveal: a large phone mockup rises from below with ease-out, perspective tilt settling from 35 to 8 degrees, scale 0.8 to 1. | T1 | video | F3 | canvas-only |
| `rm.prompt.audio-spectrum-visualizer` | prompts.md | 32-bar audio spectrum synced to a track, bars reacting to bass, mids, highs, rounded tops, faint floor reflection. | T3 | video | F3 | brief-only |
| `rm.prompt.bar-line-chart-combined` | prompts.md | Combined chart: bars grow in sequence, a conversion-rate line draws on with a pulsing dot at its tip, 120 frames. | T1 | video | F3 | canvas-only |
| `rm.prompt.bms-cell-balancing` | prompts.md | 10 s technical explainer of battery cell balancing: 8 cells, voltages converge, energy-flow particles, info panel. | T1 | video | F3 | canvas-only |
| `rm.prompt.cinematic-tech-intro` | prompts.md | CEO introduction: giant pop-in name, cutout portrait with spring entrance and glitch skew, HUD panel, falling data streams. | T2 | video | F3 | brief-only |
| `rm.prompt.cursor-agent-skills-announcement` | prompts.md | Announcement video: typewriter title cards, then a screen recording that zooms in continuously, end card clip. | T2 | video | F3 | fine |
| `rm.prompt.glitch-effect-html-in-canvas` | prompts.md | A composition run through a glitch shader. | T3 | video | F3 | brief-only |
| `rm.prompt.html-in-canvas-magnifying-glass` | prompts.md | A round magnifying glass sweeps across a line of text with slight refraction. | T3 | video | F3 | canvas-only |
| `rm.prompt.launch-video-on-x` | prompts.md | 37 s, 8-scene product launch for a desktop agent: terminal install, home, chat, provider switch, with music fades. | T2 | video | F3 | canvas-only |
| `rm.prompt.music-cd-store-promo` | prompts.md | 30 s store promo: hook text, logo, count-up to 12,000, five sliding album cards, CTA, smoother section transitions, later audio-reactive. | T3 | video | F3 | brief-only |
| `rm.prompt.news-article-highlight` | prompts.md | Screenshot of an article on white: slow 3D tilt and zoom, blur-to-sharp, highlighter draws over key phrases. | T1 | video | F3 | fine |
| `rm.prompt.product-demo-for-presscut` | prompts.md | Product demo: rebuild the app UI as React components and replay what a founder shows a customer. | T2 | video | F3 | fine |
| `rm.prompt.promotion-video-for-vvterm` | prompts.md | About 20 s Apple-presentation-style promo built from a product website's logo and details. | T1 | video | F3 | fine |
| `rm.prompt.real-estate-investing` | prompts.md | 15 to 30 s listing video from a raw clip: analysis, second-by-second plan, price reveal, location lower third with pin, counters, typography, cinematic grade. | T3 | video | F3 | canvas-only |
| `rm.prompt.rocket-launches-timeline` | prompts.md | Every SpaceX launch 2015 to 2025 as fading launch parabolas, minimalist, three variants first. | T2 | video | F3 | fine |
| `rm.prompt.shape-to-words-transformation` | prompts.md | 10 s intro: row of colored shapes jumps, spins and morphs into the letters of a word, logo wipes across and erases them. | T1 | video | F3 | fine |
| `rm.prompt.solar-system-orbit` | prompts.md | 30 s, 1080p orbital motion of 8 planets over one year, moon, Saturn rings, labels. | T2 | video | F3 | canvas-only |
| `rm.prompt.spinning-glitching-svg-logo-3d` | prompts.md | SVG logo extruded to 3D with a metallic material, swing -90 to 90 degrees, glitch post effect, transparent export. | T4 | video | F3 | brief-only |
| `rm.prompt.strava-run-visualized` | prompts.md | Story-format video of a run: map, animated route, live metrics from a GPX file. | T3 | video | F3 | fine |
| `rm.prompt.the-kinetic-marketing` | prompts.md | Fast kinetic typography promo timed to 140 BPM: words crash in and push others, iris wipes, ring tunnels, floating 3D logos with depth-of-field. | T3 | video | F3 | brief-only |
| `rm.prompt.threejs-top-20-games-ranking` | prompts.md | Vertical 3D tower of the top 20 best-selling games, camera climbs from rank 20 to 1 with pauses, 60 fps. | T4 | video | F3 | canvas-only |
| `rm.prompt.transparent-cta-overlay` | prompts.md | Lower third that slides up with avatar, subscriber count and a Subscribe button that presses to Subscribed, rendered with alpha. | T1 | video | F3 | fine |
| `rm.prompt.travel-route-map-3d-landmarks` | prompts.md | Map zooms out of one city, a line draws to the next, camera follows, third stop with a 3D landmark. | T4 | video | F3 | canvas-only |
| `rm.prompt.vintage-screen-effect` | prompts.md | Subtle CRT convex screen over an animated terminal typing a create-video command. | T3 | video | F3 | brief-only |
| `rm.schema.color` | zod-types.md | Color prop with a color picker in the Studio. | T1 | video | S | fine |
| `rm.schema.matrix` | zod-types.md | Square matrix prop (2x2, 3x3, 4x4 as a flat array) with a visual editor. | T1 | video | S | fine |
| `rm.schema.textarea` | zod-types.md | Multi-line text prop. | T1 | video | S | fine |
| `rm.schema.v3-compat` | zod-types.md | Same types for projects still on Zod 3.22.3. | T1 | video | S | fine |
| `rm.schema.zod-types` | zod-types.md | Remotion-specific Zod types for editable props (Zod v4 since 4.0.426). | T1 | video | S | fine |
| `rm.shape.arrow` | shapes-paths.md | SVG arrow with head and shaft. | T1 | live | S | fine |
| `rm.shape.callout` | shapes-paths.md | Speech-bubble rectangle with a pointer, rounded corners. | T1 | live | S | fine |
| `rm.shape.circle` | shapes-paths.md | Circle. | T1 | live | S | fine |
| `rm.shape.compose` | shapes-paths.md | Shapes as building blocks: path strings feed @remotion/paths, components accept the effects prop. | T1 | live | F1 | fine |
| `rm.shape.ellipse` | shapes-paths.md | Ellipse. | T1 | live | S | fine |
| `rm.shape.heart` | shapes-paths.md | Heart (4.0.315+). | T1 | live | S | fine |
| `rm.shape.pie` | shapes-paths.md | Pie slice for progress rings and charts. | T1 | live | F1 | fine |
| `rm.shape.polygon` | shapes-paths.md | Regular polygon with N points. | T1 | live | S | fine |
| `rm.shape.rect` | shapes-paths.md | Rectangle with optional corner radius. | T1 | live | S | fine |
| `rm.shape.spark` | shapes-paths.md | Four-point spark / sparkle. | T1 | live | S | fine |
| `rm.shape.star` | shapes-paths.md | Star with inner and outer radius. | T1 | live | S | fine |
| `rm.shape.triangle` | shapes-paths.md | Equilateral triangle, any direction. | T1 | live | S | fine |
| `rm.skia.canvas` | canvas-skia-three.md | Skia 2D graphics (shaders, paths, filters) inside a composition. | T4 | video | F1 | fine |
| `rm.skia.enable` | canvas-skia-three.md | Make the bundler understand React Native Skia. | T4 | video | S | fine |
| `rm.starburst.component` | noise-lightleaks-starburst.md | Deprecated <Starburst> component (WebGL rays). | T2 | pre | F1 | brief-only |
| `rm.story.on-screen-messages` | elements.md | iMessage-style chat with staggered reveals and focus shifts. | T1 | live | F1 | fine |
| `rm.story.polaroid-pictures` | elements.md | Staggered instant-photo montage with handwritten captions. | T1 | live | F1 | canvas-only |
| `rm.story.speed-lines` | elements.md | Radial speed lines with quick entrance and exit. | T1 | live | F1 | fine |
| `rm.style.tailwind-v3` | tailwind.md | Tailwind CSS v3 (legacy) in a Remotion video project. | T1 | video | S | fine |
| `rm.style.tailwind-v4` | tailwind.md | Tailwind CSS v4 inside a Remotion video project. | T1 | video | S | fine |
| `rm.text.circle-marker` | elements.md | Hand-drawn circle around a word. | T1 | live | F1 | fine |
| `rm.text.crossed-off` | elements.md | Hand-drawn cross-out over text. | T1 | live | F1 | fine |
| `rm.text.fill-box` | text-utils.md | Word-by-word fill of a text box with max width and lines. | T1 | live | S | fine |
| `rm.text.fit` | text-utils.md | One line of text sized to fit a width. | T1 | live | S | fine |
| `rm.text.fit-n-lines` | text-utils.md | Headline that wraps over at most N lines at the biggest size that fits. | T1 | live | S | fine |
| `rm.text.font-ready` | text-utils.md | Rules that make measurement correct. | T1 | live | S | fine |
| `rm.text.marker` | elements.md | Hand-drawn marker highlight on text. | T1 | live | F1 | fine |
| `rm.text.measure` | text-utils.md | Width and height of a string for layout. | T1 | live | S | fine |
| `rm.text.news-article-highlight` | elements.md | News article treatment: slow camera move plus highlight on key passages. | T1 | live | F1 | fine |
| `rm.text.rounded-box` | text-utils.md | TikTok and Instagram style multi-line text box with rounded corners as one SVG path. | T1 | live | S | fine |
| `rm.text.spinning-text-wheel` | elements.md | 3D wheel that spins through options and settles on one. | T1 | live | F1 | fine |
| `rm.text.strike-through` | elements.md | Hand-drawn strike-through. | T1 | live | F1 | fine |
| `rm.three.canvas` | canvas-skia-three.md | 3D scene driven by the frame clock. | T4 | video | F1 | canvas-only |
| `rm.three.video-texture` | canvas-skia-three.md | A Remotion video used as a texture map (phone mockup screen, billboard). | T4 | video | F1 | canvas-only |
| `rm.three.webgpu-canvas` | canvas-skia-three.md | 3D scene on Three.js WebGPURenderer with TSL node materials. | T4 | video | F1 | canvas-only |
| `rm.transition.blur-slide` | transitions.md | Both scenes whip in one direction with heavy motion blur, like a fast camera pan. | T3 | video | F2 | fine |
| `rm.transition.book-flip` | transitions.md | Scenes bend into a shaded page-turn. | T3 | video | F2 | canvas-only |
| `rm.transition.clock-wipe` | transitions.md | Radial clock-hand wipe. | T1 | live | F4 | fine |
| `rm.transition.cross-zoom` | transitions.md | Both scenes zoom across a moving center with weighted blur samples. | T3 | video | F2 | fine |
| `rm.transition.crosswarp` | transitions.md | Outgoing and incoming scenes warp against each other on the x axis. | T3 | video | F2 | fine |
| `rm.transition.cube` | transitions.md | Both scenes rotate on a 3D cube. | T1 | live | F4 | fine |
| `rm.transition.custom` | transitions.md | Your own presentation component. | T1 | live | F4 | fine |
| `rm.transition.custom-hic` | transitions.md | Own shader presentation. | T4 | video | F2 | fine |
| `rm.transition.dissolve` | transitions.md | Outgoing scene burns away with a glowing edge based on luminance. | T3 | video | F2 | brief-only |
| `rm.transition.dreamy-zoom` | transitions.md | Zoom and slight rotation through a white flash. | T3 | video | F2 | canvas-only |
| `rm.transition.fade` | transitions.md | Incoming scene fades in over the outgoing one. | T1 | live | F4 | fine |
| `rm.transition.film-burn` | transitions.md | Procedural film-burn glow with a radial blur blend. | T3 | video | F2 | canvas-only |
| `rm.transition.flip` | transitions.md | Outgoing scene flips 180 degrees to reveal the next on its back. | T1 | live | F4 | fine |
| `rm.transition.iris` | transitions.md | Next scene opens through a growing circle, camera iris. | T1 | live | F4 | fine |
| `rm.transition.linear-blur` | transitions.md | Directional multi-sample blur while blending scenes. | T3 | video | F2 | fine |
| `rm.transition.none` | transitions.md | No visual of its own, you animate with the progress hook. | T1 | live | F2 | fine |
| `rm.transition.overlay` | transitions.md | Effect drawn on the cut between two scenes without shortening the timeline (4.0.415+). | T2 | pre | F2 | canvas-only |
| `rm.transition.progress` | transitions.md | Drive anything inside a scene from the transition progress. | T1 | live | F2 | fine |
| `rm.transition.push-cut` | transitions.md | Hard editorial cut with a short punch-in on both scenes and a brief flash (4.0.500+). | T1 | live | F2 | fine |
| `rm.transition.ripple` | transitions.md | Outgoing scene displaced by a radial sine wave while crossfading. | T3 | video | F2 | fine |
| `rm.transition.series` | transitions.md | Scenes in order with transitions or overlays placed between them. | T1 | live | F2 | fine |
| `rm.transition.slide` | transitions.md | Incoming scene pushes the outgoing one out. | T1 | live | F4 | fine |
| `rm.transition.sound` | transitions.md | Whoosh or hit sound at the start of a transition. | T1 | video | F2 | fine |
| `rm.transition.swap` | transitions.md | Scenes swap with perspective, depth and a floor reflection. | T3 | video | F2 | canvas-only |
| `rm.transition.timing-custom` | transitions.md | Own timing curve, e.g. spring to 50 percent, pause, spring to 100. | T1 | live | F2 | fine |
| `rm.transition.timing-linear` | transitions.md | Constant-speed transition timing. | T1 | live | F2 | fine |
| `rm.transition.timing-spring` | transitions.md | Spring-based transition timing. | T1 | live | F2 | fine |
| `rm.transition.wipe` | transitions.md | Incoming scene slides over the outgoing one, 8 directions including corners. | T1 | live | F4 | fine |
| `rm.transition.zoom-blur` | transitions.md | Outgoing scene zooms out and rotates, incoming zooms in from the opposite angle, radial blur. | T3 | video | F2 | fine |
| `rm.transition.zoom-in-out` | transitions.md | Outgoing scene zooms toward the viewer and crossfades, incoming zooms back out. | T3 | video | F2 | fine |
| `rm.yt.comment-highlight` | elements.md | YouTube-style card featuring a viewer comment. | T1 | live | F1 | canvas-only |
| `rm.yt.end-card` | elements.md | Clean YouTube end card with social links and slots for recommended videos. | T1 | live | F1 | canvas-only |
| `rm.yt.subscribe-nudge` | elements.md | Creator-branded subscribe prompt with a subscribed state. | T1 | video | F1 | canvas-only |
