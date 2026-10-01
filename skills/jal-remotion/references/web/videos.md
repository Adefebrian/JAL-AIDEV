# Adding videos to a composition

How existing video files go into a composition: trimming, delaying, speed, sequences, jump cuts, transparency, ProRes, pixel work and Three.js textures. Almost everything here uses `<Video>` from `@remotion/media` (see `media.md`).

From: https://www.remotion.dev/docs/videos/ , https://www.remotion.dev/docs/videos/accelerated-video , https://www.remotion.dev/docs/videos/align-duration , https://www.remotion.dev/docs/videos/as-threejs-texture , https://www.remotion.dev/docs/videos/different-segments-at-different-speeds , https://www.remotion.dev/docs/videos/jumpcuts , https://www.remotion.dev/docs/videos/media-fragments , https://www.remotion.dev/docs/videos/prores , https://www.remotion.dev/docs/videos/sequence , https://www.remotion.dev/docs/videos/transparency , https://www.remotion.dev/docs/videos/video-manipulation

Website note: every pattern below costs decoder time and memory in the Player. Use one only when a real clip is part of the story, and follow the budgets in `website-integration.md` section 7.

## 1. Basics (index page)

- Put the file under the public folder and reference it with `staticFile("clip.mp4")`, or pass a remote URL (needs CORS).
- **Trim** with `trimBefore` (skip the first N frames at the composition fps) and select a length with `durationInFrames`. **Delay** with `from`. These are the same ideas as `<Sequence>`.
- **Size and position** with CSS: `width`, `height`, `position`, `left/top/right/bottom`, `margin`, `aspectRatio`, `objectFit`.
- Other props (volume, playbackRate, loop, crop) are in `media.md`.

## 2. Make the composition as long as the clip

Read the clip's duration with Mediabunny (`computeDuration()`), convert to frames with the composition fps, and return it from `calculateMetadata()`. Audio works the same: skip the video-track check and the width and height. This is for Studio and server rendering; the Player takes its length as a prop, so compute the same number in the page and pass `durationInFrames`. For Player pages fetch the metadata once on the server (a Hono route or build step) and store `durationInFrames` with the clip's entry, instead of measuring in every visitor's browser.

## 3. Speed

- **Segments at different speeds**: give each segment its own `<Video>` (or `<Sequence>`) with its own `playbackRate`; a snippet lays them back to back.
- **Speed that changes over time** (accelerating clips): the page notes it **does not work with `<Video>` from `@remotion/media` yet**; it uses the HTML5 tags instead. Treat as a limitation and avoid on web pages (the HTML5 tags are also unsupported by the web renderer).
- The clip occupies `durationInFrames / playbackRate` frames of the parent timeline.

## 4. Several clips in a row

Render each `<Video>` in a `<Series.Sequence>` with its own `durationInFrames`; measure each clip with Mediabunny `computeDuration()` in `calculateMetadata()` and return the sum; pass the list through `defaultProps`. Mobile browsers may block clips that start after the beginning of the composition (autoplay policy, `player.md` section 9).

## 5. Jump cuts

For smooth jump cuts in the browser, mount one `<Video>` per section inside a `<Series>` and set `premountFor` on each (the example premounts the next segment for 1.5 seconds) so the browser preloads the next segment before it plays. Define sections as `{ trimBefore, durationInFrames }`, sum the durations in `calculateMetadata`. Good for a talking-head edit played on a page; mind the memory budget with many clips.

## 6. Pixel work and textures

- **Manipulate pixels**: render a `<Video>` invisible and, in `onVideoFrame`, draw each frame to a `<canvas>` with `drawImage()` and apply filters (the example applies a grayscale). Alternative: `@remotion/effects` on canvas-based components; its `colorKey()` removes a chosen color (greenscreen). Before 4.0.190 only the HTML5 `requestVideoFrameCallback` approach existed.
- **Three.js texture** (4.0.387 and later): mount a headless `<Video>` and update a `CanvasTexture` from an `OffscreenCanvas` inside `onVideoFrame`. This fits a Remotion composition hosting a 3D scene via `@remotion/three` (`skills/jal-immersive`).

## 7. Transparency

- `<Video>` from `@remotion/media` supports **alpha channel** videos natively (needs WebGL support in the browser).
- A video with a black background and no alpha can be blended with `mixBlendMode: "screen"` on the `style`. Note: `mix-blend-mode` is unsupported by the web renderer (`client-side-rendering.md` section 4), so this works on the page and in server renders but not in a CSR export.
- `<OffthreadVideo transparent>` is the server-side alternative (unsupported in CSR).
- Rendering a transparent **output** (webm vp8/vp9 in CSR) is in `web-renderer.md` (`transparent: true`); the composition itself must have a transparent background.
- Greenscreen removal: see the `colorKey()` effect above.

## 8. ProRes

ProRes is the common exchange format for transparent overlays (stock sites sell them). Decoding is **off by default**. Install the decoder (`@mediabunny/prores`, 4.0.487 and later) and register it before a composition uses ProRes: `registerProresDecoder()` in the entry file. Reference the `.mov` with `staticFile()`. Decoding is faster with shared-memory threads when the page is cross-origin isolated (COOP and COEP headers); without isolation it still works but slower. A website rarely wants ProRes: it is huge. Convert to WebM with alpha or to authored frames for the web. Exporting ProRes is a server render topic (`../core/`).

## 9. Media fragments (`#t=`)

For `<OffthreadVideo>` and `<Html5Video>`, Remotion appends `#t=start,end` to the URL so the browser loads only the used range, which improves playback and cuts bandwidth, especially on Safari mobile. If Sequence values change over time the fragment changes and the browser reloads the source; disable by adding your own hash. `<Video>` and `<Audio>` from `@remotion/media` do not use fragments. Keep the default for the HTML5 tags.
