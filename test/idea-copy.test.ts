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
  });
});
