# Compositions, time structure and layout (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01).

## What it is

How a video is declared and laid out in time: `registerRoot`, `<Composition>`, `<Still>`, `<Folder>`, `<Sequence>`, `<Series>`, `<Loop>`, `<Freeze>`, `<AbsoluteFill>`, `<TransitionSeries>`, connected compositions, layers, and reuse.

## When a JAL agent uses it

At the start of every video: define the root, one `<Composition>` per deliverable (MP4 sizes, stills, thumbnails), the scene tree, and the layer stack. Pick `Series`/`TransitionSeries` for ordered scenes and `Sequence` or timing props for free placement.

## The video model

A video has `width`, `height`, `durationInFrames`, `fps`. First frame `0`, last `durationInFrames - 1`. Everything else is React rendering a frame number.

## Entry and root

```ts
// src/index.ts  (entry point, keep registerRoot alone in its file; Fast Refresh re-runs a file, registerRoot must run once)
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';
registerRoot(RemotionRoot);
```
`registerRoot()` can be deferred (call it after wasm loading in a `.then`); no `delayRender` needed in new versions.

```tsx
// src/Root.tsx
import {Composition, Folder, Still} from 'remotion';
import {Launch} from './Launch';
import {Poster} from './Poster';

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Marketing">
      <Composition id="Launch" component={Launch} durationInFrames={180} fps={30} width={1920} height={1080}
        defaultProps={{title: 'Launch'}} />
    </Folder>
    <Still id="Poster" component={Poster} width={1080} height={1350} />
  </>
);
```

## `<Composition>` props

| Prop | Notes |
|---|---|
| `id` | letters, numbers, `-` only; unique; used to render |
| `component` or `lazyComponent` | exactly one; `lazyComponent={() => import('./X')}` uses Suspense, needs a default export, **disabled under Bun** |
| `width`, `height`, `fps`, `durationInFrames` | `<Still>` drops `fps` and `durationInFrames` |
| `defaultProps` | JSON-safe plus `Date`, `Map`, `Set`, `staticFile()`; inline literal so Studio can save edits; use `type`, not `interface`; required when the component has props |
| `schema` | top-level `z.object()` |
| `calculateMetadata` | see `props-and-schemas.md` |

Rules: never mount `<Composition>` inside another composition or inside a Player component (error "mounted inside another composition"; just render the component directly or use `<Sequence>`). Registering the same component twice as separate JSX nodes is fine and keeps each editable in the Studio. Programmatic `.map()` registration is OK only when the set is one template. `<Folder name>` (3.0.1+, letters digits `-`, nestable) is cosmetic: only affects the Studio sidebar.

## `<Sequence>`

```tsx
<Sequence from={30} durationInFrames={60} name="Intro" premountFor={fps}>...</Sequence>
```
Props (defaults): `from` 0 (can be negative), `durationInFrames` `Infinity`, `trimBefore` 0 (4.0.482+), `playbackRate` 1 (4.0.528+), `loop` false, `freeze` null (4.0.476+, equals `<Freeze frame>` without remount), `layout` `'absolute-fill'` | `'none'`, `width`/`height` (4.0.80+, also override `useVideoConfig()`), `name`, `style`/`className` (not with `layout="none"`), `showInTimeline` true, `hidden` (4.0.462+), `cropLeft/Right/Top/Bottom` ratios 0..1 (4.0.500+, only with absolute-fill, animatable, copy inline `borderRadius`), `premountFor` (0 now, becomes `fps` in 5.0), `postmountFor` (4.0.340+), `styleWhilePremounted`, `styleWhilePostmounted`, `ref` (`HTMLDivElement`).
- Children see `frame - from` (nested sequences accumulate: a sequence at 60 inside one at 30 starts children at 90).
- `layout="none"` is required inside `<ThreeCanvas>` (a div is not allowed in R3F).
- Premount: the sequence mounts N frames early with `display: none` so images/video/fonts are ready; always `premountFor={fps}` on heavy content.
- Avoid redundant `<Sequence>` wrappers when the component itself supports timing props.
- `Loop.useLoop()` works inside a looping sequence.

## `<Series>`

```tsx
<Series>
  <Series.Sequence durationInFrames={40}><A /></Series.Sequence>
  <Series.Sequence durationInFrames={20} offset={-5}><B /></Series.Sequence>
  <Series.Sequence durationInFrames={70}><C /></Series.Sequence>
</Series>
```
`<Series>` is a `<Sequence>` (4.0.443+) with `layout` default `'none'`; `<Series.Sequence>` default layout absolute-fill. Per item: `durationInFrames` (only the last may be `Infinity`; next starts after `durationInFrames / playbackRate`), `offset` (positive adds a gap, negative overlaps the previous; shifts all later items), `trimBefore` (4.0.497+), `playbackRate`, `freeze`, `premountFor`, `name`, `style`, `className`, `showInTimeline`, `ref`. Setting `playbackRate` on `<Series>` speeds the whole series including transitions.
Total length: sum of durations plus offsets; compute the parent's `durationInFrames` from data, never a hand-typed total.

## `<Loop>`

`<Loop durationInFrames={50} times={2} layout="absolute-fill" style>` (`times` default `Infinity`; `playbackRate` 4.0.528+; inherits premount props; postmount needs finite `times`). Nest to cascade. Prefer the `loop` prop on `<Sequence>`/media when you also need `trimBefore`/`playbackRate`. `Loop.useLoop()` returns `{durationInFrames, iteration} | null`.

## `<Freeze>`

`<Freeze frame={30} active={(f) => f < 30}>` (`active` 4.0.127+). Children's `useCurrentFrame()` returns the fixed frame regardless of Sequences; `Html5Video`/`OffthreadVideo` pause, audio mutes. Prefer `<Sequence freeze={30}>` for new code (editable in Studio).

## `<AbsoluteFill>` and layers

`position: absolute; inset 0; width/height 100%; display: flex; flexDirection: column`. Layers: later in the tree is on top (avoid `z-index`). It inherits `from`, `durationInFrames`, `trimBefore`, `playbackRate`, `freeze`, `hidden`, `name`, `showInTimeline` (4.0.501+) and premount props (4.0.528+): `<AbsoluteFill from={60} durationInFrames={40}>`. Style beats `className`; Tailwind conflicts (`flex flex-row`) are detected since 4.0.249 and the inline style is dropped. `ref` type `HTMLDivElement`. Video has fixed dimensions, so `position: absolute` is fine.

## `<Still>` and still images

`<Still id component width height defaultProps ...>`. Render: `bunx remotionb still <id> out.png --frame=0 --image-format=png|jpeg|webp|pdf --props='{}'`; Node `renderStill()`; browser `renderStillOnWeb()` (from `@remotion/web-renderer`); Lambda/Cloud Run have still variants. Preview in a React page with `<Thumbnail>` from `@remotion/player`.

## Transitions (`@remotion/transitions`, 4.0.59+)

```tsx
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={40}><A /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={slide()} timing={linearTiming({durationInFrames: 30})} />
  <TransitionSeries.Sequence durationInFrames={60}><B /></TransitionSeries.Sequence>
</TransitionSeries>
```
- Total = sum of sequences minus sum of transitions (40 + 60 - 30 = 70).
- `<TransitionSeries.Overlay durationInFrames>` (4.0.415+) draws on top of a cut without shortening the timeline (light leaks, flashes).
- Rules: a transition may not exceed the previous or next sequence; no two transitions adjacent; no two overlays adjacent; a transition and an overlay cannot be adjacent; at least one sequence next to a transition/overlay. A transition first or last gives an enter/exit animation. `timing.getDurationInFrames({fps})` gives its length (`springTiming({config: {damping: 200}})` at 30 fps = 23). In 5.0 `layout="none"` on `TransitionSeries` is removed. Premounting is automatic in 5.0.
- Audio transitions and HTML-in-canvas based presentations (e.g. `zoomBlur()`) exist; need Chrome flag in preview.

## Connected compositions (official pattern, own words)

Make each substantial scene a named component built with `Interactive.withSchema({wrapInSequence: true})`, place instances with inline timing (`from`, `durationInFrames`, `name`) in the parent, and register the same component reference as its own `<Composition>` (own id, dimensions, fps, natural duration, matching `defaultProps`) under a `<Folder>`. The Studio then shows the scene as a reference in the parent timeline and double-click opens it; editing the shared component changes both. A scene's `useCurrentFrame()` starts at 0 wherever the parent puts it. Keep fps and size aligned.

## Reuse and nesting

- A component is reusable by composition: `<Title title="Hello" />` inside `<Sequence from={40}>`; each instance sees its own frame 0.
- Concatenate scenes: a "master" composition made of `<Series>` containing the same components other compositions use.
- Nest with different dimensions: `<Sequence width={1920} height={1080}>` overrides `useVideoConfig()` for the subtree.

## Testing compositions

Components are normal React. Use Bun + Happy DOM (`bunfig.toml` `[test] preload = "./happydom.ts"` registering `GlobalRegistrator`), render with `renderToString(<Thumbnail component={Comp} compositionWidth compositionHeight durationInFrames fps frameToDisplay={10} noSuspense />)` from `@remotion/player`; `noSuspense` is 4.0.271+. E2E: Playwright.

```ts
import {Thumbnail} from '@remotion/player';
import {expect, test} from 'bun:test';
import {renderToString} from 'react-dom/server';
test('frame 10', () => {
  const html = renderToString(<Thumbnail component={Comp} compositionHeight={1000} compositionWidth={1000} durationInFrames={1000} fps={30} frameToDisplay={10} noSuspense />);
  expect(html).toContain('frame 10');
});
```

## Timeline-based editors

For a full editor: model `Item` types (`solid | text | video`) with `from`, `durationInFrames`, `id`; render tracks as stacked `<AbsoluteFill>` containing one `<Sequence>` per item; hold tracks in state and pass them as `inputProps` to a `<Player>`; build the timeline UI from the same data. Remotion sells a ready Timeline component and an Editor Starter. Out of JAL scope unless Brian asks.

## Combining with the JAL kit

- JAL frame core equivalents (`skills/jal-immersive/references/frames.md`): `Composition`/`Player`, `Sequence`, `Series`, `seriesOffsets` map onto the same ideas. Missing there: `trimBefore`, `loop`, `playbackRate`, `Freeze`, `premountFor`, `TransitionSeries`, media tags. Use the frame core for tiny in-page demos; use Remotion for anything exported, with media, or edited in the Studio.
- For a website: embed with `@remotion/player` (client component, `inputProps`, `controls`, `loop`); wire reduced-motion by showing a `<Thumbnail>` poster frame instead of autoplay.
- Section concept law and layout tokens still apply to the Player's surrounding page chrome, not to the inside of a video canvas.

From:
- https://www.remotion.dev/docs/the-fundamentals
- https://www.remotion.dev/docs/composition
- https://www.remotion.dev/docs/sequence
- https://www.remotion.dev/docs/series
- https://www.remotion.dev/docs/loop
- https://www.remotion.dev/docs/freeze
- https://www.remotion.dev/docs/absolute-fill
- https://www.remotion.dev/docs/layers
- https://www.remotion.dev/docs/folder
- https://www.remotion.dev/docs/still
- https://www.remotion.dev/docs/stills
- https://www.remotion.dev/docs/register-root
- https://www.remotion.dev/docs/reusability
- https://www.remotion.dev/docs/transitioning
- https://www.remotion.dev/docs/wrong-composition-mount
- https://www.remotion.dev/docs/testing
- https://www.remotion.dev/docs/building-a-timeline
- https://www.remotion.dev/docs/multiple-fps
