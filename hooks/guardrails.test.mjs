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
test("blocks node dependency", () => {
  const r = evaluate({ file_path: "apps/api/package.json", content: '{"dependencies":{"ts-node":"^10"}}' });
  expect(r.block).toBe(true);
});
test("blocks nodemon script", () => {
  const r = evaluate({ file_path: "package.json", content: '{"scripts":{"dev":"nodemon src/x.ts"}}' });
  expect(r.block).toBe(true);
});
test("blocks non-jalgroup deploy target", () => {
  const r = evaluate({ file_path: "infra/coolify.yml", content: "server: deploy.evilhost.com" });
  expect(r.block).toBe(true);
});
test("allows correct deploy target", () => {
  const r = evaluate({ file_path: "infra/coolify.yml", content: "server: deploy.jalgroup.id" });
  expect(r.block).toBe(false);
});
test("blocks cross-module deep import", () => {
  const r = evaluate({ file_path: "apps/api/src/modules/billing/service.ts", content: 'import { x } from "../users/repo";' });
  expect(r.block).toBe(true);
});
test("allows cross-module import via public index", () => {
  const r = evaluate({ file_path: "apps/api/src/modules/billing/service.ts", content: 'import { x } from "../users";' });
  expect(r.block).toBe(false);
});
