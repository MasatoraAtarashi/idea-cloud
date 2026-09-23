import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// テンプレート由来のサンプル CRUD。アイデア本文の暗号化保存（field-crypto）は未配線。

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

/** Coarse buckets (執筆 / 事業 / 組織改善, plus names added from the picker). Not tags. */
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("categories_name_unique").on(table.name)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/** Shared workspace ideas. No per-user ownership, no field encryption this pass. */
export const ideas = sqliteTable("ideas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  stage: text("stage").notNull().default("spark"),
  tags: text("tags").notNull().default("[]"),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  researchNotes: text("research_notes"),
  researchModel: text("research_model"),
  researchedAt: text("researched_at"),
  /** JSON `{ status, query, results: [{ title, url, snippet }] }`. Latest research only. */
  researchSources: text("research_sources"),
  humanScore: integer("human_score"),
  humanScoreNote: text("human_score_note"),
  humanScoredAt: text("human_scored_at"),
  aiScore: integer("ai_score"),
  aiEvaluation: text("ai_evaluation"),
  aiEvaluatedAt: text("ai_evaluated_at"),
  aiEvaluationModel: text("ai_evaluation_model"),
  lastReviewedAt: text("last_reviewed_at"),
  reviewStatus: text("review_status").notNull().default("none"),
  reflectionOutcome: text("reflection_outcome").notNull().default(""),
  reflectionStatus: text("reflection_status").notNull().default("none"),
  reflectionNotes: text("reflection_notes").notNull().default(""),
});

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

/** Chronological per-idea notes (Zenn scrap-style). No threads or reactions in v1. */
export const ideaComments = sqliteTable(
  "idea_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id),
    body: text("body").notNull(),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idea_comments_idea_created_idx").on(table.ideaId, table.createdAt)],
);

export type IdeaComment = typeof ideaComments.$inferSelect;
export type NewIdeaComment = typeof ideaComments.$inferInsert;

/** Per-idea AI expansions (angles / variants / questions). Latest row is shown on detail. */
export const ideaBrainstorms = sqliteTable(
  "idea_brainstorms",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id),
    notes: text("notes").notNull(),
    model: text("model").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idea_brainstorms_idea_created_idx").on(table.ideaId, table.createdAt)],
);

export type IdeaBrainstorm = typeof ideaBrainstorms.$inferSelect;
export type NewIdeaBrainstorm = typeof ideaBrainstorms.$inferInsert;

/** Per-idea chat with Workers AI. Chronological user / assistant turns. */
export const ideaChatMessages = sqliteTable(
  "idea_chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id),
    role: text("role").notNull(),
    body: text("body").notNull(),
    model: text("model"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("idea_chat_messages_idea_created_idx").on(table.ideaId, table.createdAt)],
);

export type IdeaChatMessage = typeof ideaChatMessages.$inferSelect;
export type NewIdeaChatMessage = typeof ideaChatMessages.$inferInsert;

/** Named list filters (stage / tag / query / tab / layout). JSON in `filters`. */
export const savedViews = sqliteTable("saved_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  filters: text("filters").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;

/** URL / memo first. R2 image upload is deferred; OGP image is hotlinked. */
export const inspirations = sqliteTable("inspirations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  url: text("url"),
  memo: text("memo").notNull().default(""),
  tags: text("tags").notNull().default("[]"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  ogTitle: text("og_title").notNull().default(""),
  ogDescription: text("og_description").notNull().default(""),
  ogImageUrl: text("og_image_url").notNull().default(""),
  ogSiteName: text("og_site_name").notNull().default(""),
  ogFetchedAt: text("og_fetched_at"),
  ogStatus: text("og_status").notNull().default("none"),
});

export type Inspiration = typeof inspirations.$inferSelect;
export type NewInspiration = typeof inspirations.$inferInsert;
