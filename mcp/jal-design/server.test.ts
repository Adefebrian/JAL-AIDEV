import { describe, test, expect, afterAll, beforeAll } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Keep test decisions out of the working tree (inherited by the spawned server).
process.env.JAL_DECISION_LOG ??= join(tmpdir(), `jal-test-decisions-${process.pid}.jsonl`);

const SERVER_PATH = join(import.meta.dir, "server.ts");

class StdioClient {
  proc: ReturnType<typeof Bun.spawn>;
  private buffer = "";
  private pending: Array<{ resolve: (v: any) => void; predicate?: (m: any) => boolean }> = [];
  private queue: any[] = [];
  private reading: Promise<void>;

  constructor(env: Record<string, string | undefined> = {}) {
    this.proc = Bun.spawn(["bun", SERVER_PATH], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ...env },
    });
    this.reading = this.readLoop();
  }

  private async readLoop(): Promise<void> {
    const reader = this.proc.stdout.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      this.buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        if (!line) continue;
        let msg: any;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        this.dispatch(msg);
      }
    }
  }

  private dispatch(msg: any): void {
    const waiterIdx = this.pending.findIndex((p) => !p.predicate || p.predicate(msg));
    if (waiterIdx >= 0) {
      const [waiter] = this.pending.splice(waiterIdx, 1);
      waiter.resolve(msg);
    } else {
      this.queue.push(msg);
    }
  }

  send(msg: unknown): void {
    this.proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  async waitFor(predicate?: (m: any) => boolean, timeoutMs = 5000): Promise<any> {
    const bufIdx = this.queue.findIndex((m) => !predicate || predicate(m));
    if (bufIdx >= 0) {
      const [msg] = this.queue.splice(bufIdx, 1);
      return msg;
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout waiting for message")), timeoutMs);
      this.pending.push({
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        predicate,
      });
    });
  }

  async request(method: string, params?: any, id: number | string = Date.now() + Math.random()): Promise<any> {
    this.send({ jsonrpc: "2.0", id, method, params });
    return this.waitFor((m) => m.id === id);
  }

  close(): void {
    try {
      this.proc.stdin.end();
    } catch {}
    this.proc.kill();
  }
}

describe("jal-design MCP server (stdio)", () => {
  let client: StdioClient;

  beforeAll(() => {
    client = new StdioClient({ JEV_API_KEY: "" });
  });

  afterAll(() => {
    client.close();
  });

  test("initialize echoes client protocolVersion and serverInfo", async () => {
    const res = await client.request("initialize", { protocolVersion: "2024-11-05", capabilities: {} });
    expect(res.error).toBeUndefined();
    expect(res.result.protocolVersion).toBe("2024-11-05");
    expect(res.result.serverInfo.name).toBe("jal-design");
    expect(res.result.capabilities).toEqual({ tools: {} });

    client.send({ jsonrpc: "2.0", method: "notifications/initialized" });
  });

  test("tools/list returns exactly the jal-design tools with schemas", async () => {
    const res = await client.request("tools/list", {});
    expect(res.error).toBeUndefined();
    const names = res.result.tools.map((t: any) => t.name).sort();
    expect(names).toEqual(["design_history", "docs_verify", "jev_decide", "noyzzi_get", "noyzzi_list", "ui_audit"]);
    for (const tool of res.result.tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
    const jevTool = res.result.tools.find((t: any) => t.name === "jev_decide");
    expect(jevTool.inputSchema.required).toEqual(["state", "questions"]);
    expect(jevTool.inputSchema.properties.decision_id).toBeDefined();
    expect(jevTool.inputSchema.properties.decision_id.type).toBe("string");
    expect(jevTool.inputSchema.properties.domain).toBeDefined();
    expect(jevTool.inputSchema.properties.domain.type).toBe("string");
    const auditTool = res.result.tools.find((t: any) => t.name === "ui_audit");
    expect(auditTool.inputSchema.required).toEqual(["url"]);
  });

  test("unknown method with id returns -32601", async () => {
    const res = await client.request("totally/unknown", {});
    expect(res.result).toBeUndefined();
    expect(res.error.code).toBe(-32601);
  });

  test("ping responds", async () => {
    const res = await client.request("ping", {});
    expect(res.error).toBeUndefined();
    expect(res.result).toEqual({});
  });

  test("tools/call noyzzi_list filters by kind", async () => {
    const res = await client.request("tools/call", { name: "noyzzi_list", arguments: { kind: "element" } });
    const body = JSON.parse(res.result.content[0].text);
    expect(body.count).toBe(26);
  });

  test("tools/call noyzzi_get on an effect returns MANUAL with its URL, no browser", async () => {
    const res = await client.request("tools/call", { name: "noyzzi_get", arguments: { kind: "effect", slug: "liquid-pool" } });
    const body = JSON.parse(res.result.content[0].text);
    expect(body.status).toBe("MANUAL");
    expect(body.url).toBe("https://noyzzi.com/effects/liquid-pool/");
    expect(body.text).toContain("UNTRUSTED");
  });

  test("tools/call noyzzi_get rejects unknown or malformed slugs", async () => {
    const bad = await client.request("tools/call", { name: "noyzzi_get", arguments: { kind: "section", slug: "../etc" } });
    expect(bad.result.isError).toBe(true);
    const unknown = await client.request("tools/call", { name: "noyzzi_get", arguments: { kind: "section", slug: "no-such-hero" } });
    expect(unknown.result.isError).toBe(true);
  });

  test("tools/call jev_decide with JEV_API_KEY unset returns UNVERIFIED (no network)", async () => {
    const res = await client.request("tools/call", {
      name: "jev_decide",
      arguments: {
        state: { note: "test" },
        questions: { q1: { type: "noul", instructions: "ok?" } },
      },
    });
    expect(res.error).toBeUndefined();
    const text = res.result.content[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.verified).toBe(false);
    expect(parsed.stamp).toBe("UNVERIFIED BY JEV");
    expect(parsed.error).toContain("missing JEV_API_KEY");
  });
});
