import { STAGES, type Stage } from "../data/mock";
import { LIST_PATH } from "./home-path";
import { isDefaultListSort, parseListSort, type ListSortDir, type ListSortKey } from "./list-sort";
import { CANDIDATE_DEFAULT_DAYS } from "./review";

export type ListTab = "all" | "aging-shelf" | "candidates" | "tried";
export type ListLayout = "table" | "board";

export const LIST_TABS: ListTab[] = ["all", "aging-shelf", "candidates", "tried"];

export const AGED_DAYS_PARAM = "days";

export type SavedViewFilters = {
  tab: ListTab;
  view: ListLayout;
  query: string;
  stages: Stage[];
  tags: string[];
  minDays: number;
  categoryId: number | null;
};

export type ListViewSearch = SavedViewFilters & {
  savedViewId: number | null;
  sortKey: ListSortKey;
  sortDir: ListSortDir;
};

export type SavedViewItem = {
  id: number;
  name: string;
  filters: SavedViewFilters;
  createdAt: string;
};

export const LIST_VIEW_DEFAULTS: ListViewSearch = {
  tab: "all",
  view: "table",
  query: "",
  stages: [],
  tags: [],
  minDays: 0,
  categoryId: null,
  savedViewId: null,
  sortKey: "updatedAt",
  sortDir: "desc",
};

export const SAVED_VIEW_NAME_MAX = 40;
export const SAVED_VIEW_MAX = 50;

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

function unique<T extends string>(values: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function readList(params: URLSearchParams, key: string): string[] {
  return unique(
    params
      .getAll(key)
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return unique(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );
}

export function parseListTab(raw: unknown): ListTab {
  if (raw === "aging" || raw === "aging-shelf") return "aging-shelf";
  if (raw === "candidates" || raw === "candidate") return "candidates";
  if (raw === "tried" || raw === "tried-ideas") return "tried";
  return "all";
}

export function normalizeSavedViewFilters(input: Partial<SavedViewFilters>): SavedViewFilters {
  const tab = parseListTab(input.tab);
  const minDays = normalizeMinDays(input.minDays);
  return {
    tab,
    view: input.view === "board" ? "board" : "table",
    query: (input.query ?? "").trim(),
    stages: unique((input.stages ?? []).filter(isStage)),
    tags: unique((input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
    minDays: tab === "candidates" && minDays === 0 ? CANDIDATE_DEFAULT_DAYS : minDays,
    categoryId: normalizeCategoryId(input.categoryId),
  };
}

function normalizeCategoryId(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function normalizeMinDays(value: unknown): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isInteger(n) || n <= 0) return 0;
  return n;
}

export function parseSavedViewFilters(raw: unknown): SavedViewFilters {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      value = {};
    }
  }
  if (!value || typeof value !== "object") {
    return normalizeSavedViewFilters({});
  }
  const rec = value as Record<string, unknown>;
  return normalizeSavedViewFilters({
    tab: parseListTab(rec.tab),
    view: rec.view === "board" ? "board" : "table",
    query: typeof rec.query === "string" ? rec.query : "",
    stages: asStringArray(rec.stages).filter(isStage),
    tags: asStringArray(rec.tags),
    minDays: normalizeMinDays(rec.minDays ?? rec.days),
    categoryId: normalizeCategoryId(rec.categoryId),
  });
}

export function omitSavedViewId(state: ListViewSearch): SavedViewFilters {
  return {
    tab: state.tab,
    view: state.view,
    query: state.query,
    stages: state.stages,
    tags: state.tags,
    minDays: state.minDays,
    categoryId: state.categoryId,
  };
}

export function parseListViewSearch(params: URLSearchParams): ListViewSearch {
  const tab = parseListTab(params.get("tab"));
  const viewRaw = params.get("view");
  const view: ListLayout = viewRaw === "board" ? "board" : "table";
  const viewIdRaw = params.get("v");
  const savedViewId =
    viewIdRaw && /^\d+$/.test(viewIdRaw) && Number(viewIdRaw) > 0 ? Number(viewIdRaw) : null;
  const minDaysRaw = normalizeMinDays(params.get(AGED_DAYS_PARAM));
  const sort = parseListSort(params.get("sort"), params.get("dir"));
  return {
    tab,
    view,
    query: params.get("q") ?? "",
    stages: readList(params, "stage").filter(isStage),
    tags: readList(params, "tag"),
    minDays: tab === "candidates" && minDaysRaw === 0 ? CANDIDATE_DEFAULT_DAYS : minDaysRaw,
    categoryId: normalizeCategoryId(params.get("category")),
    savedViewId,
    sortKey: sort.key,
    sortDir: sort.dir,
  };
}

export function serializeListViewSearch(
  state: SavedViewFilters & Partial<Pick<ListViewSearch, "savedViewId" | "sortKey" | "sortDir">>,
): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab === "aging-shelf") params.set("tab", "aging");
  if (state.tab === "candidates") params.set("tab", "candidates");
  if (state.tab === "tried") params.set("tab", "tried");
  if (state.view === "board") params.set("view", "board");
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.stages.length > 0) params.set("stage", state.stages.join(","));
  if (state.tags.length > 0) params.set("tag", state.tags.join(","));
  if (state.minDays > 0) params.set(AGED_DAYS_PARAM, String(state.minDays));
  if (state.categoryId && state.categoryId > 0) params.set("category", String(state.categoryId));
  const sortKey = state.sortKey;
  const sortDir = state.sortDir;
  if (sortKey && sortDir && !isDefaultListSort({ key: sortKey, dir: sortDir })) {
    params.set("sort", sortKey);
    params.set("dir", sortDir);
  }
  if (state.savedViewId && state.savedViewId > 0) params.set("v", String(state.savedViewId));
  return params;
}

export function listViewHref(
  state: SavedViewFilters & Partial<Pick<ListViewSearch, "savedViewId" | "sortKey" | "sortDir">>,
): string {
  const search = serializeListViewSearch(state).toString();
  return search ? `${LIST_PATH}?${search}` : LIST_PATH;
}

export function patchListViewSearch(
  current: ListViewSearch,
  patch: Partial<ListViewSearch>,
): ListViewSearch {
  const next = { ...current, ...patch };
  if (!("savedViewId" in patch)) {
    next.savedViewId = null;
  }
  return next;
}

export function filtersEqual(a: SavedViewFilters, b: SavedViewFilters): boolean {
  return (
    serializeListViewSearch({ ...a, savedViewId: null }).toString() ===
    serializeListViewSearch({ ...b, savedViewId: null }).toString()
  );
}

export function isDefaultListFilters(state: SavedViewFilters): boolean {
  return filtersEqual(state, omitSavedViewId(LIST_VIEW_DEFAULTS));
}
