# Remotion Elements catalog

From:
- https://www.remotion.dev/elements/
- https://www.remotion.dev/elements/audio/
- https://www.remotion.dev/elements/audio/mirrored-spectrum/
- https://www.remotion.dev/elements/audio/oscilloscope/
- https://www.remotion.dev/elements/audio/waveform-progress/
- https://www.remotion.dev/elements/backgrounds/
- https://www.remotion.dev/elements/backgrounds/liquid-contours/
- https://www.remotion.dev/elements/backgrounds/moving-waves/
- https://www.remotion.dev/elements/backgrounds/moving-zigzags/
- https://www.remotion.dev/elements/backgrounds/notebook-paper/
- https://www.remotion.dev/elements/backgrounds/paper-texture/
- https://www.remotion.dev/elements/backgrounds/rotating-starburst/
- https://www.remotion.dev/elements/captions/
- https://www.remotion.dev/elements/captions/basic-captions/
- https://www.remotion.dev/elements/captions/moving-pill-captions/
- https://www.remotion.dev/elements/captions/popping-word-captions/
- https://www.remotion.dev/elements/captions/rounded-captions/
- https://www.remotion.dev/elements/captions/word-highlight-captions/
- https://www.remotion.dev/elements/commerce/
- https://www.remotion.dev/elements/commerce/product-collection/
- https://www.remotion.dev/elements/commerce/product-discount-callout/
- https://www.remotion.dev/elements/commerce/shine/
- https://www.remotion.dev/elements/commerce/tear/
- https://www.remotion.dev/elements/contributing
- https://www.remotion.dev/elements/data/
- https://www.remotion.dev/elements/data/horizontal-bar-chart/
- https://www.remotion.dev/elements/data/line-chart/
- https://www.remotion.dev/elements/data/number-counter/
- https://www.remotion.dev/elements/data/pie-chart/
- https://www.remotion.dev/elements/data/vertical-bar-chart/
- https://www.remotion.dev/elements/guidelines
- https://www.remotion.dev/elements/layouts/
- https://www.remotion.dev/elements/layouts/picture-in-picture-transition/
- https://www.remotion.dev/elements/layouts/slide-to-split-screen/
- https://www.remotion.dev/elements/libraries
- https://www.remotion.dev/elements/maps/
- https://www.remotion.dev/elements/maps/map-flyover/
- https://www.remotion.dev/elements/maps/watercolor-map/
- https://www.remotion.dev/elements/overlays/
- https://www.remotion.dev/elements/overlays/location-lower-third/
- https://www.remotion.dev/elements/overlays/name-lower-third/
- https://www.remotion.dev/elements/overlays/social-safe-zones/
- https://www.remotion.dev/elements/storytelling/
- https://www.remotion.dev/elements/storytelling/on-screen-messages/
- https://www.remotion.dev/elements/storytelling/polaroid-pictures/
- https://www.remotion.dev/elements/storytelling/speed-lines/
- https://www.remotion.dev/elements/text/
- https://www.remotion.dev/elements/text/circle-marker/
- https://www.remotion.dev/elements/text/crossed-off/
- https://www.remotion.dev/elements/text/news-article-highlight/
- https://www.remotion.dev/elements/text/spinning-text-wheel/
- https://www.remotion.dev/elements/text/strike-through/
- https://www.remotion.dev/elements/text/text-marker/
- https://www.remotion.dev/elements/youtube/
- https://www.remotion.dev/elements/youtube/youtube-comment-highlight/
- https://www.remotion.dev/elements/youtube/youtube-end-card/
- https://www.remotion.dev/elements/youtube/youtube-subscribe-nudge/

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## What it is

Elements are small, copyable video building blocks (source code, not a managed dependency) with previews, Studio controls through `Interactive.withSchema()`, and declared assets. The catalog has 11 categories and 42 Elements. Installation modes: `wrapped` (separate editable layers inside a `<Sequence>`, the default) or `component-owned-sequence` (one trimmable layer, for generative or canvas Elements). Third-party libraries (Remocn, Lexington Themes) can be added to the Studio; they are not vetted by JAL.

## When a JAL agent uses it

JEV offers Elements as candidates for explainers, social video and brand films, then swaps fonts and colors to JAL tokens. The Element is a starting point, never final: restyle it.

## JAL adaptation checklist

1. Fonts: replace `@remotion/google-fonts/*` with Geist or a pool family loaded locally (`rm.font.local`).
2. Colors: replace blues, reds and defaults with project tokens; no purple.
3. Law: Elements that use shadows or gradients are marked canvas-only here. Keep them inside a video frame; strip the shadow or gradient for any live page use.
4. Assets: Elements pull sample images and audio from `remotion.media`; replace with project assets and licensed media.
5. Maps: the two map Elements fetch tiles over the network at render time (NASA GIBS BlueMarble, Cooper Hewitt watercolor tiles); check licence and attribution, and wait with `delayRender`.
6. Web use: `live` rows play in a Player on mobile. Rows marked `video` are for rendered files. All Elements: freeze on the settled frame for reduced motion.
7. Entrance and exit: temporary overlays (lower thirds, callouts, nudges) include both; keep that.

## Category index pages

- `/elements` lists 11 categories (Audio, Backgrounds, Captions, Layouts, Commerce, Data, Maps, Overlays, Storytelling, Text, YouTube).
- The slash form `/elements/` returns 404 on the site; the same page without the slash was read.
- `/elements/commerce/` has the heading "Effects" (it lists Wiggling Callout, Shine, Tear apart).
- `/elements/contributing`, `/elements/guidelines` and `/elements/libraries` are covered by `rm.el.author-guidelines`.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.audio.mirrored-spectrum` | Mirrored frequency bars, for music and speech. | useWindowedAudioData + visualizeAudio from @remotion/media-utils, <Audio> from @remotion/media; props audioSrc, barColor, numberOfBars 3 to 127, sensitivity; SVG or div bars | T3 | video | F1 | fine |
| `rm.audio.oscilloscope` | Waveform line that traces the voice, for speech. | useWindowedAudioData + createSmoothSvgPath (@remotion/media-utils) drawn as an SVG path; <Audio> | T3 | video | F1 | fine |
| `rm.audio.waveform-progress` | Voice-note style static waveform with playback progress. | useWindowedAudioData sampled to bars, played portion colored by progress; SVG; | T3 | video | F1 | fine |
| `rm.bg.liquid-contours` | Flowing two-color liquid contour background. | <Solid> + liquidContours() effect with animated offset (@remotion/effects/liquid-contours) | T2 | pre | F1 | fine |
| `rm.bg.moving-waves` | Seamless wave bands flowing upward. | <Solid> + waves() with offset = frame / duration * 480 (loop-safe) | T2 | pre | F1 | fine |
| `rm.bg.moving-zigzags` | Seamless zigzag bands flowing upward. | <Solid> + zigzag() with looping offset | T2 | pre | F1 | fine |
| `rm.bg.notebook-paper` | White paper with faint blue grid lines. | <Solid> + paper() + gridlines() | T2 | pre | S | canvas-only |
| `rm.bg.paper-texture` | Animated white paper texture. | <Solid> + paper() with interpolate()d parameters | T2 | pre | F1 | canvas-only |
| `rm.bg.rotating-starburst` | Solid with a slowly rotating retro ray pattern. | <Solid> + starburst() with interpolate()d rotation | T2 | pre | F1 | brief-only |
| `rm.caption.basic` | Simple synchronized captions, white text on a translucent gray bar. | @remotion/captions createTikTokStyleCaptions + <Sequence> per page | T1 | live | S | fine |
| `rm.caption.moving-pill` | A pill that glides between the spoken words. | createTikTokStyleCaptions, fitText/measureText from @remotion/layout-utils, spring(); font via @remotion/google-fonts (swap to Geist for JAL) Montserrat | T1 | live | F1 | fine |
| `rm.caption.popping-word` | Each spoken word pops into focus. | createTikTokStyleCaptions, fitText, spring() scale; font via @remotion/google-fonts (swap to Geist for JAL) Montserrat | T1 | live | F1 | fine |
| `rm.caption.rounded` | Multi-line captions in an SVG box with all corners rounded. | @remotion/rounded-text-box createRoundedTextBox + measureText/fitTextOnNLines; font via @remotion/google-fonts (swap to Geist for JAL) Figtree | T1 | live | S | fine |
| `rm.caption.word-highlight` | Highlights each word as it is spoken. | createTikTokStyleCaptions, fitText, rough-notation Highlight per word; font via @remotion/google-fonts (swap to Geist for JAL) Montserrat | T1 | live | F1 | fine |
| `rm.commerce.rotating-cards` | Three cards, each takes the center once. | interpolate with Easing.inOut(cubic), 3D perspective, card stack positions; font via @remotion/google-fonts (swap to Geist for JAL) Inter; uses shadows | T1 | live | F1 | canvas-only |
| `rm.commerce.wiggling-callout` | Attention-grabbing wiggling speech bubble for a discount. | @remotion/shapes <Callout> + interpolate wiggle; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.commerce.shine` | Diagonal shine sweep over any content. | <HtmlInCanvas effects=[scale(), shine()]> with progress from interpolate(); shown on <CanvasImage> | T3 | video | F1 | canvas-only |
| `rm.commerce.tear` | Content tears apart along a zigzag seam. | <HtmlInCanvas effects=[scale(), tear()]> with spring/interpolate progress | T3 | video | F1 | fine |
| `rm.data.horizontal-bar-chart` | Bold bar card with three labeled bars. | interpolate widths with easing; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.data.line-chart` | Animated line chart with labeled trend. | SVG path drawn on via strokeDashoffset 1 to 0 on a normalized path; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.data.number-counter` | Counts from a start to an end value. | interpolate + Easing, tabular figures; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.data.pie-chart` | Pie chart with four labeled slices. | SVG arcs animated with interpolate and Easing; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.data.vertical-bar-chart` | Bold vertical bars, three labeled values. | interpolate heights, spring, perspective tilt; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.layout.pip-transition` | Element goes from fullscreen to a picture-in-picture box. | interpolate + spring on position, size, radius; <Img>; shadows in the source | T1 | live | F1 | canvas-only |
| `rm.layout.slide-to-split` | Fullscreen scene opens into a 60/40 split. | interpolate with Easing on widths; <Img> panels; shadows in the source | T1 | live | F1 | canvas-only |
| `rm.map.flyover` | Animated map flight from point A to point B with labels. | maplibre-gl rendered per frame, @turf/turf for the route, getLength; NASA GIBS BlueMarble raster tiles; interpolate + Easing; network at render time, use delayRender | T4 | video | F1 | canvas-only |
| `rm.map.watercolor` | Watercolor map journey between two places. | slippy-map tile math with Cooper Hewitt watercolor tiles as <Img>, spring/interpolate; font via @remotion/google-fonts (swap to Geist for JAL) Lora; check tile licence and attribution | T3 | video | F1 | canvas-only |
| `rm.overlay.location-lower-third` | Lower third for an event location and venue. | interpolate + spring + Easing; entrance and exit; blur filter; shadows in the source | T1 | live | F2 | canvas-only |
| `rm.overlay.name-lower-third` | Clean lower third for a speaker, guest or host. | interpolate + Easing, entrance and exit; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F2 | fine |
| `rm.overlay.social-safe-zones` | Preview of Instagram or TikTok UI to keep content inside safe areas. | <CanvasImage> overlay at 1080x1920, enum prop platform, topmost zIndex; editing aid, not rendered into final output | T1 | video | S | fine |
| `rm.story.on-screen-messages` | iMessage-style chat with staggered reveals and focus shifts. | interpolate + Easing per bubble, blue and gray bubbles; font via @remotion/google-fonts (swap to Geist for JAL) Inter | T1 | live | F1 | fine |
| `rm.story.polaroid-pictures` | Staggered instant-photo montage with handwritten captions. | spring + interpolate, <Img>, blur 'developing' filter, paper shadows; font via @remotion/google-fonts (swap to Geist for JAL) Caveat | T1 | live | F1 | canvas-only |
| `rm.story.speed-lines` | Radial speed lines with quick entrance and exit. | SVG lines with seeded random(), interpolate for in and out | T1 | live | F1 | fine |
| `rm.text.circle-marker` | Hand-drawn circle around a word. | rough-notation <Circle> with progress from interpolate; font via @remotion/google-fonts (swap to Geist for JAL) Cormorant Garamond | T1 | live | F1 | fine |
| `rm.text.crossed-off` | Hand-drawn cross-out over text. | rough-notation <CrossedOff>; font via @remotion/google-fonts (swap to Geist for JAL) Cormorant Garamond | T1 | live | F1 | fine |
| `rm.text.news-article-highlight` | News article treatment: slow camera move plus highlight on key passages. | rough-notation <Highlight> over words (positions from OCR in the matching prompt), spring + interpolate camera | T1 | live | F1 | fine |
| `rm.text.spinning-text-wheel` | 3D wheel that spins through options and settles on one. | rotateX with perspective, mask fade at the edges, spring deceleration; font via @remotion/google-fonts (swap to Geist for JAL) Mona Sans | T1 | live | F1 | fine |
| `rm.text.strike-through` | Hand-drawn strike-through. | rough-notation <StrikeThrough>; font via @remotion/google-fonts (swap to Geist for JAL) Cormorant Garamond | T1 | live | F1 | fine |
| `rm.text.marker` | Hand-drawn marker highlight on text. | rough-notation <Highlight> + spring; font via @remotion/google-fonts (swap to Geist for JAL) Cormorant Garamond | T1 | live | F1 | fine |
| `rm.yt.comment-highlight` | YouTube-style card featuring a viewer comment. | interpolate + spring, perspective tilt, SVG icons; font via @remotion/google-fonts (swap to Geist for JAL) Inter; shadows | T1 | live | F1 | canvas-only |
| `rm.yt.end-card` | Clean YouTube end card with social links and slots for recommended videos. | interpolate + spring, <Img>; font via @remotion/google-fonts (swap to Geist for JAL) Inter; shadows | T1 | live | F1 | canvas-only |
| `rm.yt.subscribe-nudge` | Creator-branded subscribe prompt with a subscribed state. | interpolate + spring, <Audio> from @remotion/media and a click sound from @remotion/sfx; font via @remotion/google-fonts (swap to Geist for JAL) Inter; shadows | T1 | video | F1 | canvas-only |
| `rm.el.author-guidelines` | How to author and submit an Element: one focused technique, portable, own assets, in and out animation, Studio controls, preview poster. | copy elements-template, register in element-definitions.ts, installationMode wrapped or component-owned-sequence, Interactive.withSchema(), staticFileRef for assets, render-element-previews; third-party libraries (Remocn, Lexington Themes) are not vetted by JAL | T1 | video | S | fine |
