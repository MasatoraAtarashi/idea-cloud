import { redirect, type ActionFunctionArgs } from "react-router";
import { resolveCategoryId } from "../../db/categories";
import { createDb } from "../../db/client";
import { IDEA_BODY_MAX, insertIdea } from "../../db/ideas";
import {
  deleteInspiration,
  getInspirationRow,
  ideaTextFromInspiration,
  updateInspiration,
  urlsDiffer,
} from "../../db/inspirations";
import { brainstormIdea } from "../../server/ai/brainstorm";
import { scheduleCreateEvaluation } from "../../server/ai/evaluate";
import { bindResearchAi } from "../../server/ai/research";
import { resolveCreateTags, sanitizeTags, USER_TAG_MAX } from "../../server/ai/tags";
import { PREMIUM_REQUIRED_MESSAGE } from "../../server/billing/plan";
import { typesafeApiKeyFromEnv } from "../../server/ai/typesafe";
import { enrichInspirationOgp } from "../../server/ogp/enrich";
import { dictionary, type Dictionary } from "../i18n/dictionary";
import { composeBodyFromForm } from "./idea-action";
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

function readInspirationForm(t: Dictionary, form: FormData) {
  return prepareInspirationInput(t, {
    title: String(form.get("title") ?? ""),
    url: String(form.get("url") ?? ""),
    memo: String(form.get("memo") ?? ""),
    tags: parseTags(String(form.get("tags") ?? "")),
  });
}

export const CREATE_IDEA_INTENT = "create-idea";

/**
 * Idea made from a shelf card. Links `ideas.inspiration_id`. With `brainstorm=1`, runs one
 * brainstorm and opens the detail on that tab; a brainstorm failure still lands on the idea.
 */
async function createIdeaFromInspiration(
  form: FormData,
  context: ActionFunctionArgs["context"],
  inspirationId: number,
): Promise<Response | InspirationActionData> {
  const t = dictionary(context.locale);
  const intent = CREATE_IDEA_INTENT;
  const { text, tags, categoryId, categoryName } = composeBodyFromForm(form);
  if (!text) return { error: t.inspiration.errors.empty, intent } satisfies InspirationActionData;
  if (text.length > IDEA_BODY_MAX) return { error: t.inspiration.errors.tooLong, intent };
  const env = context.cloudflare.env;
  const db = createDb(env.DB);
  const source = await getInspirationRow(db, inspirationId);
  if (!source) {
    return { error: t.inspiration.errors.notFound, intent } satisfies InspirationActionData;
  }
  const category = await resolveCategoryId(db, { categoryId, categoryName });
  if ("error" in category) return { error: category.error, intent };
  const ai = bindResearchAi(env.AI);
  const typesafeApiKey = typesafeApiKeyFromEnv(env);
  const premium = context.plan === "premium";
  const resolvedTags = premium
    ? await resolveCreateTags({ ai, text, tags, typesafeApiKey })
    : sanitizeTags(tags, USER_TAG_MAX);
  const created = await insertIdea(db, text, {
    tags: resolvedTags,
    categoryId: category.id,
    inspirationId: source.id,
  });
  if (premium) {
    scheduleCreateEvaluation({
      waitUntil: (promise) => context.cloudflare.ctx.waitUntil(promise),
      db,
      ai,
      ideaId: created.id,
      stage: created.stage,
      typesafeApiKey,
    });
  }
  if (!premium || String(form.get("brainstorm") ?? "") !== "1") {
    return redirect(`/app/ideas/${created.id}`);
  }
  const result = await brainstormIdea({ db, ai, ideaId: created.id, preset: "", model: "" });
  if (!result.ok) {
    return redirect(`/app/ideas/${created.id}?brainstormError=${encodeURIComponent(result.error)}`);
  }
  return redirect(`/app/ideas/${created.id}#brainstorm`);
}

function inspirationIdFrom(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createInspirationAction({
  request,
  context,
}: ActionFunctionArgs): Promise<Response | InspirationActionData> {
  const t = dictionary(context.locale);
  const form = await request.formData();
  if (String(form.get("intent") ?? "") === CREATE_IDEA_INTENT) {
    const id = inspirationIdFrom(form.get("inspirationId"));
    if (!id) return { error: t.inspiration.errors.notFound, intent: CREATE_IDEA_INTENT };
    return createIdeaFromInspiration(form, context, id);
  }
  const prepared = readInspirationForm(t, form);
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
  const t = dictionary(context.locale);
  const inspirationId = Number(params.inspirationId);
  if (!Number.isInteger(inspirationId) || inspirationId <= 0) {
    return { error: t.inspiration.errors.notFound, intent: "edit" } satisfies InspirationActionData;
  }

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "edit");
  const db = createDb(context.cloudflare.env.DB);

  if (intent === CREATE_IDEA_INTENT) {
    return createIdeaFromInspiration(form, context, inspirationId);
  }

  if (intent === "delete") {
    const deleted = await deleteInspiration(db, inspirationId);
    if (!deleted) {
      return {
        error: t.inspiration.errors.notFound,
        intent: "delete",
      } satisfies InspirationActionData;
    }
    return redirect(INSPIRATIONS_PATH);
  }

  if (intent === "refresh-ogp") {
    const row = await getInspirationRow(db, inspirationId);
    if (!row) {
      return {
        error: t.inspiration.errors.notFound,
        intent: "refresh-ogp",
      } satisfies InspirationActionData;
    }
    if (!row.url?.trim()) {
      return {
        error: t.inspiration.errors.noUrl,
        intent: "refresh-ogp",
      } satisfies InspirationActionData;
    }
    const enriched = await enrichInspirationOgp(db, row);
    await replaceDerivedTitleFromOgp(db, enriched);
    return { ok: true, intent: "refresh-ogp" } satisfies InspirationActionData;
  }

  if (intent === "brainstorm") {
    if (context.plan !== "premium") {
      return {
        error: PREMIUM_REQUIRED_MESSAGE,
        intent: "brainstorm",
      } satisfies InspirationActionData;
    }
    const row = await getInspirationRow(db, inspirationId);
    if (!row) {
      return {
        error: t.inspiration.errors.notFound,
        intent: "brainstorm",
      } satisfies InspirationActionData;
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

  const prepared = readInspirationForm(t, form);
  if (!prepared.ok) {
    return { error: prepared.error, intent: "edit" } satisfies InspirationActionData;
  }
  const existing = await getInspirationRow(db, inspirationId);
  if (!existing) {
    return { error: t.inspiration.errors.notFound, intent: "edit" } satisfies InspirationActionData;
  }
  const urlChanged = urlsDiffer(existing.url, prepared.value.url);
  const updated = await updateInspiration(db, inspirationId, {
    title: titleForInspirationUpdate(prepared.value, existing.ogTitle, urlChanged),
    url: prepared.value.url,
    memo: prepared.value.memo,
    tags: prepared.value.tags,
  });
  if (!updated) {
    return { error: t.inspiration.errors.notFound, intent: "edit" } satisfies InspirationActionData;
  }
  if (urlChanged) {
    await applyFetchedTitle(db, updated, prepared.value.titleFromUser);
  }
  return { ok: true, intent: "edit" } satisfies InspirationActionData;
}
