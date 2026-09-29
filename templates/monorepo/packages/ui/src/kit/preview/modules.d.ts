// The preview borrows react-dom from the workspace web app (packages/ui has
// no react-dom dependency). build.ts resolves this alias at bundle time.
declare module "@kit-preview/react-dom-client" {
  import type { ReactNode } from "react";
  export function createRoot(container: Element): { render(node: ReactNode): void; unmount(): void };
}
