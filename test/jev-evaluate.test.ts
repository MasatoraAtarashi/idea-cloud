import { describe, expect, it } from "vitest";
import { JEV_MODEL, JEV_MODEL_LABEL } from "../app/lib/jev";
import { evaluationModelLabel } from "../app/lib/research-models";
import { parseAiScore } from "../app/lib/scores";
import {
  compositeJevScore,
  compositeToAiScore,
  formatJevEvaluationNotes,
  mapJevEvaluation,
  parseJevEvaluationAnswers,
  type JevEvaluateAxes,
} from "../server/ai/jev-evaluate";
import type { ScoreAnswer } from "../server/ai/typesafe";
import { JA } from "../app/i18n/dictionary";

function scoreAnswer(value: number, legend: Record<string, string>): ScoreAnswer {
  return {
    type: "score",
    score: value,
    legend,
    probabilities: {},
    confidence: 0.7,
  };
}

const axes: JevEvaluateAxes = {
  novelty: scoreAnswer(2.4, { "2": "明確に新しい" }),
  impact: scoreAnswer(2.1, { "2": "大きい" }),
  feasibility: scoreAnswer(1.8, { "2": "現実的" }),
  clarity: scoreAnswer(2.0, { "2": "具体的" }),
  risk: scoreAnswer(1.2, { "1": "中程度" }),
  pursue: { type: "noul", noul: 0.73 },
  next: {
    type: "choice",
    choice: "research",
    probabilities: { research: 0.8 },
    confidence: 0.64,
  },
};

describe("Jev evaluation mapping", () => {
  it("maps a 0–3 composite onto 1–5", () => {
    expect(compositeToAiScore(0)).toBe(1);
    expect(compositeToAiScore(1.5)).toBe(3);
    expect(compositeToAiScore(3)).toBe(5);
    expect(compositeToAiScore(2.2)).toBe(4);
  });

  it("inverts risk in the weighted composite", () => {
    expect(
      compositeJevScore({ novelty: 3, impact: 3, feasibility: 3, clarity: 3, risk: 0 }),
    ).toBeCloseTo(3);
    expect(
      compositeJevScore({ novelty: 3, impact: 3, feasibility: 3, clarity: 3, risk: 3 }),
    ).toBeCloseTo(2.55);
  });

  it("formats Japanese notes that the existing score parser can read", () => {
    const mapped = mapJevEvaluation(axes);
    expect(mapped.model).toBe(JEV_MODEL);
    expect(mapped.score).toBeGreaterThanOrEqual(1);
    expect(mapped.score).toBeLessThanOrEqual(5);
    expect(mapped.notes).toContain("強み");
    expect(mapped.notes).toContain("リスク");
    expect(mapped.notes).toContain("新規性");
    expect(mapped.notes).toContain("次の一手");
    expect(mapped.notes).toContain("リサーチで仮説を検証する");
    expect(mapped.notes).toContain("進める価値: 高め");
    expect(mapped.notes).not.toMatch(/\d+\.\d+/);
    expect(parseAiScore(mapped.notes)).toBe(mapped.score);
    expect(formatJevEvaluationNotes(axes, 4)).toContain("スコア: 4");
  });

  it("writes the note in the reader's language, keeping the headings as storage keys", () => {
    const en = formatJevEvaluationNotes(axes, 4, "en");
    // Headings and the score line are parsed back out, so they stay Japanese.
    for (const heading of ["強み", "リスク", "新規性", "次の一手"]) {
      expect(en).toContain(heading);
    }
    expect(en).toContain("スコア: 4");
    expect(parseAiScore(en)).toBe(4);
    // Everything under them follows the reader.
    expect(en).not.toContain("進める価値: 高め");
    expect(en).not.toContain("リサーチで仮説を検証する");
    expect(en).toMatch(/[A-Za-z]{4,}/);
    // And it is a real translation, not the Japanese note.
    expect(en).not.toBe(formatJevEvaluationNotes(axes, 4, "ja"));
    for (const locale of ["zh", "ko"] as const) {
      const note = formatJevEvaluationNotes(axes, 4, locale);
      expect(note, locale).toContain("スコア: 4");
      expect(note, locale).not.toBe(formatJevEvaluationNotes(axes, 4, "ja"));
    }
  });

  it("still defaults to Japanese when no locale is given", () => {
    expect(formatJevEvaluationNotes(axes, 4)).toBe(formatJevEvaluationNotes(axes, 4, "ja"));
  });

  it("requires every axis", () => {
    expect(() => parseJevEvaluationAnswers({ novelty: { type: "noul" } })).toThrow(/novelty/);
  });

  it("labels Jev in the UI helper", () => {
    expect(evaluationModelLabel(JA, JEV_MODEL)).toBe(JEV_MODEL_LABEL);
    expect(evaluationModelLabel(JA, "@cf/qwen/qwen3-30b-a3b-fp8")).toBe("標準");
  });
});
