import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import {
  excerptAroundUrl,
  extractHttpUrls,
  normalizeInspirationUrl,
  titleFromUrlContext,
} from "../app/lib/idea-urls";
import { parseTags } from "./ideas";
import type { Db } from "./client";
import { inspirations, type Inspiration } from "./schema";

export type { Inspiration };

export {
  INSPIRATION_MEMO_MAX,
  INSPIRATION_TITLE_MAX,
  INSPIRATION_URL_MAX,
} from "../app/lib/inspiration-input";

export type OgStatus = "none" | "ok" | "failed";

/** `id` match restricted to the handle's workspace. */
function ownInspiration(db: Db, id: number) {
  return and(eq(inspirations.id, id), eq(inspirations.workspaceId, db.workspaceId));
}

export type InspirationOgpPatch = {
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogSiteName: string;
  ogFetchedAt: string | null;
  ogStatus: OgStatus;
};

export type InspirationView = {
  id: string;
  title: string;
  url: string | null;
  memo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogSiteName: string;
  ogFetchedAt: string | null;
  ogStatus: OgStatus;
};

function asOgStatus(value: string | null | undefined): OgStatus {
  if (value === "ok" || value === "failed" || value === "none") return value;
  return "none";
}

function ogFields(row: Inspiration) {
  return {
    ogTitle: row.ogTitle?.trim() ?? "",
    ogDescription: row.ogDescription?.trim() ?? "",
    ogImageUrl: row.ogImageUrl?.trim() ?? "",
    ogSiteName: row.ogSiteName?.trim() ?? "",
    ogFetchedAt: row.ogFetchedAt?.trim() || null,
    ogStatus: asOgStatus(row.ogStatus),
  };
}

export function inspirationView(row: Inspiration): InspirationView {
  return {
    id: String(row.id),
    title: row.title,
    url: row.url?.trim() || null,
    memo: row.memo ?? "",
    tags: parseTags(row.tags),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
    ...ogFields(row),
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
    ...ogFields(row),
  };
}

export function ideaTextFromInspiration(
  row: Pick<Inspiration, "title" | "url" | "memo"> & { ogTitle?: string | null },
): string {
  const url = row.url?.trim() ?? "";
  const memo = row.memo.trim();
  const ogTitle = row.ogTitle?.trim() ?? "";
  const title = row.title.trim() || "無題";
  const page = ogTitle && ogTitle !== title ? `ページ: ${ogTitle}` : "";
  return [title, url ? `URL: ${url}` : "", page, memo].filter(Boolean).join("\n");
}

export async function listInspirationRows(db: Db): Promise<Inspiration[]> {
  return db
    .select()
    .from(inspirations)
    .where(eq(inspirations.workspaceId, db.workspaceId))
    .orderBy(desc(inspirations.id));
}

export async function getInspirationRow(db: Db, id: number): Promise<Inspiration | undefined> {
  const [row] = await db.select().from(inspirations).where(ownInspiration(db, id)).limit(1);
  return row;
}

export async function insertInspiration(
  db: Db,
  data: { title: string; url?: string | null; memo?: string; tags?: string[] },
): Promise<Inspiration> {
  const [created] = await db
    .insert(inspirations)
    .values({
      workspaceId: db.workspaceId,
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
    .where(ownInspiration(db, id))
    .returning();
  return updated;
}

export async function updateInspirationOgp(
  db: Db,
  id: number,
  data: InspirationOgpPatch,
): Promise<Inspiration | undefined> {
  const [updated] = await db
    .update(inspirations)
    .set({
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImageUrl: data.ogImageUrl,
      ogSiteName: data.ogSiteName,
      ogFetchedAt: data.ogFetchedAt,
      ogStatus: data.ogStatus,
    })
    .where(ownInspiration(db, id))
    .returning();
  return updated;
}

export async function deleteInspiration(db: Db, id: number): Promise<Inspiration | undefined> {
  const [deleted] = await db.delete(inspirations).where(ownInspiration(db, id)).returning();
  return deleted;
}

export function urlsDiffer(
  before: string | null | undefined,
  after: string | null | undefined,
): boolean {
  return (before?.trim() || "") !== (after?.trim() || "");
}

export async function findInspirationByUrl(db: Db, url: string): Promise<Inspiration | undefined> {
  const target = normalizeInspirationUrl(url);
  if (!target) return undefined;
  const rows = await db
    .select()
    .from(inspirations)
    .where(and(isNotNull(inspirations.url), eq(inspirations.workspaceId, db.workspaceId)));
  return rows.find((row) => row.url && normalizeInspirationUrl(row.url) === target);
}

/** Insert one inspiration per distinct URL. Existing URLs are left as-is. */
export async function upsertInspirationsFromIdeaText(db: Db, text: string): Promise<number> {
  const urls = extractHttpUrls(text);
  if (urls.length === 0) return 0;
  const existing = await db
    .select()
    .from(inspirations)
    .where(and(isNotNull(inspirations.url), eq(inspirations.workspaceId, db.workspaceId)));
  const seen = new Set(
    existing
      .map((row) => (row.url ? normalizeInspirationUrl(row.url) : ""))
      .filter((key) => key.length > 0),
  );
  let created = 0;
  for (const url of urls) {
    const key = normalizeInspirationUrl(url);
    if (!key || seen.has(key)) continue;
    try {
      await insertInspiration(db, {
        title: titleFromUrlContext(text, url),
        url,
        memo: excerptAroundUrl(text, url),
        tags: [],
      });
      seen.add(key);
      created += 1;
    } catch {
      // One URL must not block the rest.
    }
  }
  return created;
}

/** Idea create/edit must succeed even if the shelf write fails. */
export async function safeUpsertInspirationsFromIdeaText(db: Db, text: string): Promise<void> {
  try {
    await upsertInspirationsFromIdeaText(db, text);
  } catch {
    // ignore
  }
}
