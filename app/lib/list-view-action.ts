import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import {
  countSavedViews,
  deleteSavedView,
  insertSavedView,
  SAVED_VIEW_MAX,
  SAVED_VIEW_NAME_MAX,
} from "../../db/saved-views";
import { listViewHref, omitSavedViewId, parseListViewSearch } from "./list-view-search";

export type ListViewActionData = {
  error: string;
};

export async function listViewAction({
  request,
  context,
}: ActionFunctionArgs): Promise<Response | ListViewActionData> {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const current = parseListViewSearch(new URL(request.url).searchParams);
  const db = createDb(context.cloudflare.env.DB);

  if (intent === "save-view") {
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      return { error: "名前を入力してください" } satisfies ListViewActionData;
    }
    if (name.length > SAVED_VIEW_NAME_MAX) {
      return { error: "名前が長すぎます" } satisfies ListViewActionData;
    }
    if ((await countSavedViews(db)) >= SAVED_VIEW_MAX) {
      return { error: "ビューが多すぎます" } satisfies ListViewActionData;
    }
    const created = await insertSavedView(db, name, omitSavedViewId(current));
    return redirect(listViewHref({ ...omitSavedViewId(current), savedViewId: created.id }));
  }

  if (intent === "delete-view") {
    const viewId = Number(form.get("viewId") ?? "");
    if (!Number.isInteger(viewId) || viewId <= 0) {
      return { error: "見つかりません" } satisfies ListViewActionData;
    }
    const deleted = await deleteSavedView(db, viewId);
    if (!deleted) {
      return { error: "見つかりません" } satisfies ListViewActionData;
    }
    const next = current.savedViewId === viewId ? { ...current, savedViewId: null } : current;
    return redirect(listViewHref(next));
  }

  return { error: "操作が不正です" } satisfies ListViewActionData;
}
