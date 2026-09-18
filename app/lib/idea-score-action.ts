import { type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { saveHumanScore } from "../../db/ideas";
import { HUMAN_SCORE_NOTE_MAX, parseScore } from "./scores";

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
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "human-score" } satisfies HumanScoreActionData;
  }

  const form = await request.formData();
  const score = parseScore(form.get("score"));
  if (score === null) {
    return {
      error: "1から5で選んでください",
      intent: "human-score",
    } satisfies HumanScoreActionData;
  }
  const note = String(form.get("note") ?? "").trim();
  if (note.length > HUMAN_SCORE_NOTE_MAX) {
    return { error: "メモが長すぎます", intent: "human-score" } satisfies HumanScoreActionData;
  }

  const db = createDb(context.cloudflare.env.DB);
  const updated = await saveHumanScore(db, ideaId, { score, note });
  if (!updated) {
    return { error: "見つかりません", intent: "human-score" } satisfies HumanScoreActionData;
  }
  return { ok: true, intent: "human-score" } satisfies HumanScoreActionData;
}
