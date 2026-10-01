# Client-side rendering

Client-side rendering (CSR) turns a composition into an MP4, WebM, audio file or still image **inside the viewer's browser**, with no Node server, no Lambda and no headless Chrome. It is the JAL default way to make a file from a composition on a website. The API lives in `@remotion/web-renderer` (`web-renderer.md`); this file is the concepts, the limits and the rules for writing compositions that can use it.

From: https://www.remotion.dev/docs/client-side-rendering/ , https://www.remotion.dev/docs/client-side-rendering/how-it-works , https://www.remotion.dev/docs/client-side-rendering/limitations , https://www.remotion.dev/docs/client-side-rendering/migration , https://www.remotion.dev/docs/client-side-rendering/cancellation , https://www.remotion.dev/docs/client-side-rendering/page-responsiveness , https://www.remotion.dev/docs/client-side-rendering/html-in-canvas , https://www.remotion.dev/automate

## 1. What it is, and how it differs from server rendering

| | Server-side (`@remotion/renderer`, Lambda) | Client-side (`@remotion/web-renderer`) |
|---|---|---|
| Runs in | Node.js with a Chrome Headless Shell | The browser tab |
| Encoder | FFmpeg | WebCodecs through Mediabunny |
| Bundling step | Yes (Remotion bundler) | None; pass the component and config directly |
| Screenshot | Real browser screenshot, pixel accurate | The renderer places elements on a canvas by reading the DOM, so only a **subset** of HTML and CSS is supported |
| Infra | Server or Lambda | None |
| Status | Mature | Stable API from 4.0.491 |

For JAL: websites use CSR for user-triggered exports and posters. Server rendering is for long, heavy or scheduled jobs and needs a `video.render_path` decision and Brian's confirmation per project (`../rendering/render-paths.md`).

## 2. Browser support

CSR needs the WebCodecs API: Chrome 94 or newer, Firefox 130 or newer, Safari 26 or newer. Always run `canRenderMediaOnWeb()` before showing an Export button and hide or explain the button when it says no (`web-renderer.md` section 4). The Player itself works in all current browsers; export is the part that needs the check.

Some features have narrower support: CSS filters do not work in Safari/WebKit; `<AnimatedImage>` is supported when rendering in Chrome; HTML-in-canvas (section 8) is Chromium with a flag.

## 3. How it works (so you can debug it)

1. The component mounts in the DOM, hidden from the user, and an empty canvas is made.
2. For each frame, a tree walker visits every element and text node (skipping `display: none`).
3. For each capturable element the renderer resets all CSS transforms up the tree, reads the bounding boxes, re-adds the transforms to find the true placement, gets the pixels (native capture for `<svg>`, `<canvas>`, `<img>`), and draws them on the canvas. Boxes, borders, radii and backgrounds are redrawn with the Canvas 2D API.
4. Text is rebuilt by wrapping text nodes in spans, splitting words with `Intl.Segmenter`, measuring each word, and drawing it.
5. Audio from `<Audio>` and `<Video>` is mixed into the audio track.
6. Mediabunny encodes frames and audio to the file.

Context isolation: the render runs in the **same page** as your app. Your CSS and Tailwind variables apply (good for tokens) but can also clash with the host page, so scope composition CSS.

## 4. Limitations (the JAL "exportable subset")

Compositions marked `exportable: true` must stay inside this list. Everything not listed is unsupported.

**Supported**

- Layout and position: margin, left, display, width, height, flex, flex-direction and the rest that change box geometry; `overflow`; `object-fit`.
- Transforms: `transform`, `transform-origin`, `opacity`, `scale`, `rotate`, `translate`, `backface-visibility`.
- Backgrounds: `background-color`; `background-image` with a **linear gradient**; `background-size`, `background-position` (px or %) for gradients; `background-clip`.
- Borders: `border`, style, color, width; `border-radius` (including different horizontal and vertical radii); `outline`.
- Text: `color`, `-webkit-text-fill-color`, `font-family`, `font-size`, `font-style`, `font-weight`, `line-height`, `letter-spacing`, `word-spacing`, `text-transform`, `text-rendering`, `font-variant-caps`, `font-kerning`, `font-stretch` (percentages approximated), `direction`, `text-decoration` (solid, dotted, dashed, double, wavy, with color and thickness), `text-shadow`, `-webkit-text-stroke*`, `paint-order`.
- Shadows: basic `box-shadow`.
- Masks: `mask-image` with a linear gradient; a single raster `url()` mask (4.0.501 and later) when same-origin, `data:` or `blob:`, with `mask-size: 100% 100%`, `mask-position: 0% 0%`, `no-repeat`.
- Filters: `blur`, `brightness`, `contrast`, `drop-shadow`, `grayscale`, `hue-rotate`, `invert`, `opacity`, `saturate`, `sepia`, combinations. Not in Safari.
- Clip path: `polygon()`, `path()`, `circle()`, `ellipse()`, `inset()`.
- Elements and components: `<Video>` and `<Audio>` from `@remotion/media`, `<Img>` (SVG data URIs too), `<Gif>`, `<Rive>`, `<Lottie>`, `<ThreeCanvas>`, `<SkiaCanvas>`, `<AnimatedImage>` (Chrome), `<HtmlInCanvas>` (with its `onPaint` and `onInit`).
- Web fonts inside SVG text from `@remotion/fonts` or `@remotion/google-fonts` (4.0.525 and later), when the font selection is inside the SVG (inline style, `font-family` attribute or a `<style>` inside the SVG).

**Not supported**

- `perspective`, `perspective-origin`, `transform-style` (always treated as 3D-preserving), `object-position` (content stays centered), `writing-mode`, `corner-shape`.
- Other `background-image` kinds and other `background-*` properties.
- `inset` shadows and the spread radius.
- SVG masks, multiple mask layers, luminance masks, cross-origin mask URLs.
- `url()` references to inline SVG filters; `clip-path: url()`.
- `backdrop-filter`, `mix-blend-mode`, `background-blend-mode`.
- `z-index`: order elements back to front in the DOM instead.
- `<OffthreadVideo>`, `<Html5Video>`, `<Html5Audio>` (use `<Video>` and `<Audio>` from `@remotion/media`), `<AnimatedEmoji>` (use `<Lottie>`).
- Fonts from CSS `@font-face`, a Google Fonts CSS import or the `FontFace` API, **inside SVG text** (they are not embedded); text in `<foreignObject>`.

**JAL law overlap.** The law already bans shadows, gradients and glow on page chrome, so a law-clean composition mostly sits inside this subset. A composition that uses a CSS gradient background or shadow for a canvas-zone look should be marked `exportable: false`, or use the supported linear-gradient/`box-shadow` forms only.

When HTML-in-canvas capture is active (section 8) these CSS limits do not apply, but that path is Chromium-only and experimental.

## 5. Asset rules (CORS)

CSR enforces CORS. A tainted canvas cannot be exported.

- Every image, video and audio the composition reads must be same-origin (served by Hono from the public path) or send `Access-Control-Allow-Origin`.
- Typical errors: `Could not draw image ... The image is tainted due to CORS restrictions` (add the header) and `... The image is in a broken state` (404 or bad URL).
- Only `<Video>` and `<Audio>` from `@remotion/media` can carry media.
- Hono example for the asset route:

```ts
app.use("/assets/*", async (c, next) => {
  await next();
  c.header("Access-Control-Allow-Origin", c.req.header("origin") ?? "");
  c.header("Vary", "Origin");
  c.header("Cross-Origin-Resource-Policy", "cross-origin");
});
```

(Allow-list the origins that need it; do not echo any origin for credentialed routes.)

## 6. Migration checklist for a composition that already works on the server

1. Replace `getRemotionEnvironment()` with the `useRemotionEnvironment()` hook (the global one conflicts when a Player is mounted on the same page).
2. Replace `delayRender()`, `continueRender()` and `cancelRender()` with `useDelayRender()` so they are scoped to this composition.
3. Make all media CORS-clean.
4. Move to `<Video>` and `<Audio>` from `@remotion/media`.
5. Remove or replace every unsupported CSS property above.
6. You cannot read input props through `getInputProps()` in CSR; they arrive as the component's props.
7. Re-check fonts: use `@remotion/fonts` or `@remotion/google-fonts`.

## 7. Cancelling

`renderMediaOnWeb` and `renderStillOnWeb` take a `signal` (AbortSignal). A cancel makes the promise reject, so check `controller.signal.aborted` in the catch block to tell a user cancel from a real error.

```ts
const controller = new AbortController();
try {
  await renderMediaOnWeb({ composition, inputProps, signal: controller.signal });
} catch (error) {
  if (controller.signal.aborted) return;   // the user cancelled
  throw error;
}
```

Always offer a Cancel button during a render, and abort on unmount (`useEffect` cleanup) or on route change.

## 8. Page responsiveness and HTML-in-canvas

**Page responsiveness (4.0.487).** The render runs on the page's main thread. `pageResponsiveness` makes it hand the event loop back so the page stays usable. `"disabled"` is fastest, `"low"` yields every 100 ms of work, `"medium"` (default) every 33 ms, `"high"` every 16 ms, or pass a number of milliseconds. It is best effort; one long synchronous operation can still block. JAL default: `"medium"`; use `"high"` while the visitor can keep scrolling or typing, `"disabled"` only behind a blocking modal. The render runs in the same tab as the page (docs: "the same browser tab"), so keep the page quiet during long renders and keep the tab open; the Editor Starter production checklist says the same (the user keeps the page open until the render finishes).

**HTML-in-canvas (4.0.447).** An experimental Chromium path (`allowHtmlInCanvas: true`, flag `chrome://flags/#canvas-draw-element`) that captures full frames instead of rebuilding them. It removes the CSS limits but only works on Chromium with the flag, falls back automatically, may differ in pixels, and is skipped when the composition contains `<HtmlInCanvas>`. JAL leaves it off in production; it is a tool for a hard composition during development. It is not the same thing as the `<HtmlInCanvas>` design component.

## 9. JAL rules for an export-ready composition

1. List the target in the schema file: `exportable: true`, supported containers and codecs, and the CORS origins of its media.
2. Write it inside the subset above from the start; do not discover limits at the end.
3. Use frame-pure code (no random, no `Date`), because a frame is rendered independently.
4. Use `useRemotionEnvironment()` and `useDelayRender()`.
5. Test the real export in Chrome and in Safari 26 (filters aside) before shipping the button; fall back to "Download poster" or hide the button where `canRenderMediaOnWeb` says no.
6. Keep the same component for the Player and the export; do not fork.
7. Record a size and time sample (30 s at 1080p on a mid-range laptop and a phone) in the build report. Long exports on phones are a bad promise; cap duration and resolution there.

## 10. The automate story (context)

The Remotion "Automate" page positions CSR beside server rendering as the two ways to batch or user-trigger renders ("render millions of videos on your own infrastructure", "export on the client or on the server"), and lists the Player and the Editor Starter as the application layer. Its pricing block ties "embedding the Remotion Player" and render volume to the Automators plan for licensed companies. JAL's reading is in `products-and-licensing.md`.
