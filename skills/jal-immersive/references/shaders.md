# Shader craft: GLSL and TSL for JAL scenes

Written in our own words from general practice, the three.js source and TSL addons (MIT), Inigo Quilez's MIT-licensed snippets (iquilezles.org/articles, attribution below), and hash-prospector (Unlicense). Ideas only, never code, from The Book of Shaders (all rights reserved), LYGIA (Prosperity, non-commercial), Shadertoy (CC BY-NC-SA unless stated), and Maxime Heckel's articles (CC BY-NC). Every sketch here is new JAL code: check it on a real GPU before shipping.

Law inside a canvas (Zone B): natural light and shade are allowed. No additive glow, bloom, neon, purple family, chromatic aberration or RGB split, glitch, scanlines, or full-bleed smooth colour fields. noyzzi pieces are exempt inside their own section only.

## 1. Delivering shaders in three

From: three.js docs and examples (MIT), drei (MIT), webgpu-claude-skill (TSL rules, cheat sheet, node materials, in our own words), ai-dev-kit (uniform mutation, patch assertion), threejs-game-skills (per-object variation), Threejs-Awesome-Graphics-Agent-Skills (parameter naming, coordinate ownership, field bundles), JAL-authored.

| Route | When | Notes |
|---|---|---|
| `onBeforeCompile` on a stock material | Keep PBR lighting, patch one stage | Always set `customProgramCacheKey`, stash `material.userData.shader` to reach uniforms, reuse one material across meshes. Meshes needing different uniform values get separate instances returning the same `customProgramCacheKey` (one compiled program, own uniforms); on an `InstancedMesh` read `instanceColor` or the `instanceMatrix` translation inside the patch instead. WebGL only |
| `ShaderMaterial` | Full control, three prepends attributes and matrices | Skips tone mapping and colour space unless you end `main()` with `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`. Write `gl_FragColor` (three defines it to its own output under `glslVersion: THREE.GLSL3`) |
| `RawShaderMaterial` | You declare everything | With `glslVersion: THREE.GLSL3` three prepends `#version 300 es`; declare precision, attributes, uniforms, and your own `out vec4` |
| TSL node material (`three/webgpu`) | WebGPU, or both backends | Replace a slot (`colorNode`, `positionNode`, `normalNode`, `roughnessNode`, `opacityNode`, `emissiveNode`, `outputNode`), keep PBR. `onBeforeCompile` and `ShaderMaterial` are unsupported under WebGPU |
| drei `shaderMaterial(uniforms, vert, frag)` | R3F on WebGL | Typed class with uniform setters for JSX |

Load GLSL as text through Bun (`import frag from "./x.frag" with { type: "text" }`). GLSL has no file include: concatenate helper strings (`hash + noise + main`) at import time.

**Uniforms are mutated, never replaced.** Change a uniform only through `uniforms.uX.value = v` or `.value.set(...)`. Reassigning `material.uniforms` or one of its entries breaks the binding three made at compile time, and the change never reaches the GPU. With `onBeforeCompile`, keep a reference to the same uniform objects handed to `shader.uniforms` (in `userData`) and write to those from the frame loop.

**Assert that an `onBeforeCompile` patch applied.** Patch only by replacing a named include chunk (for example `#include <begin_vertex>`), never free text. After each `replace`, compare the result with the input and throw in dev when nothing changed: a three upgrade that renames a chunk otherwise fails silently. Re-run the check whenever the tilde pin in `three-foundations.md` section 1 moves.

TSL cannot overload `+` or `*`, so every expression is a method chain read left to right: `time.mul(2).add(offset).sin().mul(0.5).add(0.5)` is `sin(time * 2 + offset) * 0.5 + 0.5`. Break long chains into named `const` nodes at no cost (the graph compiles to one expression either way).

TSL rules that bite: nodes, not JavaScript variables, carry state (`.toVar()` plus `.assign()`, `select()`, `If`, `Loop`); uniforms are `uniform(value)` and you set `.value` from the frame loop; time is the `time` node; `wgslFn` and `glslFn` are the escape hatches. Built-in inputs: `positionLocal`, `positionWorld`, `normalView`, `normalWorld`, `uv()`, `screenUV`, `instanceIndex`, `vertexIndex`, `cameraPosition`, `positionViewDirection`.

More TSL rules:

- `.toVar("name")` gives a mutable variable with a readable name in the generated WGSL (traceable compile errors); `.toConst()` inlines a compile-time constant; `property(type, name)` shares a named value across stages. A swizzle setter on a vector node (`v.y = limit` inside `If`) is intercepted and works; a scalar has no such setter, so scalars need `.toVar()` plus `.assign()` or `select()`.
- A uniform can compute itself: `onObjectUpdate(({ object }) => ...)` runs per rendered object and feeds per-mesh data (a hover amount on `object.userData`) to one shared material without cloning; `onRenderUpdate` runs per render call, `onFrameUpdate` per frame. Scroll and time values stay set from the single `gsap.ticker` callback so tests can seek them; the callbacks are for per-object data.
- Oscillators (`oscSine`, `oscSquare`, `oscTriangle`, `oscSawtooth`) map a phase to 0 to 1. Feed them a JAL-owned `uniform(0)` set from the ticker, never the built-in `time` node, which never stops: under reduced motion it is set once to a composed value, and `seek(p)` stays deterministic.
- `wgslFn(sourceString)` compiles one WGSL function whose signature defines inputs and return type; call it like a node, wrap it in a TSL `Fn` with defaults, and keep the body small and pure (math only, no bindings). Only for porting proven WGSL or math TSL cannot express: it does not run on the WebGL2 fallback, so the recipe needs a TSL or GLSL twin **[verify]**.

**Node materials and slots (WebGPU).** Standard is the default; Physical only for visible clearcoat, transmission, or sheen; Basic for unlit ink or UI-in-3D surfaces; Lambert for cheap matte mobile props; Matcap for the clay look (`three.matcap_clay`); Normal as a debug view; Points, Sprite, LineBasic, LineDashed for their primitives; Toon only after a JEV taste pass. `opacityNode` needs `transparent = true` (usually `depthWrite = false`); `alphaTestNode` cuts without sorting; `normalMap(tex, strength)` takes a strength scalar; `bumpMap(heightTex, scale)` makes normals from height (about 0.03 on a unit sphere). `envNode` (named `envMapNode` in some docs **[verify]**) gives one material its own environment; `scene.environment` stays the canonical source. `outputNode` keeps lighting; `fragmentNode` replaces the whole fragment and skips lighting **[verify]** whether output transforms still run; `vertexNode` replaces the full clip-space position, so prefer `positionNode`.

### TSL cheat sheet

- **Types:** `float` f32, `int` i32, `uint` u32, `bool`, `vec2/3/4`, `color(hex | r, g, b)` (a vec3), `mat2/3/4`. Convert with `.toFloat()`, `.toInt()`, `.toVec4(w)`, `.toColor()`. Swizzles as in GLSL including reorder and repeat; `xyzw`, `rgba`, `stpq` are equivalent sets.
- **Logic as methods:** `lessThan`, `greaterThanEqual`, `equal`, `notEqual`, `and`, `or`, `not`, `xor`; bitwise `bitAnd`, `bitOr`, `bitXor`, `bitNot`, `shiftLeft`, `shiftRight` for integer hashing.
- **Geometry inputs:** `positionGeometry` is the raw attribute, `positionLocal` is after skinning and morphs, then `positionWorld`, `positionView`; normals follow the same pattern; `tangent*` and `bitangent*` in local, world, view; `uv(1)` is the second UV set; `vertexColor()`.
- **Screen inputs:** `screenUV`, `screenCoordinate` (pixels), `screenSize`, `viewportUV`, `viewport`, `depth`, `cameraNear`, `cameraFar`, and the camera matrices.
- **Control flow:** `Loop(n, ({ i }) => ...)` counts 0 to n-1; `Loop({ start, end, type: "int" }, ...)` sets bounds; `Loop(w, h, ({ i, j }) => ...)` nests; `Break()` and `Continue()` inside. `Switch(x).Case(0, fn).Default(fn)` replaces an `If` chain on an integer. `Discard()` is fragment-only; `Return(value)` exits a `Fn` early. Keep loop bounds uniform or constant.
- **`Fn` parameters:** positional `Fn(([a, b = 1.0]) => ...)` or named `Fn(({ colorA, t = 0.5 }) => ...)`. Called with no arguments, the destructured object receives the build context (`material`, `geometry`, `object`), so a helper can branch at build time on `material.userData` at no runtime cost.
- **Utilities:** `remap(x, inLow, inHigh, outLow, outHigh)`; `range(min, max)` creates a per-instance random attribute on instanced meshes (the cheapest per-instance variety); `checker(uv())` is a debug texture for UV stretching; `triplanarTexture(texX, texY, texZ, sharpness)` for meshes without usable UVs (three samples per texture: colour only, derive roughness from the same sample; see section 17 for the weighting rule).

Precision: `highp` for positions and anything accumulated over time; `mediump` is fine for colour on mobile. Keep `uTime` small (wrap it with `mod(time, 1000.0)` in periodic effects) so float precision does not degrade after long sessions.

**Parameter naming.** Uniform and prop names describe the perceived effect (`ridgeWidth`, `coastBlend`, `cavityDarkening`, `wetness`), never the implementation (`noise3Amount`, `k2`), grouped by role in the recipe's Parameters table so a JEV taste call or a designer can tune one visual quality without reading the shader.

**Coordinate ownership.** Choose each field's domain from its cause: object-space rest position for material identity that must stick to a moving object (pass an undeformed position attribute, never the displaced one); a world plane for wetness, water, and snow that belong to the world; screen space only for image effects. Never mix domains in one field unless the coupling is intended and named. Sampling the displaced position stretches noise on steep relief; world space on a moving object makes the pattern swim.

**Field bundles.** Before writing a material, list its fields: stable coordinates, macro form, meso structure, derived causes, and the channels that consume them. Each band has one job and one locked scale (silhouette, regions, surface breakup, micro normal). Secondary masks come from causes (slope `1 - abs(dot(n, up))`, cavity, exposure, distance to a water line), not new noise. Warp the coordinates, not the outputs. Displace geometry only with bands the mesh can carry and push finer bands into the normal; keep categorical masks broad so regions never break into bubbles. When the CPU needs the same field (placing props on a displaced surface, raycasting a shader-displaced ground), implement one deterministic field in both languages from the same constants and assert parity in `bun test` at fixed sample points.

## 2. Hashes

From: skeeto/hash-prospector (Unlicense), three.js TSL docs (MIT), JAL-authored.

Avoid `fract(sin(dot(p, k)) * 43758.5)`: precision collapses at large inputs on mobile and shows as blocks. Use integer hashes.

```glsl
// jal-hash.glsl (GLSL ES 3.00). lowbias32 constants from skeeto/hash-prospector (Unlicense).
uint lowbias32(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float hash21(ivec2 c) { return float(lowbias32(uint(c.x) + lowbias32(uint(c.y)))) * (1.0 / 4294967296.0); }
vec3  hash32(ivec2 c) { uint h = lowbias32(uint(c.x) + lowbias32(uint(c.y)));
  return vec3(h, lowbias32(h), lowbias32(h ^ 0x9e3779b9u)) * (1.0 / 4294967296.0); }
```

TSL: `hash(seed)` returns 0 to 1 (a PCG variant; the seed is converted to uint, so keep it positive), plus `rand` and `interleavedGradientNoise`.

## 3. Noise families

From: JAL-authored (sketches), three.js TSL and addons (MIT), stegu/webgl-noise (MIT), Threejs-Awesome-Graphics-Agent-Skills (crack fields, object-locked frames, seam-free angles, distance-weighted detail, octave footprint fade).

| Family | Character | Use |
|---|---|---|
| Value | Cheap, slightly blocky | Grain, masks, wind gusts |
| Gradient (Perlin) | Smooth, natural | Terrain, surface variation, flow |
| Simplex | Smoother, scales to 3D and 4D | Animated volumes |
| Cellular (Worley, Voronoi) | Distance to nearest feature | Cells, caustic-like patterns, cracks; F2 minus F1 gives edges |
| FBM | Sum of octaves, lacunarity about 2.0, gain about 0.5 | Natural detail; cap 4 to 5 octaves on mobile |
| Ridged / turbulence | `1 - abs(n)` / `abs(n)` | Ridges, marble veins |
| Curl | Divergence-free field from a noise potential | Particle drift that swirls without clumping, the best default for calm motion |

TSL built-ins: `mx_noise_float`, `mx_noise_vec3`, `mx_fractal_noise_float`, `mx_worley_noise_float`, `mx_cell_noise_float` (MaterialX ports), `triNoise3D`. Addons: `snoise` and `curlNoise` (`three/examples/jsm/tsl/math/curlNoise.js`), `voronoi2d` and `voronoi3d`.

```glsl
// needs jal-hash.glsl
float vnoise(vec2 p) {                                   // value noise, 0..1
  ivec2 i = ivec2(floor(p)); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + ivec2(1, 0)), u.x), mix(hash21(i + ivec2(0, 1)), hash21(i + ivec2(1, 1)), u.x), u.y);
}
vec2 grad2(ivec2 c) { float a = hash21(c) * 6.2831853; return vec2(cos(a), sin(a)); }
float gnoise(vec2 p) {                                   // gradient noise, about -0.7..0.7, quintic fade
  ivec2 i = ivec2(floor(p)); vec2 f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(grad2(i), f),                    b = dot(grad2(i + ivec2(1, 0)), f - vec2(1, 0));
  float c = dot(grad2(i + ivec2(0, 1)), f - vec2(0, 1)), d = dot(grad2(i + ivec2(1, 1)), f - vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROT = mat2(0.8, -0.6, 0.6, 0.8);              // rotate between octaves so the grid never aligns
float fbm(vec2 p, int octaves) {
  float s = 0.0, a = 0.5, n = 0.0;
  for (int i = 0; i < 6; i++) { if (i >= octaves) break; s += a * gnoise(p); n += a; p = ROT * p * 2.02; a *= 0.5; }
  return s / n;
}
vec2 worley(vec2 p) {                                    // returns (F1, F2)
  ivec2 i = ivec2(floor(p)); vec2 f = fract(p); float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    ivec2 o = ivec2(x, y); vec2 r = vec2(o) + hash32(i + o).xy - f; float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return sqrt(vec2(f1, f2));
}
vec2 curl2(vec2 p) {                                     // 2D curl of a scalar potential
  const float e = 0.01;
  float dx = gnoise(p + vec2(e, 0)) - gnoise(p - vec2(e, 0));
  float dy = gnoise(p + vec2(0, e)) - gnoise(p - vec2(0, e));
  return vec2(dy, -dx) / (2.0 * e);
}
```

3D curl for particles: take three offset noise potentials `P = (n(p), n(p + 31.4), n(p + 71.9))` and `curl = (dPz/dy - dPy/dz, dPx/dz - dPz/dx, dPy/dx - dPx/dy)` by central differences, or use the `curlNoise` TSL addon. For a 3D simplex in GLSL, stegu/webgl-noise (MIT) may be vendored with its notice.

**Crack fields.** Take the Worley F2 minus F1 border at two scales (the second about 2.7 times the frequency at half strength), combine with `max`, and put one domain warp in front of both so large and small fissures stay related. The same crack value lowers albedo, raises roughness, and cuts a groove into the normal; a colour-only crack reads as a decal.

**Object-locked frames.** A pattern that belongs to an object (grooves, brushed direction, moss coverage) is evaluated in that object's frame: sample in local position, or pass axes from its world quaternion each frame. World axes make the pattern slide when the object rotates; camera axes make it follow the viewer.

**Seam-free angles.** `atan` has a seam. Feed noise the unit-circle pair `(cos(a + drift), sin(a + drift))` plus the other coordinate, so the field wraps and can be advected by changing `drift`. Works for any radial or cylindrical pattern.

**Distance-weighted detail.** For scenes that span near and far views, compute near, mid, and far weights from camera distance with smoothsteps and fade the contribution of fine bands (bump, sharp edges, micro variation) by them, with each band's frequency fixed. Changing frequencies with distance makes the pattern crawl.

**Octave footprint fade.** In object-space FBM, weight each octave by `1 - smoothstep(0.25, 0.5, footprint * octaveFrequency)` with `footprint = fwidth(samplePosition)`, so octaves vanish once their period falls under about two pixels; otherwise fine grain at hundreds of cycles per metre aliases into drifting blotches. Give each material its own micro-variation tuple (map noise 0.25 to 0.75 into `roughness = base plus or minus amount`, bump height `strength * 0.0006 m`); never share one generic noise node across metal, polymer, and paint.

**Anti-alias procedural patterns.** Any periodic band whose period drops below the pixel footprint shimmers. Fade it toward its mean (not zero) by `fwidth`:

```glsl
float stripes(float x, float freq) {
  float v = 0.5 + 0.5 * cos(x * freq);
  float fw = fwidth(x * freq);
  return mix(v, 0.5, smoothstep(0.5, 2.0, fw));          // 0.5 is the band's mean
}
```

## 4. SDFs and raymarching

From: IQ articles (MIT snippets), three.js addons (MIT), Threejs-Awesome-Graphics-Agent-Skills (integrator hygiene, bounded volumes), JAL-authored (budget, JAL look).

Build section for `three.sdf_blob` (with `sh.sdf_raymarch` and `sh.sdf_2d`).

Primitives and operators after Inigo Quilez (iquilezles.org/articles/distfunctions, code snippets MIT, copyright Inigo Quilez):

```glsl
float sdSphere(vec3 p, float r) { return length(p) - r; }
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdRoundBox(vec3 p, vec3 b, float r) { return sdBox(p, b - r) - r; }
float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; } // quadratic smooth min
```

- Union `min(a, b)`, subtraction `max(-a, b)`, intersection `max(a, b)`. Smooth min is the liquid-metal and blob move.
- Space ops: rounding (subtract r), elongation, symmetry through `abs(p)`, repetition `p - s * round(p / s)`, twist and bend. Elongation and rounding stay exact; twist and bend do not, so step more conservatively after them (multiply the step by 0.6 to 0.8).
- 2D SDFs are the cheapest crisp UI graphics (rounded rects, rings, arcs) with exact anti-aliasing: `alpha = 1.0 - smoothstep(-fw, fw, d)` with `fw = fwidth(d)`.

**Website raymarch budget:** 48 to 96 steps, hit epsilon scaled by distance, early out on max distance, render at `resolutionScale` 0.5 and upsample when the look is soft, a Bayer or blue-noise start offset to cut banding with fewer steps.

```glsl
float map(vec3 p);                                        // scene SDF
vec3 calcNormal(vec3 p) {                                 // tetrahedron gradient, 4 taps (IQ, MIT)
  const vec2 k = vec2(1, -1); const float h = 0.0005;
  return normalize(k.xyy * map(p + k.xyy * h) + k.yyx * map(p + k.yyx * h) + k.yxy * map(p + k.yxy * h) + k.xxx * map(p + k.xxx * h));
}
float march(vec3 ro, vec3 rd, float jitter) {
  float t = jitter * 0.02;
  for (int i = 0; i < 72; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0008 * t) return t;
    t += d;
    if (t > 20.0) break;
  }
  return -1.0;
}
```

JAL look for a blob: matte or satin surface lit by the environment, a soft contact shadow under it, rim as a slight darkening. TSL has `tsl/utils/Raymarching.js` in the addons.

**Integrator hygiene.** Every march has a hard iteration cap, an early exit, and a recorded termination reason (hit, escaped, capped) visible in a debug view. A ray that hits the cap returns a defined mean value, not whatever it ended on, or it speckles. Size steps from the local feature scale where curvature is sharp, and catch thin sheets (disks, water planes) with a crossing test between samples, since a large step skips them.

**Volumes and puffs** (a cloud puff, mist in a jar, a smoke plume on a light page):

- Bound the march to the object's box or sphere interval and to the opaque scene depth; uniform steps over that interval, each sample weighted by step length so the look does not change with step count; start offset by at most a quarter step with per-pixel interleaved-gradient noise.
- Shape density by letting coverage remap a base shape and fine detail erode it (full at the top, wispy at the base) rather than adding noise. Build 3D noise textures once and animate by advecting their offsets.
- Integrate front to back with the energy-conserving step (scattered light equals source times one minus the step transmittance, divided by extinction); stop below about 0.01 transmittance. Light with a short march toward the sun, a two-lobe Henyey-Greenstein phase, a powder term for dark edges, and a few multi-scatter octaves halving each time.
- A domain that is too long is fixed by shrinking the domain, never by adding extinction or view-angle masks.
- Budget: the raymarch budget above (48 to 96 steps at 0.5 resolution scale). White-first: bright daylight puffs, no glow, no painted sky behind them.

## 5. Domain warping

From: IQ articles (MIT snippets, the "warp" article as idea), JAL-authored (sketch, law note).

Evaluate noise at a position offset by noise: `f(p + k * fbm(p + k * fbm(p)))` (after IQ's "warp" article). One level gives soft marbling, two give fluid swirls. Animate only the inner term with time; it moves more calmly than scrolling the whole field.

```glsl
float warped(vec2 p, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0), 4), fbm(p + vec2(5.2, 1.3), 4));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.05 * t, 4), fbm(p + 3.0 * q + vec2(8.3, 2.8) + 0.04 * t, 4));
  return fbm(p + 3.0 * r, 4);
}
```

Law note: a full-bleed smooth colour field reads as a gradient and is banned outside noyzzi. Use warping as a material (stone, marbled paper, ink in water) on an object or a bounded surface, monochrome or within the brand's one accent at low contrast.

## 6. Fresnel and rim

From: JAL-authored (Schlick, rim law, TSL sketch), three.js docs (MIT), Threejs-Awesome-Graphics-Agent-Skills (rim incidence frame, exact Fresnel, reflection through alpha, energy-preserving lobes).

- Schlick: `F = F0 + (1 - F0) * pow(1 - saturate(dot(N, V)), 5)`, F0 0.02 to 0.04 for dielectrics.
- Stylised rim: `pow(1 - dot(N, V), p)` with p from 2 to 5.
- On light scenes a rim is a subtle darken or tint that separates the silhouette from the white page. An additive bright rim is glow and banned.
- Rim and Fresnel incidence use the normal through the inverse-transpose normal matrix (`normalMatrix`, view space), not the bare model matrix, which is only right under uniform scale.
- **Exact Fresnel inside bodies.** Keep Schlick for surface sheen. For any path that bounces inside glass or water use the exact unpolarised form (the mean of the squared s and p ratios) and return 1 past the critical angle, so total internal reflection falls out of one expression (Schlick never reaches 1 and leaks energy). Clamp incidence cosines to about 1e-4 at silhouettes, and after the last allowed bounce add the remaining throughput along the current direction instead of dropping it, or thick cores go dark.
- **Reflection through alpha blending.** On a transparent surface that is mostly reflection (a thin shell), alpha blending scales the reflection by alpha too. Set alpha to the mean reflectance clamped to about 0.001 to 0.985 and output reflected radiance divided by that alpha, so the blend equals the reflection and the background is attenuated by the matching amount.
- **Energy-preserving lobes.** When a highlight lobe is narrowed or widened, keep its integral constant: a Gaussian lobe is divided by `sqrt(2 pi) * sigma`; a power-cosine lobe of exponent `n` scales by about `n` relative to its authored value. Broadening a glint where the normal is unresolved then becomes a soft sheen instead of crawling, with no brightness loss.

```js
// TSL: TSL has no fresnel export, so write it
import { Fn, float, normalView, positionViewDirection } from "three/tsl";
export const rim = Fn(([power = float(3)]) => normalView.dot(positionViewDirection).saturate().oneMinus().pow(power));
// mat.colorNode = baseColor.mul(rim(3).mul(0.2).oneMinus());   // darken up to 20% at grazing angles
```

## 7. Matcaps

From: three.js docs (MIT), JAL-authored.

Build section for `three.matcap_clay` (with `sh.matcap`).

- Sample a lit-sphere texture by the view-space normal: `uv = n.xy * 0.5 + 0.5`. `MeshMatcapMaterial` in WebGL, `matcapUV` in TSL.
- Scene lights and shadows do nothing; the material costs almost nothing. A neutral soft-grey matcap is the fastest calm "clay render" on a white page (`three.matcap_clay`).
- Bake our own matcap (a sphere rendered in Blender under a soft studio rig). Shared matcap packs have mixed licenses.
- Ground it with a baked contact shadow; a matcap object floating with no shadow looks pasted on.

## 8. Dithering and anti-banding

From: three.js docs and TSL addons (MIT), JAL-authored.

- Soft light falloff across white or pale surfaces bands visibly in 8-bit output. Cheapest fix: `material.dithering = true` on stock three materials.
- Custom shaders: add `(hash - 0.5) / 255.0` per pixel in display space right before output. Invisible, removes banding.

```glsl
col += (hash21(ivec2(gl_FragCoord.xy)) - 0.5) / 255.0;    // after tone mapping and colour-space conversion
```

- Ordered dithering: Bayer 4 by 4, 8 by 8, or the addon's 16 by 16 (`bayer16`, `bayerDither(color, steps)` in `three/examples/jsm/tsl/math/Bayer.js`). Blue noise gives a less patterned grain. Quantise after adding the threshold.
- Retro or print-style dithering is a style choice: it needs a JEV taste pass (`imm.taste`), and it is noyzzi territory when it reads as a filter (see `nz.fx.halftone-print`).

## 9. Colour grading

From: three.js addons and TSL display nodes (MIT), pmndrs docs, webgpu-claude-skill (colour nodes, blur family, DoF, custom pipeline notes, in our own words), Threejs-Awesome-Graphics-Agent-Skills (signal chain order, exposure metering, generated LUT, aerial perspective), JAL-authored (law limits).

- **Chain order, one owner per stage, each with a disable switch:** scene in linear HDR (float or half-float targets), approved screen-space lighting work if any, distance haze, exposure, tone map, optional 3D LUT in display space, AA (FXAA needs display-space input), dither, output. Keep values unclamped until the tone map; clamping earlier turns highlights grey and breaks later exposure changes.
- Grade in linear space before tone mapping: exposure and white balance.
- Apply a 3D LUT in display space after tone mapping: `lut3D` (TSL), the `LUT` effect in pmndrs postprocessing (approved through the scene module), or `LUTPass` in three addons. A 32-cube LUT is enough.
- Keep contrast, saturation, and hue shifts small. The LUT's job is brand consistency, not a look. Colour nodes (`saturation(c, s)` with 1 neutral, `vibrance`, `hue`, `grayscale`, `posterize`, the `sepia` addon) allow only small static trims on JAL scenes (saturation 0.9 to 1.1, vibrance near 0) inside the same fused pass as the LUT; animated hue shifts, posterize, and sepia are filter looks for noyzzi or a JEV taste pass.
- AA nodes: `fxaa` and `smaa` from `three/addons/tsl/display/FXAANode.js` and `SMAANode.js` expect display-space input (after `renderOutput`); `traa` (`TRAANode.js`) needs a velocity target and a jittered camera, pays off only with slow camera motion, and replaces rather than stacks with FXAA or SMAA.
- Blur family (inside lawful recipes only, never a full-screen soften, each counted against the post budget): `gaussianBlur(node, sigma)` as the quality default at a fractional resolution; `boxBlur` for cheap mobile; `hashBlur` single-pass noisy frost; `bilateralBlur` edge-preserving.
- Depth of field (`three.post_light` only, T3 only, assembled in section 19): `dof(colorNode, scenePass.getViewZNode(), focusDistance, focalLength, bokehScale)` with focus at the subject in world units and bokeh scale about 1, so it reads as a lens; never over text or UI planes.
- WebGPU `RenderPipeline`: set `outputColorTransform = false` and call `renderOutput(scenePass)` wherever the chain needs display-space input; FXAA and LUTs need sRGB input.
- Exposure metering (only if a scene has a real exposure problem): render luminance into a 64 by 36 byte target encoded as `L / (L + 1)`, read it back asynchronously (never a second readback while one is pending, scheduled by time, about every 200 ms, not by frame count), decode with `e / max(1e-4, 1 - e)`. Average in log space with weight 1 for `L > 0.002` and 0.15 below, and in a JAL canvas also weight by alpha so transparent page pixels do not drag exposure up. Target `clamp(0.18 / avg * 2^EV, 0.45, 1.85)`, reached with `current += (target - current) * (1 - exp(-dt * speed))`, speed 3.2 brightening and 1.1 darkening; a failed readback holds the last value. Exactly one stage owns exposure (`renderer.toneMappingExposure` or the adapted multiplier, never both), and exposure never compensates for wrong light ratios, which are fixed in the lights. Tone-map exactly once, convert to sRGB exactly once.
- **A brand LUT generated in code:** a 32-cubed RGBA `Data3DTexture` (linear filter, clamp to edge, no mipmaps, unsigned byte) built by pushing each lattice colour through a small recipe: black and white point, a gentle S-curve blended at about 0.44, contrast about 0.5 pivot, shadow, midtone, and highlight tints weighted by `1 - smoothstep(0.12, 0.54, luma)`, `max(0, 1 - abs(luma - 0.5) * 2)`, and `smoothstep(0.48, 0.92, luma)`, per-channel gamma, saturation, vibrance, clamp 0 to 1. Sample with `uv = saturate(c) * (31 / 32) + 0.5 / 32` so lattice centres line up; blend `mix(c, graded, intensity)`. Neutral stays neutral on the page white.

**Aerial perspective toward the page white.** A transparent JAL canvas has no sky, so the lawful atmosphere is analytic depth haze. Per fragment take view distance `d` from the reconstructed view-space position (never raw depth, which is non-linear), transmittance `T = exp(-sigma * d)`, inscatter `(1 - T) * hazeColor`, output `surface * T + inscatter`. `hazeColor` is the linear value that tone maps to `--color-page`, so distant forms fade into the page white, not grey. Keep `T` and inscatter as separate debug terms, share `sigma` and any sun direction with the key light, and add height falloff `sigma(h) = sigma0 * exp(-h / H)` only when the camera sees a large vertical range. Never a full-screen fog colour or a sky gradient.

## 10. Image hover: cover UV and eased pointer

From: JAL-authored (JAL-native replacement for the noyzzi hover effects), three.js docs (MIT).

Build section for `three.img_hover` (with `sh.cover_uv_hover`). Each DOM image gets a WebGL plane at its exact box, sampled with cover-fit UVs, distorted by an eased pointer.

**Cover UV** (object-fit: cover in the shader):

```glsl
vec2 coverUv(vec2 uv, vec2 plane, vec2 image) {           // plane and image sizes in px
  float rp = plane.x / plane.y, ri = image.x / image.y;
  vec2 s = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
```

**Fragment** (ShaderMaterial, GLSL3, image texture with `colorSpace = SRGBColorSpace`; images are never tone mapped):

```glsl
uniform sampler2D uTex; uniform vec2 uPlane, uImage, uMouse; uniform float uHover, uVel;
in vec2 vUv;
void main() {
  vec2 d = vUv - uMouse; d.x *= uPlane.x / uPlane.y;      // aspect-correct distance
  float r = length(d);
  float fall = 1.0 - smoothstep(0.0, 0.35, r);           // never smoothstep with edge0 > edge1
  vec2 dir = r > 1e-4 ? d / r : vec2(0.0);
  vec2 uv = coverUv(vUv, uPlane, uImage) - dir * fall * uHover * (0.012 + 0.028 * uVel);
  uv = clamp(uv, vec2(0.001), vec2(0.999));
  vec3 col = texture(uTex, uv).rgb;
  float grey = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(grey), 0.15 * uHover * (1.0 - fall)); // calm focus: slight desaturation away from the pointer
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
```

**Pointer easing** (CPU, frame-rate independent, render on demand):

```ts
const s = { tx: 0.5, ty: 0.5, x: 0.5, y: 0.5, hover: 0, hoverT: 0, vel: 0 };
const fine = matchMedia("(hover: hover) and (pointer: fine)");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
el.addEventListener("pointermove", (e) => {
  const r = el.getBoundingClientRect();
  s.tx = (e.clientX - r.left) / r.width; s.ty = 1 - (e.clientY - r.top) / r.height;
}, { passive: true });
el.addEventListener("pointerenter", () => { if (fine.matches && !reduce.matches) { s.hoverT = 1; wake(); } });
el.addEventListener("pointerleave", () => { s.hoverT = 0; wake(); });

function step(dt: number) {                               // called from the one clock while awake
  const px = s.x, py = s.y, k = 1 - Math.exp(-8 * dt);
  s.x += (s.tx - s.x) * k; s.y += (s.ty - s.y) * k;
  const v = Math.min(Math.hypot(s.x - px, s.y - py) / Math.max(dt, 1e-3) / 2, 1);
  s.vel += (v - s.vel) * (1 - Math.exp(-4 * dt));
  s.hover += (s.hoverT - s.hover) * (1 - Math.exp(-6 * dt));
  uniforms.uMouse.value.set(s.x, s.y); uniforms.uHover.value = s.hover; uniforms.uVel.value = s.vel;
  const settled = Math.abs(s.hover - s.hoverT) < 1e-3 && s.vel < 1e-3;
  if (settled) sleep();                                   // stop rendering; ui_audit wants no idle rAF
}
```

**DOM sync.**
- Keep the `<img>` in the DOM (alt text, layout, the reduced-motion and no-WebGL state). Once the plane has rendered its first frame, set the image to `opacity: 0`; restore it on context loss.
- Planes: one fixed canvas behind the content (`position: fixed; inset: 0`, stacked below page content, `pointer-events: none`) with an orthographic camera in CSS pixels, or drei `View` per image. Cache each image rect on resize and derive its y from the Lenis scroll offset each tick, instead of calling `getBoundingClientRect` per frame.
- Touch devices and reduced motion: no plane distortion at all; the plain image, and at most a static grade.
- No RGB split or chromatic fringe: that is `nz.fx.glitch-shift` or `nz.fx.prism-hover` territory, inside its section only.

## 11. Full-screen quad setup

From: three.js docs and examples (MIT), drei (MIT), webgpu-claude-skill (custom pass as a `Fn`, in our own words), Threejs-Awesome-Graphics-Agent-Skills (pass hygiene, finite data textures), nixie-fx (procedural tile textures, baked imperfection), remotion (effect contract, ideas only), JAL-authored.

A single oversized triangle is cheaper than a quad (no diagonal seam, no overdraw on the split).

```ts
// WebGL
const tri = new THREE.BufferGeometry();
tri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
tri.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
const pass = new THREE.Mesh(tri, new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  vertexShader: "out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
  fragmentShader: frag,
  uniforms: { uTex: { value: null }, uTexel: { value: new THREE.Vector2() } },
  depthTest: false, depthWrite: false,
}));
pass.frustumCulled = false;
const passCam = new THREE.OrthographicCamera();            // ignored by the shader, required by render()
renderer.setRenderTarget(target); renderer.render(pass, passCam); renderer.setRenderTarget(null);
```

- three also ships `FullScreenQuad` in `three/addons/postprocessing/Pass.js`.
- R3F: `<mesh frustumCulled={false}><planeGeometry args={[2, 2]} /><shaderMaterial vertexShader={clipSpaceVert} fragmentShader={frag} /></mesh>`, rendered into a `useFBO` target from a `useFrame` with the portal pattern (`particles-physics.md` section 4).
- WebGPU: `const quad = new THREE.QuadMesh(nodeMaterial); renderer.setRenderTarget(rt); quad.render(renderer);`. A custom post effect is a `Fn` reading the scene pass texture node and returning a colour, assigned to `renderPipeline.outputNode` (sample other UVs with `texture(sceneTextureNode, uv)`): the JAL use is the section 8 dither after `renderOutput`. A vignette stronger than a few percent is banned.
- Render-target formats: `HalfFloatType` for state and HDR data (portable to mobile), `NearestFilter` for simulation state, `LinearFilter` plus mipmaps for blur sources. Dispose every target on unmount.
- **Pass hygiene.** A custom full-screen or offscreen pass saves and restores renderer state (target, viewport, `autoClear`), disposes its targets and materials, and is removed from the pipeline when disabled rather than run at zero strength. Texel size is a `vec2` of `1/width, 1/height`, never one scalar. Shaders that use `gl_FragCoord` get the drawing-buffer size (`renderer.getDrawingBufferSize`); a state target's aspect comes from its own size, not a lower-resolution helper.
- **Finite data textures.** A bounded field later sampled with clamp-to-edge (a contact mask, a stamp field, a caustic receiver) zeroes its outer two texels and crops with a two-texel guard, or the clamp smears any edge value into streaks.
- **Per-frame effect contract** (a reusable 2D or WebGL effect driven by a frame composition or a seekable timeline, `frames.md`): `setup(canvas)` creates the context, programs, and textures once; `apply({ source, params })` draws from the current frame's resolved parameters only, never from accumulated state, so any frame renders identically when seeked; `cleanup()` frees every GPU object. Key a cache on every resolved parameter and skip the draw when it is unchanged; validate parameters up front and throw on out-of-range values. Use the 2D context unless shader math or GPU speed is truly needed. After 2D drawing reset `filter`, `globalAlpha`, the transform, and `globalCompositeOperation`; for WebGL uploads keep premultiplied alpha consistent and set `flipY` for DOM-sourced images. Zone B law holds.

**Procedural tile textures.** For a repeating pattern (hex mesh, perforation, weave), draw one seamless tile on a 2D canvas at startup (a pointy-top hex of side s has a tile period of `sqrt(3) * s` by `3 * s`), wrap it in a `CanvasTexture` with `RepeatWrapping` on both axes and anisotropy per `three-foundations.md` 7.4, cache it at module scope, and apply it as the alpha map of one swept surface instead of modelling cells: one draw call at any cell density.

**Baked imperfection.** Hand-made objects read as real when irregularity is baked at build time from seeded noise: offset path control points by about 0.7% of the object height, scale the tube or edge radius by 1 plus or minus about 0.28 along the path, and write the same noise into a per-vertex attribute (clamped 0.55 to 1.32) that the material reads, so shading stays correlated with shape. Periodic noise for closed paths. Drive roughness or a slight darkening with it (wire, stitching, glaze thickness), never emission.

## 12. Specular anti-aliasing and derivative bump

From: Threejs-Awesome-Graphics-Agent-Skills (ideas, in our own words), three.js docs (MIT).

- **Specular AA.** Glossy procedural surfaces sparkle when the normal changes faster than a pixel. Take the per-pixel normal variance as the larger squared length of `dFdx(N)` and `dFdy(N)`, and widen roughness to `min(1, sqrt(r * r + k * variance))`, `k` about 1 to start. It trades sparkle for a slightly broader highlight exactly where detail is unresolved. Compare with stock `MeshStandardMaterial` first: three already filters normal maps on some paths.
- **Derivative bump.** When a height field exists only in the fragment stage, build the bump normal from screen derivatives of the view position and of the height, which keeps the stock lighting path and replaces only the normal input. Guard the determinant with a small epsilon and scale bump strength down with distance, so it never implies relief the silhouette lacks.

## 13. Refractive bodies beyond `MeshPhysicalMaterial`

From: Threejs-Awesome-Graphics-Agent-Skills (ideas, in our own words), three.js docs (MIT, `MeshPhysicalMaterial` attenuation), JAL-authored (cost).

The default for hero glass stays `MeshPhysicalMaterial` transmission. When a hero object needs a believable thick interior (sculpted glass, resin, ice):

- **Two-pass image-space thickness.** Each frame, before the camera pass and with the same camera, render only the glass subject into a half-float RGBA target (nearest filtering, no mips, depth on) storing world normal and camera distance, double-sided with depth inverted so the farthest surface wins. The glass shader seeds the interior segment with the view-ray thickness, then refines the exit point three times by projecting the estimate into that buffer. Clamp the segment between a minimum wall (about 0.08 at unit scale, so open sheets still tint) and three times the bounding diagonal.
- **Tint as absorption.** The author picks the colour a chosen thickness should show; extinction per channel is `sigma = -ln(max(tint, 1e-4)) / depth` and transmission is `exp(-sigma * pathLength)`, so thin edges and thick cores agree. Decode the tint from sRGB exactly once: a three `Color` from a hex literal is already linear, and a second conversion roughly doubles extinction silently. For `MeshPhysicalMaterial` the same idea is `attenuationColor` plus `attenuationDistance`.
- **Dispersion,** if used at all, stays subtle so it never reads as RGB split: derive a Cauchy fit from the glass pair `n_d` and Abbe `V_d` on the CPU, trace about 8 wavelengths between 415 and 695 nm, weight by colour-matching curves, and divide by the weight sum (under 6 samples splits into visible copies).
- A closed faceted gem is exact with a BVH hit against the mesh, where the image-space path is blind; direct `three-mesh-bvh` import is an approval candidate, ask Brian.
- Ship three debug views (view-ray thickness, stored back normal, entry Fresnel) and three checks: one wavelength reproduces the environment with no cast; zero absorption never exceeds the brightest environment value; a single segment shows refraction with no inner structure.
- Cost C3, hero object only: the subject is rasterised twice.

## 14. Surface accumulation masks

From: Threejs-Awesome-Graphics-Agent-Skills (ideas, in our own words).

For moss, dust, or snow: one mask drives coverage and raised thickness, and the same mask blends albedo, AO, roughness, and normal, so colour and height never disagree. On a ground plane the mask is in world XZ. On a model, compute coverage in model-locked coordinates (it must not swim when the object moves), gate it by the world-normal up component above about 0.35, and convert the desired world thickness through the mesh scale before displacing along the normal. When textures carry the identity and procedural fields only place it, say so in the recipe; a texture-backed look is not "procedural".

## 15. Spherical bodies (planets, globes, spherical products)

From: Threejs-Awesome-Graphics-Agent-Skills (field and LOD rules, ideas only), webgpu-claude-skill (terminator shading and layered shells, in our own words), JAL-authored (canvas law).

- At build, store the normalised pre-displacement direction as its own attribute and sample every field from it, so noise does not stretch on displaced slopes.
- Domain-warp on a sphere by removing the radial part of the warp vector and renormalising onto the shell.
- Features come from causes, never isolated threshold blobs: craters as floor, wall, rim, and optional ejecta; biomes from humidity (broad noise), temperature (latitude plus a height lapse), and slope (normal against the radial direction).
- Two coastline widths (a wider colour edge, a sharper land and water edge), both narrowing as the camera approaches; fade detail by distance with near, mid, and far weights instead of switching frequencies.
- Whole-body views: three or four `THREE.LOD` levels with hysteresis around 0.15, all from the same height function, so the silhouette never changes between levels.
- **Lit terminator and layered shells:** blend day and dark-side textures by `smoothstep(0.4, 0.6, dot(normalWorld, sunDir) * 0.5 + 0.5)` for a soft terminator, roughness following the same factor. A cloud or coating layer is a second sphere at 1.01 times the radius, `transparent`, `depthWrite: false`, UVs scrolled by a JAL-owned time uniform (frozen under reduced motion). No night-side emissive lights, no star field.
- Accept a body only if it holds unlit, as flat albedo, under grazing light, from far and close, across three seeds.
- JAL canvas: no atmosphere glow shell, no dark space field. The body sits on the page white with natural terminator shading.

## 16. Mesh-to-mesh sweep handover

From: Threejs-Awesome-Graphics-Agent-Skills (sweep handover, ideas only), webgpu-claude-skill and threejs-game-skills (dissolve, in our own words), JAL-authored (lawful edge, reduced motion).

Swapping one product model for another inside a canvas (idea only; the source repository carries no license):

- Compute one shared height range from the union of every model's bounds with a small margin (about 0.1 units each end), normalise world height into it, and discard the outgoing mesh below the progress value and the incoming mesh above it, so they never overlap.
- Progress is a linear ramp (about 1.5 s) inside a longer dwell (an eased moving line visibly decelerates); derive the current index from absolute elapsed time so a dropped frame cannot desync.
- The edge is a thin darker band, never an additive glow. Preallocate every mesh so the handover allocates nothing. Reduced motion: a 150 ms crossfade.

**Dissolve** (C1, the single-mesh sibling of the sweep). A reveal or exit compares a stable hash of quantised local position (`hash(positionLocal.mul(density))`, or smoother noise) with a threshold from scroll progress and discards below it (`Discard()` in TSL). The edge band just above the threshold (`smoothstep(t, t + 0.1, noise)`) darkens or tints toward ink or shifts roughness, never brightens (an emissive edge is glow). Reveal and removal read differently (a reveal rising from the base blends `position.y` into the threshold). `discard` disables early depth rejection, so the patched material is used only while the object transitions and swaps back to the stock material at 0 and 1. Reduced motion: a crossfade of 150 ms or less.

## 17. Parallax occlusion mapping and projected detail

From: Threejs-Awesome-Graphics-Agent-Skills (POM and projection, ideas only), webgpu-claude-skill (`triplanarTexture`), JAL-authored (tiers mapped to T1 to T3).

- **POM** (C2, hero surfaces only). Red channel is height (white is the peak); march depth `1 - h` in tangent space. Layers `mix(maxLayers, minLayers, saturate(abs(viewDir.z)))`; UV step `viewDir.xy / max(abs(viewDir.z), minViewZ) * scale / layers`. Starting tiers: low 8 to 32 layers, medium 16 to 96, high 32 to 160; T2 uses low, T1 drops POM for a normal map. Interpolate between the last two layers for the hit, and compute the march once for colour, roughness, and coverage (in TSL the normal graph compiles separately and needs its own call). Capture front, grazing, and along-axis views at every tier before shipping.
- Bounded tiles test coverage on the marched UV and clamp height fetches to the tile so grazing rays never hit a neighbour; feather only the coverage edge (alpha to coverage). On convex hosts add curvature sag to the ray depth (a cylinder tiled `n` times around uses curvature `[2pi / n, 0]`) and inflate the shell by the maximum relief so the floor stays on the real surface. Self-shadowing marches a second ray from the hit toward the light (about 20 steps, bias 0.03) and applies to direct light only; cast-shadow carving must be built in the shadow pass.
- **Planar and triplanar projection** paints graphics or detail across several parts without UV unwraps: project from world planes, weight by the world normal raised to about 4, and normalise the weights so a 45 degree shoulder commits to one plane instead of printing twice. A kill mask stops downward-facing surfaces low in the frame from smearing; limit the projection to a world band so unrelated objects stay clean.

## 18. Shader self-check

From: ai-dev-kit (silent compile failures, branch coherence), Threejs-Awesome-Graphics-Agent-Skills (deformed normals, one height function, explicit LOD, zero-vector guard, material failure list), three.js docs (MIT, `renderer.debug`), JAL-authored.

- [ ] A black, missing, or wrong mesh after a shader edit: read the console for `THREE.WebGLProgram` and `THREE.WebGLShader` errors first. Keep `renderer.debug.checkShaderErrors` on in dev and test; in production turn it off (it costs a sync stall) and set `renderer.debug.onShaderError` to log once and swap to the poster. Under TSL and WebGPU a compile error is a rejected `compileAsync` promise: await it and catch.
- [ ] No per-pixel divergent `if` on mobile (a condition built from noise, UV, or a texture value): GPUs shade pixels in groups and a split group pays for both sides. Use `mix(a, b, step(edge, x))`, `smoothstep` blends, or `select()` in TSL. Branching on a uniform or constant is fine.
- [ ] No `sin`-hash in anything visible on mobile; integer hash instead.
- [ ] Periodic detail fades by `fwidth`; no shimmer in a moving capture.
- [ ] Colour output joins three's pipeline (tone mapping where it should, colour space always) or is authored in display space; images are not tone mapped.
- [ ] No additive rim, bloom-like falloff, neon, purple, or chromatic fringe in a JAL canvas.
- [ ] `smoothstep` never called with edge0 greater than edge1 (undefined in GLSL and WGSL): use `1.0 - smoothstep(a, b, x)`.
- [ ] Time is frozen, or the loop sleeps, under reduced motion.
- [ ] Any vertex deformation (wobble, bend, wind) derives its normal from the deformation (analytic gradient on the tangent plane, or central differences of the displaced position); the rest normal makes rubber light like a sphere.
- [ ] Displacement and shading normals come from one height function; when a CPU path also evaluates it (placement, collision, floating objects), a test samples fixed points and compares within a small tolerance.
- [ ] Texture fetches inside loops, data-dependent branches, or after `discard` use an explicit level (`textureLod`, `.level()` in TSL): implicit derivatives are undefined there. Shadow-style comparison samples are taken unconditionally and weighted afterwards.
- [ ] Vectors that can reach zero (a cross product at alignment, a centre-to-point direction) are length-checked before `normalize`, falling back to the last finite value or a fixed axis: one `NaN` blanks the frame.
- [ ] Materials: no normal detail survives below one pixel; triplanar blends show no seam; roughness varies with the same causes as colour; a custom lighting term is checked against the stock material for energy; no post pass exists to calm a sparkling highlight (the fix belongs in the material, section 12).

## 19. Recipe build: three.post_light

From: three.js addons and TSL display nodes (MIT), pmndrs docs, webgpu-claude-skill (DoF and pipeline notes, in our own words), JAL-authored (stage rule, budget, law).

Build section for `three.post_light`: a modifier on any WebGL or WebGPU host (`three.studio_object`, `three.matcap_clay`, `three.sdf_blob`, and so on). It takes no role and its cost adds to the host's. The pieces live in sections 8 and 9; this section is the assembly.

- **When.** Default none. Only the `imm.tech` post stage (`SKILL.md` workflow step 10) adds it, after the first captures show a named problem: banding across pale falloff, stair-stepped silhouettes or thin lines, an off-brand colour cast, or a subject that needs separation from a busy foreground. Log each pass next to the problem it fixes; a pass with no logged problem is removed.
- **The lawful stack, nothing else.** AA (`fxaa` or `smaa`; `traa` only under slow camera motion, replacing the other two), a 3D LUT grade (the section 9 brand LUT with small static trims), dither (section 8), and subtle DoF (section 9). Never bloom, glow, a vignette stronger than a few percent, chromatic aberration, film grain as a look, or screen-space AO without a separate JEV cost check (`three-foundations.md` section 2).
- **Order** (one owner per stage, each with a disable switch, section 9 chain): scene in linear HDR, DoF on the HDR scene (it needs the view Z), tone map and `renderOutput`, LUT, AA on display-space input, dither last, output.
- **Cost.** Each full-resolution pass costs about 0.3 to 1.5 ms on T3 (estimate; measure it with `performance.md` section 6.4, since fill scales with DPR squared, `performance.md` section 5). `performance.md` section 1 allows T3 at most one pass beyond output: the LUT and dither fuse into the output pass and do not count, so AA or DoF takes the one slot, never both. When the host needs DoF, get edges from the renderer's multisampling instead (`antialias: true` on WebGL; a multisampled scene pass on WebGPU **[verify]**). SMAA is three internal passes but one slot.
- **Mobile.** None on T2 and T1, and the reduction ladder drops post first (`performance.md` section 4). `material.dithering = true` is a material flag, not a pass, and stays on every tier.
- **Libraries.** Three addons only, which ship with three: WebGPU `three/addons/tsl/display/` nodes (`fxaa`, `smaa`, `traa`, `lut3D`, `dof`, plus `bayerDither` from `tsl/math/Bayer.js`) in one `RenderPipeline`; WebGL `EffectComposer` with `RenderPass`, `ShaderPass(FXAAShader)` or `SMAAPass`, `LUTPass`, `BokehPass`, and `OutputPass` last. In R3F, render the composer from a `useFrame` with a positive priority, which takes over the default render. `postprocessing` and `@react-three/postprocessing` are approved through the scene module's `PostFX` (`premium-3d.md` section 6).
- **DoF limits.** T3 only; focus distance on the subject in world units, bokeh scale about 1, so it reads as a lens, not a blur filter. Text and UI stay DOM and are never behind a blurred plane. No animated focus pulls under reduced motion.
- **Transparent canvas.** The post targets carry alpha, so the page white still shows through; the `performance.md` section 6.5 background-equals-page-white assertion must pass with the stack on, and a dark fringe at silhouettes means an alpha or premultiply mismatch in a pass.
- **Verify.** Captures at 375 and 1280 with each pass toggled off and on (`performance.md` section 6.2), p95 frame time with and without the stack (section 6.4), and the poster captured with the same grade so poster and live scene match.
