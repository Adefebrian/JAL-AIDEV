// Kit preview build: bundles entry.tsx with Bun.build into preview/dist.
//   bun packages/ui/src/kit/preview/build.ts
// React and react-dom resolve from the workspace web app so the bundle holds
// exactly one React (packages/ui carries react for types only).
import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { BunPlugin } from "bun";

const here = import.meta.dir;
const web = join(here, "..", "..", "..", "..", "..", "apps", "web");

const oneReact: BunPlugin = {
  name: "kit-preview-react",
  setup(build) {
    build.onResolve({ filter: /^@kit-preview\/react-dom-client$/ }, () => ({ path: Bun.resolveSync("react-dom/client", web) }));
    build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) => ({ path: Bun.resolveSync(args.path, web) }));
  },
};

export async function buildPreview(): Promise<void> {
  const outdir = join(here, "dist");
  await rm(outdir, { recursive: true, force: true });
  const res = await Bun.build({
    entrypoints: [join(here, "entry.tsx")],
    outdir,
    target: "browser",
    minify: true,
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [oneReact],
  });
  if (!res.success) {
    for (const log of res.logs) console.error(log);
    throw new Error("kit preview build failed");
  }
}

if (import.meta.main) {
  await buildPreview();
  console.log("kit preview built:", join(here, "dist"));
}
