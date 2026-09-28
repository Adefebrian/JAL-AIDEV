import { describe, test, expect } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decide, redact } from "./jev.ts";

const SECRET = "topsecretkey123";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const baseReq = {
  state: { screenshot: "n/a" },
  questions: {
    q1: { type: "noul", instructions: "is this good?" } as const,
  },
};

describe("decide()", () => {
  test("success passthrough", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, {
        model: "jev-latest",
        answers: { q1: { type: "noul", noul: 0.87 } },
      })) as typeof fetch;

    const result = await decide(baseReq, { apiKey: SECRET, fetchImpl });
    expect(result.verified).toBe(true);
    if (result.verified) {
      expect(result.model).toBe("jev-latest");
      expect(result.answers.q1).toEqual({ type: "noul", noul: 0.87 });
    }
  });

  test("429 then success retries", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) return jsonResponse(429, { error: "rate limited" });
      return jsonResponse(200, {
        model: "jev-latest",
        answers: { q1: { type: "noul", noul: 0.5 } },
      });
    }) as typeof fetch;

    const result = await decide(baseReq, {
      apiKey: SECRET,
      fetchImpl,
      baseDelayMs: 5,
      retries: 3,
    });
    expect(calls).toBe(2);
    expect(result.verified).toBe(true);
  });

  test("529 exhausted retries -> UNVERIFIED", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse(529, { error: "overloaded" });
    }) as typeof fetch;

    const result = await decide(baseReq, {
      apiKey: SECRET,
      fetchImpl,
      baseDelayMs: 5,
      retries: 2,
    });
    expect(calls).toBe(3);
    expect(result.verified).toBe(false);
    if (!result.verified) {
      expect(result.stamp).toBe("UNVERIFIED BY JEV");
    }
  });

  test("401 does not retry -> UNVERIFIED", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse(401, { error: "unauthorized" });
    }) as typeof fetch;

    const result = await decide(baseReq, {
      apiKey: SECRET,
      fetchImpl,
      baseDelayMs: 5,
      retries: 3,
    });
    expect(calls).toBe(1);
    expect(result.verified).toBe(false);
  });

  test("422 does not retry -> UNVERIFIED", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse(422, { error: "unprocessable" });
    }) as typeof fetch;

    const result = await decide(baseReq, {
      apiKey: SECRET,
      fetchImpl,
      baseDelayMs: 5,
      retries: 3,
    });
    expect(calls).toBe(1);
    expect(result.verified).toBe(false);
  });

  test("missing key -> UNVERIFIED, no network call", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse(200, { model: "jev-latest", answers: {} });
    }) as typeof fetch;

    const prevEnv = process.env.JEV_API_KEY;
    delete process.env.JEV_API_KEY;
    try {
      const result = await decide(baseReq, { fetchImpl });
      expect(calls).toBe(0);
      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).toContain("missing JEV_API_KEY");
      }
    } finally {
      if (prevEnv !== undefined) process.env.JEV_API_KEY = prevEnv;
    }
  });

  test("timeout -> UNVERIFIED", async () => {
    const fetchImpl = (async (_url: any, init: any) => {
      return new Promise<Response>((resolve, reject) => {
        const t = setTimeout(() => resolve(jsonResponse(200, {})), 1000);
        init.signal.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    }) as unknown as typeof fetch;

    const result = await decide(baseReq, {
      apiKey: SECRET,
      fetchImpl,
      timeoutMs: 20,
      retries: 0,
    });
    expect(result.verified).toBe(false);
    if (!result.verified) {
      expect(result.error).toContain("timed out");
    }
  });

  test("network error (fetch throws) -> UNVERIFIED after retries", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;

    const result = await decide(baseReq, {
      apiKey: SECRET,
      fetchImpl,
      baseDelayMs: 5,
      retries: 1,
    });
    expect(calls).toBe(2);
    expect(result.verified).toBe(false);
  });

  test("key never appears in any returned error string", async () => {
    const scenarios: Array<() => Promise<ReturnType<typeof decide>>> = [
      () =>
        decide(baseReq, {
          apiKey: SECRET,
          fetchImpl: (async () => jsonResponse(401, {})) as typeof fetch,
        }),
      () =>
        decide(baseReq, {
          apiKey: SECRET,
          baseDelayMs: 5,
          retries: 1,
          fetchImpl: (async () => jsonResponse(529, {})) as typeof fetch,
        }),
      () =>
        decide(baseReq, {
          apiKey: SECRET,
          fetchImpl: (async () => {
            throw new Error(`network down, key=${SECRET}`);
          }) as unknown as typeof fetch,
          retries: 0,
        }),
    ];

    for (const run of scenarios) {
      const result = await run();
      expect(result.verified).toBe(false);
      if (!result.verified) {
        expect(result.error).not.toContain(SECRET);
      }
    }
  });
});

describe("redact()", () => {
  test("redacts PEM private key blocks", () => {
    const pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA\n-----END RSA PRIVATE KEY-----";
    const out = redact(`before ${pem} after`) as string;
    expect(out).not.toContain("MIIEpAIBAAKCAQEA");
    expect(out).toContain("[REDACTED]");
  });

  test("redacts Bearer tokens", () => {
    const out = redact("Authorization: Bearer abc123.def456-ghi") as string;
    expect(out).not.toContain("abc123.def456-ghi");
    expect(out).toContain("[REDACTED]");
  });

  test("redacts JWTs", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const out = redact(`token=${jwt}`) as string;
    expect(out).not.toContain(jwt);
    expect(out).toContain("[REDACTED]");
  });

  test("redacts AWS access keys", () => {
    const out = redact("AKIAABCDEFGHIJKLMNOP") as string;
    expect(out).not.toContain("AKIAABCDEFGHIJKLMNOP");
    expect(out).toBe("[REDACTED]");
  });

  test("redacts GitHub tokens", () => {
    const out = redact("ghp_1234567890abcdef1234567890abcdef1234") as string;
    expect(out).not.toContain("ghp_1234567890abcdef1234567890abcdef1234");
    expect(out).toBe("[REDACTED]");
  });

  test("redacts OpenAI/Anthropic-style keys", () => {
    const out1 = redact("sk-abcdefghijklmno1234567890") as string;
    expect(out1).toBe("[REDACTED]");
    const out2 = redact("sk-ant-abcdefghijklmno1234567890") as string;
    expect(out2).toBe("[REDACTED]");
  });

  test("redacts TypeSafe and designmd keys", () => {
    expect(redact("apikey_abc123def456")).toBe("[REDACTED]");
    expect(redact("dk_abc123def456")).toBe("[REDACTED]");
  });

  test("redacts Slack tokens", () => {
    const out = redact("xoxb-123456-abcdefg") as string;
    expect(out).not.toContain("123456-abcdefg");
  });

  test("redacts generic KEY=value and secret/password assignments", () => {
    expect(redact("API_KEY=sekritvalue1234")).not.toContain("sekritvalue1234");
    expect(redact('"password": "hunter2verysecret"')).not.toContain("hunter2verysecret");
    expect(redact("db_password: hunter2verysecret")).not.toContain("hunter2verysecret");
    expect(redact('"secret_token": "zzz-not-a-real-one-999"')).not.toContain("zzz-not-a-real-one-999");
  });

  test("leaves ordinary prose, hex SHAs, and UUIDs untouched", () => {
    const sha = "7a31dd9c1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b";
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const prose = `Fixed commit ${sha} and referenced entity ${uuid}. This is a totally normal sentence about keyboards and secrets of the universe.`;
    const out = redact(prose) as string;
    expect(out).toBe(prose);
  });

  test("walks nested objects and arrays", () => {
    const input = {
      note: "hello world",
      nested: {
        auth: "Bearer sometoken.value.here",
        list: ["fine", "AKIAABCDEFGHIJKLMNOP", { deeper: "sk-abcdefghijklmno1234567890" }],
      },
    };
    const out = redact(input) as any;
    expect(out.note).toBe("hello world");
    expect(out.nested.auth).toContain("[REDACTED]");
    expect(out.nested.list[0]).toBe("fine");
    expect(out.nested.list[1]).toBe("[REDACTED]");
    expect(out.nested.list[2].deeper).toBe("[REDACTED]");
  });
});

describe("decide() redaction + decision log", () => {
  test("fetch body received by fetchImpl contains no secret after redaction", async () => {
    const secretState = { screenshot: "n/a", auth: "sk-test-1234567890abcdef" };
    let capturedBody = "";
    const fetchImpl = (async (_url: any, init: any) => {
      capturedBody = init.body;
      return jsonResponse(200, { model: "jev-latest", answers: { q1: { type: "noul", noul: 0.9 } } });
    }) as unknown as typeof fetch;

    const result = await decide(
      { state: secretState, questions: baseReq.questions },
      { apiKey: SECRET, fetchImpl, log: false },
    );

    expect(capturedBody).not.toContain("sk-test-1234567890abcdef");
    expect(result.verified).toBe(true);
    if (result.verified) {
      expect(result.redactions).toBeGreaterThanOrEqual(1);
    }
  });

  test("writes a decision log line with expected fields and no secret", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jev-log-"));
    const logPath = join(dir, "decisions.jsonl");
    try {
      const secretState = { screenshot: "n/a", auth: "sk-test-1234567890abcdef" };
      const fetchImpl = (async () =>
        jsonResponse(200, { model: "jev-latest", answers: { q1: { type: "noul", noul: 0.9 } } })) as typeof fetch;

      const result = await decide(
        { state: secretState, questions: baseReq.questions },
        {
          apiKey: SECRET,
          fetchImpl,
          logPath,
          decision_id: "ui.region_gate",
        },
      );
      expect(result.verified).toBe(true);

      const contents = await readFile(logPath, "utf8");
      const lines = contents.trim().split("\n");
      expect(lines.length).toBe(1);
      const entry = JSON.parse(lines[0]);

      expect(entry.decision_id).toBe("ui.region_gate");
      expect(entry.domain).toBe("ui");
      expect(entry.verified).toBe(true);
      expect(typeof entry.latency_ms).toBe("number");
      expect(entry.redactions).toBeGreaterThanOrEqual(1);
      expect(entry.question_types).toEqual({ q1: "noul" });
      expect(entry.answers).toEqual({ q1: { type: "noul", noul: 0.9 } });
      expect(typeof entry.state_digest).toBe("string");

      const raw = JSON.stringify(entry);
      expect(raw).not.toContain("sk-test-1234567890abcdef");
      expect(raw).not.toContain(SECRET);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("logging failure does not throw and decide() still resolves", async () => {
    const badLogPath = "/dev/null/impossible/path/decisions.jsonl";
    const fetchImpl = (async () =>
      jsonResponse(200, { model: "jev-latest", answers: { q1: { type: "noul", noul: 0.9 } } })) as typeof fetch;

    let thrown: unknown = null;
    let result: Awaited<ReturnType<typeof decide>> | null = null;
    try {
      result = await decide(baseReq, { apiKey: SECRET, fetchImpl, logPath: badLogPath });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeNull();
    expect(result?.verified).toBe(true);
  });

  test("log: false disables logging entirely (no file created)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jev-log-off-"));
    const logPath = join(dir, "decisions.jsonl");
    try {
      const fetchImpl = (async () =>
        jsonResponse(200, { model: "jev-latest", answers: { q1: { type: "noul", noul: 0.9 } } })) as typeof fetch;

      await decide(baseReq, { apiKey: SECRET, fetchImpl, logPath, log: false });

      const exists = await readFile(logPath, "utf8").then(
        () => true,
        () => false,
      );
      expect(exists).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
