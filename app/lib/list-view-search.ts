import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { STAGES, type Stage } from "../data/mock";
import { LIST_PATH } from "./home-path";

export type ListTab = "all" | "aging-shelf";
export type ListLayout = "table" | "board";

export type ListViewSearch = {
  tab: ListTab;
  view: ListLayout;
  query: string;
  stages: Stage[];
  tags: string[];
};

export const LIST_VIEW_DEFAULTS: ListViewSearch = {
  tab: "all",
  view: "table",
  query: "",
  stages: [],
  tags: [],
};

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
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

export function parseListViewSearch(params: URLSearchParams): ListViewSearch {
  const tabRaw = params.get("tab");
  const tab: ListTab = tabRaw === "aging" || tabRaw === "aging-shelf" ? "aging-shelf" : "all";
  const viewRaw = params.get("view");
  const view: ListLayout = viewRaw === "board" ? "board" : "table";
  return {
    tab,
    view,
    query: params.get("q") ?? "",
    stages: readList(params, "stage").filter(isStage),
    tags: readList(params, "tag"),
  };
}

export function serializeListViewSearch(state: ListViewSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab === "aging-shelf") params.set("tab", "aging");
  if (state.view === "board") params.set("view", "board");
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.stages.length > 0) params.set("stage", state.stages.join(","));
  if (state.tags.length > 0) params.set("tag", state.tags.join(","));
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
  return { ...current, ...patch };
}

export function useListViewSearch() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseListViewSearch(params), [params]);

  const hrefFor = useCallback(
    (patch: Partial<ListViewSearch>) => listViewHref(patchListViewSearch(state, patch)),
    [state],
  );

  const update = useCallback(
    (patch: Partial<ListViewSearch>, options?: { replace?: boolean }) => {
      setParams(
        (current) =>
          serializeListViewSearch(patchListViewSearch(parseListViewSearch(current), patch)),
        { preventScrollReset: true, replace: options?.replace === true },
      );
    },
    [setParams],
  );

  return { ...state, hrefFor, update };
}
