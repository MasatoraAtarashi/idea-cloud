import { filterIdeas, type Stage } from "../../app/data/mock";
import { summarizeIdeaAnalytics } from "../../app/lib/analytics";
import { extractHttpUrls } from "../../app/lib/idea-urls";
import {
  INSPIRATION_EMPTY_MESSAGE,
  INSPIRATION_MEMO_TOO_LONG_MESSAGE,
  INSPIRATION_TITLE_TOO_LONG_MESSAGE,
  INSPIRATION_URL_TOO_LONG_MESSAGE,
  prepareInspirationInput,
} from "../../app/lib/inspiration-input";
import { insertPreparedInspiration } from "../../app/lib/inspiration-save";
import type { Db } from "../../db/client";
import {
  COMMENT_BODY_MAX,
  commentJson,
  insertIdeaComment,
  listCommentsForIdea,
} from "../../db/comments";
import {
  getIdeaRow,
  ideaJson,
  insertIdeaRow,
  listIdeaRows,
  listIdeaViews,
  splitTitleBody,
  toIdeaView,
  updateIdeaFields,
  type Idea,
} from "../../db/ideas";
import {
  INSPIRATION_MEMO_MAX,
  INSPIRATION_TITLE_MAX,
  INSPIRATION_URL_MAX,
  inspirationJson,
  listInspirationRows,
  safeUpsertInspirationsFromIdeaText,
} from "../../db/inspirations";
import { toolError, toolJson, type McpToolResult } from "./result";
import { JA } from "../../app/i18n/dictionary";

export const MCP_LIST_DEFAULT_LIMIT = 20;
export const MCP_LIST_MAX_LIMIT = 100;
export const MCP_COMMENT_AUTHOR = { id: "mcp", name: "MCP" } as const;

const IDEA_TITLE_MAX = 200;

export type ListPageArgs = {
  limit?: number;
  offset?: number;
  cursor?: string;
};

export type ListIdeasArgs = ListPageArgs & {
  stage?: Stage;
  status?: Stage;
  tags?: string[];
  keyword?: string;
};

export type SearchIdeasArgs = ListPageArgs & {
  query: string;
};

export type CreateIdeaArgs = {
  title?: string;
  body?: string;
  tags?: string[];
  stage?: Stage;
};

export type UpdateIdeaArgs = {
  id: number;
  title?: string;
  body?: string;
  tags?: string[];
  stage?: Stage;
};

export type IdeaIdArgs = { id: number };

export type AddCommentArgs = { id: number; text: string };

export type CreateInspirationArgs = {
  title?: string;
  url?: string | null;
  memo?: string;
  tags?: string[];
};

type IdeaView = ReturnType<typeof toIdeaView>;

function readOffset(
  cursor: string | undefined,
  offset: number | undefined,
): number | { error: string } {
  if (cursor != null && cursor !== "") {
    if (!/^\d+$/.test(cursor)) return { error: "invalid_cursor" };
    const value = Number(cursor);
    if (!Number.isSafeInteger(value)) return { error: "invalid_cursor" };
    return value;
  }
  return offset ?? 0;
}

function pageOf<T>(items: T[], offset: number, limit: number) {
  const slice = items.slice(offset, offset + limit);
  const next = offset + limit < items.length ? String(offset + limit) : null;
  return { slice, next, total: items.length };
}

function resolveStage(stage?: Stage, status?: Stage): Stage | undefined | { error: string } {
  if (stage && status && stage !== status) {
    return { error: "stage_status_mismatch" };
  }
  return stage ?? status;
}

function byUpdatedDesc(a: { updatedAt: string; id: string }, b: { updatedAt: string; id: string }) {
  const time = b.updatedAt.localeCompare(a.updatedAt);
  if (time !== 0) return time;
  return Number(b.id) - Number(a.id);
}

function shortIdea(idea: IdeaView) {
  return {
    id: Number(idea.id),
    title: idea.title,
    stage: idea.stage,
    tags: idea.tags,
    updated_at: idea.updatedAt,
  };
}

function researchSnapshot(row: Idea) {
  const notes = row.researchNotes?.trim() ?? "";
  const researchedAt = row.researchedAt?.trim() || null;
  if (!notes && !researchedAt && !row.researchModel) return null;
  return {
    notes: row.researchNotes ?? "",
    model: row.researchModel,
    researched_at: researchedAt,
    sources: extractHttpUrls(row.researchNotes ?? "", 20),
  };
}

async function ideaDetail(db: Db, row: Idea): Promise<Record<string, unknown>> {
  const comments = await listCommentsForIdea(db, row.id);
  const view = ideaJson(row, { commentCount: comments.length });
  return {
    id: view.id,
    title: view.title,
    body: view.body,
    stage: view.stage,
    tags: view.tags,
    created_at: view.createdAt,
    updated_at: view.updatedAt,
    comments: comments.map((comment) => {
      const json = commentJson(comment);
      return {
        id: json.id,
        idea_id: json.ideaId,
        body: json.body,
        author_id: json.authorId,
        author_name: json.authorName,
        created_at: json.createdAt,
      };
    }),
    research: researchSnapshot(row),
    human_score: view.humanScore,
    human_score_note: view.humanScoreNote,
    ai_score: view.aiScore,
    ai_evaluation: view.aiEvaluation,
    review_status: view.reviewStatus,
    reflection_status: view.reflectionStatus,
    reflection_outcome: view.reflectionOutcome,
    reflection_notes: view.reflectionNotes,
  };
}

function excerpt(body: string, query: string): string {
  const needle = query.trim().toLowerCase();
  const index = body.toLowerCase().indexOf(needle);
  if (index < 0) return body.slice(0, 160);
  const start = Math.max(0, index - 80);
  const end = Math.min(body.length, index + needle.length + 80);
  const slice = body.slice(start, end);
  return `${start > 0 ? "…" : ""}${slice}${end < body.length ? "…" : ""}`;
}

function inspirationRecord(row: ReturnType<typeof inspirationJson>) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    memo: row.memo,
    tags: row.tags,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    og_title: row.ogTitle,
    og_description: row.ogDescription,
    og_image_url: row.ogImageUrl,
    og_site_name: row.ogSiteName,
    og_fetched_at: row.ogFetchedAt,
    og_status: row.ogStatus,
  };
}

export async function listIdeas(db: Db, args: ListIdeasArgs): Promise<McpToolResult> {
  const stage = resolveStage(args.stage, args.status);
  if (stage && typeof stage === "object") {
    return toolError(stage.error, {
      message: "stage and status must be the same idea stage when both are set",
    });
  }
  const offset = readOffset(args.cursor, args.offset);
  if (typeof offset !== "number")
    return toolError(offset.error, { message: "cursor must be a non-negative integer" });
  const limit = args.limit ?? MCP_LIST_DEFAULT_LIMIT;
  const rows = await listIdeaRows(db);
  const filtered = filterIdeas(
    rows.map((row) => toIdeaView(row)),
    {
      query: args.keyword?.trim() ?? "",
      stages: stage ? [stage] : [],
      tags: args.tags ?? [],
    },
  ).sort(byUpdatedDesc);
  const page = pageOf(filtered, offset, limit);
  return toolJson({
    items: page.slice.map(shortIdea),
    next_cursor: page.next,
    total: page.total,
  });
}

export async function getIdea(db: Db, args: IdeaIdArgs): Promise<McpToolResult> {
  const row = await getIdeaRow(db, args.id);
  if (!row) return toolError("not_found", { message: "Idea not found", id: args.id });
  return toolJson({ item: await ideaDetail(db, row) });
}

export async function searchIdeas(db: Db, args: SearchIdeasArgs): Promise<McpToolResult> {
  const query = args.query.trim();
  if (!query) return toolError("empty_query", { message: "query is required" });
  const offset = readOffset(args.cursor, args.offset);
  if (typeof offset !== "number")
    return toolError(offset.error, { message: "cursor must be a non-negative integer" });
  const limit = args.limit ?? MCP_LIST_DEFAULT_LIMIT;
  const needle = query.toLowerCase();
  const rows = await listIdeaRows(db);
  const matches = rows
    .map((row) => toIdeaView(row))
    .filter((idea) => `${idea.title}\n${idea.body}`.toLowerCase().includes(needle))
    .sort(byUpdatedDesc);
  const page = pageOf(matches, offset, limit);
  return toolJson({
    items: page.slice.map((idea) => ({
      ...shortIdea(idea),
      excerpt: excerpt(idea.body, query),
    })),
    next_cursor: page.next,
    total: page.total,
  });
}

export async function listInspirations(db: Db, args: ListPageArgs): Promise<McpToolResult> {
  const offset = readOffset(args.cursor, args.offset);
  if (typeof offset !== "number")
    return toolError(offset.error, { message: "cursor must be a non-negative integer" });
  const limit = args.limit ?? MCP_LIST_DEFAULT_LIMIT;
  const rows = (await listInspirationRows(db))
    .map((row) => inspirationJson(row))
    .sort((a, b) => {
      const time = (b.updatedAt || "").localeCompare(a.updatedAt || "");
      if (time !== 0) return time;
      return b.id - a.id;
    });
  const page = pageOf(rows, offset, limit);
  return toolJson({
    items: page.slice.map(inspirationRecord),
    next_cursor: page.next,
    total: page.total,
  });
}

export async function getAnalyticsSummary(db: Db): Promise<McpToolResult> {
  const ideas = await listIdeaViews(db);
  const summary = summarizeIdeaAnalytics(ideas);
  return toolJson({
    total: summary.total,
    by_stage: summary.byStage,
    average_aged_days: summary.averageAgedDays,
    median_aged_days: summary.medianAgedDays,
    with_human_score: summary.withHumanScore,
    with_ai_score: summary.withAiScore,
    with_reflection: summary.withReflection,
    top_tags: summary.topTags,
    created_last_7: summary.createdLast7,
    created_last_30: summary.createdLast30,
    created_by_day_7: summary.createdByDay7,
    created_by_day_30: summary.createdByDay30,
  });
}

export async function createIdea(db: Db, args: CreateIdeaArgs): Promise<McpToolResult> {
  const titleInput = args.title?.trim() ?? "";
  const bodyInput = args.body ?? "";
  if (!titleInput && !bodyInput.trim()) {
    return toolError("empty_idea", { message: "title or body is required" });
  }
  const split = splitTitleBody(bodyInput.trim() ? bodyInput : titleInput);
  const title = (titleInput || split.title).slice(0, IDEA_TITLE_MAX);
  const body = titleInput ? bodyInput : split.body;
  const created = await insertIdeaRow(db, {
    title,
    body,
    stage: args.stage,
    tags: args.tags ?? [],
  });
  await safeUpsertInspirationsFromIdeaText(
    db,
    [created.title, created.body].filter(Boolean).join("\n"),
  );
  return toolJson({ item: await ideaDetail(db, created) });
}

export async function updateIdea(db: Db, args: UpdateIdeaArgs): Promise<McpToolResult> {
  if (
    args.title === undefined &&
    args.body === undefined &&
    args.tags === undefined &&
    args.stage === undefined
  ) {
    return toolError("empty_patch", { message: "provide title, body, tags, or stage" });
  }
  const current = await getIdeaRow(db, args.id);
  if (!current) return toolError("not_found", { message: "Idea not found", id: args.id });
  const updated = await updateIdeaFields(db, args.id, {
    title: args.title,
    body: args.body,
    tags: args.tags,
    stage: args.stage,
  });
  if (!updated) return toolError("not_found", { message: "Idea not found", id: args.id });
  if (args.body !== undefined && current.body !== updated.body) {
    await safeUpsertInspirationsFromIdeaText(
      db,
      [updated.title, updated.body].filter(Boolean).join("\n"),
    );
  }
  return toolJson({ item: await ideaDetail(db, updated) });
}

export async function addComment(db: Db, args: AddCommentArgs): Promise<McpToolResult> {
  const text = args.text.trim();
  if (!text) return toolError("empty_comment", { message: "comment text is required" });
  if (text.length > COMMENT_BODY_MAX) {
    return toolError("comment_too_long", {
      message: `comment max is ${COMMENT_BODY_MAX} characters`,
    });
  }
  const row = await getIdeaRow(db, args.id);
  if (!row) return toolError("not_found", { message: "Idea not found", id: args.id });
  const created = await insertIdeaComment(db, args.id, text, MCP_COMMENT_AUTHOR);
  const json = commentJson(created);
  return toolJson({
    item: {
      id: json.id,
      idea_id: json.ideaId,
      body: json.body,
      author_id: json.authorId,
      author_name: json.authorName,
      created_at: json.createdAt,
    },
  });
}

export async function createInspiration(
  db: Db,
  args: CreateInspirationArgs,
): Promise<McpToolResult> {
  const prepared = prepareInspirationInput(JA, {
    title: args.title,
    url: args.url,
    memo: args.memo,
    tags: args.tags,
  });
  if (!prepared.ok) {
    if (prepared.error === INSPIRATION_EMPTY_MESSAGE) {
      return toolError("empty_inspiration", { message: "url and/or memo (or title) is required" });
    }
    if (prepared.error === INSPIRATION_TITLE_TOO_LONG_MESSAGE) {
      return toolError("title_too_long", {
        message: `title max is ${INSPIRATION_TITLE_MAX} characters`,
      });
    }
    if (prepared.error === INSPIRATION_MEMO_TOO_LONG_MESSAGE) {
      return toolError("memo_too_long", {
        message: `memo max is ${INSPIRATION_MEMO_MAX} characters`,
      });
    }
    if (prepared.error === INSPIRATION_URL_TOO_LONG_MESSAGE) {
      return toolError("url_too_long", { message: `url max is ${INSPIRATION_URL_MAX} characters` });
    }
    return toolError("invalid_url", { message: prepared.error });
  }
  const created = await insertPreparedInspiration(db, prepared.value);
  return toolJson({ item: inspirationRecord(inspirationJson(created)) });
}
