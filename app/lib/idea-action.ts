import { redirect, type ActionFunctionArgs } from "react-router";
import { resolveCategoryId } from "../../db/categories";
import { asStage, IDEA_BODY_MAX, insertIdea } from "../../db/ideas";
import { safeUpsertInspirationsFromIdeaText } from "../../db/inspirations";
import { logCreatePrerequisites } from "../../server/diag";
import { scheduleCreateEvaluation } from "../../server/ai/evaluate";
import { bindResearchAi } from "../../server/ai/research";
import { resolveCreateTags, sanitizeTags, USER_TAG_MAX } from "../../server/ai/tags";
import { typesafeApiKeyFromEnv } from "../../server/ai/typesafe";
import { STAGES, type Stage } from "../data/mock";
import { LIST_PATH } from "./home-path";
import { appDb } from "./app-db";

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

function parseCategoryId(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

export function composeBodyFromForm(form: FormData): {
  title: string;
  bodyField: string;
  text: string;
  stage: Stage;
  tags: string[];
  categoryId: number | null;
  categoryName: string;
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
    categoryId: parseCategoryId(String(form.get("categoryId") ?? "")),
    categoryName: String(form.get("categoryName") ?? ""),
  };
}

export async function createIdeaAction({ request, context }: ActionFunctionArgs) {
  const form = await request.formData();
  const { title, bodyField, text, stage, tags, categoryId, categoryName } =
    composeBodyFromForm(form);
  if (!text) {
    return { error: "入力してください", title, body: bodyField } satisfies CreateIdeaActionData;
  }
  if (text.length > IDEA_BODY_MAX) {
    return { error: "長すぎます", title, body: bodyField } satisfies CreateIdeaActionData;
  }
  const db = appDb(context);
  const category = await resolveCategoryId(db, { categoryId, categoryName });
  if ("error" in category) {
    return { error: category.error, title, body: bodyField } satisfies CreateIdeaActionData;
  }
  logCreatePrerequisites(context.cloudflare.env);
  // Free keeps the capture flow; only auto-tags and the create-time AI評価 drop off.
  const premium = context.plan === "premium";
  const resolvedTags = premium
    ? await resolveCreateTags({
        ai: bindResearchAi(context.cloudflare.env.AI),
        text,
        tags,
        typesafeApiKey: typesafeApiKeyFromEnv(context.cloudflare.env),
      })
    : sanitizeTags(tags, USER_TAG_MAX);
  const created = await insertIdea(db, text, {
    stage,
    tags: resolvedTags,
    categoryId: category.id,
  });
  await safeUpsertInspirationsFromIdeaText(db, text);
  if (premium) {
    scheduleCreateEvaluation({
      waitUntil: (promise) => context.cloudflare.ctx.waitUntil(promise),
      db,
      ai: bindResearchAi(context.cloudflare.env.AI),
      ideaId: created.id,
      stage: created.stage,
      typesafeApiKey: typesafeApiKeyFromEnv(context.cloudflare.env),
    });
  }
  return redirect(LIST_PATH);
}
