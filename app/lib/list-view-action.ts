import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { dictionary } from "../i18n/dictionary";
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
  const t = dictionary(context.locale);

  if (intent === "save-view") {
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      return { error: t.list.savedViews.errorNameRequired } satisfies ListViewActionData;
    }
    if (name.length > SAVED_VIEW_NAME_MAX) {
      return { error: t.list.savedViews.errorNameTooLong } satisfies ListViewActionData;
    }
    if ((await countSavedViews(db)) >= SAVED_VIEW_MAX) {
      return { error: t.list.savedViews.errorTooMany } satisfies ListViewActionData;
    }
    const created = await insertSavedView(db, name, omitSavedViewId(current));
    return redirect(listViewHref({ ...omitSavedViewId(current), savedViewId: created.id }));
  }

  if (intent === "delete-view") {
    const viewId = Number(form.get("viewId") ?? "");
    if (!Number.isInteger(viewId) || viewId <= 0) {
      return { error: t.list.savedViews.errorNotFound } satisfies ListViewActionData;
    }
    const deleted = await deleteSavedView(db, viewId);
    if (!deleted) {
      return { error: t.list.savedViews.errorNotFound } satisfies ListViewActionData;
    }
    const next = current.savedViewId === viewId ? { ...current, savedViewId: null } : current;
    return redirect(listViewHref(next));
  }

  return { error: t.list.savedViews.errorBadIntent } satisfies ListViewActionData;
}
