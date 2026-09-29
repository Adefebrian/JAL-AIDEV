// Kit preview server: builds, then serves the compare board at / and one
// direction at /landing?d=D1. Port from argv or PORT, default 4190.
//   bun packages/ui/src/kit/preview/serve.ts [port]
import { join } from "node:path";
import { buildPreview } from "./build";

const here = import.meta.dir;
const src = join(here, "..", "..");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4190);

await buildPreview();

const css: Record<string, string> = {
  "/css/tokens.css": join(src, "tokens.css"),
  "/css/ui.css": join(src, "ui.css"),
  "/css/kit.css": join(src, "kit.css"),
  "/css/preview.css": join(here, "preview.css"),
};

const server = Bun.serve({
  port,
  hostname: "127.0.0.1",
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === "/") return new Response(Bun.file(join(here, "compare.html")));
    if (pathname === "/landing") return new Response(Bun.file(join(here, "index.html")));
    if (css[pathname]) return new Response(Bun.file(css[pathname]));
    if (pathname.startsWith("/dist/") && !pathname.includes("..")) return new Response(Bun.file(join(here, pathname)));
    return new Response("not found", { status: 404 });
  },
});

console.log(`kit preview on http://127.0.0.1:${server.port}/`);
