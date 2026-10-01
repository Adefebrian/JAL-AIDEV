# Remotion Lambda operations: setup, limits, cost, security, integrations, troubleshooting

Written against `remotion` 4.0.532 (docs read 2026-10-01). Optional path: needs Brian's confirmation (render-paths.md). API and CLI tables are in lambda.md.

From:
- https://www.remotion.dev/docs/lambda
- https://www.remotion.dev/docs/lambda/authentication
- https://www.remotion.dev/docs/lambda/autodelete
- https://www.remotion.dev/docs/lambda/aws-china-regions
- https://www.remotion.dev/docs/lambda/bucket-naming
- https://www.remotion.dev/docs/lambda/bucket-security
- https://www.remotion.dev/docs/lambda/cancellation
- https://www.remotion.dev/docs/lambda/changelog
- https://www.remotion.dev/docs/lambda/checklist
- https://www.remotion.dev/docs/lambda/concurrency
- https://www.remotion.dev/docs/lambda/cost-example
- https://www.remotion.dev/docs/lambda/custom-destination
- https://www.remotion.dev/docs/lambda/custom-layers
- https://www.remotion.dev/docs/lambda/data-transfer-cost
- https://www.remotion.dev/docs/lambda/disk-size
- https://www.remotion.dev/docs/lambda/ec2
- https://www.remotion.dev/docs/lambda/faq
- https://www.remotion.dev/docs/lambda/faster-progress-polling
- https://www.remotion.dev/docs/lambda/feb-2022-outage
- https://www.remotion.dev/docs/lambda/feb-2023-incident
- https://www.remotion.dev/docs/lambda/go
- https://www.remotion.dev/docs/lambda/how-lambda-works
- https://www.remotion.dev/docs/lambda/insights
- https://www.remotion.dev/docs/lambda/limits
- https://www.remotion.dev/docs/lambda/multiple-buckets
- https://www.remotion.dev/docs/lambda/naming-convention
- https://www.remotion.dev/docs/lambda/optimizing-cost
- https://www.remotion.dev/docs/lambda/optimizing-speed
- https://www.remotion.dev/docs/lambda/permissions
- https://www.remotion.dev/docs/lambda/php
- https://www.remotion.dev/docs/lambda/proxy
- https://www.remotion.dev/docs/lambda/python
- https://www.remotion.dev/docs/lambda/r2
- https://www.remotion.dev/docs/lambda/region-selection
- https://www.remotion.dev/docs/lambda/ruby
- https://www.remotion.dev/docs/lambda/runtime
- https://www.remotion.dev/docs/lambda/s3-public-access
- https://www.remotion.dev/docs/lambda/separate-environments
- https://www.remotion.dev/docs/lambda/serverless-framework-integration
- https://www.remotion.dev/docs/lambda/setup
- https://www.remotion.dev/docs/lambda/sqs
- https://www.remotion.dev/docs/lambda/supabase
- https://www.remotion.dev/docs/lambda/troubleshooting/bucket-disallows-acl
- https://www.remotion.dev/docs/lambda/troubleshooting/debug
- https://www.remotion.dev/docs/lambda/troubleshooting/permissions
- https://www.remotion.dev/docs/lambda/troubleshooting/rate-limit
- https://www.remotion.dev/docs/lambda/troubleshooting/security-token
- https://www.remotion.dev/docs/lambda/troubleshooting/unrecognizedclientexception
- https://www.remotion.dev/docs/lambda/uninstall
- https://www.remotion.dev/docs/lambda/upgrading
- https://www.remotion.dev/docs/lambda/webhooks
- https://www.remotion.dev/docs/lambda/without-iam/
- https://www.remotion.dev/docs/lambda/without-iam/example

## What it is

The operating manual for Remotion Lambda in an AWS account: how a render flows, how to set it up, what it costs, what limits apply, how to secure it, and what breaks.

## When a JAL agent uses it

Only after Brian says yes to Lambda. Then follow it step by step; never create IAM users, keys, buckets or functions on a guess, and never print an access key.

## How it works

1. `renderMediaOnLambda()` invokes the main function.
2. The main function opens the Serve URL in a headless browser, finds the composition, resolves props (`calculateMetadata()`).
3. From duration and concurrency it splits the video into chunks and invokes one renderer function per chunk. With `concurrency: 1` (4.0.517) it renders on the main function and skips streaming.
4. Renderer functions stream progress and binary chunks back to the main function with AWS Lambda response streaming (architecture from 4.0.165; before that chunks went via S3).
5. The main function writes `progress.json` to S3 periodically; `getRenderProgress()` reads it.
6. When all chunks arrive they are concatenated seamlessly (not a public API), uploaded to S3, and the function ends.
- A homemade distributed renderer is possible with `frameRange` plus `audioCodec: "pcm-16"` and FFmpeg concatenation, but is hard and not recommended.
- Each chunk downloads every asset referenced in its frames, so many parallel downloads can hit a server rate limit (the Pexels case, see below).
- Why not EFS: speed gain too small, and VPC plus security groups would remove public internet access, which then needs a persistent EC2 proxy.

## Setup (order matters)

1. `bun add --exact @remotion/lambda@<version>` (same version as `remotion`; `remotion add` lists npm, yarn and pnpm only).
2. Create IAM policy named exactly `remotion-lambda-policy` from `remotionb lambda policies role` (JSON).
3. Create role named exactly `remotion-lambda-role` for the Lambda use case with that policy.
4. Create an IAM user (no console access). Create an access key ("application running on an AWS compute service"). Put keys in `.env` as `REMOTION_AWS_ACCESS_KEY_ID` and `REMOTION_AWS_SECRET_ACCESS_KEY`. Do not commit `.env`.
5. Attach an inline user policy from `remotionb lambda policies user`.
6. Optional: `remotionb lambda policies validate` (the role policy cannot be validated).
7. Deploy a function: `remotionb lambda functions deploy` (CLI) or `deployFunction()`. A function is tied to a Remotion version and holds no project code.
8. Deploy a site: `remotionb lambda sites create` or `bundle()` then `deploySiteFromBundle()`. Keep the returned Serve URL.
9. Render: `remotionb lambda render <serve-url> <comp-id>` or `renderMediaOnLambda()`.
10. Optional: lifecycle rules, webhooks, quota increase.

### Authentication

Order of lookup: `REMOTION_AWS_PROFILE` or `AWS_PROFILE`; `REMOTION_AWS_ACCESS_KEY_ID` and `REMOTION_AWS_SECRET_ACCESS_KEY`; `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Prefer the `REMOTION_` names (the unprefixed ones are reserved on some hosts and clash with the AWS CLI). The CLI reads `.env`; Node/Bun APIs do not (load it yourself). Several AWS accounts can multiply the concurrency limit: rotate the env vars before each call. `REMOTION_SKIP_AWS_CREDENTIALS_CHECK=1` skips the check when credentials come from instance metadata. Calling Lambda from inside another AWS Lambda or a Vercel function needs the `REMOTION_` names (UnrecognizedClientException otherwise).

### Without a long-term IAM user

Use an IAM role on the calling service (Lambda, EC2). Give the role the policy and use temporary credentials; reference CDK example project. On EC2 assume a role through STS and pass the token to Remotion. Both are optional patterns in the docs with sample repos; not needed for JAL's Coolify servers, which would use a user key.

## Limits

- Concurrent executions: 1000 per region per account by default (some new accounts start near 10; some regions burst at 500). Raise with `remotionb lambda quotas increase` (root accounts only) or the Service Quotas console.
- Max 200 functions per render, `framesPerLambda` minimum 5 (4 before 4.0.331). Default `framesPerLambda` is at least 20 frames; defaults interpolate concurrency from 75 to 150 for videos up to about 10 minutes at 30 fps and then clamp. Pass `framesPerLambda: null` to let Remotion choose.
- Memory 512 to 10240 MB (2048 recommended). Timeout under 900 seconds (120 recommended; more concurrency beats more timeout). Disk 512 to 10240 MB; max output file about half the disk; 10240 MB adds under 1 percent cost. Default disk is 2048 MB below Remotion 5.0 and 10240 MB from 5.0. Approximate 1080p length per disk size: 512 MB, 8 min; 2048 MB, 32 min; 10240 MB, 2 h 40 min.
- vCPUs scale with memory: up to 3008 MB 2 vCPU; 3009 to 5307 MB 3; 5308 to 7076 MB 4; 7077 to 8845 MB 5; above that 6.
- Runtime: Node.js 20.x currently kept on Lambda (higher versions were unstable); the runtime ARN is locked when your policy includes `lambda:PutRuntimeManagementConfig`. Chrome runs single-process on Amazon Linux. ARM64 only (x64 discontinued). No AV1.
- Edge frameworks cannot import the client.
- "Too many functions" (over 200) and `TooManyRequestsException` / `ConcurrentInvocationLimitExceeded` mean concurrency math: lower `concurrency`, render with `concurrency: 1` while waiting for a quota raise (leave capacity for the launch function and progress calls), or raise the quota.

## Cost

- Docs example (2048 MB, 10 GB disk, default concurrency, `us-east-1`, version 4.0.381): hello world about $0.001 (7.6 s warm, 11 s cold); 1-minute video with an embedded clip $0.017 to $0.021; 10-minute remote HD video about $0.10 (about 60 s); 10-second remote 4K about $0.013 (about 45 to 53 s). Measure your own composition.
- Extra costs: S3 egress for assets (even in the same region, because it moves over HTTP), S3 storage for sites and renders, CloudWatch logs, and the Remotion license for teams of 4 or more.
- Reduce cost: lower memory (cost is linear), lower concurrency (less browser warm-up overhead), use `<Video>` from `@remotion/media` (starts decoding before the file is fully downloaded), pick a cheaper region, pre-compute data and pass as input props, make the render itself faster, put big assets on Cloudflare R2 with a custom domain and Cloudflare Cache enabled (R2 has no egress fee; `r2.dev` URLs do not cache; disable Bot Fight Mode for the R2 domain).
- Speed up: lower `framesPerLambda` (diminishing returns and more cost), more memory (more CPU), `concurrencyPerLambda`, `overwrite: true`, `speculateFunctionName()`, direct S3 progress polling, region in the bucket name, `audioCodec: "mp3"` (4.0.16, faster join, no QuickTime playback).
- `estimatePrice()` and the render result's `costs` give estimates.

### Faster progress polling

`getRenderProgress({skipLambdaInvocation: true, ...})` reads S3 directly (no Lambda call per poll). Needs the function name to follow the naming convention (`remotion-render-<version>-mem2048mb-disk2048mb-240sec`, so use `speculateFunctionName()`) and `s3:GetObject` on the bucket (included in `getUserPolicy()`).

## Storage and privacy

- One bucket per region and account (name starts with `remotionlambda-` and contains the region, e.g. `remotionlambda-apsouth1-3ysk0nyazp`). Custom names are possible (`forceBucketName`, change the policy prefix, pass the name to every API) but not recommended; multiple buckets make Remotion throw unless you pass the name.
- Renders land at `renders/<renderId>/out.<ext>` in the bucket. Change with `outName`, a `{bucketName, key}` object (same region; extend the role policy; keep passing the site bucket to progress and download calls), or an S3-compatible provider via `s3OutputProvider` (Supabase, Cloudflare R2, DigitalOcean Spaces work; CLI flags above).
- Before 4.0.418 buckets were `public-read` ACL (listable, renders public unless `privacy: "private"`). From 4.0.418, new buckets use a bucket policy (not listable, URL-secret) if the user policy has `s3:PutBucketPolicy`; older buckets stay as they were. `privacy: "private"` plus `presignUrl()` keeps a render private. `"no-acl"` fixes "bucket does not allow ACLs". Since April 2023 AWS blocks public buckets by default; use Remotion 3.3.87 or later and an updated policy.
- The Serve URL site is public by design (the Lambda browser fetches it by URL). Never bake secrets into the bundle; pass them via `inputProps` and `envVariables`. Use a long, unguessable `--site-name` and a `robots.txt` with `Disallow: /`. A public Serve URL does not let anyone start renders in your account.
- Auto-delete: add `s3:PutLifecycleConfiguration` to the user policy (automatic for setups after 4.0.32), redeploy the site with `--enable-folder-expiry` (4 lifecycle rules appear in S3 Management), then render with `deleteAfter: "1-day" | "3-days" | "7-days" | "30-days"`. Config setters: `setEnableFolderExpiry`, `setDeleteAfter`.
- Separate environments: the function is identical everywhere (reuse it, same memory, disk, timeout, version). Scope sites with `--site-name` such as `remotion-production` and `remotion-staging`. Functions with different config get new names; keeping old ones costs nothing.

## Cancellation

Set `enableCancellation: true` (CLI `--enable-cancellation`, config `setEnableCancellation`). Each renderer then issues one S3 HEAD per second; the worst case of 200 functions for 15 minutes is about $0.072. `cancelRenderOnLambda()` throws if the render was not started with it. Stills cannot be cancelled. Ctrl+C in the CLI sends the signal when enabled.

## Production checklist

Memory sweet spot; max output size versus disk; least-privilege AWS user and keys in env vars; `framesPerLambda` inside bounds; `privacy` for private renders; rate-limit users so one person cannot burn the AWS bill; timeout measured; a valid Remotion license (teams of 4 or more buy cloud seats).

## Runtime layers, fonts and emoji

Chrome and base fonts are included. Default layers (`cjk`): Chromium 196 MB, Google emoji 9.9 MB, fonts 1.9 MB, CJK 16 MB, total about 224 MB; `apple-emojis` drops CJK and Google emoji (total about 243 MB). The 250 MB layer limit forces trade-offs. Prefer web fonts for extra fonts. Custom layers (`customLayerArns`, 4.0.510) replace the hosted layers; build from the `lambda-binaries` repo (ARM only); you own version drift. In AWS China regions `cn-north-1` and `cn-northwest-1` (4.0.510) hosted layers are unavailable, credentials must be from an `aws-cn` account, ARNs start with `arn:aws-cn:`, and policies use `partition: "aws-cn"`. Lambda Insights: deploy with `--enable-lambda-insights` and add the role permission.

## Region choice

Default `us-east-1`. Set per call in code; CLI uses `--region` or `REMOTION_AWS_REGION`. Some regions are off by default in an AWS account ("The security token included in the request is invalid"): enable them under Account, or use `getRegions({enabledByDefaultOnly: true})`. Put the function, bucket and asset storage in the same region as the users or assets.

## Integrations (all optional)

| Pattern | Summary |
| --- | --- |
| Trigger from Python (4.0.15), PHP (3.3.96), Ruby (4.0.232, experimental), Go (experimental) | Official client packages that call `renderMediaOnLambda()` and progress; match the client version to the deployed function; large props over about 200 KB are handled in Python from 4.0.315 and not in Go. JAL is TypeScript, so use the JS client |
| Next.js route handlers | `appRouterWebhook()`, `pagesRouterWebhook()`; sample render and progress endpoints in the Next template |
| Supabase Edge Functions | `@remotion/lambda-client` via Deno, renders can be stored in Supabase Storage through an S3-compatible provider |
| Cloudflare R2 | Output provider and asset store without egress fees |
| SQS queue | Park render requests behind the concurrency limit; the queue advances when a render is triggered, not when it finishes (known flaw) |
| Serverless Framework, CDK | Sample repos deploy handlers behind API Gateway and Cognito |
| HTTP proxy | `requestHandler` option with a proxy agent (4.0.315) |
| Vercel serverless | Trigger Lambda from a route (vercel.md) |

## Troubleshooting Lambda

- Debug with the CLI: `remotionb lambda render ... --props file.json --log=verbose`, read the printed CloudWatch links. Four failure kinds: error in your React code, a `delayRender()` timeout (raise `timeoutInMilliseconds`, not the function timeout), a chunk function timeout, the main function timeout (raise `--timeout` when deploying or raise concurrency). Make the `delayRender()` timeout shorter than the function timeout, or the function dies silently.
- Permissions: Node APIs do not read `.env`; user policy and role policy mixed up; wait 2 to 3 minutes after policy edits; a new Remotion version may need new permissions; `UnrecognizedClientException` when calling inside another AWS function.
- Rate limits: see Limits.
- ACL error: `privacy: "no-acl"`. Bucket cannot be created: upgrade Remotion and the user policy.
- Pexels or other throttled hosts: use `<Video>` from `@remotion/media`, or re-host the media.

## Upgrade, uninstall, history

- Upgrade: raise every Remotion package to the same exact version with `bun add --exact` (`remotion upgrade` lists npm, yarn and pnpm only), deploy a new function (old one can stay), re-run `sites create --site-name <existing>` to keep the URL. Function, site and client package should share a version. A version mismatch warns or fails.
- Uninstall: `remotionb lambda functions rmall -y`, `remotionb lambda sites rmall`, then delete the bucket and the IAM user, role and policy. This deletes all renders.
- History: Feb 2022 an AWS micro-VM change broke Remotion Lambda (fixed; use ARM64); Feb 2023 a Node 14 runtime update broke Chromium with SIGBUS (fixed in 4.0, locked runtime ARN). The prerelease changelog stops at 3.0; later changes are in Remotion's GitHub releases.

## FAQ highlights

Self-hosted in your AWS account. One function serves many renders and projects; deploy more only per region, per Remotion version, or per memory/disk/timeout configuration (Remotion picks randomly among suitable ones). One bucket per region. You cannot modify the code inside the function (fork only after talking to Remotion). Deploy one site and parametrize with `inputProps` and `calculateMetadata()`; use multiple `<Composition>`s for different templates. Remotion does not offer a hosted renderer.
