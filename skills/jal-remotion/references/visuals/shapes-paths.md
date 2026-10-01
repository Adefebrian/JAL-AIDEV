# Shapes and paths (@remotion/shapes, @remotion/paths)

From:
- https://www.remotion.dev/docs/paths/
- https://www.remotion.dev/docs/paths/center-path
- https://www.remotion.dev/docs/paths/cut-path
- https://www.remotion.dev/docs/paths/evolve-path
- https://www.remotion.dev/docs/paths/extend-viewbox
- https://www.remotion.dev/docs/paths/get-bounding-box
- https://www.remotion.dev/docs/paths/get-instruction-index-at-length
- https://www.remotion.dev/docs/paths/get-length
- https://www.remotion.dev/docs/paths/get-parts
- https://www.remotion.dev/docs/paths/get-point-at-length
- https://www.remotion.dev/docs/paths/get-subpaths
- https://www.remotion.dev/docs/paths/get-tangent-at-length
- https://www.remotion.dev/docs/paths/interpolate-path
- https://www.remotion.dev/docs/paths/interpolate-paths
- https://www.remotion.dev/docs/paths/normalize-path
- https://www.remotion.dev/docs/paths/parse-path
- https://www.remotion.dev/docs/paths/reduce-instructions
- https://www.remotion.dev/docs/paths/reset-path
- https://www.remotion.dev/docs/paths/reverse-path
- https://www.remotion.dev/docs/paths/scale-path
- https://www.remotion.dev/docs/paths/serialize-instructions
- https://www.remotion.dev/docs/paths/translate-path
- https://www.remotion.dev/docs/paths/warp-path
- https://www.remotion.dev/docs/shapes/
- https://www.remotion.dev/docs/shapes/arrow
- https://www.remotion.dev/docs/shapes/callout
- https://www.remotion.dev/docs/shapes/circle
- https://www.remotion.dev/docs/shapes/ellipse
- https://www.remotion.dev/docs/shapes/heart
- https://www.remotion.dev/docs/shapes/make-arrow
- https://www.remotion.dev/docs/shapes/make-callout
- https://www.remotion.dev/docs/shapes/make-circle
- https://www.remotion.dev/docs/shapes/make-ellipse
- https://www.remotion.dev/docs/shapes/make-heart
- https://www.remotion.dev/docs/shapes/make-pie
- https://www.remotion.dev/docs/shapes/make-polygon
- https://www.remotion.dev/docs/shapes/make-rect
- https://www.remotion.dev/docs/shapes/make-spark
- https://www.remotion.dev/docs/shapes/make-star
- https://www.remotion.dev/docs/shapes/make-triangle
- https://www.remotion.dev/docs/shapes/pie
- https://www.remotion.dev/docs/shapes/polygon
- https://www.remotion.dev/docs/shapes/rect
- https://www.remotion.dev/docs/shapes/spark
- https://www.remotion.dev/docs/shapes/star
- https://www.remotion.dev/docs/shapes/triangle

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

`@remotion/shapes` (MIT) renders SVG shapes as components (`<Rect>`, `<Circle>`, `<Ellipse>`, `<Triangle>`, `<Star>`, `<Polygon>`, `<Pie>`, `<Heart>`, `<Arrow>`, `<Callout>`, `<Spark>`) and as path generators (`makeRect()` and friends) that return a path string plus width, height and transform origin. The components also accept the `effects` prop.

`@remotion/paths` (MIT, built from svg-path-properties, svg-path-reverse, svgpath, svg-path-bbox, translate-svg-path, d3-interpolate-path, now functional, typed, ESM) measures, cuts, animates and transforms SVG path strings. It runs outside a composition too.

## When a JAL agent uses it

- Logo and icon morphs, line draw-on, route following, pie rings, speech bubbles, sparkle accents.
- It replaces third-party morph libraries (the prompt gallery uses `flubber`; use `interpolatePath` instead).
- Both packages are pure geometry, no gradients or shadows. Fill and stroke come from tokens; keep them flat on JAL pages.

## Patterns

- Draw-on: `evolvePath(progress, path)` returns `strokeDasharray` and `strokeDashoffset`; use it on `<path>` with `fill="none"`.
- Follow a route: `getLength` for total, `getPointAtLength(path, progress * length)` for x,y, `getTangentAtLength` for rotation. From v4 both return `null` past the end, not the end point.
- Morph: `interpolatePath(t, from, to)`; `interpolatePaths` (4.0.529+) takes keyframes and `interpolate()` options.
- Out-of-bounds drawing: set `style={{overflow: 'visible'}}` or `extendViewBox`.
- `getParts()` was removed in v4; use `getSubpaths()`.
- Throws: most path functions throw on an invalid path string. Validate input from users or data.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.shape.arrow` | SVG arrow with head and shaft. | <Arrow length headWidth headLength shaftWidth direction fill/> or makeArrow() path; @remotion/shapes | T1 | live | S | fine |
| `rm.shape.callout` | Speech-bubble rectangle with a pointer, rounded corners. | <Callout width height pointerLength pointerBaseWidth pointerDirection cornerRadius/> or makeCallout(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.circle` | Circle. | <Circle radius fill stroke strokeWidth/> or makeCircle(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.ellipse` | Ellipse. | <Ellipse rx ry/> or makeEllipse(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.heart` | Heart (4.0.315+). | <Heart height/> or makeHeart(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.pie` | Pie slice for progress rings and charts. | <Pie radius progress/> or makePie(); animate progress 0 to 1; @remotion/shapes | T1 | live | F1 | fine |
| `rm.shape.polygon` | Regular polygon with N points. | <Polygon points radius/> or makePolygon(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.rect` | Rectangle with optional corner radius. | <Rect width height/> or makeRect(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.spark` | Four-point spark / sparkle. | <Spark width height edgeRoundness cornerRadius/> or makeSpark(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.star` | Star with inner and outer radius. | <Star points innerRadius outerRadius/> or makeStar(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.triangle` | Equilateral triangle, any direction. | <Triangle length direction/> or makeTriangle(); @remotion/shapes | T1 | live | S | fine |
| `rm.shape.compose` | Shapes as building blocks: path strings feed @remotion/paths, components accept the effects prop. | every make*() returns a path (d, width, height, transformOrigin); chain with evolvePath(), interpolatePath(); shape components take effects (outline, glow, tear) in @remotion/shapes | T1 | live | F1 | fine |
| `rm.path.center` | Moves a path so its bounding-box center sits on a target (default 0,0). | centerPath(); path, target?; returns a string; @remotion/paths | T1 | live | S | fine |
| `rm.path.cut` | Returns the part of a path from the start to a length. | cutPath(); d, length; length above total returns all, 0 returns the M command; @remotion/paths | T1 | live | F1 | fine |
| `rm.path.evolve` | Draws a path on from invisible to full, returns strokeDasharray and strokeDashoffset. | evolvePath(); progress 0 to 1, path; above 1 devolves the start, below 0 evolves from the end; @remotion/paths | T1 | live | F1 | fine |
| `rm.path.extend-viewbox` | Widens an SVG viewBox in all directions; alternative is overflow: visible. | extendViewBox(); viewBox string, scale; @remotion/paths | T1 | live | S | fine |
| `rm.path.bounding-box` | Smallest rectangle around a path (x1,x2,y1,y2,width,height) to compute a viewBox. | getBoundingBox(); path; throws if invalid; @remotion/paths | T1 | live | S | fine |
| `rm.path.instruction-index` | Which path instruction sits at a given length (4.0.84+). | getInstructionIndexAtLength(); path, length; returns index and lengthIntoInstruction; pair with parsePath(); @remotion/paths | T1 | live | S | fine |
| `rm.path.length` | Total length of a path. | getLength(); path; source svg-path-properties; @remotion/paths | T1 | live | S | fine |
| `rm.path.parts` | Removed in v4, replaced by getSubpaths(). | getParts(); do not use; use rm.path.subpaths; @remotion/paths | T1 | live | S | fine |
| `rm.path.point-at-length` | x,y of a point along a path, null past the end (from v4). | getPointAtLength(); path, length; move an object, camera or dot along a route; @remotion/paths | T1 | live | F1 | fine |
| `rm.path.subpaths` | Splits a path at each M or m into an array of subpaths. | getSubpaths(); path; relative m converted to M; @remotion/paths | T1 | live | S | fine |
| `rm.path.tangent-at-length` | Tangent x,y at a length: use for rotation to face along the path. | getTangentAtLength(); path, length; null past the end; @remotion/paths | T1 | live | F1 | fine |
| `rm.path.interpolate` | Morphs between two paths (d3-interpolate-path). | interpolatePath(); value, firstPath, secondPath; 0 is first, 1 is second; @remotion/paths | T1 | live | F1 | fine |
| `rm.path.interpolate-multi` | Morphs across several path keyframes with interpolate() options (4.0.529+). | interpolatePaths(); input, inputRange, outputRange of paths, easing and posterize as in interpolate(); @remotion/paths | T1 | live | F1 | fine |
| `rm.path.normalize` | Converts relative commands to absolute. | normalizePath(); path; source svg-path-reverse; @remotion/paths | T1 | live | S | fine |
| `rm.path.parse` | Parses a path string into Instruction objects. | parsePath(); path; throws if invalid; @remotion/paths | T1 | live | S | fine |
| `rm.path.reduce-instructions` | Reduces to M, L, C, Z only (Q kept before 4.0.168 was reduced away). | reduceInstructions(); instructions array; makes manual edits and warps safe; @remotion/paths | T1 | live | S | fine |
| `rm.path.reset` | Moves the bounding-box top-left to 0,0. | resetPath(); path; @remotion/paths | T1 | live | S | fine |
| `rm.path.reverse` | Swaps start and end of a path. | reversePath(); path; source svg-path-reverse; @remotion/paths | T1 | live | S | fine |
| `rm.path.scale` | Scales a path (origin top-left). | scalePath(); path, xScale, yScale; translate first for a different origin; @remotion/paths | T1 | live | S | fine |
| `rm.path.serialize` | Turns Instruction[] back into a path string. | serializeInstructions(); instructions; does not validate; @remotion/paths | T1 | live | S | fine |
| `rm.path.translate` | Shifts a path by x and y. | translatePath(); path, x, y; @remotion/paths | T1 | live | S | fine |
| `rm.path.warp` | Remaps every coordinate with your function: wobble, bend, wave. | warpPath(); path, (x,y)=>point; internally reduces to M,L,C,Z; @remotion/paths | T1 | live | F1 | fine |
| `rm.path.draw-on` | Stroke that draws itself, the standard line-reveal. | getLength + evolvePath: set strokeDasharray and strokeDashoffset from progress; shapes from @remotion/shapes work as input | T1 | live | F1 | fine |
| `rm.path.follow` | Object or camera that travels along a route and faces its direction. | getPointAtLength for x,y and getTangentAtLength for angle at a length driven by interpolate(); a map route or a ship path | T1 | live | F1 | fine |
| `rm.path.morph` | One shape turning into another, icon to icon or logo to word. | interpolatePath/interpolatePaths between two d strings; the multi-keyframe version takes easing like interpolate() | T1 | live | F1 | fine |
