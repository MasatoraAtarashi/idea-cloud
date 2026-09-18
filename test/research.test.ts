import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import { extractAiText, RESEARCH_PRESETS, resolveResearchModel } from "../app/lib/research-models";
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

async function markSelected(id: number) {
  await env.DB.prepare("UPDATE ideas SET stage = 'selected' WHERE id = ?").bind(id).run();
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

  it("rejects research until the idea is selected", async () => {
    const id = await createIdea("まだ着想");
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("採用してからリサーチできます");

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
    await markSelected(id);
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({ model: "@hf/thebloke/not-allowed" }),
    });
    expect(res.status).toBe(400);
  });

  it("runs research for selected ideas, persists notes, and honors presets", async () => {
    setTestAiRun(async (model) => ({
      response: `観点:\n- テスト\nリスク:\n- なし\n次の一手:\n- ${model}`,
    }));

    const id = await createIdea("採用したアイデア");
    await markSelected(id);

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
    await markSelected(id);
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
    await markSelected(id);
    const res = await api(`/ideas/${id}/research`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(RESEARCH_FAIL_MESSAGE);
  });
});
