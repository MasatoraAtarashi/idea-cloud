import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  parseListViewSearch,
  patchListViewSearch,
  serializeListViewSearch,
  listViewHref,
  type ListViewSearch,
} from "./list-view-search";

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
