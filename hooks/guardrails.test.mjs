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

// --- docs-site coverage ---
test("blocks emdash in docs-site frontend file", () => {
  const r = evaluate({ file_path: "docs-site/src/Page.tsx", content: "return <p>Fast \u2014 clean</p>" });
  expect(r.block).toBe(true);
});
test("allows clean docs-site write", () => {
  const r = evaluate({ file_path: "docs-site/src/Page.tsx", content: "return <p>Fast, clean</p>" });
  expect(r.block).toBe(false);
});

// --- gradients ---
test("blocks linear-gradient in frontend css", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { background: linear-gradient(to right, #fff, #eee); }" });
  expect(r.block).toBe(true);
});
test("blocks radial-gradient case-insensitively", () => {
  const r = evaluate({ file_path: "apps/web/src/styles.css", content: ".hero { background: RADIAL-GRADIENT(circle, #fff, #000); }" });
  expect(r.block).toBe(true);
});
test("blocks conic-gradient and repeating-linear-gradient", () => {
  const r1 = evaluate({ file_path: "apps/web/src/styles.css", content: ".a { background: conic-gradient(#fff, #000); }" });
  const r2 = evaluate({ file_path: "apps/web/src/styles.css", content: ".b { background: repeating-linear-gradient(45deg, #fff, #000 10px); }" });
  expect(r1.block).toBe(true);
  expect(r2.block).toBe(true);
});
test("allows the word gradient in a plain comment (not a function call)", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: "/* do not use a gradient background here */\n.card { background: var(--surface); }" });
  expect(r.block).toBe(false);
});
test("allows gradient function call in non-frontend file", () => {
  const r = evaluate({ file_path: "docs/notes.md", content: "background: linear-gradient(#fff, #000);" });
  expect(r.block).toBe(false);
});

// --- box-shadow blur ---
test("blocks box-shadow with nonzero blur", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { box-shadow: 0 2px 8px rgba(0,0,0,0.2); }" });
  expect(r.block).toBe(true);
});
test("blocks inset horizontal stripe shadow", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { box-shadow: inset 4px 0 0 var(--accent); }" });
  expect(r.block).toBe(true);
});
test("allows box-shadow: none", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { box-shadow: none; }" });
  expect(r.block).toBe(false);
});
test("allows spread-only focus ring with zero blur", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".input:focus { box-shadow: 0 0 0 2px var(--focus-ring); }" });
  expect(r.block).toBe(false);
});

// --- side stripes ---
test("blocks 2px border-left accent stripe", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { border-left: 2px solid var(--accent); }" });
  expect(r.block).toBe(true);
});
test("blocks border-left-color referencing status token even at 1px", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { border-left: 1px solid var(--status-error); }" });
  expect(r.block).toBe(true);
});
test("blocks one-sided border-right without a full border rule", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".panel { border-right: 1px solid #333; }" });
  expect(r.block).toBe(true);
});
test("allows full hairline border", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { border: 1px solid var(--border); }" });
  expect(r.block).toBe(false);
});
test("allows border-bottom hairline divider", () => {
  const r = evaluate({ file_path: "packages/ui/src/Card.css", content: ".row { border-bottom: 1px solid var(--border); }" });
  expect(r.block).toBe(false);
});
test("allows border-left: none / 0 explicitly cleared", () => {
  const r1 = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { border-left: none; }" });
  const r2 = evaluate({ file_path: "packages/ui/src/Card.css", content: ".card { border-left: 0; }" });
  expect(r1.block).toBe(false);
  expect(r2.block).toBe(false);
});

// --- emoji ---
test("blocks emoji in frontend content", () => {
  const r = evaluate({ file_path: "apps/web/src/Home.tsx", content: "return <span>Done ✅</span>" });
  expect(r.block).toBe(true);
});
test("blocks emoji rocket in docs-site content", () => {
  const r = evaluate({ file_path: "docs-site/src/Page.tsx", content: "return <span>Ship it \u{1F680}</span>" });
  expect(r.block).toBe(true);
});
test("allows digits, hash, asterisk, and copyright sign in frontend content", () => {
  const r = evaluate({ file_path: "apps/web/src/Home.tsx", content: "return <span>#1 * 2026 © 100%</span>" });
  expect(r.block).toBe(false);
});
test("allows emoji in non-frontend content", () => {
  const r = evaluate({ file_path: "docs/notes.md", content: "Ship it \u{1F680}" });
  expect(r.block).toBe(false);
});

test("blocks remotion and @remotion/* dependencies", () => {
  expect(evaluate({ file_path: "apps/web/package.json", content: '{"dependencies":{"remotion":"4.0.0"}}' }).block).toBe(true);
  expect(evaluate({ file_path: "apps/web/package.json", content: '{"dependencies":{"@remotion/player":"4.0.0"}}' }).block).toBe(true);
});

test("allows three, R3F, drei, gsap, lenis, tailwind dependencies", () => {
  const pkg = '{"dependencies":{"three":"0.180.0","@react-three/fiber":"9.1.0","@react-three/drei":"10.0.0","gsap":"3.13.0","lenis":"1.3.0","tailwindcss":"4.1.0","bun-plugin-tailwind":"0.1.0"}}';
  expect(evaluate({ file_path: "apps/web/package.json", content: pkg }).block).toBe(false);
});

test("noyzzi-derived files may use gradients, glow shadows, and stripes as designed", () => {
  const css = ".hero { background: linear-gradient(90deg, #7c3aed, #22d3ee); box-shadow: 0 0 24px #7c3aed; border-left: 4px solid #22d3ee; }";
  expect(evaluate({ file_path: "apps/web/src/sections/noyzzi/Moodboard.css", content: css }).block).toBe(false);
  expect(evaluate({ file_path: "apps/web/src/sections/noyzzi-moodboard.tsx", content: css }).block).toBe(false);
  expect(evaluate({ file_path: "apps/web/src/sections/Hero.css", content: css }).block).toBe(true);
});

test("noyzzi-derived files still ban emoji and em-dash", () => {
  expect(evaluate({ file_path: "apps/web/src/noyzzi/Hero.tsx", content: "<p>Launch \u{1F680}</p>" }).block).toBe(true);
  expect(evaluate({ file_path: "apps/web/src/noyzzi/Hero.tsx", content: "<p>Fast — and calm</p>" }).block).toBe(true);
});
