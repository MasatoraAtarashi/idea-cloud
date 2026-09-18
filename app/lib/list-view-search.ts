import { STAGES, type Stage } from "../data/mock";
import { LIST_PATH } from "./home-path";

export type ListTab = "all" | "aging-shelf";
export type ListLayout = "table" | "board";

export type SavedViewFilters = {
  tab: ListTab;
  view: ListLayout;
  query: string;
  stages: Stage[];
  tags: string[];
};

export type ListViewSearch = SavedViewFilters & {
  savedViewId: number | null;
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
  savedViewId: null,
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

export function normalizeSavedViewFilters(input: Partial<SavedViewFilters>): SavedViewFilters {
  return {
    tab: input.tab === "aging-shelf" ? "aging-shelf" : "all",
    view: input.view === "board" ? "board" : "table",
    query: (input.query ?? "").trim(),
    stages: unique((input.stages ?? []).filter(isStage)),
    tags: unique((input.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  };
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
    tab: rec.tab === "aging-shelf" ? "aging-shelf" : "all",
    view: rec.view === "board" ? "board" : "table",
    query: typeof rec.query === "string" ? rec.query : "",
    stages: asStringArray(rec.stages).filter(isStage),
    tags: asStringArray(rec.tags),
  });
}

export function omitSavedViewId(state: ListViewSearch): SavedViewFilters {
  return {
    tab: state.tab,
    view: state.view,
    query: state.query,
    stages: state.stages,
    tags: state.tags,
  };
}

export function parseListViewSearch(params: URLSearchParams): ListViewSearch {
  const tabRaw = params.get("tab");
  const tab: ListTab = tabRaw === "aging" || tabRaw === "aging-shelf" ? "aging-shelf" : "all";
  const viewRaw = params.get("view");
  const view: ListLayout = viewRaw === "board" ? "board" : "table";
  const viewIdRaw = params.get("v");
  const savedViewId =
    viewIdRaw && /^\d+$/.test(viewIdRaw) && Number(viewIdRaw) > 0 ? Number(viewIdRaw) : null;
  return {
    tab,
    view,
    query: params.get("q") ?? "",
    stages: readList(params, "stage").filter(isStage),
    tags: readList(params, "tag"),
    savedViewId,
  };
}

export function serializeListViewSearch(state: ListViewSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab === "aging-shelf") params.set("tab", "aging");
  if (state.view === "board") params.set("view", "board");
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.stages.length > 0) params.set("stage", state.stages.join(","));
  if (state.tags.length > 0) params.set("tag", state.tags.join(","));
  if (state.savedViewId && state.savedViewId > 0) params.set("v", String(state.savedViewId));
  return params;
}

export function listViewHref(state: ListViewSearch): string {
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
