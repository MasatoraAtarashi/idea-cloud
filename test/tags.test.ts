import { exports } from "cloudflare:workers";
import { afterEach, describe, expect, it } from "vitest";
import { RESEARCH_PRESETS } from "../app/lib/research-models";
import {
  parseTagSuggestions,
  resolveCreateTags,
  setTestTagAiRun,
  AUTO_TAG_MODEL,
} from "../server/ai/tags";
import { setTestSystemOneRun } from "../server/ai/typesafe";

const authHeaders = {
  "cf-access-authenticated-user-email": "test@example.com",
};

async function api(path: string, init?: RequestInit) {
  return exports.default.fetch(`https://example.com/api${path}`, {
    ...init,
    headers: { ...authHeaders, "content-type": "application/json", ...init?.headers },
  });
}

describe("auto-tag parsing", () => {
  it("reads a JSON array, object, or loose Japanese list", () => {
    expect(parseTagSuggestions('["通勤","音声メモ"]')).toEqual(["通勤", "音声メモ"]);
    expect(parseTagSuggestions('前置き\n{"tags":["朝","構造化"]}\n')).toEqual(["朝", "構造化"]);
    expect(parseTagSuggestions("通勤、音声メモ、朝")).toEqual(["通勤", "音声メモ", "朝"]);
  });

  it("caps length and strips hashes", () => {
    expect(parseTagSuggestions('["#通勤","#音声メモ","#朝","#長い","#もう一つ"]')).toEqual([
      "通勤",
      "音声メモ",
      "朝",
      "長い",
      "もう一つ",
    ]);
    // Over TAG_MAX_LEN (20). Repeated kana, not a high-entropy Latin blob (ASH detect-secrets).
    expect(parseTagSuggestions(JSON.stringify(["あ".repeat(21)]))).toEqual([]);
  });
});

describe("ideas auto-tags on create", () => {
  afterEach(() => {
    setTestTagAiRun();
    setTestSystemOneRun();
  });

  it("uses the fast research model", () => {
    expect(AUTO_TAG_MODEL).toBe(RESEARCH_PRESETS.fast);
  });

  it("persists suggested tags when the user did not supply any", async () => {
    setTestTagAiRun(async () => ({ response: '["通勤","音声メモ"]' }));
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "通勤の音声メモを、次の朝に構造化する" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { tags: string[] } };
    expect(created.item.tags).toEqual(["通勤", "音声メモ"]);
  });

  it("keeps user-provided tags and does not replace them", async () => {
    setTestTagAiRun(async () => ({ response: '["無視する"]' }));
    setTestSystemOneRun(async () => ({
      model: "jev-latest",
      answers: {
        tag: { type: "choice", choice: "AI", probabilities: { AI: 1 }, confidence: 1 },
      },
    }));
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "ユーザー指定", tags: ["手元"] }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { tags: string[] } };
    expect(created.item.tags).toEqual(["手元"]);
  });

  it("creates the idea without tags when the model fails", async () => {
    setTestTagAiRun(async () => {
      throw new Error("Workers AI down");
    });
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "失敗しても作る" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { tags: string[]; title: string } };
    expect(created.item.title).toBe("失敗しても作る");
    expect(created.item.tags).toEqual([]);
  });

  it("uses Jev choice tags when TypeSafe is stubbed", async () => {
    let workersAiCalled = false;
    setTestTagAiRun(async () => {
      workersAiCalled = true;
      return { response: '["無視する"]' };
    });
    setTestSystemOneRun(async () => ({
      model: "jev-latest",
      answers: {
        tag: {
          type: "choice",
          choice: "記録",
          probabilities: { 記録: 0.42, 時間: 0.27, 個人: 0.19, AI: 0.04 },
          confidence: 0.5,
        },
      },
    }));
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "朝の音声メモを残す" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { tags: string[] } };
    expect(created.item.tags).toEqual(["記録", "時間", "個人"]);
    expect(workersAiCalled).toBe(false);
  });

  it("falls back to Workers AI when Jev fails", async () => {
    setTestSystemOneRun(async () => ({
      model: "jev-latest",
      answers: {},
    }));
    setTestTagAiRun(async () => ({ response: '["通勤","音声メモ"]' }));
    const create = await api("/ideas", {
      method: "POST",
      body: JSON.stringify({ body: "Jevが落ちてもタグは付ける" }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { tags: string[] } };
    expect(created.item.tags).toEqual(["通勤", "音声メモ"]);
  });

  it("catches Jev errors and uses Workers AI", async () => {
    setTestSystemOneRun(async () => {
      throw new Error("TypeSafe down");
    });
    const tags = await resolveCreateTags({
      ai: {
        async run() {
          return { response: '["通勤"]' };
        },
      },
      text: "本文",
      tags: [],
      typesafeApiKey: "ああああああ",
    });
    expect(tags).toEqual(["通勤"]);
  });
});
