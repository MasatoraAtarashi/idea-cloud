import {
  DEFAULT_EVALUATE_PRESET,
  extractAiText,
  resolveResearchModel,
  type ResearchModelId,
} from "../../app/lib/research-models";
import { canRunIdeaAi, EVALUATE_ARCHIVE_ERROR } from "../../app/lib/idea-ai";
import { parseAiScore } from "../../app/lib/scores";
import { asStage, getIdeaRow, saveAiEvaluation, type Idea } from "../../db/ideas";
import type { Db } from "../../db/client";
import { evaluateIdeaWithJev } from "./jev-evaluate";
import { resolveAiRun, type ResearchAi } from "./research";
import { hasTypesafeApiKey } from "./typesafe";

export const EVALUATE_FAIL_MESSAGE = "AI評価に失敗しました。時間をおいて再度お試しください。";

export const EVALUATE_SYSTEM_PROMPT = [
  "あなたはアイデアの評価相手です。ウェブ検索はしません。",
  "与えられたタイトルと本文だけを読み、日本語で短く批評してください。",
  "見出しは「強み」「リスク」「新規性」「次の一手」の4つ。前置きや締めの文は不要です。",
  "最後の行は必ず「スコア: N」とし、Nは1から5の整数だけにしてください。",
].join("");

export async function generateAiEvaluation(
  ai: ResearchAi,
  model: ResearchModelId,
  ideaText: string,
): Promise<string> {
  const run = resolveAiRun(ai);
  const result = await run(model, {
    messages: [
      { role: "system", content: EVALUATE_SYSTEM_PROMPT },
      { role: "user", content: ideaText },
    ],
    max_tokens: 512,
  });
  const text = extractAiText(result).trim();
  if (!text) {
    throw new Error("empty evaluation result");
  }
  return text;
}

export type EvaluateIdeaResult =
  { ok: true; idea: Idea } | { ok: false; status: 400 | 404 | 409 | 502; error: string };

export async function evaluateIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  preset?: string | null;
  model?: string | null;
  typesafeApiKey?: string;
}): Promise<EvaluateIdeaResult> {
  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return { ok: false, status: 404, error: "見つかりません" };
  }
  if (!canRunIdeaAi(asStage(idea.stage))) {
    return { ok: false, status: 409, error: EVALUATE_ARCHIVE_ERROR };
  }

  const ideaText = [idea.title, idea.body].filter((part) => part.trim().length > 0).join("\n");
  if (hasTypesafeApiKey(opts.typesafeApiKey)) {
    try {
      const jev = await evaluateIdeaWithJev(opts.typesafeApiKey, ideaText);
      const saved = await saveAiEvaluation(opts.db, idea.id, {
        score: jev.score,
        notes: jev.notes,
        model: jev.model,
      });
      return { ok: true, idea: saved };
    } catch {
      // fall through to Workers AI
    }
  }

  const resolved = resolveResearchModel({
    preset: opts.preset,
    model: opts.model,
    defaultPreset: DEFAULT_EVALUATE_PRESET,
  });
  if (!resolved.ok) {
    return { ok: false, status: 400, error: resolved.error };
  }

  let notes: string;
  try {
    notes = await generateAiEvaluation(opts.ai, resolved.model, ideaText);
  } catch {
    return { ok: false, status: 502, error: EVALUATE_FAIL_MESSAGE };
  }

  const saved = await saveAiEvaluation(opts.db, idea.id, {
    score: parseAiScore(notes),
    notes,
    model: resolved.model,
  });
  return { ok: true, idea: saved };
}
