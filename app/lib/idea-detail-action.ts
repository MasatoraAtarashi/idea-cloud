import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { asStage, updateIdeaStage } from "../../db/ideas";
import { STAGES } from "../data/mock";
import { commentIdeaAction } from "./idea-comment-action";
import { discussIdeaAction } from "./idea-discuss-action";
import { brainstormIdeaAction } from "./idea-brainstorm-action";
import { editIdeaAction } from "./idea-edit-action";
import { evaluateIdeaAction } from "./idea-evaluate-action";
import { reflectionIdeaAction } from "./idea-reflection-action";
import { deleteIdeaAction } from "./idea-delete-action";
import { researchIdeaAction } from "./idea-research-action";
import { reviewIdeaAction } from "./idea-review-action";
import { humanScoreIdeaAction } from "./idea-score-action";

export type IdeaDetailActionData = {
  error: string;
};

export async function ideaDetailAction(args: ActionFunctionArgs) {
  const form = await args.request.clone().formData();
  const intent = String(form.get("intent") ?? "research");
  if (intent === "stage") {
    const ideaId = Number(args.params.ideaId);
    if (!Number.isInteger(ideaId) || ideaId <= 0) {
      return { error: "見つかりません" } satisfies IdeaDetailActionData;
    }
    const stageRaw = String(form.get("stage") ?? "");
    if (!(STAGES as readonly string[]).includes(stageRaw)) {
      return { error: "段階が不正です" } satisfies IdeaDetailActionData;
    }
    const db = createDb(args.context.cloudflare.env.DB);
    const updated = await updateIdeaStage(db, ideaId, asStage(stageRaw));
    if (!updated) {
      return { error: "見つかりません" } satisfies IdeaDetailActionData;
    }
    const redirectTo = String(form.get("redirectTo") ?? "").trim();
    if (redirectTo.startsWith("/app")) {
      return redirect(redirectTo);
    }
    return { ok: true, intent: "stage" };
  }
  if (intent === "comment") {
    return commentIdeaAction(args);
  }
  if (intent === "brainstorm") {
    return brainstormIdeaAction(args);
  }
  if (intent === "evaluate") {
    return evaluateIdeaAction(args);
  }
  if (intent === "discuss") {
    return discussIdeaAction(args);
  }
  if (intent === "edit") {
    return editIdeaAction(args);
  }
  if (intent === "human-score") {
    return humanScoreIdeaAction(args);
  }
  if (intent === "review") {
    return reviewIdeaAction(args);
  }
  if (intent === "reflection") {
    return reflectionIdeaAction(args);
  }
  if (intent === "delete") {
    return deleteIdeaAction(args);
  }
  return researchIdeaAction(args);
}
