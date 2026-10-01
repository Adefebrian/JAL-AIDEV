// The Remotion package rules in one place. hooks/guardrails.mjs (the write
// guard) and scripts/video/check.ts (the project check) both import this
// module, so the two can never disagree about which package goes where.
//
// The rule: a video workspace (packages/video or packages/video-<name>,
// relative to the project root) may install any Remotion package except the
// deprecated ones. Every other manifest (apps/web, packages/ui, the root) may
// only name the browser-safe packages in WEBSITE_ALLOWED, and its scripts may
// not run a headless or cloud render.

/** Deprecated: never installed anywhere. Mediabunny, pinned to Remotion's paired version, replaces them. */
export const REMOTION_DEPRECATED = ["@remotion/media-parser", "@remotion/webcodecs"];

/**
 * The only Remotion packages allowed outside a video workspace. Each exists on
 * npm at 4.0.532 and depends only on remotion, mediabunny, or plain browser
 * libraries (checked 2026-10-01). Left out on purpose:
 * - @remotion/google-fonts: video renders only (it fetches from Google at run time).
 * - @remotion/skia: needs @shopify/react-native-skia and its CanvasKit wasm,
 *   not proven to bundle with Bun.build; a video workspace only until it is.
 * - everything that pulls the bundler, the renderer, Studio, or a cloud path
 *   (@remotion/cli, studio, studio-server, bundler, browser-bundler, renderer,
 *   lambda, lambda-client, cloudrun, vercel, serverless, serverless-client).
 */
export const REMOTION_WEBSITE_ALLOWED = [
  "remotion",
  "@remotion/player",
  "@remotion/web-renderer",
  "@remotion/media",
  "@remotion/transitions",
  "@remotion/zod-types",
  "@remotion/paths",
  "@remotion/shapes",
  "@remotion/noise",
  "@remotion/media-utils",
  "@remotion/licensing",
  "@remotion/layout-utils",
  "@remotion/animation-utils",
  "@remotion/three",
  "@remotion/lottie",
  "@remotion/gif",
  "@remotion/captions",
  "@remotion/motion-blur",
  "@remotion/rounded-text-box",
  "@remotion/fonts",
];

/** Server and cloud render paths: allowed in a video workspace, each needs Brian's confirmation there. */
export const REMOTION_SERVER_RENDER = [
  "@remotion/renderer",
  "@remotion/lambda",
  "@remotion/lambda-client",
  "@remotion/cloudrun",
  "@remotion/vercel",
  "@remotion/serverless",
  "@remotion/serverless-client",
];

/** A video workspace manifest, as a path relative to the project root. */
export const VIDEO_WORKSPACE_MANIFEST_RE = /^packages\/video(-[a-z0-9-]+)?\/package\.json$/i;

/** A script that renders headless or in the cloud, by command or by package. */
export const RENDER_SCRIPT_RE = /\bremotionb?\s+(render|still|lambda|cloudrun|benchmark)\b|@remotion\/(cli|renderer|lambda|cloudrun)\b/i;

/** Any "remotion" or "@remotion/<name>" string in a manifest. */
export const REMOTION_NAME_RE = /"(remotion|@remotion\/[a-z0-9._-]+)"/gi;

export const isRemotionPackage = (name) => name === "remotion" || name.startsWith("@remotion/");

const normalise = (p) => String(p ?? "").replace(/\\/g, "/");
const isAbsolute = (p) => p.startsWith("/") || /^[a-z]:\//i.test(p);

/**
 * The path relative to the project root. An absolute path is taken relative
 * to projectDir when it sits inside it; otherwise from its last packages/
 * segment. Backslashes become slashes, so Windows paths work too.
 */
export function projectRelative(filePath, projectDir) {
  let p = normalise(filePath);
  if (!isAbsolute(p)) return p.replace(/^(\.\/)+/, "");
  const dir = normalise(projectDir).replace(/\/+$/, "");
  if (dir) {
    const windows = /^[a-z]:\//i.test(p);
    const a = windows ? p.toLowerCase() : p;
    const b = windows ? dir.toLowerCase() : dir;
    if (a.startsWith(`${b}/`)) return p.slice(dir.length + 1);
  }
  const at = p.lastIndexOf("/packages/");
  return at === -1 ? p : p.slice(at + 1);
}

export function isVideoWorkspaceManifest(filePath, projectDir) {
  return VIDEO_WORKSPACE_MANIFEST_RE.test(projectRelative(filePath, projectDir));
}

/** Why a package may not appear in this manifest, or null when it may. */
export function remotionPackageReason(name, inVideoWorkspace) {
  if (REMOTION_DEPRECATED.includes(name)) {
    return `"${name}" is deprecated and never installed. Use Mediabunny pinned to Remotion's paired version (see jal-remotion references/web/mediabunny.md).`;
  }
  if (inVideoWorkspace || !isRemotionPackage(name) || REMOTION_WEBSITE_ALLOWED.includes(name)) return null;
  return `"${name}" is not one of the browser-safe Remotion packages a website may use, so it belongs only in a video workspace (packages/video or packages/video-<name>). Websites stay on Bun.build with the Remotion Player in a lazy chunk; headless and cloud render paths need Brian's confirmation. See skill jal-remotion.`;
}

/** Why a package.json script may not run outside a video workspace, or null. */
export function renderScriptReason(script) {
  const m = String(script ?? "").match(RENDER_SCRIPT_RE);
  if (!m) return null;
  return `the script "${String(script).trim()}" runs a headless or cloud Remotion render (${m[0]}), which only a video workspace (packages/video) may do, and only with Brian's confirmation. Websites export MP4 in the browser. See skill jal-remotion.`;
}
