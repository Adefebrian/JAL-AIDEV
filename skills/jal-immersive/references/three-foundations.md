# Three foundations: renderer, color, WebGPU, Bun.build, assets, lifecycle

Distilled from the three.js manual and source (MIT), react-three-fiber and drei docs (MIT), the game and WebGPU skill packs (MIT, dgreenheck and majidmanzarpour), Bruno Simon's folio-2025 pipeline (MIT), and Bun 1.3.14 checks run on dummy files. Code here is written for JAL. Lines marked **[verify]** were not executed against the installed version; check them once per project.

## 1. Version pins (observed 2026-09-29)

| Package | Version | Constraint that matters |
|---|---|---|
| `three` | 0.186.1 (r186) | Exports `three`, `three/webgpu`, `three/tsl`, `three/addons/*`. Pin with a tilde (`~0.186.1`) so addons, decoders, and types never drift a minor |
| `@types/three` | match three's minor | |
| `@react-three/fiber` | 9.8.1 | Peer `react >=19 <19.4`, `three >=0.156`. v10 (first-class WebGPU, new scheduler) is alpha: do not ship it |
| `@react-three/drei` | 10.7.9 | Pulls `three-stdlib`, `camera-controls`, `detect-gpu`, `maath`, `meshline`, `stats-gl`, `three-mesh-bvh`, `troika-three-text`, `zustand` |
| `postprocessing` (candidate) | 6.39.5 | Peer `three >=0.168 <0.187`. Approving it caps three below r187 |
| `@react-three/postprocessing` (candidate) | 3.1.3 | |
| `lenis` | 1.3.26 | React wrapper at `lenis/react` |
| `gsap` / `@gsap/react` | 3.15.0 / 2.1.2 | GSAP Standard License, not MIT: never copy GSAP source |
| `@react-three/rapier` (candidate) | 2.2.0 | Pins `@dimforge/rapier3d-compat` 0.19.2 |
| `three-mesh-bvh` | 0.9.15 | Transitive through drei |
| `maath` | 0.10.8 | Use npm `maath`, not the GitHub rewrite named `math` |
| `nixie-fx` (candidate) | 0.1.16 | Peer `three >=0.184.0 <0.186.0`: conflicts with r186. Approving it means pinning three to 0.185.x |

**React version.** The JAL template ships React 18.3. Any app that uses R3F bumps `react` and `react-dom` to 19.x below 19.4. A vanilla-three section works on React 18.

**One three.** Never bundle both `three` (WebGL build) and `three/webgpu` renderers in one app: each pulls a different core entry and the bundle doubles. WebGPU projects alias `three` to `three/webgpu` (section 5).

## 2. Renderer setup (WebGL)

```ts
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; // product and UI scenes; ACES or AgX only for a cinematic hero
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);             // transparent: the DOM page white shows through

  const scene = new THREE.Scene();
  scene.background = null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // one bake, near-zero per frame
  pmrem.dispose();
  scene.environmentIntensity = 1.0;                 // r184+ global IBL multiplier
  return { renderer, scene };
}

export function dprFor(cssW: number, cssH: number, budgetPx: number, maxDpr: number) {
  const device = Math.min(window.devicePixelRatio || 1, 2);            // law: never above 2
  const budget = Math.sqrt(budgetPx / Math.max(1, cssW * cssH));
  return Math.max(1, Math.min(device, maxDpr, budget));
}

export function fit(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, el: HTMLElement, budgetPx: number, maxDpr: number) {
  const w = el.clientWidth, h = el.clientHeight;
  const dpr = dprFor(w, h, budgetPx, maxDpr);
  const c = renderer.domElement;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);                  // false: CSS size stays owned by layout
    camera.aspect = w / h;
    camera.fov = w < 640 ? 36 : 30;                 // widen on narrow screens so the subject stays framed
    camera.updateProjectionMatrix();
  }
}
```

- Drive `fit` from a `ResizeObserver` on the container, never from `window.resize` alone.
- Exactly one render loop per page. Two active loops are a top cause of broken canvases.
- Budgets for `dprFor`: desktop 1,650,000 px with max DPR 1.5, mobile 1,000,000 px with max DPR 1.25, min DPR 1 (`performance.md`).

**The JAL-lawful look.** White or off-white page behind a transparent canvas, soft neutral environment (RoomEnvironment, or two to three large light cards baked to PMREM with sigma about 0.03, re-bake throttled to 150 ms minimum with the old target disposed), one directional key with a soft shadow (1024 on mobile, 2048 on desktop) or a fake contact shadow, materials separated by roughness and metalness contrast rather than hue, Neutral tone mapping at exposure about 1.0, no post beyond output.

**Order of work:** forms, then materials, then lighting, then effects. Glow never makes primitives look expensive.

**Material recipes** (`MeshStandardMaterial` by default, `MeshPhysicalMaterial` only where clearcoat, transmission, or sheen is visible):

| Look | Settings |
|---|---|
| Brushed metal | metalness 1.0, roughness 0.4, envMapIntensity 1.1 |
| Rubber | roughness 0.92, envMapIntensity 0.35 |
| Painted metal | clearcoat 0.9, clearcoatRoughness 0.15 |
| Real glass | transmission 1, thickness 0.5, ior 1.5. Costs an extra scene render into a transmission buffer per frame: hero object only, never repeated props |
| Fake glass | transparent, opacity 0.25, clearcoat 1, `depthWrite: false`: one transparent draw |

- Metals and glossy surfaces read flat grey without an environment map.
- Lighting stack: key, fill, rim (as a darker or tinted edge, never additive), practical, contact grounding. Real shadows only for the hero object and big anchors. Small props get a fake contact shadow (a soft radial texture on a plane, or drei `<ContactShadows frames={1}>`).
- Bevel bands (metres): hardware 0.002, panel edges 0.004, carcass or plinth 0.007. Segments by radius: up to 0.025 m use 10 to 14, up to 0.1 m use 16 to 24, 0.15 m and up use 28 to 48.
- One surface identity drives all PBR channels. Independent noise per channel gives visual soup.

## 3. The white-background tone-mapping trap

Verified by evaluating three's tone-mapping shader chunk for a linear 1.0 input:

| Tone mapping | Linear out | sRGB byte | Hex |
|---|---|---|---|
| `NeutralToneMapping` | 0.869 | 240 | `#F0F0F0` |
| `ACESFilmicToneMapping` (R3F default) | 0.763 | 226 | `#E2E2E2` |
| Neutral at exposure 1.2 | | 245 | |
| ACES at exposure 1.2 | | 232 | |

So a WebGL-painted background or white ground plane never matches the DOM's `#FFFFFF` or `--color-page`. With a post composer the clear colour is tone mapped too, because post applies to the full image.

**The fix:**

1. Transparent canvas over the DOM page: `alpha: true`, `setClearColor(0, 0)`, `scene.background = null`. R3F already creates its renderer with `alpha: true`; never add `<color attach="background">`.
2. Surfaces that must read as pure white (a white plinth, paper, a UI card in 3D) get `toneMapped={false}` on their material in R3F, or `material.toneMapped = false` in vanilla. Or light them past the curve's knee and prove it by pixel sampling.
3. Prefer `NeutralToneMapping` (Khronos PBR Neutral) for product and UI scenes: it keeps base colours true below about 0.76. In R3F: `onCreated={({ gl }) => { gl.toneMapping = THREE.NeutralToneMapping }}`.
4. Premultiplied alpha is on by default. A dark halo at object edges on white means the alpha or premultiply settings are wrong, or a material writes colour without alpha.
5. Verification samples canvas pixels outside the subject: they must equal the page token exactly (`performance.md` section 6).

A raw `ShaderMaterial` skips tone mapping and colour-space conversion unless it includes `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` at the end of `main()`. Either include them or author in display space.

## 4. WebGL vs WebGPU/TSL

| | WebGL (`three`) | WebGPU (`three/webgpu` + `three/tsl`) |
|---|---|---|
| Renderer | `WebGLRenderer` | `WebGPURenderer`, `await renderer.init()` before any compute |
| Shaders | GLSL, `ShaderMaterial`, `onBeforeCompile` | TSL node materials (`colorNode`, `positionNode`, `normalNode`, `roughnessNode`, `opacityNode`, `emissiveNode`, `outputNode`); `onBeforeCompile` and `ShaderMaterial` are unsupported |
| Compute | FBO ping-pong through fragment shaders | `instancedArray(count, "vec3")`, `Fn(() => {...})().compute(count)`, dispatch with synchronous `renderer.compute(node)` (`computeAsync` deprecated since r181) |
| Post | `EffectComposer`, `RenderPass`, passes, `OutputPass` (tone map and sRGB move to OutputPass) | `new THREE.RenderPipeline(renderer)` (renamed from `PostProcessing` in r183), `pass(scene, camera)`, compose into `outputNode`, `renderPipeline.render()` |
| Fallback | Poster | `WebGPURenderer` falls back to a WebGL2 backend when `navigator.gpu` is absent; `forceWebGL: true` tests that path **[verify]**. TSL materials run on both backends; compute and `StorageTexture` need the WebGPU backend |
| Loss | `webglcontextlost` / `webglcontextrestored` | `renderer.onDeviceLost = (info) => {}`; no automatic restore |

Choose WebGPU only when the section needs compute (tens of thousands of stateful elements), storage buffers, or TSL features, and a WebGL2 or poster fallback is acceptable (`imm.tech`). Otherwise WebGL.

TSL essentials:
- Recommended three r171 or later. r178 renamed `PI2` to `TWO_PI` and `transformedNormalView/World` to `normalView/World`.
- The gotcha that breaks most TSL: TSL sees node method calls, not JavaScript reassignment. Use `.toVar()` plus `.assign()`, `select()`, or `element(i).assign()` inside `If()`.
- Device defaults: `maxBufferSize` 256 MiB, `maxStorageBufferBindingSize` 128 MiB, 8 storage buffers per stage, workgroup X and invocations 128. Request higher via `requiredLimits` only after reading `adapter.limits`; requesting maximums hides portability bugs.
- Texture compression features: `texture-compression-bc` (desktop), `-etc2`, `-astc` (mobile).
- GPU watchdog fires around 10 s of shader work. Chrome blocks the adapter after repeated crashes (a second crash within 2 minutes fails, a third blocks all pages).

## 5. The `three/webgpu` alias plugin for Bun.build

In a WebGPU project, R3F, drei, and addons import `three`. Alias it so they all share the WebGPU build:

```ts
// apps/web/build.ts (excerpt)
import type { BunPlugin } from "bun";

const here = import.meta.dir;
const threeWebGPU: BunPlugin = {
  name: "three-webgpu-alias",
  setup(build) {
    const target = Bun.resolveSync("three/webgpu", here);
    build.onResolve({ filter: /^three$/ }, () => ({ path: target }));
  },
};
// Bun.build({ ..., plugins: [threeWebGPU] })
```

- The filter matches the bare specifier `three` only. `three/tsl` already imports the WebGPU build; `three/addons/*` then resolve their `three` import to the WebGPU build too.
- Addons that need WebGL-only classes (`EffectComposer` passes, `WebGLRenderer`-specific helpers) fail once aliased; the build or console names the missing export. Check every drei helper you use.
- R3F v9 with WebGPU: `import * as THREE from "three/webgpu"`, `extend(THREE)`, and an async `gl` factory (`r3f.md` section 10).

## 6. Lazy loading with dynamic `import()`

```ts
// apps/web/build.ts: turn on code splitting for immersive apps
const res = await Bun.build({
  entrypoints: [join(here, "src/index.tsx")],
  outdir,
  target: "browser",
  format: "esm",
  splitting: true,              // each dynamic import() becomes its own chunk
  minify: true,
  sourcemap: "linked",
  publicPath: "/",              // absolute URLs for chunks and assets
  naming: { entry: "[dir]/[name].[ext]", chunk: "chunks/[name]-[hash].[ext]", asset: "assets/[name]-[hash].[ext]" },
  loader: { ".glsl": "text", ".vert": "text", ".frag": "text", ".wgsl": "text" },
});

// Chunk budget: fail the build over the agreed gzip size.
const BUDGET_GZIP = 250 * 1024; // set per project in the ADR
for (const out of res.outputs) {
  if (out.kind !== "chunk" && out.kind !== "entry-point") continue;
  const gz = Bun.gzipSync(new Uint8Array(await out.arrayBuffer())).length;
  if (gz > BUDGET_GZIP) { console.error(`chunk over budget: ${out.path} ${gz} B gzip`); process.exit(1); }
}
```

```tsx
// the section host imports the scene only when it qualifies (poster-first, SKILL.md section 6)
const mod = await import("./immersive/hero-scene"); // three lands in this chunk, not in index.js
```

- The template's `index.html` already loads `/index.js` as `type="module"`, which `splitting` needs.
- The entry chunk must never import three statically, not even a type-only import that is not erased: keep `import type` for types.
- Flag any chunk over about 150KB gzip in the perf audit; images over about 200KB.

## 7. Asset pipeline on Bun.build

### 7.1 Imports

- `import modelUrl from "./model.glb"` (and `.ktx2`, `.wasm`, `.hdr`) uses Bun's `file` loader: the file is copied into `outdir` under `naming.asset` and the import returns its URL. Without `publicPath: "/"` the URL is relative to the bundle file (`"./dec-4swqeqke.wasm"`).
- Types, in `src/assets.d.ts`:

```ts
declare module "*.glb" { const url: string; export default url; }
declare module "*.ktx2" { const url: string; export default url; }
declare module "*.hdr" { const url: string; export default url; }
declare module "*.frag" { const src: string; export default src; }
declare module "*.vert" { const src: string; export default src; }
```

- GLSL: `import frag from "./drops.frag" with { type: "text" }`, or the `loader` map above. GLSL has no `#include` for files: concatenate helper strings at import time.
- MIME from `Bun.file().type`: `model/gltf-binary` (.glb), `model/gltf+json` (.gltf), `image/ktx2`, `application/wasm`. `.hdr`, `.bin`, `.riv`, `.lottie` are `application/octet-stream`, which loaders accept. Hono `serveStatic` serves them correctly.

### 7.2 Self-hosted decoders (copied by the build script)

Draco and Basis are fetched at runtime by filename, so they are copied, not imported. Version the path with three's release so an upgrade never mixes decoder versions:

```ts
// apps/web/build.ts (after Bun.build; dist/ was wiped at the start)
import { cp } from "node:fs/promises";
import { dirname } from "node:path";

const threeRoot = join(dirname(Bun.resolveSync("three", here)), ".."); // node_modules/three
const REV = "r186";
await cp(join(threeRoot, "examples/jsm/libs/draco/gltf"), join(outdir, `vendor/${REV}/draco`), { recursive: true });
await cp(join(threeRoot, "examples/jsm/libs/basis"), join(outdir, `vendor/${REV}/basis`), { recursive: true });
```

- Draco folder holds `draco_decoder.wasm`, `draco_wasm_wrapper.js`, `draco_decoder.js`. Basis holds `basis_transcoder.js`, `basis_transcoder.wasm`.
- Meshopt: `three/addons/libs/meshopt_decoder.module.js` embeds its WASM and bundles as a normal import. drei wires it automatically.
- Serve `/vendor/r186/*` and `/assets/*` with `Cache-Control: public, max-age=31536000, immutable`.

Vanilla wiring:

```ts
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const draco = new DRACOLoader().setDecoderPath("/vendor/r186/draco/");
const ktx2 = new KTX2Loader().setTranscoderPath("/vendor/r186/basis/").detectSupport(renderer);
const gltf = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
```

### 7.3 CDN defaults to override (every one, every project)

| Library | Default fetch | Override |
|---|---|---|
| drei `useGLTF` | Draco from `https://www.gstatic.com/draco/versioned/decoders/1.5.5/` | `useGLTF.setDecoderPath("/vendor/r186/draco/")` once at module scope, or pass the path as the second argument |
| drei `useKTX2` | Basis from jsdelivr `drei-assets@master/basis/` | Always pass `"/vendor/r186/basis/"` as the second argument |
| drei `<Environment preset>` | HDRs from `raw.githack.com` | Never use presets. Ship a small HDR (`files="/env/studio.hdr"`) or build the rig from `<Lightformer>`s |
| drei `<Text>` (troika) | Font from a CDN when `font` is unset | Always pass `font="/fonts/<file>.woff"` |
| drei `useDetectGPU` / `detect-gpu` | Benchmarks from unpkg | Skip it; use `PerformanceMonitor`. Only with self-hosted benchmarks after approval |
| Rive runtime (candidate) | `rive.wasm` from unpkg, jsdelivr fallback | `RuntimeLoader.setWasmUrl("/vendor/rive/rive.wasm")`, disable the fallback |

Self-hosting everything keeps the template CSP (`connect-src 'self'` plus the API origin, `img-src 'self' data:`, `font-src 'self'`) intact. A 3D app needs three CSP additions in `apps/web/server.ts` `secureHeaders`, and only a 3D app gets them (record them in the project ADR): `workerSrc: ["'self'", "blob:"]` (DRACOLoader and KTX2Loader spawn blob workers), `imgSrc` gains `"blob:"` (GLTFLoader turns embedded textures into blob URLs), and `scriptSrc` gains `"'wasm-unsafe-eval'"` (Draco, Basis, and meshopt decoders compile WebAssembly; this allows WebAssembly compilation only, never JS `eval`). Verify with the console: zero CSP errors on a scene that loads a Draco or KTX2 asset.

### 7.4 Formats and budgets

- **Geometry:** meshopt (EXT_meshopt_compression plus quantization) by default: tiny fast decoder, compresses animation, pairs with brotli. Draco only for dense static meshes such as scans. Never both on one asset. Reference quantization (folio-2025): position 12, normal 6, texcoord 6, colour 2, generic 2 bits.
- **Textures:** PNG, JPG, and WebP decode to full RGBA8 in VRAM: 4 bytes per pixel plus a third for mipmaps, so one 2048 by 2048 texture costs about 22 MB. KTX2 stays compressed in GPU memory, 4 to 8 times smaller: ETC1S for colour and albedo, UASTC for normals and anything where artefacts show. Data maps (roughness, masks, SDFs) are linear and single-channel where possible; only colour maps are sRGB. Max 2048 on mobile. WebP is the fallback until the `ktx` tool is approved.
- **GLB intake checklist:** file size, triangles, mesh, material, and texture counts, texture dimensions, scale in metres, pivot, bounds, clip names, mobile cost. Build collision or raycast proxies separately. Dispose on scene exit.
- **Scene hygiene** (gltf-transform functions): dedup, prune, weld, instance (repeated meshes become EXT_mesh_gpu_instancing), join, simplify for LODs, resample for animation, center. Run `inspect` first and fix the dominant problem (geometry, texture, or draw-call heavy).
- Loader triage when a model fails: base path, CORS and MIME, external buffers, colour space and flipY, Draco or meshopt requirement.

### 7.5 Offline optimisation under Bun (approval candidate, dev only)

`@gltf-transform/core`, `/extensions`, `/functions` and `meshoptimizer` are pure JS or WASM and run under Bun. **Needs Brian's yes** as devDependencies. The texture steps need native tools (`sharp`, KTX-Software `ktx` 4.4 or later), a separate approval.

```ts
// scripts/optimize-assets.ts, run with: bun scripts/optimize-assets.ts in.glb
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld, instance, join, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const [src] = Bun.argv.slice(2);
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(src);
await doc.transform(dedup(), prune(), weld(), instance(), join(), meshopt({ encoder: MeshoptEncoder }));
await io.write(src.replace(/\.glb$/, "-opt.glb"), doc);
// [verify] option names against the gltf-transform docs for the installed version.
```

Keep `.blend` files and raw GLBs out of `public/`; commit only optimised outputs and fail the build when a GLB exceeds its budget.

## 8. Disposal

**Vanilla teardown order** (return it from the mounting `useEffect`):

1. `cancelAnimationFrame` or remove the `gsap.ticker` callback.
2. Disconnect `ResizeObserver` and `IntersectionObserver`; remove `matchMedia`, `pagehide`, `visibilitychange`, and pointer listeners.
3. Kill this section's ScrollTriggers (`ctx.revert()` from `gsap.context` or `useGSAP`) and destroy Lenis if the section owns it.
4. `controls.dispose()`.
5. Dispose effect systems (particle pools, nixie-fx `destroy()`), render targets, `StorageTexture`s, composers or `RenderPipeline`, PMREM targets and generators.
6. Traverse and dispose the scene graph (helper below).
7. `renderer.dispose()`, then remove the canvas.

```ts
export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
      mat.dispose();
    }
  });
}
```

**R3F:** unmounted objects are disposed automatically. Mark shared or cached subtrees `dispose={null}`. Clear loader caches you own on route leave (`useGLTF.clear(url)`, `useKTX2.clear`). Dispose render targets, PMREM, and composers yourself. R3F v9 releases its own WebGL context on unmount but does not call `dispose()` on a renderer instance you passed in.

Mutating or disposing a cached asset breaks every other user: clone first (drei `<Clone>`, or `scene.clone()`).

## 9. Context loss and device loss

- three's `WebGLRenderer` already calls `preventDefault()` on `webglcontextlost`, skips rendering while lost, and reinitialises GL state on `webglcontextrestored`. Geometry and textures with source data re-upload. Render-target contents and textures whose image was released are lost.
- Browsers cap live WebGL contexts (commonly about 16) and silently drop the oldest: one canvas per page, drei `View` for more regions.

```ts
export function guardContext(canvas: HTMLCanvasElement, h: { showPoster(): void; hidePoster(): void; pause(): void; resume(): void; rebuild(): void }) {
  let losses: number[] = [];
  const lost = (e: Event) => { e.preventDefault(); h.pause(); h.showPoster(); losses.push(performance.now()); };
  const restored = () => {
    losses = losses.filter((t) => performance.now() - t < 60_000);
    if (losses.length > 1) return;           // repeated loss within a minute: stay on the poster
    h.rebuild();                             // regenerate GPGPU state and PMREM environments
    h.resume(); h.hidePoster();              // then invalidate() and fade back in
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return () => { canvas.removeEventListener("webglcontextlost", lost); canvas.removeEventListener("webglcontextrestored", restored); };
}
```

- WebGPU: `renderer.onDeviceLost = (info) => { showPoster(); }`. The renderer stops for good. Either stay on the poster or tear down and recreate the renderer once, after a short delay, with a fresh adapter; keep app state outside the renderer. Listen on `device.lost` only through three's hook; never `await` it directly.
- Test: `renderer.getContext().getExtension("WEBGL_lose_context").loseContext()`, then `.restoreContext()`. WebGPU: `device.destroy()`, or `about:gpucrash` manually.

## 10. Input, accessibility, and lifecycle checklist per scene

- `ResizeObserver` fit, `IntersectionObserver` pause (browsers keep running rAF for off-screen canvases), `visibilitychange` pause, `pagehide` teardown.
- `matchMedia("(prefers-reduced-motion: reduce)")` read and listened to live: no autorotate, no scrub, no camera drift, no ambient loop; the poster or authored stills.
- Canvas `aria-hidden="true"` when decorative; interactive canvases get `tabIndex=0`, an `aria-label`, keyboard equivalents, and a visible focus ring on the wrapper.
- Scope `touch-action` to the canvas and its controls so page scroll cannot steal input (and so the canvas does not trap page scroll when it is not interactive).
- A diagnostics object behind a dev flag: `window.__immersive = { ready, seek(p), renderer: renderer.info }`.
