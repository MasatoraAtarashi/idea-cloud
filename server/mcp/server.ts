import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { STAGES } from "../../app/data/mock";
import { createDb } from "../../db/client";
import { COMMENT_BODY_MAX } from "../../db/comments";
import { IDEA_BODY_MAX } from "../../db/ideas";
import {
  INSPIRATION_MEMO_MAX,
  INSPIRATION_TITLE_MAX,
  INSPIRATION_URL_MAX,
} from "../../db/inspirations";
import {
  MCP_LIST_MAX_LIMIT,
  addComment,
  createIdea,
  createInspiration,
  getAnalyticsSummary,
  getIdea,
  listIdeas,
  listInspirations,
  searchIdeas,
  updateIdea,
} from "./tools";

const stageSchema = z.enum(STAGES);
const tagsSchema = z.array(z.string().trim().min(1)).max(8);
const limitSchema = z.number().int().min(1).max(MCP_LIST_MAX_LIMIT);
const offsetSchema = z.number().int().min(0).max(100_000);
const cursorSchema = z.string().trim().max(20);

const STAGE_HELP =
  "Idea stage: spark (着想), aging (熟成中), ripe (熟した), selected (採用), archived (アーカイブ).";

function dbFor(env: Env) {
  return createDb(env.DB);
}

export function createIdeaCloudMcpServer(env: Env): McpServer {
  const server = new McpServer({ name: "idea-cloud", version: "1.0.0" });

  server.registerTool(
    "list_ideas",
    {
      title: "List ideas",
      description:
        "List ideas in the shared Idea Cloud workspace. Returns short records: id, title, stage, tags, updated_at. Filter by stage (status is an alias), tags (match any), and keyword (title, body, and tags). Paginate with limit (default 20, max 100) plus offset or cursor (the next_cursor string from the previous page; cursor wins when both are set). " +
        STAGE_HELP,
      inputSchema: z.object({
        stage: stageSchema.optional().describe(STAGE_HELP),
        status: stageSchema
          .optional()
          .describe("Alias of stage. Must match stage when both are set."),
        tags: tagsSchema.optional().describe("Match ideas that have any of these tags."),
        keyword: z
          .string()
          .trim()
          .max(200)
          .optional()
          .describe("Case-insensitive substring of title, body, or tags."),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional(),
        cursor: cursorSchema.optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => listIdeas(dbFor(env), args),
  );

  server.registerTool(
    "get_idea",
    {
      title: "Get idea",
      description:
        "Get one idea by id, including body, tags, stage, comments, and the stored research snapshot (notes, model, time, and http(s) sources found in the notes) when present. Also includes stored scores, review, and reflection. Does not run research.",
      inputSchema: z.object({
        id: z.coerce.number().int().positive().describe("Idea id."),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => getIdea(dbFor(env), args),
  );

  server.registerTool(
    "search_ideas",
    {
      title: "Search ideas",
      description:
        "Full-text search over idea title and body (not tags). Returns short records plus a body excerpt. Paginate with limit, offset, or cursor the same way as list_ideas.",
      inputSchema: z.object({
        query: z
          .string()
          .trim()
          .min(1)
          .max(200)
          .describe("Case-insensitive substring of title or body."),
        limit: limitSchema.optional(),
        offset: offsetSchema.optional(),
        cursor: cursorSchema.optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => searchIdeas(dbFor(env), args),
  );

  server.registerTool(
    "list_inspirations",
    {
      title: "List inspirations",
      description:
        "List inspiration shelf items (URL and/or memo), including cached Open Graph fields when a page was fetched. Newest update first. Paginate with limit (default 20, max 100), offset, or cursor.",
      inputSchema: z.object({
        limit: limitSchema.optional(),
        offset: offsetSchema.optional(),
        cursor: cursorSchema.optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (args) => listInspirations(dbFor(env), args),
  );

  server.registerTool(
    "get_analytics_summary",
    {
      title: "Analytics summary",
      description:
        "Same counts the analytics screen shows: total, counts by stage, aged-day average and median, human score / AI score / reflection counts, top tags, and ideas created per UTC day for the last 7 and 30 days.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => getAnalyticsSummary(dbFor(env)),
  );

  server.registerTool(
    "create_idea",
    {
      title: "Create idea",
      description:
        "Create an idea with title and/or body, optional tags (max 8) and stage (default spark). Does not auto-tag, research, or evaluate. http(s) URLs in the text are copied onto the inspiration shelf without fetching the page. " +
        STAGE_HELP,
      inputSchema: z.object({
        title: z
          .string()
          .trim()
          .max(200)
          .optional()
          .describe("Title. Derived from the first body line when omitted."),
        body: z
          .string()
          .max(IDEA_BODY_MAX)
          .optional()
          .describe("Idea body. Required when title is omitted."),
        tags: tagsSchema.optional(),
        stage: stageSchema.optional().describe(STAGE_HELP),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) => createIdea(dbFor(env), args),
  );

  server.registerTool(
    "update_idea",
    {
      title: "Update idea",
      description:
        "Patch an idea by id. Send only the fields to change: title, body, tags, and/or stage. At least one field is required. Does not delete the idea and does not run AI. A changed body copies new http(s) URLs onto the inspiration shelf without fetching them.",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        title: z.string().trim().min(1).max(200).optional(),
        body: z.string().max(IDEA_BODY_MAX).optional(),
        tags: tagsSchema.optional().describe("Replaces the tag list."),
        stage: stageSchema.optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async (args) => updateIdea(dbFor(env), args),
  );

  server.registerTool(
    "add_comment",
    {
      title: "Add comment",
      description: `Append a comment to an idea. Author is recorded as MCP. Max ${COMMENT_BODY_MAX} characters. Does not start a discussion thread; the client owns the conversation.`,
      inputSchema: z.object({
        id: z.coerce.number().int().positive().describe("Idea id."),
        text: z.string().trim().min(1).max(COMMENT_BODY_MAX).describe("Comment text."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async (args) => addComment(dbFor(env), args),
  );

  server.registerTool(
    "create_inspiration",
    {
      title: "Create inspiration",
      description:
        "Add an inspiration shelf item from a URL and/or memo (title optional). At least one of url, memo, or title is required. When url is set, Open Graph is fetched with the same rules as the app (public http(s) only, fail-soft). Does not create an idea and does not run brainstorm.",
      inputSchema: z.object({
        title: z.string().trim().max(INSPIRATION_TITLE_MAX).optional(),
        url: z
          .string()
          .trim()
          .max(INSPIRATION_URL_MAX)
          .nullable()
          .optional()
          .describe("Public http(s) URL."),
        memo: z.string().max(INSPIRATION_MEMO_MAX).optional(),
        tags: tagsSchema.optional(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) => createInspiration(dbFor(env), args),
  );

  return server;
}
