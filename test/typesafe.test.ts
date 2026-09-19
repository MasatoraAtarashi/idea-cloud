import { afterEach, describe, expect, it } from "vitest";
import {
  hasTypesafeApiKey,
  parseSystemOneResult,
  runSystemOne,
  setTestSystemOneRun,
  typesafeApiKeyFromEnv,
} from "../server/ai/typesafe";

describe("TypeSafe System One parsing", () => {
  it("reads choice, score, and noul answers", () => {
    const parsed = parseSystemOneResult({
      model: "jev-latest",
      answers: {
        tag: {
          type: "choice",
          choice: "記録",
          probabilities: { 記録: 0.7, 時間: 0.3 },
          confidence: 0.55,
        },
        novelty: {
          type: "score",
          score: 2.1,
          legend: { "0": "既存の延長", "2": "明確に新しい" },
          probabilities: { "2": 0.8 },
          confidence: 0.6,
        },
        pursue: { type: "noul", noul: 0.81 },
      },
    });
    expect(parsed.model).toBe("jev-latest");
    expect(parsed.answers.tag).toEqual({
      type: "choice",
      choice: "記録",
      probabilities: { 記録: 0.7, 時間: 0.3 },
      confidence: 0.55,
    });
    expect(parsed.answers.novelty).toMatchObject({ type: "score", score: 2.1 });
    expect(parsed.answers.pursue).toEqual({ type: "noul", noul: 0.81 });
  });

  it("rejects missing answers and unknown types", () => {
    expect(() => parseSystemOneResult({ model: "jev-latest" })).toThrow(/missing answers/);
    expect(() => parseSystemOneResult({ answers: { x: { type: "text" } } })).toThrow(/unsupported/);
    expect(() => parseSystemOneResult({ answers: { x: { type: "score" } } })).toThrow(/score/);
  });

  it("treats blank keys as missing and never echoes the key", () => {
    expect(hasTypesafeApiKey(undefined)).toBe(false);
    expect(hasTypesafeApiKey("")).toBe(false);
    expect(hasTypesafeApiKey("   ")).toBe(false);
    expect(typesafeApiKeyFromEnv({})).toBeUndefined();
    expect(typesafeApiKeyFromEnv({ TYPESAFE_API_KEY: "  " })).toBeUndefined();
    const name = "TYPESAFE_API_KEY";
    const present = ["fixture", "value"].join("-");
    expect(typesafeApiKeyFromEnv({ [name]: present })).toBe(present);
  });
});

describe("TypeSafe System One test runner", () => {
  afterEach(() => {
    setTestSystemOneRun();
  });

  it("uses the test stub without calling fetch", async () => {
    setTestSystemOneRun(async (request) => {
      expect(request.questions.tag).toMatchObject({ type: "choice" });
      return {
        model: "jev-latest",
        answers: { tag: { type: "choice", choice: "AI", probabilities: { AI: 1 }, confidence: 1 } },
      };
    });
    expect(hasTypesafeApiKey(undefined)).toBe(true);
    const result = await runSystemOne(undefined, {
      state: { idea: "テスト" },
      questions: { tag: { type: "choice", instructions: "tag", criteria: { AI: "AI" } } },
    });
    expect(result.answers.tag).toMatchObject({ type: "choice", choice: "AI" });
  });
});
