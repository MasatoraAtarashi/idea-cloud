import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { categoryNameMap, resolveCategoryId } from "../../../db/categories";
import { apiDb } from "../db";
import {
  COMMENT_BODY_MAX,
  commentCountsByIdeaIds,
  commentJson,
  insertIdeaComment,
  listCommentsForIdea,
} from "../../../db/comments";
import {
  deleteIdea,
  getIdeaRow,
  IDEA_BODY_MAX,
  ideaJson,
  ideaJsonWithCategory,
  insertIdea,
  listIdeaRows,
  saveHumanScore,
  saveIdeaReflection,
  saveIdeaReview,
  updateIdeaFields,
  updateIdeaStage,
} from "../../../db/ideas";
import { safeUpsertInspirationsFromIdeaText } from "../../../db/inspirations";
import {
  brainstormJson,
  getLatestBrainstorm,
  listBrainstormsForIdea,
} from "../../../db/brainstorms";
import {
  chatMessageJson,
  DISCUSS_BODY_MAX,
  listChatMessagesForIdea,
} from "../../../db/discussions";
import { resolveCommentAuthor, STAGES } from "../../../app/data/mock";
import {
  parseReflectionStatus,
  REFLECTION_NOTES_MAX,
  REFLECTION_OUTCOME_MAX,
  REFLECTION_STATUSES,
} from "../../../app/lib/reflection";
import { REVIEW_STATUSES } from "../../../app/lib/review";
import { HUMAN_SCORE_NOTE_MAX } from "../../../app/lib/scores";
import { bindResearchAi, researchIdea, searchApiKeyFromEnv } from "../../ai/research";
import { brainstormIdea } from "../../ai/brainstorm";
import { discussIdea } from "../../ai/discuss";
import { evaluateIdea, scheduleCreateEvaluation } from "../../ai/evaluate";
import { resolveCreateTags, sanitizeTags, USER_TAG_MAX } from "../../ai/tags";
import { isPremium } from "../../billing/plan";
import { requirePremium } from "../../middleware/premium";
import { typesafeApiKeyFromEnv } from "../../ai/typesafe";
import { logCreatePrerequisites } from "../../diag";
import type { AppEnv } from "../../env";
import { resolveLocale } from "../../../app/i18n/locale";

const createIdeaSchema = z.object({
  body: z.string().trim().min(1).max(IDEA_BODY_MAX),
  stage: z.enum(STAGES).optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  categoryName: z.string().optional(),
});

const updateIdeaSchema = z
  .object({
    stage: z.enum(STAGES).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().max(IDEA_BODY_MAX).optional(),
    tags: z.array(z.string().trim().min(1)).max(8).optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    categoryName: z.string().optional(),
    humanScore: z.number().int().min(1).max(5).optional(),
    humanScoreNote: z.string().max(HUMAN_SCORE_NOTE_MAX).optional(),
    reviewStatus: z.enum(REVIEW_STATUSES).optional(),
    reflectionStatus: z.enum(REFLECTION_STATUSES).optional(),
    reflectionOutcome: z.string().max(REFLECTION_OUTCOME_MAX).optional(),
    reflectionNotes: z.string().max(REFLECTION_NOTES_MAX).optional(),
  })
  .refine(
    (value) =>
      value.stage !== undefined ||
      value.title !== undefined ||
      value.body !== undefined ||
      value.tags !== undefined ||
      value.categoryId !== undefined ||
      value.categoryName !== undefined ||
      value.humanScore !== undefined ||
      value.reviewStatus !== undefined ||
      value.reflectionStatus !== undefined ||
      value.reflectionOutcome !== undefined ||
      value.reflectionNotes !== undefined,
    { message: "更新する項目がありません" },
  );

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const researchSchema = z.object({
  preset: z.string().optional(),
  model: z.string().optional(),
});

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_BODY_MAX),
});

async function readResearchInput(c: {
  req: {
    header: (name: string) => string | undefined;
    query: (name: string) => string | undefined;
    json: () => Promise<unknown>;
  };
}): Promise<{ preset?: string; model?: string } | { error: string }> {
  const contentType = c.req.header("content-type") ?? "";
  let body: { preset?: string; model?: string } = {};
  if (contentType.includes("application/json")) {
    try {
      const parsed = researchSchema.safeParse(await c.req.json());
      if (!parsed.success) {
        return { error: "Bad Request" };
      }
      body = parsed.data;
    } catch {
      return { error: "Bad Request" };
    }
  }
  return {
    preset: body.preset ?? c.req.query("preset"),
    model: body.model ?? c.req.query("model"),
  };
}

export const ideasRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const db = apiDb(c);
    const rows = await listIdeaRows(db);
    const counts = await commentCountsByIdeaIds(
      db,
      rows.map((row) => row.id),
    );
    const names = await categoryNameMap(db);
    return c.json({
      items: rows.map((row) =>
        ideaJson(row, {
          commentCount: counts.get(row.id) ?? 0,
          categoryName: row.categoryId != null ? (names.get(row.categoryId) ?? null) : null,
        }),
      ),
    });
  })
  .get("/:id/comments", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const row = await getIdeaRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    const comments = await listCommentsForIdea(db, id);
    return c.json({ items: comments.map(commentJson) });
  })
  .post(
    "/:id/comments",
    zValidator("param", idParamSchema),
    zValidator("json", createCommentSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { body } = c.req.valid("json");
      const db = apiDb(c);
      const row = await getIdeaRow(db, id);
      if (!row) {
        return c.json({ error: "Not Found" }, 404);
      }
      const created = await insertIdeaComment(
        db,
        id,
        body,
        resolveCommentAuthor(c.get("userEmail")),
      );
      return c.json({ item: commentJson(created) }, 201);
    },
  )
  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const deleted = await deleteIdea(db, id);
    if (!deleted) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.json({ ok: true });
  })
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const row = await getIdeaRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    const counts = await commentCountsByIdeaIds(db, [id]);
    const brainstorm = await getLatestBrainstorm(db, id);
    return c.json({
      item: await ideaJsonWithCategory(db, row, {
        commentCount: counts.get(id) ?? 0,
        brainstorm: brainstorm ?? null,
      }),
    });
  })
  .post("/", zValidator("json", createIdeaSchema), async (c) => {
    const { body, stage, tags, categoryId, categoryName } = c.req.valid("json");
    logCreatePrerequisites(c.env);
    const db = apiDb(c);
    const category = await resolveCategoryId(db, { categoryId, categoryName });
    if ("error" in category) {
      return c.json({ error: category.error }, 400);
    }
    // Create still works on free; only the AI garnish (auto-tags, AI評価) is skipped.
    const premium = await isPremium(db, c.get("userEmail"), c.env);
    const resolvedTags = premium
      ? await resolveCreateTags({
          ai: bindResearchAi(c.env.AI),
          text: body,
          tags: tags ?? [],
          typesafeApiKey: typesafeApiKeyFromEnv(c.env),
          locale: resolveLocale(c.req.raw),
        })
      : sanitizeTags(tags ?? [], USER_TAG_MAX);
    const created = await insertIdea(db, body, {
      stage,
      tags: resolvedTags,
      categoryId: category.id,
    });
    await safeUpsertInspirationsFromIdeaText(db, body);
    if (premium) {
      scheduleCreateEvaluation({
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
        db,
        ai: bindResearchAi(c.env.AI),
        ideaId: created.id,
        stage: created.stage,
        typesafeApiKey: typesafeApiKeyFromEnv(c.env),
        locale: resolveLocale(c.req.raw),
      });
    }
    return c.json({ item: await ideaJsonWithCategory(db, created) }, 201);
  })
  .patch(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", updateIdeaSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const patch = c.req.valid("json");
      const db = apiDb(c);
      if (patch.humanScore !== undefined) {
        const note = patch.humanScoreNote?.trim() ?? "";
        const scored = await saveHumanScore(db, id, { score: patch.humanScore, note });
        if (!scored) {
          return c.json({ error: "Not Found" }, 404);
        }
      }
      if (patch.reviewStatus !== undefined && patch.reviewStatus !== "none") {
        const reviewed = await saveIdeaReview(db, id, patch.reviewStatus);
        if (!reviewed) {
          return c.json({ error: "Not Found" }, 404);
        }
      }
      if (
        patch.reflectionStatus !== undefined ||
        patch.reflectionOutcome !== undefined ||
        patch.reflectionNotes !== undefined
      ) {
        const current = await getIdeaRow(db, id);
        if (!current) {
          return c.json({ error: "Not Found" }, 404);
        }
        const reflected = await saveIdeaReflection(db, id, {
          outcome: patch.reflectionOutcome ?? current.reflectionOutcome ?? "",
          status: patch.reflectionStatus ?? parseReflectionStatus(current.reflectionStatus),
          notes: patch.reflectionNotes ?? current.reflectionNotes ?? "",
        });
        if (!reflected) {
          return c.json({ error: "Not Found" }, 404);
        }
      }
      if (
        patch.stage !== undefined ||
        patch.title !== undefined ||
        patch.body !== undefined ||
        patch.tags !== undefined ||
        patch.categoryId !== undefined ||
        patch.categoryName !== undefined
      ) {
        const category =
          patch.categoryId !== undefined || patch.categoryName !== undefined
            ? await resolveCategoryId(db, {
                categoryId: patch.categoryId,
                categoryName: patch.categoryName,
              })
            : undefined;
        if (category && "error" in category) {
          return c.json({ error: category.error }, 400);
        }
        const current = await getIdeaRow(db, id);
        const updated =
          patch.title !== undefined ||
          patch.body !== undefined ||
          patch.tags !== undefined ||
          category
            ? await updateIdeaFields(db, id, {
                title: patch.title,
                body: patch.body,
                tags: patch.tags,
                stage: patch.stage,
                ...(category ? { categoryId: category.id } : {}),
              })
            : patch.stage !== undefined
              ? await updateIdeaStage(db, id, patch.stage)
              : current;
        if (!updated) {
          return c.json({ error: "Not Found" }, 404);
        }
        if (patch.body !== undefined && current?.body !== updated.body) {
          await safeUpsertInspirationsFromIdeaText(
            db,
            [updated.title, updated.body].filter(Boolean).join("\n"),
          );
        }
        return c.json({ item: await ideaJsonWithCategory(db, updated) });
      }
      const row = await getIdeaRow(db, id);
      if (!row) {
        return c.json({ error: "Not Found" }, 404);
      }
      return c.json({ item: await ideaJsonWithCategory(db, row) });
    },
  )
  .post("/:id/research", requirePremium, zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const input = await readResearchInput(c);
    if ("error" in input) {
      return c.json({ error: input.error }, 400);
    }
    const db = apiDb(c);
    const result = await researchIdea({
      db,
      ai: bindResearchAi(c.env.AI),
      ideaId: id,
      preset: input.preset,
      model: input.model,
      searchApiKey: searchApiKeyFromEnv(c.env),
      locale: resolveLocale(c.req.raw),
    });
    if (!result.ok) {
      return c.json({ error: result.error, code: result.code }, result.status);
    }
    return c.json({ item: await ideaJsonWithCategory(db, result.idea) });
  })
  .get("/:id/brainstorms", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const row = await getIdeaRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    const items = await listBrainstormsForIdea(db, id);
    return c.json({ items: items.map(brainstormJson) });
  })
  .post("/:id/brainstorm", requirePremium, zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const input = await readResearchInput(c);
    if ("error" in input) {
      return c.json({ error: input.error }, 400);
    }
    const db = apiDb(c);
    const result = await brainstormIdea({
      db,
      ai: bindResearchAi(c.env.AI),
      ideaId: id,
      preset: input.preset,
      model: input.model,
      locale: resolveLocale(c.req.raw),
    });
    if (!result.ok) {
      return c.json({ error: result.error, code: result.code }, result.status);
    }
    const row = await getIdeaRow(db, id);
    if (!row) {
      return c.json({ error: "見つかりません" }, 404);
    }
    const counts = await commentCountsByIdeaIds(db, [id]);
    return c.json({
      item: await ideaJsonWithCategory(db, row, {
        commentCount: counts.get(id) ?? 0,
        brainstorm: result.brainstorm,
      }),
      brainstorm: brainstormJson(result.brainstorm),
    });
  })
  .get("/:id/discussions", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const row = await getIdeaRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    const items = await listChatMessagesForIdea(db, id);
    return c.json({ items: items.map(chatMessageJson) });
  })
  .post("/:id/discuss", requirePremium, zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    let payload: { body?: unknown; preset?: unknown; model?: unknown } = {};
    try {
      payload = (await c.req.json()) as typeof payload;
    } catch {
      return c.json({ error: "Bad Request" }, 400);
    }
    const body = typeof payload.body === "string" ? payload.body : "";
    if (body.trim().length > DISCUSS_BODY_MAX) {
      return c.json({ error: "長すぎます" }, 400);
    }
    const db = apiDb(c);
    const result = await discussIdea({
      db,
      ai: bindResearchAi(c.env.AI),
      ideaId: id,
      body,
      preset: typeof payload.preset === "string" ? payload.preset : undefined,
      model: typeof payload.model === "string" ? payload.model : undefined,
      locale: resolveLocale(c.req.raw),
    });
    if (!result.ok) {
      return c.json({ error: result.error, code: result.code }, result.status);
    }
    return c.json({ items: result.messages.map(chatMessageJson) });
  })
  .post("/:id/evaluate", requirePremium, zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const input = await readResearchInput(c);
    if ("error" in input) {
      return c.json({ error: input.error }, 400);
    }
    const db = apiDb(c);
    const result = await evaluateIdea({
      db,
      ai: bindResearchAi(c.env.AI),
      ideaId: id,
      preset: input.preset,
      model: input.model,
      typesafeApiKey: typesafeApiKeyFromEnv(c.env),
      locale: resolveLocale(c.req.raw),
    });
    if (!result.ok) {
      return c.json({ error: result.error, code: result.code }, result.status);
    }
    return c.json({ item: await ideaJsonWithCategory(db, result.idea) });
  });
