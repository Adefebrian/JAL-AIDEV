# Shader craft: GLSL and TSL for JAL scenes

Written in our own words from general practice, the three.js source and TSL addons (MIT), Inigo Quilez's MIT-licensed snippets (iquilezles.org/articles, attribution below), and hash-prospector (Unlicense). Ideas only, never code, from The Book of Shaders (all rights reserved), LYGIA (Prosperity, non-commercial), Shadertoy (CC BY-NC-SA unless stated), and Maxime Heckel's articles (CC BY-NC). Every sketch here is new JAL code: check it on a real GPU before shipping.

Law inside a canvas (Zone B): natural light and shade are allowed. No additive glow, bloom, neon, purple family, chromatic aberration or RGB split, glitch, scanlines, or full-bleed smooth colour fields. noyzzi pieces are exempt inside their own section only.

## 1. Delivering shaders in three

| Route | When | Notes |
|---|---|---|
| `onBeforeCompile` on a stock material | Keep PBR lighting, patch one stage | Always set `customProgramCacheKey`, stash `material.userData.shader` to reach uniforms, reuse one material across meshes. WebGL only |
| `ShaderMaterial` | Full control, three prepends attributes and matrices | Skips tone mapping and colour space unless you end `main()` with `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`. Write `gl_FragColor` (three defines it to its own output under `glslVersion: THREE.GLSL3`) |
| `RawShaderMaterial` | You declare everything | With `glslVersion: THREE.GLSL3` three prepends `#version 300 es`; declare precision, attributes, uniforms, and your own `out vec4` |
| TSL node material (`three/webgpu`) | WebGPU, or both backends | Replace a slot (`colorNode`, `positionNode`, `normalNode`, `roughnessNode`, `opacityNode`, `emissiveNode`, `outputNode`), keep PBR. `onBeforeCompile` and `ShaderMaterial` are unsupported under WebGPU |
| drei `shaderMaterial(uniforms, vert, frag)` | R3F on WebGL | Typed class with uniform setters for JSX |

Load GLSL as text through Bun (`import frag from "./x.frag" with { type: "text" }`). GLSL has no file include: concatenate helper strings (`hash + noise + main`) at import time.

TSL rules that bite: nodes, not JavaScript variables, carry state (`.toVar()` plus `.assign()`, `select()`, `If`, `Loop`); uniforms are `uniform(value)` and you set `.value` from the frame loop; time is the `time` node; `wgslFn` and `glslFn` are the escape hatches. Built-in inputs: `positionLocal`, `positionWorld`, `normalView`, `normalWorld`, `uv()`, `screenUV`, `instanceIndex`, `vertexIndex`, `cameraPosition`, `positionViewDirection`.

Precision: `highp` for positions and anything accumulated over time; `mediump` is fine for colour on mobile. Keep `uTime` small (wrap it with `mod(time, 1000.0)` in periodic effects) so float precision does not degrade after long sessions.

## 2. Hashes

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

**Anti-alias procedural patterns.** Any periodic band whose period drops below the pixel footprint shimmers. Fade it toward its mean (not zero) by `fwidth`:

```glsl
float stripes(float x, float freq) {
  float v = 0.5 + 0.5 * cos(x * freq);
  float fw = fwidth(x * freq);
  return mix(v, 0.5, smoothstep(0.5, 2.0, fw));          // 0.5 is the band's mean
}
```

## 4. SDFs and raymarching

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

## 5. Domain warping

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

- Schlick: `F = F0 + (1 - F0) * pow(1 - saturate(dot(N, V)), 5)`, F0 0.02 to 0.04 for dielectrics.
- Stylised rim: `pow(1 - dot(N, V), p)` with p from 2 to 5.
- On light scenes a rim is a subtle darken or tint that separates the silhouette from the white page. An additive bright rim is glow and banned.

```js
// TSL: TSL has no fresnel export, so write it
import { Fn, float, normalView, positionViewDirection } from "three/tsl";
export const rim = Fn(([power = float(3)]) => normalView.dot(positionViewDirection).saturate().oneMinus().pow(power));
// mat.colorNode = baseColor.mul(rim(3).mul(0.2).oneMinus());   // darken up to 20% at grazing angles
```

## 7. Matcaps

- Sample a lit-sphere texture by the view-space normal: `uv = n.xy * 0.5 + 0.5`. `MeshMatcapMaterial` in WebGL, `matcapUV` in TSL.
- Scene lights and shadows do nothing; the material costs almost nothing. A neutral soft-grey matcap is the fastest calm "clay render" on a white page (`three.matcap_clay`).
- Bake our own matcap (a sphere rendered in Blender under a soft studio rig). Shared matcap packs have mixed licenses.
- Ground it with a baked contact shadow; a matcap object floating with no shadow looks pasted on.

## 8. Dithering and anti-banding

- Soft light falloff across white or pale surfaces bands visibly in 8-bit output. Cheapest fix: `material.dithering = true` on stock three materials.
- Custom shaders: add `(hash - 0.5) / 255.0` per pixel in display space right before output. Invisible, removes banding.

```glsl
col += (hash21(ivec2(gl_FragCoord.xy)) - 0.5) / 255.0;    // after tone mapping and colour-space conversion
```

- Ordered dithering: Bayer 4 by 4, 8 by 8, or the addon's 16 by 16 (`bayer16`, `bayerDither(color, steps)` in `three/examples/jsm/tsl/math/Bayer.js`). Blue noise gives a less patterned grain. Quantise after adding the threshold.
- Retro or print-style dithering is a style choice: it needs a JEV taste pass (`imm.taste`), and it is noyzzi territory when it reads as a filter (see `nz.fx.halftone-print`).

## 9. Colour grading

- Grade in linear space before tone mapping: exposure and white balance.
- Apply a 3D LUT in display space after tone mapping: `lut3D` (TSL), the `LUT` effect in pmndrs postprocessing (approval candidate), or `LUTPass` in three addons. A 32-cube LUT is enough.
- Keep contrast, saturation, and hue shifts small. The LUT's job is brand consistency, not a look.
- WebGPU `RenderPipeline`: set `outputColorTransform = false` and call `renderOutput(scenePass)` wherever the chain needs display-space input; FXAA and LUTs need sRGB input.
- Exposure metering (only if a scene has a real exposure problem): 64 by 36 meter, readback every 12 frames, clamp exposure 0.45 to 1.85, middle grey 0.18, adapt up 3.2 and down 1.1. Tone-map exactly once, convert to sRGB exactly once.

## 10. Image hover: cover UV and eased pointer

The JAL-native image hover (`three.img_hover`): each DOM image gets a WebGL plane at its exact box, sampled with cover-fit UVs, distorted by an eased pointer.

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
- No RGB split or chromatic fringe: that is noyzzi's `glitch-shift` or `prism-hover` territory, inside its section only.

## 11. Full-screen quad setup

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
- WebGPU: `const quad = new THREE.QuadMesh(nodeMaterial); renderer.setRenderTarget(rt); quad.render(renderer);`.
- Render-target formats: `HalfFloatType` for state and HDR data (portable to mobile), `NearestFilter` for simulation state, `LinearFilter` plus mipmaps for blur sources. Dispose every target on unmount.

## 12. Shader self-check

- [ ] No `sin`-hash in anything visible on mobile; integer hash instead.
- [ ] Periodic detail fades by `fwidth`; no shimmer in a moving capture.
- [ ] Colour output joins three's pipeline (tone mapping where it should, colour space always) or is authored in display space; images are not tone mapped.
- [ ] No additive rim, bloom-like falloff, neon, purple, or chromatic fringe in a JAL canvas.
- [ ] `smoothstep` never called with edge0 greater than edge1 (undefined in GLSL and WGSL): use `1.0 - smoothstep(a, b, x)`.
- [ ] Time is frozen, or the loop sleeps, under reduced motion.
