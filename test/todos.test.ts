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

describe("todos API", () => {
  it("creates a todo via POST and lists it via GET", async () => {
    const create = await api("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "牛乳を買う" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { id: number; title: string } };
    expect(created.item.title).toBe("牛乳を買う");

    const list = await api("/todos");
    expect(list.status).toBe(200);
    const body = (await list.json()) as { items: { title: string }[] };
    expect(body.items.some((item) => item.title === "牛乳を買う")).toBe(true);
  });

  it("returns 400 when POST title is empty (zod)", async () => {
    const res = await api("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "   " }),
    });
    expect(res.status).toBe(400);
  });

  it("toggles done via PATCH /api/todos/:id", async () => {
    const create = await api("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "反転テスト" }),
    });
    const { item } = (await create.json()) as { item: { id: number; done: boolean } };
    expect(item.done).toBe(false);

    const patch = await api(`/todos/${item.id}`, { method: "PATCH" });
    expect(patch.status).toBe(200);
    const patched = (await patch.json()) as { item: { done: boolean } };
    expect(patched.item.done).toBe(true);
  });

  it("deletes via DELETE and returns 404 the second time", async () => {
    const create = await api("/todos", {
      method: "POST",
      body: JSON.stringify({ title: "削除テスト" }),
    });
    const { item } = (await create.json()) as { item: { id: number } };

    const del = await api(`/todos/${item.id}`, { method: "DELETE" });
    expect(del.status).toBe(204);

    const delAgain = await api(`/todos/${item.id}`, { method: "DELETE" });
    expect(delAgain.status).toBe(404);
  });
});
