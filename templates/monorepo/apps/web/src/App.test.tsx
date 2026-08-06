import { describe, expect, test } from "bun:test";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const EMDASH = "—";

describe("<App />", () => {
  test("renders the welcome heading", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<App />);
    // Let React flush the initial commit.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const heading = container.querySelector("h1");
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toContain("Welcome to __APP_NAME__");

    root.unmount();
    container.remove();
  });

  test("never renders an em dash", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.textContent ?? "").not.toContain(EMDASH);

    root.unmount();
    container.remove();
  });
});
