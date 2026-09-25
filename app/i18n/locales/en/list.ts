import type { Dictionary } from "../../dictionary";

export const list: Dictionary["list"] = {
  metaTitle: "Ideas — Idea Cloud",
  title: "Ideas",
  count: (n: number) => `${n}`,

  layout: {
    table: "List",
    board: "Board",
  },

  tabsLabel: "Idea filters",
  tab: {
    all: "All",
    "aging-shelf": "Aging",
    candidates: "Due for review",
    tried: "Tried",
  },
  tabShort: {
    all: "All",
    "aging-shelf": "Aging",
    candidates: "Review",
    tried: "Tried",
  },

  clearFilters: "Clear filters",
  filters: "Filter",
  search: "Search",
  sortOrder: "Sort",

  candidateBanner: (n: number) => `${n} due for review`,
  candidateBannerAction: "View",

  column: {
    stage: "Stage",
    idea: "Idea",
    tags: "Tags",
    aiScore: "Score",
    comments: "Notes",
    aged: "Aged",
    updated: "Updated",
  },
  aiScoreFull: "AI score",
  sortByLabel: (label: string) => `Sort by ${label}`,
  filterByLabel: (label: string) => `Filter by ${label}`,

  keyword: "Keyword",
  keywordPlaceholderShort: "Title, body, tags",
  keywordPlaceholder: "Filter by title, body or tag",
  category: "Category",
  allOption: "All",
  noTags: "No tags yet",
  agedDays: "Days aged",
  agedDaysAtLeast: (n: number) => `${n}+ days`,
  agedDaysMin: "Minimum days aged",
  agedDaysMinPlaceholder: "days+",

  groupHint: {
    aging: "Resting. Leave it alone.",
    ripe: "Time to reread. Decide whether to move.",
    spark: "Just caught. Don't polish.",
    selected: "Decided to act on.",
    archived: "Not moving for now.",
  },

  sort: {
    key: {
      updatedAt: "Updated",
      createdAt: "Created",
      stage: "Stage",
      title: "Title",
    },
    asc: " ascending",
    desc: " descending",
  },

  boardEmpty: "Nothing here yet",

  swipe: {
    next: "Next stage",
    archive: "Archive",
    updating: "Saving…",
  },

  meta: {
    aiScore: (score: number) => `AI score ${score}`,
    comments: (n: number) => `${n} notes`,
  },

  savedViews: {
    label: "View",
    fallbackName: "View",
    custom: "Custom",
    allIdeas: "All ideas",
    empty: "No saved views yet",
    delete: "Delete",
    deleteLabel: (name: string) => `Delete ${name}`,
    nameLabel: "View name",
    namePlaceholder: "Save current filters",
    save: "Save view",
    hint: "Keeps stage, tags, days aged and search under a name.",
    errorNameRequired: "Enter a name",
    errorNameTooLong: "That name is too long",
    errorTooMany: "Too many saved views",
    errorNotFound: "Not found",
    errorBadIntent: "Invalid request",
  },

  empty: {
    title: "No ideas yet",
    body: "Keep the rough edges of the first thought. Put it away, let it rest, come back when it has ripened.",
    create: "Create your first idea",
  },

  reviewStatus: {
    none: "Not reviewed",
    hold: "On hold",
    reviewed: "Reviewed",
  },

  date: (y: string, m: string, d: string) => `${y}-${m}-${d}`,

  days: (n: number) => `${n}d`,

  relative: {
    now: "just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    yesterday: "yesterday",
    daysAgo: (n: number) => `${n}d ago`,
    lastWeek: "last week",
    weeksAgo: (n: number) => `${n}w ago`,
  },

  compact: {
    now: "now",
    minutes: (n: number) => `${n}m`,
    hours: (n: number) => `${n}h`,
    days: (n: number) => `${n}d`,
    weeks: (n: number) => `${n}w`,
  },
};
