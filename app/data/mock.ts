export const STAGES = ["spark", "aging", "ripe", "selected", "archived"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  spark: "着想",
  aging: "熟成中",
  ripe: "熟した",
  selected: "採用",
  archived: "アーカイブ",
};

export const STAGE_HINT: Record<Stage, string> = {
  spark: "捕まえたばかり。まだ触らない。",
  aging: "寝かせている。忘れてよい。",
  ripe: "見返す頃合い。進めるか、捨てる。",
  selected: "リサーチ / プロトタイプの対象。",
  archived: "記録として残す。表には出さない。",
};

export interface MockIdea {
  id: string;
  title: string;
  body: string;
  stage: Stage;
  tags: string[];
  author: string;
  team: string;
  createdAt: string;
  agedDays: number;
  relatedIds: string[];
}

/** No seed ideas. The product stays empty until someone captures. */
export const IDEAS: MockIdea[] = [];

export function getIdea(id: string | undefined): MockIdea | undefined {
  if (!id) return undefined;
  return IDEAS.find((idea) => idea.id === id);
}

export function ideasByStage(stage: Stage): MockIdea[] {
  return IDEAS.filter((idea) => idea.stage === stage);
}
