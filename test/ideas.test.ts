import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const authHeaders = {
  "cf-access-authenticated-user-email": "test@example.com",
};

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...authHeaders, "content-type": "application/json", ...init?.headers },
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
});
