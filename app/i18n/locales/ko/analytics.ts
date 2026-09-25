import type { Dictionary } from "../../dictionary";

export const analytics: Dictionary["analytics"] = {
  metaTitle: "애널리틱스 — 아이디어 클라우드",
  title: "애널리틱스",

  statTotal: "아이디어 수",
  statAverageAging: "평균 숙성 일수",
  statAiScored: "AI 평가 완료",
  statTried: "시도함",

  stageDistribution: "단계 분포",
  stageChartEntry: (stage: string, count: number) => `${stage} ${count}`,
  stageChartLabel: (entries: string[]) => entries.join(", "),

  perDay: "하루당 착상",
  dayCount: (day: string, count: number) => `${day}: ${count}건`,

  topTags: "자주 쓰는 태그",
  noTags: "아직 태그가 없습니다",
};
