// apps/web/src/scripts.test.ts
//
// build.ts bundles React's production build unless NODE_ENV is
// "development". The dev script must ask for the development build (React's
// warnings and readable errors while working); the build script must not, so
// CI and the Docker build stage always ship the production build.
import { expect, test } from "bun:test";
import { join } from "node:path";

const pkg = (await Bun.file(join(import.meta.dir, "..", "package.json")).json()) as { scripts: Record<string, string> };
const buildTs = await Bun.file(join(import.meta.dir, "..", "build.ts")).text();

test("dev builds React's development build, build stays production", () => {
  expect(pkg.scripts.dev).toBe("NODE_ENV=development bun run build.ts && bun serve.ts");
  expect(pkg.scripts.build).not.toContain("NODE_ENV");
  expect(buildTs).toContain('process.env.NODE_ENV === "development" ? "development" : "production"');
});
