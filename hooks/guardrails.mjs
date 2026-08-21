// Pure evaluator: decides whether a write violates JAL constitution.
const FRONTEND_RE = /(^|\/)(apps\/web|packages\/ui)\/.*\.(tsx?|jsx?|css|html|md)$/;
const BANNED_DEPS = ["vite", "next", "@vitejs", "webpack", "create-react-app", "node", "deno", "ts-node", "tsx", "nodemon"];
// Runtime commands banned from package.json scripts (Bun is the only JS/TS runtime).
const BANNED_RUNTIME_CMDS = ["ts-node", "tsx", "nodemon", "deno"];
// Deploy/coolify config files must only ever target the JAL deploy host.
const DEPLOY_FILE_RE = /(coolify|deploy)[^/]*\.(ya?ml|json|toml|md)$/i;
const JAL_DEPLOY_HOST = "deploy.jalgroup.id";
const HOST_TOKEN_RE = /[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+/i;
// Modular monolith: apps/<app>/src/modules/<name>/... may not be deep-imported by siblings.
const MODULE_FILE_RE = /apps\/[^/]+\/src\/modules\/([^/]+)\//;
const IMPORT_SPEC_RE = /(?:import|export)[^"'`]*["']([^"'`]+)["']|require\(\s*["']([^"'`]+)["']\s*\)/g;

export function evaluate({ file_path = "", content = "" }) {
  if (!file_path) return { block: false };
  // Banned heavy deps / runtimes in any package.json
  if (file_path.endsWith("package.json")) {
    for (const dep of BANNED_DEPS) {
      const re = new RegExp(`"${dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`);
      if (re.test(content)) {
        return { block: true, reason: `JAL constitution: "${dep}" is banned. Bun-only runtime, no Vite/Next/heavy bundlers. See jal-standards.` };
      }
    }
    // Banned runtime commands anywhere in scripts (not just as a declared dependency).
    for (const cmd of BANNED_RUNTIME_CMDS) {
      if (new RegExp(`(["'\\s])${cmd}\\b`).test(content)) {
        return { block: true, reason: `JAL runtime law: "${cmd}" is banned. Bun is the only JS/TS runtime. See jal-standards.` };
      }
    }
  }
  // Emdash in frontend content
  if (FRONTEND_RE.test(file_path) && content.includes("—")) {
    return { block: true, reason: "JAL frontend law: no emdash in frontend content. Use a comma, colon, or rephrase. See jal-frontend-rules." };
  }
  // Deploy target lock: any deploy/coolify config naming a non-jalgroup host
  if (DEPLOY_FILE_RE.test(file_path)) {
    const lower = content.toLowerCase();
    const hasHostTokens = HOST_TOKEN_RE.test(content);
    if (lower.includes("deploy.") && !lower.includes(JAL_DEPLOY_HOST) && hasHostTokens) {
      return { block: true, reason: `JAL deploy law: the only permitted deploy target is ${JAL_DEPLOY_HOST}. See jal-standards.` };
    }
  }
  // Cross-module deep import lock in modular monolith apps
  const modMatch = file_path.match(MODULE_FILE_RE);
  if (modMatch) {
    const self = modMatch[1];
    IMPORT_SPEC_RE.lastIndex = 0;
    let im;
    while ((im = IMPORT_SPEC_RE.exec(content))) {
      const spec = im[1] || im[2];
      const rel = spec.match(/^\.\.\/([^/]+)(\/.*)?$/);
      const deep = spec.match(/modules\/([^/]+)\/(.+)$/);
      const other = rel ? rel[1] : deep ? deep[1] : null;
      const rest = rel ? rel[2] : deep ? `/${deep[2]}` : null;
      if (other && other !== self && rest && !/^\/index(\.[jt]sx?)?$/.test(rest)) {
        return { block: true, reason: `JAL architecture: module "${self}" may not deep-import sibling module "${other}" (only its public index). Attempted "${spec}". See jal-architecture.` };
      }
    }
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
