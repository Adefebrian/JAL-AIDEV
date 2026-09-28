# Particles, physics, and game-loop patterns for interactive sites

Distilled from the three.js examples and source (MIT: `webgpu_compute_particles`, `webgpu_tsl_compute_attractors_particles`, `GPUComputationRenderer`), the WebGPU skill (dgreenheck, MIT), the game skill pack (majidmanzarpour, MIT), nixie-fx (Avetis Zakharyan, MIT), and react-three-rapier (MIT) with Rapier (Apache-2.0). Maxime Heckel's particle and render-target articles are ideas only (CC BY-NC). All code is new JAL code: check it on a real GPU.

## 1. Pick the lowest tier that reads

| Tier | Technique | Count that holds | CPU per frame | Pool ID |
|---|---|---|---|---|
| 1 | CSS or SVG with Framer Motion or WAAPI | up to about 50 | layout-free transforms | `mu.*` recipes |
| 2 | 2D canvas, one rAF, typed arrays, batched `fillRect` | a few thousand dots or lines, no depth | the simulation | `imm.tech` `canvas_2d` |
| 3 | `THREE.Points`, static BufferGeometry, animated in the vertex shader | up to about 100k | none | `three.points_field` |
| 4 | Instanced quads or meshes, billboarded in the vertex shader | tens of thousands | none, or batched matrix writes | `three.instanced_field` |
| 5 | GPGPU, FBO ping-pong (WebGL2), state in float textures | 65k (256 squared) to 262k (512 squared) | none | `three.gpgpu_particles` |
| 6 | WebGPU compute, storage buffers (`instancedArray`) | hundreds of thousands to millions on desktop | none | `three.compute_particles` |

Tier 6 always ships tier 3 or 5 as the fallback for browsers without WebGPU, then the poster.

**Taste rules (JAL):**
- On white pages particles are dark, small, and sparse: ink dust, not fireflies.
- No additive blending: invisible on white, glow on dark. Normal blending with low alpha, or opaque tiny points.
- Slow: curl-noise drift under about 0.2 units per second.
- Pointer only nudges: a repel with falloff, never an explosion.
- Reduced motion: freeze at a seeded, composed frame. Keep the particles (the still carries the look); stop the loop.
- Fill rate beats count: a few hundred large soft sprites can cost more than 100k 1-px points.

**Budgets per device tier** (starting values, measure before shipping; `performance.md` section 3):

| Tier | Points (tier 3) | GPGPU texture | Compute count |
|---|---|---|---|
| T3 desktop full | 100k | 512 squared (262k) | 262k |
| T2 mobile full | 30k | 256 squared (65k) | fallback only |
| T1 reduced | 10k | 128 squared (16k) | fallback only |
| T0 static | poster | poster | poster |

## 2. Vertex-animated points (tier 3)

Positions and per-point randoms live in attributes; the vertex shader moves them by time. The CPU does nothing per frame except one uniform.

```ts
const COUNT = 60_000;
const pos = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT);
const rng = mulberry32(7);                                   // seeded: section 6
for (let i = 0; i < COUNT; i++) {
  pos.set([(rng() - 0.5) * 8, (rng() - 0.5) * 4, (rng() - 0.5) * 3], i * 3);
  seed[i] = rng();
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
const mat = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3, transparent: true, depthWrite: false,       // normal blending, never AdditiveBlending
  uniforms: { uTime: { value: 0 }, uSize: { value: 2.0 }, uDpr: { value: 1 }, uInk: { value: new THREE.Color("#1b1b1b") } },
  vertexShader: `
    uniform float uTime, uSize, uDpr; in float aSeed; out float vAlpha;
    void main() {
      vec3 p = position;
      float ph = aSeed * 6.2831853;
      p += 0.08 * vec3(sin(uTime * 0.3 + ph), cos(uTime * 0.23 + ph * 1.3), sin(uTime * 0.17 + ph * 0.7));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = uSize * uDpr * (1.0 + aSeed) / -mv.z;             // size attenuation
      vAlpha = 0.35 + 0.45 * aSeed;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uInk; in float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = (1.0 - smoothstep(0.42, 0.5, d)) * vAlpha;            // round, anti-aliased edge
      if (a < 0.01) discard;
      gl_FragColor = vec4(uInk, a);
      #include <colorspace_fragment>
    }`,
});
const points = new THREE.Points(geo, mat);
```

- WebGL caps point size (often 64 to 256 px): use instanced quads for anything large.
- Set `uDpr` from the renderer's pixel ratio so size stays constant across tiers.
- Under reduced motion set `uTime` once to a composed value and stop rendering.

## 3. Instanced quads (tier 4)

Use when particles need rotation, non-square shapes, or lighting. One `InstancedBufferGeometry` quad plus per-instance attributes (offset, scale, phase); billboard in the vertex shader:

```glsl
// vertex: camera-facing quad of size aScale at aOffset
vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
vec3 up    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
vec3 world = aOffset + (right * position.x + up * position.y) * aScale;
gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
```

Pool, never allocate per burst: event-driven effects reuse one geometry and one material, and recycle instance slots.

## 4. GPGPU with FBO ping-pong (tier 5, WebGL2)

- Positions (and velocities if needed) live in float textures of N by N texels: 256 squared is 65,536 particles, 512 squared is 262,144.
- A simulation pass renders a full-screen triangle (`shaders.md` section 11) that reads the previous state texture and writes the next; swap two render targets every frame.
- The points material reads the position texture in its vertex shader through a per-point `aRef` attribute (the texel UV of that particle).
- `HalfFloatType` targets for mobile portability (full float needs `EXT_color_buffer_float`), `NearestFilter` always (linear filtering blends neighbouring particles), `depthBuffer: false`.
- three's `GPUComputationRenderer` (`three/addons/misc/GPUComputationRenderer.js`) wraps the ping-pong; in R3F use two `useFBO` targets and `createPortal` into an offscreen scene.

```glsl
// sim.frag: curl-noise advection toward a rest shape (needs jal-hash.glsl and gnoise from shaders.md).
// Declares its own `out`: run it as RawShaderMaterial with glslVersion GLSL3, or write gl_FragColor under ShaderMaterial.
uniform sampler2D uPos, uRest; uniform float uTime, uDt; uniform vec3 uPointer; uniform float uPointerR;
in vec2 vUv; out vec4 o;
vec3 curl3(vec3 p) {
  const float e = 0.05;
  #define P(q) vec3(gnoise(q.xy + q.z), gnoise(q.yz + 31.4), gnoise(q.zx + 71.9))
  vec3 dx = (P((p + vec3(e,0,0))) - P((p - vec3(e,0,0)))) / (2.0 * e);
  vec3 dy = (P((p + vec3(0,e,0))) - P((p - vec3(0,e,0)))) / (2.0 * e);
  vec3 dz = (P((p + vec3(0,0,e))) - P((p - vec3(0,0,e)))) / (2.0 * e);
  return vec3(dy.z - dz.y, dz.x - dx.z, dx.y - dy.x);
}
void main() {
  vec3 p = texture(uPos, vUv).xyz, rest = texture(uRest, vUv).xyz;
  vec3 v = 0.12 * curl3(p * 0.6 + vec3(0.0, 0.0, uTime * 0.05));  // under 0.2 units per second
  v += (rest - p) * 0.6;                                            // spring back to the composed shape
  vec3 d = p - uPointer; float r = length(d);
  v += (r < uPointerR ? d / max(r, 1e-3) * (1.0 - r / uPointerR) * 0.8 : vec3(0.0)); // repel with falloff
  o = vec4(p + v * uDt, 1.0);
}
```

```tsx
// R3F ping-pong skeleton (WebGL)
const SIZE = 256;
function Sim({ simMat, pointsMat }: { simMat: THREE.ShaderMaterial; pointsMat: THREE.ShaderMaterial }) {
  const opts = { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false };
  const a = useFBO(SIZE, SIZE, opts), b = useFBO(SIZE, SIZE, opts);
  const [simScene] = useState(() => new THREE.Scene());
  const [simCam] = useState(() => new THREE.OrthographicCamera());
  const ping = useRef(true);
  useFrame(({ gl }, dt) => {
    const read = ping.current ? a : b, write = ping.current ? b : a;
    simMat.uniforms.uPos.value = read.texture;
    simMat.uniforms.uDt.value = Math.min(dt, 0.05);
    gl.setRenderTarget(write); gl.render(simScene, simCam); gl.setRenderTarget(null);
    pointsMat.uniforms.uPos.value = write.texture;
    ping.current = !ping.current;
  });
  return createPortal(<mesh frustumCulled={false} material={simMat}><planeGeometry args={[2, 2]} /></mesh>, simScene);
}
// Seed `a` once from a DataTexture of rest positions (render it through a copy pass on mount).
// Regenerate both targets on webglcontextrestored: their contents are lost with the context.
```

## 5. WebGPU compute (tier 6)

```js
import * as THREE from "three/webgpu";
import { Fn, instancedArray, instanceIndex, uniform, vec3, float, hash, mx_noise_vec3, deltaTime } from "three/tsl";

const COUNT = 200_000;
const positions = instancedArray(COUNT, "vec3");
const velocities = instancedArray(COUNT, "vec3");
const uPointer = uniform(new THREE.Vector3(1e4, 0, 0));

const init = Fn(() => {
  const p = positions.element(instanceIndex);
  p.assign(vec3(hash(instanceIndex).sub(0.5).mul(8), hash(instanceIndex.add(7919)).sub(0.5).mul(4), hash(instanceIndex.add(104729)).sub(0.5).mul(3)));
})().compute(COUNT);

const update = Fn(() => {
  const p = positions.element(instanceIndex), v = velocities.element(instanceIndex);
  const flow = mx_noise_vec3(p.mul(0.6)).mul(0.12);
  const d = p.sub(uPointer), r = d.length();
  const push = d.div(r.max(0.001)).mul(float(1).sub(r.div(0.8)).max(0)).mul(0.8);
  v.assign(v.mul(0.92).add(flow).add(push));
  p.addAssign(v.mul(deltaTime));
})().compute(COUNT);                                   // workgroup [64] by default; dispatch = ceil(COUNT / 64)

await renderer.init();
renderer.compute(init);
// per frame, before render: renderer.compute(update)

const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });   // normal blending
mat.positionNode = positions.toAttribute();
mat.colorNode = vec3(0.106, 0.106, 0.106);            // ink
mat.scaleNode = float(0.012);
const sprites = new THREE.Sprite(mat); sprites.count = COUNT;
```

- Storage buffers are read-write, so there is no ping-pong.
- Workgroup size defaults to `[64, 1, 1]`, hard limit 256 threads; use `[8, 8, 1]` for 2D data.
- `renderer.compute()` is synchronous; `computeAsync` is deprecated since r181. `await renderer.init()` first.
- Verify `mx_noise_vec3`, `deltaTime`, `SpriteNodeMaterial` with `sprites.count` against the installed three **[verify]**; the three example `webgpu_compute_particles` is the reference.
- Device loss stops the renderer for good: show the poster (`three-foundations.md` section 9).

## 6. Game-loop patterns reused for interactive sites

From the MIT game skill pack, adapted to JAL law (no shake, no overshoot, no `easeOutBack`):

1. **One loop.** One owner of rAF (on a JAL page: the `gsap.ticker` clock in `r3f.md` section 3). Delta in seconds, clamped to 0.05. `update(dt, elapsed)` then `render()`. Idempotent `start` and `stop`.
2. **Fixed-step accumulator** only where a simulation needs it:

```ts
const STEP = 1 / 60; let acc = 0;
function frame(dt: number) {
  acc = Math.min(acc + dt, 0.1);                   // clamp so a stalled tab does not spiral
  while (acc >= STEP) { simulate(STEP); acc -= STEP; }
  render(acc / STEP);                              // interpolation alpha for smooth rendering between steps
}
```

3. **Frame-rate-independent follow:** `factor = 1 - Math.exp(-dt / lag)` or `1 - Math.exp(-lambda * dt)`.
4. **Update order:** input intents, fixed simulation, state, effects and camera and UI, render. The input layer emits intents; it never mutates the simulation directly.
5. **Seeded RNG** for anything visual that tests must reproduce; no `Math.random` in visual paths.

```ts
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
```

6. **Test hooks and diagnostics** behind a dev flag (`window.__immersive`), a debug panel only behind `?debug`.
7. **Tiny tween manager** with cubic easing for canvas-side motion; WAAPI for DOM overlay feedback. No bounce, no overshoot, no screen shake, no hit-stop, no FOV punch, no white flash.
8. **Audio** (rare on JAL sites): unlocked by a user gesture, never triggered per frame, never stacked on visibility resume.
9. **Input response visible within about 100 ms.**

## 7. Interaction patterns

- **Raycast proxies, not detail meshes:** one sphere or box proxy with `intersectObject(proxy, false)`, planes solved analytically from the ray, drags through `ray.intersectPlane(dragPlane)`. drei `meshBounds` or `<Bvh>` in R3F.
- **Product orbit constraints** (a bounded hero): damping 0.06, no pan, distance 4.6 to 10, polar angle 0.72 to 1.55 rad. drei `<PresentationControls>` is the calmer default on marketing pages.
- **Pointer look:** Euler order YXZ, pitch clamp `plus or minus (PI / 2 - 0.01)`, sensitivity 0.0023, re-sync yaw and pitch when pointer lock is acquired, clear keys on blur.
- **Touch:** pointer events emit the same intents as keyboard; handle `pointerup`, `pointercancel`, `lostpointercapture`, blur, and visibility; DOM controls at 44px; `touch-action` scoped to the interactive region so page scroll is not stolen.
- **Keyboard:** arrows rotate or step beats; a visible focus ring on the canvas wrapper.

## 8. nixie-fx (approval candidate, needs Brian's yes)

**What:** an MIT runtime plus CLI for particle effects authored in the hosted NixieFX editor. One deterministic, renderer-agnostic CPU simulation drives a Three.js adapter (`nixie-fx/three`, canonical) and a PixiJS v8 adapter. Package `nixie-fx` 0.1.16, ESM, `sideEffects: false`, separate entrypoints so importing core never loads a renderer.

**Why it is only a candidate:** new dependency; peer `three >=0.184.0 <0.186.0` conflicts with r186 (approval means pinning three to 0.185.x); its CLI declares Node 20 or later (verify under `bunx nixie-fx` before relying on it); the flagship example look (near-black `0x14100c` clear, orange glow, additive embers, neon spill light, CSS gradients) is unlawful for JAL, though the engine is neutral.

**Pipeline:**
1. Author a project folder with `vfx-editor.prj`. Create effects with `nixie-fx effect create --profile three-world-3d | pixi-ui-2d | portable`, edit the JSON, `validate`, then `export` to `out/vfx`. `export-status` reports exported, stale, unexported, orphaned by source hash. Never hand-edit `out/vfx`.
2. Bundle: `manifest.json`, `effects/*.json`, declared assets. The manifest records per-backend support (`supported`, `partial`, `blocked`); the loader rejects blocked bundles.
3. Runtime: `loadVfxExportBundle({ manifest, effectsByPath }, { requiredBackend: "three3d" })`, preload textures through a host `textureProvider` (getters called during render must be synchronous), `new ThreeVfxRenderer({ scene, camera, ...providers })`, `createEffect`, then `vfx.update(deltaSeconds)` exactly once per frame (never also `instance.update`). `destroy()` on teardown.

**Model:** billboard or mesh emitters; spawn shapes point, circle, box, cone, sphere, hemisphere, mesh surface or vertices; continuous `rate` or `bursts` (`{ time, count 1 to 4096, cycles 1 to 256, interval, probability }`); modules for velocity, forces, gravity, drag, curl noise, orbital, wind, plane collision, colour and size over life or speed, rotation, texture sheets, trails, sub-emitters (depth 4), lights. Per-emitter cap 1 to 4096 (defaults 256 full, 128 bare). Unlit billboards become one `InstancedMesh`.

**JAL rules if approved:** `blend: "alpha"` only (never `additive`), neutral colours, `lit` shading from the scene's own lights, never `createThreeHdrEffectLayer` (it wraps `UnrealBloomPass`: bloom is banned and it imports deep `three/examples/jsm/postprocessing/*` paths). Use it for restrained dust, paper, or confetti-like motion. `instance.seek(t)` replays deterministically at 1/60 s steps, so an effect can be scrubbed to a scroll-derived time; cost grows with `t` because seek replays from zero. Hidden scenes must not tick.

## 9. Rapier physics (approval candidate, needs Brian's yes)

`@react-three/rapier` 2.2.0 (MIT) with `@dimforge/rapier3d-compat` 0.19.2 (Apache-2.0; the npm compat line is at 0.21.0, and rapier.js is archived and merged into `dimforge/rapier` under `typescript/`).

- **Use only when interaction is the message:** tossable product parts, a playful drop-in hero. Scroll stories never need physics: a timeline is deterministic and testable.
- **Wiring:** `<Physics>` wraps bodies; `<RigidBody colliders="hull" | "cuboid" | "ball" | false>` generates colliders from child meshes or you declare them; `<InstancedRigidBodies>` gives one body per instance; `debug` draws colliders.
- **Timestep:** fixed 1/60 by default (`timeStep`), or `"vary"`. Fixed is more stable; interpolation smooths rendering between steps. `updateLoop="independent"` runs physics in its own rAF and calls `invalidate()` only while bodies are awake, pairing with `frameloop="demand"`. On a JAL page with the one-clock ticker, prefer the fixed step driven from the frame loop so there is still exactly one rAF owner **[verify]**.
- **Performance:** primitive colliders (cuboid, ball, capsule) over `hull` or `trimesh`; let bodies sleep; tens of dynamic bodies on mobile.
- **Bundle:** the compat build inlines the WASM as base64 (no static file, no MIME setup) at the cost of a large JS chunk; the npm package unpacks to about 15 MB across builds. Load it only through a dynamic `import()` on first interaction, and measure the chunk in the build script.
- **Reduced motion:** `paused`, and show the settled state.
- Without approval: custom collision (sphere and plane tests in the fixed step) covers most site toys.
