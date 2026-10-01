# Remotion Lambda: API and CLI reference (`@remotion/lambda`)

Written against `remotion` 4.0.532 (docs read 2026-10-01). Optional path: needs Brian's confirmation before use (see render-paths.md). Operations, limits, cost and integrations are in lambda-ops.md.

From:
- https://www.remotion.dev/docs/lambda/api
- https://www.remotion.dev/docs/lambda/approuterwebhook
- https://www.remotion.dev/docs/lambda/cancelrenderonlambda
- https://www.remotion.dev/docs/lambda/cli
- https://www.remotion.dev/docs/lambda/cli/compositions
- https://www.remotion.dev/docs/lambda/cli/functions
- https://www.remotion.dev/docs/lambda/cli/functions/deploy
- https://www.remotion.dev/docs/lambda/cli/functions/ls
- https://www.remotion.dev/docs/lambda/cli/functions/rm
- https://www.remotion.dev/docs/lambda/cli/functions/rmall
- https://www.remotion.dev/docs/lambda/cli/policies
- https://www.remotion.dev/docs/lambda/cli/quotas
- https://www.remotion.dev/docs/lambda/cli/regions
- https://www.remotion.dev/docs/lambda/cli/render
- https://www.remotion.dev/docs/lambda/cli/sites
- https://www.remotion.dev/docs/lambda/cli/sites/create
- https://www.remotion.dev/docs/lambda/cli/sites/ls
- https://www.remotion.dev/docs/lambda/cli/sites/rm
- https://www.remotion.dev/docs/lambda/cli/sites/rmall
- https://www.remotion.dev/docs/lambda/cli/still
- https://www.remotion.dev/docs/lambda/deletefunction
- https://www.remotion.dev/docs/lambda/deleterender
- https://www.remotion.dev/docs/lambda/deletesite
- https://www.remotion.dev/docs/lambda/deployfunction
- https://www.remotion.dev/docs/lambda/deploysite
- https://www.remotion.dev/docs/lambda/deploysitefrombundle
- https://www.remotion.dev/docs/lambda/downloadmedia
- https://www.remotion.dev/docs/lambda/downloadvideo
- https://www.remotion.dev/docs/lambda/estimateprice
- https://www.remotion.dev/docs/lambda/expresswebhook
- https://www.remotion.dev/docs/lambda/getawsclient
- https://www.remotion.dev/docs/lambda/getcompositionsonlambda
- https://www.remotion.dev/docs/lambda/getfunctioninfo
- https://www.remotion.dev/docs/lambda/getfunctions
- https://www.remotion.dev/docs/lambda/getorcreatebucket
- https://www.remotion.dev/docs/lambda/getregions
- https://www.remotion.dev/docs/lambda/getrenderprogress
- https://www.remotion.dev/docs/lambda/getrolepolicy
- https://www.remotion.dev/docs/lambda/getsites
- https://www.remotion.dev/docs/lambda/getuserpolicy
- https://www.remotion.dev/docs/lambda/light-client
- https://www.remotion.dev/docs/lambda/pagesrouterwebhook
- https://www.remotion.dev/docs/lambda/presignurl
- https://www.remotion.dev/docs/lambda/rendermediaonlambda
- https://www.remotion.dev/docs/lambda/renderstillonlambda
- https://www.remotion.dev/docs/lambda/rendervideoonlambda
- https://www.remotion.dev/docs/lambda/simulatepermissions
- https://www.remotion.dev/docs/lambda/speculatefunctionname
- https://www.remotion.dev/docs/lambda/validatewebhooksignature

## What it is

Remotion Lambda renders a video by splitting it into chunks, rendering each chunk in its own AWS Lambda function in parallel, and joining the chunks in a main function. It runs in the customer's own AWS account (Remotion does not host it). It is the fastest cloud option and the one Remotion recommends for most cloud users, at the price of a more expensive compute rate, AWS setup, and a license that counts rendering.

## When a JAL agent uses it

Only after Brian confirms it as the render path for a product. Never create AWS resources, IAM users or buckets without that confirmation, and never print or commit AWS keys. Use `@remotion/lambda/client` (the light client) in app servers so the bundle does not drag in the renderer.

## Install and import

`bun add --exact @remotion/lambda@<version>` (same version as `remotion`). Import render and progress functions from `@remotion/lambda/client`, which re-exports the `@remotion/lambda-client` package (installable on its own). The light client has no dependency on the renderer, can be bundled with ESBuild or Webpack (Next.js), is not supported on edge runtimes, and must not run in the browser (it would leak AWS credentials). `getServiceClient()` existed by mistake in 4.0.60 to 4.0.81; use `getAwsClient()`.

## Function reference

All functions take one options object. `region` is always required where shown. Optional `forcePathStyle` (4.0.202) is passed to the S3 client; `customCredentials` (3.2.23) targets another S3-compatible cloud; `requestHandler` (4.0.315) injects a proxy handler.

### Rendering

| Function | Since | Purpose | Returns |
| --- | --- | --- | --- |
| `renderMediaOnLambda()` | 3.0 | Start a render; track with `getRenderProgress()` | `{renderId, bucketName, cloudWatchLogs, cloudWatchMainLogs, lambdaInsightsLogs, folderInS3Console, progressJsonInConsole}` |
| `renderStillOnLambda()` | 3.0 | Render one frame; returns when done | `{bucketName, url, outKey, estimatedPrice, sizeInBytes, renderId, cloudWatchLogs, artifacts}` |
| `getRenderProgress()` | 3.0 | Progress of a render | `{overallProgress, chunks, done, encodingStatus, renderId, renderMetadata, outputFile, outKey, timeToFinish, errors, fatalErrorEncountered, currentTime, renderSize, outputSizeInBytes, lambdasInvoked, framesRendered, costs, estimatedBillingDurationInMilliseconds, mostExpensiveFrameRanges, artifacts}` |
| `cancelRenderOnLambda()` | 4.0.515 | Signal renderer functions to stop; needs `enableCancellation: true` on the render | resolves when the signal is written to S3 |
| `getCompositionsOnLambda()` | 3.3.2 | List compositions inside a function | array of compositions |
| `downloadMedia()` | | Save a render to local disk (`outPath`, `onProgress`, `signal`) | `{outputPath, sizeInBytes}` |
| `deleteRender()` | | Delete a render and its metadata | `{freedBytes}` |
| `presignUrl()` | | Public signed URL for a private S3 object (`bucketName`, `objectKey`, `expiresInSeconds`, `checkIfObjectExists`) | URL string |
| `estimatePrice()` | | Estimated AWS cost from `region`, `memorySizeInMb`, `durationInMilliseconds`, `lambdasInvoked`, `diskSizeInMb` | USD number |
| `renderVideoOnLambda()`, `downloadVideo()` | old names | Moved to `renderMediaOnLambda()` and `downloadMedia()` | |

### `renderMediaOnLambda()` options

| Option | Meaning |
| --- | --- |
| `region`, `functionName`, `serveUrl`, `composition` (required) | Where, which function, which bundle URL, which composition id |
| `codec` (required) | Video or audio codec; no AV1 on Lambda |
| `inputProps` | Props (large props are uploaded to S3 automatically) |
| `privacy` | `public` (default), `private`, or `no-acl` for buckets without ACLs |
| `framesPerLambda` / `concurrency` (4.0.322) | Chunk size or number of functions; `concurrency: 1` renders in the main function (4.0.517) |
| `concurrencyPerLambda` (3.0.30) | Browser tabs inside each function; default 1 |
| `enableCancellation` (4.0.515) | Poll S3 once a second per renderer so the render can be cancelled |
| `frameRange`, `everyNthFrame` | Subset of frames |
| `forceWidth`, `forceHeight`, `forceFps`, `forceDurationInFrames` | Override composition values (fps and duration since 4.0.424) |
| `audioCodec`, `audioBitrate`, `videoBitrate`, `bufferSize`, `maxRate`, `crf`, `x264Preset`, `gopSize`, `pixelFormat`, `proResProfile`, `colorSpace`, `muted`, `sampleRate`, `preferLossless`, `numberOfGifLoops`, `jpegQuality`, `imageFormat`, `scale` | Encoding controls; same meaning as `renderMedia()` |
| `maxRetries` | Retries per chunk (default 1) |
| `outName` | String, or `{bucketName, key}` to write into another bucket in the same region; name pattern `[0-9a-zA-Z-!_.*'()/]+` |
| `overwrite` | Default true when a custom name exists; skipping the check saves time |
| `timeoutInMilliseconds` | Per-frame `delayRender()` budget (not the function timeout) |
| `chromiumOptions` | `disableWebSecurity`, `ignoreCertificateErrors`, `gl`, `userAgent`, `darkMode`... |
| `envVariables`, `metadata` | Inject env vars, container metadata |
| `webhook` | `{url, secret, customData}`; see Webhooks below |
| `downloadBehavior` | `{type: 'play-in-browser'}` (default) or `{type: 'download', fileName: null or 'name.mp4'}` |
| `deleteAfter` (4.0.32) | `"1-day"`, `"3-days"`, `"7-days"`, `"30-days"`; needs lifecycle rules (lambda-ops.md#storage-and-privacy) |
| `forceBucketName`, `rendererFunctionName` (3.3.38), `storageClass` (4.0.305), `logLevel` | Advanced routing and logging |
| `mediaCacheSizeInBytes`, `offthreadVideoCacheSizeInBytes`, `offthreadVideoThreads` | Decoder memory and threads |
| `licenseKey`, `isProduction` | Telemetry (license.md) |

`renderStillOnLambda()` takes the still equivalents: `frame`, `imageFormat` (default `png`), `jpegQuality`, `scale`, `outName`, `onInit(...)` (4.0.6, receives the log link when the render starts), `maxRetries`, `privacy`, `deleteAfter`, size overrides, `timeoutInMilliseconds`, `chromiumOptions`, cache options.

### Infrastructure

| Function | Since | Purpose |
| --- | --- | --- |
| `deployFunction()` | | Create the render function. Options: `region`, `timeoutInSeconds` (under 900; 120 recommended), `memorySizeInMb` (512 to 10240; 2048 recommended), `diskSizeInMb` (512 to 10240; set 10240), `createCloudWatchLogGroup`, `cloudWatchLogRetentionPeriodInDays` (14 default), `customRoleArn`, `customLayerArns` (4.0.510), `enableLambdaInsights` (4.0.61), `runtimePreference` (4.0.205: `default`=`cjk`, `apple-emojis`, `cjk`), VPC ids (CLI 4.0.160). Returns `{functionName, alreadyExisted}` |
| `deleteFunction()`, `getFunctions()` (`compatibleOnly`), `getFunctionInfo()` (`memorySizeInMb`, `diskSizeInMb`, `functionName`, `version`, `timeoutInSeconds`), `speculateFunctionName()` (derives the name from memory, disk, timeout; saves an API call) | | Manage and look up functions |
| `getOrCreateBucket()` | | Create or reuse the single Remotion bucket per region; `enableFolderExpiry` adds lifecycle rules; returns `{bucketName, alreadyExisted}` |
| `deploySiteFromBundle()` | 4.0.497 | Upload a bundle made by `bundle()` or `remotion bundle` (`bundleDir`, `bucketName`, `region`, `siteName?`, `options.privacy`, `throwIfSiteExists`, `bypassBucketNameValidation`, `requestHandler`); returns `{serveUrl, siteName, stats: {uploadedFiles, deletedFiles, untouchedFiles}}`. Incremental |
| `deploySite()` | deprecated | Bundle and upload in one step; prefer bundle once plus `deploySiteFromBundle()`. Options include `entryPoint`, `bucketName`, `siteName`, `options.onBundleProgress`, `onUploadProgress`, `webpackOverride`, `bundlerOverride`, `rspackOverride`, `rspack` |
| `getSites()`, `deleteSite()` | | List and remove sites (`totalSizeInBytes` freed) |
| `getRegions()` | | Supported regions (`enabledByDefaultOnly`) |
| `getUserPolicy()`, `getRolePolicy()` | | Policy JSON; `partition: "aws-cn"` since 4.0.510 |
| `simulatePermissions()` | | Run the user policy through the AWS simulator; returns `{decision: allowed or implicitDeny or explicitDeny, name}` per permission |
| `getAwsClient()` | | Raw AWS SDK client access (`region`, `service`) |

### Webhooks and signatures

`renderMediaOnLambda({webhook: {url, secret, customData}})` makes Remotion POST when a render ends, fails, or times out. Every payload has `renderId`, `expectedBucketOwner`, `bucketName`, `customData`. Types: success (`lambdaErrors`, `outputUrl`, `outputFile`, `timeToFinish`, `costs`), error (`errors` with `message`, `name`, `stack`), timeout (nothing else). `customData` must be under 1024 bytes serialized; `secret: null` skips signing. Headers: `X-Remotion-Mode` (`production` or `demo`), `X-Remotion-Signature` (`sha512=<hex>` or `NO_SECRET_PROVIDED`), `X-Remotion-Status` (`success`, `timeout`, `error`). With no secret the signature is `NO_SECRET_PROVIDED` and cannot be verified, so always set a secret. Signing is HMAC with SHA-512 over the body. Helpers:

| Helper | Use |
| --- | --- |
| `validateWebhookSignature({secret, body, signatureHeader})` | Throws if invalid; body is the parsed JSON object |
| `appRouterWebhook({secret, testing, extraHeaders, onSuccess, onError, onTimeout})` | Next.js App Router route handler |
| `pagesRouterWebhook(...)` | Next.js Pages Router |
| `expressWebhook(...)` | Express |

On Hono (JAL), call `validateWebhookSignature()` yourself in the route.

## CLI reference (`remotion lambda ...`)

Global: `--region`, `--yes` / `-y` (skip confirmations on destructive actions), `--quiet` / `-q`, `--env-file`. Region can also come from `REMOTION_AWS_REGION` (default `us-east-1`).

| Command | Purpose and key flags |
| --- | --- |
| `functions deploy` | Create a function: `--memory`, `--disk`, `--timeout`, `--disable-cloudwatch`, `--retention-period`, `--enable-lambda-insights`, `--custom-role-arn`, `--custom-layer-arns`, `--vpc-subnet-ids`, `--vpc-security-group-ids`, `--runtime-preference`, `-q`. Skips creation if an identical function exists |
| `functions ls` | List functions: `--compatible-only` (4.0.164), `-q` |
| `functions rm <names>`, `functions rmall` | Delete functions (`-y`) |
| `sites create [entry]` | Bundle and upload: `--site-name` (deterministic URL, update in place), `--privacy`, `--public-dir`, `--enable-folder-expiry`, `--throw-if-site-exists`, `--disable-git-source`, `--force-bucket-name`, `--force-path-style` |
| `sites ls`, `sites rm`, `sites rmall` | List and delete sites |
| `render <serve-url> <comp-id> [out]` | Render media. Flags mirror `renderMediaOnLambda()`: `--props`, `--codec`, `--frames-per-lambda`, `--concurrency`, `--concurrency-per-lambda`, `--max-retries`, `--privacy`, `--enable-cancellation` (Ctrl+C cancels), `--out-name`, `--webhook`, `--webhook-secret`, `--webhook-custom-data`, `--delete-after`, `--function-name`, `--renderer-function-name`, `--force-bucket-name`, the S3 output provider flags (`--s3-output-provider-endpoint`, `...-region`, `...-force-path-style`, env vars `REMOTION_S3_OUTPUT_PROVIDER_ACCESS_KEY_ID` and `..._SECRET_ACCESS_KEY`), encoding flags, cache flags, `--license-key` |
| `still <serve-url> <comp-id> [out]` | Render a still: `--frame`, `--image-format`, `--jpeg-quality`, `--scale`, `--privacy`, `--out-name`, `--delete-after`, `--license-key`... |
| `compositions <serve-url>` | List compositions from inside a function |
| `policies role`, `policies user`, `policies validate` | Print the policies or validate the user policy with the AWS simulator |
| `quotas`, `quotas increase` | Show or request concurrency and burst quota (`--region`, `--yes`, `--force`) |
| `regions` | List supported regions (`--default-only`) |

## Related

- lambda-ops.md for how it works, setup, auth, permissions, limits, cost and troubleshooting.
- render-paths.md for when Lambda is the right call.
