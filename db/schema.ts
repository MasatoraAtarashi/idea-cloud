import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

/** Shared workspace ideas. No per-user ownership, no field encryption this pass. */
export const ideas = sqliteTable("ideas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  stage: text("stage").notNull().default("spark"),
  tags: text("tags").notNull().default("[]"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  researchNotes: text("research_notes"),
  researchModel: text("research_model"),
  researchedAt: text("researched_at"),
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
