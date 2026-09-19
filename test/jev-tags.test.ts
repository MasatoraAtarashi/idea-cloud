import { describe, expect, it } from "vitest";
import {
  JEV_TAG_CRITERIA,
  tagsFromChoiceAnswer,
  tagsFromChoiceProbabilities,
} from "../server/ai/jev-tags";

describe("Jev tag mapping", () => {
  it("takes 2–5 vocab tags from the probability distribution", () => {
    expect(
      tagsFromChoiceProbabilities({
        記録: 0.41,
        時間: 0.22,
        個人: 0.18,
        ツール: 0.09,
        AI: 0.04,
        未知: 0.9,
      }),
    ).toEqual(["記録", "時間", "個人", "ツール"]);
  });

  it("fills up to two tags when few options clear the threshold", () => {
    expect(tagsFromChoiceProbabilities({ 記録: 0.9, 時間: 0.05, AI: 0.03 })).toEqual([
      "記録",
      "時間",
    ]);
  });

  it("uses the chosen label when probabilities are empty", () => {
    expect(
      tagsFromChoiceAnswer({
        type: "choice",
        choice: "研究",
        probabilities: {},
        confidence: 0.4,
      }),
    ).toEqual(["研究"]);
  });

  it("drops unknown labels", () => {
    expect(tagsFromChoiceProbabilities({ other: 0.9 }, "other")).toEqual([]);
    expect(Object.keys(JEV_TAG_CRITERIA).length).toBeGreaterThanOrEqual(8);
  });
});
