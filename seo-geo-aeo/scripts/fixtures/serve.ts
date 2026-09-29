// Serves a fixture site from memory with Bun.serve on port 0 (127.0.0.1).
// The builder receives the origin once the port is known, so absolute URLs
// in the fixture (canonical, og:url, sitemap) point at the live test server.

export type FixtureResponse = { status?: number; headers?: Record<string, string>; body: string | Uint8Array };
export type FixtureSite = { routes: Record<string, FixtureResponse>; notFound: FixtureResponse };

export type RunningFixture = { origin: string; host: string; stop: () => void; hits: string[] };

export function serveFixture(build: (origin: string) => FixtureSite): RunningFixture {
  let site: FixtureSite = { routes: {}, notFound: { status: 404, body: "not found" } };
  const hits: string[] = [];
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch(req) {
      const url = new URL(req.url);
      const path = decodeURIComponent(url.pathname);
      hits.push(`${req.method} ${path} ${req.headers.get("user-agent") ?? ""}`);
      const route = site.routes[path];
      if (route) return new Response(route.body, { status: route.status ?? 200, headers: route.headers });
      if (path.length > 1 && path.endsWith("/")) {
        return new Response(null, { status: 301, headers: { location: path.replace(/\/+$/, "") || "/" } });
      }
      return new Response(site.notFound.body, { status: site.notFound.status ?? 404, headers: site.notFound.headers });
    },
  });
  const origin = `http://127.0.0.1:${server.port}`;
  site = build(origin);
  return { origin, host: new URL(origin).host, stop: () => server.stop(true), hits };
}
