# Thumbnail, posters and preloading

A Remotion section should show something useful before it plays, and its assets should be ready when it plays. This file covers `<Thumbnail>`, the three ways to get a poster, and the `@remotion/preload` and `prefetch()` APIs.

From: https://www.remotion.dev/docs/player/thumbnail , https://www.remotion.dev/docs/player/preloading , https://www.remotion.dev/docs/player/premounting , https://www.remotion.dev/docs/preload/ , https://www.remotion.dev/docs/preload/preload-audio , https://www.remotion.dev/docs/preload/preload-font , https://www.remotion.dev/docs/preload/preload-image , https://www.remotion.dev/docs/preload/preload-video , https://www.remotion.dev/docs/preload/resolve-redirect , https://www.remotion.dev/docs/web-renderer/render-still-on-web

## 1. `<Thumbnail>`

A component that draws **one frame** of a composition in a React app, with no playback loop. It comes from `@remotion/player` (since 3.2.41).

```tsx
import { Thumbnail } from "@remotion/player";

<Thumbnail
  component={Hero}
  inputProps={inputProps}
  frameToDisplay={90}
  durationInFrames={150}
  fps={30}
  compositionWidth={1920}
  compositionHeight={1080}
  style={{ width: "100%" }}
/>
```

Props: `component` or `lazyComponent`; `frameToDisplay` (which frame); `durationInFrames` and `fps` (required, because the composition may read them from `useVideoConfig()`); `compositionWidth`, `compositionHeight`; `inputProps`; `style`, `className`; `renderLoading`, `errorFallback`; `overflowVisible`; `logLevel`; `noSuspense`.

- Like the Player it does not use `<Composition>`; pass the component.
- Sizing works as for the Player (`player.md` section 6).
- `ThumbnailRef` offers `getContainerNode()`, `getScale()`, `addEventListener` and `removeEventListener`. Events: `error`, `waiting`, `resume` (the last two from 4.0.125).
- It needs loading if the composition uses Suspense or `lazyComponent`; `renderLoading` shows meanwhile.
- A Thumbnail is a real render of the composition, so it always matches the playing version (same fonts, same props). It is DOM, so its text is selectable and readable by assistive technology (see `accessibility.md`).

JAL uses a Thumbnail for: stage 1 of the poster-first pattern, the reduced-motion view, step states in a scroll story, gallery cards that open a Player, and previews of the user's configured composition next to an Export button.

Cost: a Thumbnail still loads the Remotion runtime and the composition code. It is cheap to *run*, not cheap to *ship*. The static poster image (below) is what keeps the first paint light.

## 2. The three poster strategies

| Strategy | Use for | How |
|---|---|---|
| A. Static image (WebP) | The LCP, anything above the fold, no-JS and server HTML | Export the poster frame to a file once; show it in `MediaFrame`; swap to stage 1 and 2 after hydration |
| B. Thumbnail | After hydration, reduced motion, below the fold, step stories | `<Thumbnail frameToDisplay={posterFrame}>` |
| C. Player poster props | An unplayed or paused Player that should show a custom still or a "play" overlay | `renderPoster` with `showPosterWhenUnplayed`, `showPosterWhenPaused`, `showPosterWhenEnded`, `showPosterWhenBuffering`, `showPosterWhenBufferingAndPaused`; `posterFillMode="composition-size"` scales the poster with the picture, `"player-size"` (default) keeps a constant-size overlay such as a play button |

Notes on C: poster props are all off by default. `showPosterWhenEnded` needs `moveToBeginningWhenEnded={false}`. Poster callbacks receive `{ height, width, isBuffering }`. A buffering UI shows only after `bufferStateDelayInMilliseconds` (300 ms) so short stalls do not flash.

Choosing: A for the first paint, B for the in-page still, C for the play overlay. The `posterFrame` is the frame that tells the whole story in one still: final state, labels visible, nothing mid-transition (the same rule as `frames.md` section 5). Declare it in the composition's schema file.

## 3. Making the static poster (A) without headless Chrome

Preferred route, in the viewer's own browser:

1. A dev-only route in the app (`/__poster`, not shipped) renders `renderStillOnWeb({ composition, frame: posterFrame, inputProps })`.
2. The result has `blob({ format, quality })` and `url()` (format png, jpeg or webp; quality for jpeg and webp). Download the WebP blob and save it to `apps/web/public/posters/<id>.webp`. A person clicks a button; no headless browser runs.
3. Check size: 200 KB or less, the dimensions equal the composition's, `scale` set to 1 (or 2 for a retina hero).
4. Commit the file. Rebuild it whenever the composition's look changes.

Rules: `renderStillOnWeb` needs the web renderer's supported CSS (`client-side-rendering.md` section 4) and CORS-clean images. A composition outside that subset gets its poster from a manual screenshot in the browser (Chrome DevTools "Capture node screenshot") or from the JAL frame-core screenshot script; record which. A server-side `npx remotion still` uses headless Chrome Headless Shell and needs Brian's confirmation as an extra stack.

## 4. `@remotion/preload`

Remotion mounts only the frames it needs, so assets load as they enter the picture. Preloading asks the browser to fetch them early.

| Function | Purpose | Notes |
|---|---|---|
| `preloadVideo(src)` | Preload a video for HTML5 video elements | Affects `<Html5Video>`, **not** `<Video>` from `@remotion/media` |
| `preloadAudio(src)` | Preload audio for HTML5 audio | Affects `<Html5Audio>` |
| `preloadImage(src)` | Preload an image so `<Img>` shows at once | |
| `preloadFont(src)` | Preload a font file | |
| `resolveRedirect(src)` | Follow redirects to the final URL | Throws if the resource has no CORS |
| `preloadGif(src)` | Preload and pre-parse a GIF | Named on the Player preloading page, not part of the five-function `@remotion/preload` list. **[verify]** which package exports it (likely `@remotion/gif`) |

Each returns a function that undoes the preload. Call them at module level or in `useEffect`, never during render. Preload only works on the final URL: if the URL redirects, resolve it first, and if the redirect has no CORS you cannot preload it (best effort: try the resolved URL, fall back to the original). A preload does nothing if the component mounted immediately.

JAL guidance:

- For a Remotion section the preloads belong in the lazy chunk's module scope for assets used in the first scene, so they start when the chunk arrives.
- Fonts: the page already preloads its own web fonts (`<link rel="preload" as="font" crossorigin>`). If the composition uses `@remotion/fonts` or `@remotion/google-fonts`, load them through those packages so the web renderer can also embed them in SVG text (`client-side-rendering.md` section 4).
- For `@remotion/media` `<Video>` and `<Audio>`, use `premountFor` on the tag instead of `preloadVideo` (`player.md` section 8).
- Do not preload what a lazy section may never show.

## 5. `prefetch()`

`prefetch(src)` downloads the whole file, makes a Blob URL, and the Remotion media and image components then use that Blob URL automatically.

- More reliable (the asset is fully local) but waits for the whole download. Use `@remotion/preload` for large files and `prefetch()` for small ones that must be instant.
- Not recommended for most cases. Do not call it after the Player is mounted (it causes playback issues). Free the memory with the returned `free()`.
- `prefetch(src, { logLevel: "trace" })` logs while debugging; remove for production.
- Requires CORS on the resource.
- Comparison: preload works with HTML5 tags, images and fonts, resolves redirects with `resolveRedirect()`, needs CORS only when resolving; prefetch works with the Remotion media tags (`<Video>`, `<Audio>`), handles redirects automatically, and always needs CORS.

## 6. Premounting as preload inside the timeline

For scene changes inside a composition, `premountFor` on `<Sequence>` (or on `<Video>`, `<Audio>`) mounts the next scene early, invisible, so its assets load before it appears. In Remotion 5.0 every `<Sequence>` premounts for 1 second by default. This is the supported way to avoid black frames and flicker between scenes (`player.md` section 8).

## 7. Lazy loading checklist

1. The main entry never imports `@remotion/player`. Only `stage.chunk.tsx` does.
2. Stage 0 poster is in the HTML (or the first React render) with width and height set.
3. Stage 1 loads on a close IntersectionObserver (about 300 px margin) rooted on the real scroller.
4. A composition that is large lives behind `lazyComponent` or a second dynamic import so the Thumbnail can show before the heavy parts arrive.
5. Preloads start in the chunk's module scope.
6. Reduced motion stops at the Thumbnail and never loads media tags that only the playing version needs.
7. Record the chunk size and the poster size in the build report.
