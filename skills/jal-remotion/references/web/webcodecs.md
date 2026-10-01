# WebCodecs and @remotion/webcodecs

WebCodecs is the browser API that gives JavaScript the platform's real video and audio encoders and decoders. Remotion's client-side rendering and media tags are built on it (through Mediabunny). The package `@remotion/webcodecs` is Remotion's older conversion toolkit; it is **deprecated** ("We are phasing out Remotion WebCodecs and are moving to Mediabunny!"). This file records what it offered, the license warning on it, and what JAL uses instead.

From: https://www.remotion.dev/docs/webcodecs/ , https://www.remotion.dev/docs/webcodecs/buffer-writer , https://www.remotion.dev/docs/webcodecs/can-copy-audio-track , https://www.remotion.dev/docs/webcodecs/can-copy-video-track , https://www.remotion.dev/docs/webcodecs/can-reencode-audio-track , https://www.remotion.dev/docs/webcodecs/can-reencode-video-track , https://www.remotion.dev/docs/webcodecs/convert-a-video , https://www.remotion.dev/docs/webcodecs/convert-audiodata , https://www.remotion.dev/docs/webcodecs/convert-media , https://www.remotion.dev/docs/webcodecs/create-audio-decoder , https://www.remotion.dev/docs/webcodecs/create-video-decoder , https://www.remotion.dev/docs/webcodecs/default-on-audio-track-handler , https://www.remotion.dev/docs/webcodecs/default-on-video-track-handler , https://www.remotion.dev/docs/webcodecs/extract-frames , https://www.remotion.dev/docs/webcodecs/extract-frames-on-web-worker , https://www.remotion.dev/docs/webcodecs/fix-mediarecorder-video , https://www.remotion.dev/docs/webcodecs/get-available-audio-codecs , https://www.remotion.dev/docs/webcodecs/get-available-containers , https://www.remotion.dev/docs/webcodecs/get-available-video-codecs , https://www.remotion.dev/docs/webcodecs/get-default-audio-codec , https://www.remotion.dev/docs/webcodecs/get-default-video-codec , https://www.remotion.dev/docs/webcodecs/get-partial-audio-data , https://www.remotion.dev/docs/webcodecs/misconceptions , https://www.remotion.dev/docs/webcodecs/pause-resume-abort , https://www.remotion.dev/docs/webcodecs/resample-audio-16khz , https://www.remotion.dev/docs/webcodecs/resize-a-video , https://www.remotion.dev/docs/webcodecs/rotate-a-video , https://www.remotion.dev/docs/webcodecs/rotate-and-resize-video-frame , https://www.remotion.dev/docs/webcodecs/track-transformation , https://www.remotion.dev/docs/webcodecs/web-fs-writer , https://www.remotion.dev/docs/webcodecs/webcodecs-controller

## 1. Rule for JAL

**Do not install `@remotion/webcodecs` or `@remotion/media-parser`.** They are deprecated, marked unstable/experimental, and carry a license warning that is stricter than the main packages (section 2). Use Mediabunny (`mediabunny.md`) for conversion, frames, metadata and trimming, and `@remotion/web-renderer` (`web-renderer.md`) for rendering compositions to files.

## 2. License warning on the package

The package pages state: the package is under the Remotion License; **a team of 4 or more people counts as a "company"**; companies must hold a Remotion Company License to use it, and "in a future version" it will also require a newly created **WebCodecs Conversion Seat**; individuals and teams up to 3 use it free. (This is a short, non-binding explanation; the License text governs.) JAL at 3 people is within the free tier, but since the package is deprecated and the seat requirement is pending, there is no reason to adopt it. Mediabunny alone is MPL 2.0 with no seat.

## 3. What the package did (the capability list)

Converting media in the browser, with full GPU access rather than WebAssembly:

- Convert between formats. Inputs: `.mp4`, `.mov`, `.m4a`, `.mkv`, `.webm`, `.avi`, `.ts`, `.wav`, `.mp3`, `.flac`, `.aac`, HLS `.m3u8`. Outputs: MP4, WebM, WAV. Output video codecs: VP8 and VP9 (WebM), H.264 (MP4). Output audio codecs: Opus (WebM), AAC (MP4), PCM (WAV). Core call: `convertMedia()`.
- Rotate a video (fix a wrong orientation), resize, and rotate-and-resize a single frame (`rotateAndResizeVideoFrame`).
- Extract frames efficiently (`extractFrames`, `extractFramesOnWebWorker`), read partial audio data, convert `AudioData`, resample audio to 16 kHz for Whisper (browser and server routes).
- Manipulate pixels per frame (`onVideoFrame`), process audio (`onAudioData`).
- Fix a MediaRecorder file (webm without duration, slow seeking, not playing in Safari): re-mux (fast, keeps frames, adds seek points and duration) or re-encode (slower, can change codec).
- Per-track decisions: copy without re-encoding, re-encode to another codec, or remove the track; helpers `canCopyVideoTrack`, `canCopyAudioTrack`, `canReencodeVideoTrack`, `canReencodeAudioTrack`, `defaultOnVideoTrackHandler`, `defaultOnAudioTrackHandler`, `getDefaultVideoCodec`, `getDefaultAudioCodec`, `getAvailableContainers`, `getAvailableVideoCodecs`, `getAvailableAudioCodecs`.
- Decoders: `createVideoDecoder`, `createAudioDecoder` (experimental).
- Writers: `bufferWriter` (in-memory resizable ArrayBuffer), `webFsWriter` (Origin Private File System).
- Control: `webcodecsController()` with pause, resume and abort, passed to `convertMedia()`.
- It read inputs with `@remotion/media-parser` (`media-parser.md`).

## 4. Misconceptions page (still useful background)

- WebCodecs has nothing to do with **WebAssembly**. WebAssembly strips platform-specific optimizations; WebCodecs calls the browser's built-in optimized routines, which is why it can be far faster than ffmpeg.wasm.
- WebCodecs has nothing to do with **WebGPU**. GPU acceleration for video happens in the codec layer, not through WebGPU shaders.
- Browser support is still uneven (the Remotion docs list Chrome 94, Firefox 130, Safari 26 for web rendering). Always feature-detect.

## 5. Where each old task goes now

| Old task | Use now | Notes |
|---|---|---|
| Convert, re-mux, re-encode, trim, crop, resize, rotate | Mediabunny `Conversion` and its track options | Mediabunny's own docs; not on the fetched Remotion pages, **[verify]** |
| Fix MediaRecorder output | Mediabunny re-mux through `Conversion` | Same |
| Extract frames or a thumbnail | Mediabunny `VideoSampleSink` (`mediabunny.md` section 5) | |
| Resample audio to 16 kHz | Mediabunny audio conversion, or `AudioContext`/`OfflineAudioContext` in the browser | |
| Read metadata | Mediabunny `Input` | |
| Render a composition to MP4 | `renderMediaOnWeb` | `web-renderer.md` |
| Write to a file stream | `outputWritable` of `renderMediaOnWeb`; for Mediabunny outputs, its `StreamTarget` | |
| Pause, resume, abort | AbortSignal | Mediabunny and web renderer both take signals |

## 6. Capability choices for a JAL site

- A "convert my video" tool is a product feature; it needs a JEV call framed by the `jal-jev` agent (no catalog ID covers it yet) and a plain notice about what runs in the visitor's browser (their file never leaves it). Build it on Mediabunny.
- A recorder inside the page (webcam or screen with MediaRecorder) should post-process the file with Mediabunny so it has a duration and seeks in Safari.
- Feature-detect `typeof VideoEncoder !== "undefined"` and `VideoDecoder` first; fall back to a message, never a silent failure.
