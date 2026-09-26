import { Hono } from "hono";
import { summarizeIdeaAnalytics } from "../../../app/lib/analytics";
import { createDb } from "../../../db/client";
import { listIdeaViews } from "../../../db/ideas";
import type { AppEnv } from "../../env";

/** The /app/analytics loader's data, for clients that cannot use the page gate. */
export const analyticsRoute = new Hono<AppEnv>().get("/", async (c) => {
  const db = createDb(c.env.DB);
  const ideas = await listIdeaViews(db);
  return c.json({ analytics: summarizeIdeaAnalytics(ideas) });
});
