import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { ideaDetailAction } from "../app/lib/idea-detail-action";
import { extractAiText, RESEARCH_PRESETS, resolveResearchModel } from "../app/lib/research-models";
import { RESEARCH_ARCHIVE_ERROR } from "../app/lib/idea-ai";
import { RESEARCH_FAIL_MESSAGE, setTestAiRun } from "../server/ai/research";

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

describe("research model mapping", () => {
  it("defaults to fast and maps presets", () => {
    expect(resolveResearchModel({})).toEqual({
      ok: true,
      preset: "fast",
      model: RESEARCH_PRESETS.fast,
    });
    expect(resolveResearchModel({ preset: "standard" })).toEqual({
      ok: true,
      preset: "standard",
      model: RESEARCH_PRESETS.standard,
    });
    expect(resolveResearchModel({ preset: "deep" })).toEqual({
      ok: true,
      preset: "deep",
      model: RESEARCH_PRESETS.deep,
    });
    expect(resolveResearchModel({ defaultPreset: "standard" })).toEqual({
      ok: true,
      preset: "standard",
      model: RESEARCH_PRESETS.standard,
    });
  });

  it("allows only the three model ids and ignores unknown presets", () => {
    expect(resolveResearchModel({ model: RESEARCH_PRESETS.deep })).toEqual({
      ok: true,
      preset: "deep",
      model: RESEARCH_PRESETS.deep,
    });
    expect(resolveResearchModel({ model: "@cf/meta/llama-3.1-8b-instruct" }).ok).toBe(false);
    expect(resolveResearchModel({ preset: "turbo" }).ok).toBe(false);
  });

  it("reads common Workers AI response shapes", () => {
    expect(extractAiText({ response: "観点" })).toBe("観点");
    expect(extractAiText({ choices: [{ message: { content: "次の一手" } }] })).toBe("次の一手");
    expect(extractAiText(null)).toBe("");
  });
});

describe("ideas research API", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("runs research from 着想 without waiting for 採用", async () => {
    setTestAiRun(async () => ({
      response: "観点:\n- 着想\nリスク:\n- なし\n次の一手:\n- 続ける",
    }));
    const id = await createIdea("まだ着想");
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      item: { stage: string; researchNotes: string; researchModel: string };
    };
    expect(body.item.stage).toBe("spark");
    expect(body.item.researchNotes).toContain("着想");
    expect(body.item.researchModel).toBe(RESEARCH_PRESETS.fast);
  });

  it("rejects research when the idea is archived", async () => {
    const id = await createIdea("しまってある");
    await markArchived(id);
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(RESEARCH_ARCHIVE_ERROR);

    const one = await api(`/ideas/${id}`);
    const detail = (await one.json()) as { item: { researchNotes: string | null } };
    expect(detail.item.researchNotes).toBeNull();
  });

  it("returns 404 for a missing idea", async () => {
    const res = await api("/ideas/999999/research", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
  });

  it("rejects a model outside the allowlist", async () => {
    const id = await createIdea("許可外モデル");
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({ model: "@hf/thebloke/not-allowed" }),
    });
    expect(res.status).toBe(400);
  });

  it("persists notes and honors presets", async () => {
    setTestAiRun(async (model) => ({
      response: `観点:\n- テスト\nリスク:\n- なし\n次の一手:\n- ${model}`,
    }));

    const id = await createIdea("採用前でもリサーチ");

    const fast = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(fast.status).toBe(200);
    const fastBody = (await fast.json()) as {
      item: { researchNotes: string; researchModel: string; researchedAt: string };
    };
    expect(fastBody.item.researchModel).toBe(RESEARCH_PRESETS.fast);
    expect(fastBody.item.researchNotes).toContain("観点");
    expect(fastBody.item.researchedAt).toBeTruthy();

    const standard = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({ preset: "standard" }),
    });
    expect(standard.status).toBe(200);
    const standardBody = (await standard.json()) as { item: { researchModel: string } };
    expect(standardBody.item.researchModel).toBe(RESEARCH_PRESETS.standard);

    const override = await api(
      `/ideas/${id}/research?model=${encodeURIComponent(RESEARCH_PRESETS.deep)}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
    expect(override.status).toBe(200);
    const overrideBody = (await override.json()) as {
      item: { researchNotes: string; researchModel: string };
    };
    expect(overrideBody.item.researchModel).toBe(RESEARCH_PRESETS.deep);
    expect(overrideBody.item.researchNotes).toContain(RESEARCH_PRESETS.deep);

    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { researchModel: string; researchNotes: string };
    };
    expect(reloaded.item.researchModel).toBe(RESEARCH_PRESETS.deep);
    expect(reloaded.item.researchNotes).toContain("次の一手");
  });

  it("returns 502 when the model yields empty text", async () => {
    setTestAiRun(async () => ({ response: "   " }));
    const id = await createIdea("空の応答");
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({ preset: "fast" }),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(RESEARCH_FAIL_MESSAGE);
  });

  it("returns a Japanese 502 when Workers AI is missing", async () => {
    const id = await createIdea("バインディングなし");
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(RESEARCH_FAIL_MESSAGE);
  });

  it("keeps saved notes when a later run fails", async () => {
    setTestAiRun(async () => ({ response: "観点:\n- 残す\nリスク:\n- なし\n次の一手:\n- 続ける" }));
    const id = await createIdea("メモを残す");
    const first = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(first.status).toBe(200);

    setTestAiRun(async () => {
      throw new Error("Workers AI down");
    });
    const second = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(second.status).toBe(502);
    const failBody = (await second.json()) as { error: string };
    expect(failBody.error).toBe(RESEARCH_FAIL_MESSAGE);

    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { researchNotes: string; researchModel: string };
    };
    expect(reloaded.item.researchNotes).toContain("残す");
    expect(reloaded.item.researchModel).toBe(RESEARCH_PRESETS.fast);
  });
});

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

describe("idea detail research action", () => {
  afterEach(() => {
    setTestAiRun();
  });

  it("runs research from the detail form on a 着想 idea", async () => {
    setTestAiRun(async () => ({
      response: "観点:\n- 詳細\nリスク:\n- なし\n次の一手:\n- 採用する",
    }));
    const id = await createIdea("詳細からリサーチ");

    const result = await ideaDetailAction(
      detailActionArgs(id, { intent: "research", preset: "standard" }),
    );
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("Location")).toBe(`/app/ideas/${id}#research`);

    const reload = await api(`/ideas/${id}`);
    const reloaded = (await reload.json()) as {
      item: { researchNotes: string; researchModel: string; researchedAt: string };
    };
    expect(reloaded.item.researchModel).toBe(RESEARCH_PRESETS.standard);
    expect(reloaded.item.researchNotes).toContain("詳細");
    expect(reloaded.item.researchedAt).toBeTruthy();
  });

  it("rejects the UI POST when the idea is archived", async () => {
    const id = await createIdea("詳細のアーカイブ");
    await markArchived(id);
    const result = await ideaDetailAction(
      detailActionArgs(id, { intent: "research", preset: "fast" }),
    );
    expect(result).toEqual({ error: RESEARCH_ARCHIVE_ERROR });
  });

  it("returns a Japanese error when the detail action cannot call AI", async () => {
    const id = await createIdea("詳細の失敗");
    const result = await ideaDetailAction(detailActionArgs(id, { intent: "research" }));
    expect(result).toEqual({ error: RESEARCH_FAIL_MESSAGE });
  });
});
