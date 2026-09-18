import {
  extractAiText,
  resolveResearchModel,
  type ResearchModelId,
} from "../../app/lib/research-models";
import { getIdeaRow, saveIdeaResearch, type Idea } from "../../db/ideas";
import type { Db } from "../../db/client";

export const RESEARCH_FAIL_MESSAGE = "リサーチに失敗しました。時間をおいて再度お試しください。";

export const RESEARCH_SYSTEM_PROMPT = [
  "あなたはアイデアのリサーチ助手です。ウェブ検索はしません。",
  "与えられたアイデア本文だけを読み、日本語で短く箇条書きにしてください。",
  "見出しは「観点」「リスク」「次の一手」の3つ。前置きや締めの文は不要です。",
].join("");

export type ResearchAiInputs = {
  messages: { role: "system" | "user"; content: string }[];
  max_tokens?: number;
};

/** Minimal run() shape so tests can stub Workers AI without calling the binding. */
export type ResearchAiRun = (model: ResearchModelId, inputs: ResearchAiInputs) => Promise<unknown>;

export type ResearchAi = {
  run: ResearchAiRun;
};

let testAiRun: ResearchAiRun | undefined;

/** Test-only. Production always uses env.AI via the wrapper below. */
export function setTestAiRun(run?: ResearchAiRun) {
  testAiRun = run;
}

export function bindResearchAi(ai: Env["AI"] | undefined): ResearchAi {
  return {
    async run(model, inputs) {
      if (!ai) {
        throw new Error("Workers AI binding is missing");
      }
      // Fast 8B fp8 is allowlisted but not always in generated AiModelList.
      return (ai as unknown as ResearchAi).run(model, inputs);
    },
  };
}

export async function generateResearchNotes(
  ai: ResearchAi,
  model: ResearchModelId,
  ideaText: string,
): Promise<string> {
  const run = testAiRun ?? ai.run;
  const result = await run(model, {
    messages: [
      { role: "system", content: RESEARCH_SYSTEM_PROMPT },
      { role: "user", content: ideaText },
    ],
    max_tokens: 512,
  });
  const text = extractAiText(result).trim();
  if (!text) {
    throw new Error("empty research result");
  }
  return text;
}

export type ResearchIdeaResult =
  { ok: true; idea: Idea } | { ok: false; status: 400 | 404 | 409 | 502; error: string };

export async function researchIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  preset?: string | null;
  model?: string | null;
}): Promise<ResearchIdeaResult> {
  const resolved = resolveResearchModel({ preset: opts.preset, model: opts.model });
  if (!resolved.ok) {
    return { ok: false, status: 400, error: resolved.error };
  }

  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return { ok: false, status: 404, error: "見つかりません" };
  }
  if (idea.stage !== "selected") {
    return { ok: false, status: 409, error: "採用してからリサーチできます" };
  }

  const ideaText = [idea.title, idea.body].filter((part) => part.trim().length > 0).join("\n");
  let notes: string;
  try {
    notes = await generateResearchNotes(opts.ai, resolved.model, ideaText);
  } catch {
    return { ok: false, status: 502, error: RESEARCH_FAIL_MESSAGE };
  }

  const saved = await saveIdeaResearch(opts.db, idea.id, {
    notes,
    model: resolved.model,
  });
  return { ok: true, idea: saved };
}
