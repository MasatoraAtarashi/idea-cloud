import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { dictionary } from "../i18n/dictionary";
import { bindResearchAi } from "../../server/ai/research";
import { brainstormIdea } from "../../server/ai/brainstorm";

export type BrainstormIdeaActionData = {
  error?: string;
  intent: "brainstorm";
  ok?: true;
};

export async function brainstormIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<BrainstormIdeaActionData> {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return {
      error: dictionary(context.locale).ai.notFound,
      intent: "brainstorm",
    } satisfies BrainstormIdeaActionData;
  }

  const form = await request.formData();
  const db = createDb(context.cloudflare.env.DB);
  const result = await brainstormIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
  });
  if (!result.ok) {
    return { error: result.error, intent: "brainstorm" } satisfies BrainstormIdeaActionData;
  }
  return { ok: true, intent: "brainstorm" } satisfies BrainstormIdeaActionData;
}
