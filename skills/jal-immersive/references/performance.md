# Performance: budgets, device tiers, fallbacks, verification

Numbers come from the MIT game skill pack (render budgets, canvas inspector), the TAG image-pipeline pixel budgets (ideas and numbers, MIT portions), the three.js and R3F docs, and the clean-room effect targets. Rows marked **[JAL]** are JAL synthesis anchored to those numbers: they are starting values, so measure on a real GPU before quoting them as facts. A website section shares the frame with DOM layout, Lenis, and GSAP, so JAL budgets are tighter than game budgets.

## 1. The budget table (worst active view, per section)

| Metric | T3 desktop full | T2 mobile full | T1 mobile reduced | T0 static |
|---|---|---|---|---|
| Draw calls (`info.render.calls`) | 100 or fewer | 50 or fewer | 30 or fewer | poster |
| Triangles | 300k or fewer | 150k or fewer | 80k or fewer | poster |
| Textures | 24 or fewer | 16 or fewer | 12 or fewer | poster |
| Texture memory (estimated) | 96 MB or less | 48 MB or less | 32 MB or less | poster |
| Shadow casters | 1 at 2048 | 1 at 1024, or fake | fake only | poster |
| Post passes beyond output | 0 to 1 (AA only) | 0 | 0 | none |
| DPR | pixel budget 1.65 MP, max 1.5 | 1.0 MP, max 1.25 | max 1.0 | image `srcset` |
| Scene chunk (gzip) | agreed per project in the ADR, enforced by the build script | same | same | none |
| Frame time p95, real GPU | under 16.7 ms | under 16.7 ms | under 33 ms, or go static | none |
| Particles (starting values) **[JAL]** | 100k points, 262k GPGPU or compute | 30k points, 65k GPGPU | 10k points, 16k GPGPU | poster |
| Clean-room effects per viewport | 2 | 2 | 1 | poster |

Game-pack reference budgets, for comparison (a full-screen game, not a page section): draw calls 300 desktop and 150 mobile, triangles 750k and 300k, geometries 300 and 200, textures 60 and 40, texture memory 256 MB and 128 MB, shadow-casting lights 2 and 1, shadow map 2048 and 1024, DPR cap 2 and 1.5 to 2, post passes 2 and 0 to 1.

Other load budgets: flag any JS chunk over about 150KB gzip and any image over about 200KB in the perf audit; the poster is at most 200KB WebP.

## 2. DPR and the pixel budget

- **Law:** DPR never exceeds 2, on any tier, any section, noyzzi included.
- **Budget formula:** `dpr = clamp(sqrt(budgetPx / cssPx), 1, maxDpr)` with the device DPR as a further ceiling. Budgets: 1,650,000 px desktop (max 1.5), 1,000,000 px mobile (max 1.25), min DPR 1. Implementation: `dprFor()` in `three-foundations.md` section 2; R3F takes it as `dpr={[1, cap]}`.
- **Small views** **[JAL]**: a drei `View` or embedded canvas under about 0.4 MP of CSS pixels may use up to DPR 2 on T3, because the formula already keeps fill under budget. Crisp product thumbnails matter more than a full-bleed hero's last half pixel.
- Low-resolution effect passes run at a fixed fractional DPR (for example 0.4 DPR for a blur, 0.5 `resolutionScale` for a raymarch or reflector) and upsample. Over edges, weight the four low-res neighbours by depth similarity (`exp(-abs(dz) / (k * z))`) and normal similarity when available, falling back to nearest depth: plain bilinear upsampling halos the white page around subjects.
- Never lower DPR to hide a real defect: fix the cause (draw calls, overdraw, a per-frame allocation), then tier. Any quality cut must name what it preserves and what it loses.

## 3. Device tiers used by `imm.tier`

Planning assigns a tier from signals before load; the binding `imm.tier` call uses measured numbers; at runtime `PerformanceMonitor` may demote one tier, never promote.

| Tier | Assigned when | Ships |
|---|---|---|
| T0 static | `prefers-reduced-motion: reduce` (unless the visitor opts in to a user-driven scene through a "View in 3D" button), `navigator.connection.saveData`, no WebGL2, two context losses within a minute, `PerformanceMonitor` `onFallback`, or measured T1 p95 over 33 ms | Poster plus DOM content only |
| T1 reduced | Coarse pointer and (`deviceMemory` 4 or less, or `hardwareConcurrency` 4 or less); or a T2 or T3 device that misses its budget after the ladder's first two steps | T1 column: DPR 1.0, no post, fake shadows, a quarter of the particles, simplest fallback of each recipe |
| T2 mobile full | Coarse pointer or viewport under 1024 px wide, and not T1 | T2 column: DPR up to 1.25, no post, one 1024 shadow or fake |
| T3 desktop full | Fine pointer and viewport 1024 px or wider | T3 column: DPR up to 1.5 (2 for small views), AA pass allowed |

- `navigator.deviceMemory` is Chromium-only: when it is missing on a coarse-pointer device, start at T2 and let the monitor demote.
- WebGPU is a capability, not a tier: a `webgpu_tsl` recipe on a T2 device without `navigator.gpu` runs its WebGL2 fallback at T2 budgets.
- Hidden or off-screen scenes do not tick on any tier (`IntersectionObserver` plus `visibilitychange`).

## 4. The reduction ladder (mobile and low-power fallbacks)

Apply in order and stop as soon as the budget holds. Record for each step what the scene keeps.

1. Drop DPR to the tier floor.
2. Drop post-processing (the AA pass first).
3. Cheaper shadows: real to 1024, then fake contact shadow, then baked.
4. Cull, LOD, and instance: frustum-cull tiles, `<Detailed>` LODs with hysteresis, merge by material slot.
5. Halve particle or instance counts, reduce density where least visible (far field first).
6. Swap to each recipe's named mobile fallback (for example `cr.wet_ground` drops the reflector and uses the env map).
7. Switch to the poster (T0).

Optimisations by payoff when profiling: instancing, sharing geometry and materials, pooling, culling, LOD, DPR cap, cheaper shadows, fewer post passes, texture atlases and KTX2, no per-frame allocation, disposal.

## 5. Cost references

**Post-processing.** Composer targets are full-resolution, usually HDR, so every pass costs fill that scales with DPR squared. One RGBA16F target at 1.65 MP is about 13 MB (1.65M px times 8 bytes); every pass reads and writes at least one. SMAA is three passes (edges, weights, blend). On WebGL with pmndrs `EffectComposer` (approval candidate) consecutive effects merge into one pass, with at most one convolution effect (such as DoF) per pass; recommended renderer settings there are `antialias: false`, `stencil: false`, `depth: false`. The WebGPU `RenderPipeline` fuses node chains; `scenePass.setMRT(mrt({ output, normal: normalView, depth }))` renders several targets in one scene pass (read with `scenePass.getTextureNode("normal")`), declaring only targets a pass reads; MRT attachments default to RGBA16F, drop 8-bit data (packed normals, metal and rough) to `UnsignedByteType` to halve bandwidth. Default JAL stack: none.

**Render-target ownership table.** Before adding any second pass, write one row per signal: signal, producer, consumers, colour space and format, resolution, history (yes or no). Each signal has exactly one producer (no depth prepass when the scene pass already owns depth); every target is resized from the same DPR and CSS size in one function; every pass has a named input, output, owner, and disable path. Confirm the render loop actually calls the pass graph: a composer built but never rendered is a common dead path.

**Clean-room effects** (targets, not measurements):

| Effect | Desktop GPU | Mobile GPU | Extra draws | Extra RT memory |
|---|---|---|---|---|
| Window rain | 1.5 ms or less | 2 ms or less | 4 to 5 | about 6 MB at 1.65 MP |
| Wet ground and puddles | 3 ms or less (reflector) | 1 ms or less (env only) | reflector pass plus 2 | reflector at 0.5x, wave 256 squared |
| Deformable sand or snow | 0.8 ms or less | 0.5 ms or less | 1 | 2 MB |
| Wind grass | 3 ms or less (vertex bound) | 2.5 ms or less | 6 to 20 | none |
| Ocean with Snell window | 2.5 ms or less | 3 ms or less | 1 to 2 | viewport copy |

**Materials.** Real transmission glass costs an extra scene render per frame. Planar reflectors add 40 to 60% of the scene's draw calls. Raymarching: 48 to 96 steps at 0.5 resolution scale. Each 2048 by 2048 uncompressed texture is about 22 MB of VRAM with mips; KTX2 is 4 to 8 times smaller.

**Frame timing rules.** Clamp the loop delta to 0.05 s; a physics accumulator clamps to 0.1 s at a fixed 1/60. Never infer GPU time from CPU frame time; warm up and separate shader compile from steady state. The GPU watchdog fires around 10 s of shader work.

## 6. Verification method

Run with `bun test` and puppeteer-core against system Chrome (JAL bans Playwright). WebGL suites run on one worker: parallel contexts contend for the GPU.

### 6.1 Real GPU or nothing

- Launch headed, or headless with GPU flags (`--use-angle=metal` on macOS, `--enable-gpu`, `--ignore-gpu-blocklist`).
- Assert the renderer string: `gl.getParameter(gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL)` must not match `/swiftshader|llvmpipe|software|basic render/i` (software rasterisation is about 4x slower, so its frame times are meaningless). WebGPU: `navigator.gpu` exists and `requestAdapter()` resolves.
- Use a separate launcher from the DOM smoke tests: `jal-qa-automation`'s smoke launch passes `--disable-gpu`, which is right for DOM checks on a headless runner and wrong for any capture or frame-time check here.
- Register `page.on("console")` (type `error`), `page.on("pageerror")`, and `page.on("requestfailed")` before `goto` and fail the run on any entry, URL in the message. No allowlist: a noisy error gets fixed or an ADR.
- **Crash limits.** Chrome escalates after GPU crashes: a second within 2 minutes fails adapter requests until refresh, a third blocks 3D on all pages for about 2 minutes, and 3 to 6 within 5 minutes stop GPU process restarts until the browser restarts. Loss tests launch puppeteer-core Chrome with `--disable-domain-blocking-for-3d-apis` and `--disable-gpu-process-crash-limit` in a dedicated profile, never in the perf run, whose numbers come from default settings.
- **Limit debugging:** when a buffer or binding fails, log every entry of `adapter.limits` from a test hook and read the captured console: WebGPU validation errors name the exceeded limit. webgpureport.org is a research aid, never a runtime dependency.
- Record the renderer string in the report. With no real GPU, report frame time as "not measured" and ship only after a manual check on a real mid-range phone.

### 6.2 Deterministic captures

- Test mode: `frameloop="never"`, Lenis disabled, a fixed seed for all noise and particles, `window.__immersive = { ready, seek(p), info }` (`r3f.md` section 13).
- Sequence: `await ready` (assets loaded, `useProgress().active === false`, `document.fonts.ready`), `seek(p)`, `advance()` twice, `page.screenshot()` (captures the composited frame, so `preserveDrawingBuffer` is not needed).
- GPU readback (`renderer.readRenderTargetPixelsAsync`, `renderer.getArrayBufferAsync(storageAttribute)` **[verify]**) stalls the pipeline: test hooks only, for example reading a few particle positions after `seek(p)` to assert determinism across runs with one seed.
- Never take an element screenshot of a live canvas: it waits for the element to settle, which an animating canvas never does. Freeze first (`frameloop="never"`, `seek(p)`, two advances), then `page.screenshot({ clip: await (await page.$(sel)).boundingBox() })`, and throw when `boundingBox()` is null (the element is not visible).
- **Capture set extras:** near and far camera bookmarks beside the beat captures; the default seed plus at least two others, one of them a stress seed; for temporal effects, checkpoints at reset, first response, steady state, after an invalidation, and after recovery, reviewed frame by frame. Stochastic effects run on a frozen seed sequence or are compared after accumulation. Never loosen a threshold until a test stops failing.
- **FPS sweep:** any decaying or accumulating effect is captured at 30, 60, and 120 fps (throttle the ticker in test mode) and must reach the same state at the same wall-clock time.
- **Geometry review set** for any procedural or hero model: orthographic front, back, sides, top, and underside silhouettes; two opposing three-quarter views; close views of every join and aperture; grazing light on bevels; a clay view; material slots in flat colours; wireframe; normals; the extremes of any moving part. Reject plausibility problems these reveal even when every numeric gate passes (`procedural-geometry.md` section 8).
- **Topology gate:** generated geometry (trees, lofted products, terrain) asserts vertex and triangle counts and the bounding box in `bun test` for a fixed seed; counts alone pass a wrong build, so always pair them with bounds, and record seed and preset.
- **Motion evidence:** any section with camera travel, animated models, or physics records an unpaused sequence at the real camera through CDP `Page.startScreencast` in puppeteer-core, saved as numbered timestamped JPEG frames (no ffmpeg), covering at least one complete beat transition. Review for snaps, stalls, shimmer, frozen or stretching rigs, foot sliding, and contact timing; list the frames in the capture manifest (section 6.10). A still never proves motion quality.
- Captures: each authored beat at 375 and 1280 (plus 768 and 1440 for story sections), a reduced-motion run, a no-WebGL run (`--disable-webgl` or a stubbed `getContext`), and the poster alone. Still images cannot prove absence of shimmer: add one short capture sequence during camera motion for thin-line scenes.

### 6.3 Emulation through CDP

```ts
const cdp = await page.createCDPSession();
await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });                 // CPU only; there is no GPU throttling
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 3, mobile: true });
```

### 6.4 Frame-time sampling

```ts
await page.evaluate(() => {
  const d: number[] = []; let last = performance.now();
  const loaf: PerformanceEntry[] = [];
  new PerformanceObserver((l) => loaf.push(...l.getEntries())).observe({ type: "long-animation-frame", buffered: true });
  const tick = (t: number) => { d.push(t - last); last = t; if (d.length < 600) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  (window as any).__probe = { d, loaf };
});
await cdp.send("Input.synthesizeScrollGesture", { x: 200, y: 400, yDistance: -3000, speed: 800 }); // about 5 s of scripted scroll
const r = await page.evaluate(() => {
  const s = [...(window as any).__probe.d].sort((a: number, b: number) => a - b);
  const q = (p: number) => s[Math.floor(p * (s.length - 1))];
  const budget = 1000 / 60;
  return { p50: q(0.5), p95: q(0.95), p99: q(0.99), over: s.filter((x: number) => x > 1.5 * budget).length, loaf: (window as any).__probe.loaf.length };
});
```

- Report p50, p95, p99, frames over 1.5 times the refresh budget, and long-animation-frame count.
- Add `Performance.getMetrics` (`ScriptDuration`, `TaskDuration`, `JSHeapUsedSize`) before and after.
- Renderer counters per beat: `info.render.calls`, `info.render.triangles`, `info.memory.geometries`, `info.memory.textures`, compared against the tier column in section 1.
- WebGPU GPU time: `new WebGPURenderer({ trackTimestamp: true })`, `await renderer.resolveTimestampsAsync("render")`, then `renderer.info.render.timestamp` (check the option name against the installed three first).

### 6.5 Pixel assertions

- **Background equals page white:** screenshot the canvas box, sample pixels outside the subject, compare against the computed `--color-page` value exactly (tolerance 1 per channel). This catches the tone-mapping trap (`#F0F0F0` or `#E2E2E2` instead of the page token) and dark premultiply halos. Decode in the page itself: pass the screenshot as base64, draw it to an offscreen 2D canvas, read `getImageData`. No image library needed.
- **Luminance check:** a false-colour debug mode (bands under 0.05, 0.18, 1.0, and over 1.0 in linear HDR before tone mapping) plus a clipped-pixel mask after it. On a white-first page it confirms only surfaces meant to read pure white reach the tone-map knee, and highlights come from specular lobes, not blown albedo.
- **No bloom leak:** no pixel brighter than its surroundings in a radial falloff around highlights.
- **Non-blank:** sample a 160 by 90 grid; more than 256 non-transparent pixels and (variance over 8 or more than 3 colour buckets). Advisory, measured on the subject's bounding box only (a white page legitimately reads as flat overall): colour entropy under about 3.0 bits or a dominant colour share over about 0.6 reads as sparse; edge density (neighbour luminance delta over 12) under about 0.04 reads as primitive; p95 minus p5 luminance contrast under about 60 reads as fog or darkness compression.

### 6.6 Resilience and leak tests

- **Forced context loss:** `canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()`: the poster appears within one frame, no uncaught error, the ticker pauses. `restoreContext()`: the scene resumes (GPGPU state and PMREM regenerated) or stays on the poster by design.
- **WebGPU device loss:** `device.destroy()` through a test hook: the poster shows. It is a partial simulation (buffers unmap at once and recovery always succeeds, unlike a real loss), so the hook treats it as reason `unknown`, and one manual `about:gpucrash` run in a separate tab happens before ship.
- **Blocked assets:** request interception fails `*.glb` and `*.ktx2`: the poster stays and one error is logged.
- **Navigation round trip:** mount, unmount, mount: `info.memory.geometries` and `textures` return to baseline after unmount, JS heap returns within a small margin, live canvas count unchanged, no ScrollTrigger left (`ScrollTrigger.getAll().length` back to baseline).
- **Network log:** no request leaves the origin (decoders, fonts, HDRs, benchmarks all self-hosted).

### 6.7 `ui_audit`

- Run at 320, 375, 414, 768, 1280: 19 rules plus `reduced-motion` (with reduce emulated: no infinite CSS or WAAPI animation running, no continuous rAF loop above 10 calls per second).
- `[data-jal-exempt~="noyzzi"]` subtrees skip the visual rules (light background, gradient, shadow, stripe, purple, eyebrow, overlap) but keep min height, overflow, clipped text, and reduced motion.
- SKIPPED is not PASS.

### 6.8 The perf report

A ranked table of at most 7 rows (payload, loading, runtime, 3D extras), each with the measured value, the budget, and the fix. Fix the top row first; do not scatter changes. Change one thing, re-measure, repeat.

Fix the scenario (width, DPR, beat, tier) before a baseline, then classify the bottleneck: CPU (JS, allocation, mixers, physics, layout), GPU draw (calls, material switches), GPU fragment (overdraw, DPR, transparency, post), GPU vertex (triangles, shadow casters), memory (textures, targets, undisposed objects), or network and bundle. Quick probe: frame time dropping sharply when DPR halves means fragment-bound; barely moving points to CPU or vertex. The class picks the ladder step in section 4.

The capture script prints one line per capture (PASS or FAIL, hardware or software GPU, entropy, edge density, contrast, dominant share, over-budget rows, error counts, file paths) and writes the full JSON next to the PNG. Errors are stored deduplicated and capped (20 messages of 500 characters) while totals are still counted. Screenshot at CSS pixel scale unless DPR itself is under test. Budget rows are reported, not fatal; a blank canvas or any browser error exits non-zero.

Append to every report: a render-target inventory (count, format, dimensions, estimated memory), cache or shadow updates per frame, three version and backend, DPR, camera bookmark, seed, and known defects, so a later regression run repeats the same evidence.

Payload check for every chunk over budget: run `Bun.build` with `metafile: true` and list the largest input modules of that output. A library adding more than about 20KB gzip for one small helper is a finding, as is `import * as THREE` in a vanilla scene that could import named classes. Import narrowly or replace the helper, then re-measure.

### 6.9 Interaction sweep

Sections whose message is interaction (`toy`, configurators, drag-to-rotate) get a puppeteer-core sweep under `bun test` that drives real input (`page.mouse` drags, keyboard arrows, touch through CDP `Input.dispatchTouchEvent`) and samples `__immersive.info` after each step. Record frames advanced, whether the subject moved or its state changed, the step of the first change, stuck windows (frames advance and input is held but nothing changes), and errors. Assert a live loop, real change from input, at most two stuck windows, and zero errors; attach the JSON. Hooks may set up later states, but the sweep still exercises real input. In the input code, wrap `setPointerCapture` in try/catch (synthetic pointers may not be capturable) and release hold-style controls on `pointerleave` as well as `pointerup` and `pointercancel`.

### 6.10 Capture manifest

Before a verification pass, write `artifacts/captures.json` with a fresh run ID for every code or asset change: distinct (width, beat or state) pairs, each with a report path, plus required files (poster, motion frames, optimised GLB). The capture script writes each JSON and PNG to its declared path stamped with the run ID; a failing capture stays listed and fails the pass. A Bun checker reads only declared files and verifies matching run ID, width, and state; a non-blank result and zero errors; minimum sizes (PNG and JPEG 1 KB, WebP 512 B, GLB 1 KB, video 1 KB, JSON non-empty); a non-empty `dist/` whenever a production build is claimed. It proves coverage, not quality, and closes two traps: reports relabelled from an older run, and a capture of the wrong app on the port (check the build ID).

### 6.11 Screenshot baselines

Add baselines when a signature section or poster is worth protecting and can be made deterministic (seeded, frozen); defer them for exploratory builds and particle- or noise-dominated frames, and say which way you went. Protect two to five states: hero beat at 1280 and 375, the poster, the reduced-motion still, one key interaction state. Compare in the page by drawing baseline and current PNGs to a 2D canvas and counting pixels that differ beyond a small per-channel tolerance (no image library; `pixelmatch` would be an approval candidate). Allow about 0.5 percent for DOM-only regions and about 1.5 percent for WebGL regions, never enough to hide a missing asset. Baselines update only through an explicit flag; masks cover only regions not under test.

## 7. Page shell and media budgets

The canvas is only part of the page. The shell around it follows these, measured in the same puppeteer-core run:

- **Core Web Vitals:** LCP under 2.5 s, CLS under 0.1, INP under 200 ms (75th percentile when field data exists). The poster is the LCP element; the canvas box is reserved from the start so the crossfade never moves layout; no heavy scene work sits on an input handler. Lab: CDP mobile emulation plus 4x CPU throttle (section 6.3), `PerformanceObserver` on `largest-contentful-paint` and `layout-shift`, long-animation-frame entries after a scripted click as the INP proxy. A regression on any of the three blocks the pre-return gate.
- **Images:** AVIF first, then WebP through `<picture>`, explicit `width` and `height`, `srcset` sized to the largest displayed width at DPR 2. An image served more than about 1.5 times its displayed pixel size is a finding. Below the fold `loading="lazy"` and `decoding="async"`; the poster `fetchpriority="high"`, plus `<link rel="preload" as="image" imagesrcset fetchpriority="high">` in the shell head when a lazily mounted component would discover it late. Flag any image over 200KB.
- **Fonts:** self-hosted WOFF2 only, preload the one or two faces used above the fold (`<link rel="preload" as="font" type="font/woff2" crossorigin>`), `font-display: swap`, or `optional` for display faces where a late swap would re-break SplitText lines. Flag more than 4 font files per page. SplitText and `ScrollTrigger.refresh()` wait on `document.fonts.ready`.
- **First paint:** the poster paints without waiting on the full CSS bundle or any JS. Inline the few above-fold rules (page colour, poster box aspect ratio, hero type) in the shell `<style>`, no synchronous head scripts. Prove it with `page.setJavaScriptEnabled(false)`: poster and hero text render correctly.
