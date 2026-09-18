import { Form, Link, useActionData } from "react-router";
import type { ListViewActionData } from "../lib/list-view-action";
import {
  filtersEqual,
  listViewHref,
  omitSavedViewId,
  SAVED_VIEW_NAME_MAX,
  type ListViewSearch,
  type SavedViewItem,
} from "../lib/list-view-search";

export function ListSavedViews({
  views,
  state,
  nameFieldId = "saved-view-name",
}: {
  views: SavedViewItem[];
  state: ListViewSearch;
  nameFieldId?: string;
}) {
  const actionData = useActionData() as ListViewActionData | undefined;
  const currentFilters = omitSavedViewId(state);
  const active = views.find((view) => filtersEqual(view.filters, currentFilters));
  const summary = active?.name ?? (state.savedViewId ? "ビュー" : "カスタム");

  return (
    <details className="ui-menu relative">
      <summary
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border-control bg-card px-2.5 text-[13px]"
        aria-label="ビュー"
      >
        <span className="text-muted-foreground">ビュー</span>
        <span className="max-w-[9rem] truncate font-medium">{summary}</span>
      </summary>
      <div className="ui-float absolute left-0 z-20 mt-1 w-64 py-1">
        <Link
          to={listViewHref({
            tab: "all",
            view: state.view,
            query: "",
            stages: [],
            tags: [],
            savedViewId: null,
          })}
          preventScrollReset
          className="block px-3 py-1.5 text-[13px] text-foreground no-underline hover:bg-row-hover"
        >
          すべてのアイデア
        </Link>
        {views.length === 0 ? (
          <p className="px-3 py-1.5 text-[12px] text-muted-foreground">まだビューはありません</p>
        ) : (
          views.map((view) => (
            <div key={view.id} className="flex items-center gap-1 pr-1">
              <Link
                to={listViewHref({ ...view.filters, savedViewId: view.id })}
                preventScrollReset
                aria-current={active?.id === view.id ? "page" : undefined}
                className={`min-w-0 flex-1 truncate px-3 py-1.5 text-[13px] no-underline hover:bg-row-hover ${
                  active?.id === view.id ? "font-medium text-foreground" : "text-foreground"
                }`}
              >
                {view.name}
              </Link>
              <Form method="post">
                <input type="hidden" name="intent" value="delete-view" />
                <input type="hidden" name="viewId" value={view.id} />
                <button
                  type="submit"
                  className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-row-hover hover:text-foreground"
                  aria-label={`${view.name}を削除`}
                >
                  削除
                </button>
              </Form>
            </div>
          ))
        )}
        <div className="border-t border-border my-1" />
        <Form method="post" className="px-3 py-2">
          <input type="hidden" name="intent" value="save-view" />
          <label className="sr-only" htmlFor={nameFieldId}>
            ビュー名
          </label>
          <input
            id={nameFieldId}
            name="name"
            maxLength={SAVED_VIEW_NAME_MAX}
            placeholder="現在の絞り込みを保存"
            className="ui-input h-8 text-[13px]"
          />
          <button type="submit" className="ui-btn-secondary mt-1.5 h-8 w-full text-[12.5px]">
            ビューを保存
          </button>
          {actionData?.error ? (
            <p className="mt-1.5 text-[12px] text-danger">{actionData.error}</p>
          ) : (
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              段階・タグ・検索を名前付きで残せます
            </p>
          )}
        </Form>
      </div>
    </details>
  );
}
