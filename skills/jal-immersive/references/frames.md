# JAL frame core

A frame-driven composition model, played live in the browser. The idea comes from Remotion (a picture is a pure function of a frame number); the code is JAL's own, in `templates/monorepo/packages/ui/src/frames/`, with zero dependencies beyond React.

Never install Remotion or `@remotion/*`. Its renderer needs webpack (or Rspack), Node, and a downloaded Chromium, and it carries a company license. The guard hook bans it. Nothing here needs it.

## 1. When to use it

| Need | Tool |
|---|---|
| A self-contained "video": product demo, feature walkthrough, animated explainer, with a fixed timeline, play, pause, and scrub | frame core `Player` |
| The same piece advanced by scroll instead of time | frame core `Composition` with `frame` from a ScrollTrigger (section 6) |
| Motion on real page elements, entrances, pins, horizontal tracks | GSAP, per `scroll-choreography.md` |
| Component state changes, layout, exit | Framer Motion or CSS, per `jal-motion` |

Why frames for demos: every frame is reproducible, so scrubbing is exact, the reduced-motion poster is a real frame, and QA can screenshot frame 0, the midpoint, and the poster deterministically.

## 2. API

Everything is exported from `@<app>/ui` (via `packages/ui/src/frames/index.ts`).

### Config

```ts
interface VideoConfig { fps: number; durationInFrames: number; width: number; height: number }
```

`width` and `height` are the authoring canvas in composition pixels. `durationInFrames` is an integer of 1 or more; frames run `0` to `durationInFrames - 1`.

### Surfaces

- `<Composition {...config} frame={n} component={Scene} inputProps={...} />` renders one frame on a stage that keeps the aspect ratio and scales the authored canvas to the container width. No clock. `children` works in place of `component`.
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

### Time structure

- `<Sequence from={30} durationInFrames={60} name="intro">`: children render only while the parent frame is in `[from, from + durationInFrames)` and see a local frame starting at 0. Nested Sequences subtract each `from`. `layout="fill"` (default) wraps children in an absolutely filled layer; `layout="none"` adds no wrapper.
- `<Series>` with `<Series.Sequence durationInFrames={n} offset={k}>` children plays scenes end to end. A negative `offset` overlaps a scene with the previous one (for a crossfade); a positive one leaves a gap. Only the last item may be infinite.
- Pure helpers for layout math and tests: `sequenceFrame(parentFrame, from, duration)` (local frame or `null`), `seriesOffsets(items)` (start frames).

### Motion math

- `interpolate(frame, inputRange, outputRange, { extrapolateLeft, extrapolateRight, easing })`
  - ranges: same length, at least 2, input strictly increasing, all finite. Violations throw.
  - extrapolation per side: `"extend"` (default, continues the edge segment's line), `"clamp"` (holds the edge value), `"identity"` (returns the input).
  - `easing` shapes progress inside each segment only; extension beyond the range stays linear, so values never curl back.
  - In compositions, clamp both sides unless you mean to extend. `{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }` is the normal case.
- `Easing`: `jal` (the `--ease-standard` curve, entrances), `jalExit` (the same curve time-reversed, exits), `linear` (constant-speed loops only), `bezier(x1, y1, x2, y2)`, `in`, `out`, `inOut`, `poly(n)`, `quad`, `cubic`, `sin`, `circle`, `exp`. There is no bounce, elastic, or back easing: overshoot is banned.
- `spring({ frame, fps, config, from, to, delay, durationInFrames })`
  - Closed-form damped oscillator: no accumulated state, same frame gives the same value, backward scrubbing is exact.
  - Default `JAL_SPRING` is critically damped (`damping 20, stiffness 100, mass 1`) with `overshootClamping: true`, so it never passes `to`.
  - Returns `to` exactly once settled. `durationInFrames` stretches time so it settles on that frame. `delay` holds `from` until it passes.
  - `measureSpring({ fps, config })` gives the settle frame, for sizing a Sequence.
- **Phased travel** (slow start, push, settle) chains constant-speed, constant-acceleration, and constant-deceleration phases solved so position and speed stay continuous. With normalised distance, slow distance `s0` over `t0`, speed `v0 = s0 / t0`, acceleration `a = (1 - s0 - v0 * (ta + 0.5 * td)) / (0.5 * ta * (ta + td))`, peak `v0 + a * ta`, deceleration `peak / td`. Evaluate each phase analytically from the frame so scrubbing stays exact, and derive later phase boundaries from the durations in code so one changed duration cannot desynchronise the rest.
- **Value tracks** for any keyed value use monotone cubic Hermite interpolation (Fritsch-Carlson), never a natural cubic (it overshoots) (`procedural-geometry.md` section 3).
- `createFrameClock({ fps, durationInFrames, loop, onFrame, onEnded })`: the Player's clock, exported for custom surfaces. Driven by elapsed time (`performance.now()` deltas), never by counting rAF callbacks: a 120Hz display, a dropped frame, or a throttled tab all land on the right frame, and `onFrame` fires only when the integer frame changes.

## 3. Authoring a composition

```tsx
import { Easing, Sequence, Series, interpolate, spring, useCurrentFrame, useVideoConfig } from "@app/ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function Headline() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.jal });
  const y = interpolate(frame, [0, 12], [24, 0], { ...clamp, easing: Easing.jal });
  return <h2 style={{ opacity, transform: `translateY(${y}px)` }}>Approvals in one tap</h2>;
}

function Card() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps }); // critically damped, no overshoot
  return <div className="bento-item" style={{ opacity: s, transform: `scale(${0.96 + 0.04 * s})` }}>...</div>;
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

- **All motion derives from the frame.** No CSS `transition`, no `@keyframes`, no WAAPI, no GSAP, no Framer Motion inside a composition: each runs on its own clock and breaks scrubbing, pausing, and the poster. The stage CSS switches transitions and animations off inside `.frames-stage` as a backstop, but do not rely on it; write `interpolate` or `spring`.
- **Pure render.** No `Math.random()`, `Date.now()`, timers, or state that accumulates across frames. If something must vary, seed it from constants. The same frame must always paint the same picture.
- **Transform and opacity** carry the motion, same as the rest of JAL. Timings still come from tokens: at 30fps, `--dur-200` is 6 frames, `--dur-400` is 12, `--dur-600` is 18; staggers are 0.6 (char), 1.2 (word), 2.4 (line), 1.8 (item) frames, so round to whole frames per beat.
- **JAL law inside the canvas.** White-first surface, tokens only, no gradient, glow, shadow, emoji, or em dash, one thing moving at a time. The showcase disciplines in `skills/jal-motion/references/showcase.md` (shot sizes, camera follows the click, anti-slide checks) apply.
- **One scene per component and file** for multi-scene pieces. `Series` composes them.
- **Readable at the smallest width.** The canvas scales by `containerWidth / width`. Rendered text size is `authored size * scale`. A 1280-wide composition in a 343px mobile column scales to 0.27, so 16px rendered text needs about 60px authored. Either author large, or ship a portrait composition (for example 720 by 960) and pick it below 640px with a media query.
- **Real text stays real.** Compositions are DOM, so text is selectable and indexable. Still put the demo's point in a visible caption next to the Player: the canvas content changes per frame and is not a substitute for a text equivalent.

## 4. Product demo "videos" played live

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

Choose `live_dom` Player demos by default for on-site demos (JEV `motion.demo_medium`). They stay crisp at any DPR, stay editable, weigh nothing over the wire, and need no new tech.

## 5. Poster frame and reduced motion

- Under `prefers-reduced-motion: reduce` the Player shows `posterFrame` (default the last frame, the complete final state) and never autoplays. This is the same "final state first" rule the rest of JAL motion follows.
- The viewer may still press play or scrub. That is user-initiated playback, and it stops again on pause.
- Server rendering resolves reduced motion to `true`, so server HTML is always the poster; motion starts only after hydration confirms it is allowed.
- If reduced motion turns on mid-play, the Player pauses and jumps to the poster.
- Pick a poster that tells the whole story in one still: the final UI state, labels visible, nothing mid-transition. Set `posterFrame` explicitly when the last frame is an outro.
- `ui_audit`'s `reduced-motion` rule passes because a paused Player runs no rAF loop.

## 6. Scroll-driven compositions

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
- **Audio** is out of scope. A demo that needs narration is a real video, produced outside the app.
- **Heavy scenes.** Every frame re-renders the scene tree. Keep compositions to tens of elements, memoize static subtrees, and move particle-scale work to a canvas or R3F scene driven by the same frame value.
