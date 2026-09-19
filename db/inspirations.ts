import { desc, eq, sql } from "drizzle-orm";
import { parseTags } from "./ideas";
import type { Db } from "./client";
import { inspirations, type Inspiration } from "./schema";

export type { Inspiration };

export const INSPIRATION_TITLE_MAX = 200;
export const INSPIRATION_MEMO_MAX = 4000;
export const INSPIRATION_URL_MAX = 2000;

export type InspirationView = {
  id: string;
  title: string;
  url: string | null;
  memo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export function inspirationView(row: Inspiration): InspirationView {
  return {
    id: String(row.id),
    title: row.title,
    url: row.url?.trim() || null,
    memo: row.memo ?? "",
    tags: parseTags(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
  };
}

export function inspirationJson(row: Inspiration) {
  return {
    id: row.id,
    title: row.title,
    url: row.url?.trim() || null,
    memo: row.memo ?? "",
    tags: parseTags(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
  };
}

export function ideaTextFromInspiration(row: Pick<Inspiration, "title" | "url" | "memo">): string {
  const url = row.url?.trim() ?? "";
  const memo = row.memo.trim();
  return [row.title.trim() || "無題", url ? `URL: ${url}` : "", memo].filter(Boolean).join("\n");
}

export async function listInspirationRows(db: Db): Promise<Inspiration[]> {
  return db.select().from(inspirations).orderBy(desc(inspirations.id));
}

export async function getInspirationRow(db: Db, id: number): Promise<Inspiration | undefined> {
  const [row] = await db.select().from(inspirations).where(eq(inspirations.id, id)).limit(1);
  return row;
}

export async function insertInspiration(
  db: Db,
  data: { title: string; url?: string | null; memo?: string; tags?: string[] },
): Promise<Inspiration> {
  const [created] = await db
    .insert(inspirations)
    .values({
      title: data.title.trim() || "無題",
      url: data.url?.trim() || null,
      memo: data.memo?.trim() ?? "",
      tags: JSON.stringify(data.tags ?? []),
    })
    .returning();
  if (!created) {
    throw new Error("Failed to insert inspiration");
  }
  return created;
}

export async function updateInspiration(
  db: Db,
  id: number,
  data: { title?: string; url?: string | null; memo?: string; tags?: string[] },
): Promise<Inspiration | undefined> {
  const [updated] = await db
    .update(inspirations)
    .set({
      ...(data.title !== undefined ? { title: data.title.trim() || "無題" } : {}),
      ...(data.url !== undefined ? { url: data.url?.trim() || null } : {}),
      ...(data.memo !== undefined ? { memo: data.memo.trim() } : {}),
      ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(inspirations.id, id))
    .returning();
  return updated;
}

export async function deleteInspiration(db: Db, id: number): Promise<Inspiration | undefined> {
  const [deleted] = await db.delete(inspirations).where(eq(inspirations.id, id)).returning();
  return deleted;
}
