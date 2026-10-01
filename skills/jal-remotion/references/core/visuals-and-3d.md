# Canvas, effects, 3D and imported visuals (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01). The dedicated visuals reference (full `@remotion/effects` catalogue, transitions presentations, Lottie, shapes) is owned by another folder; this file covers what the core pages in this slice define.

## What it is

The "pixel" layer of a composition: canvas components that accept `effects` (`<Solid>`, `<CanvasImage>`, `<Img effects>`, `<AnimatedImage>`, `<HtmlInCanvas>`, `<Video>`), custom effects (`createEffect`), HTML-in-canvas, Three.js via `@remotion/three`, maps (MapLibre), Rive, Spline, Figma/After Effects imports, noise, text annotations, macOS cursors, and OpenTimelineIO export.

## When a JAL agent uses it

Backgrounds and shader looks (halftone, gradients as video art), post-processing of DOM content (blur, fisheye, glitch, CRT), 3D hero shots, route/map explainers, UI cursor demos, annotated text. Choose the lightest tool: plain HTML + CSS first; then an effect on the element; then `<HtmlInCanvas>`; then a custom `createEffect`; then Three.js. JEV picks per case. JAL law: a composition (in a Player or as an MP4) follows full page law, and the canvas exemption (natural light and shade) covers scene content only: a 3D scene, footage, a rendered image inside the frame; JEV decides per composition (Brian, 2026-10-01). Text, UI, and captions in the same frame keep full law; `brief-only` looks (glitch, CRT, neon) only when the brief asks and JEV agrees.

## Effects and canvas components

- `effects` prop: array of effect factories (from `@remotion/effects/<slug>`, or `createEffect`). Order matters; applied left to right. Every factory also takes `disabled?: boolean`. Install `bunx remotion add @remotion/effects`. Effects use WebGL2: with Remotion 4 pass `--gl=angle` when rendering (default from 5.0); client-side rendering works too.
- Official effect list (from the official skill): `brightness contrast colorKey duotone grayscale hue invert saturation tint linearGradient linearGradientTint thermalVision blur linearProgressiveBlur radialProgressiveBlur zoomBlur dropShadow glow lightTrail evolve venetianBlinds mirror scale uvTranslate xyTranslate barrelDistortion chromaticAberration fisheye cornerPin wave burlap emboss dotGrid halftone noise noiseDisplacement paper roughenEdges pattern pixelate pixelDissolve scanlines speckle shine shrinkwrap vignette contourLines checkerboard halftoneLinearGradient gridlines whiteNoise tvSignalOff lines rings waves zigzag lightLeak starburst` (plus `colorCorrection`, `lut`). `uvTranslate()` and `xyTranslate()` import from `@remotion/effects/translate`.

```tsx
import {halftoneLinearGradient} from '@remotion/effects/halftone-linear-gradient';
import {Solid, useVideoConfig} from 'remotion';
export const Bg: React.FC = () => {
  const {width, height} = useVideoConfig();
  return <Solid width={width} height={height} color="black"
    effects={[halftoneLinearGradient({firstStopDotSize: 0, secondStopDotSize: 42, firstStopPosition: [0, 0.5], secondStopPosition: [1, 0.5], gridSize: 24, dotColor: '#0b84f3'})]} />;
};
```

### `<Solid>` (4.0.464+)
`<Solid width height color? effects? pixelDensity? className style crop* ref />` renders a rectangle into a `<canvas>`; `width`/`height` are positive integers; `color` omitted = transparent; `pixelDensity` (4.0.472+) default 1 (pass `usePixelDensity()` to follow the render `scale`); inherits `from`, `durationInFrames`, `trimBefore`, `playbackRate`, `name`, `showInTimeline`, `hidden`, premount props (4.0.528+). Main purpose: a surface for effects.

### `createEffect()` (4.0.479+)
```ts
createEffect<Params, State>({
  type: 'com.example.myEffect',        // stable reverse-DNS id
  label: 'myEffect()', documentationLink: null,
  backend: '2d' | 'webgl2' | 'webgpu', // adjacent same-backend effects are grouped
  calculateKey: (params) => string,    // include every param that changes output
  setup: (target) => state | null,
  apply: ({source, target, state, params, width, height, gpuDevice, flipSourceY}) => void,
  cleanup: (state) => void,
  schema: InteractivitySchema,         // Studio controls; a `disabled` boolean is added automatically
  validateParams: (params) => void,    // throw TypeError on bad input
});
```
Use for reusable, parameterised, Studio-editable, stackable effects; prefer it over `<HtmlInCanvas onPaint>` for those. Apply to `CanvasImage`, `Solid`, `Img`, `Video`, `HtmlInCanvas`, `AnimatedImage`, `RemotionRiveCanvas`. Defining needs no browser; applying needs a canvas with the chosen backend.

### `<CanvasImage>`, `<Img effects>`, `<AnimatedImage>`
See `assets-and-fonts.md`. CORS required because pixels are drawn to a canvas.

### Greenscreen, colour correction, LUT
See `media.md` (`colorKey()`, `colorCorrection()`, `lut()` with `.cube` text).

### Posterisation / stepped looks
`posterize` option on `interpolate`/`interpolateColors` (timing file).

## HTML-in-canvas (4.0.455+)

Experimental browser API (WICG): draw a live DOM subtree into a canvas and post-process it with 2D, WebGL or WebGPU.
- Preview needs Chrome 149+ with `chrome://flags/#canvas-draw-element` enabled (Chrome 147 buggy, not supported). Check `HtmlInCanvas.isSupported()` (or `isHtmlInCanvasSupported()`); the component throws if unsupported. **Rendering needs nothing**: Remotion ships and defaults to a Chrome build with the flag enabled (local CLI/Studio, Lambda, Vercel, SSR APIs). Add `--gl=angle` for WebGL shaders; `swangle` on GPU-less hosts.
- It is Chromium-only (behind a flag) and unstable: Chrome may change or remove the API.

```tsx
import {HtmlInCanvas, type HtmlInCanvasOnPaint} from 'remotion';
const onPaint: HtmlInCanvasOnPaint = ({canvas, elementImage, pixelDensity}) => {
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('no 2d');
  ctx.reset(); ctx.filter = `blur(${8 * pixelDensity}px)`; ctx.drawElementImage(elementImage, 0, 0);
};
export const Blurred: React.FC = () => <HtmlInCanvas width={1280} height={720} onPaint={onPaint}>Hello</HtmlInCanvas>;
```
Props: `width`, `height` (positive ints), `pixelDensity` (default 1), `children` (wrapped in a div of that size), `effects` (run after `onPaint`), `onPaint({canvas: OffscreenCanvas, element, elementImage, pixelDensity})`, `onInit(...)` (once; must return a cleanup or a Promise of one; for creating GL/GPU contexts), crop props, inherited sequence/timing + premount props, `ref` (`HTMLCanvasElement`). No nesting (error); merge effects into one `onPaint`. The web-renderer can use HTML-in-canvas to capture frames (opt-in) but then cannot capture comps that contain `<HtmlInCanvas>`. Transitions can use it (`zoomBlur()`), with custom presentations possible. Motion blur / trails: see `@remotion/motion-blur` (`<HtmlInCanvasMotionBlur>`).

### Remotion Canvas Capture
A Chrome extension (Apple Silicon Mac only for now) that records a live webpage at higher than display resolution using HTML-in-canvas, aimed at product-demo close-ups of UI. Install: clone `remotion-dev/canvas-capture` to `~/Applications/...`, run its `install-browser.sh` (Chrome for Testing `150.0.7842.0`, no security updates: trusted sites only), enable `Canvas Draw Element` flag, Load unpacked at `chrome://extensions`. JAL status: external tool, not a dependency; only use with Brian's yes and only on trusted sites.

## Three.js / R3F

```tsx
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
export const Cube: React.FC = () => {
  const frame = useCurrentFrame(); const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{fov: 75, position: [0, 0, 470]}}>
      <ambientLight intensity={0.15} /><pointLight args={[undefined, 0.4]} position={[200, 200, 0]} />
      <mesh rotation={[frame * 0.03, frame * 0.035, 0]}><boxGeometry args={[100, 100, 100]} /><meshStandardMaterial color="#0b84f3" /></mesh>
    </ThreeCanvas>
  );
};
```
- `<ThreeCanvas>` wraps R3F `<Canvas>`, bridges Remotion contexts, **requires `width` and `height`** (browser transform bug). Drive everything from `useCurrentFrame()`, never R3F `useFrame()`. While rendering it forces `frameloop: 'never'`: after async texture updates call `advance(performance.now())`, not `invalidate()`. Inherits sequence timing/premount props; `showInTimeline` defaults to false, `name` to `"<ThreeCanvas>"`. A `<Sequence>` inside needs `layout="none"`. Needs WebGL (`--gl=angle` on 4.x).
- `<ThreeWebGPUCanvas>` from `@remotion/three/webgpu` (4.0.503+): Three `WebGPURenderer` with WebGL2 fallback; needs `three` 0.167+, `@react-three/fiber` 9, React 19; TSL from `three/tsl`; props as ThreeCanvas except `gl`; experimental upstream. 4.x: `--gl=angle` (or `swangle` without GPU, `vulkan` for native GPU on headless Linux), else an empty canvas; `bunx remotionb gpu` to inspect.
- Video textures: `useVideoTexture()` and `useOffthreadVideoTexture()` (4.0.83+) are deprecated; use `<Video>` from `@remotion/media` with the documented texture snippet. Ties into JAL: `skills/jal-immersive/references/r3f.md` and `three-foundations.md` cover scene craft; inside a Remotion comp the camera/objects are pure functions of the frame (no `useFrame`, no OrbitControls state, no `Math.random`).
- Spline: export R3F code from Spline and animate with `spring`/`interpolate` (tutorial flagged out of date; verify). The Remotion 3D template is `template-three`.

## Imported animation

- **Lottie / After Effects**: export with the Bodymovin plugin (enable "Allow Scripts to Write Files and Access Network"), put JSON in `public/`, load with `fetch(staticFile(...))` inside `useDelayRender`, render `<Lottie animationData>` from `@remotion/lottie`; match composition size and duration.
- **Rive**: `<RemotionRiveCanvas src fit alignment artboard animation onLoad enableRiveAssetCdn assetLoader effects className style crop* ref />` (`fit` default `contain`; memoise `assetLoader`/`onLoad` with `useCallback`; ref exposes `getAnimationInstance/getArtboard/getRenderer/getCanvas`; set text runs in `onLoad`).
- **Figma** (4.0.495+): paste into the Studio ("Copy as SVG" is more reliable; images unsupported when pasting layers directly) or convert SVG to JSX (SVGR) into your markup.

## Maps

MapLibre GL JS + Turf (`bun add --exact maplibre-gl @turf/turf`): create the map inside `useDelayRender`, `interactive: false`, `fadeDuration: 0`, `canvasContextAttributes.preserveDrawingBuffer: true`, `setWorkerUrl` Blob pointing at the unpkg worker, no `map.remove()` cleanup during render; add GeoJSON sources/layers (line, circle, symbol); animate lines with `turf.lineSliceAlong` (use `Math.max(0.001, ...)`) and `source.setData()`; move the camera per frame with `map.calculateCameraOptionsFromTo(cameraLngLat, altitudeMeters, targetLngLat)` + `jumpTo`, then `map.once('idle', continueRender)` and `map.triggerRepaint()`. Render with `--gl=angle --concurrency=1`. The official `remotion-maps` skill adds Mapbox, MapTiler, Cesium 3D and static map techniques. Map tiles need network at render time (public style URLs; mind tile-provider terms and keys: tokens must stay out of repos).

## Noise, annotations, cursors

- `@remotion/noise`: `noise2D/3D/4D(seed, x, y, z...)` deterministic; dot-grid surfaces with the third axis as time (`frame * speed`).
- Text highlights: `@remotion/rough-notation` components `Highlight`, `Underline`, strike-through, crossed-off, `Box`, `Bracket`, circle; drive with `progress` from `interpolate` (+ `Easing.spring({allowTail: true})`), props like `color`, `roughness`, `bowing`, `maxRandomnessOffset`, `padding`, `strokeWidth`, `iterations`, `name`; animate/posterize the seed; wrap text in `Interactive.*` for Studio editing; load the font first.
- `@remotion/mac-cursors` (4.0.513+): `<MacOSCursor cursor="pointer" customCursor? className style />`; 39 bundled cursors; hotspot at the component origin; `cursor="custom"` with `url("...") x y, fallback`; unknown keyword renders default arrow, `"none"` nothing. Good for UI demo reels.

## GSAP and OpenTimelineIO

- `@remotion/gsap` details are in `timing-and-animation.md`.
- Export to OpenTimelineIO (`.otio`) for Resolve / Premiere 25.6+: not deterministic, so use an agent skill that reads the comp, keeps native clips (`<Video>`/`<Audio>`/`<Img>`) and bakes everything else (text, shapes, effects, transitions, `playbackRate`, volume curves, canvases) into ProRes 4444 overlays or WAV stems; flatten only as a last resort. Never leave both a baked layer and the native source it replaces.

## Combining with the JAL kit

- JAL immersive references (Three, shaders, GSAP choreography, noyzzi) are page-level; a Remotion comp is time-addressed. Reuse shader/GLSL knowledge via `createEffect({backend: 'webgl2'})` or R3F inside `ThreeCanvas`, not by importing live-page loops.
- Map JAL tokens to comps by passing colours/fonts as props; the no-gradient/no-shadow law is a JAL UI law, JEV decides whether a video background may use halftone, glow or gradient looks.

From:
- https://www.remotion.dev/docs/shaders
- https://www.remotion.dev/docs/solid
- https://www.remotion.dev/docs/create-effect
- https://www.remotion.dev/docs/html-in-canvas
- https://www.remotion.dev/docs/remotion/html-in-canvas
- https://www.remotion.dev/docs/canvas-capture/
- https://www.remotion.dev/docs/canvas-capture/installation
- https://www.remotion.dev/docs/three-canvas
- https://www.remotion.dev/docs/three-webgpu-canvas
- https://www.remotion.dev/docs/use-video-texture
- https://www.remotion.dev/docs/use-offthread-video-texture
- https://www.remotion.dev/docs/rive/
- https://www.remotion.dev/docs/rive/remotionrivecanvas
- https://www.remotion.dev/docs/spline
- https://www.remotion.dev/docs/after-effects
- https://www.remotion.dev/docs/figma
- https://www.remotion.dev/docs/maps
- https://www.remotion.dev/docs/noise-visualization
- https://www.remotion.dev/docs/text-highlights
- https://www.remotion.dev/docs/mac-cursors
- https://www.remotion.dev/docs/mac-cursors/mac-os-cursor
- https://www.remotion.dev/docs/export-opentimeline
- https://www.remotion.dev/docs/color-correction
- https://www.remotion.dev/docs/greenscreen
