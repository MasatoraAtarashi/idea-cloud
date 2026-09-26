import { and, desc, eq } from "drizzle-orm";
import {
  normalizeSavedViewFilters,
  parseSavedViewFilters,
  SAVED_VIEW_MAX,
  SAVED_VIEW_NAME_MAX,
  type SavedViewFilters,
  type SavedViewItem,
} from "../app/lib/list-view-search";
import type { Db } from "./client";
import { savedViews, type SavedView } from "./schema";

export type { SavedView };
export { SAVED_VIEW_MAX, SAVED_VIEW_NAME_MAX };

export type SavedViewJson = SavedViewItem;

export function savedViewJson(row: SavedView): SavedViewJson {
  return {
    id: row.id,
    name: row.name,
    filters: parseSavedViewFilters(row.filters),
    createdAt: row.createdAt,
  };
}

export async function listSavedViews(db: Db): Promise<SavedView[]> {
  return db
    .select()
    .from(savedViews)
    .where(eq(savedViews.workspaceId, db.workspaceId))
    .orderBy(desc(savedViews.id));
}

export async function getSavedView(db: Db, id: number): Promise<SavedView | undefined> {
  const [row] = await db
    .select()
    .from(savedViews)
    .where(and(eq(savedViews.id, id), eq(savedViews.workspaceId, db.workspaceId)))
    .limit(1);
  return row;
}

export async function countSavedViews(db: Db): Promise<number> {
  const rows = await db
    .select({ id: savedViews.id })
    .from(savedViews)
    .where(eq(savedViews.workspaceId, db.workspaceId));
  return rows.length;
}

export async function insertSavedView(
  db: Db,
  name: string,
  filters: SavedViewFilters,
): Promise<SavedView> {
  const [created] = await db
    .insert(savedViews)
    .values({
      workspaceId: db.workspaceId,
      name,
      filters: JSON.stringify(normalizeSavedViewFilters(filters)),
    })
    .returning();
  if (!created) {
    throw new Error("Failed to insert saved view");
  }
  return created;
}

export async function deleteSavedView(db: Db, id: number): Promise<SavedView | undefined> {
  const [deleted] = await db
    .delete(savedViews)
    .where(and(eq(savedViews.id, id), eq(savedViews.workspaceId, db.workspaceId)))
    .returning();
  return deleted;
}
