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
import { writeInLanguageKeepingHeadings } from "./language";
import { aiFailure, type AiFailure } from "./errors";
import { EVALUATION_SECTION_LABELS } from "../../app/lib/evaluation-notes";
import type { Locale } from "../../app/i18n/locale";

export const EVALUATE_FAIL_MESSAGE = "AI評価に失敗しました。時間をおいて再度お試しください。";

/**
 * Unlike research and brainstorm, this note is parsed back out again
 * (app/lib/evaluation-notes.ts), so the four headings and the score line stay
 * Japanese as storage keys while the prose follows the reader. The UI never
 * shows those headings raw — it renders `t.idea.evaluation.section.*`.
 */
export function evaluateSystemPrompt(locale?: Locale): string {
  return [
    "あなたはアイデアの評価相手です。ウェブ検索はしません。",
    "与えられたタイトルと本文だけを読み、短く批評してください。",
    "見出しは「強み」「リスク」「新規性」「次の一手」の4つ。各見出しの下は、小数や内部スコアを使わず、短い箇条書きにしてください。",
    "前置きや締めの文は不要です。",
    "最後の行は必ず「スコア: N」とし、Nは1から5の整数だけにしてください。",
    writeInLanguageKeepingHeadings(locale, EVALUATION_SECTION_LABELS),
  ].join("");
}

/** Japanese wording, kept for the tests and callers that pin it. */
export const EVALUATE_SYSTEM_PROMPT = evaluateSystemPrompt("ja");

export async function generateAiEvaluation(
  ai: ResearchAi,
  model: ResearchModelId,
  ideaText: string,
  locale?: Locale,
): Promise<string> {
  const run = resolveAiRun(ai);
  const result = await run(model, {
    messages: [
      { role: "system", content: evaluateSystemPrompt(locale) },
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

export type EvaluateIdeaResult = { ok: true; idea: Idea } | AiFailure;

export async function evaluateIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  preset?: string | null;
  model?: string | null;
  typesafeApiKey?: string;
  /** Language the evaluation prose is written in. Defaults to Japanese. */
  locale?: Locale;
}): Promise<EvaluateIdeaResult> {
  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return aiFailure(404, "notFound", "見つかりません");
  }
  if (!canRunIdeaAi(asStage(idea.stage))) {
    logDiag("info", "ai evaluate", {
      step: "evaluate",
      outcome: "skipped",
      reason: "archived",
      ideaId: idea.id,
      status: 409,
    });
    return aiFailure(409, "archived", EVALUATE_ARCHIVE_ERROR);
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
      const jev = await evaluateIdeaWithJev(opts.typesafeApiKey, ideaText, opts.locale);
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
    return aiFailure(400, "badRequest", resolved.error);
  }

  let notes: string;
  try {
    notes = await generateAiEvaluation(opts.ai, resolved.model, ideaText, opts.locale);
  } catch (error) {
    logDiag("warn", "workers ai call", {
      step: "evaluate",
      provider: "workers_ai",
      outcome: "fail",
      ideaId: idea.id,
      model: resolved.model,
      error: errorClass(error),
    });
    return aiFailure(502, "failed", EVALUATE_FAIL_MESSAGE);
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
  /** Language of whoever created the idea. Defaults to Japanese. */
  locale?: Locale;
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
  locale?: Locale;
}): Promise<void> {
  try {
    const result = await evaluateIdea({
      db: opts.db,
      ai: opts.ai,
      ideaId: opts.ideaId,
      typesafeApiKey: opts.typesafeApiKey,
      locale: opts.locale,
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
