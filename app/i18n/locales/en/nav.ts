import type { Dictionary } from "../../dictionary";

export const nav: Dictionary["nav"] = {
  workspace: "Workspace",
  main: "Main",

  items: {
    ideas: "Ideas",
    inspirations: "Inspirations",
    analytics: "Analytics",
    settings: "Settings",
    ideasShort: "List",
    inspirationsShort: "Inspo",
    analyticsShort: "Stats",
  },

  savedViews: "Saved views",
  viewName: "View name",
  saveCurrentFilters: "Save current filters",

  reviewDueSuffix: "due for review",
  reviewDueBody: (days: number) =>
    `Untouched for ${days}+ days. Time to move them on or let them go.`,
  reviewDueAction: "Review",

  search: {
    trigger: "Search ideas",
    label: "Search",
    placeholder: "Search ideas, comments, inspirations, tags",
    hint: "Looks across titles, bodies, comments, inspirations and tags.",
    loading: "Searching…",
    empty: (query: string) => `No matches for “${query}”`,
    moveHint: "↑↓ Move",
    openHint: "⏎ Open",
    create: "New idea",
    createWith: (query: string) => `New idea from “${query}”`,
    tagCount: (count: number) => `${count}`,
    kinds: {
      all: "All",
      idea: "Ideas",
      comment: "Comments",
      inspiration: "Inspo",
      tag: "Tags",
    },
  },
};
