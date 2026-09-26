import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../../../db/client";
import { insertIdea } from "../../../db/ideas";
import {
  INSPIRATION_MEMO_MAX,
  INSPIRATION_TITLE_MAX,
  INSPIRATION_URL_MAX,
  deleteInspiration,
  getInspirationRow,
  ideaTextFromInspiration,
  inspirationJson,
  listInspirationRows,
  updateInspiration,
  urlsDiffer,
} from "../../../db/inspirations";
import {
  prepareInspirationInput,
  normalizeInspirationInputUrl,
} from "../../../app/lib/inspiration-input";
import {
  insertPreparedInspiration,
  replaceDerivedTitleFromOgp,
} from "../../../app/lib/inspiration-save";
import { brainstormIdea } from "../../ai/brainstorm";
import { bindResearchAi } from "../../ai/research";
import { requirePremium } from "../../middleware/premium";
import type { AppEnv } from "../../env";
import { enrichInspirationOgp } from "../../ogp/enrich";
import { JA } from "../../../app/i18n/dictionary";

const createInspirationSchema = z.object({
  title: z.string().trim().max(INSPIRATION_TITLE_MAX).optional(),
  url: z
    .string()
    .max(INSPIRATION_URL_MAX + 64)
    .optional()
    .nullable(),
  memo: z.string().max(INSPIRATION_MEMO_MAX).optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
});

const updateInspirationSchema = z
  .object({
    title: z.string().trim().min(1).max(INSPIRATION_TITLE_MAX).optional(),
    url: z
      .string()
      .max(INSPIRATION_URL_MAX + 64)
      .optional()
      .nullable(),
    memo: z.string().max(INSPIRATION_MEMO_MAX).optional(),
    tags: z.array(z.string().trim().min(1)).max(8).optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.url !== undefined ||
      value.memo !== undefined ||
      value.tags !== undefined,
    { message: "更新する項目がありません" },
  );

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const inspirationsRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const db = createDb(c.env.DB);
    const rows = await listInspirationRows(db);
    return c.json({ items: rows.map(inspirationJson) });
  })
  .post("/", zValidator("json", createInspirationSchema), async (c) => {
    const { title, url, memo, tags } = c.req.valid("json");
    const prepared = prepareInspirationInput(JA, { title, url, memo, tags });
    if (!prepared.ok) {
      return c.json({ error: prepared.error }, 400);
    }
    const db = createDb(c.env.DB);
    const created = await insertPreparedInspiration(db, prepared.value);
    return c.json({ item: inspirationJson(created) }, 201);
  })
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const row = await getInspirationRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.json({ item: inspirationJson(row) });
  })
  .patch(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", updateInspirationSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const patch = c.req.valid("json");
      let url = patch.url;
      if (url !== undefined && url !== null) {
        const normalized = normalizeInspirationInputUrl(JA, url);
        if ("error" in normalized) {
          return c.json({ error: normalized.error }, 400);
        }
        url = normalized.url || null;
      }
      const db = createDb(c.env.DB);
      const existing = await getInspirationRow(db, id);
      if (!existing) {
        return c.json({ error: "Not Found" }, 404);
      }
      const updated = await updateInspiration(db, id, { ...patch, url });
      if (!updated) {
        return c.json({ error: "Not Found" }, 404);
      }
      const urlChanged = patch.url !== undefined && urlsDiffer(existing.url, updated.url);
      const enriched = urlChanged ? await enrichInspirationOgp(db, updated) : updated;
      return c.json({ item: inspirationJson(enriched) });
    },
  )
  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const deleted = await deleteInspiration(db, id);
    if (!deleted) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.json({ ok: true });
  })
  .post("/:id/ogp", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const row = await getInspirationRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    const enriched = await enrichInspirationOgp(db, row);
    const titled = await replaceDerivedTitleFromOgp(db, enriched);
    return c.json({ item: inspirationJson(titled) });
  })
  .post("/:id/brainstorm", requirePremium, zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const row = await getInspirationRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    const created = await insertIdea(db, ideaTextFromInspiration(row));
    const result = await brainstormIdea({
      db,
      ai: bindResearchAi(c.env.AI),
      ideaId: created.id,
      preset: c.req.query("preset"),
      model: c.req.query("model"),
    });
    if (!result.ok) {
      return c.json(
        { error: result.error, code: result.code, item: { id: created.id, title: created.title } },
        result.status,
      );
    }
    return c.json({
      item: { id: created.id, title: created.title },
      brainstorm: { id: result.brainstorm.id, notes: result.brainstorm.notes },
    });
  });
