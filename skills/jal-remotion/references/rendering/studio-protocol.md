# Studio Protocol: sending Elements and Element Libraries into a Studio

Written against `remotion` 4.0.532 (docs read 2026-10-01).

From:
- https://www.remotion.dev/docs/studio-protocol/
- https://www.remotion.dev/docs/studio-protocol/add-element-library-to-studio
- https://www.remotion.dev/docs/studio-protocol/build-open-in-remotion-new-url
- https://www.remotion.dev/docs/studio-protocol/component-library-integration
- https://www.remotion.dev/docs/studio-protocol/create-element-payload
- https://www.remotion.dev/docs/studio-protocol/install-in-studio
- https://www.remotion.dev/docs/studio-protocol/is-inside-studio
- https://www.remotion.dev/docs/studio-protocol/security
- https://www.remotion.dev/docs/studio-protocol/set-studio-drag-data
- https://www.remotion.dev/docs/studio-protocol/static-file-ref

## What it is

`@remotion/studio-protocol` (since 4.0.502) lets a website hand a component, called an Element, to a running Remotion Studio, or ask the Studio to add a whole Element Library to its Browse Elements panel. An Element is the source code of exactly one exported named component plus the data the Studio needs to insert it. The Studio writes it to an `.element.tsx` file and installs only the declared packages.

## When a JAL agent uses it

Rarely. Use it only if JAL publishes its own library of Remotion components (a JAL motion kit) that designers can drag into a Studio from a web page. Never build it for a normal product video. Everything here runs in the browser of the library page; nothing renders.

Install: `bun add --exact @remotion/studio-protocol@<version>`.

## Delivery methods

| Method | Good | Costs |
| --- | --- | --- |
| Drag and drop with `setStudioDragData()` | User picks the exact Studio tab, timeline position, canvas position | Studio labels the source unverified (a drag has no reliable provenance) |
| Install dialog with `installInStudio()` | Shows the requesting website, tries to bring the Studio to the front (macOS) | Uses the most recently focused Studio tab, or the sole writable tab |

Offer both when possible.

## API reference

| API | Since | Purpose |
| --- | --- | --- |
| `createElementPayload(opts)` | 4.0.502 | Build a validated, versioned payload for the other three calls |
| `setStudioDragData({dataTransfer, payload})` | 4.0.502 | Write payload and preview metadata onto a `dragstart` `DataTransfer` (`effectAllowed = copy`); also writes a `text/plain` fallback; does not call `setDragImage()` |
| `installInStudio({payload})` | 4.0.502 | Send the payload to the containing Studio, or discover a writable Studio on localhost ports 3000 to 3009 |
| `addElementLibraryToStudio({url, displayName?})` | 4.0.518 | Ask the Studio to add a library URL to its config |
| `buildOpenInRemotionNewUrl({payload})` | 4.0.527 | URL for remotion.dev/new with the payload in the fragment; throws `TypeError` if invalid or too large |
| `isInsideStudio()` | 4.0.518 | True inside the Studio's library modal (URL has `remotion-studio=true` or the page is in an iframe); use to hide a "Drag into Studio" handle |
| `staticFileRef(path)` | 4.0.528 | Reference a declared asset inside `initialProps` |

### `createElementPayload()` fields

| Field | Rule |
| --- | --- |
| `displayName` | Non-empty string under 120 characters, shown in the confirmation dialog |
| `slug` | Lowercase id; final path segment becomes the `.element.tsx` file name; traversal and unsafe characters rejected |
| `sourceCode` | Complete source, exactly one exported named component |
| `dependencies` | Array of `{name, version}`; `@remotion/*` packages use `version: null`; others need an exact semver (no ranges or tags); never list `react`, `react-dom`, `remotion` |
| `assets?` (4.0.528) | Files for `public/`: `path` (forward slashes, relative), then either `type: 'url'` with an HTTP(S) `url` without credentials (CORS required) or `type: 'base64'` with `data`. Up to 100 assets and 50 MB total; whole payload under 250,000 JSON characters. Different bytes at an existing path fail the install |
| `dimensions` | `{width, height}` positive finite numbers, or `null` |
| `durationInFrames` | Positive integer, shown while dragging |
| `initialProps?` (4.0.524) | JSON-compatible props written on the component invocation; use `staticFileRef()` for assets; with `component-owned-sequence` omit `from`, `durationInFrames`, `name`, and `style` must be an object |
| `installationMode?` | `'wrapped'` (Studio generates a `<Sequence>` using `dimensions`) or `'component-owned-sequence'` (the component owns its sequence) |

Assets make the payload version 2; payloads without assets stay version 1, and a version-1-only Studio asks the user to upgrade.

### Return shapes

- `installInStudio()` resolves a union. On success: `success: true`, `status: "awaiting-confirmation"` (nothing is installed yet), `target` with `projectName`, `studioOrigin`, `studioVersion` (and a deprecated `compositionId`). On failure a `code`: `unsupported-origin`, `no-compatible-studio`, `loopback-network-permission-denied` (4.0.521), `studio-upgrade-required`, `no-installable-target`, `unsupported-protocol`, `invalid-response`, `target-expired`, `request-rejected`, `request-timed-out`, `network-error`, plus a `message` for humans. Use `code` in logic. Since 4.0.530 a writable Studio can receive an install without a selected composition (the dialog defaults to New composition).
- `addElementLibraryToStudio()` has the same shape; failure codes add `invalid-url`, `invalid-display-name`, `no-configurable-target`, `no-config-file` (the project must have a loaded `remotion.config.ts`). After confirmation the Studio writes an object-form `Config.addElementLibrary()` call; the same normalized URL is never added twice.

## Building an Element Library page

1. Show each component in a `<Player>` with the same dimensions and duration as the payload.
2. Import the component normally for the preview (the site bundler compiles it); also keep its source as a string for `createElementPayload()`.
3. Take image, audio and video as URL props. For assets that must be copied into the user project, declare them in `assets`, put `staticFileRef('my-element/logo.png')` in `initialProps`, and pass the hosted URL as the Player `inputProps` for the preview only. The Studio writes `<MyElement logoSrc={staticFile('my-element/logo.png')} />`.
4. Works with Vite and Next.js sites; scope asset paths to the component name to avoid collisions.
5. For request-time SSR check `remotion-studio=true` in the request URL to avoid flashing UI inside the Studio; for pre-rendered pages use an inline script right after `<body>`.

## Security

An Element is executable React source with npm dependencies.

- Any HTTPS origin may request an install or library add; HTTP is allowed only on `localhost` and `127.0.0.1`. CORS reflects only the requesting allowed origin, no wildcard, no credentials.
- Both install paths need confirmation in the Studio. The dialog shows the source, destination, source code, packages to install, and whether an existing Element file would be replaced. Drag data is labeled unverified. Installed code runs with the project's file and network access; package lifecycle scripts are disabled during install.
- A library request shows the origin, exact URL and display name; the library is not loaded before confirmation; confirming only changes `remotion.config.ts`, not source or dependencies.
- Discovery exposes only the project name, composition id when applicable, Studio version, focus time and a short-lived single-use opaque token bound to origin, tab and operation. Changing the selected composition invalidates an install token.

JAL rule: an agent must never confirm an install or library add on a person's behalf, and never add a third-party Element Library URL to a JAL project's `remotion.config.ts` without Brian's okay. A library is remote code.

## Related

- studio.md (Browse Elements), config.md (`addElementLibrary`).
