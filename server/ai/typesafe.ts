import { JEV_MODEL } from "../../app/lib/jev";

export const TYPESAFE_SYSTEM_ONE_URL = "https://api.typesafe.ai/v1/systemone";
export const TYPESAFE_TIMEOUT_MS = 15_000;

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string | null>;
};

export type ScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: string[];
};

export type NoulQuestion = {
  type: "noul";
  instructions: string;
  criteria?: { true?: string; false?: string };
};

export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

export type NoulAnswer = {
  type: "noul";
  noul: number;
};

export type Answer = ChoiceAnswer | ScoreAnswer | NoulAnswer;

export type SystemOneRequest = {
  state: JsonValue;
  model?: string;
  questions: Record<string, Question>;
};

export type SystemOneResult = {
  model: string;
  answers: Record<string, Answer>;
};

export type SystemOneRun = (request: SystemOneRequest) => Promise<SystemOneResult>;

let testSystemOneRun: SystemOneRun | undefined;

/** Test-only. Production always POSTs to TypeSafe when a key is present. */
export function setTestSystemOneRun(run?: SystemOneRun) {
  testSystemOneRun = run;
}

export function hasTypesafeApiKey(key: string | undefined | null): boolean {
  return Boolean(testSystemOneRun) || Boolean(key?.trim());
}

export function typesafeApiKeyFromEnv(env: { TYPESAFE_API_KEY?: string }): string | undefined {
  const key = env.TYPESAFE_API_KEY?.trim();
  return key || undefined;
}

export function choice(
  instructions: string,
  criteria: Record<string, string | null>,
): ChoiceQuestion {
  return { type: "choice", instructions, criteria };
}

export function score(instructions: string, criteria: string[]): ScoreQuestion {
  return { type: "score", instructions, criteria };
}

export function noul(
  instructions: string,
  criteria?: { true?: string; false?: string },
): NoulQuestion {
  return criteria ? { type: "noul", instructions, criteria } : { type: "noul", instructions };
}

export async function runSystemOne(
  apiKey: string | undefined,
  request: SystemOneRequest,
): Promise<SystemOneResult> {
  if (testSystemOneRun) {
    return testSystemOneRun(request);
  }
  const key = apiKey?.trim();
  if (!key) {
    throw new Error("TYPESAFE_API_KEY is missing");
  }
  return postSystemOne(key, request);
}

export function parseSystemOneResult(raw: unknown): SystemOneResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("TypeSafe response is empty");
  }
  const record = raw as Record<string, unknown>;
  const model = typeof record.model === "string" && record.model.trim() ? record.model : JEV_MODEL;
  if (!record.answers || typeof record.answers !== "object") {
    throw new Error("TypeSafe response is missing answers");
  }
  const answers: Record<string, Answer> = {};
  for (const [key, value] of Object.entries(record.answers as Record<string, unknown>)) {
    answers[key] = parseAnswer(value);
  }
  return { model, answers };
}

function parseAnswer(raw: unknown): Answer {
  if (!raw || typeof raw !== "object") {
    throw new Error("TypeSafe answer is empty");
  }
  const record = raw as Record<string, unknown>;
  if (record.type === "choice") {
    if (typeof record.choice !== "string" || !record.choice) {
      throw new Error("TypeSafe choice answer is missing choice");
    }
    return {
      type: "choice",
      choice: record.choice,
      probabilities: asNumberRecord(record.probabilities),
      confidence: asFiniteNumber(record.confidence, 0),
    };
  }
  if (record.type === "score") {
    const value = asFiniteNumber(record.score, Number.NaN);
    if (!Number.isFinite(value)) {
      throw new Error("TypeSafe score answer is missing score");
    }
    return {
      type: "score",
      score: value,
      legend: asStringRecord(record.legend),
      probabilities: asNumberRecord(record.probabilities),
      confidence: asFiniteNumber(record.confidence, 0),
    };
  }
  if (record.type === "noul") {
    const value = asFiniteNumber(record.noul, Number.NaN);
    if (!Number.isFinite(value)) {
      throw new Error("TypeSafe noul answer is missing noul");
    }
    return { type: "noul", noul: value };
  }
  throw new Error("TypeSafe answer type is unsupported");
}

function asFiniteNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asNumberRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = asFiniteNumber(value, Number.NaN);
    if (Number.isFinite(parsed)) out[key] = parsed;
  }
  return out;
}

function asStringRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

async function postSystemOne(apiKey: string, request: SystemOneRequest): Promise<SystemOneResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TYPESAFE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(TYPESAFE_SYSTEM_ONE_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        state: request.state,
        model: request.model ?? JEV_MODEL,
        questions: request.questions,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("TypeSafe request timed out");
    }
    throw new Error("TypeSafe request failed");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`TypeSafe request failed (${response.status})`);
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error("TypeSafe response is not JSON");
  }
  return parseSystemOneResult(raw);
}
