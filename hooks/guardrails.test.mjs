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

test("allows remotion and the website-side @remotion/* packages in an app", () => {
  const pkg = '{"dependencies":{"remotion":"4.0.532","@remotion/player":"4.0.532","@remotion/web-renderer":"4.0.532","@remotion/media":"4.0.532","mediabunny":"1.0.0"}}';
  expect(evaluate({ file_path: "apps/web/package.json", content: pkg }).block).toBe(false);
});

test("blocks the deprecated @remotion/media-parser and @remotion/webcodecs everywhere", () => {
  expect(evaluate({ file_path: "apps/web/package.json", content: '{"dependencies":{"@remotion/media-parser":"4.0.532"}}' }).block).toBe(true);
  expect(evaluate({ file_path: "packages/video/package.json", content: '{"dependencies":{"@remotion/webcodecs":"4.0.532"}}' }).block).toBe(true);
});

test("keeps Studio, the bundler, and the headless renderers inside a video workspace", () => {
  for (const dep of ["@remotion/cli", "@remotion/bundler", "@remotion/renderer", "@remotion/lambda"]) {
    const pkg = `{"devDependencies":{"${dep}":"4.0.532"}}`;
    expect(evaluate({ file_path: "apps/web/package.json", content: pkg, project_dir: "" }).block).toBe(true);
    expect(evaluate({ file_path: "packages/video/package.json", content: pkg, project_dir: "" }).block).toBe(false);
  }
  expect(evaluate({ file_path: "packages/video-studio/package.json", content: '{"devDependencies":{"@remotion/cli":"4.0.532"}}', project_dir: "" }).block).toBe(false);
});

const WEBSITE_OK = ["remotion", "@remotion/player", "@remotion/web-renderer", "@remotion/media", "@remotion/transitions", "@remotion/zod-types", "@remotion/paths", "@remotion/shapes", "@remotion/noise", "@remotion/media-utils", "@remotion/licensing", "@remotion/layout-utils", "@remotion/animation-utils", "@remotion/three", "@remotion/lottie", "@remotion/gif", "@remotion/captions", "@remotion/motion-blur", "@remotion/rounded-text-box", "@remotion/fonts"];
const VIDEO_ONLY = ["@remotion/cli", "@remotion/studio", "@remotion/studio-server", "@remotion/bundler", "@remotion/browser-bundler", "@remotion/renderer", "@remotion/lambda", "@remotion/lambda-client", "@remotion/cloudrun", "@remotion/vercel", "@remotion/serverless", "@remotion/serverless-client", "@remotion/google-fonts", "@remotion/skia", "@remotion/some-future-package"];
const manifest = (dep) => `{"dependencies":{"${dep}":"4.0.532"}}`;

test("a website may name only the browser-safe Remotion packages (an allowlist)", () => {
  for (const dep of WEBSITE_OK) {
    expect([dep, evaluate({ file_path: "apps/web/package.json", content: manifest(dep), project_dir: "" }).block]).toEqual([dep, false]);
  }
  for (const dep of VIDEO_ONLY) {
    const r = evaluate({ file_path: "apps/web/package.json", content: manifest(dep), project_dir: "" });
    expect([dep, r.block]).toEqual([dep, true]);
    expect(r.reason).toContain("video workspace");
    expect(evaluate({ file_path: "packages/ui/package.json", content: manifest(dep), project_dir: "" }).block).toBe(true);
    expect(evaluate({ file_path: "packages/video/package.json", content: manifest(dep), project_dir: "" }).block).toBe(false);
  }
});

test("an Edit fragment naming a video-only package is blocked outside a video workspace", () => {
  expect(evaluate({ file_path: "apps/web/package.json", content: '    "@remotion/serverless": "4.0.532",', project_dir: "" }).block).toBe(true);
  expect(evaluate({ file_path: "packages/video/package.json", content: '    "@remotion/serverless": "4.0.532",', project_dir: "" }).block).toBe(false);
});

test("the deprecated packages stay blocked inside a video workspace too", () => {
  for (const file of ["packages/video/package.json", "packages/video-promo/package.json", "apps/web/package.json"]) {
    for (const dep of ["@remotion/media-parser", "@remotion/webcodecs"]) {
      expect(evaluate({ file_path: file, content: manifest(dep), project_dir: "" }).block).toBe(true);
    }
  }
});

test("only packages/video or packages/video-<name> at the project root is a video workspace", () => {
  const cli = manifest("@remotion/cli");
  const yes = ["packages/video/package.json", "packages/video-studio/package.json", "./packages/video/package.json", "packages\\video\\package.json"];
  const no = ["apps/video/package.json", "apps/web-video/package.json", "video/package.json", "video-site/package.json", "packages/videos/package.json", "packages/my-video/package.json", "packages/video/src/package.json", "apps/web/packages/video/package.json"];
  for (const f of yes) expect([f, evaluate({ file_path: f, content: cli, project_dir: "" }).block]).toEqual([f, false]);
  for (const f of no) expect([f, evaluate({ file_path: f, content: cli, project_dir: "" }).block]).toEqual([f, true]);
});

test("absolute paths resolve against CLAUDE_PROJECT_DIR, then the last packages/ segment", () => {
  const cli = manifest("@remotion/cli");
  // A project folder named video-* is not a video workspace.
  expect(evaluate({ file_path: "/Users/brian/video-site/package.json", content: cli, project_dir: "/Users/brian/video-site" }).block).toBe(true);
  expect(evaluate({ file_path: "/Users/brian/video-site/apps/web/package.json", content: cli, project_dir: "/Users/brian/video-site" }).block).toBe(true);
  expect(evaluate({ file_path: "/Users/brian/video-site/apps/video/package.json", content: cli, project_dir: "/Users/brian/video-site" }).block).toBe(true);
  expect(evaluate({ file_path: "/Users/brian/video-site/packages/video/package.json", content: cli, project_dir: "/Users/brian/video-site/" }).block).toBe(false);
  // Without a project dir (or outside it): the last packages/ segment.
  expect(evaluate({ file_path: "/Users/brian/site/packages/video-promo/package.json", content: cli, project_dir: "" }).block).toBe(false);
  expect(evaluate({ file_path: "/Users/brian/video/package.json", content: cli, project_dir: "" }).block).toBe(true);
  expect(evaluate({ file_path: "/srv/other/packages/video/package.json", content: cli, project_dir: "/Users/brian/site" }).block).toBe(false);
  // Windows paths, backslashes and drive letters.
  expect(evaluate({ file_path: "C:\\work\\site\\packages\\video\\package.json", content: cli, project_dir: "C:\\work\\site" }).block).toBe(false);
  expect(evaluate({ file_path: "c:\\work\\site\\apps\\web\\package.json", content: cli, project_dir: "C:\\Work\\Site" }).block).toBe(true);
  expect(evaluate({ file_path: "C:\\work\\video-site\\package.json", content: cli, project_dir: "" }).block).toBe(true);
});

test("render scripts are blocked outside a video workspace", () => {
  const scripts = (cmd) => JSON.stringify({ scripts: { make: cmd } });
  const bad = ["remotion render src/index.ts Intro out.mp4", "bunx remotionb render Intro", "remotionb still Intro", "remotion lambda render", "remotion cloudrun render", "remotion benchmark", "bunx @remotion/cli studio", "bun x @remotion/renderer", "bunx @remotion/lambda sites create", "bunx @remotion/cloudrun services deploy"];
  for (const cmd of bad) {
    const r = evaluate({ file_path: "apps/web/package.json", content: scripts(cmd), project_dir: "" });
    expect([cmd, r.block]).toEqual([cmd, true]);
    expect(r.reason).toContain("render");
    expect(evaluate({ file_path: "packages/video/package.json", content: scripts(cmd), project_dir: "" }).block).toBe(false);
  }
  // An Edit fragment of the scripts block.
  expect(evaluate({ file_path: "package.json", content: '"render": "remotion render Intro"', project_dir: "" }).block).toBe(true);
  // Previewing and a non-render description are fine.
  expect(evaluate({ file_path: "apps/web/package.json", content: JSON.stringify({ description: "we never remotion render here", scripts: { dev: "bun serve.ts" } }), project_dir: "" }).block).toBe(false);
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

test("the hook reads CLAUDE_PROJECT_DIR for an absolute file_path", () => {
  const run = (file_path, dir) => Bun.spawnSync(["bun", `${import.meta.dir}/guardrails.mjs`], {
    stdin: new TextEncoder().encode(JSON.stringify({ tool_input: { file_path, content: '{"devDependencies":{"@remotion/cli":"4.0.532"}}' } })),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  }).exitCode;
  expect(run("/work/video-site/packages/video/package.json", "/work/video-site")).toBe(0);
  expect(run("/work/video-site/apps/web/package.json", "/work/video-site")).toBe(2);
});
