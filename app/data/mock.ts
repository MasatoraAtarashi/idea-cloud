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
  spark: "入れたばかり。まだ触らない。",
  aging: "寝かせている。忘れてよい。",
  ripe: "見返す頃合い。進めるか、捨てる。",
  selected: "リサーチ / プロトタイプの対象。",
  archived: "記録として残す。表には出さない。",
};

export const STAGE_PILL_CLASS: Record<Stage, string> = {
  spark: "border-amber-200 bg-amber-100/90 text-amber-900",
  aging: "border-sky-200 bg-sky-100/90 text-sky-900",
  ripe: "border-violet-200 bg-violet-100/90 text-violet-900",
  selected: "border-emerald-200 bg-emerald-100/90 text-emerald-900",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

export const STAGE_COLUMN_CLASS: Record<Stage, string> = {
  spark: "border-amber-100 bg-amber-50/90",
  aging: "border-sky-100 bg-sky-50/90",
  ripe: "border-violet-100 bg-violet-50/90",
  selected: "border-emerald-100 bg-emerald-50/90",
  archived: "border-slate-200 bg-slate-50",
};

const TAG_PILL_CLASSES = [
  "border-rose-200 bg-rose-100/80 text-rose-900",
  "border-indigo-200 bg-indigo-100/80 text-indigo-900",
  "border-teal-200 bg-teal-100/80 text-teal-900",
  "border-orange-200 bg-orange-100/80 text-orange-900",
  "border-fuchsia-200 bg-fuchsia-100/80 text-fuchsia-900",
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
  agedDays: number;
  relatedIds: string[];
  researchNotes?: string | null;
  researchModel?: string | null;
  researchedAt?: string | null;
}

export interface MockMember {
  name: string;
  email: string;
  role: "owner" | "member";
}

/** Signed-in session placeholder. Do not invent teammate names. */
export const SESSION_USER = {
  label: "ログイン中",
  role: "owner" as const,
};

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
  opts: { query: string; stages: Stage[]; tags: string[] },
): MockIdea[] {
  const query = opts.query.trim().toLowerCase();
  return ideas.filter((idea) => {
    if (query) {
      const haystack = `${idea.title} ${idea.body} ${idea.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (opts.stages.length > 0 && !opts.stages.includes(idea.stage)) return false;
    if (opts.tags.length > 0 && !opts.tags.some((tag) => idea.tags.includes(tag))) return false;
    return true;
  });
}
