import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { STAGES } from "../../../app/data/mock";
import { normalizeSavedViewFilters } from "../../../app/lib/list-view-search";
import { createDb } from "../../../db/client";
import {
  countSavedViews,
  deleteSavedView,
  insertSavedView,
  listSavedViews,
  SAVED_VIEW_MAX,
  SAVED_VIEW_NAME_MAX,
  savedViewJson,
} from "../../../db/saved-views";
import type { AppEnv } from "../../env";

const createSavedViewSchema = z.object({
  name: z.string().trim().min(1).max(SAVED_VIEW_NAME_MAX),
  filters: z
    .object({
      tab: z.enum(["all", "aging-shelf", "candidates", "tried"]).optional(),
      minDays: z.number().int().min(0).optional(),
      view: z.enum(["table", "board"]).optional(),
      query: z.string().max(200).optional(),
      stages: z.array(z.enum(STAGES)).optional(),
      tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
      categoryId: z.number().int().positive().nullable().optional(),
    })
    .optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const savedViewsRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const db = createDb(c.env.DB);
    const rows = await listSavedViews(db);
    return c.json({ items: rows.map(savedViewJson) });
  })
  .post("/", zValidator("json", createSavedViewSchema), async (c) => {
    const { name, filters } = c.req.valid("json");
    const db = createDb(c.env.DB);
    if ((await countSavedViews(db)) >= SAVED_VIEW_MAX) {
      return c.json({ error: "ビューが多すぎます" }, 400);
    }
    const created = await insertSavedView(db, name, normalizeSavedViewFilters(filters ?? {}));
    return c.json({ item: savedViewJson(created) }, 201);
  })
  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const deleted = await deleteSavedView(db, id);
    if (!deleted) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.body(null, 204);
  });
