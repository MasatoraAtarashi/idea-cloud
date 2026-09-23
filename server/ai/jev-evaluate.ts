import { JEV_MODEL } from "../../app/lib/jev";
import { SCORE_MAX, SCORE_MIN } from "../../app/lib/scores";
import {
  choice,
  noul,
  runSystemOne,
  score,
  type ChoiceAnswer,
  type NoulAnswer,
  type ScoreAnswer,
} from "./typesafe";

const SCORE_LEVELS_FOUR = 4;
const SCORE_AXIS_MAX = SCORE_LEVELS_FOUR - 1;

export const EVALUATE_NEXT_CRITERIA = {
  research: "リサーチで仮説を検証する",
  age: "寝かせて熟成させる",
  try: "小さく試す",
  select: "採用へ進める",
  archive: "見送る",
} as const;

export type EvaluateNextId = keyof typeof EVALUATE_NEXT_CRITERIA;

export const EVALUATE_QUESTIONS = {
  novelty: score("`idea` の新規性は？", [
    "既存の延長",
    "一部新しい",
    "明確に新しい",
    "大きく新しい",
  ]),
  impact: score("`idea` がもたらす価値・インパクトは？", [
    "小さい",
    "ある",
    "大きい",
    "非常に大きい",
  ]),
  feasibility: score("`idea` を近い将来に試せる見込みは？", [
    "かなり困難",
    "難しいが可能",
    "現実的",
    "容易",
  ]),
  clarity: score("`idea` の具体性・明確さは？", ["曖昧", "方向は見える", "具体的", "すぐ動ける"]),
  risk: score("`idea` のリスクの大きさは？", ["低い", "中程度", "高い", "致命的"]),
  pursue: noul("このアイデアに時間を投じる価値があるか？"),
  next: choice("`idea` の次の一手は？", EVALUATE_NEXT_CRITERIA),
};

export const EVALUATE_WEIGHTS = {
  novelty: 0.25,
  impact: 0.25,
  feasibility: 0.2,
  clarity: 0.15,
  risk: 0.15,
} as const;

export type JevEvaluateAxes = {
  novelty: ScoreAnswer;
  impact: ScoreAnswer;
  feasibility: ScoreAnswer;
  clarity: ScoreAnswer;
  risk: ScoreAnswer;
  pursue: NoulAnswer;
  next: ChoiceAnswer;
};

export type JevEvaluateMapped = {
  score: number;
  notes: string;
  model: string;
  composite: number;
};

export function compositeJevScore(axes: {
  novelty: number;
  impact: number;
  feasibility: number;
  clarity: number;
  risk: number;
}): number {
  return (
    EVALUATE_WEIGHTS.novelty * axes.novelty +
    EVALUATE_WEIGHTS.impact * axes.impact +
    EVALUATE_WEIGHTS.feasibility * axes.feasibility +
    EVALUATE_WEIGHTS.clarity * axes.clarity +
    EVALUATE_WEIGHTS.risk * (SCORE_AXIS_MAX - axes.risk)
  );
}

/** Map a 0–3 Jev composite onto the product's 1–5 AI score. */
export function compositeToAiScore(composite: number): number {
  if (!Number.isFinite(composite)) return SCORE_MIN;
  const scaled = 1 + (composite * (SCORE_MAX - SCORE_MIN)) / SCORE_AXIS_MAX;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(scaled)));
}

export function scoreLevelLabel(answer: ScoreAnswer): string {
  const rounded = String(Math.round(answer.score));
  return answer.legend[rounded] ?? "";
}

export function formatJevEvaluationNotes(axes: JevEvaluateAxes, aiScore: number): string {
  const nextLabel = EVALUATE_NEXT_CRITERIA[axes.next.choice as EvaluateNextId] ?? axes.next.choice;
  return [
    "強み",
    `- 価値: ${formatScoreLine(axes.impact)}`,
    `- 実現性: ${formatScoreLine(axes.feasibility)}`,
    `- 明確さ: ${formatScoreLine(axes.clarity)}`,
    "",
    "リスク",
    `- 大きさ: ${formatScoreLine(axes.risk)}`,
    `- 進める価値: ${formatPursue(axes.pursue.noul)}`,
    "",
    "新規性",
    `- ${formatScoreLine(axes.novelty)}`,
    "",
    "次の一手",
    `- ${nextLabel}`,
    "",
    `スコア: ${aiScore}`,
  ].join("\n");
}

function formatScoreLine(answer: ScoreAnswer): string {
  return scoreLevelLabel(answer) || "判定なし";
}

function formatPursue(noul: number): string {
  if (!Number.isFinite(noul)) return "不明";
  if (noul >= 0.67) return "高め";
  if (noul >= 0.34) return "ふつう";
  return "低め";
}

export function mapJevEvaluation(axes: JevEvaluateAxes, model = JEV_MODEL): JevEvaluateMapped {
  const composite = compositeJevScore({
    novelty: axes.novelty.score,
    impact: axes.impact.score,
    feasibility: axes.feasibility.score,
    clarity: axes.clarity.score,
    risk: axes.risk.score,
  });
  const scoreValue = compositeToAiScore(composite);
  return {
    score: scoreValue,
    notes: formatJevEvaluationNotes(axes, scoreValue),
    model,
    composite,
  };
}

export function parseJevEvaluationAnswers(
  answers: Record<string, { type?: string }>,
): JevEvaluateAxes {
  return {
    novelty: requireScore(answers, "novelty"),
    impact: requireScore(answers, "impact"),
    feasibility: requireScore(answers, "feasibility"),
    clarity: requireScore(answers, "clarity"),
    risk: requireScore(answers, "risk"),
    pursue: requireNoul(answers, "pursue"),
    next: requireChoice(answers, "next"),
  };
}

export async function evaluateIdeaWithJev(
  apiKey: string | undefined,
  ideaText: string,
): Promise<JevEvaluateMapped> {
  const result = await runSystemOne(
    apiKey,
    {
      state: { idea: ideaText },
      model: JEV_MODEL,
      questions: EVALUATE_QUESTIONS,
    },
    "evaluate",
  );
  const axes = parseJevEvaluationAnswers(result.answers);
  return mapJevEvaluation(axes, result.model || JEV_MODEL);
}

function requireScore(answers: Record<string, { type?: string }>, key: string): ScoreAnswer {
  const answer = answers[key];
  if (!answer || answer.type !== "score") {
    throw new Error(`TypeSafe ${key} score is missing`);
  }
  return answer as ScoreAnswer;
}

function requireNoul(answers: Record<string, { type?: string }>, key: string): NoulAnswer {
  const answer = answers[key];
  if (!answer || answer.type !== "noul") {
    throw new Error(`TypeSafe ${key} noul is missing`);
  }
  return answer as NoulAnswer;
}

function requireChoice(answers: Record<string, { type?: string }>, key: string): ChoiceAnswer {
  const answer = answers[key];
  if (!answer || answer.type !== "choice") {
    throw new Error(`TypeSafe ${key} choice is missing`);
  }
  return answer as ChoiceAnswer;
}
