import { redirect, type ActionFunctionArgs } from "react-router";
import { deleteIdea } from "../../db/ideas";
import { dictionary } from "../i18n/dictionary";
import { LIST_PATH } from "./home-path";
import { appDb } from "./app-db";

export type DeleteIdeaActionData = {
  error: string;
  intent: "delete";
};

export async function deleteIdeaAction({
  params,
  request,
  context,
}: ActionFunctionArgs): Promise<DeleteIdeaActionData | Response> {
  const t = dictionary(context.locale);
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: t.idea.errors.notFound, intent: "delete" };
  }
  const form = await request.clone().formData();
  const db = appDb(context);
  const deleted = await deleteIdea(db, ideaId);
  if (!deleted) {
    return { error: t.idea.errors.notFound, intent: "delete" };
  }
  const redirectTo = String(form.get("redirectTo") ?? "").trim();
  const ideaPath = `/app/ideas/${ideaId}`;
  if (
    redirectTo.startsWith("/app") &&
    redirectTo !== ideaPath &&
    !redirectTo.startsWith(`${ideaPath}?`) &&
    !redirectTo.startsWith(`${ideaPath}#`)
  ) {
    return redirect(redirectTo);
  }
  return redirect(LIST_PATH);
}
