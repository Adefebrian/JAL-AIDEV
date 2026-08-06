import { Bento, BentoItem } from "@__APP_NAME__/ui";

export function App() {
  return (
    <main className="app">
      <h1>Welcome to __APP_NAME__</h1>
      <p>A Bun only monorepo: Hono API, React SPA bundled with Bun.build, no Vite, no Next.js.</p>
      <Bento className="app-bento">
        <BentoItem span="wide">
          <h2>Fast by default</h2>
          <p>Bun runs the app, builds the app, and tests the app, one runtime end to end.</p>
        </BentoItem>
        <BentoItem span="sm">
          <h2>Hardened API</h2>
          <p>Secure headers, CORS allowlist, and Redis backed rate limiting ship on day one.</p>
        </BentoItem>
        <BentoItem span="sm">
          <h2>Typed everywhere</h2>
          <p>TypeScript across apps and packages, validated env, zero plain JavaScript.</p>
        </BentoItem>
      </Bento>
    </main>
  );
}
