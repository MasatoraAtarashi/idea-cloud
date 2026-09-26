import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../../../db/client";
import { SEARCH_QUERY_MAX, searchWorkspaceDb } from "../../../db/search";
import type { AppEnv } from "../../env";

/**
 * Native clients cannot reach /app/search: that resource route sits behind the
 * cookie-only page gate. Same query, same shape, under the Bearer-capable /api.
 */
const querySchema = z.object({
  q: z.string().max(SEARCH_QUERY_MAX).optional(),
});

export const searchRoute = new Hono<AppEnv>().get(
  "/",
  zValidator("query", querySchema),
  async (c) => {
    const { q } = c.req.valid("query");
    const db = createDb(c.env.DB);
    return c.json(await searchWorkspaceDb(db, q ?? ""), 200, { "cache-control": "no-store" });
  },
);
