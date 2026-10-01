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
| [Remotion](https://github.com/remotion-dev/remotion) | Remotion License (source-available) | The core motion engine since 2026-10-01, used as a runtime dependency under the free tier: see the Remotion section below. The JAL frame core stays an independent zero-dependency implementation of the frame-driven idea, with no Remotion code |
| [ai-dev-kit](https://github.com/AftabIbrahimKazi/ai-dev-kit) | MIT | Scroll-camera principles and the performance audit method |

## 3D, WebGL, WebGPU, shaders

| Project | License | Used for |
|---|---|---|
| [three.js](https://github.com/mrdoob/three.js) | MIT | Renderer, TSL, examples, and water and reflector techniques |
| [react-three-fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), [maath](https://github.com/pmndrs/maath) (pmndrs) | MIT | R3F architecture and helpers |
| [postprocessing](https://github.com/pmndrs/postprocessing) (pmndrs) | Zlib | Approved by Brian (2026-09-29) as a runtime dependency of the opt-in scene module (`templates/modules/scene`): N8AO, DepthOfField, tone mapping, and SMAA in the tier-gated `PostFX`, never bloom; also pass ordering guidance |
| [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) (pmndrs) | MIT | Approved by Brian (2026-09-29) as a runtime dependency of the scene module: the React wrapper `PostFX` is built on |
| [n8ao](https://github.com/N8python/n8ao) (N8python) | ISC | Ambient occlusion, bundled by `@react-three/postprocessing` and used through the scene module's `PostFX` |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | MIT | Raycast acceleration guidance |
| [glTF-Transform](https://github.com/donmccurdy/glTF-Transform) | MIT | Asset pipeline guidance (an approval candidate) |
| [Threejs-Awesome-Graphics-Agent-Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills) | MIT (its GPL-3.0 and unlicensed examples are NOT used) | Graphics skill knowledge |
| [webgpu-claude-skill](https://github.com/dgreenheck/webgpu-claude-skill) | MIT (declared) | WebGPU and TSL knowledge |
| [threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) | MIT | Budgets and game-loop patterns |
| [nixie-fx](https://github.com/azakhary/nixie-fx) | MIT | Particle runtime knowledge and runtime (approved by Brian, used when JEV picks it) |
| [Quick_Grass](https://github.com/simondevyoutube/Quick_Grass), [r3f-procedural-grass](https://github.com/momentchan/r3f-procedural-grass) | MIT | Grass technique (the noise file taken from Shadertoy is not used) |
| [WebGL2 Fundamentals](https://github.com/gfxfundamentals/webgl2-fundamentals) | BSD-3-Clause | WebGL fundamentals |
| [hash-prospector](https://github.com/skeeto/hash-prospector) | Public domain | Integer hash functions |
| Inigo Quilez articles | Snippets MIT per the author; shader art not used | SDF and noise math |

Clean-room effects (window rain, wet puddles, deformable sand, wind grass, ocean) in `skills/jal-immersive/references/effects-cleanroom.md` were written only from the permissive sources above and published papers and talks. No GPL, non-commercial (for example CC BY-NC-SA Shadertoy work, LYGIA, The Book of Shaders), or unlicensed code was copied.

## Fonts

| Font | License | Used for |
|---|---|---|
| [Geist and Geist Mono](https://github.com/vercel/geist-font), Copyright (c) 2023 Vercel, in collaboration with basement.studio | SIL OFL 1.1 | The JAL Core default faces, approved by Brian (2026-09-29). The only fonts vendored here: `templates/monorepo/packages/ui/src/fonts/Geist-Variable.woff2` and `GeistMono-Variable.woff2`, unmodified from the official `geist` npm package 1.7.2, with the license text beside them as `OFL.txt` |
| Curated pool: IBM Plex Sans, IBM Plex Mono, IBM Plex Serif, Inter, Inter Tight, JetBrains Mono, Instrument Sans, Instrument Serif, Newsreader, Fraunces, Source Serif 4, Space Grotesk, Manrope, DM Sans, Figtree, Onest, Bricolage Grotesque, Nunito (each by its own authors, named in its license) | SIL OFL 1.1 (each checked on npm 2026-09-29) | Listed in `skills/jal-design-system/references/typography.md`. Never vendored in this plugin or its template: `scripts/assets/fonts.ts` fetches the Fontsource build from the npm registry into the client project only, refuses anything that is not OFL 1.1, and writes each family's license as `OFL.txt` plus a row in `FONTS.md` (family, version, license, source) |

## Remotion

[Remotion](https://www.remotion.dev) is used as the core motion engine (Brian, 2026-10-01), as runtime packages installed into client projects through the opt-in video module (`templates/modules/video`). No Remotion source is copied into this plugin. The knowledge in `skills/jal-remotion/references/` is restated in JAL's own words from the Remotion docs (read 2026-10-01, Remotion 4.0.532); Remotion's official agent skills carry no license file and are distilled, never vendored.

- **License.** `remotion`, `@remotion/player`, `@remotion/web-renderer`, `@remotion/cli`, `@remotion/renderer`, and most other `@remotion/*` packages are under the [Remotion License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md): source-available, not OSI open source. A few helper packages are MIT (for example `@remotion/paths`, `@remotion/shapes`, `@remotion/noise`, `@remotion/layout-utils`, `@remotion/preload`, `@remotion/media-utils`, `@remotion/gsap`); `interpolate()` and `spring()` from `remotion` stay under the Remotion License.
- **Free tier conditions.** The Free License covers individuals and organisations of up to 3 people, commercial use and automations included. JAL is 3 people (2 developers and 1 AI specialist) and every project is internal, with no external clients, so the free tier applies, and JAL declares it with `licenseKey: 'free-license'` where an API asks. A Company License is required when the total people who own, control, or directly use the Remotion code of a project reach 4 or more; from Remotion 5.0 contractors count, and a client who receives the source counts too. The plugin warns and stops when a 4th team member or an external client appears. Not allowed under any tier: selling or relicensing Remotion or a derivative, and a rendering service that runs user-supplied Remotion code.
- **Telemetry.** In-browser rendering sends one event per render to remotion.pro (page origin, success, the visitor's IP address, no video content). JAL uses it freely in internal tools and dev pages, and on a public page only when the feature is needed, with an inline notice before export and a privacy-policy line.
- **Paid items** (the cube transition, the Editor Starter, paid templates, the Timeline component) are not used unless Brian buys them.

| Component | License | Used for |
|---|---|---|
| [Mediabunny](https://github.com/Vanilagy/mediabunny) (Vanilagy) | MPL-2.0 | Media reading, frame extraction, and conversion inside `@remotion/media` and `@remotion/web-renderer`, pinned to the version Remotion pairs with; it replaces the deprecated `@remotion/media-parser` and `@remotion/webcodecs`, which are never installed. MPL-2.0 is file-level copyleft: changes to Mediabunny's own files would be shared under MPL-2.0; JAL uses it unmodified |
| [FFmpeg](https://ffmpeg.org) as bundled by `@remotion/renderer` and the CLI | GPLv2 or later (with x264 and x265) | Only on the headless render paths (the local CLI, a render service, Lambda), each of which needs Brian's confirmation per project. The default in-browser path uses WebCodecs and ships no FFmpeg. Never redistribute an app or Docker image that contains the bundled FFmpeg without meeting the GPL duties (source offer, license text). H.264, HEVC, and AAC may also need patent licenses depending on use and country |
| Chrome Headless Shell (Chromium) | BSD-3-Clause and its third-party licenses | Downloaded by the headless render paths only, never in the default path |
| Remotion SFX (`@remotion/sfx`) and other sound | Per sound | CC0 sounds only by default, each listed with its source |

## Poly Haven

[Poly Haven](https://polyhaven.com) models, HDRIs, and textures are CC0 (public domain dedication), approved by Brian (2026-09-29). `scripts/assets/polyhaven.ts` fetches them into client projects only, at build time, checks the license before writing anything, and writes an `ASSETS.md` beside them (id, type, resolution, source URL, CC0, authors, date). No Poly Haven asset is mirrored into this plugin or its template, and the client app serves its own copy (never a runtime fetch from Poly Haven).

## OriginKit

[OriginKit](https://www.originkit.dev) is a paid, closed component library, approved by Brian and connected through its MCP server (`mcp.originkit.dev`). Components are fetched on demand into client projects under JAL's account and never vendored into this plugin or its template, per OriginKit's license. The `ok.*` recipes in JAL are clean-room technique notes written in JAL's own words.

## noyzzi

[noyzzi.com](https://noyzzi.com) by Ileana Marcut ([Creative Glue Lab](https://creativegluelab.com)) is credited as a source of hero sections, hover effects, and 3D elements. JAL ships only an index of item names and URLs (`mcp/jal-design/noyzzi-index.json`). At build time the `noyzzi_get` tool fetches an item's prompt or code from the live site, exactly as the site offers it to a visitor. Nothing from noyzzi is vendored in this repository.

## Icons

koboyo (primary) and [reicon.dev](https://reicon.dev) (fallback), under their own terms.
