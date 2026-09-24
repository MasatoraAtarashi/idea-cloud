import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import { BRAINSTORM_ARCHIVE_ERROR } from "../app/lib/idea-ai";
import { RESEARCH_PRESETS } from "../app/lib/research-models";
import { BRAINSTORM_FAIL_MESSAGE, formatBrainstormUserText } from "../server/ai/brainstorm";
import { flushScheduledCreateEvaluations } from "../server/ai/evaluate";
import { setTestAiRun } from "../server/ai/research";
import { authHeaders } from "./auth-helper";

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...(await authHeaders()), "content-type": "application/json", ...init?.headers },
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

describe("brainstorm prompt", () => {
  it("includes title, body, and recent comments", () => {
    const text = formatBrainstormUserText({
      title: "見出し",
      body: "本文",
      comments: [{ body: "古い" }, { body: "新しい観点" }],
    });
    expect(text).toContain("タイトル: 見出し");
    expect(text).toContain("本文:\n本文");
    expect(text).toContain("新しい観点");
  });
});

describe("ideas brainstorm API", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("defaults to the standard preset and persists the latest row", async () => {
    setTestAiRun(async (model) => ({
      response: `切り口:\n- 角度\n別案:\n- 変種\n次の問い:\n- 質問\n関連する方向:\n- ${model}`,
    }));
    const id = await createIdea("広げるアイデア");
    const res = await api(`/ideas/${id}/brainstorm`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      item: { brainstormNotes: string; brainstormModel: string; brainstormedAt: string };
      brainstorm: { notes: string; model: string };
    };
    expect(body.item.brainstormModel).toBe(RESEARCH_PRESETS.standard);
    expect(body.item.brainstormNotes).toContain("切り口");
    expect(body.brainstorm.model).toBe(RESEARCH_PRESETS.standard);

    const listed = await api(`/ideas/${id}/brainstorms`);
    expect(listed.status).toBe(200);
    const listBody = (await listed.json()) as { items: { notes: string }[] };
    expect(listBody.items).toHaveLength(1);
    expect(listBody.items[0]?.notes).toContain("変種");
  });

  it("includes comments in the model prompt", async () => {
    const id = await createIdea("コメント付き");
    await flushScheduledCreateEvaluations();
    let captured = "";
    setTestAiRun(async (_model, inputs) => {
      captured = inputs.messages.find((message) => message.role === "user")?.content ?? "";
      return { response: "切り口:\n- コメント込み" };
    });
    await api(`/ideas/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "朝の観点" }),
    });
    const res = await api(`/ideas/${id}/brainstorm`, {
      method: "POST",
      body: JSON.stringify({ preset: "fast" }),
    });
    expect(res.status).toBe(200);
    expect(captured).toContain("朝の観点");
    expect(captured).toContain("コメント付き");
  });

  it("rejects brainstorm when the idea is archived", async () => {
    const id = await createIdea("しまってあるブレスト");
    await markArchived(id);
    const res = await api(`/ideas/${id}/brainstorm`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(BRAINSTORM_ARCHIVE_ERROR);
  });

  it("returns 404 for a missing idea", async () => {
    const res = await api("/ideas/999999/brainstorm", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
  });

  it("honors fast and deep presets and keeps older rows when a later run fails", async () => {
    setTestAiRun(async () => ({ response: "切り口:\n- 残す" }));
    const id = await createIdea("履歴を残す");
    const first = await api(`/ideas/${id}/brainstorm`, {
      method: "POST",
      body: JSON.stringify({ preset: "deep" }),
    });
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { item: { brainstormModel: string } };
    expect(firstBody.item.brainstormModel).toBe(RESEARCH_PRESETS.deep);

    setTestAiRun(async () => {
      throw new Error("Workers AI down");
    });
    const second = await api(`/ideas/${id}/brainstorm`, {
      method: "POST",
      body: JSON.stringify({ preset: "fast" }),
    });
    expect(second.status).toBe(502);
    const failBody = (await second.json()) as { error: string };
    expect(failBody.error).toBe(BRAINSTORM_FAIL_MESSAGE);

    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { brainstormNotes: string; brainstormModel: string };
    };
    expect(reloaded.item.brainstormNotes).toContain("残す");
    expect(reloaded.item.brainstormModel).toBe(RESEARCH_PRESETS.deep);
  });

  it("returns a Japanese 502 when Workers AI is missing", async () => {
    const id = await createIdea("ブレスト失敗");
    const res = await api(`/ideas/${id}/brainstorm`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(BRAINSTORM_FAIL_MESSAGE);
  });
});

describe("idea detail brainstorm action", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("runs brainstorm from the detail form without a document redirect", async () => {
    setTestAiRun(async () => ({ response: "切り口:\n- 詳細" }));
    const id = await createIdea("詳細からブレスト");
    const result = await ideaDetailAction(
      detailActionArgs(id, { intent: "brainstorm", preset: "fast" }),
    );
    expect(result).toEqual({ ok: true, intent: "brainstorm" });

    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { brainstormNotes: string; brainstormModel: string };
    };
    expect(reloaded.item.brainstormNotes).toContain("詳細");
    expect(reloaded.item.brainstormModel).toBe(RESEARCH_PRESETS.fast);
  });

  it("returns a Japanese error with brainstorm intent when archived", async () => {
    const id = await createIdea("詳細アーカイブのブレスト");
    await markArchived(id);
    const result = await ideaDetailAction(detailActionArgs(id, { intent: "brainstorm" }));
    expect(result).toEqual({ error: BRAINSTORM_ARCHIVE_ERROR, intent: "brainstorm" });
  });
});
