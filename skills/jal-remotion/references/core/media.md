# Video, audio and media utilities (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01). `@remotion/media` (`<Video>`, `<Audio>`) has its own API page, covered in `../web/media.md` and `../web/videos.md`; this file records what the core pages say about choosing and using media tags.

## What it is

The media layer of a composition: three video tags, two audio tags, volume and trim rules, sample rate, HLS, transparency, HDR, greenscreen and colour correction effects, metadata, and the `@remotion/media-utils` helpers for waveforms and audio visualisation.

## When a JAL agent uses it

Product demo clips, screen recordings, voiceover, music beds, audio-reactive visuals, transparent overlays for web. Default for new code: `<Video>` and `<Audio>` from `@remotion/media` (Mediabunny + WebCodecs, fastest, works in client-side rendering). That is also the lighter, non-Chrome-bound path JAL prefers.

## Which tag (decision table)

| | `<Video>`/`<Audio>` (`@remotion/media`) | `<OffthreadVideo>` (`remotion`) | `<Html5Video>`/`<Html5Audio>` (`remotion`) |
|---|---|---|---|
| Based on | Mediabunny, WebCodecs | Rust + FFmpeg frame extractor | native `<video>` |
| Frame-perfect | yes | yes | not guaranteed |
| Render speed | fastest | fast | medium |
| Containers | aac flac m3u8 mkv mov mp3 mp4 ogg wav webm (falls back to OffthreadVideo if unsupported) | more (avi, caf, flv, m4a...) | aac flac m4a mkv mp3 mp4 ogg wav webm |
| Codecs | AAC FLAC H.264 MP3 Opus VP8 VP9 Vorbis | adds AC3, AV1, H.265, PCM | AAC FLAC H.264 MP3 Opus VP8 VP9 Vorbis |
| ProRes | preview and render | render only | no |
| HLS (.m3u8, 4.0.454+) | yes, VOD only, highest quality track auto-picked | Chrome 142+ preview only | preview only |
| CORS needed | yes | no | no |
| Loop | yes | no | yes |
| Client-side rendering | yes | no | no |
| Three.js texture | works best (snippet) | `useOffthreadVideoTexture()` (deprecated) | `useVideoTexture()` (deprecated) |
| playbackRate | pitch changes with speed | pitch preserved | pitch preserved |

Notes: H.265 plays in the browser through `<Video>` but falls back to `<OffthreadVideo>` while server-rendering. Use `useRemotionEnvironment().isRendering` to render a different tag in preview and render. Live HLS streams are rejected.

## Common props (Html5Video / Html5Audio / OffthreadVideo)

- `src` (`staticFile()` or URL).
- Trimming: `trimBefore` (4.0.319+), `durationInFrames` (4.0.530+, replaces deprecated `trimAfter`); old `startFrom`/`endAt` deprecated (cannot mix with new). Frame math assumes composition fps: `trimBefore={60}` at 30 fps skips 2 s.
- `volume`: number 0..1 or `(frame) => number` (frame relative to media start; `loopVolumeCurveBehavior: 'repeat' | 'extend'` 4.0.142+); iOS Safari ignores it unless `useWebAudioApi` (4.0.306+, needs `crossOrigin="anonymous"`; values above 1 possible; not combinable with `playbackRate` on Safari). `allowAmplificationDuringRender` deprecated.
- `muted` (can toggle over time; on a video with silent audio, `muted` avoids downloading the whole file to mix audio during render).
- `playbackRate` (2.2.0+), `preservePitch` (4.0.463+), `toneFrequency` 0.01..2 (server render only), `audioStreamIndex` (4.0.340+, render only), `loop` (3.2.29+; not on OffthreadVideo).
- `acceptableTimeShiftInSeconds` (default 0.45 s before a seek in preview), `pauseWhenBuffering` (false in 4.x, true in 5.0), `onError` (suppresses the throw), `onAutoPlayError`, `onVideoFrame(frame)` (canvas source for manipulation; `crossOrigin` defaults to anonymous when used), `showInTimeline`, `name`, `delayRenderTimeoutInMilliseconds`, `delayRenderRetries`, `style`.
- OffthreadVideo only: `transparent` (PNG frames, slower; needed for alpha), `toneMapped` (default true; set false to save colour conversion time), `imageFormat` removed in 4.0.
- When a non-looping video ends, its last frame stays visible.
- Errors: "Could not play video with src" means unsupported codec in Chrome (HEVC on Linux, avi, flv), 404 (forgot `staticFile()`), wrong headers (200, content-type, `Content-Range`), Internet Download Manager, or too many `<video>` tags (use `<Video>` from `@remotion/media`). "Media cannot be seeked": the server lacks `Content-Range`/`Content-Length`, file lacks faststart, or an `X-Frame-Options`/CSP/CORP header blocks it; serve with Range support, download locally, or use `<Video>` from `@remotion/media`; prefetch before swapping an audio source at runtime.
- Slow-frame warning on `<OffthreadVideo>` only affects pre-4.0 versions.

## Audio

- `import {Audio} from '@remotion/media'; <Audio src={staticFile('tune.mp3')} />`. Timing props as everywhere (`from`, `trimBefore`, `durationInFrames`, `playbackRate`, `loop`).
- Sample rate: all audio is resampled to 48000 Hz by default. Override with `renderMedia({sampleRate})`, `renderMediaOnWeb({sampleRate})`, `--sample-rate=44100`, `Config.setSampleRate()`, Studio render dialog, or `calculateMetadata` returning `defaultSampleRate` (4.0.448+; CLI flag and dialog win). Preview AudioContext defaults to 48000 (`Config.setPreviewSampleRate()`, `--preview-sample-rate`). A render has exactly one output sample rate.
- Generated audio: `audioBufferToDataUrl(audioBuffer)` from `@remotion/media-utils` returns a base64 data URL for `<Audio src>` (offline `OfflineAudioContext` pattern, wrap in `delayRender`).

## @remotion/media-utils (CORS needed for remote files except duration)

- `getAudioData(src, {sampleRate?: number /*48000 default since 4.0.121*/, requestInit?})` -> `{channelWaveforms: Float32Array[], sampleRate, durationInSeconds, numberOfChannels, resultId, isRemote}`. `sampleRate` returned is the AudioContext rate, not the file's.
- `useAudioData(src, {sampleRate?, requestInit?})` -> `AudioData | null`; wraps delayRender/continueRender and unmount safety; only the first render's `requestInit` is used.
- `useWindowedAudioData({src, frame, fps, windowInSeconds, requestInit?})` (4.0.240+) -> `{audioData, dataOffsetInSeconds}`; loads only a moving window via Range requests (3 windows at a time); all Mediabunny formats since 4.0.383; use for long audio; pass `dataOffsetInSeconds` to `visualizeAudio`.
- `visualizeAudio({audioData, frame, fps, numberOfSamples /*power of 2*/, smoothing = true, optimizeFor: 'accuracy' | 'speed' (default speed in 5.0), dataOffsetInSeconds?})` -> `number[]` (0..1, low frequencies first; low bins dominate, apply a log curve for nicer bars). The `frame` is the position in the audio: subtract the sequence offset/trim yourself.
- `getWaveformPortion({audioData, startTimeInSeconds, durationInSeconds, numberOfSamples, channel = 0, outputRange: 'zero-to-one' | 'minus-one-to-one', normalize = true})` -> `{index, amplitude}[]` for waveform bars.
- `getImageDimensions(src)` (4.0.143+) -> `{width, height}` (memoised).
- Deprecated: `getAudioDurationInSeconds(src)`, `getVideoMetadata(src)` (fails on H.265 on Linux, some formats; duration may be `Infinity` without faststart). Replacement: Mediabunny `Input` + `computeDuration()` / `getPrimaryVideoTrack()` / `computeFrameRateMetrics()`, or `getMediaMetadata()`.

```tsx
import {Audio} from '@remotion/media';
import {useWindowedAudioData, visualizeAudio} from '@remotion/media-utils';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {audioData, dataOffsetInSeconds} = useWindowedAudioData({src: staticFile('music.wav'), frame, fps, windowInSeconds: 10});
  if (!audioData) return null;
  const bars = visualizeAudio({fps, frame, audioData, numberOfSamples: 32, dataOffsetInSeconds});
  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'flex-end', gap: 4}}>
      <Audio src={staticFile('music.wav')} />
      {bars.map((v, i) => <div key={i} style={{flex: 1, height: `${Math.min(1, v * 6) * 100}%`, background: '#111'}} />)}
    </AbsoluteFill>
  );
};
```

## Effects on media: greenscreen and colour

- `colorKey()` from `@remotion/effects/color-key` removes a key colour (greenscreen); needs WebGL2 (see `visuals-and-3d.md` for WebGL/GL flags).
- `colorCorrection()`, `brightness()`, `contrast()`, `saturation()`, `lut()` (3D `.cube` text) from `@remotion/effects/...`; applied in array order via the `effects` prop of `<Video>`, `<Img>`, etc.; drop `.cube` files in `public/` to preview LUTs in the Assets panel.

## Transparent output

- WebM with alpha: image format PNG, codec `vp8` or `vp9`, pixel format `yuva420p` (`--image-format=png --pixel-format=yuva420p --codec=vp8`; or `Config.setVideoImageFormat('png')` etc.; or `calculateMetadata` defaults `defaultCodec/defaultVideoImageFormat/defaultPixelFormat`). No background in the comp. Chrome and Firefox play it; Safari does not play VP8/VP9 alpha. Lambda can flicker at chunk boundaries (render in one pass or use ProRes).
- ProRes with alpha for editors: codec `prores`, profile `4444` or `4444-xq`, pixel format `yuva444p10le`, image format PNG.
- Embedding a transparent source with `<OffthreadVideo transparent>`.
- Web alternative that avoids the encode entirely: keep the effect as a live React piece (Remotion Player or JAL frame core) on a transparent canvas.

## HDR

Remotion renders sRGB SDR only. HDR inputs are tone-mapped to SDR (OffthreadVideo `toneMapped` default true; Html5Video depends on `--gl`, `angle` gives better colours on macOS). Do not output HDR (`--color-space=bt2020-*` only tags the file and looks overexposed).

## Metadata

Set output file tags with `metadata: {title, artist, ...}` in `renderMedia()` (4.0.216+), `renderMediaOnWeb()` (4.0.517+), Lambda and Cloud Run, or `--metadata`. MP4/MOV accept a fixed list (`title artist album_artist composer album date comment genre copyright grouping lyrics description synopsis show episode_id network keywords` plus int8 fields `episode_sort season_number media_type hd_video gapless_playback compilation`); WebM/MKV accept arbitrary keys (case-insensitive). Remotion always writes `comment: Made with Remotion <version>`; a custom comment is merged. Read tags with `bunx remotion ffprobe file.mp4`.

## User uploads

- Show the uploaded video in the Player immediately from a local blob URL, swap to the cloud URL after upload.
- Validate before upload with a `canDecode(src | Blob)` Mediabunny snippet (checks that `<Video>` can play it); reject or re-encode on the backend. H.265 plays in the browser but needs a fallback at render.
- Presigned upload: server returns a presigned PUT URL (bucket CORS allows `PUT`, optional `GET`; IAM `s3:PutObject` + `s3:PutObjectAcl`); apply size/type limits, auth and rate limits on the server. In JAL use the self-hosted S3 pattern from `jal-backend`; no cloud accounts without Brian.

## Combining with JAL

Ship media as `public/` files in the repo or fetch from JAL's S3 (public CORS bucket), never hot-link third-party URLs in a render. Keep voiceover/music licensing in the brief. For page-level hero video (no Remotion), use plain `<video>` with a poster; Remotion media tags are for compositions.

From:
- https://www.remotion.dev/docs/video-tags
- https://www.remotion.dev/docs/html5-video
- https://www.remotion.dev/docs/html5-audio
- https://www.remotion.dev/docs/offthreadvideo
- https://www.remotion.dev/docs/using-audio
- https://www.remotion.dev/docs/hls
- https://www.remotion.dev/docs/non-seekable-media
- https://www.remotion.dev/docs/media-playback-error
- https://www.remotion.dev/docs/sample-rate
- https://www.remotion.dev/docs/cors-issues
- https://www.remotion.dev/docs/slow-method-to-extract-frame
- https://www.remotion.dev/docs/get-audio-data
- https://www.remotion.dev/docs/get-audio-duration-in-seconds
- https://www.remotion.dev/docs/get-video-metadata
- https://www.remotion.dev/docs/get-image-dimensions
- https://www.remotion.dev/docs/get-waveform-portion
- https://www.remotion.dev/docs/audio-buffer-to-data-url
- https://www.remotion.dev/docs/use-audio-data
- https://www.remotion.dev/docs/use-windowed-audio-data
- https://www.remotion.dev/docs/visualize-audio
- https://www.remotion.dev/docs/metadata
- https://www.remotion.dev/docs/greenscreen
- https://www.remotion.dev/docs/color-correction
- https://www.remotion.dev/docs/transparent-videos
- https://www.remotion.dev/docs/hdr
- https://www.remotion.dev/docs/video-uploads
- https://www.remotion.dev/docs/validating-user-videos
- https://www.remotion.dev/docs/presigned-urls
