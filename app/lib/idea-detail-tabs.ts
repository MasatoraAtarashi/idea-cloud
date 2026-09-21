export const IDEA_DETAIL_TAB_IDS = ["overview", "research", "ai", "comments"] as const;
export type IdeaDetailTab = (typeof IDEA_DETAIL_TAB_IDS)[number];

export const IDEA_DETAIL_TAB_LABEL: Record<IdeaDetailTab, string> = {
  overview: "概要",
  research: "リサーチ",
  ai: "AI/履歴",
  comments: "コメント",
};

const HASH_TO_TAB: Record<string, IdeaDetailTab> = {
  "": "overview",
  overview: "overview",
  research: "research",
  history: "ai",
  brainstorm: "ai",
  evaluate: "ai",
  comments: "comments",
};

export function ideaDetailTabFromHash(hash: string): IdeaDetailTab {
  const id = hash.replace(/^#/, "").trim();
  return HASH_TO_TAB[id] ?? "overview";
}

export function hashForIdeaDetailTab(tab: IdeaDetailTab): string {
  if (tab === "overview") return "";
  if (tab === "ai") return "history";
  return tab;
}
