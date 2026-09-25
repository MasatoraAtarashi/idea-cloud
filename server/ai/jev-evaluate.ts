import { JEV_MODEL } from "../../app/lib/jev";
import { SCORE_MAX, SCORE_MIN } from "../../app/lib/scores";
import { dictionary, type Dictionary } from "../../app/i18n/dictionary";
import { DEFAULT_LOCALE, type Locale } from "../../app/i18n/locale";
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

/**
 * The Japanese level names are the model contract: they are sent to TypeSafe as
 * `criteria` and come back in the answer `legend`, so they must never be
 * translated. `t.ai.jev.level` maps each one onto display copy instead.
 */
const JEV_NOVELTY_CRITERIA = ["既存の延長", "一部新しい", "明確に新しい", "大きく新しい"] as const;
const JEV_IMPACT_CRITERIA = ["小さい", "ある", "大きい", "非常に大きい"] as const;
const JEV_FEASIBILITY_CRITERIA = ["かなり困難", "難しいが可能", "現実的", "容易"] as const;
const JEV_CLARITY_CRITERIA = ["曖昧", "方向は見える", "具体的", "すぐ動ける"] as const;
const JEV_RISK_CRITERIA = ["低い", "中程度", "高い", "致命的"] as const;

/** Every legend value Jev can hand back, as the key of the display mapping. */
export const JEV_SCORE_LEVELS = [
  ...JEV_NOVELTY_CRITERIA,
  ...JEV_IMPACT_CRITERIA,
  ...JEV_FEASIBILITY_CRITERIA,
  ...JEV_CLARITY_CRITERIA,
  ...JEV_RISK_CRITERIA,
] as const;

export type JevScoreLevel = (typeof JEV_SCORE_LEVELS)[number];

export type JevPursueLevel = "high" | "normal" | "low" | "unknown";

export const EVALUATE_QUESTIONS = {
  novelty: score("`idea` の新規性は？", [...JEV_NOVELTY_CRITERIA]),
  impact: score("`idea` がもたらす価値・インパクトは？", [...JEV_IMPACT_CRITERIA]),
  feasibility: score("`idea` を近い将来に試せる見込みは？", [...JEV_FEASIBILITY_CRITERIA]),
  clarity: score("`idea` の具体性・明確さは？", [...JEV_CLARITY_CRITERIA]),
  risk: score("`idea` のリスクの大きさは？", [...JEV_RISK_CRITERIA]),
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

/**
 * Display text for a score answer. The legend value stays the Japanese one the
 * API returned; only what we show the reader is localised.
 */
export function scoreLevelLabel(answer: ScoreAnswer, locale?: Locale): string {
  const rounded = String(Math.round(answer.score));
  const value = answer.legend[rounded];
  if (!value) return "";
  const levels = jevCopy(locale).level;
  return levels[value as JevScoreLevel] ?? value;
}

/**
 * The four headings and the trailing `スコア: N` line are storage keys — see
 * `app/lib/evaluation-notes.ts` — so they stay Japanese whatever the reader's
 * language. Only the text under them follows `locale`.
 */
export function formatJevEvaluationNotes(
  axes: JevEvaluateAxes,
  aiScore: number,
  locale?: Locale,
): string {
  const jev = jevCopy(locale);
  const nextLabel =
    jev.next[axes.next.choice as EvaluateNextId] ??
    EVALUATE_NEXT_CRITERIA[axes.next.choice as EvaluateNextId] ??
    axes.next.choice;
  return [
    "強み",
    `- ${jev.axis.impact}: ${formatScoreLine(axes.impact, locale)}`,
    `- ${jev.axis.feasibility}: ${formatScoreLine(axes.feasibility, locale)}`,
    `- ${jev.axis.clarity}: ${formatScoreLine(axes.clarity, locale)}`,
    "",
    "リスク",
    `- ${jev.axis.risk}: ${formatScoreLine(axes.risk, locale)}`,
    `- ${jev.axis.pursue}: ${formatPursue(axes.pursue.noul, locale)}`,
    "",
    "新規性",
    `- ${formatScoreLine(axes.novelty, locale)}`,
    "",
    "次の一手",
    `- ${nextLabel}`,
    "",
    `スコア: ${aiScore}`,
  ].join("\n");
}

function jevCopy(locale: Locale | undefined): Dictionary["ai"]["jev"] {
  return dictionary(locale ?? DEFAULT_LOCALE).ai.jev;
}

function formatScoreLine(answer: ScoreAnswer, locale?: Locale): string {
  return scoreLevelLabel(answer, locale) || jevCopy(locale).noJudgement;
}

function pursueLevel(noul: number): JevPursueLevel {
  if (!Number.isFinite(noul)) return "unknown";
  if (noul >= 0.67) return "high";
  if (noul >= 0.34) return "normal";
  return "low";
}

function formatPursue(noul: number, locale?: Locale): string {
  return jevCopy(locale).pursue[pursueLevel(noul)];
}

export function mapJevEvaluation(
  axes: JevEvaluateAxes,
  model = JEV_MODEL,
  locale?: Locale,
): JevEvaluateMapped {
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
    notes: formatJevEvaluationNotes(axes, scoreValue, locale),
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
  locale?: Locale,
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
  return mapJevEvaluation(axes, result.model || JEV_MODEL, locale);
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
