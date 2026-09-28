import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyClaims } from "./docs-verify";

let repo: string;

beforeAll(async () => {
  repo = await mkdtemp(join(tmpdir(), "jal-docs-verify-"));
  await mkdir(join(repo, "src", "routes"), { recursive: true });
  await writeFile(join(repo, "src", "routes", "leave.ts"), 'app.post("/api/leave", createLeave);\nexport const MAX_DAYS = 12;\n');
  await writeFile(join(repo, ".env.example"), "DATABASE_URL=\nREDIS_URL=\n");
});

afterAll(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe("verifyClaims", () => {
  test("verifies a claim whose cited file contains the snippet, whitespace-insensitive", () => {
    const r = verifyClaims(repo, [
      { id: "c1", text: "Creating a leave request is POST /api/leave.", evidence: [{ path: "src/routes/leave.ts", contains: 'app.post( "/api/leave"'.replace("( ", "(") }] },
      { id: "c2", text: "The allowance is 12 days.", evidence: [{ path: "src/routes/leave.ts", contains: "MAX_DAYS   =   12" }] },
    ]);
    expect(r.status).toBe("PASS");
    expect(r.verified).toBe(2);
  });

  test("fails claims with no evidence, a missing file, or a missing snippet", () => {
    const r = verifyClaims(repo, [
      { id: "none", text: "It scales to a million users.", evidence: [] },
      { id: "missing", text: "Auth lives in auth.ts.", evidence: [{ path: "src/auth.ts" }] },
      { id: "snippet", text: "The allowance is 20 days.", evidence: [{ path: "src/routes/leave.ts", contains: "MAX_DAYS = 20" }] },
    ]);
    expect(r.status).toBe("FAIL");
    const byId = Object.fromEntries(r.claims.map((c) => [c.id, c.status]));
    expect(byId).toEqual({ none: "NO_EVIDENCE", missing: "MISSING_EVIDENCE", snippet: "MISSING_EVIDENCE" });
  });

  test("refuses evidence paths that escape the repo", () => {
    const r = verifyClaims(repo, [{ id: "escape", text: "x", evidence: [{ path: "../../etc/passwd" }] }]);
    expect(r.claims[0].problems[0]).toContain("escapes the repo");
  });

  test("flags secret-shaped values in claims and drafts", () => {
    const r = verifyClaims(
      repo,
      [{ id: "env", text: "Set DATABASE_URL in Coolify.", evidence: [{ path: ".env.example", contains: "DATABASE_URL" }] }],
      { "public/leave-memory.md": "Token: sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789" },
    );
    expect(r.status).toBe("FAIL");
    expect(r.secrets.map((s) => s.location)).toEqual(["public/leave-memory.md"]);
  });
});
