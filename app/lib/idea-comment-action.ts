import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { COMMENT_BODY_MAX, insertIdeaComment } from "../../db/comments";
import { getIdeaRow } from "../../db/ideas";
import { resolveCommentAuthor } from "../data/mock";
import { dictionary } from "../i18n/dictionary";

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
  const t = dictionary(context.locale);
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: t.idea.errors.notFound, intent: "comment" } satisfies CommentIdeaActionData;
  }

  const form = await request.formData();
  const body = String(form.get("body") ?? "").trim();
  if (!body) {
    return { error: t.idea.errors.required, intent: "comment" } satisfies CommentIdeaActionData;
  }
  if (body.length > COMMENT_BODY_MAX) {
    return { error: t.idea.errors.tooLong, intent: "comment" } satisfies CommentIdeaActionData;
  }

  const db = createDb(context.cloudflare.env.DB);
  const idea = await getIdeaRow(db, ideaId);
  if (!idea) {
    return { error: t.idea.errors.notFound, intent: "comment" } satisfies CommentIdeaActionData;
  }

  await insertIdeaComment(db, ideaId, body, resolveCommentAuthor(context.userEmail));
  return { ok: true, intent: "comment" } satisfies CommentIdeaActionData;
}
