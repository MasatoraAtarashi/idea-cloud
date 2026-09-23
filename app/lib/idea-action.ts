import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { asStage, IDEA_BODY_MAX, insertIdea } from "../../db/ideas";
import { safeUpsertInspirationsFromIdeaText } from "../../db/inspirations";
import { scheduleCreateEvaluation } from "../../server/ai/evaluate";
import { bindResearchAi } from "../../server/ai/research";
import { resolveCreateTags } from "../../server/ai/tags";
import { typesafeApiKeyFromEnv } from "../../server/ai/typesafe";
import { STAGES, type Stage } from "../data/mock";
import { LIST_PATH } from "./home-path";

export type CreateIdeaActionData = {
  error: string;
  title?: string;
  body: string;
};

function parseTags(raw: string): string[] {
  return raw
    .split(/[,、]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 8);
}

function parseStage(raw: string): Stage {
  return (STAGES as readonly string[]).includes(raw) ? asStage(raw) : "spark";
}

export function composeBodyFromForm(form: FormData): {
  title: string;
  bodyField: string;
  text: string;
  stage: Stage;
  tags: string[];
} {
  const title = String(form.get("title") ?? "").trim();
  const bodyField = String(form.get("body") ?? "").trim();
  const text = [title, bodyField].filter(Boolean).join("\n");
  return {
    title,
    bodyField,
    text,
    stage: parseStage(String(form.get("stage") ?? "spark")),
    tags: parseTags(String(form.get("tags") ?? "")),
  };
}

export async function createIdeaAction({ request, context }: ActionFunctionArgs) {
  const form = await request.formData();
  const { title, bodyField, text, stage, tags } = composeBodyFromForm(form);
  if (!text) {
    return { error: "入力してください", title, body: bodyField } satisfies CreateIdeaActionData;
  }
  if (text.length > IDEA_BODY_MAX) {
    return { error: "長すぎます", title, body: bodyField } satisfies CreateIdeaActionData;
  }
  const db = createDb(context.cloudflare.env.DB);
  const resolvedTags = await resolveCreateTags({
    ai: bindResearchAi(context.cloudflare.env.AI),
    text,
    tags,
    typesafeApiKey: typesafeApiKeyFromEnv(context.cloudflare.env),
  });
  const created = await insertIdea(db, text, { stage, tags: resolvedTags });
  await safeUpsertInspirationsFromIdeaText(db, text);
  scheduleCreateEvaluation({
    waitUntil: (promise) => context.cloudflare.ctx.waitUntil(promise),
    db,
    ai: bindResearchAi(context.cloudflare.env.AI),
    ideaId: created.id,
    stage: created.stage,
    typesafeApiKey: typesafeApiKeyFromEnv(context.cloudflare.env),
  });
  return redirect(LIST_PATH);
}
