import { describe, expect, it } from "vitest";
import { buildIdeaHistory, historyExcerpt } from "../app/lib/idea-history";
import type { MockIdea } from "../app/data/mock";

function idea(overrides: Partial<MockIdea> = {}): MockIdea {
  return {
    id: "1",
    title: "見出し",
    body: "本文",
    stage: "spark",
    tags: [],
    author: "",
    team: "",
    createdAt: "2026-09-16",
    updatedAt: "2026-09-16",
    agedDays: 0,
    relatedIds: [],
    commentCount: 0,
    ...overrides,
  };
}

describe("historyExcerpt", () => {
  it("collapses whitespace and truncates", () => {
    expect(historyExcerpt("  短い  ")).toBe("短い");
    expect(historyExcerpt("あ".repeat(80)).endsWith("…")).toBe(true);
    expect(historyExcerpt("あ".repeat(80)).length).toBe(73);
  });
});

describe("buildIdeaHistory", () => {
  it("returns empty when nothing is stored", () => {
    expect(buildIdeaHistory(idea())).toEqual([]);
  });

  it("surfaces latest-only research and evaluation from the idea row", () => {
    const items = buildIdeaHistory(
      idea({
        researchNotes: "観点:\n- 通勤",
        researchModel: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
        researchedAt: "2026-09-18 10:00:00",
        aiEvaluation: "強み:\n- 速い",
        aiScore: 4,
        aiEvaluatedAt: "2026-09-19 09:00:00",
        aiEvaluationModel: "jev-latest",
      }),
    );
    expect(items.map((item) => item.kind)).toEqual(["evaluate", "research"]);
    expect(items[0]?.latestOnly).toBe(true);
    expect(items[0]?.score).toBe(4);
    expect(items[0]?.anchor).toBe("evaluate");
    expect(items[1]?.latestOnly).toBe(true);
    expect(items[1]?.id).toBe("research-latest");
    expect(items[1]?.summary).toContain("Web検索未取得");
    expect(items[1]?.sources?.status).toBe("failed");
  });

  it("lists every brainstorm row newest first", () => {
    const items = buildIdeaHistory(idea(), [
      {
        id: "1",
        notes: "古い展開",
        model: "@cf/qwen/qwen3-30b-a3b-fp8",
        createdAt: "2026-09-17 08:00:00",
      },
      {
        id: "2",
        notes: "新しい展開",
        model: "@cf/qwen/qwen3-30b-a3b-fp8",
        createdAt: "2026-09-18 08:00:00",
      },
    ]);
    expect(items.map((item) => item.id)).toEqual(["brainstorm-2", "brainstorm-1"]);
    expect(items[0]?.anchor).toBe("brainstorm");
    expect(items[1]?.anchor).toBeUndefined();
    expect(items.every((item) => item.latestOnly === false)).toBe(true);
  });

  it("falls back to the idea’s latest brainstorm when no rows are passed", () => {
    const items = buildIdeaHistory(
      idea({
        brainstormNotes: "切り口:\n- 別案",
        brainstormModel: "@cf/qwen/qwen3-30b-a3b-fp8",
        brainstormedAt: "2026-09-18 12:00:00",
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("brainstorm-latest");
    expect(items[0]?.anchor).toBe("brainstorm");
  });

  it("does not duplicate brainstorms when both the table and idea snapshot exist", () => {
    const items = buildIdeaHistory(
      idea({
        brainstormNotes: "最新",
        brainstormedAt: "2026-09-18 12:00:00",
      }),
      [
        {
          id: "9",
          notes: "最新",
          model: "@cf/qwen/qwen3-30b-a3b-fp8",
          createdAt: "2026-09-18 12:00:00",
        },
      ],
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("brainstorm-9");
  });

  it("sorts mixed kinds by timestamp newest first", () => {
    const items = buildIdeaHistory(
      idea({
        researchNotes: "調査",
        researchedAt: "2026-09-16 10:00:00",
        aiEvaluation: "評価",
        aiEvaluatedAt: "2026-09-18 10:00:00",
      }),
      [
        {
          id: "3",
          notes: "展開",
          model: "@cf/qwen/qwen3-30b-a3b-fp8",
          createdAt: "2026-09-17 10:00:00",
        },
      ],
    );
    expect(items.map((item) => item.kind)).toEqual(["evaluate", "brainstorm", "research"]);
  });

  it("lists 先行事例 on the research snapshot when URLs exist", () => {
    const items = buildIdeaHistory(
      idea({
        researchNotes: "観点:\n- 既存",
        researchedAt: "2026-09-21 10:00:00",
        researchSources: {
          status: "ok",
          query: "既存 先行事例",
          results: [
            {
              title: "事例",
              url: "https://example.com/prior",
              snippet: "短い説明",
            },
          ],
        },
      }),
    );
    expect(items[0]?.summary).toContain("先行事例1件");
    expect(items[0]?.sources?.results[0]?.url).toBe("https://example.com/prior");
  });
});
