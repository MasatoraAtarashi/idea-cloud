import { desc, eq, sql } from "drizzle-orm";
import type { Db } from "./client";
import { ideaBrainstorms, ideas, type IdeaBrainstorm } from "./schema";

export type { IdeaBrainstorm };

export type IdeaBrainstormView = {
  id: string;
  ideaId: string;
  notes: string;
  model: string;
  createdAt: string;
};

export function toBrainstormView(row: IdeaBrainstorm): IdeaBrainstormView {
  return {
    id: String(row.id),
    ideaId: String(row.ideaId),
    notes: row.notes,
    model: row.model,
    createdAt: row.createdAt,
  };
}

export function brainstormJson(row: IdeaBrainstorm) {
  return {
    id: row.id,
    ideaId: row.ideaId,
    notes: row.notes,
    model: row.model,
    createdAt: row.createdAt,
  };
}

export async function listBrainstormsForIdea(db: Db, ideaId: number): Promise<IdeaBrainstorm[]> {
  return db
    .select()
    .from(ideaBrainstorms)
    .where(eq(ideaBrainstorms.ideaId, ideaId))
    .orderBy(desc(ideaBrainstorms.createdAt), desc(ideaBrainstorms.id));
}

export async function getLatestBrainstorm(
  db: Db,
  ideaId: number,
): Promise<IdeaBrainstorm | undefined> {
  const [row] = await db
    .select()
    .from(ideaBrainstorms)
    .where(eq(ideaBrainstorms.ideaId, ideaId))
    .orderBy(desc(ideaBrainstorms.createdAt), desc(ideaBrainstorms.id))
    .limit(1);
  return row;
}

export async function insertIdeaBrainstorm(
  db: Db,
  ideaId: number,
  data: { notes: string; model: string },
): Promise<IdeaBrainstorm> {
  const [created] = await db
    .insert(ideaBrainstorms)
    .values({
      ideaId,
      notes: data.notes,
      model: data.model,
    })
    .returning();
  if (!created) {
    throw new Error("Failed to insert brainstorm");
  }
  await db
    .update(ideas)
    .set({ updatedAt: sql`(datetime('now'))` })
    .where(eq(ideas.id, ideaId));
  return created;
}
