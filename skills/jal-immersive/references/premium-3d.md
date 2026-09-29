# Premium 3D: the quality bar and how to reach it

The bar every JAL 3D scene is judged against, and the path that reaches it: a real asset, light that tells the product story, one persistent scene with a moving camera, materials by preset, post by tier. The build path is the opt-in scene module (`templates/modules/scene`, copied to `packages/scene` in the client project) and the Poly Haven fetcher (`scripts/assets/polyhaven.ts`). Read it before any 3D build, and give section 9 to the critic.

Why it exists: Brian judged the second immersive sample's 3D "far below standard" (2026-09-29). A smart desk lamp landing shipped procedural toy models (flat plastic, a generic ring lamp, a clay mug and notebook), a lamp that lit nothing (the "light pool" was a painted orange blob on the page), no desk (objects floating on the page background), and the same scene copied into four sections. Code-modelled products have a toy ceiling; real assets and real light lift it.

## 1. The bar

From: JAL-authored (Brian's review, 2026-09-29; the scene-module proof build).

A premium product shot, in a capture, shows all of these at once:

1. **A real object.** Scanned or authored geometry with bevelled edges, real proportions in metres, and texture detail (wear, grain, print, seams). Never a primitive, never a flat single-colour material.
2. **A real surface.** The object stands on something: a desk slab with a visible edge, a seamless sweep, a floor. The contact line is dark and tight.
3. **Motivated light.** A key light that casts a shadow, an environment that fills and reflects, and, when the product emits light, the product's own light actually lighting the surface and the objects near it.
4. **One world.** Light direction, shadow direction, highlight position, and colour temperature agree across every object in frame.
5. **Page white meets the scene.** The backdrop reads as the page colour where the canvas meets the DOM, with no visible canvas edge.
6. **A deliberate camera.** A real lens (35 to 50 mm equivalent), the product placed on a thirds line, one calm region reserved for the section copy.
7. **Continuity across sections.** One scene, one camera moving between named shots; the story changes the view and the light, never a copy of the same frame.

## 2. Asset first

From: JAL-authored (Brian's approval of Poly Haven, 2026-09-29; asset QA from the proof build); Poly Haven (API and CC0 license).

**Order of preference.** Stop at the first that fits:

1. The client's own asset (CAD export, GLB from their product team). Compress offline if heavy (`gltf-transform` is an approval candidate, ask Brian).
2. A Poly Haven CC0 asset (approved by Brian, 2026-09-29), fetched straight into the client project at build time.
3. A carefully modelled asset (`procedural-geometry.md`) only when nothing fits: bevel every visible edge (0.5 to 2 mm radius at product scale), lathe or subdivide with enough segments that no facet shows at the hero lens, real dimensions from the brief, one material slot per physical part. Grey primitives exist only in the blockout.

**Poly Haven fetcher.** Zero-dependency Bun CLI, only `api.polyhaven.com` and `dl.polyhaven.org`, license checked before anything is written, size and md5 checked per file, output only inside the current working directory, one ledger row per download:

```sh
bun scripts/assets/polyhaven.ts search "desk lamp" --type models
bun scripts/assets/polyhaven.ts info desk_lamp_arm_01
bun scripts/assets/polyhaven.ts get desk_lamp_arm_01 --type models --res 1k --format gltf --out apps/web/public/assets/polyhaven
bun scripts/assets/polyhaven.ts get studio_small_09 --type hdris --res 1k --format hdr --out apps/web/public/assets/polyhaven
bun scripts/assets/polyhaven.ts get ash_veneer --type textures --res 1k --maps Diffuse,nor_gl,arm --out apps/web/public/assets/polyhaven
```

Run it from the client project root. Assets land in the client project only, with `ASSETS.md` beside them (id, type, resolution, source URL, CC0, authors, date); never in the JAL-AIDEV plugin or template. The app serves them itself (CSP `connect-src 'self'`). Resolution: 1k by default, 2k for a hero close-up of a textured surface, 4k never on the web. HDRIs: 1k is enough for lighting and soft reflections.

**What Poly Haven has for a desk scene** (search results, 2026-09-29): `desk_lamp_arm_01` (clamp arm lamp, 25,710 polys, 0.62 by 0.41 by 0.88 m), `industrial_pipe_lamp`, `vintage_oil_lamp`, `lightbulb_01`; desks and tables `WoodenTable_01`, `SchoolDesk_01`, `metal_office_desk`; desk props `potted_plant_04` (0.27 m), `ceramic_vase_01` to `04`, `brass_vase_03`, `alarm_clock_01`, `stationery_supplies`; surfaces `ash_veneer`, `oak_veneer_01` to `05`, walnut veneers, `laminate_floor_02`, `plywood`; about 100 studio HDRIs (`studio_small_01` to `09`, `white_studio_01` to `06`, `cyclorama_hard_light`, `monochrome_studio_01` to `04`). The product itself (a client's lamp, phone, speaker) rarely exists there: Poly Haven supplies the world around it.

**Asset QA before placing anything** (a short Bun script over the glTF JSON and its `.bin`, never by eye):

- Units are metres and Y is up; the base sits at y = 0. Scale a centimetre asset once at load (`Product unitScale`), nowhere else.
- Measure bounds and connected parts before placing walls and props. In the proof, a wall placed from the lamp's thumbnail cut through the lamp's elbow, which sits 0.28 m behind its clamp; the capture showed a broken arm until the wall moved back.
- Find the emitter material by name (`desk_lamp_arm_01_light`) and the emitter position from its bounds; it becomes the practical light (section 3).
- Polycount and textures against the tier (`performance.md` section 1: 150k triangles and 48 MB of textures on T2).
- Materials: glTF `doubleSided`, alpha mode, texture colour spaces (only base colour and emissive are sRGB).

**Real proportions.** Every object at its real size: a desk lamp about 0.5 to 0.9 m, a mug 0.1 m, a notebook 0.21 by 0.3 m, a desk 0.7 to 0.8 m deep. A prop never outscales the product; pick a smaller real asset instead of shrinking a large one.

## 3. Lighting that tells the product story

From: JAL-authored (the scene module's LightRig and the proof build); three.js docs (MIT, physically correct lights, shadow maps).

- **Key light that casts.** `KeyLight` is a SpotLight with a real shadow map, a wide penumbra, and a PCF radius for a soft edge. Place it far enough (about 4 to 6 m) that everything in frame sits inside the cone core: a cone edge landing on the wall reads as a painted arc (a proof finding, fixed by moving the key from 2.8 m to 5.3 m and raising its intensity by the square of the distance).
- **Fill from the environment.** `EnvironmentRig` with a local HDRI, background off, intensity 0.4 to 0.9. Rotate it so its brightest softbox sits on the key's side, so highlights and shadows agree. No ambient light, no hemisphere light standing in for fill.
- **Practical light for products that emit light.** `PracticalLight` puts a real light at the emitter: for a lamp, a SpotLight at the bulb pointing out of the shade, with its own shadow map, colour from `kelvinToLinearRGB`, so the desk and every object near it receive the pool and cast shadows away from the lamp. Rules:
  - The emitter's own mesh does not cast shadows (it surrounds the light and would block it).
  - The emitter surface's emissive is synced to the light's colour, so bulb and pool always agree.
  - Colour temperature beats interpolate in mired space (`mixKelvin`): 3000 to 3200 K reads warm without turning the desk orange, 5000 to 5600 K reads as a working light.
  - A fully saturated pool means too much intensity or too low a temperature on a warm surface; lower the intensity before touching the colour.
- **Shadows ground every object.** The key's or the practical's real shadow map on the receiving surface, plus a contact shadow (`Ground` "contact") for the tight dark line. Every object rests exactly on its surface (y = 0 on the desk top); check the contact line in the capture.
- **Backdrop at page white.** A `Ground` sweep carries its own backdrop light (an emissive lift in the page colour, the way a studio lights the paper separately), so the wall reads as `--color-page` where the canvas meets the DOM, in both the post and the no-post path.
- **Never:** a painted light blob, radial gradient, or glow on the DOM; an emissive halo, a sprite, or bloom standing in for light; a light that lights nothing. The light is shown by what it lights: the pool, the falloff, the shadow.

## 4. Renderer and colour

From: JAL-authored (measured on three r186 with the scene module's `Stage`); three.js docs (MIT, tone mapping shader chunk); pmndrs postprocessing (Zlib, tone mapping effect).

`Stage` sets these once, for every tier:

- `outputColorSpace` sRGB, colour textures sRGB, data maps linear.
- **Neutral tone mapping by default**, a measured choice for a white-first page. Output byte for a neutral linear input:

| Linear in | Neutral | ACES | AgX |
|---|---|---|---|
| 1.0 | 240 | 226 | 202 |
| 2.0 | 250 (page white) | 242 | 224 |
| Linear needed for page white `#fafaf9` | about 2 | about 4 | about 9 |

  AgX flattens a white-first scene to grey unless everything is pushed about 2 stops past Neutral, and ACES pushes a saturated orange (the proof lamp's shade) toward yellow. AgX stays available for a contained dark moment or a scene of strong emitters with no white ground; ACES for a punchier contained scene. The composer turns renderer tone mapping off, so `PostFX` applies the same mode as its last colour step.
- Physically correct lights (three's only mode since r165): SpotLight and PointLight in candela with inverse-square decay. The HDRI sets the absolute scale, so tune intensities against captures.
- Shadows with PCF (`shadows="percentage"`): r186 removed `PCFSoftShadowMap` (it now warns and falls back), and its PCF path is a soft Vogel-disk filter driven by `light.shadow.radius`.
- DPR by tier (never above 2), `alpha: true`, `frameloop="demand"`: an idle page renders nothing; CameraRig, light changes, and loaders call `invalidate()`.

## 5. One persistent scene, a camera that moves

From: JAL-authored (the scene module's CameraRig); gsap-skills (ScrollTrigger, MIT); `scroll-choreography.md` (Lenis sync).

- When 3D appears in more than one section, the page has one `Stage` (mode "fixed") and one scene. `CameraRig` moves the camera between named shots as sections scroll. Rendering the same scene in several canvases, or copying one frame into several sections, is a FAIL.
- Each section gets its own shot: a new view (wide, detail, context) and, when the story says so, a new light state (the lamp cools from 3200 K to 5200 K across the page through `progressRef`).
- Wiring: shot i frames section i; one ScrollTrigger per move on the page's real scroller from `getScroller()` (packages/ui AppShell); the triggers only write a float shot index and call `invalidate()`; the camera damps toward the sampled pose in `useFrame`. With Lenis, `damping={0}` (one smoother per signal). No ScrollTrigger scrub on top, no pins of its own.
- Every shot is composed at 375 and 1280. Portrait viewports get their own pose (`Shot.portrait`): aim above the subject so it sits in the lower two thirds, clear of the section copy at the top. The portrait fov widening is capped at 65 degrees.
- Only one section needs 3D: `Stage` mode "section", same rules without the rig.

## 6. Materials by preset, post by tier

From: JAL-authored (the scene module's materials and PostFX); three.js docs (MIT, MeshPhysicalMaterial); pmndrs postprocessing (Zlib), `@react-three/postprocessing` (MIT), and n8ao (ISC).

**Materials.** An asset with real PBR maps keeps them. Anything the scene authors takes a preset from `materials.ts` (`createMaterial`, or `applyPreset` on a glTF material by name, maps kept):

| Preset | Layers | Reads by |
|---|---|---|
| `anodisedAluminium` | metal, roughness 0.34 | a broad soft highlight, colour in the reflection |
| `brushedMetal` | metal, anisotropy 0.75 | a highlight stretched along the brush |
| `satinPlastic` | dielectric 0.48, faint clear coat | a soft highlight with a crisper top layer |
| `ceramicGlaze` | matte body, clear coat 1 at 0.06 | a sharp coat reflection over a matte body |
| `frostedDiffuser` | transmission 1, roughness 0.6, 4 mm thickness | light glowing through as a blurred refraction (costs a transmission pass) |
| `fabricSheen` | roughness 0.92, sheen 1 | a soft rim at grazing angles |

A default `MeshStandardMaterial`, one uniform roughness on every part, or a flat colour with no map on a hero object reads as a toy: FAIL.

**Post by tier** (`PostFX`, loaded as its own chunk only when the tier runs post):

| Tier | Post |
|---|---|
| full, desktop (T3) | N8AO at full resolution, subtle DepthOfField focused on the product (bokeh at most 2), tone mapping, SMAA; no bloom |
| full, mobile (T2) | none: renderer tone mapping and context MSAA |
| reduced (T1) | none |
| static (T0) | poster |

- AO runs at full resolution: half-resolution N8AO noise shows as a mottled wall on a white backdrop (a proof finding).
- Post never manufactures form or light: the no-post capture (the reduced or mobile tier) must already read as finished.
- **Bloom** is banned in the canvas, with no exception outside a noyzzi section (Brian's ruling). No chromatic aberration, vignette, noise, glitch, god rays, or lens flare.

## 7. Composition and framing

From: JAL-authored (photographic practice applied to the proof build).

- **Thirds.** The product's visual centre sits on a thirds line or intersection. The copy takes the opposite side (desktop) or the top band (mobile).
- **Scale in frame.** A hero shot gives the product 35 to 60 percent of the frame height; a detail shot 60 to 80 percent; a wide shot shows the product with its world.
- **Negative space.** One calm region (the wall, the sweep) is reserved for the section copy. No object crosses the copy's box at any width; check 375 and 1280 for every shot.
- **Lens.** 35 to 50 mm full-frame equivalent (`lensToFov`: 35 mm is 37.8 degrees vertical, 50 mm is 27.0): 40 for the hero, 50 for detail, 35 for the wide. Never wider than 28 mm on a product (it bends proportions).
- **Camera height.** Between the product's eye level and about 30 degrees down. The desk's back edge never runs through the product's focal point or the headline.
- **No floating objects.** Every object touches its surface. The surface runs out of frame or ends at a real edge with the wall behind it; a slab hanging in white is a FAIL.
- **Hierarchy of light.** The brightest, warmest, sharpest place in frame is where the story is (the pool under the lamp); props sit in the falloff.

## 8. Self-check (used by `imm.taste` and the section scorecard)

From: JAL-authored.

Answer each from the captures, not from the code. Any "no" is fixed before `imm.taste`:

- [ ] The hero object is a real asset (client or Poly Haven) or a modelled asset with bevels and real proportions; no primitive, no default material.
- [ ] Every object rests on a receiving surface with a visible contact shadow; nothing floats.
- [ ] At least one shadow-casting key light; environment lighting from a local HDRI; no ambient light doing the fill.
- [ ] A product that emits light has a practical light that visibly lights the surface, with shadows cast away from it; no painted glow anywhere.
- [ ] Light direction, shadow direction, and highlights agree on every object.
- [ ] Materials come from the asset's maps or the presets; roughness varies across parts.
- [ ] The backdrop meets the page colour with no canvas edge (sample canvas pixels against `--color-page`).
- [ ] 3D in more than one section: one `Stage`, one scene, `CameraRig` shots; no repeated frame across sections.
- [ ] Every shot at 375 and 1280: product on a thirds line, lens 35 to 50 mm, copy region clear of objects.
- [ ] The no-post capture already reads as finished; post adds AO, focus, and anti-aliasing only.
- [ ] `ASSETS.md` lists every third-party asset with its CC0 source.

## 9. How to judge 3D in screenshots (for the critic)

From: JAL-authored.

Captures come from `ui_shots` with `webgl: true`, which renders through SwiftShader. The tier probe sends a software GPU to the poster, so `ui_shots` appends `?scene-tier=full` to the URL on its own for WebGL captures (unless the URL already sets a tier) and the captures show the live scene. The lead also captures once with `?scene-tier=static`, which must show the poster, identical in framing. Read in this order, naming the image for each finding:

1. **Grounding.** Does every object touch a surface, with a dark contact line? Floating objects, or a slab hanging in white, are an automatic `craft` 0.
2. **Light source.** Can you point to where the light comes from? If the product emits light, is there a pool on the surface, falloff, and shadows pointing away from it? A glow shape with nothing lit around it is painted light: `signature` 0.
3. **Material truth.** Do surfaces differ in roughness and detail (grain, glaze, metal highlight)? Uniform plastic-looking surfaces, clay-like props, or no texture detail are the toy look: `craft` at most 1.
4. **Form.** Do edges catch small highlights (bevels)? Perfect cylinders, spheres, rings, or boxes as products fail the template-smell checklist.
5. **Scale and proportion.** Do props read at their real size against the product and the desk?
6. **Backdrop.** Does the scene meet the page white without an edge, arc, or grey field? A visible spotlight arc or a grey wall on a white page is a finish defect.
7. **Continuity.** Across screens, is it one world seen from new views, or the same frame repeated? Repetition is a `composition` hit.
8. **Framing.** Product on a thirds line, a real lens (no fisheye stretch at the edges), copy on a calm region, nothing crossing the copy.
9. **Post.** AO that mottles flat areas, DoF that blurs the product itself, or any glow halo are defects.

SwiftShader limits, never scored as defects: slight edge aliasing, lower shadow-map filtering, and missing GPU-only extensions. Composition, light direction, grounding, and material character read true in these captures; GPU fidelity and frame time come from the builder's real-GPU run.

## 10. Module and tool map

From: JAL-authored.

| Need | Where |
|---|---|
| Fetch a CC0 model, HDRI, or surface | `scripts/assets/polyhaven.ts` (tests: `polyhaven.test.ts`) |
| Copy the scene module into a client project | `templates/modules/scene/README.md` |
| Canvas, colour, tone mapping, tier, poster, context loss | `Stage.tsx`, `tier.ts` |
| HDRI fill | `EnvironmentRig.tsx` |
| Key and practical lights, kelvin | `LightRig.tsx`, `light-math.ts` |
| Desk slab or sweep, contact grounding | `Ground.tsx` |
| Material presets | `materials.ts` |
| Post stack by tier | `PostFX.tsx`, `PostFXImpl.tsx` |
| Camera shots across sections | `CameraRig.tsx`, `shots.ts` |
| glTF loading, decoders, disposal | `assets.tsx` |
| Renderer foundations, decoders, disposal detail | `three-foundations.md` |
| Budgets and tiers | `performance.md` |
| Modelling when no asset fits | `procedural-geometry.md` |
