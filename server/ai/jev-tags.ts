import { JEV_MODEL } from "../../app/lib/jev";
import { choice, runSystemOne, type ChoiceAnswer } from "./typesafe";

/** Curated Japanese tags. Keys are stored as-is on `ideas.tags`. */
export const JEV_TAG_CRITERIA: Record<string, string> = {
  プロダクト: "製品・機能・サービスのアイデア",
  研究: "調査・論文・実験の着想",
  チーム: "チームの仕組み・合意・役割",
  個人: "個人の習慣・生活",
  ツール: "道具・アプリ・自動化",
  プロセス: "手順・運用・ワークフロー",
  実験: "小さく試す仮説",
  記録: "メモ・ログ・キャプチャ",
  AI: "機械学習・言語モデル・自動化判断",
  デザイン: "UI・体験・見た目",
  セキュリティ: "権限・秘密・安全",
  学習: "勉強・スキル",
  時間: "スケジュール・朝・通勤など時間帯",
  コミュニケーション: "会話・共有・通知",
  インフラ: "基盤・デプロイ・環境",
  ビジネス: "収益・市場・顧客",
};

export const JEV_TAG_VOCAB = Object.keys(JEV_TAG_CRITERIA);
export const JEV_TAG_THRESHOLD = 0.08;
export const JEV_TAG_MIN = 2;
export const JEV_TAG_MAX = 5;

export const JEV_TAG_QUESTION = choice(
  "`idea` に最も合うタグはどれか。候補から1つ選ぶ。",
  JEV_TAG_CRITERIA,
);

export function tagsFromChoiceProbabilities(
  probabilities: Record<string, number>,
  fallbackChoice?: string,
): string[] {
  const ranked = Object.entries(probabilities)
    .filter(
      ([tag, value]) => JEV_TAG_CRITERIA[tag] !== undefined && Number.isFinite(value) && value > 0,
    )
    .sort((a, b) => b[1] - a[1]);

  const above = ranked.filter(([, value]) => value >= JEV_TAG_THRESHOLD);
  const picked =
    above.length >= JEV_TAG_MIN
      ? above
      : ranked.length > 0
        ? ranked.slice(0, Math.max(JEV_TAG_MIN, 1))
        : fallbackChoice
          ? ([[fallbackChoice, 1]] as [string, number][])
          : [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const [tag] of picked) {
    if (!JEV_TAG_CRITERIA[tag] || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= JEV_TAG_MAX) break;
  }
  return out;
}

export function tagsFromChoiceAnswer(answer: ChoiceAnswer): string[] {
  const fromProbabilities = tagsFromChoiceProbabilities(answer.probabilities, answer.choice);
  if (fromProbabilities.length > 0) return fromProbabilities;
  return JEV_TAG_CRITERIA[answer.choice] ? [answer.choice] : [];
}

export async function suggestIdeaTagsWithJev(
  apiKey: string | undefined,
  text: string,
): Promise<string[]> {
  const ideaText = text.trim();
  if (!ideaText) return [];
  const result = await runSystemOne(
    apiKey,
    {
      state: { idea: ideaText },
      model: JEV_MODEL,
      questions: { tag: JEV_TAG_QUESTION },
    },
    "tags",
  );
  const answer = result.answers.tag;
  if (!answer || answer.type !== "choice") return [];
  return tagsFromChoiceAnswer(answer);
}
