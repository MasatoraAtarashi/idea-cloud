import type { Dictionary } from "../i18n/dictionary";

/** AI workbench tabs on idea detail. The thinking column (body + comments) has no tabs. */
export const IDEA_DETAIL_TAB_IDS = ["discuss", "evaluate", "research", "brainstorm"] as const;
export type IdeaDetailTab = (typeof IDEA_DETAIL_TAB_IDS)[number];

export function ideaDetailTabLabel(t: Dictionary, tab: IdeaDetailTab): string {
  return t.idea.tabs[tab];
}

const HASH_TO_TAB: Record<string, IdeaDetailTab> = {
  "": "discuss",
  discuss: "discuss",
  evaluate: "evaluate",
  evaluation: "evaluate",
  research: "research",
  brainstorm: "brainstorm",
  // Older links: past runs now live in each tab, so the old history hash lands on evaluate.
  history: "evaluate",
  overview: "discuss",
  ai: "evaluate",
  comments: "discuss",
};

export function ideaDetailTabFromHash(hash: string): IdeaDetailTab {
  const id = hash.replace(/^#/, "").trim();
  return HASH_TO_TAB[id] ?? "discuss";
}

/** True when the hash names an AI tab explicitly (mobile opens the AI side). */
export function hashTargetsAi(hash: string): boolean {
  const id = hash.replace(/^#/, "").trim();
  return id !== "" && id !== "overview" && id !== "comments" && id in HASH_TO_TAB;
}

export function hashForIdeaDetailTab(tab: IdeaDetailTab): string {
  return tab;
}
