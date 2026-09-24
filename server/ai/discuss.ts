import { STAGE_LABEL } from "../../app/data/mock";
import { DISCUSS_ARCHIVE_ERROR, canRunIdeaAi } from "../../app/lib/idea-ai";
import { aiScoreMeaning, softenEvaluationText } from "../../app/lib/evaluation-notes";
import {
  DEFAULT_DISCUSS_PRESET,
  extractAiText,
  isAiTruncated,
  resolveResearchModel,
  type ResearchModelId,
} from "../../app/lib/research-models";
import { asStage, getIdeaRow, parseTags, type Idea } from "../../db/ideas";
import { listCommentsForIdea, type IdeaComment } from "../../db/comments";
import {
  DISCUSS_BODY_MAX,
  insertIdeaChatMessage,
  listChatMessagesForIdea,
  type IdeaChatMessage,
  type IdeaChatRole,
} from "../../db/discussions";
import type { Db } from "../../db/client";
import { errorClass, logDiag } from "../diag";
import { resolveAiRun, type ResearchAi } from "./research";

export const DISCUSS_FAIL_MESSAGE = "相談の返信に失敗しました。時間をおいて再度お試しください。";

export const DISCUSS_LEGAL_DISCLAIMER =
  "※これは一般的な思考の補助です。法律の助言ではありません。判断が必要なら専門家に確認してください。";

export const DISCUSS_SYSTEM_PROMPT = [
  "あなたは一つのアイデアについて話す相談相手です。ウェブ検索はしません。",
  "渡されたアイデアのタイトル・本文・段階・タグ・評価メモ・コメントと、これまでの会話だけを読んで、日本語で具体的に答えてください。",
  "出典やURLを作らないでください。知らないことは知らないと書いてください。",
  "法律・規制・契約・著作権の質問には、一般的な思考の補助として答え、断定的な違法や合法の結論は出さないでください。",
  "その種の質問では、法律の助言ではないことを短く添えてください。",
  "答えは日本語で600字以内にまとめ、途中で切れないよう必ず最後まで書き切ってください。",
].join("");

export const DISCUSS_TRUNCATED_NOTE =
  "（ここで返信の上限に達しました。「続き」と送ると続きを書きます。）";

const DISCUSS_MAX_TOKENS = 2048;

const LEGAL_TOPIC = /法的|法律|違法|コンプライアンス|規約|著作権|個人情報|訴訟/;
const COMMENT_LIMIT = 5;
const COMMENT_MAX = 240;
const BODY_MAX = 1200;
const EVAL_MAX = 600;
const HISTORY_LIMIT = 12;
const HISTORY_MAX = 800;
const REPLY_MAX = 4000;

export function ensureLegalDisclaimer(userText: string, reply: string): string {
  const topic = `${userText}\n${reply}`;
  if (!LEGAL_TOPIC.test(topic)) return reply.trim();
  if (reply.includes("法律の助言ではありません")) return reply.trim();
  return `${reply.trim()}\n\n${DISCUSS_LEGAL_DISCLAIMER}`;
}

export function formatDiscussContext(opts: {
  idea: Pick<Idea, "title" | "body" | "stage" | "tags" | "aiScore" | "aiEvaluation">;
  comments: Pick<IdeaComment, "body">[];
}): string {
  const stage = STAGE_LABEL[asStage(opts.idea.stage)];
  const tags = parseTags(opts.idea.tags);
  const parts = [
    `タイトル: ${opts.idea.title.trim() || "無題"}`,
    `段階: ${stage}`,
    `タグ: ${tags.length > 0 ? tags.join("、") : "なし"}`,
    `本文:\n${truncate(opts.idea.body.trim() || "（なし）", BODY_MAX)}`,
  ];
  const evaluation = formatEvaluationContext(opts.idea.aiScore, opts.idea.aiEvaluation);
  if (evaluation) parts.push(evaluation);
  const comments = opts.comments.slice(-COMMENT_LIMIT);
  if (comments.length > 0) {
    const lines = comments.map((comment) => `- ${truncate(comment.body.trim(), COMMENT_MAX)}`);
    parts.push(`最近のコメント:\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
}

export async function generateDiscussReply(
  ai: ResearchAi,
  model: ResearchModelId,
  opts: {
    context: string;
    history: { role: IdeaChatRole; body: string }[];
    userText: string;
  },
): Promise<string> {
  const history = opts.history.slice(-HISTORY_LIMIT).map((message) => ({
    role: message.role,
    content: truncate(message.body.trim(), HISTORY_MAX),
  }));
  const run = resolveAiRun(ai);
  const result = await run(model, {
    messages: [
      { role: "system", content: `${DISCUSS_SYSTEM_PROMPT}\n\n${opts.context}` },
      ...history,
      { role: "user", content: opts.userText },
    ],
    max_tokens: DISCUSS_MAX_TOKENS,
  });
  const text = extractAiText(result).trim();
  if (!text) {
    throw new Error("empty discuss result");
  }
  const withNote = isAiTruncated(result, DISCUSS_MAX_TOKENS)
    ? `${text}\n\n${DISCUSS_TRUNCATED_NOTE}`
    : text;
  return truncate(ensureLegalDisclaimer(opts.userText, withNote), REPLY_MAX);
}

export type DiscussIdeaResult =
  | { ok: true; messages: IdeaChatMessage[] }
  | { ok: false; status: 400 | 404 | 409 | 502; error: string };

export async function discussIdea(opts: {
  db: Db;
  ai: ResearchAi;
  ideaId: number;
  body: string;
  preset?: string | null;
  model?: string | null;
}): Promise<DiscussIdeaResult> {
  const userText = opts.body.trim();
  if (!userText) {
    return { ok: false, status: 400, error: "入力してください" };
  }
  if (userText.length > DISCUSS_BODY_MAX) {
    return { ok: false, status: 400, error: "長すぎます" };
  }

  const resolved = resolveResearchModel({
    preset: opts.preset,
    model: opts.model,
    defaultPreset: DEFAULT_DISCUSS_PRESET,
  });
  if (!resolved.ok) {
    return { ok: false, status: 400, error: resolved.error };
  }

  const idea = await getIdeaRow(opts.db, opts.ideaId);
  if (!idea) {
    return { ok: false, status: 404, error: "見つかりません" };
  }
  if (!canRunIdeaAi(asStage(idea.stage))) {
    logDiag("info", "ai discuss", {
      step: "discuss",
      outcome: "skipped",
      reason: "archived",
      ideaId: idea.id,
      status: 409,
    });
    return { ok: false, status: 409, error: DISCUSS_ARCHIVE_ERROR };
  }

  const prior = await listChatMessagesForIdea(opts.db, idea.id);
  const comments = await listCommentsForIdea(opts.db, idea.id);
  const context = formatDiscussContext({ idea, comments });
  logDiag("info", "ai discuss", {
    step: "discuss",
    outcome: "start",
    ideaId: idea.id,
    model: resolved.model,
    count: prior.length,
  });

  const userMessage = await insertIdeaChatMessage(opts.db, idea.id, {
    role: "user",
    body: userText,
  });

  let reply: string;
  try {
    reply = await generateDiscussReply(opts.ai, resolved.model, {
      context,
      history: prior.flatMap((message) =>
        message.role === "user" || message.role === "assistant"
          ? [{ role: message.role, body: message.body }]
          : [],
      ),
      userText,
    });
  } catch (error) {
    logDiag("warn", "workers ai call", {
      step: "discuss",
      provider: "workers_ai",
      outcome: "fail",
      ideaId: idea.id,
      model: resolved.model,
      error: errorClass(error),
    });
    return { ok: false, status: 502, error: DISCUSS_FAIL_MESSAGE };
  }

  const assistant = await insertIdeaChatMessage(opts.db, idea.id, {
    role: "assistant",
    body: reply,
    model: resolved.model,
  });
  logDiag("info", "ai discuss", {
    step: "discuss",
    outcome: "success",
    ideaId: idea.id,
    provider: "workers_ai",
    model: resolved.model,
  });
  return { ok: true, messages: [userMessage, assistant] };
}

function formatEvaluationContext(score: number | null, notes: string | null): string {
  const softened = notes ? stripScoreLine(softenEvaluationText(notes)) : "";
  if (!score && !softened) return "";
  const lines = ["AI評価（参考。数値の内訳は省いてあります）:"];
  if (score) {
    const meaning = aiScoreMeaning(score);
    lines.push(meaning ? `推し度: ${score}（${meaning}）` : `推し度: ${score}`);
  }
  if (softened) lines.push(truncate(softened, EVAL_MAX));
  return lines.join("\n");
}

function stripScoreLine(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^スコア\s*[:：]\s*[1-5]\s*$/.test(line.trim()))
    .join("\n")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
