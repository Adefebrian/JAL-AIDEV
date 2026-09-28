# Source map: every UIUX, motion, and immersive reference and where it lives

Brian's references, each mapped to the JAL skill file that holds its knowledge and the pipeline step that actually uses it. If a reference is not used by a pipeline step, it is not integrated. This map keeps that honest.

## Modern UIUX and the design system

| Reference | What JAL took | Lives in | Used by (step) |
|---|---|---|---|
| Meta Astryx | Foundation: generated scales, frame-first layout doctrine, container ladder, hierarchy, state taxonomy, agent workflow, most component anatomy | `jal-design-system` `SKILL.md`, `references/foundations.md`, `references/components.md` | jal-ux steps 4 and 7b, jal-frontend, every `/jal-ui` build |
| IBM Carbon | Data and form layer: contextual layers, density, DataTable, TextInput, Select, DatePicker, notifications, modal states | `jal-design-system` `references/components.md`, `references/foundations.md` | jal-ux steps 3 (`ui.density`), 7, and 7b |
| Google Material Web | State-layer percentages, mobile navigation bar, chips, floating create action, soft-disabled | `jal-design-system` `references/foundations.md` and `components.md`, template `AppShell` | Every build (state layers, app-shell), jal-ux step 7b |
| impeccable | Craft floor, anti-pattern ban list, critique (Nielsen 10), fresh-context finish review, seeded direction pick, direction contract | `jal-design-system` `references/craft.md`, `references/directions.md`, `jal-ui-taste` build loop | jal-ux steps 2 and 11, jal-immersive steps 2 and 11 (`ui.direction_screen`, `ui.heuristics`, `ui.finish_disposition`) |
| hallmark (local skill, no license file) | Principles only, restated, no text or code copied, merged into the impeccable core and tagged `From: hallmark`: hero rules, component specs (inputs, tooltips, toasts, dialogs, menus, command palette, copy buttons), silent success, the eight-state harness, nav and footer fingerprints, page shapes and domain trios, the context ask, pre-flight scan, redesign safety rail, reference-study protocol and URL safety, copy rules, extra critique axes, and 49 conflict rows. impeccable wins every disagreement except the five marked H>I. | `jal-design-system` `references/craft.md` sections 2 to 13, `references/directions.md` sections 1, 2, 4, 5, 7, 8 | jal-ux steps 2 (context ask, page shapes, domain trios, chrome), 7b (component specs, state harness, motion rules), and 11 (critique, pre-flight scan, redesign rail, reference study, conflict rows) |
| OriginKit (originkit.dev, paid and closed) | Approved component library. Real components may be used in a client project when JEV `ui.component_recipe` picks one and JAL law holds. Its license forbids vendoring into starter kits or templates, so JAL-AIDEV holds only clean-room `ok.*` technique recipes. Source comes from Brian's account (pasted by him, or OriginKit's MCP with his key); agents never sign in and never use its CLI; copied source is adapted to Bun.build and JAL tokens (Tailwind through the JAL `@theme`). | `jal-motion` `references/components.md` (`ok.*` recipes), `jal-design-system` `references/recipe-index.md`, `jal-standards` Animation, `references/directions.md` section 8 | jal-ux step 7b (`ui.component_recipe`), jal-frontend, jal-immersive `imm.recipe` |
| refero (styles + refero_skill) | Reference-first method, 13 visual directions as JAL Core knob sets, type and tracking statistics, display sizes | `jal-design-system` `references/directions.md`, tokens (display, tracking, accent) | jal-ux step 2 (direction candidates), every build (tokens) |
| designmd.ai (MCP) | Supplementary kit directions, screened for slop | `jal-design-system` `SKILL.md` designmd policy | jal-ux step 6 (`ui.designmd_screen`), step 7b candidate |
| Magic UI | Component and text motion (text animate, reveals, number ticker, marquee, dock, globe as R3F port, and more) | `jal-motion` `references/components.md` (plain CSS and Tailwind recipes) | jal-ux step 7b (`ui.component_recipe`), jal-frontend, jal-immersive `imm.recipe` |
| Animata | Text presets, FLIP lists, tabs, widgets, bento layouts, hovers, transitions | `jal-motion` `references/components.md` | jal-ux step 7b, jal-frontend, jal-immersive |
| bang-motion | Showcase choreography: asymmetric in and out, staging, shot-size language | `jal-motion` `SKILL.md` and `references/showcase.md` | jal-ux step 7b (marketing), jal-immersive step 7 |
| noyzzi | 30 hero sections, 22 hover effects, 26 3D elements (exempt from the visual law inside their section) | `jal-immersive` `references/noyzzi.md`, `noyzzi_list` and `noyzzi_get` tools | jal-immersive `imm.recipe`, jal-ux step 7b on marketing surfaces |

## Immersive and 3D

| Reference | What JAL took | Lives in | Used by (step) |
|---|---|---|---|
| Threejs-Awesome-Graphics-Agent-Skills | Graphics skill knowledge (its GPL and unlicensed examples rebuilt clean-room) | `jal-immersive` `references/three-foundations.md`, `shaders.md`, `effects-cleanroom.md` | jal-immersive steps 5 to 8 |
| webgpu-claude-skill | WebGPU, TSL, node materials, compute | `jal-immersive` `references/three-foundations.md`, `shaders.md`, `particles-physics.md` | `imm.tech`, step 8 |
| threejs-game-skills | Budgets, game-loop patterns, interaction | `jal-immersive` `references/performance.md`, `particles-physics.md` | `imm.tier`, step 8 |
| nixie-fx | Particle runtime (approval candidate) | `jal-immersive` `references/particles-physics.md` | `imm.tech` candidate |
| gsap-skills | Timelines, ScrollTrigger, SplitText, Flip, reduced motion, React cleanup | `jal-immersive` `references/scroll-choreography.md` | `motion.*`, step 8 |
| Remotion | The idea only: frame-driven compositions, rebuilt as the JAL frame core (no Remotion code) | template `packages/ui/src/frames`, `jal-immersive` `references/frames.md` | `motion.demo_medium` (`frame_core`) |
| ai-dev-kit | Scroll-camera principles, performance audit method | `jal-immersive` `references/performance.md`, `scroll-choreography.md` | step 10 verification |
| three.js, pmndrs (R3F, drei, maath), gkjohnson, glTF-Transform | Official patterns, R3F architecture, asset pipeline | `jal-immersive` `references/r3f.md`, `three-foundations.md` | step 8 |

## How the sources combine

No source is "the" answer. For every section, JEV picks from the combined pool and may layer two recipes: `ui.component_recipe` on product and marketing screens, `imm.recipe` on immersive sections. The build report records the recipe ID and source for every section, so any run can show which references it used.
