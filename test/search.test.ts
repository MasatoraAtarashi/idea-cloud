import { describe, expect, it } from "vitest";
import type { MockIdea } from "../app/data/mock";
import {
  flattenSearchResults,
  isSearchShortcut,
  searchKindCounts,
} from "../app/lib/search-palette";
import type { Inspiration } from "../db/schema";
import { excerptAround, normalizeSearchQuery, searchWorkspace } from "../db/search";

function idea(partial: Partial<MockIdea> & Pick<MockIdea, "id" | "title">): MockIdea {
  return {
    body: "",
    stage: "spark",
    tags: [],
    author: "",
    team: "",
    createdAt: "2026-09-20 00:00:00",
    updatedAt: "2026-09-20 00:00:00",
    agedDays: 4,
    relatedIds: [],
    commentCount: 0,
    ...partial,
  };
}

function inspiration(
  partial: Partial<Inspiration> & Pick<Inspiration, "id" | "title">,
): Inspiration {
  return {
    workspaceId: 1,
    url: null,
    memo: "",
    tags: "[]",
    createdAt: "2026-09-20 00:00:00",
    updatedAt: "2026-09-20 00:00:00",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
    ogSiteName: "",
    ogFetchedAt: null,
    ogStatus: "none",
    ...partial,
  };
}

const ideas = [
  idea({ id: "1", title: "寿司ドットコム", tags: ["寿司", "サイト"], stage: "aging", agedDays: 5 }),
  idea({ id: "2", title: "回らない寿司の入門コース", stage: "archived", agedDays: 21 }),
  idea({ id: "3", title: "日本のマナー動画", body: "寿司の食べ方など" }),
  idea({ id: "4", title: "セルフィーおもちゃ" }),
];

describe("searchWorkspace", () => {
  const results = searchWorkspace("寿司", {
    ideas,
    comments: [
      { id: 10, ideaId: 1, body: "「寿司」単体だと検索でかなり不利。" },
      { id: 11, ideaId: 4, body: "関係ない" },
      { id: 12, ideaId: 99, body: "寿司 (orphan)" },
    ],
    inspirations: [
      inspiration({ id: 7, title: "寿司職人の予約サイト", url: "https://www.omakase.in/" }),
      inspiration({ id: 8, title: "無題", url: "https://x.com/", memo: "おもちゃ" }),
    ],
  });

  it("matches ideas by title, tags, and body with a body-only hint", () => {
    expect(results.ideas.map((hit) => hit.id)).toEqual(["1", "2", "3"]);
    expect(results.ideas[0]?.matchedIn).toBeNull();
    expect(results.ideas[2]?.matchedIn).toBe("本文に「寿司」");
  });

  it("matches comments on existing ideas and inspirations and tags", () => {
    expect(results.comments).toEqual([
      {
        id: 10,
        body: "「寿司」単体だと検索でかなり不利。",
        ideaId: "1",
        ideaTitle: "寿司ドットコム",
      },
    ]);
    expect(results.inspirations).toEqual([
      { id: "7", title: "寿司職人の予約サイト", domain: "omakase.in", ogImageUrl: "" },
    ]);
    expect(results.tags).toEqual([{ tag: "寿司", count: 1 }]);
  });

  it("returns nothing for a blank query and caps each group", () => {
    expect(searchWorkspace("  ", { ideas, comments: [], inspirations: [] }).ideas).toEqual([]);
    const many = Array.from({ length: 12 }, (_, i) => idea({ id: String(i), title: `寿司${i}` }));
    expect(
      searchWorkspace("寿司", { ideas: many, comments: [], inspirations: [] }).ideas,
    ).toHaveLength(8);
  });

  it("flattens groups in order and filters by kind", () => {
    const all = flattenSearchResults(results);
    expect(all.map((item) => item.kind)).toEqual([
      "idea",
      "idea",
      "idea",
      "comment",
      "inspiration",
      "tag",
    ]);
    expect(all[0]?.href).toBe("/app/ideas/1");
    expect(all.at(-1)?.href).toBe(`/app/list?tag=${encodeURIComponent("寿司")}`);
    expect(flattenSearchResults(results, "comment")).toHaveLength(1);
    expect(searchKindCounts(results)).toEqual({
      all: 6,
      idea: 3,
      comment: 1,
      inspiration: 1,
      tag: 1,
    });
  });
});

describe("search helpers", () => {
  it("normalizes queries and excerpts around the hit", () => {
    expect(normalizeSearchQuery("  寿司   職人 ")).toBe("寿司 職人");
    expect(excerptAround("a".repeat(80) + "寿司" + "b".repeat(80), "寿司")).toContain("寿司");
  });

  it("treats ⌘K / Ctrl+K as the palette shortcut", () => {
    const base = { metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
    expect(isSearchShortcut({ ...base, key: "k", metaKey: true })).toBe(true);
    expect(isSearchShortcut({ ...base, key: "K", ctrlKey: true })).toBe(true);
    expect(isSearchShortcut({ ...base, key: "k" })).toBe(false);
    expect(isSearchShortcut({ ...base, key: "k", metaKey: true, shiftKey: true })).toBe(false);
  });
});
