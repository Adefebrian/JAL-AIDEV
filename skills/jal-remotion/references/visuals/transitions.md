# Transitions (@remotion/transitions)

From:
- https://www.remotion.dev/docs/transitions/
- https://www.remotion.dev/docs/transitions/audio-transitions
- https://www.remotion.dev/docs/transitions/make-html-in-canvas-presentation
- https://www.remotion.dev/docs/transitions/presentations/
- https://www.remotion.dev/docs/transitions/presentations/blur-slide
- https://www.remotion.dev/docs/transitions/presentations/book-flip
- https://www.remotion.dev/docs/transitions/presentations/clock-wipe
- https://www.remotion.dev/docs/transitions/presentations/cross-zoom
- https://www.remotion.dev/docs/transitions/presentations/crosswarp
- https://www.remotion.dev/docs/transitions/presentations/cube
- https://www.remotion.dev/docs/transitions/presentations/custom
- https://www.remotion.dev/docs/transitions/presentations/custom-html-in-canvas
- https://www.remotion.dev/docs/transitions/presentations/dissolve
- https://www.remotion.dev/docs/transitions/presentations/dreamy-zoom
- https://www.remotion.dev/docs/transitions/presentations/fade
- https://www.remotion.dev/docs/transitions/presentations/film-burn
- https://www.remotion.dev/docs/transitions/presentations/flip
- https://www.remotion.dev/docs/transitions/presentations/iris
- https://www.remotion.dev/docs/transitions/presentations/linear-blur
- https://www.remotion.dev/docs/transitions/presentations/none
- https://www.remotion.dev/docs/transitions/presentations/push-cut
- https://www.remotion.dev/docs/transitions/presentations/ripple
- https://www.remotion.dev/docs/transitions/presentations/slide
- https://www.remotion.dev/docs/transitions/presentations/swap
- https://www.remotion.dev/docs/transitions/presentations/wipe
- https://www.remotion.dev/docs/transitions/presentations/zoom-blur
- https://www.remotion.dev/docs/transitions/presentations/zoom-in-out
- https://www.remotion.dev/docs/transitions/timings/
- https://www.remotion.dev/docs/transitions/timings/custom
- https://www.remotion.dev/docs/transitions/timings/lineartiming
- https://www.remotion.dev/docs/transitions/timings/springtiming
- https://www.remotion.dev/docs/transitions/transitionseries
- https://www.remotion.dev/docs/transitions/use-transition-progress

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

`<TransitionSeries>` behaves like `<Series>` but accepts `<TransitionSeries.Transition>` and `<TransitionSeries.Overlay>` between `<TransitionSeries.Sequence>` scenes. A transition is a presentation plus a timing. A transition overlaps the two scenes, so total duration shrinks by the transition length. An overlay draws on top of the cut and does not change duration (4.0.415+).

```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}><SceneA /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={springTiming({durationRestThreshold: 0.001})} />
  <TransitionSeries.Sequence durationInFrames={60}><SceneB /></TransitionSeries.Sequence>
</TransitionSeries>
```

Duration math: sum of scene lengths minus the sum of transition lengths. Scenes must stay absolutely positioned (do not pass `layout="none"`, it throws from Remotion 5.0). A transition placed first or last animates a scene entrance or exit.

## When a JAL agent uses it

Every multi-scene video. Pick the presentation by suitability:

- DOM presentations (`fade`, `slide`, `wipe`, `flip`, `clockWipe`, `iris`, `pushCut`, `none`, custom) are plain CSS/DOM. They play in a Player on the website and on mobile. These are the website defaults.
- HTML-in-canvas presentations (`blurSlide`, `bookFlip`, `crossZoom`, `crosswarp`, `dissolve`, `dreamyZoom`, `filmBurn`, `linearBlur`, `ripple`, `swap`, `zoomBlur`, `zoomInOut`) need Chrome with `chrome://flags/#canvas-draw-element` for preview and do not work in Firefox or Safari. Rendering needs no flag. Use them only in rendered video.
- `cube()` is a paid item on the Remotion site. Do not ship it without Brian's purchase.

## Rules that bite

- Timing: `linearTiming({durationInFrames, easing?})` or `springTiming({config?, durationInFrames?, durationRestThreshold?, reverse?})`. Set `durationRestThreshold: 0.001` to avoid a visible cutoff; this lengthens the transition, and a fixed `durationInFrames` then feels faster.
- A custom timing must have a deterministic duration (sum of springs plus pauses).
- `fade()` only works when the incoming scene is fully opaque. Leave `shouldFadeOutExitingScene` false for opaque scenes.
- `clockWipe()` and `iris()` need `width` and `height` set to the video size.
- Sound: wrap a presentation so `<Audio>` mounts when `presentationDirection` is `entering`.
- Use `useTransitionProgress()` with `none()` to animate objects inside a scene on the transition clock.
- Law: the defaults of `dissolve()` are a red and yellow burn (brief-only); `filmBurn`, `dreamyZoom`, `bookFlip`, `swap` carry glow, flash or shading and stay inside video frames.
- Reduced motion: for a Player on a site, set the transition to `none()` with `durationInFrames` 0, or swap to `fade()` with at most 200 ms (codes F2 and F4).

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.transition.series` | Scenes in order with transitions or overlays placed between them. | <TransitionSeries> with .Sequence, .Transition (timing + presentation, default slide) and .Overlay; a transition shortens total duration by its length, an overlay does not. A transition first or last animates a scene entrance or exit. @remotion/transitions | T1 | live | F2 | fine |
| `rm.transition.overlay` | Effect drawn on the cut between two scenes without shortening the timeline (4.0.415+). | <TransitionSeries.Overlay durationInFrames offset?> centered on the cut; children animate on their own clock; pair with lightLeak() or a flash | T2 | pre | F2 | canvas-only |
| `rm.transition.progress` | Drive anything inside a scene from the transition progress. | useTransitionProgress() returns entering, exiting, isInTransitionSeries; use with the none() presentation to hand-animate objects | T1 | live | F2 | fine |
| `rm.transition.timing-linear` | Constant-speed transition timing. | linearTiming({durationInFrames, easing?}) built on interpolate() | T1 | live | F2 | fine |
| `rm.transition.timing-spring` | Spring-based transition timing. | springTiming({config?, durationInFrames?, durationRestThreshold?, reverse?}); set durationRestThreshold to 0.001 to avoid a visible cutoff at the end | T1 | live | F2 | fine |
| `rm.transition.timing-custom` | Own timing curve, e.g. spring to 50 percent, pause, spring to 100. | return a TransitionTiming with getDurationInFrames() and getProgress(); duration must be deterministic (sum of springs plus pause) | T1 | live | F2 | fine |
| `rm.transition.sound` | Whoosh or hit sound at the start of a transition. | wrap any presentation in a component that mounts <Audio> from @remotion/media when presentationDirection is entering | T1 | video | F2 | fine |
| `rm.transition.fade` | Incoming scene fades in over the outgoing one. | fade({enterStyle?, exitStyle?, shouldFadeOutExitingScene?}); only for fully opaque incoming scenes; CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.slide` | Incoming scene pushes the outgoing one out. | slide({direction}) from-left/right/top/bottom; default presentation; CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.wipe` | Incoming scene slides over the outgoing one, 8 directions including corners. | wipe({direction}); CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.flip` | Outgoing scene flips 180 degrees to reveal the next on its back. | flip({direction, perspective? 1000}); CSS 3D; CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.clock-wipe` | Radial clock-hand wipe. | clockWipe({width, height}) set to the video size; CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.iris` | Next scene opens through a growing circle, camera iris. | iris({width, height}) set to the video size; CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.cube` | Both scenes rotate on a 3D cube. | cube({direction, perspective?}); paid item on the Remotion site, buy before use; CSS/DOM presentation, works in Player and every browser | T1 | live | F4 | fine |
| `rm.transition.none` | No visual of its own, you animate with the progress hook. | none() with useTransitionProgress() | T1 | live | F2 | fine |
| `rm.transition.push-cut` | Hard editorial cut with a short punch-in on both scenes and a brief flash (4.0.500+). | pushCut({cutProgress?, outgoingScale?, incomingStartScale?, incomingEndScale?, transformOrigin?, flashColor? '#f5f2ed'}); CSS/DOM presentation, works in Player and every browser | T1 | live | F2 | fine |
| `rm.transition.custom` | Your own presentation component. | TransitionPresentation object: component receives children, presentationDirection, presentationProgress, presentationDurationInFrames, passedProps; return style and layers | T1 | live | F4 | fine |
| `rm.transition.blur-slide` | Both scenes whip in one direction with heavy motion blur, like a fast camera pan. | blurSlide({direction? from-left, blur? 0.5}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.book-flip` | Scenes bend into a shaded page-turn. | bookFlip({direction? from-right}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | canvas-only |
| `rm.transition.cross-zoom` | Both scenes zoom across a moving center with weighted blur samples. | crossZoom({strength? 0.4}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.crosswarp` | Outgoing and incoming scenes warp against each other on the x axis. | crosswarp(); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.dissolve` | Outgoing scene burns away with a glowing edge based on luminance. | dissolve({lineWidth, spreadColor '#ff0000', hotColor '#e6e633', pow, intensity}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari; default colors are red and yellow, off-brand | T3 | video | F2 | brief-only |
| `rm.transition.dreamy-zoom` | Zoom and slight rotation through a white flash. | dreamyZoom({rotation? 6, scale? 1.2}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | canvas-only |
| `rm.transition.film-burn` | Procedural film-burn glow with a radial blur blend. | filmBurn({seed?}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | canvas-only |
| `rm.transition.linear-blur` | Directional multi-sample blur while blending scenes. | linearBlur({intensity? 0.1}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.ripple` | Outgoing scene displaced by a radial sine wave while crossfading. | ripple({amplitude? 100, speed? 50}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.swap` | Scenes swap with perspective, depth and a floor reflection. | swap({reflection? 0.4, perspective? 0.2, depth? 3}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | canvas-only |
| `rm.transition.zoom-blur` | Outgoing scene zooms out and rotates, incoming zooms in from the opposite angle, radial blur. | zoomBlur({rotation? PI/6}); HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.zoom-in-out` | Outgoing scene zooms toward the viewer and crossfades, incoming zooms back out. | zoomInOut({}) takes no options; HTML-in-canvas shader presentation; preview needs Chrome with chrome://flags/#canvas-draw-element, rendering needs no flag, no Firefox or Safari | T3 | video | F2 | fine |
| `rm.transition.custom-hic` | Own shader presentation. | makeHtmlInCanvasPresentation(shader): scenes arrive as OffscreenCanvas prevImage and nextImage plus time 0 to 1; shader returns clear, cleanup, draw; upload textures with texImage2D, write to the supplied WebGL2 canvas; prefer CSS when it can do the job | T4 | video | F2 | fine |
