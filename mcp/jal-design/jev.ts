// JEV (TypeSafe) decision-layer client. Zero dependencies, Bun/fetch native.
// Endpoint: POST https://api.typesafe.ai/v1/systemone

import { mkdir } from "node:fs/promises";
import { appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type JevQuestion =
  | { type: "choice"; instructions: unknown; criteria: Record<string, unknown> }
  | { type: "score"; instructions: unknown; criteria: unknown[] }
  | { type: "noul"; instructions: unknown };

export type JevResult =
  | { verified: true; model: string; answers: Record<string, unknown>; redactions: number }
  | { verified: false; stamp: "UNVERIFIED BY JEV"; error: string };

export type JevOpts = {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  decision_id?: string;
  domain?: string;
  logPath?: string;
  log?: boolean;
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

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const SECRET_PATTERNS: RegExp[] = [
  // PEM private key blocks
  /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g,
  // Bearer tokens
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  // JWTs: three base64url segments, first starting with eyJ
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  // AWS access keys
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  // GitHub tokens
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  // OpenAI / Anthropic style keys
  /\bsk-ant-[A-Za-z0-9_-]{10,}\b/g,
  /\bsk-[A-Za-z0-9_-]{10,}\b/g,
  // TypeSafe keys
  /\bapikey_[A-Za-z0-9_-]{6,}\b/g,
  // designmd keys
  /\bdk_[A-Za-z0-9_-]{6,}\b/g,
  // Slack tokens
  /\bxox[baprs]-[A-Za-z0-9-]{6,}\b/g,
];

// generic KEY=value / "secret": "..." / password: ... assignments where the
// name contains key/secret/token/password/passwd/pwd/credential.
const SENSITIVE_NAME = /(key|secret|token|password|passwd|pwd|credential)/i;

// name = value  (env style, quoted key optional)
const ASSIGNMENT_EQUALS = /\b([A-Za-z0-9_.-]*(?:key|secret|token|password|passwd|pwd|credential)[A-Za-z0-9_.-]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s,;'"]+)/gi;

// "name": "value"  or name: value  (JSON / YAML style)
const ASSIGNMENT_COLON = /(["']?([A-Za-z0-9_.-]*(?:key|secret|token|password|passwd|pwd|credential)[A-Za-z0-9_.-]*)["']?\s*:\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s,}\]]+)/gi;

function redactAssignments(input: string): { text: string; count: number } {
  let count = 0;
  let text = input.replace(ASSIGNMENT_EQUALS, (m, name) => {
    count++;
    return `${name}=[REDACTED]`;
  });
  text = text.replace(ASSIGNMENT_COLON, (m, prefix, name) => {
    count++;
    return `${prefix}"[REDACTED]"`;
  });
  return { text, count };
}

/**
 * Redact secrets from a string. Returns the redacted string and how many
 * replacements were made across all patterns.
 */
function redactString(input: string): { text: string; count: number } {
  let count = 0;
  let text = input;
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, () => {
      count++;
      return "[REDACTED]";
    });
  }
  const assignmentResult = redactAssignments(text);
  text = assignmentResult.text;
  count += assignmentResult.count;
  return { text, count };
}

/**
 * Recursively walk a value (objects/arrays/strings) and redact secrets found
 * in any string. Non-string primitives pass through untouched. Returns the
 * redacted (deep-cloned) value and a running count of redactions made.
 */
export function redact(value: unknown, counter: { count: number } = { count: 0 }): unknown {
  if (typeof value === "string") {
    const { text, count } = redactString(value);
    counter.count += count;
    return text;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redact(v, counter));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redact(v, counter);
    }
    return out;
  }
  return value;
}

function redactQuestions(
  questions: Record<string, JevQuestion>,
  counter: { count: number },
): Record<string, JevQuestion> {
  const out: Record<string, JevQuestion> = {};
  for (const [key, q] of Object.entries(questions)) {
    const redactedInstructions = redact((q as any).instructions, counter);
    if (q.type === "choice") {
      out[key] = {
        type: "choice",
        instructions: redactedInstructions,
        criteria: redact(q.criteria, counter) as Record<string, unknown>,
      };
    } else if (q.type === "score") {
      out[key] = {
        type: "score",
        instructions: redactedInstructions,
        criteria: redact(q.criteria, counter) as unknown[],
      };
    } else {
      out[key] = { type: "noul", instructions: redactedInstructions };
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Decision log
// ---------------------------------------------------------------------------

type DecisionLogEntry = {
  ts: string;
  decision_id?: string;
  domain?: string;
  verified: boolean;
  stamp?: string;
  error?: string;
  model?: string;
  latency_ms: number;
  redactions: number;
  question_types: Record<string, string>;
  answers?: Record<string, unknown>;
  state_digest: string;
};

function defaultLogPath(): string {
  const envPath = process.env.JAL_DECISION_LOG;
  if (envPath) return envPath;
  const today = new Date().toISOString().slice(0, 10);
  return join(process.cwd(), ".jal", "decisions", `${today}.jsonl`);
}

function domainFromDecisionId(decisionId?: string): string | undefined {
  if (!decisionId) return undefined;
  const idx = decisionId.indexOf(".");
  return idx >= 0 ? decisionId.slice(0, idx) : decisionId;
}

async function appendDecisionLog(entry: DecisionLogEntry, logPath: string): Promise<void> {
  try {
    await mkdir(dirname(logPath), { recursive: true });
    await appendFile(logPath, JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.error("[jal-design] failed to write decision log:", err instanceof Error ? err.message : String(err));
  }
}

export async function decide(
  req: { state: unknown; questions: Record<string, JevQuestion> },
  opts: JevOpts = {},
): Promise<JevResult> {
  const startedAt = Date.now();
  const shouldLog = opts.log ?? true;
  const decisionId = opts.decision_id;
  const domain = opts.domain ?? domainFromDecisionId(decisionId);
  const questionTypes: Record<string, string> = {};
  for (const [key, q] of Object.entries(req.questions ?? {})) {
    questionTypes[key] = (q as JevQuestion).type;
  }

  const redactionCounter = { count: 0 };
  const redactedState = redact(req.state, redactionCounter);
  const redactedQuestions = redactQuestions(req.questions ?? {}, redactionCounter);
  const stateDigest = JSON.stringify(redactedState).slice(0, 240);

  const finish = async (result: JevResult): Promise<JevResult> => {
    if (shouldLog) {
      const entry: DecisionLogEntry = {
        ts: new Date().toISOString(),
        decision_id: decisionId,
        domain,
        verified: result.verified,
        stamp: result.verified ? undefined : result.stamp,
        error: result.verified ? undefined : result.error,
        model: result.verified ? result.model : undefined,
        latency_ms: Date.now() - startedAt,
        redactions: redactionCounter.count,
        question_types: questionTypes,
        answers: result.verified ? result.answers : undefined,
        state_digest: stateDigest,
      };
      const logPath = opts.logPath ?? defaultLogPath();
      await appendDecisionLog(entry, logPath);
    }
    return result;
  };

  const apiKey = opts.apiKey ?? process.env.JEV_API_KEY;
  if (!apiKey) {
    return finish(unverified("missing JEV_API_KEY"));
  }

  const fetchImpl = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const totalAttempts = retries + 1;

  const body = JSON.stringify({
    state: redactedState,
    model: MODEL,
    questions: redactedQuestions,
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
      return finish(unverified(lastError));
    }

    if (res.ok) {
      let json: any;
      try {
        json = await res.json();
      } catch {
        return finish(unverified("invalid JSON response"));
      }
      const model = typeof json?.model === "string" ? json.model : MODEL;
      const answers =
        json && typeof json === "object" && json.answers && typeof json.answers === "object"
          ? json.answers
          : json;
      return finish({ verified: true, model, answers, redactions: redactionCounter.count });
    }

    if (NO_RETRY_STATUS.has(res.status)) {
      return finish(unverified(`JEV request failed: ${res.status}`));
    }

    if (RETRY_STATUS.has(res.status)) {
      lastError = `JEV request failed: ${res.status}`;
      if (attempt < totalAttempts - 1) {
        await sleep(backoffDelay(baseDelayMs, attempt));
        continue;
      }
      return finish(unverified(lastError));
    }

    // Any other non-2xx status: do not retry.
    return finish(unverified(`JEV request failed: ${res.status}`));
  }

  return finish(unverified(lastError));
}
