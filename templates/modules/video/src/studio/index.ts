// Remotion Studio entry (optional). Studio is Remotion's own editor with
// its own webpack bundler; it runs only inside this video workspace
// (packages/video), never in apps/web, whose build stays Bun.build.
//
//   cd packages/video
//   bun add -d --exact @remotion/cli@4.0.532      once, when Studio is wanted
//   bunx remotionb studio                          reads remotion.config.ts
//
// Studio previews and edits props (the zod schemas drive its controls).
// Its Render button and `remotionb render` use Chrome Headless Shell: that
// is a server-style render path and needs Brian's yes first. The default
// MP4 path is the in-browser export (src/export).
import { continueRender, delayRender, registerRoot, staticFile } from "remotion";
import { RemotionRoot } from "../compositions/Root";

// Studio has no JAL stylesheet, so load the vendored Geist faces here.
// remotion.config.ts points the public dir at packages/ui/src/fonts.
const FACES = [
  { family: "Geist", file: "Geist-Variable.woff2" },
  { family: "Geist Mono", file: "GeistMono-Variable.woff2" },
];

if (typeof document !== "undefined" && typeof FontFace !== "undefined") {
  const handle = delayRender("Loading Geist");
  Promise.all(
    FACES.map(async ({ family, file }) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight: "100 900" });
      document.fonts.add(await face.load());
    }),
  )
    .catch((err) => console.warn("Geist did not load; Studio falls back to system-ui", err))
    .finally(() => continueRender(handle));
}

registerRoot(RemotionRoot);
