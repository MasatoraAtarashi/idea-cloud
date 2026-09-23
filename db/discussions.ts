import { asc, eq, sql } from "drizzle-orm";
import type { Db } from "./client";
import { ideaChatMessages, ideas, type IdeaChatMessage } from "./schema";

export type { IdeaChatMessage };

export const DISCUSS_BODY_MAX = 2000;

export type IdeaChatRole = "user" | "assistant";

export type IdeaChatMessageView = {
  id: string;
  ideaId: string;
  role: IdeaChatRole;
  body: string;
  model: string | null;
  createdAt: string;
};

export function isIdeaChatRole(value: string): value is IdeaChatRole {
  return value === "user" || value === "assistant";
}

export function toChatMessageView(row: IdeaChatMessage): IdeaChatMessageView | null {
  if (!isIdeaChatRole(row.role)) return null;
  return {
    id: String(row.id),
    ideaId: String(row.ideaId),
    role: row.role,
    body: row.body,
    model: row.model,
    createdAt: row.createdAt,
  };
}

export function chatMessageJson(row: IdeaChatMessage) {
  return {
    id: row.id,
    ideaId: row.ideaId,
    role: row.role,
    body: row.body,
    model: row.model,
    createdAt: row.createdAt,
  };
}

export async function listChatMessagesForIdea(db: Db, ideaId: number): Promise<IdeaChatMessage[]> {
  return db
    .select()
    .from(ideaChatMessages)
    .where(eq(ideaChatMessages.ideaId, ideaId))
    .orderBy(asc(ideaChatMessages.createdAt), asc(ideaChatMessages.id));
}

export async function insertIdeaChatMessage(
  db: Db,
  ideaId: number,
  data: { role: IdeaChatRole; body: string; model?: string | null },
): Promise<IdeaChatMessage> {
  const [created] = await db
    .insert(ideaChatMessages)
    .values({
      ideaId,
      role: data.role,
      body: data.body,
      model: data.model ?? null,
    })
    .returning();
  if (!created) {
    throw new Error("Failed to insert chat message");
  }
  await db
    .update(ideas)
    .set({ updatedAt: sql`(datetime('now'))` })
    .where(eq(ideas.id, ideaId));
  return created;
}
