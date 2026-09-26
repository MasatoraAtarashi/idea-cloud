import { type ActionFunctionArgs } from "react-router";
import { saveIdeaReview } from "../../db/ideas";
import { dictionary } from "../i18n/dictionary";
import { parseReviewStatus } from "./review";
import { appDb } from "./app-db";

export type ReviewIdeaActionData = {
  error?: string;
  intent: "review";
  ok?: true;
};

export async function reviewIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<ReviewIdeaActionData> {
  const t = dictionary(context.locale);
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: t.idea.errors.notFound, intent: "review" } satisfies ReviewIdeaActionData;
  }

  const form = await request.formData();
  const status = parseReviewStatus(form.get("reviewStatus"));
  if (status === "none") {
    return {
      error: t.idea.errors.invalidReviewStatus,
      intent: "review",
    } satisfies ReviewIdeaActionData;
  }

  const db = appDb(context);
  const updated = await saveIdeaReview(db, ideaId, status);
  if (!updated) {
    return { error: t.idea.errors.notFound, intent: "review" } satisfies ReviewIdeaActionData;
  }
  return { ok: true, intent: "review" } satisfies ReviewIdeaActionData;
}
