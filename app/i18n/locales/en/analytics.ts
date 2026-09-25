import type { Dictionary } from "../../dictionary";

export const analytics: Dictionary["analytics"] = {
  metaTitle: "Analytics — Idea Cloud",
  title: "Analytics",

  statTotal: "Ideas",
  statAverageAging: "Avg. aging",
  statAiScored: "AI scored",
  statTried: "Tried",

  stageDistribution: "Stages",
  stageChartEntry: (stage: string, count: number) => `${stage} ${count}`,
  stageChartLabel: (entries: string[]) => entries.join(", "),

  perDay: "Captured per day",
  dayCount: (day: string, count: number) => `${day}: ${count}`,

  topTags: "Frequent tags",
  noTags: "No tags yet",
};
