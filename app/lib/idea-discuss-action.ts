import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { dictionary } from "../i18n/dictionary";
import { discussIdea } from "../../server/ai/discuss";
import { bindResearchAi } from "../../server/ai/research";

export type DiscussIdeaActionData = {
  error?: string;
  intent: "discuss";
  ok?: true;
};

export async function discussIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<DiscussIdeaActionData> {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return {
      error: dictionary(context.locale).ai.notFound,
      intent: "discuss",
    } satisfies DiscussIdeaActionData;
  }

  const form = await request.formData();
  const db = createDb(context.cloudflare.env.DB);
  const result = await discussIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    body: String(form.get("body") ?? ""),
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
  });
  if (!result.ok) {
    return { error: result.error, intent: "discuss" } satisfies DiscussIdeaActionData;
  }
  return { ok: true, intent: "discuss" } satisfies DiscussIdeaActionData;
}
