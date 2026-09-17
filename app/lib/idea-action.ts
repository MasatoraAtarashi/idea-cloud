import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { IDEA_BODY_MAX, insertIdea } from "../../db/ideas";
import { LIST_PATH } from "./home-path";

export type CreateIdeaActionData = {
  error: string;
  body: string;
};

export async function createIdeaAction({ request, context }: ActionFunctionArgs) {
  const form = await request.formData();
  const body = String(form.get("body") ?? "").trim();
  if (!body) {
    return { error: "入力してください", body } satisfies CreateIdeaActionData;
  }
  if (body.length > IDEA_BODY_MAX) {
    return { error: "長すぎます", body } satisfies CreateIdeaActionData;
  }
  const db = createDb(context.cloudflare.env.DB);
  await insertIdea(db, body);
  return redirect(LIST_PATH);
}
