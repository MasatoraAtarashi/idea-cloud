import { describe, expect, it } from "vitest";
import {
  createdBarTone,
  createdDayLabel,
  createdPerDay,
  summarizeIdeaAnalytics,
} from "../app/lib/analytics";
import type { MockIdea } from "../app/data/mock";

function idea(partial: Partial<MockIdea> & Pick<MockIdea, "id" | "createdAt">): MockIdea {
  return {
    title: partial.id,
    body: "",
    stage: "spark",
    tags: [],
    author: "",
    team: "",
    updatedAt: partial.createdAt,
    agedDays: 1,
    relatedIds: [],
    commentCount: 0,
    ...partial,
  };
}

describe("analytics created-per-day", () => {
  it("buckets last 7 and 30 UTC days and counts by stage", () => {
    const now = Date.parse("2026-09-21T12:00:00Z");
    const ideas = [
      idea({ id: "1", createdAt: "2026-09-21T01:00:00Z", stage: "spark" }),
      idea({ id: "2", createdAt: "2026-09-21T08:00:00Z", stage: "aging" }),
      idea({ id: "3", createdAt: "2026-09-15T00:00:00Z", stage: "ripe" }),
      idea({ id: "4", createdAt: "2026-08-01T00:00:00Z", stage: "spark" }),
    ];
    const week = createdPerDay(ideas, 7, now);
    expect(week).toHaveLength(7);
    expect(week[0]?.day).toBe("2026-09-15");
    expect(week[6]?.day).toBe("2026-09-21");
    expect(week[0]?.count).toBe(1);
    expect(week[6]?.count).toBe(2);
    const summary = summarizeIdeaAnalytics(ideas, now);
    expect(summary.createdLast7).toBe(3);
    expect(summary.createdLast30).toBe(3);
    expect(summary.byStage.find((row) => row.stage === "spark")?.count).toBe(2);
    expect(summary.createdByDay30).toHaveLength(30);
  });

  it("labels bars and tones them", () => {
    expect(createdDayLabel("2026-09-21", false, 7)).toBe("MON");
    expect(createdDayLabel("2026-09-21", true, 7)).toBe("TODAY");
    expect(createdDayLabel("2026-09-21", false, 30)).toBe("09-21");
    expect(createdBarTone(0, 6, false)).toBe("empty");
    expect(createdBarTone(1, 6, false)).toBe("low");
    expect(createdBarTone(4, 6, false)).toBe("normal");
    expect(createdBarTone(0, 6, true)).toBe("today");
  });

  it("counts tried ideas like the list tab", () => {
    const ideas = [
      idea({ id: "1", createdAt: "2026-09-21T01:00:00Z", stage: "selected" }),
      idea({ id: "2", createdAt: "2026-09-21T01:00:00Z", stage: "spark" }),
    ];
    expect(summarizeIdeaAnalytics(ideas).tried).toBe(1);
  });
});
