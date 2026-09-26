import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { saveIdeaReflection } from "../../db/ideas";
import { dictionary } from "../i18n/dictionary";
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
  const t = dictionary(context.locale);
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return {
      error: t.idea.errors.notFound,
      intent: "reflection",
    } satisfies ReflectionIdeaActionData;
  }

  const form = await request.formData();
  const outcome = String(form.get("outcome") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const status = parseReflectionStatus(form.get("reflectionStatus"));
  if (outcome.length > REFLECTION_OUTCOME_MAX) {
    return {
      error: t.idea.errors.outcomeTooLong,
      intent: "reflection",
    } satisfies ReflectionIdeaActionData;
  }
  if (notes.length > REFLECTION_NOTES_MAX) {
    return {
      error: t.idea.errors.noteTooLong,
      intent: "reflection",
    } satisfies ReflectionIdeaActionData;
  }

  const db = createDb(context.cloudflare.env.DB);
  const updated = await saveIdeaReflection(db, ideaId, { outcome, status, notes });
  if (!updated) {
    return {
      error: t.idea.errors.notFound,
      intent: "reflection",
    } satisfies ReflectionIdeaActionData;
  }
  return { ok: true, intent: "reflection" } satisfies ReflectionIdeaActionData;
}
