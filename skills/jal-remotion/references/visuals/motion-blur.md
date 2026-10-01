# Motion blur (@remotion/motion-blur)

From:
- https://www.remotion.dev/docs/motion-blur/
- https://www.remotion.dev/docs/motion-blur/api
- https://www.remotion.dev/docs/motion-blur/camera-motion-blur
- https://www.remotion.dev/docs/motion-blur/common-mistake
- https://www.remotion.dev/docs/motion-blur/html-in-canvas-motion-blur
- https://www.remotion.dev/docs/motion-blur/motion-blur
- https://www.remotion.dev/docs/motion-blur/trail

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

Real motion blur needs a frame rendered several times at slightly different times and blended. Three approaches:

1. `<HtmlInCanvasMotionBlur>` (4.0.529+, experimental): recommended and best quality. Averages `samples` snapshots (default 8, 1 to 64) over a `shutterAngle` (default 180, 0 disables). Needs `width` and `height`; supports `from`, `trimBefore`, `durationInFrames`, `playbackRate`, `loop`, and `disabled` (4.0.530+, keyframable). Preview needs Chrome with the HTML-in-canvas flag, rendering needs none. Nested `<HtmlInCanvas>` is not supported.
2. `<CameraMotionBlur>`: layered blending, works without the flag, but it changes colors and opacity. Keep `samples` at 5 to 10 and inspect the result. Children must be absolutely positioned.
3. `<Trail>` (old name `<MotionBlur>`): echo copies with a lag, `layers`, `lagInFrames`, `trailOpacity`. A stylised trail, not a camera exposure.

## When a JAL agent uses it

Fast pans, whip transitions, flying type, product spins. Motion blur is natural camera behavior, so law status is fine. Cost is multiplied by the sample count: T3.

## Rules that bite

- `useCurrentFrame()` must be called inside a child of the blur component, because Trail and CameraMotionBlur replace the time context. Extract the animation into its own component.
- Frame rate changes the amount of blur: higher fps means less blur at the same shutter angle (180 or 90 are the film norms).
- For website playback render the blurred result to video; do not run multi-sample blur live.
- Reduced motion: the blur is only visible in motion, so the F1 freeze (settled frame) removes it.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.blur.html-in-canvas` | Best-quality motion blur: samples are averaged inside HTML-in-canvas (4.0.529+). | <HtmlInCanvasMotionBlur width height samples? 8 (1 to 64) shutterAngle? 180 disabled? from trimBefore durationInFrames playbackRate loop> from @remotion/motion-blur; call useCurrentFrame() from a child; no nested HtmlInCanvas; preview needs the Chrome flag, rendering none | T3 | video | S | fine |
| `rm.blur.camera` | Film-like motion blur via layered blending, works without the flag. | <CameraMotionBlur shutterAngle? 180 samples? 10> duplicates children with time offsets; children must be absolutely positioned; destructive to colors and opacity so keep samples at 5 to 10 and inspect; the frame must be read inside a child | T3 | pre | S | fine |
| `rm.blur.trail` | Echo trail behind a moving object (not a real exposure). | <Trail layers lagInFrames trailOpacity> (older name MotionBlur); absolutely positioned children | T3 | pre | S | fine |
| `rm.blur.common-mistake` | Rule: useCurrentFrame() must sit inside the blurred component. | Trail and CameraMotionBlur replace the time context, so animation must live in a child component, not the parent | T1 | live | S | fine |
