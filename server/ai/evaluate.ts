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
import { errorClass, logDiag, statusFromError } from "../diag";
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
    logDiag("info", "ai evaluate", {
      step: "evaluate",
      outcome: "skipped",
      reason: "archived",
      ideaId: idea.id,
      status: 409,
    });
    return { ok: false, status: 409, error: EVALUATE_ARCHIVE_ERROR };
  }

  const hasTypesafeKey = Boolean(opts.typesafeApiKey?.trim());
  const ideaText = [idea.title, idea.body].filter((part) => part.trim().length > 0).join("\n");
  logDiag("info", "ai evaluate", {
    step: "evaluate",
    outcome: "start",
    ideaId: idea.id,
    hasTypesafeApiKey: hasTypesafeKey,
    provider: hasTypesafeApiKey(opts.typesafeApiKey) ? "jev" : "workers_ai",
  });
  if (hasTypesafeApiKey(opts.typesafeApiKey)) {
    try {
      const jev = await evaluateIdeaWithJev(opts.typesafeApiKey, ideaText);
      const saved = await saveAiEvaluation(opts.db, idea.id, {
        score: jev.score,
        notes: jev.notes,
        model: jev.model,
      });
      logDiag("info", "ai evaluate", {
        step: "evaluate",
        outcome: "success",
        ideaId: idea.id,
        provider: "jev",
        hasTypesafeApiKey: hasTypesafeKey,
      });
      return { ok: true, idea: saved };
    } catch (error) {
      logDiag("warn", "ai evaluate", {
        step: "evaluate",
        outcome: "fallback",
        ideaId: idea.id,
        provider: "workers_ai",
        hasTypesafeApiKey: hasTypesafeKey,
        error: errorClass(error),
        status: statusFromError(error),
      });
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
  } catch (error) {
    logDiag("warn", "workers ai call", {
      step: "evaluate",
      provider: "workers_ai",
      outcome: "fail",
      ideaId: idea.id,
      model: resolved.model,
      error: errorClass(error),
    });
    return { ok: false, status: 502, error: EVALUATE_FAIL_MESSAGE };
  }

  const saved = await saveAiEvaluation(opts.db, idea.id, {
    score: parseAiScore(notes),
    notes,
    model: resolved.model,
  });
  logDiag("info", "ai evaluate", {
    step: "evaluate",
    outcome: "success",
    ideaId: idea.id,
    provider: "workers_ai",
    model: resolved.model,
    hasTypesafeApiKey: hasTypesafeKey,
  });
  return { ok: true, idea: saved };
}

const scheduledCreateEvaluations: Promise<void>[] = [];

/** Test helper. Production create paths do not await evaluation. */
export async function flushScheduledCreateEvaluations(): Promise<void> {
  while (scheduledCreateEvaluations.length > 0) {
    const batch = scheduledCreateEvaluations.splice(0, scheduledCreateEvaluations.length);
    await Promise.all(batch);
  }
}

/**
 * Run AI評価 after create without holding the response.
 * Prefers TypeSafe Jev when a key (or the test stub) is present, else Workers AI.
 * Archive is skipped. Failures are logged and do not reject.
 */
export function scheduleCreateEvaluation(opts: {
  waitUntil?: (promise: Promise<unknown>) => void;
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  stage: string;
  typesafeApiKey?: string;
}): void {
  const hasTypesafeKey = Boolean(opts.typesafeApiKey?.trim());
  if (!canRunIdeaAi(asStage(opts.stage))) {
    logDiag("info", "create auto-evaluate", {
      step: "evaluate",
      outcome: "skipped",
      reason: "archived",
      ideaId: opts.ideaId,
      stage: opts.stage,
      hasTypesafeApiKey: hasTypesafeKey,
    });
    return;
  }

  logDiag("info", "create auto-evaluate", {
    step: "evaluate",
    outcome: "scheduled",
    ideaId: opts.ideaId,
    stage: opts.stage,
    hasTypesafeApiKey: hasTypesafeKey,
  });
  const task = runCreateEvaluation(opts);
  scheduledCreateEvaluations.push(task);
  opts.waitUntil?.(task);
  void task.finally(() => {
    const index = scheduledCreateEvaluations.indexOf(task);
    if (index >= 0) scheduledCreateEvaluations.splice(index, 1);
  });
}

async function runCreateEvaluation(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  typesafeApiKey?: string;
}): Promise<void> {
  try {
    const result = await evaluateIdea({
      db: opts.db,
      ai: opts.ai,
      ideaId: opts.ideaId,
      typesafeApiKey: opts.typesafeApiKey,
    });
    if (!result.ok) {
      logDiag("warn", "create auto-evaluate", {
        step: "evaluate",
        outcome: "fail",
        ideaId: opts.ideaId,
        status: result.status,
        error: "rejected",
      });
      return;
    }
    logDiag("info", "create auto-evaluate", {
      step: "evaluate",
      outcome: "success",
      ideaId: opts.ideaId,
      status: 200,
    });
  } catch (error) {
    logDiag("warn", "create auto-evaluate", {
      step: "evaluate",
      outcome: "fail",
      ideaId: opts.ideaId,
      error: errorClass(error),
      status: null,
    });
  }
}
