import {
  DEFAULT_BRAINSTORM_PRESET,
  extractAiText,
  resolveResearchModel,
  type ResearchModelId,
} from "../../app/lib/research-models";
import { BRAINSTORM_ARCHIVE_ERROR, canRunIdeaAi } from "../../app/lib/idea-ai";
import { asStage, getIdeaRow } from "../../db/ideas";
import { insertIdeaBrainstorm, type IdeaBrainstorm } from "../../db/brainstorms";
import { listCommentsForIdea, type IdeaComment } from "../../db/comments";
import type { Db } from "../../db/client";
import { errorClass, logDiag } from "../diag";
import { resolveAiRun, type ResearchAi } from "./research";
import { writeInLanguage } from "./language";
import { aiFailure, type AiFailure } from "./errors";
import type { Locale } from "../../app/i18n/locale";

export const BRAINSTORM_FAIL_MESSAGE = "ブレストに失敗しました。時間をおいて再度お試しください。";

/** Brainstorm notes are displayed as stored, so the whole note follows the reader. */
export function brainstormSystemPrompt(locale?: Locale): string {
  return [
    "あなたはアイデアを広げるブレスト相手です。ウェブ検索はしません。",
    "与えられたタイトル・本文・コメントだけを読み、具体的な展開を書いてください。",
    "見出しは「切り口」「別案」「次の問い」「関連する方向」にあたる4つ。前置きや締めの文は不要です。",
    writeInLanguage(locale),
  ].join("");
}

/** Japanese wording, kept for the tests and callers that pin it. */
export const BRAINSTORM_SYSTEM_PROMPT = brainstormSystemPrompt("ja");

const COMMENT_LIMIT = 8;
const COMMENT_MAX_LEN = 400;

export function formatBrainstormUserText(opts: {
  title: string;
  body: string;
  comments: Pick<IdeaComment, "body">[];
}): string {
  const parts = [
    `タイトル: ${opts.title.trim() || "無題"}`,
    `本文:\n${opts.body.trim() || "（なし）"}`,
  ];
  const comments = opts.comments.slice(-COMMENT_LIMIT);
  if (comments.length > 0) {
    const lines = comments.map((comment) => `- ${comment.body.trim().slice(0, COMMENT_MAX_LEN)}`);
    parts.push(`コメント:\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
}

export async function generateBrainstormNotes(
  ai: ResearchAi,
  model: ResearchModelId,
  ideaText: string,
  locale?: Locale,
): Promise<string> {
  const run = resolveAiRun(ai);
  const result = await run(model, {
    messages: [
      { role: "system", content: brainstormSystemPrompt(locale) },
      { role: "user", content: ideaText },
    ],
    max_tokens: 768,
  });
  const text = extractAiText(result).trim();
  if (!text) {
    throw new Error("empty brainstorm result");
  }
  return text;
}

export type BrainstormIdeaResult = { ok: true; brainstorm: IdeaBrainstorm } | AiFailure;

export async function brainstormIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  preset?: string | null;
  model?: string | null;
  /** Language the notes are written in. Defaults to Japanese. */
  locale?: Locale;
}): Promise<BrainstormIdeaResult> {
  const resolved = resolveResearchModel({
    preset: opts.preset,
    model: opts.model,
    defaultPreset: DEFAULT_BRAINSTORM_PRESET,
  });
  if (!resolved.ok) {
    return aiFailure(400, "badRequest", resolved.error);
  }

  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return aiFailure(404, "notFound", "見つかりません");
  }
  if (!canRunIdeaAi(asStage(idea.stage))) {
    logDiag("info", "ai brainstorm", {
      step: "brainstorm",
      outcome: "skipped",
      reason: "archived",
      ideaId: idea.id,
      status: 409,
    });
    return aiFailure(409, "archived", BRAINSTORM_ARCHIVE_ERROR);
  }

  const comments = await listCommentsForIdea(opts.db, idea.id);
  const ideaText = formatBrainstormUserText({
    title: idea.title,
    body: idea.body,
    comments,
  });
  logDiag("info", "ai brainstorm", {
    step: "brainstorm",
    outcome: "start",
    ideaId: idea.id,
    model: resolved.model,
    count: comments.length,
  });
  let notes: string;
  try {
    notes = await generateBrainstormNotes(opts.ai, resolved.model, ideaText, opts.locale);
  } catch (error) {
    logDiag("warn", "workers ai call", {
      step: "brainstorm",
      provider: "workers_ai",
      outcome: "fail",
      ideaId: idea.id,
      model: resolved.model,
      error: errorClass(error),
    });
    return aiFailure(502, "failed", BRAINSTORM_FAIL_MESSAGE);
  }

  const saved = await insertIdeaBrainstorm(opts.db, idea.id, {
    notes,
    model: resolved.model,
  });
  return { ok: true, brainstorm: saved };
}
