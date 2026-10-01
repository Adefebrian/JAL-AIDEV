# Remotion on Vercel (`@remotion/vercel`, Vercel Sandbox)

Written against `remotion` 4.0.532 (docs read 2026-10-01). Optional path and not recommended for JAL (JAL deploys on Coolify). Needs Brian's confirmation. The package is experimental: Remotion reserves the right to make breaking changes.

From:
- https://www.remotion.dev/docs/vercel
- https://www.remotion.dev/docs/vercel/add-bundle-to-sandbox
- https://www.remotion.dev/docs/vercel/api
- https://www.remotion.dev/docs/vercel/create-sandbox
- https://www.remotion.dev/docs/vercel/get-render-progress
- https://www.remotion.dev/docs/vercel/render-media-on-vercel
- https://www.remotion.dev/docs/vercel/render-still-on-vercel
- https://www.remotion.dev/docs/vercel/types
- https://www.remotion.dev/docs/vercel/upload-to-vercel-blob

## What it is

Ways to use Remotion with Vercel:

1. **Client-side rendering** on a Studio deployment: no server cost, uses the viewer's browser (the default JAL path anyway, see render-paths.md).
2. **Vercel Sandbox rendering** (`@remotion/vercel`, since 4.0.426): each render spawns an ephemeral Linux VM with the full renderer. Easiest cloud setup (a Vercel account and a Blob store). No distributed rendering, longer cold start (VM provisioning, system dependencies and a browser download on each render; snapshots are planned), no GPU.
3. **Studio as a static site** on Vercel: build `bunx remotion bundle`, output `build` (studio.md#deploy).
4. **Trigger Remotion Lambda from a Vercel function** (Lambda is covered in lambda.md; use the `REMOTION_` prefixed AWS env vars because the plain names are reserved).
5. **A deployment as a Serve URL**: `remotion render https://my-app.vercel.app HelloWorld`.

Vercel functions can run up to 800 seconds, so for longer sandbox renders use `detached: true` and poll.

Templates named in the docs: Next.js, Next.js (Vercel Sandbox), React Router 7. The template has no rate limiting or caching: add both before going public, set Vercel Spend Management, and delete sandbox snapshots, rendered videos and Blob data when no longer needed because they persist indefinitely. `@remotion/vercel` needs `@vercel/sandbox` as a peer dependency.

## When a JAL agent uses it

Only if Brian explicitly picks Vercel for a project. It is listed here for completeness and for comparison.

## API reference

| Function | Since | Purpose | Key arguments and result |
| --- | --- | --- | --- |
| `createSandbox()` | 4.0.426 | Start a Sandbox prepared for rendering; stop it when done (`sandbox.stop()` or `await using`) | `onProgress({progress 0..1, message})`, `resources`, `timeoutInMilliseconds` (4.0.452); returns a `VercelSandbox` (a Vercel `Sandbox` with `AsyncDisposable`) |
| `addBundleToSandbox()` | 4.0.426 | Copy a Remotion bundle directory into the sandbox | `sandbox`, `bundleDir` (relative to cwd; must exist on the calling server's filesystem) |
| `renderMediaOnVercel()` | 4.0.426 | Render a video or audio inside the sandbox | `sandbox`, `compositionId`, `inputProps`, `codec?`, `outputFile?` (default `/tmp/video.mp4`), `detached?` (4.0.469), `vercelBlob?` (upload from inside the sandbox), `detachedSandboxTimeoutInMilliseconds?` (default 1800000 = 30 min), `onProgress`, plus `crf`, `imageFormat`, `pixelFormat`, `frameRange`, `everyNthFrame`, `proResProfile`, `chromiumOptions`, `scale`, `preferLossless`, `enforceAudioTrack`, `disallowParallelEncoding`, `concurrency`, `metadata`, `logLevel`, `timeoutInMilliseconds`, `videoBitrate`, `audioBitrate`, `audioCodec`, `encodingMaxRate`, `encodingBufferSize`, `muted`, `numberOfGifLoops`, `x264Preset`, `gopSize`, `colorSpace`, `jpegQuality`, `forSeamlessAacConcatenation`, `separateAudioTo`, `hardwareAcceleration`, cache options, `licenseKey`. Result (not detached): `{sandboxFilePath, contentType}`; detached: `{sandboxId, cmdId, outputFile}` |
| `renderStillOnVercel()` | 4.0.426 | Render a frame | `sandbox`, `compositionId`, `inputProps`, `imageFormat?`, `outputFile?` (default `/tmp/still.png`), `frame?`, `jpegQuality?`, `scale?`, `envVariables?`, `chromiumOptions?`, cache options, `licenseKey`, `onProgress`; result `{sandboxFilePath, contentType}` |
| `getRenderProgress()` | 4.0.469 | Poll a detached render | `sandboxId`, `cmdId`; returns a `RenderProgress` stage union |
| `uploadToVercelBlob()` | 4.0.426 | Upload a sandbox file to Vercel Blob | `sandbox`, `sandboxFilePath`, `blobPath?`, `contentType`, `blobToken` (`BLOB_READ_WRITE_TOKEN`), `access` (`public` or `private`, default private); returns `{url, size}` |

### Types

`VercelSandbox`; `CreateSandboxOnProgress` (`progress`, `message`); `RenderMediaOnVercelProgress` (stages `opening-browser`, `selecting-composition`, `render-progress`, each with `overallProgress`); `RenderStillOnVercelProgress`; `RenderProgress` (4.0.469: `starting`, `opening-browser`, `selecting-composition`, `render-progress`, `uploading`, `done` with `url`, `size`, `contentType`, `error` with `message`, `expired`); `VercelBlobAccess` (`public` or `private`); `VercelBlobUploadOptions` (4.0.469); `RenderMediaProgress` (same as `RenderMediaOnProgress` in the renderer).

## Cost notes

Vercel Sandbox is billed by the time the VM runs (see Vercel's Sandbox pricing page); Blob storage is separate. No fixed monthly worker. Requests that run long should use detached mode. Remotion's license still applies (license.md).

## Related

- render-paths.md, license.md, lambda.md.
