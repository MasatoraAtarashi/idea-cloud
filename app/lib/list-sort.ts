import { STAGES, type MockIdea, type Stage } from "../data/mock";
import type { Dictionary } from "../i18n/dictionary";

export const LIST_SORT_KEYS = ["updatedAt", "createdAt", "stage", "title"] as const;
export type ListSortKey = (typeof LIST_SORT_KEYS)[number];
export type ListSortDir = "asc" | "desc";

export type ListSort = {
  key: ListSortKey;
  dir: ListSortDir;
};

export const LIST_SORT_DEFAULT: ListSort = { key: "updatedAt", dir: "desc" };

const STAGE_RANK: Record<Stage, number> = {
  spark: 0,
  aging: 1,
  ripe: 2,
  selected: 3,
  archived: 4,
};

function isSortKey(value: string): value is ListSortKey {
  return (LIST_SORT_KEYS as readonly string[]).includes(value);
}

export function parseListSort(rawKey: string | null, rawDir: string | null): ListSort {
  const key = rawKey && isSortKey(rawKey) ? rawKey : LIST_SORT_DEFAULT.key;
  const dir = rawDir === "asc" || rawDir === "desc" ? rawDir : LIST_SORT_DEFAULT.dir;
  return { key, dir };
}

export function isDefaultListSort(sort: ListSort): boolean {
  return sort.key === LIST_SORT_DEFAULT.key && sort.dir === LIST_SORT_DEFAULT.dir;
}

/** First click on a new column: title/stage ascend, dates descend. Second click flips. */
export function nextListSort(current: ListSort, key: ListSortKey): ListSort {
  if (current.key !== key) {
    return { key, dir: key === "title" || key === "stage" ? "asc" : "desc" };
  }
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}

function timeMs(value: string): number {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function compareValues(a: MockIdea, b: MockIdea, key: ListSortKey): number {
  if (key === "title") {
    return a.title.localeCompare(b.title, "ja");
  }
  if (key === "stage") {
    return (STAGE_RANK[a.stage] ?? STAGES.length) - (STAGE_RANK[b.stage] ?? STAGES.length);
  }
  if (key === "createdAt") {
    return timeMs(a.createdAt) - timeMs(b.createdAt);
  }
  return timeMs(a.updatedAt) - timeMs(b.updatedAt);
}

export function sortIdeas(ideas: MockIdea[], sort: ListSort): MockIdea[] {
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...ideas].sort((a, b) => {
    const delta = compareValues(a, b, sort.key);
    if (delta !== 0) return delta * sign;
    const idDelta = Number(a.id) - Number(b.id);
    if (!Number.isNaN(idDelta) && idDelta !== 0) return idDelta;
    return a.id.localeCompare(b.id);
  });
}

export function listSortSummary(t: Dictionary, sort: ListSort): string {
  const dir = sort.dir === "asc" ? t.list.sort.asc : t.list.sort.desc;
  return `${t.list.sort.key[sort.key]}${dir}`;
}
