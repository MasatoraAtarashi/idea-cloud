import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { saveIdeaReview } from "../../db/ideas";
import { parseReviewStatus } from "./review";

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
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "review" } satisfies ReviewIdeaActionData;
  }

  const form = await request.formData();
  const status = parseReviewStatus(form.get("reviewStatus"));
  if (status === "none") {
    return { error: "見直し状態が不正です", intent: "review" } satisfies ReviewIdeaActionData;
  }

  const db = createDb(context.cloudflare.env.DB);
  const updated = await saveIdeaReview(db, ideaId, status);
  if (!updated) {
    return { error: "見つかりません", intent: "review" } satisfies ReviewIdeaActionData;
  }
  return { ok: true, intent: "review" } satisfies ReviewIdeaActionData;
}
