# Licence, telemetry, privacy and support policy (Remotion core)

Read against the Remotion Terms and the repo `LICENSE.md` (docs and GitHub read 2026-10-01). This is a working summary for engineers, not legal advice: when a case is close to a threshold, ask Brian, and Brian asks Remotion (hi@remotion.dev / remotion.pro FAQ).

## What it is

The rules under which JAL may use Remotion, what the plugin must warn about, what Remotion collects, and where help comes from.

## When a JAL agent uses it

Before the first Remotion install in a project, when the team size changes, when a client receives the Remotion source, when a render service is proposed, and whenever client-side rendering is wired into a public page.

## Licence tiers

| Tier | Who | Cost |
|---|---|---|
| Free License | an individual; an organisation or team of **up to 3 people**; non-profit or not-for-profit; evaluation not yet commercial | free, commercial use allowed |
| Company License | everyone else | "Remotion for Creators": $25 per seat per month, no minimum, low-volume videos made for the company itself without automation; "Remotion for Automators": $0.01 per render in steps of 1000 ($10), minimum $100 per month, for editors, prompt-to-video tools, automated pipelines, embedding the Player, any code that calls `renderMedia/renderStill/renderFrames/...OnLambda/...OnCloudRun/...` or the render CLI or uses `<Player>`; both together: combined minimum $100 per month |
| Enterprise | Company License users that need custom terms, features, private support | minimum $500 per month |

**Team size rule:** a licence is mandatory when the total personnel across all involved parties that operate Remotion on the same project reaches **four or more**. Involved parties own, control or directly use the Remotion codebase. Someone who only receives rendered media does not count. A client that owns the code counts. In **Remotion 5.0** contractors also count (a company can no longer stay free by using only contractors) and the licence is tied to new terms.

**JAL rule for the plugin (Brian, 2026-10-01):** JAL is 3 people (2 developers and 1 AI specialist) and every project is internal, with no external clients, so the free licence covers every JAL project that needs motion. **Warn and stop when a fourth team member appears (employee, contractor, or agency) or when an external client appears (anyone outside JAL who would receive the Remotion project source or run it).** The warning text: "Remotion's free licence ends at 4 people on the project (contractors count from 5.0, and a client who receives the source counts too). A Company License is required (Creators $25/seat/month or Automators $0.01/render, min $100/month). Confirm with Brian before continuing."

Free License users may build automations without buying renders. Internal tooling of a for-profit company counts as commercial use.

## Disallowed

- Copying or modifying Remotion to sell, rent, license, relicense or sublicense your own derivative.
- Reverse-engineering parts not shipped as source.
- Running a rendering service where end users bring or upload their own Remotion code (needs written approval). Allowed: a prompt-to-motion-graphics service that generates Remotion code with AI and renders it (users may edit what the service generated).
- Native desktop apps (Electron, Tauri) may ship Remotion if there is an abstraction layer so end users cannot edit or upload Remotion source.
- A licence is per use case/product/customer engagement; not transferable; do not imply Remotion endorsement.

## Licences of the packages

`remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/renderer`, `@remotion/web-renderer`, `create-video`, lambda/cloudrun/vercel: "SEE LICENSE IN LICENSE.md" (Remotion License, source-available). MIT: `@remotion/gsap`, and the pure helpers listed on the standalone page (`@remotion/paths`, `@remotion/noise`, `@remotion/shapes`, `@remotion/layout-utils`, `@remotion/preload`, `@remotion/media-utils`, `@remotion/install-whisper-cpp`). `interpolate()` and `spring()` from `remotion` are under the Remotion License even when used outside a video (the standalone page marks them as requiring a company licence for companies). `packages/agent-plugin` in the monorepo is MIT but internal. The official agent skills repo has no licence file and lives under the Remotion License: JAL distils them in its own words (see `official-skills.md`).

## Telemetry (`@remotion/licensing`)

- Never blocks or fails a render.
- Server APIs (`renderMedia`, `renderStill`, `renderMediaOnLambda/StillOnLambda`, `renderMediaOnVercel/StillOnVercel`) send an event after a successful render **only when `licenseKey` is set**. Sent: licence key, IP of the triggering machine, video vs still, production vs development.
- **Client-side rendering (`renderMediaOnWeb`, `renderStillOnWeb`) always sends an event per render, success or failure, even without a key** (not when aborted). It adds the page origin domain and success flag, and the **end user's IP address**. A privacy-policy line about operational telemetry to a technical provider is recommended. JAL rule: always set `licenseKey: 'free-license'` to declare free eligibility (this also silences the console warning). On a public page in-browser export is used only when the feature is needed, with an inline notice next to the export button before any export starts and a privacy-policy line added automatically (operational telemetry to Remotion as a technical provider); internal tools and dev pages use it freely (Brian, 2026-10-01; `skills/jal-remotion/SKILL.md` section 6). Allow `https://www.remotion.pro` in the page's `connect-src` so the ping does not fail.
- Remotion 5.0: Automators must set `licenseKey` and opt in; Creators are not required but get a Studio warning without a key. Free eligible: pass `"free-license"`. Config file and rendering APIs both take the key.

## Privacy and data protection (summary)

Remotion's Privacy Policy (v5.0, effective with the 5.0 release) covers the website, licensing platform and licensing telemetry under GDPR. The DPA and DPIA statements explain that licensing telemetry needs no separate Article 28 DPA and is not high risk; they concern the remotion.pro licensing platform, not remotion.dev infrastructure, and are transparency statements, not contracts. Remotion has no SOC2/ISO27001; no content or video data goes to Remotion; you run it on your own infrastructure.

## Support and community

No guaranteed support. Public help only: GitHub issues (remotion.dev/issue), Discord `#help`, `#help-forum`. Include `bunx remotion versions`, full error + stack, the code or command, what you expected. Search 1100+ issues and the docs first; no DMs or email except the exceptions (private data after approval, Enterprise private channel, evaluation calls). Company License holders get a Discord badge for prioritisation (not a guarantee); consulting only through Enterprise or paid Remotion Experts. Do not file when the cause is basic React/JS skill, low-effort, or no reproduction.

## Other pages in this slice

- Acknowledgements: third-party software credits: FFmpeg GPLv2+ (bundled in the renderer, so do not redistribute a packaged app or image containing it without checking GPL duties), Chromium BSD-3, Mediabunny MPL-2.0, Webpack MIT, Rspack MIT, Zod MIT.
- Investors: company funding summary (CHF 241,000 raised by March 2025 from angels); no API.
- "Is Remotion building Lovable for motion graphics?": no, Remotion stays video tech and encourages others to license it and build consumer tools.
- Design systems: Remotion is suitable for a motion design system (compositions in folders, parameterised, exported by server or client rendering); Remotion's own system lives at remotion.dev/brand.
- Buying a video editor: Editor Starter (zoomable timeline, interactive canvas, S3 upload, Google Fonts, Whisper captions, Lambda render) and a Timeline component are sold by Remotion; other vendors exist.
- Resources page: community catalogue (templates, component libraries such as Remocn, RemotionUI, Remotion Bits, Onda, snapcn; tutorials; products). Third-party components have their own licences: check each before use in JAL, and the 3-person limit still applies.

## Combining with the JAL kit

- Add a licence check line to the JAL project README for any repo that includes `remotion` (team size, who owns the codebase).
- Brian is tech lead: licence purchase, telemetry opt-in and any change of the free-licence declaration need his yes.

From:
- https://www.remotion.dev/docs/legal
- https://www.remotion.dev/docs/terms
- https://www.remotion.dev/docs/privacy
- https://www.remotion.dev/docs/dpa
- https://www.remotion.dev/docs/dpia
- https://www.remotion.dev/docs/telemetry
- https://www.remotion.dev/docs/support
- https://www.remotion.dev/docs/get-help
- https://www.remotion.dev/docs/ask-in-public
- https://www.remotion.dev/docs/acknowledgements
- https://www.remotion.dev/docs/investors
- https://www.remotion.dev/docs/lovable-for-motion-graphics
- https://www.remotion.dev/docs/design-systems
- https://www.remotion.dev/docs/buy-a-video-editor
- https://www.remotion.dev/docs/resources
- https://www.remotion.dev/docs/standalone
- https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
