import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { CommentAuthor } from "../app/data/mock";
import type { Db } from "./client";
import { ideaIdsInWorkspace, ownIdea } from "./ideas";
import { ideaComments, ideas, type IdeaComment } from "./schema";

export type { IdeaComment };

export const COMMENT_BODY_MAX = 2000;

export type IdeaCommentView = {
  id: string;
  ideaId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export function toCommentView(row: IdeaComment): IdeaCommentView {
  return {
    id: String(row.id),
    ideaId: String(row.ideaId),
    body: row.body,
    authorId: row.authorId,
    authorName: row.authorName,
    createdAt: row.createdAt,
  };
}

export function commentJson(row: IdeaComment) {
  return {
    id: row.id,
    ideaId: row.ideaId,
    body: row.body,
    authorId: row.authorId,
    authorName: row.authorName,
    createdAt: row.createdAt,
  };
}

export async function listCommentsForIdea(db: Db, ideaId: number): Promise<IdeaComment[]> {
  return db
    .select()
    .from(ideaComments)
    .where(
      and(eq(ideaComments.ideaId, ideaId), inArray(ideaComments.ideaId, ideaIdsInWorkspace(db))),
    )
    .orderBy(asc(ideaComments.createdAt), asc(ideaComments.id));
}

export async function commentCountsByIdeaIds(
  db: Db,
  ideaIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (ideaIds.length === 0) return counts;
  const rows = await db
    .select({
      ideaId: ideaComments.ideaId,
      count: sql<number>`count(*)`,
    })
    .from(ideaComments)
    .where(
      and(
        inArray(ideaComments.ideaId, ideaIds),
        inArray(ideaComments.ideaId, ideaIdsInWorkspace(db)),
      ),
    )
    .groupBy(ideaComments.ideaId);
  for (const row of rows) {
    counts.set(row.ideaId, Number(row.count) || 0);
  }
  return counts;
}

export async function insertIdeaComment(
  db: Db,
  ideaId: number,
  body: string,
  author: CommentAuthor,
): Promise<IdeaComment> {
  await touchOwnIdea(db, ideaId);
  const [created] = await db
    .insert(ideaComments)
    .values({
      ideaId,
      body,
      authorId: author.id,
      authorName: author.name,
    })
    .returning();
  if (!created) {
    throw new Error("Failed to insert comment");
  }
  return created;
}

/** Bumps updated_at and, as a side effect, proves the idea is in this workspace. */
async function touchOwnIdea(db: Db, ideaId: number): Promise<void> {
  const [touched] = await db
    .update(ideas)
    .set({ updatedAt: sql`(datetime('now'))` })
    .where(ownIdea(db, ideaId))
    .returning({ id: ideas.id });
  if (!touched) throw new Error("Idea not found in workspace");
}
