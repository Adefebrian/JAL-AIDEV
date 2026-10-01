# @remotion/player

The Player embeds a Remotion composition in any React app and plays it live in the browser. It is the main way a JAL website shows Remotion motion. The composition is plain React that reads a frame number, so the same component also renders to MP4 (see `web-renderer.md` and the server-side files in `../core/`).

Read `website-integration.md` first for how a JAL site wires it (poster first, lazy, reduced motion). This file is the API reference for the Player and the guide pages around it.

From: https://www.remotion.dev/player/ , https://www.remotion.dev/docs/player/ , https://www.remotion.dev/docs/player/installation , https://www.remotion.dev/docs/player/player , https://www.remotion.dev/docs/player/examples , https://www.remotion.dev/docs/player/scaling , https://www.remotion.dev/docs/player/best-practices , https://www.remotion.dev/docs/player/current-time , https://www.remotion.dev/docs/player/buffer-state , https://www.remotion.dev/docs/player/premounting , https://www.remotion.dev/docs/player/playback-issues , https://www.remotion.dev/docs/player/autoplay , https://www.remotion.dev/docs/player/custom-controls , https://www.remotion.dev/docs/player/media-keys , https://www.remotion.dev/docs/player/drag-and-drop/ , https://www.remotion.dev/docs/player/integration

## 1. What it is and when JAL uses it

- A Player is a `<video>`-like element whose picture is React. It takes a component, a size, a frame rate and a duration, and plays it with its own clock.
- Props can change while it plays, so the picture reacts to a form, an API, a store, or scroll position. That is the reason to pick it over a rendered MP4.
- The Player does not use `<Composition>`. Pass the component directly.
- Pick the Player over the JAL frame core (`skills/jal-immersive/references/frames.md`) when the piece also has to export to MP4, share code with a Remotion Studio project, use `@remotion/*` packages (Lottie, Three, Skia, captions, shapes), or be edited by someone who already works in Remotion. Pick the frame core for small, dependency-free demos. JEV decides per case (`jal-jev`); neither is the default for the other's job.
- Browser support: Chrome, Firefox, Safari. iOS Safari has no Fullscreen API, so `requestFullscreen()` cannot work there.

## 2. Install and version pinning

```bash
bun add --exact remotion@<v> @remotion/player@<v>
# optional, only when the page uses them
bun add --exact @remotion/media@<v> @remotion/preload@<v> @remotion/web-renderer@<v>
```

- Every `remotion` and `@remotion/*` package must be the same exact version, with no `^`. A mismatch is a runtime error. The docs show `npx remotion add @remotion/player` as the helper; JAL uses `bun add --exact`.
- Docs snapshot used for these files: Remotion 4.0.532, pages updated 2026-09-30. Where a page mentions Remotion 5.0 behavior it is noted below.
- For websites, only the Player side of Remotion is in the Bun build. The Remotion Studio and CLI are a separate authoring toolchain that lives only in a separate video workspace (`website-integration.md` section 2).

## 3. Minimal embed

```tsx
import { Player } from "@remotion/player";
import { Hero } from "./compositions/Hero";

export function HeroPlayer({ title }: { title: string }) {
  const inputProps = useMemo(() => ({ title }), [title]); // always memoize
  return (
    <Player
      component={Hero}
      inputProps={inputProps}
      durationInFrames={150}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      style={{ width: "100%" }}
      loop
      acknowledgeRemotionLicense
    />
  );
}
```

`compositionWidth` and `compositionHeight` are the size the composition has when rendered to MP4. The on-page size comes from `style`. `durationInFrames` must be a positive integer.

`acknowledgeRemotionLicense` only silences a console message. JAL sets it only while the project meets the license (free license, 3 people or fewer; see `products-and-licensing.md`).

## 4. Props that matter

Required: `component` or `lazyComponent` (exactly one), `durationInFrames`, `fps`, `compositionWidth`, `compositionHeight`.

| Group | Props | Notes |
|---|---|---|
| Data | `inputProps` | Typed from the component. Memoize it. |
| Playback | `loop`, `autoPlay`, `playbackRate` (-10 to 10, not 0), `initialFrame`, `inFrame`, `outFrame`, `moveToBeginningWhenEnded` | `initialFrame` cannot change after mount. Media tags cannot play in reverse. `inFrame`/`outFrame` loop only a slice. |
| Controls | `controls`, `showVolumeControls`, `allowFullscreen`, `clickToPlay`, `doubleClickToFullscreen`, `spaceKeyToPlayOrPause`, `alwaysShowControls`, `hideControlsWhenPointerDoesntMove`, `initiallyShowControls`, `showPlaybackRateControl` | Defaults: `controls` false; `clickToPlay` true only with controls; space key works only with controls. |
| Custom UI | `renderPlayPauseButton`, `renderFullscreenButton`, `renderMuteButton`, `renderVolumeSlider`, `renderCustomControls` | `renderCustomControls` puts your buttons in the bar between playback and fullscreen. `renderPlayPauseButton` may return null to fall back to the default. |
| Loading | `renderLoading`, `renderPoster`, `showPosterWhenUnplayed`, `showPosterWhenPaused`, `showPosterWhenEnded`, `showPosterWhenBuffering`, `showPosterWhenBufferingAndPaused`, `posterFillMode` | Poster props are all off by default. `posterFillMode="composition-size"` scales the poster with the picture, good for a freeze frame. |
| Buffering | `bufferStateDelayInMilliseconds` | Default 300 ms before the buffering UI shows. |
| Audio | `initiallyMuted`, `initialVolume`, `volumePersistenceKey`, `numberOfSharedAudioTags`, `sampleRate` | Volume is stored in localStorage by default (`remotion.volumePreference`). Pass `initialVolume` to avoid reading or writing storage. `numberOfSharedAudioTags` defaults to 5 in 4.0 and 0 in 5.0, and cannot change after mount. |
| Layout | `style`, `className`, `overrideInternalClassName`, `overflowVisible` | `overflowVisible` lets draggable items leave the canvas. |
| Errors | `errorFallback`, `logLevel` (`trace` to `error`, default `info`), `noSuspense` | `logLevel="trace"` helps debug media, never ship it. |
| System | `browserMediaControlsBehavior` | See section 10. |
| Experimental | `_experimentalKeepAudioContextAlive` | For editor-style apps only. Not for a marketing page. |

## 5. PlayerRef and events

Attach a ref to drive the Player.

Methods: `play(e?)`, `pause()`, `toggle(e?)`, `pauseAndReturnToPlayStart()`, `seekTo(frame)`, `getCurrentFrame()`, `isPlaying()`, `mute()`, `unmute()`, `isMuted()`, `getVolume()`, `setVolume(0..1)`, `requestFullscreen()`, `exitFullscreen()`, `isFullscreen()`, `getScale()`, `getContainerNode()`, `addEventListener(name, fn)`, `removeEventListener(name, fn)`.

- Pass the click event to `play(e)` and `toggle(e)` so browser autoplay rules do not block audio.
- `seekTo(frame)` while playing pauses for a moment and resumes. For scroll scrubbing, keep the Player paused (see `scroll-scrub.md`).
- `getContainerNode()` gives the wrapper div for custom listeners (pointer events, ResizeObserver).
- `getScale()` is the on-page size divided by the composition size.

Events (`e.detail` holds the payload): `play`, `pause`, `ended`, `seeked` (frame), `timeupdate` (frame, throttled to about 4 per second), `frameupdate` (every frame, during play and seek), `ratechange`, `volumechange`, `mutechange`, `fullscreenchange`, `scalechange`, `waiting` and `resume` (buffering), `error`.

Always remove listeners in the effect cleanup.

## 6. Sizing and scaling

- With no `style` size the Player is as large as the composition.
- Give only `width` or only `height` in `style` and the other side follows the aspect ratio (it uses the CSS `aspect-ratio` property since 3.3.43, so there is no layout shift on mount).
- `style={{ width: "100%" }}` fills the parent and keeps the ratio. This is the default for JAL pages, inside a `MediaFrame` that already reserves the ratio.
- To fit a box of unknown aspect, wrap in a `position: relative` container and size the Player with absolute positioning.
- Design the composition at its export size (for example 1920 by 1080) and let the Player scale it down. Text sizes then scale with the picture, so check legibility at the smallest page width (a 390px phone shows a 1920 picture at about 0.2). Compose phone-first variants as separate compositions when text must stay readable (JEV `motion.intensity` and the section concept decide).

## 7. Best practices

1. **Do not re-render the Player.** Never keep the current time in the component that renders `<Player>`. Render controls, time displays and progress bars as siblings that receive the ref.
2. **Memoize `inputProps`.** A new object every render re-renders the whole composition tree.
3. **Pass the click event to `play()`.** Use `onClickCapture` (works better in Safari).
4. **Current time outside the composition.** `useCurrentFrame()` does not work outside a composition. Use a `useSyncExternalStore` hook that subscribes to the ref's `frameupdate` event, in a separate component. That component re-renders, the page does not.
5. Parent state that rarely changes (loop toggle) is fine to keep in the parent.

## 8. Buffer state, premounting, playback issues

- A Player can pause itself while content loads. `<Video>` and `<Audio>` from `@remotion/media` do this by default. For `<Html5Video>`, `<OffthreadVideo>` and `<Html5Audio>` add `pauseWhenBuffering`; for `<Img>` add `pauseWhenLoading`.
- Custom loaders: `useBufferState()` gives `delayPlayback()`. Do it inside `useEffect`, clear the handle in the cleanup, never inside `useState` (breaks React Strict Mode). Pair it with `delayRender()` if the same data also gates rendering.
- **Premounting.** Remotion mounts only the current frame, so media that appears later is not loaded yet. `premountFor` on `<Sequence>` (and on `<Video>`, `<Audio>`, and many visual components from 4.0.495 to 4.0.528) mounts it early, invisible (`opacity: 0`, `pointer-events: none`, local frame frozen at 0). In Remotion 5.0 every `<Sequence>` premounts for 1 second by default; opt out with `premountFor={0}`. Do not premount a `<Sequence layout="none">`.
- Do not over-premount or over-prefetch; it spends memory and decoder slots.
- **Playback issues** (black frames between scenes, choppy audio, unexpected pauses): use the `@remotion/media` tags, add `premountFor`, do not call `prefetch()` once the Player is mounted, enable `logLevel="trace"` while debugging, and be on 4.0.302 or later.
- Avoiding flickers from unloaded assets is covered in `thumbnail-and-preload.md`.

## 9. Autoplay and audio

- Browsers block audio that starts without a user gesture; Mobile Safari is the strictest, so test there first.
- JAL rule: a marketing Player that autoplays has **no audio track at all** (decorative motion is silent). A Player with sound starts only from a click, with `play(e)`.
- `autoPlay` is discouraged when the composition contains audio. If the autoplay fails for a `<Video>` that starts after the first gesture, the default is to play it muted and log a message; handle it with `fallbackOffthreadVideoProps.onAutoPlayError` on `<Video>` from `@remotion/media`.
- Audio that enters later (an `<Audio from={120}>`) may hit the autoplay policy. For `<Html5Audio>` the workaround is `numberOfSharedAudioTags` (silent tags warmed on the first interaction). Prefer designing the sound to start at frame 0.
- `initiallyMuted` helps when the video must autoplay regardless of policy.

## 10. Controls, custom controls, media keys

- Default controls (play, seek bar, time, volume, fullscreen, optional playback rate) turn on with `controls`.
- Two ways to customize: inline (keep the bar, replace single buttons or add a slot with `renderCustomControls`), or fully outside the Player (your own play button, time, fullscreen, seek bar, loop, volume, mute built on the ref). Outside controls are the JAL default for anything beyond a plain demo, because they use the kit's tokens, focus rings and 44px targets, and because of the accessibility gaps in `accessibility.md`.
- Fullscreen needs feature detection (not all browsers support it), and with server rendering the check must run after mount.
- A muted video can have a volume above 0; Remotion treats volume 0 as muted too. A custom slider shows 0 when muted.
- **Media keys** (`browserMediaControlsBehavior`): `prevent-media-session` (default) turns the keys into a no-op so media tags cannot resume by themselves; `register-media-session` wires play/pause, previous (seek to start), forward and back 10 seconds through the Media Session API; `do-nothing` is the pre-4.0.221 behavior. With several Players on a page, at most one may use `register-media-session`; leave the rest on the default.

## 11. Drag and drop on the canvas

The Player forwards pointer events, so interactive pieces (draggable and resizable items, selection outlines) can be built inside it. Rules from the guide: turn `controls` off so nothing covers the canvas, render playback controls outside, remember the Player can be CSS-scaled (use `useCurrentScale()` to convert pointer deltas), render selection outlines in a sorted layer so the selected item is on top, and set `overflowVisible` if items may leave the canvas. The guide builds this in six steps: item data type, item renderer, outline renderer, outline sorting, a Main component, then the Player. JAL uses it for configurator or "build your own" sections, not for decoration.

## 12. Lazy component and errors

- `lazyComponent={useCallback(() => import("./Comp"), [])}` loads the composition on demand. The Player then shows `renderLoading` until it resolves. Wrap in `useCallback` or it re-renders constantly. A Player containing Suspense also uses `renderLoading`.
- Compositions are prone to crashing. A render error unmounts only the video and shows `errorFallback`, and the page survives. Errors in event handlers and async code are not caught. Re-mount by changing `key`. Map the fallback to the kit's error pattern (plain text, retry button).

## 13. Code sharing with Studio (integration)

One component serves three places: Remotion Studio (authoring), the Player (page), and rendering (MP4). The documented layout puts Remotion code in its own folder (`remotion/index.ts`, `Root.tsx`, the composition files) beside the app, keeps `registerRoot` in `index.ts` (do not merge the files, it breaks hot reload), and runs `npx remotion studio src/remotion/index.ts`. The app imports the composition and gives it to `<Player>`. The docs warn that the Studio and the app use different bundler configurations, so a bundler override must be made in both.

For JAL: the website bundle is `Bun.build` only. The Studio side belongs to the authoring toolchain inside the video workspace (decided 2026-10-01, `website-integration.md` section 2); a Studio or CLI render needs Brian's confirmation per project. Keep composition files free of Studio-only imports so both sides compile.

## 14. Example index

The examples page covers: bare Player, controls, loop, changing size, autoplay, programmatic control, listening to events, an interactive Player bound to a text field, playing only a portion (`inFrame` and `outFrame`), and lazy loading a component. There is also a snippet for embedding a Player in an iframe, which JAL does not use (it adds a second document and breaks scroll sources).

Templates named by the docs for a full video app (Player plus cloud rendering): Next.js, Next.js on Vercel Sandbox, React Router 7. JAL does not use these for websites; they are Next or Remix based (see the stack rule in `website-integration.md`).
