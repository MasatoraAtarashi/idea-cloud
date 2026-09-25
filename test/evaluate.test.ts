import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import { createIdeaAction } from "../app/lib/idea-action";
import { EVALUATE_ARCHIVE_ERROR } from "../app/lib/idea-ai";
import { parseAiScore } from "../app/lib/scores";
import { JEV_MODEL } from "../app/lib/jev";
import { RESEARCH_PRESETS } from "../app/lib/research-models";
import { EVALUATE_FAIL_MESSAGE, flushScheduledCreateEvaluations } from "../server/ai/evaluate";
import { setTestAiRun } from "../server/ai/research";
import { setTestSystemOneRun, type SystemOneResult } from "../server/ai/typesafe";
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
      plan: "premium",
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
    setTestSystemOneRun();
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

  it("uses Jev scores when TypeSafe is stubbed", async () => {
    let workersAiCalled = false;
    setTestAiRun(async () => {
      workersAiCalled = true;
      return { response: "強み:\nスコア: 1" };
    });
    setTestSystemOneRun(async () => ({
      model: JEV_MODEL,
      answers: {
        novelty: {
          type: "score",
          score: 2.4,
          legend: { "2": "明確に新しい" },
          probabilities: {},
          confidence: 0.7,
        },
        impact: {
          type: "score",
          score: 2.2,
          legend: { "2": "大きい" },
          probabilities: {},
          confidence: 0.7,
        },
        feasibility: {
          type: "score",
          score: 1.9,
          legend: { "2": "現実的" },
          probabilities: {},
          confidence: 0.7,
        },
        clarity: {
          type: "score",
          score: 2.0,
          legend: { "2": "具体的" },
          probabilities: {},
          confidence: 0.7,
        },
        risk: {
          type: "score",
          score: 1.1,
          legend: { "1": "中程度" },
          probabilities: {},
          confidence: 0.7,
        },
        pursue: { type: "noul", noul: 0.77 },
        next: {
          type: "choice",
          choice: "age",
          probabilities: { age: 0.6 },
          confidence: 0.5,
        },
      },
    }));
    const id = await createIdea("Jevで評価する着想");
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
    expect(body.item.aiScore).toBeGreaterThanOrEqual(1);
    expect(body.item.aiScore).toBeLessThanOrEqual(5);
    expect(body.item.aiEvaluation).toContain("強み");
    expect(body.item.aiEvaluation).toContain("寝かせて熟成させる");
    expect(body.item.aiEvaluationModel).toBe(JEV_MODEL);
    expect(body.item.aiEvaluatedAt).toBeTruthy();
    expect(workersAiCalled).toBe(false);
  });
});

describe("idea detail evaluate and score actions", () => {
  afterEach(() => {
    setTestAiRun();
    setTestSystemOneRun();
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

const jevEvaluateAnswers = {
  model: JEV_MODEL,
  answers: {
    novelty: {
      type: "score",
      score: 2.4,
      legend: { "2": "明確に新しい" },
      probabilities: {},
      confidence: 0.7,
    },
    impact: {
      type: "score",
      score: 2.2,
      legend: { "2": "大きい" },
      probabilities: {},
      confidence: 0.7,
    },
    feasibility: {
      type: "score",
      score: 1.9,
      legend: { "2": "現実的" },
      probabilities: {},
      confidence: 0.7,
    },
    clarity: {
      type: "score",
      score: 2.0,
      legend: { "2": "具体的" },
      probabilities: {},
      confidence: 0.7,
    },
    risk: {
      type: "score",
      score: 1.1,
      legend: { "1": "中程度" },
      probabilities: {},
      confidence: 0.7,
    },
    pursue: { type: "noul", noul: 0.77 },
    next: {
      type: "choice",
      choice: "try",
      probabilities: { try: 0.6 },
      confidence: 0.5,
    },
  },
} satisfies SystemOneResult;

describe("ideas auto-evaluate on create", () => {
  afterEach(() => {
    setTestAiRun();
    setTestSystemOneRun();
  });

  it("returns create before evaluation finishes, then persists the score", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let started = false;
    setTestAiRun(async () => {
      started = true;
      await gate;
      return { response: "強み:\n- 早い\nスコア: 4" };
    });

    try {
      const pending = api("/ideas", {
        method: "POST",
        body: JSON.stringify({ body: "作成と同時に評価", tags: ["手元"] }),
      });
      const raced = await Promise.race([
        pending.then((res) => ({ kind: "response" as const, res })),
        new Promise<{ kind: "timeout" }>((resolve) => {
          setTimeout(() => resolve({ kind: "timeout" }), 3_000);
        }),
      ]);
      if (raced.kind === "timeout") {
        release();
        await pending;
        throw new Error("create response waited for evaluation");
      }
      expect(raced.res.status).toBe(201);
      const created = (await raced.res.json()) as {
        item: { id: number; aiScore: number | null; aiEvaluation: string | null };
      };
      expect(created.item.aiScore).toBeNull();
      expect(created.item.aiEvaluation).toBeNull();

      const deadline = Date.now() + 2_000;
      while (!started && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(started).toBe(true);
      release();
      await flushScheduledCreateEvaluations();

      const reload = await api(`/ideas/${created.item.id}`);
      const body = (await reload.json()) as {
        item: { aiScore: number; aiEvaluation: string; aiEvaluationModel: string };
      };
      expect(body.item.aiScore).toBe(4);
      expect(body.item.aiEvaluation).toContain("強み");
      expect(body.item.aiEvaluationModel).toBe(RESEARCH_PRESETS.standard);
    } finally {
      release();
    }
  }, 15_000);

  it("still creates the idea when evaluation fails", async () => {
    setTestAiRun(async () => {
      throw new Error("Workers AI down");
    });
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "評価が落ちても作る", tags: ["手元"] }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { id: number; title: string } };
    expect(created.item.title).toBe("評価が落ちても作る");
    await flushScheduledCreateEvaluations();
    const reload = await api(`/ideas/${created.item.id}`);
    const body = (await reload.json()) as {
      item: { aiScore: number | null; aiEvaluation: string | null };
    };
    expect(body.item.aiScore).toBeNull();
    expect(body.item.aiEvaluation).toBeNull();
  });

  it("skips evaluation when the new idea is archived", async () => {
    let called = false;
    setTestAiRun(async () => {
      called = true;
      return { response: "強み:\nスコア: 3" };
    });
    setTestSystemOneRun(async () => jevEvaluateAnswers);
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "しまって作る", stage: "archived", tags: ["手元"] }),
    });
    expect(create.status).toBe(201);
    await flushScheduledCreateEvaluations();
    expect(called).toBe(false);
    const created = (await create.json()) as { item: { id: number } };
    const reload = await api(`/ideas/${created.item.id}`);
    const body = (await reload.json()) as { item: { aiEvaluation: string | null } };
    expect(body.item.aiEvaluation).toBeNull();
  });

  it("prefers Jev when TypeSafe is stubbed", async () => {
    let workersAiCalled = false;
    setTestAiRun(async () => {
      workersAiCalled = true;
      return { response: "強み:\nスコア: 1" };
    });
    setTestSystemOneRun(async () => jevEvaluateAnswers);
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "Jevで自動評価", tags: ["手元"] }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { id: number; aiScore: number | null } };
    expect(created.item.aiScore).toBeNull();
    await flushScheduledCreateEvaluations();
    const reload = await api(`/ideas/${created.item.id}`);
    const body = (await reload.json()) as {
      item: { aiScore: number; aiEvaluation: string; aiEvaluationModel: string };
    };
    expect(body.item.aiScore).toBeGreaterThanOrEqual(1);
    expect(body.item.aiEvaluation).toContain("小さく試す");
    expect(body.item.aiEvaluationModel).toBe(JEV_MODEL);
    expect(workersAiCalled).toBe(false);
  });

  it("schedules evaluation from the compose action and still redirects on failure", async () => {
    setTestAiRun(async () => ({ response: "強み:\n- あり\nスコア: 5" }));
    const form = new FormData();
    form.set("title", "フォーム評価");
    form.set("body", "本文");
    form.set("tags", "手元");
    form.set("stage", "spark");
    const waits: Promise<unknown>[] = [];
    const result = await createIdeaAction({
      request: new Request("https://example.com/app", { method: "POST", body: form }),
      params: {},
      context: {
        cloudflare: {
          env,
          ctx: {
            waitUntil(promise: Promise<unknown>) {
              waits.push(promise);
            },
          },
        },
        plan: "premium",
      },
    } as unknown as ActionFunctionArgs);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect((result as Response).headers.get("Location")).toContain("/app/list");
    expect(waits.length).toBe(1);
    await Promise.all(waits);

    const list = await api("/ideas");
    const listed = (await list.json()) as {
      items: { id: number; title: string; aiScore: number | null }[];
    };
    const saved = listed.items.find((item) => item.title === "フォーム評価");
    expect(saved?.aiScore).toBe(5);

    setTestAiRun(async () => {
      throw new Error("Workers AI down");
    });
    const failForm = new FormData();
    failForm.set("body", "フォームは失敗しても作る");
    failForm.set("tags", "手元");
    const failed = await createIdeaAction({
      request: new Request("https://example.com/app", { method: "POST", body: failForm }),
      params: {},
      context: {
        cloudflare: {
          env,
          ctx: { waitUntil() {} },
        },
        plan: "premium",
      },
    } as unknown as ActionFunctionArgs);
    expect(failed).toBeInstanceOf(Response);
    expect((failed as Response).status).toBe(302);
    await flushScheduledCreateEvaluations();
    const again = await api("/ideas");
    const againBody = (await again.json()) as {
      items: { title: string; aiEvaluation: string | null }[];
    };
    const missed = againBody.items.find((item) => item.title === "フォームは失敗しても作る");
    expect(missed?.aiEvaluation).toBeNull();
  });
});
