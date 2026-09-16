import { describe, expect, it } from "vitest";
import { APP_SCREENS, IDEAS, STAGES } from "../app/data/mock";

describe("UI map mock data", () => {
  it("keeps unique screen paths and Japanese titles", () => {
    const paths = APP_SCREENS.map((screen) => screen.path);
    expect(paths).toEqual([...new Set(paths)]);
    expect(APP_SCREENS.map((screen) => screen.title)).toEqual([
      "クイックキャプチャ",
      "熟成ボード",
      "アイデア詳細",
      "融合 / 関連",
      "リサーチ / プロトタイプ",
      "チーム設定",
    ]);
  });

  it("uses only the defined aging stages", () => {
    for (const idea of IDEAS) {
      expect(STAGES).toContain(idea.stage);
      expect(idea.title.length).toBeGreaterThan(0);
    }
  });
});
