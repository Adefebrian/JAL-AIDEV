# Third-party notices

JAL-AIDEV's skills distill knowledge from the projects below. Unless noted, the knowledge is restated in JAL's own words. Where code was ported and adapted, the original license applies to that code and its copyright line is kept here.

## Design and UIUX

| Project | License | Used for |
|---|---|---|
| [Astryx](https://github.com/facebook/astryx) (Meta) | MIT | JAL Core foundation: layout doctrine, generated scales, state taxonomy, agent workflow |
| [Carbon Design System](https://github.com/carbon-design-system/carbon) (IBM) | Apache-2.0 | JAL Core data and form layer |
| [Material Web](https://github.com/material-components/material-web) (Google) | Apache-2.0 | State-layer percentages, navigation bar, chips, floating action |
| [impeccable](https://github.com/pbakaus/impeccable) (Paul Bakaus) | Apache-2.0 | Craft floor, anti-pattern list, critique workflow, the seeded direction pick, and the direction contract (`skills/jal-design-system/references/craft.md`, `directions.md`). Restated and modified for JAL |
| [refero_skill](https://github.com/referodesign/refero_skill) (Refero, 2026) | MIT | Reference-first design methodology |
| [Refero Styles](https://styles.refero.design/) | Refero Terms of Use | Style statistics and visual directions, distilled from a small manual sample within the Terms. No Refero content is reproduced, and nothing is fetched at build time |
| [bang-motion](https://github.com/bangtutorial/bang-motion), Copyright (c) 2026 Bang Tutorial | MIT | Showcase motion choreography ideas |

## Motion and components

| Project | License | Used for |
|---|---|---|
| [Magic UI](https://github.com/magicuidesign/magicui), Copyright (c) Magic UI | MIT | Component motion recipes (`skills/jal-motion/references/components.md`) |
| [Animata](https://github.com/codse/animata), Copyright (c) Animata | MIT | Component and text motion recipes |
| [gsap-skills](https://github.com/greensock/gsap-skills), Copyright (c) 2026 GreenSock | MIT | The eight official skills ship verbatim in `skills/jal-immersive/references/gsap/official/` with their LICENSE; the JAL layer is `skills/jal-immersive/references/gsap/gsap.md`. GSAP itself is used under GreenSock's standard no-charge license; JAL never builds a visual animation editor on it |
| [Lenis](https://github.com/darkroomengineering/lenis) | MIT | Smooth scroll integration |
| [Remotion](https://github.com/remotion-dev/remotion) | Remotion License | Concept only (frame-driven compositions). No Remotion code is used, and the package is banned. The JAL frame core is an independent implementation |
| [ai-dev-kit](https://github.com/AftabIbrahimKazi/ai-dev-kit) | MIT | Scroll-camera principles and the performance audit method |

## 3D, WebGL, WebGPU, shaders

| Project | License | Used for |
|---|---|---|
| [three.js](https://github.com/mrdoob/three.js) | MIT | Renderer, TSL, examples, and water and reflector techniques |
| [react-three-fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), [maath](https://github.com/pmndrs/maath) (pmndrs) | MIT | R3F architecture and helpers |
| [postprocessing](https://github.com/pmndrs/postprocessing) | Zlib | Pass ordering guidance (an approval candidate, not a default) |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | MIT | Raycast acceleration guidance |
| [glTF-Transform](https://github.com/donmccurdy/glTF-Transform) | MIT | Asset pipeline guidance (an approval candidate) |
| [Threejs-Awesome-Graphics-Agent-Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills) | MIT (its GPL-3.0 and unlicensed examples are NOT used) | Graphics skill knowledge |
| [webgpu-claude-skill](https://github.com/dgreenheck/webgpu-claude-skill) | MIT (declared) | WebGPU and TSL knowledge |
| [threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) | MIT | Budgets and game-loop patterns |
| [nixie-fx](https://github.com/azakhary/nixie-fx) | MIT | Particle runtime knowledge (an approval candidate) |
| [Quick_Grass](https://github.com/simondevyoutube/Quick_Grass), [r3f-procedural-grass](https://github.com/momentchan/r3f-procedural-grass) | MIT | Grass technique (the noise file taken from Shadertoy is not used) |
| [WebGL2 Fundamentals](https://github.com/gfxfundamentals/webgl2-fundamentals) | BSD-3-Clause | WebGL fundamentals |
| [hash-prospector](https://github.com/skeeto/hash-prospector) | Public domain | Integer hash functions |
| Inigo Quilez articles | Snippets MIT per the author; shader art not used | SDF and noise math |

Clean-room effects (window rain, wet puddles, deformable sand, wind grass, ocean) in `skills/jal-immersive/references/effects-cleanroom.md` were written only from the permissive sources above and published papers and talks. No GPL, non-commercial (for example CC BY-NC-SA Shadertoy work, LYGIA, The Book of Shaders), or unlicensed code was copied.

## OriginKit

[OriginKit](https://www.originkit.dev) is a paid, closed component library, approved by Brian and connected through its MCP server (`mcp.originkit.dev`). Components are fetched on demand into client projects under JAL's account and never vendored into this plugin or its template, per OriginKit's license. The `ok.*` recipes in JAL are clean-room technique notes written in JAL's own words.

## noyzzi

[noyzzi.com](https://noyzzi.com) by Ileana Marcut ([Creative Glue Lab](https://creativegluelab.com)) is credited as a source of hero sections, hover effects, and 3D elements. JAL ships only an index of item names and URLs (`mcp/jal-design/noyzzi-index.json`). At build time the `noyzzi_get` tool fetches an item's prompt or code from the live site, exactly as the site offers it to a visitor. Nothing from noyzzi is vendored in this repository.

## Icons

koboyo (primary) and [reicon.dev](https://reicon.dev) (fallback), under their own terms.
