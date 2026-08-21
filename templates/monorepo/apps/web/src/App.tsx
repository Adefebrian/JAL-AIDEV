import { useState } from "react";
import { Bento, BentoItem } from "@__APP_NAME__/ui";
import { api } from "./client";

export function App() {
  // Demo call through the typed Hono RPC client (see ./client.ts): the
  // response shape here is checked against apps/api's real route types at
  // build time, not hand-typed. Wired to a button click rather than fired on
  // mount, on purpose: this component renders in tests (App.test.tsx) and in
  // a fresh dev checkout with no API server running yet, and a real fetch
  // attempted on every render would fail noisily in both cases for no
  // benefit, since nothing in this demo depends on the result being present.
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  async function loadItemCount() {
    setLoadFailed(false);
    try {
      const res = await api.example.$get();
      const items = await res.json();
      setItemCount(items.length);
    } catch {
      // API not reachable, expected outside a full dev/deploy setup.
      setLoadFailed(true);
    }
  }

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
          <button type="button" onClick={loadItemCount}>
            Load example items via RPC
          </button>
          {itemCount !== null && <p>Example items: {itemCount}</p>}
          {loadFailed && <p>Could not reach the API.</p>}
        </BentoItem>
      </Bento>
    </main>
  );
}
