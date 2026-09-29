# React Three Fiber: architecture and patterns for JAL

Distilled from the react-three-fiber docs (MIT: `docs/API/*.mdx`, `docs/advanced/pitfalls.mdx`, `scaling-performance.mdx`), drei docs and source (MIT), and the Lenis README (MIT). Code is written for JAL. R3F 9.x with React `>=19 <19.4`; drei 10.x. Lines marked **[verify]** were not executed.

## 1. R3F or vanilla three

From: pmndrs docs (react-three-fiber `scaling-performance.mdx`, MIT), ai-dev-kit, JAL-authored.

`imm.tech` `stack` decides per project:

- `vanilla_three`: one self-contained scene, little React state flowing in, smallest bundle, the teardown list in `three-foundations.md` section 8.
- `r3f`: several declarative 3D components, React UI state driving the scene (configurator, tabs, hover), Suspense loading, or drei helpers that save real work.
- `r3f_views`: two or more 3D regions in the page layout, one shared canvas with drei `View`.

Tree-shaking: `<Canvas>` pulls in the full THREE catalogue. With `createRoot` plus `extend({ Mesh, BoxGeometry, MeshStandardMaterial })` you pay only for registered classes. Measure the Bun.build chunk before bothering.

## 2. The JAL Canvas

From: pmndrs docs (react-three-fiber Canvas API, MIT), three.js docs (MIT), ai-dev-kit, remotion (ideas only), JAL-authored.

```tsx
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

<Canvas
  frameloop="never"                                   // driven by gsap.ticker (section 3); "demand" for static scenes
  dpr={[1, tier.maxDpr]}                              // never above 2; tier budget from performance.md
  gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
  onCreated={({ gl }) => { gl.toneMapping = THREE.NeutralToneMapping; gl.setClearColor(0x000000, 0); }}
  camera={{ fov: 30, near: 0.1, far: 100, position: [0, 0.6, 6] }}
  resize={{ scroll: false }}                          // fixed full-viewport canvas under Lenis: do not re-measure on scroll
  eventSource={rootRef}                               // shared parent, so DOM above the canvas stays interactive
  eventPrefix="client"
  style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
  aria-hidden="true"
  fallback={<Poster />}                               // no WebGL: the poster, a seamless visual replacement
>
```

Defaults worth knowing: `antialias: true`, `alpha: true`, `powerPreference: "high-performance"`, `outputColorSpace = SRGBColorSpace`, `toneMapping = ACESFilmicToneMapping` (override to Neutral, see the white trap in `three-foundations.md` section 3), `dpr` `[1, 2]`, `resize` `{ scroll: true, debounce: { scroll: 50, resize: 0 } }`, camera fov 75. `flat` sets NoToneMapping, `linear` turns off sRGB handling.

Wrap `<Canvas>` in an error boundary whose fallback is also the poster: `fallback` only covers missing WebGL, not driver or context crashes.

**Depth precision.** Most depth precision sits near the near plane, so push `near` out as far as the shot allows and keep far over near under about 10,000 (the JAL default 0.1 and 100 gives 1,000). Model in metres. Coplanar surfaces (decals, labels on a face) get `polygonOffset` on the upper material, not a tiny position nudge. `logarithmicDepthBuffer` is a last resort for huge scenes: it disables early depth test and costs fill.

**Z-order map.** Fix the stacking once per page and write it in the component. Bottom up: the fixed full-page canvas (`z-index: 0`, `pointer-events: none` unless interactive), page content, the sticky header, then the native top layer (`dialog`, `popover`) for anything modal. Nothing else in between. An interactive canvas enables pointer input on its own section only, with `touch-action` scoped so page scroll is never trapped.

Prefer one `position: fixed; inset: 0` canvas behind the page with sections driving what it shows, or drei `View` for embedded regions. Pin the DOM section, never the canvas: pinning re-parents or resizes the canvas and reallocates the drawing buffer.

## 3. The render loop and one clock

From: pmndrs docs (react-three-fiber, MIT), Lenis docs, GSAP docs, ai-dev-kit, nixie-fx, JAL-authored.

**How R3F ticks.** One shared rAF loop per root. Each frame: global effects (`addEffect`), then every `useFrame` subscriber in ascending priority, then render, then after-effects (`addAfterEffect`).

- `useFrame((state, delta, xrFrame) => {})` runs just before the render.
- A positive priority takes over rendering: R3F stops calling `gl.render`, you render yourself (composers, WebGPU `RenderPipeline`, HUD layers). Negative priorities only reorder.

**Frameloops.**

| Mode | Renders | Use for |
|---|---|---|
| `always` | every rAF | never on a JAL page: it keeps ticking under reduced motion and off-screen |
| `demand` | on prop change or `invalidate()`; repeated calls in one frame render once | static or pointer-driven scenes. Anything mutating outside React (controls, GSAP tweens on three objects, Lenis) must call `invalidate()`. drei controls do it for you |
| `never` | only on `advance(timestamp)` | scroll-driven scenes on one clock, deterministic screenshots |

To start a synchronous animation under `demand`, call `invalidate()` first, then start it on the next rAF so the first frame does not jump.

**One clock for Lenis, ScrollTrigger, and R3F.** Otherwise the camera lags scroll by a frame and shimmers.

```tsx
import { advance } from "@react-three/fiber";
import { ReactLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export function Clock({ activeRef }: { activeRef: React.RefObject<boolean> }) {
  const lenisRef = useRef<LenisRef>(null);
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {            // gsap passes seconds
      lenis.raf(time * 1000);                    // 1. scroll
      if (activeRef.current) advance(time * 1000); // 2. ScrollTrigger already updated via the scroll event; 3. useFrame; 4. render
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.off("scroll", ScrollTrigger.update); };
  }, []);
  return <ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />;
}
```

- `activeRef` is flipped by an `IntersectionObserver` on the 3D sections and by `visibilitychange`: browsers keep running rAF for off-screen canvases, so the ticker must skip them.
- `advance(timestamp)` takes milliseconds **[verify]** the optional second argument (run global effects) against the installed R3F.
- With `frameloop="demand"` instead: call `invalidate()` from `lenis.on("scroll")` and each ScrollTrigger `onUpdate`, plus a settle tail of about 300 ms so damping finishes.
- Lenis settings: `lerp` 0.1 by default (`duration` and `easing` are ignored when `lerp` is set); `respectReducedMotion` is on, so smoothing turns off under reduce; `syncTouch` stays off (unstable on older iOS); `data-lenis-prevent` on modals and inner scrollers; `autoToggle` stops Lenis when the wrapper overflow is hidden.
- Lenis scrolls the real document, so ScrollTrigger `pin: true` and `position: sticky` keep working.
- Reduced motion: no scrub, no camera drift. The loop renders a still per beat and swaps with a crossfade of 150ms or less, which keeps rAF well under the `ui_audit` limit of 10 calls per second.

## 4. `useFrame` rules (no React state in the frame loop)

From: pmndrs docs (react-three-fiber `pitfalls.mdx`, MIT), drei (MIT, `maath`), Threejs-Awesome-Graphics-Agent-Skills, ai-dev-kit, nixie-fx, animata, JAL-authored.

1. Never `setState` inside `useFrame`, pointer-move handlers, or intervals. Mutate refs: `ref.current.position.x += ...`.
2. Scale every motion by `delta`. Smooth with `1 - Math.exp(-lambda * delta)` (frame-rate independent); a fixed-fraction lerp changes speed with refresh rate. `maath` `easing.damp`, `damp3`, `dampQ`, `dampC` do the same; importing `maath` directly is an approval candidate, ask Brian (it already ships inside drei).
3. Never allocate in the loop: no `new Vector3()`, `new Color()`, or array literals. Hoist scratch objects to module scope or `useMemo`.
4. Read fast-changing state transiently: a module-level or `useRef` store read in the loop. A reactive selector re-renders at 60 fps. (`zustand` `subscribe` into a ref also works; a direct import is an approval candidate, ask Brian.)
5. Set the flag after the mutation: `needsUpdate`, `updateProjectionMatrix()` (only when fov changed), `instanceMatrix.needsUpdate`.
6. Keep callbacks slim; bail out early when the object is off-screen (drei `useIntersect`).

```tsx
const target = new THREE.Vector3();                     // module scope scratch
function Follower({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    target.set(pointer.current.x * 0.4, pointer.current.y * 0.25, 0);
    ref.current.position.lerp(target, 1 - Math.exp(-6 * dt)); // lambda 6: settles in about 0.5 s
  });
  return <mesh ref={ref}>{/* ... */}</mesh>;
}
```

**Avoiding re-renders.**
- Keep the React tree static after mount; changes flow into refs and uniforms.
- Toggle `visible` instead of mounting and unmounting: each mount compiles materials, uploads geometry, and may compile shaders.
- Wrap unavoidable expensive state changes in `startTransition`.
- Share geometries and materials (module level, `useMemo`, or one GLTF through `useGLTF`, where the URL is the cache key).
- Uniforms: create once with `useMemo`, mutate `.value` in `useFrame`. Never pass a fresh `uniforms={{...}}` per render.

**Orientation composition.** Build orientation in two steps: a base quaternion from the travel direction or a target frame (`setFromUnitVectors(localForward, direction)` or a `makeBasis` matrix), then roll or spin as a separate quaternion about that direction, multiplied once. Smooth toward a target orientation with `slerp` using the exponential factor (or drei `dampQ`); for a physical feel, convert the quaternion error to an angular velocity and damp that. Normalise quaternions that accumulate products every frame.

## 5. Instancing

From: pmndrs docs (MIT), drei (MIT), three.js docs (MIT), threejs-game-skills, Threejs-Awesome-Graphics-Agent-Skills, nixie-fx.

```tsx
const dummy = new THREE.Object3D();
function Field({ count, positions }: { count: number; positions: Float32Array }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) {
      dummy.position.fromArray(positions, i * 3);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;   // once per batch
    ref.current.computeBoundingSphere();             // positions moved far from the origin
  }, [count, positions]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}
```

- Per-instance colour: `setColorAt` plus `instanceColor.needsUpdate = true`.
- drei `<Instances>` / `<Instance>` give declarative per-instance props at a CPU cost per instance per frame: fine up to the low thousands. Beyond that, write matrices yourself or move motion to the vertex shader.
- `<Merged>` for a few repeated mixed meshes; `<Detailed distances={[0, 20, 50]}>` for LOD (THREE.LOD) with hysteresis so transitions do not pop.
- Different materials or constantly changing transforms erase the instancing win; keep collision separate.

## 6. Events

From: pmndrs docs (react-three-fiber events, MIT), drei (MIT), threejs-game-skills, remotion (ideas only), JAL-authored.

- R3F raycasts every object that has a pointer handler. Events bubble nearest-first through ancestors, then continue to farther objects; objects are transparent to events by default. `e.stopPropagation()` stops bubbling and blocks farther objects, so an occluder needs its own `onPointerOver` that stops propagation.
- Pointer capture: `e.target.setPointerCapture(e.pointerId)`. Handle `pointerup`, `pointercancel`, `lostpointercapture`, blur, and visibility so a drag never sticks.
- Canvas behind DOM: `eventSource` on the shared parent, canvas `pointer-events: none`, 3D hover still works through the DOM above it.
- Raycast only against proxies: `raycast={meshBounds}` (drei) or wrap in `<Bvh>`. No raycasting at all unless the scene is interactive.
- Every interactive affordance also has a DOM control of at least 44px (reset view, next beat, "View in 3D"). Keyboard: arrows rotate or step beats.
- Scope `touch-action` to the interactive canvas region only.

## 7. drei helpers

From: drei (MIT docs and source), Threejs-Awesome-Graphics-Agent-Skills (texture channel contract), ai-dev-kit, JAL-authored.

Use:

| Helper | Why | Watch out |
|---|---|---|
| `useGLTF(url, dracoPath?, meshopt?, extendLoader?)` + `useGLTF.preload` | Cached GLTF with Draco and meshopt | Call `useGLTF.setDecoderPath("/vendor/r186/draco/")` once; default is gstatic |
| `useKTX2(url, basisPath)` | KTX2 textures, uploaded immediately | Always pass `"/vendor/r186/basis/"`; default is jsdelivr |
| `useTexture` | Cached textures | `colorSpace = SRGBColorSpace` on colour maps only; AO, roughness, metalness, normal, height stay linear. One repeat for every channel of a material, anisotropy per `three-foundations.md` 7.4, metalness 0 and roughness 1 as bases when maps own them, no displacement map when procedural height owns the silhouette |
| `<Environment files>` + `<Lightformer>` | IBL; Lightformers build a studio rig with no HDR download | Never `preset` (fetches from raw.githack.com) |
| `<ContactShadows frames={1}>`, `<AccumulativeShadows>` + `<RandomizedLight>` | Soft grounded shadows that read on white | Contact shadows re-render every frame unless `frames={1}` |
| `<Bounds fit clip observe>`, `<Center>` | Responsive framing at any aspect | Replaces hand-tuned camera numbers per breakpoint |
| `<CameraControls>` | Interruptible `setLookAt(..., true)` for triggered beats | Calls `invalidate` itself |
| `<PresentationControls>` | Bounded, spring-back drag-to-rotate for product heroes | Better than OrbitControls on a marketing page |
| `<MotionPathControls curves offset damping focus>` | Camera along a curve, offset from scroll | Its damping is a second smoother: set it near zero under Lenis |
| `<View>` + `<View.Port />` | Many viewports in one canvas (section 8) | Reconnect events to a shared parent |
| `useFBO`, `<RenderTexture>` | Render targets for GPGPU, portals, transitions | Dispose on unmount; size to DPR |
| `<Instances>`, `<Merged>`, `<Detailed>`, `<Bvh>`, `meshBounds` | Draw-call and raycast wins | Section 5 |
| `<PerformanceMonitor>`, `<AdaptiveDpr>`, `<AdaptiveEvents>`, `<Preload all>` | Adaptive quality, precompile | Section 11 |
| `useIntersect(cb)` | Cheap frustum visibility through `onBeforeRender` | Pause per-object work |
| `<Html>` | DOM label pinned to a 3D point | Expensive with `transform` or `occlude`; real copy belongs in the DOM section |
| `<Text font>` | Crisp SDF text | Always set `font`; troika fetches a CDN font otherwise |
| `shaderMaterial(uniforms, vert, frag)` | Typed ShaderMaterial class for JSX | WebGL only; TSL on WebGPU |
| `<StatsGl>`, `r3f-perf` | Dev frame and GPU stats | Dev only; `r3f-perf` is an approval candidate, ask Brian |

Avoid: `<ScrollControls>` (own scroll container, fights Lenis and ScrollTrigger, damps a second time), `<Sparkles>` and `<Stars>` (glow), `<MeshDistortMaterial>` and `<MeshWobbleMaterial>` (gimmick), `<CameraShake>` (vestibular trigger), `<Sky>` and `<Cloud>` on light pages (a sky gradient is a gradient), `Environment` presets, `useDetectGPU` without self-hosted benchmarks.

## 8. drei `View`: many scenes, one canvas

From: drei (MIT, `View`), ai-dev-kit, JAL-authored.

This section is the build section for recipe `three.views` (layout: many 3D regions, one canvas). Budget T4, one WebGL context for the whole page (the page cap of one canvas holds; extra 3D regions come only through views). Fallback: fewer views (the tier ladder in section 11 drops the least important view first, down to one), then a poster per view. Each `View` sits in a grid cell with its own poster `<img>` (same box, `aspect-ratio` fixed so nothing shifts), the canvas region `aria-hidden`, and the section's real copy in the DOM beside it. Reduced motion: each view renders one still (`frames={1}` and no scrub) or keeps its poster. Views off screen skip work: `View` already culls by its rect, and `useIntersect` pauses per-object updates inside it.

`View` cuts the viewport with `gl.scissor` and follows its tracking element, so each region scrolls, resizes, and clips with the DOM. This is how to put 3D inside a scrolling layout without many WebGL contexts (browsers cap about 16 and drop the oldest).

```tsx
import { View, PerspectiveCamera, Environment, Lightformer } from "@react-three/drei";

export function Page() {
  const root = useRef<HTMLDivElement>(null!);
  return (
    <div ref={root}>
      <section className="hero">
        <h1>...</h1>
        <View className="hero-view" style={{ height: "min(70svh, 640px)" }}>
          <PerspectiveCamera makeDefault fov={30} position={[0, 0.5, 6]} />
          <Studio /><Product />
        </View>
      </section>
      <section className="detail">
        <View className="detail-view" style={{ aspectRatio: "4 / 3" }} frames={1}>
          <Detail />
        </View>
      </section>
      <Canvas eventSource={root} style={{ position: "fixed", inset: 0, pointerEvents: "none" }} frameloop="never" dpr={[1, tier.maxDpr]}>
        <View.Port />
      </Canvas>
    </div>
  );
}
```

- Each `View` is an unstyled DOM element in the layout, so it obeys JAL layout law (no overlap, fits its box, `min-width: 0`).
- `frames={1}` when a view never moves relative to the page, to skip `getBoundingClientRect` overhead.
- Each view can have its own camera and lights; share environment maps through a module-level PMREM bake.
- The older `track={ref}` form is deprecated in favour of inline Views.

## 9. Suspense and loaders

From: pmndrs docs (react-three-fiber `useLoader`, MIT), drei (MIT), GSAP docs, animata (preloader task model), remotion (ideas only), JAL-authored.

- `useLoader(Loader, url | url[])` suspends until loaded and caches by URL; `useLoader.preload(...)` warms the cache at module scope.
- An error boundary catches load failures (fallback: the poster); the Suspense fallback shows while loading (fallback: nothing, the poster is already there).
- Nest `<Suspense>` so cheap placeholders render first and details stream in.
- Never mutate or dispose a cached asset: clone (`<Clone>`, `scene.clone()`) or `dispose={null}`.
- Before revealing the canvas: drei `<Preload all />` (calls `gl.compile` on the whole scene) or `await gl.compileAsync(scene, camera)`, render one frame, wait two rAFs, then crossfade over the poster.
- Readiness: `useProgress().active === false` plus `document.fonts.ready`. Call `ScrollTrigger.refresh()` in a `useEffect` of the loaded model component, because layout height may have changed.
- **Readiness as tasks.** When a page preloader (`mu.R24`) gates the first reveal, it waits on a task list, not only images: critical image decode, `document.fonts.ready`, the first critical fetch, and the lazy three chunk plus the `useProgress` and compile step above. Each task gets an `AbortSignal` and reports `loaded` and `total`; progress is the sum of loaded over the sum of total. Phases run in order: loading, fade-ui, reveal, done (overlay removed, scroll unlocked). An image task resolves on error too (one broken image never holds the page), short-circuits cache hits (`complete` with `naturalWidth > 0`), and sets `decoding="async"` before `decode()`. At `--cap-preloader` the signal aborts whatever is pending and the poster stands in for an unfinished canvas.

## 10. WebGPU in R3F v9

From: pmndrs docs (react-three-fiber v9, MIT), three.js docs (MIT), webgpu-claude-skill (own words).

```tsx
import * as THREE from "three/webgpu";
import { extend, type ThreeToJSXElements } from "@react-three/fiber";

declare module "@react-three/fiber" { interface ThreeElements extends ThreeToJSXElements<typeof THREE> {} }
extend(THREE as any);

<Canvas gl={async (props) => { const r = new THREE.WebGPURenderer(props as any); await r.init(); return r; }}>
```

- Alias `three` to `three/webgpu` in Bun.build (`three-foundations.md` section 5) so drei and addons share one core.
- Post then runs in a `useFrame(() => pipeline.render(), 1)`: positive priority, R3F stops rendering itself. The class is `THREE.RenderPipeline` (named `PostProcessing` before r183).
- Device loss: `renderer.onDeviceLost` shows the poster (`three-foundations.md` section 9).
- R3F v10 (alpha) is where WebGPU becomes first class. Pin v9 for production.

## 11. Performance monitoring and adaptive quality

From: drei (MIT, `PerformanceMonitor`), pmndrs docs (MIT), webgpu-claude-skill (own words), Threejs-Awesome-Graphics-Agent-Skills (progressive accumulation), threejs-game-skills, JAL-authored.

- `<PerformanceMonitor onIncline onDecline onChange={({ factor }) => ...} flipflops={3} onFallback={...}>` averages fps over time inside bounds you set so quality does not ping-pong; after `flipflops` swings it calls `onFallback` and stops. Children read it through `usePerformanceMonitor`.
- Movement regression: `state.performance.regress()` while the camera moves; `<AdaptiveDpr pixelated />` and `<AdaptiveEvents />` drop DPR and pause raycasts until the scene rests; Canvas `performance={{ min: 0.5 }}` bounds the drop.
- Wire every optional post step behind a uniform flag (`select(aaOn, aaNode, colorNode)` in TSL) so tier demotion flips `aaOn.value` without recompiling the pipeline, avoiding a compile hitch mid-scroll.
- The JAL ladder, in this order, never raising quality above the authored level: drop DPR to the tier floor, disable the post pass, halve particle or instance count, switch to the poster (`onFallback`).
- Dev overlays (`r3f-perf`, `leva`): approval candidate, ask Brian; once approved, loaded only through a dynamic `import()` behind `?debug`.
- **Progressive accumulation for a still camera** (an expensive still hero: soft shadows, raymarched glass): accumulate into a half-float target while the camera rests. The first frame after any change sits at the pixel centre and replaces history; later frames jitter by a Halton (2, 3) sequence and blend with weight `1/(n+1)` up to about 512 samples. Reset on any camera, size, or content change; an 8-bit target loses faint detail after the first blend. Stop the loop once converged (drei `<AccumulativeShadows>` is the packaged shadow case).

## 12. Scroll-driven camera binding

From: GSAP docs, three.js docs (MIT), Threejs-Awesome-Graphics-Agent-Skills (camera design frames, basis, constraints), threejs-game-skills, ai-dev-kit, remotion (ideas only: path-follow shots), JAL-authored.

Choreography (pinning, scrub versus triggered, SplitText) lives in `scroll-choreography.md`. The R3F side:

- One GSAP timeline per 3D section tweens a plain proxy, never the camera directly: `const cam = { t: 0, fov: 30 }`. The loop reads the proxy and writes the camera once per frame. One writer makes reduced motion and test seeking trivial.
- `scrub: true` (a direct link) when Lenis already smooths. A numeric `scrub: 0.8` on top of Lenis is a second smoother; a `damp` in `useFrame` would be a third. One smoother per signal. Without Lenis, the numeric scrub is the smoother.
- Beats are labelled (`tl.addLabel("detail")`) and authored as `{ position, target, fov }`. Interpolate position on an arc-length curve (`CatmullRomCurve3.getPointAt(t)` gives constant speed; `getPoint` does not), the look target on its own curve, or slerp between beat quaternions. During a handoff, write the camera from one interpolation only; stacking a second smoother stalls mid-transition. Handoff easing `1 - (1 - t) ** 1.8`.
- Stage subjects in the shot's own basis (camera forward, right, up), not independent world coordinates. Each shot saves and restores fov, near, and far.
- **Beats as design frames.** Author each beat as subject, target screen occupancy (the subject's bounding sphere fills, say, 60 percent of the shorter viewport side), fov, near, far. Derive distance from the subject: `d = r / sin(fov / 2) / occupancy` for bounding radius `r`, with the horizontal fov on portrait screens. Near as large as the closest beat allows, far just past the furthest visible object (far over near under about 1000 for a product scene, so white plinths never z-fight).
- **Degenerate look basis.** When `abs(dot(forward, up)) > 0.985` (a top-down beat), rebuild right from a fallback axis (world Z, then X) before crossing, or `lookAt` flips.
- **Input, then constraints.** Apply orbit or pointer look first and spatial constraints second, as a separate step: clamp distance, pitch, floor clearance, and room bounds after the controls update, so each layer can be tested and disabled alone.
- **Path-follow shots** (a fly-through, a tour along a product), prepared once at build or mount, never per frame:
  - Sparse control points: round them with Chaikin corner cutting before building the arc-length curve. Each pass swaps every segment for points at 1/4 and 3/4 of its length: 3 passes by default, 2 for a tight corridor, 4 for a softer glide. Smoothing cannot rescue a zig-zag that crosses the subject; fix the control points.
  - Dense or traced paths: resample to even arc-length spacing, then a few moving-average passes over several samples; optionally pull toward the start-to-end chord by about 0.45 to set how much it weaves. No Douglas-Peucker (it concentrates curvature at the kept vertices, so motion reads straight, then corner) and no Bezier fit on long wiggly lines (it overshoots).
  - Probe: print the heading change at even intervals; the values stay small and change gradually, and a jump marks a corner.
  - Aim at a real point a fixed look-ahead distance further along the same path, not the local tangent: the distant aim averages wiggles and turns smoothly into bends. The path is at least travel plus two look-ahead lengths long so the aim never clamps at the end. Pitch stays constant through the move.
- Triggered beats (`toggleActions: "play none none reverse"` or `CameraControls.setLookAt(..., true)` from `onEnter`) are kinder on mobile, where scroll velocity is erratic.
- `ScrollTrigger.config({ ignoreMobileResize: true })` and size the canvas with `100lvh` (or measure once) so the address bar does not resize it.
- Create triggers inside `useGSAP` (or a `gsap.context` scoped to a ref) so unmount reverts them.

```tsx
const beats = [
  { pos: new THREE.Vector3(0, 0.6, 6), look: new THREE.Vector3(0, 0.4, 0), fov: 30 },
  { pos: new THREE.Vector3(2.2, 1.1, 3.4), look: new THREE.Vector3(0.3, 0.5, 0), fov: 26 },
  { pos: new THREE.Vector3(-1.6, 0.4, 2.6), look: new THREE.Vector3(-0.2, 0.3, 0), fov: 24 },
];
const posCurve = new THREE.CatmullRomCurve3(beats.map((b) => b.pos));
const lookCurve = new THREE.CatmullRomCurve3(beats.map((b) => b.look));
const look = new THREE.Vector3();

function CameraRig({ progress }: { progress: React.RefObject<number> }) {
  const lastFov = useRef(0);
  useFrame(({ camera }) => {
    const t = THREE.MathUtils.clamp(progress.current, 0, 1);
    posCurve.getPointAt(t, camera.position);
    camera.lookAt(lookCurve.getPointAt(t, look));
    const seg = t * (beats.length - 1), i = Math.min(Math.floor(seg), beats.length - 2);
    const fov = THREE.MathUtils.lerp(beats[i].fov, beats[i + 1].fov, seg - i);
    const pc = camera as THREE.PerspectiveCamera;
    if (fov !== lastFov.current) { pc.fov = fov; pc.updateProjectionMatrix(); lastFov.current = fov; }
  });
  return null;
}
// progress.current is written by the section's ScrollTrigger onUpdate: (self) => (progress.current = self.progress)
// Reduced motion: progress snaps to each beat's value (0, 0.5, 1) when its DOM block enters; the DOM crossfades the still.
```

## 13. Deterministic test hooks

From: Threejs-Awesome-Graphics-Agent-Skills (runtime contract, inspection controls), threejs-game-skills (hook contract, wall-clock ban), nixie-fx (seeds), JAL-authored.

Behind a dev or test flag:

```ts
window.__immersive = {
  ready,                                  // resolves after assets, compileAsync, fonts
  seek(p: number) { progress.current = p; advance(performance.now()); advance(performance.now()); },
  info: () => gl.info,                    // render.calls, render.triangles, memory
};
```

Inspection controls behind the same flag: `debug(mode)` switching real shader branches (final, each controlling field or mask, normals, a single pass, the camera basis, history), named camera bookmarks, `pause()`, `step()`, `timeScale(x)`, `tier()`, `errors()`, and `resetHistory()`. Camera rigs also expose mode owner, basis vectors, subject screen bounds, and handoff `t`. Each recipe lists its debug modes the way it lists parameters, the capture script screenshots every mode once at 1280, and the hook is stripped from production chunks. A debug branch changes the actual pipeline, not a label, and never alters simulation state.

**Hook contract extras:** `setState(name)` awaits setup, returns `{ state: name }`, and throws on unknown names (configurator variants, the poster fallback, an opened detail view); `pause(true)` freezes simulation and state transitions while rendering continues; reduced-motion and hide-debug hooks work while paused; a frame counter, with `ready` resolving only after it passes about 10; `info` also exposes the canvas CSS size, buffer size, and applied DPR. Capture order: unpause, seed, `setState` (check the acknowledgement), pause, reduced motion, hide debug, an optional settle (0 ms for frozen named states, about 750 ms for an uncontrolled live view), `document.fonts.ready`, two rAFs, all under one 10 s deadline so a hanging hook fails instead of capturing an unverified frame. Missing or no-op hooks fail loudly.

Visual time comes only from the elapsed value the one clock passes in, never `Date.now()` or `performance.now()` inside a uniform, tween, or procedural motion, so `seek` and paused captures reproduce. Every random source (jitter, variation, sound pitch) draws from the seeded generator.

Tests run with `frameloop="never"`, Lenis disabled, and a fixed seed for every noise and particle source (no `Math.random` in visual paths).

## 14. Recipe build: three.dot_globe

From: JAL-authored (port of the Magic UI `globe` idea recorded as `mu.R44` in `skills/jal-motion/references/components.md`; tilt, dot lattice, and drag-to-rotate ideas only, no upstream code, `cobe` stays an approval candidate, ask Brian), three.js docs (MIT, `InstancedMesh`), pmndrs docs (react-three-fiber, MIT).

The build section for `three.dot_globe` (data_viz, SKILL.md section 4.5). Budget T4 / C1. Ink dots on the white page, flat and unlit: `MeshBasicMaterial` only, no lights, no shadows, no post, normal blending. The canvas exemption is not used for shading here.

**DOM first.**
- `<figure class="globe">` sized by its container (`inline-size: 100%; aspect-ratio: 1; max-inline-size: 640px`), one grid cell holding the poster and, once armed, the canvas in the same cell (never `absolute inset-0` over other content).
- Poster: the static SVG dotted map `mu.R38`, built at build time, `<img width height alt="">` so layout never shifts.
- Text equivalent: a visible `<ul>` of the marked locations (city, country, what is there) plus a `<figcaption>`. The canvas is `aria-hidden="true"`; nothing is only in 3D.
- Controls: a 44px "Pause rotation" button with `aria-pressed`, visible whenever the globe rotates. Arrow keys on the focused figure step the rotation by 15 degrees.

**Dots.** Positions are baked at build time and self-hosted as a `Float32Array` (`/data/globe-dots.bin` or the `lonlat.json` the `mu.R38` Bun script already writes). Two sources:
- Land mask: the `mu.R38` public-domain land sample (Natural Earth derived, equirectangular), converted from lon and lat to the unit sphere.
- Abstract: a Fibonacci sphere, `y = 1 - 2(i + 0.5) / n`, ring radius `sqrt(1 - y * y)`, angle `i * PI * (3 - sqrt(5))`, for an even lattice with no poles bunching.
- Count: about 6k to 12k on desktop tiers, half on mobile tiers, circles of 6 segments (`CircleGeometry(size, 6)`), one `InstancedMesh`, each dot oriented outward. An occluder sphere in `--color-surface` at radius 0.995 hides back dots flatly (no transparency sort, no fresnel).
- Markers: a second `InstancedMesh` at radius 1.002, larger dots in `--color-accent` (or ink at twice the size on a monochrome page), matched one to one with the `<ul>` items.

```tsx
// JAL code; tilt and lattice ideas from the Magic UI globe (MIT)
const dummy = new THREE.Object3D(), v = new THREE.Vector3(), out = new THREE.Vector3();
export function lonLatToVec(lon: number, lat: number, r: number, t: THREE.Vector3) {
  const la = THREE.MathUtils.degToRad(lat), lo = THREE.MathUtils.degToRad(lon);
  return t.set(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)).multiplyScalar(r);
}
function Dots({ ll, r, size, color }: { ll: Float32Array; r: number; size: number; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null!), n = ll.length / 2;
  useLayoutEffect(() => {
    for (let i = 0; i < n; i++) {
      lonLatToVec(ll[i * 2], ll[i * 2 + 1], r, v);
      dummy.position.copy(v); dummy.lookAt(out.copy(v).multiplyScalar(2)); // +Z faces outward
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [ll, r, n]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <circleGeometry args={[size, 6]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}
```

**Motion rule (Brian's).**
- Auto-rotation is allowed, slow and linear: one turn per `--loop-globe` (60 s), `yaw = offset + playTime * 2 * PI / loopSeconds`, with `playTime` accumulating only while playing so pause resumes in place. It runs only while the 44px pause control is visible; pressing it stops the turn and sets `aria-pressed="true"`.
- Drag to rotate with bounded inertia: pointer capture on the canvas cell (section 6), `touch-action: pan-y` so vertical page scroll passes through. Drag writes yaw directly; on release the yaw velocity is clamped to 3 rad/s and decays with `v *= Math.exp(-4 * dt)` until under 0.01 rad/s, then auto-rotation (if playing) continues from there. Pitch stays within the fixed 0.3 rad tilt plus or minus 0.35 rad, never a free orbit, no overshoot.
- Pauses offscreen and in hidden tabs: an `IntersectionObserver` on the figure and `visibilitychange` both clear the running flag. The canvas uses `frameloop="demand"`; the one clock (section 3) calls `invalidate()` only while playing, in view, and visible, or while inertia is settling. At rest nothing ticks.
- `prefers-reduced-motion: reduce`: static. No auto-rotation and no inertia, and no pause control since nothing moves. Show the poster plus the list, or (on capable tiers, when the page already loaded three) one frozen frame at the authored yaw plus the list. The rule is re-read on the media query's `change` event.

**Loading and fallback.** `three` and R3F load by dynamic `import()` when the figure nears the viewport (IntersectionObserver, 200px margin) and `imm.tier` allows WebGL. DPR capped at 2 (`dpr={[1, tier.maxDpr]}`). The canvas fades in over the poster at `--dur-400` after the first compiled frame, then the poster is set `hidden`. The poster is also the fallback for no WebGL, context loss, low tiers, and the error boundary.

**Parameters:** dot source (land or Fibonacci), dot count per tier, dot size, marker list, tilt, `--loop-globe`. **Debug modes** (section 13): `final`, `no-occluder` (all dots visible), `markers-only`, `frozen` (yaw 0).
