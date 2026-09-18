import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { bindResearchAi, researchIdea } from "../../server/ai/research";

export type ResearchIdeaActionData = {
  error: string;
};

export async function researchIdeaAction({ request, params, context }: ActionFunctionArgs) {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません" } satisfies ResearchIdeaActionData;
  }

  const form = await request.formData();
  const db = createDb(context.cloudflare.env.DB);
  const result = await researchIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
  });
  if (!result.ok) {
    return { error: result.error } satisfies ResearchIdeaActionData;
  }
  return redirect(`/app/ideas/${ideaId}#research`);
}
