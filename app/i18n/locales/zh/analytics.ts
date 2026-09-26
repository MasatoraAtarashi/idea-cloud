import type { Dictionary } from "../../dictionary";

export const analytics: Dictionary["analytics"] = {
  metaTitle: "分析 — 创意云",
  title: "分析",

  statTotal: "想法总数",
  statAverageAging: "平均酝酿天数",
  statAiScored: "已 AI 评估",
  statTried: "试过",

  stageDistribution: "阶段分布",
  stageChartEntry: (stage: string, count: number) => `${stage} ${count}`,
  stageChartLabel: (entries: string[]) => entries.join("、"),

  perDay: "每天的灵感",
  dayCount: (day: string, count: number) => `${day}：${count} 条`,

  topTags: "常用标签",
  noTags: "还没有标签",
};
