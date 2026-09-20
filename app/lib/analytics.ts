import { STAGES, type MockIdea, type Stage } from "../data/mock";
import { hasReflection } from "./reflection";

export const ANALYTICS_TAG_TOP_N = 8;

export type StageCount = {
  stage: Stage;
  count: number;
};

export type TagCount = {
  tag: string;
  count: number;
};

export type IdeaAnalytics = {
  total: number;
  byStage: StageCount[];
  averageAgedDays: number | null;
  medianAgedDays: number | null;
  withHumanScore: number;
  withAiScore: number;
  withReflection: number;
  topTags: TagCount[];
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Number(value.toFixed(1));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(1));
}

export function summarizeIdeaAnalytics(ideas: MockIdea[]): IdeaAnalytics {
  const days = ideas.map((idea) => idea.agedDays);
  const tagCounts = new Map<string, number>();
  for (const idea of ideas) {
    for (const tag of idea.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"))
    .slice(0, ANALYTICS_TAG_TOP_N);

  return {
    total: ideas.length,
    byStage: STAGES.map((stage) => ({
      stage,
      count: ideas.filter((idea) => idea.stage === stage).length,
    })),
    averageAgedDays: average(days),
    medianAgedDays: median(days),
    withHumanScore: ideas.filter((idea) => idea.humanScore != null).length,
    withAiScore: ideas.filter((idea) => idea.aiScore != null).length,
    withReflection: ideas.filter((idea) => hasReflection(idea)).length,
    topTags,
  };
}
