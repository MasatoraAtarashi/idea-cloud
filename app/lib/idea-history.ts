import type { MockIdea } from "../data/mock";
import { evaluationModelLabel, presetFromModel, RESEARCH_PRESET_LABEL } from "./research-models";
import {
  hasResearchSourceLinks,
  researchSourcesForDisplay,
  WEB_SEARCH_UNAVAILABLE_LABEL,
  type ResearchSources,
} from "./research-sources";

export const IDEA_HISTORY_KIND_LABEL = {
  research: "リサーチ",
  evaluate: "AI評価",
  brainstorm: "ブレスト",
} as const;

export type IdeaHistoryKind = keyof typeof IDEA_HISTORY_KIND_LABEL;

export type IdeaHistoryBrainstorm = {
  id: string;
  notes: string;
  model: string;
  createdAt: string;
};

export type IdeaHistoryItem = {
  id: string;
  kind: IdeaHistoryKind;
  label: string;
  at: string | null;
  model: string | null;
  modelLabel: string;
  body: string;
  summary: string;
  score?: number | null;
  latestOnly: boolean;
  anchor?: "brainstorm" | "evaluate";
  sources?: ResearchSources | null;
};

export function historyExcerpt(body: string, max = 72): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max)}…`;
}

function historyTime(value: string | null | undefined): number {
  if (!value) return 0;
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function researchModelLabel(model: string | null | undefined): string {
  const preset = presetFromModel(model);
  if (preset) return RESEARCH_PRESET_LABEL[preset];
  return model?.trim() ?? "";
}

const KIND_TIE_RANK: Record<IdeaHistoryKind, number> = {
  brainstorm: 0,
  evaluate: 1,
  research: 2,
};

export function buildIdeaHistory(
  idea: Pick<
    MockIdea,
    | "researchNotes"
    | "researchModel"
    | "researchedAt"
    | "researchSources"
    | "brainstormNotes"
    | "brainstormModel"
    | "brainstormedAt"
    | "aiScore"
    | "aiEvaluation"
    | "aiEvaluatedAt"
    | "aiEvaluationModel"
  >,
  brainstorms: IdeaHistoryBrainstorm[] = [],
): IdeaHistoryItem[] {
  const items: IdeaHistoryItem[] = [];

  if (idea.researchNotes?.trim() || idea.researchedAt) {
    const body = idea.researchNotes?.trim() ?? "";
    const sources = researchSourcesForDisplay(idea);
    const sourceHint = hasResearchSourceLinks(sources)
      ? `先行事例${sources.results.length}件`
      : sources
        ? WEB_SEARCH_UNAVAILABLE_LABEL
        : "";
    items.push({
      id: "research-latest",
      kind: "research",
      label: IDEA_HISTORY_KIND_LABEL.research,
      at: idea.researchedAt ?? null,
      model: idea.researchModel ?? null,
      modelLabel: researchModelLabel(idea.researchModel),
      body,
      summary: [historyExcerpt(body) || "調査メモ", sourceHint].filter(Boolean).join(" · "),
      latestOnly: true,
      sources,
    });
  }

  if (idea.aiEvaluation?.trim() || idea.aiEvaluatedAt || idea.aiScore) {
    const body = idea.aiEvaluation?.trim() ?? "";
    items.push({
      id: "evaluate-latest",
      kind: "evaluate",
      label: IDEA_HISTORY_KIND_LABEL.evaluate,
      at: idea.aiEvaluatedAt ?? null,
      model: idea.aiEvaluationModel ?? null,
      modelLabel: evaluationModelLabel(idea.aiEvaluationModel),
      body,
      summary: historyExcerpt(body) || (idea.aiScore ? `AI ${idea.aiScore}` : "評価"),
      score: idea.aiScore ?? null,
      latestOnly: true,
      anchor: "evaluate",
    });
  }

  if (brainstorms.length > 0) {
    const sorted = [...brainstorms].sort((a, b) => {
      const delta = historyTime(b.createdAt) - historyTime(a.createdAt);
      if (delta !== 0) return delta;
      return Number(b.id) - Number(a.id);
    });
    sorted.forEach((row, index) => {
      const body = row.notes.trim();
      items.push({
        id: `brainstorm-${row.id}`,
        kind: "brainstorm",
        label: IDEA_HISTORY_KIND_LABEL.brainstorm,
        at: row.createdAt,
        model: row.model,
        modelLabel: researchModelLabel(row.model),
        body,
        summary: historyExcerpt(body) || "展開",
        latestOnly: false,
        anchor: index === 0 ? "brainstorm" : undefined,
      });
    });
  } else if (idea.brainstormNotes?.trim() || idea.brainstormedAt) {
    const body = idea.brainstormNotes?.trim() ?? "";
    items.push({
      id: "brainstorm-latest",
      kind: "brainstorm",
      label: IDEA_HISTORY_KIND_LABEL.brainstorm,
      at: idea.brainstormedAt ?? null,
      model: idea.brainstormModel ?? null,
      modelLabel: researchModelLabel(idea.brainstormModel),
      body,
      summary: historyExcerpt(body) || "展開",
      latestOnly: false,
      anchor: "brainstorm",
    });
  }

  items.sort((a, b) => {
    const delta = historyTime(b.at) - historyTime(a.at);
    if (delta !== 0) return delta;
    return KIND_TIE_RANK[a.kind] - KIND_TIE_RANK[b.kind];
  });

  return items;
}
