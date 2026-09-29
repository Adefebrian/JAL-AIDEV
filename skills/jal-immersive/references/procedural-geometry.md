# Procedural geometry: products, architecture, and kits built in code

When a section's subject is generated rather than loaded (a product configurator, an architecture model, a kit of parts, a tree), this file is the build discipline. Written in JAL's own words from the MIT reference text of the Threejs-Awesome-Graphics-Agent-Skills pack (`threejs-procedural-geometry`, `threejs-procedural-architecture`, `threejs-procedural-animation`) and the three.js addons (MIT). No example code was copied. Budgets are JAL's (`performance.md` section 1).

## 1. Plan, then emit

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-architecture`, `threejs-procedural-geometry` contract and submarine assembly); JAL-authored (`bun test` contract check).

- Two stages. A seeded generator produces a serialisable **plan** (parts, dimensions, placements, diagnostics); a **compiler** turns the plan into geometry. Randomness only chooses among valid options and never patches invalid geometry. Assertions fail the build on a missing builder or duplicate ownership.
- Build the strong layers first (dimensions, mass, edge graph, placements) and ornament last: ornament cannot repair a weak mass.
- Write a **geometry contract** beside the builder before any vertex: authoring frame and unit (metres), overall bounds, each part's topology intent (closed solid, thick shell, open surface), material slot, required contacts, clearances and reveals, and an expected triangle band. Mating parts read the same datum or axis frame, and derived values stay derived. A `bun test` checks built bounds against the contract and prints measured values beside their ranges.
- One unit conversion from source units to scene units, done once at load. Nothing else carries its own scale factor; a late global scale is a failed contract.

## 2. Choosing the operation

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-geometry` geometry-craft workflow, profile sweeps).

| Visible form | Operation |
|---|---|
| Constant section | `ExtrudeGeometry` with bevel options (holes in a `Shape` wind opposite to the outline) |
| Axial part | `LatheGeometry` driven by an arc-length profile |
| Rail, cable, pipe | `TubeGeometry` or a custom sweep |
| Changing section | a custom loft over authored rings |
| Rounded block | `RoundedBoxGeometry` (addons) |

- Primitives only for genuinely primitive or hidden parts. Every visible manufactured edge gets a bevel from a scale band: 0.002 m hardware, 0.004 m panels, 0.007 m plinths, 0.013 m frames and machine bodies, 0.045 m soft forms (`three-foundations.md` section 2 carries the first three).
- Spend segments on silhouette, apertures, edge highlights, and contact points before hidden flat faces.
- **Polygon first, modifier order fixed.** Keep quads and n-gons while designing and triangulate only at emission; one mesh per semantic part with a stable name until audits pass. Order: section profiles, extrude or loft or revolve or sweep, solidify, subdivision, bevel, per-part cleanup and weld, winding repair and smooth-angle normals, audit, emit. A bevelled thick shell differs from a thickened bevel, and cleaning after joining unrelated parts welds joints that must stay separate.

## 3. Profiles, sweeps, and sections

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-geometry` profile sweeps and vehicle loft contract).

- **Sculpted profiles.** Author mouldings and frames as a sum of named lobes over a normalised cross coordinate `t`: a crown `a * sin(pi * t)^p`, beads and grooves as signed Gaussians `b * exp(-((t - c) / w)^2)`, a shoulder and a cove, all scaled by the rail width. Blend both ends to set terminal depths so the profile never meets the wall on an accidental vertical edge. About 90 samples for a close hero; each lobe is a debug curve. Profile depth, not glow, makes a highlight read under a grazing key.
- **Sweeps** use parallel-transport frames: carry the previous normal forward by the rotation between consecutive tangents instead of crossing with a fixed world up (which flips when the path turns vertical). `curve.computeFrenetFrames(segments, closed)` already does this for `TubeGeometry`; custom lofts reuse it, after removing duplicate consecutive points.
- **Parameter tracks** (width, height, crown along a body) use monotone cubic Hermite interpolation (Fritsch-Carlson slopes: zero where the secant slope changes sign, rescaled when `a^2 + b^2 > 9`). A per-segment ease has zero slope at every knot and prints terraces under grazing light; a natural cubic overshoots. Bias stations toward the high-curvature ends; keep knots at least one station apart.
- **Superellipse sections.** Off-centre volumes from four superellipse quadrants with independent exponents: about 6 or more gives a flat shelf meeting the side on a crisp crease, 2.4 to 2.6 a soft crown. A Gaussian undercut term in height on the outboard side gives waisted forms. Resample the outline by arc length so vertex density stays even.
- **Texel density** stays physical: subdivide large faces at the material's tile size (`ceil(length / 1.45)` for a 1.45 m stone tile) so no quad maps more than one tile, and set UVs from accumulated arc length, not segment index.

## 4. Apertures, shells, joins, and booleans

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-geometry` quality gates).

- **Apertures.** Openings are built into one closed shell (matched outer and inner rings, or a plate with holes); the cut, its frame, and its glazing come from one outline so they cannot drift. A dark plane on a solid is not an opening.
- **Shells.** Any edge a viewer can see has real thickness (paired front and back surfaces, or a solidify step), never a single sheet.
- **Joins.** Every contact is one of four declared states: one continuous mesh; an intentional structural penetration with a named allowance; a proud part offset at least 0.0008 m; or a reveal of 0.0015 to 0.006 m (at least 0.004 m to read from 2 m). Flush but unrelated coplanar faces are never allowed: on a white plinth they z-fight visibly.
- **Booleans.** Prefer direct topology (rings, walls with holes, plates with holes); reach for a boolean only when that cannot express the cut. `three-bvh-csg` (MIT) is an approval candidate, ask Brian, and belongs in a build-time generation step. After any boolean: weld, repair winding, rerun the topology audit.

## 5. Normals and winding

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-geometry` quality gates); three.js `BufferGeometryUtils` (MIT).

- Smooth-by-angle per part with `BufferGeometryUtils.toCreasedNormals(geometry, angle)`: start about 40 degrees for turned parts, 34 for moulded sections, 45 for shells, 32 for broad tops, then judge the highlight under grazing light. Caps and side walls get separate vertices so exact edges stay hard. A blanket `computeVertexNormals()` on indexed geometry melts every edge.
- A transform with a negative determinant (a mirrored half, a Z-up to Y-up swap) reverses face orientation: reverse the index winding with it; flipping normals alone leaves faces inside out. Mirrored UVs mirror text and logos, so lettered parts get their own UV or texture variant.
- Guard: compute each closed body's signed volume after generation and flip its winding when negative. Inversion survives a wireframe check and only shows as wrong light.

## 6. Mesh writer by material slot

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-architecture` grammar and mesh compiler, `threejs-procedural-geometry` mesh writers); three.js `BufferGeometryUtils` (MIT).

Modules author geometry once in a local frame; one placement transform owns orientation and winding per side, so modules never know where they sit. Emit into a writer that keeps positions, normals, UVs, and indices per material slot and produces one indexed `BufferGeometry` per non-empty slot, which bounds draw calls by material role (glass, stone, metal) instead of by part. `BufferGeometryUtils.mergeGeometries` where it fits; `Uint32` indices above 65,535 vertices.

## 7. Architecture specifics

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-architecture`).

- **Rhythm.** Anchor to real modules (bay about 3.2 m, floor about 3.35 m, a taller ground floor about 4.45 m) and express spans as counts of them; at least four bays on any upper tier so setbacks never leave slivers. Fit repeats exactly per exposed segment: `count = max(minimum, round(length / bay))`, `bayWidth = length / count`, never a leftover narrow bay.
- **Depth hierarchy.** Modules project for real: entrances and porticos deepest, ordinary infill shallowest (about 1.8 m down to 1.1 m at building scale). Coplanar façade rectangles lose the reading under grazing light.
- **Exposed edges and ownership.** Keep compound footprints as rectangles and find exposed façade segments by subtracting, per side, the 1D intervals of touching rectangles (touch tolerance about 0.001 m, drop pieces under 0.25 m), so façades never land on shared inner walls. Reserve whole-height zones (central glazing, corner piers, service bands) before ordinary bays; ornament replaces a bay with real modules, never a decal. The mass step owns closure (soffits under overhangs, decks, connectors). Ownership keys catch exact duplicates only: add an interval-overlap test when module widths vary.

## 8. Audits and evidence

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-geometry` quality gates, `assets/geometry-quality-kit/` (MIT)); JAL-authored (`bun test` wiring, ADR rule, `performance.md` capture set).

- **Topology audit** per part in `bun test`, before emission: no non-finite positions or bad indices; no zero-area faces; no unused vertices or pairs closer than 0.00002 m; no boundary edges on closed parts and no edge shared by more than two faces; the expected edge-connected component count; positive signed volume per closed component; unit normals that agree with winding. Open surfaces declare the exception. Traverse with `object.isMesh`, not `instanceof` (two bundled copies of three break `instanceof`). Prove the checker by planting known defects in a self-test: a 0.5 mm coplanar offset, a clean 10 mm gap, a 60 mm penetration, an exact butt joint.
- **Z-fight audit.** Coplanar overlap per triangle pair: normals within 0.0025 rad, plane distance within 0.0015 m, clipped overlap area at least 2 cm2. Bucket triangles by quantised plane and inflate bounding boxes by the plane tolerance, or a 0.5 mm offset slips through. Same-facing overlaps are z-fights; opposed ones are back-to-back contacts.
- **Clash audit.** A bounding-box hit is only the broad phase: report a pair when triangle edges of one pierce the other more than twice inside the shared region, with depth threshold `min(0.03, max(0.004, 0.34 * thinnerPart))` m. Only named pairs may penetrate.
- **Moving parts** (exploded views, hinges, sliders on scroll or drag): audit clearance across the whole schedule, at least 64 pose samples and more where rotation changes fastest, and record the pose of minimum clearance. Endpoints alone miss mid-scrub interpenetration.
- **Audit twice.** Audit the named parts, merge by material slot, then audit again: merging can hide coplanar triangles inside one mesh.
- **Evidence** in the build report: part count, unique triangles, draw calls, renderer triangles (instances and shared geometry counted separately), bounds, group counts, the material set, seed, and preset. A drift in any count localises a lost or duplicated subassembly before a screenshot does. The review capture set is in `performance.md` section 6.2.
- **Tooling.** TAG's `assets/geometry-quality-kit/` is plain JavaScript under the repo's MIT license, so vendoring it into a dev-only tools folder with its notice is lawful: record it in an ADR and run its self-test with `bun`, not `node`. Writing JAL's own smaller checker from the rules above is the alternative.

## 9. LOD and budgets

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-geometry` quality gates, LOD); drei (MIT) `<Detailed>`; JAL-authored (T3 triangle cap).

Derive LODs from the generator: fewer profile samples that keep crown and groove extrema, fewer radial segments by part size, ornament replaced by a normal map once its silhouette contribution is small, the same UV density and material slots at every level. Generic decimation erases the narrow features that create material response. TAG's close-inspection models run 300k to 900k triangles, above the JAL T3 cap of 300k, so a JAL build ships generator LODs through drei `<Detailed>` with hysteresis.

## 10. Scene graph moves

From: Threejs-Awesome-Graphics-Agent-Skills (`threejs-procedural-animation` docking systems); three.js docs (MIT) `Object3D.attach`.

To move an animated object to a new parent (detach a part from an assembly, drop a product onto a plinth group), use `newParent.attach(object)`, which keeps world position, rotation, and scale; `add()` reinterprets the local transform and the part jumps. Capture any velocity in world space at the same moment.
