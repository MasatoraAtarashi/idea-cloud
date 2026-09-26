import { and, asc, eq } from "drizzle-orm";
import {
  CATEGORY_NAME_MAX,
  CATEGORY_NAME_TOO_LONG,
  normalizeCategoryName,
  type IdeaCategory,
} from "../app/lib/category";
import type { Db } from "./client";
import { categories, type Category } from "./schema";

export async function listCategories(db: Db): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.workspaceId, db.workspaceId))
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function listCategoryViews(db: Db): Promise<IdeaCategory[]> {
  const rows = await listCategories(db);
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function getCategory(db: Db, id: number): Promise<Category | undefined> {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.workspaceId, db.workspaceId)))
    .limit(1);
  return row;
}

export async function categoryNameFor(
  db: Db,
  id: number | null | undefined,
): Promise<string | null> {
  if (id == null) return null;
  const row = await getCategory(db, id);
  return row?.name ?? null;
}

export async function categoryNameMap(db: Db): Promise<Map<number, string>> {
  const rows = await listCategories(db);
  return new Map(rows.map((row) => [row.id, row.name]));
}

/** Reuse a same-name row so the picker does not create duplicates. */
export async function findOrCreateCategory(db: Db, rawName: string): Promise<Category> {
  const name = normalizeCategoryName(rawName);
  const [existing] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.name, name), eq(categories.workspaceId, db.workspaceId)))
    .limit(1);
  if (existing) return existing;
  const rows = await db
    .select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.workspaceId, db.workspaceId));
  const sortOrder = rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
  const [created] = await db
    .insert(categories)
    .values({ workspaceId: db.workspaceId, name, sortOrder })
    .returning();
  if (!created) {
    throw new Error("Failed to insert category");
  }
  return created;
}

export async function resolveCategoryId(
  db: Db,
  input: { categoryId?: number | null; categoryName?: string | null },
): Promise<{ id: number | null } | { error: string }> {
  const name = normalizeCategoryName(input.categoryName ?? "");
  if (name) {
    if (name.length > CATEGORY_NAME_MAX) return { error: CATEGORY_NAME_TOO_LONG };
    const row = await findOrCreateCategory(db, name);
    return { id: row.id };
  }
  if (input.categoryId == null) return { id: null };
  const existing = await getCategory(db, input.categoryId);
  return { id: existing?.id ?? null };
}
