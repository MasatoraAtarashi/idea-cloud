import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
  });
}

describe("ideas API", () => {
  it("creates an idea via POST and lists it via GET", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "永続化テスト" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as {
      item: { id: number; title: string; body: string; stage: string; tags: string[] };
    };
    expect(created.item.title).toBe("永続化テスト");
    expect(created.item.body).toBe("永続化テスト");
    expect(created.item.stage).toBe("spark");
    expect(created.item.tags).toEqual([]);

    const list = await api("/ideas");
    expect(list.status).toBe(200);
    const body = (await list.json()) as { items: { title: string }[] };
    expect(body.items.some((item) => item.title === "永続化テスト")).toBe(true);

    const one = await api(`/ideas/${created.item.id}`);
    expect(one.status).toBe(200);
    const detail = (await one.json()) as { item: { body: string } };
    expect(detail.item.body).toBe("永続化テスト");
  });

  it("uses the first line as title for multiline bodies", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "見出し\n本文の続き" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { title: string; body: string } };
    expect(created.item.title).toBe("見出し");
    expect(created.item.body).toBe("見出し\n本文の続き");
  });

  it("returns 400 when POST body is empty (zod)", async () => {
    const res = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "   " }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a missing idea", async () => {
    const res = await api("/ideas/999999");
    expect(res.status).toBe(404);
  });

  it("updates stage via PATCH", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "段階を進める", stage: "aging" }),
    });
    const created = (await create.json()) as { item: { id: number; stage: string } };
    expect(created.item.stage).toBe("aging");

    const patched = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stage: "selected" }),
    });
    expect(patched.status).toBe(200);
    const body = (await patched.json()) as { item: { stage: string } };
    expect(body.item.stage).toBe("selected");
  });

  it("updates title and tags via PATCH", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "直す前" }),
    });
    const created = (await create.json()) as { item: { id: number } };
    const patched = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "直した", tags: ["棚"] }),
    });
    expect(patched.status).toBe(200);
    const body = (await patched.json()) as { item: { title: string; tags: string[] } };
    expect(body.item.title).toBe("直した");
    expect(body.item.tags).toEqual(["棚"]);
  });

  it("saves a human 1–5 score via PATCH", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "点数を付ける" }),
    });
    const created = (await create.json()) as { item: { id: number } };
    const patched = await api(`/ideas/${created.item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ humanScore: 4, humanScoreNote: "寝かせる" }),
    });
    expect(patched.status).toBe(200);
    const body = (await patched.json()) as {
      item: { humanScore: number; humanScoreNote: string; humanScoredAt: string };
    };
    expect(body.item.humanScore).toBe(4);
    expect(body.item.humanScoreNote).toBe("寝かせる");
    expect(body.item.humanScoredAt).toBeTruthy();
  });

  it("hard-deletes an idea and 404s afterward", async () => {
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "消す" }),
    });
    const created = (await create.json()) as { item: { id: number } };
    await api(`/ideas/${created.item.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "メモ" }),
    });
    const removed = await api(`/ideas/${created.item.id}`, { method: "DELETE" });
    expect(removed.status).toBe(200);
    const missing = await api(`/ideas/${created.item.id}`);
    expect(missing.status).toBe(404);
    const comments = await api(`/ideas/${created.item.id}/comments`);
    expect(comments.status).toBe(404);
    const gone = await api(`/ideas/${created.item.id}`, { method: "DELETE" });
    expect(gone.status).toBe(404);
  });
});
