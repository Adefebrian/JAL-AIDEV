# Timing and animation (Remotion core)

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01). Version tags below ("4.0.490+") are the first release that has the feature; check `bunx remotion versions` if a project is older.

## What it is

A Remotion video is a pure function of an integer frame number. All motion must be derived from `useCurrentFrame()`. Anything with its own clock (CSS transitions, `@keyframes`, WAAPI, GSAP ticker, framer-motion, `Math.random`, `Date.now`) breaks rendering because Remotion renders frames out of order, on several browser tabs, with no shared state.

## When a JAL agent uses it

Every time a Remotion composition moves anything. This is the default motion core for MP4 output and for in-site "video" pieces that use Remotion's Player. For live DOM page motion (hover, scroll, route changes) the supplements still apply: GSAP, Lenis, Framer Motion, CSS. JEV picks per case.

## The hooks (the clock)

```ts
import {useCurrentFrame, useVideoConfig, useCurrentScale, usePixelDensity} from 'remotion';
const frame = useCurrentFrame();                 // 0-indexed, local to nearest Sequence/timed parent
const {fps, durationInFrames, width, height, id, defaultProps, props, defaultCodec, defaultSampleRate} = useVideoConfig();
```

- `useCurrentFrame()`: first frame is `0`, last is `durationInFrames - 1`. Inside a `<Sequence from={10}>` it returns `absolute - 10`. To read the absolute frame inside a shifted subtree, call the hook in the parent and pass it down as a prop.
- `useVideoConfig()`: `width`/`height` are overridden by a parent `<Sequence width height>` (4.0.80+). `durationInFrames` inside a Sequence is the end of the sequence in its local frame space and accounts for `playbackRate` and `trimBefore` (40 parent frames at rate 2 with `trimBefore={10}` returns 90). `props` (4.0.0+) is the final props after `calculateMetadata`. `defaultCodec` (4.0.54+), `defaultSampleRate` (4.0.448+) are read-only and set through `calculateMetadata`.
- `useCurrentScale({dontThrowIfOutsideOfRemotion?: boolean})` (4.0.125+): the canvas scale (Studio zoom, or the Player's fit-to-container scale; `1` in server renders). Throws outside Remotion unless the option is true (then returns `1`).
- `usePixelDensity({dontThrowIfOutsideOfRemotion?})` (4.0.472+): `window.devicePixelRatio` in preview, the render `scale` option when rendering; `1` where no `devicePixelRatio`.
- Measuring DOM nodes: `getBoundingClientRect()` is multiplied by the canvas scale, so divide: `rect.width / useCurrentScale()`. Alternatively read `offsetWidth/offsetHeight` (ignore transforms).

## Timing props (the standard 5)

Shared by `<Sequence>`, `<AbsoluteFill>`, `<Interactive.*>`, `<Img>`, `<CanvasImage>`, `<AnimatedImage>`, `<Solid>`, `<HtmlInCanvas>`, `<Gif>`, `<Lottie>`, `<ThreeCanvas>`, `<RemotionRiveCanvas>`, `@remotion/shapes`, `<Audio>` / `<Video>` from `@remotion/media`, and custom components built with `Interactive.withSchema()`.

| Prop | Meaning |
|---|---|
| `from` | place the item on the parent timeline (default 0, can be negative to trim by shifting) |
| `trimBefore` | first frame of the child timeline (4.0.482+) |
| `durationInFrames` | how many child frames to show, starting at `trimBefore`; occupies `durationInFrames / playbackRate` parent frames |
| `playbackRate` | child speed (4.0.528+), positive finite constant; nested rates multiply |
| `loop` | repeat the selected range until the parent ends; needs finite `durationInFrames` on a plain sequence |

Order of operations: `from` -> `trimBefore` -> `durationInFrames` -> `playbackRate` -> `loop`.
Frame seen by children: `trimBefore + (frame - from) * playbackRate`; looping: `trimBefore + ((frame - from) * playbackRate) % durationInFrames`.

Gotchas:
- Animations computed in the parent and passed down as `style` or props keep the parent clock; only `useCurrentFrame()` inside the descendant is retimed.
- Wrap a looping item in an outer item with a finite `durationInFrames` to cap the total length.
- Media (`Audio`, `Video`) and Lottie/Gif/AnimatedImage may omit `durationInFrames` when `loop` is set (intrinsic duration after `trimBefore` is the loop).

## interpolate()

```ts
import {interpolate, Easing} from 'remotion';
interpolate(input, inputRange, outputRange, options?)
```

Rules: `inputRange` and `outputRange` equal length, at least one value (single-value ranges 4.0.469+, always returns that value). Input must be strictly increasing.

Options (all optional):
- `extrapolateLeft` / `extrapolateRight`: `'extend'` (default, goes past the output range), `'clamp'`, `'wrap'`, `'identity'`. Almost always clamp both: `{extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}`.
- `easing`: one function for all segments, or an array with length `inputRange.length - 1` (4.0.462+; empty array for a single keyframe). Easing shapes progress inside each segment only.
- `posterize: n` (4.0.470+): quantise the input to steps of `n` (stop-motion look). Also on `interpolateColors()` and `interpolateStyles()`.
- `output: 'linear' | 'perceptual-scale'` (4.0.490+): `perceptual-scale` interpolates the area (`sign(v) * v**2`) then square-roots back, so a scale push looks even. Halfway of `[0,1]` is `sqrt(0.5)`.
- `outputType: 'font-weight' | 'scale' | 'translate' | 'rotate' | 'transform-origin'` (4.0.526+): forces CSS-string interpretation and validates units (otherwise scale/translate/rotate/origin strings are inferred, 4.0.472+).

Output value kinds beyond numbers:
- CSS transform strings (4.0.472+): up to 3 components, all keyframes same type, units must match per component. Scale: unitless; translate: px/%; rotate: deg/rad/grad/turn; transform-origin keywords `left center right top bottom` (4.0.475+) become percentages, optional third component a length. Defaults when a dimension is missing: scale 1, translate/rotate 0, origin `50% 50% 0`.
- Numeric tuples (4.0.473+): all tuples same length, e.g. `[[0, .5], [1, .5]]`.
- Discrete strings (4.0.509+) and booleans (4.0.530+): require `Easing.step1` on every segment; the previous value is held until the next keyframe.

Exported types: `ExtrapolateType`, `InterpolateOptions`, `InterpolateOutputType`.

```ts
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
const frame = useCurrentFrame();
const {fps, durationInFrames} = useVideoConfig();
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const opacity = interpolate(frame, [0, 0.5 * fps, durationInFrames - 0.5 * fps, durationInFrames], [0, 1, 1, 0], clamp);
const x = interpolate(frame, [0, 30], ['0px 40px', '0px 0px'], {...clamp, easing: Easing.bezier(0.24, 1, 0.4, 1), outputType: 'translate'});
```

## interpolateColors()

```ts
interpolateColors(input, inputRange, outputRange, {easing?, posterize?})  // returns an rgba() string
```
Accepts named colors, hex, `rgb()/rgba()`, `hsl()/hsla()`, and (4.0.439+) `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()` with optional `/ alpha`. `easing` (4.0.475+) is one function or one per segment. Remotion's mixing is not gradient painting; JAL's no-gradient rule is about CSS gradients on UI, JEV decides for video art direction.

## spring()

```ts
import {spring} from 'remotion';
spring({frame, fps, from?, to?, reverse?, config?, durationInFrames?, durationRestThreshold?, delay?})
```
- `config`: `mass` (1), `damping` (10), `stiffness` (100), `overshootClamping` (false). Defaults overshoot a little; `damping: 200` removes the bounce.
- `durationInFrames` (3.0.27+) stretches the curve to settle exactly then; `durationRestThreshold` (3.0.27+, only with `durationInFrames`) is how close to the end counts as settled, e.g. `0.001` means 99.9% of the distance after the duration. (`measureSpring` has its own `threshold`, default 0.005.)
- `delay` (3.3.90+) holds `from` for N frames; `reverse` (3.3.92+).
- Order: stretch (`durationInFrames`) -> reverse -> delay.
- Animation math: combine springs by arithmetic, e.g. `scale = enter - exit` where `exit = spring({frame, fps, delay: durationInFrames - 20, durationInFrames: 20, config: {damping: 200}})`.

`measureSpring({fps, threshold?, config?})` returns the settle length in frames (`damping: 200`, 30fps -> 23). `from`/`to` params on it are deprecated and removed in 5.0. Use it to size a Sequence/TransitionSeries to the spring.

## Easing

`import {Easing} from 'remotion'`. Same API as React Native. Members: `step0`, `step1`, `linear`, `ease`, `quad`, `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `elastic(bounciness)`, `back(s)`, `bounce`, `bezier(x1,y1,x2,y2)`, and the modifiers `in(fn)`, `out(fn)`, `inOut(fn)`. `Easing.spring(config?)` (4.0.476+) is a normalised spring curve for `interpolate()` (measured as a 30-frame spring; config `damping`, `mass`, `stiffness`, `overshootClamping`, `durationRestThreshold` 4.0.483+, `allowTail` 4.0.483+ lets the tail settle past the segment end). `Easing.step1` is the discrete-value easing for strings and booleans.

JAL default curve for product-style motion inside a comp: `Easing.bezier(0.24, 1, 0.4, 1)` (the `--ease-standard` token). Exit about 70% of the entrance duration (see `skills/jal-motion/SKILL.md`).

## random() and determinism

```ts
import {random} from 'remotion';
random('seed-' + i)   // deterministic 0..1, number or string seed
random(null)          // true Math.random, silences the ESLint warning
```
Never `Math.random()` in render code: every render tab would get different values (flicker, mismatched frames). Exception: inside `calculateMetadata()` (runs once). Seed with stable keys (`x-${i}`), not the frame, unless the value should change per frame.

## Transforms and CSS

Use separate CSS properties (`opacity`, `scale`, `translate`, `rotate`) rather than a combined `transform` string (easier to edit in Studio); use `transform` for `skew()`, `perspective()`, ordered chains. `@remotion/animation-utils` gives `makeTransform([rotate(45), translate(50, 50)])` and `interpolateStyles()`. SVG rotate needs `transformBox: 'fill-box', transformOrigin: 'center center'`. 3D X/Y rotation needs `perspective` on the parent.

## Flicker rules (what breaks a render)

A component must: render the same visual every call, not rely on frame order, not animate when paused, not use plain randomness. Also:
- Use `<Img>`, `<Audio>`, `<Video>`/`<OffthreadVideo>`, `<IFrame>`, `<Gif>` (they block rendering until loaded); use `delayRender()` for data; wait for fonts; call `fitText()`/`measureText()` only after fonts load; avoid CSS `background-image` and `mask-image` for assets that must be awaited.
- Many `<Html5Video>` tags stutter: prefer `<Video>` from `@remotion/media` or `<OffthreadVideo>`.
- `--concurrency=1` hides some flicker but does not synchronise timing and blocks Lambda; refactor instead.
- CSS animations can be synchronised using `animation-play-state: paused` plus a negative `animation-delay` computed from the frame, but prefer `interpolate()`.

## Multiple frame rates

Write time in seconds times `fps`: `interpolate(frame, [1 * fps, 2 * fps], ...)`, `<Sequence durationInFrames={3 * fps}>`, `spring({durationInFrames: 2 * fps, delay: fps})`. Switch fps at runtime from a prop with `calculateMetadata={({props}) => ({fps: props.frameRate === '60fps' ? 60 : 30})}`. An "FPS convert" wrapper is discouraged (breaks media tags).

## Third-party animation libraries inside a comp

| Library | Status in Remotion |
|---|---|
| GSAP | official `@remotion/gsap` (4.0.517+, MIT): `useGsapTimeline()`; see below |
| Lottie | `@remotion/lottie` |
| Three.js | `@remotion/three` |
| Rive | `@remotion/rive` |
| Skia | `@remotion/skia` |
| GIF | `@remotion/gif` |
| Anime.js | works via manual seeking (example repo from Remotion) |
| CSS animation | paused + `animation-delay` trick |
| Framer Motion | no integration; use `spring()`/`interpolate()` (same ideas, Reanimated-derived) |
| react-spring | none; use `spring()` |
| Matter.js | bake the simulation to a timeline first |
| Vidstack | Remotion provider exists |
| Tailwind | works, but strip `transition-*`, `animate-*`, `duration-*`, `delay-*` utilities |

### @remotion/gsap

```ts
import {useGsapTimeline} from '@remotion/gsap';
const scope = useGsapTimeline<HTMLDivElement>(({timeline, selector}) => {
  timeline.from(selector('[data-title]'), {y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'});
}, {dependencies: [/* rebuild when these change */]});
// <AbsoluteFill ref={scope}>
```
`gsap` is a peer dependency (`bun add gsap`, `bunx remotion add @remotion/gsap`). The hook builds a paused timeline and seeks it to the current frame (re-renders forward from time zero each frame; very large timelines cost more). Throws on: playback or seek calls (`play`, `seek`, `time`, `progress`, `tweenTo`...), callbacks (`onStart`, `onUpdate`, `timeline.call`), async builders, non-element targets (plain objects freeze in stills and renders), unseeded randomness (`random(...)` strings, `stagger.from:'random'`, `repeatRefresh`), freestanding `gsap.to()` / `delayedCall()`. Builder must be synchronous; only element targets; plugins not supported yet (check the docs page again before relying on ScrollTrigger inside a comp: not applicable, there is no scroll).

## Combining with the JAL kit and other libraries

- JAL frame core (`skills/jal-immersive/references/frames.md`) is the lightweight, zero-dependency alternative for live browser pieces; its `interpolate`, `spring`, `Easing`, `Sequence`, `Series` mirror these APIs (it lacks `trimBefore`, `loop`, `playbackRate`, `Freeze`, `premountFor`, which Remotion has). Choose Remotion when you need MP4/stills, media tracks, captions, transitions, or the Studio; choose the frame core when the piece is a small inline demo and a Remotion runtime would be heavier than it earns.
- GSAP/Lenis/Framer Motion run on the page, outside the comp. Inside a comp use `spring`/`interpolate`/`@remotion/gsap` only.
- Token map for frames at 30 fps: 200ms = 6 frames, 400ms = 12, 600ms = 18. Round durations up with `Math.ceil(seconds * fps)`.

## Minimal Bun-ready example (React 19)

```tsx
// src/FadeSlide.tsx
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const FadeSlide: React.FC<{title: string}> = ({title}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const enter = spring({frame, fps, config: {damping: 200}});
  const exit = spring({frame, fps, config: {damping: 200}, delay: durationInFrames - 15, durationInFrames: 15});
  const y = interpolate(enter - exit, [0, 1], [32, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: '#fff', color: '#111', fontSize: 96}}>
      <div style={{opacity: enter - exit, translate: `0 ${y}px`}}>{title}</div>
    </AbsoluteFill>
  );
};
```

From:
- https://www.remotion.dev/docs/timing
- https://www.remotion.dev/docs/animating-properties
- https://www.remotion.dev/docs/animation-math
- https://www.remotion.dev/docs/interpolate
- https://www.remotion.dev/docs/interpolate-colors
- https://www.remotion.dev/docs/spring
- https://www.remotion.dev/docs/measure-spring
- https://www.remotion.dev/docs/easing
- https://www.remotion.dev/docs/random
- https://www.remotion.dev/docs/using-randomness
- https://www.remotion.dev/docs/transforms
- https://www.remotion.dev/docs/posterization
- https://www.remotion.dev/docs/flickering
- https://www.remotion.dev/docs/third-party
- https://www.remotion.dev/docs/gsap
- https://www.remotion.dev/docs/gsap/use-gsap-timeline
- https://www.remotion.dev/docs/use-current-frame
- https://www.remotion.dev/docs/use-video-config
- https://www.remotion.dev/docs/use-current-scale
- https://www.remotion.dev/docs/use-pixel-density
- https://www.remotion.dev/docs/measuring
- https://www.remotion.dev/docs/multiple-fps
