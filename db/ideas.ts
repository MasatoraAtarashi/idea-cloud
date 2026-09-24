import { desc, eq, sql } from "drizzle-orm";
import type { MockIdea, Stage } from "../app/data/mock";
import { STAGES } from "../app/data/mock";
import { parseReflectionStatus, type ReflectionStatus } from "../app/lib/reflection";
import { parseResearchSources } from "../app/lib/research-sources";
import { parseReviewStatus, type ReviewStatus } from "../app/lib/review";
import { getLatestBrainstorm, type IdeaBrainstorm } from "./brainstorms";
import { categoryNameFor, categoryNameMap } from "./categories";
import { commentCountsByIdeaIds } from "./comments";
import type { Db } from "./client";
import { ideaBrainstorms, ideaChatMessages, ideaComments, ideas, type Idea } from "./schema";

export type { Idea };

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

export function toIdeaView(
  row: Idea,
  extras?: {
    commentCount?: number;
    brainstorm?: IdeaBrainstorm | null;
    categoryName?: string | null;
  },
): MockIdea {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    stage: asStage(row.stage),
    tags: parseTags(row.tags),
    categoryId: row.categoryId ?? null,
    categoryName: extras?.categoryName ?? null,
    author: "",
    team: "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
    agedDays: agedDaysSince(row.createdAt),
    relatedIds: [],
    commentCount: extras?.commentCount ?? 0,
    researchNotes: row.researchNotes,
    researchModel: row.researchModel,
    researchedAt: row.researchedAt,
    researchSources: parseResearchSources(row.researchSources),
    brainstormNotes: extras?.brainstorm?.notes ?? null,
    brainstormModel: extras?.brainstorm?.model ?? null,
    brainstormedAt: extras?.brainstorm?.createdAt ?? null,
    humanScore: row.humanScore ?? null,
    humanScoreNote: row.humanScoreNote ?? null,
    humanScoredAt: row.humanScoredAt ?? null,
    aiScore: row.aiScore ?? null,
    aiEvaluation: row.aiEvaluation ?? null,
    aiEvaluatedAt: row.aiEvaluatedAt ?? null,
    aiEvaluationModel: row.aiEvaluationModel ?? null,
    lastReviewedAt: row.lastReviewedAt ?? null,
    reviewStatus: parseReviewStatus(row.reviewStatus),
    reflectionOutcome: row.reflectionOutcome ?? "",
    reflectionStatus: parseReflectionStatus(row.reflectionStatus),
    reflectionNotes: row.reflectionNotes ?? "",
  };
}

export function ideaJson(
  row: Idea,
  extras?: {
    commentCount?: number;
    brainstorm?: IdeaBrainstorm | null;
    categoryName?: string | null;
  },
) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    stage: asStage(row.stage),
    tags: parseTags(row.tags),
    categoryId: row.categoryId ?? null,
    categoryName: extras?.categoryName ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
    commentCount: extras?.commentCount ?? 0,
    researched: Boolean(row.researchedAt || row.researchNotes),
    researchNotes: row.researchNotes,
    researchModel: row.researchModel,
    researchedAt: row.researchedAt,
    researchSources: parseResearchSources(row.researchSources),
    brainstormNotes: extras?.brainstorm?.notes ?? null,
    brainstormModel: extras?.brainstorm?.model ?? null,
    brainstormedAt: extras?.brainstorm?.createdAt ?? null,
    humanScore: row.humanScore ?? null,
    humanScoreNote: row.humanScoreNote ?? null,
    humanScoredAt: row.humanScoredAt ?? null,
    aiScore: row.aiScore ?? null,
    aiEvaluation: row.aiEvaluation ?? null,
    aiEvaluatedAt: row.aiEvaluatedAt ?? null,
    aiEvaluationModel: row.aiEvaluationModel ?? null,
    lastReviewedAt: row.lastReviewedAt ?? null,
    reviewStatus: parseReviewStatus(row.reviewStatus),
    reflectionOutcome: row.reflectionOutcome ?? "",
    reflectionStatus: parseReflectionStatus(row.reflectionStatus),
    reflectionNotes: row.reflectionNotes ?? "",
  };
}

export async function ideaJsonWithCategory(
  db: Db,
  row: Idea,
  extras?: { commentCount?: number; brainstorm?: IdeaBrainstorm | null },
) {
  return ideaJson(row, {
    ...extras,
    categoryName: await categoryNameFor(db, row.categoryId),
  });
}

export async function listIdeaRows(db: Db): Promise<Idea[]> {
  return db.select().from(ideas).orderBy(desc(ideas.id));
}

export async function listIdeaViews(db: Db): Promise<MockIdea[]> {
  const rows = await listIdeaRows(db);
  const [counts, names] = await Promise.all([
    commentCountsByIdeaIds(
      db,
      rows.map((row) => row.id),
    ),
    categoryNameMap(db),
  ]);
  return rows.map((row) =>
    toIdeaView(row, {
      commentCount: counts.get(row.id) ?? 0,
      categoryName: row.categoryId != null ? (names.get(row.categoryId) ?? null) : null,
    }),
  );
}

export async function getIdeaRow(db: Db, id: number): Promise<Idea | undefined> {
  const [row] = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
  return row;
}

export async function getIdeaView(db: Db, id: string | undefined): Promise<MockIdea | undefined> {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) return undefined;
  const row = await getIdeaRow(db, numeric);
  if (!row) return undefined;
  const counts = await commentCountsByIdeaIds(db, [row.id]);
  const brainstorm = await getLatestBrainstorm(db, row.id);
  return toIdeaView(row, {
    commentCount: counts.get(row.id) ?? 0,
    brainstorm: brainstorm ?? null,
    categoryName: await categoryNameFor(db, row.categoryId),
  });
}

export async function insertIdeaRow(
  db: Db,
  data: {
    title: string;
    body: string;
    stage?: Stage;
    tags?: string[];
    categoryId?: number | null;
    inspirationId?: number | null;
  },
): Promise<Idea> {
  const title = data.title.trim().slice(0, 200) || "無題";
  const body = data.body;
  const stage = data.stage ?? "spark";
  const tags = JSON.stringify(data.tags ?? []);
  const [created] = await db
    .insert(ideas)
    .values({
      title,
      body,
      stage,
      tags,
      ...(data.categoryId != null ? { categoryId: data.categoryId } : {}),
      ...(data.inspirationId != null ? { inspirationId: data.inspirationId } : {}),
    })
    .returning();
  if (!created) {
    throw new Error("Failed to insert idea");
  }
  return created;
}

export async function insertIdea(
  db: Db,
  text: string,
  extras?: {
    stage?: Stage;
    tags?: string[];
    categoryId?: number | null;
    inspirationId?: number | null;
  },
): Promise<Idea> {
  const { title, body } = splitTitleBody(text);
  return insertIdeaRow(db, {
    title,
    body,
    stage: extras?.stage,
    tags: extras?.tags,
    categoryId: extras?.categoryId,
    inspirationId: extras?.inspirationId,
  });
}

export async function updateIdeaStage(db: Db, id: number, stage: Stage): Promise<Idea | undefined> {
  const [updated] = await db
    .update(ideas)
    .set({ stage, updatedAt: sql`(datetime('now'))` })
    .where(eq(ideas.id, id))
    .returning();
  return updated;
}

export async function saveIdeaResearch(
  db: Db,
  id: number,
  data: { notes: string; model: string; sources?: string | null },
): Promise<Idea> {
  const [updated] = await db
    .update(ideas)
    .set({
      researchNotes: data.notes,
      researchModel: data.model,
      researchedAt: sql`(datetime('now'))`,
      researchSources: data.sources ?? null,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  if (!updated) {
    throw new Error("Failed to save research");
  }
  return updated;
}

export async function updateIdeaFields(
  db: Db,
  id: number,
  data: {
    title?: string;
    body?: string;
    tags?: string[];
    stage?: Stage;
    categoryId?: number | null;
  },
): Promise<Idea | undefined> {
  const [updated] = await db
    .update(ideas)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.tags !== undefined ? { tags: JSON.stringify(data.tags) } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  return updated;
}

export async function saveHumanScore(
  db: Db,
  id: number,
  data: { score: number; note: string },
): Promise<Idea | undefined> {
  const [updated] = await db
    .update(ideas)
    .set({
      humanScore: data.score,
      humanScoreNote: data.note,
      humanScoredAt: sql`(datetime('now'))`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  return updated;
}

export async function saveAiEvaluation(
  db: Db,
  id: number,
  data: { score: number | null; notes: string; model: string },
): Promise<Idea> {
  const [updated] = await db
    .update(ideas)
    .set({
      aiScore: data.score,
      aiEvaluation: data.notes,
      aiEvaluationModel: data.model,
      aiEvaluatedAt: sql`(datetime('now'))`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  if (!updated) {
    throw new Error("Failed to save evaluation");
  }
  return updated;
}

export async function saveIdeaReview(
  db: Db,
  id: number,
  status: ReviewStatus,
): Promise<Idea | undefined> {
  const [updated] = await db
    .update(ideas)
    .set({
      reviewStatus: status,
      lastReviewedAt: sql`(datetime('now'))`,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  return updated;
}

export async function deleteIdea(db: Db, id: number): Promise<boolean> {
  const existing = await getIdeaRow(db, id);
  if (!existing) return false;
  await db.delete(ideaComments).where(eq(ideaComments.ideaId, id));
  await db.delete(ideaBrainstorms).where(eq(ideaBrainstorms.ideaId, id));
  await db.delete(ideaChatMessages).where(eq(ideaChatMessages.ideaId, id));
  await db.delete(ideas).where(eq(ideas.id, id));
  return true;
}

export async function saveIdeaReflection(
  db: Db,
  id: number,
  data: { outcome: string; status: ReflectionStatus; notes: string },
): Promise<Idea | undefined> {
  const [updated] = await db
    .update(ideas)
    .set({
      reflectionOutcome: data.outcome,
      reflectionStatus: data.status,
      reflectionNotes: data.notes,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(ideas.id, id))
    .returning();
  return updated;
}
