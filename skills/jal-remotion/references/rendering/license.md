# Remotion license, terms and telemetry: the JAL rule

Written against `remotion` 4.0.532 (docs read 2026-10-01). Prices and rules can change: confirm on remotion.pro before any purchase.

From:
- https://www.remotion.dev/docs/license
- https://www.remotion.dev/docs/license/faq
- https://www.remotion.dev/docs/license/pricing
- https://www.remotion.dev/docs/licensing/
- https://www.remotion.dev/docs/licensing/get-usage
- https://www.remotion.dev/docs/licensing/register-usage-event
- https://www.remotion.dev/docs/telemetry

## What it is

Remotion is source-available, not open source by the Open Source Initiative's definition. Its use is governed by the Remotion License. The licence has two levels that behave identically in features: the Free License and the Company License. There is no difference in functionality between them.

## The JAL rule (free license, and the 4 person warning)

JAL is 3 people (2 developers and 1 AI specialist) and every project is internal, with no external clients (Brian, 2026-10-01), so JAL uses the Free License in every project that needs motion. This is allowed, including for commercial products and for automations, as long as total headcount using Remotion stays at 3 or fewer.

**Every JAL-AIDEV agent that scaffolds, renders or ships a Remotion project must say this once per project, and again whenever the team count may change:**

> Remotion is free for individuals and for teams of up to 3 people. JAL is 3 people today. The moment 4 or more people work on a Remotion project (employees, contractors, or an agency on the same project; a client who owns or runs the Remotion project also counts), a Company License from remotion.pro is required. Do not add a fourth person to a Remotion project, or hand a Remotion project to a client who will run it, before Brian has decided on the license.

An agent must warn, stop, and ask Brian when: a task adds a 4th collaborator, an outside agency or contractor will work in the same Remotion repo, an external client appears or will receive the project code or run Remotion, JAL wants to offer rendering as a service to other companies, or an end user can submit their own Remotion code. Do not guess the count; ask.

Setting the license key in code for the free tier: pass `licenseKey: 'free-license'` to `renderMediaOnWeb()` and `renderStillOnWeb()` (declares eligibility and silences the console warning) and to server render functions if telemetry is wanted. Store a real company key only in env vars, never in source, and never print it.

## Who is eligible for free

Individuals (personal or commercial), organizations or teams of up to 3 people, non-profits, and people evaluating Remotion. No sign-up on remotion.pro is needed. A one-person incorporated company is fine if headcount is 3 or fewer. You can make money, run an automation, or launch a SaaS under the Free License; the only limits are the small commercial restrictions below.

### Counting people (agencies and clients)

- Agency delivers only a finished video file and the client never gets code or runs Remotion: only the agency headcount counts (3 or fewer is free).
- Client owns or operates the Remotion project, or collaborates directly on it: both headcounts aggregate for the 4 person threshold; the entity that owns the project IP buys the license (an agency may administer it).
- Other studios or freelancers brought in to operate Remotion on the same project: their headcount aggregates with yours.

### Allowed and not allowed

Allowed: any commercial use that does not sell Remotion as a product or let people dodge a license they would need; for example letting users create and render their own personalized video from a JAL template. Also allowed: a service that uses an LLM to generate Remotion code and renders it for customers (customers need no license), and letting users edit code your service generated.

Not allowed: letting users submit or upload any Remotion project or code of their own to be rendered on your server (a rendering service for arbitrary Remotion code). Do not build this, ever, without Brian and Remotion's written approval. It is also a code execution risk.

## Company License (4 or more people)

Bought at remotion.pro/license (sign in with email magic link, Google or GitHub; passwords are not supported). No extra features, but Company License holders get first response on support and a private Discord channel.

| Plan | For | Price (docs, 2026-10-01) |
| --- | --- | --- |
| Remotion for Creators | Organizations producing videos without an automation | $25 per month per person who writes Remotion code, by hand or with agentic coding tools |
| Remotion for Automators | Organizations whose code calls a render API programmatically | $0.01 per render, minimum $100 per month |
| Both | | Combined minimum $100 per month |
| Enterprise | Custom terms, signed agreements, vendor forms, monthly consulting, private channel, Editor Starter free | Same rates, minimum $500 per month, custom quotes possible |

An automation is code you own that calls any of: `renderMedia()`, `renderStill()`, `renderFrames()`, `renderMediaOnLambda()`, `renderStillOnLambda()`, `renderMediaOnCloudrun()`, `renderStillOnCloudrun()`, `renderMediaOnVercel()`, `renderStillOnVercel()`, `renderMediaOnWeb()`, `renderStillOnWeb()`, `remotion render`, `remotion still`, `remotion lambda render|still`, `remotion cloudrun render|still`, or embeds the `<Player>`. Video editors, prompt-to-video tools and automated pipelines are Automators. One render is the successful generation of a video, audio, GIF, still or PDF; Studio and Player previews do not count. Developers building an automation do not need a Creators seat. The Lambda cost page adds: teams of 4 or more also need the Company License on top of AWS cost.

Maintain the license for as long as you render (Creators) or run the automation (Automators). Exceeding render or seat limits: raise it in the dashboard within 30 days, prorated. No refunds (you can evaluate first). Payments through Stripe. Procurement forms need Enterprise.

## Telemetry

Telemetry reports renders to Remotion for license accountability and never blocks or fails a render.

| Path | Behavior |
| --- | --- |
| `@remotion/web-renderer` (in-browser, the JAL default) | Always sends an event per render (success or failure; none if aborted), even with no key. Cannot be disabled |
| `renderMedia()`, `renderStill()`, Lambda, Vercel | Sends only when `licenseKey` is set, only for successful renders |
| Cloud Run | No telemetry; use `@remotion/licensing` directly |
| Remotion 5.0 | Telemetry via `licenseKey` becomes mandatory for Automators (Company License); stays voluntary for Free and Creators |

Data sent: license key, IP address, video or still, production or development, and for in-browser rendering also the page origin (`window.location.origin`) and success or failure. Remotion says it never collects media content, metadata or user data, retains the events indefinitely for now, and shares them with no third party. For in-browser rendering the end user's IP goes to Remotion: say so in the JAL privacy policy (legitimate interest, operational telemetry to a technical provider). If a company policy blocks telemetry, a monthly verifiable report is needed instead.

## `@remotion/licensing` (4.0.237)

Normally you do not call it: pass `licenseKey` to the render function. Company License holders can also use:

- `registerUsageEvent({licenseKey, event: 'web-render' | 'cloud-render', host, succeeded})` returns `{billable, classification: 'billable' | 'development' | 'failed'}`. A `localhost` host counts as development; failed renders are free.
- `getUsage({licenseKey, since})` with the secret key (`rm_sec_...`, backend only, never in a client) returns `webRenders` and `cloudRenders` each with `billable`, `development`, `failed`. `since` defaults to the start of the UTC month and can go back at most 90 days. Use it for spend controls.
- Public keys look like `rm_pub_...`; a deprecated `apiKey` was replaced by `licenseKey` (4.0.409).

## Other legal points

- A Remotion license covers Remotion only. Codec patents (H.264, HEVC, AAC) are separate and the product owner's responsibility.
- Remotion's FFmpeg binary is GPLv2+ (server-runtime.md#ffmpeg-license).
- Remotion is self-hosted: the license is permission to use, not hosting.
- remotion.dev is docs; remotion.pro is the licensing platform and store.
- Questions go to hi@remotion.dev. The terms pages (Terms and Conditions, Privacy Policy, DPA) are the binding text; this file is a working summary, not legal advice.

## Related

- render-paths.md for which paths count as automations and when to ask Brian.
