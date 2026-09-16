import { describe, expect, it } from "vitest";
import { MOBILE_NAV } from "../app/nav";
import {
  allTags,
  filterIdeas,
  IDEAS,
  MEMBERS,
  SESSION_USER,
  STAGE_LABEL,
  STAGES,
  type MockIdea,
} from "../app/data/mock";

describe("empty workspace data", () => {
  it("ships no preloaded ideas or invented teammates", () => {
    expect(IDEAS).toEqual([]);
    expect(MEMBERS).toEqual([]);
    expect(allTags()).toEqual([]);
    expect(SESSION_USER.label).toBe("ログイン中");
  });

  it("keeps Japanese aging stages for filters and empty board columns", () => {
    expect([...STAGES]).toEqual(["spark", "aging", "ripe", "selected", "archived"]);
    expect(STAGE_LABEL.spark).toBe("着想");
    expect(STAGE_LABEL.aging).toBe("熟成中");
    expect(STAGE_LABEL.ripe).toBe("熟した");
    expect(STAGE_LABEL.selected).toBe("採用");
    expect(STAGE_LABEL.archived).toBe("アーカイブ");
  });

  it("filters ephemeral ideas without relying on shipped rows", () => {
    const sample: MockIdea[] = [
      {
        id: "tmp",
        title: "一時データ",
        body: "テスト用",
        stage: "spark",
        tags: ["検証"],
        author: "",
        team: "",
        createdAt: "2026-09-16",
        agedDays: 0,
        relatedIds: [],
      },
    ];
    expect(filterIdeas(sample, { query: "一時", stages: ["spark"], tags: [] })).toHaveLength(1);
    expect(filterIdeas(sample, { query: "ない", stages: [], tags: [] })).toHaveLength(0);
    expect(filterIdeas(sample, { query: "", stages: ["ripe"], tags: [] })).toHaveLength(0);
  });

  it("puts capture first on mobile nav", () => {
    expect(MOBILE_NAV[0]?.to).toBe("/app/capture");
    expect(MOBILE_NAV.map((item) => item.label)).toEqual(["取る", "一覧", "融合", "研究", "設定"]);
  });
});
