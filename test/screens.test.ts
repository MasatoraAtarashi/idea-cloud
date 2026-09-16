import { describe, expect, it } from "vitest";
import {
  EMPTY_IDEAS_BODY,
  EMPTY_IDEAS_TITLE,
  EMPTY_MERGE_BODY,
  EMPTY_RESEARCH_BODY,
  EMPTY_TEAM_BODY,
  IDEAS,
  MEMBERS,
  STAGES,
} from "../app/data/mock";

describe("product fixtures stay empty", () => {
  it("has no dummy ideas, authors, or members", () => {
    expect(IDEAS).toEqual([]);
    expect(MEMBERS).toEqual([]);
    expect(STAGES).toEqual(["spark", "aging", "ripe", "selected", "archived"]);
  });

  it("exports empty-state copy instead of fixture titles", () => {
    expect(EMPTY_IDEAS_TITLE).toBe("まだアイデアがありません");
    expect(EMPTY_IDEAS_BODY).toBe("キャプチャから着想を置いてください。");
    expect(EMPTY_MERGE_BODY).toBe("融合するアイデアがまだありません。");
    expect(EMPTY_RESEARCH_BODY).toBe("採用したアイデアがまだありません。");
    expect(EMPTY_TEAM_BODY).toBe("メンバーはまだいません。");
  });
});
