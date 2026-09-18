import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import { EVALUATE_ARCHIVE_ERROR } from "../app/lib/idea-ai";
import { parseAiScore } from "../app/lib/scores";
import { RESEARCH_PRESETS } from "../app/lib/research-models";
import { EVALUATE_FAIL_MESSAGE } from "../server/ai/evaluate";
import { setTestAiRun } from "../server/ai/research";

const authHeaders = {
  "cf-access-authenticated-user-email": "test@example.com",
};

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...authHeaders, "content-type": "application/json", ...init?.headers },
  });
}

async function createIdea(body: string) {
  const create = await api("/ideas", {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  const created = (await create.json()) as { item: { id: number } };
  return created.item.id;
}

async function markArchived(id: number) {
  await env.DB.prepare("UPDATE ideas SET stage = 'archived' WHERE id = ?").bind(id).run();
}

function detailActionArgs(ideaId: number, fields: Record<string, string>): ActionFunctionArgs {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return {
    request: new Request(`https://example.com/app/ideas/${ideaId}`, {
      method: "POST",
      body: form,
    }),
    params: { ideaId: String(ideaId) },
    context: {
      cloudflare: {
        env,
        ctx: { waitUntil() {} },
      },
    },
  } as unknown as ActionFunctionArgs;
}

describe("AI evaluation parser", () => {
  it("reads スコア and slash ratings", () => {
    expect(parseAiScore("強み\nスコア: 4")).toBe(4);
    expect(parseAiScore("新規性は高い 3/5")).toBe(3);
    expect(parseAiScore("5点")).toBe(5);
    expect(parseAiScore("点数なし")).toBeNull();
  });
});

describe("ideas evaluate API", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("runs AI evaluation from 着想 with the standard preset by default", async () => {
    setTestAiRun(async () => ({
      response: "強み:\n- 早い\nリスク:\n- 狭い\n新規性:\n- あり\n次の一手:\n- 試す\nスコア: 4",
    }));
    const id = await createIdea("評価したい着想");
    const res = await api(`/ideas/${id}/evaluate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      item: {
        aiScore: number;
        aiEvaluation: string;
        aiEvaluationModel: string;
        aiEvaluatedAt: string;
      };
    };
    expect(body.item.aiScore).toBe(4);
    expect(body.item.aiEvaluation).toContain("強み");
    expect(body.item.aiEvaluationModel).toBe(RESEARCH_PRESETS.standard);
    expect(body.item.aiEvaluatedAt).toBeTruthy();
  });

  it("rejects archive and returns a Japanese 502 when AI is missing", async () => {
    const archived = await createIdea("評価アーカイブ");
    await markArchived(archived);
    const locked = await api(`/ideas/${archived}/evaluate`, { method: "POST", body: "{}" });
    expect(locked.status).toBe(409);
    const lockedBody = (await locked.json()) as { error: string };
    expect(lockedBody.error).toBe(EVALUATE_ARCHIVE_ERROR);

    const id = await createIdea("評価失敗");
    const fail = await api(`/ideas/${id}/evaluate`, { method: "POST", body: "{}" });
    expect(fail.status).toBe(502);
    const failBody = (await fail.json()) as { error: string };
    expect(failBody.error).toBe(EVALUATE_FAIL_MESSAGE);
  });
});

describe("idea detail evaluate and score actions", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("saves a human score and AI evaluation without a document redirect", async () => {
    setTestAiRun(async () => ({ response: "強み:\n- あり\nスコア: 2" }));
    const id = await createIdea("詳細から評価");

    const human = await ideaDetailAction(
      detailActionArgs(id, { intent: "human-score", score: "5", note: "寝かせたい" }),
    );
    expect(human).toEqual({ ok: true, intent: "human-score" });

    const evaluated = await ideaDetailAction(
      detailActionArgs(id, { intent: "evaluate", preset: "fast" }),
    );
    expect(evaluated).toEqual({ ok: true, intent: "evaluate" });

    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { humanScore: number; humanScoreNote: string; aiScore: number; aiEvaluation: string };
    };
    expect(reloaded.item.humanScore).toBe(5);
    expect(reloaded.item.humanScoreNote).toBe("寝かせたい");
    expect(reloaded.item.aiScore).toBe(2);
    expect(reloaded.item.aiEvaluation).toContain("強み");
  });

  it("edits title, body, and tags from the detail form", async () => {
    const id = await createIdea("旧タイトル\n旧本文");
    const result = await ideaDetailAction(
      detailActionArgs(id, {
        intent: "edit",
        title: "新しい見出し",
        body: "書き直した本文",
        tags: "棚、時間",
      }),
    );
    expect(result).toEqual({ ok: true, intent: "edit" });
    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { title: string; body: string; tags: string[] };
    };
    expect(reloaded.item.title).toBe("新しい見出し");
    expect(reloaded.item.body).toBe("書き直した本文");
    expect(reloaded.item.tags).toEqual(["棚", "時間"]);
  });
});
