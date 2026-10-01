# Speech to text with Whisper (WebGPU, whisper.cpp, WASM, OpenAI API)

From:
- https://www.remotion.dev/docs/whisper-webgpu/
- https://www.remotion.dev/docs/whisper-webgpu/can-use-whisper-webgpu
- https://www.remotion.dev/docs/whisper-webgpu/clear-stale-models
- https://www.remotion.dev/docs/whisper-webgpu/dispose-whisper-model
- https://www.remotion.dev/docs/whisper-webgpu/download-whisper-model
- https://www.remotion.dev/docs/whisper-webgpu/get-available-models
- https://www.remotion.dev/docs/whisper-webgpu/is-whisper-model-cached
- https://www.remotion.dev/docs/whisper-webgpu/load-whisper-model
- https://www.remotion.dev/docs/whisper-webgpu/node
- https://www.remotion.dev/docs/whisper-webgpu/remove-whisper-model
- https://www.remotion.dev/docs/whisper-webgpu/resample-to-16khz
- https://www.remotion.dev/docs/whisper-webgpu/to-captions
- https://www.remotion.dev/docs/whisper-webgpu/transcribe
- https://www.remotion.dev/docs/install-whisper-cpp/
- https://www.remotion.dev/docs/install-whisper-cpp/install-whisper-cpp
- https://www.remotion.dev/docs/install-whisper-cpp/download-whisper-model
- https://www.remotion.dev/docs/install-whisper-cpp/transcribe
- https://www.remotion.dev/docs/install-whisper-cpp/to-captions
- https://www.remotion.dev/docs/install-whisper-cpp/convert-to-captions
- https://www.remotion.dev/docs/whisper-web/
- https://www.remotion.dev/docs/whisper-web/can-use-whisper-web
- https://www.remotion.dev/docs/whisper-web/download-whisper-model
- https://www.remotion.dev/docs/whisper-web/get-available-models
- https://www.remotion.dev/docs/whisper-web/get-loaded-models
- https://www.remotion.dev/docs/whisper-web/resample-to-16khz
- https://www.remotion.dev/docs/whisper-web/to-captions
- https://www.remotion.dev/docs/whisper-web/transcribe
- https://www.remotion.dev/docs/openai-whisper/
- https://www.remotion.dev/docs/openai-whisper/is-openai-whisper-transcript
- https://www.remotion.dev/docs/openai-whisper/openai-whisper-api-to-captions

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01).

## What it is

Four ways to turn speech into `Caption[]` (see `captions.md`). Three are free and offline. One is a paid cloud API.

## Decision for JAL

Default without any approval (decided 2026-10-01): captions come from a script or an SRT the project already has (`parseSrt()` and `createTikTokStyleCaptions()` in `captions.md`). Every automatic transcription engine below needs Brian's yes for the project first: transformers.js and ONNX, the OpenAI Whisper API, and ElevenLabs are off until he approves them, and whisper.cpp is a native toolchain. Once approved, the order is:

1. **`@remotion/whisper-webgpu`**: preferred. Free, offline, no server, JavaScript only, runs in the browser (and in Studio's Jobs panel) or in Node/Bun with a GPU. Needs a real GPU and WebGPU.
2. **`@remotion/install-whisper-cpp`**: for a server or CI box with no GPU, or batch jobs. Free and offline, but builds a native binary (git clone + build; cmake from whisper.cpp 1.7.3) and downloads a ggml model. That is a native toolchain in the stack: ask Brian once per project.
3. **`@remotion/whisper-web` (WASM)**: avoid. Marked experimental and unstable, slow, and needs cross-origin isolation headers. Its own docs tell you to prefer WebGPU.
4. **`@remotion/openai-whisper`**: optional paid cloud. Only with Brian's confirmation, key in env, called from a server, never from the browser.

For Bahasa Indonesia (and any non-English audio) choose a **multilingual** model and set the language explicitly. English-only `.en` models cannot transcribe it.

## whisper-webgpu

Install: `bunx remotion add @remotion/whisper-webgpu @huggingface/transformers` (docs form `npx remotion add ...`; keep the pair exact-pinned). `@huggingface/transformers` pulls ONNX Runtime: transformers.js and ONNX stay off until Brian approves them per project (decided 2026-10-01). Until then use a script or SRT the project already has.

```ts
import {clearStaleModels, downloadWhisperModel, resampleTo16Khz, toCaptions, transcribe,
  canUseWhisperWebGpu} from '@remotion/whisper-webgpu';

const support = await canUseWhisperWebGpu();           // {supported, reason?, detailedReason?}
if (!support.supported) throw new Error(support.detailedReason);

await clearStaleModels();                               // call on page load
await downloadWhisperModel({model: 'small', onProgress: ({progress}) => {/* 0..1 */}});
const channelWaveform = await resampleTo16Khz({file}); // browser: decode, mono, 16 kHz Float32Array
const result = await transcribe({channelWaveform, model: 'small', language: 'id'});
const {captions} = toCaptions({whisperWebGpuOutput: result});
```

API (all since 4.0.518 unless noted):

| Function | Does |
|---|---|
| `canUseWhisperWebGpu()` | Checks support. Reasons: `window-undefined`, `webgpu-unavailable`, `webgpu-requires-secure-context`. In Node it creates and disposes a tiny WebGPU ONNX session, without downloading a model. |
| `getAvailableModels()` | Returns `{name, modelId, parameters, multilingual, supportsTranslation (4.0.523), webGpuDownloadSize}`. Sizes: tiny, base, small, medium, large-v3-turbo; `.en` variants up to medium. The set can change between versions. |
| `isWhisperModelCached({model})` | True if every file is cached. Models cached from Hugging Face by versions before 4.0.522 do not count. |
| `downloadWhisperModel({model, onProgress?, signal?})` | Fetches from remotion.media (a byte-identical mirror, faster than Hugging Face) into the Transformers.js cache; returns `{alreadyDownloaded}`. Browser uses the Cache API, Node uses a filesystem cache. A cache must be enabled. `signal` 4.0.528. |
| `loadWhisperModel({model, onProgress?, signal?})` | Initialises on WebGPU; `await using` releases it at scope end (4.0.528). `transcribe()` loads automatically. |
| `disposeWhisperModel({model?})` | Frees memory, keeps cached files. |
| `removeWhisperModel({model})` | Frees memory and deletes cached files (4.0.523). |
| `clearStaleModels()` | Drops models no longer offered, and Hugging Face copies from versions before 4.0.522. No stale models in the current version. |
| `resampleTo16Khz({file, onProgress?})` | Browser audio decode to mono 16 kHz. |
| `transcribe({channelWaveform, model, language?, task?, ...})` | Returns `{text, words, model}`. Word timestamps arrive only after the run (no streaming). |
| `toCaptions({whisperWebGpuOutput})` | Word boundaries become `startMs`/`endMs`, `timestampMs` is the midpoint, `confidence` is `null`. |

`transcribe` options worth knowing: `model` (`small` or `small.en` recommended), `language` (required for multilingual models, there is no auto-detect), `task: 'transcribe' | 'translate'` (4.0.523; translate to English works on multilingual non-turbo models only, check `supportsTranslation`, timestamps get less reliable), `chunkLengthInSeconds` (30), `strideLengthInSeconds` (5, must be under half the chunk), `forceFullSequences`, `doSample`, `temperature`, `topK`, `repetitionPenalty`, `noRepeatNgramSize` (all 4.0.523, leave defaults for repeatable output; sampling makes runs differ), `onModelLoadProgress`, `signal` (4.0.528; abort stops generation, an in-flight GPU op must finish, no partial transcript).

### In Node and Bun

Needs `@remotion/whisper-webgpu @huggingface/transformers mediabunny @mediabunny/server`. Call `registerMediabunnyServer()` from `@mediabunny/server`, use Mediabunny `Input`/`Output`/`Conversion` with `NullTarget` to decode and resample a local file to 16 kHz (the page shows the full script and exports `WHISPER_WEBGPU_SAMPLE_RATE`). Transformers.js uses the `onnxruntime-node` addon whose WebGPU provider (Dawn) is experimental. It does not work on Linux arm64 and needs a real GPU: a typical Coolify container has none, so use whisper.cpp there. Call `canUseWhisperWebGpu()` first when hardware varies.

### From Studio

The Studio transcribe job (WebMCP `transcribe_asset`, see `ai-authoring.md`) uses this package: default `small.en`, writes `<asset>-captions.json`, shows in Jobs. Pass `model` and `language` for non-English audio.

## whisper.cpp

Install: `bunx remotion add @remotion/install-whisper-cpp`. Node-compatible runtime; run under Bun and verify on first use. Add the `whisper.cpp/` folder to `.gitignore`.

```ts
import path from 'path';
import {installWhisperCpp, downloadWhisperModel, transcribe, toCaptions} from '@remotion/install-whisper-cpp';
const to = path.join(process.cwd(), 'whisper.cpp');
await installWhisperCpp({to, version: '1.5.5'});                // no v prefix; tag or commit hash
await downloadWhisperModel({model: 'small', folder: to});       // saved as ggml-<model>.bin
// input must be 16-bit 16 kHz WAV: ffmpeg -i in.mp4 -ar 16000 out.wav -y
const whisperCppOutput = await transcribe({
  inputPath: '/abs/out.wav', whisperPath: to, whisperCppVersion: '1.5.5',
  model: 'small', language: 'id', tokenLevelTimestamps: true,
});
const {captions} = toCaptions({whisperCppOutput});
await Bun.write('public/audio-captions.json', JSON.stringify(captions, null, 2));
```

- `installWhisperCpp({to, version, printOutput?, signal?})` returns `{alreadyExisted}`; if the folder exists it does nothing (delete a broken folder by hand). Source is cloned and built; on Windows a release binary is downloaded and only release tags work, nothing newer than 1.6.0. From 1.7.3 cmake is required. 1.5.5 is the version the docs call known-good with token timestamps.
- `downloadWhisperModel({model, folder, onProgress?, printOutput?, signal?})`: models `tiny`, `tiny.en`, `base`, `base.en`, `small`, `small.en`, `medium`, `medium.en`, `large-v1`, `large-v2`, `large-v3`, `large-v3-turbo` (turbo needs whisper.cpp built Nov 2024 or later and Remotion 4.0.229+).
- `transcribe` options: `inputPath`, `whisperPath`, `whisperCppVersion`, `model` (default `base.en`), `modelFolder`, `tokenLevelTimestamps` (recommended true: gives the accurate `t_dtw`; use false only for old whisper.cpp), `tokensPerItem` (only with token timestamps off; `null` for movie-style grouping), `translateToEnglish` (use a non-`.en` model, at least medium for quality), `language` (name or code; includes Indonesian/`id`; `auto`), `splitOnWord`, `flashAttention` (4.0.324), `additionalArgs` (4.0.324, e.g. `['-tdrz', ['--max-len', '1']]`), `printOutput`, `signal`, `onProgress` (0..1).
- Return value is the raw `TranscriptionJson` with `transcription[].tokens[]` (`t_dtw`, `text`, `offsets`, `p`). Prefer `t_dtw` over `offsets` for timing. `toCaptions()` is the recommended post-processing.
- `convertToCaptions()` is deprecated since 4.0.216; use `toCaptions()` and then `createTikTokStyleCaptions()`.
- Serverless needs the binary, the model, writable storage and enough time; a long audio on a small container is slow. The TikTok template installs this for you.

## whisper-web WASM

Documented for completeness; do not pick it for new work.

- Install `bunx remotion add @remotion/whisper-web`. Needs `SharedArrayBuffer`, so every page that transcribes must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. The docs show this for Vite; JAL has no Vite, set the headers in the Hono static handler.
- Flow: `canUseWhisperWeb(model)` (reasons: `window-undefined`, `not-cross-origin-isolated`, `indexed-db-unavailable`, `navigator-storage-unavailable`, `quota-undefined`, `usage-undefined`, `not-enough-space`, `error-estimating-storage`), `getAvailableModels()` (tiny 77.7 MB, tiny.en 77.7 MB, base 148 MB, base.en 148 MB, small 488 MB, small.en 488 MB), `downloadWhisperModel({model, onProgress})` into IndexedDB, `getLoadedModels()`, `resampleTo16Khz(file)`, `transcribe({channelWaveform, model, language ('auto' default), onProgress, onTranscriptionChunk (live updates), threads (4 default, max 16)})`, `toCaptions()`.
- Only one `transcribe()` at a time; a second concurrent call is rejected.

## OpenAI Whisper API

Install `bunx remotion add @remotion/openai-whisper` (4.0.217). Server only; the OpenAI key never reaches a browser.

```ts
import {OpenAI} from 'openai';
import {openAiWhisperApiToCaptions} from '@remotion/openai-whisper';
const openai = new OpenAI();   // reads OPENAI_API_KEY from env
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream('audio.mp3'), model: 'whisper-1',   // from the docs; `import fs from 'fs'`
  response_format: 'verbose_json', timestamp_granularities: ['word'],
});
const {captions} = openAiWhisperApiToCaptions({transcription});
```

- The converter rebuilds punctuation from the full text (the API's word list drops it). Since 4.0.530 it accepts a verbose JSON with timed words (seconds); if words are missing it falls back to timed segments (one caption per segment, no invented word timing); bad supplied word timings throw; no timed entries throws. Conversion is local and never calls OpenAI.
- `isOpenAiWhisperTranscript(input)` (4.0.530) only recognises the shape; it does not validate.
- Policy: this is a paid third-party call even though JAL already uses OpenAI for the LLM. Ask Brian before the first use in a project; prefer the offline options.

## JAL rules

- Do not upload client audio to any cloud API without Brian's confirmation; offline options keep client audio local, which is a selling point.
- Model downloads (Hugging Face or remotion.media mirror, ggml files) go to a gitignored cache, never into the plugin.
- Cache outputs: write `public/<asset>-captions.json` and reuse it; do not re-transcribe on every render.
- Add a loading/progress UI for model download (tens to hundreds of MB) and a clear fallback message when `canUse...()` says no.
