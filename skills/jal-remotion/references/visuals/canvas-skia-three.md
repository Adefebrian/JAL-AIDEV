# Canvas (editor), Skia and Three

From:
- https://www.remotion.dev/docs/canvas/
- https://www.remotion.dev/docs/canvas/canvas
- https://www.remotion.dev/docs/canvas/create-canvas-controller
- https://www.remotion.dev/docs/canvas/create-canvas-hover-controller
- https://www.remotion.dev/docs/canvas/create-canvas-selection-controller
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-change-override
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-display-frame
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-easing-change
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-easing-segments
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-settings
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-settings-change
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-source-frame
- https://www.remotion.dev/docs/canvas/get-canvas-keyframe-toggle
- https://www.remotion.dev/docs/canvas/get-canvas-keyframes
- https://www.remotion.dev/docs/canvas/get-canvas-prop-value-at-frame
- https://www.remotion.dev/docs/canvas/get-canvas-selection-item-key
- https://www.remotion.dev/docs/canvas/get-canvas-sequence-node-path-info
- https://www.remotion.dev/docs/canvas/get-canvas-sequence-source-location
- https://www.remotion.dev/docs/canvas/start-canvas-keyframe-drag
- https://www.remotion.dev/docs/canvas/use-canvas-controller
- https://www.remotion.dev/docs/canvas/use-canvas-hover
- https://www.remotion.dev/docs/canvas/use-canvas-selection
- https://www.remotion.dev/docs/canvas/use-canvas-sequence-hover
- https://www.remotion.dev/docs/skia/
- https://www.remotion.dev/docs/skia/enable-skia
- https://www.remotion.dev/docs/skia/skia-canvas
- https://www.remotion.dev/docs/three

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

- `@remotion/canvas` (4.0.527, experimental, API may change without a major bump) is not a drawing surface. It builds an authoring UI: a `<Canvas>` that renders a composition with `<Player>`, registers timeline tracks, shows selection outlines, plus controllers, hover/selection hooks and keyframe helpers for a custom timeline. It needs `@remotion/player` and all Remotion packages on the same version.
- `@remotion/skia` runs React Native Skia inside a composition through `<SkiaCanvas>`; `enableSkia()` patches the bundler config. Page `docs/skia/` itself returns 404 on the site; the two child pages were read.
- `@remotion/three` wires React Three Fiber into the frame clock: `<ThreeCanvas>`, `<ThreeWebGPUCanvas>` (Three.js WebGPURenderer, TSL node materials), `useVideoTexture()`, `useOffthreadVideoTexture()`. Install `three @react-three/fiber @remotion/three @types/three`. Starter: remotion-template-three (3D phone with a video on screen).

## When a JAL agent uses it

- 3D video pieces and brand films that need a lit scene: Three. Natural lighting and shading are allowed inside the canvas (canvas exemption); no neon, glow or purple unless the brief is noyzzi-style.
- Skia for filter-heavy 2D (shaders, blur, path effects) that the effects package does not cover. It is a heavy setup; JEV should justify it.
- The editor canvas only when Brian asks for a JAL video-authoring surface. Treat it as experimental.
- A live Three scene on a website follows `jal-immersive`; the Remotion route here is for rendered video. Do not mix the two clocks in one scene.

## Rules that bite (Three)

- Animation lives in the markup using `useCurrentFrame()`, not inside `useFrame()`.
- `<Sequence>` renders a div, which is illegal inside `<ThreeCanvas>`: pass `layout="none"`.
- Rendering needs Chromium GL `angle`: `Config.setChromiumOpenGlRenderer('angle')` for the CLI, and `chromiumOptions: {gl: 'angle'}` for `renderMedia()`, `renderFrames()`, `getCompositions()`, `renderMediaOnLambda()`, `renderMediaOnVercel()`.
- Make everything deterministic: no `Math.random()`, no wall-clock; use `random(seed)`.
- Reduced motion for any web use: a poster still of the settled frame (F1 or F3).

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.editor.canvas` | Preview canvas and layer list for a Remotion authoring interface (experimental). | <Canvas> renders a composition with <Player>, registers timeline tracks, overlays draggable selection; createCanvasController()/useCanvasController(); @remotion/canvas, install @remotion/player too; API unstable | T3 | video | S | fine |
| `rm.editor.hover-selection` | Synced hover and selection between canvas and layer rows. | createCanvasHoverController/createCanvasSelectionController, useCanvasHover, useCanvasSelection, useCanvasSequenceHover, getCanvasSelectionItemKey, getCanvasSequenceNodePathInfo | T3 | video | S | fine |
| `rm.editor.keyframes` | Keyframe markers, drag, easing editing on a custom timeline. | getCanvasKeyframes, getCanvasKeyframeToggle, startCanvasKeyframeDrag, getCanvasKeyframeEasingSegments/Change, getCanvasKeyframeSettings/Change, getCanvasKeyframeSourceFrame/DisplayFrame, getCanvasKeyframeChangeOverride, getCanvasPropValueAtFrame, getCanvasSequenceSourceLocation | T3 | video | S | fine |
| `rm.skia.enable` | Make the bundler understand React Native Skia. | enableSkia() in Config.overrideWebpackConfig; runs at bundle time | T4 | video | S | fine |
| `rm.skia.canvas` | Skia 2D graphics (shaders, paths, filters) inside a composition. | <SkiaCanvas width height> from @remotion/skia wraps a React Native Skia Canvas with Remotion contexts; put @shopify/react-native-skia nodes inside | T4 | video | F1 | fine |
| `rm.three.canvas` | 3D scene driven by the frame clock. | <ThreeCanvas> from @remotion/three (React Three Fiber): use useCurrentFrame() in markup, not useFrame(); set Sequence layout="none" inside it; Chromium gl angle for rendering (config and chromiumOptions.gl on server APIs) | T4 | video | F1 | canvas-only |
| `rm.three.webgpu-canvas` | 3D scene on Three.js WebGPURenderer with TSL node materials. | <ThreeWebGPUCanvas> from @remotion/three; same Remotion hooks as ThreeCanvas | T4 | video | F1 | canvas-only |
| `rm.three.video-texture` | A Remotion video used as a texture map (phone mockup screen, billboard). | useVideoTexture() live, useOffthreadVideoTexture() for frame-exact rendering; starter remotion-template-three | T4 | video | F1 | canvas-only |
