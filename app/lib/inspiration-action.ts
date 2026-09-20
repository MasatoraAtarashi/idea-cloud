import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { insertIdea } from "../../db/ideas";
import {
  INSPIRATION_MEMO_MAX,
  INSPIRATION_TITLE_MAX,
  INSPIRATION_URL_MAX,
  getInspirationRow,
  ideaTextFromInspiration,
  insertInspiration,
  updateInspiration,
  urlsDiffer,
} from "../../db/inspirations";
import { brainstormIdea } from "../../server/ai/brainstorm";
import { bindResearchAi } from "../../server/ai/research";
import { enrichInspirationOgp } from "../../server/ogp/enrich";

export const INSPIRATIONS_PATH = "/app/inspirations";

export type InspirationActionData = {
  error?: string;
  intent: string;
  ok?: true;
};

function parseTags(raw: string): string[] {
  return raw
    .split(/[,、]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 8);
}

function parseInspirationFields(form: FormData) {
  return {
    title: String(form.get("title") ?? "").trim(),
    url: String(form.get("url") ?? "").trim(),
    memo: String(form.get("memo") ?? "").trim(),
    tags: parseTags(String(form.get("tags") ?? "")),
  };
}

function validateInspiration(fields: ReturnType<typeof parseInspirationFields>): string | null {
  if (!fields.title && !fields.memo && !fields.url) {
    return "入力してください";
  }
  if (fields.title.length > INSPIRATION_TITLE_MAX) {
    return "タイトルが長すぎます";
  }
  if (fields.memo.length > INSPIRATION_MEMO_MAX) {
    return "メモが長すぎます";
  }
  if (fields.url.length > INSPIRATION_URL_MAX) {
    return "URLが長すぎます";
  }
  return null;
}

export async function createInspirationAction({
  request,
  context,
}: ActionFunctionArgs): Promise<Response | InspirationActionData> {
  const form = await request.formData();
  const fields = parseInspirationFields(form);
  const error = validateInspiration(fields);
  if (error) {
    return { error, intent: "create" } satisfies InspirationActionData;
  }
  const db = createDb(context.cloudflare.env.DB);
  const created = await insertInspiration(db, {
    title: fields.title || fields.memo.slice(0, 200) || fields.url || "無題",
    url: fields.url || null,
    memo: fields.memo,
    tags: fields.tags,
  });
  if (created.url) {
    await enrichInspirationOgp(db, created);
  }
  return redirect(`${INSPIRATIONS_PATH}/${created.id}`);
}

export async function inspirationDetailAction({
  request,
  params,
  context,
}: ActionFunctionArgs): Promise<Response | InspirationActionData> {
  const inspirationId = Number(params.inspirationId);
  if (!Number.isInteger(inspirationId) || inspirationId <= 0) {
    return { error: "見つかりません", intent: "edit" } satisfies InspirationActionData;
  }

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "edit");
  const db = createDb(context.cloudflare.env.DB);

  if (intent === "refresh-ogp") {
    const row = await getInspirationRow(db, inspirationId);
    if (!row) {
      return { error: "見つかりません", intent: "refresh-ogp" } satisfies InspirationActionData;
    }
    if (!row.url?.trim()) {
      return { error: "URLがありません", intent: "refresh-ogp" } satisfies InspirationActionData;
    }
    await enrichInspirationOgp(db, row);
    return { ok: true, intent: "refresh-ogp" } satisfies InspirationActionData;
  }

  if (intent === "brainstorm") {
    const row = await getInspirationRow(db, inspirationId);
    if (!row) {
      return { error: "見つかりません", intent: "brainstorm" } satisfies InspirationActionData;
    }
    const created = await insertIdea(db, ideaTextFromInspiration(row), {
      tags: [],
    });
    const result = await brainstormIdea({
      db,
      ai: bindResearchAi(context.cloudflare.env.AI),
      ideaId: created.id,
      preset: String(form.get("preset") ?? ""),
      model: String(form.get("model") ?? ""),
    });
    if (!result.ok) {
      return redirect(
        `/app/ideas/${created.id}?brainstormError=${encodeURIComponent(result.error)}`,
      );
    }
    return redirect(`/app/ideas/${created.id}#brainstorm`);
  }

  const fields = parseInspirationFields(form);
  const error = validateInspiration(fields);
  if (error) {
    return { error, intent: "edit" } satisfies InspirationActionData;
  }
  const existing = await getInspirationRow(db, inspirationId);
  if (!existing) {
    return { error: "見つかりません", intent: "edit" } satisfies InspirationActionData;
  }
  const updated = await updateInspiration(db, inspirationId, {
    title: fields.title || fields.memo.slice(0, 200) || fields.url || "無題",
    url: fields.url || null,
    memo: fields.memo,
    tags: fields.tags,
  });
  if (!updated) {
    return { error: "見つかりません", intent: "edit" } satisfies InspirationActionData;
  }
  if (urlsDiffer(existing.url, updated.url)) {
    await enrichInspirationOgp(db, updated);
  }
  return { ok: true, intent: "edit" } satisfies InspirationActionData;
}
