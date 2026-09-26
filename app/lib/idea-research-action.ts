import { type ActionFunctionArgs } from "react-router";
import { bindResearchAi, researchIdea } from "../../server/ai/research";
import { appDb } from "./app-db";

export type ResearchIdeaActionData = {
  error?: string;
  ok?: true;
  intent?: "research";
};

export async function researchIdeaAction({ request, params, context }: ActionFunctionArgs) {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "research" } satisfies ResearchIdeaActionData;
  }

  const form = await request.formData();
  const db = appDb(context);
  const result = await researchIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
    searchApiKey: context.cloudflare.env.SEARCH_API_KEY,
  });
  if (!result.ok) {
    return { error: result.error, intent: "research" } satisfies ResearchIdeaActionData;
  }
  return { ok: true, intent: "research" } satisfies ResearchIdeaActionData;
}
