import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

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

/**
 * Tenant boundary. Every idea, inspiration, category and saved view belongs to
 * exactly one workspace, and every query in db/ filters by `Db.workspaceId`.
 * Row 1 is the pre-tenancy shelf created by migration 0013 (see
 * docs/spec/workspaces.md for how it is claimed).
 */
export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** Email of the creator. Informational; ownership lives in workspace_members. */
  createdBy: text("created_by").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export const WORKSPACE_ROLES = ["owner", "member"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Membership by lowercase Google email. No user table: identity is the email. */
export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("workspace_members_ws_email_unique").on(table.workspaceId, table.email),
    index("workspace_members_email_idx").on(table.email),
  ],
);

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

/** Invite links. Only the SHA-256 of the token is stored. */
export const workspaceInvites = sqliteTable(
  "workspace_invites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    role: text("role").notNull().default("member"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    /** ISO-8601 UTC. */
    expiresAt: text("expires_at").notNull(),
    /** Set when the link was revoked or consumed past its use limit. */
    revokedAt: text("revoked_at"),
    uses: integer("uses").notNull().default(0),
    maxUses: integer("max_uses").notNull().default(10),
  },
  (table) => [uniqueIndex("workspace_invites_token_unique").on(table.tokenHash)],
);

export type WorkspaceInvite = typeof workspaceInvites.$inferSelect;

/** Per-workspace bearer keys for /mcp. Only the SHA-256 of the key is stored. */
export const workspaceApiKeys = sqliteTable(
  "workspace_api_keys",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    /** First characters of the key, for the settings list. */
    prefix: text("prefix").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
  },
  (table) => [uniqueIndex("workspace_api_keys_token_unique").on(table.tokenHash)],
);

export type WorkspaceApiKey = typeof workspaceApiKeys.$inferSelect;

/** Coarse buckets (執筆 / 事業 / 組織改善, plus names added from the picker). Not tags. */
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** No SQL foreign key: SQLite cannot add a REFERENCES column with a default (migration 0013). */
    workspaceId: integer("workspace_id").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("categories_ws_name_unique").on(table.workspaceId, table.name)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/** Ideas, scoped to a workspace. No per-user ownership inside a workspace, no field encryption this pass. */
export const ideas = sqliteTable(
  "ideas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** No SQL foreign key: SQLite cannot add a REFERENCES column with a default (migration 0013). */
    workspaceId: integer("workspace_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    stage: text("stage").notNull().default("spark"),
    tags: text("tags").notNull().default("[]"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Source inspiration when the idea was made from the shelf. */
    inspirationId: integer("inspiration_id").references((): AnySQLiteColumn => inspirations.id, {
      onDelete: "set null",
    }),
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
  },
  (table) => [index("ideas_workspace_idx").on(table.workspaceId)],
);

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
  /** No SQL foreign key: SQLite cannot add a REFERENCES column with a default (migration 0013). */
  workspaceId: integer("workspace_id").notNull(),
  name: text("name").notNull(),
  filters: text("filters").notNull().default("{}"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;

/** URL / memo first. R2 image upload is deferred; OGP image is hotlinked. */
export const inspirations = sqliteTable(
  "inspirations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** No SQL foreign key: SQLite cannot add a REFERENCES column with a default (migration 0013). */
    workspaceId: integer("workspace_id").notNull(),
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
  },
  (table) => [index("inspirations_workspace_idx").on(table.workspaceId)],
);

export type Inspiration = typeof inspirations.$inferSelect;
export type NewInspiration = typeof inspirations.$inferInsert;

/**
 * Billing state written by the Stripe webhook, keyed by the Google email the
 * user signs in with. Not a user table: no profile, no credentials, no rows for
 * people who never paid. Stripe stays the source of truth; this is the cached
 * answer to "may this email use the AI features right now".
 */
export const entitlements = sqliteTable("entitlements", {
  email: text("email").primaryKey(),
  plan: text("plan").notNull().default("free"),
  /** Stripe subscription status verbatim: active / trialing / past_due / canceled / … */
  status: text("status").notNull().default("inactive"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  /** ISO-8601 UTC. Access survives to here while a payment is retried. */
  currentPeriodEnd: text("current_period_end"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;

/** Webhook idempotency. Stripe retries, and retries must not double-apply. */
export const billingEvents = sqliteTable("billing_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: text("received_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
