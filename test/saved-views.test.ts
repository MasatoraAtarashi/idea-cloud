import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { listViewAction } from "../app/lib/list-view-action";
import { listViewHref } from "../app/lib/list-view-search";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

function listActionArgs(search: string, fields: Record<string, string>): ActionFunctionArgs {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return {
    request: new Request(`https://example.com/app/list${search}`, {
      method: "POST",
      body: form,
    }),
    params: {},
    context: {
      cloudflare: {
        env,
        ctx: { waitUntil() {} },
      },
      plan: "premium",
    },
  } as unknown as ActionFunctionArgs;
}

describe("saved views API", () => {
  it("creates, lists, and deletes a named filter", async () => {
    const created = await api("/saved-views", {
      method: "POST",
      body: JSON.stringify({
        name: "熟した音声",
        filters: { stages: ["ripe"], tags: ["音声"], view: "board" },
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      item: {
        id: number;
        name: string;
        filters: { stages: string[]; tags: string[]; view: string };
      };
    };
    expect(createdBody.item.name).toBe("熟した音声");
    expect(createdBody.item.filters.stages).toEqual(["ripe"]);
    expect(createdBody.item.filters.tags).toEqual(["音声"]);
    expect(createdBody.item.filters.view).toBe("board");

    const list = await api("/saved-views");
    expect(list.status).toBe(200);
    const listed = (await list.json()) as { items: { name: string }[] };
    expect(listed.items.some((item) => item.name === "熟した音声")).toBe(true);

    const deleted = await api(`/saved-views/${createdBody.item.id}`, { method: "DELETE" });
    expect(deleted.status).toBe(204);

    const missing = await api(`/saved-views/${createdBody.item.id}`, { method: "DELETE" });
    expect(missing.status).toBe(404);
  });

  it("rejects an empty name", async () => {
    const res = await api("/saved-views", {
      method: "POST",
      body: JSON.stringify({ name: "   " }),
    });
    expect(res.status).toBe(400);
  });
});

describe("list view save action", () => {
  it("saves the current URL filters and redirects with v", async () => {
    const result = await listViewAction(
      listActionArgs("?stage=spark,aging&tag=朝&q=通勤", {
        intent: "save-view",
        name: "朝の着想",
      }),
    );
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    const location = response.headers.get("Location") ?? "";
    expect(location).toContain("/app/list?");
    expect(location).toContain("v=");

    const list = await api("/saved-views");
    const listed = (await list.json()) as {
      items: { id: number; name: string; filters: { stages: string[]; query: string } }[];
    };
    const saved = listed.items.find((item) => item.name === "朝の着想");
    expect(saved).toBeTruthy();
    expect(saved?.filters.stages).toEqual(["spark", "aging"]);
    expect(saved?.filters.query).toBe("通勤");
    expect(location).toBe(
      listViewHref({
        tab: "all",
        view: "table",
        query: "通勤",
        stages: ["spark", "aging"],
        tags: ["朝"],
        minDays: 0,
        categoryId: null,
        savedViewId: saved!.id,
      }),
    );
  });

  it("returns a Japanese error when the name is empty", async () => {
    const result = await listViewAction(listActionArgs("", { intent: "save-view", name: "  " }));
    expect(result).toEqual({ error: "名前を入力してください" });
  });

  it("deletes a view and drops v from the redirect when it was active", async () => {
    const created = await api("/saved-views", {
      method: "POST",
      body: JSON.stringify({ name: "消す", filters: { stages: ["ripe"] } }),
    });
    const createdBody = (await created.json()) as { item: { id: number } };
    const result = await listViewAction(
      listActionArgs(`?v=${createdBody.item.id}&stage=ripe`, {
        intent: "delete-view",
        viewId: String(createdBody.item.id),
      }),
    );
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.headers.get("Location")).toBe("/app/list?stage=ripe");
  });
});
