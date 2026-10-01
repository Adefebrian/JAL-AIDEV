# Remotion Cloud Run (`@remotion/cloudrun`): reference

Written against `remotion` 4.0.532 (docs read 2026-10-01). Optional path and not recommended: Cloud Run is Alpha and not actively developed. Needs Brian's confirmation, and an agent should argue for Lambda or the Coolify service instead.

From:
- https://www.remotion.dev/docs/cloudrun
- https://www.remotion.dev/docs/cloudrun/api
- https://www.remotion.dev/docs/cloudrun/checklist
- https://www.remotion.dev/docs/cloudrun/cli
- https://www.remotion.dev/docs/cloudrun/cli/permissions
- https://www.remotion.dev/docs/cloudrun/cli/regions
- https://www.remotion.dev/docs/cloudrun/cli/render
- https://www.remotion.dev/docs/cloudrun/cli/services
- https://www.remotion.dev/docs/cloudrun/cli/services/deploy
- https://www.remotion.dev/docs/cloudrun/cli/services/ls
- https://www.remotion.dev/docs/cloudrun/cli/services/rm
- https://www.remotion.dev/docs/cloudrun/cli/services/rmall
- https://www.remotion.dev/docs/cloudrun/cli/sites
- https://www.remotion.dev/docs/cloudrun/cli/sites/create
- https://www.remotion.dev/docs/cloudrun/cli/sites/ls
- https://www.remotion.dev/docs/cloudrun/cli/sites/rm
- https://www.remotion.dev/docs/cloudrun/cli/sites/rmall
- https://www.remotion.dev/docs/cloudrun/cli/still
- https://www.remotion.dev/docs/cloudrun/deleteservice
- https://www.remotion.dev/docs/cloudrun/deletesite
- https://www.remotion.dev/docs/cloudrun/deployservice
- https://www.remotion.dev/docs/cloudrun/deploysite
- https://www.remotion.dev/docs/cloudrun/generate-env
- https://www.remotion.dev/docs/cloudrun/getorcreatebucket
- https://www.remotion.dev/docs/cloudrun/getregions
- https://www.remotion.dev/docs/cloudrun/getserviceinfo
- https://www.remotion.dev/docs/cloudrun/getservices
- https://www.remotion.dev/docs/cloudrun/getsites
- https://www.remotion.dev/docs/cloudrun/instancecount
- https://www.remotion.dev/docs/cloudrun/light-client
- https://www.remotion.dev/docs/cloudrun/limits
- https://www.remotion.dev/docs/cloudrun/multiple-buckets
- https://www.remotion.dev/docs/cloudrun/permissions
- https://www.remotion.dev/docs/cloudrun/region-selection
- https://www.remotion.dev/docs/cloudrun/rendermediaoncloudrun
- https://www.remotion.dev/docs/cloudrun/renderstilloncloudrun
- https://www.remotion.dev/docs/cloudrun/setup
- https://www.remotion.dev/docs/cloudrun/speculateservicename
- https://www.remotion.dev/docs/cloudrun/status
- https://www.remotion.dev/docs/cloudrun/testpermissions
- https://www.remotion.dev/docs/cloudrun/uninstall
- https://www.remotion.dev/docs/cloudrun/upgrading

## What it is

A Remotion renderer packaged as a Google Cloud Run service. A Remotion site (bundle) lives in a Cloud Storage bucket, a Cloud Run service opens it in headless Chrome, renders the video or still on one machine, and uploads the file to Cloud Storage. There is no distributed rendering, no webhooks of the Lambda kind, no cost estimation, no Apple emoji, no renders with expiry, and no PHP, Python or Go clients.

## Status (read before choosing it)

Remotion states Cloud Run is "not being actively developed": only critical bugs are fixed, it was never marked production-ready, and it lacks many Lambda features. The plan is to adapt the Lambda runtime to also power Cloud Run in a new package. Rely on it only if what it offers today is enough. It is cheaper than Lambda for idle time (billed only while running, scales to zero) and avoids Lambda overhead, but a single render runs on one instance.

## When a JAL agent uses it

Practically never. The Coolify render service in render-paths.md covers the same "one machine per render" shape on JAL's own infrastructure with no GCP account. Use this file only if Brian explicitly asks for Google Cloud.

## Architecture and limits

- Pieces: Cloud Run service (binaries and libraries), Cloud Storage bucket (sites, renders, metadata), CLI, Node API.
- A new service image is published by Remotion for each release to a public Artifact Registry; `deployService()` pulls the latest unless you pin a version (`performImageVersionValidation` checks the image exists).
- Quotas (check GCP docs for current numbers): memory up to 32 GB, up to 8 vCPUs, in-memory writable filesystem up to 32 GB (bounded by instance memory), timeout up to 60 minutes, instances up to 100 per region by default (raise by quota request). Output size is limited by memory minus the software footprint, because the filesystem is in memory.
- Concurrency per instance: services deploy with no concurrency (one render per instance). Raising it in the GCP console is untested by Remotion. Instance counts: min default 0 (scale to zero; running instances bill even when idle), max default 100 below Remotion 5.0 and 5 from 5.0. Exceeding max returns HTTP 503; queue with Cloud Tasks. Run several services to give different product tiers different caps.
- One bucket per region and project. Default region `us-east1`; set with `REMOTION_GCP_REGION` (CLI only) or `--region`; the Node API needs an explicit region.
- Chrome for Testing is not supported. Multi-process Chrome is on automatically from 4.0.42.

## Setup

1. `bun add --exact @remotion/cloudrun@<version>` (same version as `remotion`).
2. Create a GCP project (name 4 to 30 characters) and enable billing (needed for the Cloud Run API).
3. In Cloud Shell, run the Remotion installer script (a tar from the Remotion repo plus `node install.mjs`), choose "set up project", apply the plan, generate `.env` (service account key and project id), copy it into the local `.env`, then delete it from Cloud Shell. Never commit or share the key file. GCP allows at most 10 keys per service account; the script lets you delete old ones. Option 2 of the script (generate .env) is described in the Generate .env page.
4. Optional: `remotionb cloudrun permissions` (validates the service account; custom role "Remotion API Service Account").
5. Deploy a service: `remotionb cloudrun services deploy` or `deployService()`. The service is bound to the Remotion version.
6. Deploy a site: `remotionb cloudrun sites create src/index.ts --site-name=my-video` (the same `--site-name` overwrites and keeps the URL).
7. Render: `remotionb cloudrun render <serve-url> <comp-id>` or `renderMediaOnCloudrun()`. Identify the service by Cloud Run URL or by service name (the name is derived from memory, CPU and timeout; `speculateServiceName()` computes it).

## API reference

Import render calls from `@remotion/cloudrun/client` (the light client, since 4.0.84; no renderer dependency; not for browsers or edge).

| Function | Purpose | Key arguments and returns |
| --- | --- | --- |
| `renderMediaOnCloudrun()` | Render video or audio | `cloudRunUrl` or `serviceName` (one required), `region`, `serveUrl`, `composition`, `codec` (CLI lists `h264`, `h265`, `png`, `vp8`, `mp3`, `aac`, `wav`, `prores`), `inputProps`, `privacy` (`public` or `private`), `forceBucketName`, `outName`, `concurrency` (browser tabs, default 50 percent), `frameRange`, `everyNthFrame`, size and fps overrides, encoding options (`audioCodec`, `audioBitrate`, `videoBitrate`, `crf`, `x264Preset`, `gopSize`, `pixelFormat`, `proResProfile`, `colorSpace`, `jpegQuality`, `imageFormat`, `scale`, `muted`, `sampleRate`, `enforceAudioTrack`, `preferLossless`, `numberOfGifLoops`), `chromiumOptions`, `envVariables`, `metadata`, `downloadBehavior` (4.0.176), `delayRenderTimeoutInMilliseconds`, `renderIdOverride`, `renderStatusWebhook` (url, with progress), cache options, `logLevel`. Returns `{type: 'success', publicUrl?, renderId, bucketName, privacy, cloudStorageUri (gs://...), size (KB)}` or `{type: 'crash', cloudRunEndpoint, message, requestStartTime, requestCrashTime, requestElapsedTimeInSeconds}` |
| `renderStillOnCloudrun()` | Render one frame | Same service and bucket arguments plus `frame` (zero-indexed, negative counts from the end), `imageFormat`, `jpegQuality`, `scale`, `outName`; returns `{renderId, bucketName, privacy, publicUrl, cloudStorageUri, size}` |
| `deployService()` | Create the service | `region`, `projectID`, `memoryLimit` (default recommendation in docs; max 32 GB), `cpuLimit` (default 1; max 8), `minInstances` (0), `maxInstances`, `timeoutSeconds` (under 3600, CLI default 300), `performImageVersionValidation` (true), `onlyAllocateCpuDuringRequestProcessing` (4.0.221, sets cpu idle) |
| `deploySite()` | Bundle and upload to Cloud Storage | `entryPoint`, `bucketName`, `siteName?`, `options.onBundleProgress`, `onUploadProgress`, `webpackOverride`, `bundlerOverride`, `rspackOverride`, `rspack`... |
| `deleteService()`, `deleteSite()` | Remove | `region`+`serviceName`; `bucketName`+`siteName` |
| `getServices()` | List services (`region`, `compatibleOnly`) | `serviceName`, `memoryLimit`, `cpuLimit`, `remotionVersion`, `timeoutInSeconds`, `uri`, `region`, `consoleUrl` |
| `getServiceInfo()` | One service | same fields |
| `getSites()` | List sites and buckets | `sites[{id, bucketName, bucketRegion, serveUrl}]`, `buckets[{region, name, creationDate}]` |
| `getOrCreateBucket()` | Find or make the bucket | `{bucketName, alreadyExisted}` |
| `getRegions()` | Supported regions | array |
| `speculateServiceName()` | Name from `memoryLimit`, `cpuLimit`, `timeoutSeconds` | string |
| `testPermissions()` | Check the service account | array of `{decision: boolean, permissionName}`, `onTest` callback |

## CLI reference (`remotion cloudrun ...`)

| Command | Purpose and flags |
| --- | --- |
| `permissions` | Print and validate required service account permissions |
| `regions` | List supported regions |
| `services deploy` | `--region`, `--memoryLimit`, `--cpuLimit`, `--minInstances`, `--maxInstances`, `--timeoutSeconds`, `--onlyAllocateCpuDuringRequestProcessing`, `-q` |
| `services ls`, `services rm`, `services rmall` | List, delete one, delete all (`-y`, `--region`, `-q`) |
| `sites create [entry]` | `--region`, `--site-name`, `--disable-git-source` |
| `sites ls`, `sites rm`, `sites rmall` | List and delete sites |
| `render <serve-url> <comp-id> [out]` | `--region`, `--props`, `--privacy`, `--force-bucket-name`, `--concurrency`, `--cloud-run-url`, `--service-name`, `--out-name`, `--codec`, `--webhook`, `--render-id-override`, encoding and cache flags, `--frames`, `--every-nth-frame`, `--metadata` |
| `still <serve-url> <comp-id> [out]` | `--image-format`, `--jpeg-quality`, `--scale`, `--out-name`, `--cloud-run-url`, `--service-name`, cache flags |

## Production checklist

Memory sweet spot; max file size is tied to memory; service account with minimum permissions and keys in env vars; concurrency left at one; instance limit set (503 above it); `privacy` for private renders; a Remotion license (teams of 4 or more).

## Operations

- Upgrade: upgrade all Remotion packages, optionally `services rmall -y` if the old service is unused, `services deploy`, `sites create --site-name <existing>`.
- Uninstall: `services rmall -y`, `sites rmall`, delete the bucket and the service account. Deletes all renders.
- Multiple buckets: avoid; if you see "multiple buckets" delete the extras.
- Terminology: the Cloud Run URL is the service address; the Service Name is its name and can replace the URL.

## Related

- render-paths.md, license.md, lambda.md for the comparison.
