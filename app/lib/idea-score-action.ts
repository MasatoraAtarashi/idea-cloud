import { type ActionFunctionArgs } from "react-router";
import { saveHumanScore } from "../../db/ideas";
import { dictionary } from "../i18n/dictionary";
import { HUMAN_SCORE_NOTE_MAX, parseScore } from "./scores";
import { appDb } from "./app-db";

export type HumanScoreActionData = {
  error?: string;
  intent: "human-score";
  ok?: true;
};

export async function humanScoreIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<HumanScoreActionData> {
  const t = dictionary(context.locale);
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: t.idea.errors.notFound, intent: "human-score" } satisfies HumanScoreActionData;
  }

  const form = await request.formData();
  const score = parseScore(form.get("score"));
  if (score === null) {
    return {
      error: t.idea.errors.scoreRange,
      intent: "human-score",
    } satisfies HumanScoreActionData;
  }
  const note = String(form.get("note") ?? "").trim();
  if (note.length > HUMAN_SCORE_NOTE_MAX) {
    return {
      error: t.idea.errors.noteTooLong,
      intent: "human-score",
    } satisfies HumanScoreActionData;
  }

  const db = appDb(context);
  const updated = await saveHumanScore(db, ideaId, { score, note });
  if (!updated) {
    return { error: t.idea.errors.notFound, intent: "human-score" } satisfies HumanScoreActionData;
  }
  return { ok: true, intent: "human-score" } satisfies HumanScoreActionData;
}
