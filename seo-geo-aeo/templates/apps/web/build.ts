// apps/web/build.ts - bundle the React SPA with Bun.build(). No Vite,
// no webpack, no Next.js: Bun is both the package manager and the bundler.
//
// Installed by `/jal-seo-geo-aeo integrate` over the scaffold's build.ts. Three
// additions, everything else is the scaffold's:
//   1. a separate admin entrypoint (src/admin/index.tsx), so the public
//      bundle never carries the admin view (standard.md SEO-11), with its own
//      dist/admin.html shell;
//   2. apps/web/public/ copied into dist/ unhashed (favicons, og image);
//   3. the search-layer generator, which writes dist/seo.json (prerendered
//      bodies, JSON-LD, llms.txt, llms-full.txt, ai.txt, summary.json,
//      faq.json, feed.xml) for the server to read once at boot.
//
// All paths are resolved against import.meta.dir, never process.cwd(): this
// script is also imported on demand by src/smoke.test.ts and
// src/server.test.ts when dist/ is missing (see the scaffold notes kept below).
import { copyFile, cp, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dir;
const outdir = join(here, "dist");
const repoRoot = join(here, "..", "..");

if (import.meta.main) {
  await runBuild();
} else {
  // Imported as a module (the tests' on-demand build): run the real build in
  // a fresh `bun` subprocess, because a reentrant Bun.build() inside a running
  // `bun test` can fail to resolve cross-package JSX runtime imports.
  // Placeholders are allowed HERE only: inside `bun test` the gate is
  // content.test.ts, which must report the leaked placeholder by name instead
  // of the whole run dying on a build exit. `bun run build` stays fail-closed.
  const proc = Bun.spawn({
    cmd: [process.execPath, import.meta.path],
    cwd: here,
    env: { ...process.env, SEO_ALLOW_PLACEHOLDERS: process.env.SEO_ALLOW_PLACEHOLDERS ?? "1" },
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) process.exit(exitCode);
}

async function runBuild() {
  await rm(outdir, { recursive: true, force: true });

  const res = await Bun.build({
    // Public and admin entrypoints; output keeps their paths under src/, so
    // dist/index.js and dist/admin/index.js.
    entrypoints: [join(here, "src/index.tsx"), join(here, "src/admin/index.tsx")],
    root: join(here, "src"),
    outdir,
    target: "browser",
    minify: true,
    // React ships its production build only when NODE_ENV is production at
    // bundle time; a dev build doubles react-dom. `NODE_ENV=development` opts out.
    define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV === "development" ? "development" : "production") },
    sourcemap: "linked",
    splitting: true,
    publicPath: "/",
    // packages/ui/src/fonts/fonts.css points at /fonts/<file>.woff2: keep it
    // external (never inlined as base64) and copy the files below.
    external: ["/fonts/*"],
    loader: { ".glb": "file", ".gltf": "file", ".ktx2": "file", ".hdr": "file", ".wasm": "file", ".bin": "file" },
    plugins: await optionalPlugins(),
  });

  if (!res.success) {
    for (const message of res.logs) console.error(message);
    process.exit(1);
  }

  const shell = await Bun.file(join(here, "src/index.html")).text();
  await Bun.write(join(outdir, "index.html"), shell);
  await Bun.write(
    join(outdir, "admin.html"),
    shell.replace('href="/index.css"', 'href="/admin/index.css"').replace('src="/index.js"', 'src="/admin/index.js"'),
  );

  await copyFonts();

  const publicDir = join(here, "public");
  if (existsSync(publicDir)) await cp(publicDir, outdir, { recursive: true });

  const { writeSeoArtifacts } = await import("./src/seo/build-hook");
  await writeSeoArtifacts(outdir, repoRoot);

  console.log("web build ok");
}

// The vendored faces (packages/ui/src/fonts), woff2 only: fonts.css, the
// licence text, and anything else in that folder (a .DS_Store) stay out.
async function copyFonts() {
  const fontsDir = join(repoRoot, "packages", "ui", "src", "fonts");
  const out = join(outdir, "fonts");
  await mkdir(out, { recursive: true });
  for (const file of await readdir(fontsDir)) {
    if (file.endsWith(".woff2")) await copyFile(join(fontsDir, file), join(out, file));
  }
}

// Tailwind is opt-in: when bun-plugin-tailwind is installed, CSS that
// imports "tailwindcss" is compiled with the JAL @theme
// (packages/ui/src/tailwind.css). Nothing changes for apps without it.
async function optionalPlugins() {
  try {
    const specifier = "bun-plugin-tailwind";
    const mod = (await import(specifier)) as { default: import("bun").BunPlugin };
    return [mod.default];
  } catch {
    return [];
  }
}
