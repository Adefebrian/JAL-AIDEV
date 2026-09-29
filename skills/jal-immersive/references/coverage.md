# Coverage audit: the eight immersive references

What every knowledge item in Brian's eight immersive reference repos became in JAL: where it lives, what this audit added, and what was left out and why. Audited 2026-09-29 against full clones, in two parts (part 1 committed as `feat(immersive): coverage audit, part 1`, part 2 finished the remaining rows). Read it when a source idea seems missing, before re-researching a repo, or before adding a new reference.

## 0. How to read this file

From: JAL-authored.

- **Row numbers** are the inventory rows of the per-repo audit. Threejs-Awesome-Graphics-Agent-Skills was audited in two halves, so its rows carry an `A` or `B` prefix.
- **Status:**
  - `covered`: JAL already held the knowledge before this audit, at the cited place.
  - `added`: the audit wrote it into the cited place, in JAL's own words. "(part 1)" marks items written in part 1; everything else was written in part 2.
  - `excluded`: deliberately left out; the reason column says why (JAL law, the canvas exemption, the budget, a banned tool, game-only scope, a license, or a target file owned outside `jal-immersive`).
- **License column:** "repo" means the repo license in the section header applies. Threejs-Awesome rows drawn from a GPL-3.0 or unlicensed example are marked; for those only the idea was used, restated from the algorithm (clean-room rules in `effects-cleanroom.md` section 0).
- **Sections** are cited by number and title. `SKILL.md` is `skills/jal-immersive/SKILL.md`; bare file names are under `skills/jal-immersive/references/`; other skills are named by path.
- **Rules applied to every fill:** own words, no copied code from GPL, unlicensed, or Remotion sources (MIT code adapted only with attribution), Bun-only tooling (Bun.build, Bun.serve, bun test, puppeteer-core over CDP; no Vite, webpack, Node scripts, Playwright, or ffmpeg), the approved stack (Three.js WebGL, WebGPU and TSL, R3F, drei, GSAP with every plugin and `@gsap/react`, Lenis, Framer Motion, Tailwind, nixie-fx, Rapier, OriginKit), full JAL law on the page, the lighting and shading exemption inside a canvas, and the noyzzi exemption only inside its own sections.
- **Out-of-ownership rows:** items whose right home is a skill outside `jal-immersive` (mostly `skills/jal-motion/references/components.md` for Animata DOM recipes, and `jal-qa-automation` for generic QA) are `excluded` here with the target named, so that skill's owner can pick them up from the repo's inventory.

## Summary

From: JAL-authored count over the rows below.

| Repo | License | Rows | Covered | Added (part 2) | Excluded |
|---|---|---|---|---|---|
| Threejs-Awesome-Graphics-Agent-Skills | MIT (top level); per-example GPL-3.0 and unlicensed exceptions are ideas only | 330 | 54 | 228 (6) | 48 |
| ai-dev-kit | MIT | 111 | 44 | 32 (3) | 35 |
| nixie-fx | MIT | 101 | 32 | 56 (2) | 13 |
| webgpu-claude-skill | MIT declared in plugin.json and README, no LICENSE file: own words only | 114 | 32 | 60 (1) | 22 |
| threejs-game-skills | MIT | 170 | 65 | 73 (7) | 32 |
| gsap-skills | MIT | 179 | 80 | 72 (1) | 27 |
| remotion | Remotion License (source-available, not OSI): ideas only, no code | 137 | 25 | 75 (75) | 37 |
| animata | MIT | 273 | 157 | 3 (3) | 113 |
| All eight | | 1415 | 489 | 599 (98) | 327 |

## 1. Threejs-Awesome-Graphics-Agent-Skills

From: Threejs-Awesome-Graphics-Agent-Skills (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT (top level); per-example GPL-3.0 and unlicensed exceptions are ideas only. Rows: 330. Covered 54, added 228 (6 of them in part 2), excluded 48.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| B1 | Material graph order: stable coordinates, structural fields, identity weights, causal modifiers, filtered (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Material cause order) (part 1) | added |
| B2 | Material failure list: sub-pixel normals, triplanar seams, custom lighting losing energy, post used to hide (abridged) | repo | shaders.md 18 Shader self-check (part 1) | added |
| B3 | Specular anti-aliasing: widen roughness by normal-derivative variance | repo | shaders.md 12 Specular anti-aliasing and derivative bump (part 1) | added |
| B4 | Screen-space derivative bump normal from a scalar height node | repo | shaders.md 12 Specular anti-aliasing and derivative bump (part 1) | added |
| B5 | Atlas tile half-texel inset, anisotropic major-axis taps, mip-safe duplicated borders | repo | three-foundations.md 7.4 Formats and budgets (Atlases) (part 1) | added |
| B6 | Projected cloud shadow evaluated from the same field as the visible voxel-world cloud layer | repo | voxel game world, out of scope for page sections | excluded |
| B7 | Per-instance material state (removal time, variant flag) driving dissolve, not one cloned material per object | repo | particles-physics.md 3 Instanced quads (tier 4) (part 1) | added |
| B8 | Authored luxury PBR bundles (walnut, antique gold, ebony, plaster 0.94 to 0.96, mat board 0.92) | repo | three-foundations.md 2 Renderer setup (WebGL) (Material recipes) (part 1) | added |
| B9 | Bloom-only emissive chandelier (`toneMapped = false` plus selective bloom) | repo | bloom and emissive halos banned in Zone B | excluded |
| B10 | Slope-driven terrain identity (grassness from world-normal y) and height wetness changing colour and (abridged) | repo | effects-cleanroom.md 2 Wet ground (Algorithm step 1) (part 1) | added |
| B11 | Reversed-edge `smoothstep` is undefined; write the portable form | repo | shaders.md 12 "Shader self-check" | covered |
| B12 | Image-space refractive glass: per-frame back-face data pass (double-sided, inverted depth, geometric normal (abridged) | repo | shaders.md 13 Refractive bodies beyond MeshPhysicalMaterial (part 1) | added |
| B13 | Interior exit search by projection with 3 refinements, minimum wall, maximum segment | repo | shaders.md 13 Refractive bodies beyond MeshPhysicalMaterial (part 1) | added |
| B14 | Exact unpolarised Fresnel for interior paths, TIR from the same expression, residual throughput added after (abridged) | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 3); residual throughput and interior reuse added | added |
| B15 | Beer-Lambert from a chosen tint at a chosen thickness; decode the tint colour exactly once | repo | shaders.md 13 Refractive bodies beyond MeshPhysicalMaterial (part 1) | added |
| B16 | Spectral dispersion from catalogue n_d and Abbe number (Cauchy), stratified wavelength samples, normalised (abridged) | repo | shaders.md 13 Refractive bodies beyond MeshPhysicalMaterial (part 1) | added |
| B17 | Explicit mip level for every texture lookup inside loops or non-uniform control flow | repo | shaders.md 18 Shader self-check (part 1) | added |
| B18 | Use the same HDR probe as the scene background; background direction from sphere normal | repo | JAL canvases never paint a background (Zone B, three-foundations.md 3) | excluded |
| B19 | Choose geometric BVH refraction (closed gems) versus image-space refraction (scans, open sheets) by geometry | repo | shaders.md 13 Refractive bodies beyond MeshPhysicalMaterial (part 1) | added |
| B20 | Glass diagnostics: thickness, back-face normal, entry Fresnel; collapse spectrum, zero absorption (abridged) | repo | shaders.md 13 Refractive bodies beyond MeshPhysicalMaterial (part 1) | added |
| B21 | Thin-film soap bubble Airy interference with RGB bands | repo | interference orders produce magenta and violet bands; purple banned in Zone B (noyzzi only) | excluded |
| B22 | Exact reflected radiance through scalar alpha blending (divide source by alpha) | repo | shaders.md 6 Fresnel and rim (part 1) | added |
| B23 | Two-mesh transparent shell: BackSide pass first, FrontSide second, depth write off, far-to-near sort | repo | three-foundations.md 2 Renderer setup (WebGL) (Closed transparent shells) (part 1) | added |
| B24 | Normals of a deformed surface from the deformation gradient, never the rest normal | repo | shaders.md 18 Shader self-check (part 1) | added |
| B25 | Camera-aware inflow and recycling for ambient floating objects; prewarm history before first frame | repo | particles-physics.md 7 Interaction patterns (part 1) | added |
| B26 | Bubble flight, capillary modes, Taylor-Culick rupture, drop aftermath | repo | niche physics toy, not worth the budget | excluded |
| B27 | Simulated fur: 420k six-point strands, Verlet compute, ribbon shading | repo | WebGPU only with no fallback, no reduced tier, unseeded `Math.random`, far over the 300k-triangle table | excluded |
| B28 | Pointer ownership: a hit on the proxy disables orbit, every release or cancel re-enables it; one GPU readback (abridged) | repo | particles-physics.md 7 Interaction patterns (part 1) | added |
| B29 | Simulated cloth: GPU XPBD sheet with self-collision | repo | WebGPU only, no fallback, research-grade cost | excluded |
| B30 | Bake procedural PBR maps once from one shared height identity (woven linen) | repo | three-foundations.md 7.6 Procedural texture bakes (part 1) | added |
| B31 | Fixed-step hardening: max substeps per frame, backlog cap, invalid delta fallback, NaN or out-of-bounds reset (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| B32 | Softbody jelly: XPBD neo-Hookean tetra mesh, BVH caustics | repo | CPU-heavy research simulation; physics beyond approved stack (Rapier is approved but does not do this) | excluded |
| B33 | Sleep a settled simulation by RMS velocity thresholds, wake on input | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| B34 | Finite receiver or data textures: zero the outer texels, keep a guard band | repo | shaders.md 11 Full-screen quad setup (part 1) | added |
| B35 | Jelly or resin physical material recipe (transmission, thickness, IOR 1.35, attenuation from sigma, clearcoat) | repo | three-foundations.md 2 Renderer setup (WebGL) (Material recipes, Jelly or resin) (part 1) | added |
| B36 | Surface accumulation masks: one mask for coverage and height; model-locked coverage gated by upward normal (abridged) | repo | shaders.md 14 Surface accumulation masks (part 1) | added |
| B37 | Worley crack field at two scales, warp applied before both, driving colour, roughness, and groove normal | repo | shaders.md 3 Noise families (part 1) | added |
| B38 | Texture channel contract: only albedo sRGB; AO, roughness, normal linear; identical repeat; anisotropy (abridged) | repo | r3f.md 7 drei helpers (part 1) | added |
| B39 | Object-locked procedural coordinates and frames (axes from the object world quaternion) | repo | shaders.md 3 Noise families (part 1) | added |
| B40 | Physical diffraction-grating foil | repo | rainbow foil with violet orders; purple and neon-like iridescence banned in Zone B | excluded |
| B41 | Energy-preserving lobe widening (normalise a Gaussian by sigma; widen a glint while rescaling its peak) | repo | shaders.md 6 Fresnel and rim (part 1) | added |
| B42 | Raymarched lava with emissive glow and embers | repo | glow and ember sparkles banned in Zone B | excluded |
| B43 | Planets: store the undeformed sphere direction as an attribute for all sampling | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B44 | Tangential domain warp on a sphere, then renormalise | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B45 | One height function for displacement and shading; sampled CPU and GPU parity | repo | shaders.md 18 Shader self-check (part 1) | added |
| B46 | Distance or altitude weighted detail: fade contribution, never jump frequency | repo | shaders.md 3 Noise families (part 1) | added |
| B47 | Whole-body LOD ladder with hysteresis, same height function at every level | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B48 | Craters as floor, wall, rim, ejecta; continents as region fields | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B49 | Climate and biome masks from causes (humidity, temperature lapse, slope) | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B50 | Two coastline widths (wide visual edge, sharp physical edge), altitude filtered | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B51 | Seam-free longitude through a unit-circle coordinate | repo | shaders.md 3 Noise families (part 1) | added |
| B52 | Atmosphere shell, limb haze, limb clipping, shell and post hand-off | repo | reads as a glow halo on a dark space field; banned in Zone B | excluded |
| B53 | Planet completion test (unlit silhouette, flat albedo, grazing light, orbit, close, three seeds) | repo | shaders.md 15 Spherical bodies (planets, globes, spherical products) (part 1) | added |
| B54 | Growth hierarchy from a per-level species table, grown from a queue with per-level budgets | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B55 | Terminal continuation branch at every parent tip | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B56 | Stratified longitudinal slots plus independently permuted angular slots | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B57 | Section evolution: gnarliness scaled by inverse sqrt radius, tropism step force over radius, child radius (abridged) | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B58 | Bark UV with one integer circumference wrap count per branch | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B59 | Leaf cards: double perpendicular cards, rounded normals, alpha test 0.5 | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B60 | Leaf-root-weighted wind; leaf, branch, and whole-tree wind are separate scopes; hinge at the petiole | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B61 | Judge vegetation in context (ground contact, depth, scale cues), never isolated on flat colour | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (Law) (part 1) | added |
| B62 | Topology numeric gate: vertex and triangle counts plus bounds, since counts alone can pass a wrong build | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| B63 | Stylized grass: rooted rotation, gust fronts, tip flutter, clumps, translucency | repo | effects-cleanroom.md 4 "Dense stylized grass with wind", Algorithm | covered |
| B64 | GPU grass extras: curved blade spine, wind-facing yaw, density compensation under distance culling | repo | effects-cleanroom.md 4 Dense stylized grass with wind (Algorithm steps 6 and 8) (part 1) | added |
| B65 | Implicit candidate placement with no per-candidate records | repo | effects-cleanroom.md 4 Algorithm step 2 "Placement with no per-instance buffers" | covered |
| B66 | GPU tile culling, visible-ID compaction, indirect draws, one stream per LOD tier | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| B67 | Far LOD keeps identity (species colour, petal count), not one generic sprite | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B68 | Flower heads follow the terminal stem tangent; roots fixed; rotated noise octaves for ecology density | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B69 | Surface-following ivy: reprojection onto the host, tangent-plane creep, parallel-transport tube frames | repo | effects-cleanroom.md 8 Procedural vegetation beyond grass (part 1) | added |
| B70 | VFX effect graph; normalised lifetime curves; secondary motion from the same flow direction | repo | particles-physics.md 3 Instanced quads (tier 4) (part 1) | added |
| B71 | Dense-swap pool: move the last live instance into the hole and copy the matrix and every custom attribute | repo | particles-physics.md 3 Instanced quads (tier 4) (part 1) | added |
| B72 | Reentry plasma shells and capsule wakes | repo | additive blending, magenta, violet, cyan | excluded |
| B73 | HDR instanced sparks and an emission hierarchy tuned for bloom | repo | sparkles and bloom banned in Zone B | excluded |
| B74 | Holographic rim shell with scanlines and glitch | unlicensed example: ideas only | additive rim, scanlines, glitch banned in Zone B; source is "MIT by project rule" (unlicensed) | excluded |
| B75 | Rim incidence from the inverse-transpose normal matrix so squashed instances stay correct | repo | shaders.md 6 Fresnel and rim (part 1) | added |
| B76 | Mesh-to-mesh sweep handover: one shared height range, complementary discards, linear ramp, cycle index from (abridged) | repo | shaders.md 16 Mesh-to-mesh sweep handover (part 1) | added |
| B77 | Periodic bands filtered by footprint, fading to their own mean | repo | shaders.md 3 "Anti-alias procedural patterns" | covered |
| B78 | Filmic HDR lens-flare compositor | repo | lens flare banned in Zone B | excluded |
| B79 | Guard every normalize of a possibly zero vector (keep the last finite axis) | repo | shaders.md 18 Shader self-check (part 1) | added |
| B80 | Emissive aurora curtain slab | repo | emissive glow in neon green and cyan over a dark sky | excluded |
| B81 | Bounded volume raymarch rules: finite domain over extinction hacks, uniform steps, step-length weighting (abridged) | repo | shaders.md 4 SDFs and raymarching (part 1) | added |
| B82 | Volumetric fluid fire and smoke | repo | emissive fire tuned with bloom; 11 3D textures, far over budget | excluded |
| B83 | Stable-fluids lessons: advect in normalised UVW using world size, even Jacobi count so the result lands where (abridged) | repo | particles-physics.md 4 GPGPU with FBO ping-pong (tier 5, WebGL2) (part 1) | added |
| B84 | Tune in causal groups, in order; never compensate a weak mechanism with post or bloom | repo | SKILL.md 7.9 Visual contract before tuning (part 1) | added |
| B85 | Integrator hygiene: capped iterations, termination IDs, capped rays to mean radiance, local-curvature step (abridged) | repo | shaders.md 4 SDFs and raymarching (part 1) | added |
| B86 | Black-hole and wormhole geodesic integrators, lensed galactic sky | repo | dark painted sky, glowing disk, niche | excluded |
| B87 | Flux-conserving point spread: widening a point dims its peak so total ink stays constant | repo | particles-physics.md 2 Vertex-animated points (tier 3) (part 1) | added |
| B88 | Heavy-tailed size or brightness distribution (few dominant, dense faint floor); evaluate density at the (abridged) | repo | particles-physics.md 2 Vertex-animated points (tier 3) (part 1) | added |
| B89 | Blackbody star colours, 13-tap bloom pyramid, bright-source point spread under display clipping | repo | bloom and dark star field banned in Zone B | excluded |
| B90 | Progressive accumulation for a still camera (frame 0 at pixel centre, Halton jitter, reset on change, half (abridged) | repo | r3f.md 11 Performance monitoring and adaptive quality (part 1) | added |
| B91 | GTAO pipeline: half-res horizon slices, bent normals, bilateral upsample | repo | exceeds the post budget (performance.md 1: 0 to 1 pass, AA only); JAL grounds with contact or baked shadows | excluded |
| B92 | AO modulates indirect light only, never final colour | repo | three-foundations.md 2 Renderer setup (WebGL) (AO darkens indirect light only) (part 1) | added |
| B93 | Custom pass hygiene: save and restore renderer state, dispose targets, bypass a disabled pass instead of zero (abridged) | repo | shaders.md 11 Full-screen quad setup (part 1) | added |
| B94 | Cached clipmap shadows for large worlds | repo | JAL budget is one caster at 2048 or 1024; large worlds are out of scope | excluded |
| B95 | Shadow camera snapped to its texel grid when it follows a moving camera | repo | three-foundations.md 2 Renderer setup (WebGL) (Directional shadow stability) (part 1) | added |
| B96 | Normal bias in world-texel units; inspect acne and peter-panning separately | repo | three-foundations.md 2 Renderer setup (WebGL) (Directional shadow stability) (part 1) | added |
| B97 | Manual shadow updates for static scenes | repo | three-foundations.md 2 Renderer setup (WebGL) (Directional shadow stability) (part 1) | added |
| B98 | Depth-comparison and derivative-dependent samples in uniform control flow | repo | shaders.md 18 Shader self-check (part 1) | added |
| B99 | FFT ocean architecture: disjoint cascade bands, Hermitian packing, one submission per FFT stage, impulse and (abridged) | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9) (part 1) | added |
| B100 | Jacobian whitecaps with persistent history; foam from a causal crest signal | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9) (part 1) | added |
| B101 | Fold-aware normal: slopes divided by one plus horizontal derivative | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9) (part 1) | added |
| B102 | Visible sky dome sharing sun and colours with reflection | repo | a 3D sky gradient is a gradient (Zone B); JAL reflects the PMREM environment instead | excluded |
| B103 | Exact water Fresnel, fwidth-filtered critical-angle mask, one camera-medium state per draw | repo | effects-cleanroom.md 5 "Below water" and GLSL/TSL sketches | covered |
| B104 | Bright TIR underside matched to fog; no near-surface scattering slab; terrain closes the horizon | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9 and GLSL sketch) (part 1) | added |
| B105 | Forward projection of above-water structures; crossing solve bracketed by the critical angle | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9) (part 1) | added |
| B106 | Pixel-footprint LOD applied to displacement, derivatives, and normals together | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9) (part 1) | added |
| B107 | Differential-area caustics; caustics fade to their mean, not zero | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 5) (part 1) | added |
| B108 | God rays and suspended particulates | repo | god rays banned in Zone B | excluded |
| B109 | Coastal breaker system: band comb, coast SDF, conserved-volume swash chain, finite-volume beach | repo | niche, WASM solver and many targets, far over budget | excluded |
| B110 | Shoreline blend by the actual water column height | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 9) (part 1) | added |
| B111 | Camera-following grid snapped to whole cells | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 8) (part 1) | added |
| B112 | Fog hides the finite mesh edge; quality tiers keep the mechanism | repo | SKILL.md 2 Zone B (depth haze matched to page white); performance.md 2 last bullet and 4 "The reduction ladder" | covered |
| B113 | Choose persistent history or analytic state; never fake accumulation with time noise | repo | effects-cleanroom.md 0.4 Shared helpers (shared runtime rules) (part 1) | added |
| B114 | Touch-history frost reveal: pointer ping-pong, separate visible and response channels, edge-faded brush (abridged) | unlicensed example: ideas only | effects-cleanroom.md 9 Touch frost reveal; section existed; starting parameters added; ideas only (source unlicensed) | added |
| B115 | Frame-rate independent decay, verified at 30, 60, and 120 fps | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| B116 | Use drawing-buffer resolution, not CSS size, for `gl_FragCoord` math; aspect from the target that owns the (abridged) | unlicensed example: ideas only | shaders.md 11 Full-screen quad setup (part 1) | added |
| B117 | Window rain ideas: layer activation by amount, coverage-derived normal, bounded blur loop, time wrap (abridged) | unlicensed example: ideas only | effects-cleanroom.md 1 Rain drops refracting on a window (Algorithm, refinements) (part 1) | added |
| B118 | Screen-space state follows the viewport; world footprints need a world-space field | repo | effects-cleanroom.md 3 Algorithm (world window that follows the focus) | covered |
| B119 | Visual contract with observable invariants written before tuning | repo | SKILL.md 7.9 Visual contract before tuning (part 1) | added |
| B120 | Inspection controls that alter the real pipeline: per-mechanism debug modes, camera bookmarks, pause and (abridged) | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| B121 | Camera envelope captures (near, design, far) plus a seed sweep with a stress seed | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| B122 | Temporal checkpoints: reset, first response, steady state, invalidation, recovery; frame-by-frame review | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| B123 | Stochastic pixels frozen or accumulated before image comparison; never loosen thresholds | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| B124 | Perf report adds render-target inventory, cache updates, estimated GPU memory, sign-off record | repo | performance.md 6.8 The perf report (part 1) | added |
| B125 | Rejection criteria (post manufactures form, no diagnostic view, undisclosed divergence, no deterministic (abridged) | repo | SKILL.md 7.10 Reject (part 1) | added |
| B126 | Weather-shaped planetary clouds with temporal upscale and cloud shadow maps | repo | painted sky volume over a transparent page, 500-step march, post passes over budget | excluded |
| B127 | Density shaping for a bounded cloud object: coverage remaps weather, detail erodes by height, fields (abridged) | repo | shaders.md 4 SDFs and raymarching (part 1) | added |
| B128 | Energy-conserving scatter integration, dual-lobe phase, powder term, multi-scatter octaves, transmittance (abridged) | repo | shaders.md 4 SDFs and raymarching (part 1) | added |
| B129 | Low tier removes named mechanisms and keeps the silhouette | repo | performance.md 2 last bullet; performance.md 4 | covered |
| B130 | One analytic wave list shared by displacement, normals, crest, and a CPU height query for floating objects | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 6) (part 1) | added |
| B131 | Heuristic screen refraction limits and a disclosed fallback path length | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 7) (part 1) | added |
| B132 | Bounded pool heightfield inherits unlicensed evanw/webgl-water through jeantimex | unlicensed example: ideas only | effects-cleanroom.md 0.2 "Found while researching" | covered |
| B133 | "MIT by project rule" is not a license: frozen, holographic-shader-visualizer, poseidon also lack one; GPL (abridged) | GPL-3.0 example: ideas only | effects-cleanroom.md 0.1 Items that must not be copied (part 1) | added |
| B134 | Record the exact source revision (commit) for each idea source | repo | effects-cleanroom.md 0.1 Items that must not be copied (reviewed commits); commits listed from TAG source_materials/README.md | added |
| B135 | Further permissive sources: ez-tree MIT, takram three-geospatial MIT, N8python diamonds MIT, AmbientCG CC0 (abridged) | repo | effects-cleanroom.md 0.3 Permissive sources used (part 1) | added |
| B136 | Recipe distillation fields: representation, coupled stages, invariant, bounded cost, debug view, fallback (abridged) | repo | SKILL.md 4 The combined recipe pool (intro) (part 1) | added |
| B137 | three r183 renamed PostProcessing to RenderPipeline; verify the installed API | repo | three-foundations.md 4 "WebGL vs WebGPU/TSL" (Post row) | covered |
| B138 | Deformable sand ideas (GPL source): filtered grain sparkle; bed, airborne grains, and shading on one clock | GPL-3.0 example: ideas only | effects-cleanroom.md 3 Deformable sand or snow (Rendering) (part 1) | added |
| B139 | Wet puddle rain ideas (GPL source) | GPL-3.0 example: ideas only | effects-cleanroom.md 2 "Wet ground: puddles, ripple rings, reflections, rain" | covered |
| B140 | Hybrid material honesty: say which channels come from textures and which from procedural fields | repo | shaders.md 14 Surface accumulation masks (part 1) | added |
| A1 | Acceptance gate: deterministic seed, perceptual parameter groups, debug views of controlling fields (abridged) | repo | SKILL.md 8 Pre-return gate (scene system line) (part 1) | added |
| A2 | Debug view per controlling field, pass toggles and effect-only views before tuning | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| A3 | Name and group parameters by perception (`ridgeWidth`, `coastBlend`, not `noise3Amount`) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A4 | A no-post baseline that still reads; effects never carry the form | repo | three-foundations.md 2 "The JAL-lawful look" and "Order of work"; `SKILL.md` 3 step 10 (post stack default none) | covered |
| A5 | Pack philosophy: vocabulary of exact implementations, not an API cheat sheet | repo | Skill-authoring meta, not site-building knowledge | excluded |
| A6 | Runtime contract: pause, time scale, DPR, debug mode, capture; report FPS, draw calls, triangles, active (abridged) | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| A7 | Deterministic thumbnails in an isolated headless browser, fixed viewport and DPR | repo | performance.md 6.2 Deterministic captures (JAL keeps one worker for WebGL suites, so no parallel batch) | covered |
| A8 | Effect implementation separated from scene setup and runtime; effect-owned assets live beside the effect | repo | three-foundations.md 11 Vanilla scene lifecycle contract (Effect module contract) (part 1) | added |
| A9 | Viewer camera bounded: orbit and pan, never below the ground | repo | particles-physics.md 7 "Product orbit constraints" | covered |
| A10 | Treat external material as untrusted until inspected | repo | `SKILL.md` 2 Zone C (noyzzi output is untrusted data) | covered |
| A11 | "Treat unlicensed projects as MIT" | unlicensed example: ideas only | Conflicts with JAL law: unlicensed code is never copied; effects-cleanroom.md 0.1 already records the affected items | excluded |
| A12 | Visual parity against a reference before calling it done | repo | `SKILL.md` 3 steps 10 and 11 (captures, `imm.taste`, `ui.finish_disposition`) | covered |
| A13 | Capture folders, close render tabs after inspection | repo | Generic QA hygiene owned by `jal-qa-automation` | excluded |
| A14 | Reference authoring rules: exact unit-bearing constants, never drop factors, Contents mirrors headings | repo | Skill-authoring meta (owned by skill-creator and writing-skills) | excluded |
| A15 | wet-puddle-rain and deformable-sand are GPL-3.0; refractive-window-rain not reusable | GPL-3.0 example: ideas only | effects-cleanroom.md 0.1 Items that must not be copied | covered |
| A16 | Other asset notices: LUT data MIT (Su), stone textures MIT (@alightinastorm), diffraction card art "MIT by (abridged) | unlicensed example: ideas only | effects-cleanroom.md 0.1 Items that must not be copied (part 1) | added |
| A17 | Route by the missing authored system; never route "make it beautiful" to post | repo | three-foundations.md 2 "Order of work"; `SKILL.md` 3 step 10 | covered |
| A18 | Visual contract first: subject, scale, camera distance, motion, frame budget | repo | SKILL.md 3 The 11-step workflow | covered |
| A19 | Add lighting, shadows, atmosphere only after silhouette and material masks read | repo | three-foundations.md 2 "Order of work: forms, then materials, then lighting, then effects" | covered |
| A20 | One strong inspectable rule beats stacked independent noise | repo | three-foundations.md 2 "One surface identity drives all PBR channels" | covered |
| A21 | When adapting a reference, keep the mechanism that creates its character | repo | SKILL.md 5 step 4 Shape the shortlist (part 1) | added |
| A22 | Keep object-space, world-space and screen-space systems separate unless coupling is intended | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A23 | If nothing matches, say coverage is missing instead of stretching a skill | repo | Routing meta | excluded |
| A24 | Sky and distance haze share one model: same sun direction, coefficients, exposure, transforms | repo | shaders.md 9 Colour grading (part 1) | added |
| A25 | Keep transmittance and inscatter as separate terms, never one fog colour | repo | shaders.md 9 Colour grading (part 1) | added |
| A26 | Scene depth is non-linear; reconstruct view distance before distance effects | repo | shaders.md 9 Colour grading (part 1) | added |
| A27 | Tier choice: analytic height and distance approximation for small scenes | repo | shaders.md 9 Colour grading (part 1) | added |
| A28 | Precomputed LUT atmosphere (transmittance, 3D scattering, irradiance), Earth coefficients, two-layer density (abridged) | repo | Zone B bans a painted sky (transparent canvas); planetary scope; the LUT data is about 12 MB | excluded |
| A29 | WGS84 ellipsoid, ECEF transform, altitude and geometric-error correction | repo | Geospatial scope, not page sections | excluded |
| A30 | Dynamic nested view and light march, `g <= 0.92`, extinction at least scattering plus 0.0001 | repo | Planetary scope and cost | excluded |
| A31 | Shell and post handoff blended on altitude (140 km to 448 km) | repo | Planetary scope | excluded |
| A32 | Sun disc, lens flare, AgX in the LUT example | repo | Zone B bans lens flare | excluded |
| A33 | One explicit unit-conversion boundary (metres to render units once) | repo | SKILL.md 3 The 11-step workflow | covered |
| A34 | Exposure must not hide wrong radiance scale or inconsistent light ratios | repo | shaders.md 9 Colour grading (part 1) | added |
| A35 | Bloom node, threshold, radius, strength, smooth width | repo | Zone B bans bloom in JAL canvases | excluded |
| A36 | Dual selective bloom via layers and two composers | repo | Bloom | excluded |
| A37 | Transactional material override: record originals (whole `mesh.material`, arrays too), swap, render in `try` (abridged) | repo | three-foundations.md 11 Vanilla scene lifecycle contract (Temporary material overrides) (part 1) | added |
| A38 | Emissive HDR hierarchy (spark 80, projectile 30, laser 10) | repo | Emissive halos and glow banned in Zone B | excluded |
| A39 | Inspect pre-tone-map luminance with a false-colour view and a clipped-pixel mask | repo | performance.md 6.5 Pixel assertions (part 1) | added |
| A40 | Never clamp HDR before tone mapping (highlights turn grey) | repo | shaders.md 9 Colour grading (part 1) | added |
| A41 | Image signal order: HDR scene, lighting effects, haze, exposure, tone map, grade, AA, output | repo | shaders.md 9 Colour grading (part 1) | added |
| A42 | One output owner (`outputColorTransform` off, one `renderOutput`) | repo | shaders.md 9 Colour grading | covered |
| A43 | Tone map once, sRGB once | repo | shaders.md 9 | covered |
| A44 | 64x36 byte meter with `L/(L+1)` encoding, async readback every 12 frames, never overlapping | repo | shaders.md 9 Colour grading (part 1) | added |
| A45 | Weighted log average (weight 1 above 0.002, 0.15 below) | repo | shaders.md 9 Colour grading (part 1) | added |
| A46 | Target `0.18 / avg * 2^EV`, clamp 0.45 to 1.85, adapt with `1 - exp(-dt * speed)`, up 3.2, down 1.1 | repo | shaders.md 9 Colour grading (part 1) | added |
| A47 | Meter limits: no sky or UI mask, frame-count cadence, failed readback resets to 1 | repo | shaders.md 9 Colour grading (part 1) | added |
| A48 | Renderer `toneMappingExposure` plus an adapted multiplier is a double exposure unless one owns it | repo | shaders.md 9 Colour grading (part 1) | added |
| A49 | Generated 32-cube LUT recipe: black and white point, S-curve 0.44, contrast, three tonal tints, gamma (abridged) | repo | shaders.md 9 Colour grading (part 1) | added |
| A50 | LUT half-texel remap `c * 31/32 + 0.5/32`, then mix by intensity | repo | shaders.md 9 Colour grading (part 1) | added |
| A51 | A display-domain LUT stays after tone mapping unless rebuilt | repo | shaders.md 9 | covered |
| A52 | Tone-mapping modes and when to use each | repo | three-foundations.md 2 and 3 (Neutral default, ACES or AgX for a cinematic hero) | covered |
| A53 | Dither after grading and tone mapping | repo | shaders.md 8 Dithering and anti-banding | covered |
| A54 | Coordinate the pipeline only when several image systems share buffers | repo | `SKILL.md` 3 step 10; performance.md 5 "Default JAL stack: none" | covered |
| A55 | GTAO with bent normals, AO applied to indirect light only | repo | JAL budget allows AA as the only post pass; baked AO and `<ContactShadows frames={1}>` (r3f.md 7) cover the look | excluded |
| A56 | Upsample low-resolution passes with depth and normal aware weights | repo | performance.md 2 DPR and the pixel budget (part 1) | added |
| A57 | UI in the same render target needs a protection strategy | repo | `SKILL.md` 6 (essential information lives in the DOM); three-foundations.md 3 (`toneMapped={false}` for UI cards in 3D) | covered |
| A58 | DOM or CSS3D overlay rendered separately from WebGL | repo | r3f.md 7 drei `<Html>` row | covered |
| A59 | Static shadow cache: `shadowMap.autoUpdate = false`, `needsUpdate = true` only after a relevant change (abridged) | repo | frames.md 10 Canvas and R3F inside a composition | added |
| A60 | One depth producer shared by every consumer; resize all targets together from one DPR | repo | performance.md 5 Cost references (part 1) | added |
| A61 | Verify the real render-loop call path before claiming a pass graph owns output | repo | performance.md 5 Cost references (part 1) | added |
| A62 | Buffer ownership table (signal, producer, consumers, space and format, resolution, history); every pass has (abridged) | repo | performance.md 5 Cost references (part 1) | added |
| A63 | Pixel-budget DPR (1.0 MP max 1.25 mobile, 1.65 MP max 1.5 desktop, `sqrt(budget / cssPx)`) | repo | performance.md 2 DPR and the pixel budget | covered |
| A64 | Global DPR budget and fixed per-pass scale (0.4 DPR blur) solve different problems | repo | performance.md 2 | covered |
| A65 | MRT attachments cost bandwidth | repo | performance.md 5 Cost references | covered |
| A66 | `PostProcessing` renamed `RenderPipeline` | repo | three-foundations.md 4 | covered |
| A67 | No velocity or TAA contract; do not advertise TAA | repo | No temporal AA in the JAL budget | excluded |
| A68 | Per-pass GPU time and memory in diagnostics | repo | performance.md 6.4 (WebGPU timestamps, renderer counters) | covered |
| A69 | Camera design frame: subject size, screen occupancy, lens, near and far, up convention | repo | r3f.md 12 Scroll-driven camera binding (part 1) | added |
| A70 | Derive camera offsets from subject dimensions, never a fixed distance | repo | r3f.md 12 Scroll-driven camera binding (part 1) | added |
| A71 | Near and far per shot for depth precision | repo | r3f.md 12 Scroll-driven camera binding (part 1) | added |
| A72 | Derive position and orientation independently, combine once | repo | r3f.md 12 (position and look curves, one writer) | covered |
| A73 | Lerp position, slerp orientation | repo | scroll-choreography.md 9 | covered |
| A74 | One interpolation stage per handoff; ease `1 - (1 - t)^1.8` | repo | r3f.md 12 | covered |
| A75 | At effectively zero blend copy the exact pose (no subpixel tail) | repo | scroll-choreography.md 9 Scroll-driven camera paths for R3F (part 1) | added |
| A76 | Hard-anchor the camera to a fast-accelerating subject instead of lagging | repo | scroll-choreography.md 9 Scroll-driven camera paths for R3F (part 1) | added |
| A77 | Exponential follow with lambdas | repo | r3f.md 4 rule 2 | covered |
| A78 | Second-order spring: `damping = 2 * zeta * sqrt(k)`, separate held and return stiffness, clamp and zero (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| A79 | Exponential response for perceptual smoothing, spring only when inertia is the point | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| A80 | Degenerate basis: forward nearly parallel to up (`abs(dot) > 0.985`) needs a fallback axis | repo | r3f.md 12 Scroll-driven camera binding (part 1) | added |
| A81 | Orbit offset with yaw and pitch bounds and a minimum height above the subject | repo | particles-physics.md 7 (distance 4.6 to 10, polar 0.72 to 1.55 rad) | covered |
| A82 | Input control and spatial constraints are separate layers; constraints run after controls | repo | r3f.md 12 Scroll-driven camera binding (part 1) | added |
| A83 | Each shot owns its projection; save and restore FOV, near, far | repo | r3f.md 12 | covered |
| A84 | Stage subjects in the shot`s own basis | repo | r3f.md 12; scroll-choreography.md 9 | covered |
| A85 | Pointer look: YXZ, pitch clamp, re-sync on lock, clear keys on blur | repo | particles-physics.md 7 | covered |
| A86 | Floating origin and camera-tethered stars | repo | Page-section scale never needs it; `<Stars>` banned in Zone B | excluded |
| A87 | Prewarm pipelines before the first visible frame | repo | `SKILL.md` 6 step 4 `compileAsync` | covered |
| A88 | Scene switch: dispose, clear, create, await init; restore projection and background | repo | three-foundations.md 8 Disposal; r3f.md 12 | covered |
| A89 | Clamp `dt` for springs after stalls | repo | performance.md 5 Frame timing rules | covered |
| A90 | Camera diagnostics: mode owner, basis vectors, subject screen bounds, handoff t | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| A91 | Animation state object: phase, position, velocity, base quaternion, spin, event flags; scratch outside; reset (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| A92 | Seconds and delta, never frame counts | repo | r3f.md 4 rule 2 | covered |
| A93 | Orientation from direction first, roll or spin as a separate quaternion; normalize repeated products | repo | r3f.md 4 useFrame rules (part 1) | added |
| A94 | Quaternion target to angular error, damping on angular velocity | repo | r3f.md 4 useFrame rules (part 1) | added |
| A95 | Piecewise analytic kinematics with continuous position and speed; later boundaries derived from durations | repo | frames.md 2 API (Motion math, Phased travel) (part 1) | added |
| A96 | Named phase ranges instead of one hidden 0 to 1 | repo | frames.md 2 Time structure (`Sequence`); r3f.md 12 labels | covered |
| A97 | Object vibration and camera shake envelopes | repo | JAL bans shake (particles-physics.md 6 item 7) | excluded |
| A98 | Reparent while keeping the world transform | repo | procedural-geometry.md 10 Scene graph moves | covered |
| A99 | Stage detachment kick, random 10 to 30 degree tilt, 0.06 to 0.15 rad/s spin | repo | Rocket-specific cinematic; the general parts are F23 and F25 | excluded |
| A100 | Docking decomposition into axial and radial error with an approach corridor | repo | scroll-choreography.md 9 Scroll-driven camera paths for R3F (part 1) | added |
| A101 | Terminal lock: spring, then copy the target and zero velocity | repo | scroll-choreography.md 9 Scroll-driven camera paths for R3F (part 1) | added |
| A102 | Released particles inherit rotating-frame velocity `omega x r` | repo | particles-physics.md 7 Interaction patterns (part 1) | added |
| A103 | Seeded randomness for replay | repo | particles-physics.md 6 item 5 (`mulberry32`) | covered |
| A104 | POM core: tangent-space march, red channel white is the peak, `depth = 1 - h`, `minViewZ` grazing clamp (abridged) | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A105 | POM tiers: low 8 to 32, medium 16 to 96, high 32 to 160 layers; self-shadow 20 steps, strength 12, bias 0.03 | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A106 | March once, reuse for colour, roughness, emission and coverage (normal graph needs its own call) | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A107 | Silhouette coverage from the marched UV, fetches clamped to tile bounds, alpha-to-coverage edges | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A108 | Curved hosts: sag along the ray, cylinder curvature `[2pi/n, 0]`, horizon chase, shell inflated by max relief | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A109 | No implicit-derivative sampling behind `discard`; use explicit LOD taps | repo | shaders.md 18 Shader self-check (part 1) | added |
| A110 | Self-shadow march toward the light on direct light only; carve cast shadows with the coverage test; write (abridged) | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A111 | POM diagnostics and front, grazing, axial sweeps per tier | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A112 | One weather state (time, wind, progress) shared by reference by particles and surfaces; progress damped | repo | effects-cleanroom.md 0.4 Shared helpers (Weather state) (part 1) | added |
| A113 | Camera-centred wrapped precipitation volume (`mod` wrap in the vertex shader, per-instance seed) | repo | effects-cleanroom.md 10 Snowfall and snow cover (part 1) | added |
| A114 | Snowfall parameters (opacity 0.9, radius 0.07, speed 3.2, sway 0.5; rain about 5 units/s) | repo | effects-cleanroom.md 10 Snowfall and snow cover; opacity and rain speed added; rest existed | added |
| A115 | Ground snow: one height function drives displacement and finite-difference normals; coverage threshold and (abridged) | repo | effects-cleanroom.md 10 Snowfall and snow cover (part 1) | added |
| A116 | Snow response: cool white albedo, roughness about 0.82, sparkle inside the mask | repo | effects-cleanroom.md 10 Snowfall and snow cover (part 1) | added |
| A117 | Object snow caps: model-locked coordinates, upward filter `smoothstep(0.35, 1, n.y)`, thickness 0.06 (abridged) | repo | effects-cleanroom.md 10 Snowfall and snow cover (part 1) | added |
| A118 | Wetness in two bands: roughness early (`0 to 0.75`), puddle normals late (`0.75 to 1`); ripple normal kept (abridged) | repo | effects-cleanroom.md 2 Wet ground (Algorithm step 1) (part 1) | added |
| A119 | Splash placement weighted to up-facing surfaces with a surface sampler weight attribute | repo | effects-cleanroom.md 2 Wet ground (Algorithm step 6) (part 1) | added |
| A120 | Additive 4x5 splash flipbook | GPL-3.0 example: ideas only | GPL asset; additive blending banned; JAL uses ring quads | excluded |
| A121 | Procedural building: plan first, serializable plan object, then emit | repo | procedural-geometry.md 1 Plan, then emit (part 1) | added |
| A122 | Dimensional anchors (bay 3.2 m, floor 3.35 m, podium floor 4.45 m) and a minimum four-bay span | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A123 | Randomness picks among valid designs, never repairs invalid geometry | repo | procedural-geometry.md 1 Plan, then emit (part 1) | added |
| A124 | Compound footprints kept as rectangles; exposed edges by 1D interval subtraction (touch 0.001, drop under (abridged) | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A125 | Quantize modules to the exact span: `count = max(min, round(len / bay))`, no remainder bay | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A126 | Projection-depth hierarchy (1.8 m down to 1.1 m) creates reading; coplanar rectangles lose it | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A127 | Reserve whole-height zones before filling; ornament rewrites a bay into modules, never a decal | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A128 | Modules authored in one local frame; one placement transform owns orientation and winding; builder registry (abridged) | repo | procedural-geometry.md 6 Mesh writer by material slot (part 1) | added |
| A129 | Material-slot mesh writer: one indexed geometry per slot | repo | procedural-geometry.md 6 Mesh writer by material slot (part 1) | added |
| A130 | Constant texel density: subdivide quads at the physical tile size (1.45 m), arc-length UVs | repo | procedural-geometry.md 3 Profiles, sweeps, and sections (part 1) | added |
| A131 | Structural closure (soffits, decks, connectors) belongs to the mass step | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A132 | Ownership assertions; exact-duplicate keys are not an overlap test | repo | procedural-geometry.md 7 Architecture specifics (part 1) | added |
| A133 | Build weak to strong: mass and edges before ornament | repo | procedural-geometry.md 1 Plan, then emit (part 1) | added |
| A134 | Specific mass patterns, finial rhythms, roof equipment thresholds | repo | Project-specific numbers | excluded |
| A135 | Cached clipmap shadows with light-space texel snapping | repo | Large-world shadows, out of page scope | excluded |
| A136 | Field bundle: coordinates, macro, meso, derived causes, channels | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A137 | Sample a stable domain (rest position, not displaced position; world plane for wetness and water) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A138 | Separate frequency bands for silhouette, regions, breakup, micro-normal, each locked to a scale | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A139 | Derive secondary fields from causes (slope from normal, cavity, exposure, shoreline) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A140 | Warp coordinates, not results; on spheres warp tangentially then renormalize | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A141 | Never displace with frequencies the mesh cannot hold; push them to normals | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A142 | Categorical masks broad enough to avoid bubble regions | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A143 | CPU and GPU evaluate one shared deterministic field, or parity is tested at fixed samples | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| A144 | Distance weights fade detail contribution while frequencies stay fixed | repo | shaders.md 3 Noise families (part 1) | added |
| A145 | Water normal and crest come from one evaluation; foam reads the crest | repo | effects-cleanroom.md 5 Above/below-water ocean (Algorithm step 6) (part 1) | added |
| A146 | Stratify the domain, then jitter inside strata | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| A147 | `smoothstep` with `edge0 > edge1` is undefined | repo | shaders.md 12 Shader self-check | covered |
| A148 | Semantic geometry contract before vertices: frame, unit, bounds, parts, joins, triangle band, review views | repo | procedural-geometry.md 1 Plan, then emit (part 1) | added |
| A149 | Polygon-first design; one mesh per semantic part until audited; triangulate at emission | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A150 | Operation per visible form: extrude, loft, revolve, sweep, aperture, hollow, rounded block, solidify | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A151 | Primitives only for primitive or hidden parts; every visible manufactured edge gets a bevel | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A152 | Openings built into one closed shell; cut, frame and glazing share one outline | repo | procedural-geometry.md 4 Apertures, shells, joins, and booleans (part 1) | added |
| A153 | Thick shells from paired profiles, solidify, or pillow panels; never a single visible sheet | repo | procedural-geometry.md 4 Apertures, shells, joins, and booleans (part 1) | added |
| A154 | Mating parts from one datum; derived quantities stay derived; place parts along a derived axis frame | repo | procedural-geometry.md 1 Plan, then emit (part 1) | added |
| A155 | Modifier order: profiles, operation, solidify, subdivision, bevel, cleanup, winding, audit, emit | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A156 | Bevel bands 0.013 m frame and machine body, 0.045 m soft forms | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A157 | Smooth-by-angle corner normals per part (32 to 50 degrees), caps own hard edges; no blanket (abridged) | repo | procedural-geometry.md 5 Normals and winding (part 1) | added |
| A158 | Axis swap or mirror with a negative determinant flips winding; mirrored UVs flip lettering | repo | procedural-geometry.md 5 Normals and winding (part 1) | added |
| A159 | Signed-volume orientation guard on every closed body | repo | procedural-geometry.md 5 Normals and winding (part 1) | added |
| A160 | Join floors (proud at least 0.0008 m, reveal 0.0015 to 0.006 m, readable gap at 2 m at least 0.004 m) and (abridged) | repo | procedural-geometry.md 4 Apertures, shells, joins, and booleans (part 1) | added |
| A161 | Audit named parts, merge by slot, audit again | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A162 | Segments by visible radius | repo | three-foundations.md 2 | covered |
| A163 | Report part count, triangle count, and draws; shared geometry counts once | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A164 | Spend topology on silhouette, apertures, edge highlights, contacts before hidden faces | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A165 | Geometry review views: orthographic six, opposing three-quarters, joins, grazing light, clay, slot colours (abridged) | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| A166 | Profiles as sums of named lobes on a normalized coordinate, ends blended to set depths | repo | procedural-geometry.md 3 Profiles, sweeps, and sections (part 1) | added |
| A167 | LOD from the generator (fewer samples keeping extrema); generic decimation erases beads and grooves | repo | procedural-geometry.md 9 LOD and budgets (part 1) | added |
| A168 | Instance only when topology is identical | repo | r3f.md 5 Instancing | covered |
| A169 | Topology audit: non-finite, degenerate, unused, duplicates within 0.00002 m, open and non-manifold edges (abridged) | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A170 | Coplanar z-fight audit: 0.0025 rad, 0.0015 m, 2 cm2, AABB inflated by the plane tolerance, same-facing vs (abridged) | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A171 | Solid-clash audit: required depth `min(0.03, max(0.004, 0.34 * thinner))`, more than two edge crossings | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A172 | Traverse by `isMesh`, not `instanceof` (two three copies) | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A173 | Semantic checks print measured value beside the range; bounding envelope vs the contract is the cheap (abridged) | repo | procedural-geometry.md 1 Plan, then emit (part 1) | added |
| A174 | Audit moving geometry across the whole schedule (64 samples), record the pose of minimum clearance | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A175 | Self-test the auditor with planted defects (0.5 mm coplanar, 10 mm gap, 60 mm penetration, butt joint) | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A176 | Portable plain-JS geometry quality kit (MIT) | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A177 | Parallel-transport frames for sweeps and spines | repo | procedural-geometry.md 3 Profiles, sweeps, and sections (part 1) | added |
| A178 | Monotone cubic (Fritsch-Carlson) tracks; per-segment eases print terraces; stations biased to the ends; knots (abridged) | repo | procedural-geometry.md 3 Profiles, sweeps, and sections (part 1) | added |
| A179 | Superellipse sections with independent quadrant exponents and an undercut term | repo | procedural-geometry.md 3 Profiles, sweeps, and sections (part 1) | added |
| A180 | Plates from outlines with holes (opposite winding), bevel, generated warp | repo | procedural-geometry.md 2 Choosing the operation (part 1) | added |
| A181 | Two-plane or triplanar projection with normalized weights and an underside kill mask | repo | shaders.md 17 Parallax occlusion mapping and projected detail (part 1) | added |
| A182 | Tyre deflection, airfoil stations, vehicle dimensions | repo | Vehicle-specific | excluded |
| A183 | Effect-owned textures generated at build time (atlas channels, Sobel normal map) | repo | three-foundations.md 7.6 Procedural texture bakes (part 1) | added |
| A184 | Glass: transmission 1, IOR 1.52, thickness 0.05 m, roughness 0.035, attenuation distance 2.5 m | repo | three-foundations.md 2 Renderer setup (WebGL) (Material recipes, Real glass) (part 1) | added |
| A185 | Booleans only when direct topology cannot express the cut | repo | procedural-geometry.md 4 Apertures, shells, joins, and booleans; wording tightened this pass; three-bvh-csg now approval candidate, ask Brian | added |
| A186 | Per-octave derivative filtering of object-space fBm | repo | shaders.md 3 Noise families (part 1) | added |
| A187 | Per-material micro variation (roughness mapped into `base +- amount`, bump `strength * 0.0006 m`) | repo | shaders.md 3 Noise families (part 1) | added |
| A188 | Material identity authored as one bundle (colour, metalness, roughness, IOR, clearcoat, sheen) | repo | three-foundations.md 2 Material recipes | covered |
| A189 | Deterministic assembly evidence: object count, triangles, bounds, group counts, material set | repo | procedural-geometry.md 8 Audits and evidence (part 1) | added |
| A190 | Close-inspection budgets (car 376k, motorcycle 304k, humanoid 892k triangles) | repo | Above the JAL T3 cap of 300k triangles; only generator-owned LOD (F55) brings them in | excluded |

## 2. ai-dev-kit

From: ai-dev-kit (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT. Rows: 111. Covered 44, added 32 (3 of them in part 2), excluded 35.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | Staleness guard: check the installed `three` version and trust its migration notes over remembered API facts | repo | three-foundations.md "1. Version pins (observed 2026-09-29)" (tilde pin, dated observation) | covered |
| 2 | Per-skill learnings.md loop (read first, append a dated symptom, cause and fix bullet at the end) | repo | Generic memory process owned by skills/jal-memory ("The convention", "When to write") | excluded |
| 3 | A failed shader compile fails silently (black or missing mesh); check the console for `THREE.WebGLProgram` (abridged) | repo | shaders.md 18 Shader self-check (part 1) | added |
| 4 | Edit uniforms in place (`.value`), never replace the uniforms object | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 5 | `onBeforeCompile` string patching is brittle: pin to a stable chunk name and assert the replacement matched | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 6 | Avoid divergent data-dependent branches in fragment shaders on mobile; prefer `mix` and `step` | repo | shaders.md 18 Shader self-check (part 1) | added |
| 7 | Disposal: geometry, every material, every texture slot, render targets, composers and passes | repo | three-foundations.md "8. Disposal" (teardown order plus the `disposeObject` helper) | covered |
| 8 | Kill the render loop and remove listeners on teardown; a zombie loop on a dead canvas is a classic navigation (abridged) | repo | three-foundations.md "8. Disposal" steps 1 and 2 | covered |
| 9 | Verify teardown with `renderer.info.memory` before and after | repo | performance.md "6.6 Resilience and leak tests" (navigation round trip) | covered |
| 10 | Scroll camera: one source of truth, normalized progress per section, never accumulate deltas | repo | scroll-choreography.md "9. Scroll-driven camera paths for R3F" | covered |
| 11 | Put the easing in a damped lerp toward the target, not in the scroll mapping, so scrubbing stays reversible | repo | scroll-choreography.md "9. Scroll-driven camera paths for R3F" (plus the one-smoother rule) | covered |
| 12 | Camera keyframes with position and look target; slerp quaternions, never lerp Euler angles | repo | r3f.md "12. Scroll-driven camera binding"; scroll-choreography.md section 9 | covered |
| 13 | Decouple the scroll read (event or observer) from the render write (rAF tick) | repo | r3f.md "3. The render loop and one clock"; scroll-choreography.md section 9 (`onUpdate` sets target and dirty flag) | covered |
| 14 | Size textures for their largest on-screen appearance; compress with KTX2 or sized WebP per breakpoint | repo | three-foundations.md "7.4 Formats and budgets" | covered |
| 15 | Power-of-two dimensions where mipmaps matter | repo | three-foundations.md 7.4 Formats and budgets (Texture dimensions) (part 1) | added |
| 16 | `colorSpace = SRGBColorSpace` on colour maps (washed-out or dark textures are a colour-space issue most of (abridged) | repo | r3f.md "7. drei helpers" (`useTexture` row); three-foundations.md "7.4" (only colour maps are sRGB) | covered |
| 17 | Anisotropic filtering on ground and planet textures seen at grazing angles | repo | three-foundations.md 7.4 Formats and budgets (Anisotropic filtering) (part 1) | added |
| 18 | Preload before reveal; a texture popping in a frame late reads as a flash bug | repo | SKILL.md "6. Poster-first loading" steps 4 and 5 (`compileAsync`, Preload all, two rAFs, crossfade) | covered |
| 19 | No allocation inside the tick; reuse scratch Vector3 and Quaternion | repo | r3f.md "4. `useFrame` rules" | covered |
| 20 | Render on demand (dirty flag) for static scenes, continuous only while animating | repo | r3f.md "3. The render loop and one clock" (`frameloop="demand"`, `invalidate()`) | covered |
| 21 | Cap pixel ratio at 2 | repo | performance.md "2. DPR and the pixel budget" (the stricter tier budget) | covered |
| 22 | One renderer per page; share regions through scissor or rebuild on route change | repo | r3f.md "8. drei `View`"; three-foundations.md "9. Context loss and device loss" (context cap) | covered |
| 23 | Visual glitch triage order: console, then swap to a basic material, then `renderer.info`, then camera (abridged) | repo | three-foundations.md 12 Visual glitch and blank canvas triage (part 1) | added |
| 24 | Z-fighting and objects vanishing at distance come from the near/far ratio and object scale | repo | r3f.md 2 The JAL Canvas (part 1) | added |
| 25 | Weigh the payload: flag any JS chunk over about 150KB gzip | repo | performance.md "1. The budget table" (other load budgets); three-foundations.md "6. Lazy loading" (build-script gzip check) | covered |
| 26 | Assets: flag images over about 200KB, uncompressed PNG, files larger than their displayed size, missing (abridged) | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 27 | Fonts: flag more than 4 font files and a missing `font-display: swap` | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 28 | Dead weight: a large dependency imported for one trivial function | repo | performance.md 6.8 The perf report (part 1) | added |
| 29 | Loading strategy: render-blocking head resources, lazy below-fold media, preloading and prioritizing the LCP (abridged) | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 30 | Hashed filenames and immutable caching on static assets | repo | three-foundations.md "7.2 Self-hosted decoders" (`Cache-Control ... immutable`) | covered |
| 31 | Runtime: long tasks on load and scroll | repo | performance.md "6.4 Frame-time sampling" (long-animation-frame observer) | covered |
| 32 | Layout thrash: batch reads, then writes | repo | skills/jal-motion/SKILL.md "6. Performance" (frame budget) | covered |
| 33 | Scroll and touch handlers passive, work deferred to rAF, high-frequency events throttled | repo | skills/jal-motion/SKILL.md "6. Performance" (no scroll-jank); scroll-choreography.md "2.5 Refresh order" (debounced resize refresh) | covered |
| 34 | Animate only transform and opacity | repo | skills/jal-motion/SKILL.md "6. Performance"; skills/jal-ui-taste/SKILL.md (never `transition: all`) | covered |
| 35 | `will-change` sparingly, only while animating, removed afterwards | repo | skills/jal-motion/SKILL.md "6. Performance"; scroll-choreography.md "12. Performance rules" | covered |
| 36 | Decoded texture memory is width x height x 4, plus a third for mips; flag about 100MB | repo | performance.md "1. The budget table" (96, 48 and 32 MB per tier); three-foundations.md "7.4" | covered |
| 37 | Draw calls from `renderer.info.render.calls`; flag hundreds, then merge or instance | repo | performance.md "1. The budget table" and "4. The reduction ladder" | covered |
| 38 | GC hitches from allocation in the rAF tick | repo | r3f.md "4. `useFrame` rules" | covered |
| 39 | Report as a ranked table of at most 7 rows (finding, measured impact, fix, effort) and lead with the top item | repo | performance.md "6.8 The perf report" | covered |
| 40 | "Do not fix unprompted; the audit is the deliverable" gate, with a per-session-mode override table | repo | Harness-specific gating; JAL dispatch and gates are owned by skills/jal-orchestration ("The engine", "Hard lines") | excluded |
| 41 | PERF-01 images in AVIF or WebP through `<picture>` with a fallback | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 42 | PERF-02 explicit width and height on every img (prevents CLS) | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 43 | PERF-03 lazy-load below-fold images | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 44 | PERF-04 preload the LCP image | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 45 | PERF-05 fonts self-hosted, preloaded, `font-display: swap` | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 46 | PERF-06 and PERF-08 scripts never block parsing; third-party scripts async | repo | Bun.build module output plus dynamic `import()` (three-foundations.md "6. Lazy loading"); no third-party origins (three-foundations.md "7.3", CSP (abridged) | covered |
| 47 | PERF-07 no unused JS shipped, tree shaking on | repo | r3f.md "1. R3F or vanilla three"; per-project scene chunk budget (performance.md section 1) | covered |
| 48 | PERF-09 purge unused CSS | repo | Tailwind already generates only used classes; styling pipeline owned by skills/jal-design-system | excluded |
| 49 | PERF-10 inline the critical above-fold CSS | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 50 | PERF-15 Core Web Vitals targets: LCP under 2.5s, CLS under 0.1, INP under 200ms | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 51 | QA-GATE-03 before main: no new render-blocking resources, CWV still met | repo | performance.md 7 Page shell and media budgets (part 1) | added |
| 52 | A11Y-13 no more than 3 flashes per second | repo | skills/jal-motion/SKILL.md "5. Accessibility" | covered |
| 53 | A11Y-06 visible focus via `:focus-visible`, never suppressed | repo | skills/jal-motion/SKILL.md "5. Accessibility"; SKILL.md section 6 (focus ring on the interactive canvas wrapper) | covered |
| 54 | A11Y-07 and A11Y-08 move focus on dynamic change, trap focus in dialogs, return it to the trigger | repo | Generic UI; owned by skills/jal-design-system jal-motion/references/components.md (dialog focus trapped, native top layer) | excluded |
| 55 | A11Y-09 contrast 4.5:1 body, 3:1 large text and UI | repo | three-foundations.md 10 Input, accessibility, and lifecycle checklist per scene (part 1) | added |
| 56 | A11Y-10 colour is never the only signal | repo | Generic; owned by skills/jal-design-system foundations.md (accessibility, state model) | excluded |
| 57 | A11Y-12 video needs captions and audio description | repo | frames.md 4 Product demo videos played live (part 1) | added |
| 58 | A11Y-14 and A11Y-15 ARIA only when native HTML cannot do it; meaningful labels | repo | SKILL.md section 6 (decorative canvas `aria-hidden`, interactive canvas `aria-label`); generic ARIA owned by skills/jal-design-system | covered |
| 59 | A11Y-16 announce dynamic updates through a polite live region | repo | skills/jal-design-system/SKILL.md (loading state announced through a live region); skills/jal-motion/references/components.md (deck status (abridged) | covered |
| 60 | A11Y-01 to 05 and 17, 18: semantics, landmarks, one main, heading order, keyboard, form labels, errors | repo | Generic page and form accessibility owned by skills/jal-design-system and skills/jal-frontend-rules | excluded |
| 61 | CSS transitions name the property explicitly and take the duration from a token; never `transition: all` | repo | skills/jal-motion/SKILL.md "2. Token scale"; skills/jal-ui-taste/SKILL.md; skills/jal-motion/references/components.md (banned `transition-all`) | covered |
| 62 | Duration tokens grouped in the single token file | repo | skills/jal-motion/SKILL.md "2. Token scale" (source of truth `packages/ui/src/tokens.css`) | covered |
| 63 | O-03 overlay entry and exit use the same duration | repo | Conflicts with the JAL law: exit runs at about 70% of the entrance (skills/jal-motion/SKILL.md "2. Token scale") | excluded |
| 64 | State driven by an always-present `data-*` attribute whose value alone changes; CSS defines every state | repo | JAL uses React state with Tailwind and Framer Motion; the `data-state` styling pattern already appears in skills/jal-frontend-rules (field-hint (abridged) | excluded |
| 65 | L-04 and O-01 document the stacking purpose of every fixed or sticky element (above canvas, below modals) | repo | r3f.md 2 The JAL Canvas (part 1) | added |
| 66 | Selector naming signature, alphabetical properties, shorthand only, numeric weights, line-height tokens, no (abridged) | repo | CSS authoring conventions for hand-written CSS; JAL uses Tailwind plus tokens owned by skills/jal-design-system and skills/jal-ui-taste | excluded |
| 67 | RULE 17 range-only media queries with fixed Bootstrap breakpoints | repo | Conflicts with Tailwind mobile-first breakpoints and the jal-ui-taste "Responsive and the mobile app-shell" section | excluded |
| 68 | RULE 23 modern CSS stance (nesting banned, `@property` flag before use, container queries allowed) | repo | Framework-specific authoring stance; not an immersive concern | excluded |
| 69 | Unlayered CSS always beats layered utilities regardless of specificity (cascade layers) | repo | skills/jal-motion/references/components.md (tokens.css imported unlayered so JAL values always win) | covered |
| 70 | Build-green is not verification; confirm visually at the relevant breakpoints | repo | SKILL.md "7. Verification" (screenshots at 375 and 1280, `ui_audit` at five widths) | covered |
| 71 | Strata CSS framework specifics (coverage script, silent no-op classes, breakpoints) | repo | The author's private framework; not in the JAL stack (Tailwind) | excluded |
| 72 | Triforge node suite (Blender-named shader, geometry, particle and compositor nodes) | repo | Unapproved private library; its compositor includes bloom, which the canvas law bans | excluded |
| 73 | Expose one `parameters` object as the public animation surface that GSAP drives, never internals | repo | SKILL.md "4.7 GSAP choreography" (drives canvases through a progress ref); scroll-choreography.md section 9 | covered |
| 74 | Non-destructive: never mutate inputs or shared assets | repo | three-foundations.md "8. Disposal" (clone cached assets before mutating) | covered |
| 75 | Pick the smallest package set for the job | repo | skills/jal-motion/SKILL.md "6. Performance" (prefer the smallest tool) | covered |
| 76 | Vanilla scene lifecycle shape: constructor only stores, `init()` acts, `destroy()` is mandatory for anything (abridged) | repo | three-foundations.md 11 Vanilla scene lifecycle contract (part 1) | added |
| 77 | Controllers (camera, input) receive scene objects and never create them; `enable()` and `disable()` attach (abridged) | repo | three-foundations.md 11 Vanilla scene lifecycle contract (part 1) | added |
| 78 | Orchestrator wiring: engine, then animations, then render loop, in dependency order, with the entry file as (abridged) | repo | three-foundations.md 11 Vanilla scene lifecycle contract (part 1) | added |
| 79 | Every listener has a removal path | repo | three-foundations.md "8. Disposal" step 2; "10. Input, accessibility, and lifecycle checklist" | covered |
| 80 | Class suffix vocabulary (Engine, Scene, Animation, Transition, Loader), preset and config-object rules (abridged) | repo | Generic code style owned by skills/jal-standards and skills/jal-architecture; timing constants already live in scroll-choreography.md "1.2 Timing (abridged) | excluded |
| 81 | Remaining JS and TS style rules (const, strict equality, imports, types, enums, utilities, entry files, no (abridged) | repo | Generic code style owned by skills/jal-standards and the jal-reviewer agent | excluded |
| 82 | E2E harness collects console errors and page errors and fails the test if any appear | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 83 | Screenshot a continuously animated canvas by clipping to its bounding box, because element screenshots time (abridged) | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| 84 | Shared fixtures and page objects per feature area; thin specs; extend rather than duplicate setup | repo | belongs in skills/jal-qa-automation/SKILL.md, outside this pass's ownership | excluded |
| 85 | Install-time scope is one smoke test; never generate blind feature specs; label generated specs as unverified | repo | belongs in skills/jal-qa-automation/SKILL.md, outside this pass's ownership | excluded |
| 86 | Specs change or are deleted in the same change as the behaviour they cover; stale-but-green is worse than no (abridged) | repo | belongs in skills/jal-qa-automation/SKILL.md, outside this pass's ownership | excluded |
| 87 | Run artifacts (results, traces, run screenshots) are gitignored; one-off diagnostic scripts are deleted after (abridged) | repo | performance.md 6.10 Capture manifest; harness hygiene paragraph, scoped to immersive captures | added |
| 88 | Detect the real dev port instead of assuming a default; reuse a running server locally, start fresh in CI (abridged) | repo | performance.md 6.10 Capture manifest; harness hygiene paragraph; jal-qa-automation smoke still hardcodes 3000 | added |
| 89 | Retries only in CI, and trace plus screenshot kept on failure only | repo | performance.md 6.10 Capture manifest; captures never retry; generic E2E retry policy stays with jal-qa-automation | added |
| 90 | Playwright config, `@playwright/test`, `playwright install chromium`, `test:e2e` script | repo | Playwright and Node tooling are banned; the ideas are converted to Bun and puppeteer-core in fills 82 to 89 | excluded |
| 91 | Smoke launch disables the GPU while immersive checks need a real GPU (tooling conflict surfaced by this audit) | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 92 | Branch promotion gates dev, test, beta, main | repo | Different flow owned by skills/jal-git-safety ("Feature-branch flow") and skills/jal-release | excluded |
| 93 | Definition of done and self-QA pass (states, cross-file impact, a11y, SEO) | repo | Owned by skills/jal-orchestration review-gate.md and the jal-reviewer agent; UI states owned by skills/jal-frontend-rules ("Buttons: eight states") | excluded |
| 94 | Bug report format and severity ladder | repo | Owned by agents/jal-reviewer.md "Severity and gate" | excluded |
| 95 | Logic checks: trace every path, handle async errors, null-check DOM queries | repo | Generic correctness, owned by agents/jal-reviewer.md and skills/jal-standards | excluded |
| 96 | Security checks: XSS, secrets, eval, storage, URL validation, prototype pollution, CSP, clickjacking | repo | Owned by skills/jal-security-hardening "Default checklist" | excluded |
| 97 | QA-SEC-07 third-party scripts need SRI or trusted origins | repo | three-foundations.md "7.3 CDN defaults to override" (everything self-hosted, no CDN) | covered |
| 98 | Division of labour: the developer owns visual feel and device testing | repo | JAL does its own visual checks (SKILL.md "7. Verification"); process owned by skills/jal-orchestration | excluded |
| 99 | Astro islands: prefer `client:visible` for below-fold interactivity | repo | The idea maps to SKILL.md "6. Poster-first loading" step 3 (lazy start on IntersectionObserver). Astro itself is not an approved stack | covered |
| 100 | New pages hook the existing page-transition lifecycle; reduced-motion pass on animated pages | repo | The reduced-motion part is in SKILL.md "7. Verification". MPA transitions do not apply to the JAL SPA | covered |
| 101 | Astro, Bootstrap and HTML file-role rules, H-10 banned tags (`br`, `strong`, `small`) | repo | Out of stack; markup conventions owned by skills/jal-frontend-rules | excluded |
| 102 | SEO standards (title, meta, canonical, OG, structured data) | repo | Out of scope for immersive work; imm frames.md "Real text stays real" already keeps content indexable | excluded |
| 103 | Debug protocol: reproduce first, one hypothesis, cheapest disproof, one change at a time, revert after two (abridged) | repo | skills/jal-orchestration/references/debug.md ("Reproduce", "No guess-patching") | covered |
| 104 | Pre-commit, pre-merge gate, git and versioning standards | repo | Owned by skills/jal-git-safety ("Conventional commits"), skills/jal-release, and skills/jal-orchestration review-gate.md | excluded |
| 105 | Plan-first, intent capture, interpretation checkpoint | repo | Generic process owned by skills/jal-orchestration (engine and feature playbook) | excluded |
| 106 | Handover, memory bank, memory gardener, skill ablation | repo | Owned by skills/jal-memory | excluded |
| 107 | Role sessions, file locks, git token queue, agent-usage policy, session budget, mode kernel | repo | Harness process; parallel isolation owned by skills/jal-git-safety ("Git worktrees for parallel agents") and skills/jal-orchestration | excluded |
| 108 | Model routing and prompting notes (Claude lineup, OpenCode open-weight models) | repo | Out of scope for immersive work | excluded |
| 109 | Hooks enforcement, System-1 prefilter add-on, install kit, skill scope, skill writer, rename ledger, kit (abridged) | repo | Kit maintenance, out of scope | excluded |
| 110 | AI response contract (`[CX]` marker, no filler, search before read) | repo | Harness behaviour, out of scope; the JAL constitution is owned by skills/jal-standards | excluded |
| 111 | Shopify toolkit live install and telemetry opt-out | repo | Out of stack and out of scope | excluded |

## 3. nixie-fx

From: nixie-fx (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT. Rows: 101. Covered 32, added 56 (2 of them in part 2), excluded 13.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | Editor project (`vfx-editor.prj` plus source effects) is authoring data; the game loads only the generated (abridged) | repo | particles-physics.md "8. nixie-fx", Pipeline step 1 | covered |
| 2 | Renderer peers are optional; importing core or export never loads a renderer; ESM, `sideEffects: false` | repo | particles-physics.md "8. nixie-fx", What | covered |
| 3 | Full public entrypoint map (`nixie-fx`, `/materials`, `/three`, `/pixi`, `/export` browser-safe (abridged) | repo | particles-physics.md 8 nixie-fx (approved, picked by JEV) (part 1) | added |
| 4 | Version and peer pins (0.1.16, three `>=0.184 <0.186`, Node 20 CLI) | repo | three-foundations.md "1. Version pins"; particles-physics.md section 8 "nixie-fx (approved, picked by JEV)" | covered |
| 5 | CLI verbs: `effect create`, `validate`, `export`, `export-status` | repo | particles-physics.md section 8 Pipeline step 1 | covered |
| 6 | CLI contract rules: read `--help` first and follow shipped help; `create` refuses to overwrite; `validate` (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 7 | `compareVfxExportToSources` pure browser-safe function (exported, stale, unexported, orphaned by exporter (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 8 | Incremental single-effect export: merges into existing bundle, prunes unreferenced assets, recomputes (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 9 | A subfolder with its own `vfx-editor.prj` is a separate project; parent export skips it and its own output | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 10 | Runtime core: `loadVfxExportBundle(..., { requiredBackend: "three3d" })`, `new ThreeVfxRenderer` (abridged) | repo | particles-physics.md section 8 Pipeline step 3 | covered |
| 11 | All providers optional; assetless effects render with scene and camera only; texture, mesh, and (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 12 | Support report handling: `blocked` never ships, `partial` is an explicit review item whose warnings are (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 13 | Lighting model: particles unlit by default; `lit` shading model or `render.shading: "lit"` uses the scene`s (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 14 | `.scene` preview-lighting files and `createThreeSceneLights(parseSceneDefinition(text))` (group, `update` (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 15 | Simulation space `world` (default) vs `local`; captured at birth; local particles follow live emitter (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 16 | Engine-neutral export JSON and porting the shared simulation to other engines | repo | Out of scope: JAL renders with three only | excluded |
| 17 | Install agent skills via `npx skills add` | repo | npx/Node tooling; JAL owns its own skill | excluded |
| 18 | Maintainer checks (`npm ci`, `check`, `pack:check`, `test:consumers` four clean installs), CI publish (abridged) | repo | Library maintenance process, Node tooling; generic QA owned by jal-qa-automation | excluded |
| 19 | Contributor package boundaries (core backend-neutral, export has no Node builtins, each adapter imports only (abridged) | repo | Library-internal; the consumer-side rule is row 3 | excluded |
| 20 | Exactly one simulation pass and one render pass per host frame; no extra zero-delta redraw | repo | particles-physics.md "6. Game-loop patterns" item 1 and section 8 step 3; r3f.md "3. The render loop and one clock" | covered |
| 21 | Never route per-frame counters through broad UI state | repo | r3f.md "4. `useFrame` rules (no React state in the frame loop)" | covered |
| 22 | Hidden or inactive previews stay paused; release owned resources on teardown | repo | three-foundations.md "10. Input, accessibility, and lifecycle checklist"; particles-physics.md section 8 "Hidden scenes must not tick" | covered |
| 23 | Never hide a performance defect by lowering fidelity, DPR, or diagnostics by default | repo | performance.md "2. DPR and the pixel budget", last bullet | covered |
| 24 | Visual or runtime changes need a real exported-project smoke in the host; headless unit tests do not prove (abridged) | repo | performance.md "6.1 Real GPU or nothing" | covered |
| 25 | Do not commit `dist`, tarballs, profiling hooks, absolute paths, credentials | repo | Generic git hygiene owned by jal-git-safety | excluded |
| 26 | Ten-step authoring workflow: stay inside the user-scoped folder, read the manifest, check `--help`, create (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 27 | Authoring rules: fresh unique project, effect, emitter IDs (never reuse by copying a file); paths stay in (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 28 | Project manifest fields (`app`, `kind`, `version`, `id`, `settings.effectDataPath`, `outputPath` (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 29 | Missing manifest: copy the template, replace every `REPLACE-*`, create the folders; an existing manifest is (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 30 | Authoring completion checks, including "report visual review as pending" when it was not done | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 31 | Spawn shapes (point, circle, box, cone, sphere, hemisphere, mesh with `meshAsset`, surface or vertices) | repo | particles-physics.md section 8 Model | covered |
| 32 | Burst entry schema and ranges (`time`, `count` 1 to 4096, `cycles` 1 to 256, `interval`, `probability`; count (abridged) | repo | particles-physics.md section 8 Model | covered |
| 33 | One-shot burst recipe: `rate` 0 and constant-0 `rateValue`, one burst at time 0, `loop: false` so the effect (abridged) | repo | particles-physics.md 8.4 Starting values (JAL-restrained) (part 1) | added |
| 34 | Safe-edit rules: preserve `app`, `kind`, `version` and unknown fields; finite numbers; keep scalar-value (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 35 | Asset reference rules: textures relative to `assetRootPath`; `.material` graph IDs match emitter shader IDs (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 36 | Editor visual review checklist: Chromium, Open Folder, pick the target backend preview, watch startup, loop (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 37 | Validation severity model (`error` fix, `blocker` fix or retarget, `warning`/`partial` review and verify (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 38 | Export layout: `manifest.json`, `effects/*.json`, declared assets at their root-relative paths (no fixed (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 39 | Seven-step export verification (exit code, `validation.valid` with no blockers, effect ID and backend (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 40 | Before integrating, identify host renderer, loop, asset pipeline, camera, cleanup; install only the chosen (abridged) | repo | three-foundations.md "10. Input, accessibility, and lifecycle checklist"; particles-physics.md section 8 | covered |
| 41 | Ownership split: host owns app, scene, camera, clock, URLs, caches, post, error reporting; nixie-fx owns only (abridged) | repo | three-foundations.md 11 Vanilla scene lifecycle contract (Effect module contract) | added |
| 42 | Preload assets asynchronously before spawning; provider getters during render are synchronous | repo | particles-physics.md section 8 Pipeline step 3 | covered |
| 43 | Never call `instance.update` in the same frame as `renderer.update` | repo | particles-physics.md section 8 Pipeline step 3 | covered |
| 44 | Authored paths are bundle-relative lookup keys mapped to URLs or atlas frames inside the provider; never (abridged) | repo | particles-physics.md 8.1 Authoring rules (part 1) | added |
| 45 | Stable seeds for deterministic playback (`seed` option) | repo | particles-physics.md "6. Game-loop patterns" item 5; section 8 `seek`; r3f.md "13. Deterministic test hooks" | covered |
| 46 | Runtime completion checks: selected backend imports without the other peer; loader accepts required IDs; no (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 47 | Load sequence: fetch manifest, `parseVfxExportManifest`, fetch every declared effect in parallel, then (abridged) | repo | particles-physics.md 8.2 Bundle gate and verification (part 1) | added |
| 48 | Per-effect `validation` in each manifest entry; top-level validation is their union | repo | particles-physics.md 8.2 Bundle gate and verification; Appended to Load sequence bullet | added |
| 49 | Material graphs: parse `.material` JSON into `ShaderGraph` objects keyed by graph ID, return them from (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 50 | Mesh provider: prepared mesh JSON parsed with `BufferGeometryLoader` into `BufferGeometry`, synchronous (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 51 | `ThreeVfxTextureStore` as the host-owned texture loader (`resolveUrl`, `preload`, `destroy`) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 52 | Pixi texture provider (`Assets.load`/`unload`), ticker priority, `createPixiVfx2dProjection` (`pixelsPerUnit` (abridged) | repo | PixiJS is not approved | excluded |
| 53 | `vfx.stats` diagnostics (`missingTextureRefs`, `missingMaterialRefs`, `missingMeshRefs` (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 54 | `vfx.setCamera(next)` when the host swaps cameras | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 55 | Instance and options API: `play`, `pause`, `stop`, `allowCompletion`, `seek`, `setRuntimeParameters` (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 56 | `parent` option mounts the renderer under a scene group so effects live in that object`s space | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 57 | `captureDebugTransforms: false` in production (per-particle debug matrices only power editor overlays) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 58 | Live emission geometry: `setEmissionGeometry(emitterId, geometry)` binds a real mesh as the spawn surface (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 59 | Frame delta clamped (0.1 s max, never negative) | repo | particles-physics.md "6. Game-loop patterns" item 1 (0.05 s) | covered |
| 60 | Async load cancellation: after every `await` check a `disposed` flag and dispose anything that arrives late (abridged) | repo | three-foundations.md 8 Disposal (Async cancellation) (part 1) | added |
| 61 | Diagnostics HUD as plain DOM refreshed 2 to 4 times per second, never an extra render pass; FPS window resets (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 62 | Resize from `ResizeObserver`, coalesced into one rAF | repo | three-foundations.md "2. Renderer setup (WebGL)" | covered |
| 63 | `visibilitychange` stops and resumes the loop | repo | three-foundations.md section 10 | covered |
| 64 | Orbit constraints: damping 0.06, no pan, distance 4.6 to 10, polar 0.72 to 1.55 rad | repo | particles-physics.md "7. Interaction patterns" | covered |
| 65 | Reduced motion read live and turns autorotate off | repo | three-foundations.md section 10 | covered |
| 66 | Interactive canvas `tabIndex=0` plus `aria-label` naming the interaction | repo | three-foundations.md section 10; `SKILL.md` "6. Poster-first loading" | covered |
| 67 | FOV widens (30 to 36) under 640 px width | repo | three-foundations.md section 2 `fit()` | covered |
| 68 | Scene-graph disposal collecting geometries, materials, textures into sets | repo | three-foundations.md "8. Disposal" | covered |
| 69 | PMREM environment baked from a scene of light cards at sigma 0.03, re-bake throttled to 150 ms, old target (abridged) | repo | three-foundations.md section 2 "The JAL-lawful look" | covered |
| 70 | Env-scene design: a dim base shell so no reflection returns pure black; narrow tall strips at several (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Environment scene layout) (part 1) | added |
| 71 | RectAreaLight studio rig (`RectAreaLightUniformsLib.init()`, ceiling panel, tall window key, cool fill, faint (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Area-light studio rig) (part 1) | added |
| 72 | Warm dark studio: near-black clear `0x14100c`, ACES, neon point-light spill, orange palette | repo | Dark painted background and neon banned in Zone B (`SKILL.md` "Zone B"); JAL uses Neutral tone mapping | excluded |
| 73 | Backdrop sphere with vertical colour gradient shader | repo | Gradient and painted background banned (`SKILL.md` "Zone B") | excluded |
| 74 | Two-shell cheap glass (faint tint film plus a black physical shell drawn additively so only speculars (abridged) | repo | Relies on additive blending; JAL "Fake glass" row covers cheap glass (three-foundations.md section 2 Material recipes) | excluded |
| 75 | Alpha-to-coverage translucency: `alphaMap` plus `alphaTest` about 0.28 plus opacity about 0.62 plus (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Material recipes, Perforated or woven surface) (part 1) | added |
| 76 | Procedural seamless tile texture drawn once on a 2D canvas (hex tile, exact period), cached (abridged) | repo | shaders.md 11 Full-screen quad setup (part 1) | added |
| 77 | Baked seeded imperfection: seeded 1D noise wobbles control points, swells and pinches tube radius, and writes (abridged) | repo | shaders.md 11 Full-screen quad setup (part 1) | added |
| 78 | Skip tone mapping on a saturated self-coloured surface because ACES shifts saturated orange toward yellow | repo | three-foundations.md 3 The white-background tone-mapping trap (fix 4) (part 1) | added |
| 79 | Wide soft additive halo sprite that "replaces post-process bloom" | repo | Emissive halo and glow banned in Zone B | excluded |
| 80 | Live palette registry: register live `THREE.Color` instances (uniforms, materials, lights), recolour them in (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Live accent retint) (part 1) | added |
| 81 | Turned objects from `LatheGeometry` profiles (96 radial segments), superellipse dome sweep, double wall by (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Turned objects bullet) (part 1) | added |
| 82 | Per-state geometry merged once, lit state toggled by `visible` instead of rebuilding | repo | r3f.md "4. `useFrame` rules", Avoiding re-renders (toggle `visible`); r3f.md "5. Instancing" (`<Merged>`) | covered |
| 83 | Module support levels: full (velocity, velocity over lifetime, colour, size, rotation, lifetime by emitter (abridged) | repo | particles-physics.md 8 nixie-fx (approved, picked by JEV) (part 1) | added |
| 84 | Noise module: curl or value noise, octaves doubling frequency, scroll offset | repo | particles-physics.md section 8 Model (curl noise); section 4 curl sketch | covered |
| 85 | Blend modes `alpha`, `additive`, `premultiplied`; premultiplied skips the one-draw instanced path and falls (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 86 | `opacitySource` (`textureAlpha`, `red`, `green`, `blue`, `luminance`, `inverseLuminance`, `constant`) lets an (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 87 | Sort modes (`none`, `distanceFarFirst`, `distanceNearFirst`, `oldestFirst`, `youngestFirst`); instanced path (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 88 | Alignment and facing modes (`faceCamera`, `spawnDirection`, `velocity`, `vector`; facing `cameraPlane` (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 89 | `render.texture: null` falls back to a shared procedural circle or square shape with `softness`; cached and (abridged) | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 90 | Material sampler budget: at most 8 texture taps (main plus 7 node samplers); 6 or more flagged as expensive (abridged) | repo | particles-physics.md 8 nixie-fx (part 1) | added |
| 91 | Caps: `maxParticles` 1 to 4096 per emitter, burst count up to 4096, per-frame event limit 4096, sub-emitter (abridged) | repo | particles-physics.md section 8 Model | covered |
| 92 | HDR colour intensity exposure cap (2 to the 50th) | repo | HDR emissive intensity only matters with bloom, which is banned | excluded |
| 93 | `createThreeHdrEffectLayer` (wraps `UnrealBloomPass`) and Pixi bloom | repo | particles-physics.md section 8 "JAL rules if approved" (never use it) | covered |
| 94 | `seek(t)` replays deterministically from zero, cost grows with t | repo | particles-physics.md section 8 "JAL rules if approved" | covered |
| 95 | `timeSeconds` start option (prewarm an ambient loop) and `autoStart: false` | repo | particles-physics.md 8.3 Runtime surface (part 1) | added |
| 96 | Template starting values: impact (90 burst, 0.45 s, life 0.18 to 0.52 s, cap 220); smoke puff (36 burst plus (abridged) | repo | particles-physics.md 8.4 Starting values (JAL-restrained) (part 1) | added |
| 97 | Stress fixtures (burst storm, many small particles, atlas-like textures, advanced modules) kept as perf test (abridged) | repo | particles-physics.md 8 nixie-fx (part 1) | added |
| 98 | Examples built with Vite, npm, Node 20.19, CodeSandbox | repo | Vite and Node-only tooling banned; JAL builds with Bun.build (three-foundations.md sections 5 to 7) | excluded |
| 99 | `nixie-fx/export/node` and the CLI are the only Node-filesystem parts; CLI must be verified under `bunx` | repo | particles-physics.md section 8 "nixie-fx (approved, picked by JEV)" | covered |
| 100 | Unlit texture-only billboards become one `InstancedMesh` draw | repo | particles-physics.md section 8 Model | covered |
| 101 | `agents/openai.yaml` skill metadata | repo | Tooling metadata, no knowledge | excluded |

## 4. webgpu-claude-skill

From: webgpu-claude-skill (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT declared in plugin.json and README, no LICENSE file: own words only. Rows: 114. Covered 32, added 60 (1 of them in part 2), excluded 22.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | Import `three/webgpu` plus `three/tsl`; never mix with the plain `three` build | repo | three-foundations.md "1. Version pins" (One three) and "5. The `three/webgpu` alias plugin for Bun.build" | covered |
| 2 | `new WebGPURenderer()` then `await renderer.init()` before any render or compute | repo | three-foundations.md "4. WebGL vs WebGPU/TSL" | covered |
| 3 | Browser list (Chrome and Edge 113+, Firefox behind a flag, Safari preview) | repo | Superseded by feature detection: `SKILL.md` "6. Poster-first loading" step 2 (`navigator.gpu` plus resolved `requestAdapter()`); never gate by (abridged) | covered |
| 4 | Version notes: r171 stable TSL baseline, r178 renames (`PI2` to `TWO_PI`, `transformedNormal*` to `normal*`) | repo | three-foundations.md section 4, TSL essentials | covered |
| 5 | Further API breaks: r177 Gaussian blur sigma rescaled (double old values), r180 `resolution` became scalar (abridged) | repo | three-foundations.md 4 WebGL vs WebGPU/TSL (Post API breaks) (part 1) | added |
| 6 | Stale guidance in the Cursor shims (`computeAsync`, `renderAsync`, `PostProcessing` class) contradicts the (abridged) | repo | JAL already states the current APIs (three-foundations.md section 4; r3f.md "10. WebGPU in R3F v9"); lesson: trust the installed three, not shims | covered |
| 7 | TSL has no operator overloading: build expressions by method chaining (`.mul().add().sin()`) | repo | shaders.md 1 Delivering shaders in three (TSL cheat sheet) (part 1) | added |
| 8 | Type constructors and WGSL mapping (`float` f32, `int` i32, `uint` u32, `bool`, `vec2..4`, `color` as vec3 (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 9 | Conversions (`toVec4(w)`, `toFloat`, `toInt`, `toColor`) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 10 | Swizzling (`xyz`, `rgb`, `stp` sets, reorder and repeat such as `zyx`, `xxy`) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 11 | Uniforms: `uniform(value)`, mutate `.value` (or `.value.set`) from JS | repo | shaders.md "1. Delivering shaders in three", TSL rules | covered |
| 12 | Auto-updating uniforms: `onFrameUpdate`, `onObjectUpdate`, `onRenderUpdate` | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 13 | Comparison, logical, and bitwise node methods (`lessThan`, `equal`, `and`, `not`, `xor`, `bitAnd` (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 14 | Variables: `.toVar(name)`, `.toConst()`, `property(type, name)` | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 15 | The gotcha: JS reassignment inside `If` is invisible to TSL; use `.toVar()` plus `.assign()`, `select()`, or (abridged) | repo | three-foundations.md section 4 TSL essentials; shaders.md section 1 | covered |
| 16 | Nuance: a swizzle property setter on a vector node (`v.y = x`) is intercepted by TSL; scalars have no such (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 17 | `If().ElseIf().Else()` and `select(cond, a, b)` (preferred for simple values) | repo | shaders.md section 1; shaders.md "12. Shader self-check" (select over divergent branches) | covered |
| 18 | `Switch(x).Case(n, fn).Default(fn)` | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 19 | `Loop` forms: count, ranged object `{ start, end, type }`, nested two-index, `Break`, `Continue` | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 20 | `Discard()` (fragment only) and `Return()` inside `Fn` | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 21 | `Fn` parameters: array destructuring with defaults, object-style named parameters, and the build context (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 22 | `time` and `deltaTime` nodes | repo | shaders.md section 1; particles-physics.md "5. WebGPU compute (tier 6)" | covered |
| 23 | Oscillators `oscSine`, `oscSquare`, `oscTriangle`, `oscSawtooth` (0 to 1) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 24 | Core math function list (abs, fract, mix, smoothstep, pow, dot, cross, reflect, refract, ...) | repo | Mirrors GLSL one to one; no immersive-specific knowledge | excluded |
| 25 | Constants `PI`, `TWO_PI`, `HALF_PI`, `EPSILON` | repo | three-foundations.md section 4 (`TWO_PI` rename) | covered |
| 26 | Utilities `hash`, `checker`, `remap`, `range`, `rotate` | repo | shaders.md 1 Delivering shaders in three (TSL cheat sheet, Utilities) (part 1) | added |
| 27 | Sine-based hash `fract(sin(dot(p, k)) * 43758.5453)` used for noise | repo | JAL bans it as a mistake: shaders.md "2. Hashes" (precision blocks on mobile) | covered |
| 28 | Node material catalog: Basic, Standard, Physical, Phong, Toon, Lambert, Normal, Matcap, Points, LineBasic (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 29 | Slot details: `opacityNode` needs `transparent = true`; `alphaTestNode`; `normalMap(tex, strength)` (abridged) | repo | shaders.md 1 Delivering shaders in three (Node materials and slots) (part 1) | added |
| 30 | Physical slots: clearcoat (roughness, normal), transmission, thickness, attenuation distance and colour (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Material recipes, TSL rows); specularColorNode added; rest already present | added |
| 31 | Iridescence and dispersion slots (soap-film and rainbow glass) | repo | Produces violet and rainbow fringes: purple family banned in Zone B (`SKILL.md` "Zone B"); noyzzi only | excluded |
| 32 | `envMapNode` per material and `lightsNode` custom light sets | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 33 | `positionNode` vertex displacement along normals (height map or wave) | repo | shaders.md section 1 slot table; effects-cleanroom.md grass and sand TSL sketches | covered |
| 34 | `vertexNode` full vertex override, `fragmentNode` full fragment override that bypasses lighting, `outputNode` (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 35 | Geometry inputs: `positionGeometry` vs `positionLocal` vs world and view; `normalGeometry`; tangent and (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 36 | Camera and screen inputs (`cameraNear/Far`, matrices, `screenUV`, `screenCoordinate`, `screenSize` (abridged) | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 37 | `triplanarTexture(texX, texY, texZ, sharpness)` for UV-less meshes | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 38 | TSL glass recipe (transmission 0.95, roughness 0, ior 1.5, thickness 0.5) | repo | three-foundations.md section 2 Material recipes, Real glass | covered |
| 39 | Fresnel via `cameraPosition.sub(positionWorld)` and `pow(1 - N.V, 3)` | repo | shaders.md "6. Fresnel and rim" | covered |
| 40 | Cyan emissive fresnel rim, neon sphere palette (`0xff00ff`, `0x00ffff`), dark scene backgrounds in every (abridged) | repo | Additive or emissive rim, neon, and painted dark backgrounds banned (`SKILL.md` "Zone B"; shaders.md section 6) | excluded |
| 41 | Dissolve: hash threshold with `Discard`, plus an emissive orange edge band | repo | shaders.md 16 Mesh-to-mesh sweep handover (part 1) | added |
| 42 | Ambient colour cycling with `mix(a, b, oscSine(time))` | repo | Decorative ambient hue animation conflicts with calm JAL motion; loops must stop under reduced motion | excluded |
| 43 | Storage buffers `instancedArray(count, type)`, `element(instanceIndex)`, `.compute(count)` | repo | particles-physics.md "5. WebGPU compute (tier 6)" | covered |
| 44 | Buffer element types (`float`, `vec2`, `vec3`, `vec4`, `int`, `uint`) and sizing against (abridged) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 45 | `attributeArray(data, type)` read-only storage buffers (lookup tables, rest shapes) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 46 | Reading other elements (neighbour at `(i + 1) mod count`) inside a kernel | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 47 | Init kernel seeding per-axis positions with offset hashes, run once after `init()` | repo | particles-physics.md section 5 `init` | covered |
| 48 | Physics kernel: gravity, integrate, ground restitution about 0.7 to 0.8, friction 0.9 to 0.98, boundary walls (abridged) | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 49 | Attractor with softened inverse-square falloff (`/(d*d + 0.1)`) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 50 | Boids by brute-force `Loop(count)` over every particle | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 51 | Workgroup size `[64]`, 2D `[8, 8]` | repo | particles-physics.md section 5 bullets | covered |
| 52 | Compute built-ins `globalId`, `localId`, `workgroupId`, `numWorkgroups`, `subgroupSize` (abridged) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 53 | Barriers `workgroupBarrier`, `storageBarrier`, `textureBarrier` for shared-memory phases | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 54 | Atomics (`atomicAdd`, `atomicSub`, `atomicMax`, `atomicMin`, `atomicAnd`, `atomicOr`, `atomicXor`) on counters | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 55 | Rendering compute output: `InstancedMesh` plus `positionNode = buffer.element(instanceIndex)`, or `Points` (abridged) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 56 | Synchronous `renderer.compute()` after `await init()`; `computeAsync` deprecated since r181 | repo | particles-physics.md section 5; three-foundations.md section 4 | covered |
| 57 | GPU to CPU readback (`readRenderTargetPixelsAsync` for textures) | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| 58 | Continuous GPU emitter: lifetime buffer, subtract `dt`, respawn at the emitter with time-salted hashes when (abridged) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 59 | Event-driven compute: a separate kernel dispatched only on click (raycast to plane, impulse within a radius) | repo | particles-physics.md 5 WebGPU compute (tier 6) (part 1) | added |
| 60 | Per-frame `dt` clamped to 0.1 s | repo | particles-physics.md section 6 item 1 (0.05 s) | covered |
| 61 | Click explosion (radius 3, strength 5, randomised force) | repo | JAL taste: pointer only nudges, never an explosion (particles-physics.md "1. Pick the lowest tier that reads") | excluded |
| 62 | `RenderPipeline`, `pass(scene, camera)`, `getTextureNode(`output`)`, `outputNode`, `render()` instead of (abridged) | repo | three-foundations.md section 4; r3f.md section 10 | covered |
| 63 | Bloom (`threshold`, `strength`, `radius`) and selective bloom through an emissive MRT target | repo | Bloom banned in canvases (`SKILL.md` "Zone B") | excluded |
| 64 | Blur nodes: `gaussianBlur(color, sigma)`, `boxBlur` (mobile), `hashBlur` (single pass), `bilateralBlur` (edge (abridged) | repo | shaders.md 9 Colour grading (part 1) | added |
| 65 | AA nodes `fxaa`, `smaa`, `traa` with import paths | repo | shaders.md 9 Colour grading (part 1) | added |
| 66 | Depth of field: `dof(color, viewZ, focusDistance, focalLength, bokehScale)` with `scenePass.getViewZNode()` | repo | shaders.md 9 Colour grading (part 1) | added |
| 67 | Motion blur from a velocity target | repo | Beyond the JAL post budget (AA only, performance.md "1. The budget table") | excluded |
| 68 | Screen-space reflections `ssr(color, depth, normal, camera)` | repo | Beyond post budget; JAL reflections come from env maps or the reflector recipe (effects-cleanroom.md section 2) | excluded |
| 69 | Screen-space AO `ao(depth, normal, camera)` multiplied into colour | repo | Beyond post budget; JAL grounds objects with baked AO and contact shadows (three-foundations.md section 2) | excluded |
| 70 | Film grain `film(color, { intensity })` | repo | Filter look; retro or print styling is JEV taste or noyzzi territory (shaders.md "8. Dithering and anti-banding") | excluded |
| 71 | Outline pass (`edgeStrength`, `edgeGlow`, hidden edge colour) | repo | Adds a post pass beyond budget and carries edge glow; selection feedback belongs to the DOM UI | excluded |
| 72 | Chromatic aberration node and CRT RGB-split sampling | repo | Chromatic aberration and RGB split banned (`SKILL.md` "Zone B") | excluded |
| 73 | Colour nodes `grayscale`, `saturation`, `hue`, `vibrance`, `posterize`, `sepia` | repo | shaders.md 9 Colour grading (part 1) | added |
| 74 | `lut3D(color, Data3DTexture, size)` | repo | shaders.md "9. Colour grading" | covered |
| 75 | Custom post pass as a `Fn` over the scene texture (invert, vignette) | repo | shaders.md 11 Full-screen quad setup (part 1) | added |
| 76 | CRT scanlines, pixelate | repo | Scanlines, CRT, pixelation banned (`SKILL.md` "Zone B") | excluded |
| 77 | Sobel edge detection pass | repo | Stylised filter; needs a JEV taste pass and reads as noyzzi territory | excluded |
| 78 | `viewportSharedTexture(uv)` to sample what is already drawn at offset UVs | repo | effects-cleanroom.md "0.4 Shared helpers" built-ins list; ocean Snell window sketch | covered |
| 79 | MRT: `scenePass.setMRT(mrt({ output, normal: normalView, depth }))`, read with `getTextureNode(name)` | repo | performance.md 5 Cost references (part 1) | added |
| 80 | Chaining several effects into one `outputNode` | repo | performance.md section 5 (RenderPipeline fuses node chains) | covered |
| 81 | Runtime toggle: `select(uniformFlag, effect(color), color)` so an effect switches without a rebuild | repo | r3f.md 11 Performance monitoring and adaptive quality (part 1) | added |
| 82 | `transition(passA, passB, progress, maskTexture)` between two scene passes | repo | scroll-choreography.md 9 Scroll-driven camera paths for R3F (part 1) | added |
| 83 | `godrays`, `anamorphic`, `lensflare`, `retroPass` | repo | God rays, lens flare, CRT banned in Zone B; anamorphic streaks are glow | excluded |
| 84 | `denoise`, `ssgi` | repo | Heavy multi-pass effects far beyond the JAL post budget | excluded |
| 85 | `texture3DLoad`, `texture3DLevel` (r182) | repo | Niche; no immersive-site use identified beyond `lut3D`, which is covered | excluded |
| 86 | `wgslFn` inline WGSL functions; parameters bound by the WGSL signature | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 87 | Hybrid pattern: a TSL `Fn` wrapper with defaults around a `wgslFn` core | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 88 | WGSL types and syntax reference (`let`, `var`, `const`, loops, switch, built-ins) | repo | Generic language reference (WGSL spec), not immersive knowledge | excluded |
| 89 | Simplex noise and FBM written in WGSL | repo | shaders.md "3. Noise families" (built-in `mx_noise_*` and own noise) | covered |
| 90 | Avoid divergent branches (`mix` plus `step`), cache repeated math, sample a texture once | repo | shaders.md "12. Shader self-check" (divergent branches); the rest is generic shader hygiene | covered |
| 91 | Device loss causes (driver crash, resource pressure, watchdog about 10 s, driver update, config change) (abridged) | repo | three-foundations.md 9 Context loss and device loss (part 1) | added |
| 92 | `device.lost` promise: never `await` it; `reason` is `destroyed` (intentional) or `unknown` (recover); never (abridged) | repo | three-foundations.md 9 Context loss and device loss (part 1) | added |
| 93 | A device can be born lost: request a fresh adapter before every device | repo | three-foundations.md section 9 ("with a fresh adapter") | covered |
| 94 | Recovery options: full reload (warn first), restart GPU content (dispose, re-init, rebuild), restore saved (abridged) | repo | three-foundations.md 9 Context loss and device loss (part 1) | added |
| 95 | `requestAdapter()` returning null after a loss means the browser blocked the GPU: distinguish "unsupported" (abridged) | repo | three-foundations.md 9 Context loss and device loss (part 1) | added |
| 96 | `device.destroy()` test limits: it unmaps buffers at once and always permits recovery, unlike a real loss | repo | performance.md 6.6 Resilience and leak tests (part 1) | added |
| 97 | Chrome crash escalation (second crash within 2 min fails adapters until refresh; third within 2 min blocks (abridged) | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 98 | Chrome flags `--disable-domain-blocking-for-3d-apis` and `--disable-gpu-process-crash-limit` for loss testing | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 99 | Short delay (about 100 ms) before re-init | repo | three-foundations.md section 9 ("after a short delay") | covered |
| 100 | Default limits (`maxBufferSize` 256 MiB, `maxStorageBufferBindingSize` 128 MiB, 8 storage buffers per stage (abridged) | repo | three-foundations.md section 4 TSL essentials (color attachments not listed, minor) | covered |
| 101 | `requiredLimits` through the renderer constructor; init fails if unsupported; read `adapter.limits` first (abridged) | repo | three-foundations.md section 4 | covered |
| 102 | three requests every adapter feature automatically | repo | three-foundations.md 4 WebGL vs WebGPU/TSL (Other features bullet) (part 1) | added |
| 103 | Optional features: `float32-filterable`, `float32-blendable`, `shader-f16`, `timestamp-query`, `subgroups` (abridged) | repo | three-foundations.md 4 WebGL vs WebGPU/TSL (part 1) | added |
| 104 | webgpureport.org to compare limits and features across GPUs | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 105 | Debug: log every adapter limit; Chrome console WebGPU validation errors name the exceeded limit | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 106 | Earth: day and night textures blended by `smoothstep` of the sun dot product, night-side lights, roughness (abridged) | repo | shaders.md 15 Spherical bodies (part 1) | added |
| 107 | Layered shells: cloud sphere at radius 1.01 with scrolling UV, `transparent`, `depthWrite: false` | repo | shaders.md 15 Spherical bodies (part 1) | added |
| 108 | Atmosphere as a back-side fresnel glow shell at radius 1.15, star field, deep-space background | repo | Emissive halo glow, `<Stars>`-style star fields, and dark painted backgrounds banned (`SKILL.md` "Zone B") | excluded |
| 109 | `renderer.setAnimationLoop(animate)` as the loop owner | repo | JAL has one rAF owner, the `gsap.ticker` clock (r3f.md "3. The render loop and one clock") | excluded |
| 110 | Uncapped `setPixelRatio(window.devicePixelRatio)` and `window` resize handlers | repo | As mistakes: performance.md "2. DPR and the pixel budget"; three-foundations.md section 2 (`ResizeObserver`) | covered |
| 111 | lil-gui panel bound to uniforms | repo | Dev overlays are approval candidates behind `?debug` (r3f.md "11. Performance monitoring and adaptive quality"; particles-physics.md section 6 item 6) | covered |
| 112 | Starter template layout (CONFIG object, exported scene and uniforms) | repo | Generic project scaffolding; JAL scaffolding owned by jal-scaffold and three-foundations.md | excluded |
| 113 | Skill packaging: Cursor rules with globs, `@file` shims, marketplace JSON | repo | Tooling metadata, not immersive knowledge | excluded |
| 114 | Conditional stamp and fade into a buffer with `select`, `max`, `clamp` | repo | effects-cleanroom.md "3. Deformable sand or snow" (stamp array into StorageTexture) | covered |

## 5. threejs-game-skills

From: threejs-game-skills (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT. Rows: 170. Covered 65, added 73 (7 of them in part 2), excluded 32.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | The request`s own words set the bar ("premium", "polished", "less basic" raise it); a narrow edit stays (abridged) | repo | SKILL.md 3 step 1 Scope from the request (part 1) | added |
| 2 | Write the brief before building: promise, primary verb, what repeats, fail and retry, non-goals | repo | jal-immersive/SKILL.md section 3 steps 1 and 2 (direction contract plus immersive addendum; section concepts with job, one message, beats) | covered |
| 3 | Core loop contract and level or encounter plan | repo | Game design artifacts; the JAL section concept is the web analogue | excluded |
| 4 | Fix art direction, camera scale, and hero target early; finish one representative scene at real scale with (abridged) | repo | SKILL.md 3 step 7 Representative beat first (part 1) | added |
| 5 | Greybox first to prove scale, framing, timing before art detail | repo | SKILL.md 3 step 7 Representative beat first (part 1) | added |
| 6 | In-flight continuity file: intent, constraints, decisions, completed work, pending job IDs, defects, next (abridged) | repo | SKILL.md 3 The 11-step workflow | covered |
| 7 | Lead plus at most two workers with separate file ownership, IO contract, acceptance criteria | repo | jal-orchestration/SKILL.md "2. Plan (the FILE OWNERSHIP table)" and "4. The brief" | covered |
| 8 | One focused independent review from raw captures, asking for defects rather than endorsement, no recursive (abridged) | repo | jal-jev/references/catalog.md `ui.finish_disposition` (fresh-context reviewer, never judged on visible effort); jal-immersive section 3 step 11 (at (abridged) | covered |
| 9 | Report what ran and what was observed; say so when something could not run | repo | jal-immersive/SKILL.md section 7 item 2 ("not measured") and section 8 pre-return gate | covered |
| 10 | Detailed evidence in one project artifact, short final answer linking it | repo | SKILL.md 3 build report is the continuity file (part 1) | added |
| 11 | Do not end a turn with next-step offers; ask only when a choice changes the result | repo | Generic agent conduct owned by jal-principal and jal-orchestration | excluded |
| 12 | Phase routing table from director to specialists | repo | jal-immersive/SKILL.md references table and section 3; mapping appended below | covered |
| 13 | Workflow evaluation scenarios for maintainers (fixed prompts, seeds, compare actions and artifacts, not (abridged) | repo | Maintaining a skill pack, not building sites; generic process owned by jal-orchestration audit | excluded |
| 14 | Skill path resolution, install.sh, agents/openai.yaml, validate-skills.sh | repo | Codex and Claude packaging only | excluded |
| 15 | Premium means every visible surface is authored, not only the hero; primitives plus glow or fog are (abridged) | repo | SKILL.md 7 Verification | covered |
| 16 | Forms, then materials, then lighting, then effects | repo | three-foundations.md section 2 "Order of work" | covered |
| 17 | Graphics pass: capture, score the weakest surfaces, upgrade them, re-score | repo | SKILL.md 7 Verification | covered |
| 18 | Ten-category visual scorecard, 0 to 3, premium = none under 2 and mean 2.3; showcase = six at 3 and mean 2.7 | repo | SKILL.md 7 Verification | covered |
| 19 | Calibration anchor stills viewed before scoring | repo | SKILL.md 7 Verification (part 1) | added |
| 20 | Automatic failures that block a premium claim regardless of scores | repo | SKILL.md 7 Verification | covered |
| 21 | Interpret categories through the section kind; never invent content to raise a score; minimal art can score (abridged) | repo | SKILL.md 7 Verification | covered |
| 22 | Pixel metrics as advisory evidence (entropy under 3.0, dominant share over 0.6, edge density under 0.04 (abridged) | repo | performance.md section 6.5 Pixel assertions (measured on the subject box) | covered |
| 23 | Never add noise or clutter to raise pixel metrics; a low value needs an explanation | repo | performance.md 6.5 Pixel assertions; also in SKILL.md 7 | added |
| 24 | Before and after per category with one line of evidence; "not captured" for new work; re-score only changed (abridged) | repo | SKILL.md 3 The 11-step workflow | covered |
| 25 | Render budget starting table, desktop and mobile | repo | performance.md section 1 (pack numbers quoted as reference; JAL columns tighter) | covered |
| 26 | Where to spend budget: instanced repeats, triangles near camera, share materials, real shadows only on hero | repo | performance.md section 4; three-foundations.md section 2 lighting bullets | covered |
| 27 | Report renderer counters after a graphics pass | repo | performance.md sections 6.4 and 6.8 | covered |
| 28 | Material kit as named shared roles; UI and world signal colours from one set | repo | three-foundations.md 2 Renderer setup (WebGL) (Material roles) (part 1) | added |
| 29 | MeshStandardMaterial by default, Physical only for visible clearcoat, transmission, sheen | repo | three-foundations.md section 2 Material recipes | covered |
| 30 | Shader work must earn its place | repo | jal-immersive/SKILL.md section 3 step 4 (`imm.tech`, lightest technique wins) | covered |
| 31 | Event-driven pooled VFX tied to gameplay (pickup, hit, boost, shield, spawn) | repo | Game VFX; bursts and glows banned in Zone B; pooling is in performance.md section 4 | excluded |
| 32 | Meaning never by colour alone | repo | jal-ui-taste/SKILL.md and jal-design-system/references/foundations.md (colour-alone rule) | covered |
| 33 | Instancing: needsUpdate once per batch, recompute bounds, mixed materials erase the win, collision separate | repo | r3f.md section 5 Instancing | covered |
| 34 | LOD with hysteresis, checked under camera motion | repo | performance.md section 4 step 4 | covered |
| 35 | Imported asset cleanup: scale, pivot, forward and up axis, bounds, proxy, counts, clips, judged under the (abridged) | repo | three-foundations.md 7.4 Formats and budgets (GLB intake, Animated GLB intake) (part 1) | added |
| 36 | Modeling principles: silhouette first, primitive bases plus authored geometry, functional parts, detail where (abridged) | repo | three-foundations.md 2 Renderer setup (WebGL) (Authoring procedural objects) (part 1) | added |
| 37 | Procedural geometry class table (Extrude, Lathe, Tube, custom Buffer, Shape, InstancedMesh, LOD) | repo | three-foundations.md 2 Renderer setup (WebGL) (Authoring procedural objects) (part 1) | added |
| 38 | Fake bevels with thin trim strips or inset darker panels | repo | three-foundations.md 2 Renderer setup (WebGL) (Authoring procedural objects) (part 1) | added |
| 39 | Hero vehicle, character, obstacle, reward recipes | repo | Game content | excluded |
| 40 | World prop kit layered play, near, mid, far | repo | Level kits; JAL environment sections are one composed scene | excluded |
| 41 | Graphics code layout and a factory result contract (root, collision, lod, bounds, diagnostics) | repo | three-foundations.md 2 Renderer setup (WebGL) (part 1) | added |
| 42 | Texture settings chosen deliberately: filtering, mipmaps, wrap, colour space, anisotropy; no unique full-size (abridged) | repo | three-foundations.md 7.4 Formats and budgets (Texture settings on purpose) (part 1) | added |
| 43 | Deliberate tone mapping; tune exposure on the active view | repo | three-foundations.md sections 2 and 3 | covered |
| 44 | DPR cap per tier | repo | performance.md section 2 (JAL tighter) | covered |
| 45 | Resize updates renderer, camera, composer, and CSS together | repo | three-foundations.md 12 Visual glitch and blank canvas triage (step 1) (part 1) | added |
| 46 | Camera keeps subject and next action framed; mobile framing checked separately | repo | three-foundations.md section 2 `fit` (fov widen under 640); r3f.md section 12 | covered |
| 47 | Light stack: key, fill, rim, practical, contact | repo | three-foundations.md section 2 (rim as darken, never additive) | covered |
| 48 | Shadow tuning: bias against acne and peter-panning, fewer casters, smaller maps | repo | three-foundations.md 2 Renderer setup (WebGL) (Shadow tuning) (part 1) | added |
| 49 | Fog reveals depth, never stands in for an empty scene | repo | jal-immersive/SKILL.md section 2 Zone B (depth haze matched to page white) | covered |
| 50 | Post as finishing: bloom on emissive, grain, brief chromatic aberration | repo | Bloom, glow, chromatic aberration banned in Zone B; JAL post is `three.post_light` | excluded |
| 51 | Performance cut order: post and shadows, then cull, LOD, instance, then density | repo | performance.md section 4 reduction ladder | covered |
| 52 | Environment map prerequisite (RoomEnvironment through PMREM, sigma 0.04, environmentIntensity) | repo | three-foundations.md section 2 | covered |
| 53 | Painted metal, brushed metal, rubber recipes | repo | three-foundations.md section 2 Material recipes | covered |
| 54 | Matte plastic, glossy ceramic, cloth with sheen recipes | repo | three-foundations.md 2 Renderer setup (WebGL) (Material recipes) (part 1) | added |
| 55 | Emissive signal material driving bloom | repo | Glow and bloom banned in Zone B | excluded |
| 56 | Real vs fake glass and their costs | repo | three-foundations.md section 2 | covered |
| 57 | onBeforeCompile safety: customProgramCacheKey, stash shader in userData, share one material | repo | shaders.md section 1 | covered |
| 58 | Per-object variation: separate instances sharing a cache key, or instanceColor and instanceMatrix | repo | shaders.md 1 Delivering shaders in three (part 1) | added |
| 59 | Additive fresnel rim into emissive | repo | Additive rim is glow; the lawful darkening rim is shaders.md section 6 | excluded |
| 60 | Scrolling emissive panel bands | repo | Emissive glow bands, game signage | excluded |
| 61 | Wind sway by patching a stock material on InstancedMesh (height weighted, per-instance phase) | repo | effects-cleanroom.md 4 Dense stylized grass with wind (Light variant) (part 1) | added |
| 62 | Dissolve or spawn by hashed threshold with an edge band; discard disables early depth | repo | shaders.md 16 Mesh-to-mesh sweep handover (part 1) | added |
| 63 | Gradient sky dome | repo | Painted sky gradient banned in Zone B | excluded |
| 64 | Raw ShaderMaterial skips tone mapping and colour space | repo | shaders.md section 1; three-foundations.md section 3 | covered |
| 65 | Bloom plus vignette composer chain, OutputPass last | repo | Bloom and heavy vignette banned; OutputPass rule already in three-foundations.md section 4 table | excluded |
| 66 | Composer cost scales with DPR squared; skip it on low tiers | repo | performance.md sections 3 and 5 | covered |
| 67 | Vertex-colour ambient occlusion baked into geometry | repo | three-foundations.md 2 Renderer setup (WebGL) (part 1) | added |
| 68 | Polygon-offset decals against z-fighting | repo | three-foundations.md 2 Renderer setup (WebGL) (part 1) | added |
| 69 | Fake contact shadow plane faded with height | repo | three-foundations.md section 2 lighting bullets | covered |
| 70 | Emissive LOD signals | repo | Emissive beacons for game pickups | excluded |
| 71 | Matcap props ignore scene lights | repo | shaders.md section 7 | covered |
| 72 | Input response visible within about 100 ms | repo | particles-physics.md section 6 item 9 | covered |
| 73 | Feel layer order (latency, response curve, contact, camera, sync) and effect strength scaled to event weight (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 74 | Never gate the primary input behind an animation finishing | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 75 | Tiny tween manager with cubic easing on the real delta | repo | particles-physics.md section 6 item 7 | covered |
| 76 | easeOutBack overshoot and squash-and-stretch settle | repo | Overshoot and bounce banned (jal-motion/SKILL.md; particles-physics.md section 6 item 7) | excluded |
| 77 | Trauma-squared screenshake | repo | Banned (particles-physics.md section 6 item 7) | excluded |
| 78 | Hitstop | repo | Banned (same) | excluded |
| 79 | FOV punch | repo | Banned (same) | excluded |
| 80 | Emissive impact flash and white overlay flash | repo | Glow and white flash banned | excluded |
| 81 | Pickup pop and HUD counter scale punch | repo | Game juice; JAL counters use `mu.R07` and `mu.R08` (jal-motion/references/components.md) | excluded |
| 82 | Gamepad rumble | repo | Out of scope for sites | excluded |
| 83 | Determinism: all randomness seeded, visual time from the accumulated frame clock, never wall clock | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| 84 | Genre patterns, difficulty curves, fun-factor tests | repo | Game design; JAL analogue is `imm.gate` ("reads the same as its poster" means not earned) | excluded |
| 85 | Physics ladder: custom, Rapier, cannon-es, Jolt, Ammo, Matter (2D) | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 86 | Fixed step with accumulator clamped to 0.1 s | repo | particles-physics.md section 6 item 2 | covered |
| 87 | Primitive or compound colliders, trimesh only for fixed geometry, proxies for imported meshes | repo | particles-physics.md sections 7 and 9 | covered |
| 88 | Copy body transforms to meshes in exactly one system | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 89 | CCD only where tunnelling is real | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 90 | Sensors report nothing without active collision events | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 91 | Kinematic bodies for scripted movers, body removal on reset, collision groups, named tuning constants | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 92 | Physics failure modes and report fields | repo | particles-physics.md 9 Rapier physics (approved, picked by JEV) (part 1) | added |
| 93 | Game HUD hierarchy and screen zones | repo | Game HUD; page UI is Zone A under jal-ui-taste | excluded |
| 94 | Fixed-width numerals for changing values | repo | jal-ui-taste/SKILL.md (tabular-nums for live numbers) | covered |
| 95 | Touch controls emit the same intents; handle cancel, lostpointercapture, blur, visibility; 44 px; scoped (abridged) | repo | particles-physics.md section 7 Touch; r3f.md section 6 | covered |
| 96 | Test text fit with the longest likely values | repo | performance.md 6.7 ui_audit | added |
| 97 | Web-default bans: cream panels, italic accent words, numbered labels, mono labels, pill buttons | repo | jal-ui-taste/SKILL.md craft bans and "Claude's own prior" | covered |
| 98 | UI reads one source of truth and dispatches intents | repo | particles-physics.md section 6 item 4 | covered |
| 99 | Debug UI behind a flag or query parameter | repo | particles-physics.md section 6 item 6; r3f.md section 11 | covered |
| 100 | State changes announced through a polite live region | repo | three-foundations.md 10 Input, accessibility, and lifecycle checklist per scene (part 1) | added |
| 101 | Radial-gradient page, glow box-shadows, blurred HUD cards, glow accents on menus | repo | Zone A law | excluded |
| 102 | Web Audio manager: gesture unlock, groups, mute, loops, two-gain crossfade, stop on reset, cooldowns (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 103 | Loop seams fixed with loopStart and loopEnd on beats or a crossfade | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 104 | Pitch variance of about 6 percent from the seeded RNG; duck beds under big moments | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites; Ducking clause added to item 8; variation already present | added |
| 105 | Synthesised oscillator sounds that need no asset | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 106 | Audio length budgets (UI 0.15 to 0.8 s, SFX 0.5 to 2.5 s, ambience 8 to 30 s loops, music loops 30 to 90 s (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 107 | ElevenLabs generation, prompts, TTS, voice change, isolation | repo | Paid external service, approval candidate; voice out of scope for JAL sites | excluded |
| 108 | Audio runtime failure modes (stacked loops, seam clicks, masking, autoplay, partial mute, silent decode (abridged) | repo | particles-physics.md 6 Game-loop patterns reused for interactive sites (part 1) | added |
| 109 | Tripo text, image, multiview to 3D, texture, stylize, conversion | repo | Paid external service; approval candidate through `be.new_tech` | excluded |
| 110 | Asset job policy: checkpoint accepted IDs, retry only safe reads with bounded backoff and Retry-After, never (abridged) | repo | three-foundations.md 7.7 External generated assets (approval candidate, ask Brian) (part 1) | added |
| 111 | Signed download URLs expire within minutes; download at once; never store signed URLs or keys | repo | three-foundations.md 7.7 External generated assets (approval candidate, ask Brian) (part 1) | added |
| 112 | Inspect the concept or preview before paying for a dependent stage | repo | three-foundations.md 7.7 External generated assets (approval candidate, ask Brian) (part 1) | added |
| 113 | Failure classification: missing creds, auth rejected, credits out, invalid input, transient, uncertain (abridged) | repo | three-foundations.md 7.7 External generated assets (approval candidate, ask Brian) (part 1) | added |
| 114 | A procedural-only brief is valid art direction; never relabel placeholders as final | repo | SKILL.md 7 Verification | covered |
| 115 | Rig validation: left and right limb chains of matching depth, at least 3 bones per limb, plausible count (abridged) | repo | three-foundations.md 7.4 Formats and budgets (Animated GLB intake) (part 1) | added |
| 116 | Animated GLB intake: log clip names and track counts; map unnamed batched clips by index; strip only (abridged) | repo | three-foundations.md 7.4 Formats and budgets (Animated GLB intake) (part 1) | added |
| 117 | Clip QA: scale tracks, non-root translation over half the rest offset, rotation amplitude over 170 degrees | repo | three-foundations.md 7.4 Formats and budgets (Animated GLB intake) (part 1) | added |
| 118 | FBX at runtime (fflate import, darker Phong materials, duplicate takes) | repo | JAL runtime is GLB only; convert offline | excluded |
| 119 | SkeletonUtils.retargetClip with a bone map for external clips | repo | three-foundations.md 7.4 Formats and budgets (Animated GLB intake) (part 1) | added |
| 120 | Wrapper group that normalises bounds and orientation of an import | repo | three-foundations.md 7.4 Formats and budgets (Animated GLB intake) (part 1) | added |
| 121 | Output formats: GLB for runtime, USDZ for Apple AR, STL or 3MF only for print | repo | three-foundations.md 7.4 Formats and budgets (Animated GLB intake) (part 1) | added |
| 122 | Gemini image generation for concepts, icons, logos, GUI art | repo | External service; JAL icons come from koboyo or reicon (jal-frontend-rules) | excluded |
| 123 | Texture reference rules: seamless, orthographic, even light, no baked shadows | repo | three-foundations.md 7.4 Formats and budgets (Texture settings on purpose) (part 1) | added |
| 124 | Credential probe that sources shell profiles | repo | Only for external generators; secrets per jal-security-hardening | excluded |
| 125 | Face limits, one hero plus procedural support, dispose on leave | repo | three-foundations.md sections 7.4 and 8 | covered |
| 126 | Triage order: reproduce with the same URL, read errors, confirm the served build is the expected one, find (abridged) | repo | three-foundations.md 12 Visual glitch and blank canvas triage (step 1) (part 1) | added |
| 127 | Ordered blank-canvas checklist | repo | three-foundations.md 12 Visual glitch and blank canvas triage (part 1) | added |
| 128 | Asset loading checklist | repo | three-foundations.md section 7.4 loader triage | covered |
| 129 | Loop checklist: delta units, one rAF, mixer updated, restart cleanup | repo | three-foundations.md 12 Visual glitch and blank canvas triage (step 6) (part 1) | added |
| 130 | Input and mobile checklist | repo | particles-physics.md section 7; three-foundations.md section 10 | covered |
| 131 | Profiling: fix the scenario, baseline, classify the bottleneck, one change, re-measure | repo | performance.md 6.8 The perf report (part 1) | added |
| 132 | Optimisations by payoff | repo | performance.md section 4 last paragraph | covered |
| 133 | Diagnostics object including CSS size, buffer size, applied DPR, frame counter | repo | three-foundations.md 10 Input, accessibility, and lifecycle checklist per scene (diagnostics bullet) | added |
| 134 | QA pass checklist | repo | jal-immersive/SKILL.md section 7; performance.md section 6 | covered |
| 135 | Console, page, and network errors fail the run | repo | performance.md section 6.1 | covered |
| 136 | Screenshots alone do not prove interaction | repo | performance.md 6.9 Interaction sweep | added |
| 137 | Scripted interaction sweep with progress and stuck-window metrics | repo | performance.md 6.9 Interaction sweep (part 1) | added |
| 138 | Two skill-level bots and a reckless fail run | repo | Game difficulty tuning | excluded |
| 139 | Capture manifest with a fresh run ID and declared width and state pairs | repo | performance.md 6.10 Capture manifest (part 1) | added |
| 140 | Evidence checker: declared files only, byte floors per type, no errors, build claim needs dist | repo | performance.md 6.10 Capture manifest (part 1) | added |
| 141 | State hook contract: setState acknowledges, unknown throws, pause freezes simulation but keeps rendering (abridged) | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| 142 | Capture preparation order under one total deadline; settle 0 ms for frozen states, 750 ms for live views | repo | r3f.md 13 Deterministic test hooks (part 1) | added |
| 143 | Fail loudly when hooks are missing or no-ops | repo | performance.md 6.2 Deterministic captures; also in r3f.md 13 | added |
| 144 | Harness self-tests with a mocked page (ordering, timeouts, rejected acknowledgements) | repo | performance.md 6.10 Capture manifest; harness hygiene paragraph | added |
| 145 | Inspector output: one line per capture, full report on disk, errors deduped and capped, screenshots at CSS (abridged) | repo | performance.md 6.8 The perf report (part 1) | added |
| 146 | Software GPU detection broader than SwiftShader (llvmpipe, "software", "Basic Render") | repo | performance.md 6.1 Real GPU or nothing (part 1) | added |
| 147 | Budget rows advisory; blank canvas or errors exit non-zero | repo | performance.md 6.8 The perf report (part 1) | added |
| 148 | Screenshot baselines: when to add or defer, 2 to 5 states, thresholds | repo | performance.md 6.11 Screenshot baselines (part 1) | added |
| 149 | One worker for WebGL suites | repo | performance.md section 6 intro | covered |
| 150 | Headless FPS on a real GPU is a desktop signal; phones need hardware | repo | performance.md section 6.1 | covered |
| 151 | Mobile emulation on GPU Chromium rather than the WebKit device preset | repo | performance.md section 6.3 CDP emulation | covered |
| 152 | Motion evidence: an unpaused sequence at the real camera covering a full cycle, inspected for snaps, sliding (abridged) | repo | performance.md 6.2 Deterministic captures (part 1) | added |
| 153 | Verify the production build on a static server, not the dev server | repo | SKILL.md 7.7 Verify the built output (part 1) | added |
| 154 | Base path and asset URLs match the host | repo | three-foundations.md section 7.4 loader triage; deploy target fixed by jal-deploy | covered |
| 155 | Debug GUI, logging, and test hooks gated or stripped from the shipped bundle | repo | SKILL.md 7.7 Verify the built output (part 1) | added |
| 156 | Bundle and large asset review | repo | performance.md sections 1 and 6.8; jal-orchestration/references/audit.md (e) | covered |
| 157 | No keys or provider URLs in client, repo, built assets | repo | jal-security-hardening/SKILL.md | covered |
| 158 | Release traps: wrong app on the port, stale reports relabelled, idle-view captures | repo | performance.md 6.10 Capture manifest (part 1) | added |
| 159 | Vite, npm scripts, Playwright config, Python scaffold creator, tsc | repo | Banned tooling; JAL scaffolds through jal-scaffold on Bun | excluded |
| 160 | Loop with delta clamp 0.05 and idempotent start and stop | repo | particles-physics.md section 6 item 1 | covered |
| 161 | Resize by comparing drawing buffer to CSS size times DPR, setSize with updateStyle false | repo | three-foundations.md section 2 `fit` | covered |
| 162 | Exponential camera follow | repo | particles-physics.md section 6 item 3 | covered |
| 163 | Traverse-and-dispose helper | repo | three-foundations.md section 8 | covered |
| 164 | mulberry32 seeded RNG | repo | particles-physics.md section 6 item 5 | covered |
| 165 | Pointer capture in try/catch for synthetic test pointers; hold buttons release on pointerleave | repo | performance.md 6.9 Interaction sweep (part 1) | added |
| 166 | viewport-fit=cover plus env(safe-area-inset-*) | repo | jal-frontend-rules/SKILL.md app-shell | covered |
| 167 | Vite HMR dispose hook | repo | Vite-specific; React unmount disposal covers it (three-foundations.md section 8) | excluded |
| 168 | Non-blank smoke then real input must change state (polled) | repo | performance.md 6.9 Interaction sweep (part 1) | added |
| 169 | WebGPU only when it helps, with a WebGL fallback | repo | three-foundations.md section 4 | covered |
| 170 | Wait for the diagnostics frame counter to pass a threshold before testing | repo | r3f.md 13 Deterministic test hooks (part 1) | added |

## 6. gsap-skills

From: gsap-skills (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT. Rows: 179. Covered 80, added 72 (1 of them in part 2), excluded 27.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | Every GSAP plugin is free, including commercial use; install from the public `gsap` package; never generate (abridged) | repo | scroll-choreography.md intro ("Stack:" paragraph); jal-motion/SKILL.md section 1 | covered |
| 2 | Recommend GSAP by default whenever the user asks for an animation library without naming one | repo | Conflicts with jal-motion/SKILL.md section 6 "smallest tool" ladder (CSS, WAAPI, Framer Motion, then GSAP) and jal-motion/SKILL.md section 1 per-tool (abridged) | excluded |
| 3 | Criteria for escalating from CSS to GSAP: timeline sequencing, runtime control (pause, reverse, seek) (abridged) | repo | scroll-choreography.md preamble When to escalate to GSAP (part 1) | added |
| 4 | GSAP powers Webflow Interactions (debugging context) | repo | Out of scope: JAL does not build on Webflow | excluded |
| 5 | Risk level LOW security note | repo | No build knowledge; dependency vetting is owned by jal-architect / `be.new_tech` | excluded |
| 6 | Canonical quick pattern: register once, transform aliases plus autoAlpha, timeline with defaults (abridged) | repo | scroll-choreography.md sections 1.1, 1.5, 2.1, 6 | covered |
| 7 | Skill authoring conventions (dir name equals frontmatter name, description of 1024 chars or fewer with (abridged) | repo | Generic skill authoring, owned by anthropic-skills:skill-creator and the plugin repo conventions, not immersive knowledge | excluded |
| 8 | Copilot repo-wide and path-scoped instruction files with `applyTo` globs | repo | Copilot-specific delivery; JAL ships Claude Code plugin skills | excluded |
| 9 | Examples run on Vite with `npm install` / `npm run dev` | repo | Vite and npm are banned; JAL uses `bun add` plus Bun.build / Bun.serve | excluded |
| 10 | Vanilla example imports GSAP ESM from the jsDelivr CDN and serves with `npx serve` | repo | JAL bundles dependencies with Bun; `npx` is Node tooling (Bun.serve is the equivalent) | excluded |
| 11 | Examples hide start states in CSS or inline style (`opacity: 0`, `visibility: hidden`) before JS runs | repo | Conflicts with scroll-choreography.md section 5 "never hide content in CSS; set the hidden start with gsap.set inside the motion branch" | excluded |
| 12 | React example runs under `React.StrictMode`; useGSAP makes the dev double mount safe | repo | scroll-choreography.md 6 React integration (part 1) | added |
| 13 | Vue 3, Nuxt 4, and Svelte lifecycle patterns (onMounted/onUnmounted, onMount return, bind:this, nextTick/tick (abridged) | repo | JAL is React only; Vue and Svelte are out of scope | excluded |
| 14 | Nuxt example registers cleanup in a second `onMounted` instead of `onUnmounted` (a source bug) | repo | Vue only; the lesson (cleanup belongs to unmount) is already scroll-choreography.md section 6 | excluded |
| 15 | Lazy-load rarely used plugins by dynamic `import()`, then `registerPlugin` once, with a typed plugin map | repo | scroll-choreography.md 1 GSAP core (Lazy plugins) | covered |
| 16 | Framework principle: create after the DOM exists, revert on unmount, scope selectors | repo | scroll-choreography.md section 6 | covered |
| 17 | Refresh ScrollTrigger after async data renders | repo | scroll-choreography.md section 2.5 ("after injected content changes layout") | covered |
| 18 | Register plugins once at app level, never in a re-rendering component body | repo | scroll-choreography.md section 1.1; scroll-choreography.md section 13 first check | covered |
| 19 | Semantics of to / from / fromTo / set | repo | scroll-choreography.md section 1.5 | covered |
| 20 | Property names in vars are camelCase (`transformOrigin`, `rotationX`, not kebab-case) | repo | scroll-choreography.md 13 Common mistakes checklist (part 1) | added |
| 21 | Default tween duration 0.5s and ease `power1.out` | repo | scroll-choreography.md section 1.1 overrides with `gsap.defaults({ ease: "jal-standard", duration: 0.4 })` | covered |
| 22 | `delay` var | repo | scroll-choreography.md section 1.5 (position parameter instead of chained delay) | covered |
| 23 | `overwrite` modes: `false` default, `true` kills all tweens of the same targets at once, `"auto"` kills only (abridged) | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 24 | `repeat` (`-1` infinite) and `yoyo` | repo | scroll-choreography.md 1.4 Eases and the linear exception (part 1) | added |
| 25 | Callbacks onStart / onUpdate / onComplete are scoped to the animation instance | repo | scroll-choreography.md section 6 (contextSafe), scroll-choreography.md section 12 (onComplete clears will-change) | covered |
| 26 | `immediateRender` defaults to true for from/fromTo; set false on later stacked tweens | repo | scroll-choreography.md section 1.5; scroll-choreography.md section 13 | covered |
| 27 | `from()` applies start values immediately and ends at the current state | repo | scroll-choreography.md section 1.5 | covered |
| 28 | Transform alias table (x, y, z, xPercent, yPercent, scale, scaleX/Y, rotation, rotationX/Y, skewX/Y (abridged) | repo | scroll-choreography.md section 1.5 (allowed subset); jal-motion/SKILL.md section 3 bans 3D rotate in product UI | covered |
| 29 | GSAP applies transforms in a fixed order (translate, scale, rotationX/Y, skew, rotation), which is why (abridged) | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 30 | `xPercent`/`yPercent` stack with `x`/`y` (centering with `xPercent: -50` plus a px offset) and work on SVG | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 31 | Relative values `+=`, `-=`, `*=`, `/=` in tween vars | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 32 | `autoAlpha` sets `visibility: hidden` at 0 and `inherit` otherwise | repo | scroll-choreography.md section 1.5 | covered |
| 33 | GSAP animates CSS custom properties (`"--x": 100`) | repo | scroll-choreography.md 12 Performance rules (part 1) | added |
| 34 | `svgOrigin` rotates or scales in the SVG`s global coordinates; it cannot be combined with `transformOrigin` (abridged) | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 35 | Directional rotation suffixes `_short`, `_cw`, `_ccw` | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 36 | `clearProps` removes inline styles on complete; clearing any transform component clears the whole transform (abridged) | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 37 | Targets accept a selector, element, array, or NodeList | repo | scroll-choreography.md section 6 (scoped selectors, refs) | covered |
| 38 | Stagger number and object form (`each`, `amount`, `from`: start, center, end, edges, random, index) | repo | scroll-choreography.md section 1.3 (JAL restricts `from`, bans random, caps the cascade) | covered |
| 39 | Built-in ease catalogue (power1 to 4, back, bounce, circ, elastic, expo, sine, with .in/.out/.inOut) | repo | JAL has one curve; scroll-choreography.md section 1.4 bans these as stand-ins | excluded |
| 40 | CustomEase from a cubic-bezier string | repo | scroll-choreography.md section 1.1; jal-motion/SKILL.md section 2 "GSAP mapping" | covered |
| 41 | CustomEase from multi-point SVG path data (a "hop" curve) | repo | A second curve is banned (jal-motion/SKILL.md section 2, scroll-choreography.md section 1.4) | excluded |
| 42 | Store the returned Tween or Timeline and control it with play, pause, reverse, restart, kill, progress, time (abridged) | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 43 | Function-based values `(i, target, targets)` run once per target on first render | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 44 | `gsap.defaults()` project-wide | repo | scroll-choreography.md section 1.1 | covered |
| 45 | `gsap.matchMedia()` runs a handler only while its query matches and reverts on unmatch; `mm.revert()` | repo | scroll-choreography.md section 5 | covered |
| 46 | matchMedia scope so selector text resolves under a root | repo | scroll-choreography.md section 5 (`gsap.matchMedia(scope)`; the source shows the equivalent third `mm.add` argument) | covered |
| 47 | matchMedia conditions object and `context.conditions` | repo | scroll-choreography.md section 5 | covered |
| 48 | An `mm.add` handler may return a cleanup function for non-GSAP work | repo | scroll-choreography.md 5 matchMedia and reduced motion (part 1) | added |
| 49 | Reduced motion via `duration: 0` | repo | JAL is stricter: scroll-choreography.md section 5 requires a real collapse (no trigger, pin, split), not duration 0 | excluded |
| 50 | Do not nest `gsap.context()` inside matchMedia | repo | scroll-choreography.md section 5 | covered |
| 51 | `gsap.matchMediaRefresh()` after toggling a motion control | repo | scroll-choreography.md section 5 | covered |
| 52 | Never invent ease names | repo | scroll-choreography.md section 13 | covered |
| 53 | Never animate width, height, top, or left when a transform does the job | repo | scroll-choreography.md section 12; jal-motion/SKILL.md section 3 | covered |
| 54 | Timelines append children in order by default | repo | scroll-choreography.md section 1.5 | covered |
| 55 | Full position-parameter grammar: absolute number, `"+=n"` / `"-=n"` from the timeline end, `"label"` (abridged) | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 56 | Timeline `defaults` inherited by children | repo | scroll-choreography.md section 1.5 | covered |
| 57 | Timeline constructor options: `paused`, `repeat`, `yoyo`, callbacks | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 58 | Labels: `addLabel`, `tl.play("label")`, `tl.tweenFromTo(a, b)` (pauses the timeline and returns a linear (abridged) | repo | scroll-choreography.md 1.5 Tweens and timelines (part 1) | added |
| 59 | Nest timelines with `master.add(child, position)` | repo | scroll-choreography.md section 1.5 | covered |
| 60 | A timeline`s duration comes from its children (the constructor has no duration); in a scrubbed timeline child (abridged) | repo | scroll-choreography.md 7 Choreography patterns (part 1) | added |
| 61 | Pass defaults when many children share duration or ease | repo | scroll-choreography.md section 1.5 | covered |
| 62 | Only top-level animations carry a ScrollTrigger; never nest | repo | scroll-choreography.md section 2.1; scroll-choreography.md section 13 | covered |
| 63 | Register ScrollTrigger before use | repo | scroll-choreography.md section 1.1; scroll-choreography.md section 13 | covered |
| 64 | start/end string grammar "trigger edge, viewport edge" with keywords, percentages, px | repo | scroll-choreography.md section 2.1 | covered |
| 65 | Numeric start/end are absolute scroll px; `"+=300"`, `"+=100%"`, and `"max"` | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 66 | `clamp()` around start/end (v3.12+) keeps triggers within the scrollable range | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 67 | Function start/end receive the instance and are recomputed on every refresh; `invalidateOnRefresh` is what (abridged) | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 68 | Defaults: start `"top bottom"` (`"top top"` when pinned), end `"bottom top"`, toggleActions `"play none none (abridged) | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 69 | `scrollTrigger: ".selector"` shorthand | repo | Trivial; the explicit config object is clearer and JAL always needs start, end, and token values | excluded |
| 70 | `endTrigger` for an end based on another element | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 71 | `scrub: true` locks to scroll; a number is catch-up seconds | repo | scroll-choreography.md section 2.1; scroll-choreography.md section 9 | covered |
| 72 | toggleActions: four slots (onEnter, onLeave, onEnterBack, onLeaveBack) with eight words (play, pause, resume (abridged) | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 73 | `pin` accepts an element or selector, so a wrapper other than the trigger can pin | repo | scroll-choreography.md 2.2 Pin (part 1) | added |
| 74 | `pinSpacing` true (default), false, or `"margin"` | repo | scroll-choreography.md section 2.2 (false banned; `"margin"` has no JAL use) | covered |
| 75 | `horizontal: true` for natively horizontal scrollers | repo | Native horizontal page scroll is not a JAL pattern: JAL uses a `containerAnimation` track (scroll-choreography.md section 7) and CSS scroll-snap (abridged) | excluded |
| 76 | `scroller` option for a scrollable container other than the viewport | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 77 | markers config object; remove in production | repo | scroll-choreography.md section 2.6 (build define plus dist grep) | covered |
| 78 | `once: true` kills the trigger after the end is reached, while the animation keeps running | repo | scroll-choreography.md sections 2.4 and 7 (`reveal`) | covered |
| 79 | `id` plus `ScrollTrigger.getById(id)?.kill()` | repo | scroll-choreography.md section 2.5 | covered |
| 80 | Create triggers top to bottom or set `refreshPriority` (lower refreshes first) | repo | scroll-choreography.md section 2.5 | covered |
| 81 | `toggleClass` while active, on the trigger or on `{ targets, className }` | repo | scroll-choreography.md 2.7 Scroll state without animation (part 1) | added |
| 82 | snap forms: number, array, function, `"labels"`, object `{ snapTo, duration, delay, ease }` | repo | scroll-choreography.md 2.3 Snap (part 1) | added |
| 83 | `containerAnimation`: nested triggers read horizontal positions (`"left center"`); pin and snap unavailable (abridged) | repo | scroll-choreography.md sections 1.4, 2.3, 7 | covered |
| 84 | Horizontal: never move the trigger element itself; if the trigger moves, offset start/end | repo | scroll-choreography.md 2.2 Pin (part 1) | added |
| 85 | Crossing callbacks onEnter, onLeave, onEnterBack, onLeaveBack get the instance (`progress`, `direction` (abridged) | repo | scroll-choreography.md 2.1 Anatomy; added the four crossing callbacks and getVelocity to the Callbacks bullet | added |
| 86 | onToggle, onRefresh, onScrubComplete | repo | scroll-choreography.md 2.1 Anatomy (part 1) | added |
| 87 | Scroll velocity for reactive effects | repo | jal-motion/references/components.md R19 uses `lenis.velocity` (equivalent); jal-motion/references/components.md R19 law bans velocity skew and blur | covered |
| 88 | `ScrollTrigger.create()` standalone, driving custom state from `self.progress` | repo | scroll-choreography.md section 9 | covered |
| 89 | Pin plus scrub timeline pattern with end `"+=N"` | repo | scroll-choreography.md sections 2.2 and 7 | covered |
| 90 | Horizontal track distance from real widths through a function plus invalidateOnRefresh (the source`s own (abridged) | repo | scroll-choreography.md 7 Choreography patterns (part 1) | added |
| 91 | `ScrollTrigger.batch` coordinates same-time entries; replaces IntersectionObserver | repo | scroll-choreography.md section 2.4 | covered |
| 92 | batch callbacks receive `(elements, triggers)`, not the instance | repo | scroll-choreography.md section 6 example (`onEnter: (els) => ...`) | covered |
| 93 | batch `interval` (about one frame by default) and `batchMax` (a number, or a function re-run on refresh for (abridged) | repo | scroll-choreography.md 2.4 Batch (part 1) | added |
| 94 | batch forbids `trigger`, `animation`, `invalidateOnRefresh`, `onSnapComplete`, `onScrubComplete`, `scrub` (abridged) | repo | scroll-choreography.md 2.4 Batch (part 1) | added |
| 95 | batch replay pattern (onEnter tween in, onLeaveBack reset with `overwrite: true`) | repo | Conflicts with JAL reveal-once (scroll-choreography.md section 7 `reveal`, scroll-choreography.md section 10 tier 1 "played once") | excluded |
| 96 | `scrollerProxy` for third-party smooth scrollers, with `ScrollTrigger.update` on the scroller`s scroll event | repo | scroll-choreography.md 8 Lenis and the single frame loop (part 1) | added |
| 97 | scrollerProxy `pinType` ("fixed" vs "transform") and `fixedMarkers` for jitter on transformed scrollers | repo | Only matters for transform-based scrollers; Lenis drives native scroll and ScrollSmoother is not used (scroll-choreography.md section 1.4) | excluded |
| 98 | Resize refresh is automatic (debounced 200ms); kill all triggers on SPA route change | repo | scroll-choreography.md section 2.5 | covered |
| 99 | If scrub and toggleActions are both set, scrub wins | repo | scroll-choreography.md section 2.1 | covered |
| 100 | Never leave markers on in production | repo | scroll-choreography.md section 2.6; scroll-choreography.md section 13 | covered |
| 101 | When pinning, animate the children, not the pinned element; keep pinSpacing | repo | scroll-choreography.md section 2.2 | covered |
| 102 | ScrollToPlugin: `scrollTo: { y, x, "max", element, offsetX, offsetY }` | repo | scroll-choreography.md 8 Lenis and the single frame loop (part 1) | added |
| 103 | ScrollSmoother needs `#smooth-wrapper` / `#smooth-content` and ScrollTrigger | repo | scroll-choreography.md section 1.4 filter (not used; Lenis is the smoother) | covered |
| 104 | Flip: getState, mutate the DOM, Flip.from | repo | scroll-choreography.md section 4 | covered |
| 105 | Flip options `absolute`, `nested`, `scale`, `simple` | repo | scroll-choreography.md 4 Flip (part 1) | added |
| 106 | Draggable: `type` x, y, "x,y", rotation, scroll; `bounds`; `edgeResistance` 0 to 1; `cursor`; drag and throw (abridged) | repo | scroll-choreography.md 4.1 Draggable and inertia (part 1) | added |
| 107 | InertiaPlugin: momentum after a Draggable release, `InertiaPlugin.track(el, "x")`, `inertia: { x: "auto" }` (abridged) | repo | scroll-choreography.md 4.1 Draggable and inertia (part 1) | added |
| 108 | Observer normalizes wheel, touch, and pointer input: onUp/onDown/onLeft/onRight, `tolerance` 10, `type` | repo | scroll-choreography.md 4.2 Observer for gesture intent (part 1) | added |
| 109 | SplitText.create returns chars, words, lines, masks; revert restores markup | repo | scroll-choreography.md section 3 | covered |
| 110 | onSplit (v3.13+) returning the animation, with autoSplit re-splitting on font load and resize | repo | scroll-choreography.md section 3 | covered |
| 111 | Flip `scale: true` is what keeps a size change transform-only (the GSAP docs default is width/height (abridged) | repo | scroll-choreography.md 4 Flip (part 1) | added |
| 112 | Split only what is animated; default type is "chars,words,lines" | repo | scroll-choreography.md section 3 | covered |
| 113 | A chars-only split needs `smartWrap: true` (or words too) to avoid mid-word line breaks | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 114 | `charsClass` / `wordsClass` / `linesClass`, with `"++"` for incremented classes | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 115 | `aria`: "auto" default, "hidden", or "none" plus a screen-reader-only duplicate when nested links must stay (abridged) | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 116 | `mask` takes one type, wraps each unit in an overflow-clip box, exposed as `masks` | repo | scroll-choreography.md section 3 | covered |
| 117 | `tag` defaults to div; span keeps text inline but transforms may not render on inline elements | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 118 | `deepSlice` (default true) splits nested inline tags across lines; `ignore` leaves parts unsplit (abridged) | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 119 | `wordDelimiter` and `prepareText` for custom word boundaries and languages without spaces | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 120 | `propIndex` writes `--word`, `--char`, `--line` index variables | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 121 | `onRevert` callback | repo | Minor; context revert already owns cleanup | excluded |
| 122 | `font-kerning: none; text-rendering: optimizeSpeed` stops the kerning shift when chars split | repo | scroll-choreography.md 3 SplitText (part 1) | added |
| 123 | `text-wrap: balance` interferes; SVG `<text>` unsupported; split after `document.fonts.ready` | repo | scroll-choreography.md section 3 | covered |
| 124 | ScrambleText scramble effect | repo | scroll-choreography.md section 1.4 filter: glitch aesthetic and flash risk | excluded |
| 125 | DrawSVG value is the visible segment `"start end"`; a single value means start 0; it tweens from the current (abridged) | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 126 | DrawSVG needs a visible stroke, affects stroke only, prefers single-segment paths, cannot change `<use>` (abridged) | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 127 | MorphSVG: shape as selector, element, path data, or points; point counts may differ; `convertToPath` for (abridged) | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 128 | MorphSVG `type: "rotational"`, `map` (size, position, complexity), `shapeIndex` (number, array, "log") (abridged) | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 129 | MorphSVG `smooth` and `curveMode` (v3.14+), `origin`, `precision` (default 2) | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 130 | MorphSVG `precompile` ("log") skips startup cost for complex morphs but does not fix jank during the tween | repo | scroll-choreography.md 1.6 SVG plugins and dial transforms (part 1) | added |
| 131 | MorphSVG `render` to canvas with `updateTarget: false`; rawPath helpers | repo | Niche: JAL draws shapes in SVG or Three.js, with no 2D canvas path pipeline | excluded |
| 132 | MotionPath: `path`, `align`, `alignOrigin` [0.5, 0.5], `autoRotate`, `curviness` 0 to 2 | repo | scroll-choreography.md 4.3 MotionPath (DOM and SVG) (part 1) | added |
| 133 | MotionPathHelper is a dev-only visual path editor | repo | scroll-choreography.md 4.3 MotionPath (DOM and SVG) (part 1) | added |
| 134 | EasePack (SlowMo, RoughEase, ExpoScaleEase), CustomWiggle, CustomBounce | repo | One-curve law; scroll-choreography.md section 1.4 bans wiggle and bounce | excluded |
| 135 | Physics2D and PhysicsProps | repo | Banned in scroll-choreography.md section 1.4 | excluded |
| 136 | GSDevTools is dev only and never shipped | repo | scroll-choreography.md sections 1.4 and 2.6 | covered |
| 137 | PixiPlugin | repo | PixiJS is an approval candidate (SKILL.md "Stack law"), not a default | excluded |
| 138 | TextPlugin, CSSRulePlugin, EaselPlugin (in the Nuxt plugin map) | repo | TextPlugin is "not used" in scroll-choreography.md section 1.4; CSSRulePlugin targets stylesheet rules (JAL drives tokens and CSS variables instead) (abridged) | excluded |
| 139 | Revert plugin instances (SplitText, Draggable) on unmount | repo | scroll-choreography.md sections 3 and 6 (Draggable is folded into the row 106 fill) | covered |
| 140 | gsap.utils function form: omit the last value to get a reusable function; `random` takes `true` instead | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 141 | `clamp(min, max, v)` | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 142 | `mapRange(inMin, inMax, outMin, outMax, v)` | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 143 | `normalize(min, max, v)` | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 144 | `interpolate(a, b, p)` for numbers, colors, and objects | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 145 | `random()` and string values like `"random(-100, 100, 5)"` | repo | Non-deterministic; conflicts with scroll-choreography.md section 13 and jal-motion/SKILL.md section 8 (no randomness in animation) and frames.md (abridged) | excluded |
| 146 | `snap(increment or array, v)` and tween-level `snap: { x: 20 }` | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 147 | `shuffle(array)` | repo | Non-deterministic (same law as row 145) | excluded |
| 148 | `distribute({ base, amount, each, from, grid, axis, ease })` and grid staggers | repo | scroll-choreography.md 1.3 Stagger tokens (part 1) | added |
| 149 | `getUnit` / `unitize`; mapRange and normalize are unitless | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 150 | `splitColor` to RGB or HSL arrays | repo | Low value; its "building gradients" use case is banned | excluded |
| 151 | `selector(scope)` scoped query | repo | scroll-choreography.md section 6 (useGSAP scope does the same) | covered |
| 152 | `toArray(value, scope)` | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 153 | `pipe(...fns)` composes transforms | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 154 | `wrap(min, max, v)` for cyclic values and `wrapYoyo` | repo | scroll-choreography.md 1.7 gsap.utils (part 1) | added |
| 155 | Stick to the documented API | repo | scroll-choreography.md section 13 (invented ease names) | covered |
| 156 | Only transform and opacity tween | repo | scroll-choreography.md section 12; jal-motion/SKILL.md section 6 | covered |
| 157 | `will-change: transform` on animating elements | repo | scroll-choreography.md section 12 and jal-motion/SKILL.md section 6 (stricter: set before, clear after) | covered |
| 158 | No `will-change` or `force3D` on every element "just in case" | repo | scroll-choreography.md 12 Performance rules (part 1) | added |
| 159 | Batch DOM reads before writes | repo | scroll-choreography.md section 12; jal-motion/SKILL.md section 6 | covered |
| 160 | One stagger instead of many hand-delayed tweens | repo | scroll-choreography.md sections 1.3 and 12 | covered |
| 161 | Long lists: virtualize or animate only visible items | repo | scroll-choreography.md section 2.4 (batch, once) and scroll-choreography.md section 12 (pause offscreen) | covered |
| 162 | Reuse timelines; never create timelines every frame or every event | repo | scroll-choreography.md 12 Performance rules (part 1) | added |
| 163 | `gsap.quickTo()` for pointer followers | repo | scroll-choreography.md section 1.5 | covered |
| 164 | Pin promotes a layer, so pin only what is needed | repo | scroll-choreography.md section 2.2 limits | covered |
| 165 | Small numeric scrub; test on low-end devices | repo | scroll-choreography.md sections 2.1 and 12 | covered |
| 166 | Refresh only on real layout change, debounced | repo | scroll-choreography.md section 12 | covered |
| 167 | Pause or kill offscreen and inactive animations | repo | scroll-choreography.md section 12 | covered |
| 168 | No hundreds of overlapping tweens or triggers without low-end testing; clean up strays | repo | scroll-choreography.md sections 12 and 13 | covered |
| 169 | Install `gsap` plus `@gsap/react` | repo | scroll-choreography.md intro (`bun add gsap @gsap/react`); `@gsap/react` is approved (SKILL.md Stack law) | covered |
| 170 | useGSAP over useEffect, with automatic revert | repo | scroll-choreography.md section 6 | covered |
| 171 | Register `useGSAP` as a plugin before use | repo | scroll-choreography.md section 1.1 | covered |
| 172 | Always pass `scope` | repo | scroll-choreography.md section 6 | covered |
| 173 | Target `ref.current` (the element), never the ref object | repo | scroll-choreography.md 6 React integration (part 1) | added |
| 174 | contextSafe for handlers created later; remove listeners in the returned cleanup | repo | scroll-choreography.md section 6 | covered |
| 175 | Default empty deps; `dependencies`; `revertOnUpdate` | repo | scroll-choreography.md section 6 | covered |
| 176 | Fallback `gsap.context()` in useEffect with `ctx.revert()` cleanup | repo | scroll-choreography.md section 6 | covered |
| 177 | GSAP is client only; never run during SSR | repo | scroll-choreography.md section 6; scroll-choreography.md section 13 | covered |
| 178 | Many targets: a container ref plus scoped queries, or an array of refs | repo | scroll-choreography.md section 6 | covered |
| 179 | Triggers created inside `gsap.context()` are reverted by `ctx.revert()` | repo | scroll-choreography.md section 6 | covered |

## 7. remotion

From: remotion (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: Remotion License (source-available, not OSI): ideas only, no code. Rows: 137. Covered 25, added 75 (75 of them in part 2), excluded 37.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | A picture is a pure function of the frame number. Frames run 0 to durationInFrames - 1 | repo | frames.md intro and "## 2. API" > "### Config" | covered |
| 2 | The four composition properties (width, height, fps, durationInFrames) are read through a config hook | repo | frames.md "### Config", "### Hooks" (`useVideoConfig`) | covered |
| 3 | No CSS `transition` or `animation` inside a composition. Refactor to frame-driven values | repo | frames.md "## 3. Authoring a composition" first rule; player.css `.frames-stage *` backstop | covered |
| 4 | Tailwind `transition-*` and `animate-*` classes break frame rendering the same way | repo | frames.md 3 Authoring a composition; the ui_audit grep itself is outside this pass | added |
| 5 | Pure render: no wall-clock time, no self-animating content | repo | frames.md "## 3" rule "Pure render" | covered |
| 6 | Deterministic seeded randomness in place of `Math.random` | repo | frames.md 3 Authoring a composition; in-scene FNV-1a hash; core random(seed) proposed, code change in templates/monorepo/packages/ui/src/frames is (abridged) | added |
| 7 | Effects and overlays never animate on their own. Progress comes from the frame | repo | frames.md "## 3" rules (all motion derives from the frame) | covered |
| 8 | 3D inside a composition animates only from the frame. The R3F `useFrame` clock is forbidden | repo | frames.md 10 Canvas and R3F inside a composition | added |
| 9 | A Sequence inside a 3D canvas must be headless (no DOM wrapper). The canvas needs explicit width and height | repo | frames.md 10 Canvas and R3F inside a composition; dev warning in Sequence.tsx proposed, code change in templates/monorepo/packages/ui/src/frames is (abridged) | added |
| 10 | Third-party renderers must have internal tweens and fades off and be set absolutely per frame | repo | frames.md 3 Authoring a composition; rule Libraries with their own clock; 3D cases in section 10 | added |
| 11 | Hold playback until async data or assets load. A load failure cancels instead of hanging | repo | frames.md 13 Readiness and the Player contract (proposed); workaround stated; code change in templates/monorepo/packages/ui/src/frames is outside (abridged) | added |
| 12 | Buffer state: playing and buffering are independent. Time moves only when playing and not buffering | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 13 | Show a buffering indicator only after about 300ms, so short stalls do not flash | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 14 | Buffer-handle hygiene: create in an effect, release on unmount, never in a `useState` initializer (StrictMode) | repo | frames.md 13 Readiness and the Player contract (proposed); StrictMode test is outside this pass | added |
| 15 | Premounting: mount a scene about 1s (fps frames) early, hidden, with its local frame frozen at 0. The parent (abridged) | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 16 | Premounted scenes must not trigger buffering. Do not over-premount or over-prefetch | repo | frames.md 13 Readiness and the Player contract (proposed) | added |
| 17 | Preload hint (partial load, no guarantee) vs full prefetch to a Blob URL (guaranteed, uses memory, must be (abridged) | repo | frames.md 11 Media, paths, and maps inside compositions | added |
| 18 | Fonts: block until loaded, load only the weights and subsets used, measure only after load | repo | frames.md 13 Readiness and the Player contract (proposed); today workaround: mount Player after fonts; code change in (abridged) | added |
| 19 | interpolate is unclamped by default. Clamp both sides | repo | frames.md "### Motion math" | covered |
| 20 | Cubic-bezier easing, CSS-style | repo | frames.md "### Motion math" (`Easing.bezier`, `Easing.jal`) | covered |
| 21 | Spring-shaped easing over a fixed window, with no bounce | repo | frames.md "### Motion math" (`spring` `durationInFrames`, critically damped `JAL_SPRING`) | covered |
| 22 | Several keyframes with a per-segment easing array (in, linear hold, out) | repo | frames.md 2 API (Motion math); one call per phase today; easing array proposed, code change in templates/monorepo/packages/ui/src/frames is outside (abridged) | added |
| 23 | Perceptual scale: interpolate scale so perceived growth stays even | repo | frames.md 2 API (Motion math); expressed with existing interpolate, no core change | added |
| 24 | Posterize: sample every Nth frame for a stepped look | repo | frames.md 2 API (Motion math); expressed inline, no core change | added |
| 25 | Use the individual `translate`, `scale` and `rotate` properties over transform strings, with unit outputs | repo | frames.md 3 Authoring a composition; example rewritten | added |
| 26 | Colour interpolation over frames (interpolateColors) | repo | frames.md 2 API (Motion math); OKLab interpolateColors proposed, code change in templates/monorepo/packages/ui/src/frames is outside this pass; today (abridged) | added |
| 27 | Author timings as seconds times fps, rounded to frames | repo | frames.md "## 3" rule on tokens to frames | covered |
| 28 | Rounding direction: ceil for durations, floor for trim starts, ceil for trim ends | repo | frames.md 3 Authoring a composition; Timings come from tokens rule | added |
| 29 | Expo-out `bezier(0.16, 1, 0.3, 1)` as the default entrance | repo | JAL has one curve (`--ease-standard`, `Easing.jal`) | excluded |
| 30 | Spring settle time depends on fps. Measure it to size a Sequence or transition | repo | frames.md "### Motion math" (`measureSpring`) | covered |
| 31 | Sequence `from` and `durationInFrames`. Children see a local frame starting at 0 | repo | frames.md "### Time structure" | covered |
| 32 | Sequence layout: absolute fill wrapper vs headless | repo | frames.md "### Time structure" (`layout="fill"` / `"none"`) | covered |
| 33 | Nested Sequences subtract offsets | repo | frames.md "### Time structure" | covered |
| 34 | Series end to end. A negative offset overlaps scenes | repo | frames.md "### Time structure" | covered |
| 35 | Two timeline models: independently placed clips vs ripple (sequential) | repo | frames.md "### Time structure" (Sequence vs Series) | covered |
| 36 | Timing props on any layer, with a Sequence as the fallback wrapper | repo | frames.md "### Time structure" (`Sequence layout="none"`) | covered |
| 37 | Nested composition with its own width, height and duration seen by children | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 38 | `trimBefore` / `trimAfter`: a child clock that starts later or ends early | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 39 | Looping a trimmed range inside a Sequence | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 40 | Per-Sequence playback rate (time remap). Parent span = duration / rate | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 41 | Freeze: hold a subtree on one frame for a span, then resume | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 42 | Reading the frame across a Sequence boundary changes it. Pass the parent frame down for continuous tracks | repo | frames.md 2 API (Hooks) | added |
| 43 | One scene per file, each also previewable on its own with matching metadata | repo | frames.md 3 Authoring a composition; dev route itself is app code outside this pass | added |
| 44 | Scene durations as constants, summed for the parent, with transition overlaps subtracted | repo | frames.md 2 API (Time structure); seriesDuration helper proposed, code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 45 | Duration derived from data is computed explicitly, never inferred by scanning frames. Abort stale fetches | repo | frames.md 2 API (Config) | added |
| 46 | Triggered sub-sequences: each item triggers when a driver reaches it, then runs constant-duration phases. (abridged) | repo | frames.md 3 Authoring a composition; rule Triggered phases | added |
| 47 | Transition series: overlapping scenes with entering and exiting progress. The timeline gets shorter | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 48 | Overlay centred on a cut that does not shorten the timeline, with an offset. Not adjacent to a transition | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 49 | Presentations: fade, slide (with direction), wipe | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 50 | Flip and clock-wipe presentations | repo | 3D rotate is banned in product UI (jal-motion "## 3"). Clock wipe is decorative | excluded |
| 51 | Linear vs spring timing for transitions | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 52 | Light-leak overlays | repo | Gradient light leak and glow are banned (jal-motion/references/showcase.md "What stays out of showcase too") | excluded |
| 53 | Effect preference order: HTML and CSS, then an element-level effect, then a custom shader | repo | jal-motion SKILL.md "## 6. Performance" (prefer the smallest tool) | covered |
| 54 | Effect contract: setup, apply, cleanup; cache key; param validation; 2D first; reset context state (abridged) | repo | shaders.md 11 Full-screen quad setup; Per-frame effect contract bullet, ideas only, own words | added |
| 55 | Effect catalog (glow, chromatic aberration, light trail, thermal, tv-signal and others) | repo | Glow, neon and gradient looks are banned, most are decorative, and the package is Remotion-licensed | excluded |
| 56 | HTML-in-canvas post-processing | repo | Needs a Chrome 149 flag, not shippable | excluded |
| 57 | Sub-frame motion blur (shutter angle 180, 8 samples) | repo | Multiplies render cost per frame and depends on HTML-in-canvas. Rare directional blur is already in jal-motion/references/showcase.md "Directional (abridged) | excluded |
| 58 | Hand-drawn text annotations (highlight, circle, underline, strike) | repo | Marker, pill and underline draw-on are banned (jal-motion/references/showcase.md "What stays out of showcase too") | excluded |
| 59 | Crop by edge ratios, keyframable. Never combined with clip-path | repo | frames.md 3 Authoring a composition; rule Crops and reveals | added |
| 60 | Path draw and morph driven by frame. Multi-segment draw by cumulative length | repo | frames.md 11 Media, paths, and maps inside compositions | added |
| 61 | Keep a drawn line non-empty at progress 0 (minimum length) | repo | frames.md 11 Media, paths, and maps inside compositions | added |
| 62 | Prepare paths by resampling and moving-average smoothing, not Douglas-Peucker. No Bezier smoothing on long (abridged) | repo | r3f.md 12 Scroll-driven camera binding; Path-follow shots bullet; ideas only | added |
| 63 | Lottie synced to the frame | repo | lottie-web not approved (approval candidate, ask Brian); belongs in jal-motion SKILL.md 1; frames.md 3 absolute-setter rule covers driving it if (abridged) | excluded |
| 64 | Animated GIF, APNG or WebP synced to the timeline | repo | Heavy formats. JAL uses DOM compositions, image sequences (row 65) or video | excluded |
| 65 | Image sequences indexed by frame | repo | frames.md 11 Media, paths, and maps inside compositions | added |
| 66 | Embedded video synced to the frame (trim, rate, loop, muted) | repo | frames.md 11 Media, paths, and maps inside compositions | added |
| 67 | Audio tracks, volume curves, pitch, sound effects, AI voiceover | repo | frames.md "## 7. Limits" puts audio out of scope | excluded |
| 68 | Audio visualization (spectrum, waveform, bass-reactive, dB log scaling) | repo | Audio is out of scope | excluded |
| 69 | Transcription with whisper.cpp | repo | Node tooling and audio are out of scope | excluded |
| 70 | ffmpeg trimming, silence detection (loudnorm, silencedetect) | repo | Server media pipeline | excluded |
| 71 | Media metadata through Mediabunny | repo | Unapproved library. `loadedmetadata` on a plain element is enough | excluded |
| 72 | Caption data model (text, startMs, endMs, optional page break) as JSON | repo | frames.md 12 Captions as on-screen narration; captions.ts helper proposed, code change in templates/monorepo/packages/ui/src/frames is outside this (abridged) | added |
| 73 | Group caption tokens into pages by time window (about 1200ms) plus manual breaks | repo | frames.md 12 Captions as on-screen narration | added |
| 74 | Each page in a Sequence. End = min(next start, start + window). Skip non-positive spans | repo | frames.md 12 Captions as on-screen narration | added |
| 75 | Tokens are whitespace-sensitive (leading spaces, `white-space: pre`) | repo | frames.md 12 Captions as on-screen narration | added |
| 76 | Active word from absolute time (page start + local time), half-open range test | repo | frames.md 12 Captions as on-screen narration; contrast only, no pill | added |
| 77 | Captions in their own component and file, one track per clip. SRT import | repo | frames.md 12 Captions as on-screen narration | added |
| 78 | Design a video, not a page: one focal point per scene, no redundant elements | repo | jal-motion/references/showcase.md "Staging and hierarchy of motion"; frames.md "## 3" (one thing moving at a time) | covered |
| 79 | Safe area: key text at least 80px from the sides and 100px from top and bottom at 1080 wide | repo | frames.md 3 Authoring a composition; dev toggle is app code outside this pass | added |
| 80 | Minimum authored text: headline 84px, support 44px at 1080 wide, scaled with width | repo | frames.md 3 Authoring a composition; merged into Readable at the smallest width | added |
| 81 | DOM measurement under the stage scale: divide by the scale | repo | frames.md 2 API (Hooks); fitScale is exported; useStageScale proposed, code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 82 | Measure, fit and overflow-check text. Cache results, use the same font properties, outline not border | repo | frames.md 3 Authoring a composition; rule Fitting text | added |
| 83 | Contain sizing that fits both width and height of a container | repo | frames.md 2 API (Surfaces); fit=contain proposed, code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 84 | `aspect-ratio` on the stage so mounting causes no layout shift | repo | Composition.tsx stage style; frames.md "### Surfaces" | covered |
| 85 | Keep fast time state out of the Player`s parent. Siblings subscribe through a ref and an external store | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 86 | Memoize `inputProps` | repo | frames.md 7 Limits; Heavy scenes bullet | added |
| 87 | Imperative Player handle (play, pause, toggle, seekTo, getCurrentFrame, isPlaying, getScale) | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 88 | Event set: per-frame update, throttled time update (250ms), seeked, play, pause, ended, error | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 89 | Error fallback when a composition throws | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 90 | Restrict playback to a frame range (in and out points) | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 91 | Poster while unplayed (not only under reduced motion) | repo | frames.md 5 Poster frame and reduced motion; idle poster proposed in 13, code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 92 | Return to the start at the end, or play again from the start | repo | frames.md "## 4" (pressing play at the end restarts) | covered |
| 93 | `initialFrame` is fixed after mount | repo | Player.tsx `useState` initial playback | covered |
| 94 | Keyboard and pointer: space toggles when focused, click on the stage to play | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 95 | Fullscreen with feature detection after mount; none on iOS Safari | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 96 | Auto-hide controls after 3s of inactivity, flash them on entry | repo | JAL controls sit below the stage and stay visible (frames.md "## 4") | excluded |
| 97 | Editor time format hh:mm:ss.ff | repo | Viewer demos use m:ss (`formatTime`) | excluded |
| 98 | Volume, mute, volume persistence in localStorage | repo | Audio is out of scope | excluded |
| 99 | Playback-rate menu, including reverse | repo | Scrub covers review, and rate menus add chrome for no viewer value | excluded |
| 100 | Media Session and media keys, one registered Player | repo | Silent compositions must not claim media keys | excluded |
| 101 | Autoplay-with-audio restrictions, passing the gesture event to play, Safari `onClickCapture` | repo | Audio is out of scope. The JAL autoplay rules are in frames.md "## 4" and "## 5" | excluded |
| 102 | Dev trace logging of mount, load, seek and buffer events | repo | frames.md 13 Readiness and the Player contract (proposed); code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 103 | Thumbnail: render one chosen frame outside a Player | repo | frames.md "### Surfaces" (`Composition frame={n}`) | covered |
| 104 | Stills for OG images and thumbnails | repo | frames.md 5 Poster frame and reduced motion; Bun plus puppeteer-core script | added |
| 105 | Render a list of frames as images for visual checks, with a mid-frame still first | repo | frames.md 14 Testing frame compositions; window.__frames hook proposed, code change in templates/monorepo/packages/ui/src/frames is outside this pass | added |
| 106 | Lazy composition component behind Suspense, created once | repo | frames.md 4 Product demo videos played live; Lazy scenes paragraph | added |
| 107 | Interactive compositions in a scaled stage: pointer math over the scale, propagation, primary button (abridged) | repo | frames.md 3 Authoring a composition; rule Pointer input inside the stage | added |
| 108 | Put the Player in an iframe to isolate global styles | repo | Stage CSS is already scoped. An iframe adds cost and hurts accessibility | excluded |
| 109 | Smallest map technique: a static image plate with DOM markers when the map only sets context | repo | frames.md 11 Media, paths, and maps inside compositions; Maps bullet | added |
| 110 | Live map libraries (Mapbox, MapLibre, MapTiler, Cesium, Google 3D tiles, Turf) | repo | Approval candidates only (MapLibre plus Turf is the one free option), and only when a geo story needs a moving camera. Keys, provider terms and (abridged) | excluded |
| 111 | Fixed plate: render a heavy layer once, move it with transform, scale at most 1, at most 4096px, split shots (abridged) | repo | performance.md 5 Cost references; Fixed plates paragraph; ideas only | added |
| 112 | Screen labels projected from world positions every frame | repo | r3f.md "## 7. drei helpers" (`<Html>`). Plate labels are in fill 111 | covered |
| 113 | Separate travel progress from camera progress: a sub-window, and out, hold, in keyframes for camera distance | repo | frames.md 10 Canvas and R3F inside a composition; Camera moves in a composition | added |
| 114 | Label anchor at the pole of inaccessibility, not the centroid, with a per-label nudge | repo | frames.md 11 Media, paths, and maps inside compositions; Maps bullet | added |
| 115 | Chaikin corner cutting on sparse control points (3 passes default, 2 tighter, 4 softer) | repo | r3f.md 12 Scroll-driven camera binding; Path-follow shots bullet; ideas only | added |
| 116 | Constant speed by arc length, not by point index | repo | r3f.md "## 12" (`getPointAt`), scroll-choreography.md "## 9. Scroll-driven camera paths for R3F" | covered |
| 117 | Look-ahead aim at a real point further along the path. Path length at least travel + 2 x look-ahead. Constant (abridged) | repo | r3f.md 12 Scroll-driven camera binding; Path-follow shots bullet; ideas only | added |
| 118 | Bank into turns from the heading delta, clamped (about 7.5 degrees, gain 0.6) | repo | frames.md 10 Canvas and R3F inside a composition; Camera moves in a composition | added |
| 119 | Camera speed budget: speed = distance / seconds, err slow (8s felt rushed, 24s calm) | repo | frames.md 10 Canvas and R3F inside a composition; Camera moves in a composition | added |
| 120 | Settle loop: render until loaded stays true for about 8 ticks, with a cap | repo | performance.md 6.2 Deterministic captures; ideas only | added |
| 121 | Verify motion with a short moving capture, not stills, at every aspect ratio | repo | performance.md "### 6.2 Deterministic captures" (still images cannot prove absence of shimmer) | covered |
| 122 | Cesium gotchas (`viewer.render` vs `scene.render`, black globe headless, pitch sign conventions) | repo | Engine-specific and not in the stack | excluded |
| 123 | Google photorealistic 3D tiles for city flyovers (screen-space error 4 to 8, 30s promo limit) | repo | Billing, provider terms, not in the stack | excluded |
| 124 | Unrestricted API keys in client bundles for headless renders | repo | Conflicts with jal-security-hardening. Client keys must be restricted | excluded |
| 125 | Loading engines and workers from a CDN at runtime (Cesium CDN, unpkg worker) | repo | JAL self-hosts vendor code (three-foundations.md "### 7.3 CDN defaults to override") | excluded |
| 126 | Hide provider logos and attribution with CSS | repo | Breaches provider terms | excluded |
| 127 | Bake geometry prep (ordered lines, trigger stops, anchors) offline and ship JSON | repo | three-foundations.md 7.6 Procedural texture bakes (Build-time motion data); ideas only, Bun build script | added |
| 128 | Studio interactivity (Interactive elements, inline styles and names, inline defaultProps, zod schemas (abridged) | repo | Remotion Studio editing features. JAL has no Studio | excluded |
| 129 | Preserve user edits made outside the conversation | repo | Generic agent process owned by jal-git-safety | excluded |
| 130 | Docs lookup through a search API and `.md` URLs | repo | Remotion-specific tooling | excluded |
| 131 | Scaffolding, Studio launch, upgrade flows | repo | npx and Node tooling for a product outside the stack | excluded |
| 132 | Server and cloud rendering, SaaS templates, Lambda, transparent ProRes or VP9 export | repo | frames.md "## 7. Limits" rules out encoding | excluded |
| 133 | Props must be JSON-serializable for rendering | repo | No server render. JAL `inputProps` are live | excluded |
| 134 | Emoji rendering differs by OS | repo | JAL bans emoji | excluded |
| 135 | Bun runtime caveats for the Remotion CLI | repo | Remotion tooling | excluded |
| 136 | Repo coding style (one function unless reused, nullable internal props, no new tests unless asked) | repo | Generic dev process owned by jal-standards | excluded |
| 137 | Product positioning (React code as source of truth, animated design-system assets) | repo | Marketing, no technique | excluded |

## 8. animata

From: animata (audit inventory at the 2026-09-29 checkout); JAL-authored status.

License: MIT. Rows: 273. Covered 157, added 3 (3 of them in part 2), excluded 113.

| # | Knowledge item | License | JAL file and section, or reason | Status |
|---|---|---|---|---|
| 1 | `accordion/faq` (disclosure) | repo | jal-motion/references/components.md 3 index, ADAPT, R22 Disclosure (T0) | covered |
| 2 | `background/animated-beam` | repo | jal-motion/references/components.md 6 DROP (Animata): Dark default, glow, gradient. | excluded |
| 3 | `background/blurry-blob` | repo | jal-motion/references/components.md 6 DROP (Animata): Blur blob (banned), purple. | excluded |
| 4 | `background/boids-ecosystem` | repo | jal-motion/references/components.md 6 DROP (Animata): Ambient, random, decorative. The flocking technique itself is row 222 (MISSING). | excluded |
| 5 | `background/diagonal-lines` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative lines via gradient. | excluded |
| 6 | `background/dot` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient texture. | excluded |
| 7 | `background/grid` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient, decorative lines. | excluded |
| 8 | `background/interactive-grid` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative lines, layout transition. | excluded |
| 9 | `background/moving-gradient` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient. | excluded |
| 10 | `background/shooting-stars` | repo | jal-motion/references/components.md 6 DROP (Animata): Dark, glow, random, ambient. | excluded |
| 11 | `background/zigzag` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient, decorative. | excluded |
| 12 | `bento-grid/eight` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 13 | `bento-grid/eleven` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 14 | `bento-grid/five` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 15 | `bento-grid/four` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 16 | `bento-grid/gradient` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient is the point. | excluded |
| 17 | `bento-grid/nine` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 18 | `bento-grid/seven` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 19 | `bento-grid/six` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 20 | `bento-grid/ten` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 21 | `bento-grid/three` (layout) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 22 | `button/ai-button` | repo | jal-motion/references/components.md 6 DROP (Animata): Sparkle, purple, shimmer, unapproved dep. | excluded |
| 23 | `button/algolia-blue-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 24 | `button/algolia-white-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 25 | `button/animated-follow-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R14 Async state button (T1) | covered |
| 26 | `button/arrow-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 27 | `button/duolingo` | repo | jal-motion/references/components.md 6 DROP (Animata): The ledge is a shadow/bottom bar; JAL press is scale 0.98. | excluded |
| 28 | `button/external-link-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 29 | `button/get-started-button` | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 30 | `button/ripple-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R16 Press ripple (T1) | covered |
| 31 | `button/shining-button` | repo | jal-motion/references/components.md 6 DROP (Animata): Shine sweep, violet. | excluded |
| 32 | `button/slide-arrow-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 33 | `button/status-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R14 Async state button (T1) | covered |
| 34 | `button/swipe-button` (button) | repo | jal-motion/references/components.md 3 index, KEEP, R06 Hover roll (T0) | covered |
| 35 | `button/toggle-switch` (control) | repo | jal-motion/references/components.md 3 index, ADAPT, R17 Switch (T0) | covered |
| 36 | `button/work-button` (button) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 37 | `card/WebHooks-card` (card) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 38 | `card/blur-stack-card` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlap at rest plus blur. | excluded |
| 39 | `card/card-comment` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 40 | `card/card-spread` (card / deck) | repo | jal-motion/references/components.md 3 index, ADAPT, R32 Deck carousel and deal-in (T2) | covered |
| 41 | `card/card-stack` (card / deck) | repo | jal-motion/references/components.md 3 index, ADAPT, R32 Deck carousel and deal-in (T2) | covered |
| 42 | `card/card-stack-profile` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlap at rest, layout animation. | excluded |
| 43 | `card/case-study-card` | repo | jal-motion/references/components.md 6 DROP (Animata): 3D rotate gimmick, eyebrow-like label. | excluded |
| 44 | `card/collab-card` (bento tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0). Its `cqi` sizing is row 269. | covered |
| 45 | `card/comment-reply-card` (form / list) | repo | jal-motion/references/components.md 3 index, ADAPT, R21 FLIP lists and list-to-detail (T2) | covered |
| 46 | `card/email-feature-card` (card) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 47 | `card/flip-card` (card / 3D) | repo | jal-motion/references/components.md 3 index, ADAPT, R33 3D flip (T0) | covered |
| 48 | `card/github-card-shiny` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient spotlight. | excluded |
| 49 | `card/github-card-skew` | repo | jal-motion/references/components.md 6 DROP (Animata): 3D tilt gimmick, shadow. | excluded |
| 50 | `card/glowing-card` | repo | jal-motion/references/components.md 6 DROP (Animata): Glow, gradient. | excluded |
| 51 | `card/integration-pills` (card) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 52 | `card/led-board` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative ambient loop, brand homage, purple. | excluded |
| 53 | `card/notice-card` (card / status) | repo | jal-motion/references/components.md 3 index, ADAPT, R17 Switch (T0) | covered |
| 54 | `card/notification-card` (card / disclosure) | repo | jal-motion/references/components.md 3 index, ADAPT, R22 Disclosure (T0) | covered |
| 55 | `card/notify-user-info` (card) | repo | jal-motion/references/components.md 3 index, ADAPT, R22 Disclosure (T0) | covered |
| 56 | `card/reminder-scheduler` (card / form) | repo | jal-motion/references/components.md 3 index, ADAPT, R13 Sliding tonal indicator (T2) | covered |
| 57 | `card/score-card` | repo | jal-motion/references/components.md 6 DROP (Animata): Dark default, layout animation, novelty. | excluded |
| 58 | `card/staggered-card` (menu) | repo | jal-motion/references/components.md 3 index, ADAPT, R13 Sliding tonal indicator (T2) | covered |
| 59 | `card/subscribe-card` (form) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 60 | `card/survey-card` (card / data) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 61 | `card/swap-card` | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 62 | `card/swap-text-card` (card) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 63 | `card/tilted-card` | repo | jal-motion/references/components.md 6 DROP (Animata): Tilt gimmick, shadow. | excluded |
| 64 | `carousel/expandable` (carousel) | repo | jal-motion/references/components.md 3 index, ADAPT, R43 Carousel (T2) | covered |
| 65 | `carousel/image-carousel` (carousel) | repo | jal-motion/references/components.md 3 index, ADAPT, R43 Carousel (T0) | covered |
| 66 | `container/animated-border-trail` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient, ornament. The `@property` angle technique is row 266. | excluded |
| 67 | `container/animated-dock` (navigation) | repo | jal-motion/references/components.md 3 index, ADAPT, R29 Dock magnification (T1) | covered |
| 68 | `container/announcement-ribbon` (banner) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 69 | `container/cursor-tracker` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative cursor follower. | excluded |
| 70 | `container/fibonacci-lines` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative lines. | excluded |
| 71 | `container/marquee` (scroll strip) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 72 | `container/nav-tabs` (navigation) | repo | jal-motion/references/components.md 3 index, ADAPT, R13 Sliding tonal indicator (T2) | covered |
| 73 | `container/sibling-focus-nav` (navigation) | repo | jal-motion/references/components.md 3 index, ADAPT, R30 Sibling dim (T0) | covered |
| 74 | `fabs/flower-menu` (menu / FAB) | repo | jal-motion/references/components.md 3 index, ADAPT, R31 Speed dial and radial menu (T0) | covered |
| 75 | `fabs/speed-dial` (menu / FAB) | repo | jal-motion/references/components.md 3 index, ADAPT, R31 Speed dial and radial menu (T0) | covered |
| 76 | `feature-cards/confirmation-message` (status) | repo | jal-motion/references/components.md 3 index, ADAPT, R14 Async state button (T1) | covered |
| 77 | `feature-cards/content-scan` (feature demo) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 78 | `graphs/bar-chart` (data) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 79 | `graphs/commit-graph` (data) | repo | jal-motion/references/components.md 3 index, ADAPT, R37 Heat grid (T0) | covered |
| 80 | `graphs/donut-chart` (data) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 81 | `graphs/gauge-chart` (data) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 82 | `graphs/progress` (data) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 83 | `graphs/ring-chart` (data) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 84 | `hero/hero-section` | repo | jal-motion/references/components.md 6 DROP (Animata): Emoji, shadow, decoration. | excluded |
| 85 | `hero/hero-section-text-hover` | repo | jal-motion/references/components.md 6 DROP (Animata): Floating images overlap text, emoji. | excluded |
| 86 | `hero/product-features` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient, blur, shadow. | excluded |
| 87 | `hero/shape-shifter` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative morph. | excluded |
| 88 | `hero/slack-intro` | repo | jal-motion/references/components.md 6 DROP (Animata): Glow, purple, brand mimic. | excluded |
| 89 | `icon/hover-interaction` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative spring gimmick. | excluded |
| 90 | `icon/icon-ripple` (icon / status) | repo | jal-motion/references/components.md 3 index, ADAPT, R39 Time-function motion (T0) | covered |
| 91 | `image/disclose-image` (media) | repo | jal-motion/references/components.md 3 index, ADAPT, R26 Panel slide-off and tile image reveal (T1) | covered |
| 92 | `image/image-box-shadow` | repo | jal-motion/references/components.md 6 DROP (Animata): Shadow. | excluded |
| 93 | `image/images-reveal` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlap at rest, overshoot. | excluded |
| 94 | `image/photo-booth` (media) | repo | jal-motion/references/components.md 3 index, ADAPT, R27 Image hover zoom (T0) | covered |
| 95 | `image/skew-image` | repo | jal-motion/references/components.md 6 DROP (Animata): Distortion gimmick. | excluded |
| 96 | `image/tilted-cover` | repo | jal-motion/references/components.md 6 DROP (Animata): 3D tilt. | excluded |
| 97 | `image/trailing-image` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlap, decorative cursor trail. Its trail uses pointer-distance spawning; no lawful stand-in. | excluded |
| 98 | `image/zoom-image` (media) | repo | jal-motion/references/components.md 3 index, ADAPT, R27 Image hover zoom (T0) | covered |
| 99 | `list/avatar-list` (social proof) | repo | jal-motion/references/components.md 3 index, ADAPT, R35 Avatar row (T0) | covered |
| 100 | `list/flipping-cards` | repo | jal-motion/references/components.md 6 DROP (Animata): Duplicate of flip-card, hover-hidden content. | excluded |
| 101 | `list/menu-animation` (menu) | repo | jal-motion/references/components.md 3 index, ADAPT, R15 Button micro affordances (T0) | covered |
| 102 | `list/orbiting-items` | repo | jal-motion/references/components.md 6 DROP (Animata): Ambient orbit. | excluded |
| 103 | `list/orbiting-items-3-d` | repo | jal-motion/references/components.md 6 DROP (Animata): Ambient 3D orbit. | excluded |
| 104 | `list/reveal-image` | repo | jal-motion/references/components.md 6 DROP (Animata): Floating image overlaps rows. | excluded |
| 105 | `list/transaction-list` (list) | repo | jal-motion/references/components.md 3 index, ADAPT, R21 FLIP lists and list-to-detail (T2) | covered |
| 106 | `list/transition-list` (list) | repo | jal-motion/references/components.md 3 index, ADAPT, R21 FLIP lists and list-to-detail (T2) | covered |
| 107 | `overlay/modal` (overlay) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 108 | `preloader/split-reveal` (preloader) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 109 | `preloader/vertical-tiles` (transition) | repo | jal-motion/references/components.md 3 index, ADAPT, R25 Tile section transition (T1) | covered |
| 110 | `progress/animatedtimeline` (timeline) | repo | jal-motion/references/components.md 3 index, ADAPT, R22 Disclosure (T0) | covered |
| 111 | `progress/spinner` (loader) | repo | jal-motion/references/components.md 3 index, ADAPT, R39 Time-function motion (T0) | covered |
| 112 | `scroll/stacked-sections` (scroll) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 113 | `section/pricing` (section) | repo | jal-motion/references/components.md 3 index, ADAPT, R13 Sliding tonal indicator (T2) | covered |
| 114 | `skeleton/category-glyphs` (illustration) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 115 | `skeleton/category-skeleton` (illustration) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 116 | `skeleton/code` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 117 | `skeleton/cookie-banner` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 118 | `skeleton/list` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 119 | `skeleton/receipt` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 120 | `skeleton/report` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 121 | `skeleton/wide-card` (skeleton) | repo | jal-motion/references/components.md 3 index, ADAPT, R40 Skeleton loaders (T0) | covered |
| 122 | `tabs/fluid-tabs` (tabs) | repo | jal-motion/references/components.md 3 index, ADAPT, R13 Sliding tonal indicator (T2) | covered |
| 123 | `tabs/gooey-tabs` | repo | jal-motion/references/components.md 6 DROP (Animata): Filter effect plus layout animation. | excluded |
| 124 | `tabs/shift-tabs` | repo | jal-motion/references/components.md 6 DROP (Animata): Tilt gimmick, accent border. | excluded |
| 125 | `text/animated-gradient-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Gradient. | excluded |
| 126 | `text/blur-out-up` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 127 | `text/bold-copy` | repo | jal-motion/references/components.md 6 DROP (Animata): Decorative overlap. | excluded |
| 128 | `text/bottom-up-letters` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 129 | `text/circular-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Ambient spin. | excluded |
| 130 | `text/counter` (text / data) | repo | jal-motion/references/components.md 3 index, ADAPT, R07 Number count-up (T1) | covered |
| 131 | `text/cycle-text` (text) | repo | jal-motion/references/components.md 3 index, ADAPT, R05 Rotating word (T1) | covered |
| 132 | `text/double-underline` | repo | jal-motion/references/components.md 6 DROP (Animata): Underline draw-on, layout properties. | excluded |
| 133 | `text/fade-through` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 134 | `text/focus-blur-resolve` | repo | jal-motion/references/components.md 6 DROP (Animata): Blur is the whole effect. | excluded |
| 135 | `text/gibberish-text` (text) | repo | jal-motion/references/components.md 3 index, ADAPT, R09 Deterministic scramble (T1) | covered |
| 136 | `text/glitch-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Multicolor ghosts overlapping, flash risk, ambient. | excluded |
| 137 | `text/jitter-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Ambient random. | excluded |
| 138 | `text/jumping-text-instagram` | repo | jal-motion/references/components.md 6 DROP (Animata): Bounce/overshoot. | excluded |
| 139 | `text/kinetic-center-build` (text-animator) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 140 | `text/line-by-line-slide` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 141 | `text/mask-reveal-up` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R03 Line mask reveal (T1) | covered |
| 142 | `text/mask-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Cursor gimmick, dark. Lawful stand-in for a pointer-revealed copy is R28. | excluded |
| 143 | `text/metis-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Underline draw-on on hover (banned ornament). | excluded |
| 144 | `text/micro-scale-fade` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 145 | `text/mirror-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlapping duplicate. | excluded |
| 146 | `text/per-character-rise` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 147 | `text/per-word-crossfade` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 148 | `text/roll-text` (text / hover) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 149 | `text/scale-down-fade` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 150 | `text/scroll-reveal` (scroll text) | repo | jal-motion/references/components.md 3 index, ADAPT, R04 Scroll-linked word reveal (T3) | covered |
| 151 | `text/shared-axis-y` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 152 | `text/shared-axis-z` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 153 | `text/shimmer-sweep` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 154 | `text/short-slide-down` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 155 | `text/short-slide-right` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 156 | `text/soft-blur-in` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 157 | `text/split-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Legibility gimmick. | excluded |
| 158 | `text/spring-scale-in` (text-animator) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 159 | `text/staggered-letter` (text) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 160 | `text/swap-text` (text / hover) | repo | jal-motion/references/components.md 3 index, ADAPT, R06 Hover roll (T0) | covered |
| 161 | `text/text-animator` (engine) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 162 | `text/text-border-animation` | repo | jal-motion/references/components.md 6 DROP (Animata): Underline draw-on. | excluded |
| 163 | `text/text-explode-imessage` | repo | jal-motion/references/components.md 6 DROP (Animata): Random, overshoot, decorative. | excluded |
| 164 | `text/text-flip` (text) | repo | jal-motion/references/components.md 3 index, ADAPT, R05 Rotating word (T1) | covered |
| 165 | `text/ticker` (text / data) | repo | jal-motion/references/components.md 3 index, ADAPT, R08 Odometer digits (T0) | covered |
| 166 | `text/top-down-letters` (text-animator) | repo | jal-motion/references/components.md 3 index, KEEP, R02 Text motion engine (T1) | covered |
| 167 | `text/typing-text` (text) | repo | jal-motion/references/components.md 3 index, ADAPT, R10 Typing sequence (T1) | covered |
| 168 | `text/underline-hover-text` | repo | jal-motion/references/components.md 6 DROP (Animata): Underline draw-on, width animation. | excluded |
| 169 | `text/wave-reveal` (text) | repo | jal-motion/references/components.md 3 index, ADAPT, R02 Text motion engine (T1) | covered |
| 170 | `widget/alarm-clock` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R17 Switch (T0) | covered |
| 171 | `widget/battery` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 172 | `widget/battery-level` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 173 | `widget/calendar-event` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 174 | `widget/calendar-widget` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 175 | `widget/calorie-counter` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 176 | `widget/clock-with-photo` | repo | jal-motion/references/components.md 6 DROP (Animata): Text over photo with blur, `transition-all`. | excluded |
| 177 | `widget/cycling` | repo | jal-motion/references/components.md 6 DROP (Animata): Dark default, multicolor. | excluded |
| 178 | `widget/delivery-card` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 179 | `widget/direction-card` | repo | jal-motion/references/components.md 6 DROP (Animata): Glow, dark. | excluded |
| 180 | `widget/expense-tracker` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 181 | `widget/flight-widget` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 182 | `widget/fund-widget` | repo | jal-motion/references/components.md 6 DROP (Animata): Dark default, blur. | excluded |
| 183 | `widget/live-score` | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 184 | `widget/mobile-detail` | repo | jal-motion/references/components.md 6 DROP (Animata): Dark, faux device. | excluded |
| 185 | `widget/music-stack-interaction` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlap at rest, dark. | excluded |
| 186 | `widget/music-widget` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 187 | `widget/notes` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 188 | `widget/profile` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 189 | `widget/reminder` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 190 | `widget/reminder-widget` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 191 | `widget/score-board` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 192 | `widget/security-alert` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 193 | `widget/shopping-list` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 194 | `widget/sleep-tracker` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 195 | `widget/storage-status` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 196 | `widget/storage-widget` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 197 | `widget/study-timer` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 198 | `widget/team-clock` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R39 Time-function motion (T0) | covered |
| 199 | `widget/video-chat` | repo | jal-motion/references/components.md 6 DROP (Animata): Overlapping picture-in-picture at rest. | excluded |
| 200 | `widget/vpn-widget` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R17 Switch (T0) | covered |
| 201 | `widget/water-tracker` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 202 | `widget/weather-card` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R41 Static tile and card references (T0) | covered |
| 203 | `widget/weekly-progress` (widget tile) | repo | jal-motion/references/components.md 3 index, ADAPT, R36 Meters and chart entrances (T0) | covered |
| 204 | Component file convention: one `.tsx` per component, co-located `.css` only for keyframes, pseudo-elements (abridged) | repo | jal-motion/references/components.md 2.3 Tailwind wiring (class conventions) and R04 note that timeline blocks stay in the component stylesheet | covered |
| 205 | `cn()` = clsx + tailwind-merge for every conditional class | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 206 | Font stack: Instrument Sans display, IBM Plex Sans body, Lilex mono | repo | Typography is owned by `jal-ui-taste` Core tokens, Type | excluded |
| 207 | Brand yellow `#ffcc00` highlights; theme accent is purple/violet | repo | Purple banned; brand styling never ported (jal-motion/references/components.md 1) | excluded |
| 208 | Every component must be theme-responsive light and dark (`dark:` class variant) | repo | Intentional difference: `jal-design-system` `sources.md` (white path default, dark only behind explicit `data-theme`) (abridged) | covered |
| 209 | Four-tier changelog (site, month, category, component) | repo | Release notes are owned by `jal-release` and the jal-docs site, not immersive knowledge | excluded |
| 210 | shadcn registry install URLs per component | repo | JAL-AIDEV is self-contained; no shadcn registry (jal-motion/references/components.md 1) | excluded |
| 211 | Required deps: tailwind-merge, clsx, lucide-react or Radix icons, tailwindcss-animate (README) / (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 212 | Tailwind theme keyframes and `--animate-*` tokens (fill, accordion-down/up, reveal-up/down, marquee-x/y (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 213 | "Apple" curve `cubic-bezier(0.4, 0, 0.6, 1)` and a 24px, 0.6s `section-reveal` | repo | One curve (jal-motion/references/components.md 2.1); R01 travel is 4px product, 8px showcase | excluded |
| 214 | Asymmetric curves: every text preset pairs a decelerating entrance bezier with an accelerating exit bezier (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/SKILL.md, outside this pass (jal-immersive only); fill text ready in the animata (abridged) | excluded |
| 215 | Global runtime speed multiplier (0.72) with duration floors (140ms, 180ms), hold 550ms, gap 320ms | repo | A speed knob multiplies tokens off the scale; JAL durations are fixed tokens (jal-motion/references/components.md 2.1) | excluded |
| 216 | Stagger order modes: normal, reverse, center-out, edges-in (rank table decides each unit`s delay) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 217 | Swap timing: crossfade with an overlap window (new copy enters before the old exit ends) and a micro delay (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 218 | Center build: words arrive one at a time and the already-placed words re-center by measured width | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 219 | Cancellable animation loop controller (cancelled flag, live Animation set, timer set, pending sleep resolvers (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 220 | Roll play-through: a started roll finishes even if the pointer leaves, re-triggers are ignored while running (abridged) | repo | belongs in jal-motion/references/components.md R06, outside this pass's ownership | excluded |
| 221 | Preloader task model: run or async-generator tasks with AbortSignal, loaded/total reporting, phase machine (abridged) | repo | r3f.md 9 Suspense and loaders; Readiness as tasks; R24 itself in jal-motion/references/components.md untouched | added |
| 222 | Boids flocking: alignment, cohesion, separation inside a perception radius, attractor points, pointer repel (abridged) | repo | particles-physics.md 1.1 Canvas 2D field (tier 2); Flocking (boids) bullet with JAL corrections | added |
| 223 | `useMousePosition`: element-local pointer point, rect cached and refreshed on pointerenter, resize, and (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 224 | `usePrefersReducedMotion` as a live subscription (useSyncExternalStore, change event, legacy addListener (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 225 | `useMediaQuery` and `useIsMobile` (768px) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 226 | `useMounted`: hydration-safe mounted flag | repo | jal-motion/references/components.md 2.2 "Visible without JS" (hidden start state applied after hydration) | covered |
| 227 | `useLockBody`: scroll lock for overlays (fixed body at negative scrollY, touch-action none, restore styles (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 228 | `useExitIntent`: modal on top-edge mouse leave (after 5s) or 45% scroll or 25s on mobile, once per session | repo | Interruptive marketing pattern with no motion content; conflicts with JAL UX heuristics (`jal-ui-taste` UX heuristics) | excluded |
| 229 | `useMutationObserver` | repo | Generic DOM utility, no motion role | excluded |
| 230 | `useCopyReset`: copied state reverts after 2000ms | repo | jal-motion/references/components.md R14 success hold `--hold-step` (1200ms) | covered |
| 231 | `useNewsletterSubscription` | repo | Form backend call, not motion | excluded |
| 232 | `lerp` and `getDistance` helpers (per-frame lerp) | repo | particles-physics.md 6 item 3 (frame-rate-independent follow, which fixes upstream's frame-dependent lerp); scroll-choreography.md 8 | covered |
| 233 | Site plumbing: brand font and label, category lists, docs and TOC builders, metadata and OG, footer grid (abridged) | repo | Docs-site code, out of scope | excluded |
| 234 | `InView`: mount children only once within a 200px root margin | repo | `jal-immersive/SKILL.md` lazy start (IntersectionObserver about one viewport ahead) and jal-motion/references/components.md 2.2 `useInView` | covered |
| 235 | `RemountOnMouseIn`: replay a demo by remounting on hover, throttled to 1000ms | repo | Docs demo replay; JAL demos replay through the frame core `Player` (frames.md) | excluded |
| 236 | Animate only transform and opacity; collapse with `grid-template-rows: 0fr` to `1fr` | repo | `jal-motion/SKILL.md` 3 (disclosure exception); jal-motion/references/components.md 2.2 "Transform means transform" | covered |
| 237 | Bare `transition` covers colors only; pick `transition-transform`, `-colors`, `-opacity`, or a bracket list | repo | jal-motion/references/components.md 2.3 banned classes (stricter: JAL also bans `transition-all`, which upstream allows) | covered |
| 238 | Prefer CSS over JS; rAF not setTimeout or setInterval; always cancel in cleanup | repo | `jal-motion/SKILL.md` 6 (smallest tool) and 8 (no `Math.random` or `Date.now` in loops); jal-motion/references/components.md R05 pure-time clock | covered |
| 239 | `will-change` only for a measured stutter, removed after | repo | `jal-motion/SKILL.md` 6 `will-change` discipline; jal-motion/references/components.md 2.2 | covered |
| 240 | Batch layout reads before writes | repo | `jal-motion/SKILL.md` 6 frame budget; scroll-choreography.md 12 | covered |
| 241 | IntersectionObserver instead of scroll listeners for enter-view triggers | repo | jal-motion/references/components.md 2.2 `useInView` | covered |
| 242 | Gate non-essential motion behind `prefers-reduced-motion` | repo | `jal-motion/SKILL.md` 5; jal-motion/references/components.md 2.4 audit rule | covered |
| 243 | Opacity 0 content is still focusable and announced; pair with aria-hidden, visibility, or unmount | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 244 | Keyboard parity: anything on `:hover` also on `:focus-visible` | repo | jal-motion/references/components.md R06 and R30 selectors; `jal-motion/SKILL.md` 3 state transitions | covered |
| 245 | Announce meaningful state changes with `aria-live` or `role="status"` | repo | `jal-design-system` `jal-motion/references/components.md` Notification (toast `role="status"`); jal-motion/references/components.md R39 spinner | covered |
| 246 | Timing bands: micro 100 to 200ms, UI 200 to 300ms, page 300 to 500ms | repo | `jal-motion/SKILL.md` 2 token scale | covered |
| 247 | Avoid linear for UI motion | repo | jal-motion/references/components.md 2.4 (linear only for constant-speed loops) | covered |
| 248 | Keep per-frame values in refs, not state | repo | r3f.md useFrame rule 1 (never setState in frame, pointer, or interval handlers) | covered |
| 249 | Guard client-only APIs (window, matchMedia, IO) behind effects or useSyncExternalStore | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 250 | Pipe one driving number (progress, angle) through a CSS variable | repo | jal-motion/references/components.md R24 (`--p`), R28 (`--x`, `--y`), R29 (`--s`) | covered |
| 251 | 44px touch targets; hover-only affordances need a tap or focus path | repo | jal-motion/references/components.md 2.4; `jal-ui-taste` Hard law | covered |
| 252 | Decorative animated layers get `pointer-events: none` | repo | jal-motion/references/components.md R25 layer; `jal-frontend-rules` | covered |
| 253 | Test on a throttled CPU (4x to 6x) | repo | performance.md 6.3 Emulation through CDP (`setCPUThrottlingRate` 4) | covered |
| 254 | Traps: missing AnimatePresence silently skips exits; inline objects in animation props restart tweens every (abridged) | repo | DOM motion component knowledge; belongs in skills/jal-motion/SKILL.md, outside this pass (jal-immersive only); fill text ready in the animata (abridged) | excluded |
| 255 | Motion should clarify, not decorate | repo | `jal-motion/SKILL.md` 8 first bullet | covered |
| 256 | Code guidelines: kebab-case files, absolute imports, `use client`, `onXxx` handler props, sensible defaults (abridged) | repo | Generic dev process owned by `jal-standards` and `jal-qa-automation` | excluded |
| 257 | "How to choose" table: job to text effect, with an avoid-when column | repo | jal-motion/references/components.md 7.3 section-kind candidates and the section 3 "When to use" column | covered |
| 258 | Lightest stack ladder: CSS, then WAAPI presets, then Motion, then GSAP SplitText | repo | `jal-motion/SKILL.md` 6 last bullet | covered |
| 259 | Full sr-only string beside `aria-hidden` glyph wrappers and an invisible sizing layer | repo | jal-motion/references/components.md 2.2 split text pattern; R06 sizer | covered |
| 260 | Button guide (AI, Duolingo, ripple, shining, swipe, status, follow, get-started) | repo | Per-component rows (R06, R14, R15, R16 or DROP) | covered |
| 261 | Two lanes (component docs vs live demos), demo registry validated at build | repo | Docs-site tooling, owned by the jal-docs site | excluded |
| 262 | Category glyph spec: 64 viewBox, three shades, stroke tiers 2.2 / 2 / 1.6, draw literally, hover motion group | repo | Icons come from koboyo/reicon (`jal-frontend-rules`); the component is R41 static | excluded |
| 263 | Troubleshooting: a paste that does not animate usually lacks the `@keyframes` or `@theme` entry | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 264 | Component docs process: props tables, per-component changelog, OG images | repo | Docs process | excluded |
| 265 | Scripts: registry build, component scaffolder, OG image render, R2 upload (Node, pnpm) | repo | Node and pnpm tooling; JAL is Bun only | excluded |
| 266 | `@property` registered custom property so a keyframe can interpolate a custom var (angle for the border trail) | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 267 | Nested scroll container detection (nearest ancestor with overflow-y auto or scroll) and listening on it (abridged) | repo | scroll-choreography.md 2.1 Anatomy; added nearest overflow-y ancestor detection and shared IO root to the scroller bullet | added |
| 268 | Tabs keyboard model: roving tabindex, Arrow, Home, End, focus ring helper | repo | jal-motion/references/components.md R13 mechanism | covered |
| 269 | Container query units (`cqi`) so component-internal motion and offsets scale with the card | repo | DOM motion component knowledge; belongs in skills/jal-motion/references/components.md, outside this pass (jal-immersive only); fill text ready in the (abridged) | excluded |
| 270 | Upstream timing literals (Tailwind `duration-500`/`700`, eight hand-typed beziers, FM springs, 72ms word (abridged) | repo | jal-motion/references/components.md 2.1 tokens and the R02 preset table remap every one | covered |
| 271 | Motion is imported from the `motion` package (`motion/react`, v12), not `framer-motion` | repo | DOM motion component knowledge; belongs in skills/jal-motion/SKILL.md, outside this pass (jal-immersive only); fill text ready in the animata (abridged) | excluded |
| 272 | 200 `*.stories.tsx` demo wrappers (Primary story, argTypes) | repo | Storybook demos; no motion logic beyond props | excluded |
| 273 | Per-component MDX pages and monthly changelog MDX | repo | Used only to pair sources with docs for the census; docs prose repeats the source | excluded |
