import { desc, eq, sql } from "drizzle-orm";
import type { MockIdea, Stage } from "../app/data/mock";
import { STAGES } from "../app/data/mock";
import type { Db } from "./client";
import { ideas, type Idea } from "./schema";

export const IDEA_BODY_MAX = 8000;

export function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
  } catch {
    return [];
  }
}

export function asStage(value: string): Stage {
  return (STAGES as readonly string[]).includes(value) ? (value as Stage) : "spark";
}

export function agedDaysSince(createdAt: string): number {
  const iso = createdAt.includes("T") ? createdAt : `${createdAt.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return 0;
  return Math.max(0, Math.floor((Date.now() - ms) / 86_400_000));
}

export function splitTitleBody(text: string): { title: string; body: string } {
  const body = text.trim();
  const firstLine = body.split("\n")[0]?.trim() ?? "";
  const title = firstLine.slice(0, 200) || "無題";
  return { title, body };
}

export function toIdeaView(row: Idea): MockIdea {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    stage: asStage(row.stage),
    tags: parseTags(row.tags),
    author: "",
    team: "",
    createdAt: row.createdAt,
    agedDays: agedDaysSince(row.createdAt),
    relatedIds: [],
    researchNotes: row.researchNotes,
    researchModel: row.researchModel,
    researchedAt: row.researchedAt,
  };
}

export function ideaJson(row: Idea) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    stage: asStage(row.stage),
    tags: parseTags(row.tags),
    createdAt: row.createdAt,
    researchNotes: row.researchNotes,
    researchModel: row.researchModel,
    researchedAt: row.researchedAt,
  };
}

export async function listIdeaRows(db: Db): Promise<Idea[]> {
  return db.select().from(ideas).orderBy(desc(ideas.id));
}

export async function listIdeaViews(db: Db): Promise<MockIdea[]> {
  const rows = await listIdeaRows(db);
  return rows.map(toIdeaView);
}

export async function getIdeaRow(db: Db, id: number): Promise<Idea | undefined> {
  const [row] = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
  return row;
}

export async function getIdeaView(db: Db, id: string | undefined): Promise<MockIdea | undefined> {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) return undefined;
  const row = await getIdeaRow(db, numeric);
  return row ? toIdeaView(row) : undefined;
}

export async function insertIdea(db: Db, text: string): Promise<Idea> {
  const { title, body } = splitTitleBody(text);
  const [created] = await db
    .insert(ideas)
    .values({ title, body, stage: "spark", tags: "[]" })
    .returning();
  if (!created) {
    throw new Error("Failed to insert idea");
  }
  return created;
}

export async function saveIdeaResearch(
  db: Db,
  id: number,
  data: { notes: string; model: string },
): Promise<Idea> {
  const [updated] = await db
    .update(ideas)
    .set({
      researchNotes: data.notes,
      researchModel: data.model,
      researchedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  if (!updated) {
    throw new Error("Failed to save research");
  }
  return updated;
}
