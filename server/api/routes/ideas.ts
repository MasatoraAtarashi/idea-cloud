import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../../../db/client";
import {
  getIdeaRow,
  IDEA_BODY_MAX,
  ideaJson,
  insertIdea,
  listIdeaRows,
  updateIdeaStage,
} from "../../../db/ideas";
import { STAGES } from "../../../app/data/mock";
import { bindResearchAi, researchIdea } from "../../ai/research";
import { resolveCreateTags } from "../../ai/tags";
import type { AppEnv } from "../../env";

const createIdeaSchema = z.object({
  body: z.string().trim().min(1).max(IDEA_BODY_MAX),
  stage: z.enum(STAGES).optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
});

const updateIdeaSchema = z.object({
  stage: z.enum(STAGES),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const researchSchema = z.object({
  preset: z.string().optional(),
  model: z.string().optional(),
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
    const { body, stage, tags } = c.req.valid("json");
    const db = createDb(c.env.DB);
    const resolvedTags = await resolveCreateTags({
      ai: bindResearchAi(c.env.AI),
      text: body,
      tags: tags ?? [],
    });
    const created = await insertIdea(db, body, { stage, tags: resolvedTags });
    return c.json({ item: ideaJson(created) }, 201);
  })
  .patch(
    "/:id",
    zValidator("param", idParamSchema),
    zValidator("json", updateIdeaSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { stage } = c.req.valid("json");
      const db = createDb(c.env.DB);
      const updated = await updateIdeaStage(db, id, stage);
      if (!updated) {
        return c.json({ error: "Not Found" }, 404);
      }
      return c.json({ item: ideaJson(updated) });
    },
  )
  .post("/:id/research", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const input = await readResearchInput(c);
    if ("error" in input) {
      return c.json({ error: input.error }, 400);
    }
    const db = createDb(c.env.DB);
    const result = await researchIdea({
      db,
      ai: bindResearchAi(c.env.AI),
      ideaId: id,
      preset: input.preset,
      model: input.model,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }
    return c.json({ item: ideaJson(result.idea) });
  });
