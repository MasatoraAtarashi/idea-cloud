import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../../../db/client";
import { getIdeaRow, IDEA_BODY_MAX, ideaJson, insertIdea, listIdeaRows } from "../../../db/ideas";
import type { AppEnv } from "../../env";

const createIdeaSchema = z.object({
  body: z.string().trim().min(1).max(IDEA_BODY_MAX),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ideasRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const db = createDb(c.env.DB);
    const rows = await listIdeaRows(db);
    return c.json({ items: rows.map(ideaJson) });
  })
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const row = await getIdeaRow(db, id);
    if (!row) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.json({ item: ideaJson(row) });
  })
  .post("/", zValidator("json", createIdeaSchema), async (c) => {
    const { body } = c.req.valid("json");
    const db = createDb(c.env.DB);
    const created = await insertIdea(db, body);
    return c.json({ item: ideaJson(created) }, 201);
  });
