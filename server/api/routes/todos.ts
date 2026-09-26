import { zValidator } from "@hono/zod-validator";
import { desc, eq, not } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { apiDb } from "../db";
import { todos } from "../../../db/schema";
import type { AppEnv } from "../../env";

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(500),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const todosRoute = new Hono<AppEnv>()
  .get("/", async (c) => {
    const db = apiDb(c);
    const items = await db.select().from(todos).orderBy(desc(todos.id));
    return c.json({ items });
  })
  .post("/", zValidator("json", createTodoSchema), async (c) => {
    const data = c.req.valid("json");
    const db = apiDb(c);
    const [created] = await db.insert(todos).values(data).returning();
    return c.json({ item: created }, 201);
  })
  .patch("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const [updated] = await db
      .update(todos)
      .set({ done: not(todos.done) })
      .where(eq(todos.id, id))
      .returning();
    if (!updated) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.json({ item: updated });
  })
  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const db = apiDb(c);
    const [deleted] = await db.delete(todos).where(eq(todos.id, id)).returning();
    if (!deleted) {
      return c.json({ error: "Not Found" }, 404);
    }
    return c.body(null, 204);
  });
