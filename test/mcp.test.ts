import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import { STAGES } from "../app/data/mock";
import { createDb } from "../db/client";
import { authorizeMcpRequest, mcpSharedSecret, timingSafeEqualString } from "../server/mcp/auth";
import { parseToolJson } from "../server/mcp/result";
import {
  addComment,
  createIdea,
  createInspiration,
  getAnalyticsSummary,
  getIdea,
  listIdeas,
  listInspirations,
  searchIdeas,
  updateIdea,
} from "../server/mcp/tools";
import { setTestOgpFetch } from "../server/ogp/fetch";

const TOKEN = "test-mcp-key";

function db() {
  return createDb(env.DB);
}

function unique(label: string) {
  return `${label}-${crypto.randomUUID()}`;
}

async function mcp(body: unknown, headers?: HeadersInit) {
  return exports.default.fetch("https://example.com/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function readRpc(response: Response): Promise<{
  result?: { content?: { text: string }[]; tools?: { name: string }[]; isError?: boolean };
  error?: { message?: string };
}> {
  const text = await response.text();
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) {
    const data = text
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter((line) => line.length > 0);
    const last = data.at(-1);
    if (!last) throw new Error(`empty SSE: ${text}`);
    return JSON.parse(last) as never;
  }
  return JSON.parse(text) as never;
}

describe("MCP auth", () => {
  it("rejects a missing or wrong bearer and ignores the Access header", async () => {
    const missing = await mcp({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(missing.status).toBe(401);
    expect(missing.headers.get("www-authenticate")).toContain("Bearer");

    const wrong = await mcp(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { authorization: "Bearer not-the-key" },
    );
    expect(wrong.status).toBe(401);

    const accessOnly = await mcp(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { "cf-access-authenticated-user-email": "test@example.com" },
    );
    expect(accessOnly.status).toBe(401);
  });

  it("accepts MCP_API_KEY and falls back to MCP_TOKEN only when the primary secret is empty", () => {
    expect(mcpSharedSecret({ MCP_API_KEY: " primary ", MCP_TOKEN: "other" } as Env)).toBe(
      "primary",
    );
    expect(mcpSharedSecret({ MCP_API_KEY: "  ", MCP_TOKEN: "fallback" } as Env)).toBe("fallback");
    expect(mcpSharedSecret({} as Env)).toBe("");
    expect(timingSafeEqualString("same", "same")).toBe(true);
    expect(timingSafeEqualString("same", "same!")).toBe(false);

    const ok = authorizeMcpRequest(
      new Request("https://example.com/mcp", { headers: { authorization: "Bearer secret" } }),
      { MCP_TOKEN: "secret" } as Env,
    );
    expect(ok).toBeNull();
    const denied = authorizeMcpRequest(new Request("https://example.com/mcp"), {} as Env);
    expect(denied?.status).toBe(401);
  });
});

describe("MCP tools", () => {
  afterEach(() => {
    setTestOgpFetch(undefined);
  });

  it("lists the nine data tools over Streamable HTTP", async () => {
    const response = await mcp(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { authorization: `Bearer ${TOKEN}` },
    );
    expect(response.status).toBe(200);
    const rpc = await readRpc(response);
    const names = (rpc.result?.tools ?? []).map((tool) => tool.name).sort();
    expect(names).toEqual(
      [
        "add_comment",
        "create_idea",
        "create_inspiration",
        "get_analytics_summary",
        "get_idea",
        "list_ideas",
        "list_inspirations",
        "search_ideas",
        "update_idea",
      ].sort(),
    );
    expect(names).not.toContain("discuss_idea");
  });

  it("creates, reads, updates, comments, and searches an idea", async () => {
    const title = unique("mcp-shelf");
    const body = `本文だけに出る語彙 ${unique("kw")}`;
    const keyword = body.split(" ").at(-1)!;

    const created = parseToolJson(
      await createIdea(db(), { title, body, tags: ["棚"], stage: "aging" }),
    );
    const item = created.item as {
      id: number;
      title: string;
      stage: string;
      tags: string[];
      body: string;
    };
    expect(item.title).toBe(title);
    expect(item.body).toBe(body);
    expect(item.stage).toBe("aging");
    expect(item.tags).toEqual(["棚"]);

    const listed = parseToolJson(
      await listIdeas(db(), { stage: "aging", tags: ["棚"], keyword: title, limit: 5 }),
    );
    const items = listed.items as { id: number; updated_at: string }[];
    expect(items.some((row) => row.id === item.id && row.updated_at)).toBe(true);

    const found = parseToolJson(await searchIdeas(db(), { query: keyword }));
    const hits = found.items as { id: number; excerpt: string }[];
    expect(hits.some((row) => row.id === item.id && row.excerpt.includes(keyword))).toBe(true);

    const patched = parseToolJson(
      await updateIdea(db(), { id: item.id, title: `${title}-改`, stage: "ripe" }),
    );
    const patchedItem = patched.item as { title: string; stage: string };
    expect(patchedItem.title).toBe(`${title}-改`);
    expect(patchedItem.stage).toBe("ripe");

    const comment = parseToolJson(await addComment(db(), { id: item.id, text: "寝かせる" }));
    const commentItem = comment.item as { body: string; author_name: string; idea_id: number };
    expect(commentItem.body).toBe("寝かせる");
    expect(commentItem.author_name).toBe("MCP");
    expect(commentItem.idea_id).toBe(item.id);

    const detail = parseToolJson(await getIdea(db(), { id: item.id }));
    const full = detail.item as {
      body: string;
      comments: { body: string }[];
      research: unknown;
    };
    expect(full.body).toBe(body);
    expect(full.comments.map((row) => row.body)).toContain("寝かせる");
    expect(full.research).toBeNull();

    const http = await mcp(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "get_idea", arguments: { id: item.id } },
      },
      { authorization: `Bearer ${TOKEN}` },
    );
    expect(http.status).toBe(200);
    const rpc = await readRpc(http);
    const text = rpc.result?.content?.[0]?.text ?? "";
    expect(text).toContain(body);
    expect(rpc.result?.isError).not.toBe(true);
  });

  it("returns an analytics summary with a stage bucket for every stage", async () => {
    const summary = parseToolJson(await getAnalyticsSummary(db()));
    const byStage = summary.by_stage as { stage: string; count: number }[];
    expect(byStage.map((row) => row.stage)).toEqual([...STAGES]);
    const total = byStage.reduce((sum, row) => sum + row.count, 0);
    expect(summary.total).toBe(total);
    expect(summary.created_by_day_7).toHaveLength(7);
    expect(summary.created_by_day_30).toHaveLength(30);
  });

  it("creates a memo inspiration and stores Open Graph when a URL is fetched", async () => {
    const memo = unique("memo");
    const memoCreated = parseToolJson(await createInspiration(db(), { memo }));
    const memoItem = memoCreated.item as { memo: string; url: string | null; og_status: string };
    expect(memoItem.memo).toBe(memo);
    expect(memoItem.url).toBeNull();
    expect(memoItem.og_status).toBe("none");

    setTestOgpFetch(async () => ({
      status: "ok",
      title: "ページ題",
      description: "説明",
      imageUrl: "https://cdn.example.com/card.png",
      siteName: "Example",
      fetchedAt: "2026-09-23 00:00:00",
    }));
    const url = `https://example.com/${unique("og")}`;
    const withUrl = parseToolJson(await createInspiration(db(), { url, memo: "リンク" }));
    const urlItem = withUrl.item as {
      url: string;
      og_title: string;
      og_status: string;
      og_image_url: string;
    };
    expect(urlItem.url).toBe(url);
    expect(urlItem.og_status).toBe("ok");
    expect(urlItem.og_title).toBe("ページ題");
    expect(urlItem.og_image_url).toBe("https://cdn.example.com/card.png");

    const listed = parseToolJson(await listInspirations(db(), { limit: 100 }));
    const items = listed.items as { memo: string }[];
    expect(items.some((row) => row.memo === memo)).toBe(true);
    expect(items.some((row) => row.memo === "リンク")).toBe(true);
  });
});
