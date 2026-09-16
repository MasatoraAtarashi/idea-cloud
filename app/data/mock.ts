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

export interface MockMember {
  name: string;
  email: string;
  role: "owner" | "member";
}

export const TEAM_NAME = "Atarashi Lab";

/** No fixture ideas until D1 persistence exists. */
export const MEMBERS: MockMember[] = [];
export const IDEAS: MockIdea[] = [];

export const EMPTY_IDEAS_TITLE = "まだアイデアがありません";
export const EMPTY_IDEAS_BODY = "キャプチャから着想を置いてください。";
export const EMPTY_MERGE_BODY = "融合するアイデアがまだありません。";
export const EMPTY_RESEARCH_BODY = "採用したアイデアがまだありません。";
export const EMPTY_TEAM_BODY = "メンバーはまだいません。";
export const EMPTY_DETAIL_TITLE = "見つかりません";
export const EMPTY_DETAIL_BODY = "このアイデアは一覧にありません。";

export function getIdea(id: string | undefined): MockIdea | undefined {
  if (!id) return undefined;
  return IDEAS.find((idea) => idea.id === id);
}

export function ideasByStage(stage: Stage): MockIdea[] {
  return IDEAS.filter((idea) => idea.stage === stage);
}
