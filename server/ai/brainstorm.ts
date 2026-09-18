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
import { runWorkersAi, type ResearchAi } from "./research";

export const BRAINSTORM_FAIL_MESSAGE = "ブレストに失敗しました。時間をおいて再度お試しください。";

export const BRAINSTORM_SYSTEM_PROMPT = [
  "あなたはアイデアを広げるブレスト相手です。ウェブ検索はしません。",
  "与えられたタイトル・本文・コメントだけを読み、日本語で具体的な展開を書いてください。",
  "見出しは「切り口」「別案」「次の問い」「関連する方向」の4つ。前置きや締めの文は不要です。",
].join("");

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
): Promise<string> {
  const result = await runWorkersAi(ai, model, {
    messages: [
      { role: "system", content: BRAINSTORM_SYSTEM_PROMPT },
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

export type BrainstormIdeaResult =
  | { ok: true; brainstorm: IdeaBrainstorm }
  | { ok: false; status: 400 | 404 | 409 | 502; error: string };

export async function brainstormIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  preset?: string | null;
  model?: string | null;
}): Promise<BrainstormIdeaResult> {
  const resolved = resolveResearchModel({
    preset: opts.preset,
    model: opts.model,
    defaultPreset: DEFAULT_BRAINSTORM_PRESET,
  });
  if (!resolved.ok) {
    return { ok: false, status: 400, error: resolved.error };
  }

  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return { ok: false, status: 404, error: "見つかりません" };
  }
  if (!canRunIdeaAi(asStage(idea.stage))) {
    return { ok: false, status: 409, error: BRAINSTORM_ARCHIVE_ERROR };
  }

  const comments = await listCommentsForIdea(opts.db, idea.id);
  const ideaText = formatBrainstormUserText({
    title: idea.title,
    body: idea.body,
    comments,
  });
  let notes: string;
  try {
    notes = await generateBrainstormNotes(opts.ai, resolved.model, ideaText);
  } catch {
    return { ok: false, status: 502, error: BRAINSTORM_FAIL_MESSAGE };
  }

  const saved = await insertIdeaBrainstorm(opts.db, idea.id, {
    notes,
    model: resolved.model,
  });
  return { ok: true, brainstorm: saved };
}
