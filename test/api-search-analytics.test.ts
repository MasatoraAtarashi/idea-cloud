import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...init?.headers },
  });
}

describe("GET /api/search", () => {
  it("returns the workspace search groups", async () => {
    const created = await api("/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "検索用のアイデア ubiquitous-marker" }),
    });
    expect(created.status).toBe(201);

    const res = await api("/search?q=ubiquitous-marker");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ideas: unknown[]; comments: unknown[] };
    expect(Array.isArray(body.ideas)).toBe(true);
    expect(body.ideas.length).toBeGreaterThan(0);
  });

  it("treats a missing query as empty rather than failing", async () => {
    const res = await api("/search");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ideas: unknown[] };
    expect(body.ideas).toEqual([]);
  });

  it("rejects an over-long query", async () => {
    const res = await api(`/search?q=${"a".repeat(200)}`);
    expect(res.status).toBe(400);
  });

  it("needs credentials", async () => {
    const res = await exports.default.fetch("https://example.com/api/search?q=x");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/analytics", () => {
  it("returns the same summary the page loader builds", async () => {
    const res = await api("/analytics");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      analytics: { byStage: unknown[]; createdByDay7: unknown[]; createdByDay30: unknown[] };
    };
    expect(body.analytics.createdByDay7).toHaveLength(7);
    expect(body.analytics.createdByDay30).toHaveLength(30);
    expect(Array.isArray(body.analytics.byStage)).toBe(true);
  });

  it("needs credentials", async () => {
    const res = await exports.default.fetch("https://example.com/api/analytics");
    expect(res.status).toBe(401);
  });
});
