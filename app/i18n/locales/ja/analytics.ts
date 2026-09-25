export const analytics = {
  metaTitle: "アナリティクス — アイデアクラウド",
  title: "アナリティクス",

  statTotal: "アイデア総数",
  statAverageAging: "平均熟成日数",
  statAiScored: "AI評価済",
  statTried: "試した",

  stageDistribution: "段階の分布",
  /** Screen-reader text for the stacked bar: one 「<段階> <件数>」 per stage. */
  stageChartEntry: (stage: string, count: number) => `${stage} ${count}`,
  stageChartLabel: (entries: string[]) => entries.join("、"),

  perDay: "1日あたりの着想",
  /** Tooltip on one bar. */
  dayCount: (day: string, count: number) => `${day}: ${count}件`,

  topTags: "よく出るタグ",
  noTags: "まだタグがありません",
};
