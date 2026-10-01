# @remotion/media and @remotion/media-utils

`@remotion/media` holds the recommended `<Video>` and `<Audio>` tags (WebCodecs and Mediabunny based). `@remotion/media-utils` holds helpers to read media info and to visualize audio. Both matter for a website because the Player, the web renderer and the Studio all run through these tags.

From: https://www.remotion.dev/docs/media/ , https://www.remotion.dev/docs/media/video , https://www.remotion.dev/docs/media/audio , https://www.remotion.dev/docs/media/support , https://www.remotion.dev/docs/media/cache , https://www.remotion.dev/docs/media/fallback , https://www.remotion.dev/docs/media-utils/ , https://www.remotion.dev/docs/media-utils/visualize-audio-waveform , https://www.remotion.dev/docs/media-utils/create-smooth-svg-path

## 1. `<Video>` and `<Audio>` from `@remotion/media`

- The recommended tags for new code. During rendering they extract the **exact** frame (or audio slice) with Mediabunny and, for video, draw it into a `<canvas>`, so media stays on Remotion's timeline.
- In the Player they have **native buffering support** on by default: playback pauses while the media loads and resumes when ready.
- Naming: the older tags from the `remotion` package were renamed `<Html5Video>` and `<Html5Audio>`; `<OffthreadVideo>` stays. If the import is from `remotion`, it is the HTML5 tag; from `@remotion/media`, it is the new one.
- License: Remotion License, like the rest.
- Install: `bun add --exact @remotion/media@<v> mediabunny@<matching version>` (the Mediabunny version is paired with the Remotion version; `mediabunny.md` section 5).

### Props (Video)

| Prop | Meaning |
|---|---|
| `src` | URL or `staticFile()`; HLS `.m3u8` playlists (VOD) work |
| `from`, `durationInFrames` (4.0.446) | Where the clip starts on the parent timeline and how many source frames play; same meaning as `<Sequence>`; the clip occupies `durationInFrames / playbackRate` frames |
| `trimBefore` | Cut the start (in frames at the composition fps) |
| `trimAfter` | Deprecated, use `durationInFrames` |
| `premountFor`, `postmountFor` (4.0.495) | Mount early or keep mounted after the end; invisible and frozen while premounted or postmounted; `styleWhilePremounted` and `styleWhilePostmounted` override the hidden styles |
| `volume` | A number or a function of the frame |
| `muted` | Drop the audio |
| `playbackRate` (4.0.354) | Speed |
| `loop`, `objectFit`, `style` | As expected; size with CSS |
| `headless` | Mount the tag without showing it, for pixel work or textures (used in the Three.js texture recipe) |
| `cropLeft`, `cropRight`, `cropTop`, `cropBottom` (4.0.500) | Crop by a ratio from 0 to 1 |
| `effects` (4.0.464) | Apply effects after the frame is drawn to the canvas |
| `onVideoFrame` | Receive each drawn frame (for Three.js textures or pixel work) |
| `onError` (4.0.404) | Return `"fallback"` or another action when decoding fails |
| `fallbackOffthreadVideoProps` | Props for the fallback tag, for example `onAutoPlayError` |
| `name` | Label in the Studio timeline |

`<Audio>` has the same timing props (`from`, `durationInFrames`, `trimBefore`, `premountFor`, `postmountFor`), plus `volume`, `playbackRate`, `loop`, `loopVolumeCurveBehavior`, `onError`, `name`.

## 2. Supported media

- Formats and codecs are whatever Mediabunny supports (`mediabunny.md` section 4): MP4/MOV/Matroska/WebM/Ogg/MP3/WAV/AAC/FLAC/TS/HLS containers; AVC, HEVC, VP8, VP9, AV1 and (4.0.487, opt-in) ProRes video.
- **CORS is required** for any asset not served from the bundle: either the server sends `Access-Control-Allow-Origin`, or the file is under the public path (`staticFile()`).
- Matroska/WebM audio extraction must decode everything before the requested point because the container stores only millisecond timestamps. Prefer `.mp4`, `.mov`, `.m4a` for long or distributed renders.
- HEVC (H.265) cannot be decoded by Chrome Headless Shell, so server renders using HEVC inputs fall back (see section 4). In a real browser, HEVC works only where the browser decodes it.
- Alpha channel video needs WebGL in the browser; headless defaults lack it.

## 3. Decoded media cache

`@remotion/media` keeps decoded frames in memory because decoding a delta frame needs the last keyframe and all deltas since. The cache is shared by all `<Video>` and `<Audio>` instances in a render, defaults to 50 percent of available memory (minimum 500 MB, maximum 20 GB), and is set per render with `mediaCacheSizeInBytes` on the render APIs (including `renderMediaOnWeb`). The Player is a live playback, not a render, but a page with several heavy Players still spends decoder and memory; budgets are in `website-integration.md` section 7.

## 4. Fallback behavior

If a file cannot be decoded (CORS failure, unsupported container, unsupported codec such as H.265 in headless, alpha without WebGL), `<Video>` may switch automatically to `<OffthreadVideo>` and `<Audio>` to `<Html5Audio>` from `remotion` and log a warning (`Cannot decode ..., falling back to <OffthreadVideo>`). You can observe, customize or prevent the fallback with `onError`. In **client-side rendering these fallback tags are unsupported**, so a composition meant for `renderMediaOnWeb` must keep its media decodable (`client-side-rendering.md`). Check with Mediabunny's `canDecode` snippet before using a user-supplied file (`mediabunny.md` section 6).

## 5. JAL rules for media in Remotion sections

1. Autoplaying website compositions carry no audio and, where possible, no decoded video (authored frames cost less).
2. If a video is the point (a screen recording), prefer a short, small file, `premountFor` for the next clip, and a poster; budgets: 5 MB per section desktop, 2 MB phone.
3. Always set `onError` so a bad file shows the poster instead of a broken frame.
4. Write `muted` explicitly on silent video.
5. For HLS or long programs use a normal `<video>` element in `MediaFrame` (not Remotion); Remotion is for composed motion, not as a video host.
6. Confirm CORS headers on the Hono asset route before shipping.
7. Videos used as 3D textures: mount a `<Video>` headless and use `onVideoFrame` to update the texture (`videos.md` section 6).

## 6. `@remotion/media-utils`

A package of helpers to get info about video and audio and to visualize audio. Except `useAudioData()`, the functions also work outside Remotion. Its metadata functions are based on Mediabunny. Install `bun add --exact @remotion/media-utils@<v>`.

Functions on the package page: `audioBufferToDataUrl`, `getAudioData`, `getAudioDurationInSeconds`, `getVideoMetadata`, `getWaveformPortion`, `useAudioData`, `useWindowedAudioData` (fetches only the current window, works only with `.wav`), `visualizeAudio` (music), `visualizeAudioWaveform` (voice), `createSmoothSvgPath`. License: MIT. Since metadata is now Mediabunny based, prefer Mediabunny directly for new code (`mediabunny.md`).

- `visualizeAudioWaveform({ fps, frame, audioData, numberOfSamples, windowInSeconds })`: processes `AudioData` (from `useAudioData()` or `getAudioData()`) into an array of values for drawing a **voice waveform**. For music use `visualizeAudio()`. `windowInSeconds` of `1 / fps` gives one window per frame.
- `createSmoothSvgPath({ points })`: turns points (usually from the visualizers) into the `d` string of a smooth SVG path with Bezier curves.

Typical use on a JAL page: an audio-reactive bars or waveform composition (a podcast player, a voice demo). It needs real audio, so it is a user-started Player with sound, not a silent loop. Provide a text alternative and captions or a transcript (`accessibility.md`).

```tsx
const audioData = useAudioData(src);        // inside the composition
if (!audioData) return null;
const wave = visualizeAudioWaveform({ fps, frame, audioData, numberOfSamples: 32, windowInSeconds: 1 / fps });
const d = createSmoothSvgPath({ points: wave.map((v, i) => ({ x: i * 20, y: 50 + v * 40 })) });
return <svg viewBox="0 0 640 100"><path d={d} fill="none" stroke="var(--ink-900)" strokeWidth="2" /></svg>;
```
