# @remotion/media-parser (deprecated)

`@remotion/media-parser` parses video and audio files to read metadata and raw samples, in the browser, Node and Bun. Remotion now says "We are phasing out Media Parser and are moving to Mediabunny!" and marks `parseMedia()` deprecated. This file keeps the full capability map so nothing is lost, and says what replaces each part. JAL does not install this package.

From: https://www.remotion.dev/docs/media-parser/ , https://www.remotion.dev/docs/media-parser/download-and-parse , https://www.remotion.dev/docs/media-parser/download-and-parse-media , https://www.remotion.dev/docs/media-parser/fast-and-slow , https://www.remotion.dev/docs/media-parser/fields , https://www.remotion.dev/docs/media-parser/foreign-file-types , https://www.remotion.dev/docs/media-parser/format-support , https://www.remotion.dev/docs/media-parser/has-been-aborted , https://www.remotion.dev/docs/media-parser/media-parser-controller , https://www.remotion.dev/docs/media-parser/metadata , https://www.remotion.dev/docs/media-parser/node-reader , https://www.remotion.dev/docs/media-parser/node-writer , https://www.remotion.dev/docs/media-parser/parse-media , https://www.remotion.dev/docs/media-parser/parse-media-on-server-worker , https://www.remotion.dev/docs/media-parser/parse-media-on-web-worker , https://www.remotion.dev/docs/media-parser/pause-resume-abort , https://www.remotion.dev/docs/media-parser/readers , https://www.remotion.dev/docs/media-parser/runtime-support , https://www.remotion.dev/docs/media-parser/samples , https://www.remotion.dev/docs/media-parser/seeking , https://www.remotion.dev/docs/media-parser/seeking-hints , https://www.remotion.dev/docs/media-parser/stream-selection , https://www.remotion.dev/docs/media-parser/tags , https://www.remotion.dev/docs/media-parser/types , https://www.remotion.dev/docs/media-parser/universal-reader , https://www.remotion.dev/docs/media-parser/web-reader , https://www.remotion.dev/docs/media-parser/webcodecs , https://www.remotion.dev/docs/media-parser/webcodecs-timescale , https://www.remotion.dev/docs/media-parser/workers

## 1. Status

- Deprecated in favor of Mediabunny. "Getting video metadata" with `parseMedia()` is explicitly "not recommended anymore"; the metadata page points to the Mediabunny recipe (`mediabunny.md` section 5).
- The metadata API was called stable; the sample, seeking and writer APIs were experimental.
- Design goals it listed (useful as a feature checklist): all major containers, easy metadata, browser plus Node plus Bun, minimal fetching, functional TypeScript API, helpful errors on unsupported files, WebCodecs-ready samples, pausable and cancellable, seekable, zero dependencies.
- The sibling `@remotion/webcodecs` depends on it and has the extra license warning (`webcodecs.md`). The Remotion License also governs this package.

## 2. What it could do, mapped to Mediabunny

Mediabunny names other than `Input`, `ALL_FORMATS`, `UrlSource`, `VideoSampleSink`, `computeDuration`, `getPrimaryVideoTrack`, `getDisplayWidth/Height` and `computeFrameRateMetrics` come from Mediabunny's own documentation, not the fetched Remotion pages. **[verify]** them before use.

| Capability (page) | Old API | Use now |
|---|---|---|
| Metadata: duration, dimensions (rotation applied), fps, codecs, size, mime type, name, container, tracks, keyframes, rotation, `isHdr`, sample rate, channels, embedded images (album art), location (`parse-media`, `fields`) | `parseMedia({ src, fields })` | `new Input({ formats: ALL_FORMATS, source })` and the track getters (`getPrimaryVideoTrack()`, `computeDuration()`, `getDisplayWidth()`, `computeFrameRateMetrics()`) |
| Fast and slow fields: header-only, metadata-only, full parse; fields prefixed `slow` read the whole file (`fast-and-slow`) | `slowFps`, `slowDurationInSeconds`, `slowNumberOfFrames`, `slowKeyframes`, `slowAudioBitrate`, `slowVideoBitrate`, `slowStructure` | `compute*` methods on Mediabunny (they say so in the name, and do the full read) |
| Metadata tags: ID3, EXIF, QuickTime keys such as `com.apple.quicktime.model` (`tags`, `metadata`) | `fields: { metadata: true }` | Mediabunny metadata tags API |
| Samples for decoding with WebCodecs (`samples`, `webcodecs`) | `onVideoTrack`, `onAudioTrack` returning a sample handler | `VideoSampleSink`, `EncodedPacketSink` and friends |
| Queueing note: feed the decoder with back-pressure so frames do not pile up (`webcodecs`) | manual | Mediabunny sinks iterate lazily |
| Timestamps: samples carry microsecond timestamps, constant `WEBCODECS_TIMESCALE` (`webcodecs-timescale`) | | Mediabunny uses seconds |
| Seeking and seeking hints (`seeking`, `seeking-hints`, experimental) | `controller.seek()` | `getSample(timestamp)`, `samples(start, end)` |
| Pause, resume, abort; `hasBeenAborted(error)` (`pause-resume-abort`, `media-parser-controller`, `has-been-aborted`) | `mediaParserController()` | AbortSignal, async iterators |
| Readers: `webReader` (URL or File, the default), `nodeReader` (local path), `universalReader` (`readers`, `web-reader`, `node-reader`, `universal-reader`) | `reader:` option | `UrlSource`, `BlobSource`, `FilePathSource` (Node/Bun) |
| Writers: `nodeWriter` (experimental) | | Mediabunny targets |
| Web Worker and server worker variants (`workers`, `parse-media-on-web-worker`, `parse-media-on-server-worker`) | `parseMediaOnWebWorker()` | run Mediabunny inside your own Worker |
| Download and parse in parallel (`download-and-parse`, `download-and-parse-media`) | `downloadAndParseMedia()` (Node/Bun) | stream the fetch to disk and read with Mediabunny |
| HLS stream selection (`stream-selection`) | `selectM3uStream`, `selectM3uAssociatedPlaylists` | HLS input in Mediabunny (VOD) |
| Foreign file types: it throws a helpful error for a file it does not support, sometimes saying what the file is (`foreign-file-types`) | | `ALL_FORMATS` input fails with an error; check with the `canDecode` recipe |
| Types reference (`types`) | | Mediabunny types |

## 3. Format support (what the parser handled)

ISO BMFF (`.mp4`, `.mov`, `.m4a`) with H.264, H.265, AV1 video and AAC audio, including fragmented MP4. WebM with VP8, VP9, AV1 video and Opus, Vorbis audio. MPEG-TS with H.264/H.265/AAC (MPEG-2 TS only H.264 and AAC). AVI (H.264, AAC). WAV (PCM), AAC, MP3, FLAC. HLS with `.ts` and `.m4s` segments plus stream selection. OGG/Opus planned, MPEG-DASH planned, other containers, encrypted media and livestreams not supported. Mediabunny's list is in `mediabunny.md` section 4 and is broader (Matroska, Ogg, ProRes).

## 4. Runtime support (historical)

Browser, Node.js 20 or newer, Bun 1.0 or newer. Browsers: Chrome 111, Edge 111, Safari 16.4, Firefox 128. Feature test: `typeof fetch === "function" && typeof new ArrayBuffer().resize === "function"`. Decoding samples with WebCodecs needed Chrome 94, Edge 94, Firefox 130; Safari had video-only support at the time of the page (May 2025).

## 5. Why JAL keeps this file

- A migration aid when an old Remotion snippet or an AI-generated answer uses `parseMedia()`: translate it with the table above instead of installing the package.
- A reminder that a web "media inspector" feature (duration, size, codecs, rotation, embedded cover art, HDR flag) is possible fully in the browser with no upload, using Mediabunny.
- The `isHdr` and `rotation` fields are worth surfacing when validating user-supplied clips for a composition: HDR clips and rotated clips deserve a visual check in the Player and in an export (not stated by the docs, **[verify]**).
