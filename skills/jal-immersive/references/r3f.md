# React Three Fiber: architecture and patterns for JAL

Distilled from the react-three-fiber docs (MIT: `docs/API/*.mdx`, `docs/advanced/pitfalls.mdx`, `scaling-performance.mdx`), drei docs and source (MIT), and the Lenis README (MIT). Code is written for JAL. R3F 9.x with React `>=19 <19.4`; drei 10.x. Lines marked **[verify]** were not executed.

## 1. R3F or vanilla three

`imm.tech` `stack` decides per project:

- `vanilla_three`: one self-contained scene, little React state flowing in, smallest bundle, the teardown list in `three-foundations.md` section 8.
- `r3f`: several declarative 3D components, React UI state driving the scene (configurator, tabs, hover), Suspense loading, or drei helpers that save real work.
- `r3f_views`: two or more 3D regions in the page layout, one shared canvas with drei `View`.

Tree-shaking: `<Canvas>` pulls in the full THREE catalogue. With `createRoot` plus `extend({ Mesh, BoxGeometry, MeshStandardMaterial })` you pay only for registered classes. Measure the Bun.build chunk before bothering.

## 2. The JAL Canvas

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

Prefer one `position: fixed; inset: 0` canvas behind the page with sections driving what it shows, or drei `View` for embedded regions. Pin the DOM section, never the canvas: pinning re-parents or resizes the canvas and reallocates the drawing buffer.

## 3. The render loop and one clock

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

1. Never `setState` inside `useFrame`, pointer-move handlers, or intervals. Mutate refs: `ref.current.position.x += ...`.
2. Scale every motion by `delta`. Smooth with `1 - Math.exp(-lambda * delta)` (frame-rate independent); a fixed-fraction lerp changes speed with refresh rate. `maath` `easing.damp`, `damp3`, `dampQ`, `dampC` do the same; importing `maath` directly is an approval candidate (it already ships inside drei).
3. Never allocate in the loop: no `new Vector3()`, `new Color()`, or array literals. Hoist scratch objects to module scope or `useMemo`.
4. Read fast-changing state transiently: a module-level or `useRef` store read in the loop. A reactive selector re-renders at 60 fps. (`zustand` `subscribe` into a ref also works; direct import is an approval candidate.)
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

## 5. Instancing

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

- R3F raycasts every object that has a pointer handler. Events bubble nearest-first through ancestors, then continue to farther objects; objects are transparent to events by default. `e.stopPropagation()` stops bubbling and blocks farther objects, so an occluder needs its own `onPointerOver` that stops propagation.
- Pointer capture: `e.target.setPointerCapture(e.pointerId)`. Handle `pointerup`, `pointercancel`, `lostpointercapture`, blur, and visibility so a drag never sticks.
- Canvas behind DOM: `eventSource` on the shared parent, canvas `pointer-events: none`, 3D hover still works through the DOM above it.
- Raycast only against proxies: `raycast={meshBounds}` (drei) or wrap in `<Bvh>`. No raycasting at all unless the scene is interactive.
- Every interactive affordance also has a DOM control of at least 44px (reset view, next beat, "View in 3D"). Keyboard: arrows rotate or step beats.
- Scope `touch-action` to the interactive canvas region only.

## 7. drei helpers

Use:

| Helper | Why | Watch out |
|---|---|---|
| `useGLTF(url, dracoPath?, meshopt?, extendLoader?)` + `useGLTF.preload` | Cached GLTF with Draco and meshopt | Call `useGLTF.setDecoderPath("/vendor/r186/draco/")` once; default is gstatic |
| `useKTX2(url, basisPath)` | KTX2 textures, uploaded immediately | Always pass `"/vendor/r186/basis/"`; default is jsdelivr |
| `useTexture` | Cached textures | `colorSpace = SRGBColorSpace` on colour maps only |
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
| `<StatsGl>`, `r3f-perf` | Dev frame and GPU stats | Dev only; `r3f-perf` is an approval candidate |

Avoid: `<ScrollControls>` (own scroll container, fights Lenis and ScrollTrigger, damps a second time), `<Sparkles>` and `<Stars>` (glow), `<MeshDistortMaterial>` and `<MeshWobbleMaterial>` (gimmick), `<CameraShake>` (vestibular trigger), `<Sky>` and `<Cloud>` on light pages (a sky gradient is a gradient), `Environment` presets, `useDetectGPU` without self-hosted benchmarks.

## 8. drei `View`: many scenes, one canvas

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

- `useLoader(Loader, url | url[])` suspends until loaded and caches by URL; `useLoader.preload(...)` warms the cache at module scope.
- An error boundary catches load failures (fallback: the poster); the Suspense fallback shows while loading (fallback: nothing, the poster is already there).
- Nest `<Suspense>` so cheap placeholders render first and details stream in.
- Never mutate or dispose a cached asset: clone (`<Clone>`, `scene.clone()`) or `dispose={null}`.
- Before revealing the canvas: drei `<Preload all />` (calls `gl.compile` on the whole scene) or `await gl.compileAsync(scene, camera)`, render one frame, wait two rAFs, then crossfade over the poster.
- Readiness: `useProgress().active === false` plus `document.fonts.ready`. Call `ScrollTrigger.refresh()` in a `useEffect` of the loaded model component, because layout height may have changed.

## 10. WebGPU in R3F v9

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

- `<PerformanceMonitor onIncline onDecline onChange={({ factor }) => ...} flipflops={3} onFallback={...}>` averages fps over time inside bounds you set so quality does not ping-pong; after `flipflops` swings it calls `onFallback` and stops. Children read it through `usePerformanceMonitor`.
- Movement regression: `state.performance.regress()` while the camera moves; `<AdaptiveDpr pixelated />` and `<AdaptiveEvents />` drop DPR and pause raycasts until the scene rests; Canvas `performance={{ min: 0.5 }}` bounds the drop.
- The JAL ladder, in this order, never raising quality above the authored level: drop DPR to the tier floor, disable the post pass, halve particle or instance count, switch to the poster (`onFallback`).
- Dev overlays (`r3f-perf`, `leva`) are approval candidates, loaded only through a dynamic `import()` behind `?debug`.

## 12. Scroll-driven camera binding

Choreography (pinning, scrub versus triggered, SplitText) lives in `scroll-choreography.md`. The R3F side:

- One GSAP timeline per 3D section tweens a plain proxy, never the camera directly: `const cam = { t: 0, fov: 30 }`. The loop reads the proxy and writes the camera once per frame. One writer makes reduced motion and test seeking trivial.
- `scrub: true` (a direct link) when Lenis already smooths. A numeric `scrub: 0.8` on top of Lenis is a second smoother; a `damp` in `useFrame` would be a third. One smoother per signal. Without Lenis, the numeric scrub is the smoother.
- Beats are labelled (`tl.addLabel("detail")`) and authored as `{ position, target, fov }`. Interpolate position on an arc-length curve (`CatmullRomCurve3.getPointAt(t)` gives constant speed; `getPoint` does not), the look target on its own curve, or slerp between beat quaternions. During a handoff, write the camera from one interpolation only; stacking a second smoother stalls mid-transition. Handoff easing `1 - (1 - t) ** 1.8`.
- Stage subjects in the shot's own basis (camera forward, right, up), not independent world coordinates. Each shot saves and restores fov, near, and far.
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

Behind a dev or test flag:

```ts
window.__immersive = {
  ready,                                  // resolves after assets, compileAsync, fonts
  seek(p: number) { progress.current = p; advance(performance.now()); advance(performance.now()); },
  info: () => gl.info,                    // render.calls, render.triangles, memory
};
```

Tests run with `frameloop="never"`, Lenis disabled, and a fixed seed for every noise and particle source (no `Math.random` in visual paths).
