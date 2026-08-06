import { test, expect } from "bun:test";
import { evaluate } from "./guardrails.mjs";

test("blocks emdash in frontend file", () => {
  const r = evaluate({ file_path: "apps/web/src/Home.tsx", content: "return <h1>Fast — clean</h1>" });
  expect(r.block).toBe(true);
});
test("allows emdash in non-frontend file", () => {
  const r = evaluate({ file_path: "docs/notes.md", content: "spec — detail" });
  expect(r.block).toBe(false);
});
test("blocks vite dependency", () => {
  const r = evaluate({ file_path: "apps/web/package.json", content: '{"devDependencies":{"vite":"^5"}}' });
  expect(r.block).toBe(true);
});
test("blocks next dependency", () => {
  const r = evaluate({ file_path: "package.json", content: '{"dependencies":{"next":"15"}}' });
  expect(r.block).toBe(true);
});
test("allows clean frontend write", () => {
  const r = evaluate({ file_path: "apps/web/src/Home.tsx", content: "return <h1>Fast, clean</h1>" });
  expect(r.block).toBe(false);
});
