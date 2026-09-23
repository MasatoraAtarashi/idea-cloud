import { describe, expect, it } from "vitest";
import { formatIdeaCopyText } from "../app/lib/idea-copy";

describe("formatIdeaCopyText", () => {
  it("copies title, body, stage, and tags without an id", () => {
    const text = formatIdeaCopyText({
      title: "朝の棚",
      body: "通勤中に一言だけ残す。",
      stage: "aging",
      tags: ["通勤", "メモ"],
    });
    expect(text).toBe(
      ["朝の棚", "", "通勤中に一言だけ残す。", "", "段階: 熟成中", "タグ: 通勤, メモ"].join("\n"),
    );
    expect(text).not.toMatch(/\bid\b/i);
  });

  it("omits an empty tag line and still keeps the title", () => {
    const text = formatIdeaCopyText({
      title: "  ",
      body: "",
      stage: "spark",
      tags: [],
    });
    expect(text.startsWith("無題")).toBe(true);
    expect(text).toContain("段階: 着想");
    expect(text).not.toContain("タグ:");
    expect(text).not.toContain("カテゴリ:");
  });

  it("adds a category line when the idea has one", () => {
    const text = formatIdeaCopyText({
      title: "連載",
      body: "週一で短く書く。",
      stage: "spark",
      tags: ["週刊"],
      categoryName: "執筆アイデア",
    });
    expect(text).toContain("カテゴリ: 執筆アイデア");
    expect(text.indexOf("段階: 着想")).toBeLessThan(text.indexOf("カテゴリ: 執筆アイデア"));
    expect(text.indexOf("カテゴリ: 執筆アイデア")).toBeLessThan(text.indexOf("タグ: 週刊"));
  });
});
