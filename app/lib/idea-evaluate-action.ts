import { type ActionFunctionArgs } from "react-router";
import { bindResearchAi } from "../../server/ai/research";
import { evaluateIdea } from "../../server/ai/evaluate";
import { typesafeApiKeyFromEnv } from "../../server/ai/typesafe";
import { appDb } from "./app-db";

export type EvaluateIdeaActionData = {
  error?: string;
  intent: "evaluate";
  ok?: true;
};

export async function evaluateIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<EvaluateIdeaActionData> {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "evaluate" } satisfies EvaluateIdeaActionData;
  }

  const form = await request.formData();
  const db = appDb(context);
  const result = await evaluateIdea({
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId,
    preset: String(form.get("preset") ?? ""),
    model: String(form.get("model") ?? ""),
    typesafeApiKey: typesafeApiKeyFromEnv(context.cloudflare.env),
  });
  if (!result.ok) {
    return { error: result.error, intent: "evaluate" } satisfies EvaluateIdeaActionData;
  }
  return { ok: true, intent: "evaluate" } satisfies EvaluateIdeaActionData;
}
