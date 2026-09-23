import { afterEach, describe, expect, it, vi } from "vitest";
import { exports } from "cloudflare:workers";
import { fetchOpenGraph, setTestOgpFetch } from "../server/ogp/fetch";
import { authorizeMcpRequest } from "../server/mcp/auth";
import { runSystemOne, setTestSystemOneRun } from "../server/ai/typesafe";
import { flushScheduledCreateEvaluations } from "../server/ai/evaluate";
import { setTestAiRun } from "../server/ai/research";

const authHeaders = {
  "cf-access-authenticated-user-email": "test@example.com",
};

function jsonLogs(spy: { mock: { calls: unknown[][] } }): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const call of spy.mock.calls) {
    try {
      rows.push(JSON.parse(String(call[0])) as Record<string, unknown>);
    } catch {
      // non-json console noise
    }
  }
  return rows;
}

describe("diagnostic logs", () => {
  afterEach(async () => {
    setTestAiRun();
    setTestSystemOneRun();
    setTestOgpFetch();
    vi.restoreAllMocks();
    await flushScheduledCreateEvaluations();
  });

  it("logs missing keys, skipped archive eval, and user tags without secret values", async () => {
    const logged = vi.spyOn(console, "log").mockImplementation(() => {});
    const warned = vi.spyOn(console, "warn").mockImplementation(() => {});
    const marker = "ああああああ";
    const create = await exports.default.fetch("https://example.com/api/ideas", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({ body: "しまって作る", stage: "archived", tags: ["手元"] }),
    });
    expect(create.status).toBe(201);
    await flushScheduledCreateEvaluations();

    const info = jsonLogs(logged);
    expect(info).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "create prerequisites",
          hasTypesafeApiKey: false,
          hasSearchApiKey: false,
        }),
        expect.objectContaining({
          msg: "create auto-tag",
          outcome: "skipped",
          reason: "user_tags",
          count: 1,
        }),
        expect.objectContaining({
          msg: "create auto-evaluate",
          outcome: "skipped",
          reason: "archived",
        }),
      ]),
    );
    const text = JSON.stringify([...info, ...jsonLogs(warned)]);
    expect(text).not.toContain(marker);
    expect(text).not.toContain("TYPESAFE_API_KEY");
    expect(text).not.toContain("SEARCH_API_KEY");
  });

  it("logs a scheduled evaluation that fails soft", async () => {
    const logged = vi.spyOn(console, "log").mockImplementation(() => {});
    const warned = vi.spyOn(console, "warn").mockImplementation(() => {});
    setTestAiRun(async () => {
      throw new Error("Workers AI binding is missing");
    });
    const create = await exports.default.fetch("https://example.com/api/ideas", {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({ body: "評価は落ちる", tags: ["手元"] }),
    });
    expect(create.status).toBe(201);
    await flushScheduledCreateEvaluations();
    const info = jsonLogs(logged);
    const warnings = jsonLogs(warned);
    expect(info).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "create auto-evaluate", outcome: "scheduled" }),
      ]),
    );
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "workers ai call",
          step: "evaluate",
          outcome: "fail",
          error: "missing_binding",
        }),
        expect.objectContaining({
          msg: "create auto-evaluate",
          outcome: "fail",
          status: 502,
        }),
      ]),
    );
  });

  it("logs TypeSafe start and missing key without echoing the key", async () => {
    const logged = vi.spyOn(console, "log").mockImplementation(() => {});
    const warned = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(
      runSystemOne(
        "   ",
        {
          state: { idea: "テスト" },
          questions: { tag: { type: "choice", instructions: "tag", criteria: { AI: null } } },
        },
        "tags",
      ),
    ).rejects.toThrow(/missing/);
    const rows = [...jsonLogs(logged), ...jsonLogs(warned)];
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "typesafe call",
          step: "tags",
          outcome: "start",
          hasTypesafeApiKey: false,
        }),
        expect.objectContaining({
          msg: "typesafe call",
          step: "tags",
          outcome: "fail",
          error: "missing_key",
          hasTypesafeApiKey: false,
        }),
      ]),
    );
    expect(JSON.stringify(rows)).not.toContain("ああああああ");
  });

  it("logs an OGP reject and an MCP auth miss without the request secret", async () => {
    const warned = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ogp = await fetchOpenGraph("http://127.0.0.1/secret");
    expect(ogp.status).toBe("failed");
    const denied = authorizeMcpRequest(new Request("https://example.com/mcp"), {} as Env);
    expect(denied?.status).toBe(401);
    const mismatch = authorizeMcpRequest(
      new Request("https://example.com/mcp", { headers: { authorization: "Bearer other" } }),
      { MCP_API_KEY: " primary " } as Env,
    );
    expect(mismatch?.status).toBe(401);
    const warnings = jsonLogs(warned);
    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "ogp fetch",
          outcome: "fail",
          error: "private",
          host: "127.0.0.1",
        }),
        expect.objectContaining({
          msg: "mcp auth",
          outcome: "fail",
          error: "missing_key",
          hasMcpApiKey: false,
          status: 401,
        }),
        expect.objectContaining({
          msg: "mcp auth",
          outcome: "fail",
          error: "mismatch",
          hasMcpApiKey: true,
          status: 401,
        }),
      ]),
    );
    const text = JSON.stringify(warnings);
    expect(text).not.toContain("/secret");
    expect(text).not.toContain("primary");
    expect(text).not.toContain("other");
    expect(text).not.toContain("Bearer");
  });
});
