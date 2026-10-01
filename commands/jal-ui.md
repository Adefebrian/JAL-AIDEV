---
description: Design and build any screen, website, or video, a new screen, a redesign, an immersive 3D site, or an MP4 made with Remotion, beautiful, tidy, mobile-first, and checked automatically.
argument-hint: <what to build, or which screen or site to redesign>
---

What to work on: $ARGUMENTS

## What this does

One command for everything visual, across the whole range. Remotion is the core motion: when a part of the page needs composed motion (a product intro, a hero motion piece, a data story, a product demo, an explainer), JEV picks Remotion first and combines it with the supplements that fit (kit motion for small interactions, Lenis and GSAP for smooth scroll and pins, Three.js for 3D, noyzzi, Magic UI, Animata, and OriginKit for signature effects). A page with no motion installs nothing extra. The JEV judge places your brief on the spectrum:
- **modern**: a clean, calm site or app screen.
- **modern with motion**: the same, plus accents such as Lenis smooth scroll, GSAP or Framer Motion reveals, text motion, and Remotion motion pieces played live or scrubbed by scroll.
- **modern with immersive moments**: a mostly calm site with one to three immersive sections, such as a 3D hero, a pinned scroll story, or a noyzzi piece.
- **fully immersive**: the whole story told through 3D, WebGL, shaders, and scroll storytelling.

Then JEV decides section by section how much motion each part gets and which engine moves it, so one page can mix levels.

**Video requests** (an MP4, a social cut, a captioned clip, an explainer video) use Remotion directly, with no question. The video is rendered in your browser by default, with no server and no headless Chrome; any other way of rendering it asks Brian first. Its frames are sampled and checked before it is handed over.

Then it:
1. On a redesign, it checks the current screen first and lists what is wrong before changing anything.
2. It explores several creative directions for your audience, lets JEV screen them, and commits to one fresh direction instead of the obvious first idea.
3. On immersive pages and pages with immersive moments, it first writes the concept: your product's core idea turned into one signature moment you can see on the first screen. For a desk lamp, the page is actually lit by the lamp, and the light's warmth and pool change as you scroll or drag. This moment is required, and JEV checks that it is tied to what the product does, visible straight away, and buildable.
4. It plans every section: its purpose, one message, and one action. Sections without a purpose are left out. Every screen gets one bold layout idea, never just a heading, a paragraph, and some cards. For each section JEV decides whether it belongs, how to lay it out, and how much motion it gets. For immersive sections JEV picks from the whole library, offered options from at least four different sources, and may layer as many as fit:
   - noyzzi heroes, effects, and 3D objects
   - three.js scenes, shaders, and particles, nixie-fx and Rapier
   - Magic UI, Animata, and OriginKit motion
   - GSAP scroll stories
   - Remotion compositions (transitions, text, data, captions, effects)
   - Material components and hallmark craft
   - live product demos
5. It builds phone first with a real app-shell, then tablet, then desktop, on the one JAL design system: white background, nothing overlapping, and 44px controls. Outside noyzzi sections there are no shadows, gradients, or side lines. 3D objects are properly modeled and lit, never plain primitive shapes. For 3D, a still poster shows first, motion calms down for people who ask for reduced motion, and heavy effects scale down on slower phones. Independent sections are built at the same time.
6. It proves the result with the automatic UI check at phone, tablet, and desktop widths (33 rules, including blank screens, stuck reveals, and tidiness: spacing scale, even gaps, card proximity, radius scale, section rhythm, even tone bands, no stray seams, no repeated composition, headline measure, no boxed hero, no dead space) and real per-screen screenshots. For 3D it also runs a frame-speed check.
7. A fresh critic that did not build the page looks at every screenshot and scores it on seven points: first-screen impact, signature moment, hierarchy and type, composition and rhythm, craft and detail, how well the mix holds together, and whether it smells like a template. A low score sends back concrete fixes per screen, up to three rounds. The builder never approves its own work.
8. It reports what it built, each decision with its confidence, where each effect came from, the check results, and the critic's scores.

Examples:
- `/jal-ui a settings screen for team members and roles`
- `/jal-ui redesign the pricing page`
- `/jal-ui an immersive landing page for Halo, a smart desk lamp, with a 3D lamp hero`
- `/jal-ui a 20 second product intro video for Halo, 9:16, with captions`

## Run it

1. JEV `ui.experience` places the brief on the spectrum: `modern`, `modern_motion`, `modern_immersive`, or `immersive`.
1b. A video request skips the spectrum for its file part: run the `video` playbook (`jal-orchestration` `references/video.md`, skill `jal-remotion`), with `motion.engine` `remotion` by precheck and `video.render_path` before any render (`web_renderer` by default; any other path asks Brian). A page that also needs a section continues below.
2. Dispatch `jal-ux` for `modern`, `modern_motion`, and `modern_immersive`, or `jal-immersive` for `immersive`. Each runs its pipeline from `agents/jal-ux.md` or `agents/jal-immersive.md` with no step skipped. jal-ux hands any single section that earns immersion (`imm.gate`) to jal-immersive.
2b. Motion per section: `motion.intensity`, then `motion.engine` (Remotion first for composed timeline motion, `kit_css` for micro-interactions by precheck), then `motion.remotion_recipe` for a Remotion section (`rm.*` candidates from at least 3 families). Builders read skill `jal-remotion` whenever a section needs motion.
3. For a multi-section page, once the section concepts are written, the lead agent splits the sections into owned files and builds them in parallel per the `jal-orchestration` engine.
4. It then integrates the sections and runs `ui_audit` at 320, 375, 414, 768, and 1280 until PASS (`SKIPPED` is never a pass).
5. **Ambition floor** (`modern_immersive` and `immersive`, binding from step 2 on, full text in `jal-immersive` SKILL section 3): before any section is built, a one-paragraph concept with one required signature moment passes JEV `imm.concept`; every section's candidates come from at least 4 source families, never only the three safest; 3D uses real modeled forms, PBR with environment lighting, contact shadows or AO, color management and tone mapping, and lighting that tells the product story (a raw primitive hero is a FAIL); a deliberate display scale and one bold compositional idea per screen, no screen that is only a heading plus a paragraph plus cards.
6. **Fresh-eyes critic gate** (every mode, and any public page; `jal-orchestration` step 6b, `jal-design-system` `references/craft.md` section 12). The dispatcher, never the builder:
   - runs `ui_shots` on the served build (375 and 1280, `webgl: true` for canvas pages) and keeps the image paths;
   - dispatches a fresh critic (jal-reviewer in critic mode, or a newly spawned jal-ux; never the agent that built it) with only the brief, the direction contract, and the images;
   - the critic Reads every image and scores first-screen impact, signature moment, hierarchy and typography, composition and rhythm, craft and detail, coherence of the mix, and template smell, 0 to 3 each. Any 0, or a total under 15 of 21, is FAIL with concrete fixes per screen, and the disposition is `fix`; on PASS it answers `ui.finish_disposition` with the scores as `evidence.critic`;
   - fixes go back to the builder as one batch, then a new critic judges the recapture. At most three fix rounds; after that, report honestly what remains.
   The builder never answers `ui.finish_disposition` and never self-approves the finish.

Report back, tersely:
- the mode and lead agent
- the direction, the concept and its signature moment, and the section concepts
- each JEV decision with its confidence and the action taken (stamp `UNVERIFIED BY JEV` where it applies)
- the recipe and source for each immersive section, and the source families offered
- the files changed
- the `ui_audit` result per width, and the frame-time sample for 3D
- for a video: the render path, the MP4 probe line, and the sampled frames
- the critic's rubric scores and total for every round, the final `ui.finish_disposition`, and any fixes still open
- build and test status
