import { type ActionFunctionArgs } from "react-router";
import { resolveCategoryId } from "../../db/categories";
import { createDb } from "../../db/client";
import { getIdeaRow, IDEA_BODY_MAX, updateIdeaFields } from "../../db/ideas";
import { safeUpsertInspirationsFromIdeaText } from "../../db/inspirations";
import { STAGES, type Stage } from "../data/mock";

export type EditIdeaActionData = {
  error?: string;
  intent: "edit";
  ok?: true;
};

function parseStage(raw: string): Stage | undefined {
  return (STAGES as readonly string[]).includes(raw) ? (raw as Stage) : undefined;
}

export async function editIdeaAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<EditIdeaActionData> {
  const ideaId = Number(params.ideaId);
  if (!Number.isInteger(ideaId) || ideaId <= 0) {
    return { error: "見つかりません", intent: "edit" } satisfies EditIdeaActionData;
  }

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const tagsRaw = String(form.get("tags") ?? "");
  const stage = parseStage(String(form.get("stage") ?? ""));
  if (!title && !body) {
    return { error: "入力してください", intent: "edit" } satisfies EditIdeaActionData;
  }
  const text = [title, body].filter(Boolean).join("\n");
  if (text.length > IDEA_BODY_MAX) {
    return { error: "長すぎます", intent: "edit" } satisfies EditIdeaActionData;
  }

  const tags = tagsRaw
    .split(/[,、\s]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 8);
  const categoryIdRaw = String(form.get("categoryId") ?? "").trim();
  const categoryId = /^\d+$/.test(categoryIdRaw) ? Number(categoryIdRaw) : null;
  const categoryName = String(form.get("categoryName") ?? "");

  const db = createDb(context.cloudflare.env.DB);
  const category = await resolveCategoryId(db, { categoryId, categoryName });
  if ("error" in category) {
    return { error: category.error, intent: "edit" } satisfies EditIdeaActionData;
  }
  const current = await getIdeaRow(db, ideaId);
  const updated = await updateIdeaFields(db, ideaId, {
    title: title || body.slice(0, 200) || "無題",
    body: body || title,
    tags,
    stage,
    categoryId: category.id,
  });
  if (!updated) {
    return { error: "見つかりません", intent: "edit" } satisfies EditIdeaActionData;
  }
  if (!current || current.body !== updated.body) {
    await safeUpsertInspirationsFromIdeaText(db, text);
  }
  return { ok: true, intent: "edit" } satisfies EditIdeaActionData;
}

export function tagsInputValue(tags: string[]): string {
  return tags.join("、");
}
