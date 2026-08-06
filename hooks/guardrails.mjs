// Pure evaluator: decides whether a write violates JAL constitution.
const FRONTEND_RE = /(^|\/)(apps\/web|packages\/ui)\/.*\.(tsx?|jsx?|css|html|md)$/;
const BANNED_DEPS = ["vite", "next", "@vitejs", "webpack", "create-react-app"];

export function evaluate({ file_path = "", content = "" }) {
  if (!file_path) return { block: false };
  // Banned heavy deps in any package.json
  if (file_path.endsWith("package.json")) {
    for (const dep of BANNED_DEPS) {
      const re = new RegExp(`"${dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`);
      if (re.test(content)) {
        return { block: true, reason: `JAL constitution: "${dep}" is banned. Bun-only runtime, no Vite/Next/heavy bundlers. See jal-standards.` };
      }
    }
  }
  // Emdash in frontend content
  if (FRONTEND_RE.test(file_path) && content.includes("—")) {
    return { block: true, reason: "JAL frontend law: no emdash in frontend content. Use a comma, colon, or rephrase. See jal-frontend-rules." };
  }
  return { block: false };
}

// CLI entry: only run stdin handling when invoked directly, not on import.
if (import.meta.main) {
  const raw = await Bun.stdin.text().catch(() => "");
  let payload = {};
  try { payload = JSON.parse(raw || "{}"); } catch { process.exit(0); }
  const ti = payload.tool_input || {};
  const content = ti.content ?? ti.new_string ?? "";
  const res = evaluate({ file_path: ti.file_path || "", content });
  if (res.block) {
    console.log(JSON.stringify({ decision: "block", reason: res.reason }));
    process.exit(2);
  }
  process.exit(0);
}
