# Assets, images, fonts (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01). Video and audio tags are in `media.md`.

## What it is

Everything non-code a composition loads: `public/` files via `staticFile()`, images (`<Img>`, `<CanvasImage>`, `<AnimatedImage>`, `<Gif>`), iframes, CSS, fonts (`@remotion/fonts` `loadFont()`, `@remotion/google-fonts`), prefetching and the import-vs-staticFile rule.

## When a JAL agent uses it

Every brand video: logo (SVG/PNG), screenshots, hero stills, Google or self-hosted fonts, background images, product frames. Also for the "use Remotion tags, never native ones" rule that keeps renders from flickering.

## Hard rule: use the Remotion tag, not the native one

| Native | Use instead |
|---|---|
| `<img>`, Next `<Image>`, CSS `background-image` | `<Img>` (or `<Gif>` / `<AnimatedImage>` for animation) |
| `<video>` | `<Video>` from `@remotion/media` (recommended), `<OffthreadVideo>` or `<Html5Video>` |
| `<audio>` | `<Audio>` from `@remotion/media`, or `<Html5Audio>` |
| `<iframe>` | `<IFrame>` |

The Remotion components call `delayRender()` until loaded and stay on Remotion's timeline.

## staticFile and public/

- Put files in `public/` next to the `package.json` that depends on `remotion` (even if source lives in a subfolder). Reference with `staticFile('logo.png')` (`/logo.png` also fine). Returns something like `/static-32e8nd/logo.png`; the prefix changes between Studio restarts.
- Errors: no relative paths (`../public/x`, `./x`), no absolute OS paths, no `public/` prefix, and never wrap a remote URL in `staticFile()` (pass the URL straight to `<Img src>`).
- Since 4.0 it applies `encodeURIComponent`; do not pre-encode.
- `getStaticFiles()` returns `{name, src, sizeInBytes, lastModified}[]` (name has forward slashes; max 10000 files since 4.0.64; empty array outside Studio and render; being moved to `@remotion/studio`; use `src`, or wrap `name` in `staticFile()`).
- `watchStaticFile(name, cb)` returns `{cancel}`; Studio only (never fires in the Player; moving to `@remotion/studio`).
- Assets added to `public/` after `bundle()` are not available in a render, except server-side where you can copy into the bundle's `public/` after bundling.
- Remotion runs in a browser: no `fs`, no files outside the project. Use `public/` and `getStaticFiles()`.
- Image sequences: `` <Img src={staticFile(`frame${frame}.png`)} /> `` (string interpolation with `staticFile` is fine).
- Webpack dynamic imports: `import`/`require('./assets/x' + frame + '.png')` fails unless the expression is inside `require()`/`import()` (then the whole folder is bundled). Prefer `staticFile()`. Bun/Webpack caveat: the Remotion bundler is Webpack, not `Bun.build`.
- `import logo from './logo.png'` still works for images, videos (`webm mov mp4`), audio (`mp3 wav aac m4a`), fonts (`woff woff2 otf ttf eot`); 2 GB limit; discouraged.
- CSS: `import './style.css'`. SCSS needs `@remotion/enable-scss`; Tailwind via the template flag (see `integrations.md`).

## Images

### `<Img>`

```tsx
import {AbsoluteFill, Img, staticFile} from 'remotion';
<AbsoluteFill><Img src={staticFile('logo.png')} style={{width: 400}} /></AbsoluteFill>
```
Props: native `<img>` props plus: `maxRetries` (default 2, backoff 1 s, 2 s, 4 s; 3.3.82+), `onError` (the component must then be unmounted or `src` replaced or the render times out; without it a failure calls `cancelRender`), `onImageError(err)` (4.0.526+, works also in canvas mode), `crossOrigin` `'anonymous' | 'use-credentials'` (4.0.526+), `pauseWhenLoading` (Player buffer; false in 4.x, true in 5.0), `delayRenderTimeoutInMilliseconds`, `delayRenderRetries`, `cropLeft/Right/Top/Bottom` ratios 0..1 (4.0.500+), timing props `from`, `durationInFrames`, `trimBefore` (4.0.482+), `name`, `showInTimeline`, `hidden` (4.0.465+), `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted` (4.0.497+).
- `effects` (4.0.469+): with a non-empty array it renders through `<CanvasImage>` as a `<canvas>`; then `ref`, `srcSet`, `sizes`, `loading`, `decoding`, `fetchPriority`, `useMap`, `onLoad`, `onError`, `onImageFrame`, `alt` are unavailable; `style.objectFit` supports `fill | contain | cover`. Example: `import {blur} from '@remotion/effects/blur'; <Img src=... effects={[blur(...)]} />`. Needs CORS for remote images.
- Chrome image limit is 2^29 pixels. Do not use `<Img>` for GIFs.

### `<CanvasImage>` (4.0.466+)
`<CanvasImage src effects width height fit className id style crossOrigin cropX onError pauseWhenLoading maxRetries delayRenderRetries delayRenderTimeoutInMilliseconds premountFor .../>`: draws to `<canvas>` so effects can apply; remote assets must send CORS headers; `fit: 'fill' | 'contain' | 'cover'` (default fill); `ref` type `HTMLCanvasElement`; default `crossOrigin: 'anonymous'`; `maxRetries` default 2.

### `<AnimatedImage>` (4.0.246+)
GIF, APNG, AVIF, WebP synced to the timeline using the `ImageDecoder` Web API (Chrome and Firefox only, not Safari; remote files need CORS). Props: `src`, `width`, `height`, `fit` (fill default), `style` (no width/height), `loopBehavior: 'loop' | 'pause-after-finish' | 'clear-after-finish'`, `playbackRate`, `effects` (4.0.464+), `requestInit` (4.0.471+, credentials), crop props, premount props, timing props, `ref` (`HTMLCanvasElement`). No `onLoad`. For GIF without ImageDecoder use `@remotion/gif` `<Gif>`.

### `<IFrame>`
`<IFrame src delayRenderTimeoutInMilliseconds delayRenderRetries />`: waits for load; the embedded page must not animate on its own clock. Not available in client-side rendering.

## Prefetch (Player only)

```ts
import {prefetch} from 'remotion';
const {free, waitUntilDone} = prefetch(url, {method: 'blob-url', contentType, credentials, onProgress, logLevel});
await waitUntilDone();  // string: blob:/data: URL (or the original src while rendering)
free();
```
`method`: `'blob-url'` (fast) or `'base64'` (use in Safari if audio stutters). Remote assets need CORS. No-op outside the Player. Often not needed; see `@remotion/preload` for the alternative. Use it before swapping an audio source at runtime to avoid the "cannot be seeked" error.

## Fonts

### @remotion/fonts: loadFont (4.0.165+)

```ts
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
await loadFont({family: 'Bangers', url: staticFile('bangers.ttf')});   // blocks the render until ready
```
Options: `family`, `url` (staticFile or URL), `format` (`woff2 | woff | opentype | truetype`, default from extension), `ascentOverride`, `descentOverride`, `lineGapOverride`, `display`, `featureSettings`, `stretch`, `style`, `weight`, `unicodeRange`. Install: `bunx remotion add @remotion/fonts`.

Call `loadFont()` at module scope in the file of the composition (it handles the delay itself); then use `fontFamily: 'Bangers'`.

### @remotion/google-fonts
Per-font ES-module imports keep the bundle small:
```ts
import {loadFont} from '@remotion/google-fonts/Inter';
const {fontFamily} = loadFont('normal', {weights: ['400', '700'], subsets: ['latin']});
```
`getAvailableFonts()` (ES module import only; CommonJS throws) lists about 1400 fonts; each has `.load()` returning `{loadFont(), getInfo()}` (styles, weights, scripts). Limit a picker to a hand-picked list (`family`, `load: () => import('@remotion/google-fonts/Inter')`) to reduce bundle size. A font must also be loaded inside the video, not only in the picker UI.

Rules: wait for fonts before `fitText()`, `fillTextBox()`, `measureText()`. JAL: prefer self-hosted `public/` fonts via `@remotion/fonts` for deterministic, offline renders (no network at render time); Google Fonts need network during render (a firewall causes delayRender timeouts).

## Combining with JAL

- JAL brand fonts (Core tokens) go in `public/fonts/` and are loaded with `@remotion/fonts`; pass the family name through props.
- Logos and icons: inline SVG components (no network) beat `<Img>` for crisp scaling. JAL icon sourcing (koboyo/reicon) is the same as in the UI; bake the SVG into the comp.
- Page-level assets (hover images, WebGL textures) belong to the immersive reference, not here.

From:
- https://www.remotion.dev/docs/assets
- https://www.remotion.dev/docs/staticfile
- https://www.remotion.dev/docs/staticfile-relative-paths
- https://www.remotion.dev/docs/staticfile-remote-urls
- https://www.remotion.dev/docs/getstaticfiles
- https://www.remotion.dev/docs/watchstaticfile
- https://www.remotion.dev/docs/img
- https://www.remotion.dev/docs/animatedimage
- https://www.remotion.dev/docs/canvasimage
- https://www.remotion.dev/docs/iframe
- https://www.remotion.dev/docs/use-img-and-iframe
- https://www.remotion.dev/docs/webpack-dynamic-imports
- https://www.remotion.dev/docs/prefetch
- https://www.remotion.dev/docs/fonts-api/
- https://www.remotion.dev/docs/fonts-api/load-font
- https://www.remotion.dev/docs/font-picker
