import { type ActionFunctionArgs } from "react-router";
import { dictionary } from "../i18n/dictionary";
import { aiErrorMessage } from "./idea-ai";
import { bindResearchAi } from "../../server/ai/research";
import { brainstormIdea } from "../../server/ai/brainstorm";
import { appDb } from "./app-db";

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
  const db = appDb(context);
  const result = await brainstormIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
    locale: context.locale,
  });
  if (!result.ok) {
    return {
      error: aiErrorMessage(dictionary(context.locale), "brainstorm", result.code),
      intent: "brainstorm",
    } satisfies BrainstormIdeaActionData;
  }
  return { ok: true, intent: "brainstorm" } satisfies BrainstormIdeaActionData;
}
