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
- **Constant ink.** When a point's size is clamped to a minimum pixel size, lower its opacity by the ratio of intended to drawn area, so sub-pixel points dim instead of shimmering in and out.
- **Natural fields.** Draw size or darkness from a heavy-tailed law (proportional to `u^(-2/3)` with `u` clamped above about 0.002) so a few points dominate a dense faint floor. Evaluate any density mask at the point's own position, not the pixel's, so points do not flicker as the camera moves.

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

- **Per-instance state** (spawn time, removal time, variant) lives in `InstancedBufferAttribute`s read by one shared material; a dissolve compares a geometry-space noise value against remaining life. Never clone a material per object. In JAL canvases a dissolve edge stays unlit (no emissive rim).
- **One normalised age** (0 at birth, 1 at death) drives each effect; size, opacity, and colour come from curves of that age, not scattered time constants. Secondary motion (debris, trails) takes its direction from the same event or flow vector as the primary.
- **Dense-swap removal.** Removing an instance from a packed pool moves the last live instance into the hole: copy its matrix, every custom attribute slice, and the entity-to-index mapping, then decrement `count`. Changing `count` alone attaches stale attribute data to the moved instance.

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

**GPGPU fluid lessons** (a pointer ink effect or smoke on white): convert velocity to texture space by dividing by the world size of each axis before back-tracing, so non-square grids advect correctly. The pressure solve ping-pongs: use an even number of Jacobi iterations (4 is a common floor) so the final pressure lands in the buffer the projection reads, or it projects stale data. Sample integer or age channels with nearest filtering to avoid numerical diffusion. Dye stays ink, never neon.

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
- **Sizing before limits:** count times element bytes, where a `vec3` storage element pads to 16 bytes like a `vec4` **[verify]**. One million particles with position and velocity is about 32 MB, far under the 128 MiB binding default, so a JAL section never needs `requiredLimits`; needing them means the design is too heavy for a page.
- **Read-only data** (rest positions of a target shape, a lookup table, per-particle seeds): `attributeArray(typedArray, type)`, read with `.element(index)`, instead of a second read-write buffer.
- **Attractor:** add `normalize(target - p) * strength / (d * d + 0.1)` times `dt` to velocity (0.1 softening stops centre explosions), low strength plus velocity damping so the swarm settles into a shape.
- **Neighbour search** (`positions.element(j)` in a loop over all particles) is O(n squared): fine for a few thousand, not tier 6. Beyond that, bin into a uniform grid (count per cell with `atomicAdd`, then prefix-sum offsets), or use curl-noise flow, which reads as flocking at no neighbour cost.
- **Built-ins, barriers, atomics:** `globalId`, `localId`, `workgroupId`, `numWorkgroups`, `invocationLocalIndex`, and subgroup values (`subgroupSize`, `subgroupIndex`, `invocationSubgroupIndex`) when the `subgroups` feature exists. Workgroup scratch memory (`workgroupArray` **[verify]**): write, `workgroupBarrier()`, then read neighbours; `storageBarrier()` and `textureBarrier()` order storage writes. `atomicAdd` on an atomic `uint` buffer (`.toAtomic()` **[verify]**) for alive counts or grid binning, never on a hot per-pixel path.
- **Continuous emitter:** a `lifetimes` buffer; each frame subtract `dt`, and below 0 reset position to the emitter and draw a new velocity and lifetime from `hash(instanceIndex.add(seedUniform))`, where `seedUniform` is a JAL-owned counter bumped each frame (not `time`), so replays stay deterministic. Spread initial lifetimes over the full range so respawns do not arrive in waves; fade alpha by `life / maxLife`.
- **Drawing the buffer:** `SpriteNodeMaterial` with `positions.toAttribute()` (billboards, the default above); `InstancedMesh(geo, mat, COUNT)` with `mat.positionNode = positionLocal.add(positions.element(instanceIndex))` for lit 3D motes (an icosahedron of detail 0 or an 8 by 8 sphere, never more); or `Points` with `PointsNodeMaterial`, a dummy position attribute of the right count, and `sizeNode` for the cheapest pixels. Colour from speed stays in the ink range.
- **On-demand dispatch** for events: a small kernel dispatched only when the event fires (raycast the pointer to a plane, set a uniform, `renderer.compute(impulseKernel)`), zero cost at rest. The impulse is a nudge: radius about 0.8 units, linear falloff, settling within about 0.5 s under damping.
- Workgroup size defaults to `[64, 1, 1]`, hard limit 256 threads; use `[8, 8, 1]` for 2D data.
- `renderer.compute()` is synchronous; `computeAsync` is deprecated since r181. `await renderer.init()` first.
- Verify `mx_noise_vec3`, `deltaTime`, `SpriteNodeMaterial` with `sprites.count` against the installed three **[verify]**; the three example `webgpu_compute_particles` is the reference.
- Device loss stops the renderer for good: show the poster (`three-foundations.md` section 9).

**GPU culling and indirect draws** for very large WebGPU populations (instanced vegetation, huge fields): split candidates into 32 by 32 tiles; one compute pass tests each tile's bounding sphere against the frustum and distance and appends surviving tile IDs; then one workgroup per surviving tile tests its candidates and appends accepted IDs into one buffer per LOD tier; the counts fan into indirect draw records. Reset counters each frame, rebuild only when the view changes, and keep a flat reference path in debug to compare against. Check indirect draw support in the installed three **[verify]** and keep a WebGL2 fallback with fewer instances.

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

   Hardening: cap simulation steps per frame (2 at 1/60, or 12 at 1/240) and drop the leftover backlog once the cap hits; treat a zero, negative, or `NaN` delta as the nominal step and pause through an explicit flag, never a zero delta; after each batch, if any position is non-finite or leaves a sane bound, reset and pause before the next render and log once.
   **Sleep when settled:** track mass-weighted RMS velocity; after about 0.5 s below a small threshold with no input, clear velocities, stop stepping, and let the render loop sleep. Any grab, reset, or nudge wakes it (idle scenes never tick).
3. **Frame-rate-independent follow:** `factor = 1 - Math.exp(-dt / lag)` or `1 - Math.exp(-lambda * dt)`.
4. **Update order:** input intents, fixed simulation, state, effects and camera and UI, render. The input layer emits intents; it never mutates the simulation directly.
5. **Seeded RNG** for anything visual that tests must reproduce; no `Math.random` in visual paths. When placement must look authored (burst directions, instance fields, points around an object), stratify the domain (angular slots, grid cells, stratified slots along a length, permuted independently per axis) and jitter inside each stratum: no clumps or holes, at no cost.
   **Bounded spring.** Exponential smoothing (`1 - exp(-lambda * dt)`) for perceptual values and pointer follow; a second-order spring only when inertia is the message (a drag release, a weighted camera push). Integrate semi-implicitly: `damping = 2 * zeta * sqrt(k)`, `a = drive - k * x - damping * v`, `v += a * dt`, `x += v * dt`, with `zeta` at least 1 (no overshoot), a stiffer return than hold (held 6, return 34), `dt` clamped, and `v` zeroed when `x` hits a clamp while still pushing into it.
   **Animation state.** One explicit state object per animated subject: elapsed seconds, phase name, position, velocity, base orientation, spin angle, event flags; scratch vectors at module scope. Replay and unmount reset every field, so a second play equals the first. Phases are named ranges in seconds, not one 0 to 1 value.

```ts
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
```

6. **Test hooks and diagnostics** behind a dev flag (`window.__immersive`), a debug panel only behind `?debug`. HUD values (FPS, particle counts, support status) are plain DOM text refreshed every 250 to 500 ms from inside the existing frame callback, never through React state or an extra render; measure FPS over a window and restart the window after any gap over 250 ms.
7. **Tiny tween manager** with cubic easing for canvas-side motion; WAAPI for DOM overlay feedback. No bounce, no overshoot, no screen shake, no hit-stop, no FOV punch, no white flash.
8. **Audio** (rare on JAL sites): off by default behind an explicit 44px toggle; the `AudioContext` is created and resumed inside that gesture. Route everything through `GainNode` groups (master, ui, ambience) so one mute reaches all. Beds loop through an `AudioBufferSourceNode` with `loop = true`; music sets `loopStart` and `loopEnd` on beat boundaries or crossfades two gains (a seam click is a bug). Sources stop and disconnect on unmount, pause on `visibilitychange`, never stack on resume, and are never triggered per frame. Repeated sounds get a cooldown or a small variant pool plus about 6 percent `playbackRate` variation from the seeded RNG; a short oscillator tick (triangle wave, gain ramped exponentially from 0.0001) needs no file. Lengths: UI 0.15 to 0.8 s, effects 0.5 to 2.5 s, ambience loops 8 to 30 s, music loops 30 to 90 s. Check for stacked loops, seam clicks, a bed masking UI sounds, blocked autoplay, mute reaching only some groups, silently swallowed decode errors, and the iOS Safari unlock path on a device.
9. **Input response visible within about 100 ms.**
10. **Feedback order** for toys and interactive sections: response to input within 100 ms; the subject's own motion shaped by damping or the cubic ease, never overshoot; contact feedback in lawful terms (a tonal darken, a small settle, a DOM confirmation of 150 ms or less); the camera stays still; sound, if present, on the same frame. The strongest event gets the most layers. Never delay the next input behind an animation finishing, and feedback never hides what the visitor acts on next.

## 7. Interaction patterns

- **Raycast proxies, not detail meshes:** one sphere or box proxy with `intersectObject(proxy, false)`, planes solved analytically from the ray, drags through `ray.intersectPlane(dragPlane)`. drei `meshBounds` or `<Bvh>` in R3F.
- **Product orbit constraints** (a bounded hero): damping 0.06, no pan, distance 4.6 to 10, polar angle 0.72 to 1.55 rad. drei `<PresentationControls>` is the calmer default on marketing pages.
- **Pointer look:** Euler order YXZ, pitch clamp `plus or minus (PI / 2 - 0.01)`, sensitivity 0.0023, re-sync yaw and pitch when pointer lock is acquired, clear keys on blur.
- **Touch:** pointer events emit the same intents as keyboard; handle `pointerup`, `pointercancel`, `lostpointercapture`, blur, and visibility; DOM controls at 44px; `touch-action` scoped to the interactive region so page scroll is not stolen.
- **Keyboard:** arrows rotate or step beats; a visible focus ring on the canvas wrapper.
- **Shed particles** from a spinning object start with the velocity of the point they leave: `v = cross(omega, r) + outward * s1 + axis * s2` (`omega` is spin axis times rate, `r` the offset from the spin centre). Random outward velocity alone reads as an explosion. Cap speed, ink on white.
- **Pointer ownership:** on pointer down, raycast the proxy first. A hit starts the object interaction and disables orbit or presentation controls; a miss leaves the camera free. Every exit path (`pointerup`, `pointercancel`, `lostpointercapture`, blur) re-enables controls. If picking needs a GPU readback, keep exactly one in flight and cancel a pending grab released first. The drag plane stays fixed while the grab is held.
- **Ambient inflow** (floating bubbles, leaves, paper): spawn outside the frustum, integrate the same motion law forward in coarse steps (about 1/30 s for up to 7 s), and accept only spawns whose path crosses the view (up to about 100 tries, else a strictly off-screen spawn; never steer toward the camera). Recycle only after about 2 s outside a slightly expanded frustum, and prewarm several seconds of invisible history so nothing is born inside the first frame. Reduced motion: a seeded frozen arrangement.

## 8. nixie-fx (approved, picked by JEV)

**What:** an MIT runtime plus CLI for particle effects authored in the hosted NixieFX editor. One deterministic, renderer-agnostic CPU simulation drives a Three.js adapter (`nixie-fx/three`, canonical) and a PixiJS v8 adapter. Package `nixie-fx` 0.1.16, ESM, `sideEffects: false`, separate entrypoints so importing core never loads a renderer.

**Status:** approved by Brian. Usable whenever JEV (`imm.tech`, `imm.recipe`) picks it and the rules below hold. Mechanical notes JEV weighs in `imm.tech`: peer `three >=0.184.0 <0.186.0` at 0.1.16, so either pin three to that range for the app (0.185.x today) or skip nixie-fx when the page needs a newer three; its CLI declares Node 20 or later, so run it with `bunx nixie-fx` and verify once per project; the flagship example look (near-black `0x14100c` clear, orange glow, additive embers, neon spill light, CSS gradients) is unlawful outside noyzzi sections, though the engine is neutral.

**Pipeline:**
1. Author a project folder with `vfx-editor.prj`. Create effects with `nixie-fx effect create --profile three-world-3d | pixi-ui-2d | portable`, edit the JSON, `validate`, then `export` to `out/vfx`. `export-status` reports exported, stale, unexported, orphaned by source hash. Never hand-edit `out/vfx`.
2. Bundle: `manifest.json`, `effects/*.json`, declared assets. The manifest records per-backend support (`supported`, `partial`, `blocked`); the loader rejects blocked bundles.
3. Runtime: `loadVfxExportBundle({ manifest, effectsByPath }, { requiredBackend: "three3d" })`, preload textures through a host `textureProvider` (getters called during render must be synchronous), `new ThreeVfxRenderer({ scene, camera, ...providers })`, `createEffect`, then `vfx.update(deltaSeconds)` exactly once per frame (never also `instance.update`). `destroy()` on teardown.

**Model:** billboard or mesh emitters; spawn shapes point, circle, box, cone, sphere, hemisphere, mesh surface or vertices; continuous `rate` or `bursts` (`{ time, count 1 to 4096, cycles 1 to 256, interval, probability }`); modules for velocity, forces, gravity, drag, curl noise, orbital, wind, plane collision, colour and size over life or speed, rotation, texture sheets, trails, sub-emitters (depth 4), lights. Per-emitter cap 1 to 4096 (defaults 256 full, 128 bare). Unlit billboards become one `InstancedMesh`.

**JAL rules:** outside noyzzi sections, `blend: "alpha"` only (never `additive`), neutral colours, `lit` shading from the scene's own lights, never `createThreeHdrEffectLayer` (it wraps `UnrealBloomPass`: bloom is banned and it imports deep `three/examples/jsm/postprocessing/*` paths). Use it for restrained dust, paper, or confetti-like motion. `instance.seek(t)` replays deterministically at 1/60 s steps, so an effect can be scrubbed to a scroll-derived time; cost grows with `t` because seek replays from zero. Hidden scenes must not tick.

**Entrypoints.** Import only `nixie-fx/three` and `nixie-fx/export` in the lazily loaded scene chunk; `nixie-fx` (core types, support data) and `nixie-fx/materials` are backend-neutral. `nixie-fx/export/node` and the CLI belong only in Bun build scripts. Never deep-import `nixie-fx/src/**`, never copy runtime source into the app, never install `pixi.js` (PixiJS is not approved).

**Module fidelity.** Only velocity, velocity over lifetime, colour, size, rotation, and lifetime by emitter speed run at full fidelity. Every other module (noise, forces, collision, trails, texture sheets, sub-emitters, lights, triggers, custom data, the by-speed variants) is partial and turns the support report `partial`. Prefer effects built from the full set; each partial module needs its warning read and a visual check.

### 8.1 Authoring rules

- **CLI contract.** Run `bunx nixie-fx --help` before any edit and follow the shipped help where it differs from these notes; if the package will not run under Bun, stop and report instead of inventing a format. `effect create` refuses to overwrite; `validate` and `export-status` write nothing; `export-status` exits 0 even when stale, so the build gate parses output or uses the staleness gate (8.2). `export` is the only writer, and a full export deletes and rewrites the whole output folder.
- **Workflow.** Work only inside the folder named in the brief and read its `vfx-editor.prj` first. Create each effect with `bunx nixie-fx effect create --project . --name "..." --profile three-world-3d`, then edit the generated JSON rather than writing the schema from memory: one visual change, validate, repeat. Export, confirm with `export-status`, then review in the hosted editor (Chromium, Open Folder, the Three preview; files stay local to the browser) for startup, loop or completion, motion, blend, material, bounds. Without that review the report says "visual review pending": schema validation is not visual approval.
- **IDs and scope.** Fresh unique IDs for every project, effect, and emitter, including duplicated files. Every path stays inside its root; `allowExternalOutput` stays false unless Brian asks. `three-world-3d` for JAL; `portable` only when an effect must also run elsewhere (the shared subset, not parity). Keep the diff bounded: never touch unrelated emitters, assets, materials, or output settings.
- **Project manifest.** `vfx-editor.prj` holds `app: "vfx-editor"`, `kind: "project"`, `version: 1`, a unique `id`, a `name`, ISO `createdAt` and `updatedAt`, and `settings` (`effectDataPath` default `effects`, `outputPath` default `out/vfx`, `assetRootPath` default `assets`, `materialsFolder` default `materials` resolved from the asset root, `allowExternalOutput` false, `lastEffectFile`). Persisted paths use forward slashes with no `.` or `..` segments; a source root never sits inside the output root or the reverse. A missing manifest is created from the bundled template with every `REPLACE-*` value replaced and the folders made; an existing one is the contract and is never reorganised uninvited. A subfolder with its own `vfx-editor.prj` is a separate project, exported from its own folder.
- **Safe edits.** Keep `app`, `kind`, `version` as generated and keep unknown fields so newer editors lose nothing. Only finite numbers; keep the generated scalar-value envelope (`mode`, `value`, `min`, `max`, curves) unless the mode changes on purpose. Turn a module on only when its generated settings block exists.
- **Assets.** Textures under `assetRootPath`, referenced root-relative with forward slashes; `.material` graphs under the materials folder, each graph ID equal to the emitter's material shader ID. Mesh emitters reference prepared runtime meshes only (never raw FBX or glTF). Atlased textures keep raw paths as manifest keys, mapped to frame names inside `getTexture`; never rewrite the exported manifest to match an atlas.

### 8.2 Bundle gate and verification

- **Staleness gate in `apps/web/build.ts`:** read `out/vfx/manifest.json` and every authored effect with `Bun.file().json()`, pass them to `compareVfxExportToSources(manifest, [{ path, source }])`, and fail when `outOfDate` is true, printing each stale, unexported, or orphaned path (it uses the exporter's own per-effect hash). Pass `null` when no manifest exists.
- **Incremental exports.** Exporting one effect merges it into the bundle: other effects keep their files and slots, unreferenced assets are deleted, the aggregate hash and validation are recomputed, and the first `generatedAt` is reused so git diffs show only real changes. A blocked single-effect export writes `export-diagnostics.json` and leaves the old bundle alone. `outputPath` must be a folder nixie-fx owns alone.
- **Layout.** `manifest.json`, `effects/*.json`, and each declared asset at its asset-root-relative path (no fixed folder names). A blocked export may write diagnostics instead of a bundle, so the build checks the manifest, not the folder.
- **Diagnostics levels.** `error` is malformed or unsafe data (fix it); `blocker` means the target cannot represent the effect (fix it or change profile on purpose); `warning` or `partial` may export but is reviewed at the named path and checked visually. Never delete a diagnostic to go green.
- **After export:** exit code 0; `validation.valid` with no blockers; the intended effect ID and `three3d` support present; every declared asset exists; the diff touches only intended files; the bundle loads through `loadVfxExportBundle` (plain JSON parsing proves nothing).
- **Load sequence.** Fetch `manifest.json`, parse with `parseVfxExportManifest`, fetch every `manifest.effects[].path` in parallel, then `loadVfxExportBundle({ manifest: raw, effectsByPath }, { requiredBackend: "three3d", requiredEffectIds: [...] })`, which checks identities, hashes, validation, and support. Pass `assetPaths` with `requireEveryAsset: true` only when the host can list deployed files (from the Bun build output).
- **Support reports.** `manifest.effects[i].support.backends.three3d`: `blocked` never ships; `partial` logs its `warnings[].message` in dev diagnostics and the perf report and is checked by eye on a real GPU; `notes` never change the status.

### 8.3 Runtime surface

- **Ownership.** The JAL scene owns the app, scene, camera, clock (the one `gsap.ticker`), URLs, caches, post, and error reporting; nixie-fx owns only the group and particles it creates. Its renderer advances from the single frame callback before the scene render and is destroyed in teardown step 5 (`three-foundations.md` section 8), then provider textures and geometries are released.
- **Mounting.** `new ThreeVfxRenderer({ camera, parent: productGroup, captureDebugTransforms: false, ...providers })` so effects live in the object's space and production skips per-particle debug matrices. Call `vfx.setCamera(next)` whenever the host replaces its camera.
- **Providers** are optional; an assetless effect needs only `{ scene, camera }` or `{ parent, camera }`. `textureProvider`: `ThreeVfxTextureStore({ resolveUrl: (p) => new URL(p, vfxRoot).href })` with `preload` and `destroy`, preloaded before `createEffect`. `meshProvider.getMeshGeometry(ref)` returns a `BufferGeometry` parsed once with `BufferGeometryLoader` from the prepared mesh JSON; the host disposes it. `materialGraphProvider(shaderId)` returns a `ShaderGraph` parsed from the bundle's `.material` JSON.
- **Instance calls:** `play`, `pause`, `stop`, `seek(t)`, `setTransform`, `setVisible`, `setRenderOrder` (place motes relative to transparent product materials), `setRuntimeParameters`, `emitBurst`, and `allowCompletion()` (stop emitting and let living particles finish: the lawful exit when a section scrolls away; destroy after the longest lifetime). Options: `seed`, `position`, `rotation`, `scale`, `autoStart: false` (start on a ScrollTrigger beat), `timeSeconds` to begin an ambient loop already populated so the first frame matches the poster.
- **Emission from a live mesh:** `instance.setEmissionGeometry(emitterId, geometry)` binds a `BufferGeometry` as the spawn surface of a `mesh` emitter (bind before the first `update`), then per event `setTransform` to the part's pose and `emitBurst(emitterId, { count })`. JAL use: dust leaving a surface as a part assembles.
- **Simulation space.** `world` (default) keeps spawn coordinates when the emitter moves (a trail); `local` makes motes travel with a moving object, and live transform edits carry existing particles. The mode is captured per particle at birth: restart the effect to apply a switch to all.
- **Lighting.** Particles are unlit unless the material shading is `lit` or the emitter sets `render.shading: "lit"`; lit particles take the scene's own lights, so they sit in the product's studio light. JAL default: `lit` for physical motes (dust, paper), unlit neutral ink only for tiny points. Editor `.scene` preview lighting is never imported; if a preview must be matched, `createThreeSceneLights(parseSceneDefinition(text))` returns a group with `update` and `dispose` (physical units, lights facing local -Z, Euler degrees in Y then X then Z, sRGB hex), retinted to neutral.
- **Blending without additive.** `blend: "alpha"`. A sprite texture without alpha sets `opacitySource` to `luminance` (or `inverseLuminance`, or one channel), the lawful replacement for additive sprites. `premultiplied` leaves the one-draw instanced path and costs draw calls. `render.texture: null` uses a shared cached procedural circle or square with `softness` 0 to 1: never dispose it.
- **Sorting and facing.** Translucent motes use `distanceFarFirst` (the instanced path re-sorts every frame); `oldestFirst` or `youngestFirst` suit flat layers. Any translucent instance turns depth writes off for the whole batch, so place it with `setRenderOrder`. `faceCamera` is the default alignment; `velocity` stretches streaks along motion; facing `cameraPosition` avoids edge-on cards near the lens.
- **Runtime diagnostics.** After `createEffect`, any entry in `vfx.stats` `missingTextureRefs`, `missingMaterialRefs`, `missingMeshRefs`, `unsupportedModules`, or `unsupportedFeatures` throws in dev and fails the QA smoke unless accepted in the ADR. Expose `activeParticles` and `visibleParticles` through `window.__immersive`. Importing `nixie-fx/three` must work with no `pixi.js` installed, and the simulation stops ticking after teardown.

### 8.4 Starting values (JAL-restrained)

- **One-shot burst** (a part snapping into place, a card landing): `rate` 0 with a constant-0 `rateValue`, one burst `{ time: 0, count, cycles: 1, interval: 0, probability: 1 }`, `loop: false`, so it completes and can be destroyed. 12 to 40 small dark motes, duration about 0.45 s, lifetime 0.2 to 0.5 s, cap about 64.
- **Soft puff:** a small burst plus a short continuous rate over about 1.25 s, lifetime 1.2 to 2.4 s, high `softness`, cap about 128.
- **Ambient loop:** rate about 10 to 20 per second, lifetime 0.5 to 1.2 s, curl noise under 0.2 units per second, no trails, cap about 180.
- All neutral dark ink with alpha blending, measured against the tier budget. The upstream templates' 90 to 1000 bright sparks are rejected on taste.
- A particle material taps at most 8 textures (main plus 7 node samplers); 6 or more taps are expensive under mobile overdraw: merge channels first.
- Keep one **stress effect** per project (many small particles, a burst storm, an atlas-textured variant) at the tier cap, and run the frame-time probe against it on a real GPU so the shipped effect has known headroom.

## 9. Rapier physics (approved, picked by JEV)

`@react-three/rapier` 2.2.0 (MIT) with `@dimforge/rapier3d-compat` 0.19.2 (Apache-2.0; the npm compat line is at 0.21.0, and rapier.js is archived and merged into `dimforge/rapier` under `typescript/`).

- **Status:** approved by Brian: `@react-three/rapier`, or `@dimforge/rapier3d-compat` in vanilla scenes, usable whenever JEV picks it. The WASM is served through Bun.build's `file` loader (a hashed `.wasm` under `/assets`, `application/wasm`) or inlined by the compat build, and the page carries the 3D CSP additions in `three-foundations.md` section 7.3 (`'wasm-unsafe-eval'`, `worker-src 'self' blob:`).
- **Use only when interaction is the message:** tossable product parts, a playful drop-in hero. Scroll stories never need physics: a timeline is deterministic and testable.
- **Engine ladder:** custom collision (below) for simple toys; Rapier (approved) for real rigid bodies; `cannon-es` (MIT, plain JS, no WASM chunk) is an approval candidate for small scenes where a WASM download is unacceptable; Jolt only for advanced needs; Ammo only when a project already uses it; Matter is 2D only.
- **Wiring:** `<Physics>` wraps bodies; `<RigidBody colliders="hull" | "cuboid" | "ball" | false>` generates colliders from child meshes or you declare them; `<InstancedRigidBodies>` gives one body per instance; `debug` draws colliders.
- **Timestep:** fixed 1/60 by default (`timeStep`), or `"vary"`. Fixed is more stable; interpolation smooths rendering between steps. `updateLoop="independent"` runs physics in its own rAF and calls `invalidate()` only while bodies are awake, pairing with `frameloop="demand"`. On a JAL page with the one-clock ticker, prefer the fixed step driven from the frame loop so there is still exactly one rAF owner **[verify]**.
- **Performance:** primitive colliders (cuboid, ball, capsule) over `hull` or `trimesh`; let bodies sleep; tens of dynamic bodies on mobile.
- **Bundle:** the compat build inlines the WASM as base64 (no static file, no MIME setup) at the cost of a large JS chunk; the npm package unpacks to about 15 MB across builds. Load it only through a dynamic `import()` on first interaction, and measure the chunk in the build script.
- **Reduced motion:** `paused`, and show the settled state.
- **Gotchas:** exactly one system copies body translation and rotation into meshes; CCD only on small fast bodies that actually tunnel; sensor colliders need active collision events or they report nothing; scripted movers are kinematic bodies moved through the body API, never by moving the mesh; bodies are removed on reset; friction, restitution, damping, and collision groups are named constants. Failure modes to test: variable-delta stepping, double transform sync, stale bodies after reset, tunnelling, silent sensors, a kinematic mesh moving while its body stays put. The perf report lists engine, body and collider counts, step, CCD bodies, and sensors.
- Lighter path when JEV does not pick Rapier: custom collision (sphere and plane tests in the fixed step) covers most site toys. A calm kernel (CPU or GPU): velocity += gravity times `dt`, position += velocity times `dt`, velocity times friction 0.95 to 0.98 per step, and on crossing the floor clamp the position and flip velocity scaled by restitution 0.2 to 0.4 (upstream 0.7 to 0.8 bounces visibly), ground friction about 0.9; walls clamp with `sign()` and reflect the same way. Runs in the one frame callback with `dt` clamped.
