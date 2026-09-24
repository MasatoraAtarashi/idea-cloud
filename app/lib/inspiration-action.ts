import { redirect, type ActionFunctionArgs } from "react-router";
import { createDb } from "../../db/client";
import { insertIdea } from "../../db/ideas";
import {
  getInspirationRow,
  ideaTextFromInspiration,
  updateInspiration,
  urlsDiffer,
} from "../../db/inspirations";
import { brainstormIdea } from "../../server/ai/brainstorm";
import { bindResearchAi } from "../../server/ai/research";
import { enrichInspirationOgp } from "../../server/ogp/enrich";
import { prepareInspirationInput } from "./inspiration-input";
import {
  applyFetchedTitle,
  insertPreparedInspiration,
  replaceDerivedTitleFromOgp,
  titleForInspirationUpdate,
} from "./inspiration-save";

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

function readInspirationForm(form: FormData) {
  return prepareInspirationInput({
    title: String(form.get("title") ?? ""),
    url: String(form.get("url") ?? ""),
    memo: String(form.get("memo") ?? ""),
    tags: parseTags(String(form.get("tags") ?? "")),
  });
}

export async function createInspirationAction({
  request,
  context,
}: ActionFunctionArgs): Promise<Response | InspirationActionData> {
  const form = await request.formData();
  const prepared = readInspirationForm(form);
  if (!prepared.ok) {
    return { error: prepared.error, intent: "create" } satisfies InspirationActionData;
  }
  const db = createDb(context.cloudflare.env.DB);
  const created = await insertPreparedInspiration(db, prepared.value);
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
    const enriched = await enrichInspirationOgp(db, row);
    await replaceDerivedTitleFromOgp(db, enriched);
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

  const prepared = readInspirationForm(form);
  if (!prepared.ok) {
    return { error: prepared.error, intent: "edit" } satisfies InspirationActionData;
  }
  const existing = await getInspirationRow(db, inspirationId);
  if (!existing) {
    return { error: "見つかりません", intent: "edit" } satisfies InspirationActionData;
  }
  const urlChanged = urlsDiffer(existing.url, prepared.value.url);
  const updated = await updateInspiration(db, inspirationId, {
    title: titleForInspirationUpdate(prepared.value, existing.ogTitle, urlChanged),
    url: prepared.value.url,
    memo: prepared.value.memo,
    tags: prepared.value.tags,
  });
  if (!updated) {
    return { error: "見つかりません", intent: "edit" } satisfies InspirationActionData;
  }
  if (urlChanged) {
    await applyFetchedTitle(db, updated, prepared.value.titleFromUser);
  }
  return { ok: true, intent: "edit" } satisfies InspirationActionData;
}
