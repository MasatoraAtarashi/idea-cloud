import { describe, expect, it } from "vitest";
import {
  aiScoreMeaning,
  parseEvaluationNotes,
  softenEvaluationText,
} from "../app/lib/evaluation-notes";
import { formatJevEvaluationNotes, type JevEvaluateAxes } from "../server/ai/jev-evaluate";
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
    choice: "try",
    probabilities: { try: 0.7 },
    confidence: 0.5,
  },
};

describe("evaluation note presentation", () => {
  it("parses Workers AI headings and the 1–5 score", () => {
    const parsed = parseEvaluationNotes(
      "強み:\n- 早い\nリスク:\n- 狭い\n新規性:\n- あり\n次の一手:\n- 試す\nスコア: 4",
    );
    expect(parsed?.score).toBe(4);
    expect(parsed?.sections.map((section) => section.label)).toEqual([
      "強み",
      "リスク",
      "新規性",
      "次の一手",
    ]);
    expect(parsed?.sections[0]?.body).toContain("早い");
    expect(aiScoreMeaning(JA, 4)).toBe("進めてよさそう");
  });

  it("hides Jev axis decimals while keeping plain labels", () => {
    const raw = [
      "強み",
      "- 価値: 大きい（2.1）",
      "- 実現性: 現実的（1.8）",
      "",
      "リスク",
      "- 大きさ: 中程度（1.2）",
      "- 進める価値: 0.73",
      "",
      "新規性",
      "- 明確に新しい（2.4）",
      "",
      "次の一手",
      "- 小さく試す",
      "",
      "スコア: 4",
    ].join("\n");
    const parsed = parseEvaluationNotes(raw);
    const flat = parsed?.sections.map((section) => section.body).join("\n") ?? "";
    expect(parsed?.score).toBe(4);
    expect(flat).toContain("大きい");
    expect(flat).toContain("進める価値: 高め");
    expect(flat).not.toMatch(/\d+\.\d+/);
    expect(softenEvaluationText("進める価値: 0.20")).toBe("進める価値: 低め");
  });

  it("falls back when the text has no section headings", () => {
    expect(parseEvaluationNotes("なんとなく良さそう。スコア: 3")).toBeNull();
  });

  it("stores new Jev notes without raw axis decimals", () => {
    const notes = formatJevEvaluationNotes(axes, 4);
    expect(notes).toContain("スコア: 4");
    expect(notes).toContain("進める価値: 高め");
    expect(notes).toContain("小さく試す");
    expect(notes).not.toMatch(/\d+\.\d+/);
    expect(parseEvaluationNotes(notes)?.sections).toHaveLength(4);
  });
});
