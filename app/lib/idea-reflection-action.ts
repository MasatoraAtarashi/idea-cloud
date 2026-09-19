import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { saveIdeaReflection } from "../../db/ideas";
import { REFLECTION_NOTES_MAX, REFLECTION_OUTCOME_MAX, parseReflectionStatus } from "./reflection";

export type ReflectionIdeaActionData = {
  error?: string;
  intent: "reflection";
  ok?: true;
};

export async function reflectionIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<ReflectionIdeaActionData> {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "reflection" } satisfies ReflectionIdeaActionData;
  }

  const form = await request.formData();
  const outcome = String(form.get("outcome") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const status = parseReflectionStatus(form.get("reflectionStatus"));
  if (outcome.length > REFLECTION_OUTCOME_MAX) {
    return { error: "結果が長すぎます", intent: "reflection" } satisfies ReflectionIdeaActionData;
  }
  if (notes.length > REFLECTION_NOTES_MAX) {
    return { error: "メモが長すぎます", intent: "reflection" } satisfies ReflectionIdeaActionData;
  }

  const db = createDb(context.cloudflare.env.DB);
  const updated = await saveIdeaReflection(db, ideaId, { outcome, status, notes });
  if (!updated) {
    return { error: "見つかりません", intent: "reflection" } satisfies ReflectionIdeaActionData;
  }
  return { ok: true, intent: "reflection" } satisfies ReflectionIdeaActionData;
}
