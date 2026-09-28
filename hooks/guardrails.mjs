// Pure evaluator: decides whether a write violates JAL constitution.
const FRONTEND_RE = /(^|\/)(apps\/web|packages\/ui|docs-site)\/.*\.(tsx?|jsx?|css|html|md)$/;
// Any *-gradient( function call (linear-, radial-, conic-, repeating-*).
const GRADIENT_RE = /(?:linear|radial|conic|repeating-linear|repeating-radial|repeating-conic)-gradient\s*\(/i;
// Emoji (Unicode Extended_Pictographic). Excludes plain digits, #, *, and text symbols
// like copyright/registered/trademark, which are technically Extended_Pictographic
// but are ordinary punctuation in prose, not emoji.
const TEXT_SYMBOL_EXCEPTIONS = /[©®™]/g;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
function hasEmoji(content) {
  return EMOJI_RE.test(content.replace(TEXT_SYMBOL_EXCEPTIONS, ""));
}
// Neutral/gray color tokens and literals allowed for hairline borders.
const NEUTRAL_TOKEN_RE = /var\(\s*--(?:border|neutral|gray|grey|surface|bg|background|foreground|text|muted)[a-z0-9-]*\s*\)/i;
function isNeutralColor(token) {
  if (!token) return true;
  const t = token.trim();
  if (/^(none|transparent|currentcolor|inherit|initial|unset)$/i.test(t)) return true;
  if (NEUTRAL_TOKEN_RE.test(t)) return true;
  // gray/black/white hex: #fff, #000, #333, #ccc, #e5e5e5 (r==g==b) or named neutrals
  const hex = t.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      return h[0].toLowerCase() === h[1].toLowerCase() && h[1].toLowerCase() === h[2].toLowerCase();
    }
    const r = h.slice(0, 2).toLowerCase();
    const g = h.slice(2, 4).toLowerCase();
    const b = h.slice(4, 6).toLowerCase();
    return r === g && g === b;
  }
  if (/^(white|black|gray|grey|silver|whitesmoke|lightgray|lightgrey|darkgray|darkgrey|dimgray|dimgrey)$/i.test(t)) return true;
  return false;
}
// Splits a CSS value into tokens, keeping func(...) groups (rgba(), var(), etc.) intact.
const VALUE_TOKEN_RE = /(?:[^\s(]+\([^)]*\))|[^\s]+/g;
function tokenizeValue(value) {
  return (value.match(VALUE_TOKEN_RE) || []).map((t) => t.replace(/[;,]$/, ""));
}
const LENGTH_RE = /^-?\d*\.?\d+(px|em|rem|pt|vh|vw|%)?$/i;
function parseLength(tok) {
  if (!tok || !LENGTH_RE.test(tok)) return NaN;
  return parseFloat(tok);
}
const STYLE_KEYWORD_RE = /^(solid|dashed|dotted|double|groove|ridge|outset|inset)$/i;

// Finds a box-shadow violation: blur > 0, or an inset horizontal stripe (nonzero x, zero y).
function findBoxShadowViolation(content) {
  const re = /box-shadow\s*:\s*([^;{}]+)[;}]?/gi;
  let m;
  while ((m = re.exec(content))) {
    const raw = m[1].trim();
    if (/^none$/i.test(raw)) continue;
    for (const layer of raw.split(",")) {
      const tokens = tokenizeValue(layer);
      if (!tokens.length) continue;
      let inset = false;
      const rest = [];
      for (const t of tokens) {
        if (/^inset$/i.test(t)) inset = true;
        else rest.push(t);
      }
      const lengths = rest.filter((t) => !isNaN(parseLength(t)));
      const x = lengths[0] !== undefined ? parseLength(lengths[0]) : 0;
      const y = lengths[1] !== undefined ? parseLength(lengths[1]) : 0;
      const blur = lengths[2] !== undefined ? parseLength(lengths[2]) : 0;
      if (blur > 0) {
        return "JAL frontend law: no soft box-shadow blur on cards or panels (box-shadow blur radius above 0). Use a flat surface, hairline border, or a spread-only ring (0 0 0 Npx). See jal-frontend-rules.";
      }
      if (inset && x !== 0 && y === 0) {
        return "JAL frontend law: no inset box-shadow stripe (this draws a side line inside a card or panel). See jal-frontend-rules.";
      }
    }
  }
  return null;
}

const SIDE_PROP_RE = /\b(border-left|border-right|border-inline-start|border-inline-end)(-width|-color)?\s*:\s*([^;{}]+)[;}]?/gi;
// Finds a side-stripe border violation on border-left/right/inline-start/inline-end.
function findSideStripeViolation(content) {
  let m;
  SIDE_PROP_RE.lastIndex = 0;
  while ((m = SIDE_PROP_RE.exec(content))) {
    const prop = m[1];
    const suffix = m[2];
    const rawValue = m[3].trim();

    if (suffix === "-width") {
      const width = parseLength(rawValue);
      if (!isNaN(width) && width >= 2) {
        return `JAL frontend law: no side line on cards or panels (${prop}${suffix} at ${rawValue}). Use a full hairline border or a tonal surface. See jal-frontend-rules.`;
      }
      continue;
    }
    if (suffix === "-color") {
      if (!isNeutralColor(rawValue)) {
        return `JAL frontend law: no side line on cards or panels (${prop}${suffix} uses an accent/status color). Use a full hairline border or a tonal surface. See jal-frontend-rules.`;
      }
      continue;
    }

    // Shorthand: border-left / border-right / border-inline-start / border-inline-end.
    const tokens = tokenizeValue(rawValue);
    if (tokens.length === 1 && (/^none$/i.test(tokens[0]) || parseLength(tokens[0]) === 0)) {
      continue; // explicitly cleared, not a stripe
    }
    const widthTok = tokens.find((t) => !isNaN(parseLength(t)));
    const width = widthTok !== undefined ? parseLength(widthTok) : undefined;
    if (width === 0) continue; // zero-width border, not a stripe
    const styleTok = tokens.find((t) => STYLE_KEYWORD_RE.test(t));
    const colorTok = tokens.find((t) => t !== widthTok && t !== styleTok);

    if (width !== undefined && width >= 2) {
      return `JAL frontend law: no side line on cards or panels (${prop} at ${widthTok}). Use a full hairline border or a tonal surface. See jal-frontend-rules.`;
    }
    if (colorTok && !isNeutralColor(colorTok)) {
      return `JAL frontend law: no side line on cards or panels (${prop} uses an accent/status color ${colorTok}). Use a full hairline border or a tonal surface. See jal-frontend-rules.`;
    }
    // One-sided border without a full `border:` shorthand in the same rule is the stripe pattern.
    const blockStart = content.lastIndexOf("{", m.index) + 1;
    const blockEndIdx = content.indexOf("}", m.index);
    const block = content.slice(blockStart, blockEndIdx === -1 ? undefined : blockEndIdx);
    if (!/\bborder\s*:/i.test(block)) {
      return `JAL frontend law: no one-sided ${prop} without a full border (this is the side-stripe pattern). Use a full hairline border or a tonal surface. See jal-frontend-rules.`;
    }
  }
  return null;
}

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
  if (FRONTEND_RE.test(file_path)) {
    // Gradients
    if (GRADIENT_RE.test(content)) {
      return { block: true, reason: "JAL frontend law: no gradients. Flat neutral surfaces only. See jal-frontend-rules." };
    }
    // Soft shadows / inset stripes
    const shadowReason = findBoxShadowViolation(content);
    if (shadowReason) {
      return { block: true, reason: shadowReason };
    }
    // Side stripes on cards/panels
    const stripeReason = findSideStripeViolation(content);
    if (stripeReason) {
      return { block: true, reason: stripeReason };
    }
    // Emoji
    if (hasEmoji(content)) {
      return { block: true, reason: "JAL frontend law: no emoji in frontend content. See jal-frontend-rules." };
    }
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
