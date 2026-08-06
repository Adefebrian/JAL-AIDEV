// apps/web/build.ts - bundle the React SPA with Bun.build(). No Vite,
// no webpack, no Next.js: Bun is both the package manager and the bundler.
import { rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });

const res = await Bun.build({
  entrypoints: ["src/index.tsx"],
  outdir: "dist",
  target: "browser",
  minify: true,
  sourcemap: "linked",
});

if (!res.success) {
  for (const message of res.logs) console.error(message);
  process.exit(1);
}

await Bun.write("dist/index.html", await Bun.file("src/index.html").text());

console.log("web build ok");
