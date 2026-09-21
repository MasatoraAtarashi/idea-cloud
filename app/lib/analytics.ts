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

export type CreatedDayCount = {
  day: string;
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
  createdLast7: number;
  createdLast30: number;
  createdByDay7: CreatedDayCount[];
  createdByDay30: CreatedDayCount[];
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

function utcDayKey(ms: number): string {
  const date = new Date(ms);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createdAtMs(value: string): number | null {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export function createdPerDay(
  ideas: Pick<MockIdea, "createdAt">[],
  days: number,
  now = Date.now(),
): CreatedDayCount[] {
  const span = Math.max(1, Math.floor(days));
  const today = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );
  const buckets: CreatedDayCount[] = [];
  const index = new Map<string, number>();
  for (let i = span - 1; i >= 0; i--) {
    const key = utcDayKey(today - i * 86_400_000);
    index.set(key, buckets.length);
    buckets.push({ day: key, count: 0 });
  }
  for (const idea of ideas) {
    const ms = createdAtMs(idea.createdAt);
    if (ms == null) continue;
    const slot = index.get(utcDayKey(ms));
    if (slot == null) continue;
    buckets[slot]!.count += 1;
  }
  return buckets;
}

export function countCreatedInDays(
  ideas: Pick<MockIdea, "createdAt">[],
  days: number,
  now = Date.now(),
): number {
  return createdPerDay(ideas, days, now).reduce((sum, row) => sum + row.count, 0);
}

export function summarizeIdeaAnalytics(ideas: MockIdea[], now = Date.now()): IdeaAnalytics {
  const dayValues = ideas.map((idea) => idea.agedDays);
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
  const createdByDay7 = createdPerDay(ideas, 7, now);
  const createdByDay30 = createdPerDay(ideas, 30, now);

  return {
    total: ideas.length,
    byStage: STAGES.map((stage) => ({
      stage,
      count: ideas.filter((idea) => idea.stage === stage).length,
    })),
    averageAgedDays: average(dayValues),
    medianAgedDays: median(dayValues),
    withHumanScore: ideas.filter((idea) => idea.humanScore != null).length,
    withAiScore: ideas.filter((idea) => idea.aiScore != null).length,
    withReflection: ideas.filter((idea) => hasReflection(idea)).length,
    topTags,
    createdLast7: createdByDay7.reduce((sum, row) => sum + row.count, 0),
    createdLast30: createdByDay30.reduce((sum, row) => sum + row.count, 0),
    createdByDay7,
    createdByDay30,
  };
}
