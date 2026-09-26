import { describe, expect, it } from "vitest";
import {
  LIST_SORT_DEFAULT,
  listSortSummary,
  nextListSort,
  parseListSort,
  sortIdeas,
} from "../app/lib/list-sort";
import type { MockIdea } from "../app/data/mock";
import { JA } from "../app/i18n/dictionary";

function idea(partial: Partial<MockIdea> & Pick<MockIdea, "id" | "title" | "stage">): MockIdea {
  return {
    body: "",
    tags: [],
    author: "",
    team: "",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    agedDays: 0,
    relatedIds: [],
    commentCount: 0,
    ...partial,
  };
}

describe("list sort helpers", () => {
  it("parses sort keys and falls back to updatedAt desc", () => {
    expect(parseListSort(null, null)).toEqual(LIST_SORT_DEFAULT);
    expect(parseListSort("title", "asc")).toEqual({ key: "title", dir: "asc" });
    expect(parseListSort("nope", "up")).toEqual(LIST_SORT_DEFAULT);
    expect(parseListSort("stage", "desc")).toEqual({ key: "stage", dir: "desc" });
  });

  it("toggles the active column and starts dates desc / labels asc", () => {
    expect(nextListSort(LIST_SORT_DEFAULT, "updatedAt")).toEqual({
      key: "updatedAt",
      dir: "asc",
    });
    expect(nextListSort(LIST_SORT_DEFAULT, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextListSort({ key: "title", dir: "asc" }, "title")).toEqual({
      key: "title",
      dir: "desc",
    });
    expect(nextListSort({ key: "title", dir: "asc" }, "createdAt")).toEqual({
      key: "createdAt",
      dir: "desc",
    });
    expect(nextListSort(LIST_SORT_DEFAULT, "stage")).toEqual({ key: "stage", dir: "asc" });
  });

  it("sorts by createdAt, updatedAt, stage, and title", () => {
    const rows = [
      idea({
        id: "2",
        title: "gamma",
        stage: "ripe",
        createdAt: "2026-09-03T00:00:00Z",
        updatedAt: "2026-09-10T00:00:00Z",
      }),
      idea({
        id: "1",
        title: "alpha",
        stage: "spark",
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-20T00:00:00Z",
      }),
      idea({
        id: "3",
        title: "beta",
        stage: "aging",
        createdAt: "2026-09-02T00:00:00Z",
        updatedAt: "2026-09-05T00:00:00Z",
      }),
    ];
    expect(sortIdeas(rows, { key: "title", dir: "asc" }).map((row) => row.title)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
    expect(sortIdeas(rows, { key: "stage", dir: "asc" }).map((row) => row.stage)).toEqual([
      "spark",
      "aging",
      "ripe",
    ]);
    expect(sortIdeas(rows, { key: "createdAt", dir: "asc" }).map((row) => row.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
    expect(sortIdeas(rows, { key: "updatedAt", dir: "desc" }).map((row) => row.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(listSortSummary(JA, { key: "createdAt", dir: "desc" })).toBe("作成降順");
  });
});
