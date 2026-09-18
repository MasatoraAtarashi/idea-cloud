export const STAGES = ["spark", "aging", "ripe", "selected", "archived"] as const;
export type Stage = (typeof STAGES)[number];

/** Advance along 着想 → 熟成中 → 熟した → 採用. Archive is separate. */
export const STAGE_FLOW = ["spark", "aging", "ripe", "selected"] as const;

export function nextStage(stage: Stage): Stage | null {
  const index = (STAGE_FLOW as readonly string[]).indexOf(stage);
  if (index < 0 || index >= STAGE_FLOW.length - 1) return null;
  return STAGE_FLOW[index + 1];
}

export const AGED_DAY_PRESETS = [7, 14, 30] as const;

export const STAGE_LABEL: Record<Stage, string> = {
  spark: "着想",
  aging: "熟成中",
  ripe: "熟した",
  selected: "採用",
  archived: "アーカイブ",
};

export const STAGE_HINT: Record<Stage, string> = {
  spark: "預けた直後",
  aging: "寝かせて観点が増える",
  ripe: "見直しの対象",
  selected: "実行へ進した",
  archived: "今は動かさない",
};

export const STAGE_PILL_CLASS: Record<Stage, string> = {
  spark: "stage-spark",
  aging: "stage-aging",
  ripe: "stage-ripe",
  selected: "stage-selected",
  archived: "stage-archived",
};

export const STAGE_COLUMN_CLASS: Record<Stage, string> = {
  spark: "stage-spark",
  aging: "stage-aging",
  ripe: "stage-ripe",
  selected: "stage-selected",
  archived: "stage-archived",
};

const TAG_PILL_CLASSES = [
  "bg-[#f8eef2] text-[#9f1239]",
  "bg-[#eef0fb] text-[#3730a3]",
  "bg-[#eaf6f3] text-[#0f766e]",
  "bg-[#fff3e8] text-[#c2410c]",
  "bg-[#f6eef8] text-[#86198f]",
] as const;

export function tagPillClass(tag: string): string {
  let hash = 0;
  for (const char of tag) hash = (hash + char.charCodeAt(0)) % TAG_PILL_CLASSES.length;
  return TAG_PILL_CLASSES[hash] ?? TAG_PILL_CLASSES[0];
}

export interface MockIdea {
  id: string;
  title: string;
  body: string;
  stage: Stage;
  tags: string[];
  author: string;
  team: string;
  createdAt: string;
  updatedAt: string;
  agedDays: number;
  relatedIds: string[];
  commentCount: number;
  researchNotes?: string | null;
  researchModel?: string | null;
  researchedAt?: string | null;
  brainstormNotes?: string | null;
  brainstormModel?: string | null;
  brainstormedAt?: string | null;
  humanScore?: number | null;
  humanScoreNote?: string | null;
  humanScoredAt?: string | null;
  aiScore?: number | null;
  aiEvaluation?: string | null;
  aiEvaluatedAt?: string | null;
  aiEvaluationModel?: string | null;
}

export interface MockMember {
  name: string;
  email: string;
  role: "owner" | "member";
}

/** Signed-in session placeholder. Do not invent teammate names. */
export const SESSION_USER = {
  id: "mock-user",
  label: "ログイン中",
  role: "owner" as const,
};

export type CommentAuthor = {
  id: string;
  name: string;
};

/** Mock auth: Access email when the API has one, else the session placeholder. */
export function resolveCommentAuthor(email?: string | null): CommentAuthor {
  const trimmed = email?.trim();
  if (trimmed) {
    return { id: trimmed, name: trimmed };
  }
  if (SESSION_USER.id && SESSION_USER.label) {
    return { id: SESSION_USER.id, name: SESSION_USER.label };
  }
  return { id: "anonymous", name: "自分" };
}

export const MEMBERS: MockMember[] = [];

export const IDEAS: MockIdea[] = [];

export function getIdea(id: string | undefined): MockIdea | undefined {
  if (!id) return undefined;
  return IDEAS.find((idea) => idea.id === id);
}

export function ideasByStage(stage: Stage, ideas: MockIdea[] = IDEAS): MockIdea[] {
  return ideas.filter((idea) => idea.stage === stage);
}

export function allTags(ideas: MockIdea[] = IDEAS): string[] {
  return [...new Set(ideas.flatMap((idea) => idea.tags))].sort();
}

export function filterIdeas(
  ideas: MockIdea[],
  opts: { query: string; stages: Stage[]; tags: string[]; minDays?: number },
): MockIdea[] {
  const query = opts.query.trim().toLowerCase();
  const minDays = opts.minDays && opts.minDays > 0 ? opts.minDays : 0;
  return ideas.filter((idea) => {
    if (query) {
      const haystack = `${idea.title} ${idea.body} ${idea.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (opts.stages.length > 0 && !opts.stages.includes(idea.stage)) return false;
    if (opts.tags.length > 0 && !opts.tags.some((tag) => idea.tags.includes(tag))) return false;
    if (minDays > 0 && idea.agedDays < minDays) return false;
    return true;
  });
}
