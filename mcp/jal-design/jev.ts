// JEV (TypeSafe) decision-layer client. Zero dependencies, Bun/fetch native.
// Endpoint: POST https://api.typesafe.ai/v1/systemone

export type JevQuestion =
  | { type: "choice"; instructions: unknown; criteria: Record<string, unknown> }
  | { type: "score"; instructions: unknown; criteria: unknown[] }
  | { type: "noul"; instructions: unknown };

export type JevResult =
  | { verified: true; model: string; answers: Record<string, unknown> }
  | { verified: false; stamp: "UNVERIFIED BY JEV"; error: string };

export type JevOpts = {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
};

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";

const NO_RETRY_STATUS = new Set([401, 422]);
const RETRY_STATUS = new Set([429, 529]);

function unverified(error: string): JevResult {
  return { verified: false, stamp: "UNVERIFIED BY JEV", error };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(baseDelayMs: number, attemptIndex: number): number {
  const exp = baseDelayMs * Math.pow(2, attemptIndex);
  const jitter = 0.5 + Math.random() * 0.5;
  return Math.round(exp * jitter);
}

export async function decide(
  req: { state: unknown; questions: Record<string, JevQuestion> },
  opts: JevOpts = {},
): Promise<JevResult> {
  const apiKey = opts.apiKey ?? process.env.JEV_API_KEY;
  if (!apiKey) {
    return unverified("missing JEV_API_KEY");
  }

  const fetchImpl = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const totalAttempts = retries + 1;

  const body = JSON.stringify({
    state: req.state,
    model: MODEL,
    questions: req.questions,
  });

  let lastError = "unknown error";

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      lastError = isAbort ? "request timed out" : "network error";
      if (attempt < totalAttempts - 1) {
        await sleep(backoffDelay(baseDelayMs, attempt));
        continue;
      }
      return unverified(lastError);
    }

    if (res.ok) {
      let json: any;
      try {
        json = await res.json();
      } catch {
        return unverified("invalid JSON response");
      }
      const model = typeof json?.model === "string" ? json.model : MODEL;
      const answers =
        json && typeof json === "object" && json.answers && typeof json.answers === "object"
          ? json.answers
          : json;
      return { verified: true, model, answers };
    }

    if (NO_RETRY_STATUS.has(res.status)) {
      return unverified(`JEV request failed: ${res.status}`);
    }

    if (RETRY_STATUS.has(res.status)) {
      lastError = `JEV request failed: ${res.status}`;
      if (attempt < totalAttempts - 1) {
        await sleep(backoffDelay(baseDelayMs, attempt));
        continue;
      }
      return unverified(lastError);
    }

    // Any other non-2xx status: do not retry.
    return unverified(`JEV request failed: ${res.status}`);
  }

  return unverified(lastError);
}
