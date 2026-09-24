import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import { DISCUSS_ARCHIVE_ERROR } from "../app/lib/idea-ai";
import { RESEARCH_PRESETS } from "../app/lib/research-models";
import {
  DISCUSS_FAIL_MESSAGE,
  DISCUSS_LEGAL_DISCLAIMER,
  DISCUSS_TRUNCATED_NOTE,
  ensureLegalDisclaimer,
  formatDiscussContext,
} from "../server/ai/discuss";
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
    body: JSON.stringify({ body, tags: ["e2e"] }),
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
      plan: "premium",
    },
  } as unknown as ActionFunctionArgs;
}

describe("discuss context", () => {
  it("includes title, stage, tags, evaluation, and recent comments", () => {
    const text = formatDiscussContext({
      idea: {
        title: "朝の棚",
        body: "通勤中にメモする",
        stage: "spark",
        tags: '["通勤"]',
        aiScore: 4,
        aiEvaluation: "強み\n- 速い（2.0）\nスコア: 4",
      },
      comments: [{ body: "もう少し狭く" }],
    });
    expect(text).toContain("タイトル: 朝の棚");
    expect(text).toContain("段階: 着想");
    expect(text).toContain("通勤");
    expect(text).toContain("推し度: 4");
    expect(text).not.toContain("2.0");
    expect(text).toContain("もう少し狭く");
  });

  it("adds a legal disclaimer only for legal topics", () => {
    expect(ensureLegalDisclaimer("LPにするなら？", "一枚に絞る")).toBe("一枚に絞る");
    expect(ensureLegalDisclaimer("法的リスクないかな？", "一般論です。")).toContain(
      DISCUSS_LEGAL_DISCLAIMER,
    );
    expect(ensureLegalDisclaimer("法律は？", "これは法律の助言ではありません。")).not.toContain(
      DISCUSS_LEGAL_DISCLAIMER,
    );
  });
});

describe("ideas discuss API", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("persists a multi-turn thread on the standard preset", async () => {
    const seen: string[] = [];
    setTestAiRun(async (model, inputs) => {
      seen.push(inputs.messages.map((message) => `${message.role}:${message.content}`).join("\n"));
      return { response: `返信 ${model}` };
    });
    const id = await createIdea("相談したい着想");
    await flushScheduledCreateEvaluations();
    seen.length = 0;

    const first = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "これLP作るとしたらどういう感じが良い？" }),
    });
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as {
      items: { role: string; body: string; model: string | null }[];
    };
    expect(firstBody.items.map((item) => item.role)).toEqual(["user", "assistant"]);
    expect(firstBody.items[1]?.model).toBe(RESEARCH_PRESETS.standard);
    expect(seen[0]).toContain("相談したい着想");
    expect(seen[0]).toContain("これLP作るとしたら");

    const second = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "もう少し具体的に" }),
    });
    expect(second.status).toBe(200);
    expect(seen[1]).toContain("user:これLP作るとしたらどういう感じが良い？");
    expect(seen[1]).toContain(`assistant:返信 ${RESEARCH_PRESETS.standard}`);

    const listed = await api(`/ideas/${id}/discussions`);
    const listBody = (await listed.json()) as { items: { role: string }[] };
    expect(listBody.items).toHaveLength(4);
    expect(listBody.items.map((item) => item.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
  });

  it("gives the reply room and flags a cut-off answer", async () => {
    let requested = 0;
    setTestAiRun(async (_model, inputs) => {
      requested = inputs.max_tokens ?? 0;
      return {
        response: "長い説明の途中でリ",
        usage: { completion_tokens: inputs.max_tokens },
      };
    });
    const id = await createIdea("打ち切りを見たい着想");
    await flushScheduledCreateEvaluations();

    const res = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "この評価の理由を詳しく教えて" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: { role: string; body: string }[] };
    expect(requested).toBeGreaterThanOrEqual(2048);
    expect(body.items[1]?.body).toContain(DISCUSS_TRUNCATED_NOTE);
  });

  it("leaves a complete answer untouched", async () => {
    setTestAiRun(async () => ({
      response: "こう考えると良いです。",
      usage: { completion_tokens: 12 },
    }));
    const id = await createIdea("完走する着想");
    await flushScheduledCreateEvaluations();

    const res = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "どう思う？" }),
    });
    const body = (await res.json()) as { items: { body: string }[] };
    expect(body.items[1]?.body).toBe("こう考えると良いです。");
  });

  it("appends a disclaimer for legal questions and keeps the user turn when AI fails", async () => {
    setTestAiRun(async () => ({ response: "気になる点は利用規約くらいです。" }));
    const id = await createIdea("法務の種");
    await flushScheduledCreateEvaluations();

    const legal = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "これ法的リスクないかな？" }),
    });
    expect(legal.status).toBe(200);
    const legalBody = (await legal.json()) as { items: { role: string; body: string }[] };
    expect(legalBody.items[1]?.body).toContain("法律の助言ではありません");

    setTestAiRun(async () => {
      throw new Error("missing");
    });
    const fail = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "もう一回" }),
    });
    expect(fail.status).toBe(502);
    const failBody = (await fail.json()) as { error: string };
    expect(failBody.error).toBe(DISCUSS_FAIL_MESSAGE);
    const listed = await api(`/ideas/${id}/discussions`);
    const listBody = (await listed.json()) as { items: { role: string; body: string }[] };
    expect(listBody.items.at(-1)?.role).toBe("user");
    expect(listBody.items.at(-1)?.body).toBe("もう一回");
  });

  it("blocks archive and removes messages when the idea is deleted", async () => {
    const archived = await createIdea("相談アーカイブ");
    await flushScheduledCreateEvaluations();
    await markArchived(archived);
    const locked = await api(`/ideas/${archived}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "話せる？" }),
    });
    expect(locked.status).toBe(409);
    const lockedBody = (await locked.json()) as { error: string };
    expect(lockedBody.error).toBe(DISCUSS_ARCHIVE_ERROR);

    setTestAiRun(async () => ({ response: "残します。" }));
    const id = await createIdea("消す相談");
    await flushScheduledCreateEvaluations();
    const sent = await api(`/ideas/${id}/discuss`, {
      method: "POST",
      body: JSON.stringify({ body: "こんにちは" }),
    });
    expect(sent.status).toBe(200);
    const removed = await api(`/ideas/${id}`, { method: "DELETE" });
    expect(removed.status).toBe(200);
    const gone = await api(`/ideas/${id}/discussions`);
    expect(gone.status).toBe(404);
  });
});

describe("idea detail discuss action", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("returns ok without a document redirect", async () => {
    setTestAiRun(async () => ({ response: "一枚に絞ると良さそうです。" }));
    const id = await createIdea("詳細から相談");
    await flushScheduledCreateEvaluations();
    const result = await ideaDetailAction(
      detailActionArgs(id, { intent: "discuss", body: "次の一手は？" }),
    );
    expect(result).toEqual({ ok: true, intent: "discuss" });
    const listed = await api(`/ideas/${id}/discussions`);
    const body = (await listed.json()) as { items: { body: string }[] };
    expect(body.items.map((item) => item.body)).toEqual([
      "次の一手は？",
      "一枚に絞ると良さそうです。",
    ]);
  });
});
