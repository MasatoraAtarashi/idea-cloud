import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../../../db/client";
import { insertIdea } from "../../../db/ideas";
import {
  INSPIRATION_MEMO_MAX,
  INSPIRATION_TITLE_MAX,
  INSPIRATION_URL_MAX,
  getInspirationRow,
  ideaTextFromInspiration,
  insertInspiration,
  inspirationJson,
  listInspirationRows,
  updateInspiration,
} from "../../../db/inspirations";
import { brainstormIdea } from "../../ai/brainstorm";
import { bindResearchAi } from "../../ai/research";
import type { AppEnv } from "../../env";

const createInspirationSchema = z.object({
  title: z.string().trim().max(INSPIRATION_TITLE_MAX).optional(),
  url: z.string().trim().max(INSPIRATION_URL_MAX).optional().nullable(),
  memo: z.string().max(INSPIRATION_MEMO_MAX).optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
});

const updateInspirationSchema = z
  .object({
    title: z.string().trim().min(1).max(INSPIRATION_TITLE_MAX).optional(),
    url: z.string().trim().max(INSPIRATION_URL_MAX).optional().nullable(),
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
    const text = [title?.trim(), memo?.trim(), url?.trim()].filter(Boolean).join("");
    if (!text) {
      return c.json({ error: "入力してください" }, 400);
    }
    const db = createDb(c.env.DB);
    const created = await insertInspiration(db, {
      title: title?.trim() || memo?.trim().slice(0, 200) || url?.trim() || "無題",
      url: url ?? null,
      memo: memo ?? "",
      tags: tags ?? [],
    });
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
      const db = createDb(c.env.DB);
      const updated = await updateInspiration(db, id, patch);
      if (!updated) {
        return c.json({ error: "Not Found" }, 404);
      }
      return c.json({ item: inspirationJson(updated) });
    },
  )
  .post("/:id/brainstorm", zValidator("param", idParamSchema), async (c) => {
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
        { error: result.error, item: { id: created.id, title: created.title } },
        result.status,
      );
    }
    return c.json({
      item: { id: created.id, title: created.title },
      brainstorm: { id: result.brainstorm.id, notes: result.brainstorm.notes },
    });
  });
