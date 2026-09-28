import { describe, test, expect } from "bun:test";
import { decide } from "./jev.ts";

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
