import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { dictionary } from "../i18n/dictionary";
import { aiErrorMessage } from "./idea-ai";
import { bindResearchAi, researchIdea } from "../../server/ai/research";

export type ResearchIdeaActionData = {
  error?: string;
  ok?: true;
  intent?: "research";
};

export async function researchIdeaAction({ request, params, context }: ActionFunctionArgs) {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return {
      error: dictionary(context.locale).ai.notFound,
      intent: "research",
    } satisfies ResearchIdeaActionData;
  }

  const form = await request.formData();
  const db = createDb(context.cloudflare.env.DB);
  const result = await researchIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
    searchApiKey: context.cloudflare.env.SEARCH_API_KEY,
    locale: context.locale,
  });
  if (!result.ok) {
    return {
      error: aiErrorMessage(dictionary(context.locale), "research", result.code),
      intent: "research",
    } satisfies ResearchIdeaActionData;
  }
  return { ok: true, intent: "research" } satisfies ResearchIdeaActionData;
}
