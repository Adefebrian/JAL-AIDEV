# JAL frame core

A frame-driven composition model, played live in the browser. The idea comes from Remotion (a picture is a pure function of a frame number); the code is JAL's own, in `templates/monorepo/packages/ui/src/frames/`, with zero dependencies beyond React.

Never install Remotion or `@remotion/*`. Its renderer needs webpack (or Rspack), Node, and a downloaded Chromium, and it carries a company license. The guard hook bans it. Nothing here needs it. Remotion is source-available, not open source: JAL takes ideas only, never its code or API. Anything below marked **proposed** is a contract the JAL core should follow but does not export yet; the code change sits outside the reference docs.

## 1. When to use it

From: remotion (idea only: frame-driven compositions), JAL-authored.

| Need | Tool |
|---|---|
| A self-contained "video": product demo, feature walkthrough, animated explainer, with a fixed timeline, play, pause, and scrub | frame core `Player` |
| The same piece advanced by scroll instead of time | frame core `Composition` with `frame` from a ScrollTrigger (section 6) |
| Real product components acting out a short scripted demo | `gsap.live_dom_demo` (section 8) |
| A few static screens told as steps | `frame.poster_steps` (section 9) |
| Motion on real page elements, entrances, pins, horizontal tracks | GSAP, per `scroll-choreography.md` |
| Component state changes, layout, exit | Framer Motion or CSS, per `jal-motion` |

Why frames for demos: every frame is reproducible, so scrubbing is exact, the reduced-motion poster is a real frame, and QA can screenshot frame 0, the midpoint, and the poster deterministically.

## 2. API

From: remotion (ideas only, rebuilt natively), Threejs-Awesome-Graphics-Agent-Skills (phased travel, monotone value tracks), JAL-authored.

Everything is exported from `@<app>/ui` (via `packages/ui/src/frames/index.ts`).

### Config

```ts
interface VideoConfig { fps: number; durationInFrames: number; width: number; height: number }
```

`width` and `height` are the authoring canvas in composition pixels. `durationInFrames` is an integer of 1 or more; frames run `0` to `durationInFrames - 1`. `validateVideoConfig(config)` throws on a bad config.

**Duration from data.** When length depends on content (step count, the last caption's end, a clip's length), compute `durationInFrames` from that data before mounting the Player, with `Math.ceil(seconds * fps)`, and memoize it. Never infer it by running frames until the scene goes empty. A fetched source aborts its stale request (`AbortController`) when inputs change, and the section shows the poster image until the length is known.

### Surfaces

- `<Composition {...config} frame={n} component={Scene} inputProps={...} />` renders one frame on a stage that keeps the aspect ratio and scales the authored canvas to the container width (`fitScale(containerWidth, width)`, exported for tests and layout math). No clock. `children` works in place of `component`. Width fit only: a `fit="contain"` mode (scale by `min(containerWidth / width, containerHeight / height)`, centred) for fixed-height heroes and fullscreen is **proposed**.
- `<Player {...config} label="..." component={Scene} />` is a Composition plus a clock and controls. Props:
  - `label` (required): accessible name of the player group.
  - `autoPlay` (default false): never honored under reduced motion.
  - `loop` (default false).
  - `controls` (default true): `false` is ignored when an autoplaying piece runs longer than 5 seconds, because jal-motion requires a pause control there.
  - `posterFrame` (default the last frame): the reduced-motion still.
  - `initialFrame` (default 0).
  - `icons`: `{ play, pause }` nodes from koboyo or reicon. Text labels are used when omitted.
  - `onEnded`, `className`.
- `<FrameProvider frame config>`: the low-level context both surfaces use. Use it directly only to embed a frame in custom chrome.

### Hooks

- `useCurrentFrame()`: the frame, local to the nearest `Sequence`.
- `useVideoConfig()`: the composition config (not the Sequence window).
- `usePrefersReducedMotion()`: live media query; the server snapshot is `true`, so server output is always the poster.

Both frame hooks throw a clear error outside a Composition or Player.

- **The frame changes across a Sequence boundary.** Moving a component that calls `useCurrentFrame()` into or out of a Sequence changes what it sees. Anything that must run on one continuous clock across scenes (a progress indicator, a caption track, a counter across cuts) reads the frame once in the parent and takes it as a prop. When extracting a block into its own scene, compare its timings before and after: a timing that only lined up by coincidence is the usual off-by-offset bug.
- **Measuring under the stage scale.** Inside the stage, `getBoundingClientRect()` returns scaled sizes: divide by the scale, or read `offsetWidth` and `offsetHeight`, which ignore transforms. No hook exposes the live scale yet (a `useStageScale()` is **proposed**); until then compute it with `fitScale(stage.clientWidth, width)`. Measure in a layout effect after fonts are ready, and memoize any measurement that feeds motion, or scrubbing jitters.

### Time structure

- `<Sequence from={30} durationInFrames={60} name="intro">`: children render only while the parent frame is in `[from, from + durationInFrames)` and see a local frame starting at 0. Nested Sequences subtract each `from`. `layout="fill"` (default) wraps children in an absolutely filled layer; `layout="none"` adds no wrapper.
- `<Series>` with `<Series.Sequence durationInFrames={n} offset={k}>` children plays scenes end to end. A negative `offset` overlaps a scene with the previous one (for a crossfade); a positive one leaves a gap. Only the last item may be infinite.
- Pure helpers for layout math and tests: `sequenceFrame(parentFrame, from, duration)` (local frame or `null`), `seriesOffsets(items)` (start frames).
- **Durations are constants.** Export each scene's duration next to the scene, and compute the parent's `durationInFrames` as the last start from `seriesOffsets(items)` plus the last duration (offsets already subtract overlaps), never a typed total. A mismatch truncates the last scene or leaves blank trailing frames. A `seriesDuration(items)` helper and a development assert that the last item ends inside the composition are **proposed**.
- **Not in the core** (each **proposed**, section 13): per-Sequence `trimBefore` and `trimAfter`, `loop`, `playbackRate`, a `Freeze` that holds a subtree on one frame, config overrides (a 390 by 844 phone scene nested in a 1280 by 720 piece), and `premountFor`. Do not write them as if they exist.

### Motion math

- `interpolate(frame, inputRange, outputRange, { extrapolateLeft, extrapolateRight, easing })`
  - ranges: same length, at least 2, input strictly increasing, all finite. Violations throw.
  - extrapolation per side: `"extend"` (default, continues the edge segment's line), `"clamp"` (holds the edge value), `"identity"` (returns the input).
  - `easing` shapes progress inside each segment only; extension beyond the range stays linear, so values never curl back.
  - In compositions, clamp both sides unless you mean to extend. `{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }` is the normal case.
  - One `easing` applies to every segment. For JAL's asymmetric envelope (in on `Easing.jal`, hold, out on `Easing.jalExit`), write one clamped two-point call per phase and pick by frame. An easing array (one function per segment, length checked) is **proposed**.
- **Perceptual scale.** A linear scale push feels like it slows as it grows. Interpolate the logarithms and exponentiate: `Math.exp(interpolate(frame, [0, 18], [Math.log(1), Math.log(2.2)], clamp))`. Every output must be above zero, so a scale-in starts at 0.01, not 0. Use it for shot-size pushes (showcase.md "Shot-size language").
- **Posterize** for an intentional stepped look (a ticking counter): quantize before use, `const f = Math.floor(frame / n) * n` with n of 2 or 3 at 30fps, then feed `f` to `interpolate` or `spring`. A per-element choice, never the default, and within the flash limits of jal-motion SKILL.md section 5.
- **Colour over frames.** The core has no colour interpolation (an OKLab `interpolateColors` over resolved tokens is **proposed**). Today, stack two layers on their tokens and crossfade opacity. Never a gradient, never a hue sweep.
- `Easing`: `jal` (the `--ease-standard` curve, entrances), `jalExit` (the same curve time-reversed, exits), `linear` (constant-speed loops only), `bezier(x1, y1, x2, y2)`, `in`, `out`, `inOut`, `poly(n)`, `quad`, `cubic`, `sin`, `circle`, `exp`. There is no bounce, elastic, or back easing: overshoot is banned.
- `spring({ frame, fps, config, from, to, delay, durationInFrames })`
  - Closed-form damped oscillator: no accumulated state, same frame gives the same value, backward scrubbing is exact.
  - Default `JAL_SPRING` is critically damped (`damping 20, stiffness 100, mass 1`) with `overshootClamping: true`, so it never passes `to`.
  - Returns `to` exactly once settled. `durationInFrames` stretches time so it settles on that frame. `delay` holds `from` until it passes.
  - `measureSpring({ fps, config })` gives the settle frame, for sizing a Sequence.
- **Phased travel** (slow start, push, settle) chains constant-speed, constant-acceleration, and constant-deceleration phases solved so position and speed stay continuous. With normalised distance, slow distance `s0` over `t0`, speed `v0 = s0 / t0`, acceleration `a = (1 - s0 - v0 * (ta + 0.5 * td)) / (0.5 * ta * (ta + td))`, peak `v0 + a * ta`, deceleration `peak / td`. Evaluate each phase analytically from the frame so scrubbing stays exact, and derive later phase boundaries from the durations in code so one changed duration cannot desynchronise the rest.
- **Value tracks** for any keyed value use monotone cubic Hermite interpolation (Fritsch-Carlson), never a natural cubic (it overshoots) (`procedural-geometry.md` section 3).
- `createFrameClock({ fps, durationInFrames, loop, onFrame, onEnded })`: the Player's clock, exported for custom surfaces, with `frameAtElapsed` and `clampFrame` as its pure parts. Driven by elapsed time (`performance.now()` deltas), never by counting rAF callbacks: a 120Hz display, a dropped frame, or a throttled tab all land on the right frame, and `onFrame` fires only when the integer frame changes.

## 3. Authoring a composition

From: remotion (ideas only), JAL-authored.

```tsx
import { Easing, Sequence, Series, interpolate, spring, useCurrentFrame, useVideoConfig } from "@app/ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function Headline() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.jal });
  const y = interpolate(frame, [0, 12], [24, 0], { ...clamp, easing: Easing.jal });
  return <h2 style={{ opacity, translate: `0 ${y}px` }}>Approvals in one tap</h2>;
}

function Card() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps }); // critically damped, no overshoot
  return <div className="bento-item" style={{ opacity: s, scale: `${0.96 + 0.04 * s}` }}>...</div>;
}

export function ApprovalDemo() {
  return (
    <div style={{ width: "100%", height: "100%", background: "var(--color-surface)" }}>
      <Series>
        <Series.Sequence durationInFrames={45} name="hook"><Headline /></Series.Sequence>
        <Series.Sequence durationInFrames={90} name="card"><Card /></Series.Sequence>
      </Series>
    </div>
  );
}
```

Rules:

- **All motion derives from the frame.** No CSS `transition`, no `@keyframes`, no WAAPI, no GSAP, no Framer Motion inside a composition: each runs on its own clock and breaks scrubbing, pausing, and the poster. The stage CSS switches transitions and animations off inside `.frames-stage` as a backstop, but do not rely on it; write `interpolate` or `spring`. Tailwind's `transition-*`, `duration-*`, `ease-*`, `delay-*`, and `animate-*` utilities are the same bug: an audit grep fails those prefixes in any file importing from the frames core. Static utilities (layout, spacing, colour tokens) stay allowed.
- **Libraries with their own clock** are switched to absolute setters. Turn off internal tweens, fades, damping, and autoplay (map `flyTo` easing, drei `CameraControls` smoothing, three `AnimationMixer`, a `<video>`'s own playback), then set the state every frame from values derived from the frame: `setLookAt(..., false)`, `mixer.setTime(frame / fps)`, `video.currentTime`. Acceptance test: scrub back three frames and forward again, and the picture matches exactly.
- **Pure render.** No `Math.random()`, `Date.now()`, timers, or state that accumulates across frames. The same frame must always paint the same picture. If something must vary, hash a stable key (`dot-${i}`, never the frame unless the value should change per frame) to [0, 1). The core exports no seeded helper (a `random(seed)` is **proposed**), so keep this one in the scene file:

  ```ts
  // FNV-1a over the key, mapped to [0, 1): same key, same value, every frame and machine.
  const seeded = (key: string) => { let h = 2166136261; for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };
  ```
- **Transform and opacity** carry the motion, same as the rest of JAL. When several transform values animate on one element, use the separate `translate`, `scale`, and `rotate` properties, each from its own interpolate call, as the example does; a concatenated `transform` string lets a later edit reorder or drop part of the chain. Keep `transform` for skew, perspective, and order-sensitive chains.
- **Timings come from tokens.** At 30fps, `--dur-200` is 6 frames, `--dur-400` is 12, `--dur-600` is 18; staggers are 0.6 (char), 1.2 (word), 2.4 (line), 1.8 (item) frames. Round once, where a beat is defined, never in the render path: durations `Math.ceil(seconds * fps)` so nothing is cut short, window starts round down and window ends round up so a trimmed window always contains its moment.
- **Triggered phases.** When one driver reaches many items (a line passing chart points, a cursor passing rows), compute each item's trigger frame from where the driver reaches it, then run the item's own phases on constant durations from that trigger (outline 0.8s, fill 0.4s, label 0.3s, each rounded to frames). Never slice the driver's progress into item animations, or long items rush and short ones crawl. Length is then the latest trigger plus its phases plus a hold of at least 1.2s on the final state.
- **Crops and reveals.** Crop with `clip-path: inset(top right bottom left)`, each edge a percentage from interpolate on `Easing.jal`, a hard edge with no gradient mask, within 18 frames at 30fps. Never stack a crop and another clip-path on one element; nest a wrapper.
- **JAL law inside the canvas.** White-first surface, tokens only, no gradient, glow, shadow, emoji, or em dash, one thing moving at a time. The showcase disciplines in `skills/jal-motion/references/showcase.md` (shot sizes, camera follows the click, anti-slide checks) apply.
- **One scene per component and file** for multi-scene pieces. `Series` composes them. Each scene also previews alone on a dev-only route (for example `/dev/frames/<scene>`) in its own Player with the same width, height, fps, and props it has inside the parent, and a duration reaching at least the highest frame the parent shows, so it can be scrubbed and screenshot-tested in isolation (section 14).
- **Safe area.** Key text and the focal UI stay inside about 7.5% of the authored width at each side and 9% of the height at top and bottom (80px and 100px on a 1080-wide piece). The stage's rounded corners and the mobile scale-down eat the edges first. A dev toggle outlines the safe area on the stage.
- **Readable at the smallest width.** The canvas scales by `containerWidth / width`. Rendered text size is `authored size * scale`. A 1280-wide composition in a 343px mobile column scales to 0.27, so 16px rendered text needs about 60px authored. Authored floors on top of that: a headline at least 84px and key supporting text at least 44px on a 1080-wide piece (about 100px and 52px at 1280). When either check fails at 343px, ship a portrait composition (for example 720 by 960) and pick it below 640px with a media query.
- **Fitting text.** To fit a headline to a box, measure once with a 2D canvas context set to the exact rendered family, weight, size, and letter-spacing (`measureText(text).width`), scale the size linearly to the target width, cap it at the type-scale maximum, and cache by text plus font string. Measure only after fonts load. Debug boxes use `outline`, never `border`, so they do not change the layout being measured. If the copy still overflows at the floor size, the copy is too long; do not shrink further.
- **Pointer input inside the stage.** For an interactive composition, divide pointer deltas by the stage scale to get authored pixels, and divide outline and handle stroke widths by it so they stay 1px on screen. Stop propagation on a handled `pointerdown`, ignore non-primary buttons, and put `user-select: none` plus a scoped `touch-action` on draggable parts (`r3f.md` section 6). Render the selected item's outline last so its handles sit on top.
- **Real text stays real.** Compositions are DOM, so text is selectable and indexable. Still put the demo's point in a visible caption next to the Player: the canvas content changes per frame and is not a substitute for a text equivalent.

## 4. Product demo "videos" played live

From: remotion (ideas only), ai-dev-kit (captions for real video, A11Y-12), JAL-authored.

```tsx
<figure>
  <Player
    label="Invoice approval demo"
    component={ApprovalDemo}
    fps={30}
    durationInFrames={450}
    width={1280}
    height={720}
    autoPlay
    loop
  />
  <figcaption>Approve an invoice in three steps: open, review, approve.</figcaption>
</figure>
```

What the Player guarantees:

- Controls sit below the stage, never over it. Play and pause is a 44px button, scrub is a 44px range input with `aria-label="Seek"` and a spoken time value, and the time readout uses tabular numbers.
- Scrubbing pauses the clock while the pointer is down and resumes if it was playing.
- The clock stops when the Player leaves the viewport (IntersectionObserver) and when the tab is hidden (`visibilitychange`). The viewer's play intent is kept and resumes on return. Autoplay therefore starts only once the Player is on screen.
- An autoplaying piece longer than 5 seconds always shows its pause control.
- Pressing play at the end of a non-looping piece restarts from frame 0.

A real `<video>` with speech or meaningful sound ships a WebVTT `<track kind="captions" srclang="en" default>` and puts its key message in visible DOM text beside it. A muted, decorative, or scroll-scrubbed video needs no captions but takes the same pause control past 5 seconds and the same reduced-motion still as a composition.

**Lazy scenes.** Load below-the-fold composition code through dynamic `import()` with `React.lazy` inside Suspense (`three-foundations.md` section 6). Create the lazy component once at module scope; creating it in render remounts the scene every render. The poster image is the Suspense fallback, so the stage is never empty.

**Picking the medium** (JEV `motion.demo_medium`). `frame_core`, this Player, fits a timed, cinematic walkthrough the viewer can play, pause, and scrub. `live_dom` (section 8) animates the real components with a GSAP timeline and is the low-confidence default; `poster_steps` (section 9) fits a story of a few states where motion adds little. All three stay crisp at any DPR, stay editable, weigh little over the wire, and need no new tech.

## 5. Poster frame and reduced motion

From: remotion (ideas only), JAL-authored.

- Under `prefers-reduced-motion: reduce` the Player shows `posterFrame` (default the last frame, the complete final state) and never autoplays. This is the same "final state first" rule the rest of JAL motion follows.
- The viewer may still press play or scrub. That is user-initiated playback, and it stops again on pause.
- Server rendering resolves reduced motion to `true`, so server HTML is always the poster; motion starts only after hydration confirms it is allowed.
- If reduced motion turns on mid-play, the Player pauses and jumps to the poster.
- Pick a poster that tells the whole story in one still: the final UI state, labels visible, nothing mid-transition. Set `posterFrame` explicitly when the last frame is an outro.
- `ui_audit`'s `reduced-motion` rule passes because a paused Player runs no rAF loop.
- A non-autoplay Player opens on `initialFrame` today. Showing `posterFrame` until the first play press, so idle, server, and reduced-motion views share one still, is **proposed** (section 13).
- **Stills, OG images, and thumbnails.** A Composition at a fixed `frame` is a still. A dev route renders the chosen frame at its authored size, and a Bun script drives puppeteer-core (CDP) to screenshot the stage element at `deviceScaleFactor` 1 (2 for retina thumbnails) after fonts and assets resolve. The same script exports the poster image, so the image always matches the live piece.

## 6. Scroll-driven compositions

From: gsap-skills (ScrollTrigger scrub and pin), remotion (idea only), JAL-authored.

A Composition takes any frame, so scroll can be the clock. Tie it to one ScrollTrigger (tier 3 only, per `motion.intensity`):

```tsx
const [frame, setFrame] = useState(DURATION - 1); // poster until motion is confirmed
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
    if (ctx.conditions!.reduce) return;
    ScrollTrigger.create({
      trigger: scope.current, start: "top top", end: "+=200%", pin: true, scrub: true,
      onUpdate: (st) => setFrame(Math.round(st.progress * (DURATION - 1))),
    });
  });
}, { scope });
return <section ref={scope}><Composition {...config} frame={frame} component={Story} /></section>;
```

The pin rules in `scroll-choreography.md` section 2.2 apply (JEV `motion.pin`, never below 768px, `pinSpacing` stays true).

## 7. Limits

From: remotion (ideas only; its renderer is what JAL does not adopt), JAL-authored.

- **No MP4 export.** The frame core plays in the browser. There is no encoder, no headless render, no server-side step, and none will be added.
- **If a real file is ever needed** (social, email, store listing), and only for a composition that draws to a `<canvas>`: record that canvas in the browser, on a dev machine, never in production code:

  ```ts
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => saveBlob(new Blob(chunks, { type: "video/webm" }));
  rec.start();
  player.play(); // records in real time; stop on onEnded
  ```

  MediaRecorder captures in real time (no faster-than-realtime render) and supported containers vary by browser (Safari records MP4, Chromium records WebM). DOM compositions cannot be captured this way. Ship the result as a static file in a plain `<video>` with a poster, `muted`, a pause control, and no autoplay under reduced motion.
- **Audio** is out of scope. A demo that needs narration is a real video, produced outside the app, or silent with on-screen captions (section 12).
- **Heavy scenes.** Every frame re-renders the scene tree. Keep compositions to tens of elements, memoize static subtrees, and move particle-scale work to a canvas or R3F scene driven by the same frame value (section 10). The Composition calls `createElement(component, inputProps)` on every render, so memoize `inputProps` and `icons` at the call site with `useMemo`; a fresh object each render rebuilds the tree even when the frame has not changed.

## 8. Demo medium build: gsap.live_dom_demo (live_dom)

From: gsap-skills (timeline control, `useGSAP`, matchMedia), JAL-authored (JEV `motion.demo_medium` criteria, demo law).

The real product components (JAL Core, the same React components the app ships, never screenshots or a video) act out a scripted demo on a marketing or immersive page, driven by one GSAP timeline. Recipe `gsap.live_dom_demo`: class 2 G (3 Q when scrubbed by a pinned ScrollTrigger), cost T3, surfaces M and I. Never on product UI routes: the demo is a picture of the product, not the product.

- **Script the states as data**, for example `[{ label: "empty" }, { label: "row-added" }, { label: "approve-pressed" }, { label: "approved" }]`, with a hold of at least 1.2s on each readable state and on the final one. Derive the current step from `tl.time()` against the labels in `onUpdate`, idempotently, so scrubbing backward restores earlier states; never rely on one-shot callbacks to flip React state.
- **Build once, drive it.** Create the timeline in `useGSAP` with a scope ref, `paused: true`, store it in a ref, and drive it with `play()`, `pause()`, `progress(p)` (`scroll-choreography.md` sections 1.5 and 6). GSAP moves only `transform` and `autoAlpha` on wrappers around the components. The components keep their own CSS state layers when played, but a scrubbed demo sets `transition: none` inside its root so the picture matches scroll position.
- **Played or scrubbed.** Played: autoplay only once on screen, loop allowed. Scrubbed: one pinned ScrollTrigger with `scrub: true`, under JEV `motion.pin` and the pin rules of `scroll-choreography.md` section 2.2; below 768px it becomes the played variant, never a pin.
- **Pause control.** A visible 44px button (koboyo or reicon icon plus an accessible label) below the demo toggles `tl.paused()`. It always ships for the played variant (JAL requires it past 5 seconds, and a looping demo always passes that). It sits outside the inert demo root.
- **Pauses offscreen** (ScrollTrigger `onToggle` or an IntersectionObserver) and in a hidden tab (`visibilitychange`), keeping the viewer's play intent, as the Player does (section 4).
- **Accessibility.** The demo root carries `inert` and `aria-hidden="true"`, so fake controls never take focus or read as real ones. A DOM text equivalent (a figcaption or list naming each step) carries the message.
- **Reduced motion**: no timeline (`gsap.matchMedia`, `scroll-choreography.md` section 5). Render the final state as a static poster, labels visible, nothing mid-transition. Server HTML renders that same final state.
- **Mobile**: the same demo and timeline at the same scale rules; only the pin drops.
- **Fake data only.** Props come from a fixture file with invented names and amounts. No network calls, no product API, no real customer data.
- Choose the frame core instead (section 4) when the viewer should scrub a longer, timed walkthrough with a play and seek bar.

## 9. Demo medium build: frame.poster_steps (poster_steps)

From: JAL-authored (JEV `motion.demo_medium` criteria).

A short sequence of static authored screens (posters), each with a step caption. Recipe `frame.poster_steps`: class 1 E, cost T1 (small vanilla JS or one React state), surfaces P, M, and I, law full. Use it when the story is a few states and motion adds little.

- **Screens.** 3 to 6 posters, each a still of the real UI with fake data: an exported image (dimensions reserved, WebP or AVIF) or a static JAL Core render with no motion of its own. Each has a visible caption in DOM text: step number, a short title, one line of explanation. Image `alt` repeats the caption's point.
- **Advancing.** By the visitor: 44px previous and next buttons plus 44px step targets, `aria-current="step"` on the active one, arrow keys inside the group only. By scroll: one step per scroll range through an IntersectionObserver, no pin. By a slow timer: at least 4s per step, a visible 44px pause control, paused on hover, focus, offscreen, and a hidden tab. Announce with `aria-live="polite"` only when the visitor advances, never on timer ticks.
- **Transition**: an opacity crossfade of 150ms or less (`--dur-150`) between screens stacked in one grid cell, so nothing shifts. No slide, zoom, or wipe.
- **Reduced motion**: no crossfade and no timer. All screens render stacked vertically, each with its caption: the static screens are the content.
- **Mobile**: the same component; captions sit below the screen.
- The frame core's crossfade (`Series` with a negative offset, section 2) is the alternative when the steps need timed motion inside each screen; `gsap.live_dom_demo` (section 8) when the real components should act the steps out.

## 10. Canvas and R3F inside a composition

From: remotion (idea only: 3D reads the composition frame), three.js docs (MIT) (`shadowMap.autoUpdate`, `AnimationMixer.setTime`), pmndrs docs (R3F `frameloop`, `advance`, `invalidate`), Threejs-Awesome-Graphics-Agent-Skills (static shadow cache), JAL-authored.

- **One clock: the composition frame.** A 3D scene inside a composition animates only from the frame. `useFrame` may write objects from the frame value but never integrates `delta`, and the R3F clock is never read. Shader time uniforms are `frame / fps`.
- **Pass the frame across the root.** An R3F `<Canvas>` is a separate React root; pass `frame` and `fps` in as props rather than relying on context crossing it (`its-fine` directly is an approval candidate, ask Brian).
- **Render once per frame.** `frameloop="never"` plus `advance()` in an effect on `frame`, or `frameloop="demand"` plus `invalidate()` (`r3f.md` section 3).
- **Headless Sequences in the 3D tree.** A frame-core Sequence inside the R3F tree uses `layout="none"`: the fill layout emits a `<div>`, which the R3F reconciler cannot place. Give the Canvas the composition's authored width and height so it does not depend on outer layout, and check once that `renderer.getSize()` times DPR matches the displayed (scaled) pixels, capped per `performance.md` section 2.
- **Animation clips and controls** follow the absolute-setter rule (section 3): `mixer.setTime(frame / fps)`, `CameraControls.setLookAt(..., false)`, no smoothing.
- **Static shadow cache.** For a product scene whose casters rarely move, set `renderer.shadowMap.autoUpdate = false` and `renderer.shadowMap.needsUpdate = true` only when a caster, the light, or the shadow camera changes (model load, a configurator change, a beat that moves the light). Register every moving caster with that invalidation; an unregistered animated part keeps a frozen shadow.
- **Camera moves in a composition** (with `r3f.md` section 12 and `scroll-choreography.md` section 9):
  - Drive the subject's travel and the camera's framing as two envelopes over the same progress, so the camera can lead, lag, pull out, and push back in: for example travel over 0.2 to 0.82 of the beat while camera distance keys out, hold, and in on `[0, 0.28, 0.74, 1]`. The hold honours the 1.2 to 1.5s shot hold in showcase.md.
  - Bank into turns: roll by the heading change between the look-ahead aim point and one more look-ahead further on, times a gain of about 0.6, clamped to about 7.5 degrees (0.13 rad). Roll is a vestibular trigger; reduced motion drops it with the whole move.
  - Speed budget: speed is path length over seconds, and err slow (a glide calm over 24s feels rushed in 8s). A scroll camera gets more scroll distance (`end: "+=300%"` or more) rather than a compressed path.

## 11. Media, paths, and maps inside compositions

From: remotion (ideas only), JAL-authored.

- **Image sequences** beat video where exact scrubbing matters (a rendered product rotation). Decode the frames to `ImageBitmap`s (`createImageBitmap`) before play and draw `bitmaps[Math.min(frame, n - 1)]` to one canvas per frame; never swap `<img>` sources per frame. Budget: WebP or AVIF, about 3MB total for a hero, 24 to 60 frames, half the count and resolution on mobile. The final bitmap doubles as the poster.
- **Embedded video** (a screen recording inside a demo) follows the frame: `muted`, `playsInline`, `preload="auto"`, never playing on its own. Paused or scrubbing: set `currentTime = (frame - from) / fps + trimStart` on each frame change. Playing: let it play and seek only when drift exceeds one frame. At most one video per composition.
- **Preload versus prefetch.** A large image takes a preload hint (`<link rel="preload" as="image">`, or an early `new Image()` plus `decode()`), which need not finish before play. Only small assets that must be exact at their frame are fetched fully into a Blob URL, revoked when the Player unmounts. Nothing starts prefetching once playback runs. An image counts as ready only after `img.decode()` resolves.
- **Data lines.** Give the SVG path `pathLength="1"`, `stroke-dasharray: 1`, and `stroke-dashoffset: 1 - progress` from interpolate: constant speed along the path by construction. For a line in several parts (a chart with gaps, a segmented route), measure each part once at mount (`getTotalLength()`), keep a cumulative-length table, and reveal parts in order by cumulative length, so the draw keeps one speed and never bridges a gap. Keep a tiny minimum visible length at progress 0 wherever a renderer rejects empty geometry. Real data lines only, never ornaments or underline draw-ons (`scroll-choreography.md` section 1.4). Morph only between paths with matching command structure, authored that way or prepared at build time.
- **Maps.** When a map only sets location context, use a static image plate (or R38's build-time SVG in jal-motion components) at the composition's aspect ratio and at least its rendered pixel size, with markers and labels as ordinary elements on top: smallest, fastest, fully deterministic. Place region labels at the pole of inaccessibility (the interior point farthest from the edge, found at build time by grid sampling), not the centroid, with a small per-label nudge; ship the anchors in the map JSON. A live map library is an approval candidate, ask Brian, and only when the geography must move.

## 12. Captions as on-screen narration

From: remotion (ideas only), ai-dev-kit (text equivalent next to media), JAL-authored.

JAL compositions are silent, so a caption track is the narration. Its full text also appears in the figcaption or a visually hidden transcript beside the Player.

- **Data.** One JSON file per composition of `{ text, startMs, endMs, pageBreakAfter? }` tokens, imported at build time. Times stay in milliseconds so the data survives an fps change; convert to frames only at render (`ms / 1000 * fps`). Existing SRT or WebVTT files convert to this shape in a small hand-written parser in a Bun build script, never at runtime.
- **Pages.** Group tokens with a pure helper: a new page when a token starts more than a window after the page start (about 1200ms; less for word-by-word, more for sentences) or right after `pageBreakAfter`. Two lines at most at the authored size, inside the safe area (section 3).
- **Pages as Sequences.** Each page renders in its own Sequence: `from` is the page start in frames (rounded once), and the end is the earlier of the next page's start and start plus the window. Skip pages whose span is zero or negative. The entrance (opacity over 6 frames on `Easing.jal`) is then written once against a local frame of 0.
- **Whitespace.** Tokens carry their own leading space, and the page renders with `white-space: pre` (`pre-wrap` if it must wrap), so per-token spans never collide or double-space.
- **Current word.** Absolute time is `page.startMs + localFrame / fps * 1000`; a token is current when `fromMs <= t < toMs` (half-open, so exactly one wins at a boundary). Show it by contrast only: spoken and current words in the ink token, upcoming words in the muted text token, switched as a cut. No pill, marker, colour highlight, or scale pop (showcase.md bans the word-highlight pill).
- **Component.** Captions live in their own component and file, one track per clip, rendered as the top layer of the composition.

## 13. Readiness and the Player contract (proposed)

From: remotion (ideas only), JAL-authored.

None of this is exported today; each bullet is the contract a future frame-core change follows. Until then, the workaround is stated.

- **Readiness holds.** A component that needs data, fonts, or an asset opens a labelled hold in an effect and releases it later; while any hold is open the Player does not advance and keeps its current (or poster) frame. A failed load pauses, keeps the poster, and reports through `onError` rather than hanging; each hold times out (10s default) loudly in development. Open holds in `useEffect` and release in its cleanup, never in a `useState` initializer (StrictMode runs it twice and orphans a hold). Today: mount the Player only after `document.fonts.ready`, `document.fonts.load()` for each face and weight used (only the weights used, per jal-design-system `references/craft.md`), and every asset's `decode()` have resolved, and show the poster image until then.
- **Buffering.** Time moves only when playing, in view, page visible, and ready: the viewer's intent and the system's buffering stay separate, as `inView` already does in `shouldClockRun`. On resume, re-anchor the clock on the current frame so time never jumps ahead. The loading state shows only after 300ms of continuous buffering, inside the same 44px play button with `aria-busy="true"` on the group, never over the stage, and as static text under reduced motion.
- **Premounting.** A scene mounts about one second (`fps` frames) before its `from`, hidden (`opacity: 0`, `pointer-events: none`, `aria-hidden="true"`) with its local frame held at 0, so images decode and layout measures before it shows. Fill layout only, set on the outermost scene Sequence. Holds opened while premounted count as preparing and never pause playback unless the scene reaches `from` unready. Premount at most the current and the next scene.
- **Time remaps on Sequence.** `trimBefore` and `trimAfter` (child frame `floor((parent - from) * rate) + trimBefore`), `loop` over a trimmed range (requires `trimAfter`), a positive `playbackRate` (the span becomes `durationInFrames / rate`, no reverse), a `Freeze` that holds a subtree on one frame while holds authored as data shift later `from` values, and width and height overrides for nested scenes. Each gets a pure, unit-tested mapping like `sequenceFrame`.
- **Transitions between scenes.** A transition series where both scenes are mounted during the overlap and each receives entering or exiting progress, with timing linear or from `measureSpring`, total length the sum of scenes minus every transition (two 60-frame scenes with a 15-frame transition give 105), and no transition longer than either neighbour. Presentations under JAL law: `fade` (default, opacity only), `slide` only where it signals navigation depth (jal-motion SKILL.md section 3), and `wipe` as a hard-edged `clip-path: inset()`, 6 to 12 frames at 30fps, entrance on `Easing.jal` and exit on `Easing.jalExit`. An overlay centred on a cut (a caption or title card on the surface colour, never a flash or light leak) adds no length and never sits next to a transition. Reduced motion makes every transition a cut. Today: a `Series` negative offset, with each scene computing its fade from its local frame.
- **Player API for sibling UI.** An imperative ref handle: `play()`, `pause()`, `toggle()`, `seekTo(frame)`, `getCurrentFrame()`, `isPlaying()`, `getScale()`, all through the existing clock so in-view and reduced-motion rules hold. Events beside `onEnded`, each kept in a ref so changing one never recreates the clock: `onFrame`, `onTimeUpdate` (at most every 250ms), `onPlay`, `onPause`, `onSeeked`, `onError`. Chapter lists and step indicators subscribe through the ref with `useSyncExternalStore`, so only the sibling that reads the frame re-renders, never the page.
- **Player behaviour.** `loopRange: [start, end]` (intro once, then loop the steady state; scrub still shows the whole timeline). Idle poster: a non-autoplay Player shows `posterFrame` until the first play. An error boundary around the scene that pauses, shows the poster (or the caption text) inside the stage, fires `onError`, and logs once, mirroring the Canvas boundary in `r3f.md` section 2. Space or K toggles only while focus is inside the Player group; a stage click may toggle when controls show, never stealing input from an interactive composition. Optional fullscreen: feature-detect after mount (checking in render breaks hydration), hide it where unsupported (iPhone Safari has no element fullscreen), a 44px control, and `fit="contain"` while fullscreen. A development `debug` flag logs play, pause, seek, and hold events and sets `data-buffering` and `data-ready` on the root beside today's `data-state` and `data-reduced-motion`.

## 14. Testing frame compositions

From: remotion (ideas only), JAL-authored.

- **Frame-list captures.** Because a Composition takes any frame, the standalone dev route (section 3) accepts a frame number and renders `<Composition frame={n}>`. A Bun script driving puppeteer-core waits for fonts and assets, then screenshots a frame list: 0, each scene's start and midpoint, and the poster, at 375 and 1280 widths. Capture one mid-piece still first to check framing and legibility before the full list, and add a short consecutive run around any camera or path move, since single stills cannot show jitter. A `window.__frames = { ready, seek }` hook on Player pages is **proposed**; the canvas capture rules are `performance.md` section 6.2.
- **Scrub determinism.** For each captured frame, seek away and back and compare pixels: any difference is an unpure render or a library clock left running (section 3).
- Pure helpers (`sequenceFrame`, `seriesOffsets`, duration sums, caption paging, the seeded hash) get `bun test` unit tests with frozen outputs.
