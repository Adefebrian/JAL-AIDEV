// Zero-dependency MCP server (stdio, newline-delimited JSON-RPC 2.0) for jal-design.
// Bun only. Write nothing but JSON-RPC to stdout; diagnostics go to stderr.

import { decide, type JevQuestion } from "./jev.ts";

const SERVER_NAME = "jal-design";
const SERVER_VERSION = "0.3.0";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: any;
};

type ToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const TOOLS: ToolDef[] = [
  {
    name: "jev_decide",
    description: "Ask JEV (TypeSafe) to decide on choice/score/noul questions for a given state.",
    inputSchema: {
      type: "object",
      properties: {
        state: { description: "Arbitrary state/context passed to JEV." },
        questions: {
          type: "object",
          description: "Map of question key to JevQuestion (choice/score/noul).",
        },
      },
      required: ["state", "questions"],
    },
  },
  {
    name: "ui_audit",
    description: "Run the mechanical UI audit against a URL at one or more widths.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to audit." },
        widths: {
          type: "array",
          items: { type: "number" },
          description: "Viewport widths to test, default 320/375/414/768/1280.",
        },
      },
      required: ["url"],
    },
  },
];

function log(...args: unknown[]): void {
  console.error(...args);
}

function writeMessage(msg: unknown): void {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function respond(id: JsonRpcId, result: unknown): void {
  writeMessage({ jsonrpc: "2.0", id, result });
}

function respondError(id: JsonRpcId, code: number, message: string): void {
  writeMessage({ jsonrpc: "2.0", id, error: { code, message } });
}

async function loadRunAudit(): Promise<
  | ((url: string, opts?: { widths?: number[]; chromePath?: string; timeoutMs?: number }) => Promise<any>)
  | null
> {
  try {
    const mod = await import("./audit.ts");
    if (typeof (mod as any).runAudit === "function") {
      return (mod as any).runAudit;
    }
    return null;
  } catch (err) {
    log("[jal-design] ui_audit unavailable: audit.ts not found or failed to load:", err);
    return null;
  }
}

async function handleJevDecide(args: any) {
  if (!args || typeof args !== "object" || !("state" in args) || typeof args.questions !== "object" || args.questions === null) {
    throw new Error("jev_decide requires { state, questions }");
  }
  const questions = args.questions as Record<string, JevQuestion>;
  const result = await decide({ state: args.state, questions });
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

async function handleUiAudit(args: any) {
  if (!args || typeof args !== "object" || typeof args.url !== "string") {
    throw new Error("ui_audit requires { url }");
  }
  const runAudit = await loadRunAudit();
  if (!runAudit) {
    const report = {
      status: "SKIPPED",
      reason: "audit.ts not available",
      widths: args.widths ?? [],
      violations: [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      isError: false,
    };
  }
  const report = await runAudit(args.url, { widths: args.widths });
  return {
    content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
    isError: report.status === "FAIL",
  };
}

async function handleToolsCall(id: JsonRpcId, params: any): Promise<void> {
  const name = params?.name;
  const args = params?.arguments ?? {};
  try {
    if (name === "jev_decide") {
      respond(id, await handleJevDecide(args));
      return;
    }
    if (name === "ui_audit") {
      respond(id, await handleUiAudit(args));
      return;
    }
    respondError(id, -32602, `Unknown tool: ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    respond(id, { content: [{ type: "text", text: message }], isError: true });
  }
}

async function handleRequest(msg: JsonRpcRequest): Promise<void> {
  const { id, method, params } = msg;
  const hasId = id !== undefined;

  switch (method) {
    case "initialize": {
      const protocolVersion = params?.protocolVersion ?? "2024-11-05";
      respond(id ?? null, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
      return;
    }
    case "notifications/initialized": {
      // No response for notifications.
      return;
    }
    case "ping": {
      respond(id ?? null, {});
      return;
    }
    case "tools/list": {
      respond(id ?? null, { tools: TOOLS });
      return;
    }
    case "tools/call": {
      await handleToolsCall(id ?? null, params);
      return;
    }
    default: {
      if (hasId) {
        respondError(id ?? null, -32601, `Method not found: ${method}`);
      }
      return;
    }
  }
}

function startStdioServer(): void {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk: string) => {
    buffer += chunk;
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      let msg: JsonRpcRequest;
      try {
        msg = JSON.parse(line);
      } catch (err) {
        log("[jal-design] failed to parse JSON-RPC line:", err);
        continue;
      }
      handleRequest(msg).catch((err) => {
        log("[jal-design] unhandled error:", err);
      });
    }
  });
  process.stdin.on("end", () => {
    process.exit(0);
  });
  log(`[jal-design] MCP server ready (stdio) v${SERVER_VERSION}`);
}

function readAllStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function runCli(argv: string[]): Promise<void> {
  const [sub, ...rest] = argv;

  if (sub === "decide") {
    const src = rest[0];
    if (!src) {
      console.error("usage: server.ts decide <file.json|->");
      process.exit(1);
    }
    const raw = src === "-" ? await readAllStdin() : await Bun.file(src).text();
    const parsed = JSON.parse(raw);
    const result = await decide({ state: parsed.state, questions: parsed.questions });
    console.log(JSON.stringify(result, null, 2));
    if (!result.verified) process.exitCode = 0; // UNVERIFIED is still a valid answer, not a CLI failure.
    return;
  }

  if (sub === "audit") {
    const url = rest[0];
    if (!url) {
      console.error("usage: server.ts audit <url> [--widths 320,375]");
      process.exit(1);
    }
    let widths: number[] | undefined;
    const widthsIdx = rest.indexOf("--widths");
    if (widthsIdx >= 0 && rest[widthsIdx + 1]) {
      widths = rest[widthsIdx + 1]
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n));
    }
    const runAudit = await loadRunAudit();
    if (!runAudit) {
      console.error("[jal-design] audit.ts not available");
      process.exit(1);
    }
    const report = await runAudit(url, { widths });
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.status === "FAIL" ? 1 : 0);
    return;
  }

  console.error(`Unknown subcommand: ${sub}`);
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length > 0 && (argv[0] === "decide" || argv[0] === "audit")) {
  runCli(argv).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
} else {
  startStdioServer();
}
