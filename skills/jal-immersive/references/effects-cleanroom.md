# Clean-room effects: window rain, wet puddles, deformable sand or snow, wind grass, ocean, trees, touch frost, snowfall

These are JAL rebuilds of effects that the scottstts/Threejs-Awesome-Graphics-Agent-Skills pack (TAG) only ships under GPL-3.0, CC BY-NC-SA, no license, or an unverified "MIT by project rule". Every guide comes from three kinds of input: permissively licensed references (read in full), the physics or math itself (not copyrightable), and the one-paragraph descriptions in TAG's `SKILL.md` files (what the effect does, not how). The GPL, non-commercial, and unlicensed example source was never opened. All GLSL, TSL, and JS below is new code written for JAL. Treat each block as a sketch: check it on a real GPU before shipping.

Pool IDs (SKILL.md section 4.4) and where each guide lives:

| Pool ID | Section | Desktop / mobile GPU target | Reduced motion |
|---|---|---|---|
| `cr.window_rain` | 1 | 1.5 ms / 2 ms | freeze time, one still frame |
| `cr.wet_ground` | 2 | 3 ms with reflector / 1 ms env only | mirror-still puddles, no streaks |
| `cr.deform_sand_snow` | 3 | 0.8 ms / 0.5 ms | user-driven prints only, pre-baked trail |
| `cr.wind_grass` | 4 | 3 ms / 2.5 ms | frozen gust shape, push still answers input |
| `cr.ocean_snell` | 5 | 2.5 ms / 3 ms | still surface, 150 ms crossfade above to below |
| `cr.procedural_tree` | 8 | C2 / C2 (targets pending measurement) | wind frozen at a composed pose |
| `cr.touch_frost` | 9 | about 1 ms / 1.5 ms | static half-cleared pane |
| `cr.snowfall` | 10 | about 0.8 ms / 1 ms | settled cover as a still, no falling flakes |

How to run the sketches:

- Stack: Bun plus `Bun.build`. Import from `three/webgpu` and `three/tsl` for the WebGPU path (the WebGPURenderer falls back to WebGL2 for materials; compute and `StorageTexture` need the WebGPU backend), and from `three` for the classic WebGL2 path. Shader text: `import frag from './drops.frag' with { type: 'text' }`.
- `#include "jal-hash.glsl"` lines are not GLSL: concatenate the helper string in front of the shader at import time.
- GLSL sketches that declare `in vec2 vUv; out vec4 o;` run as `RawShaderMaterial` with `glslVersion: THREE.GLSL3` (declare precision, attributes, and uniforms yourself), or replace `o` with `gl_FragColor` under `ShaderMaterial`. Full-screen passes use the triangle setup in `shaders.md` section 11.
- These effects are Zone B (inside a canvas): natural light and shading, no bloom, glow, neon, additive sparkle, or purple and violet palettes. Tone mapping plus output is the only post. Specular highlights come from lighting and tone mapping, never from a bloom pass. The canvas is transparent over the page white where the scene does not fill it.
- Each effect needs the section's poster (a WebP rendered from the effect) as its no-WebGL, reduced-motion, and lowest-tier state.

---


## 0. License ledger (verified 2026-09-29)

From: Threejs-Awesome-Graphics-Agent-Skills `source_materials/README.md` (reviewed revisions) and `THIRD_PARTY_LICENSES.md` files, upstream license checks against the GitHub API, three.js docs and examples (MIT), skeeto/hash-prospector (Unlicense), JAL-authored helpers and runtime rules.

### 0.1 Items that must not be copied (verified)

| TAG item | Upstream | License found | Notes |
| --- | --- | --- | --- |
| `threejs-precipitation-surfaces/examples/wet-puddle-rain` + `Splash.png`, `road/` textures | Faraz-Portfolio/demo-2023-rain-puddle | GPL-3.0 (GitHub API) | Do not copy the code or assets. Rebuilt in section 2. |
| `threejs-procedural-materials/examples/deformable-sand` | scottstts/Sandboard | GPL-3.0 (GitHub API) | Do not copy. Rebuilt in section 3. |
| `threejs-temporal-surfaces/examples/refractive-window-rain` + `background.webp` | rocksdanister/rain | **CC BY-NC-SA 3.0** (`License.txt`), derived from BigWings "Heartfelt" (Shadertoy, CC BY-NC-SA 3.0) | It does have a license (an earlier digest wrongly said none), but it is non-commercial and share-alike, so it cannot go in client work. TAG's note says it "copied" the shader. Rebuilt in section 1. |
| `threejs-procedural-vegetation/examples/gpu-computed-grass` noise/FBM chunks | momentchan/r3f-gist | none detected | The grass repo itself (momentchan/r3f-procedural-grass) is MIT, but its `packages/r3f-gist` submodule has no license. Rebuilt in section 4 with our own noise. |
| `threejs-spectral-ocean/examples/submerged-snell-ocean` | scottstts/Pearl-Sea-Park | none detected (GitHub API `license: null`) | "MIT by project rule" is not a grant. Rebuilt in section 5. |
| `threejs-spectral-ocean/examples/stylized-above-below-ocean` + `foam.webp`, `sand.webp` | gioeledallapozza/FFTOCEAN | none detected | Same as above. Section 5. |
| `threejs-temporal-surfaces/examples/touch-history-frost` | takuma-hmng8/frozen | none detected ("MIT by project rule") | Idea reference only. Rebuilt in section 9. |
| hologram shell and shape transition (`threejs-procedural-vfx`) | YasirAwan4831/holographic-shader-visualizer-three.Js | none detected | Idea reference only; the hologram look is banned in Zone B anyway. The mesh sweep handover idea is in `shaders.md` section 16. |
| spectral ocean mechanisms (`threejs-spectral-ocean`) | owenyuwono/poseidon | none detected | Idea reference only. Section 5. |
| `example-gallery/.../deformable-sand/assets/coconut_tree.glb` | (asset in the Sandboard example) | GPL-3.0-only | Never ship the model. |
| diffraction-grating card art (`physical-diffraction-grating`) | TAG | "MIT by project rule" only | Idea reference only; the rainbow foil is banned in Zone B. |

Permissive TAG assets, usable with their notice if a project needs them: the LUT atmosphere data (MIT, Copyright 2025 Su) and the financial-tower stone textures (MIT, Copyright 2026 @alightinastorm).

TAG's own `.codex/AGENTS.md` tells its author to treat unlicensed sources as MIT, so TAG's top-level MIT file never proves that a single example is MIT. Check each source upstream. A later license check compares the same revision, so the reviewed commits (from TAG's `source_materials/README.md`, first 12 characters) are: demo-2023-rain-puddle `257066b63d08`, Sandboard `489cb01e81b1`, Pearl-Sea-Park `4fbf1f3df59a` (ocean intake; `888fc57b8175` for its geometry audits), FFTOCEAN `0fe3a908a861`, poseidon `caddf773c7e2`, frozen `15a98a510495`, holographic-shader-visualizer `34810a6e09d0`, r3f-procedural-grass `e441d2bd4eac` (its `r3f-gist` submodule pinned separately), SnowSystemThreeJS `c7a3bfbd10c9`, ez-tree `48dc19351513`, three-geospatial `b012ad06d858`, N8python/diamonds `69b30cc55861`, inkwell-webgpu-flowers `88fdb50d74fa`, VegetationGeneratorThreeJS `f6c26004c076`. TAG records no revision for rocksdanister/rain (GitHub reports `NOASSERTION`; the CC BY-NC-SA finding above stands). Re-check the license when a source moves past its recorded commit.

### 0.2 Found while researching (also do not copy)

| Source | License | Action |
| --- | --- | --- |
| The Book of Shaders (patriciogonzalezvivo/thebookofshaders) | "All rights reserved", no use in any project | Link to it for learning only. Never copy its code or text. |
| Codrops `RainEffect` (Lucas Bebber, 2015) | Its own README says you may build on it in personal or commercial work but not republish "as-is". Codrops' current default is MIT "if not specifically mentioned otherwise", and this repo does say otherwise. | Treat as an idea reference only. |
| Shadertoy | CC BY-NC-SA 3.0 unless the author says otherwise | Never copy. |
| SimonDev `Quick_Grass` `public/shaders/noise.glsl` | Repo is MIT, but the file says "Virtually all of these were taken from" a Shadertoy link | Use the MIT repo for its *structure* (vertex layout, LOD, wind) only. Do not copy `noise.glsl`. |
| evanw/webgl-water | no license file. jeantimex/threejs-water (MIT) relicenses "Original work Copyright (c) 2011 Evan Wallace" | Caution: TAG's `interactive-pool-volume` inherits this. Use the three.js GPGPU water examples instead. |
| GPU Gems (NVIDIA, free online) | Book text © NVIDIA/Addison-Wesley, and there is no open license on the pages | Ideas and math only. Don't copy listings. |

### 0.3 Permissive sources used

| Source | License (verified) | URL |
| --- | --- | --- |
| three.js core, TSL, examples | MIT (`LICENSE`, © 2010-2026 three.js authors) | https://github.com/mrdoob/three.js |
| three.js `webgpu_compute_water`, `webgl_gpgpu_water` (height-field waves) | MIT | https://threejs.org/examples/webgpu_compute_water.html |
| three.js `webgpu_compute_particles_rain` (top-down collision RT, instanced ripples) | MIT | https://threejs.org/examples/webgpu_compute_particles_rain.html |
| three.js `webgpu_reflection` (`reflector()` with normal-offset UV) | MIT | https://threejs.org/examples/webgpu_reflection.html |
| three.js `webgpu_refraction`, `webgpu_backdrop_water` (`viewportSharedTexture`, depth-aware refraction) | MIT | https://threejs.org/examples/webgpu_backdrop_water.html |
| three.js `webgpu_compute_texture_pingpong` (StorageTexture ping-pong) | MIT | https://threejs.org/examples/webgpu_compute_texture_pingpong.html |
| three.js `GPUComputationRenderer`, `DecalGeometry`, `Water.js` (jbouny, MIT) | MIT | `examples/jsm/misc/`, `examples/jsm/geometries/`, `examples/jsm/objects/` |
| pmndrs/drei (`MeshReflectorMaterial`, `useFBO`, `Instances`) | MIT | https://github.com/pmndrs/drei |
| pmndrs/react-three-fiber | MIT | https://github.com/pmndrs/react-three-fiber |
| pmndrs/maath (damping, easing, random) | MIT (`package.json`); direct import is an approval candidate, ask Brian (`THREE.MathUtils.damp` covers these recipes) | https://github.com/pmndrs/maath |
| pmndrs/postprocessing | Zlib (permissive); not used here (tone mapping is the only post), approval candidate, ask Brian | https://github.com/pmndrs/postprocessing |
| gkjohnson/three-mesh-bvh (fast raycasts for footprints, pointer trails) | MIT; direct import is an approval candidate, ask Brian | https://github.com/gkjohnson/three-mesh-bvh |
| simondevyoutube/Quick_Grass (structure only, not `noise.glsl`) | MIT | https://github.com/simondevyoutube/Quick_Grass |
| momentchan/r3f-procedural-grass (top-level repo only, no submodule) | MIT | https://github.com/momentchan/r3f-procedural-grass |
| achrefelouafi/SnowSystemThreeJS (snow accumulation, capping) | MIT | https://github.com/achrefelouafi/SnowSystemThreeJS |
| stegu/webgl-noise (simplex/classic noise, if value noise is not enough) | MIT | https://github.com/stegu/webgl-noise |
| skeeto/hash-prospector (`lowbias32` integer hash used below) | Unlicense (public domain) | https://github.com/skeeto/hash-prospector |
| webgl2fundamentals (render-to-texture, ping-pong articles) | BSD-3-Clause | https://github.com/gfxfundamentals/webgl2-fundamentals |
| Inigo Quilez articles | Site says code snippets are MIT and the shader *art* is protected | https://iquilezles.org/articles/ (central-difference normals: `/articles/normalsSDF/`) |
| CodePen public pens | MIT by CodePen's terms | https://blog.codepen.io/documentation/licensing/ |
| dgreenheck/ez-tree (growth tables, leaf cards) | MIT | https://github.com/dgreenheck/ez-tree |
| takram-design-engineering/three-geospatial (atmosphere and cloud reference) | MIT | https://github.com/takram-design-engineering/three-geospatial |
| N8python/diamonds (BVH gem refraction reference) | MIT | https://github.com/N8python/diamonds |
| siliconjungle/inkwell-webgpu-flowers (flower field, far-LOD identity) and its painted atlases | MIT (GitHub API; atlas notice "James and Inkwell contributors") | https://github.com/siliconjungle/inkwell-webgpu-flowers |
| achrefelouafi/VegetationGeneratorThreeJS (surface ivy, petiole-hinge wind) | MIT (GitHub API) | https://github.com/achrefelouafi/VegetationGeneratorThreeJS |
| AmbientCG textures, Poly Haven HDRIs | CC0 | self-host under `/vendor`, never hotlink |

CC-BY assets (many Sketchfab scans) need visible attribution: dev only unless the client accepts the credit line.

Idea-only references (read for concepts, no code taken): Sébastien Lagarde, "Water drop 3b: physically based wet surfaces" (blog, 2013), https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/ ; GPU Gems 1 ch. 1 (Gerstner waves) and ch. 7 "Rendering Countless Blades of Waving Grass", https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass ; J. Tessendorf, "Simulating Ocean Water" (SIGGRAPH course notes); Musgrave, Kolb, Mace, "The Synthesis and Rendering of Eroded Fractal Terrains" (SIGGRAPH 1989, thermal erosion); C. Barré-Brisebois, "Deformable Snow Rendering in Batman: Arkham Origins" (GDC 2014); E. Wohllaib, "Procedural Grass in Ghost of Tsushima" (GDC 2021). Talks and papers are cited by title only, because stable URLs were not confirmed.

### 0.4 Shared helpers (written for JAL)

```glsl
// jal-hash.glsl  (WebGL2 / GLSL ES 3.00). lowbias32 constants from skeeto/hash-prospector (Unlicense).
uint lowbias32(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16; return x;
}
float hash21(ivec2 c) { return float(lowbias32(uint(c.x) + lowbias32(uint(c.y)))) * (1.0 / 4294967296.0); }
vec3  hash32(ivec2 c) {
  uint h = lowbias32(uint(c.x) + lowbias32(uint(c.y)));
  return vec3(h, lowbias32(h), lowbias32(h ^ 0x9e3779b9u)) * (1.0 / 4294967296.0);
}
float vnoise(vec2 p) {                      // value noise, C1 smooth, range 0..1
  ivec2 i = ivec2(floor(p)); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + ivec2(1, 0)), c = hash21(i + ivec2(0, 1)), d = hash21(i + ivec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
```

On the TSL side, use the built-ins, which are all MIT and ship with three. `hash(seed)` returns 0..1 (a PCG variant, and the seed is converted to uint, so keep seeds positive). `mx_noise_float(vec3)` is signed Perlin noise, and `mx_fractal_noise_float` is FBM. Other built-ins used here: `rotate`, `refract`, `reflect`, `textureLevel`, `storageTexture`, `textureStore`, `instancedArray`, `reflector`, `viewportSharedTexture`, `bumpMap`, `transformNormalToView` (takes an object-space normal). Each one was checked to exist in `three/src/nodes` on the `dev` branch.

```js
// jal-cell-hash.js: stable positive seed for an integer cell in TSL
import { hash } from 'three/tsl';
export const cellHash = (cid, salt = 0) => hash(cid.x.add(4096).mul(8192).add(cid.y.add(4096)).add(salt * 104729));
```

**Weather state.** Rain, snow, and their surfaces read one uniforms object passed by reference: time, a horizontal wind vector in world units per second, and a progress value damped toward its target with `MathUtils.damp(progress, target, 0.9, dt)`. Particles and ground materials never keep their own clocks or wind; the debug view reports whether both read the same object.

Shared runtime rules for every effect:
- Cap DPR with the pixel-budget formula (`performance.md` section 2): `dpr = clamp(sqrt(budgetPx / cssPx), 1, maxDpr)`. Budgets are 1.65 MP desktop (max 1.5) and 1.0 MP mobile (max 1.25).
- Pause the loop when the canvas is off-screen (IntersectionObserver) or the tab is hidden (`visibilitychange`).
- Watch reduced motion live. Every section below says what "reduced" means for that effect.
- Decide per effect whether its state is analytic in time (compute it, allocate nothing) or depends on input history (allocate a ping-pong target). Never fake history with time-driven noise, and never keep a history buffer for an effect whose whole state is a function of time.

```js
const rm = matchMedia('(prefers-reduced-motion: reduce)');
export let reduced = rm.matches;
rm.addEventListener('change', (e) => { reduced = e.matches; onMotionPrefChange(reduced); });
```

---

## 1. Rain drops refracting on a window

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-temporal-surfaces` description and reference text (MIT text; the CC BY-NC-SA example was not opened, ideas only), three.js docs and examples (MIT), webgl2fundamentals (BSD-3), skeeto/hash-prospector (Unlicense), optics (Snell, Fresnel), JAL-authored code and budgets.

### Visual goal
You look through a pane of glass at a daylight scene. The glass is lightly fogged, so the background is softly blurred. Water drops of many sizes sit on the glass. Each drop is a tiny convex lens that shows a sharp, inverted, shrunken view of the scene behind it. Drops have a thin darker rim and a small soft highlight. Now and then a large drop gets heavy, stutters, and slides down. It leaves a clear trail through the fog and a line of tiny drops behind it. Fog slowly grows back.

### Algorithm

Render targets:
- `sceneRT`: the 3D scene (or a static photo) at full res, with a mip chain (`generateMipmaps: true`, `minFilter: LinearMipmapLinearFilter`). Mips give a cheap blur. For better quality, use a 2-pass separable Gaussian at 1/4 res into `blurRT`. three's `GaussianBlurNode` does this in TSL.
- `dropRT`: R16F at 0.5x canvas res. R holds drop height (a lens-thickness proxy).
- `fogA/fogB`: R8 or R16F at 0.25x res, ping-pong. 1 means fogged, 0 means wiped.

Passes per frame:
1. **Static drop layer** (fullscreen quad writes `dropRT.r`). Procedural cells, no state. Split the window into a grid. Per cell, a hash gives a jittered centre `c`, a radius `r` (skewed small: `mix(rMin, rMax, u^2)`) and a life phase. The height of a spherical cap is `h(d) = sqrt(max(0, r² − d²))`. Use two layers (about 24 and 60 cells across the width) and combine them with `max`.
2. **Sliding drops** (a CPU simulation of 16 to 64 drops, drawn as instanced quads into `dropRT` with `blendEquation: MaxEquation`, so overlapping drops merge without getting brighter). Each quad writes the same cap profile. Trail droplets come from a ring buffer of small caps that fade over 3 to 6 s.
3. **Fog update** (fog ping-pong): `fog = min(1, fog + dt / regrowSeconds)`. Then multiply by `1 − wipe`, where `wipe` is the capsule distance from each slider's previous position to its current one, with radius about `1.2 r`.
4. **Composite** (fullscreen, or on a window mesh):
   - Normal from the height field by central differences: `n = normalize(vec3(−∂h/∂x, −∂h/∂y, k))`. `k` (0.05 to 0.12) sets how domed the drops look. For a single cap, the exact normal is `(p − c, h) / r`. Finite differences handle merged drops for free.
   - Refraction at the air-water interface follows Snell's law, `n₁ sin θ₁ = n₂ sin θ₂`. With view ray `I = (0,0,−1)` and `η = 1/1.333`, `T = refract(I, n, η)`. For `η < 1`, `T.xy` points *against* `n.xy`, so a pixel on the right edge of a drop samples the scene to its left. That is what makes the image look inverted. The UV offset is `T.xy · s · (h + h₀)`, with `s` around 0.25 to 0.45.
   - Colour: `base = mix(sharp(uv), blurred(uv), fog·0.85)`. Under a drop (`cover = smoothstep(0, 0.02, h)`) use `sharp(uv + offset)` with no fog, since a drop wipes the fog under it.
   - Rim: darken by `0.35 · smoothstep(0.3, 0.9, 1 − n.z)`, because the steep edge refracts light from outside the frame.
   - Highlight: Blinn/Phong against one soft key light, `pow(max(reflect(−L, n).z, 0), 80) · 0.6`, plus Schlick Fresnel `F = 0.02 + 0.98 (1 − n.z)^5` as a faint sheen. Tone mapping handles the rest. No bloom.

Sliding-drop simulation (window UV units, y up, and remember to multiply x distances by the aspect ratio):
- A drop only slides when `r > R_SLIDE`, standing in for gravity beating surface tension.
- Acceleration is `G · (r / R_SLIDE − 1)`, clamped to `VMAX`. A random "stick" event (rate `STICK` per second) zeroes the velocity for 0.1 to 0.7 s. That stop-start motion is what makes it read as water.
- Lateral wander is `x += (rand − 0.5) · WANDER · vy · dt`.
- Mass loss to the trail is `r *= 1 − LOSS · vy · dt`. Spawn a trail droplet (`0.25 r` to `0.35 r`) every `0.6 r` of travel.
- Merging conserves volume: `r = cbrt(r₁³ + r₂³)`, and the smaller drop respawns above the top edge. O(N²) is fine for N ≤ 64.

Refinements (ideas only): one `amount` control blends the layers in (static layer first, moving layers as it rises); derive the refraction offset from differences of the combined coverage so optics match the drops; cap the blur loop at a compile-time maximum and break at a runtime quality count; wrap shader time every few hours so precision never erodes the cell animation; fit a photo background by scaling one UV axis around 0.5 so it fills without stretching.

### GLSL sketch (WebGL2)

```glsl
// drops-static.frag : writes dropRT.r
#include "jal-hash.glsl"
uniform float uTime, uAspect;
in vec2 vUv; out vec4 o;
float capLayer(vec2 uv, float cells, float seed) {
  vec2 p = uv * vec2(uAspect, 1.0) * cells;
  ivec2 id = ivec2(floor(p)) + ivec2(int(seed) * 7919, 0);
  vec2 f = fract(p) - 0.5;
  vec3 r = hash32(id);
  vec2 c = (r.xy - 0.5) * 0.6;
  float radius = mix(0.08, 0.30, r.z * r.z);                 // cell units
  float life = fract(uTime * 0.04 + r.x * 7.0);              // ~25 s cycle
  float fade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.85, 1.0, life));
  float d = length(f - c);
  return sqrt(max(0.0, radius * radius - d * d)) * fade / cells;   // height in uv units
}
void main() { o = vec4(max(capLayer(vUv, 24.0, 1.0), capLayer(vUv, 60.0, 2.0)), 0, 0, 1); }
```

```glsl
// drops-composite.frag
uniform sampler2D uScene, uDrops, uFog;
uniform vec2 uTexel;            // 1 / dropRT size
uniform float uRefract;         // 0.35
uniform float uNormalZ;         // 0.004 (height is in uv units, so k is small)
uniform float uBlurLod;         // 4.0
uniform vec3  uL;               // key light, view space, normalized
in vec2 vUv; out vec4 o;
float H(vec2 p) { return texture(uDrops, p).r; }
void main() {
  float h  = H(vUv);
  float hx = H(vUv + vec2(uTexel.x, 0)) - H(vUv - vec2(uTexel.x, 0));
  float hy = H(vUv + vec2(0, uTexel.y)) - H(vUv - vec2(0, uTexel.y));
  vec3 n = normalize(vec3(-hx, -hy, uNormalZ));
  float cover = smoothstep(0.0, 0.0015, h);
  vec3 T = refract(vec3(0, 0, -1), n, 1.0 / 1.333);
  vec2 off = T.xy * uRefract * (h * 40.0 + 0.2);
  float fog = texture(uFog, vUv).r;
  vec3 base  = mix(textureLod(uScene, vUv, 0.0).rgb, textureLod(uScene, vUv, uBlurLod).rgb, fog * 0.85);
  vec3 sharp = textureLod(uScene, vUv + off, 0.0).rgb;
  vec3 col = mix(base, sharp, cover);
  col *= 1.0 - 0.35 * cover * smoothstep(0.3, 0.9, 1.0 - n.z);
  float spec = pow(max(reflect(-uL, n).z, 0.0), 80.0);
  float F = 0.02 + 0.98 * pow(1.0 - n.z, 5.0);
  col += cover * (spec * 0.6 + F * 0.12);
  o = vec4(col, 1.0);
}
```

### TSL sketch (WebGPU, falls back to WebGL2)

```js
import * as THREE from 'three/webgpu';
import { Fn, texture, textureLevel, uniform, uv, vec2, vec3, normalize, refract, reflect, max, pow, mix, smoothstep } from 'three/tsl';

export function windowRainMaterial({ sceneTex, dropTex, fogTex, w, h }) {
  const texel = uniform(new THREE.Vector2(1 / w, 1 / h));
  const uRefract = uniform(0.35), uNormalZ = uniform(0.004), uBlurLod = uniform(4);
  const L = normalize(vec3(-0.4, 0.6, 0.7));
  const H = (p) => texture(dropTex, p).r;

  const color = Fn(() => {
    const p = uv();
    const hC = H(p);
    const hx = H(p.add(vec2(texel.x, 0))).sub(H(p.sub(vec2(texel.x, 0))));
    const hy = H(p.add(vec2(0, texel.y))).sub(H(p.sub(vec2(0, texel.y))));
    const n = normalize(vec3(hx.negate(), hy.negate(), uNormalZ));
    const cover = smoothstep(0, 0.0015, hC);
    const T = refract(vec3(0, 0, -1), n, 1 / 1.333);
    const off = T.xy.mul(uRefract).mul(hC.mul(40).add(0.2));
    const fog = texture(fogTex, p).r;
    const base = mix(textureLevel(sceneTex, p, 0).rgb, textureLevel(sceneTex, p, uBlurLod).rgb, fog.mul(0.85));
    const sharp = textureLevel(sceneTex, p.add(off), 0).rgb;
    const rim = smoothstep(0.3, 0.9, n.z.oneMinus()).mul(cover).mul(0.35);
    const spec = pow(max(reflect(L.negate(), n).z, 0), 80);
    const F = pow(n.z.oneMinus(), 5).mul(0.98).add(0.02);
    return mix(base, sharp, cover).mul(rim.oneMinus()).add(cover.mul(spec.mul(0.6).add(F.mul(0.12))));
  });

  const mat = new THREE.MeshBasicNodeMaterial();
  mat.colorNode = color();
  return { mat, uniforms: { uRefract, uNormalZ, uBlurLod } };
}
// Glass pane inside a 3D scene instead of a fullscreen pass: use viewportSharedTexture(screenUV.add(off))
// as backdropNode, following three's webgpu_refraction example (MIT).
```

```js
// sliders.js: CPU simulation, uploaded as instance attributes (x, y, r, fade) each frame
const P = { R_SLIDE: 0.012, G: 0.6, VMAX: 0.45, STICK: 1.5, WANDER: 0.25, LOSS: 0.4 };
const spawn = (d = {}) => Object.assign(d, { x: Math.random(), y: 1.05 + Math.random() * 0.3,
  r: 0.004 + Math.random() ** 3 * 0.018, vy: 0, hold: Math.random() * 2, px: 0, py: 0, trailAcc: 0 });
export function stepSliders(drops, trail, dt, aspect) {
  for (const d of drops) {
    d.px = d.x; d.py = d.y; d.hold -= dt;
    if (d.r > P.R_SLIDE && d.hold <= 0) {
      d.vy = Math.min(d.vy + P.G * (d.r / P.R_SLIDE - 1) * dt, P.VMAX);
      if (Math.random() < P.STICK * dt) { d.hold = 0.1 + Math.random() * 0.6; d.vy = 0; }
    }
    const dy = d.vy * dt;
    d.y -= dy; d.x += (Math.random() - 0.5) * P.WANDER * dy;
    d.r *= 1 - P.LOSS * dy;
    if ((d.trailAcc += dy) > 0.6 * d.r) { d.trailAcc = 0; trail.push({ x: d.x, y: d.y + d.r, r: d.r * (0.25 + Math.random() * 0.1), age: 0 }); }
    if (d.y < -0.05) spawn(d);
  }
  for (let i = 0; i < drops.length; i++) for (let j = i + 1; j < drops.length; j++) {
    const a = drops[i], b = drops[j];
    if (Math.hypot((a.x - b.x) * aspect, a.y - b.y) < (a.r + b.r) * 0.8) {
      const [big, small] = a.r >= b.r ? [a, b] : [b, a];
      big.r = Math.cbrt(big.r ** 3 + small.r ** 3); spawn(small);
    }
  }
}
```

### Parameters

| Param | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| dropRT scale | 0.5x | 0.33x | R16F |
| static layers | 2 (24, 60 cells) | 1 (32 cells) | |
| sliders | 48 | 12 | CPU cost is trivial |
| trail ring buffer | 256 | 64 | fade over 3 to 6 s |
| fogRT | 0.25x, regrow 8 s | off (constant fog 0.7) | |
| refract strength `s` | 0.35 | 0.3 | 0.25 to 0.45 |
| normal k | 0.004 (uv-height units) | same | bigger means flatter drops |
| blur | Gaussian at 1/4 res, sigma 6 | mip LOD 4 | |
| IOR | 1.333 | same | |

### Performance budget
- Desktop target is at most 1.5 ms GPU at 1.65 MP. That is one fullscreen composite (about 7 fetches), one half-res static pass, instanced sliders (one draw), and a quarter-res fog pass. Draw calls: 4 to 5.
- Mobile target is at most 2 ms at 1.0 MP. Use a third-res drop map, one static layer, 12 sliders, no fog ping-pong, and mip blur.
- If the background is a still photo, render `sceneRT` once and blur it once. Then the per-frame cost is only the drop map plus the composite.

### Mobile fallback
Use a single static layer plus sliders, and treat the background as one pre-blurred texture (a KTX2 image with a blurred copy baked offline). Under the lowest tier, show a still WebP poster made from the effect, with no canvas.

### prefers-reduced-motion
Freeze `uTime`, stop the slider simulation, and draw one frame (static drops, still fog). Re-render only on resize. There is no sliding, no life-cycle fade, and no fog regrowth. When the preference flips back, resume from the frozen state rather than jumping.

### Sources
three.js MIT (`refract`, `textureLevel`, `viewportSharedTexture` pattern from `webgpu_refraction.html`, `GaussianBlurNode`). webgl2fundamentals BSD-3 (render-to-texture). skeeto/hash-prospector Unlicense (hash). Snell's law, Fresnel and Schlick are physics. The effect description came from TAG's `threejs-temporal-surfaces/SKILL.md` (one paragraph: layered static and travelling droplets, optical normals, background refraction, blur). No code from rocksdanister/rain, Heartfelt, or Codrops RainEffect was opened.

---

## 2. Wet ground: puddles, ripple rings, reflections, rain

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-precipitation-surfaces` and `threejs-procedural-materials` reference text (MIT text; the GPL puddle example was not opened, ideas only), three.js docs and examples (MIT), drei (MIT), IQ articles (MIT snippets), Lagarde (ideas only), JAL-authored code and budgets.

### Visual goal
Daylight after rain, or light rain. Asphalt or stone gets darker and glossier as it gets wet. Low spots fill into mirror-like puddles that reflect the sky and buildings. Rain drops make expanding ring ripples, but only inside standing water. Faint rain streaks fall and tiny splash rings appear on surfaces facing up. Keep it neutral: grey asphalt, a pale sky reflection, no neon night-city look.

### Algorithm

1. **Wetness model** (per-pixel, in the ground material). This follows Lagarde's physically based wet-surface reasoning (ideas only):
   - `wet ∈ [0,1]` from rain progress. Porous surfaces darken because water fills their pores: `albedo *= mix(1, 0.5, wet · porosity)`, with `porosity` 0.6 to 0.8 for asphalt and 0.2 for polished stone.
   - Roughness drops as wetness rises: `rough = mix(rough, 0.1, wet)`.
   - Stage wetness in two bands of one progress value: darkening and roughness drop over `smoothstep(0, 0.75, rain)`, puddle mask and ripple normals only over `smoothstep(0.75, 1, rain)`, so the ground reads damp before flooded. Keep the ripple normal separate from the base normal until the final blend.
   - Mixed ground (soil and grass, rock and snow) takes its blend from the world-normal up component raised to about 1.5, so flats take cover and slopes stay bare. The same blend feeds colour and roughness, and wetness near a water line lowers roughness and darkens colour together.
2. **Puddle mask** from a ground height signal (a height texture channel or `fbm(xz · 0.35)`): `puddle = smoothstep(level − 0.04, level + 0.04, 1 − height)`. `level` rises from 0.2 to 0.55 as rain accumulates. Inside a puddle the water surface is flat, so blend the base normal toward up (`n = normalize(mix(nBase, up, puddle))`), set roughness to 0.02 and F0 to 0.02.
3. **Ripple rings** (analytic, no simulation, good for ambient rain):
   - Tile world xz into cells of `S` metres. Per cell (and its 3x3 neighbours, so rings can cross cell borders), a hash gives a centre `c`, a phase offset, and an "active" roll against rain intensity.
   - Local life is `φ = fract(t / P + rand)`. Ring radius is `R = φ · Rmax`, with `Rmax` about 1.2 cells.
   - Height is `h = A · sin(k (d − R)) · e(d)`, with envelope `e = exp(−(d − R)² / w²) · (1 − φ)²`.
   - Gradient: `∇h ≈ A · k · cos(k (d − R)) · e · (p − c) / d` (drop the small envelope-derivative term). Convert from cell units to metres by dividing by `S`. Sum 2 layers with different `S`, `P` and phase.
   - Normal: `n = normalize(vec3(−∇h.x, 1, −∇h.y))` in world space (y up). Multiply the ripple strength by `puddle · rainIntensity`.
4. **Interactive ripples** (optional, for footsteps or a pointer in a puddle). Use a height-field wave equation on a grid, as three.js `webgpu_compute_water` / `webgl_gpgpu_water` (MIT) do:
   - Discrete wave equation `h(t+1) = 2h − h(t−1) + λ² Σ(neighbours − h)`, with `λ = c·dt/dx`. Choosing `λ² = 1/2` simplifies it to `h(t+1) = ½ Σ₄ neighbours − h(t−1)`. That is stable, since explicit 2D needs `λ ≤ 1/√2`.
   - Multiply by damping 0.96 to 0.99 per step.
   - Inject a drop or footstep as a negative Gaussian: `h −= amp · exp(−|x − x₀|² / r²)`.
   - Normal from central differences: `n = normalize(vec3(h_W − h_E, 2·dx, h_S − h_N))` (IQ's normals article, MIT snippets).
   - A 256² grid over the visible puddle area is plenty.
5. **Reflection** (choose by tier):
   - Desktop: a planar reflector. In TSL, `reflector({ resolutionScale: 0.5 })` with `reflection.uvNode = reflection.uvNode.add(rippleN.xz.mul(0.04))`, as in three's `webgpu_reflection` example. In R3F, drei `MeshReflectorMaterial` with `resolution 512`, `mixStrength ~1.5`, `blur [200, 80]`, `mixBlur 0.6` and a `distortionMap`.
   - Blend with Schlick Fresnel `F = F0 + (1 − F0)(1 − N·V)^5`, F0 = 0.02, masked by `puddle`. Put it in `emissiveNode` so scene lights don't light it a second time.
   - Mobile: no extra render. Use the PMREM environment (RoomEnvironment or a daylight HDRI) through low roughness, and let the ripple normal distort the env lookup.
   - SSR (three `SSRNode`, MIT) is desktop-only and optional.
6. **Rain streaks and splashes**. Follow the three.js `webgpu_compute_particles_rain` layout (MIT), but restyle it for daylight:
   - Streaks: instanced camera-facing quads (0.01 × 0.5 m), alpha 0.12 to 0.2, normal alpha blend (not additive), light grey `#dfe3e6`, recycled when they hit the ground.
   - Ground height lookup: a top-down orthographic "collision" camera renders `positionWorld` of the collision layer into a 512² or 1024² half-float RT. Particles read `.y` at their xz, so splashes land on car roofs and benches too.
   - Splash: an instanced flat quad whose alpha is a thin expanding ring, with a life of 0.3 s. That replaces the GPL splash flipbook.
   - Splash placement without a collision render: sample ground and props with three's `MeshSurfaceSampler` (MIT) using a weight attribute that is 1 on up-facing triangles and 0 elsewhere, so splashes never land on undersides or hidden faces.

### GLSL sketch (ground fragment additions)

```glsl
#include "jal-hash.glsl"
uniform float uTime, uRain, uWet, uLevel;   // uRain 0..1 intensity, uWet 0..1, uLevel 0.2..0.55
uniform sampler2D uReflection;              // planar reflection RT (projective uv from vertex)
in vec3 vWorldPos; in vec4 vReflUv;

vec2 rippleGrad(vec2 xz, float S, float P, float seed) {
  vec2 p = xz / S; ivec2 id = ivec2(floor(p)); vec2 g = vec2(0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    ivec2 cid = id + ivec2(i, j);
    vec3 r = hash32(cid + ivec2(int(seed) * 7919, 0));
    float on = step(r.z, uRain);                             // fewer rings in light rain
    vec2 c = vec2(cid) + 0.5 + (r.xy - 0.5) * 0.8;
    float ph = fract(uTime / P + r.z * 13.1);
    float R = ph * 1.2;
    vec2 dv = p - c; float d = length(dv) + 1e-4;
    float x = d - R;
    float env = exp(-x * x / 0.012) * (1.0 - ph) * (1.0 - ph);
    g += on * 32.0 * cos(32.0 * x) * env * dv / d;         // k = 32 per cell
  }
  return g / S;                                              // per metre
}

// inside main(), after base albedo/rough/normal are known:
float height = fbm(vWorldPos.xz * 0.35);
float puddle = smoothstep(uLevel - 0.04, uLevel + 0.04, 1.0 - height);
float wet = clamp(uWet + puddle, 0.0, 1.0);
albedo *= mix(1.0, 0.5, wet * 0.7);
rough = mix(mix(rough, 0.1, wet), 0.02, puddle);
vec2 grad = rippleGrad(vWorldPos.xz, 0.35, 1.1, 1.0) + 0.6 * rippleGrad(vWorldPos.xz + 17.3, 0.22, 0.8, 2.0);
float A = 0.0025 * uRain * puddle;                           // metres
vec3 N = normalize(mix(nBase, vec3(0, 1, 0), puddle));
N = normalize(N + vec3(-A * grad.x, 0.0, -A * grad.y));
vec3 V = normalize(cameraPosition - vWorldPos);
float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
vec2 ruv = vReflUv.xy / vReflUv.w + N.xz * 0.04;
vec3 refl = texture(uReflection, ruv).rgb;
emissive += refl * F * puddle;
```

```glsl
// wave-step.frag : interactive puddle (ping-pong uCurr=h(t), uPrev=h(t-1))
uniform sampler2D uCurr, uPrev; uniform vec2 uTexel; uniform float uDamp;   // 0.985
uniform vec4 uDrops[8]; uniform int uDropCount;                               // xy uv, z radius uv, w amp
in vec2 vUv; out vec4 o;
void main() {
  float n = texture(uCurr, vUv + vec2(uTexel.x, 0)).r + texture(uCurr, vUv - vec2(uTexel.x, 0)).r
          + texture(uCurr, vUv + vec2(0, uTexel.y)).r + texture(uCurr, vUv - vec2(0, uTexel.y)).r;
  float h = (0.5 * n - texture(uPrev, vUv).r) * uDamp;
  for (int i = 0; i < 8; i++) { if (i >= uDropCount) break;
    vec2 d = vUv - uDrops[i].xy; h -= uDrops[i].w * exp(-dot(d, d) / (uDrops[i].z * uDrops[i].z)); }
  o = vec4(h, 0, 0, 1);
}
```

### TSL sketch

```js
import * as THREE from 'three/webgpu';
import { Fn, uniform, positionWorld, cameraPosition, vec2, vec3, float, floor, fract, length, exp, cos, step,
  normalize, mix, smoothstep, pow, max, dot, reflector, mx_fractal_noise_float, transformNormalToView } from 'three/tsl';
import { cellHash } from './jal-cell-hash.js';

export function wetGround({ albedoNode, baseRough = 0.8, scene }) {
  const uTime = uniform(0), uRain = uniform(0.6), uWet = uniform(0.7), uLevel = uniform(0.45);

  const rippleGrad = (xz, S, P, salt) => {
    const p = xz.div(S), id = floor(p);
    let g = vec2(0);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {   // unrolled at graph build time
      const cid = id.add(vec2(i, j));
      const rx = cellHash(cid, salt), ry = cellHash(cid, salt + 1), rz = cellHash(cid, salt + 2);
      const on = step(rz, uRain);
      const c = cid.add(0.5).add(vec2(rx, ry).sub(0.5).mul(0.8));
      const ph = fract(uTime.div(P).add(rz.mul(13.1)));
      const dv = p.sub(c), d = length(dv).add(1e-4), x = d.sub(ph.mul(1.2));
      const env = exp(x.mul(x).div(-0.012)).mul(ph.oneMinus().mul(ph.oneMinus()));
      g = g.add(dv.div(d).mul(cos(x.mul(32)).mul(32).mul(env).mul(on)));
    }
    return g.div(S);
  };

  const xz = positionWorld.xz;
  const height = mx_fractal_noise_float(vec3(xz.mul(0.35), 0)).mul(0.5).add(0.5);
  const puddle = smoothstep(uLevel.sub(0.04), uLevel.add(0.04), height.oneMinus());
  const wet = uWet.add(puddle).clamp(0, 1);
  const grad = rippleGrad(xz, 0.35, 1.1, 10).add(rippleGrad(xz.add(17.3), 0.22, 0.8, 20).mul(0.6));
  const A = uRain.mul(0.0025).mul(puddle);
  const nWorld = normalize(vec3(grad.x.mul(A).negate(), 1, grad.y.mul(A).negate()));

  const refl = reflector({ resolutionScale: 0.5 });
  refl.target.rotateX(-Math.PI / 2); scene.add(refl.target);
  refl.uvNode = refl.uvNode.add(nWorld.xz.mul(0.04));

  const V = normalize(cameraPosition.sub(positionWorld));
  const F = pow(max(dot(nWorld, V), 0).oneMinus(), 5).mul(0.98).add(0.02);

  const mat = new THREE.MeshStandardNodeMaterial();
  mat.colorNode = albedoNode.mul(mix(1, 0.5, wet.mul(0.7)));
  mat.roughnessNode = mix(mix(float(baseRough), 0.1, wet), 0.02, puddle);
  // Ground plane geometry pre-rotated so local y = world up; normalNode wants view space.
  mat.normalNode = transformNormalToView(nWorld);
  mat.emissiveNode = refl.rgb.mul(F).mul(puddle);
  return { mat, uniforms: { uTime, uRain, uWet, uLevel } };
}
```

R3F: `<MeshReflectorMaterial resolution={512} mixStrength={1.5} blur={[200, 80]} mixBlur={0.6} mirror={0.5} distortion={0.3} distortionMap={rippleTex} />` (drei, MIT). Bake the analytic ripples into a small 256² `rippleTex` each frame with a fullscreen pass, and feed the same texture to the ground normal.

### Parameters

| Param | Value | Range |
| --- | --- | --- |
| cell size S (layer 1, layer 2) | 0.35 m, 0.22 m | 0.15 to 0.6 |
| period P | 1.1 s, 0.8 s | 0.6 to 1.6 |
| wavenumber k | 32 per cell | 20 to 40 |
| ring width w² | 0.012 | 0.006 to 0.02 |
| amplitude A | 2.5 mm × rain | 1 to 4 mm |
| puddle level | 0.2 → 0.55 over the rain ramp | |
| porosity | asphalt 0.7, stone 0.2 | |
| reflector resolutionScale | 0.5 desktop | 0.25 to 0.5 |
| reflection distortion | 0.04 | 0.02 to 0.06 |
| wave grid | 256², damping 0.985 | 128² on mobile |
| rain streaks | 8k desktop, 2k mobile | alpha 0.12 to 0.2 |
| collision RT | 512² HalfFloat, nearest | 1024² desktop hero |

### Performance budget
- Desktop target is at most 3 ms GPU total. The planar reflector is about 1 to 1.5 ms (a second scene render at half res: cull it with layers and skip small props). The ripple shader is 18 cheap iterations per ground pixel. Streaks and splashes are 2 instanced draws. The collision RT only updates when static collision geometry changes (render once, not per frame).
- Draw calls: about +40 to 60% of the scene count for the reflector pass, so keep total calls at or under 100.

### Mobile fallback
Drop the reflector and use env reflection through low roughness. Use one ripple layer with no 3x3 neighbour loop (rings capped at `R ≤ 0.45` cell so they stay in their own cell, 1 iteration). No interactive wave grid. 2k streaks, or none. Splash rings only near the camera.

### prefers-reduced-motion
Freeze `uTime`, so ripples hold as still concentric rings. Or set `uRain = 0` for mirror-still puddles, which is the better look. Hide rain streaks and splashes, and keep the wet or puddle state. The interactive wave grid still answers direct user input but adds no ambient drops. Render on demand (`frameloop="demand"` in R3F).

### Sources
three.js MIT (`webgpu_compute_water`, `webgl_gpgpu_water`, `webgpu_compute_particles_rain`, `webgpu_reflection`, `reflector`, `mx_fractal_noise_float`, `SSRNode`). drei MIT (`MeshReflectorMaterial`). IQ central-difference normals (article, MIT snippets). The wave equation and Fresnel are physics. Lagarde's wet-surface article is ideas only. The effect description came from TAG's `threejs-precipitation-surfaces/SKILL.md` (one paragraph). No GPL puddle code or its textures were opened.

---

## 3. Deformable sand or snow (footprints, trails)

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-procedural-materials` description and reference text (MIT text; the GPL Sandboard example was not opened, ideas only), three.js docs and examples (MIT), Musgrave, Kolb, Mace 1989 (math), JAL-authored code and budgets.

### Visual goal
A bright beach or fresh snow in daylight. As a character walks, or the user drags a pointer or object, the surface shows crisp footprints or a groove. A small raised berm forms around each print. Sand slumps a little (steep walls relax to the angle of repose). Snow can slowly refill under falling snow. Inside a print the surface is a touch darker (compressed or damp sand, shaded snow).

### Algorithm

Data: one height-offset field `h` (metres, negative for pressed in, positive for berm) in a window that follows the player or camera.
- Desktop: 512² covering 32 m, so about 6.25 cm per texel. Mobile: 256² covering 24 m.
- Two textures for ping-pong (R32F on WebGPU, or RGBA HalfFloat if float storage is not available).

Per frame:
1. **Recentre**. When the focus point moves one or more texels, shift the window by an integer texel offset `scroll`. The stamp pass reads `src = p + scroll`, and texels scrolling in from outside start at 0. (Alternative: toroidal addressing with `uv = fract(worldXZ / SIZE)`, clearing the strip that wraps.)
2. **Stamp** (pass A→B). For each active deformer (at most 8 per frame: feet on contact, wheels, a pointer ray hit):
   - Sole: `h = min(h, −depth · (1 − smoothstep(0.75, 1, r)))`, where `r` is the elliptical distance normalised to the footprint radius. Only apply it where the sole value is above 0, so untouched berms survive.
   - Berm: `h = max(h, 0.3 · depth · ring(r))`, with `ring = smoothstep(0.9, 1.1, r) · (1 − smoothstep(1.2, 1.7, r))`.
   - For a foot, the ellipse is aligned to the foot's forward vector (length/width about 2.2). A heel-to-toe depth ramp makes prints read clearly: `depth *= mix(1.0, 0.7, toeFactor)`.
   - For arbitrary shapes, a top-down orthographic camera renders the deformers' lowest world y into an RT (as three's rain example renders `positionWorld` for collisions). Then `h = min(h, objectBottom − restSurface)`.
3. **Relax** (pass B→A, thermal erosion after Musgrave et al. 1989). With talus threshold `T = tan(θ_repose) · cellSize`, each texel computes `flux = Σ₄ sign(hₙ − h) · max(|hₙ − h| − T, 0)` and sets `h += κ · flux / 4`, with κ ≤ 0.5 for stability. Each neighbour pair sees the same difference with opposite sign, so the step conserves material in the Jacobi form. Use 1 iteration per frame for sand. Snow can skip it or use a steeper angle.
4. **Refill** (snow only, while snowing): `h *= 1 − refill · dt`, with refill 0.01 to 0.05 per second.

Rendering:
- Terrain patch that follows the window: a 256² grid desktop, 128² mobile.
- Vertex displacement `y += h`, sampled at LOD 0 in the vertex stage.
- Per-pixel normal from central differences of `h` (`n = normalize(vec3(h_L − h_R, 2·cell, h_D − h_U))`) blended onto the base sand or snow normal map. This keeps print edges crisp even when the mesh is coarser than the field.
- Shading:
  - Sand: albedo `#e7d9bd`, roughness 0.9. Compressed darkening is `albedo *= mix(1, 0.82, smoothstep(0, 0.03, −h))`.
  - Snow: albedo `#f3f5f7`, roughness 0.75. A soft cool shade in prints: `albedo *= mix(1, 0.88, smoothstep(0, 0.05, −h))`. This is a neutral grey-blue, not purple.
  - Optional fine glints: a per-texel hash times a narrow specular lobe. Keep them tiny and do not bloom them.
- Any grain glint is filtered by pixel footprint (fade to its mean at grazing distance) or it aliases while the camera moves. Displacement, airborne grains, bed shading, and shadow all advance from the same fixed-step clock and the same height state.
- Picking stamp positions: raycast the ground for pointer trails (three's `Raycaster` against the ground plane or patch; three-mesh-bvh is an approval candidate, ask Brian, only for dense meshes), spacing stamps 0.5 × radius apart along the drag path. For characters, stamp when the foot bone's height is under a threshold and its speed is under 0.2 m/s.

### GLSL sketch (WebGL2, two fullscreen passes with `GPUComputationRenderer` or plain RT ping-pong)

```glsl
// deform-stamp.frag  (reads uPrev, writes next)
uniform sampler2D uPrev; uniform vec2 uTexel; uniform vec2 uScroll;   // integer texels
uniform vec2 uCenter; uniform float uSize;                            // window centre (m), size (m)
uniform vec4 uStamp[8];   // xy world xz, z radius (m), w depth (m, 0 = inactive)
uniform vec4 uStampF[8];  // xy forward (unit), z aspect (len/width)
in vec2 vUv; out vec4 o;
void main() {
  vec2 src = vUv + uScroll * uTexel;
  bool out_ = any(lessThan(src, vec2(0))) || any(greaterThan(src, vec2(1)));
  float h = out_ ? 0.0 : texture(uPrev, src).r;
  vec2 world = uCenter + (vUv - 0.5) * uSize;
  for (int i = 0; i < 8; i++) {
    if (uStamp[i].w <= 0.0) continue;
    vec2 d = world - uStamp[i].xy, f = uStampF[i].xy;
    vec2 e = vec2(dot(d, vec2(f.y, -f.x)), dot(d, f) / uStampF[i].z);
    float r = length(e) / uStamp[i].z;
    float sole = uStamp[i].w * (1.0 - smoothstep(0.75, 1.0, r));
    if (sole > 1e-4) h = min(h, -sole);
    float ring = smoothstep(0.9, 1.1, r) * (1.0 - smoothstep(1.2, 1.7, r));
    h = max(h, 0.3 * uStamp[i].w * ring);
  }
  o = vec4(h, 0, 0, 1);
}
```

```glsl
// deform-relax.frag
uniform sampler2D uPrev; uniform vec2 uTexel; uniform float uCell, uTanRepose, uKappa, uRefill, uDt;
in vec2 vUv; out vec4 o;
void main() {
  float h = texture(uPrev, vUv).r, T = uTanRepose * uCell, flux = 0.0;
  vec2 k[4] = vec2[](vec2(1, 0), vec2(-1, 0), vec2(0, 1), vec2(0, -1));
  for (int i = 0; i < 4; i++) {
    float dh = texture(uPrev, vUv + k[i] * uTexel).r - h;
    flux += sign(dh) * max(abs(dh) - T, 0.0);
  }
  h += uKappa * 0.25 * flux;
  h *= 1.0 - uRefill * uDt;
  o = vec4(h, 0, 0, 1);
}
```

### TSL sketch (WebGPU compute, StorageTexture ping-pong)

```js
import * as THREE from 'three/webgpu';
import { Fn, storageTexture, textureStore, instanceIndex, uniform, uniformArray, ivec2, int, float, vec2, vec3, vec4,
  min, max, abs, sign, smoothstep, length, select, texture, positionLocal, normalize, mix, transformNormalToView, NodeAccess } from 'three/tsl';

const RES = 512, SIZE = 32, CELL = SIZE / RES, MAX_STAMPS = 8;
const mk = () => { const t = new THREE.StorageTexture(RES, RES); t.type = THREE.FloatType; return t; };
export const texA = mk(), texB = mk();
const R = (t) => storageTexture(t).setAccess(NodeAccess.READ_ONLY);
const W = (t) => storageTexture(t).setAccess(NodeAccess.WRITE_ONLY);

export const stamps = uniformArray(Array.from({ length: MAX_STAMPS }, () => new THREE.Vector4()), 'vec4'); // xz, radius, depth
export const center = uniform(new THREE.Vector2()), scroll = uniform(new THREE.Vector2());
export const tanRepose = uniform(Math.tan(THREE.MathUtils.degToRad(34))), kappa = uniform(0.4);
export const refill = uniform(0), dt = uniform(1 / 60);

const inside = (q) => q.x.greaterThanEqual(0).and(q.y.greaterThanEqual(0)).and(q.x.lessThan(RES)).and(q.y.lessThan(RES));

const stampPass = Fn(() => {
  const x = int(instanceIndex.mod(RES)), y = int(instanceIndex.div(RES)), p = ivec2(x, y);
  const src = p.add(ivec2(scroll));
  const h = select(inside(src), R(texA).load(src).r, float(0)).toVar();
  const world = center.add(vec2(float(x), float(y)).add(0.5).mul(CELL).sub(SIZE / 2));
  for (let i = 0; i < MAX_STAMPS; i++) {             // circular stamps; add the forward/aspect ellipse as in GLSL if needed
    const s = stamps.element(i);
    const r = length(world.sub(s.xy)).div(s.z);
    const sole = smoothstep(0.75, 1, r).oneMinus().mul(s.w);
    h.assign(select(sole.greaterThan(1e-4), min(h, sole.negate()), h));
    const ring = smoothstep(0.9, 1.1, r).mul(smoothstep(1.2, 1.7, r).oneMinus());
    h.assign(max(h, ring.mul(s.w).mul(0.3)));
  }
  textureStore(W(texB), p, vec4(h, 0, 0, 1));
})().compute(RES * RES);

const relaxPass = Fn(() => {
  const p = ivec2(int(instanceIndex.mod(RES)), int(instanceIndex.div(RES)));
  const rd = R(texB);
  const H = (q) => rd.load(q.clamp(ivec2(0), ivec2(RES - 1))).r;
  const h = H(p).toVar(), T = tanRepose.mul(CELL), flux = float(0).toVar();
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const dh = H(p.add(ivec2(ox, oy))).sub(h);
    flux.addAssign(sign(dh).mul(max(abs(dh).sub(T), 0)));
  }
  h.addAssign(flux.mul(kappa).mul(0.25));
  h.mulAssign(float(1).sub(refill.mul(dt)));
  textureStore(W(texA), p, vec4(h, 0, 0, 1));
})().compute(RES * RES);

export function stepDeform(renderer) { renderer.compute(stampPass); renderer.compute(relaxPass); } // result in texA

export function deformMaterial({ baseColor = new THREE.Color('#e7d9bd') }) {
  // Patch geometry: PlaneGeometry(SIZE, SIZE, 255, 255).rotateX(-Math.PI/2); mesh.position follows `center`.
  const huv = positionLocal.xz.div(SIZE).add(0.5);
  const Hs = (o, lod) => texture(texA, huv.add(o)).level(lod).r;
  const e = 1 / RES;
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.9 });
  mat.positionNode = positionLocal.add(vec3(0, Hs(vec2(0), 0), 0));
  const n = normalize(vec3(Hs(vec2(-e, 0), 0).sub(Hs(vec2(e, 0), 0)), 2 * CELL, Hs(vec2(0, -e), 0).sub(Hs(vec2(0, e), 0))));
  mat.normalNode = transformNormalToView(n);
  mat.colorNode = vec3(baseColor.r, baseColor.g, baseColor.b).mul(mix(1, 0.82, smoothstep(0, 0.03, Hs(vec2(0), 0).negate())));
  return mat;
}
// Check the texel-row vs world-z orientation once with a single debug stamp; flip huv.y if prints mirror.
```

WebGL2 fallback: the StorageTexture compute path needs the WebGPU backend. On WebGL2, run the two GLSL passes above through `GPUComputationRenderer` (three MIT) and sample its output texture in the terrain material.

### Parameters

| Param | Sand | Snow |
| --- | --- | --- |
| window | 512² / 32 m (6.25 cm/texel) | same |
| foot radius / aspect | 0.12 m / 2.2 | 0.14 m / 2.0 |
| print depth | 0.03 to 0.05 m | 0.08 to 0.20 m (fresh powder) |
| berm factor | 0.3 | 0.15 (snow compresses more than it displaces) |
| angle of repose | 34° (dry sand) | 40° to 50°, or relax off |
| κ, iterations | 0.4, 1 per frame | 0.2, 1 per frame |
| refill | 0 | 0.02 per s while snowing |
| terrain patch | 256² verts desktop, 128² mobile | same |

### Performance budget
- Compute: 2 dispatches × 262k threads, each with a few fetches, under 0.3 ms on desktop WebGPU.
- Memory: 2 × 512² × 4 B = 2 MB.
- Terrain patch: 130k triangles at 256² (inside the 300k desktop budget, so trim other geometry). Use 128² (32k triangles) on mobile.
- Draw calls: +1.

### Mobile fallback
256² over 24 m, stamp pass only (no relax), vertex displacement on a 128² patch, normals from the field in the fragment shader.

Lowest tier, with no simulation: footprint decals. Use `DecalGeometry` (three MIT, `webgl_decals`) with a small normal and height texture drawn by us, in a pool of at most 64, fading after 20 s.

### prefers-reduced-motion
Deformation is driven by the user, so pointer or drag trails still work. Turn off anything ambient: no auto-walking characters, no refill animation, no falling snow. Show a pre-baked trail (stamp a fixed path once at load, then stop the compute). Nothing moves unless the user does it.

### Sources
three.js MIT (`webgpu_compute_texture_pingpong` StorageTexture pattern, `GPUComputationRenderer`, `webgpu_compute_particles_rain` top-down ortho RT, `DecalGeometry`). three-mesh-bvh MIT (approval candidate). SnowSystemThreeJS MIT (accumulation and capping, if also needed). The thermal erosion math is from Musgrave, Kolb and Mace (1989). The deformable-snow approach (a height-offset texture around the player) matches the GDC 2014 Arkham Origins talk, used for concept only. The effect description came from TAG's `threejs-procedural-materials/SKILL.md` (one paragraph). No GPL Sandboard code was opened.

---

## 4. Dense stylized grass with wind

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-procedural-vegetation` description and reference text (MIT text), threejs-game-skills (stock-material sway patch), simondevyoutube/Quick_Grass (MIT, structure only), momentchan/r3f-procedural-grass (MIT, top level), three.js docs and examples (MIT), GPU Gems ch. 7 (ideas only), JAL-authored code and budgets.

### Visual goal
A field of individual blades, dense near the camera and thinning to a painted ground colour in the distance. Blades vary in height, lean and tint. Wind moves through as visible gusts, broad waves travelling across the field, plus a small tip flutter. Blades bend away from the player or pointer. Use natural daylight greens (dark base, lighter warm tip), soft backlit translucency at grazing sun angles, done in shading, and root darkening for depth.

### Algorithm

1. **Blade geometry**: one strip of `seg` segments (high LOD 5 to 6, low LOD 1 to 2), 2 vertices per row. Attributes: `t` (0 at the root, 1 at the tip) and `side` (−1 or 1). Taper `width(t) = w0 · (1 − t)^0.7`, collapsing at the tip. Draw it double-sided.
2. **Placement with no per-instance buffers**: use `instanceIndex` to find a slot in a jittered grid, `root = ((gx + hash₁, gz + hash₂) / GRID − 0.5) · PATCH`. Hashes of the index also give height, yaw, lean and tint. This is deterministic, uses no memory, and patches can be re-used as tiles. A density mask (a paths texture) sets the height to 0, which removes the blade.
3. **Clumps**: find the nearest point in a Voronoi grid (cell size about 0.6 m). Blades in a clump share a lean direction and height factor. That gives the "combed" stylized look.
4. **Bend**: rotate each vertex about the root. The angle `θ(t) = |B| · t²` grows toward the tip, so the root stays planted and the blade keeps roughly its length. That avoids the stretching GPU Gems ch. 7 warns about with shear-based sway. The bend vector `B` is the blade's own lean times its facing, plus wind times gust, plus a push away from the player.
5. **Wind**:
   - A world-space noise field scrolled along the wind direction: `gust = noise(xz · 0.15 − windDir · t · 0.8)`. Broad, travelling waves.
   - Flutter: `sin(6 t + hash · 2π) · 0.04`.
   - Two uniforms, `windDir` and `windStrength`, drive everything.
6. **Normals**: the face normal rotated by yaw. A "rounded" trick tilts the normal ±0.35 rad about y across the width, so light rolls across each blade. Blend toward terrain-up with distance (0.25 at the LOD edge) so far grass shades like a lawn.
   - Bend along a quadratic spine so the tip travels an arc and length is kept; yaw each blade partly toward the wind for a combed read.
7. **View-space thickening** (a Quick_Grass MIT idea): when a blade is seen edge-on, widen it slightly in view space so it does not vanish into a line.
8. **LOD and culling**: tiles of 16 m. Per frame on the CPU, frustum-test each tile. Tiles closer than 15 m use the high-LOD mesh and farther ones the low-LOD mesh. Beyond `MAX` (60 to 100 m), fade blade height to 0 and let the ground texture take over. When far blades are randomly culled, widen the survivors slightly so apparent density holds, and blend normal and colour toward the ground with distance. Each tile is one instanced draw, or use one draw per LOD with a compacted instance list on WebGPU.
9. **Shading** (`MeshStandardNodeMaterial`, roughness 0.6):
   - Albedo `mix(base, tip, t^1.5)`, with base `#35521f` and tip `#9fb45a`, randomised ±8%.
   - Root AO `mix(0.45, 1, t)`.
   - Backlight: `tip · 0.25 · max(dot(V, −L), 0)^4 · t`, added through `emissiveNode`. Cheap translucency, no bloom.

**Light variant: patch a stock material.** For a few banners, fabric panels, or foliage cards, patch `begin_vertex` on a stock material instead of a full shader, so PBR lighting stays free. Weight displacement by height above the base so the base stays planted, take a per-instance phase from the instance translation so copies never move in lockstep, and sum two sines at different rates with an amplitude of a few centimetres. Nearly free on an `InstancedMesh`. Never displace a raycast target; freeze time under reduced motion.

### GLSL sketch (WebGL2, `ShaderMaterial` with `glslVersion: THREE.GLSL3`, `InstancedBufferGeometry.instanceCount = GRID*GRID`)

```glsl
// grass.vert
#include "jal-hash.glsl"
in vec3 position; in float t; in float side;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;
uniform vec2 uPatchOffset; uniform float uTime, uWind; uniform vec2 uWindDir; uniform vec3 uPlayer;
uniform int uGrid; uniform float uPatch;
out float vT; out vec3 vN; out vec3 vWorld; out float vShade;
void main() {
  int i = gl_InstanceID; ivec2 g = ivec2(i % uGrid, i / uGrid);
  vec3 r = hash32(g + ivec2(int(uPatchOffset.x * 7.0), int(uPatchOffset.y * 13.0)));
  vec2 root = (vec2(g) + r.xy) / float(uGrid) * uPatch - uPatch * 0.5 + uPatchOffset;
  float height = mix(0.35, 0.7, r.z);
  float yaw = hash21(g + 31) * 6.2831853;
  vec2 face = vec2(cos(yaw), sin(yaw));
  float gust = vnoise(root * 0.15 - uWindDir * uTime * 0.8);
  vec2 away = root - uPlayer.xz; float dp = length(away);
  vec2 B = face * (0.15 + 0.25 * r.x) + uWindDir * gust * uWind + (dp < 1.5 ? away / max(dp, 1e-3) * (1.5 - dp) * 0.6 : vec2(0));
  B += uWindDir * sin(uTime * 6.0 + r.y * 6.2831853) * 0.04;
  float th = length(B) * t * t; vec2 bd = B / max(length(B), 1e-4);
  float w = 0.03 * pow(1.0 - t, 0.7);
  vec2 across = vec2(-face.y, face.x) * side * w;
  float y = t * height;
  vec3 wp = vec3(root.x + across.x + bd.x * sin(th) * y, cos(th) * y, root.y + across.y + bd.y * sin(th) * y);
  vec3 n = normalize(vec3(face.x, 0.0, face.y));
  float ca = cos(0.35 * side), sa = sin(0.35 * side);              // rounded-normal tilt about y
  n = normalize(vec3(n.x * ca - n.z * sa, 0.15, n.x * sa + n.z * ca));
  vT = t; vN = n; vWorld = wp; vShade = 0.92 + 0.16 * hash21(g + 97);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(wp, 1.0);
}
```

### TSL sketch

```js
import * as THREE from 'three/webgpu';
import { Fn, uniform, attribute, instanceIndex, hash, float, vec2, vec3, sin, cos, pow, mix, length, max, normalize,
  positionLocal, mx_noise_float, cameraPosition, positionWorld, dot, smoothstep, select, transformNormalToView } from 'three/tsl';

export function bladeGeometry(seg) {
  const pos = [], t = [], side = [], idx = [];
  for (let i = 0; i <= seg; i++) { const v = i / seg; pos.push(0, 0, 0, 0, 0, 0); t.push(v, v); side.push(-1, 1); }
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('t', new THREE.Float32BufferAttribute(t, 1));
  g.setAttribute('side', new THREE.Float32BufferAttribute(side, 1));
  g.setIndex(idx);
  return g;
}

export function grassMaterial({ GRID = 192, PATCH = 16 }) {
  const uTime = uniform(0), uWind = uniform(0.6), windDir = uniform(new THREE.Vector2(0.8, 0.6));
  const patchOffset = uniform(new THREE.Vector2()), player = uniform(new THREE.Vector3(1e4, 0, 1e4));
  const t = attribute('t', 'float'), side = attribute('side', 'float');
  const i = instanceIndex;
  const r1 = hash(i), r2 = hash(i.add(7919)), r3 = hash(i.add(104729)), r4 = hash(i.add(1299709));
  const root = vec2(float(i.mod(GRID)).add(r1), float(i.div(GRID)).add(r2)).div(GRID).sub(0.5).mul(PATCH).add(patchOffset);
  const height = mix(0.35, 0.7, r3), yaw = r4.mul(Math.PI * 2);
  const face = vec2(cos(yaw), sin(yaw));
  const gust = mx_noise_float(vec3(root.mul(0.15).sub(windDir.mul(uTime.mul(0.8))), 0)).mul(0.5).add(0.5);
  const away = root.sub(player.xz), dp = length(away);
  const push = away.div(max(dp, 1e-3)).mul(smoothstep(0, 1.5, dp).oneMinus()).mul(0.9);
  const B = face.mul(r1.mul(0.25).add(0.15)).add(windDir.mul(gust.mul(uWind)))
    .add(windDir.mul(sin(uTime.mul(6).add(r2.mul(6.2831853))).mul(0.04))).add(push);
  const th = length(B).mul(t).mul(t), bd = B.div(max(length(B), 1e-4));
  const w = pow(t.oneMinus(), 0.7).mul(0.03), y = t.mul(height);
  const across = vec2(face.y.negate(), face.x).mul(side).mul(w);

  const mat = new THREE.MeshStandardNodeMaterial({ side: THREE.DoubleSide, roughness: 0.6 });
  // Geometry is instanced with mesh.count (as in three's rain example); positions are built here, local = world patch space.
  mat.positionNode = vec3(root.x.add(across.x).add(bd.x.mul(sin(th)).mul(y)), cos(th).mul(y), root.y.add(across.y).add(bd.y.mul(sin(th)).mul(y)));
  const ca = cos(side.mul(0.35)), sa = sin(side.mul(0.35));
  const nL = normalize(vec3(face.x.mul(ca).sub(face.y.mul(sa)), 0.15, face.x.mul(sa).add(face.y.mul(ca))));
  mat.normalNode = transformNormalToView(nL);
  const base = vec3(0.208, 0.322, 0.122), tip = vec3(0.624, 0.706, 0.353);    // #35521f → #9fb45a
  const shade = hash(i.add(97)).mul(0.16).add(0.92);
  mat.colorNode = mix(base, tip, pow(t, 1.5)).mul(mix(0.45, 1, t)).mul(shade);
  const V = normalize(cameraPosition.sub(positionWorld)), L = normalize(vec3(0.3, 0.8, 0.5));
  mat.emissiveNode = tip.mul(pow(max(dot(V, L.negate()), 0), 4)).mul(t).mul(0.25);
  return { mat, uniforms: { uTime, uWind, windDir, patchOffset, player } };
}
// const mesh = new THREE.Mesh(bladeGeometry(5), mat); mesh.count = GRID * GRID;
// geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), PATCH);  // positions are procedural
// Rule for all sketches: never call smoothstep with edge0 > edge1 (undefined in GLSL and WGSL); use smoothstep(a, b, x).oneMinus().
```

R3F: wrap the same material in a component and set `count` via `<mesh count={GRID*GRID}>`. Update `uTime` in `useFrame` with `THREE.MathUtils.damp` for wind-strength changes. Do not use drei `<Instances>` here, because per-instance React objects are too heavy at 50k+.

### Parameters

| Param | Desktop | Mobile |
| --- | --- | --- |
| tile size | 16 m | 16 m |
| blades per tile (GRID²) | 192² ≈ 37k near tiles, 96² far | 128² near, 64² far |
| segments high/low | 5 / 1 | 3 / 1 |
| LOD distance / max | 15 m / 60 m | 10 m / 35 m |
| height, width | 0.35 to 0.7 m, 3 cm | same |
| lean | 0.15 to 0.4 rad | same |
| gust scale / speed | 0.15 /m, 0.8 m/s | same |
| wind strength | 0.6 (calm 0.2, storm 1.2) | |
| flutter | 0.04 rad at 6 rad/s | off |
| player push radius | 1.5 m | 1.2 m |

### Performance budget
- Triangles at the JAL desktop cap (at most 300k): about 2 near tiles × 37k blades × 10 triangles = 740k is too many. So use at most 20k near blades × 10 triangles = 200k, plus 50k far blades × 2 triangles = 100k.
- Mobile (at most 150k): 8k × 6 triangles + 40k × 2 triangles ≈ 128k.
- Vertex cost dominates: 1 noise lookup plus about 30 ALU ops per vertex. Fragment cost is low (no alpha test, since blades are real geometry).
- Draw calls: 1 per visible tile per LOD, usually 6 to 20.
- Shadows: blades should *receive* shadows only. Casting from 50k blades doubles vertex cost, so fake self-shadow with root AO.

### Mobile fallback
Fewer and shorter tiles, 3-segment blades, flutter off. Or the GPU Gems-style approach: alpha-tested cross-quad clusters (3 quads in a star) with a small grass-card texture we paint ourselves, placed only in the foreground band, over a ground texture with painted grass colour.

### prefers-reduced-motion
Freeze `uTime` (blades keep their static lean and a frozen gust shape, which still looks natural). Keep the player push, since it answers direct input. Stop the render loop when the camera is also still.

### Sources
three.js MIT (TSL `hash`, `mx_noise_float`, `mesh.count` instancing as in `webgpu_compute_particles_rain`). Quick_Grass MIT (vertex layout, LOD split, view-space thickening, player push; not its `noise.glsl`). r3f-procedural-grass MIT (top-level; the MRT blade-parameter idea only; not the r3f-gist submodule). hash-prospector Unlicense. GPU Gems ch. 7 for ideas (move only upper vertices, trade-offs of shear vs rotation). Ghost of Tsushima GDC 2021 for concepts (clumps, wind waves). The effect description came from TAG's `threejs-procedural-vegetation/SKILL.md` (one paragraph).

---

## 5. Above/below-water ocean with Snell's window (flagged ocean items)

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-spectral-ocean` and `threejs-procedural-materials` reference text (MIT text; Pearl-Sea-Park, FFTOCEAN, and poseidon have no license and were not opened, ideas only), three.js docs and examples (MIT), Tessendorf and Gerstner (math), optics (Snell, Fresnel, Beer-Lambert), JAL-authored code and budgets.

### Visual goal
A calm, bright daylight sea. From above: rolling waves, sun glints, clear shallow water tinted by depth over a sandy floor. From below: a bright circular "Snell's window" overhead showing the sky, surrounded by a mirror-like total-internal-reflection zone, with light fading to a soft blue-green haze with distance. No dark abyss by default. Keep it shallow and sunlit.

### Algorithm
1. **Waves**:
   - Desktop: a sum of 4 to 8 Gerstner waves. Each wave has direction `Dᵢ`, wavelength `λᵢ`, `kᵢ = 2π/λᵢ`, deep-water dispersion `ωᵢ = sqrt(g kᵢ)`, amplitude `Aᵢ` and steepness `Qᵢ ≤ 1/(kᵢ Aᵢ N)`.
   - Displacement: `x += Σ Qᵢ Aᵢ Dᵢ cos(kᵢ Dᵢ·x₀ − ωᵢ t)` and `y = Σ Aᵢ sin(kᵢ Dᵢ·x₀ − ωᵢ t)`. The analytic normal comes from the same sums.
   - Hero shots can use an FFT spectrum (Tessendorf, math only). three.js `webgpu_ocean` (MIT) is the reference to study before writing one.
2. **Above water**: Fresnel for air to water with F0 = 0.02. Reflection from the PMREM sky. Refraction via `viewportSharedTexture` offset by `n.xz · 0.03`, with depth-aware fallback as in three's `webgpu_backdrop_water` (MIT): if the refracted sample is in front of the water, use the unrefracted UV. Absorption uses the water thickness `d = sceneDepth − waterDepth` (linear).
3. **Below water** (camera under the surface, looking up):
   - View ray `I` hits the surface, whose normal flipped into the water is `N`. `cos θᵢ = dot(−I, N)`, `η = 1.333` (water to air).
   - Total internal reflection happens when `η² (1 − cos²θᵢ) ≥ 1`. The critical angle is `asin(1/1.333) ≈ 48.6°`, so the window is a cone of half-angle 48.6°.
   - Inside the window: `T = refract(I, N, η)` samples the sky, weighted by `1 − F`. Use the exact dielectric Fresnel, because Schlick is wrong near the critical angle: `rs = (η cosθᵢ − cosθₜ)/(η cosθᵢ + cosθₜ)`, `rp = (cosθᵢ − η cosθₜ)/(cosθᵢ + η cosθₜ)`, `F = (rs² + rp²)/2`.
   - Outside the window, reflect: sample a flat underwater colour or a low-res reflection.
   - Anti-alias the window edge with `fwidth` on `sin²θₜ`.
   - The same exact form serves any interior path (thick glass, ice, a water volume traced in a loop): TIR falls out of the same `sin²θₜ ≥ 1` test instead of a separate branch, and whatever throughput remains after the last bounce is added once as an environment sample, so the loop cap never darkens the interior.
4. **Medium** (Beer-Lambert): `transmittance = exp(−σ · distance)`. Use `σ ≈ (0.40, 0.06, 0.03) m⁻¹` for clear coastal water. `color = surface · T + fogColor · (1 − T)`, with fog colour a pale sea green-blue `#8fc7c9`, not deep navy.
5. **Caustics** (optional): the three.js `webgpu_caustics` / `webgpu_volume_caustics` examples (MIT) are the base. A cheap version projects a scrolling Worley pattern (`mx_worley_noise_float`) from the sun onto the floor, times depth fade. The physical cheap method refracts a regular ray grid through the surface and measures how each cell's area shrinks or grows on the floor: the area ratio is the light gain, which conserves flux. Fade caustics toward their own mean (not zero) by pixel footprint and depth, because they act like albedo and fading to zero changes floor brightness with camera height.
6. **One wave module.** Evaluate all wave bands in one function that returns both the analytic normal and a crest metric from the same slopes and phases, attenuate the smallest bands by their screen footprint, and let any foam tint read that crest value (a separate scrolling foam texture drifts out of phase). The wave list lives in one shared module read by the vertex shader, the fragment normal, and a CPU function, so floating objects and camera clearance use the same height in the same frame.
7. **Refraction honesty.** When scene depth is unavailable, estimate the path as a fallback depth divided by the absolute vertical component of the refracted ray, label it an estimate, and keep it separate from distance haze. Tint uses the absorption form in `shaders.md` section 13.
8. **Moving grids.** A grid that follows the camera snaps its origin to whole cells, or the surface swims; cells may grow geometrically after a flat near region to extend coverage cheaply.
9. **FFT hero sea** (C3, hero only, the mobile fallback below unchanged): each cascade gets its own patch length and a disjoint wavenumber band; clamp small wavenumbers before masking so no `1/0` appears; pack conjugate pairs so each spatial field is real; submit each FFT stage separately so writes are visible to the next. Before connecting a spectrum, pass an impulse test (a centred DC impulse becomes a constant, a one-bin impulse a single cosine) within about 1e-3. Whitecaps come from the determinant of the horizontal displacement Jacobian with a per-texel history that snaps down on a fold and recovers slowly, thresholded only at display (a pale foam tone, never a glow). Divide summed height slopes by one plus the summed horizontal derivatives so normals follow choppy folds. Fade each cascade, normal detail, and vertex displacement by a pixel footprint (distance squared times pixel angle over camera height gap). Blend water over sand by the real water column (about `smoothstep(0.025, 0.09)` m). Under water, structures above the surface that must appear in the Snell window are projected forward to refracted screen positions (bracket the crossing solve by about 1.13 times camera depth); never add a near-surface scattering layer; close the horizon with terrain.

### GLSL sketch (underside of the surface)

```glsl
uniform samplerCube uSky; uniform vec3 uSigma; uniform vec3 uFog;
in vec3 vWorld; in vec3 vN;
vec3 underside(vec3 camPos) {
  vec3 I = normalize(vWorld - camPos);              // camera below, looking up
  vec3 N = -normalize(vN);                           // normal facing down into the water
  float eta = 1.333, ci = clamp(dot(-I, N), 0.0, 1.0);
  float st2 = eta * eta * (1.0 - ci * ci);           // sin² of the transmitted angle
  float edge = fwidth(st2);
  float tir = smoothstep(1.0 - edge, 1.0 + edge, st2);
  float ct = sqrt(max(0.0, 1.0 - st2));
  float rs = (eta * ci - ct) / (eta * ci + ct), rp = (ci - eta * ct) / (ci + eta * ct);
  float F = mix(0.5 * (rs * rs + rp * rp), 1.0, tir);
  vec3 sky = texture(uSky, refract(I, N, eta)).rgb;
  vec3 col = mix(sky, uFog, F);                       // reflected part shows the water body
  vec3 Tm = exp(-uSigma * length(vWorld - camPos));
  return col * Tm + uFog * (1.0 - Tm);
}
```

### TSL sketch

```js
import { Fn, vec3, float, normalize, dot, sqrt, max, mix, smoothstep, fwidth, refract, exp, length,
  positionWorld, cameraPosition, normalWorld, uniform, cubeTexture, color } from 'three/tsl';
export const undersideColor = (skyCube, sigma = vec3(0.40, 0.06, 0.03), fog = color('#8fc7c9')) => Fn(() => {
  const I = normalize(positionWorld.sub(cameraPosition)), N = normalWorld.negate();
  const eta = float(1.333), ci = dot(I.negate(), N).clamp(0, 1);
  const st2 = eta.mul(eta).mul(ci.mul(ci).oneMinus());
  const e = fwidth(st2), tir = smoothstep(e.oneMinus(), e.add(1), st2);
  const ct = sqrt(max(st2.oneMinus(), 0));
  const rs = eta.mul(ci).sub(ct).div(eta.mul(ci).add(ct)), rp = ci.sub(eta.mul(ct)).div(ci.add(eta.mul(ct)));
  const F = mix(rs.mul(rs).add(rp.mul(rp)).mul(0.5), 1, tir);
  const sky = cubeTexture(skyCube, refract(I, N, eta)).rgb;
  const Tm = exp(sigma.negate().mul(length(positionWorld.sub(cameraPosition))));
  return mix(sky, fog, F).mul(Tm).add(fog.mul(Tm.oneMinus()));
})();
// Use as colorNode on a MeshBasicNodeMaterial rendered with side: BackSide when the camera y < water level.
```

### Parameters
- Gerstner set: 6 waves, λ from 1.5 to 24 m, steepness sum ≤ 0.8. Grid 256² desktop (130k triangles, inside budget), 128² mobile.
- IOR 1.333 (critical angle 48.6°), F0 0.02, `σ ≈ (0.40, 0.06, 0.03) m⁻¹`, fog `#8fc7c9`, refraction offset `n.xz · 0.03`.

### Performance budget
- The underside shader is about 20 ALU ops plus 1 cube fetch. Refraction adds 1 viewport copy (shared texture) on desktop. Draw calls: +1 to 2.
- Target at most 2.5 ms desktop (C2 to C3), 3 ms mobile (C3). The FFT hero sea (step 9) is C3 on desktop only and is measured separately.

### Mobile fallback
3 Gerstner waves on the 128² grid, no viewport refraction (depth tint only, from the Beer-Lambert thickness), no caustics, env (PMREM) reflection only. No FFT cascades, whitecap history, or forward projection of above-water structures. The underside keeps its Snell window (one cube fetch). Budget at most 3 ms at 1.0 MP. Under the lowest tier, show a still WebP poster made from the effect (an above-water frame), with no canvas.

### prefers-reduced-motion
Freeze wave time and show a still, slightly rippled surface. Caustics are off. Camera transitions between above and below water become a 150 ms crossfade (JAL law), not a dive.

### Sources
three.js MIT (`webgpu_ocean`, `webgpu_backdrop_water`, `webgpu_caustics`, `Water.js` by jbouny MIT, `mx_worley_noise_float`). Gerstner waves (GPU Gems 1 ch. 1, ideas only). Tessendorf (math). The Fresnel equations, Snell's law and Beer-Lambert are physics. The effect description came from TAG's `threejs-spectral-ocean/SKILL.md`. No Pearl-Sea-Park or FFTOCEAN code or textures were opened.

---

## 6. Budget roll-up against the JAL immersive table

From: JAL-authored (targets from sections 1 to 10 against `performance.md`).

| Effect | Desktop GPU target | Mobile target | Extra draws | Extra RT memory | Post passes |
| --- | --- | --- | --- | --- | --- |
| Window rain | ≤ 1.5 ms | ≤ 2 ms | 4 to 5 | ~6 MB at 1.65 MP | the composite *is* the scene output pass |
| Wet ground + puddles | ≤ 3 ms (reflector) | ≤ 1 ms (env only) | +reflector pass, +2 | reflector at 0.5x, wave 256² | 0 |
| Deformable sand/snow | ≤ 0.8 ms | ≤ 0.5 ms | +1 | 2 MB | 0 |
| Grass | ≤ 3 ms (vertex bound) | ≤ 2.5 ms | 6 to 20 | 0 | 0 |
| Ocean / Snell | ≤ 2.5 ms | ≤ 3 ms | +1 to 2 | viewport copy | 0 |
| Procedural tree (one hero plus cards) | C2, measure | C2, measure | 2 to 4 | none | 0 |
| Touch frost | about 1 ms | about 1.5 ms | +2 | two half-float targets at display size, blur at 0.4 DPR | 0 |
| Snowfall and cover | about 0.8 ms | about 1 ms | +1 | none | 0 |

Layering inside a section follows the JEV-judged protocol in `skills/jal-design-system/references/recipe-index.md` section 4 (no fixed layer count; JEV keeps each layer at 0.6 or above), bounded by the frame budget. The page-level mechanical cap still holds and is never asked: at most two `cr.*` effects in one mobile viewport (recipe-index section 4.1 step 3, `SKILL.md` section 1), which the summed mobile targets above would force anyway. Measure on a real GPU (not headless SwiftShader) and check the renderer string before quoting any number. The numbers above are targets, not measurements.

## 7. JAL conformance checklist for these effects

From: JAL-authored (JAL law and the Zone B canvas exemption).

- Light daylight or studio scene. `scene.background` is the page surface token, or `alpha: true`.
- No bloom, glow, additive particles, neon or purple. Highlights come from specular lobes plus tone mapping (Neutral or ACES, exposure about 1.0, checked against white).
- Rain streaks use alpha blending in light grey. Splashes are thin rings, not sparkles.
- Each canvas has `aria-hidden="true"` when decorative. A DOM text equivalent and a static WebP poster cover no-WebGL and reduced motion.
- The loop pauses off-screen or when the tab is hidden. Everything is disposed on unmount (RTs, StorageTextures, geometries, materials, the reflector target).
- Code is written for JAL. Attribution comments cite three.js (MIT) and hash-prospector (Unlicense) where a pattern or constant came from them.

---

## 8. Procedural vegetation beyond grass (`cr.procedural_tree`)

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-procedural-vegetation` (MIT reference text), with growth-table ideas from dgreenheck/ez-tree (MIT), flower-field ideas from siliconjungle/inkwell-webgpu-flowers (MIT), and surface-ivy ideas from achrefelouafi/VegetationGeneratorThreeJS (MIT), all in section 0.3. All wording is JAL-authored.

### Visual goal
One hero tree, a flower bed, or ivy on a wall, in daylight on the page white, with calm wind.

### Algorithm
- **Species table.** One small table per level: length, radius factor, taper (about 0.7), sections, radial segments, child count, start fraction, emergence angle, gnarliness, twist. Grow from a queue with a per-level vertex budget, so recursion stays inspectable.
- **Continuations.** Every branch below the last level spawns one continuation from its tip in addition to lateral children, or the crown becomes a candelabra. Laterals take stratified positions along the parent with small jitter and an independently shuffled set of angular slots; their radius is a factor of the parent radius at the emergence point.
- **Per section:** advance along local up, perturb by gnarliness times `max(1, 1/sqrt(radius))`, apply twist, and turn toward the growth direction by `force / radius`, so twigs react more than the trunk. Give each branch a whole number of bark wraps around its circumference so texture scale never changes with radius.
- **Leaves:** along final branches as two perpendicular cards, alpha test 0.5, rounded normals (card normal plus the offset from the leaf origin). Wind moves the tip with a weight that is zero at the card root. Ivy leaves hinge at the petiole. Leaf, branch, and whole-tree wind are separate systems.
- **Flowers:** heads orient to the stem's tip tangent so they bend with it; the far LOD keeps each species' colour and petal count; population density uses rotated noise octaves so no axis grid shows.
- **Ivy:** grow a spline, reproject each step onto the host surface, creep in the tangent plane, and build tube rings with parallel-transport frames to avoid twisting.

### Parameters and budget
- Starting values: 3 to 4 branch levels, taper about 0.7 per level, leaf alpha test 0.5, a fixed seed per shipped tree.
- A medium tree is about 6.6k branch vertices and 22k leaf vertices: one hero tree fits T3 and T2; background trees are instanced cards.
- Cost C2 (one hero tree plus cards). Generated geometry passes the topology gate (`performance.md` section 6.2) for a fixed seed.

### Mobile fallback
Leaf cards halved, branch radial segments halved, wind on the whole-tree level only; lowest tier is the poster.

### prefers-reduced-motion
Wind time frozen at a composed pose; the loop sleeps.

### Law
Judge the tree against its ground, depth haze to the page white, and scale cues, never alone on a flat colour field. Natural greens and bark; no glow, no purple blossoms.

## 9. Touch frost reveal (`cr.touch_frost`)

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-temporal-surfaces` description (MIT text); the upstream example (takuma-hmng8/frozen) has no license and was not opened (ideas only). Mechanism JAL-authored.

### Visual goal
A fogged pane over a light scene that clears where the pointer touches and slowly frosts back.

### Algorithm
- One half-float ping-pong target at display resolution: one channel is the visible cleared mask (a noisy brush for an irregular edge), a second is a smoother response channel. Both decay by `1 - exp(-rate * dt)`, so the result is identical at 30, 60, and 120 fps (`performance.md` FPS sweep).
- Fade the brush near viewport edges and corners so it never clips abruptly.
- Render the frost structure noise once into static targets. Blur the scene with a separable pass at about 0.4 DPR, mix sharp and blurred scene by the inverse mask, and add a subtle two-scale normal refraction only where frost remains.
- On resize, clear the history and regenerate the static targets.

### Parameters and budget
Starting values (JAL-authored, tune by eye): brush radius about 6% of the short viewport side, frost regrowth time constant about 4 s, response channel settling about twice as fast as the visible mask, edge fade over the outer 5% of the viewport, refraction offset under 1% of the viewport.

Cost C2: two half-float targets at display size plus one blur at 0.4 DPR; about 1 ms desktop, 1.5 ms mobile (targets, not measurements).

### Mobile fallback
The blur without refraction; lowest tier is the poster.

### prefers-reduced-motion
A static half-cleared pane; pointer clearing may still answer input but frost does not regrow on a loop.

### Law
Neutral cool grey tint, never purple; no sparkle on the frost; the canvas sits inside its section box.

## 10. Snowfall and snow cover (`cr.snowfall`)

From: Threejs-Awesome-Graphics-Agent-Skills `threejs-precipitation-surfaces` (MIT reference text) and achrefelouafi/SnowSystemThreeJS (MIT, section 0.3), three.js docs (MIT). Mechanism JAL-authored.

### Visual goal
Light snow falling in daylight, settling on the ground and on the tops of objects, on a white-first page.

### Algorithm
- **Snowfall** is one instanced volume centred on the camera. Each instance stores a normalised spawn point and a seed; the vertex shader moves it by wind and fall speed and wraps with `mod(base + displacement - origin, volume) + origin`, so there is no emitter edge and no CPU update. It reads the weather state object (section 0.4).
- Starting values: flake radius about 0.07, fall speed about 3.2 with per-flake variation 0.6 to 1.3, sway about 0.5, opacity about 0.9 (the same volume runs rain at about 5 units per second with streaks instead of flakes). Flakes are pale grey with normal alpha blending so they read against light surfaces.
- **Ground cover** uses one height function (a world-space mask from thresholded FBM with a soft edge, times a drift band, times a boundary fade) that both displaces vertices and feeds finite-difference normals (step about 0.08). Albedo shifts to a cool neutral white, roughness about 0.82.
- **Snow on objects:** coverage in the object's own space (pass a world-to-model matrix) so snow stays put when the object moves, times `smoothstep(0.35, 1, worldNormal.y)` so vertical faces stay clear. Displace along the normal by thickness (about 0.06 m at coverage 0.7, edge 0.15), converting world thickness to local units by the length of the transformed normal (`shaders.md` section 14).

### Parameters and budget
Cost C1 to C2: one instanced draw for flakes (a few thousand on T2), cover shading in existing materials. Targets about 0.8 ms desktop, 1 ms mobile (not measured).

### Mobile fallback
Half the flakes, no object cover displacement (shading only); lowest tier is the poster.

### prefers-reduced-motion
No falling flakes; the settled cover as a still.

### Law
No sparkle layer (banned in Zone B), no purple shade in shadows (neutral grey-blue), no painted sky.
