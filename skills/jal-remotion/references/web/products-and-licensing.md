# Remotion products, pricing and license (web slice)

What the Remotion marketing pages say about the Player, automation, the design package and pricing, and what that means for JAL. This is not legal advice; the License text on remotion.dev decides.

From: https://www.remotion.dev/ai-embed , https://www.remotion.dev/automate , https://www.remotion.dev/design/ , https://www.remotion.dev/player/

## 1. The Player page (`/player/`)

The product page for `@remotion/player`: "Dynamic embedded videos in React." Pitch points: videos written in React that change at runtime; reactive to data (connect to an API or a form and update a prop); extremely customizable (inspired by the native `<video>` tag, start with `controls` or build your own UI); turn it into real videos by connecting server-side rendering (Node.js or AWS Lambda; audio and several codecs supported); build video apps. A demo has a name field and a color picker that change the video live. The reference application named is GitHub Unwrapped (powered by the Player, open source). The page's place in the product map: Remotion (make videos) to Player (embeddable interactive videos) to Lambda (render at scale). Technical detail is in `player.md`.

## 2. The Automate page (`/automate`)

Positions Remotion as a way to "automate video production": simple workflows up to entire video editors, scaled rendering, doing business.

- **Parameterization**: organize assets, connect data, motion design systems (a design system of reusable compositions).
- **Batch rendering**: render many videos on your own infrastructure; server-side rendering and client-side rendering (`client-side-rendering.md`).
- **Applications**: publish a simple tool (the Player) or a complex editor (the Editor Starter, `editor-starter.md`).
- A live demo: reorder cards by drag and drop, switch to dark mode and the video adapts, then export the video.
- "Built with Remotion" examples: Banger.Show (3D visual creation), Submagic (short-form editing), Remotion Recorder, GitHub Unwrapped. The Showcase page lists more.

### 2.1 Pricing and license block (as listed on the page, snapshot 2026-10-01)

| Plan | Who | Price and scope |
|---|---|---|
| Free License | Individuals and companies of **up to 3 people** | Free. Create and automate, all features, unlimited commercial use, terms apply. **Must upgrade when the organization grows.** No sign-up needed |
| Company License | Collaborations and companies of **4 or more people** | Pay by usage; commercial use; prioritized support; $250 Mux credits for new Mux customers |
| Remotion for **Automators** | Build video creation tools | **$0.01 per render, $100 per month minimum.** For batch rendering and automated video products, "such as video editors, prompt-to-video apps, and **embedding the Remotion Player**." Developers working on automation projects do not need a seat. The calculator example is 10,000 renders for $100 |
| Remotion for **Creators** | Create videos for your organization | **$25 per month per seat.** For low-volume manual video creation and building motion design systems locally (including with AI agents and Remotion Studio). One seat per user |
| Enterprise License | Advanced needs | From $500 per month; everything in Company, private Slack or Discord, monthly consulting, custom terms and billing, compliance forms, prioritized feature requests, Editor Starter included. Eligible when spend reaches about $100 per month |

Also: the page offers a 20 minute evaluation call for license questions. "Over 300 customers" are named.

### 2.2 JAL reading of the license

1. JAL is **3 people** (2 developers and 1 AI specialist) and every project is internal (Brian, 2026-10-01). At that size the **free license covers everything, including embedding the Remotion Player on a website and rendering client-side or server-side**.
2. The pricing page lists "embedding the Remotion Player" under the Automators plan, which applies to licensed companies (4 or more people, or collaborations). Record this in the project's decision log so a future team growth triggers a review.
3. **Warn and stop at 4 or more people, or an external client.** If a project's contributor list, an agency joint effort or the intake shows 4 or more people touching the Remotion code, or an external client appears ("collaborations" are named as requiring the Company License, and a client who receives the source counts), stop and tell Brian before continuing.
4. A site that lets visitors render videos from JAL compositions is an automation, which the free license allows at JAL's size. It renders in the browser by default, passes `licenseKey: 'free-license'`, and follows the public-page privacy rule (one privacy-policy line and no UI text). A service that renders user-supplied Remotion code is never built. If the team grows past 3, it becomes the Automators case (`web-renderer.md` section 9).
5. Mediabunny is MPL 2.0 and independent (`mediabunny.md`). `@remotion/media-utils` is MIT. Everything else Remotion ships is under the Remotion License. Keep `THIRD_PARTY_NOTICES.md` current with the exact packages used.
6. The deprecated `@remotion/webcodecs` and `@remotion/media-parser` carry a "company" warning and a possible future seat (`webcodecs.md`); not used.
7. The Editor Starter ($600) and Timeline are paid add-ons on top of the license, not replacements (`editor-starter.md`, `timeline.md`).

## 3. The Design page (`/design/`)

Documents `@remotion/design`, Remotion's own React UI kit (shown with a link to its source). It is the component set used on remotion.dev and the Studio: `<Button />` (label, disabled, primary, loading, rounded, full width, circular, link and external link variants, small), `<Counter />`, `<Switch />`, `<Slider />`, `<Card />`, `<Select />`, `<Tabs />`, `<Input />`, `<Textarea />`, `<InlineCode />`, `<Link />`, and example form sets (change email, manage team members).

JAL rule: do **not** use `@remotion/design` for website chrome. JAL has one design system (JAL Core, with the kit) and one set of laws (white-first, no shadows, no gradients, tokens); a second UI kit would break consistency and `ui_audit`. It is acceptable only inside a Remotion Studio or internal tool where JAL tokens are not required, and only with the stack confirmation noted in `website-integration.md`.

## 4. The AI embed page (`/ai-embed`)

At the fetch time the page returned only its title ("Remotion | Make videos programmatically") with no readable content; it appears to be an embeddable widget or a redirect target rather than documentation. Recorded as fetched, no content to integrate. **[verify]** by opening it in a browser if an AI-embed feature is of interest. For AI-assisted authoring of compositions, see the Remotion agent skills the Editor Starter setup mentions (`npx remotion skills add`, with `/remotion-saas`, `/remotion-docs` and `/remotion-best-practices`); that sits in the core slice, not here.

## 5. Decided (Brian, 2026-10-01)

- Studio and its webpack bundler: only inside a separate video workspace, never in a website package.
- Editor Starter ($600) and Timeline: excluded unless Brian asks.
- A visitor-facing render feature: allowed in the browser under the privacy rule; never a service for user-supplied Remotion code.
- 4 or more people, or an external client: the plugin warns and stops for Brian.
- Headless Chrome for any render (local CLI, a Coolify service, Lambda, Cloud Run, Vercel): Brian's confirmation per project.
