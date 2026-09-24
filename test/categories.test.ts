import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { filterIdeas, type MockIdea } from "../app/data/mock";
import { DEFAULT_CATEGORY_NAMES } from "../app/lib/category";
import { createDb } from "../db/client";
import { listCategories } from "../db/categories";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

type IdeaItem = {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  stage: string;
};

describe("categories", () => {
  it("seeds 執筆 / 事業 / 組織改善", async () => {
    const rows = await listCategories(createDb(env.DB));
    const names = rows.map((row) => row.name);
    for (const name of DEFAULT_CATEGORY_NAMES) {
      expect(names).toContain(name);
    }
  });

  it("stores an optional category on create and can add a new name", async () => {
    const rows = await listCategories(createDb(env.DB));
    const writing = rows.find((row) => row.name === "執筆アイデア");
    expect(writing).toBeTruthy();

    const omitted = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "カテゴリなしの種", tags: ["e2e"] }),
    });
    expect(omitted.status).toBe(201);
    const omittedItem = ((await omitted.json()) as { item: IdeaItem }).item;
    expect(omittedItem.categoryId).toBeNull();
    expect(omittedItem.categoryName).toBeNull();

    const picked = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({
        body: "執筆の種",
        tags: ["e2e"],
        categoryId: writing!.id,
      }),
    });
    expect(picked.status).toBe(201);
    const pickedItem = ((await picked.json()) as { item: IdeaItem }).item;
    expect(pickedItem.categoryId).toBe(writing!.id);
    expect(pickedItem.categoryName).toBe("執筆アイデア");

    const named = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({
        body: "新しい桶",
        tags: ["e2e"],
        categoryName: "実験メモ",
      }),
    });
    expect(named.status).toBe(201);
    const namedItem = ((await named.json()) as { item: IdeaItem }).item;
    expect(namedItem.categoryName).toBe("実験メモ");

    const again = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({
        body: "同じ桶",
        tags: ["e2e"],
        categoryName: "実験メモ",
      }),
    });
    const againItem = ((await again.json()) as { item: IdeaItem }).item;
    expect(againItem.categoryId).toBe(namedItem.categoryId);

    const cleared = await api(`/ideas/${pickedItem.id}`, {
      method: "PATCH",
      body: JSON.stringify({ categoryId: null }),
    });
    expect(cleared.status).toBe(200);
    const clearedItem = ((await cleared.json()) as { item: IdeaItem }).item;
    expect(clearedItem.categoryId).toBeNull();
    expect(clearedItem.stage).toBe("spark");

    const tooLong = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "長いカテゴリ", categoryName: "あ".repeat(41) }),
    });
    expect(tooLong.status).toBe(400);
  });

  it("filters the list by category id without touching tags", () => {
    const sample = [
      {
        id: "1",
        title: "連載",
        body: "",
        stage: "spark",
        tags: ["週刊"],
        categoryId: 2,
        categoryName: "事業アイデア",
        author: "",
        team: "",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        agedDays: 1,
        relatedIds: [],
        commentCount: 0,
      },
      {
        id: "2",
        title: "日記",
        body: "",
        stage: "spark",
        tags: ["週刊"],
        categoryId: null,
        author: "",
        team: "",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        agedDays: 1,
        relatedIds: [],
        commentCount: 0,
      },
    ] satisfies MockIdea[];
    expect(filterIdeas(sample, { query: "", stages: [], tags: [], categoryId: 2 })).toHaveLength(1);
    expect(filterIdeas(sample, { query: "事業", stages: [], tags: [] })).toHaveLength(1);
    expect(filterIdeas(sample, { query: "", stages: [], tags: ["週刊"] })).toHaveLength(2);
  });
});
