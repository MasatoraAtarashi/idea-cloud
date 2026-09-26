import { desc, inArray } from "drizzle-orm";
import type { MockIdea, Stage } from "../app/data/mock";
import { inspirationHeadline, inspirationHostname } from "../app/lib/inspiration";
import type { Db } from "./client";
import { ideaIdsInWorkspace, listIdeaViews } from "./ideas";
import { listInspirationRows } from "./inspirations";
import { ideaComments, type IdeaComment, type Inspiration } from "./schema";

/** Per-group cap for the ⌘K palette. */
export const SEARCH_GROUP_LIMIT = 8;
export const SEARCH_QUERY_MAX = 100;

export type SearchIdeaHit = {
  id: string;
  title: string;
  stage: Stage;
  tags: string[];
  agedDays: number;
  /** Set when only the body matched, e.g. 本文に「寿司」. */
  matchedIn: string | null;
};

export type SearchCommentHit = {
  id: number;
  body: string;
  ideaId: string;
  ideaTitle: string;
};

export type SearchInspirationHit = {
  id: string;
  title: string;
  domain: string;
  ogImageUrl: string;
};

export type SearchTagHit = {
  tag: string;
  count: number;
};

export type SearchResults = {
  query: string;
  ideas: SearchIdeaHit[];
  comments: SearchCommentHit[];
  inspirations: SearchInspirationHit[];
  tags: SearchTagHit[];
};

export function emptySearchResults(query = ""): SearchResults {
  return { query, ideas: [], comments: [], inspirations: [], tags: [] };
}

export function normalizeSearchQuery(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, SEARCH_QUERY_MAX);
}

function includes(haystack: string | null | undefined, needle: string): boolean {
  return (haystack ?? "").toLowerCase().includes(needle);
}

/** One line around the first hit so long comments still show the match. */
export function excerptAround(text: string, needle: string, width = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const at = flat.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0 || flat.length <= width) return flat.slice(0, width);
  const start = Math.max(0, at - Math.floor(width / 3));
  const slice = flat.slice(start, start + width);
  return `${start > 0 ? "…" : ""}${slice}`;
}

/** Pure matcher over already-loaded rows. Ideas / comments / inspirations / tag names. */
export function searchWorkspace(
  rawQuery: string,
  input: {
    ideas: MockIdea[];
    comments: Pick<IdeaComment, "id" | "ideaId" | "body">[];
    inspirations: Inspiration[];
  },
  limit = SEARCH_GROUP_LIMIT,
): SearchResults {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return emptySearchResults();
  const needle = query.toLowerCase();

  const ideas: SearchIdeaHit[] = [];
  for (const idea of input.ideas) {
    const inTitle = includes(idea.title, needle);
    const inTags = idea.tags.some((tag) => includes(tag, needle));
    const inBody = includes(idea.body, needle);
    if (!inTitle && !inTags && !inBody) continue;
    ideas.push({
      id: idea.id,
      title: idea.title,
      stage: idea.stage,
      tags: idea.tags,
      agedDays: idea.agedDays,
      matchedIn: !inTitle && !inTags ? `本文に「${query}」` : null,
    });
  }
  // Title / tag hits first, archived last; stable otherwise.
  ideas.sort(
    (a, b) =>
      Number(a.matchedIn != null) - Number(b.matchedIn != null) ||
      Number(a.stage === "archived") - Number(b.stage === "archived"),
  );

  const titles = new Map(input.ideas.map((idea) => [idea.id, idea.title]));
  const comments: SearchCommentHit[] = [];
  for (const comment of input.comments) {
    if (!includes(comment.body, needle)) continue;
    const ideaId = String(comment.ideaId);
    const ideaTitle = titles.get(ideaId);
    if (!ideaTitle) continue;
    comments.push({ id: comment.id, body: excerptAround(comment.body, query), ideaId, ideaTitle });
  }

  const inspirations: SearchInspirationHit[] = [];
  for (const row of input.inspirations) {
    if (
      !includes(row.title, needle) &&
      !includes(row.memo, needle) &&
      !includes(row.ogTitle, needle)
    ) {
      continue;
    }
    inspirations.push({
      id: String(row.id),
      title: inspirationHeadline(row),
      domain: inspirationHostname(row.url).replace(/^www\./, ""),
      ogImageUrl: row.ogImageUrl,
    });
  }

  const tagCounts = new Map<string, number>();
  for (const idea of input.ideas) {
    for (const tag of idea.tags) {
      if (!includes(tag, needle)) continue;
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const tags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"));

  return {
    query,
    ideas: ideas.slice(0, limit),
    comments: comments.slice(0, limit),
    inspirations: inspirations.slice(0, limit),
    tags: tags.slice(0, limit),
  };
}

export async function searchWorkspaceDb(db: Db, rawQuery: string): Promise<SearchResults> {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return emptySearchResults();
  const [ideas, comments, inspirations] = await Promise.all([
    listIdeaViews(db),
    db
      .select({ id: ideaComments.id, ideaId: ideaComments.ideaId, body: ideaComments.body })
      .from(ideaComments)
      .where(inArray(ideaComments.ideaId, ideaIdsInWorkspace(db)))
      .orderBy(desc(ideaComments.id)),
    listInspirationRows(db),
  ]);
  return searchWorkspace(query, { ideas, comments, inspirations });
}
