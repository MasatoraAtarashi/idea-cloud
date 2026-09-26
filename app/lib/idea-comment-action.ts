import { type ActionFunctionArgs } from "react-router";
import { COMMENT_BODY_MAX, insertIdeaComment } from "../../db/comments";
import { getIdeaRow } from "../../db/ideas";
import { resolveCommentAuthor } from "../data/mock";
import { appDb } from "./app-db";

export type CommentIdeaActionData = {
  error?: string;
  intent: "comment";
  ok?: true;
};

export async function commentIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<CommentIdeaActionData> {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "comment" } satisfies CommentIdeaActionData;
  }

  const form = await request.formData();
  const body = String(form.get("body") ?? "").trim();
  if (!body) {
    return { error: "入力してください", intent: "comment" } satisfies CommentIdeaActionData;
  }
  if (body.length > COMMENT_BODY_MAX) {
    return { error: "長すぎます", intent: "comment" } satisfies CommentIdeaActionData;
  }

  const db = appDb(context);
  const idea = await getIdeaRow(db, ideaId);
  if (!idea) {
    return { error: "見つかりません", intent: "comment" } satisfies CommentIdeaActionData;
  }

  await insertIdeaComment(db, ideaId, body, resolveCommentAuthor(context.userEmail));
  return { ok: true, intent: "comment" } satisfies CommentIdeaActionData;
}
