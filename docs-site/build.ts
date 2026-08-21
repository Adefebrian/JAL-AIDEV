// docs-site/build.ts - builds the static docs site with Bun.build(). No
// Vite, no webpack, no Next.js: Bun is both the package manager and the
// bundler, per the JAL constitution.
//
// All paths are resolved against import.meta.dir (this file's own
// directory) rather than left relative, because a relative path resolves
// against process.cwd(), not this file's location. This build can run
// either as `bun run build.ts` from docs-site/, or reentrant from
// content.test.ts (via an on-demand build fallback) while `bun test` is
// running from a different cwd, and it must produce the same dist/ either
// way. See apps/web/build.ts in templates/monorepo for the same fix
// applied to the reference app this site follows.
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { renderPage } from "./src/render";

const here = import.meta.dir;
const outdir = join(here, "dist");

if (import.meta.main) {
  await runBuild();
} else {
  // Reentrant call (see content.test.ts): running the real build in a
  // fresh bun subprocess sidesteps any bundler state a parent `bun test`
  // process might already hold, the same defensive pattern the reference
  // apps/web/build.ts uses.
  const proc = Bun.spawn({
    cmd: [process.execPath, import.meta.path],
    cwd: here,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) process.exit(exitCode);
}

async function runBuild() {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  // Bundle the one piece of client JS: progressive-enhancement only
  // (copy buttons, mobile drawer, active tab tracking), no framework.
  const res = await Bun.build({
    entrypoints: [join(here, "src/app.ts")],
    outdir,
    naming: "app.js",
    target: "browser",
    minify: true,
    sourcemap: "linked",
  });

  if (!res.success) {
    for (const message of res.logs) console.error(message);
    process.exit(1);
  }

  // Render the page from src/content.ts and splice it into the shell in
  // src/index.html. This keeps exactly one source of truth for copy: the
  // same renderPage() output that content.test.ts asserts against is what
  // ships to dist/index.html.
  const shell = await Bun.file(join(here, "src/index.html")).text();
  const body = renderPage();
  if (!shell.includes("<!--APP_CONTENT-->")) {
    console.error("src/index.html is missing the <!--APP_CONTENT--> marker");
    process.exit(1);
  }
  const html = shell.replace("<!--APP_CONTENT-->", body);
  await Bun.write(join(outdir, "index.html"), html);

  // Static CSS, copied as-is, no CSS bundler step needed for one file.
  await Bun.write(join(outdir, "styles.css"), await Bun.file(join(here, "src/styles.css")).text());

  console.log("docs-site build ok");
}
